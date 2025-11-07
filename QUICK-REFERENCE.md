# Quick Reference - Tmux Channel Execution

## 🚀 Quick Start

### 1. Get Your Token
Login to admin panel → Copy JWT token from localStorage or network tab

### 2. Configure CLI Tool
```bash
node scripts/tmux-exec.js --token YOUR_JWT_TOKEN
```

### 3. Execute Your First Command
```bash
node scripts/tmux-exec.js minecraft-server "say Hello World!"
```

## 📋 Common Commands

### Execute on Single Channel
```bash
# CLI
node scripts/tmux-exec.js <terminal-id> "<command>"

# Bash
./scripts/tmux-commands.sh --single <terminal-id> "<command>"

# cURL
curl -X POST http://localhost:3000/api/execute-channel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"terminalId":"<terminal-id>","command":"<command>"}'
```

### Execute on Multiple Channels
```bash
# CLI
node scripts/tmux-exec.js --multiple id1,id2,id3 "<command>"

# Bash
./scripts/tmux-commands.sh --multiple '"id1","id2"' "<command>"

# cURL
curl -X POST http://localhost:3000/api/execute-multiple-channels \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"terminalIds":["id1","id2"],"command":"<command>"}'
```

### Execute on All Channels
```bash
# CLI
node scripts/tmux-exec.js --all "<command>"

# Bash
./scripts/tmux-commands.sh --all "<command>"

# cURL
curl -X POST http://localhost:3000/api/execute-all-channels \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"<command>"}'
```

## 🎮 Minecraft Examples

```bash
# Announce message
node scripts/tmux-exec.js minecraft-server "say Hello players!"

# Save world
node scripts/tmux-exec.js minecraft-server "save-all"

# List players
node scripts/tmux-exec.js minecraft-server "list"

# Give item
node scripts/tmux-exec.js minecraft-server "give @p diamond 64"

# Teleport player
node scripts/tmux-exec.js minecraft-server "tp PlayerName 0 100 0"

# Set game mode
node scripts/tmux-exec.js minecraft-server "gamemode creative PlayerName"

# Weather control
node scripts/tmux-exec.js minecraft-server "weather clear"

# Time control
node scripts/tmux-exec.js minecraft-server "time set day"
```

## 🔧 System Maintenance

```bash
# Check uptime
node scripts/tmux-exec.js --all "uptime"

# Check disk space
node scripts/tmux-exec.js --all "df -h"

# Check memory
node scripts/tmux-exec.js --all "free -h"

# Check processes
node scripts/tmux-exec.js --all "top -bn1 | head -20"

# Update system
node scripts/tmux-exec.js --all "sudo apt update"
```

## 💻 Application Management

```bash
# Restart app
node scripts/tmux-exec.js web-app "npm run restart"

# Check status
node scripts/tmux-exec.js web-app "pm2 status"

# View logs
node scripts/tmux-exec.js web-app "pm2 logs --lines 50"

# Pull latest code
node scripts/tmux-exec.js web-app "git pull origin main"

# Install dependencies
node scripts/tmux-exec.js web-app "npm install"
```

## 📝 JavaScript Client

```javascript
const TmuxChannelClient = require('./examples/tmux-client.js');
const client = new TmuxChannelClient('http://localhost:3000', 'YOUR_TOKEN');

// Single channel
await client.executeOnChannel('minecraft-server', 'save-all');

// Multiple channels
await client.executeOnMultipleChannels(['mc1', 'mc2'], 'uptime');

// All channels
await client.executeOnAllChannels('date');

// Custom config
await client.executeOnChannel('server1', 'cmd', '/custom/config.json');
```

## 🛠️ Useful Patterns

### Graceful Shutdown
```bash
# Warn → Wait → Save → Stop
node scripts/tmux-exec.js minecraft-server "say Server restart in 5 min"
sleep 240
node scripts/tmux-exec.js minecraft-server "say Server restart in 1 min"
sleep 60
node scripts/tmux-exec.js minecraft-server "save-all"
node scripts/tmux-exec.js minecraft-server "stop"
```

### Backup Sequence
```bash
# Disable save → Save → Backup → Enable save
node scripts/tmux-exec.js minecraft-server "save-off"
node scripts/tmux-exec.js minecraft-server "save-all"
node scripts/tmux-exec.js backup-server "./backup.sh"
sleep 30
node scripts/tmux-exec.js minecraft-server "save-on"
```

### Health Check
```bash
# Check all servers
node scripts/tmux-exec.js --all "echo alive && date"
```

## 🔍 Troubleshooting

### Check Connection
```bash
# Verify token
curl -X GET http://localhost:3000/api/verify \
  -H "Authorization: Bearer $TOKEN"

# Test with bash script
./scripts/tmux-commands.sh --test
```

### Common Errors

**"Token not set"**
```bash
export TOKEN="your-jwt-token"
# or
node scripts/tmux-exec.js --token YOUR_JWT_TOKEN
```

**"Terminal not found"**
- Check terminal ID in `config/terminals.json`
- Verify spelling (case-sensitive)

**"Connection refused"**
- Ensure server is running
- Check API_URL setting
- Verify firewall rules

## 📚 More Information

- Full Guide: `docs/TMUX-EXECUTION.md`
- Scripts: `scripts/README.md`
- Client Library: `examples/README.md`
- Feature Summary: `docs/FEATURE-SUMMARY.md`

## ⚙️ Environment Variables

```bash
# Set token
export TOKEN="your-jwt-token"
export ADMIN_TOKEN="your-jwt-token"

# Set API URL (optional)
export API_URL="http://localhost:3000"
```

## 🎯 Tips

1. **Save token** using CLI tool for persistence
2. **Use --all carefully** - it affects all configured channels
3. **Test commands** manually before automation
4. **Check logs** for detailed error messages
5. **Use custom configs** for different environments

---

**Need help?** Check the full documentation in `docs/` directory or run:
```bash
node scripts/tmux-exec.js --help
./scripts/tmux-commands.sh --help
```
