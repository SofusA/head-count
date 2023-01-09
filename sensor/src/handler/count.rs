use crate::{
    models::{database::add, CounterRequest},
    store::store,
};
use axum::{http::StatusCode, response::IntoResponse, Json};

pub async fn handler(Json(input): Json<CounterRequest>) -> impl IntoResponse {
    let entry = input.to_entry();

    match add(&entry).await {
        Ok(res) => (StatusCode::CREATED, res),
        Err(err) => {
            store(&entry);
            (StatusCode::BAD_REQUEST, err)
        }
    }
}
