use tauri::{generate_context, generate_handler, State};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use crate::config::{Config, Button};
use std::path::PathBuf;



#[derive(Serialize, Deserialize)]
struct Template {
    name: String,
    description: String,
    config: Config,
}

struct AppState {
    config: Mutex<Config>,
    config_path: Mutex<PathBuf>,
}

#[tauri::command]
async fn get_config(state: State<'_, AppState>) -> Result<Config, String> {
    let config = state.config.lock().unwrap();
    Ok(config.clone())
}

#[tauri::command]
async fn save_config(config: Config, state: State<'_, AppState>) -> Result<(), String> {
    {
        let mut app_config = state.config.lock().unwrap();
        *app_config = config.clone();
    }

    // Extract the path and drop the guard before the await
    let file_path = {
        let config_path = state.config_path.lock().unwrap();
        config_path.to_string_lossy().to_string()
    };

    config.save_to_file(&file_path)
        .map_err(|e| format!("Failed to save config: {}", e))?;

    // Send SIGHUP to daemon to reload config (like CLI does)
    reload_daemon_config().await?;

    Ok(())
}

#[tauri::command]
async fn reload_daemon_config() -> Result<(), String> {
    use std::fs;
    use nix::sys::signal::{self, Signal};
    use nix::unistd::Pid;

    let config_dir = crate::get_config_dir();
    let pid_path = config_dir.join("dstatus.pid");

    if let Ok(pid_str) = fs::read_to_string(pid_path) {
        if let Ok(pid_val) = pid_str.trim().parse() {
            let pid = Pid::from_raw(pid_val);
            signal::kill(pid, Signal::SIGHUP)
                .map_err(|e| format!("Failed to reload daemon config: {}", e))?;
        }
    }

    Ok(())
}

#[tauri::command]
async fn load_templates() -> Result<Vec<Template>, String> {
    Ok(vec![
        Template {
            name: "Gaming".to_string(),
            description: "Perfect for gaming sessions".to_string(),
            config: Config {
                client_id: "1234567890".to_string(),
                details: "Playing a game".to_string(),
                state: "In match".to_string(),
                large_image: "game_logo".to_string(),
                large_text: "Game Name".to_string(),
                small_image: "status_icon".to_string(),
                small_text: "Online".to_string(),
                party_size: 1,
                max_party_size: 4,
                buttons: Some(vec![
                    Button {
                        label: "Join Game".to_string(),
                        url: "https://example.com/join".to_string(),
                    }
                ]),
            },
        },
        Template {
            name: "Streaming".to_string(),
            description: "Live streaming setup".to_string(),
            config: Config {
                client_id: "1234567890".to_string(),
                details: "Live on Twitch".to_string(),
                state: "Streaming".to_string(),
                large_image: "streaming_logo".to_string(),
                large_text: "Live Stream".to_string(),
                small_image: "live_icon".to_string(),
                small_text: "Broadcasting".to_string(),
                party_size: 0,
                max_party_size: 0,
                buttons: Some(vec![
                    Button {
                        label: "Watch Stream".to_string(),
                        url: "https://twitch.tv/username".to_string(),
                    },
                    Button {
                        label: "Follow".to_string(),
                        url: "https://twitch.tv/username".to_string(),
                    }
                ]),
            },
        },
    ])
}

#[tauri::command]
async fn preview_config(config: Config) -> Result<String, String> {
    Ok(format!(
        "Discord Rich Presence Preview:\n\
         Details: {}\n\
         State: {}\n\
         Large Image: {} ({})\n\
         Small Image: {} ({})\n\
         Party: {}/{}\n\
         Buttons: {}",
        config.details,
        config.state,
        config.large_image,
        config.large_text,
        config.small_image,
        config.small_text,
        config.party_size,
        config.max_party_size,
        config.buttons.as_ref().map_or(0, |b| b.len())
    ))
}

#[tauri::command]
async fn check_daemon_status() -> Result<bool, String> {
    let config_dir = crate::get_config_dir();
    let pid_path = config_dir.join("dstatus.pid");
    Ok(pid_path.exists())
}

#[tauri::command]
async fn start_daemon() -> Result<(), String> {
    use std::process::Command;

    let _child = Command::new(std::env::current_exe().unwrap())
        .arg("on")
        .spawn()
        .map_err(|e| format!("Failed to start daemon: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn stop_daemon() -> Result<(), String> {
    use std::process::Command;

    let _output = Command::new(std::env::current_exe().unwrap())
        .arg("off")
        .output()
        .map_err(|e| format!("Failed to stop daemon: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn load_config_from_source(source: String) -> Result<Config, String> {
    let toml_content = if source.starts_with("http://") || source.starts_with("https://") {
        reqwest::get(&source)
            .await
            .map_err(|e| format!("Failed to download from '{}': {}", source, e))?
            .text()
            .await
            .map_err(|e| format!("Failed to read response from '{}': {}", source, e))?
    } else {
        tokio::fs::read_to_string(&source)
            .await
            .map_err(|e| format!("Failed to read configuration file '{}': {}", source, e))?
    };

    let mut config: Config = toml::from_str(&toml_content)
        .map_err(|e| format!("Failed to parse TOML from '{}': {}", source, e))?;

    if let Some(buttons) = &mut config.buttons {
        if buttons.len() > 2 {
            buttons.truncate(2);
        }
    }

    Ok(config)
}


pub fn run_gui() -> Result<(), Box<dyn std::error::Error>> {
    let config_dir = crate::get_config_dir();
    let config_file = config_dir.join("configuration.toml");

    let config = Config::from_file(config_file.to_str().unwrap()).unwrap_or_else(|_| {
        Config {
            client_id: "".to_string(),
            details: "".to_string(),
            state: "".to_string(),
            large_image: "".to_string(),
            large_text: "".to_string(),
            small_image: "".to_string(),
            small_text: "".to_string(),
            party_size: 0,
            max_party_size: 0,
            buttons: None,
        }
    });

    let state = AppState {
        config: Mutex::new(config),
        config_path: Mutex::new(config_file),
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(generate_handler![
            get_config,
            save_config,
            load_templates,
            preview_config,
            check_daemon_status,
            start_daemon,
            stop_daemon,
            reload_daemon_config,
            load_config_from_source
        ])
        .setup(|_app| Ok(()))
        .run(generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
