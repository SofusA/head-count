use anyhow::{bail, Result};
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use std::sync::Arc;

use crate::{
    app::AppState,
    models::{database::Database, CounterEntry, CounterRequest},
    store::store,
};

pub async fn add_count(
    State(state): State<Arc<AppState>>,
    Json(input): Json<CounterRequest>,
) -> impl IntoResponse {
    match handle_add_count(&state.online_database, input).await {
        Ok(res) => (StatusCode::CREATED, res),
        Err(err) => (StatusCode::BAD_REQUEST, err.to_string()),
    }
}

async fn handle_online_database(database: &Database, entry: &CounterEntry) -> Result<CounterEntry> {
    let response = database.add_counter_entry(entry).await?;
    Ok(response)
}

async fn handle_add_count(database: &Database, request: CounterRequest) -> Result<String> {
    let entry = request.to_entry()?;
    let entry_serialised = entry.serialise()?;

    match handle_online_database(database, &entry).await {
        Ok(_) => Ok(entry_serialised),
        Err(_) => {
            store(&entry);
            bail!(entry_serialised);
        }
    }
}
