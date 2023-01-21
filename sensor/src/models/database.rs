use std::env;

use crate::models::{CounterEntry, SensorEntry};
use anyhow::{Context, Result};
use dotenv::dotenv;
use postgrest::Postgrest;
use reqwest::Response;

pub fn get_database(credentials: Credentials) -> Database {
    Database {
        client: get_client(credentials.url, credentials.secret),
        count_table: credentials.count_table,
        sensor_table: credentials.sensor_table,
    }
}

pub struct Database {
    client: Postgrest,
    pub count_table: String,
    pub sensor_table: String,
}

fn get_client(url: String, secret: String) -> Postgrest {
    Postgrest::new(url).insert_header("apikey", secret)
}

impl Database {
    pub async fn add_counter_entry(&self, entry: &CounterEntry) -> Result<CounterEntry> {
        let client = &self.client;
        let serialised_entry = entry.serialise()?;

        let entries: Vec<CounterEntry> = client
            .from(&self.count_table)
            .insert(format!("[{}]", serialised_entry))
            .execute()
            .await?
            .json()
            .await?;

        let entry = entries
            .first()
            .context("Unable to parse result from supabase")?
            .to_owned();

        Ok(entry)
    }

    pub async fn delete_count(&self, timestamp_ms: i64) -> Result<Response> {
        let client = &self.client;

        let response = client
            .from(&self.count_table)
            .eq("time", timestamp_ms.to_string())
            .delete()
            .execute()
            .await?;

        Ok(response)
    }

    pub async fn get_count(&self, timestamp_ms: i64) -> Result<CounterEntry> {
        let client = &self.client;

        let entries: Vec<CounterEntry> = client
            .from(&self.count_table)
            .eq("time", timestamp_ms.to_string())
            .select("*")
            .execute()
            .await?
            .json()
            .await?;

        let entry = entries
            .first()
            .context("Unable to parse result from supabase")?
            .to_owned();

        Ok(entry)
    }

    pub async fn upsert_sensor_entry(&self, entry: &SensorEntry) -> Result<SensorEntry> {
        let client = &self.client;

        let serialised_entry = entry.serialise()?;

        let entries: Vec<SensorEntry> = client
            .from(&self.sensor_table)
            .upsert(format!("[{}]", serialised_entry))
            .execute()
            .await?
            .json()
            .await?;

        let entry = entries
            .first()
            .context("Unable to parse result from supabase")?
            .to_owned();

        Ok(entry)
    }

    pub async fn get_sensor_entries(&self) -> Result<Vec<SensorEntry>> {
        let client = &self.client;

        let entries: Vec<SensorEntry> = client
            .from(&self.sensor_table)
            .select("*")
            .execute()
            .await?
            .json()
            .await?;

        Ok(entries)
    }

    pub async fn delete_sensor_entry(&self, door: String) -> Result<Response> {
        let client = &self.client;

        let response = client
            .from(&self.sensor_table)
            .eq("door", door)
            .delete()
            .execute()
            .await?;

        Ok(response)
    }
}

pub struct Credentials {
    pub url: String,
    pub secret: String,
    pub count_table: String,
    pub sensor_table: String,
}

pub fn get_test_credentials() -> Credentials {
    dotenv().ok();
    let url = env::var("DATABASE_URL").unwrap();
    let secret = env::var("DATABASE_SECRET").unwrap();

    Credentials {
        url,
        secret,
        count_table: "counter_test".to_string(),
        sensor_table: "sensor_test".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn database_counter_test() {
        let credentials = get_test_credentials();
        let database = get_database(credentials);

        let timestamp = 1893456000000;

        let entry = CounterEntry {
            time: timestamp,
            door: "test;testing;test".to_string(),
            location: "test".to_string(),
            direction_in: 1,
            direction_out: 0,
            nightowl: false,
        };

        database.add_counter_entry(&entry).await.unwrap();

        let result = database.get_count(timestamp).await.unwrap();

        assert!(result == entry);

        database.delete_count(timestamp).await.unwrap();
    }

    #[tokio::test]
    async fn database_sensor_test() {
        let credentials = get_test_credentials();
        let database = get_database(credentials);

        let timestamp = 1893456000000;

        let entry = SensorEntry {
            door: "test;testing;test".to_string(),
            location: "test".to_string(),
            heartbeat: Some(timestamp),
            error: None,
        };

        database.upsert_sensor_entry(&entry).await.unwrap();

        let result = database.get_sensor_entries().await.unwrap();
        let result_entry = result
            .iter()
            .filter(|x| x.door == entry.door)
            .last()
            .unwrap()
            .to_owned();

        assert!(result_entry == entry);

        database.delete_sensor_entry(entry.door).await.unwrap();
    }

    #[tokio::test]
    async fn database_upsert_sensor_test() {
        let credentials = get_test_credentials();
        let database = get_database(credentials);
        let door = "test;test".to_string();
        let location = "test".to_string();

        let first_entry = SensorEntry {
            door: door.clone(),
            location: location.clone(),
            heartbeat: Some(1893456000000),
            error: None,
        };
        database.upsert_sensor_entry(&first_entry).await.unwrap();

        let second_entry = SensorEntry {
            door: door.clone(),
            location: location.clone(),
            heartbeat: None,
            error: Some(1674328880000),
        };
        database.upsert_sensor_entry(&second_entry).await.unwrap();

        let result = database.get_sensor_entries().await.unwrap();
        let result_entry = result
            .iter()
            .filter(|x| x.door == first_entry.door)
            .last()
            .unwrap()
            .to_owned();

        assert!(result_entry.door == first_entry.door && result_entry.door == second_entry.door);
        assert!(
            result_entry.location == first_entry.location
                && result_entry.location == second_entry.location
        );

        assert_eq!(result_entry.heartbeat, first_entry.heartbeat);
        assert_eq!(result_entry.error, second_entry.error);

        database.delete_sensor_entry(door).await.unwrap();
    }
}
