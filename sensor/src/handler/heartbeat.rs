use crate::models::{database::sensor, SensorEntry};
use axum::{response::IntoResponse, Json};

pub async fn heartbeat_handler(Json(input): Json<SensorEntry>) -> impl IntoResponse {
    sensor(&input).await;
}
