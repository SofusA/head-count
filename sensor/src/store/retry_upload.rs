use super::read_store;
use crate::{
    models::database::{get_database, Credentials},
    store::delete_entry,
};

pub async fn retry_upload(credentials: Credentials) {
    let store = read_store();
    let database = get_database(credentials);

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
