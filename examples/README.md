# Examples Directory

This directory contains example code and integration patterns for using the MC Server Watcher API.

## Available Examples

### `tmux-client.js` - JavaScript Client Library

A complete JavaScript client library for interacting with the tmux channel execution API.

**Features:**
- Promise-based async/await API
- Works in Node.js and browsers
- Built-in error handling
- Authentication management
- Full TypeScript-ready

**Quick Start:**

```javascript
// Import the client
const TmuxChannelClient = require('./examples/tmux-client.js');

// Create instance
const client = new TmuxChannelClient('http://localhost:3000', 'YOUR_JWT_TOKEN');

// Execute command
const result = await client.executeOnChannel('minecraft-server', 'say Hello!');
console.log(result);
```

## Usage Examples

### 1. Basic Command Execution

```javascript
const TmuxChannelClient = require('./examples/tmux-client.js');
const client = new TmuxChannelClient('http://localhost:3000', process.env.JWT_TOKEN);

// Single channel
await client.executeOnChannel('minecraft-server', 'save-all');

// Multiple channels
await client.executeOnMultipleChannels(
  ['server1', 'server2'],
  'uptime'
);

// All channels
await client.executeOnAllChannels('date');
```

### 2. Minecraft Server Management

```javascript
// Graceful shutdown sequence
async function gracefulShutdown(client) {
  // Warn players
  await client.executeOnChannel('minecraft-server', 'say Server shutting down in 5 minutes!');
  await sleep(4 * 60 * 1000);
  
  await client.executeOnChannel('minecraft-server', 'say Server shutting down in 1 minute!');
  await sleep(30 * 1000);
  
  await client.executeOnChannel('minecraft-server', 'say Server shutting down in 30 seconds!');
  await sleep(30 * 1000);
  
  // Save and stop
  await client.executeOnChannel('minecraft-server', 'save-all');
  await client.executeOnChannel('minecraft-server', 'stop');
}
```

### 3. Automated Backup

```javascript
async function backupSequence(client) {
  // Disable auto-save
  await client.executeOnChannel('minecraft-server', 'save-off');
  
  // Force save
  await client.executeOnChannel('minecraft-server', 'save-all');
  
  // Run backup
  await client.executeOnChannel('backup-server', './backup.sh');
  
  // Wait for completion
  await sleep(30000);
  
  // Re-enable auto-save
  await client.executeOnChannel('minecraft-server', 'save-on');
  await client.executeOnChannel('minecraft-server', 'say Backup complete!');
}

// Schedule backup every 6 hours
setInterval(() => backupSequence(client), 6 * 60 * 60 * 1000);
```

### 4. Monitoring Dashboard

```javascript
async function monitorServers(client) {
  const results = await client.executeOnAllChannels('echo "alive"');
  
  results.forEach(result => {
    const status = result.success ? '✓ Online' : '✗ Offline';
    console.log(`${result.terminalId}: ${status}`);
  });
}

// Check every 5 minutes
setInterval(() => monitorServers(client), 5 * 60 * 1000);
```

### 5. Multi-Environment Deployments

```javascript
// Deploy to staging
await client.executeOnChannel(
  'staging-app',
  'git pull && npm install && npm restart',
  '/etc/mc-watcher/staging-terminals.json'
);

// Deploy to production
await client.executeOnChannel(
  'production-app',
  'git pull && npm install && npm restart',
  '/etc/mc-watcher/production-terminals.json'
);
```

### 6. Error Handling with Retry

```javascript
async function executeWithRetry(client, terminalId, command, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.executeOnChannel(terminalId, command);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
}
```

### 7. Batch Operations with Progress

```javascript
async function batchUpdate(client, terminalIds, command) {
  console.log(`Updating ${terminalIds.length} servers...`);
  
  const results = await client.executeOnMultipleChannels(terminalIds, command);
  
  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Complete: ${succeeded} succeeded, ${failed} failed`);
  
  // Show failures
  results.filter(r => !r.success).forEach(r => {
    console.error(`Failed on ${r.terminalId}: ${r.error}`);
  });
  
  return results;
}
```

### 8. Scheduled Maintenance Window

```javascript
const cron = require('node-cron');

