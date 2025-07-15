#!/bin/bash

# Setup script to make security-review available as /security-review command

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
SECURITY_REVIEW_PATH="$SCRIPT_DIR/security-review"

# Create a symbolic link in /usr/local/bin (might need sudo)
if [ -w "/usr/local/bin" ]; then
    ln -sf "$SECURITY_REVIEW_PATH" /usr/local/bin/security-review
    echo "✅ Security review command installed to /usr/local/bin/security-review"
else
    # Try user's local bin
    mkdir -p ~/bin
    ln -sf "$SECURITY_REVIEW_PATH" ~/bin/security-review
    
    # Add ~/bin to PATH if not already there
    if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
        echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
        echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc 2>/dev/null || true
        echo "✅ Security review command installed to ~/bin/security-review"
        echo "⚠️  Please run: source ~/.bashrc (or restart your terminal)"
    else
        echo "✅ Security review command installed to ~/bin/security-review"
    fi
fi

echo "📝 You can now run security review with: security-review or /security-review"