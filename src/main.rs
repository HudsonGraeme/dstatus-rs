mod connection_state;
mod rich_presence;
mod stream_manager;
mod config;
mod tui;
mod gui;

use clap::{Parser, Subcommand};
use dirs;
use nix::sys::signal::{self, Signal};
use nix::unistd::Pid;
use signal_hook::consts::SIGHUP;
use signal_hook::iterator::Signals;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use crate::config::Config;
use rich_presence::RichPresence;

// Test
const VERSION: &str = env!("CARGO_PKG_VERSION");

fn display_banner() {
    println!("\x1b[35m██████╗ ███████╗████████╗ █████╗ ████████╗██╗   ██╗███████╗");
    println!("██╔══██╗██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║   ██║██╔════╝");
    println!("██║  ██║███████╗   ██║   ███████║   ██║   ██║   ██║███████╗");
    println!("██║  ██║╚════██║   ██║   ██╔══██║   ██║   ██║   ██║╚════██║");
    println!("██████╔╝███████║   ██║   ██║  ██║   ██║   ╚██████╔╝███████║");
    println!("╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝\x1b[0m");
    println!("                    v{}", VERSION);
    println!();
}

fn get_config_dir() -> PathBuf {
    let mut config_path = dirs::home_dir().expect("Failed to find home directory");
    config_path.push(".config");
    config_path.push("dstatus");
    fs::create_dir_all(&config_path).expect("Failed to create config directory");
    config_path
}

fn get_pid_path() -> PathBuf {
    get_config_dir().join("dstatus.pid")
}

fn get_log_path() -> PathBuf {
    get_config_dir().join("dstatus.log")
}

fn install_man_page() {
    let man_content = include_str!("../dstatus.1");

    let mut man_dir = dirs::home_dir().expect("Failed to find home directory");
    man_dir.push(".local");
    man_dir.push("share");
    man_dir.push("man");
    man_dir.push("man1");

    if let Err(e) = fs::create_dir_all(&man_dir) {
        eprintln!("Failed to create man directory: {}", e);
        std::process::exit(1);
    }

    let man_file = man_dir.join("dstatus.1");
    if let Err(e) = fs::write(&man_file, man_content) {
        eprintln!("Failed to write man page: {}", e);
        std::process::exit(1);
    }

    println!("Man page installed to: {}", man_file.display());
    println!("You can now run: man dstatus");

    let manpath = std::env::var("MANPATH").unwrap_or_default();
    let local_man_path = format!("{}/.local/share/man", dirs::home_dir().unwrap().display());

    if !manpath.contains(&local_man_path) {
        println!();
        println!("Note: To ensure 'man dstatus' works, add this to your shell profile:");
        println!("export MANPATH=\"$HOME/.local/share/man:$MANPATH\"");
    }
}

#[derive(Parser)]
struct Args {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Starts the Rich Presence daemon
    On,
    /// Stops the Rich Presence daemon
    Off,
    /// Creates a new configuration file
    Configure,
    /// Launch the graphical user interface
    Gui,
    /// Loads a configuration file from the specified path or URL
    Load {
        /// Path to the configuration.toml file to load or URL to download from
        source: String,
    },
    /// Shows the daemon logs
    Logs,
    /// Updates dstatus to the latest version
    Update,
    /// Installs the man page to user-local directory
    InstallMan,
    #[command(hide = true)]
    InternalRun,
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    // Check if launched from .app bundle (macOS)
    let is_app_bundle = std::env::current_exe()
        .map(|path| path.to_string_lossy().contains(".app/Contents/MacOS/"))
        .unwrap_or(false);

    // Show GUI if:
    // 1. No arguments AND launched from .app bundle, OR
    // 2. Explicitly requested with "gui" command
    if (args.len() == 1 && is_app_bundle) || (args.len() > 1 && args[1] == "gui") {
        main_gui();
    } else {
        main_cli();
    }
}

