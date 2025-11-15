# Proposal m3d: Multi-Device Steam Deck Deployment

**Status**: Draft
**Created**: 2025-11-14
**Area**: Seacat Development Tools
**Implemented**: No

## Summary

Extend the Steam Deck deployment script to support deploying to multiple Steam Deck devices simultaneously. Instead of hardcoding a single device (`steamdeck.local`), the script will read from a configuration file listing all target devices, enabling efficient testing and deployment across multiple Steam Decks.

## Motivation

**Current Problem**:
- The existing `deploy-to-steamdeck.sh` script only deploys to one device (`steamdeck.local`)
- User now has 3 Steam Decks for local multiplayer testing
- Must run deployment script 3 times manually, editing the hostname each time
- Error-prone and time-consuming during rapid development iteration

**User Experience Need**:
- Deploy to all Steam Decks with a single command
- Keep all devices in sync during development
- Test multiplayer scenarios with multiple physical devices
- Reduce friction during iteration cycles

**Use Cases**:
- **Local Multiplayer Testing**: Quickly deploy to 3 Steam Decks for 3-player testing
- **Development Iteration**: Make changes, deploy everywhere, test immediately
- **Ship Combat Testing**: Test ship-to-ship combat with multiple crew members
- **Device Fleet Management**: Easily add/remove devices from deployment targets

## Goals

### Primary Goals
1. Deploy to multiple Steam Deck devices with a single command
2. Use a simple configuration file to specify target devices
3. Provide clear feedback on deployment success/failure per device
4. Continue deploying to remaining devices if one fails (resilient)
5. Maintain backward compatibility (single device still works)

### Secondary Goals
6. Keep configuration out of version control (personal device lists)
7. Provide template/example configuration for easy setup
8. Minimize dependencies (no extra tools to install)
9. Build AppImage only once (not per device)

## Non-Goals

- Parallel deployment (sequential is fast enough for 3-10 devices)
- Automatic SSH key setup (user handles this manually)
- Remote execution on Steam Deck (user runs manually)
- Per-device configuration (player names, tokens, etc.)
- Device discovery/auto-detection (user lists devices explicitly)
- Support for non-Steam Deck targets (focused on Steam Deck only)

## Technical Approach

### Configuration File

**File**: `client/steamdeck-hosts.txt`
**Format**: Line-delimited hostnames or IP addresses
**Example**:
```
# My Steam Decks - one per line
steamdeck1.local
steamdeck2.local
steamdeck3.local

# Can also use IP addresses
# 192.168.1.101
# 192.168.1.102
```

**Git Handling**:
- `steamdeck-hosts.txt` is git-ignored (personal device list)
- `steamdeck-hosts.txt.example` is committed (template)
- Users copy example to create their own configuration

### Script Logic

**Enhanced `deploy-to-steamdeck.sh`**:
```bash
#!/bin/bash
set -e

echo "🎮 Deploying Seacat to Steam Deck(s)..."

# Build AppImage once
echo ""
echo "📦 Building Linux AppImage..."
npm run package:linux:docker

# Read device list
HOSTS_FILE="steamdeck-hosts.txt"
if [ ! -f "$HOSTS_FILE" ]; then
  echo "⚠️  No $HOSTS_FILE found, deploying to single device (steamdeck.local)"
  DEVICES=("steamdeck.local")
else
  echo "📋 Reading devices from $HOSTS_FILE"
  # Read lines, skip comments and empty lines
  DEVICES=()
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue
    DEVICES+=("$line")
  done < "$HOSTS_FILE"
fi

echo "🎯 Deploying to ${#DEVICES[@]} device(s): ${DEVICES[*]}"
echo ""

# Deploy to each device
SUCCESS=()
FAILED=()

for device in "${DEVICES[@]}"; do
  echo "📤 Transferring to deck@$device..."

  if scp release/Seacat-0.1.0.AppImage deck@$device:~/; then
    echo "✅ Deployed to $device"
    SUCCESS+=("$device")
  else
    echo "❌ Failed to deploy to $device"
    FAILED+=("$device")
  fi
  echo ""
done

# Print summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${#SUCCESS[@]} -gt 0 ]; then
  echo "✅ Deployed to ${#SUCCESS[@]} device(s):"
  for device in "${SUCCESS[@]}"; do
    echo "   - $device"
  done
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo "❌ Failed to deploy to ${#FAILED[@]} device(s):"
  for device in "${FAILED[@]}"; do
    echo "   - $device"
  done
  echo ""
  echo "💡 Troubleshooting:"
  echo "   - Check SSH is enabled: sudo systemctl start sshd"
  echo "   - Verify hostname/IP is correct"
  echo "   - Check network connectivity"
  exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "On each Steam Deck, run:"
echo "  chmod +x ~/Seacat-0.1.0.AppImage"
echo "  ~/Seacat-0.1.0.AppImage"
echo ""
echo "Or add to Steam with launch options:"
echo "  --no-sandbox --gateway-url=ws://YOUR-SERVER:8080 --username=deckplayer --token=YOUR-TOKEN"
```

