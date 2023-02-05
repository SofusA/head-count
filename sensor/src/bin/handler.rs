use axum::{routing::get, Router};
use dotenv::dotenv;
use sensor::app::AppState;
use sensor::handler::health::health_handler;
use sensor::models::database::{get_database, Credentials};
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let url = env::var("DATABASE_URL").unwrap();
    let secret = env::var("DATABASE_SECRET").unwrap();

    let credentials = Credentials {
        url,
        secret,
        sensor_name: "Health check".into(),
        sensor_table: "sensor".into(),
        count_table: "counter".into(),
    };

    let shared_state = Arc::new(AppState {
        online_database: get_database(credentials),
    });

    let app = Router::new()
        .route("/api/v1", get(health_handler))
        .with_state(shared_state);

    let port_key = "FUNCTIONS_CUSTOMHANDLER_PORT";
    let port: u16 = match env::var(port_key) {
        Ok(val) => val.parse().expect("Custom Handler port is not a number!"),
        Err(_) => 3000,
    };

    let addr = SocketAddr::from(([127, 0, 0, 1], port));

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