fn main_gui() {
    if let Err(e) = gui::run_gui() {
        eprintln!("Failed to start GUI: {}", e);
        std::process::exit(1);
    }
}

fn main_cli() {
    display_banner();
    let args = Args::parse();

    match args.command {
        Commands::On => {
            if let Ok(pid_str) = fs::read_to_string(get_pid_path()) {
                eprintln!("Daemon is already running with PID {}", pid_str);
                return;
            }

            let log_file = fs::File::create(get_log_path()).expect("Failed to create log file");
            let stderr = log_file.try_clone().expect("Failed to clone log file handle");

            let child = Command::new(std::env::current_exe().unwrap())
                .arg("internal-run")
                .stdout(log_file)
                .stderr(stderr)
                .envs(std::env::vars())
                .spawn()
                .expect("Failed to spawn daemon");

            fs::write(get_pid_path(), child.id().to_string()).expect("Failed to write PID file");
            println!("Daemon started with PID {}", child.id());
        }
        Commands::Off => {
            if let Ok(pid_str) = fs::read_to_string(get_pid_path()) {
                if let Ok(pid_val) = pid_str.trim().parse() {
                    let pid = Pid::from_raw(pid_val);
                    if signal::kill(pid, Signal::SIGTERM).is_ok() {
                        fs::remove_file(get_pid_path()).unwrap();
                        println!("Daemon stopped");
                    } else {
                        eprintln!("Failed to stop daemon. It may have already been stopped.");
                        fs::remove_file(get_pid_path()).unwrap();
                    }
                } else {
                    eprintln!("Invalid PID file. Removing it.");
                    fs::remove_file(get_pid_path()).unwrap();
                }
            } else {
                eprintln!("Daemon is not running");
            }
        }
        Commands::Configure => {
            let config_file = get_config_dir().join("configuration.toml");
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
                    start_timestamp: None,
                    end_timestamp: None,
                    party_max: None,
                    match_secret: None,
                    join_secret: None,
                    spectate_secret: None,
                    instance: None,
                }
            });
            let updated_config = tui::run_tui(config).unwrap();
            updated_config
                .save_to_file(config_file.to_str().unwrap())
                .unwrap();

            if let Ok(pid_str) = fs::read_to_string(get_pid_path()) {
                if let Ok(pid_val) = pid_str.trim().parse() {
                    let pid = Pid::from_raw(pid_val);
                    let _ = signal::kill(pid, Signal::SIGHUP);
                }
            }

            println!("Configuration saved to {:?}", config_file);
        }
        Commands::Gui => {
            if let Err(e) = gui::run_gui() {
                eprintln!("Failed to start GUI: {}", e);
                std::process::exit(1);
            }
        }
        Commands::Load { source } => {
            let toml_content = if source.starts_with("http://") || source.starts_with("https://") {
                match reqwest::blocking::get(&source) {
                    Ok(response) => {
                        if !response.status().is_success() {
                            eprintln!("Error: Failed to download from '{}': HTTP {}", source, response.status());
                            std::process::exit(1);
                        }
                        match response.text() {
                            Ok(content) => {
                                println!("Downloaded configuration from '{}'", source);
                                content
                            }
                            Err(e) => {
                                eprintln!("Error: Failed to read response from '{}': {}", source, e);
                                std::process::exit(1);
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Error: Failed to download from '{}': {}", source, e);
                        std::process::exit(1);
                    }
                }
            } else {
                let path = std::path::Path::new(&source);
                if !path.exists() {
                    eprintln!("Error: Configuration file '{}' does not exist", source);
                    std::process::exit(1);
                }
                match fs::read_to_string(path) {
                    Ok(content) => content,
                    Err(e) => {
                        eprintln!("Error: Failed to read configuration file '{}': {}", source, e);
                        std::process::exit(1);
                    }
                }
            };

            match toml::from_str::<Config>(&toml_content) {
                Ok(mut config) => {
                    if let Some(buttons) = &mut config.buttons {
                        if buttons.len() > 2 {
                            buttons.truncate(2);
                        }
                    }

                    let config_file = get_config_dir().join("configuration.toml");

                    if let Err(e) = config.save_to_file(config_file.to_str().unwrap()) {
                        eprintln!("Error: Failed to save configuration: {}", e);
                        std::process::exit(1);
                    }

                    if let Ok(pid_str) = fs::read_to_string(get_pid_path()) {
                        if let Ok(pid_val) = pid_str.trim().parse() {
                            let pid = Pid::from_raw(pid_val);
                            let _ = signal::kill(pid, Signal::SIGHUP);
                        }
                    }

                    println!("Configuration loaded from '{}' and saved to {:?}", source, config_file);
                }
                Err(e) => {
                    eprintln!("Error: Failed to parse TOML configuration from '{}': {}", source, e);
                    std::process::exit(1);
                }
            }
        }
        Commands::Logs => {
            let log_path = get_log_path();
            if let Ok(logs) = fs::read_to_string(log_path) {
                println!("{}", logs);
            } else {
                println!("No logs found.");
            }
        }
        Commands::Update => {
            println!("Updating dstatus to the latest version...");

            let install_script_url = "https://raw.githubusercontent.com/HudsonGraeme/dstatus-rs/main/scripts/install.sh";

            let output = Command::new("curl")
                .args(["-sSL", install_script_url])
                .output();

            match output {
                Ok(curl_output) if curl_output.status.success() => {
                    let install_script = String::from_utf8_lossy(&curl_output.stdout);

                    let mut bash_process = Command::new("bash")
                        .stdin(std::process::Stdio::piped())
                        .stdout(std::process::Stdio::piped())
                        .stderr(std::process::Stdio::piped())
                        .spawn()
                        .expect("Failed to start bash process");

                    if let Some(stdin) = bash_process.stdin.as_mut() {
                        stdin.write_all(install_script.as_bytes()).expect("Failed to write to bash stdin");
                    }

                    let install_output = bash_process.wait_with_output().expect("Failed to wait for bash process");

                    if install_output.status.success() {
                        println!("✓ Successfully updated dstatus!");
                        println!("{}", String::from_utf8_lossy(&install_output.stdout));
                    } else {
                        eprintln!("✗ Update failed:");
                        eprintln!("{}", String::from_utf8_lossy(&install_output.stderr));
                        std::process::exit(1);
                    }
                }
                Ok(_) => {
                    eprintln!("✗ Failed to download install script");
                    std::process::exit(1);
                }
                Err(e) => {
                    eprintln!("✗ curl command failed: {}", e);
                    eprintln!("Please make sure curl is installed and try again.");
                    std::process::exit(1);
                }
            }
        }
        Commands::InstallMan => {
            install_man_page();
        }
        Commands::InternalRun => {
            if let Err(e) = run() {
                eprintln!("Error: {:?}", e);
                fs::remove_file(get_pid_path()).unwrap();
                std::process::exit(1);
            }
        }
    }
}

fn run() -> anyhow::Result<()> {
    let mut signals = Signals::new(&[SIGHUP])?;
    let config_file = get_config_dir().join("configuration.toml");

    tracing_subscriber::registry()
        .with(fmt::layer().with_target(true).with_ansi(false))
        .with(EnvFilter::from_default_env())
        .init();

    let mut config = Config::from_file(config_file.to_str().unwrap())?;
    let mut presence = RichPresence::new(config.clone());
    presence.start()?;

    loop {
        for signal in signals.pending() {
            if signal == SIGHUP {
                println!("Reloading configuration...");
                match Config::from_file(config_file.to_str().unwrap()) {
                    Ok(new_config) => {
                        config = new_config;
                        presence.update_config(config.clone());
                    }
                    Err(e) => eprintln!("Failed to reload config: {}", e),
                }
            }
        }

        presence.set_activity()?;
        std::thread::sleep(std::time::Duration::from_secs(15));
    }
}
