use crate::models::CounterRequest;
use axum::{http::StatusCode, response::IntoResponse, Json};

pub async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, "All good")
}

pub async fn smoke_handler(Json(input): Json<CounterRequest>) -> impl IntoResponse {
    let entry = input.to_entry();

    match entry {
        Ok(res) => (StatusCode::OK, res.serialise()),
        Err(err) => (StatusCode::BAD_REQUEST, err.to_string()),
    }
}
