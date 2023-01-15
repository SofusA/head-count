use std::sync::Arc;

use crate::{app::AppState, models::CounterRequest, store::store};
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};

pub async fn count_handler(
    State(state): State<Arc<AppState>>,
    Json(input): Json<CounterRequest>,
) -> impl IntoResponse {
    let entry = input.to_entry();

    match state.online_database.add_counter_entry(&entry).await {
        Ok(res) => (StatusCode::CREATED, res),
        Err(err) => {
            store(&entry);
            (StatusCode::BAD_REQUEST, err)
        }
    }
}
