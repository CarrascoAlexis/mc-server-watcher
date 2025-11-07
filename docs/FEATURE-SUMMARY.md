# 🎯 Tmux Channel Execution Feature - Summary

## Overview

This document summarizes the **Tmux Channel Execution** feature that has been added to MC Server Watcher. This feature allows you to execute commands on configured tmux channels via REST API, CLI tools, or programmatically using the provided client library.

## What Was Added

### 1. Backend API (Server-Side)

#### Enhanced `tmux-manager.js`
New methods added:
- `executeOnChannel(terminalId, command, configPath)` - Execute on single channel
- `executeOnMultipleChannels(terminalIds, command, configPath)` - Execute on multiple channels
- `executeOnAllChannels(command, configPath)` - Execute on all configured channels
- `loadTerminalsConfig(configPath)` - Now supports custom config file path
- `createOrAttachSession(terminalId, configPath)` - Enhanced with custom config support

**Key Features:**
- ✅ Automatic tmux session creation if doesn't exist
- ✅ Custom configuration file support
- ✅ Robust error handling
- ✅ Session existence checking before execution

#### New API Routes in `server/index.js`
- `POST /api/execute-channel` - Execute command on specific channel
- `POST /api/execute-multiple-channels` - Execute command on multiple channels
- `POST /api/execute-all-channels` - Execute command on all channels

**Authentication:** All routes require JWT authentication (Bearer token)

### 2. Command-Line Tools

#### `scripts/tmux-exec.js` - Node.js CLI Tool
**Features:**
- Execute on single, multiple, or all channels
- Token management (save/load from .env)
- Custom config file support
- User-friendly output with emojis and colors

**Usage:**
```bash
node scripts/tmux-exec.js minecraft-server "say Hello!"
node scripts/tmux-exec.js --all "uptime"
node scripts/tmux-exec.js --multiple mc1,mc2 "date"
```

#### `scripts/tmux-commands.sh` - Bash Script with Examples
**Features:**
- Interactive menu system
- Pre-built examples (Minecraft, system maintenance, batch operations)
- Custom command execution
- Connection testing
- Color-coded output

**Usage:**
```bash
./scripts/tmux-commands.sh                    # Interactive menu
./scripts/tmux-commands.sh --single mc "cmd"  # Direct execution
./scripts/tmux-commands.sh --test             # Test connection
```

#### `scripts/test-tmux-api.js` - API Test Suite
**Features:**
- Automated testing of all endpoints
- Connection verification
- Authentication tests
- Parameter validation tests
- Error handling verification

**Usage:**
```bash
export ADMIN_TOKEN="your-jwt-token"
node scripts/test-tmux-api.js
```

### 3. Client Library

#### `examples/tmux-client.js` - JavaScript Client
**Features:**
- Promise-based async/await API
- Works in Node.js and browsers
- Built-in authentication
- Comprehensive error handling
- 8+ usage examples included

**Usage:**
```javascript
const TmuxChannelClient = require('./examples/tmux-client.js');
const client = new TmuxChannelClient('http://localhost:3000', 'YOUR_TOKEN');

await client.executeOnChannel('minecraft-server', 'save-all');
```

### 4. Documentation

#### New Documentation Files
1. **`docs/TMUX-EXECUTION.md`** (Complete guide)
   - API endpoints reference
   - Configuration file format
   - Usage examples (cURL, JavaScript, Node.js)
   - Security considerations
   - Troubleshooting guide
   - Integration examples

2. **`scripts/README.md`** (Scripts documentation)
   - Tool descriptions
   - Setup instructions
   - Usage examples
   - Environment variables
   - Best practices

3. **`examples/README.md`** (Client library guide)
   - Quick start guide
   - 8+ integration patterns
   - TypeScript support
   - Best practices
   - Testing examples

4. **`CHANGELOG.md`** (Version history)
   - Feature additions
   - Changes and improvements
   - Bug fixes
   - Version tracking

#### Updated Files
- **`README.md`** - Added feature overview, API routes, examples
- **Package info** - Updated with new capabilities

### 5. Configuration Files

#### `config/terminals.example.json`
Example configuration with 3 sample terminals:
- Minecraft server
- Backup server
- Web application

## How to Use

### Quick Start

1. **Set your authentication token:**
```bash
node scripts/tmux-exec.js --token YOUR_JWT_TOKEN
```

2. **Execute a command:**
```bash
# Single channel
node scripts/tmux-exec.js minecraft-server "say Hello world!"

# All channels
node scripts/tmux-exec.js --all "date"
```

### Via API (cURL)

```bash
curl -X POST http://localhost:3000/api/execute-channel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"terminalId":"minecraft-server","command":"save-all"}'
```

### Via JavaScript

```javascript
const TmuxChannelClient = require('./examples/tmux-client.js');
const client = new TmuxChannelClient('http://localhost:3000', token);

// Execute command
const result = await client.executeOnChannel('minecraft-server', 'list');
console.log(result);
```

### Via Bash Script

