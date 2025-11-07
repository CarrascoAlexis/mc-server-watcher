/**
 * MC Server Watcher - Tmux Channel Client
 * 
 * A JavaScript client library for interacting with the MC Server Watcher
 * tmux channel execution API. Can be used in Node.js applications or browsers.
 * 
 * @author Alexis Carrasco
 * @version 1.0.0
 */

class TmuxChannelClient {
  /**
   * Create a new TmuxChannelClient
   * @param {string} apiUrl - The base URL of the MC Server Watcher API
   * @param {string} token - JWT authentication token
   */
  constructor(apiUrl = 'http://localhost:3000', token = '') {
    this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  /**
   * Set authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Make authenticated request
   * @private
   */
  async _request(endpoint, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.apiUrl}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Execute command on a single tmux channel
   * @param {string} terminalId - Terminal ID from config
   * @param {string} command - Command to execute
   * @param {string} configPath - Optional custom config file path
   * @returns {Promise<Object>} Execution result
   */
  async executeOnChannel(terminalId, command, configPath = null) {
    return await this._request('/api/execute-channel', 'POST', {
      terminalId,
      command,
      configPath
    });
  }

  /**
   * Execute command on multiple tmux channels
   * @param {Array<string>} terminalIds - Array of terminal IDs
   * @param {string} command - Command to execute
   * @param {string} configPath - Optional custom config file path
   * @returns {Promise<Array>} Array of execution results
   */
  async executeOnMultipleChannels(terminalIds, command, configPath = null) {
    return await this._request('/api/execute-multiple-channels', 'POST', {
      terminalIds,
      command,
      configPath
    });
  }

  /**
   * Execute command on all configured tmux channels
   * @param {string} command - Command to execute
   * @param {string} configPath - Optional custom config file path
   * @returns {Promise<Array>} Array of execution results
   */
  async executeOnAllChannels(command, configPath = null) {
    return await this._request('/api/execute-all-channels', 'POST', {
      command,
      configPath
    });
  }

  /**
   * Get list of all configured terminals
   * @returns {Promise<Array>} Array of terminal configurations
   */
  async getTerminals() {
    return await this._request('/api/terminals', 'GET');
  }

  /**
   * Verify authentication token
   * @returns {Promise<Object>} Verification result
   */
  async verifyToken() {
    return await this._request('/api/verify', 'GET');
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Basic usage
 */
async function example1() {
  const client = new TmuxChannelClient('http://localhost:3000', 'YOUR_JWT_TOKEN');

  try {
    // Execute on single channel
    const result = await client.executeOnChannel('minecraft-server', 'say Hello from API!');
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 2: Batch operations
 */
async function example2() {
  const client = new TmuxChannelClient('http://localhost:3000', 'YOUR_JWT_TOKEN');

  try {
    // Execute on multiple channels
    const results = await client.executeOnMultipleChannels(
      ['minecraft-server', 'backup-server'],
      'uptime'
    );
    
    results.forEach(result => {
      if (result.success) {
        console.log(`✓ ${result.terminalId}: ${result.message}`);
      } else {
        console.log(`✗ ${result.terminalId}: ${result.error}`);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 3: Execute on all channels
 */
async function example3() {
  const client = new TmuxChannelClient('http://localhost:3000', 'YOUR_JWT_TOKEN');

  try {
    const results = await client.executeOnAllChannels('date');
    console.log(`Executed on ${results.length} channels:`, results);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 4: Minecraft server automation
 */
async function minecraftAutomation() {
  const client = new TmuxChannelClient('http://localhost:3000', 'YOUR_JWT_TOKEN');

  try {
    // Announce maintenance
    await client.executeOnChannel('minecraft-server', 'say Server maintenance in 5 minutes!');
    
    // Wait 4 minutes
    await new Promise(resolve => setTimeout(resolve, 4 * 60 * 1000));
    
    // Final warning
    await client.executeOnChannel('minecraft-server', 'say Server restarting in 1 minute!');
    
    // Wait 1 minute
    await new Promise(resolve => setTimeout(resolve, 60 * 1000));
    
    // Save world
    await client.executeOnChannel('minecraft-server', 'save-all');
    
    // Stop server
    await client.executeOnChannel('minecraft-server', 'stop');
    
    console.log('Maintenance sequence completed');
  } catch (error) {
    console.error('Maintenance failed:', error.message);
  }
}

/**
 * Example 5: Monitoring dashboard
 */
async function monitoringDashboard() {
  const client = new TmuxChannelClient('http://localhost:3000', 'YOUR_JWT_TOKEN');

  async function checkStatus() {
    try {
      const terminals = await client.getTerminals();
      const results = await client.executeOnAllChannels('echo "Status check: $(date)"');
      
      console.log('\n=== Server Status ===');
      results.forEach(result => {
        const terminal = terminals.find(t => t.id === result.terminalId);
        console.log(`${terminal?.name || result.terminalId}: ${result.success ? '✓ Online' : '✗ Offline'}`);
      });
    } catch (error) {
      console.error('Status check failed:', error.message);
    }
  }

  // Check every 5 minutes
  setInterval(checkStatus, 5 * 60 * 1000);
  checkStatus(); // Initial check
}

/**
 * Example 6: Custom config file
 */
async function customConfig() {
  const client = new TmuxChannelClient('http://localhost:3000', 'YOUR_JWT_TOKEN');

  try {
    // Use production config
    await client.executeOnChannel(
      'prod-server',
      'deploy.sh',
      '/etc/mc-watcher/production-terminals.json'
    );
    
    // Use staging config
    await client.executeOnChannel(
      'staging-server',
      'deploy.sh',
      '/etc/mc-watcher/staging-terminals.json'
    );
  } catch (error) {
    console.error('Deployment failed:', error.message);
  }
}

/**
 * Example 7: Error handling and retry logic
 */
async function robustExecution() {
  const client = new TmuxChannelClient('http://localhost:3000', 'YOUR_JWT_TOKEN');

  async function executeWithRetry(terminalId, command, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await client.executeOnChannel(terminalId, command);
        console.log(`Success on attempt ${attempt}:`, result);
        return result;
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  try {
    await executeWithRetry('minecraft-server', 'save-all');
  } catch (error) {
    console.error('Final error:', error.message);
  }
}

/**
 * Example 8: Scheduled backup automation
 */
async function scheduledBackup() {
  const client = new TmuxChannelClient('http://localhost:3000', 'YOUR_JWT_TOKEN');

  async function runBackup() {
    console.log('Starting backup sequence...');
    
    try {
      // 1. Announce backup
      await client.executeOnChannel('minecraft-server', 'say Starting automatic backup...');
      
      // 2. Save world
      await client.executeOnChannel('minecraft-server', 'save-all');
      
      // 3. Disable auto-save
      await client.executeOnChannel('minecraft-server', 'save-off');
      
      // 4. Run backup script
      await client.executeOnChannel('backup-server', './backup-minecraft.sh');
      
      // 5. Wait for backup to complete (assume 30 seconds)
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // 6. Re-enable auto-save
      await client.executeOnChannel('minecraft-server', 'save-on');
      
      // 7. Announce completion
      await client.executeOnChannel('minecraft-server', 'say Backup completed!');
      
      console.log('Backup sequence completed successfully');
    } catch (error) {
      console.error('Backup failed:', error.message);
      
      // Try to recover
      try {
        await client.executeOnChannel('minecraft-server', 'save-on');
        await client.executeOnChannel('minecraft-server', 'say Backup failed - auto-save restored');
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError.message);
      }
    }
  }

  // Run backup every 6 hours
  setInterval(runBackup, 6 * 60 * 60 * 1000);
  runBackup(); // Initial backup
}

// ============================================================================
// Export for Node.js or Browser
// ============================================================================

// Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TmuxChannelClient;
}

// Browser (global)
if (typeof window !== 'undefined') {
  window.TmuxChannelClient = TmuxChannelClient;
}

// ES6 Module
if (typeof exports !== 'undefined') {
  exports.TmuxChannelClient = TmuxChannelClient;
}
