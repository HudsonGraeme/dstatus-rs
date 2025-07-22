#!/bin/bash

set -e

# Configuration
INSTALL_DIR="$HOME/.local/bin"
BINARY_NAME="dstatus"
SOURCE_BINARY="dstatus-rs"

# Check if the source binary exists
if [ ! -f "$SOURCE_BINARY" ]; then
    echo "Error: The source binary '$SOURCE_BINARY' was not found in the current directory."
    echo "Please make sure you are running this script from the same directory as the binary."
    exit 1
fi

# Create install directory if it doesn't exist
mkdir -p "${INSTALL_DIR}"

# Install the binary
echo "Installing ${SOURCE_BINARY} as ${BINARY_NAME} to ${INSTALL_DIR}"
mv "$SOURCE_BINARY" "${INSTALL_DIR}/${BINARY_NAME}"
chmod +x "${INSTALL_DIR}/${BINARY_NAME}"

echo ""
echo "${BINARY_NAME} installed successfully!"

# Check if ~/.local/bin is in PATH
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo ""
    echo "Note: ~/.local/bin is not in your PATH."
    echo "Add this line to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    echo "After adding it, restart your terminal or run:"
    echo "source ~/.bashrc  # or ~/.zshrc"
    echo ""
fi

echo "Now, run 'dstatus configure' to set it up."

# Install man page
echo "Installing man page..."
if command -v "${BINARY_NAME}" >/dev/null 2>&1 || [ -x "${INSTALL_DIR}/${BINARY_NAME}" ]; then
    if command -v "${BINARY_NAME}" >/dev/null 2>&1; then
        "${BINARY_NAME}" install-man
    else
        "${INSTALL_DIR}/${BINARY_NAME}" install-man
    fi
else
    echo "Warning: Could not install man page automatically. Run 'dstatus install-man' later."
fi
