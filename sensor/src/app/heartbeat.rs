use crate::{
    models::{
        database::{get_database, Credentials},
        heartbeat::Heartbeat,
    },
    store::retry_upload::retry_upload,
};
use chrono::Local;
use tokio::time::{self, Duration};

pub fn start_heartbeat_and_retry(credentials: Credentials, interval_secs: u64) {
    tokio::spawn(async move {
        handle_heartbeat(credentials, interval_secs).await;
    });
}

#[allow(dead_code)]
async fn handle_heartbeat(credentials: Credentials, interval_secs: u64) {
    let mut interval = time::interval(Duration::from_secs(interval_secs));
    let sensor_name = credentials.sensor_name.clone();
    let database = get_database(credentials);

    loop {
        interval.tick().await;
        let local_time = Local::now();
        let timestamp = local_time.timestamp_millis();

        let heartbeat = Heartbeat {
            heartbeat: Some(timestamp),
            error: None,
        };
        let entry = match heartbeat.to_entry(sensor_name.clone()) {
            Ok(res) => res,
            Err(err) => {
                println!("Error sending heartbeat: {}", err);
                return;
            }
        };

        match database.upsert_heartbeat(entry).await {
            Ok(_) => println!("Heartbeat successfully sent"),
            Err(err) => println!("Error sending heartbeat: {}", err),
        };

        retry_upload(&database).await;
    }
}

#[cfg(test)]
mod tests {
    use crate::models::request::Request;

    use super::*;
    fn get_test_error(time: &str) -> Heartbeat {
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
            \"rule_name\":\"Camera Disconnected\"
         }";

        let request: Request = serde_json::from_str(&request_string).unwrap();

        request.to_error_heartbeat().unwrap()
    }

    #[test]
    fn error_test() {
        let error_heartbeat = get_test_error("2023-01-08T15:11:45+01:00");
        assert_eq!(error_heartbeat.error, Some(1673187105000));
    }
}
