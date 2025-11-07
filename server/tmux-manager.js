const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const TERMINALS_CONFIG = path.join(__dirname, '../config/terminals.json');

class TmuxManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Load terminals configuration
   * @param {string} configPath - Optional custom config file path
   */
  async loadTerminalsConfig(configPath = null) {
    try {
      const filePath = configPath || TERMINALS_CONFIG;
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Save terminals configuration
   */
  async saveTerminals(terminals) {
    try {
      await fs.writeFile(TERMINALS_CONFIG, JSON.stringify(terminals, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to save terminals: ${error.message}`);
    }
  }

  /**
   * Execute tmux command
   */
  async execTmux(args) {
    return new Promise((resolve, reject) => {
      const tmux = spawn('tmux', args);
      let stdout = '';
      let stderr = '';

      tmux.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      tmux.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      tmux.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`tmux command failed: ${stderr}`));
        }
      });
    });
  }

  /**
   * Check if tmux session exists
   */
  async sessionExists(sessionName) {
    try {
      await this.execTmux(['has-session', '-t', sessionName]);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create or attach to tmux session
   * @param {string} terminalId - Terminal ID
   * @param {string} configPath - Optional custom config file path
   */
  async createOrAttachSession(terminalId, configPath = null) {
    const terminals = await this.loadTerminalsConfig(configPath);
    const terminal = terminals.find(t => t.id === terminalId);

    if (!terminal) {
      throw new Error('Terminal not found in configuration');
    }

    const sessionName = terminal.sessionName || terminal.id;
    const exists = await this.sessionExists(sessionName);

    if (!exists) {
      // Create new session
      const args = ['new-session', '-d', '-s', sessionName];
      
      if (terminal.workingDirectory) {
        args.push('-c', terminal.workingDirectory);
      }

      if (terminal.initialCommand) {
        args.push(terminal.initialCommand);
      }

      await this.execTmux(args);
      console.log(`Created tmux session: ${sessionName}`);
    }

    return {
      sessionName,
      terminal,
      exists
    };
  }

  /**
   * Execute command on tmux channel using config file
   * @param {string} terminalId - Terminal ID from config
   * @param {string} command - Command to execute
   * @param {string} configPath - Optional custom config file path
   */
  async executeOnChannel(terminalId, command, configPath = null) {
    try {
      // Load configuration
      const terminals = await this.loadTerminalsConfig(configPath);
      const terminal = terminals.find(t => t.id === terminalId);

      if (!terminal) {
        throw new Error(`Terminal '${terminalId}' not found in configuration`);
      }

      const sessionName = terminal.sessionName || terminal.id;
      
      // Check if session exists, create if not
      const exists = await this.sessionExists(sessionName);
      
      if (!exists) {
        console.log(`Session ${sessionName} doesn't exist, creating it...`);
        await this.createOrAttachSession(terminalId, configPath);
      }

      // Send command to the session
      await this.sendCommand(sessionName, command);

      return {
        success: true,
        sessionName,
        terminal,
        command,
        message: `Command executed on ${sessionName}`
      };
    } catch (error) {
      throw new Error(`Failed to execute on channel: ${error.message}`);
    }
  }

  /**
   * Execute command on multiple channels
   * @param {Array<string>} terminalIds - Array of terminal IDs
   * @param {string} command - Command to execute
   * @param {string} configPath - Optional custom config file path
   */
  async executeOnMultipleChannels(terminalIds, command, configPath = null) {
    const results = [];
    
    for (const terminalId of terminalIds) {
      try {
        const result = await this.executeOnChannel(terminalId, command, configPath);
        results.push({ terminalId, ...result });
      } catch (error) {
        results.push({
          terminalId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Execute command on all channels from config
   * @param {string} command - Command to execute
   * @param {string} configPath - Optional custom config file path
   */
  async executeOnAllChannels(command, configPath = null) {
    try {
      const terminals = await this.loadTerminalsConfig(configPath);
      
      if (terminals.length === 0) {
        throw new Error('No terminals found in configuration');
      }

      const terminalIds = terminals.map(t => t.id);
      return await this.executeOnMultipleChannels(terminalIds, command, configPath);
    } catch (error) {
      throw new Error(`Failed to execute on all channels: ${error.message}`);
    }
  }

  /**
   * Send command to tmux session
   */
  async sendCommand(sessionName, command) {
    try {
      await this.execTmux(['send-keys', '-t', sessionName, command, 'C-m']);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to send command: ${error.message}`);
    }
  }

  /**
   * Capture pane output
   */
  async captureOutput(sessionName, lines = 100) {
    try {
      const output = await this.execTmux([
        'capture-pane',
        '-t',
        sessionName,
        '-p',
        '-S',
        `-${lines}`
      ]);
      return output;
    } catch (error) {
      throw new Error(`Failed to capture output: ${error.message}`);
    }
  }

  /**
   * List all tmux sessions
   */
  async listSessions() {
    try {
      const output = await this.execTmux(['list-sessions', '-F', '#{session_name}']);
      return output.trim().split('\n').filter(s => s);
    } catch (error) {
      // No sessions exist
      return [];
    }
  }

  /**
   * Kill tmux session
   */
  async killSession(sessionName) {
    try {
      await this.execTmux(['kill-session', '-t', sessionName]);
      return { success: true, message: `Session ${sessionName} killed` };
    } catch (error) {
      throw new Error(`Failed to kill session: ${error.message}`);
    }
  }

  /**
   * Get terminal info by ID
   */
  async getTerminalInfo(terminalId) {
    const terminals = await this.loadTerminalsConfig();
    return terminals.find(t => t.id === terminalId);
  }

  /**
   * Get all terminals
   */
  async getAllTerminals() {
    return await this.loadTerminalsConfig();
  }

  /**
   * Get terminals accessible by user
   */
  async getUserTerminals(userTerminalIds) {
    const allTerminals = await this.loadTerminalsConfig();
    return allTerminals.filter(t => userTerminalIds.includes(t.id));
  }

  /**
   * Stream terminal output (for WebSocket)
   */
  streamOutput(sessionName, callback, interval = 500) {
    let lastOutput = '';
    
    const stream = setInterval(async () => {
      try {
        const output = await this.captureOutput(sessionName, 50);
        if (output !== lastOutput) {
          callback(output);
          lastOutput = output;
        }
      } catch (error) {
        console.error('Stream error:', error);
        clearInterval(stream);
      }
    }, interval);

    return () => clearInterval(stream);
  }
}

module.exports = new TmuxManager();
