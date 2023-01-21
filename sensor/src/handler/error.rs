use anyhow::Result;
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use std::sync::Arc;

use crate::{
    app::AppState,
    models::{database::Database, CounterRequest},
};

pub async fn error_handler(
    State(state): State<Arc<AppState>>,
    Json(input): Json<CounterRequest>,
) -> impl IntoResponse {
    match handle_error(&state.online_database, input).await {
        Ok(res) => (StatusCode::CREATED, res),
        Err(err) => (StatusCode::BAD_REQUEST, err.to_string()),
    };
}

async fn handle_error(database: &Database, request: CounterRequest) -> Result<String> {
    let entry = request.to_error_sensor_entry()?;

    let entry_serialised = database.upsert_sensor_entry(&entry).await?.serialise()?;
    Ok(entry_serialised)
}
