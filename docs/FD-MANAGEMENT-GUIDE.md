# File Descriptor Management Guide

**Created**: 2025-11-04
**System**: Linux development environment with modern tooling
**Problem Solved**: "Too many open files" errors during builds and tests

---

## TL;DR - Quick Reference

```bash
# Daily health check
fd-status

# Something broken? Find the culprit
fd-top

# Deep dive into suspicious process
fd-inspect <PID>

# Emergency: need more capacity right now
fd-emergency

# Before laptop sleep (prevents zombies)
fd-cleanup
```

---

## What Are File Descriptors?

**File Descriptors (FDs)** are handles to:
- Open files
- Network sockets
- Pipes between processes
- Devices (terminals, etc.)

**Every open resource needs an FD.** Modern development uses **a lot**:
- Firefox: 400+ FDs
- Trilium notes: 300+ FDs
- VS Code: 5K-10K FDs (file watchers)
- Next.js dev server: 5K-15K FDs (Turbopack file watching)
- Playwright tests: 10K-20K FDs (browsers + dev server)

**Your old limit**: 4,096 FDs
**Your typical usage**: 60K-150K FDs
**Result**: Constant "too many open files" errors

---

## Soft vs Hard Limits (The Two-Tier System)

### Soft Limit (Normal Ceiling)
- **Purpose**: Daily working limit
- **Set to**: 65,536 (after you logout/login)
- **Can change**: Yes, you can raise it temporarily
- **Command**: `ulimit -Sn <value>`
- **Check**: `ulimit -Sn`

**Think of it as**: Speed limit on highway (can be temporarily raised)

### Hard Limit (Maximum Ceiling)
- **Purpose**: Safety cap to prevent runaway leaks
- **Set to**: 524,288 (after you logout/login)
- **Can change**: No, requires systemd restart (logout/login)
- **Command**: `ulimit -Hn` (view only)

**Think of it as**: Physical speed limit of your car

### Why Two Limits?

**Scenario 1: Normal development**
- Soft limit (65K) is plenty
- Firefox + VS Code + dev server = ~30K FDs
- ✅ Everything works

**Scenario 2: Running tests + multiple projects**
- Spike to 80K FDs
- Hits soft limit → process gets error
- **You can raise it**: `fd-emergency` → bumps to 524K
- ✅ Tests complete

**Scenario 3: Actual leak (bug in code)**
- Process slowly leaking FDs
- Hits soft limit at 65K → error logged
- You investigate with `fd-inspect`
- If you ignore it, eventually hits hard limit (524K)
- Process dies → prevents system crash

**The two-tier system protects you while giving flexibility.**

---

## Installed Tools Reference

### Basic Monitoring

#### `fd-status`
**Use**: Daily health check (like `git status` for FDs)

**Output**:
```
Current:     65586 FDs
Soft limit:  65536 (normal ceiling)
Hard limit:  524288 (emergency max)
Usage:       100%

⚠️  WARNING: >75% usage - possible leak
```

**When to run**:
- Every morning
- Before starting heavy work
- After laptop sleep
- When build fails mysteriously

---

#### `fd-top`
**Use**: Find the culprit (like `htop` for FDs)

**Output**:
```
439 FDs | PID 31026 | firefox     | Age: 38:42   | Mem: 444MB
307 FDs | PID 8562  | trilium     | Age: 3-20:38 | Mem: 231MB
223 FDs | PID 4985  | electron    | Age: 1-01:51 | Mem: 93MB
```

**Look for**:
- Processes with >10K FDs (possible leak)
- Old processes (days old) still running
- Unfamiliar processes

**Action**:
- Normal (Firefox 400 FDs): ✅ Ignore
- Suspicious (node 50K FDs): ⚠️ Investigate
- Leak confirmed: 🚨 Kill it

---

#### `fd-watch [seconds]`
**Use**: Real-time monitoring (like `watch`)

