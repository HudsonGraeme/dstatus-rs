use tauri::{generate_context, generate_handler, State};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use crate::config::{Config};
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

#[derive(Deserialize)]
struct Manifest {
    templates: Vec<String>,
}

#[tauri::command]
async fn load_templates() -> Result<Vec<Template>, String> {
    let manifest_url = "https://template.dstatus.rs/manifest.toml";

    // Fetch the manifest file
    let manifest_content = reqwest::get(manifest_url)
        .await
        .map_err(|e| format!("Failed to download manifest: {}", e))?
        .text()
        .await
        .map_err(|e| format!("Failed to read manifest content: {}", e))?;

    // Parse the manifest
    let manifest: Manifest = toml::from_str(&manifest_content)
        .map_err(|e| format!("Failed to parse manifest: {}", e))?;

    // Fetch each template from the URLs in the manifest
    let mut templates = vec![];
    for pathname in manifest.templates {
        let url = format!("https://template.dstatus.rs/{}.toml", pathname);
        let config = load_config_from_source(url.clone()).await?;
        let name = if config.name.is_empty() {
            pathname
        } else {
            config.name.clone()
        };
        let template = Template {
            name,
            description: config.description.clone(),
            config,
        };
        templates.push(template);
    }

    Ok(templates)
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
async fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[tauri::command]
async fn check_for_updates() -> Result<UpdateInfo, String> {
    let current_version = env!("CARGO_PKG_VERSION");
    let repo_url = "https://api.github.com/repos/HudsonGraeme/dstatus-rs/releases/latest";

    let response = reqwest::get(repo_url)
        .await
        .map_err(|e| format!("Failed to check for updates: {}", e))?;

    let release: GitHubRelease = response.json()
        .await
        .map_err(|e| format!("Failed to parse release data: {}", e))?;

    let latest_version = release.tag_name.strip_prefix('v').unwrap_or(&release.tag_name);
    let has_update = version_compare(current_version, latest_version);

    Ok(UpdateInfo {
        current_version: current_version.to_string(),
        latest_version: latest_version.to_string(),
        has_update,
        download_url: release.html_url,
    })
}

fn version_compare(current: &str, latest: &str) -> bool {
    let current_parts: Vec<u32> = current.split('.').filter_map(|s| s.parse().ok()).collect();
    let latest_parts: Vec<u32> = latest.split('.').filter_map(|s| s.parse().ok()).collect();

    for i in 0..std::cmp::max(current_parts.len(), latest_parts.len()) {
        let current_part = current_parts.get(i).unwrap_or(&0);
        let latest_part = latest_parts.get(i).unwrap_or(&0);

        if latest_part > current_part {
            return true;
        } else if latest_part < current_part {
            return false;
        }
    }
    false
}

#[derive(Serialize, Deserialize)]
struct UpdateInfo {
    current_version: String,
    latest_version: String,
    has_update: bool,
    download_url: String,
}

#[derive(Deserialize)]
struct GitHubRelease {
    tag_name: String,
    html_url: String,
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
            name: "".to_string(),
            description: "".to_string(),
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
            load_config_from_source,
            get_app_version,
            check_for_updates
        ])
        .setup(|_app| Ok(()))
        .run(generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
