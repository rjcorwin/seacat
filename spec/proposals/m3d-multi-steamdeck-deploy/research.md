# Research: Multi-Device Steam Deck Deployment

**Proposal**: m3d-multi-steamdeck-deploy
**Created**: 2025-11-14
**Researcher**: Claude Code

## Current State

### Existing Deployment Infrastructure

**Build Pipeline**:
- `build-linux-docker.sh` - Uses Docker to build Linux AppImage on macOS
- `package:linux:docker` npm script - Wrapper for Docker build
- Output: `client/release/Seacat-0.1.0.AppImage` (x86_64 Linux binary)
- Build time: ~2-5 minutes (Docker image cached after first run)

**Deployment Script** (`deploy-to-steamdeck.sh`):
```bash
# Current flow (single device):
1. Build AppImage via Docker (npm run package:linux:docker)
2. Transfer via SCP to deck@steamdeck.local:~/
3. Manual instructions printed for user to run on Steam Deck
```

**Key Characteristics**:
- Hardcoded hostname: `steamdeck.local`
- Hardcoded user: `deck`
- Single device only
- Sequential execution (build → transfer)
- No error recovery for individual devices
- No configuration file

### Network & SSH Setup

**mDNS Hostname Resolution**:
- Steam Decks advertise themselves via Avahi/mDNS
- Default hostname: `steamdeck.local`
- Requires Avahi daemon running on Steam Deck (see STEAMDECK.md lines 134-145)
- **Problem**: All Steam Decks default to `steamdeck.local` → name collision

**SSH Access**:
- User: `deck` (standard for all Steam Decks)
- Default SSH disabled; must be enabled manually on each device
- Requires password or SSH key authentication
- Command to start SSH: `sudo systemctl start sshd`

### User's Environment

**Devices**:
- 3 Steam Decks (recently acquired 2 new ones)
- All need to run Seacat client
- Likely on same local network for development/testing

**Use Cases**:
- Local multiplayer testing (3 players on 3 devices)
- Rapid iteration during development
- Simultaneous deployment to keep all devices in sync

## Constraints

### Technical Constraints

1. **Hostname Collision**: All Steam Decks default to `steamdeck.local`
   - Cannot rely on default mDNS names
   - Requires custom hostnames or IP addresses

2. **Build Once, Deploy Many**:
   - AppImage is architecture-specific (x86_64) but device-agnostic
   - No need to rebuild for each device
   - Single build can be deployed to all devices

3. **Network Requirements**:
   - All devices must be accessible via network
   - SSH must be enabled on all devices
   - Firewall must allow SSH (port 22)

4. **File System**:
   - All Steam Decks use same home directory structure: `/home/deck/`
   - Same username: `deck`
   - Same file permissions model

### User Experience Constraints

1. **Minimal Configuration**:
   - Should be easy to add/remove devices
   - Should not require editing shell scripts
   - Should be version-controlled (but not secrets)

2. **Error Handling**:
   - Deployment shouldn't fail completely if one device is unreachable
   - Clear error messages for each device
   - Continue deploying to remaining devices on partial failure

3. **Performance**:
   - Build is slowest part (~2-5 minutes)
   - Transfer is fast (~5-10 seconds per device on LAN)
   - Should deploy in parallel when possible

## Prior Art & Approaches

### Approach 1: Sequential Deployment with Hostname List

**Concept**: Loop through list of hostnames/IPs and deploy one at a time

**Pros**:
- Simple to implement
- Easy to debug (clear output per device)
- Minimal dependencies

**Cons**:
- Slower (transfers are sequential even though they could be parallel)
- Script fails on first error (unless handled)

**Example**:
```bash
DEVICES=("steamdeck1.local" "steamdeck2.local" "steamdeck3.local")
for device in "${DEVICES[@]}"; do
  scp release/Seacat-0.1.0.AppImage deck@$device:~/
done
```

### Approach 2: Parallel Deployment with GNU Parallel

**Concept**: Use GNU parallel to deploy to multiple devices simultaneously

**Pros**:
- Faster (parallel transfers)
- Efficient use of network bandwidth
- Professional tool with good error handling

**Cons**:
- Requires GNU parallel installation (`brew install parallel`)
- More complex syntax
- Harder to debug output (parallel logs)

**Example**:
```bash
parallel scp release/Seacat-0.1.0.AppImage deck@{}:~/ ::: steamdeck1.local steamdeck2.local steamdeck3.local
```

### Approach 3: Configuration File with Device Metadata

**Concept**: JSON/YAML config file with device list and metadata

