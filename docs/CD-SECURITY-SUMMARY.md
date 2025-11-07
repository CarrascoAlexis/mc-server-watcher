# CD Command Security - Feature Summary

## What Was Added

The `cd` (change directory) command now has **special security validation** that restricts users to navigating only within the terminal's configured `workingDirectory`. This prevents directory escape attacks and ensures users stay within their designated workspace.

## Key Features

### 1. Automatic Path Validation
- Every `cd` command is intercepted and validated **before execution**
- Resolves absolute and relative paths (handles `..`, `.`, etc.)
- Compares resolved path against terminal's `workingDirectory`
- Denies navigation outside the allowed directory

### 2. Protection Against Common Attacks
- ✅ Prevents directory traversal: `cd ../../../etc`
- ✅ Blocks absolute path escapes: `cd /etc`
- ✅ Denies home directory access: `cd ~`
- ✅ Validates complex relative paths: `cd ../../other-folder`

### 3. Smart Path Resolution
- Handles quoted paths: `cd "my folder"`
- Resolves relative paths from `workingDirectory`
- Normalizes paths for cross-platform compatibility
- Supports nested subdirectories: `cd plugins/custom/config`

## How It Works

```
User Command: cd ../../etc
                  ↓
Security Manager validates:
  1. Extract path: "../../etc"
  2. Get terminal workingDirectory: "/home/user/minecraft"
  3. Resolve absolute path: "/etc"
  4. Check if inside allowed dir: NO
  5. Return: DENIED
                  ↓
Response: 403 Forbidden
"Path '../../etc' is outside allowed directory '/home/user/minecraft'"
```

## Configuration

### Step 1: Set Working Directory (terminals.json)

```json
{
  "id": "minecraft-server",
  "name": "Minecraft Server",
  "workingDirectory": "/home/user/minecraft",
  ...
}
```

### Step 2: Allow cd Command (security.json)

```json
{
  "terminalRestrictions": {
    "minecraft-server": {
      "allowedCommands": [
        "cd *",
        ...
      ]
    }
  }
}
```

## Usage Examples

### ✅ Allowed Examples

```bash
# Navigate to subdirectory
cd plugins

# Use dot-slash notation
cd ./world

# Nested directories
cd mods/custom/configs

# Stay in current directory
cd .

# Navigate up (but still within workingDirectory)
cd ..
```

### ❌ Denied Examples

```bash
# Escape to root
cd /
# Reason: Outside allowed directory

# Directory traversal
cd ../../../etc
# Reason: Resolves to path outside workingDirectory

# Home directory
cd ~
# Reason: Home directory not allowed

# Absolute path outside
cd /var/log
# Reason: Outside allowed directory
```

## Security Logging

All `cd` attempts are logged with full details:

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

## API Responses

### Success (200 OK)
```json
{
  "success": true,
  "terminalId": "minecraft-server",
  "command": "cd plugins"
}
```

### Denied (403 Forbidden)
```json
{
  "error": "Access denied",
  "reasons": [
    "Path '../../../etc' is outside allowed directory '/home/user/minecraft'"
  ]
}
```

## Testing

Run the included test suite:

```bash
node scripts/test-cd-security.js
```

This tests 10 scenarios:
- ✅ 5 allowed cases (subdirectories, relative paths, etc.)
- ❌ 5 denied cases (directory escape, absolute paths, etc.)

## Files Modified

| File | Change |
|------|--------|
| `server/security-manager.js` | Added `validateCdCommand()` method and `cd` validation logic |
| `config/security.json` | Added `cd *` to example terminal configurations |
| `docs/CD-COMMAND-SECURITY.md` | Complete documentation (370+ lines) |
| `docs/TERMINAL-SECURITY.md` | Updated to mention CD security |
| `README.md` | Added CD security to features list |
| `scripts/test-cd-security.js` | Test suite for CD validation |

## Technical Implementation

### Key Method: `validateCdCommand(terminalId, command)`

```javascript
1. Get terminal config → workingDirectory
2. Extract target path from "cd <path>"
3. Remove quotes from path
4. Check special cases (~ , ~/)
5. Resolve absolute path:
   - If absolute → use as-is
   - If relative → resolve from workingDirectory
6. Calculate relative path from base to target
7. If relative path starts with ".." or is absolute → DENY
8. Otherwise → ALLOW
```

### Integration Points

- **Called from:** `isCommandAllowed()` method
- **Triggers on:** Any command matching `/^cd\s+/i`
- **Runs before:** Other command validation (whitelist/blacklist)
- **Bypasses:** Normal pattern matching for `cd` commands

## Security Considerations

### ✅ What's Protected
- Directory traversal attacks
- Absolute path escapes
- Home directory navigation
- Complex relative paths

### ⚠️ Known Limitations
- **Symlinks:** Doesn't prevent following symlinks within allowed directory
- **Race conditions:** Path validated but directory could change before execution
- **Shell expansion:** Special shell characters may behave unexpectedly

### 🔒 Additional Recommendations
1. Use filesystem-level permissions for additional security
2. Run terminals with limited user privileges
3. Monitor security logs for unusual patterns
4. Consider chroot or containerization for maximum isolation

## Quick Reference

| Action | Command | Result |
|--------|---------|--------|
| Navigate to subfolder | `cd plugins` | ✅ Allowed |
| Use relative path | `cd ./world` | ✅ Allowed |
| Stay in place | `cd .` | ✅ Allowed |
| Go up one level (within base) | `cd ..` | ✅ Allowed |
| Escape to root | `cd /` | ❌ Denied |
| Directory traversal | `cd ../../etc` | ❌ Denied |
| Home directory | `cd ~` | ❌ Denied |
| Absolute path outside | `cd /var/log` | ❌ Denied |

## Documentation

Full documentation available:
- **Complete Guide:** [docs/CD-COMMAND-SECURITY.md](../docs/CD-COMMAND-SECURITY.md)
- **Terminal Security:** [docs/TERMINAL-SECURITY.md](../docs/TERMINAL-SECURITY.md)
- **Quick Start:** [docs/SECURITY-QUICKSTART.md](../docs/SECURITY-QUICKSTART.md)

## Next Steps

1. ✅ Configure `workingDirectory` for each terminal in `config/terminals.json`
2. ✅ Add `cd *` to `allowedCommands` in `config/security.json`
3. ✅ Test with `node scripts/test-cd-security.js`
4. ✅ Monitor `logs/security.log` for denied attempts
5. ✅ Review and adjust working directories as needed

---

**Status:** ✅ Production Ready

**Version:** 1.0.0

**Last Updated:** November 7, 2025
