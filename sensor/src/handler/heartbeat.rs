use crate::models::{database::get_database, SensorEntry};
use axum::{response::IntoResponse, Json};

pub async fn heartbeat_handler(Json(input): Json<SensorEntry>) -> impl IntoResponse {
    let database = get_database();
    database.add_sensor_entry(&input).await;
}
