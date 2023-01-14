pub mod app;
pub mod handler;
pub mod models;
pub mod store;

use std::env;

pub fn database_secret() -> String {
    env::var("DB_SECRET").expect("Error parsing database secret")
}

pub fn database_url() -> String {
    env::var("DB_URL").expect("Error parsing database url")
}
