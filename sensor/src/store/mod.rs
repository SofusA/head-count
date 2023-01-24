pub mod retry_upload;

use anyhow::Result;
use std::fs;
use std::path::PathBuf;

use crate::models::count::CountEntry;

pub struct Record {
    pub path: PathBuf,
    pub entry: CountEntry,
}

pub fn store(entry: CountEntry) -> Result<CountEntry> {
    fs::create_dir_all("store")?;

    let mut file_name = "store/".to_string();
    file_name.push_str(&entry.time.to_string());

    fs::write(file_name, entry.to_string()?)?;

    Ok(entry)
}

pub fn read_store() -> Vec<Record> {
    match try_read_store() {
        Ok(res) => res,
        Err(_) => vec![],
    }
}

fn try_read_store() -> Result<Vec<Record>> {
    let mut store: Vec<Record> = Vec::new();

    let records = fs::read_dir("store/")?;

    for record in records {
        let read_record = record?;

        let record_content = fs::read_to_string(read_record.path())?;

        let entry: CountEntry = serde_json::from_str(&record_content)?;

        store.push(Record {
            path: read_record.path(),
            entry,
        });
    }

    Ok(store)
}

pub fn delete_record(path: PathBuf) {
    let _ = fs::remove_file(path);
}

#[cfg(test)]
mod tests {
    use super::*;

    fn get_entry() -> CountEntry {
        CountEntry {
            time: 123,
            door: "test;door".to_owned(),
            location: "test".to_owned(),
            direction_in: 1,
            direction_out: 0,
            nightowl: false,
        }
    }

    #[test]
    fn store_and_read_test() {
        let expected_entry = get_entry();
        store(expected_entry.clone()).unwrap();

        let store = read_store();
        let record = store.into_iter().last().unwrap();

        assert!(expected_entry.time == record.entry.time);

        delete_record(record.path);
        let empty_store = read_store();

        assert!(empty_store.is_empty());
    }
}
