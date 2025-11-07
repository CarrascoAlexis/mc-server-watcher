#!/bin/bash

# ============================================================================
# Tmux Channel Execution Examples
# ============================================================================
# This script demonstrates various ways to execute commands on tmux channels
# using the MC Server Watcher API
# ============================================================================

# Configuration
API_URL="http://localhost:3000"
TOKEN=""  # Set your JWT token here or via environment variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

# Print colored message
print_msg() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

# Check if token is set
check_token() {
  if [ -z "$TOKEN" ]; then
    print_msg "$RED" "❌ Error: TOKEN not set!"
    print_msg "$YELLOW" "Set TOKEN in this script or as environment variable:"
    print_msg "$YELLOW" "  export TOKEN=\"your-jwt-token\""
    exit 1
  fi
}

# Execute on single channel
execute_single() {
  local terminal_id=$1
  local command=$2
  
  print_msg "$YELLOW" "→ Executing on $terminal_id: $command"
  
  response=$(curl -s -X POST "$API_URL/api/execute-channel" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"terminalId\":\"$terminal_id\",\"command\":\"$command\"}")
  
  if echo "$response" | grep -q '"success":true'; then
    print_msg "$GREEN" "✓ Success!"
  else
    print_msg "$RED" "✗ Failed: $response"
  fi
}

# Execute on multiple channels
execute_multiple() {
  local terminal_ids=$1
  local command=$2
  
  print_msg "$YELLOW" "→ Executing on multiple channels: $command"
  
  response=$(curl -s -X POST "$API_URL/api/execute-multiple-channels" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"terminalIds\":[$terminal_ids],\"command\":\"$command\"}")
  
  echo "$response" | jq '.'
}

# Execute on all channels
execute_all() {
  local command=$1
  
  print_msg "$YELLOW" "→ Executing on all channels: $command"
  
  response=$(curl -s -X POST "$API_URL/api/execute-all-channels" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"command\":\"$command\"}")
  
  echo "$response" | jq '.'
}

# ============================================================================
# Example Functions
# ============================================================================

# Minecraft server examples
minecraft_examples() {
  print_msg "$GREEN" "\n=== Minecraft Server Examples ==="
  
  # Announce message
  execute_single "minecraft-server" "say Server maintenance in 5 minutes!"
  sleep 1
  
  # Save world
  execute_single "minecraft-server" "save-all"
  sleep 1
  
  # List players
  execute_single "minecraft-server" "list"
  sleep 1
  
  # Give item to player
  # execute_single "minecraft-server" "give @p minecraft:diamond 64"
}

# System maintenance examples
system_examples() {
  print_msg "$GREEN" "\n=== System Maintenance Examples ==="
  
  # Check uptime on all servers
  execute_all "uptime"
  sleep 1
  
  # Check disk space
  execute_all "df -h | grep -E '^/dev/'"
  sleep 1
  
  # Check memory usage
  execute_all "free -h"
  sleep 1
  
  # Show current date/time
  execute_all "date"
}

# Application management examples
app_examples() {
  print_msg "$GREEN" "\n=== Application Management Examples ==="
  
  # Check Node.js version
  execute_single "web-app" "node --version"
  sleep 1
  
  # Check npm version
  execute_single "web-app" "npm --version"
  sleep 1
  
  # Show running processes (pm2)
  # execute_single "web-app" "pm2 status"
}

# Batch operations
batch_examples() {
  print_msg "$GREEN" "\n=== Batch Operations Examples ==="
  
  # Execute on multiple specific channels
  execute_multiple '"minecraft-server","backup-server"' "echo 'Batch command test'"
  sleep 1
  
  # Run backup on all servers
  # execute_all "cd /backup && ./backup.sh"
}

# ============================================================================
# Interactive Menu
# ============================================================================

