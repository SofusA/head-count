pub mod handler;
pub mod models;

use std::env;

pub fn database_secret() -> String {
    env::var("DB_SECRET").expect("Error parsing database secret")
}

pub fn database_table_name() -> String {
    env::var("DB_TABLE").expect("Error parsing database table name")
}

pub fn database_url() -> String {
    env::var("DB_URL").expect("Error parsing database url")
}
