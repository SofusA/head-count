use super::read_store;
use crate::{models::database::get_database, store::delete_entry};

pub async fn retry_upload(
    database_url: String,
    database_secret: String,
    database_count_table: String,
    database_sensor_table: String,
) {
    let store = read_store();
    let database = get_database(
        database_url,
        database_secret,
        database_count_table,
        database_sensor_table,
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
