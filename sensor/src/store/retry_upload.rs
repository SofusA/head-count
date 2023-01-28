use super::read_store;
use crate::{models::database::Database, store::delete_record};

pub async fn retry_upload(database: &Database) {
    let store = read_store();

    for record in store {
        match database.add_counter_entry(record.entry).await {
            Ok(_) => {
                delete_record(record.path);
            }
            Err(_) => println!("Error"),
        }
    }
}
