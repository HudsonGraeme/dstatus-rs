mod connection_state;
mod rich_presence;
mod stream_manager;
mod config;

use clap::{Parser, Subcommand};
use dirs;
use nix::sys::signal::{self, Signal};
use nix::unistd::Pid;
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use crate::config::Config;
use rich_presence::RichPresence;

const PID_FILE: &str = "/tmp/dstatus.pid";

fn get_config_path() -> PathBuf {
    let mut config_path = dirs::home_dir().expect("Failed to find home directory");
    config_path.push(".config");
    config_path.push("dstatus");
    fs::create_dir_all(&config_path).expect("Failed to create config directory");
    config_path.push("configuration.toml");
    config_path
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
    #[command(hide = true)]
    InternalRun,
}

fn main() {
    let args = Args::parse();

    match args.command {
        Commands::On => {
            if let Ok(pid_str) = fs::read_to_string(PID_FILE) {
                eprintln!("Daemon is already running with PID {}", pid_str);
                return;
            }

            let child = Command::new(std::env::current_exe().unwrap())
                .arg("internal-run")
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .expect("Failed to spawn daemon");

            fs::write(PID_FILE, child.id().to_string()).expect("Failed to write PID file");
            println!("Daemon started with PID {}", child.id());
        }
        Commands::Off => {
            if let Ok(pid_str) = fs::read_to_string(PID_FILE) {
                if let Ok(pid_val) = pid_str.trim().parse() {
                    let pid = Pid::from_raw(pid_val);
                    if signal::kill(pid, Signal::SIGTERM).is_ok() {
                        fs::remove_file(PID_FILE).unwrap();
                        println!("Daemon stopped");
                    } else {
                        eprintln!("Failed to stop daemon. It may have already been stopped.");
                        fs::remove_file(PID_FILE).unwrap();
                    }
                } else {
                    eprintln!("Invalid PID file. Removing it.");
                    fs::remove_file(PID_FILE).unwrap();
                }
            } else {
                eprintln!("Daemon is not running");
            }
        }
        Commands::Configure => {
            let config = Config::new();
            config
                .save_to_file(get_config_path().to_str().unwrap())
                .unwrap();
            println!("Configuration saved to {:?}", get_config_path());
        }
        Commands::InternalRun => {
            if let Err(e) = run() {
                eprintln!("Error: {:?}", e);
                fs::remove_file(PID_FILE).unwrap();
                std::process::exit(1);
            }
        }
    }
}

fn run() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(fmt::layer().with_target(true).with_ansi(true))
        .with(EnvFilter::from_default_env())
        .init();

    let config = Config::from_file(get_config_path().to_str().unwrap())?;
    let mut presence = RichPresence::new(config);
    presence.start()?;

    loop {
        presence.set_activity()?;
        std::thread::sleep(std::time::Duration::from_secs(15));
    }
}
