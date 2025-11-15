#!/bin/bash
set -e

echo "🎮 Deploying Seacat to Steam Deck(s)..."

# Build for Linux
echo ""
echo "📦 Building Linux AppImage..."
npm run package:linux:docker

# Read device list
HOSTS_FILE="steamdeck-hosts.txt"
if [ ! -f "$HOSTS_FILE" ]; then
  echo ""
  echo "⚠️  No $HOSTS_FILE found, deploying to single device (steamdeck.local)"
  echo "💡 Tip: Create $HOSTS_FILE to deploy to multiple devices"
  echo "   cp steamdeck-hosts.txt.example steamdeck-hosts.txt"
  DEVICES=("steamdeck.local")
else
  echo ""
  echo "📋 Reading devices from $HOSTS_FILE"
  # Read lines, skip comments and empty lines
  DEVICES=()
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue
    DEVICES+=("$line")
  done < "$HOSTS_FILE"

  if [ ${#DEVICES[@]} -eq 0 ]; then
    echo "❌ No devices found in $HOSTS_FILE"
    echo "   Add at least one hostname or IP address"
    exit 1
  fi
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
  echo "✅ Successfully deployed to ${#SUCCESS[@]} device(s):"
  for device in "${SUCCESS[@]}"; do
    echo "   - $device"
  done
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "❌ Failed to deploy to ${#FAILED[@]} device(s):"
  for device in "${FAILED[@]}"; do
    echo "   - $device"
  done
  echo ""
  echo "💡 Troubleshooting:"
  echo "   - Check SSH is enabled: sudo systemctl start sshd"
  echo "   - Verify hostname/IP is correct"
  echo "   - Check network connectivity: ping $device"
  echo "   - Set up SSH keys to avoid password prompts:"
  echo "     ssh-copy-id deck@$device"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${#FAILED[@]} -gt 0 ]; then
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
