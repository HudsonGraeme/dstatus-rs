use tauri::{generate_context, generate_handler, State};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use crate::config::{Config};
use std::path::PathBuf;



#[derive(Serialize, Deserialize, Clone)]
struct Template {
    name: String,
    description: String,
    config: Config,
}

#[derive(Serialize, Deserialize, Clone)]
struct UserTemplate {
    id: String,
    name: String,
    description: String,
    config: Config,
    created_at: String,
    last_used: String,
}

#[derive(Serialize, Clone)]
struct UpdateInfo {
    should_update: bool,
    manifest: Option<UpdateManifest>,
}

#[derive(Serialize, Clone)]
struct UpdateManifest {
    version: String,
}



struct AppState {
    config: Mutex<Config>,
    config_path: Mutex<PathBuf>,
    user_templates: Mutex<Vec<UserTemplate>>,
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

fn calculate_config_hash(config: &Config) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    // Hash the main config fields that matter for template comparison
    config.client_id.hash(&mut hasher);
    config.details.hash(&mut hasher);
    config.state.hash(&mut hasher);
    config.large_image.hash(&mut hasher);
    config.large_text.hash(&mut hasher);
    config.small_image.hash(&mut hasher);
    config.small_text.hash(&mut hasher);
    config.start_timestamp.hash(&mut hasher);
    config.end_timestamp.hash(&mut hasher);
    config.party_size.hash(&mut hasher);
    config.party_max.hash(&mut hasher);
    config.match_secret.hash(&mut hasher);
    config.join_secret.hash(&mut hasher);
    config.spectate_secret.hash(&mut hasher);
    config.instance.hash(&mut hasher);

    format!("{:x}", hasher.finish())
}

#[tauri::command]
async fn get_config_hash(config: Config) -> Result<String, String> {
    Ok(calculate_config_hash(&config))
}

#[tauri::command]
async fn get_user_templates(state: State<'_, AppState>) -> Result<Vec<UserTemplate>, String> {
    let templates = state.user_templates.lock().unwrap();
    Ok(templates.clone())
}

#[tauri::command]
async fn save_user_template(template: UserTemplate, state: State<'_, AppState>) -> Result<(), String> {
    let mut templates = state.user_templates.lock().unwrap();

    // Remove existing template with same ID if it exists
    templates.retain(|t| t.id != template.id);

    // Add the new template
    templates.push(template);

    // Save to disk
    save_user_templates_to_disk(&templates)?;

    Ok(())
}

#[tauri::command]
async fn delete_user_template(template_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut templates = state.user_templates.lock().unwrap();
    templates.retain(|t| t.id != template_id);

    // Save to disk
    save_user_templates_to_disk(&templates)?;

    Ok(())
}

#[tauri::command]
async fn load_user_template(template_id: String, state: State<'_, AppState>) -> Result<Config, String> {
    let config = {
        let mut templates = state.user_templates.lock().unwrap();
        if let Some(template) = templates.iter_mut().find(|t| t.id == template_id) {
            template.last_used = chrono::Utc::now().to_rfc3339();
            template.config.clone()
        } else {
            return Err("Template not found".to_string());
        }
    };

    // Update the main config
    {
        let mut main_config = state.config.lock().unwrap();
        *main_config = config.clone();
    }

    // Save the updated config to file directly
    let file_path = {
        let config_path = state.config_path.lock().unwrap();
        config_path.to_string_lossy().to_string()
    };

    config.save_to_file(&file_path)
        .map_err(|e| format!("Failed to save config: {}", e))?;

    // Send SIGHUP to daemon to reload config
    reload_daemon_config().await?;

    // Save templates to update last_used time
    let templates = state.user_templates.lock().unwrap();
    save_user_templates_to_disk(&templates)?;

    Ok(config)
}

fn save_user_templates_to_disk(templates: &[UserTemplate]) -> Result<(), String> {
    let config_dir = crate::get_config_dir();

    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let templates_file = config_dir.join("user_templates.toml");

    #[derive(Serialize)]
    struct UserTemplatesFile {
        templates: Vec<UserTemplate>,
    }

    let templates_data = UserTemplatesFile {
        templates: templates.to_vec(),
    };

    let toml_string = toml::to_string_pretty(&templates_data)
        .map_err(|e| format!("Failed to serialize templates: {}", e))?;

    std::fs::write(&templates_file, toml_string)
        .map_err(|e| format!("Failed to write templates file: {}", e))?;

    Ok(())
}

fn load_user_templates_from_disk() -> Result<Vec<UserTemplate>, String> {
    let config_dir = crate::get_config_dir();

    let templates_file = config_dir.join("user_templates.toml");

    if !templates_file.exists() {
        return Ok(Vec::new());
    }

    let toml_content = std::fs::read_to_string(&templates_file)
        .map_err(|e| format!("Failed to read templates file: {}", e))?;

    #[derive(Deserialize)]
    struct UserTemplatesFile {
        templates: Vec<UserTemplate>,
    }

    let templates_data: UserTemplatesFile = toml::from_str(&toml_content)
        .map_err(|e| format!("Failed to parse templates file: {}", e))?;

    Ok(templates_data.templates)
}

