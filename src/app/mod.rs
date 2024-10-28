pub mod heartbeat;
use crate::{
    handler::{count::add_count, error::error_handler, health::smoke_handler},
    models::database::{get_database, Credentials, Database},
};
use axum::{routing::post, Router};
use std::sync::Arc;

pub struct AppState {
    pub online_database: Database,
}

pub fn app(credentials: Credentials) -> Router {
    let shared_state = Arc::new(AppState {
        online_database: get_database(credentials),
    });

    Router::new()
        .route("/count", post(add_count))
        .route("/error", post(error_handler))
        .route("/smoke", post(smoke_handler))
        .with_state(shared_state)
}
