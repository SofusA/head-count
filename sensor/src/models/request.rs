use anyhow::Result;
use chrono::{DateTime, FixedOffset, Timelike};
use serde::{Deserialize, Serialize};

use super::{count::Count, get_direction, heartbeat::Heartbeat};

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Request {
    #[serde(rename = "channel_id")]
    pub channel_id: String,
    #[serde(rename = "channel_name")]
    pub channel_name: String,
    #[serde(rename = "event_name")]
    pub event_name: String,
    #[serde(rename = "event_origin")]
    pub event_origin: String,
    #[serde(rename = "event_time")]
    pub event_time: String,
    #[serde(rename = "event_type")]
    pub event_type: String,
    #[serde(rename = "object_id")]
    pub object_id: i64,
    #[serde(rename = "rule_id")]
    pub rule_id: String,
    #[serde(rename = "rule_name")]
    pub rule_name: String,
}

impl Request {
    pub fn to_count(&self) -> Result<Count> {
        let date_time = DateTime::parse_from_rfc3339(&self.event_time)?;
        let enter = get_direction(&self.rule_name)?;

        Ok(Count {
            timestamp: date_time.timestamp_millis(),
            entering: enter,
            nightowl: is_nightowl(date_time),
        })
    }

    pub fn to_error_heartbeat(&self) -> Result<Heartbeat> {
        let date_time = DateTime::parse_from_rfc3339(&self.event_time)?;

        Ok(Heartbeat {
            error: Some(date_time.timestamp_millis()),
            heartbeat: None,
        })
    }
}

fn is_nightowl(event_time: DateTime<FixedOffset>) -> bool {
    event_time.hour() >= 22 || event_time.hour() <= 6
}
