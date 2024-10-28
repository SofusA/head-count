use anyhow::{bail, Result};
use axum::{extract::State, http::StatusCode, response::IntoResponse};
use std::sync::Arc;

use crate::{
    app::AppState,
    models::{count::CountEntry, database::Database, heartbeat::HeartbeatEntry},
};

pub async fn health_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match get_health_status(&state.online_database).await {
        Ok(res) => (StatusCode::OK, res),
        Err(err) => (StatusCode::NOT_FOUND, err.to_string()),
    }
}

async fn get_health_status(database: &Database) -> Result<String> {
    let sensor_entries = database.get_sensor_entries().await?;
    let latest_count_entries = database.get_latest_count_entries().await?;

    check_sensor_and_latest_count_status(latest_count_entries, sensor_entries)
}

fn check_sensor_and_latest_count_status(
    count_entries: Vec<CountEntry>,
    sensor_entries: Vec<HeartbeatEntry>,
) -> Result<String> {
    let mut errors: Vec<String> = Vec::new();

    for sensor_entry in sensor_entries {
        let sensor = sensor_entry.clone().to_heartbeat();

        if !sensor.newer_than_hours(2) {
            errors.push(format!("Old heartbeat from {}", sensor_entry.door));
        }

        let latest_count = count_entries.iter().find(|&x| x.door == sensor_entry.door);

        match latest_count {
            Some(lc) => {
                let count = lc.to_count();

                if !count.newer_than_days(4) {
                    errors.push(format!("Latest entry from {} is old", lc.door));
                }

                if let Some(error) = sensor.error {
                    if error > count.timestamp {
                        errors.push(format!("Error from {} is newer than latest count", lc.door));
                    }
                }
            }
            None => errors.push(format!("No count for {}", sensor_entry.door)),
        }
    }

    if !errors.is_empty() {
        bail!(serde_json::to_string(&errors)?);
    }

    Ok("[\"Good\"]".into())
}

pub async fn smoke_handler() -> impl IntoResponse {
    (StatusCode::OK, "Ok")
}

#[cfg(test)]
mod tests {
    use chrono::{Duration, Utc};

    use super::*;

    #[test]
    fn check_sensor_and_latest_count_status_test() {
        let location = "test".to_string();
        let door_1 = "test;door1".to_string();
        let door_2 = "test:door2".to_string();
        let now = Utc::now();

        let count_1 = CountEntry {
            time: (now - Duration::days(1)).timestamp_millis(),
            door: door_1.clone(),
            location: location.clone(),
            direction_in: 1,
            direction_out: 0,
            nightowl: false,
        };

        let count_2 = CountEntry {
            time: (now - Duration::days(1)).timestamp_millis(),
            door: door_2.clone(),
            location: location.clone(),
            direction_in: 1,
            direction_out: 0,
            nightowl: false,
        };

        let good_sensor_1 = HeartbeatEntry {
            door: door_1.clone(),
            location: location.clone(),
            error: None,
            heartbeat: Some(now.timestamp_millis()),
        };

        let bad_sensor_1 = HeartbeatEntry {
            door: door_1.clone(),
            location: location.clone(),
            error: None,
            heartbeat: Some((now - Duration::days(2)).timestamp_millis()),
        };

        let error_sensor_1 = HeartbeatEntry {
            door: door_1,
            location: location.clone(),
            error: Some(now.timestamp_millis()),
            heartbeat: Some(now.timestamp_millis()),
        };

        let sensor_2 = HeartbeatEntry {
            door: door_2,
            location,
            error: None,
            heartbeat: Some(now.timestamp_millis()),
        };

        // one sensor with good heartbeat
        assert!(check_sensor_and_latest_count_status(
            vec![count_1.clone()],
            vec![good_sensor_1.clone()]
        )
        .is_ok());

        // two sensors with two counts
        assert!(check_sensor_and_latest_count_status(
            vec![count_1.clone(), count_2],
            vec![good_sensor_1.clone(), sensor_2.clone()]
        )
        .is_ok());

        // one sensor with bad heartbeat
        assert!(
            check_sensor_and_latest_count_status(vec![count_1.clone()], vec![bad_sensor_1])
                .is_err()
        );

        // one sensor with error
        assert!(
            check_sensor_and_latest_count_status(vec![count_1.clone()], vec![error_sensor_1])
                .is_err()
        );

        // two sensors one without count
        assert!(
            check_sensor_and_latest_count_status(vec![count_1], vec![good_sensor_1, sensor_2])
                .is_err()
        );
    }
}
