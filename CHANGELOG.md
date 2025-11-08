# Seacat Changelog

All notable changes to Seacat will be documented in this file.

## [Unreleased]

### Next

#### Proposed: Diamond Viewport & Diorama Framing (d7v-diamond-viewport)
**Status:** Draft 📝
**Proposal:** `spec/proposals/d7v-diamond-viewport/`

Performance and aesthetic improvements to rendering system by limiting visible area to a diamond-shaped (rotated square) proximity zone around the player.

**Planned Features:**
- Square diamond render boundary (20×20 tiles, rotated 45°)
- Diorama-style presentation with visible draw distance edges
- Asymmetric border padding (more sky, less sea) for aesthetic balance
- Static background image as foundation (sky/sea separation at horizon)
- Configurable viewport size and borders for gameplay tuning
- Dynamic window sizing based on viewport configuration
- Future support for animated backgrounds (day/night cycle, weather)

**Goals:**
- Improve rendering performance by culling distant tiles/entities
- Create aesthetically pleasing "model ship in a box" presentation
- Enable future dynamic backgrounds without affecting world rendering
- Maintain fair gameplay with consistent view distance for all players

#### Proposed: Gamepad/Controller Support (g4p-controller-support)
**Status:** Research Complete, Awaiting Review 📋
**Proposal:** `spec/proposals/g4p-controller-support/`
**Research:** `spec/proposals/g4p-controller-support/research.md`

Add comprehensive gamepad/controller support using Phaser 3's Gamepad API (W3C Gamepad API wrapper).

**Platforms:**
- ✅ Web browsers (Chrome, Firefox, Edge)
- ✅ Electron desktop (Windows, macOS, Linux)
- ✅ Steam / Steam Deck

**Supported Controllers:**
- Xbox One/Series controllers
- PlayStation DualShock 4/DualSense
- Nintendo Switch Pro Controller
- Generic USB gamepads
- Steam Deck built-in controls

**Planned Features:**
- Full gameplay with controller-only (no keyboard/mouse required)
- Analog stick movement and aiming
- Ship steering and cannon control via gamepad
- Controller-specific button prompts (e.g., "[A]" vs "[✕]")
- Seamless keyboard ↔ controller switching
- Multiple controller support for local multiplayer
- Proper deadzone handling for analog sticks
- Connect/disconnect handling

**Implementation Phases:**
- Phase 1: Foundation (basic character movement)
- Phase 2: Ship Controls (steering, sails, cannons)
- Phase 3: Input Abstraction (unified keyboard + gamepad system)
- Phase 4: Polish (button prompts, settings, testing)
- Phase 5: Multi-Controller (optional local multiplayer)
- Phase 6: Steam Integration (optional Steam Input API)

**Estimated Effort:** 2-3 weeks (Phases 1-4)

---

## [0.1.0] - 2025-11-08

### Initial Release

First standalone release of Seacat as an independent game built on MEW Protocol.

**Game graduated from mew-protocol repository to its own home!** 🎉

### Features

#### Core Gameplay
- 🐱 **Multiplayer sailing** - Real-time position synchronization
- ⛵ **Ship controls** - Realistic wheel steering with momentum
- 💣 **Ship combat** - Cannon warfare with physics-based projectiles
- 👥 **Multi-crew** - Multiple cats can crew the same ship
- 🗺️ **Tiled maps** - Custom worlds built in Tiled Map Editor
- 🎨 **Isometric rendering** - Pre-rendered 3D ship sprites
- 🔊 **Sound effects** - Cannon fire, impacts, water splashes

#### Implemented Features

**Grabable Hover Indicator (h4v-grabable-hover-indicator)**
- Visual hover indicator above ship control points
- Green chevron arrow with bobbing animation
- Independent of control point visibility
- Works for wheel, sails, mast, cannons

**GameScene Refactor (s7g-gamescene-refactor)**
- Refactored monolithic GameScene.ts (2603 lines → ~500 lines)
- 15 focused modules with manager pattern
- Comprehensive JSDoc documentation
- Clean separation of concerns

**Ship-to-Ship Combat (c5x-ship-combat)**
- Cannon control points (3 per side: port/starboard)
- Manual aiming system (±45° arc adjustment)
- Physics-based projectiles with gravity
- Damage/health system (100 HP, sinking at 0)
- Visual effects (trails, explosions, splash, smoke)
- Audio effects (5 sounds via Howler.js)
- Ship sinking animation and respawn mechanics

**Tiled Map Integration (t4m)**
- Load isometric maps from Tiled Map Editor (JSON format)
- Multiple layer support (Ground, Water, Obstacles)
- Tile-based collision detection (O(1) lookups)
- Map boundary enforcement
- Tile properties: walkable, speedModifier, terrain
- Water tiles reduce speed to 50%
- Wall tiles block movement

**Ship Sprite Rendering (s6r)**
- Pre-rendered 3D ship sprites from Blender
- 16 rotation angles for smooth turning
- Isometric perspective matching
- Professional ship appearance

**Wheel Steering (w3l)**
- Realistic wheel physics and momentum
- Smooth ship rotation and movement
- Intuitive keyboard controls (A/D to steer)

### Architecture

**Client:**
- Electron/Phaser 3 game client
- TypeScript with strict mode
- Manager pattern for game systems
- 15 focused modules (managers, renderers, input, network, utils)

**Server:**
- MEW Protocol space configuration
- Ship MCP server for game operations
- Real-time multiplayer synchronization

### Documentation
- Complete game specification in `spec/SPEC.md`
- 13 design proposals in `spec/proposals/`
- Contributing guide with spec-driven workflow
- Development setup guide

### Technical Notes
- Built with Phaser 3.90.0
- Electron 28.0.0 for desktop
- Audio via Howler.js (Phaser audio has Electron XHR issues)
- MEW Protocol v0.6.2+

---

## History

Seacat was originally developed as part of the mew-protocol repository to demonstrate MEW Protocol's capabilities for real-time multiplayer games. With v0.1.0, it has graduated to its own repository with independent development.

For historical changelog entries from the mew-protocol repository, see the git history or mew-protocol's CHANGELOG.md versions 0.6.0-0.6.2.
