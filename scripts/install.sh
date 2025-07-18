#!/bin/bash

set -e

# Configuration
REPO="HudsonGraeme/dstatus-rs"
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="dstatus"

# Detect OS and architecture
OS_TYPE=""
case "$(uname -s)" in
    Linux*)     OS_TYPE=linux;;
    Darwin*)    OS_TYPE=macos;;
    *)          echo "Unsupported OS"; exit 1;;
esac

ARCH_TYPE=""
case "$(uname -m)" in
    x86_64)     ARCH_TYPE=x86_64;;
    arm64)      ARCH_TYPE=aarch64;;
    aarch64)    ARCH_TYPE=aarch64;;
    *)          echo "Unsupported architecture: $(uname -m)"; exit 1;;
esac

# Get the latest release tag
LATEST_TAG=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
if [ -z "$LATEST_TAG" ]; then
    echo "Could not find the latest release."
    exit 1
fi

# Construct the download URL
ASSET_NAME=""
DOWNLOAD_URL=""

if [ "$OS_TYPE" == "linux" ]; then
    ASSET_NAME="dstatus-rs-x86_64-unknown-linux-gnu.tar.gz"
elif [ "$OS_TYPE" == "macos" ]; then
    if [ "$ARCH_TYPE" == "x86_64" ]; then
        ASSET_NAME="dstatus-rs-x86_64-apple-darwin.zip"
    else
        ASSET_NAME="dstatus-rs-aarch64-apple-darwin.zip"
    fi
fi

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/${ASSET_NAME}"

# Download and install
echo "Downloading ${BINARY_NAME} from ${DOWNLOAD_URL}"
curl -L -o "/tmp/${ASSET_NAME}" "$DOWNLOAD_URL"

echo "Installing ${BINARY_NAME}..."
if [[ "$ASSET_NAME" == *.tar.gz ]]; then
    # Linux: Extract binary directly
    tar -xzf "/tmp/${ASSET_NAME}" -C "/tmp"
    mv "/tmp/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
    chmod +x "${INSTALL_DIR}/${BINARY_NAME}"
elif [[ "$ASSET_NAME" == *.zip ]]; then
    # macOS: Install .app bundle and create symlink
    unzip -q "/tmp/${ASSET_NAME}" -d "/tmp"
    if [ -d "/tmp/${BINARY_NAME}.app" ]; then
        # Remove existing installation if it exists
        if [ -d "/Applications/${BINARY_NAME}.app" ]; then
            echo "Removing existing installation..."
            rm -rf "/Applications/${BINARY_NAME}.app"
        fi

        # Install .app bundle to /Applications/
        echo "Installing ${BINARY_NAME}.app to /Applications/"
        mv "/tmp/${BINARY_NAME}.app" "/Applications/"

        # Create symlink in /usr/local/bin/
        echo "Creating symlink in ${INSTALL_DIR}/"
        mkdir -p "${INSTALL_DIR}"
        ln -sf "/Applications/${BINARY_NAME}.app/Contents/MacOS/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
    else
        # Fallback for regular zip file
        mv "/tmp/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
        chmod +x "${INSTALL_DIR}/${BINARY_NAME}"
    fi
fi

# Clean up
rm "/tmp/${ASSET_NAME}"

echo "${BINARY_NAME} installed successfully."
if [ "$OS_TYPE" == "macos" ]; then
    echo "App bundle installed to: /Applications/${BINARY_NAME}.app"
    echo "Command-line access via: ${BINARY_NAME}"
else
    echo "You can now run: ${BINARY_NAME}"
fi

# Install man page
echo "Installing man page..."
if command -v "${BINARY_NAME}" >/dev/null 2>&1; then
    "${BINARY_NAME}" install-man
else
    echo "Warning: Could not install man page automatically. Run 'dstatus install-man' later."
fi
