# 🔒 Terminal Security Guide

This guide explains how to secure terminals to be only usable in specific locations and restrict commands to users.

## Table of Contents

1. [Overview](#overview)
2. [Security Features](#security-features)
3. [Configuration](#configuration)
4. [IP Whitelisting](#ip-whitelisting)
5. [Command Filtering](#command-filtering)
6. [User Restrictions](#user-restrictions)
7. [Rate Limiting](#rate-limiting)
8. [Security Logs](#security-logs)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

## Overview

The MC Server Watcher includes a comprehensive security system that allows you to:

- **Restrict terminal access by IP address** (whitelist specific IPs or ranges)
- **Filter commands** (allow/deny specific commands per terminal)
- **Limit users** (restrict which users can access which terminals)
- **Rate limiting** (prevent command spam/abuse)
- **Audit logging** (track all command executions and security events)

## Security Features

### 1. IP-Based Access Control

Restrict terminal access to specific IP addresses or ranges:
- Per-terminal IP whitelist
- Global IP whitelist
- CIDR range support (e.g., `192.168.1.0/24`)
- IPv4 and IPv6 support

### 2. Command Filtering

Multiple layers of command filtering:
- **Global deny list**: Commands denied across all terminals
- **Terminal-specific allow list**: Only these commands are permitted
- **Terminal-specific deny list**: Additional commands denied for specific terminals
- **Approval required**: Commands that need admin approval
- **Pattern matching**: Wildcard and regex support
- **CD command restriction**: Special validation for `cd` commands to prevent directory escape

**Note:** The `cd` command has special security handling. See [CD Command Security](./CD-COMMAND-SECURITY.md) for details.

### 3. User-Based Restrictions

- Assign specific users to specific terminals
- Role-based access (admin/user)
- Per-user rate limiting

### 4. Rate Limiting

- Global rate limit (commands per minute across all users)
- Per-user rate limit
- Per-terminal rate limit
- Configurable time windows

### 5. Security Logging

- Log all command executions
- Log failed access attempts
- Log denied commands
- Searchable and filterable logs

## Configuration

The security configuration is stored in `config/security.json`:

### Basic Structure

```json
{
  "ipWhitelist": { ... },
  "terminalRestrictions": { ... },
  "commandFiltering": { ... },
  "rateLimiting": { ... },
  "logging": { ... }
}
```

### Complete Example

```json
{
  "ipWhitelist": {
    "enabled": true,
    "allowedIPs": ["127.0.0.1", "::1"],
    "allowedRanges": ["192.168.0.0/16", "10.0.0.0/8"]
  },
  "terminalRestrictions": {
    "minecraft-server": {
      "allowedIPs": ["192.168.1.0/24"],
      "allowedCommands": [
        "say *",
        "list",
        "whitelist *",
        "save-all"
      ],
      "deniedCommands": [
        "stop",
        "op *"
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
      "sudo rm *",
      "shutdown *"
    ],
    "globalDeniedPatterns": [
      ".*\\|\\s*sh.*",
      ".*\\|\\s*bash.*"
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
}
```

## IP Whitelisting

### Global IP Whitelist

Restrict access to the entire application:

```json
{
  "ipWhitelist": {
    "enabled": true,
    "allowedIPs": [
      "127.0.0.1",         // Localhost
      "192.168.1.100"      // Specific IP
    ],
    "allowedRanges": [
      "192.168.0.0/16",    // Private network
      "10.0.0.0/8",        // VPN range
      "172.16.0.0/12"      // Docker network
    ]
  }
}
```

### Per-Terminal IP Restrictions

Restrict specific terminals to specific locations:

```json
{
  "terminalRestrictions": {
    "production-server": {
      "allowedIPs": [
        "192.168.1.0/24"   // Only from office network
      ]
    },
    "backup-server": {
      "allowedIPs": [
        "10.10.10.5",      // Only from backup server
        "192.168.1.100"    // Admin workstation
      ]
    }
  }
}
```

### CIDR Notation Examples

```
192.168.1.0/24    = 192.168.1.0 - 192.168.1.255 (256 addresses)
192.168.0.0/16    = 192.168.0.0 - 192.168.255.255 (65,536 addresses)
10.0.0.0/8        = 10.0.0.0 - 10.255.255.255 (16,777,216 addresses)
172.16.0.0/12     = 172.16.0.0 - 172.31.255.255 (1,048,576 addresses)
```

## Command Filtering

### Whitelist Mode (Recommended)

Only allow specific commands:

```json
{
  "terminalRestrictions": {
    "minecraft-server": {
      "allowedCommands": [
        "say *",          // Any say command
        "list",           // Exact match
        "whitelist add *",
        "whitelist remove *",
        "kick *",
        "save-all",
        "save-on",
        "save-off",
        "weather *",
        "time *"
      ]
    }
  }
}
```

**Note**: If `allowedCommands` is specified, ONLY these commands can be executed (whitelist mode).

### Blacklist Mode

Deny specific commands but allow everything else:

```json
{
  "terminalRestrictions": {
    "web-app": {
      "deniedCommands": [
        "npm install *",   // Prevent installing packages
        "rm *",            // Prevent file deletion
        "git push *",      // Prevent pushing code
        "sudo *"           // Prevent sudo usage
      ]
    }
  }
}
```

**Note**: If ONLY `deniedCommands` is specified (no `allowedCommands`), all commands except these are allowed.

### Global Deny List

Commands denied across ALL terminals:

```json
{
  "commandFiltering": {
    "enabled": true,
    "globalDeniedCommands": [
      "rm -rf *",
      "rm -rf /*",
      "mkfs *",
      "dd if=*",
      ":(){ :|:& };:",     // Fork bomb
      "chmod -R 777 /",
      "wget * | sh",
      "curl * | bash",
      "sudo rm *",
      "shutdown *",
      "reboot",
      "halt",
      "poweroff"
    ]
  }
}
```

### Pattern Matching with Regex

Use regex patterns for advanced filtering:

```json
{
  "commandFiltering": {
    "globalDeniedPatterns": [
      ".*\\bsudo\\s+rm\\b.*",     // Any sudo rm command
      ".*\\bsudo\\s+dd\\b.*",     // Any sudo dd command
      ".*>/dev/sd[a-z].*",        // Writing to disk devices
      ".*\\|\\s*sh.*",            // Piping to shell
      ".*\\|\\s*bash.*",          // Piping to bash
      ".*chmod\\s+777.*"          // Setting 777 permissions
    ]
  }
}
```

### Wildcard Patterns

Simple wildcard matching:

```
"say *"          → Matches: say hello, say test, say anything
"give * diamond" → Matches: give Player diamond, give Admin diamond
"list"           → Matches: list (exact match only)
"*"              → Matches: everything
```

### Approval Required Commands

Commands that need admin approval before execution:

```json
{
  "terminalRestrictions": {
    "minecraft-server": {
      "requiresApproval": [
        "ban *",
        "pardon *",
        "give * diamond *",
        "give * netherite *",
        "op *",
        "deop *"
      ]
    }
  }
}
```

**Note**: This feature requires manual implementation of an approval workflow.

## User Restrictions

### Per-Terminal User Access

Restrict which users can access specific terminals:

```json
{
  "terminalRestrictions": {
    "production-server": {
      "allowedUsers": ["admin"]  // Only admin can access
    },
    "minecraft-server": {
      "allowedUsers": ["admin", "moderator", "operator"]
    },
    "backup-server": {
      "allowedUsers": ["admin", "backup-user"]
    }
  }
}
```

If `allowedUsers` is not specified, all authenticated users can access the terminal.

## Rate Limiting

### Global Rate Limiting

Limit commands across all users:

```json
{
  "rateLimiting": {
    "enabled": true,
    "globalLimit": 20,      // Max 20 commands per minute globally
    "perUserLimit": 10,     // Max 10 commands per minute per user
    "windowMs": 60000       // Time window in milliseconds (1 minute)
  }
}
```

### Per-Terminal Rate Limiting

Override rate limits for specific terminals:

```json
{
  "terminalRestrictions": {
    "critical-server": {
      "maxCommandsPerMinute": 5   // Only 5 commands per minute
    },
    "test-server": {
      "maxCommandsPerMinute": 30  // Allow more commands for testing
    }
  }
}
```

## Security Logs

### Enabling Logging

```json
{
  "logging": {
    "enabled": true,
    "logAllCommands": true,
    "logFailedAttempts": true,
    "logPath": "./logs/security.log"
  }
}
```

### Log Events

The following events are logged:

- `ALLOWED_COMMAND` - Command was allowed and executed
- `DENIED_COMMAND` - Command was denied
- `IP_DENIED` - IP address was not in whitelist
- `USER_DENIED` - User doesn't have permission
- `RATE_LIMIT_EXCEEDED` - Too many commands
- `APPROVAL_REQUIRED` - Command needs approval

### Log Format

```json
{
  "timestamp": "2025-11-07T10:30:45.123Z",
  "eventType": "DENIED_COMMAND",
  "terminalId": "minecraft-server",
  "command": "op Player123",
  "username": "moderator",
  "reason": "Not in whitelist"
}
```

### Viewing Logs via API

```bash
# Get all logs
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/security/logs

# Filter by terminal
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/security/logs?terminalId=minecraft-server"

# Filter by user
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/security/logs?username=moderator"

# Filter by event type
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/security/logs?eventType=DENIED_COMMAND"

# Date range filter
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/security/logs?startDate=2025-11-01&endDate=2025-11-07"
```

## Best Practices

### 1. Use Whitelist Mode for Critical Servers

```json
{
  "terminalRestrictions": {
    "production-db": {
      "allowedCommands": [
        "SELECT *",
        "SHOW *",
        "DESCRIBE *"
      ]
    }
  }
}
```

Only explicitly allowed commands can run - safer for production.

### 2. Layer Security Controls

Combine multiple security measures:

```json
{
  "terminalRestrictions": {
    "production-server": {
      "allowedIPs": ["192.168.1.0/24"],        // IP restriction
      "allowedUsers": ["admin"],                // User restriction
      "allowedCommands": ["systemctl status *"], // Command restriction
      "maxCommandsPerMinute": 5                 // Rate limit
    }
  }
}
```

### 3. Use CIDR Ranges Instead of Individual IPs

```json
// ❌ Hard to maintain
"allowedIPs": ["192.168.1.1", "192.168.1.2", "192.168.1.3", ...]

// ✅ Better
"allowedIPs": ["192.168.1.0/24"]
```

### 4. Log Everything

```json
{
  "logging": {
    "enabled": true,
    "logAllCommands": true,      // Log successful commands too
    "logFailedAttempts": true
  }
}
```

### 5. Regular Log Reviews

Set up a cron job to review security logs:

```bash
# Daily security report
0 9 * * * grep DENIED /path/to/logs/security.log | mail -s "Security Report" admin@example.com
```

### 6. Test Security Rules

Before applying strict rules, test them:

1. Enable logging
2. Apply rules to test terminal
3. Review logs for false positives
4. Adjust rules as needed
5. Deploy to production

### 7. Document Exceptions

If you need to allow risky commands, document why:

```json
{
  "minecraft-server": {
    "allowedCommands": [
      "give * diamond *"  // EXCEPTION: Allowed for events only
    ]
  }
}
```

## Examples

### Example 1: Minecraft Server (Moderator Access)

```json
{
  "terminalRestrictions": {
    "minecraft-server": {
      "allowedIPs": ["192.168.1.0/24"],
      "allowedUsers": ["admin", "moderator"],
      "allowedCommands": [
        "say *",
        "list",
        "whitelist *",
        "kick *",
        "ban *",
        "pardon *",
        "save-all",
        "weather *",
        "time set day",
        "time set night",
        "gamemode * *"
      ],
      "deniedCommands": [
        "stop",
        "op *",
        "deop *",
        "give *"
      ],
      "maxCommandsPerMinute": 10
    }
  }
}
```

### Example 2: Production Web Server (Admin Only)

```json
{
  "terminalRestrictions": {
    "production-web": {
      "allowedIPs": ["10.0.0.0/8"],
      "allowedUsers": ["admin"],
      "allowedCommands": [
        "pm2 status",
        "pm2 logs *",
        "pm2 restart *",
        "systemctl status *",
        "tail -f *",
        "du -h *",
        "df -h"
      ],
      "maxCommandsPerMinute": 20
    }
  }
}
```

### Example 3: Backup Server (Restricted)

```json
{
  "terminalRestrictions": {
    "backup-server": {
      "allowedIPs": ["192.168.1.100"],
      "allowedUsers": ["admin", "backup-user"],
      "allowedCommands": [
        "./backup.sh",
        "./restore.sh *",
        "ls /backups/*",
        "du -h /backups/*",
        "tar -tzf *"
      ],
      "deniedCommands": [
        "rm *",
        "mv *",
        "chmod *",
        "chown *"
      ],
      "maxCommandsPerMinute": 5
    }
  }
}
```

### Example 4: Development Server (Relaxed)

```json
{
  "terminalRestrictions": {
    "dev-server": {
      "allowedUsers": ["admin", "developer", "tester"],
      "deniedCommands": [
        "rm -rf /",
        "shutdown *",
        "reboot"
      ],
      "maxCommandsPerMinute": 30
    }
  }
}
```

## API Endpoints

### Get Security Configuration

```bash
GET /api/admin/security
Authorization: Bearer <token>
```

### Update Security Configuration

```bash
PUT /api/admin/security
Authorization: Bearer <token>
Content-Type: application/json

{
  "ipWhitelist": { ... },
  "terminalRestrictions": { ... },
  ...
}
```

### Get Security Logs

```bash
GET /api/admin/security/logs?terminalId=<id>&username=<user>
Authorization: Bearer <token>
```

## Troubleshooting

### Command Always Denied

1. Check if command matches `allowedCommands` pattern
2. Check if command is in `deniedCommands`
3. Check if command is in `globalDeniedCommands`
4. Check logs for exact reason: `grep DENIED logs/security.log`

### IP Always Blocked

1. Verify client IP: Check request headers
2. Verify CIDR range calculation
3. Check if global whitelist is enabled
4. Check terminal-specific IP restrictions

### Rate Limit Issues

1. Check `maxCommandsPerMinute` setting
2. Wait for time window to reset
3. Check logs for exact limit: `grep RATE_LIMIT logs/security.log`

### User Access Denied

1. Verify user exists in terminal's `allowedUsers`
2. Check if user is authenticated
3. Verify user role (admin vs user)

## Migration from Unsecured Setup

1. **Backup current configuration**
   ```bash
   cp config/terminals.json config/terminals.json.backup
   ```

2. **Enable logging first**
   ```json
   {
     "logging": {
       "enabled": true,
       "logAllCommands": true,
       "logFailedAttempts": true
     }
   }
   ```

3. **Monitor normal usage for 24-48 hours**

4. **Create whitelist based on logs**

5. **Test with single terminal**

6. **Roll out to all terminals**

7. **Monitor and adjust**

## Support

For security issues or questions:
- Check logs: `logs/security.log`
- Review configuration: `config/security.json`
- Open an issue on GitHub

---

**Last Updated:** 2025-11-07  
**Version:** 1.0.0
