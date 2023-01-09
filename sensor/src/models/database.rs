use crate::models::CounterEntry;
use postgrest::Postgrest;

use crate::{database_secret, database_table_name, database_url};

pub async fn add(entry: &CounterEntry) -> Result<String, String> {
    let client = get_supabase_client();

    let serialised_entry = match serde_json::to_string(&entry) {
        Ok(res) => res,
        Err(err) => format!("{:?}", err),
    };

    let response = client
        .from(database_table_name())
        .insert(format!("[{}]", serialised_entry))
        .execute()
        .await;

    match response {
        Ok(status) => Ok(format!("{:?}", status)),
        Err(status) => Err(format!("{:?}", status)),
    }
}

fn get_supabase_client() -> Postgrest {
    let url = database_url();
    let database_secret = database_secret();
    Postgrest::new(url).insert_header("apikey", database_secret)
}
