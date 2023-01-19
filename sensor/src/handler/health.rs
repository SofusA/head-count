use crate::models::CounterRequest;
use anyhow::Result;
use axum::{http::StatusCode, response::IntoResponse, Json};

pub async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, "All good")
}

pub async fn smoke_handler(Json(input): Json<CounterRequest>) -> impl IntoResponse {
    match to_serialised_entry(input) {
        Ok(res) => res,
        Err(err) => err.to_string(),
    }
}

fn to_serialised_entry(request: CounterRequest) -> Result<String> {
    let entry = request.to_entry()?;
    let serialised = entry.serialise()?;
    Ok(serialised)
}
