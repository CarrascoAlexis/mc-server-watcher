const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const STARTUP_CONFIG = path.join(__dirname, '../config/startup-tasks.json');

class StartupManager {
  constructor() {
    this.isLinux = os.platform() === 'linux';
  }

  /**
   * Load startup tasks configuration
   */
  async loadStartupTasks() {
    try {
      const data = await fs.readFile(STARTUP_CONFIG, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Save startup tasks configuration
   */
  async saveStartupTasks(tasks) {
    try {
      await fs.writeFile(STARTUP_CONFIG, JSON.stringify(tasks, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to save startup tasks: ${error.message}`);
    }
  }

  /**
   * Execute system command
   */
  async execCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed: ${stderr}`));
        }
      });
    });
  }

  /**
   * Generate systemd service file content
   */
  generateServiceFile(task) {
    const user = task.user || process.env.USER || 'root';
    const restart = task.restartPolicy || 'always';
    
    return `[Unit]
Description=${task.description || task.name}
After=network.target

[Service]
Type=simple
User=${user}
WorkingDirectory=${task.workingDirectory}
ExecStart=${task.command}
Restart=${restart}
RestartSec=10

StandardOutput=journal
StandardError=journal
SyslogIdentifier=${task.name}

[Install]
WantedBy=multi-user.target
`;
  }

  /**
   * Create systemd service
   */
  async createService(task) {
    if (!this.isLinux) {
      throw new Error('Startup tasks are only supported on Linux with systemd');
    }

    try {
      const serviceContent = this.generateServiceFile(task);
      const servicePath = `/etc/systemd/system/${task.name}.service`;

      // Write service file (requires sudo)
      const tempFile = `/tmp/${task.name}.service`;
      await fs.writeFile(tempFile, serviceContent);

      // Move to systemd directory (would need sudo in production)
      // For now, we'll return the content for manual installation
      return {
        success: true,
        servicePath,
        content: serviceContent,
        tempFile,
        message: 'Service file created. Manual installation required with sudo.'
      };
    } catch (error) {
      throw new Error(`Failed to create service: ${error.message}`);
    }
  }

  /**
   * Get service status
   */
  async getServiceStatus(serviceName) {
    if (!this.isLinux) {
      return { status: 'unavailable', message: 'Not on Linux' };
    }

    try {
      const output = await this.execCommand('systemctl', ['is-active', serviceName]);
      return { status: output.trim(), active: output.trim() === 'active' };
    } catch (error) {
      return { status: 'inactive', active: false };
    }
  }

  /**
   * Get all services status
   */
  async getAllServicesStatus() {
    const tasks = await this.loadStartupTasks();
    const statuses = await Promise.all(
      tasks.map(async (task) => {
        const status = await this.getServiceStatus(task.name);
        return {
          ...task,
          status: status.status,
          active: status.active
        };
      })
    );
    return statuses;
  }

  /**
   * Enable service at startup
   */
  async enableService(serviceName) {
    if (!this.isLinux) {
      throw new Error('Not supported on this platform');
    }

    try {
      await this.execCommand('sudo', ['systemctl', 'enable', serviceName]);
      return { success: true, message: 'Service enabled at startup' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Disable service at startup
   */
  async disableService(serviceName) {
    if (!this.isLinux) {
      throw new Error('Not supported on this platform');
    }

    try {
      await this.execCommand('sudo', ['systemctl', 'disable', serviceName]);
      return { success: true, message: 'Service disabled from startup' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Start service
   */
  async startService(serviceName) {
    if (!this.isLinux) {
      throw new Error('Not supported on this platform');
    }

    try {
      await this.execCommand('sudo', ['systemctl', 'start', serviceName]);
      return { success: true, message: 'Service started' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Stop service
   */
  async stopService(serviceName) {
    if (!this.isLinux) {
      throw new Error('Not supported on this platform');
    }

    try {
      await this.execCommand('sudo', ['systemctl', 'stop', serviceName]);
      return { success: true, message: 'Service stopped' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Restart service
   */
  async restartService(serviceName) {
    if (!this.isLinux) {
      throw new Error('Not supported on this platform');
    }

    try {
      await this.execCommand('sudo', ['systemctl', 'restart', serviceName]);
      return { success: true, message: 'Service restarted' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new StartupManager();
