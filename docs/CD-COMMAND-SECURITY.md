# CD Command Security

## Overview

The `cd` (change directory) command has special security handling that restricts navigation to only the folder specified in the terminal's configuration (`workingDirectory`). This prevents users from navigating outside of their designated workspace.

## How It Works

When a `cd` command is executed:

1. The system extracts the target path from the command
2. Resolves the absolute path (handling relative paths like `..`, `.`, etc.)
3. Validates that the resolved path is within the terminal's `workingDirectory`
4. Denies the command if it attempts to navigate outside the allowed directory

## Configuration

### Terminal Configuration

Each terminal in `config/terminals.json` must have a `workingDirectory` defined:

```json
{
  "id": "minecraft-server",
  "name": "Minecraft Server",
  "workingDirectory": "/path/to/minecraft/server",
  ...
}
```

### Security Configuration

Add `cd *` to the `allowedCommands` in `config/security.json`:

```json
{
  "terminalRestrictions": {
    "minecraft-server": {
      "allowedCommands": [
        "cd *",
        "say *",
        "list",
        ...
      ]
    }
  }
}
```

## Examples

### Allowed Commands

Assuming `workingDirectory` is `/home/user/minecraft`:

✅ **Allowed:**
```bash
cd plugins              # Navigate to /home/user/minecraft/plugins
cd ./world              # Navigate to /home/user/minecraft/world
cd mods/custom          # Navigate to /home/user/minecraft/mods/custom
cd ..                   # Navigate to /home/user/minecraft (if already in subdirectory)
cd .                    # Stay in current directory
cd /home/user/minecraft # Navigate to base directory
```

### Denied Commands

❌ **Denied:**
```bash
cd /                    # Outside allowed directory
cd ~                    # Home directory not allowed
cd ../..                # Would go above /home/user/minecraft
cd /etc                 # Outside allowed directory
cd ../../other-server   # Outside allowed directory
cd /home/user/other     # Outside allowed directory
```

## Path Resolution

The security system handles various path formats:

| Input Path | Working Directory | Resolved Path | Status |
|-----------|-------------------|---------------|--------|
| `plugins` | `/home/user/mc` | `/home/user/mc/plugins` | ✅ Allowed |
| `./world` | `/home/user/mc` | `/home/user/mc/world` | ✅ Allowed |
| `../mc` | `/home/user/mc/subfolder` | `/home/user/mc` | ✅ Allowed |
| `..` | `/home/user/mc` | `/home/user` | ❌ Denied |
| `/etc` | `/home/user/mc` | `/etc` | ❌ Denied |
| `~` | `/home/user/mc` | (varies) | ❌ Denied |

## Security Features

### 1. Absolute Path Validation
Even if a user specifies an absolute path, it's validated against the working directory:
```bash
# If workingDirectory is /srv/minecraft
cd /srv/minecraft/plugins  # ✅ Allowed
cd /srv/other-server       # ❌ Denied
```

### 2. Relative Path Traversal Protection
The system prevents directory traversal attacks:
```bash
cd ../../../../../etc/passwd  # ❌ Denied
cd ../../other-data          # ❌ Denied
```

### 3. Symlink Considerations
⚠️ **Note:** The current implementation validates the path string, not the filesystem. If symlinks exist within the working directory that point outside, they could potentially be followed. Consider filesystem-level restrictions for additional security.

### 4. Quote Handling
The system properly handles quoted paths:
```bash
cd "my folder"        # ✅ Works correctly
cd 'subfolder/data'   # ✅ Works correctly
```

## Security Logging

All `cd` command attempts are logged with detailed information:

### Allowed Command Log
```json
{
  "timestamp": "2025-11-07T10:30:00.000Z",
  "eventType": "ALLOWED_COMMAND",
  "terminalId": "minecraft-server",
  "username": "admin",
  "command": "cd plugins"
}
```

### Denied Command Log
```json
{
  "timestamp": "2025-11-07T10:30:00.000Z",
  "eventType": "DENIED_COMMAND",
  "terminalId": "minecraft-server",
  "username": "user",
  "command": "cd /etc",
  "reason": "Path '/etc' is outside allowed directory '/home/user/minecraft'"
}
```

