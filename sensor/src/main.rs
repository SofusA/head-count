use axum::{routing::post, Router};
use std::net::SocketAddr;

use sensor_lib::handler::count::handler;

#[tokio::main]
async fn main() {
    let app = Router::new().route("/count", post(handler));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    println!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