```bash
# Interactive menu
./scripts/tmux-commands.sh

# Or direct command
./scripts/tmux-commands.sh --single minecraft-server "say Server restart soon"
```

## Use Cases

### 1. Minecraft Server Management
- Announce messages to players
- Save world data
- Restart server gracefully
- Run admin commands

### 2. Automated Backups
- Save game state
- Disable auto-save during backup
- Run backup scripts
- Re-enable auto-save

### 3. Multi-Server Operations
- Update all servers simultaneously
- Check status across infrastructure
- Deploy code to multiple environments
- Batch maintenance tasks

### 4. Monitoring & Health Checks
- Check server uptime
- Monitor disk space
- Verify application status
- Alert on failures

### 5. CI/CD Integration
- Deploy via webhooks
- Restart services after builds
- Run database migrations
- Clear caches

## Key Features

### ✅ Automatic Session Management
- Creates tmux sessions automatically if they don't exist
- Uses configuration from terminals.json
- Applies working directory and initial commands

### ✅ Multiple Configuration Files
- Default: `config/terminals.json`
- Support for custom paths
- Environment-specific configs (dev, staging, prod)

### ✅ Robust Error Handling
- Detailed error messages
- Graceful degradation
- Retry logic support
- Connection verification

### ✅ Security
- JWT authentication required
- Token-based access control
- No command injection vulnerabilities
- Audit trail support

### ✅ Flexibility
- Single, multiple, or all channel execution
- Custom configuration files
- Programmable via API or library
- CLI tools for manual operations

## API Reference

### Execute on Single Channel
```
POST /api/execute-channel
Body: {
  "terminalId": "minecraft-server",
  "command": "say Hello!",
  "configPath": "/optional/path.json"  // Optional
}
```

### Execute on Multiple Channels
```
POST /api/execute-multiple-channels
Body: {
  "terminalIds": ["server1", "server2"],
  "command": "uptime",
  "configPath": "/optional/path.json"  // Optional
}
```

### Execute on All Channels
```
POST /api/execute-all-channels
Body: {
  "command": "date",
  "configPath": "/optional/path.json"  // Optional
}
```

## Files Created/Modified

### New Files
- `server/tmux-manager.js` - Enhanced with new methods
- `scripts/tmux-exec.js` - CLI tool
- `scripts/tmux-commands.sh` - Bash examples
- `scripts/test-tmux-api.js` - Test suite
- `scripts/README.md` - Scripts documentation
- `examples/tmux-client.js` - JavaScript client library
- `examples/README.md` - Client library documentation
- `docs/TMUX-EXECUTION.md` - Complete feature guide
- `config/terminals.example.json` - Example configuration
- `CHANGELOG.md` - Version history

### Modified Files
- `server/index.js` - Added 3 new API routes
- `README.md` - Added feature documentation

## Testing

Run the test suite:
```bash
export ADMIN_TOKEN="your-jwt-token"
node scripts/test-tmux-api.js
```

Expected output:
```
╔═══════════════════════════════════════════════════════════════╗
║     Tmux Channel Execution API - Test Suite                  ║
╚═══════════════════════════════════════════════════════════════╝

→ Testing: API Connection
✓ PASSED: API Connection

...

TEST SUMMARY
Total Tests: 8
Passed: 8
Failed: 0

✓ All tests passed!
```

## Next Steps

1. **Configure your terminals** in `config/terminals.json`
2. **Get your JWT token** by logging in to the admin panel
3. **Test the API** using the provided test script
4. **Try the CLI tools** for manual operations
5. **Integrate the client library** into your applications
6. **Automate tasks** using cron jobs or CI/CD pipelines

## Examples Repository Structure

```
mc-server-watcher/
├── server/
│   ├── tmux-manager.js        ← Enhanced with execution methods
│   └── index.js               ← Added API routes
├── scripts/
│   ├── tmux-exec.js          ← CLI tool
│   ├── tmux-commands.sh      ← Bash examples
│   ├── test-tmux-api.js      ← Test suite
│   └── README.md             ← Scripts documentation
├── examples/
│   ├── tmux-client.js        ← JavaScript client library
│   └── README.md             ← Client library guide
├── docs/
│   └── TMUX-EXECUTION.md     ← Complete feature guide
├── config/
│   └── terminals.example.json ← Example configuration
└── CHANGELOG.md              ← Version history
```

## Support & Resources

- **Main Documentation:** [README.md](../README.md)
- **Feature Guide:** [docs/TMUX-EXECUTION.md](../docs/TMUX-EXECUTION.md)
- **Scripts Guide:** [scripts/README.md](../scripts/README.md)
- **Client Library Guide:** [examples/README.md](../examples/README.md)
- **GitHub Issues:** [Report bugs or request features](https://github.com/CarrascoAlexis/mc-server-watcher/issues)

## License

MIT License - Same as the main project

---

**Version:** 1.0.0 (Unreleased)  
**Date:** November 7, 2025  
**Author:** Alexis Carrasco

**Status:** ✅ Feature Complete - Ready for Testing