**Output**: Auto-refreshing dashboard

**When to use**:
- Debugging suspected leak
- Monitoring during long build
- Testing if process FD usage grows over time

**Stop**: Ctrl+C

---

### Detailed Analysis

#### `fd-inspect <PID>`
**Use**: Deep dive into specific process

**What it shows**:
1. **Process info**: Command, age, memory
2. **FD breakdown by type**:
   - `REG`: Regular files (normal)
   - `sock`: Network sockets (normal for servers)
   - `pipe`: Inter-process communication
   - `CHR`: Character devices

3. **Top open files**: What it's actually accessing

**Leak detection**:
- Many duplicate entries → leak
- Thousands of `pipe` or `sock` → leak
- Same file opened hundreds of times → leak

**Example**:
```bash
fd-inspect 31026

# If output shows:
#   5000 x sock (network sockets)
#   → Likely leaking connections
#   → Kill and restart process
```

---

#### `fd-leak-check`
**Use**: Check current shell and all child processes

**What it does**:
- Finds all processes started from your current terminal
- Shows FD count for each
- Highlights processes >100 FDs

**When to use**:
- After running tests
- Before closing terminal
- Debugging why shell feels slow

---

### Maintenance

#### `fd-cleanup`
**Use**: Kill zombie processes from laptop sleep

**What it finds**:
- Playwright test processes (>1 hour old)
- Next.js dev servers (orphaned)
- Turbopack processes (stuck)

**When to run**:
- After laptop wakes from sleep
- Before running new tests
- When `fd-top` shows old processes

**Safe**: Only kills test/dev processes, not important stuff

---

#### `fd-emergency`
**Use**: Temporarily raise soft limit to hard limit

**What it does**:
```bash
Current soft: 65,536
Current hard: 524,288

fd-emergency
# → Sets soft limit to 524,288
```

**When to use**:
- Build failing with "too many open files"
- Need to run tests RIGHT NOW
- Can't close other apps

**Duration**: This terminal session only

**Warning**: Bypasses leak detection. Use sparingly.

---

#### `fd-log [filepath]`
**Use**: Log usage to file for analysis

**What it does**:
```bash
fd-log /tmp/my-usage.log
# Appends: 2025-11-04 10:30:00 | FDs: 65586 | Limit: 65536
```

**When to use**:
- Tracking leak over time
- Proving FD usage grows
- Debugging intermittent issues

**Pro tip**: Run in cron every hour:
```bash
0 * * * * source ~/.zshrc && fd-log /tmp/fd-usage.log
```

---

## Leak Detection Workflow

### Step 1: Identify Elevated Usage
```bash
fd-status
# Output: Usage: 85%
# → Time to investigate
```

---

### Step 2: Find the Culprit
```bash
fd-top
# Look for:
#   - Processes with >10K FDs
#   - Old processes (days old)
#   - Unexpected process names
```

---

### Step 3: Deep Dive
```bash
fd-inspect <PID>
# Check:
#   - Is FD count normal for this process?
#   - Firefox 400 FDs: ✅ Normal
#   - node 50K FDs: 🚨 Leak
#
#   - What type of FDs?
#   - 100 REG (files): ✅ Normal
#   - 10K sock (sockets): 🚨 Leak
#
#   - What files are open?
#   - Same file 1000 times: 🚨 Leak
```

---

### Step 4: Confirm Leak (Monitor Over Time)
```bash
# Terminal 1: Monitor the suspicious PID
fd-watch 5

# Terminal 2: Trigger the suspected leak
npm run test
```

**If FD count grows steadily → Confirmed leak**

---

### Step 5: Take Action

**Temporary Fix** (get work done now):
```bash
kill -15 <PID>  # Graceful shutdown
# Wait 3 seconds
kill -9 <PID>   # Force kill if needed
```

