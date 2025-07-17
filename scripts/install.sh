#!/bin/bash

set -e

# Configuration
REPO="HudsonGraeme/dstatus-rs"
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="dstatus-rs"

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
    *)          echo "Unsupported architecture"; exit 1;;
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
    ASSET_NAME="${BINARY_NAME}-x86_64-unknown-linux-gnu.tar.gz"
elif [ "$OS_TYPE" == "macos" ]; then
    ASSET_NAME="${BINARY_NAME}-x86_64-apple-darwin.tar.gz"
fi

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST_TAG}/${ASSET_NAME}"

# Download and install
echo "Downloading ${BINARY_NAME} from ${DOWNLOAD_URL}"
curl -L -o "/tmp/${ASSET_NAME}" "$DOWNLOAD_URL"

echo "Installing ${BINARY_NAME} to ${INSTALL_DIR}"
if [[ "$ASSET_NAME" == *.tar.gz ]]; then
    tar -xzf "/tmp/${ASSET_NAME}" -C "/tmp"
    mv "/tmp/${BINARY_NAME}" "${INSTALL_DIR}/${BINARY_NAME}"
else
    unzip -o "/tmp/${ASSET_NAME}" -d "/tmp"
    mv "/tmp/${BINARY_NAME}.exe" "${INSTALL_DIR}/${BINARY_NAME}"
fi

chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

# Clean up
rm "/tmp/${ASSET_NAME}"

echo "${BINARY_NAME} installed successfully."
