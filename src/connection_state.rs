#[derive(Debug, PartialEq)]
pub enum ConnectionState {
    Connected,
    Pending,
    Disconnected,
}

impl Default for ConnectionState {
    fn default() -> Self {
        Self::Disconnected
    }
}