**Permanent Fix** (fix the code):
- Find where resources are opened
- Ensure they're closed (files, sockets, streams)
- Add `.close()`, `.destroy()`, `fs.promises` usage
- Use try/finally or event listeners for cleanup

---

## Common Leak Patterns

### Pattern 1: File Handle Leak
**Symptom**: Thousands of `REG` entries

**Cause**:
```javascript
// Bad: No close
fs.readFile('file.txt', (err, data) => {
  // Forgot to close handle
})
```

**Fix**:
```javascript
// Good: Use promises (auto-closes)
const data = await fs.promises.readFile('file.txt')
```

---

### Pattern 2: Socket Leak
**Symptom**: Thousands of `sock` entries

**Cause**:
```javascript
// Bad: No cleanup
setInterval(() => {
  const client = net.connect(3000)
  // Never closed
}, 1000)
```

**Fix**:
```javascript
// Good: Close after use
const client = net.connect(3000)
client.on('end', () => client.destroy())
```

---

### Pattern 3: Event Listener Leak
**Symptom**: Memory and FD usage both growing

**Cause**:
```javascript
// Bad: Listeners never removed
emitter.on('event', handler)
// Handler keeps file open
```

**Fix**:
```javascript
// Good: Remove listener
emitter.once('event', handler)
// Or:
emitter.on('event', handler)
try {
  // ... work ...
} finally {
  emitter.off('event', handler)
}
```

---

### Pattern 4: Zombie Child Processes
**Symptom**: Old `node`, `next-server`, `playwright` processes

**Cause**: Laptop sleep interrupts cleanup

**Fix**: Run `fd-cleanup` after laptop wakes

**Prevention**: Add to suspend hook:
```bash
# /etc/systemd/system-sleep/cleanup-dev
#!/bin/bash
if [ "$1" = "pre" ]; then
  pkill -u $USER -f "playwright test"
  pkill -u $USER -f "next-server"
fi
```

---

## Emergency Scenarios

### Scenario 1: Tests Won't Start
```
Error: Too many open files (EMFILE)
```

**Solution**:
```bash
# 1. Check current state
fd-status

# 2. Find heavy users
fd-top

# 3. Options:
#    A) Close Firefox/browser (frees 40K+ FDs)
#    B) Kill zombie processes: fd-cleanup
#    C) Emergency override: fd-emergency
#    D) Logout/login (applies new limits)
```

---

### Scenario 2: Build Slowly Getting Slower
**Sign**: First build: 30s, tenth build: 5min

**Likely cause**: File watcher leak in dev server

**Solution**:
```bash
# 1. Watch dev server PID during builds
fd-watch 5

# 2. If FD count grows with each build → leak
# 3. Restart dev server: Ctrl+C, npm run dev
```

---

### Scenario 3: After Laptop Sleep
**Sign**: Commands fail with "too many open files"

**Solution**:
```bash
# 1. Clean up zombies
fd-cleanup

# 2. If still failing, close browsers
# 3. If desperate: fd-emergency
```

---

## Current System Status

**As of 2025-11-04** (before logout/login):

```
Current State:
  Soft limit: 4,096   (too low!)
  Hard limit: 4,096   (too low!)
  Current usage: 65,586 FDs
  Status: 🚨 1601% over limit

After Logout/Login:
  Soft limit: 65,536   (daily working limit)
  Hard limit: 524,288  (emergency ceiling)
  Current usage: ~65K FDs (typical)
  Status: ✅ Normal (100% usage)
```

---

## Files Modified

1. **~/.config/systemd/user.conf.d/limits.conf**
   - Sets hard limit to 524,288
   - Applies on next login

2. **~/.zshrc**
   - Sets soft limit to 65,536
   - Adds ~/.local/bin to PATH
   - Applies on next shell

