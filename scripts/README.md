# Scripts Directory

This directory contains utility scripts for managing and testing the MC Server Watcher application.

## Available Scripts

### 1. `tmux-exec.js` - CLI Command Executor

Node.js CLI tool for executing commands on tmux channels.

**Features:**
- Execute on single channel
- Execute on multiple channels
- Execute on all channels
- Custom config file support
- Token management

**Setup:**
```bash
# Set authentication token
node scripts/tmux-exec.js --token YOUR_JWT_TOKEN
```

**Usage:**
```bash
# Single channel
node scripts/tmux-exec.js minecraft-server "say Hello!"

# Multiple channels
node scripts/tmux-exec.js --multiple mc-server,backup "uptime"

# All channels
node scripts/tmux-exec.js --all "date"

# Custom config
node scripts/tmux-exec.js --config /path/to/config.json mc-server "status"
```

**Help:**
```bash
node scripts/tmux-exec.js --help
```

---

### 2. `tmux-commands.sh` - Bash Examples Script

Interactive bash script with examples and menu for common operations.

**Features:**
- Interactive menu
- Minecraft server examples
- System maintenance examples
- Application management examples
- Batch operations
- Custom commands

**Setup:**
```bash
# Make executable
chmod +x scripts/tmux-commands.sh

# Set your JWT token in the script or environment
export TOKEN="your-jwt-token"
```

**Usage:**
```bash
# Interactive menu
./scripts/tmux-commands.sh

# Direct command execution
./scripts/tmux-commands.sh --single minecraft-server "say Hello!"
./scripts/tmux-commands.sh --all "uptime"
./scripts/tmux-commands.sh --test  # Test connection
```

---

### 3. `test-tmux-api.js` - API Test Suite

Automated test suite for the tmux channel execution API.

**Features:**
- API connection tests
- Authentication tests
- Parameter validation tests
- Single/multiple/all channel execution tests
- Error handling tests

**Setup:**
```bash
export ADMIN_TOKEN="your-jwt-token"
export API_URL="http://localhost:3000"  # Optional
```

**Usage:**
```bash
node scripts/test-tmux-api.js
```

**Example Output:**
```
╔═══════════════════════════════════════════════════════════════╗
║     Tmux Channel Execution API - Test Suite                  ║
╚═══════════════════════════════════════════════════════════════╝

→ Testing: API Connection
✓ PASSED: API Connection

→ Testing: Authentication Required
✓ PASSED: Authentication Required

...

TEST SUMMARY
Total Tests: 8
Passed: 8
Failed: 0

✓ All tests passed!
```

---

## Common Use Cases

### Scheduled Maintenance

Create a cron job to execute commands periodically:

```bash
# Save Minecraft world every 6 hours
0 */6 * * * cd /path/to/mc-server-watcher && node scripts/tmux-exec.js minecraft-server "save-all"

# Backup all servers daily at 3 AM
0 3 * * * cd /path/to/mc-server-watcher && ./scripts/tmux-commands.sh --all "/backup/run-backup.sh"
```

### Server Announcements

```bash
# Announce maintenance
node scripts/tmux-exec.js minecraft-server "say Server restart in 5 minutes!"

# Countdown
for i in {5..1}; do
  node scripts/tmux-exec.js minecraft-server "say Server restart in $i minute(s)!"
  sleep 60
done
```

### Batch Operations

```bash
# Update all servers
./scripts/tmux-commands.sh --all "git pull origin main"

# Restart specific services
node scripts/tmux-exec.js --multiple web-app,api-server "npm run restart"
```

### Monitoring

```bash
# Check status of all servers
./scripts/tmux-commands.sh --all "systemctl status myapp"

# Get disk usage
./scripts/tmux-commands.sh --all "df -h"
```

---

## Environment Variables

All scripts support these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | MC Server Watcher API URL | `http://localhost:3000` |
| `TOKEN` or `ADMIN_TOKEN` | JWT authentication token | (required) |

### Setting Environment Variables

**Linux/macOS:**
```bash
export ADMIN_TOKEN="your-jwt-token"
export API_URL="https://your-domain.com"
```

**Windows (PowerShell):**
```powershell
$env:ADMIN_TOKEN="your-jwt-token"
$env:API_URL="https://your-domain.com"
```

**Or use .env file:**
Create a `.env` file in the project root:
```env
ADMIN_TOKEN=your-jwt-token
API_URL=http://localhost:3000
```

---

## Dependencies

### Required
- Node.js v16+
- npm packages (installed via `npm install`):
  - axios
  - dotenv

### Optional
- curl (for bash script)
- jq (for pretty JSON output in bash script)

Install optional dependencies on Linux:
```bash
# Ubuntu/Debian
sudo apt install curl jq

# CentOS/RHEL
sudo yum install curl jq

# macOS
brew install curl jq
```

---

## Troubleshooting

### "Token not set" Error
Make sure you've set the authentication token:
```bash
# For tmux-exec.js
node scripts/tmux-exec.js --token YOUR_TOKEN

# For bash script
export TOKEN="YOUR_TOKEN"

# For test suite
export ADMIN_TOKEN="YOUR_TOKEN"
```

### "Connection refused" Error
- Check if the server is running
- Verify the API_URL is correct
- Check firewall settings

### "Terminal not found" Error
- Verify the terminal ID exists in `config/terminals.json`
- Check spelling of terminal ID (case-sensitive)

### Permission Errors
Make bash scripts executable:
```bash
chmod +x scripts/*.sh
```

---

## Best Practices

1. **Use environment variables** instead of hardcoding tokens
2. **Test commands** manually before automating
3. **Log operations** for audit trails
4. **Use specific terminal IDs** instead of --all for sensitive operations
5. **Implement error handling** in production scripts
6. **Backup configurations** before making changes

---

## Contributing

When adding new scripts:
1. Follow the existing naming convention
2. Include help/usage information
3. Handle errors gracefully
4. Document in this README
5. Add examples

---

## Security Notes

⚠️ **Important Security Considerations:**

- Never commit tokens or credentials to version control
- Use `.env` files (add to `.gitignore`)
- Limit token expiration time
- Use HTTPS in production
- Restrict script execution permissions
- Review logs regularly

---

## Support

For issues or questions:
1. Check the main [README.md](../README.md)
2. Review [TMUX-EXECUTION.md](../docs/TMUX-EXECUTION.md) documentation
3. Open an issue on GitHub

---

**Last Updated:** 2025-11-07
