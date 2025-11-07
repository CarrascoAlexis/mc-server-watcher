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
   */
  async loadTerminalsConfig() {
    try {
      const data = await fs.readFile(TERMINALS_CONFIG, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
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
   */
  async createOrAttachSession(terminalId) {
    const terminals = await this.loadTerminalsConfig();
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
