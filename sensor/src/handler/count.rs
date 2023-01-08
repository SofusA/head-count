use crate::models::{database::add, CounterRequest};
use axum::{http::StatusCode, response::IntoResponse, Json};

pub async fn handler(Json(input): Json<CounterRequest>) -> impl IntoResponse {
    let entry = input.to_entry();

    match add(entry).await {
        Ok(_) => return (StatusCode::CREATED, "Jaa".to_string()),
        Err(err) => return (StatusCode::BAD_REQUEST, err),
    }
}
