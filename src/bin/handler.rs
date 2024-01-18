use axum::ServiceExt;
use axum::{
    body::{boxed, Full},
    http::{header, StatusCode, Uri},
    response::{IntoResponse, Response},
    routing::{get, Router},
};
use dotenv::dotenv;
use rust_embed::RustEmbed;
use sensor::app::AppState;
use sensor::handler::health::{health_handler, smoke_handler};
use sensor::models::database::{get_database, Credentials};
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;
use tower::layer::Layer;
use tower_http::normalize_path::NormalizePathLayer;

#[derive(RustEmbed)]
#[folder = "dist/static/"]
struct Asset;
pub struct StaticFile<T>(pub T);

impl<T> IntoResponse for StaticFile<T>
where
    T: Into<String>,
{
    fn into_response(self) -> Response {
        let path = self.0.into();

        match Asset::get(path.as_str()) {
            Some(content) => {
                let body = boxed(Full::from(content.data));
                let mime = mime_guess::from_path(path).first_or_octet_stream();
                Response::builder()
                    .header(header::CONTENT_TYPE, mime.as_ref())
                    .body(body)
                    .unwrap()
            }
            None => Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(boxed(Full::from("404")))
                .unwrap(),
        }
    }
}

async fn static_handler(uri: Uri) -> impl IntoResponse {
    let mut path = uri.path().trim_start_matches('/').to_string();

    if path.starts_with("static/") {
        path = path.replace("static/", "");
    }

    StaticFile(path)
}

async fn dashboard_handler() -> impl IntoResponse {
    static_handler("/dashboard.html".parse::<Uri>().unwrap()).await
}

async fn export_handler() -> impl IntoResponse {
    static_handler("/export.html".parse::<Uri>().unwrap()).await
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    let url = env::var("DATABASE_URL").expect("Database url not found");
    let secret = env::var("DATABASE_SECRET").expect("Database secret not found");

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

    let app = NormalizePathLayer::trim_trailing_slash().layer(
        Router::new()
            .route("/:location", get(dashboard_handler))
            .route("/:location/export", get(export_handler))
            .route("/static/*file", get(static_handler))
            .route("/api/health", get(health_handler))
            .route("/api/smoke", get(smoke_handler))
            .with_state(shared_state),
    );

    let addr = SocketAddr::from(([0, 0, 0, 0], 5000));

    println!("listening on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