**Pros**:
- Clean separation of config from code
- Easy to add metadata (nicknames, IPs, MAC addresses)
- Can be excluded from git (.gitignore) for personal configs
- Supports comments and documentation

**Cons**:
- Requires JSON/YAML parsing (jq/yq or native bash)
- More files to manage
- Overkill for simple use case

**Example** (`steamdeck-devices.json`):
```json
{
  "devices": [
    { "name": "deck1", "host": "steamdeck1.local", "enabled": true },
    { "name": "deck2", "host": "192.168.1.101", "enabled": true },
    { "name": "deck3", "host": "192.168.1.102", "enabled": false }
  ]
}
```

### Approach 4: Environment Variable Configuration

**Concept**: Set device list via environment variable

**Pros**:
- No additional files
- Can be set in shell profile or .env
- Simple to read in bash

**Cons**:
- Not version-controlled easily
- Less discoverable than config file
- No support for per-device metadata

**Example**:
```bash
export STEAMDECK_HOSTS="steamdeck1.local,steamdeck2.local,steamdeck3.local"
```

### Approach 5: Simple Text File with Hostnames

**Concept**: Line-delimited text file with hostnames/IPs

**Pros**:
- Extremely simple to parse (`while read line`)
- Easy to edit (no JSON syntax)
- Can be .gitignored for personal configs
- Can include comments (lines starting with #)

**Cons**:
- No structured metadata (just hostnames)
- No per-device enable/disable

**Example** (`steamdeck-hosts.txt`):
```
# My Steam Decks
steamdeck1.local
192.168.1.101
steamdeck2.local
```

## Recommended Solution

### Hybrid Approach: Config File + Sequential Deployment

**Why**:
1. **Config file** provides clean separation and easy editing
2. **Simple text file** is easier than JSON/YAML (no parsing dependencies)
3. **Sequential deployment** is simpler and easier to debug than parallel
4. **Performance** is acceptable (transfers only take ~5-10 seconds each)

**Configuration**:
- File: `client/steamdeck-hosts.txt`
- Format: One hostname/IP per line
- Comments supported (lines starting with `#`)
- Git-ignored by default (add to `.gitignore`)
- Example template file committed to repo: `client/steamdeck-hosts.txt.example`

**Script Logic**:
```bash
1. Build AppImage once (slow: 2-5 min)
2. Check if steamdeck-hosts.txt exists
   - If not, fall back to single device: steamdeck.local
   - If yes, read devices from file
3. For each device:
   - Transfer AppImage via SCP
   - Track success/failure
   - Continue on error (don't exit)
4. Print summary:
   - ✅ Deployed to: deck1, deck2
   - ❌ Failed: deck3 (connection refused)
```

**Benefits**:
- Easy to use (just edit text file)
- Safe for git (personal configs not committed)
- Discoverable (example file shows format)
- Resilient (continues on partial failure)
- Clear feedback (success/failure per device)

## Device Hostname Setup

To avoid `steamdeck.local` collision, user must set unique hostnames on each Steam Deck.

**On each Steam Deck**:
```bash
# Set unique hostname
sudo hostnamectl set-hostname steamdeck1  # or steamdeck2, steamdeck3

# Restart Avahi for mDNS update
sudo systemctl restart avahi-daemon
```

**Verify from host machine**:
```bash
ping steamdeck1.local
ping steamdeck2.local
ping steamdeck3.local
```

## SSH Key Setup (Recommended)

To avoid password prompts for each device:

```bash
# On host machine (macOS)
ssh-keygen -t ed25519 -C "seacat-deployment"
ssh-copy-id deck@steamdeck1.local
ssh-copy-id deck@steamdeck2.local
ssh-copy-id deck@steamdeck3.local
```

Now SCP will work without password prompts.

## Open Questions

1. **Should we deploy in parallel?**
   - **No**: Sequential is simpler, and transfers are fast enough
   - Could revisit if user has 10+ devices

2. **Should we support per-device metadata?**
   - **No**: Simple hostname list is sufficient
   - Can add later if needed (e.g., player names, tokens)

3. **Should we auto-execute on Steam Deck?**
   - **No**: Requires SSH execution, more complex
   - User should run manually or add to Steam

4. **Should we ping devices before deploying?**
   - **Maybe**: Quick sanity check before SCP attempt
   - Adds ~1 second per device
   - Not critical (SCP will fail anyway if unreachable)

## References

- Steam Deck SSH: https://shendrick.net/Gaming/2022/05/30/sshonsteamdeck.html
- mDNS/Avahi: https://wiki.archlinux.org/title/Avahi
- GNU Parallel: https://www.gnu.org/software/parallel/
- SCP Best Practices: https://man.openbsd.org/scp
