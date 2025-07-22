use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{self};

#[derive(Serialize, Deserialize, Debug, Clone, Hash)]
pub struct Button {
    pub label: String,
    pub url: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default, Hash)]
pub struct Config {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub description: String,
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
    #[serde(default)]
    pub start_timestamp: Option<i64>,
    #[serde(default)]
    pub end_timestamp: Option<i64>,
    #[serde(default)]
    pub party_max: Option<i32>,
    #[serde(default)]
    pub match_secret: Option<String>,
    #[serde(default)]
    pub join_secret: Option<String>,
    #[serde(default)]
    pub spectate_secret: Option<String>,
    #[serde(default)]
    pub instance: Option<bool>,
}

impl Config {
    pub fn save_to_file(&self, path: &str) -> io::Result<()> {
        let toml_string = toml::to_string(self).unwrap();
        fs::write(path, toml_string)
    }

    pub fn from_file(path: &str) -> io::Result<Self> {
        let toml_string = fs::read_to_string(path)?;
        let mut config: Config = toml::from_str(&toml_string).unwrap();

        if let Some(buttons) = &mut config.buttons {
            if buttons.len() > 2 {
                buttons.truncate(2);
            }
        }

        Ok(config)
    }
}
