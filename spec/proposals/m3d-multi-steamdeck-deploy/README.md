# m3d: Multi-Device Steam Deck Deployment

**Status**: Draft
**Created**: 2025-11-14

## Quick Summary

Extend the Steam Deck deployment script to deploy to multiple devices from a single command, enabling efficient multi-player testing across 3+ Steam Decks.

## Problem

Current deployment script (`deploy-to-steamdeck.sh`) only deploys to one device at a time. With 3 Steam Decks, user must manually deploy 3 times, which is slow and error-prone.

## Solution

- Configuration file (`steamdeck-hosts.txt`) lists all target devices
- Enhanced deployment script deploys to all devices sequentially
- Clear feedback on success/failure per device
- Backward compatible (still works without config file)
- Build once, deploy everywhere

## Example Usage

**Setup** (one-time):
```bash
cd client
cp steamdeck-hosts.txt.example steamdeck-hosts.txt
# Edit steamdeck-hosts.txt to add your device hostnames
```

**Deploy to all devices**:
```bash
cd client
npm run deploy:steamdeck
```

**Example output**:
```
🎮 Deploying Seacat to Steam Deck(s)...
📦 Building Linux AppImage...
🎯 Deploying to 3 device(s): steamdeck1.local steamdeck2.local steamdeck3.local

📤 Transferring to deck@steamdeck1.local...
✅ Deployed to steamdeck1.local

📤 Transferring to deck@steamdeck2.local...
✅ Deployed to steamdeck2.local

📤 Transferring to deck@steamdeck3.local...
✅ Deployed to steamdeck3.local

✅ Deployment complete!
```

## Files

- **[proposal.md](./proposal.md)** - Main proposal with technical details
- **[research.md](./research.md)** - Research on deployment approaches and constraints

## Implementation Status

- [x] Proposal created
- [x] Research completed
- [x] CHANGELOG entry added
- [ ] Implementation (Phase 1)
- [ ] Documentation updates (Phase 2)
- [ ] Testing with multiple devices

## Key Benefits

1. **Single Command**: Deploy to all Steam Decks at once
2. **Efficient**: Build AppImage once, deploy to all devices
3. **Resilient**: Continues deploying if one device fails
4. **Easy Setup**: Simple text file configuration
5. **Git-Friendly**: Personal configs excluded from version control

## Use Cases

- Local multiplayer testing (3+ players on separate devices)
- Rapid development iteration (deploy → test → repeat)
- Ship combat testing with multiple crew members
- Keeping all devices in sync during development
