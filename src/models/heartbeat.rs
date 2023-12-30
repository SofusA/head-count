use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};

use super::get_location;

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct HeartbeatEntry {
    pub door: String,
    pub location: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub heartbeat: Option<i64>,
}

impl HeartbeatEntry {
    pub fn to_string(&self) -> Result<String> {
        let serialised = serde_json::to_string(self)?;

        Ok(serialised)
    }

    pub fn to_heartbeat(self) -> Heartbeat {
        Heartbeat {
            error: self.error,
            heartbeat: self.heartbeat,
        }
    }
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Heartbeat {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub heartbeat: Option<i64>,
}

impl Heartbeat {
    pub fn to_entry(self, sensor_name: String) -> Result<HeartbeatEntry> {
        let entry = HeartbeatEntry {
            door: sensor_name.clone(),
            location: get_location(sensor_name)?,
            error: self.error,
            heartbeat: self.heartbeat,
        };

        Ok(entry)
    }

    pub fn to_string(&self) -> Result<String> {
        let serialised = serde_json::to_string(self)?;
        Ok(serialised)
    }

    pub fn newer_than_hours(&self, hours: i64) -> bool {
        let now = Utc::now().timestamp_millis();
        match self.heartbeat {
            Some(heartbeat) => heartbeat > now - hours * 3600000,
            None => false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Duration;

    #[test]
    fn is_newer_than_hours_test() {
        let time = Utc::now() - Duration::hours(3);

        let heartbeat = Heartbeat {
            error: None,
            heartbeat: Some(time.timestamp_millis()),
        };

        let heartbeat_with_none = Heartbeat {
            error: None,
            heartbeat: Some(time.timestamp_millis()),
        };

        assert!(!heartbeat.newer_than_hours(1));
        assert!(heartbeat.newer_than_hours(4));
        assert!(!heartbeat_with_none.newer_than_hours(0))
    }
}
