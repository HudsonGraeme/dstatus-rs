#!/bin/bash

set -e

# Configuration
INSTALL_DIR="/usr/local/bin"
BINARY_NAME="dstatus"
SOURCE_BINARY="dstatus-rs"

# Check if the source binary exists
if [ ! -f "$SOURCE_BINARY" ]; then
    echo "Error: The source binary '$SOURCE_BINARY' was not found in the current directory."
    echo "Please make sure you are running this script from the same directory as the binary."
    exit 1
fi

# Install the binary
echo "Installing ${SOURCE_BINARY} as ${BINARY_NAME} to ${INSTALL_DIR}"
mv "$SOURCE_BINARY" "${INSTALL_DIR}/${BINARY_NAME}"
chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

echo ""
echo "${BINARY_NAME} installed successfully!"
echo "Now, run 'dstatus configure' to set it up."
