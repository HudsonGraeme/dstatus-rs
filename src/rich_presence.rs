use crate::config::Config;
use crate::stream_manager::{Activity, IncomingMessage, StreamManager};
use anyhow::{Context, Result};
use serde::Serialize;
use tracing::{debug, info};
use uuid::Uuid;

#[derive(Serialize, Debug)]
pub struct Hello {
    v: u8,
    client_id: String,
}

#[derive(Serialize, Debug)]
struct SetActivity {
    cmd: &'static str,
    args: SetActivityArgs,
    nonce: String,
}

#[derive(Serialize, Debug)]
struct SetActivityArgs {
    pid: u32,
    activity: Activity,
}

impl Hello {
    fn new<S: Into<String>>(client_id: S) -> Self {
        Self {
            v: 1,
            client_id: client_id.into(),
        }
    }
}

pub struct RichPresence {
    config: Config,
    stream_manager: StreamManager,
}

impl RichPresence {
    pub fn new(config: Config) -> Self {
        Self {
            config,
            stream_manager: StreamManager::new(),
        }
    }

    pub fn update_config(&mut self, config: Config) {
        self.config = config;
    }

    pub fn start(&mut self) -> Result<(), anyhow::Error> {
        info!(
            "Connecting to Discord with client ID: {}",
            self.config.client_id
        );
        self.stream_manager.connect()?;

        let handshake = Hello::new(&self.config.client_id);
        debug!("Sending handshake: {:?}", handshake);
        self.stream_manager.write(&handshake, 0x0)?;

        // Wait for handshake response
        debug!("Waiting for handshake response...");
        let (op, response) = self
            .stream_manager
            .read()
            .context("Failed to read handshake response from Discord")?;

        if op != 1 {
            return Err(anyhow::anyhow!(
                "Expected opcode 1 after handshake, but got {}",
                op
            ));
        }

        if let IncomingMessage::Error { code, message } = response {
            return Err(anyhow::anyhow!(
                "Handshake failed with code {}: {}",
                code,
                message
            ));
        }

        debug!(
            "Received handshake response: op={}, response={:?}",
            op, response
        );

        Ok(())
    }

    pub fn set_activity(&mut self) -> Result<()> {
        let buttons = self.config.buttons.clone();

        let activity = Activity {
            state: Some(self.config.state.clone()),
            details: Some(self.config.details.clone()),
            timestamps: None,
            assets: Some(serde_json::json!({
                "large_image": self.config.large_image.clone(),
                "large_text": self.config.large_text.clone(),
                "small_image": self.config.small_image.clone(),
                "small_text": self.config.small_text.clone()
            })),
            party: Some(serde_json::json!({
                "size": [self.config.party_size, self.config.max_party_size]
            })),
            secrets: None,
            buttons: if buttons.as_ref().map_or(false, |b| !b.is_empty()) {
                buttons
            } else {
                None
            },
            instance: Some(false),
        };

        let nonce = Uuid::new_v4().to_string();
        let payload = SetActivity {
            cmd: "SET_ACTIVITY",
            args: SetActivityArgs {
                pid: std::process::id(),
                activity,
            },
            nonce: nonce.clone(),
        };

        debug!("Sending activity update: {:?}", payload);
        self.stream_manager.write(&payload, 1)?;

        // Wait for activity response
        let (op, response) = self.stream_manager.read()?;
        debug!(
            "Received activity response: op={}, response={:?}",
            op, response
        );

        Ok(())
    }
}
