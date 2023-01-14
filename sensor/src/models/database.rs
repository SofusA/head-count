use crate::models::{CounterEntry, SensorEntry};
use crate::{database_secret, database_url};
use postgrest::Postgrest;

pub fn get_database() -> Database {
    Database {
        url: database_url(),
        secret: database_secret(),
        counter_table: "counter".to_string(),
        sensor_table: "sensor".to_string(),
    }
}

pub struct Database {
    url: String,
    secret: String,
    pub counter_table: String,
    pub sensor_table: String,
}

impl Database {
    fn get_client(&self) -> Postgrest {
        Postgrest::new(&self.url).insert_header("apikey", &self.secret)
    }

    pub async fn add_counter_entry(&self, entry: &CounterEntry) -> Result<String, String> {
        let client = self.get_client();

        let serialised_entry = match serde_json::to_string(&entry) {
            Ok(res) => res,
            Err(err) => format!("{:?}", err),
        };

        let response = client
            .from("counter")
            .insert(format!("[{}]", serialised_entry))
            .execute()
            .await;

        match response {
            Ok(status) => Ok(format!("{:?}", status)),
            Err(status) => Err(format!("{:?}", status)),
        }
    }

    pub async fn add_sensor_entry(&self, entry: &SensorEntry) {
        let client = self.get_client();

        let serialised_entry = match serde_json::to_string(&entry) {
            Ok(res) => res,
            Err(err) => format!("{:?}", err),
        };

        client
            .from("sensor")
            .upsert(format!("[{}]", serialised_entry))
            .execute()
            .await
            .expect("Unable to upsert sensor error");
    }
}
