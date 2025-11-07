# CD Command Security - Visual Guide

## How It Works (Step by Step)

```
┌─────────────────────────────────────────────────────────────────┐
│  User sends command: "cd ../../etc"                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Command arrives at Security Manager                         │
│     - Detected as 'cd' command                                  │
│     - Special validation triggered                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Load Terminal Configuration                                 │
│     terminalId: "minecraft-server"                              │
│     workingDirectory: "/home/user/minecraft"                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Extract Target Path                                         │
│     Input: "cd ../../etc"                                       │
│     Extracted: "../../etc"                                      │
│     Quotes removed: "../../etc"                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Resolve Absolute Path                                       │
│     Base: "/home/user/minecraft"                                │
│     Target: "../../etc"                                         │
│     Resolved: "/etc"                                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Calculate Relative Path                                     │
│     From: "/home/user/minecraft"                                │
│     To: "/etc"                                                  │
│     Relative: "../../.."                                        │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Validate                                                    │
│     Relative path starts with ".." ? YES                        │
│     Is absolute path? NO                                        │
│     RESULT: ❌ DENIED                                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Log Security Event                                          │
│     Event: DENIED_COMMAND                                       │
│     Reason: "Path '../../etc' is outside allowed directory"     │
│     Written to: logs/security.log                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. Return Response                                             │
│     Status: 403 Forbidden                                       │
│     {                                                           │
│       "error": "Access denied",                                 │
│       "reasons": [                                              │
│         "Path is outside allowed directory"                     │
│       ]                                                         │
│     }                                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Success Flow (Allowed Command)

```
User Command: "cd plugins"
       ↓
Load Config: workingDirectory = "/home/user/minecraft"
       ↓
Extract Path: "plugins"
       ↓
Resolve: "/home/user/minecraft/plugins"
       ↓
Calculate Relative: "plugins" (no "..")
       ↓
✅ ALLOWED
       ↓
Log: ALLOWED_COMMAND
       ↓
Return: 200 OK
```

## Comparison Table

| User Input | Working Dir | Resolved Path | Relative From Base | Result |
|-----------|-------------|---------------|-------------------|--------|
| `cd plugins` | `/home/mc` | `/home/mc/plugins` | `plugins` | ✅ ALLOW |
| `cd ./world` | `/home/mc` | `/home/mc/world` | `world` | ✅ ALLOW |
| `cd .` | `/home/mc` | `/home/mc` | `` (empty) | ✅ ALLOW |
| `cd /home/mc/mods` | `/home/mc` | `/home/mc/mods` | `mods` | ✅ ALLOW |
| `cd ..` | `/home/mc` | `/home` | `..` | ❌ DENY |
| `cd /etc` | `/home/mc` | `/etc` | `../../etc` | ❌ DENY |
| `cd ~` | `/home/mc` | (varies) | N/A | ❌ DENY |
| `cd ../other` | `/home/mc` | `/home/other` | `../other` | ❌ DENY |

## Security Validation Logic

```javascript
function isPathAllowed(targetPath, baseDir) {
  // Step 1: Resolve absolute path
  const resolved = path.resolve(baseDir, targetPath);
  
  // Step 2: Calculate relative path
  const relative = path.relative(baseDir, resolved);
  
  // Step 3: Check if outside base directory
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return false; // Outside allowed directory
  }
  
  return true; // Inside allowed directory
}
```

## Example Scenarios

### Scenario 1: User in Subdirectory

```
Current Directory: /home/user/minecraft/plugins
Working Directory: /home/user/minecraft
Command: cd ..
```

**Process:**
1. Extract: `..`
2. Resolve from working dir: `/home/user/minecraft/..` → `/home/user`
3. Calculate relative: `../..` from `/home/user/minecraft` to `/home/user`
4. Starts with `..`: YES
5. **Result: ❌ DENIED**

### Scenario 2: Navigate Within Allowed Directory

```
Current Directory: /home/user/minecraft
Working Directory: /home/user/minecraft
Command: cd plugins/custom
```

**Process:**
1. Extract: `plugins/custom`
2. Resolve: `/home/user/minecraft/plugins/custom`
3. Calculate relative: `plugins/custom`
4. Starts with `..`: NO
5. **Result: ✅ ALLOWED**

### Scenario 3: Absolute Path Within Allowed Directory

```
Current Directory: (any)
Working Directory: /srv/minecraft
Command: cd /srv/minecraft/world
```

**Process:**
1. Extract: `/srv/minecraft/world`
2. Resolve: `/srv/minecraft/world`
3. Calculate relative: `world`
4. Starts with `..`: NO
5. **Result: ✅ ALLOWED**

## Attack Prevention Examples

### Attack 1: Directory Traversal

```
❌ cd ../../../../../../../etc/passwd
   → Resolves to: /etc/passwd
   → Relative: ../../../../../../etc/passwd
   → DENIED: Starts with ".."
```

### Attack 2: Absolute Path Escape

```
❌ cd /var/log
   → Resolves to: /var/log
   → Relative from /home/user/mc: ../../../var/log
   → DENIED: Starts with ".."
```

### Attack 3: Home Directory

```
❌ cd ~
   → Special case check
   → DENIED: Home directory not allowed
```

### Attack 4: Symbolic Link (Limitation)

```
⚠️  cd symlink-to-etc
   → If symlink exists pointing to /etc
   → String validation passes
   → Filesystem may follow link
   → LIMITATION: Need filesystem-level protection
```

## Configuration Flow

```
┌─────────────────────────────────────────┐
│  config/terminals.json                  │
│  ┌───────────────────────────────────┐  │
│  │ {                                 │  │
│  │   "id": "minecraft-server",       │  │
│  │   "workingDirectory": "/home/mc"  │◄─┼─── Used to validate cd paths
│  │ }                                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  config/security.json                   │
│  ┌───────────────────────────────────┐  │
│  │ "terminalRestrictions": {         │  │
│  │   "minecraft-server": {           │  │
│  │     "allowedCommands": [          │  │
│  │       "cd *",  ◄──────────────────┼─┼─── Enables cd validation
│  │       ...                         │  │
│  │     ]                             │  │
│  │   }                               │  │
│  │ }                                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Security Layers

```
                    User sends "cd" command
                            ↓
            ┌───────────────┴───────────────┐
            │   Layer 1: Command Detection   │
            │   Is it a "cd" command?        │
            └───────────────┬───────────────┘
                            ↓ Yes
            ┌───────────────┴───────────────┐
            │   Layer 2: Terminal Config     │
            │   Has workingDirectory?        │
            └───────────────┬───────────────┘
                            ↓ Yes
            ┌───────────────┴───────────────┐
            │   Layer 3: Path Resolution     │
            │   Resolve absolute path        │
            └───────────────┬───────────────┘
                            ↓
            ┌───────────────┴───────────────┐
            │   Layer 4: Special Cases       │
            │   Check ~, ~/, etc             │
            └───────────────┬───────────────┘
                            ↓
            ┌───────────────┴───────────────┐
            │   Layer 5: Boundary Check      │
            │   Is path within allowed dir?  │
            └───────────────┬───────────────┘
                            ↓
                    ┌───────┴───────┐
                    │               │
                ✅ ALLOW        ❌ DENY
                    │               │
                    └───────┬───────┘
                            ↓
            ┌───────────────┴───────────────┐
            │   Layer 6: Logging             │
            │   Write to security.log        │
            └───────────────┬───────────────┘
                            ↓
                    Return Response
```

---

**Legend:**
- ✅ = Allowed
- ❌ = Denied
- ⚠️ = Warning/Limitation
- → = Process flow
- ◄─ = Configuration reference
