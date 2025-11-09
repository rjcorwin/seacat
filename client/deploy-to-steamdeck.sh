#!/bin/bash
set -e

echo "🎮 Deploying Seacat to Steam Deck..."

# Build for Linux
echo ""
echo "📦 Building Linux AppImage..."
npm run package:linux:docker

# Transfer AppImage to Steam Deck
echo ""
echo "📤 Transferring AppImage to Steam Deck (steamdeck.local)..."
scp release/Seacat-0.1.0.AppImage deck@steamdeck.local:~/

if [ $? -ne 0 ]; then
    echo "❌ Transfer failed. Is SSH enabled on Steam Deck?"
    echo "   On Steam Deck: sudo systemctl start sshd"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "On Steam Deck, run:"
echo "  chmod +x ~/Seacat-0.1.0.AppImage"
echo "  ~/Seacat-0.1.0.AppImage"
echo ""
echo "Or add to Steam and set launch options:"
echo "  --no-sandbox --gateway-url=ws://YOUR-SERVER:8080 --username=deckplayer --token=YOUR-TOKEN"
