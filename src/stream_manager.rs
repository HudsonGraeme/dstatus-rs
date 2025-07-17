use crate::connection_state::ConnectionState;
use anyhow::{anyhow, Result};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{Read, Write};
use std::net::Shutdown;
use std::os::unix::net::UnixStream;
use std::path::PathBuf;

use tracing::{debug, error, info, warn};

#[derive(Default)]
pub struct StreamManager {
    state: ConnectionState,
    socket: Option<UnixStream>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(untagged)]
#[allow(dead_code)]
pub enum IncomingMessage {
    Response {
        cmd: String,
        data: serde_json::Value,
        evt: Option<String>,
        nonce: Option<String>,
    },
    Error {
        code: u32,
        message: String,
    },
}

#[derive(Deserialize, Clone, Debug)]
#[allow(dead_code)]
pub struct CommandResponse {
    pub cmd: ActivityCmd,
    pub nonce: Option<String>,
    pub args: Option<serde_json::Value>,
    pub data: serde_json::Value,
    pub evt: Option<ActivityEvent>,
}

#[derive(Deserialize, Clone, Debug)]
#[allow(dead_code)]
pub struct ErrorResponse {
    pub code: DiscordIPCErrorCode,
    pub message: String,
}

#[derive(Deserialize, Copy, Clone, Debug)]
#[allow(dead_code)]
pub enum DiscordIPCErrorCode {
    Critical(u16),
    NonCritical(u16),
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ActivityCmd {
    Dispatch,
    Authorize,
    Subscribe,
    Unsubscribe,
    SetActivity,
    SendActivityJoinInvite,
    CloseActivityJoinRequest,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ActivityEvent {
    ActivityJoin,
    ActivitySpectate,
    ActivityJoinRequest,
    ActivityInvite,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct Activity {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamps: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assets: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub party: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub secrets: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub buttons: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub instance: Option<bool>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct Timestamps {
    pub start: Option<i64>,
    pub end: Option<i64>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct Assets {
    pub large_image: Option<String>,
    pub large_text: Option<String>,
    pub small_image: Option<String>,
    pub small_text: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct Party {
    pub id: Option<String>,
    pub size: Option<[i32; 2]>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct Secrets {
    pub join: Option<String>,
    pub spectate: Option<String>,
    pub match_: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Button {
    pub label: String,
    pub url: String,
}

impl StreamManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn connect(&mut self) -> Result<()> {
        self.connect_with_tmp_dir(std::env::temp_dir())
    }

    fn connect_with_tmp_dir(&mut self, tmp_dir: PathBuf) -> Result<()> {
        let re = Regex::new(r"discord-ipc-\d+").unwrap();

        self.state = ConnectionState::Pending;
        info!("Looking for Discord IPC socket in {:?}", tmp_dir);

        let socket_paths: Vec<PathBuf> = fs::read_dir(tmp_dir)?
            .filter_map(|entry| entry.ok())
            .filter(|entry| {
                entry
                    .file_name()
                    .to_str()
                    .map(|s| re.is_match(s))
                    .unwrap_or(false)
            })
            .map(|entry| entry.path())
            .collect();

        if socket_paths.is_empty() {
            error!("No Discord IPC sockets found. Is Discord running?");
            return Err(anyhow!(
                "No Discord IPC socket found. Make sure Discord is running."
            ));
        }

        info!("Found {} potential Discord IPC sockets", socket_paths.len());

        for socket_path in socket_paths {
            info!("Attempting to connect to socket: {:?}", socket_path);
            match UnixStream::connect(&socket_path) {
                Ok(stream) => {
                    self.socket = Some(stream);
                    self.state = ConnectionState::Connected;
                    info!("Successfully connected to Discord IPC");
                    return Ok(());
                }
                Err(e) => {
                    warn!("Failed to connect to socket {:?}: {}", socket_path, e);
                    continue;
                }
            }
        }

        error!("Failed to connect to any Discord IPC sockets");
        Err(anyhow!("Could not connect to any Discord IPC sockets. Make sure Discord is running and try again."))
    }

    #[allow(dead_code)]
    pub fn disconnect(&mut self) -> Result<()> {
        if self.socket.is_none() {
            return Err(anyhow!("Not connected"));
        }

        self.socket.as_mut().unwrap().flush()?;
        self.socket.as_mut().unwrap().shutdown(Shutdown::Both)?;

        self.socket = None;
        self.state = ConnectionState::Disconnected;
        Ok(())
    }
    pub fn read(&mut self) -> Result<(u32, IncomingMessage)> {
        let socket = self
            .socket
            .as_mut()
            .ok_or_else(|| anyhow!("Not connected"))?;

        let mut header = [0; 8];
        socket.read_exact(&mut header)?;

        let (opcode, length) = unpack(header.to_vec())?;

        let mut data = vec![0u8; length as usize];
        socket.read_exact(&mut data)?;

        let message = serde_json::from_slice::<IncomingMessage>(&data)?;

        debug!("Received IPC message [{}]: {:?}", opcode, message);

        Ok((opcode, message))
    }

    pub fn write<T: ?Sized + serde::Serialize>(&mut self, data: &T, opcode: u8) -> Result<()> {
        let socket = self
            .socket
            .as_mut()
            .ok_or_else(|| anyhow!("Not connected"))?;

        let data_string = serde_json::to_string(data)?;
        debug!("Sending IPC message [{}]: {}", opcode, data_string);

        let mut header = Vec::with_capacity(8);
        header.extend_from_slice(&(opcode as u32).to_le_bytes());
        header.extend_from_slice(&(data_string.len() as u32).to_le_bytes());

        socket.write_all(&header)?;
        socket.write_all(data_string.as_bytes())?;

        Ok(())
    }
}

fn unpack(bytes: Vec<u8>) -> Result<(u32, u32)> {
    if bytes.len() < 8 {
        return Err(anyhow!("Invalid header length"));
    }

    let opcode = u32::from_le_bytes(bytes[0..4].try_into()?);
    let length = u32::from_le_bytes(bytes[4..8].try_into()?);

    Ok((opcode, length))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_connect_success() {
        let tmp_dir = tempdir().unwrap();
        let socket_path = tmp_dir.path().join("discord-ipc-0");
        let _listener = std::os::unix::net::UnixListener::bind(&socket_path).unwrap();

        let mut manager = StreamManager::new();
        assert!(manager.connect_with_tmp_dir(tmp_dir.path().to_path_buf()).is_ok());
    }

    #[test]
    fn test_write_data() {
        let tmp_dir = tempdir().unwrap();
        let socket_path = tmp_dir.path().join("discord-ipc-0");
        let listener = std::os::unix::net::UnixListener::bind(&socket_path).unwrap();

        let mut manager = StreamManager::new();
        manager.connect_with_tmp_dir(tmp_dir.path().to_path_buf()).unwrap();

        let (mut stream, _) = listener.accept().unwrap();

        let data = serde_json::json!({ "hello": "world" });
        manager.write(&data, 1).unwrap();

        let mut header = [0; 8];
        stream.read_exact(&mut header).unwrap();
        let (opcode, len) = unpack(header.to_vec()).unwrap();

        assert_eq!(opcode, 1);

        let mut buffer = vec![0; len as usize];
        stream.read_exact(&mut buffer).unwrap();

        let received_data: serde_json::Value = serde_json::from_slice(&buffer).unwrap();
        assert_eq!(received_data, data);
    }

    #[test]
    fn test_read_data() {
        let tmp_dir = tempdir().unwrap();
        let socket_path = tmp_dir.path().join("discord-ipc-0");
        let listener = std::os::unix::net::UnixListener::bind(&socket_path).unwrap();

        let mut manager = StreamManager::new();
        manager.connect_with_tmp_dir(tmp_dir.path().to_path_buf()).unwrap();

        let (mut stream, _) = listener.accept().unwrap();

        let data = serde_json::json!({
            "cmd": "DISPATCH",
            "evt": "READY",
            "data": { "v": 1, "user": { "id": "123" } },
        });
        let data_string = serde_json::to_string(&data).unwrap();

        let mut header = Vec::new();
        header.extend_from_slice(&1u32.to_le_bytes());
        header.extend_from_slice(&(data_string.len() as u32).to_le_bytes());
        stream.write_all(&header).unwrap();
        stream.write_all(data_string.as_bytes()).unwrap();

        let (opcode, msg) = manager.read().unwrap();

        assert_eq!(opcode, 1);
        if let IncomingMessage::Response { cmd, .. } = msg {
            assert_eq!(cmd, "DISPATCH");
        } else {
            panic!("Expected IncomingMessage::Response");
        }
    }

    #[test]
    fn test_unpack_valid_header() {
        let header = vec![0x01, 0x00, 0x00, 0x00, 0x0A, 0x00, 0x00, 0x00];
        let (opcode, length) = unpack(header).unwrap();
        assert_eq!(opcode, 1);
        assert_eq!(length, 10);
    }

    #[test]
    fn test_unpack_invalid_header() {
        let header = vec![0x01, 0x00, 0x00, 0x00];
        let result = unpack(header);
        assert!(result.is_err());
    }
}
