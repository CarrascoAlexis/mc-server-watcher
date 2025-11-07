#!/usr/bin/env node

/**
 * CLI tool to execute commands on tmux channels
 * Usage:
 *   node tmux-exec.js <terminal-id> <command>
 *   node tmux-exec.js --all <command>
 *   node tmux-exec.js --multiple <id1,id2,id3> <command>
 *   node tmux-exec.js --config <path> <terminal-id> <command>
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG_FILE = path.join(__dirname, '../.env');
let API_URL = 'http://localhost:3000';
let TOKEN = '';

// Load environment
if (fs.existsSync(CONFIG_FILE)) {
  require('dotenv').config({ path: CONFIG_FILE });
  API_URL = process.env.API_URL || API_URL;
  TOKEN = process.env.ADMIN_TOKEN || '';
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           Tmux Channel Command Execution Tool                 ║
╚═══════════════════════════════════════════════════════════════╝

Usage:
  Single channel:
    node tmux-exec.js <terminal-id> <command>
    
  Multiple channels:
    node tmux-exec.js --multiple <id1,id2,id3> <command>
    
  All channels:
    node tmux-exec.js --all <command>
    
  Custom config:
    node tmux-exec.js --config <path> <terminal-id> <command>
    
  Set token:
    node tmux-exec.js --token <jwt-token>

Examples:
  node tmux-exec.js minecraft-server "say Hello!"
  node tmux-exec.js --all "date"
  node tmux-exec.js --multiple mc-server,web-app "uptime"
  node tmux-exec.js --config /etc/terminals.json mc-server "status"

Environment:
  API_URL=${API_URL}
  TOKEN=${TOKEN ? '***' + TOKEN.slice(-4) : 'NOT SET'}
  `);
  process.exit(1);
}

// Handle --token option
if (args[0] === '--token') {
  const token = args[1];
  const envPath = path.join(__dirname, '../.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('ADMIN_TOKEN=')) {
      envContent = envContent.replace(/ADMIN_TOKEN=.*/g, `ADMIN_TOKEN=${token}`);
    } else {
      envContent += `\nADMIN_TOKEN=${token}\n`;
    }
  } else {
    envContent = `ADMIN_TOKEN=${token}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✓ Token saved to .env file');
  process.exit(0);
}

// Check token
if (!TOKEN) {
  console.error('❌ Error: No token found!');
  console.error('Set token with: node tmux-exec.js --token <jwt-token>');
  console.error('Or add ADMIN_TOKEN to .env file');
  process.exit(1);
}

/**
 * Execute command on single channel
 */
async function executeSingle(terminalId, command, configPath = null) {
  try {
    const response = await axios.post(`${API_URL}/api/execute-channel`, {
      terminalId,
      command,
      configPath
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log('✓ Success!');
    console.log(`  Session: ${response.data.sessionName}`);
    console.log(`  Terminal: ${response.data.terminal.name}`);
    console.log(`  Command: ${response.data.command}`);
    console.log(`  Message: ${response.data.message}`);
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    process.exit(1);
  }
}

/**
 * Execute command on multiple channels
 */
async function executeMultiple(terminalIds, command, configPath = null) {
  try {
    const response = await axios.post(`${API_URL}/api/execute-multiple-channels`, {
      terminalIds,
      command,
      configPath
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log(`✓ Executed on ${response.data.length} channels:\n`);
    response.data.forEach(result => {
      if (result.success) {
        console.log(`  ✓ ${result.terminalId} (${result.sessionName})`);
      } else {
        console.log(`  ✗ ${result.terminalId}: ${result.error}`);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    process.exit(1);
  }
}

/**
 * Execute command on all channels
 */
async function executeAll(command, configPath = null) {
  try {
    const response = await axios.post(`${API_URL}/api/execute-all-channels`, {
      command,
      configPath
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log(`✓ Executed on ${response.data.length} channels:\n`);
    response.data.forEach(result => {
      if (result.success) {
        console.log(`  ✓ ${result.terminalId} (${result.sessionName})`);
      } else {
        console.log(`  ✗ ${result.terminalId}: ${result.error}`);
      }
    });
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    process.exit(1);
  }
}

// Main execution
(async () => {
  try {
    // Check for --config option
    let configPath = null;
    let startIndex = 0;
    
    if (args[0] === '--config') {
      configPath = args[1];
      startIndex = 2;
    }
    
    const option = args[startIndex];
    
    if (option === '--all') {
      const command = args.slice(startIndex + 1).join(' ');
      await executeAll(command, configPath);
    } else if (option === '--multiple') {
      const terminalIds = args[startIndex + 1].split(',');
      const command = args.slice(startIndex + 2).join(' ');
      await executeMultiple(terminalIds, command, configPath);
    } else {
      const terminalId = option;
      const command = args.slice(startIndex + 1).join(' ');
      await executeSingle(terminalId, command, configPath);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
})();
