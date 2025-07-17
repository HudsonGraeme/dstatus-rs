use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{self};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Button {
    pub label: String,
    pub url: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Config {
    pub client_id: String,
    pub details: String,
    pub state: String,
    pub large_image: String,
    pub large_text: String,
    pub small_image: String,
    pub small_text: String,
    pub party_size: i32,
    pub max_party_size: i32,
    pub buttons: Option<Vec<Button>>,
}

impl Config {
    pub fn save_to_file(&self, path: &str) -> io::Result<()> {
        let toml_string = toml::to_string(self).unwrap();
        fs::write(path, toml_string)
    }

    pub fn from_file(path: &str) -> io::Result<Self> {
        let toml_string = fs::read_to_string(path)?;
        let config = toml::from_str(&toml_string).unwrap();
        Ok(config)
    }
}