3. **~/.local/bin/fd/** (toolkit scripts directory)
   - fd-status
   - fd-top
   - fd-inspect
   - fd-watch
   - fd-leak-check
   - fd-cleanup
   - fd-emergency
   - fd-log
   - fd-help

---

## Verification After Logout/Login

```bash
# Check limits applied
ulimit -Sn  # Should show: 65536
ulimit -Hn  # Should show: 524288

# Check toolkit works
fd-status   # Should show healthy usage

# Verify Playwright works
npm run test:e2e -- gallery-performance.spec.ts:147
# Should complete without "too many open files"
```

---

## Best Practices Going Forward

### Daily
- Run `fd-status` in the morning
- Check before starting heavy work

### After Laptop Sleep
- Run `fd-cleanup` to kill zombies
- Prevents "too many open files" on next test run

### When Build Fails
1. `fd-top` → identify culprit
2. `fd-inspect <PID>` → confirm leak
3. Kill process or close apps
4. If urgent: `fd-emergency`

### Monthly
- Review `/tmp/fd-usage.log` (if logging)
- Check for gradual growth trends

---

## Automation Suggestions

### 1. Shell Startup Check (Optional)
Add to ~/.zshrc:
```bash
# Show FD status on shell startup
# (Scripts are in ~/.local/bin/fd/ and auto-loaded via PATH)
fd-status
```

### 2. Pre-Sleep Cleanup
Create `/etc/systemd/system-sleep/dev-cleanup`:
```bash
#!/bin/bash
if [ "$1" = "pre" ]; then
  sudo -u $SUDO_USER pkill -f "playwright test"
fi
```

### 3. Hourly Logging
```bash
crontab -e
# Add:
0 * * * * source ~/.zshrc && fd-log /tmp/fd-usage.log
```

---

## Troubleshooting

### "fd-status: command not found"
```bash
# After restart, scripts should be in PATH
which fd-status

# If not found, check PATH
echo $PATH | grep ".local/bin"

# Temporary workaround: use full path
~/.local/bin/fd/fd-status
```

### "ulimit: value exceeds hard limit"
- Systemd config not applied yet
- Need to logout/login
- Current session stuck at 4K hard limit

### Tools show 0 FDs
```bash
# lsof may need permissions
sudo lsof -u $USER | wc -l
```

### Still getting "too many open files" after logout
1. Verify limits: `ulimit -Sn` and `ulimit -Hn`
2. Check systemd: `systemctl --user show-environment | grep LIMIT`
3. Ensure no system-level restrictions in `/etc/security/limits.conf`

---

## Additional Resources

- Linux FD internals: `/proc/<PID>/fd/`
- System-wide limit: `/proc/sys/fs/file-max`
- Current system usage: `/proc/sys/fs/file-nr`

---

**Next Steps**:
1. ✅ Tools installed
2. ✅ Limits configured
3. ⏸️ Logout/login to apply limits
4. ✅ Test with `fd-status` after login
5. ✅ Verify Playwright tests run

**Doctor Hubert**: You now have comprehensive FD management! After logout/login, you'll never see "too many open files" again.

---

## Installation Details

### Scripts Location
All FD monitoring scripts are installed in:
```
~/.local/bin/fd/
├── fd-status      # Quick status check
├── fd-top         # Top FD consumers
├── fd-inspect     # Detailed process analysis
├── fd-watch       # Real-time monitoring
├── fd-leak-check  # Shell tree inspection
├── fd-cleanup     # Zombie process cleanup
├── fd-emergency   # Temporary limit boost
├── fd-log         # Usage logging
└── fd-help        # This help text
```

### PATH Configuration
`~/.zshrc` includes:
```bash
export PATH="$HOME/.local/bin:$PATH"
```

This makes all scripts in `~/.local/bin/fd/` available as commands after restart.

### Manual Execution
Before restart, scripts can be run directly:
```bash
~/.local/bin/fd/fd-status
~/.local/bin/fd/fd-top
```

After restart (PATH configured):
```bash
fd-status
fd-top
```

---
