use sensor_lib::{app::app, database_secret, database_url};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let app = app(
        database_url(),
        database_secret(),
        "count".to_string(),
        "sensor".to_string(),
    );
    let addr = SocketAddr::from(([127, 0, 0, 1], 1880));

    println!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
