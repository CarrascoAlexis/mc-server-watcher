# CD Command Security - Quick Reference Card

## ⚡ Quick Setup (3 Steps)

### 1️⃣ Configure Working Directory
Edit `config/terminals.json`:
```json
{
  "id": "your-terminal-id",
  "workingDirectory": "/path/to/allowed/directory"
}
```

### 2️⃣ Enable CD Command
Edit `config/security.json`:
```json
{
  "terminalRestrictions": {
    "your-terminal-id": {
      "allowedCommands": ["cd *"]
    }
  }
}
```

### 3️⃣ Test It
```bash
node scripts/test-cd-security.js
```

---

## ✅ Allowed Commands

| Command | Description |
|---------|-------------|
| `cd plugins` | Navigate to subdirectory |
| `cd ./world` | Use dot-slash notation |
| `cd mods/custom` | Navigate to nested directory |
| `cd .` | Stay in current directory |
| `cd "my folder"` | Path with spaces (quoted) |
| `cd /full/path/to/allowed/subdir` | Absolute path within working directory |

---

## ❌ Denied Commands

| Command | Reason |
|---------|--------|
| `cd /` | Outside allowed directory |
| `cd ..` | Would go above working directory |
| `cd ../..` | Directory traversal |
| `cd ~` | Home directory not allowed |
| `cd /etc` | Absolute path outside |
| `cd ../../other` | Resolves outside working directory |

---

## 🔍 How Validation Works

```
Command: cd TARGET
         ↓
Extract: TARGET path
         ↓
Resolve: workingDirectory + TARGET = FULL_PATH
         ↓
Check: Is FULL_PATH inside workingDirectory?
         ↓
      YES → ✅ ALLOW
       NO → ❌ DENY
```

---

## 📊 Example Scenarios

### Working Directory: `/home/user/minecraft`

| Input | Resolves To | Allowed? |
|-------|-------------|----------|
| `cd plugins` | `/home/user/minecraft/plugins` | ✅ Yes |
| `cd ./world` | `/home/user/minecraft/world` | ✅ Yes |
| `cd /home/user/minecraft/mods` | `/home/user/minecraft/mods` | ✅ Yes |
| `cd ..` | `/home/user` | ❌ No |
| `cd /etc` | `/etc` | ❌ No |
| `cd ~` | `/home/user` | ❌ No |

---

## 🛡️ Security Features

- ✅ **Automatic validation** - Every `cd` command is checked
- ✅ **Path resolution** - Handles `.`, `..`, absolute/relative paths
- ✅ **Directory boundary** - Prevents escape from working directory
- ✅ **Security logging** - All attempts logged to `logs/security.log`
- ✅ **Detailed errors** - Clear denial reasons in API responses

---

## 📝 API Responses

### Success
```json
{
  "success": true,
  "terminalId": "minecraft-server",
  "command": "cd plugins"
}
```

### Denied
```json
{
  "error": "Access denied",
  "reasons": [
    "Path '../..' is outside allowed directory '/home/user/minecraft'"
  ]
}
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Terminal has no configured working directory" | Add `workingDirectory` to terminal config |
| "Command is not in the allowed list" | Add `cd *` to `allowedCommands` in security config |
| "Path is outside allowed directory" | Use paths within the working directory |

---

## 📚 Documentation

- **Complete Guide:** [CD-COMMAND-SECURITY.md](CD-COMMAND-SECURITY.md)
- **Visual Guide:** [CD-SECURITY-VISUAL.md](CD-SECURITY-VISUAL.md)
- **Summary:** [CD-SECURITY-SUMMARY.md](CD-SECURITY-SUMMARY.md)
- **Terminal Security:** [TERMINAL-SECURITY.md](TERMINAL-SECURITY.md)

---

## 🧪 Testing

Run included test suite:
```bash
node scripts/test-cd-security.js
```

Tests 10 scenarios:
- ✅ 5 allowed cases
- ❌ 5 denied cases

---

## ⚠️ Important Notes

1. **Symlinks:** String-based validation doesn't prevent following symlinks
2. **Race conditions:** Directory may change between validation and execution
3. **Additional security:** Use filesystem permissions + limited user privileges
4. **Case sensitive:** Paths are case-sensitive on Linux/Unix

---

## 💡 Best Practices

1. ✅ Set working directory to minimum required scope
2. ✅ Monitor security logs regularly
3. ✅ Use filesystem-level permissions for additional security
4. ✅ Run terminals with limited user accounts
5. ✅ Test with actual use cases before deployment

---

**Quick Status Check:**
- Configuration file: `config/terminals.json` → `workingDirectory` set?
- Security config: `config/security.json` → `cd *` in allowedCommands?
- Test passed: `node scripts/test-cd-security.js` → All green?
- Logs working: `logs/security.log` → Events being written?

✅ All checked? You're ready to go!
