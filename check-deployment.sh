#!/bin/bash

# Pre-deployment Check Script
# Vérifie que tout est prêt pour le déploiement

echo "╔════════════════════════════════════════════════════╗"
echo "║  Pre-Deployment Verification                       ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1 exists"
    else
        echo "❌ $1 NOT FOUND"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1 exists"
    else
        echo "❌ $1 NOT FOUND"
        ERRORS=$((ERRORS + 1))
    fi
}

# Check required files
echo "📁 Checking required files..."
check_file "package.json"
check_file "server/index.js"
check_file "server/auth.js"
check_file "server/user-manager.js"
check_file "server/tmux-manager.js"
check_file "config/terminals.json"
echo ""

# Check directories
echo "📂 Checking directories..."
check_dir "server"
check_dir "public"
check_dir "config"
echo ""

# Check .env file
echo "🔐 Checking .env configuration..."
if [ ! -f .env ]; then
    echo "❌ .env file NOT FOUND"
    echo "   Create it from .env.example"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ .env file exists"
    
    # Check JWT_SECRET
    JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d '=' -f2)
    if [ -z "$JWT_SECRET" ]; then
        echo "❌ JWT_SECRET not set in .env"
        ERRORS=$((ERRORS + 1))
    elif [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-this-in-production" ] || [ "$JWT_SECRET" = "default-secret-change-me" ]; then
        echo "⚠️  WARNING: JWT_SECRET is using default value!"
        echo "   Generate a new one with: openssl rand -base64 48"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "✅ JWT_SECRET is configured"
    fi
    
    # Check NODE_ENV
    NODE_ENV=$(grep "^NODE_ENV=" .env | cut -d '=' -f2)
    if [ "$NODE_ENV" != "production" ]; then
        echo "⚠️  WARNING: NODE_ENV is not set to 'production'"
        echo "   Current value: $NODE_ENV"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "✅ NODE_ENV is set to production"
    fi
fi
echo ""

# Check Node.js
echo "🔧 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js installed: $NODE_VERSION"
    
    # Check version
    VERSION_NUM=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$VERSION_NUM" -lt 16 ]; then
        echo "⚠️  WARNING: Node.js version should be 16 or higher"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ Node.js NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check tmux
echo "🖥️  Checking tmux..."
if command -v tmux &> /dev/null; then
    TMUX_VERSION=$(tmux -V)
    echo "✅ tmux installed: $TMUX_VERSION"
else
    echo "❌ tmux NOT FOUND"
    echo "   Install with: sudo apt install tmux"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check npm dependencies
echo "📦 Checking npm dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
else
    echo "⚠️  WARNING: node_modules not found"
    echo "   Run: npm install"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check terminals configuration
echo "🎮 Checking terminals configuration..."
if [ -f "config/terminals.json" ]; then
    TERMINAL_COUNT=$(grep -o '"id"' config/terminals.json | wc -l)
    echo "✅ Found $TERMINAL_COUNT terminal(s) configured"
    
    if [ "$TERMINAL_COUNT" -eq 0 ]; then
        echo "⚠️  WARNING: No terminals configured"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ config/terminals.json NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check users
echo "👥 Checking users..."
if [ -f "config/users.json" ]; then
    USER_COUNT=$(grep -o '"id"' config/users.json | wc -l || echo "0")
    echo "✅ Found $USER_COUNT user(s)"
    
    if [ "$USER_COUNT" -eq 0 ]; then
        echo "⚠️  WARNING: No users created yet"
        echo "   Run: npm run init"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "⚠️  config/users.json not found (will be created on first user)"
fi
echo ""

# Check permissions
echo "🔒 Checking file permissions..."
if [ -f .env ]; then
    PERM=$(stat -c "%a" .env 2>/dev/null || stat -f "%A" .env 2>/dev/null || echo "unknown")
    if [ "$PERM" = "600" ]; then
        echo "✅ .env permissions are correct (600)"
    else
        echo "⚠️  WARNING: .env permissions should be 600"
        echo "   Current: $PERM"
        echo "   Fix with: chmod 600 .env"
        WARNINGS=$((WARNINGS + 1))
    fi
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════╗"
echo "║  Verification Summary                              ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Ready for deployment."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS warning(s) found. Review before deployment."
    exit 0
else
    echo "❌ $ERRORS error(s) and $WARNINGS warning(s) found."
    echo "   Please fix the errors before deployment."
    exit 1
fi
