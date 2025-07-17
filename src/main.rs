mod connection_state;
mod rich_presence;
mod stream_manager;
mod config;
mod tui;

use clap::{Parser, Subcommand};
use dirs;
use nix::sys::signal::{self, Signal};
use nix::unistd::Pid;
use signal_hook::consts::SIGHUP;
use signal_hook::iterator::Signals;
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use crate::config::Config;
use rich_presence::RichPresence;

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
    /// Shows the daemon logs
    Logs,
    #[command(hide = true)]
    InternalRun,
}

fn main() {
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
        Commands::Logs => {
            let log_path = get_log_path();
            if let Ok(logs) = fs::read_to_string(log_path) {
                println!("{}", logs);
            } else {
                println!("No logs found.");
            }
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
