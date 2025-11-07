# 🔒 Terminal Security - Implementation Summary

## What Has Been Added

### 1. Security Manager (`server/security-manager.js`)

A comprehensive security module that provides:

✅ **IP-Based Access Control**
- Per-terminal IP whitelisting
- Global IP whitelist
- CIDR range support (e.g., `192.168.1.0/24`)
- IPv4 and IPv6 compatible

✅ **Command Filtering**
- Global denied commands list
- Per-terminal allowed commands (whitelist mode)
- Per-terminal denied commands (blacklist mode)
- Pattern matching with wildcards
- Regex pattern support

✅ **User-Based Restrictions**
- Per-terminal user access control
- Role-based permissions
- User authentication validation

✅ **Rate Limiting**
- Global rate limits
- Per-user rate limits
- Per-terminal rate limits
- Configurable time windows

✅ **Security Logging**
- All command executions logged
- Failed access attempts logged
- Denied commands logged
- Searchable and filterable logs

### 2. Security Configuration (`config/security.json`)

Pre-configured with sensible defaults:

- **IP Whitelist**: Disabled by default (enable for production)
- **Terminal Restrictions**: Examples for minecraft-server, backup-server, web-app
- **Command Filtering**: Global dangerous commands blocked
- **Rate Limiting**: 10 commands/minute per user
- **Logging**: Enabled with full audit trail

### 3. API Integration

Security checks integrated into:

- ✅ `/api/execute-channel` - Single channel execution
- ✅ `/api/execute-multiple-channels` - Multiple channels execution
- ✅ `/api/execute-all-channels` - All channels execution
- ✅ WebSocket `send-command` event - Real-time terminal commands

New admin routes added:

- `GET /api/admin/security` - Get security configuration
- `PUT /api/admin/security` - Update security configuration
- `GET /api/admin/security/logs` - Get security logs with filters

### 4. Documentation

Complete security documentation:

- **docs/TERMINAL-SECURITY.md** - Full security guide (700+ lines)
- **docs/SECURITY-QUICKSTART.md** - Quick setup guide
- Pre-configured examples for common scenarios

## How It Works

### Security Flow

```
User sends command
    ↓
1. IP Whitelist Check
    ↓ (pass)
2. Terminal IP Restriction Check
    ↓ (pass)
3. User Permission Check
    ↓ (pass)
4. Rate Limit Check
    ↓ (pass)
5. Global Denied Commands Check
    ↓ (pass)
6. Terminal Denied Commands Check
    ↓ (pass)
7. Terminal Allowed Commands Check (if whitelist mode)
    ↓ (pass)
8. Command Execution
    ↓
9. Security Event Logged
```

If ANY check fails → Command is DENIED

### Response Codes

- **200 OK** - Command allowed and executed
- **403 Forbidden** - Access denied (with reasons)
- **429 Too Many Requests** - Rate limit exceeded (with retry-after)
- **500 Internal Server Error** - System error

## Usage Examples

### Example 1: Restrict Minecraft Server to Office Network

```json
{
  "terminalRestrictions": {
    "minecraft-server": {
      "allowedIPs": ["192.168.1.0/24"],
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

**Result:**
- ✅ Moderators from office (192.168.1.x) can use allowed commands
- ❌ Users from home cannot access (IP denied)
- ❌ Moderators cannot use `stop` or `op` (denied commands)
- ❌ Moderators cannot use `give` (not in allowed list)

### Example 2: Production Server (Maximum Security)

```json
{
  "terminalRestrictions": {
    "production-web": {
      "allowedIPs": ["192.168.1.100"],  // Single admin workstation
      "allowedUsers": ["admin"],         // Admin only
      "allowedCommands": [
        "pm2 status",
        "systemctl status *",
        "tail -n 100 *"
      ],
      "maxCommandsPerMinute": 5
    }
  }
}
```

**Result:**
- ✅ Only admin from specific workstation can access
- ✅ Only read-only commands allowed
- ✅ Maximum 5 commands per minute

### Example 3: Development Server (Relaxed)

```json
{
  "terminalRestrictions": {
    "dev-server": {
      "allowedUsers": ["admin", "developer"],
      "deniedCommands": [
        "rm -rf /",
        "shutdown *"
      ]
    }
  }
}
```

**Result:**
- ✅ Any IP can access
- ✅ Developers have access
- ✅ Most commands allowed
- ❌ Dangerous commands blocked

## Security Responses

### Success Response
```json
{
  "success": true,
  "sessionName": "mc-server",
  "command": "say Hello",
  "message": "Command executed on mc-server"
}
```

### Denied Response (IP)
```json
{
  "error": "Access denied",
  "reasons": [
    "IP 203.0.113.5 is not allowed to access this terminal"
  ]
}
```

### Denied Response (Command)
```json
{
  "error": "Access denied",
  "reasons": [
    "Command is not in the allowed list"
  ]
}
```

### Rate Limit Response
```json
{
  "error": "Access denied",
  "reasons": [
    "Rate limit exceeded. Max 10 commands per minute."
  ],
  "retryAfter": 45
}
```

## Security Log Format

Each security event is logged:

```json
{
  "timestamp": "2025-11-07T10:30:45.123Z",
  "eventType": "DENIED_COMMAND",
  "terminalId": "minecraft-server",
  "command": "op Player123",
  "username": "moderator",
  "reason": "Not in whitelist",
  "clientIP": "192.168.1.50"
}
```

### Event Types

- `ALLOWED_COMMAND` - Command executed successfully
- `DENIED_COMMAND` - Command denied by filters
- `IP_DENIED` - IP not in whitelist
- `USER_DENIED` - User not allowed
- `RATE_LIMIT_EXCEEDED` - Too many commands
- `APPROVAL_REQUIRED` - Command needs approval

## Quick Setup

### 1. Enable for Specific Terminal

Edit `config/security.json`:

```json
{
  "terminalRestrictions": {
    "your-terminal-id": {
      "allowedIPs": ["192.168.1.0/24"],
      "allowedUsers": ["admin"],
      "allowedCommands": [
        "status",
        "list",
        "help"
      ]
    }
  }
}
```

### 2. Restart Server

```bash
npm run restart
# or
pm2 restart mc-watcher
```

### 3. Test

```bash
# Should work (if from allowed IP)
node scripts/tmux-exec.js your-terminal-id "status"

