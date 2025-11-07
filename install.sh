#!/bin/bash

# MC Server Watcher - Installation Script
# Usage: ./install.sh

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║  MC Server Watcher - Installation Script          ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "❌ Please don't run this script as root"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js v16 or higher: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version must be 16 or higher"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check tmux
if ! command -v tmux &> /dev/null; then
    echo "⚠️  tmux is not installed"
    echo "Installing tmux..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y tmux
    elif command -v yum &> /dev/null; then
        sudo yum install -y tmux
    else
        echo "❌ Cannot install tmux automatically"
        echo "Please install tmux manually: https://github.com/tmux/tmux/wiki"
        exit 1
    fi
fi

echo "✅ tmux $(tmux -V) detected"

# Install npm dependencies
echo ""
echo "📦 Installing npm dependencies..."
npm install

# Create .env if not exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 48)
    
    cat > .env << EOF
# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Secret (Generated automatically)
JWT_SECRET=$JWT_SECRET

# Session Configuration
SESSION_DURATION=24h

# Tmux Configuration
TMUX_SOCKET_PATH=/tmp/tmux-server-watcher
EOF
    
    chmod 600 .env
    echo "✅ .env file created with secure JWT secret"
else
    echo "⚠️  .env already exists, skipping..."
fi

# Ensure config directory exists with correct files
if [ ! -f config/users.json ]; then
    echo "[]" > config/users.json
    chmod 600 config/users.json
    echo "✅ Created config/users.json"
fi

# Set proper permissions
chmod 600 config/users.json 2>/dev/null || true
chmod 644 config/terminals.json 2>/dev/null || true

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║  Installation Complete!                            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Configure your terminals:"
echo "   Edit config/terminals.json"
echo ""
echo "2. Create admin user:"
echo "   npm run init"
echo ""
echo "3. Start the server:"
echo "   npm start"
echo ""
echo "4. Access the application:"
echo "   http://localhost:3000"
echo ""
echo "📖 For production deployment, see DEPLOYMENT.md"
echo ""
