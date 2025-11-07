/**
 * Security Manager
 * Handles IP whitelisting, command filtering, and access restrictions
 */

const fs = require('fs').promises;
const path = require('path');

const SECURITY_CONFIG = path.join(__dirname, '../config/security.json');

class SecurityManager {
  constructor() {
    this.config = null;
  }

  /**
   * Load security configuration
   */
  async loadConfig() {
    try {
      const data = await fs.readFile(SECURITY_CONFIG, 'utf-8');
      this.config = JSON.parse(data);
      return this.config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create default config if doesn't exist
        this.config = this.getDefaultConfig();
        await this.saveConfig(this.config);
        return this.config;
      }
      throw error;
    }
  }

  /**
   * Get default security configuration
   */
  getDefaultConfig() {
    return {
      "ipWhitelist": {
        "enabled": false,
        "allowedIPs": [
          "127.0.0.1",
          "::1"
        ],
        "allowedRanges": [
          "192.168.0.0/16",
          "10.0.0.0/8"
        ]
      },
      "terminalRestrictions": {
        // Terminal ID -> restrictions mapping
        "minecraft-server": {
          "allowedIPs": ["192.168.1.0/24"],
          "allowedCommands": [
            "say *",
            "list",
            "whitelist *",
            "kick *",
            "ban *",
            "pardon *",
            "save-all",
            "save-on",
            "save-off"
          ],
          "deniedCommands": [
            "stop",
            "op *",
            "deop *",
            "give *"
          ],
          "requiresApproval": [
            "ban *",
            "pardon *"
          ],
          "maxCommandsPerMinute": 10,
          "allowedUsers": ["admin", "moderator"]
        }
      },
      "commandFiltering": {
        "enabled": true,
        "globalDeniedCommands": [
          "rm -rf *",
          "rm -rf /*",
          "mkfs *",
          "dd if=*",
          ":(){ :|:& };:",
          "chmod -R 777 /",
          "wget * | sh",
          "curl * | bash"
        ],
        "globalDeniedPatterns": [
          ".*\\bsudo\\s+rm\\b.*",
          ".*\\bsudo\\s+dd\\b.*",
          ".*>/dev/sd[a-z].*"
        ]
      },
      "rateLimiting": {
        "enabled": true,
        "globalLimit": 20,
        "perUserLimit": 10,
        "windowMs": 60000
      },
      "logging": {
        "enabled": true,
        "logAllCommands": true,
        "logFailedAttempts": true,
        "logPath": "./logs/security.log"
      }
    };
  }

  /**
   * Save security configuration
   */
  async saveConfig(config) {
    await fs.writeFile(SECURITY_CONFIG, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Check if IP is allowed to access a terminal
   */
  async isIPAllowed(terminalId, clientIP) {
    if (!this.config) {
      await this.loadConfig();
    }

    // Global IP whitelist check
    if (this.config.ipWhitelist.enabled) {
      if (!this.checkIPInList(clientIP, this.config.ipWhitelist.allowedIPs, this.config.ipWhitelist.allowedRanges)) {
        return false;
      }
    }

    // Terminal-specific IP restrictions
    const terminalRestrictions = this.config.terminalRestrictions[terminalId];
    if (terminalRestrictions && terminalRestrictions.allowedIPs) {
      return this.checkIPInList(clientIP, terminalRestrictions.allowedIPs, []);
    }

    return true;
  }

  /**
   * Check if IP is in allowed list or ranges
   */
  checkIPInList(ip, allowedIPs, allowedRanges) {
    // Direct IP match
    if (allowedIPs.includes(ip)) {
      return true;
    }

    // CIDR range check
    for (const range of allowedRanges || []) {
      if (this.ipInRange(ip, range)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if IP is in CIDR range
   */
  ipInRange(ip, cidr) {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    
    const ipNum = this.ipToNumber(ip);
    const rangeNum = this.ipToNumber(range);
    
    return (ipNum & mask) === (rangeNum & mask);
  }

  /**
   * Convert IP to number
   */
  ipToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  /**
   * Check if user is allowed to access terminal
   */
  async isUserAllowed(terminalId, username) {
    if (!this.config) {
      await this.loadConfig();
    }

    const terminalRestrictions = this.config.terminalRestrictions[terminalId];
    if (!terminalRestrictions || !terminalRestrictions.allowedUsers) {
      return true; // No restrictions
    }

    return terminalRestrictions.allowedUsers.includes(username);
  }

  /**
   * Check if command is allowed for a terminal
   */
  async isCommandAllowed(terminalId, command, username) {
    if (!this.config) {
      await this.loadConfig();
    }

    // Check global denied commands first
    if (this.config.commandFiltering.enabled) {
      // Check exact matches
      for (const denied of this.config.commandFiltering.globalDeniedCommands) {
        if (this.matchPattern(command, denied)) {
          await this.logSecurityEvent('DENIED_COMMAND', { terminalId, command, username, reason: 'Global deny list' });
          return { allowed: false, reason: 'Command is globally denied' };
        }
      }

      // Check regex patterns
      for (const pattern of this.config.commandFiltering.globalDeniedPatterns) {
        const regex = new RegExp(pattern);
        if (regex.test(command)) {
          await this.logSecurityEvent('DENIED_COMMAND', { terminalId, command, username, reason: 'Global deny pattern' });
          return { allowed: false, reason: 'Command matches denied pattern' };
        }
      }
    }

    // Check terminal-specific restrictions
    const terminalRestrictions = this.config.terminalRestrictions[terminalId];
    if (!terminalRestrictions) {
      return { allowed: true };
    }

    // Check denied commands for this terminal
    if (terminalRestrictions.deniedCommands) {
      for (const denied of terminalRestrictions.deniedCommands) {
        if (this.matchPattern(command, denied)) {
          await this.logSecurityEvent('DENIED_COMMAND', { terminalId, command, username, reason: 'Terminal deny list' });
          return { allowed: false, reason: 'Command is denied for this terminal' };
        }
      }
    }

    // Check allowed commands (whitelist mode)
    if (terminalRestrictions.allowedCommands) {
      let isAllowed = false;
      for (const allowed of terminalRestrictions.allowedCommands) {
        if (this.matchPattern(command, allowed)) {
          isAllowed = true;
          break;
        }
      }
      
      if (!isAllowed) {
        await this.logSecurityEvent('DENIED_COMMAND', { terminalId, command, username, reason: 'Not in whitelist' });
        return { allowed: false, reason: 'Command is not in the allowed list' };
      }
    }

    // Check if command requires approval
    if (terminalRestrictions.requiresApproval) {
      for (const pattern of terminalRestrictions.requiresApproval) {
        if (this.matchPattern(command, pattern)) {
          await this.logSecurityEvent('APPROVAL_REQUIRED', { terminalId, command, username });
          return { allowed: false, requiresApproval: true, reason: 'Command requires approval' };
        }
      }
    }

    await this.logSecurityEvent('ALLOWED_COMMAND', { terminalId, command, username });
    return { allowed: true };
  }

  /**
   * Match command against pattern (supports wildcards)
   */
  matchPattern(command, pattern) {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars
      .replace(/\*/g, '.*'); // Convert * to .*
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(command.trim());
  }

  /**
   * Check rate limiting for terminal
   */
  async checkRateLimit(terminalId, username) {
    if (!this.config || !this.config.rateLimiting.enabled) {
      return { allowed: true };
    }

    const terminalRestrictions = this.config.terminalRestrictions[terminalId];
    const maxCommands = terminalRestrictions?.maxCommandsPerMinute || this.config.rateLimiting.perUserLimit;

    // Initialize rate limit tracking if not exists
    if (!this.rateLimitTracker) {
      this.rateLimitTracker = new Map();
    }

    const key = `${terminalId}:${username}`;
    const now = Date.now();
    const windowMs = this.config.rateLimiting.windowMs;

    if (!this.rateLimitTracker.has(key)) {
      this.rateLimitTracker.set(key, []);
    }

    const timestamps = this.rateLimitTracker.get(key);
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
    
    if (validTimestamps.length >= maxCommands) {
      await this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { terminalId, username, limit: maxCommands });
      return { 
        allowed: false, 
        reason: `Rate limit exceeded. Max ${maxCommands} commands per minute.`,
        retryAfter: Math.ceil((validTimestamps[0] + windowMs - now) / 1000)
      };
    }

    validTimestamps.push(now);
    this.rateLimitTracker.set(key, validTimestamps);

    return { allowed: true };
  }

  /**
   * Validate terminal access (combines all checks)
   */
  async validateAccess(terminalId, username, clientIP, command = null) {
    const results = {
      allowed: true,
      reasons: []
    };

    // Check IP whitelist
    const ipAllowed = await this.isIPAllowed(terminalId, clientIP);
    if (!ipAllowed) {
      results.allowed = false;
      results.reasons.push(`IP ${clientIP} is not allowed to access this terminal`);
      await this.logSecurityEvent('IP_DENIED', { terminalId, username, clientIP });
      return results;
    }

    // Check user permissions
    const userAllowed = await this.isUserAllowed(terminalId, username);
    if (!userAllowed) {
      results.allowed = false;
      results.reasons.push(`User ${username} is not allowed to access this terminal`);
      await this.logSecurityEvent('USER_DENIED', { terminalId, username, clientIP });
      return results;
    }

    // Check rate limiting
    const rateLimit = await this.checkRateLimit(terminalId, username);
    if (!rateLimit.allowed) {
      results.allowed = false;
      results.reasons.push(rateLimit.reason);
      results.retryAfter = rateLimit.retryAfter;
      return results;
    }

    // Check command if provided
    if (command) {
      const commandCheck = await this.isCommandAllowed(terminalId, command, username);
      if (!commandCheck.allowed) {
        results.allowed = false;
        results.reasons.push(commandCheck.reason);
        results.requiresApproval = commandCheck.requiresApproval;
        return results;
      }
    }

    return results;
  }

  /**
   * Log security event
   */
  async logSecurityEvent(eventType, data) {
    if (!this.config || !this.config.logging.enabled) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      ...data
    };

    const logPath = path.join(__dirname, '..', this.config.logging.logPath);
    const logDir = path.dirname(logPath);

    try {
      // Ensure log directory exists
      await fs.mkdir(logDir, { recursive: true });

      // Append to log file
      await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n', 'utf-8');
    } catch (error) {
      console.error('Failed to write security log:', error);
    }
  }

  /**
   * Get security logs
   */
  async getSecurityLogs(filters = {}) {
    if (!this.config) {
      await this.loadConfig();
    }

    const logPath = path.join(__dirname, '..', this.config.logging.logPath);

    try {
      const data = await fs.readFile(logPath, 'utf-8');
      let logs = data.split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      // Apply filters
      if (filters.terminalId) {
        logs = logs.filter(log => log.terminalId === filters.terminalId);
      }
      if (filters.username) {
        logs = logs.filter(log => log.username === filters.username);
      }
      if (filters.eventType) {
        logs = logs.filter(log => log.eventType === filters.eventType);
      }
      if (filters.startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
      }

      return logs;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}

module.exports = new SecurityManager();
