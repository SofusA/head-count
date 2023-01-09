use std::fs;

use crate::models::{database::add, CounterEntry};

pub fn store(entry: &CounterEntry) {
    let mut file_name = "store/".to_string();
    file_name.push_str(&entry.time.to_string());

    fs::write(file_name, entry.serialise()).expect("Error writing file to store");
}

#[tokio::main]
pub async fn main() {
    let records = fs::read_dir("store/").expect("Unable to read file store directory");

    for record in records {
        let read_record = record.expect("Unable to read record from file directory");

        let record_content =
            fs::read_to_string(read_record.path()).expect("Unable to read content of record");

        let entry: CounterEntry =
            serde_json::from_str(&record_content).expect("Unable to deserialise record");

        match add(&entry).await {
            Ok(_) => {
                println!("Successfully re-tried upload");
                fs::remove_file(read_record.path()).expect("Unable to delete file after success")
            }
            Err(_) => println!("Error"),
        }
    }
}
