pub mod database;

use chrono::{DateTime, FixedOffset, Timelike};
use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CounterRequest {
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

impl CounterRequest {
    pub fn to_entry(&self) -> CounterEntry {
        let date_time =
            DateTime::parse_from_rfc3339(&self.event_time).expect("Error parsing event time");

        let enter = get_direction(&self.rule_name);

        let direction_in;
        let direction_out;

        match enter {
            true => {
                direction_in = 1;
                direction_out = 0
            }
            false => {
                direction_in = 0;
                direction_out = 1
            }
        }

        CounterEntry {
            time: date_time.timestamp(),
            door: self.channel_name.clone(),
            location: get_location(&self.channel_name),
            direction_in,
            direction_out,
            nightowl: is_nightowl(date_time),
            enter,
        }
    }
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CounterEntry {
    pub time: i64,
    pub door: String,
    pub location: String,
    pub direction_in: i16,
    pub direction_out: i16,
    pub nightowl: bool,
    pub enter: bool,
}

fn get_location(channel_name: &String) -> String {
    channel_name
        .split(";")
        .nth(0)
        .expect("Location not found")
        .to_string()
}

fn get_direction(rule_name: &String) -> bool {
    if rule_name == "Enter" {
        return true;
    }

    if rule_name == "Exit" {
        return false;
    }

    panic!("Invalid rule name in event!")
}

fn is_nightowl(event_time: DateTime<FixedOffset>) -> bool {
    event_time.hour() >= 22 || event_time.hour() <= 6
}

#[cfg(test)]
mod tests {
    use super::*;

    fn get_test_entry(enter: bool, time: &str) -> CounterEntry{
        let rule_name = match enter {
            true => "Enter",
            false => "Exit",
        };

        let request_string = "{  
            \"channel_id\":\"ddbbe807-8560-4bc7-b04b-4b3b04c69339\",
            \"channel_name\":\"test;back;door\",
            \"event_name\":\"Crossed line\",
            \"event_origin\":\"Pedestrian\",
            \"event_time\":\"".to_string() + time + "\",
            \"event_type\":\"TripwireCrossed\",
            \"object_id\":9,
            \"rule_id\":\"471fa55d-967b-46a7-b77f-5b9ce6af82ee\",
            \"rule_name\":\"" + rule_name + "\"
         }";
        
        let request: CounterRequest = serde_json::from_str(&request_string).unwrap();

        request.to_entry()
    }

    #[test]
    fn entry_test() {
        let entry = get_test_entry(true, "2023-01-08T15:11:45+01:00");
        assert_eq!(entry.time, 1673187105);
        assert_eq!(entry.location, "test".to_string());
        assert_eq!(entry.door, "test;back;door".to_string());
        assert_eq!(entry.location, "test".to_string());
        assert_eq!(entry.nightowl, false);
        assert_eq!(entry.enter, true);
        assert_eq!(entry.direction_in, 1);
        assert_eq!(entry.direction_out, 0);
    }

    #[test]
    fn exit_test() {
        let entry = get_test_entry(false, "2023-01-08T15:11:45+01:00");
        assert_eq!(entry.enter, false);
        assert_eq!(entry.direction_in, 0);
        assert_eq!(entry.direction_out, 1);
    }

    #[test]
    fn nigth_owl_test() {
        let early = get_test_entry(true, "2023-01-08T05:11:45+01:00");
        let late = get_test_entry(true, "2023-01-08T22:11:45+01:00");

        assert_eq!(early.nightowl, true);
        assert_eq!(late.nightowl, true);
    }
}
