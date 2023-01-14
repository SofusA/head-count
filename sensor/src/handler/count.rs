use crate::{
    models::{database::get_database, CounterRequest},
    store::store,
};
use axum::{http::StatusCode, response::IntoResponse, Json};

pub async fn count_handler(Json(input): Json<CounterRequest>) -> impl IntoResponse {
    let entry = input.to_entry();
    let database = get_database();

    match database.add_counter_entry(&entry).await {
        Ok(res) => (StatusCode::CREATED, res),
        Err(err) => {
            store(&entry);
            (StatusCode::BAD_REQUEST, err)
        }
    }
}
