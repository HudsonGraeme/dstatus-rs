use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{self, Write};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Config {
    pub client_id: String,
    pub details: String,
    pub state: String,
    #[serde(rename = "large_image")]
    pub large_image: String,
    #[serde(rename = "large_text")]
    pub large_text: String,
    #[serde(rename = "small_image")]
    pub small_image: String,
    #[serde(rename = "small_text")]
    pub small_text: String,
    #[serde(rename = "party_size")]
    pub party_size: i32,
    #[serde(rename = "max_party_size")]
    pub max_party_size: i32,
    #[serde(rename = "countdown_start")]
    pub countdown_start: i64,
}

impl Config {
    pub fn new() -> Self {
        let mut client_id = String::new();
        let mut details = String::new();
        let mut state = String::new();

        print!("Enter Discord Client ID: ");
        io::stdout().flush().unwrap();
        io::stdin().read_line(&mut client_id).unwrap();

        print!("Enter details: ");
        io::stdout().flush().unwrap();
        io::stdin().read_line(&mut details).unwrap();

        print!("Enter state: ");
        io::stdout().flush().unwrap();
        io::stdin().read_line(&mut state).unwrap();

        Self {
            client_id: client_id.trim().trim_matches('"').to_string(),
            details: details.trim().trim_matches('"').to_string(),
            state: state.trim().trim_matches('"').to_string(),
            large_image: "default_large".to_string(),
            large_text: "Large Text".to_string(),
            small_image: "default_small".to_string(),
            small_text: "Small Text".to_string(),
            party_size: 1,
            max_party_size: 2,
            countdown_start: 3600,
        }
    }

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
