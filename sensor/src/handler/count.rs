use anyhow::{bail, Result};
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use std::sync::Arc;

use crate::{
    app::AppState,
    models::{count::CountEntry, database::Database, request::Request},
    store::store,
};

pub async fn add_count(
    State(state): State<Arc<AppState>>,
    Json(input): Json<Request>,
) -> impl IntoResponse {
    match handle_add_count(&state.online_database, input).await {
        Ok(res) => (StatusCode::CREATED, res),
        Err(err) => (StatusCode::BAD_REQUEST, err.to_string()),
    }
}

async fn handle_online_database(database: &Database, entry: CountEntry) -> Result<CountEntry> {
    let response = database.add_counter_entry(entry).await?;
    Ok(response)
}

async fn handle_add_count(database: &Database, request: Request) -> Result<String> {
    let count = request.to_count()?;
    let count_serialised = count.to_string()?;
    let sensor_name = database.sensor_name.clone();
    let entry = count.to_entry(sensor_name)?;

    match handle_online_database(database, entry.clone()).await {
        Ok(_) => Ok(count_serialised),
        Err(_) => {
            store(entry);
            bail!(count_serialised);
        }
    }
}
