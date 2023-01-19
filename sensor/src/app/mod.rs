use std::sync::Arc;

use crate::{
    handler::{
        count::count_handler,
        error::error_handler,
        health::{health_handler, smoke_handler},
        heartbeat::heartbeat_handler,
    },
    models::database::{get_database, Database},
};
use axum::{
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
        .route("/smoke", post(smoke_handler))
        .with_state(shared_state)
}
