use axum::{
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};

use crate::handler::{count::count_handler, error::error_handler, heartbeat::heartbeat_handler};

pub fn app() -> Router {
    Router::new()
        .route("/count", post(count_handler))
        .route("/error", post(error_handler))
        .route("/heartbeat", post(heartbeat_handler))
        .route("/health", get(health_handler))
}

async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, "All good")
}
