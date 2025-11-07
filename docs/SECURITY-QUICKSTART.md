# Quick Security Setup Guide

## 🎯 Goal
Secure your terminals to be only usable in specific places and allow only specific commands to users.

## ⚡ Quick Start (5 minutes)

### Step 1: Enable Security Logging
Edit `config/security.json`:
```json
{
  "logging": {
    "enabled": true,
    "logAllCommands": true,
    "logFailedAttempts": true
  }
}
```

### Step 2: Restrict by IP (Office/Home Network Only)
```json
{
  "ipWhitelist": {
    "enabled": true,
    "allowedRanges": [
      "192.168.1.0/24"    // Your local network
    ]
  }
}
```

### Step 3: Restrict Commands (Minecraft Example)
```json
{
  "terminalRestrictions": {
    "minecraft-server": {
      "allowedUsers": ["admin", "moderator"],
      "allowedCommands": [
        "say *",
        "list",
        "save-all",
        "kick *"
      ],
      "deniedCommands": [
        "stop",
        "op *"
      ]
    }
  }
}
```

### Step 4: Restart Server
```bash
npm run restart
# or
pm2 restart mc-watcher
```

## 🔍 Testing

### Test IP Restriction
```bash
# From allowed IP - Should work
curl -X POST http://localhost:3000/api/execute-channel \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"terminalId":"minecraft-server","command":"list"}'

# From denied IP - Should fail with 403
```

### Test Command Filtering
```bash
# Allowed command - Should work
node scripts/tmux-exec.js minecraft-server "say Hello"

# Denied command - Should fail
node scripts/tmux-exec.js minecraft-server "stop"
```

### Check Logs
```bash
tail -f logs/security.log
```

## 📊 Common Scenarios

### Scenario 1: Minecraft Server for Moderators
Only allow safe moderator commands:

```json
{
  "terminalRestrictions": {
    "minecraft-server": {
      "allowedUsers": ["admin", "moderator"],
      "allowedIPs": ["192.168.1.0/24"],
      "allowedCommands": [
        "say *",
        "list",
        "whitelist *",
        "kick *",
        "save-all",
        "weather *",
        "time *"
      ],
      "deniedCommands": [
        "stop",
        "op *",
        "deop *"
      ],
      "maxCommandsPerMinute": 10
    }
  }
}
```

### Scenario 2: Production Server (Admin Only)
Lock down production to admins from office only:

```json
{
  "terminalRestrictions": {
    "production-web": {
      "allowedUsers": ["admin"],
      "allowedIPs": ["10.0.0.0/8"],
      "allowedCommands": [
        "pm2 status",
        "pm2 logs *",
        "systemctl status *",
        "tail -f *"
      ],
      "maxCommandsPerMinute": 20
    }
  }
}
```

### Scenario 3: Backup Server (Restricted Operations)
Allow only backup operations:

```json
{
  "terminalRestrictions": {
    "backup-server": {
      "allowedUsers": ["admin", "backup-user"],
      "allowedCommands": [
        "./backup.sh",
        "./restore.sh *",
        "ls /backups/*",
        "du -h *"
      ],
      "deniedCommands": [
        "rm *",
        "mv *",
        "chmod *"
      ],
      "maxCommandsPerMinute": 5
    }
  }
}
```

## 🛡️ Security Levels

### Level 1: Basic (IP + User Restrictions)
```json
{
  "ipWhitelist": {
    "enabled": true,
    "allowedRanges": ["192.168.0.0/16"]
  },
  "terminalRestrictions": {
    "my-server": {
      "allowedUsers": ["admin"]
    }
  }
}
```

### Level 2: Moderate (+ Command Blacklist)
```json
{
  "terminalRestrictions": {
    "my-server": {
      "allowedUsers": ["admin", "moderator"],
      "deniedCommands": [
        "stop",
        "shutdown *",
        "rm *"
      ]
    }
  },
  "commandFiltering": {
    "enabled": true,
    "globalDeniedCommands": [
      "rm -rf *",
      "sudo rm *"
    ]
  }
}
```

### Level 3: High (+ Command Whitelist)
```json
{
  "terminalRestrictions": {
    "my-server": {
      "allowedUsers": ["admin"],
      "allowedIPs": ["192.168.1.100"],
      "allowedCommands": [
        "status",
        "list",
        "save-all"
      ],
      "maxCommandsPerMinute": 5
    }
  }
}
```

### Level 4: Maximum (All Restrictions + Logging)
```json
{
  "ipWhitelist": {
    "enabled": true,
    "allowedIPs": ["192.168.1.100"]
  },
  "terminalRestrictions": {
    "critical-server": {
      "allowedUsers": ["admin"],
      "allowedIPs": ["192.168.1.100"],
      "allowedCommands": [
        "systemctl status *",
        "tail -n 100 *"
      ],
      "maxCommandsPerMinute": 3
    }
  },
  "rateLimiting": {
    "enabled": true,
    "perUserLimit": 5
  },
  "logging": {
    "enabled": true,
    "logAllCommands": true,
    "logFailedAttempts": true
  }
}
```

## 🔧 Management via API

### View Current Security Config
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/security
```

### Update Security Config
```bash
curl -X PUT http://localhost:3000/api/admin/security \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @config/security.json
```

### View Security Logs
```bash
# All logs
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/security/logs

# Denied commands only
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/security/logs?eventType=DENIED_COMMAND"

# Specific terminal
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/security/logs?terminalId=minecraft-server"
```

## 🚨 Important Notes

### ⚠️ IP Detection
The system detects IP from:
1. `X-Forwarded-For` header (if behind proxy/load balancer)
2. `X-Real-IP` header
3. Direct connection IP

If using NGINX/proxy, make sure to configure headers:
```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

### ⚠️ Wildcard Patterns
- `*` matches anything
- `say *` matches "say hello", "say test", etc.
- `give * diamond` matches "give Player diamond", "give Admin diamond"
- Patterns are case-insensitive

### ⚠️ Priority Order
Security checks happen in this order:
1. Global IP whitelist
2. Terminal-specific IP restrictions
3. User permissions
4. Rate limiting
5. Global denied commands
6. Terminal denied commands
7. Terminal allowed commands (if specified)

If ANY check fails, the command is denied.

## 📈 Monitoring

### Daily Security Report
```bash
# Add to crontab
0 9 * * * grep -E "DENIED|FAILED" /path/to/logs/security.log | \
  mail -s "Daily Security Report" admin@example.com
```

### Real-time Monitoring
```bash
# Watch security log
tail -f logs/security.log | grep DENIED

# Count denied commands per hour
watch -n 60 'grep DENIED logs/security.log | wc -l'
```

## 🔄 Rollback

If something goes wrong:

```bash
# Disable security temporarily
cat > config/security.json << EOF
{
  "ipWhitelist": { "enabled": false },
  "commandFiltering": { "enabled": false },
  "rateLimiting": { "enabled": false }
}
EOF

# Restart
pm2 restart mc-watcher
```

## ✅ Checklist

Before going to production:

- [ ] Security logging enabled
- [ ] Tested IP restrictions
- [ ] Tested command filtering
- [ ] Verified user access
- [ ] Monitored logs for 24 hours
- [ ] Documented exceptions
- [ ] Set up log monitoring/alerts
- [ ] Configured rate limiting
- [ ] Backup security config

## 📚 Full Documentation

For complete details, see: [TERMINAL-SECURITY.md](TERMINAL-SECURITY.md)

---

**Last Updated:** 2025-11-07
