use clap::Parser;
use sensor::{app::app, store::retry_upload::retry_upload};
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

    if args.retry {
        retry_upload(
            args.url,
            args.secret,
            "count".to_string(),
            "sensor".to_string(),
        )
        .await;
    } else {
        serve_app(args).await;
    }
}

async fn serve_app(args: Args) {
    let app = app(
        args.url,
        args.secret,
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
