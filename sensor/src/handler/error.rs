use crate::models::{database::sensor, CounterRequest};
use axum::{response::IntoResponse, Json};

pub async fn error_handler(Json(input): Json<CounterRequest>) -> impl IntoResponse {
    let entry = input.to_error_sensor_entry();

    sensor(&entry).await;
}