show_menu() {
  echo ""
  print_msg "$GREEN" "╔═══════════════════════════════════════════════════════╗"
  print_msg "$GREEN" "║     Tmux Channel Execution Examples Menu             ║"
  print_msg "$GREEN" "╚═══════════════════════════════════════════════════════╝"
  echo ""
  echo "1) Minecraft Server Examples"
  echo "2) System Maintenance Examples"
  echo "3) Application Management Examples"
  echo "4) Batch Operations Examples"
  echo "5) Custom Command (Single Channel)"
  echo "6) Custom Command (All Channels)"
  echo "7) Test Connection"
  echo "0) Exit"
  echo ""
  read -p "Select an option: " choice
  
  case $choice in
    1) minecraft_examples ;;
    2) system_examples ;;
    3) app_examples ;;
    4) batch_examples ;;
    5) custom_single ;;
    6) custom_all ;;
    7) test_connection ;;
    0) exit 0 ;;
    *) print_msg "$RED" "Invalid option!" ;;
  esac
  
  show_menu
}

# Custom single channel command
custom_single() {
  read -p "Enter terminal ID: " terminal_id
  read -p "Enter command: " command
  execute_single "$terminal_id" "$command"
}

# Custom all channels command
custom_all() {
  read -p "Enter command: " command
  execute_all "$command"
}

# Test connection
test_connection() {
  print_msg "$YELLOW" "→ Testing connection to $API_URL..."
  
  response=$(curl -s -X GET "$API_URL/api/verify" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$response" | grep -q '"valid":true'; then
    print_msg "$GREEN" "✓ Connection successful!"
    echo "$response" | jq '.'
  else
    print_msg "$RED" "✗ Connection failed!"
    echo "$response"
  fi
}

# ============================================================================
# Main Script
# ============================================================================

main() {
  print_msg "$GREEN" "╔═══════════════════════════════════════════════════════╗"
  print_msg "$GREEN" "║   MC Server Watcher - Tmux Command Execution Tool    ║"
  print_msg "$GREEN" "╚═══════════════════════════════════════════════════════╝"
  
  # Check dependencies
  if ! command -v curl &> /dev/null; then
    print_msg "$RED" "❌ Error: curl is not installed!"
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    print_msg "$YELLOW" "⚠️  Warning: jq is not installed (optional, for pretty JSON output)"
  fi
  
  # Check token
  check_token
  
  # Handle command line arguments
  if [ $# -gt 0 ]; then
    case $1 in
      --single)
        if [ $# -lt 3 ]; then
          print_msg "$RED" "Usage: $0 --single <terminal-id> <command>"
          exit 1
        fi
        execute_single "$2" "$3"
        ;;
      --multiple)
        if [ $# -lt 3 ]; then
          print_msg "$RED" "Usage: $0 --multiple <terminal-ids> <command>"
          exit 1
        fi
        execute_multiple "$2" "$3"
        ;;
      --all)
        if [ $# -lt 2 ]; then
          print_msg "$RED" "Usage: $0 --all <command>"
          exit 1
        fi
        execute_all "$2"
        ;;
      --test)
        test_connection
        ;;
      --help)
        echo "Usage:"
        echo "  $0                                  # Interactive menu"
        echo "  $0 --single <id> <command>         # Execute on single channel"
        echo "  $0 --multiple <ids> <command>      # Execute on multiple channels"
        echo "  $0 --all <command>                 # Execute on all channels"
        echo "  $0 --test                           # Test connection"
        echo ""
        echo "Examples:"
        echo "  $0 --single minecraft-server 'say Hello!'"
        echo "  $0 --multiple '\"mc-server\",\"backup\"' 'uptime'"
        echo "  $0 --all 'date'"
        ;;
      *)
        print_msg "$RED" "Unknown option: $1"
        print_msg "$YELLOW" "Use --help for usage information"
        exit 1
        ;;
    esac
  else
    # Show interactive menu
    show_menu
  fi
}

# Run main function
main "$@"
