# Steam Deck Build & Installation Guide

## Building for Steam Deck

### From macOS (using Docker)

**Prerequisites**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop)

```bash
cd client
npm run package:linux:docker
```

This uses Docker to build Linux binaries on your Mac. First run will take ~5 minutes to download the Docker image.

### From Linux

```bash
cd client
npm install
npm run package:linux
```

### Build Output

Both methods create files in `client/release/`:
- `Seacat-0.1.0.AppImage` - Self-contained executable for Steam Deck (x86_64)
- `@seacat/client-0.1.0.tar.gz` - Tarball archive

## Installing on Steam Deck

### Method 1: AppImage (Recommended - Easiest)

1. **Transfer the file** to your Steam Deck:
   - Use a USB drive
   - Or use SCP: `scp client/release/Seacat-0.1.0.AppImage deck@steamdeck:~/`
   - Or use the Steam Deck's browser to download from a file host

2. **Make it executable**:
   ```bash
   chmod +x ~/Seacat-0.1.0.AppImage
   ```

3. **Run it**:
   ```bash
   ~/Seacat-0.1.0.AppImage
   ```

### Method 2: Add to Steam as Non-Steam Game

1. Switch to Desktop Mode on Steam Deck (Power button → Switch to Desktop)

2. Transfer and make executable (same as Method 1)

3. **Add to Steam**:
   - Open Steam in Desktop Mode
   - Click "Games" → "Add a Non-Steam Game to My Library"
   - Click "Browse" and find your `Seacat-0.1.0.AppImage`
   - Select it and click "Add Selected Programs"

4. **Configure Launch Options** (optional):
   - Right-click the game in your library → Properties
   - Add any launch options if needed

5. **Return to Gaming Mode**:
   - The game will now appear in your library
   - You can launch it like any other game

## Connecting to Server

The Steam Deck will need network access to your server. Options:

1. **Same Network**: If your server and Steam Deck are on the same WiFi:
   - Use your local IP (e.g., `ws://192.168.1.100:8080`)

2. **Remote Server**: Host the server on a public machine:
   - Use ngrok or similar to expose the gateway
   - Connect using the public URL

3. **Steam Deck as Server** (Advanced):
   - Install Node.js on Steam Deck
   - Clone the repo and run the server locally
   - Connect to `ws://localhost:8080`

## Troubleshooting

### AppImage won't run
- Make sure you ran `chmod +x` on the file
- Some systems need FUSE: `sudo pacman -S fuse2` (in Desktop Mode)

### Can't connect to server
- Check firewall settings
- Verify server is running: `curl http://your-server-ip:8080`
- Make sure you're using `ws://` not `wss://` for local servers

### Performance issues
- Lower the resolution in-game if needed
- Close other applications
- Steam Deck works best at 720p or 800p

## Building from Steam Deck (Advanced)

You can also build directly on the Steam Deck:

1. Switch to Desktop Mode
2. Install development tools:
   ```bash
   sudo steamos-readonly disable
   sudo pacman -S base-devel git nodejs npm
   ```
3. Clone and build:
   ```bash
   git clone https://github.com/yourusername/seacat.git
   cd seacat/client
   npm install
   npm run package:linux
   ```

## Notes

- The AppImage is portable - you can move it anywhere
- Steam Deck runs SteamOS 3.0 (Arch Linux based)
- Controller input should work automatically via Phaser's gamepad support
- The game runs in Electron, which is Chromium-based
