use unqlite::{Cursor, UnQLite, KV};

use crate::models::{database::add, CounterEntry};

pub fn store(entry: CounterEntry) {
    let store = UnQLite::create("store.db");

    store
        .kv_store(entry.time.to_string(), entry.serialise())
        .expect("Unable to store CounterEntry");
}

pub fn try_upload_store() {
    let store = UnQLite::create("store.db");

    let mut entry = store.first();

    loop {
        if entry.is_none() {
            break;
        }

        let record = entry.expect("valid entry");
        let (key, value) = record.key_value();

        let counterEntry: CounterEntry = serde_json::from_str(&value).unwrap();

        add(counterEntry);

        println!("* Go through {:?} --> {:?}", key, value);

        if value.len() > 10 {
            println!("** Delete key {:?} by value length", key);
            entry = record.delete();
        } else {
            entry = record.next();
        }
    }
}
