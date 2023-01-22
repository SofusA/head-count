use anyhow::Result;
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
}
