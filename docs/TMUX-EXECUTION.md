# Tmux Channel Execution Guide

This guide explains how to execute commands on tmux channels using the configuration file.

## Overview

The system allows you to execute commands on configured tmux channels in three ways:
- **Single Channel**: Execute on one specific channel
- **Multiple Channels**: Execute on selected channels
- **All Channels**: Execute on all configured channels

All methods support using an alternative configuration file if needed.

## Configuration File

By default, the system uses `config/terminals.json`. You can specify a custom config file path.

Example `terminals.json`:
```json
[
  {
    "id": "minecraft-server",
    "name": "Minecraft Server",
    "sessionName": "mc-server",
    "workingDirectory": "/opt/minecraft",
    "initialCommand": "./start.sh"
  },
  {
    "id": "web-app",
    "name": "Web Application",
    "sessionName": "webapp",
    "workingDirectory": "/var/www/app",
    "initialCommand": "npm start"
  }
]
```

## API Endpoints

### 1. Execute on Single Channel

**Endpoint**: `POST /api/execute-channel`

**Request Body**:
```json
{
  "terminalId": "minecraft-server",
  "command": "say Hello from API!",
  "configPath": "/path/to/custom/config.json"  // Optional
}
```

**Response**:
```json
{
  "success": true,
  "sessionName": "mc-server",
  "terminal": { /* terminal config */ },
  "command": "say Hello from API!",
  "message": "Command executed on mc-server"
}
```

### 2. Execute on Multiple Channels

**Endpoint**: `POST /api/execute-multiple-channels`

**Request Body**:
```json
{
  "terminalIds": ["minecraft-server", "web-app"],
  "command": "echo 'Batch command'",
  "configPath": "/path/to/custom/config.json"  // Optional
}
```

**Response**:
```json
[
  {
    "terminalId": "minecraft-server",
    "success": true,
    "sessionName": "mc-server",
    "message": "Command executed on mc-server"
  },
  {
    "terminalId": "web-app",
    "success": true,
    "sessionName": "webapp",
    "message": "Command executed on webapp"
  }
]
```

### 3. Execute on All Channels

**Endpoint**: `POST /api/execute-all-channels`

**Request Body**:
```json
{
  "command": "uptime",
  "configPath": "/path/to/custom/config.json"  // Optional
}
```

**Response**: Array of results for each terminal in config.

## Usage Examples

### Using cURL

#### Single Channel
```bash
curl -X POST http://localhost:3000/api/execute-channel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "terminalId": "minecraft-server",
    "command": "say Server restart in 5 minutes!"
  }'
```

#### Multiple Channels
```bash
curl -X POST http://localhost:3000/api/execute-multiple-channels \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "terminalIds": ["minecraft-server", "web-app"],
    "command": "echo System maintenance in progress"
  }'
```

#### All Channels
```bash
curl -X POST http://localhost:3000/api/execute-all-channels \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "date"
  }'
```

#### Using Custom Config File
```bash
curl -X POST http://localhost:3000/api/execute-channel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "terminalId": "custom-server",
    "command": "status",
    "configPath": "/etc/mc-watcher/custom-terminals.json"
  }'
```

### Using JavaScript (Frontend)

```javascript
// Single channel execution
async function executeOnChannel(terminalId, command) {
  const response = await fetch('/api/execute-channel', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ terminalId, command })
  });
  
  return await response.json();
}

// Multiple channels execution
async function executeOnMultiple(terminalIds, command) {
  const response = await fetch('/api/execute-multiple-channels', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ terminalIds, command })
  });
  
  return await response.json();
}

// All channels execution
async function executeOnAll(command) {
  const response = await fetch('/api/execute-all-channels', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ command })
  });
  
  return await response.json();
}

// Example usage
await executeOnChannel('minecraft-server', 'say Hello!');
await executeOnMultiple(['minecraft-server', 'web-app'], 'uptime');
await executeOnAll('date');
```

### Using Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const token = 'YOUR_JWT_TOKEN';

async function sendCommand(terminalId, command) {
  try {
    const response = await axios.post(`${API_URL}/api/execute-channel`, {
      terminalId,
      command
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Execute
sendCommand('minecraft-server', 'save-all');
```

## Features

### Automatic Session Creation

If a tmux session doesn't exist, it will be automatically created with the configuration from the terminals config file:
- Working directory
- Initial command
- Session name

### Error Handling

The API returns detailed error messages:
- Terminal not found in configuration
- Tmux session creation failed
- Command execution failed

### Multiple Config File Support

You can maintain different configuration files for different environments:

```bash
# Production servers
config/terminals.json

# Development servers
config/terminals-dev.json

# Staging servers
config/terminals-staging.json
```

Then use the `configPath` parameter to specify which one to use.

## Security

- All endpoints require JWT authentication
- Only authenticated users can execute commands
- Admin-only features (user/terminal management) are protected separately

## Best Practices

1. **Use meaningful terminal IDs**: Make them descriptive (`minecraft-server`, not `server1`)
2. **Test commands first**: Try commands manually before automating
3. **Handle errors**: Always check the response for success/error status
4. **Use appropriate config files**: Separate configs for different environments
5. **Log executions**: Keep track of what commands are being executed

## Common Use Cases

### Minecraft Server Management
```javascript
// Save world before backup
await executeOnChannel('minecraft-server', 'save-all');

// Announce server restart
await executeOnChannel('minecraft-server', 'say Server restarting in 60 seconds!');

// Stop server gracefully
await executeOnChannel('minecraft-server', 'stop');
```

### Application Deployment
```javascript
// Pull latest code on all servers
await executeOnAll('git pull origin main');

// Restart all applications
await executeOnAll('npm run restart');

// Check status
const results = await executeOnAll('pm2 status');
```

### System Maintenance
```javascript
// Check disk space on all servers
await executeOnAll('df -h');

// Update packages
await executeOnAll('sudo apt update && sudo apt upgrade -y');
```

## Troubleshooting

### Command Not Executing
- Verify the terminal ID exists in config
- Check if tmux is installed
- Ensure the user has permissions

### Session Not Found
- The system auto-creates sessions, but check tmux is running
- Verify `sessionName` in config is valid

### Permission Denied
- Check working directory permissions
- Ensure the process user can access the directory
- Verify sudo rights if needed

## Integration Examples

### Scheduled Commands (Cron)
```bash
# Add to crontab
0 */6 * * * curl -X POST http://localhost:3000/api/execute-channel \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"terminalId":"minecraft-server","command":"save-all"}'
```

### Webhook Integration
```javascript
app.post('/webhook/restart', async (req, res) => {
  await executeOnChannel('web-app', 'npm run restart');
  res.json({ success: true });
});
```

### Monitoring Integration
```javascript
// Check all servers every 5 minutes
setInterval(async () => {
  const results = await executeOnAll('uptime');
  console.log('Server status:', results);
}, 5 * 60 * 1000);
```