## API Response

### Success Response
```json
{
  "success": true,
  "terminalId": "minecraft-server",
  "command": "cd plugins",
  "output": ""
}
```

### Denied Response (403 Forbidden)
```json
{
  "error": "Access denied",
  "reasons": [
    "Path '/etc' is outside allowed directory '/home/user/minecraft'"
  ]
}
```

## Best Practices

### 1. Set Appropriate Working Directories
Choose working directories that contain all necessary subdirectories:
```json
{
  "workingDirectory": "/home/user/minecraft",  // Good - contains all MC files
  "workingDirectory": "/home/user"             // Too broad - entire home directory
}
```

### 2. Don't Disable the Check
The `cd` command validation is automatic when `cd *` is in `allowedCommands`. Don't try to bypass it.

### 3. Use Wildcards in Security Config
Always use `cd *` rather than specific paths:
```json
"allowedCommands": [
  "cd *"         // ✅ Correct - validates all cd commands
]
```

NOT:
```json
"allowedCommands": [
  "cd plugins",  // ❌ Don't do this - too restrictive
  "cd world"
]
```

### 4. Monitor Security Logs
Regularly check security logs for unauthorized `cd` attempts:
```bash
# View denied cd attempts
curl "http://localhost:3001/api/admin/security/logs?eventType=DENIED_COMMAND" | jq '.logs[] | select(.command | startswith("cd"))'
```

## Troubleshooting

### "Terminal has no configured working directory"
**Problem:** The terminal configuration doesn't have a `workingDirectory` field.

**Solution:** Add `workingDirectory` to the terminal in `config/terminals.json`:
```json
{
  "id": "my-terminal",
  "workingDirectory": "/path/to/directory",
  ...
}
```

### "Path is outside allowed directory"
**Problem:** Trying to navigate outside the configured working directory.

**Solution:** Either:
1. Stay within the allowed directory
2. Request admin to update the `workingDirectory` to a broader path

### CD not in allowed list
**Problem:** `cd *` is not in the `allowedCommands` list.

**Solution:** Add it to `config/security.json`:
```json
{
  "terminalRestrictions": {
    "your-terminal-id": {
      "allowedCommands": [
        "cd *",
        ...
      ]
    }
  }
}
```

## Implementation Details

### Algorithm
1. Extract target path from `cd <path>` command
2. Remove quotes from path
3. Check for special cases (`~`, `~/`)
4. Resolve absolute path:
   - If absolute: use as-is
   - If relative: resolve from `workingDirectory`
5. Normalize both paths
6. Calculate relative path from base to target
7. Check if relative path starts with `..` or is absolute
8. Deny if outside, allow if inside

### Code Location
- Main validation: `server/security-manager.js` → `validateCdCommand()`
- Integration: `server/security-manager.js` → `isCommandAllowed()`
- Config: `config/security.json` → `terminalRestrictions[terminalId].allowedCommands`
- Terminal config: `config/terminals.json` → `workingDirectory`

## Security Considerations

### ✅ Protected Against
- Directory traversal (`../../../etc`)
- Absolute path escapes (`/etc/passwd`)
- Home directory navigation (`~`)
- Complex relative paths (`./../../outside`)

### ⚠️ Limitations
- **Symlinks:** Doesn't prevent following symlinks within allowed directory
- **Race conditions:** Path is validated but directory may change before command executes
- **Shell expansion:** Special shell characters in paths may behave unexpectedly

### 🔒 Additional Security Recommendations
1. Use filesystem-level permissions to enforce directory boundaries
2. Run terminal processes with limited user privileges
3. Monitor for unusual `cd` patterns in security logs
4. Consider using chroot or containerization for additional isolation

## See Also

- [Terminal Security Guide](./TERMINAL-SECURITY.md) - Complete security documentation
- [Security Quick Start](./SECURITY-QUICKSTART.md) - Quick setup guide
- [Tmux Execution API](./TMUX-EXECUTION.md) - Command execution documentation
