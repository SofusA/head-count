use crate::models::{database::get_database, CounterRequest};
use axum::{response::IntoResponse, Json};

pub async fn error_handler(Json(input): Json<CounterRequest>) -> impl IntoResponse {
    let entry = input.to_error_sensor_entry();
    let database = get_database();
    database.add_sensor_entry(&entry).await;
}
