# 🐱⛵ Seacat - Cozy Multiplayer Sailing Game

<div align="center">

A delightful isometric multiplayer sailing game where cats captain ships, fire cannons, and explore open waters together.

**Powered by [MEW Protocol](https://github.com/rjcorwin/mew-protocol)** 🚀

</div>

## 🎮 Game Features

- 🐱 **Multiplayer sailing** - Real-time position synchronization with other players
- ⛵ **Realistic ship controls** - Wheel steering with wheel physics and momentum
- 💣 **Ship-to-ship combat** - Cannon warfare with physics-based projectiles
- 👥 **Multi-crew coordination** - Multiple cats can crew the same ship
- 🗺️ **Tiled maps** - Custom worlds built in Tiled Map Editor
- 🎨 **Isometric rendering** - Pre-rendered 3D ship sprites with 8-directional characters
- 🔊 **Sound effects** - Cannon fire, impacts, water splashes, and more
- 🎯 **Manual aiming** - Adjust cannon angles for strategic combat

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.0.0
- npm or yarn

### Installation

```bash
git clone https://github.com/rjcorwin/seacat.git
cd seacat

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### Running the Game

**Start the server:**
```bash
cd server
mew space up
```

**Launch the client:**
```bash
cd client
npm start
```

The game client will launch in Electron, automatically connecting to your local MEW Protocol server.

## 🏗️ Architecture

Seacat is built on the [MEW Protocol](https://github.com/rjcorwin/mew-protocol), demonstrating how game clients can connect to MEW spaces as participants.

```
seacat/
├── client/          # Electron/Phaser game client
│   ├── src/         # TypeScript game code
│   ├── assets/      # Sprites, maps, sounds
│   └── package.json
├── server/          # MEW space configuration
│   ├── space.yaml   # Space definition
│   ├── mcp-servers/ # Ship MCP server
│   └── package.json
├── spec/            # Game specification
│   ├── SPEC.md      # Main spec
│   ├── proposals/   # Design proposals
│   └── CHANGELOG.md
└── docs/            # Documentation
```

## 📚 Documentation

- [Game Specification](spec/SPEC.md) - Complete game design and architecture
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to Seacat
- [Development Guide](docs/development.md) - Development setup and practices

## 🎯 Current Version

**v0.1.0** - Initial release

Seacat is in early development with active feature additions. See [CHANGELOG.md](CHANGELOG.md) for release history.

## 🤝 Contributing

Seacat follows a spec-driven development workflow. See [CONTRIBUTING.md](CONTRIBUTING.md) for details on:
- Creating proposals
- Implementing features
- Testing changes
- Submitting pull requests

## 🐈 Game Controls

### On Foot
- **WASD** - Move character
- **E** - Grab/release ship controls

### Ship Controls
- **Wheel** - A/D to steer
- **Sails** - W/S to adjust sail angle
- **Cannons** - Q/E to aim, Space to fire

## 📋 Roadmap

- ✅ Basic multiplayer sailing
- ✅ Ship combat system
- ✅ Tiled map support
- 🎯 Gamepad/controller support
- 🎯 Inventory and trading system
- 🎯 Island exploration and quests
- 🎯 Ship customization

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

Built with:
- [Phaser 3](https://phaser.io/) - Game engine
- [Electron](https://www.electronjs.org/) - Desktop app framework
- [MEW Protocol](https://github.com/rjcorwin/mew-protocol) - Multi-entity coordination
- [Howler.js](https://howlerjs.com/) - Audio library
