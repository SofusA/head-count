use std::sync::Arc;

use crate::{app::AppState, models::CounterRequest, store::store};
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};

pub async fn count_handler(
    State(state): State<Arc<AppState>>,
    Json(input): Json<CounterRequest>,
) -> impl IntoResponse {
    let entry = input.to_entry();

    let entry_res = match entry {
        Ok(res) => res,
        Err(err) => return (StatusCode::BAD_REQUEST, err.to_string()),
    };

    match state.online_database.add_counter_entry(&entry_res).await {
        Ok(res) => (StatusCode::CREATED, res),
        Err(err) => {
            store(&entry_res);
            (StatusCode::BAD_REQUEST, err)
        }
    }
}
