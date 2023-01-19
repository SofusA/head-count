use clap::Parser;
use sensor::{app::app, models::database::Credentials, store::retry_upload::retry_upload};
use std::net::SocketAddr;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(short, long)]
    url: String,

    #[arg(short, long)]
    secret: String,

    #[arg(short, long, default_value_t = false)]
    retry: bool,
}

#[tokio::main]
async fn main() {
    let args: Args = Args::parse();
    let credentials = Credentials {
        url: args.url,
        secret: args.secret,
        count_table: "count".to_string(),
        sensor_table: "sensor".to_string(),
    };

    if args.retry {
        retry_upload(credentials).await;
    } else {
        serve_app(credentials).await;
    }
}

async fn serve_app(credentials: Credentials) {
    let app = app(credentials);
    let addr = SocketAddr::from(([127, 0, 0, 1], 1880));

    println!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
