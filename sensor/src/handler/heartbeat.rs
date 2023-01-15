use std::sync::Arc;

use crate::{app::AppState, models::SensorEntry};
use axum::{extract::State, response::IntoResponse, Json};

pub async fn heartbeat_handler(
    State(state): State<Arc<AppState>>,
    Json(input): Json<SensorEntry>,
) -> impl IntoResponse {
    state.online_database.add_sensor_entry(&input).await;
}