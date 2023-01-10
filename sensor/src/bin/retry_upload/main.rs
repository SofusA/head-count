use sensor_lib::{
    models::database::add,
    store::{delete_entry, read_store},
};

#[tokio::main]
pub async fn main() {
    let store = read_store();

    for record in store {
        match add(&record.entry).await {
            Ok(_) => {
                println!("Successfully re-tried upload");
                delete_entry(record.path);
            }
            Err(_) => println!("Error"),
        }
    }
}
