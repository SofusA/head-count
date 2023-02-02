use anyhow::Result;
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use std::sync::Arc;

use crate::{
    app::AppState,
    models::{database::Database, request::Request},
};

pub async fn error_handler(
    State(state): State<Arc<AppState>>,
    Json(input): Json<Request>,
) -> impl IntoResponse {
    println!("Recieved: {:?}", input);

    match handle_error(&state.online_database, input).await {
        Ok(res) => {
            println!("Success");
            (StatusCode::CREATED, res)
        }
        Err(err) => {
            println!("Error: {}", err);
            (StatusCode::BAD_REQUEST, err.to_string())
        }
    };
}

async fn handle_error(database: &Database, request: Request) -> Result<String> {
    let entry = request
        .to_error_heartbeat()?
        .to_entry(database.sensor_name.clone())?;

    let entry_serialised = database.upsert_heartbeat(entry).await?.to_string()?;
    Ok(entry_serialised)
}
