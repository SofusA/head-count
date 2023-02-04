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

    let heartbeat_status = check_heartbeat(sensor_entries);
    let count_status = check_latest_count_entries(latest_count_entries);

    Ok(heartbeat_status && count_status)
}

fn check_latest_count_entries(count_entries: Vec<CountEntry>) -> bool {
    let mut status = true;
    for count_entry in count_entries {
        let count = count_entry.to_count();

        if !count.newer_than_days(1) {
            status = false;
        }
    }

    status
}

fn check_heartbeat(sensor_entries: Vec<HeartbeatEntry>) -> bool {
    let mut status = true;
    for sensor_entry in sensor_entries {
        let sensor = sensor_entry.to_heartbeat();

        if !sensor.newer_than_days(1) {
            status = false;
        }
    }

    status
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
