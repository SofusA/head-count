use dotenv::dotenv;
use sensor::{
    handler::health::get_health_status,
    models::database::{get_database, Credentials},
};
use std::env;

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

    let database = get_database(credentials);

    let health = get_health_status(&database).await.unwrap();

    println!("{health}");
}
