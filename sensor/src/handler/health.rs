use anyhow::Result;
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use std::sync::Arc;

use crate::{
    app::AppState,
    models::{count::CountEntry, database::Database, heartbeat::HeartbeatEntry, request::Request},
};

pub async fn health_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    (
        StatusCode::OK,
        health_status(&state.online_database).await.to_string(),
    )
}

async fn health_status(database: &Database) -> bool {
    (get_health_status(database).await).unwrap_or(false)
}

async fn get_health_status(database: &Database) -> Result<bool> {
    let sensor_entries = database.get_sensor_entries().await?;
    let latest_count_entries = database.get_latest_count_entries().await?;

    Ok(check_sensor_and_latest_count_status(
        latest_count_entries,
        sensor_entries,
    ))
}

fn check_sensor_and_latest_count_status(
    count_entries: Vec<CountEntry>,
    sensor_entries: Vec<HeartbeatEntry>,
) -> bool {
    for sensor_entry in sensor_entries {
        let sensor = sensor_entry.clone().to_heartbeat();

        if !sensor.newer_than_days(1) {
            return false;
        }

        let latest_count = count_entries.iter().find(|&x| x.door == sensor_entry.door);

        if let Some(lc) = latest_count {
            let count = lc.to_count();

            if !count.newer_than_days(4) {
                return false;
            }

            if let Some(error) = sensor.error {
                if error > count.timestamp {
                    return false;
                }
            }
        }
    }

    true
}

pub async fn smoke_handler(Json(input): Json<Request>) -> impl IntoResponse {
    match to_serialised_entry(input) {
        Ok(res) => res,
        Err(err) => err.to_string(),
    }
}

fn to_serialised_entry(request: Request) -> Result<String> {
    let entry = request.to_count()?;
    let serialised = entry.to_string()?;
    Ok(serialised)
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
        ));

        // two sensors with two counts
        assert!(check_sensor_and_latest_count_status(
            vec![count_1.clone(), count_2],
            vec![good_sensor_1.clone(), sensor_2.clone()]
        ));

        // one sensor with bad heartbeat
        assert!(!check_sensor_and_latest_count_status(
            vec![count_1.clone()],
            vec![bad_sensor_1]
        ));

        // one sensor with error
        assert!(!check_sensor_and_latest_count_status(
            vec![count_1.clone()],
            vec![error_sensor_1]
        ));

        // two sensors one without count
        assert!(!check_sensor_and_latest_count_status(
            vec![count_1],
            vec![good_sensor_1, sensor_2]
        ));
    }
}