### Example Configuration Template

**File**: `client/steamdeck-hosts.txt.example`
```
# Steam Deck Deployment Targets
# Copy this file to steamdeck-hosts.txt and customize for your devices
#
# Format: One hostname or IP address per line
# Lines starting with # are comments

# Example using mDNS hostnames (requires unique hostnames on each deck)
steamdeck1.local
steamdeck2.local
steamdeck3.local

# Example using IP addresses (more reliable on some networks)
# 192.168.1.101
# 192.168.1.102
# 192.168.1.103

# To set unique hostname on each Steam Deck:
#   sudo hostnamectl set-hostname steamdeckN
#   sudo systemctl restart avahi-daemon
```

### Git Configuration

**Add to `client/.gitignore`**:
```
# Steam Deck deployment configuration (personal device list)
steamdeck-hosts.txt
```

**Commit to repository**:
- `steamdeck-hosts.txt.example` - Template file
- Updated `deploy-to-steamdeck.sh` - Enhanced script
- Updated `.gitignore` - Exclude personal config

## Implementation Phases

### Phase 1: Core Multi-Device Deployment
**Goal**: Deploy to multiple devices from configuration file

**Tasks**:
1. Create `steamdeck-hosts.txt.example` template
2. Update `deploy-to-steamdeck.sh` with multi-device logic
3. Add `steamdeck-hosts.txt` to `.gitignore`
4. Test with 2-3 Steam Decks
5. Update `STEAMDECK.md` documentation

**Acceptance Criteria**:
- Single command deploys to all listed devices
- Clear success/failure feedback per device
- Continues on partial failure
- Backward compatible (works without config file)
- Template file is clear and helpful

### Phase 2: Documentation & User Setup
**Goal**: Help users set up their devices for deployment

**Tasks**:
1. Document hostname setup in `STEAMDECK.md`
2. Document SSH key setup (password-less deployment)
3. Add troubleshooting guide for common errors
4. Update `CONTRIBUTING.md` with multi-device testing workflow

**Acceptance Criteria**:
- Clear instructions for setting unique hostnames
- SSH key setup documented
- Common errors explained with solutions
- Easy for new contributors to set up

### Phase 3: Optional Enhancements (Future)
**Goal**: Quality of life improvements

**Possible Enhancements**:
- Pre-deployment connectivity check (ping devices first)
- Parallel deployment for larger device fleets (10+ devices)
- Post-deployment actions (SSH to run commands)
- Device metadata (nicknames, player assignments)

## User Setup Guide

### Prerequisites

**On each Steam Deck** (one-time setup):
1. **Enable SSH**:
   ```bash
   # In Desktop Mode
   sudo systemctl enable sshd
   sudo systemctl start sshd
   ```

2. **Set unique hostname** (avoids `steamdeck.local` collision):
   ```bash
   sudo hostnamectl set-hostname steamdeck1  # or steamdeck2, steamdeck3
   sudo systemctl restart avahi-daemon
   ```

3. **Set password** (if not already set):
   ```bash
   passwd
   ```

**On development machine** (one-time setup):
1. **Set up SSH keys** (optional, but recommended):
   ```bash
   ssh-keygen -t ed25519 -C "seacat-deployment"
   ssh-copy-id deck@steamdeck1.local
   ssh-copy-id deck@steamdeck2.local
   ssh-copy-id deck@steamdeck3.local
   ```

2. **Create device configuration**:
   ```bash
   cd client
   cp steamdeck-hosts.txt.example steamdeck-hosts.txt
   # Edit steamdeck-hosts.txt with your device hostnames
   ```

### Deployment Workflow

**Deploy to all Steam Decks**:
```bash
cd client
npm run deploy:steamdeck
```

