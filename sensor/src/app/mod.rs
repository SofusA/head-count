use std::sync::Arc;

use crate::{
    handler::{count::count_handler, error::error_handler, heartbeat::heartbeat_handler},
    models::database::{get_database, Database},
};
use axum::{
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Router,
};

pub struct AppState {
    pub online_database: Database,
}

pub fn app(
    database_url: String,
    database_secret: String,
    database_count_table: String,
    database_sensor_table: String,
) -> Router {
    let shared_state = Arc::new(AppState {
        online_database: get_database(
            database_url,
            database_secret,
            database_count_table,
            database_sensor_table,
        ),
    });

    Router::new()
        .route("/count", post(count_handler))
        .route("/error", post(error_handler))
        .route("/heartbeat", post(heartbeat_handler))
        .route("/health", get(health_handler))
        .with_state(shared_state)
}

async fn health_handler() -> impl IntoResponse {
    (StatusCode::OK, "All good")
}
