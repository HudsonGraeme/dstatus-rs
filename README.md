<div align="center">

```ruby
██████╗ ███████╗████████╗ █████╗ ████████╗██╗   ██╗███████╗
██╔══██╗██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║   ██║██╔════╝
██║  ██║███████╗   ██║   ███████║   ██║   ██║   ██║███████╗
██║  ██║╚════██║   ██║   ██╔══██║   ██║   ██║   ██║╚════██║
██████╔╝███████║   ██║   ██║  ██║   ██║   ╚██████╔╝███████║
╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝
```

Custom Discord Rich Presence daemon with GUI and TUI configuration

## Install

```bash
curl -sSL https://install.dstatus.rs | bash
```

## Features

**Daemon**: Background service that manages Discord Rich Presence with automatic configuration reloading
**TUI Config**: Terminal-based configuration editor with live preview
**GUI**: Cross-platform desktop application built with Tauri
**Template System**: Load configurations from files or URLs
**Buttons**: Up to 2 custom action buttons with URLs
**Timestamps**: Start/end times with automatic duration display
**Images**: Custom large and small images with hover text
**Party Info**: Show current and maximum party size
**Auto-Update**: Built-in updater and man page installer

## Commands

```bash
dstatus on          # Start daemon
dstatus off         # Stop daemon
dstatus configure   # Open TUI editor
dstatus gui         # Launch GUI app
dstatus load <url>  # Load config from file/URL
dstatus logs        # View daemon logs
dstatus update      # Update to latest version
```

</div>