**Expected output**:
```
🎮 Deploying Seacat to Steam Deck(s)...

📦 Building Linux AppImage...
[build output...]

📋 Reading devices from steamdeck-hosts.txt
🎯 Deploying to 3 device(s): steamdeck1.local steamdeck2.local steamdeck3.local

📤 Transferring to deck@steamdeck1.local...
✅ Deployed to steamdeck1.local

📤 Transferring to deck@steamdeck2.local...
✅ Deployed to steamdeck2.local

📤 Transferring to deck@steamdeck3.local...
✅ Deployed to steamdeck3.local

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Deployment Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Deployed to 3 device(s):
   - steamdeck1.local
   - steamdeck2.local
   - steamdeck3.local

✅ Deployment complete!
```

## Testing

### Test Scenarios

1. **Single device deployment** (backward compatibility):
   - Remove `steamdeck-hosts.txt`
   - Run `npm run deploy:steamdeck`
   - Verify deploys to `steamdeck.local`

2. **Multi-device deployment** (happy path):
   - Create `steamdeck-hosts.txt` with 3 devices
   - All devices online and accessible
   - Verify all devices receive AppImage

3. **Partial failure** (resilience):
   - List 3 devices, but one is offline
   - Verify script continues and reports failure
   - Verify other 2 devices receive AppImage

4. **Empty/invalid config**:
   - Create `steamdeck-hosts.txt` with only comments
   - Verify graceful handling

5. **Network errors**:
   - List device with wrong hostname
   - Verify clear error message
   - Verify script continues to next device

### Success Metrics

- ✅ Deploy to all 3 Steam Decks in under 1 minute (after build)
- ✅ Clear feedback on success/failure per device
- ✅ No manual editing of script required
- ✅ Easy to add/remove devices (edit text file)
- ✅ New contributors can set up in under 5 minutes

## Documentation Updates

### Files to Update

1. **`STEAMDECK.md`**:
   - Add section on multi-device deployment
   - Document hostname setup
   - Document SSH key setup
   - Add troubleshooting for common errors

2. **`CONTRIBUTING.md`**:
   - Update deployment workflow for multiple devices
   - Add setup instructions for multi-device testing

3. **`client/README.md`**:
   - Mention multi-device deployment capability
   - Link to STEAMDECK.md for setup

## Future Enhancements

### Parallel Deployment
If user scales to 10+ devices, consider parallel deployment:
- Use GNU `parallel` or bash background jobs
- Deploy to all devices simultaneously
- More complex output handling

### Device Metadata
Store additional info per device:
```json
{
  "devices": [
    { "host": "steamdeck1.local", "player": "player1", "token": "abc123" },
    { "host": "steamdeck2.local", "player": "player2", "token": "def456" }
  ]
}
```

### Post-Deployment Automation
Automatically run commands on Steam Deck after deployment:
```bash
ssh deck@steamdeck1.local "chmod +x ~/Seacat-0.1.0.AppImage && ./Seacat-0.1.0.AppImage --no-sandbox &"
```

### Device Discovery
Auto-detect Steam Decks on network:
```bash
# Scan for devices advertising _ssh._tcp service
avahi-browse -t _ssh._tcp
```

## Risk Assessment

### Low Risk
- Backward compatibility (falls back to single device)
- Simple text file parsing (robust)
- No external dependencies

### Medium Risk
- User must set up devices correctly (hostnames, SSH)
- Network issues could cause confusion
- File format errors (mitigated by clear error messages)

### Mitigation Strategies
- Clear documentation and examples
- Helpful error messages with troubleshooting hints
- Example file shows correct format
- Script validates configuration before deploying

## Success Criteria

- ✅ User can deploy to 3 Steam Decks with one command
- ✅ Clear feedback on deployment status per device
- ✅ No need to edit shell scripts
- ✅ Easy to add/remove devices
- ✅ Resilient to partial failures
- ✅ Well-documented setup process
- ✅ New contributors can set up quickly

## Open Questions

1. **Should we ping devices before deploying?**
   - **Recommendation**: Yes, quick check saves time on SCP timeout
   - Adds ~1 second per device

2. **Should we validate mDNS resolution?**
   - **Recommendation**: No, let SCP fail naturally with clear error

3. **Should we support remote (non-LAN) deployments?**
   - **Recommendation**: Out of scope, but hostnames can be any SSH target

4. **Should we add device nicknames for output?**
   - **Recommendation**: Not in Phase 1, hostname is sufficient

## Resources

- **Development Time**: ~2 hours (script + docs)
- **Testing Time**: ~1 hour (multiple device scenarios)
- **User Setup Time**: ~5 minutes (first time)
- **Dependencies**: None (bash, scp, ssh - already required)

## References

- Current deployment: `client/deploy-to-steamdeck.sh`
- Current docs: `STEAMDECK.md`
- Related: Steam Deck development workflow
- Pattern: Configuration file for environment-specific settings