// Every Sunday at 3 AM
cron.schedule('0 3 * * 0', async () => {
  console.log('Starting maintenance window...');
  
  try {
    // Announce
    await client.executeOnAllChannels('echo "Maintenance starting"');
    
    // Update all servers
    await client.executeOnAllChannels('apt update && apt upgrade -y');
    
    // Restart services
    await client.executeOnAllChannels('systemctl restart myapp');
    
    console.log('Maintenance complete');
  } catch (error) {
    console.error('Maintenance failed:', error);
  }
});
```

## Integration Patterns

### Express.js Webhook

```javascript
const express = require('express');
const TmuxChannelClient = require('./examples/tmux-client.js');

const app = express();
const client = new TmuxChannelClient('http://localhost:3000', process.env.JWT_TOKEN);

// Webhook endpoint for GitHub deployments
app.post('/webhook/deploy', async (req, res) => {
  try {
    await client.executeOnChannel('web-app', 'git pull && npm install && pm2 restart app');
    res.json({ success: true, message: 'Deployment started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(8080);
```

### Discord Bot Integration

```javascript
const Discord = require('discord.js');
const TmuxChannelClient = require('./examples/tmux-client.js');

const bot = new Discord.Client();
const client = new TmuxChannelClient('http://localhost:3000', process.env.JWT_TOKEN);

bot.on('message', async (message) => {
  if (message.content.startsWith('!server')) {
    const args = message.content.split(' ').slice(1);
    const command = args.join(' ');
    
    try {
      await client.executeOnChannel('minecraft-server', command);
      message.reply('Command executed!');
    } catch (error) {
      message.reply(`Error: ${error.message}`);
    }
  }
});

bot.login(process.env.DISCORD_TOKEN);
```

### React Dashboard

```javascript
import React, { useState, useEffect } from 'react';

function ServerDashboard() {
  const [client] = useState(
    new TmuxChannelClient('http://localhost:3000', localStorage.getItem('token'))
  );
  const [terminals, setTerminals] = useState([]);

  useEffect(() => {
    async function loadTerminals() {
      const data = await client.getTerminals();
      setTerminals(data);
    }
    loadTerminals();
  }, []);

  const executeCommand = async (terminalId, command) => {
    try {
      await client.executeOnChannel(terminalId, command);
      alert('Command executed!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      {terminals.map(terminal => (
        <div key={terminal.id}>
          <h3>{terminal.name}</h3>
          <button onClick={() => executeCommand(terminal.id, 'status')}>
            Check Status
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Best Practices

1. **Environment Variables**: Store tokens in environment variables, never hardcode
2. **Error Handling**: Always wrap API calls in try-catch blocks
3. **Retry Logic**: Implement retry with exponential backoff for critical operations
4. **Logging**: Log all operations for audit trails
5. **Validation**: Validate terminal IDs before execution
6. **Rate Limiting**: Be mindful of API rate limits
7. **Timeouts**: Set appropriate timeouts for long-running commands

## Testing

```javascript
// Test connection
async function testConnection() {
  const client = new TmuxChannelClient('http://localhost:3000', process.env.JWT_TOKEN);
  
  try {
    const verification = await client.verifyToken();
    console.log('✓ Connection successful:', verification);
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
  }
}

testConnection();
```

## TypeScript Support

While the library is written in JavaScript, it's TypeScript-ready. Create a `.d.ts` file:

```typescript
declare class TmuxChannelClient {
  constructor(apiUrl: string, token: string);
  setToken(token: string): void;
  executeOnChannel(terminalId: string, command: string, configPath?: string): Promise<any>;
  executeOnMultipleChannels(terminalIds: string[], command: string, configPath?: string): Promise<any[]>;
  executeOnAllChannels(command: string, configPath?: string): Promise<any[]>;
  getTerminals(): Promise<any[]>;
  verifyToken(): Promise<any>;
}

export = TmuxChannelClient;
```

## Contributing

When adding new examples:
1. Include clear comments
2. Handle errors properly
3. Follow existing code style
4. Add documentation
5. Test thoroughly

## Support

For questions or issues:
- Check main [README.md](../README.md)
- Review [TMUX-EXECUTION.md](../docs/TMUX-EXECUTION.md)
- Open an issue on GitHub

---

**Last Updated:** 2025-11-07
