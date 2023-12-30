pub mod count;
pub mod database;
pub mod heartbeat;
pub mod request;

use anyhow::{bail, Result};

pub fn get_location(channel_name: String) -> Result<String> {
    match channel_name.split(';').next() {
        Some(res) => Ok(res.to_string()),
        None => bail!("Unable to parse location"),
    }
}

fn get_direction(rule_name: &str) -> Result<bool> {
    if rule_name == "Enter" {
        return Ok(true);
    }

    if rule_name == "Exit" {
        return Ok(false);
    }

    bail!("Invalid rule name in event!")
}