#[tauri::command]
async fn check_cli_installed() -> Result<bool, String> {
    use std::process::Command;

    // First check if dstatus command exists in PATH
    let which_output = Command::new("which")
        .arg("dstatus")
        .output();

    match which_output {
        Ok(result) if result.status.success() => {
            // If found in PATH, test if it actually works by running --help
            println!("Found dstatus in PATH, testing functionality...");
            let help_output = Command::new("dstatus")
                .arg("--help")
                .output();

            match help_output {
                Ok(help_result) if help_result.status.success() => {
                    let help_str = String::from_utf8_lossy(&help_result.stdout);
                    println!("CLI test successful, help output length: {}", help_str.len());
                    Ok(true)
                }
                Ok(_) => {
                    println!("CLI found but --help failed");
                    Ok(false)
                }
                Err(e) => {
                    println!("CLI found but execution failed: {}", e);
                    Ok(false)
                }
            }
        }
        Ok(_) => {
            println!("dstatus not found in PATH");
            Ok(false)
        }
        Err(e) => {
            println!("Failed to check PATH: {}", e);
            Ok(false)
        }
    }
}

#[tauri::command]
async fn install_cli() -> Result<String, String> {
    install_cli_binary().await
}

async fn install_cli_binary() -> Result<String, String> {
    use std::fs;

    let current_exe = std::env::current_exe()
        .map_err(|e| format!("Failed to get current executable path: {}", e))?;

    let home_dir = dirs::home_dir()
        .ok_or("Failed to get home directory")?;

    let local_bin = home_dir.join(".local").join("bin");

    fs::create_dir_all(&local_bin)
        .map_err(|e| format!("Failed to create ~/.local/bin directory: {}", e))?;

    let cli_target = local_bin.join("dstatus");

    if cli_target.exists() {
        fs::remove_file(&cli_target)
            .map_err(|e| format!("Failed to remove existing CLI: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        use std::os::unix::fs;
        fs::symlink(&current_exe, &cli_target)
            .map_err(|e| format!("Failed to create CLI symlink: {}", e))?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        fs::copy(&current_exe, &cli_target)
            .map_err(|e| format!("Failed to copy CLI binary: {}", e))?;

        let mut perms = fs::metadata(&cli_target)
            .map_err(|e| format!("Failed to get CLI permissions: {}", e))?
            .permissions();

        use std::os::unix::fs::PermissionsExt;
        perms.set_mode(0o755);

        fs::set_permissions(&cli_target, perms)
            .map_err(|e| format!("Failed to set CLI permissions: {}", e))?;
    }

    let path_env = std::env::var("PATH").unwrap_or_default();
    let local_bin_str = local_bin.to_string_lossy();

    if !path_env.split(':').any(|p| p == local_bin_str) {
        return Ok(format!(
            "CLI installed to {}. Please add ~/.local/bin to your PATH:\nexport PATH=\"$HOME/.local/bin:$PATH\"",
            cli_target.display()
        ));
    }

    Ok(format!("CLI installed successfully to {}", cli_target.display()))
}

async fn ensure_cli_available() -> Result<(), String> {
    if !check_cli_installed().await? {
        install_cli_binary().await?;
    }
    Ok(())
}

#[tauri::command]
async fn check_for_updates() -> Result<UpdateInfo, String> {
    #[derive(Deserialize)]
    struct GitHubRelease {
        tag_name: String,
    }

    let client = reqwest::Client::new();
    let response = client
        .get("https://api.github.com/repos/HudsonGraeme/dstatus-rs/releases/latest")
        .header("User-Agent", "dstatus-rs")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch release info: {}", e))?;

    let release: GitHubRelease = response.json().await
        .map_err(|e| format!("Failed to parse release info: {}", e))?;

    let current_version = env!("CARGO_PKG_VERSION");
    let latest_version = release.tag_name.trim_start_matches('v');

    let should_update = version_compare::compare(latest_version, current_version)
        .map(|cmp| cmp == version_compare::Cmp::Gt)
        .unwrap_or(false);

    Ok(UpdateInfo {
        should_update,
        manifest: if should_update {
            Some(UpdateManifest {
                version: latest_version.to_string(),
            })
        } else {
            None
        },
    })
}


pub fn run_gui() -> Result<(), Box<dyn std::error::Error>> {
    // Load or create default config - use same path as CLI
    let config_dir = crate::get_config_dir();
    std::fs::create_dir_all(&config_dir)?;

    let config_file = config_dir.join("configuration.toml");
    let config = if config_file.exists() {
        let content = std::fs::read_to_string(&config_file)?;
        toml::from_str(&content).unwrap_or_else(|_| Config::default())
    } else {
        let default_config = Config::default();
        let toml_content = toml::to_string_pretty(&default_config)?;
        std::fs::write(&config_file, toml_content)?;
        default_config
    };

    // Load user templates from disk
    let user_templates = load_user_templates_from_disk().unwrap_or_else(|_| Vec::new());

    let state = AppState {
        config: Mutex::new(config),
        config_path: Mutex::new(config_file),
        user_templates: Mutex::new(user_templates),
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
            get_user_templates,
            save_user_template,
            delete_user_template,
            load_user_template,
            get_config_hash,
            check_cli_installed,
            install_cli,
            check_for_updates
        ])
        .setup(|_app| {
            tauri::async_runtime::spawn(async {
                let _ = ensure_cli_available().await;
            });
            Ok(())
        })
        .run(generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
