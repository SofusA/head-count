use std::fs;
use std::path::PathBuf;

use crate::models::CounterEntry;

pub struct Record {
    pub path: PathBuf,
    pub entry: CounterEntry,
}

pub fn store(entry: &CounterEntry) {
    fs::create_dir_all("store").expect("Unable to create store directory");

    let mut file_name = "store/".to_string();
    file_name.push_str(&entry.time.to_string());

    fs::write(file_name, entry.serialise()).expect("Error writing file to store");
}

pub fn read_store() -> Vec<Record> {
    let mut store: Vec<Record> = Vec::new();

    let records = fs::read_dir("store/").expect("Unable to read file store directory");

    for record in records {
        let read_record = record.expect("Unable to read record from file directory");

        let record_content =
            fs::read_to_string(read_record.path()).expect("Unable to read content of record");

        let entry: CounterEntry =
            serde_json::from_str(&record_content).expect("Unable to deserialise record");

        store.push(Record {
            path: read_record.path(),
            entry,
        });
    }

    store
}

pub fn delete_entry(path: PathBuf) {
    fs::remove_file(path).expect("Unable to delete file after success")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn get_entry() -> CounterEntry {
        CounterEntry {
            time: 123,
            door: "test;door".to_owned(),
            location: "test".to_owned(),
            direction_in: 1,
            direction_out: 0,
            nightowl: false,
            enter: true,
        }
    }

    #[test]
    fn store_and_read_test() {
        let expected_entry = get_entry();
        store(&expected_entry);

        let store = read_store();
        let record = store.into_iter().last().unwrap();

        assert!(expected_entry.time == record.entry.time);

        delete_entry(record.path);
        let empty_store = read_store();

        assert!(empty_store.is_empty());
    }
}