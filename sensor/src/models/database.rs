use crate::models::CounterEntry;
use axum::http::StatusCode;
use postgrest::Postgrest;

use crate::{database_secret, database_table_name, database_url};

pub async fn add(entry: CounterEntry) -> Result<StatusCode, String> {
    let client = get_supabase_client();

    let serialised_entry = serde_json::to_string(&entry).expect("Failed to serialise entry");

    let resp = match client
        .from(database_table_name())
        .insert(format!("[{}]", serialised_entry))
        .execute()
        .await
    {
        Ok(res) => res,
        Err(err) => return Err(format!("Error from Supabase: {}", err)),
    };

    return Ok(resp.status());
}

fn get_supabase_client() -> Postgrest {
    let url = database_url();
    let database_secret = database_secret();
    Postgrest::new(url).insert_header("apikey", database_secret)
}
