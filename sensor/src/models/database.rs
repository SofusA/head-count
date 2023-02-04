use anyhow::{bail, Context, Result};
use postgrest::Postgrest;
use reqwest::Response;

use super::{count::CountEntry, heartbeat::HeartbeatEntry};

pub fn get_database(credentials: Credentials) -> Database {
    Database {
        client: get_client(credentials.url, credentials.secret),
        count_table: credentials.count_table,
        sensor_table: credentials.sensor_table,
        sensor_name: credentials.sensor_name,
    }
}

pub struct Database {
    client: Postgrest,
    pub count_table: String,
    pub sensor_table: String,
    pub sensor_name: String,
}

fn get_client(url: String, secret: String) -> Postgrest {
    Postgrest::new(url)
        .insert_header("apikey", &secret)
        .insert_header("Authorization", format!("Bearer {}", &secret))
}

impl Database {
    pub async fn add_counter_entry(&self, entry: CountEntry) -> Result<CountEntry> {
        let client = &self.client;
        let serialised_entry = entry.to_string()?;

        let result = client
            .from(&self.count_table)
            .insert(format!("[{}]", serialised_entry))
            .execute()
            .await?
            .text()
            .await?;

        let entries: Vec<CountEntry> = match serde_json::from_str(&result) {
            Ok(res) => res,
            Err(err) => {
                bail!(format!(
                    "Error in decoding message: {}, caused by: {}",
                    err, result
                ))
            }
        };

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

    pub async fn get_count(&self, timestamp_ms: i64) -> Result<CountEntry> {
        let client = &self.client;

        let result = client
            .from(&self.count_table)
            .eq("time", timestamp_ms.to_string())
            .select("*")
            .execute()
            .await?
            .text()
            .await?;

        let entries: Vec<CountEntry> = match serde_json::from_str(&result) {
            Ok(res) => res,
            Err(err) => {
                bail!(format!(
                    "Error in decoding message: {}, caused by: {}",
                    err, result
                ))
            }
        };

        let entry = entries
            .first()
            .context(format!(
                "Unable to parse result from supabase: {:?}",
                entries
            ))?
            .to_owned();

        Ok(entry)
    }

    pub async fn upsert_heartbeat(&self, entry: HeartbeatEntry) -> Result<HeartbeatEntry> {
        let client = &self.client;

        let serialised_entry = entry.to_string()?;

        let result = client
            .from(&self.sensor_table)
            .upsert(format!("[{}]", serialised_entry))
            .execute()
            .await?
            .text()
            .await?;

        let entries: Vec<HeartbeatEntry> = match serde_json::from_str(&result) {
            Ok(res) => res,
            Err(err) => {
                bail!(format!(
                    "Error in decoding message: {}, caused by: {}",
                    err, result
                ))
            }
        };

        let entry = entries
            .first()
            .context("Unable to parse result from supabase")?
            .to_owned();

        Ok(entry)
    }

    pub async fn get_sensor_entries(&self) -> Result<Vec<HeartbeatEntry>> {
        let client = &self.client;

        let result = client
            .from(&self.sensor_table)
            .select("*")
            .execute()
            .await?
            .text()
            .await?;

        let entries: Vec<HeartbeatEntry> = match serde_json::from_str(&result) {
            Ok(res) => res,
            Err(err) => {
                bail!(format!(
                    "Error in decoding message: {}, caused by: {}",
                    err, result
                ))
            }
        };

        Ok(entries)
    }

    pub async fn get_latest_count_entries(&self) -> Result<Vec<CountEntry>> {
        let client = &self.client;
        let mut latest_count_entries: Vec<CountEntry> = Vec::new();

        let sensors = self.get_sensor_entries().await?;

        for sensor in sensors {
            let result = client
                .from(&self.count_table)
                .select("*")
                .eq("door", sensor.door)
                .order("time.desc")
                .limit(1)
                .execute()
                .await?
                .text()
                .await?;

            let mut latest_entry: Vec<CountEntry> = match serde_json::from_str(&result) {
                Ok(res) => res,
                Err(err) => {
                    bail!(format!(
                        "Error in decoding message: {}, caused by: {}",
                        err, result
                    ))
                }
            };

            latest_count_entries.append(&mut latest_entry);
        }

        Ok(latest_count_entries)
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

#[derive(Clone)]
pub struct Credentials {
    pub url: String,
    pub secret: String,
    pub count_table: String,
    pub sensor_table: String,
    pub sensor_name: String,
}

#[cfg(test)]
mod tests {
    use chrono::{Duration, Utc};
    use dotenv::dotenv;
    use std::env;

    use super::*;

    fn get_test_credentials() -> Credentials {
        dotenv().ok();
        let url = env::var("DATABASE_URL").unwrap();
        let secret = env::var("DATABASE_SECRET").unwrap();

        Credentials {
            url,
            secret,
            count_table: "counter_test".to_string(),
            sensor_table: "sensor_test".to_string(),
            sensor_name: "test;test_sensor".to_string(),
        }
    }

    #[tokio::test]
    async fn database_lastest_entries_test() {
        let credentials = get_test_credentials();
        let database = get_database(credentials);

        let sensor1 = HeartbeatEntry {
            door: "test;sensor1".to_string(),
            location: "test".to_string(),
            error: None,
            heartbeat: Some(Utc::now().timestamp_millis()),
        };

        let sensor2 = HeartbeatEntry {
            door: "test;sensor2".to_string(),
            location: "test".to_string(),
            error: None,
            heartbeat: Some(Utc::now().timestamp_millis()),
        };

        let count_entry_1 = CountEntry {
            door: "test;sensor2".to_string(),
            location: "test".to_string(),
            time: Utc::now().timestamp_millis(),
            nightowl: false,
            direction_in: 1,
            direction_out: 0,
        };

        let days_ago = Utc::now() - Duration::days(1);

        let count_entry_2_1 = CountEntry {
            door: "test;sensor2".to_string(),
            location: "test".to_string(),
            time: days_ago.timestamp_millis(),
            nightowl: false,
            direction_in: 1,
            direction_out: 0,
        };

        let count_entry_2_2 = CountEntry {
            door: "test;sensor2".to_string(),
            location: "test".to_string(),
            time: Utc::now().timestamp_millis(),
            nightowl: false,
            direction_in: 1,
            direction_out: 0,
        };

        database.upsert_heartbeat(sensor1).await.unwrap();
        database.upsert_heartbeat(sensor2).await.unwrap();

        database
            .add_counter_entry(count_entry_1.clone())
            .await
            .unwrap();
        database
            .add_counter_entry(count_entry_2_1.clone())
            .await
            .unwrap();
        database
            .add_counter_entry(count_entry_2_2.clone())
            .await
            .unwrap();

        let latest_entries = database.get_latest_count_entries().await.unwrap();

        assert!(latest_entries.contains(&count_entry_1));
        assert!(!latest_entries.contains(&count_entry_2_1));
        assert!(latest_entries.contains(&count_entry_2_2));
    }

    #[tokio::test]
    async fn database_counter_test() {
        let credentials = get_test_credentials();
        let database = get_database(credentials);
        let now = Utc::now();

        let expected_entry = CountEntry {
            time: now.timestamp_millis(),
            door: "test;testing".to_string(),
            location: "test".to_string(),
            direction_in: 1,
            direction_out: 0,
            nightowl: true,
        };

        database
            .add_counter_entry(expected_entry.clone())
            .await
            .unwrap();

        let result = database.get_count(expected_entry.time).await.unwrap();
        assert!(result == expected_entry);

        database.delete_count(expected_entry.time).await.unwrap();
    }

    #[tokio::test]
    async fn database_sensor_test() {
        let credentials = get_test_credentials();
        let database = get_database(credentials);
        let now = Utc::now();

        let entry = HeartbeatEntry {
            door: "test:testing".to_string(),
            location: "test".to_string(),
            error: Some(now.timestamp_millis()),
            heartbeat: Some(now.timestamp_millis()),
        };

        database.upsert_heartbeat(entry.clone()).await.unwrap();

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
        let door = "test;testing".to_string();
        let location = "test".to_string();

        let now = Utc::now();

        let first_entry = HeartbeatEntry {
            door: door.clone(),
            location: location.clone(),
            heartbeat: Some(now.timestamp_millis()),
            error: None,
        };
        database
            .upsert_heartbeat(first_entry.clone())
            .await
            .unwrap();

        let second_entry = HeartbeatEntry {
            door: door.clone(),
            location: location.clone(),
            heartbeat: None,
            error: Some(now.timestamp_millis() + 1000),
        };
        database
            .upsert_heartbeat(second_entry.clone())
            .await
            .unwrap();

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
