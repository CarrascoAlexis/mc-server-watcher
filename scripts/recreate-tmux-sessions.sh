#!/bin/bash

# Recreate Tmux Sessions Script
# This script kills existing tmux sessions and recreates them with correct working directories

echo "🔄 Recreating tmux sessions with correct working directories..."
echo ""

# Kill existing sessions
echo "📋 Killing existing sessions..."
tmux kill-session -t mc-server 2>/dev/null && echo "  ✅ Killed mc-server" || echo "  ℹ️  mc-server not running"
tmux kill-session -t web-app 2>/dev/null && echo "  ✅ Killed web-app" || echo "  ℹ️  web-app not running"
tmux kill-session -t backup-mgmt 2>/dev/null && echo "  ✅ Killed backup-mgmt" || echo "  ℹ️  backup-mgmt not running"

echo ""
echo "🆕 Creating new sessions with correct directories..."

# Create minecraft-server session
if [ -d "$HOME/MCServer" ]; then
  tmux new-session -d -s mc-server -c "$HOME/MCServer"
  echo "  ✅ Created mc-server in ~/MCServer"
else
  echo "  ⚠️  Warning: ~/MCServer directory doesn't exist, creating it..."
  mkdir -p "$HOME/MCServer"
  tmux new-session -d -s mc-server -c "$HOME/MCServer"
  echo "  ✅ Created mc-server in ~/MCServer"
fi

# Create web-app session
if [ -d "$HOME/Documents/mc-server-watcher" ]; then
  tmux new-session -d -s web-app -c "$HOME/Documents/mc-server-watcher"
  echo "  ✅ Created web-app in ~/Documents/mc-server-watcher"
else
  echo "  ❌ Error: ~/Documents/mc-server-watcher doesn't exist!"
fi

# Create backup-mgmt session
tmux new-session -d -s backup-mgmt -c "$HOME"
echo "  ✅ Created backup-mgmt in ~"

echo ""
echo "📊 Current tmux sessions:"
tmux list-sessions

echo ""
echo "🔍 Verifying working directories:"
echo "  mc-server:"
tmux send-keys -t mc-server 'pwd' C-m
sleep 0.2
tmux capture-pane -t mc-server -p | tail -2

echo "  web-app:"
tmux send-keys -t web-app 'pwd' C-m
sleep 0.2
tmux capture-pane -t web-app -p | tail -2

echo "  backup-mgmt:"
tmux send-keys -t backup-mgmt 'pwd' C-m
sleep 0.2
tmux capture-pane -t backup-mgmt -p | tail -2

echo ""
echo "✅ Done! All sessions recreated with correct working directories."
echo ""
echo "💡 Tip: Sessions will be automatically created with correct directories"
echo "   when you access them through the web interface from now on."
