use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};

use super::get_location;

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CountEntry {
    pub time: i64,
    pub door: String,
    pub location: String,
    pub direction_in: i16,
    pub direction_out: i16,
    pub nightowl: bool,
}

impl CountEntry {
    pub fn to_string(&self) -> Result<String> {
        let serialised = serde_json::to_string(self)?;
        Ok(serialised)
    }

    pub fn to_count(&self) -> Count {
        Count {
            timestamp: self.time,
            entering: self.direction_in == 1,
            nightowl: self.nightowl,
        }
    }
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Count {
    pub timestamp: i64,
    pub entering: bool,
    pub nightowl: bool,
}

impl Count {
    pub fn to_entry(&self, sensor_name: String) -> Result<CountEntry> {
        let entry = CountEntry {
            time: self.timestamp,
            door: sensor_name.clone(),
            location: get_location(sensor_name)?,
            direction_in: i16::from(self.entering),
            direction_out: i16::from(!self.entering),
            nightowl: self.nightowl,
        };

        Ok(entry)
    }

    pub fn to_string(&self) -> Result<String> {
        Ok(serde_json::to_string(self)?)
    }

    pub fn newer_than_days(&self, days: i64) -> bool {
        let now = Utc::now().timestamp_millis();

        self.timestamp > now - days * 86400000
    }
}

#[cfg(test)]
mod tests {
    use chrono::Duration;

    use super::*;
    use crate::models::request::Request;

    fn get_test_count(enter: bool, time: &str) -> Count {
        let rule_name = match enter {
            true => "Enter",
            false => "Exit",
        };

        let request_string = "{  
            \"channel_id\":\"ddbbe807-8560-4bc7-b04b-4b3b04c69339\",
            \"channel_name\":\"test;back;door\",
            \"event_name\":\"Crossed line\",
            \"event_origin\":\"Pedestrian\",
            \"event_time\":\""
            .to_string()
            + time
            + "\",
            \"event_type\":\"TripwireCrossed\",
            \"object_id\":9,
            \"rule_id\":\"471fa55d-967b-46a7-b77f-5b9ce6af82ee\",
            \"rule_name\":\""
            + rule_name
            + "\"
         }";

        let request: Request = serde_json::from_str(&request_string).unwrap();

        request.to_count().unwrap()
    }

    #[test]
    fn entry_test() {
        let entering = true;
        let count = get_test_count(entering, "2023-01-08T15:11:45+01:00");
        assert_eq!(count.timestamp, 1673187105000);
        assert_eq!(count.entering, entering);
    }

    #[test]
    fn nigth_owl_test() {
        let early = get_test_count(true, "2023-01-08T05:11:45+01:00");
        let late = get_test_count(false, "2023-01-08T22:11:45+01:00");

        assert!(early.nightowl);
        assert!(late.nightowl);
    }

    #[test]
    fn is_newer_than_days_test() {
        let time = Utc::now() - Duration::days(3);
        let count = get_test_count(true, &time.to_rfc3339());

        assert!(!count.newer_than_days(1));
        assert!(count.newer_than_days(4));
    }
}
