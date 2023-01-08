use crate::models::{CounterRequest, database::add};
use axum::{http::StatusCode, response::IntoResponse, Json};

pub async fn handler(Json(input): Json<CounterRequest>) -> impl IntoResponse {

    match add(input).await {
        Ok(_) => {
            return (StatusCode::CREATED, "Jaa".to_string())
        },
        Err(err) => {
            return (StatusCode::BAD_REQUEST, err)
        }
    }
}
