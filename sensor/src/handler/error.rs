use std::sync::Arc;

use crate::{app::AppState, models::CounterRequest};
use axum::{extract::State, response::IntoResponse, Json};

pub async fn error_handler(
    State(state): State<Arc<AppState>>,
    Json(input): Json<CounterRequest>,
) -> impl IntoResponse {
    let entry = input.to_error_sensor_entry();
    state.online_database.add_sensor_entry(&entry).await;
}
