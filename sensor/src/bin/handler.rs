use anyhow::Result;
use axum::extract::Path;
use axum::http::{self, Response};
use axum::response::{Html, IntoResponse};
use axum::routing::get;
use axum::Router;
use dotenv::dotenv;
use sensor::app::AppState;
use sensor::handler::health::health_handler;
use sensor::models::database::{get_database, Credentials};
use std::net::SocketAddr;
use std::sync::Arc;
use std::{env, fs};

async fn dashboard_handler() -> impl IntoResponse {
    let file_content = fs::read_to_string("dist/static/dashboard.html").unwrap();
    Html(file_content)
}

fn create_file_response(path: &str) -> Result<Response<String>> {
    let content = fs::read_to_string("dist/static/".to_string() + path)?;
    let file_ending = path.split('.').last().unwrap_or("unknown");

    let mimetype = match file_ending {
        "css" => "text/css",
        "js" => "text/javascript",
        _ => "text/plain",
    };

    let response = Response::builder()
        .status(http::StatusCode::OK)
        .header("Content-Type", mimetype)
        .body(content)?;

    Ok(response)
}

async fn static_handler(Path(path): Path<String>) -> impl IntoResponse {
    match create_file_response(&path) {
        Ok(res) => res,
        Err(err) => Response::builder()
            .status(http::StatusCode::BAD_REQUEST)
            .body(err.to_string())
            .expect("Error creating error message"),
    }
}

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
        .route("/api/health", get(health_handler))
        .route("/api/client/:location", get(dashboard_handler))
        .route("/api/client/static/:file", get(static_handler))
        .with_state(shared_state);

    let port_key = "FUNCTIONS_CUSTOMHANDLER_PORT";
    let port: u16 = match env::var(port_key) {
        Ok(val) => val.parse().expect("Custom Handler port is not a number!"),
        Err(_) => 3000,
    };

    let addr = SocketAddr::from(([127, 0, 0, 1], port));

    println!("listening on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
