use crate::models::{CounterEntry, SensorEntry};
use anyhow::{bail, Result};
use dotenv_codegen::dotenv;
use postgrest::Postgrest;
use reqwest::{Error, Response};

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

        let entry: CounterEntry = match client
            .from(&self.count_table)
            .insert(format!("[{}]", serialised_entry))
            .execute()
            .await?
            .json()
            .await
        {
            Ok(res) => res,
            Err(err) => bail!(err),
        };

        Ok(entry)
    }

    pub async fn delete_count(&self, timestamp_ms: i64) -> Result<Response, Error> {
        let client = &self.client;

        client
            .from(&self.count_table)
            .eq("time", timestamp_ms.to_string())
            .delete()
            .execute()
            .await
    }

    pub async fn get_count(&self, timestamp_ms: i64) -> Result<CounterEntry, Error> {
        let client = &self.client;

        let entry: CounterEntry = match client
            .from(&self.count_table)
            .eq("time", timestamp_ms.to_string())
            .select("*")
            .execute()
            .await?
            .json()
            .await
        {
            Ok(res) => res,
            Err(err) => return Err(err),
        };

        Ok(entry)
    }

    pub async fn add_sensor_entry(&self, entry: &SensorEntry) -> Result<SensorEntry, Error> {
        let client = &self.client;

        let serialised_entry = match serde_json::to_string(&entry) {
            Ok(res) => res,
            Err(err) => format!("{:?}", err),
        };

        let entry: SensorEntry = match client
            .from(&self.sensor_table)
            .upsert(format!("[{}]", serialised_entry))
            .execute()
            .await?
            .json()
            .await
        {
            Ok(res) => res,
            Err(err) => return Err(err),
        };

        Ok(entry)
    }

    pub async fn get_sensor_entries(&self) -> Result<Vec<SensorEntry>, Error> {
        let client = &self.client;

        let entries: Vec<SensorEntry> = match client
            .from(&self.sensor_table)
            .select("*")
            .execute()
            .await?
            .json()
            .await
        {
            Ok(res) => res,
            Err(err) => return Err(err),
        };

        Ok(entries)
    }

    pub async fn delete_sensor_entry(&self, door: String) -> Result<Response, Error> {
        let client = &self.client;

        client
            .from(&self.sensor_table)
            .eq("door", door)
            .delete()
            .execute()
            .await
    }
}

pub struct Credentials {
    pub url: String,
    pub secret: String,
    pub count_table: String,
    pub sensor_table: String,
}

pub fn get_credentials() -> Credentials {
    let url = dotenv!("DATABASE_URL").to_string();
    let secret = dotenv!("DATABASE_SECRET").to_string();

    Credentials {
        url,
        secret,
        count_table: "count_test".to_string(),
        sensor_table: "sensor_test".to_string(),
    }
}

#[cfg(test)]
mod tests {
    #[tokio::test]
    async fn database_counter_test() {}
}
