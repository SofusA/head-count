use sensor_lib::{
    database_secret, database_url,
    models::database::get_database,
    store::{delete_entry, read_store},
};

#[tokio::main]
pub async fn main() {
    let store = read_store();
    let database = get_database(
        database_url(),
        database_secret(),
        "count".to_string(),
        "sensor".to_string(),
    );

    for record in store {
        match database.add_counter_entry(&record.entry).await {
            Ok(_) => {
                println!("Successfully re-tried upload");
                delete_entry(record.path);
            }
            Err(_) => println!("Error"),
        }
    }
}
