use anyhow::Result;
use axum::{http::StatusCode, response::IntoResponse, Json};

use crate::models::request::Request;

pub async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, "All good")
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