# Should fail
node scripts/tmux-exec.js your-terminal-id "dangerous-command"
```

### 4. Check Logs

```bash
tail -f logs/security.log
```

## Best Practices

### ✅ DO

1. **Use IP whitelisting for production servers**
   ```json
   "allowedIPs": ["192.168.1.0/24"]
   ```

2. **Use whitelist mode (allowedCommands) for critical systems**
   ```json
   "allowedCommands": ["safe-command1", "safe-command2"]
   ```

3. **Enable logging**
   ```json
   "logging": { "enabled": true, "logAllCommands": true }
   ```

4. **Use CIDR ranges instead of individual IPs**
   ```json
   "allowedIPs": ["192.168.1.0/24"]  // Better than listing all IPs
   ```

5. **Set rate limits**
   ```json
   "maxCommandsPerMinute": 10
   ```

### ❌ DON'T

1. **Don't disable security in production**
2. **Don't use wildcards in allowedCommands without thought**
3. **Don't forget to monitor security logs**
4. **Don't allow dangerous commands**
5. **Don't skip testing security rules**

## Monitoring

### View Security Logs via API

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

# Specific user
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/security/logs?username=moderator"

# Date range
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/admin/security/logs?startDate=2025-11-01&endDate=2025-11-07"
```

### Set Up Alerts

```bash
# Email on denied commands (add to crontab)
*/5 * * * * grep DENIED /path/to/logs/security.log | tail -n 10 | \
  mail -s "Security Alert: Denied Commands" admin@example.com
```

## Migration Guide

### From Unsecured to Secured

1. **Enable logging only (monitor normal usage)**
   ```json
   { "logging": { "enabled": true } }
   ```

2. **Monitor for 24-48 hours**

3. **Create whitelist from logs**

4. **Test on non-critical terminal first**

5. **Gradually roll out to all terminals**

6. **Monitor and adjust**

## Files Modified

- ✅ `server/security-manager.js` - NEW security module
- ✅ `server/index.js` - Integrated security checks
- ✅ `config/security.json` - NEW security configuration
- ✅ `docs/TERMINAL-SECURITY.md` - NEW complete guide
- ✅ `docs/SECURITY-QUICKSTART.md` - NEW quick guide
- ✅ `README.md` - Updated with security features

## API Reference

### Get Security Config
```
GET /api/admin/security
Authorization: Bearer <token>
```

### Update Security Config
```
PUT /api/admin/security
Authorization: Bearer <token>
Content-Type: application/json

{ security config object }
```

### Get Security Logs
```
GET /api/admin/security/logs?terminalId=<id>&username=<user>&eventType=<type>
Authorization: Bearer <token>
```

## Support

- **Full Documentation**: [docs/TERMINAL-SECURITY.md](../docs/TERMINAL-SECURITY.md)
- **Quick Start**: [docs/SECURITY-QUICKSTART.md](../docs/SECURITY-QUICKSTART.md)
- **Main README**: [README.md](../README.md)

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-07  
**Status:** ✅ Production Ready
