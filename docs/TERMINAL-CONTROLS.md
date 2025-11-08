# Terminal Control Buttons - Quick Reference

## Overview

Added start/stop/restart/git-pull buttons to the dashboard for easy server management.

## Configuration (terminals.json)

Each terminal now supports these fields:

```json
{
  "id": "terminal-id",
  "startCommand": "npm start",           // Command to start the server
  "stopCommand": "",                     // Command to stop (empty = Ctrl+C)
  "restartCommand": "",                  // Custom restart command (optional)
  "hasGitRepo": true                     // Show git pull button
}
```

## Button Behavior

### ▶️ Start Button
- **Shows when:** `startCommand` is configured
- **Does:** Executes the `startCommand`
- **Example:** `npm start`, `java -jar server.jar`

### ⏹️ Stop Button
- **Shows when:** Always (for any terminal)
- **Does:** 
  - If `stopCommand` configured: runs that command
  - If not configured: sends Ctrl+C (SIGINT) to process
- **Example:** `stop` (for Minecraft), or Ctrl+C for most apps

### 🔄 Restart Button
- **Shows when:** Has `restartCommand` OR (`stopCommand` OR `startCommand`)
- **Does:**
  - If `restartCommand`: runs that command
  - Otherwise: stops → waits 2s → starts
- **Example:** Custom restart script or automatic stop+start

### 📥 Pull & Restart Button
- **Shows when:** `hasGitRepo: true` AND has `startCommand`
- **Does:** 
  1. Stops the server
  2. Runs `git pull`
  3. Starts the server
- **Use case:** Deploy latest changes from git

## Terminal Examples

### Web Application (Node.js)
```json
{
  "id": "web-app",
  "startCommand": "npm start",
  "stopCommand": "",              // Uses Ctrl+C
  "restartCommand": "",           // Auto: stop + start
  "hasGitRepo": true
}
```

### Minecraft Server
```json
{
  "id": "minecraft-server",
  "startCommand": "java -Xmx2G -jar server.jar nogui",
  "stopCommand": "stop",          // Minecraft stop command
  "restartCommand": "",
  "hasGitRepo": false
}
```

### Custom Service
```json
{
  "id": "my-service",
  "startCommand": "./start.sh",
  "stopCommand": "./stop.sh",
  "restartCommand": "./restart.sh",
  "hasGitRepo": false
}
```

## Security

All control actions go through:
1. ✅ Authentication check
2. ✅ Command security validation
3. ✅ User permissions check
4. ✅ Rate limiting
5. ✅ Audit logging

Commands are validated against `config/security.json` restrictions.

## API Endpoints

### Start Server
```
POST /api/terminal/start
Body: { terminalId: "terminal-id" }
```

### Stop Server
```
POST /api/terminal/stop
Body: { terminalId: "terminal-id" }
```

### Restart Server
```
POST /api/terminal/restart
Body: { terminalId: "terminal-id" }
```

### Git Pull & Restart
```
POST /api/terminal/git-pull-restart
Body: { terminalId: "terminal-id" }
```

## User Interface

Buttons appear in the terminal header:
```
[▶️ Start] [⏹️ Stop] [🔄 Restart] [📥 Pull & Restart] [Clear] [Reconnect]
```

- Buttons are enabled/disabled based on terminal config
- Confirmation dialogs for destructive actions (stop/restart)
- Status feedback during operations

## Typical Workflow

### Deploy Updates (Git-based app)
1. Click **📥 Pull & Restart**
2. Confirm dialog
3. Server stops → git pull → server starts
4. Success notification

### Quick Restart
1. Click **🔄 Restart**
2. Confirm dialog
3. Server restarts
4. Success notification

### Manual Control
1. Click **⏹️ Stop** to stop
2. Wait for process to stop
3. Click **▶️ Start** to start
4. Server running

## Notes

- **Ctrl+C behavior:** When no `stopCommand` is set, sends `\x03` (Ctrl+C signal)
- **Timing:** 2-second wait between stop and start in restart operations
- **Git operations:** Only available if `hasGitRepo: true` and working directory has `.git`
- **Errors:** Shown as alerts with specific error messages
- **Permissions:** Only users with terminal access can use controls

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Start button disabled | Add `startCommand` to terminal config |
| Restart button disabled | Add `startCommand` or `stopCommand` |
| Git button not showing | Set `hasGitRepo: true` in config |
| "Access denied" error | Check security.json permissions for the command |
| Server doesn't stop | Use custom `stopCommand` instead of Ctrl+C |

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** November 8, 2025
