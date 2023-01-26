use clap::Parser;
use sensor::{
    app::{app, heartbeat::start_heartbeat_and_retry},
    models::database::Credentials,
};
use std::net::SocketAddr;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(short, long)]
    url: String,

    #[arg(short, long)]
    secret: String,

    #[arg(short, long)]
    name: String,
}

#[tokio::main]
async fn main() {
    let args: Args = Args::parse();
    let credentials = Credentials {
        url: args.url,
        secret: args.secret,
        count_table: "counter".to_string(),
        sensor_table: "sensor".to_string(),
        sensor_name: args.name,
    };

    serve_app(credentials.clone()).await;
    start_heartbeat_and_retry(credentials, 60 * 60);
}

async fn serve_app(credentials: Credentials) {
    let app = app(credentials);
    let addr = SocketAddr::from(([127, 0, 0, 1], 4200));

    match axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
    {
        Ok(_) => println!("listening on {}", addr),
        Err(err) => panic!("Unable to start server: {}", err),
    }
}
