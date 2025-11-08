# 🤖 Agent Quick Reference - Seacat

## Critical Docs (READ FIRST)
- Seacat Game Spec: spec/SPEC.md
- Contributing Guide: CONTRIBUTING.md
- Client README: client/README.md
- Server README: server/README.md

## Repository Structure
```
seacat/
├── client/              # Electron/Phaser game client
│   ├── src/
│   │   ├── game/
│   │   │   ├── managers/       # Game systems (ships, players, projectiles, etc.)
│   │   │   ├── rendering/      # Visual renderers (ships, water, effects, etc.)
│   │   │   ├── input/          # Input handlers (keyboard, gamepad)
│   │   │   ├── network/        # MEW Protocol networking
│   │   │   └── utils/          # Math, constants
│   │   ├── main.ts             # Electron main process
│   │   ├── renderer.ts         # Electron renderer process
│   │   └── types.ts            # Type definitions
│   ├── assets/
│   │   ├── sprites/            # Ship and player sprites
│   │   ├── maps/               # Tiled .tmj map files
│   │   └── sounds/             # Audio (cannons, impacts, etc.)
│   ├── index.html
│   ├── package.json
│   └── tsconfig.json
├── server/              # MEW space configuration
│   ├── mcp-servers/            # Ship MCP server (game logic)
│   │   ├── index.ts            # Entry point
│   │   ├── ShipServer.ts       # Core ship logic
│   │   ├── ShipParticipant.ts  # MEW Protocol integration
│   │   └── types.ts            # Ship types
│   ├── space.yaml              # MEW space configuration
│   ├── package.json
│   └── tsconfig.json
├── spec/                # Complete specification
│   ├── SPEC.md                 # Main game spec
│   ├── proposals/              # All design proposals (13+)
│   └── CHANGELOG.md            # Spec changelog
└── docs/                # Documentation
```

## Common Commands

### Client (Electron/Phaser)
```bash
cd client
npm install              # Install dependencies
npm run build            # Compile TypeScript
npm start                # Launch game in Electron
npm run dev              # Watch mode + auto-reload
```

### Server (MEW Space)
```bash
cd server
npm install              # Install dependencies
npm run build            # Compile ship MCP server
npm start                # Start MEW space (mew space up)
npm stop                 # Stop MEW space (mew space down)
npm run logs             # View PM2 logs
```

### Testing
```bash
# Start server
cd server && npm start

# In another terminal, start client
cd client && npm start

# View logs
cd server && tail -f .mew/logs/envelope-history.jsonl
cd server && pm2 logs --nostream
```

## Quick Development Guide

### Making Changes to Game Client

1. **Read existing patterns** - Check similar systems in `client/src/game/`
2. **Update types first** - `client/src/types.ts` or `client/src/game/utils/Constants.ts`
3. **Follow manager pattern** - Game logic goes in managers, rendering in renderers
4. **Test in-game** - Run both server and client to test changes
5. **Rebuild** - `cd client && npm run build`

### Making Changes to Ship Server

1. **Update ship logic** - `server/mcp-servers/ShipServer.ts`
2. **Update MEW integration** - `server/mcp-servers/ShipParticipant.ts`
3. **Update types** - `server/mcp-servers/types.ts`
4. **Rebuild** - `cd server && npm run build`
5. **Restart space** - `npm stop && npm start`

### Adding New Protocol Messages

1. **Document in proposal** - Create in `spec/proposals/XXX-name/`
2. **Update ship server** - Handle message in `ShipParticipant.ts`
3. **Update client network** - Handle message in `client/src/game/network/NetworkClient.ts`
4. **Test message flow** - Send message, verify receipt
5. **Update spec** - Incorporate into `spec/SPEC.md`

## Spec-Driven Development (IMPORTANT!)

Seacat follows a spec-driven workflow. See `CONTRIBUTING.md` for full details.

**Quick workflow:**
1. **Proposal** - Create in `spec/proposals/XXX-name/` (use 3-char code like `a7z`, `k3p`)
2. **Research** - Document in `proposal.md`, `research.md`
3. **Decisions** - Create `decision-XXX-name.md` files for key choices
4. **Implementation** - Add `implementation.md` for complex features
5. **Code** - Implement in client and/or server
6. **CHANGELOG** - Track status in `spec/CHANGELOG.md`

**Proposal structure:**
```
spec/proposals/XXX-feature-name/
├── proposal.md           # Main spec (motivation, goals, design)
├── research.md           # Background research, constraints
├── decision-XXX-name.md  # Individual decisions (ADR-style)
└── implementation.md     # Step-by-step plan (optional)
```

## Architecture Overview

### Client Architecture (Phaser 3 + Electron)

**Manager Pattern:**
- `GameScene.ts` - Orchestrator (~500 lines, delegates to managers)
- `managers/` - Game systems (ships, players, collisions, projectiles, map)
- `rendering/` - Visual output (ships, water, effects, players)
- `input/` - User input (keyboard, gamepad planned)
- `network/` - MEW Protocol client integration
- `utils/` - Shared utilities (math, constants)

**Key Systems:**
- **ShipManager** - Ship movement, controls, state
- **PlayerManager** - Character movement, ship boarding
- **ProjectileManager** - Cannonball physics and collisions
- **MapManager** - Tiled map loading and collision
- **NetworkClient** - MEW Protocol message handling

### Server Architecture (MEW Protocol Space)

**Ship MCP Server:**
- Manages ship state (position, rotation, health, velocity)
- Handles control requests (grab/release wheel, adjust sails, fire cannons)
- Broadcasts position updates (60 FPS to all connected clients)
- Processes damage and combat

**Space Configuration (`space.yaml`):**
- 4 human player participants (player1-4)
- 2 ship MCP servers (ship1, ship2)
- 4 AI agent participants (agent1-4)
- Streams for position synchronization

## Game Features

### Implemented ✅
- Multiplayer sailing with real-time position sync
- Ship controls (wheel steering, sail adjustment)
- Multi-crew coordination (multiple players per ship)
- Ship-to-ship combat (cannons with physics-based projectiles)
- Tiled map support with collision detection
- Sound effects (Howler.js)
- Pre-rendered 3D ship sprites (16 rotation angles)
- Damage/health system with ship sinking/respawn

### In Progress 🎯
- Diamond viewport (performance culling)
- Gamepad/controller support

## Important Rules

- **DON'T** modify `dist/` or build outputs directly
- **DON'T** commit without testing (run both client and server)
- **DON'T** skip the spec-driven workflow for features
- **DO** follow TypeScript strict mode
- **DO** run `npm run build` after changes
- **DO** update specs if changing game mechanics
- **DO** use manager pattern for client code
- **DO** add JSDoc comments for public APIs

## Key Files

### Client
- Main game: `client/src/game/GameScene.ts`
- Ship rendering: `client/src/game/rendering/ShipRenderer.ts`
- Ship controls: `client/src/game/managers/ShipManager.ts`
- Player movement: `client/src/game/managers/PlayerManager.ts`
- Network: `client/src/game/network/NetworkClient.ts`
- Constants: `client/src/game/utils/Constants.ts`

### Server
- Ship server entry: `server/mcp-servers/index.ts`
- Ship logic: `server/mcp-servers/ShipServer.ts`
- MEW integration: `server/mcp-servers/ShipParticipant.ts`
- Space config: `server/space.yaml`

### Spec
- Main spec: `spec/SPEC.md`
- Proposals: `spec/proposals/*/`
- Changelog: `spec/CHANGELOG.md`

## Dependencies

**Client:**
- Phaser 3 (game engine)
- Electron (desktop framework)
- Howler.js (audio)
- @mew-protocol/mew (networking)

**Server:**
- @mew-protocol/mew (protocol SDK)
- Node.js 22+

## Debugging

### Client Issues
```bash
# Check browser console (Electron DevTools)
# Press F12 or Cmd+Option+I

# View network messages
# Check GameScene.ts console.log statements

# Check assets loading
# Look for 404 errors in network tab
```

### Server Issues
```bash
# View all logs
pm2 logs --nostream

# View specific participant
pm2 logs {{SPACE_NAME}}-ship1

# View envelope history
tail -f .mew/logs/envelope-history.jsonl

# Check ship server output
tail -f logs/ship1.log
```

### Common Issues

1. **Ships not appearing** - Check ship MCP servers are running (`pm2 list`)
2. **Client won't build** - Ensure `npm install` ran successfully
3. **Server won't start** - Run `npm run build` to compile ship server
4. **Connection errors** - Verify gateway is on port 8080
5. **Audio not working** - Howler.js requires absolute paths (see ShipRenderer.ts)

## Performance Notes

- Ship position updates broadcast at 60 FPS
- Map rendering uses tile-based culling
- Phaser uses WebGL renderer
- Diamond viewport (upcoming) will improve performance

## Testing Guidelines

1. **Start server first** - `cd server && npm start`
2. **Launch client** - `cd client && npm start`
3. **Test multiplayer** - Run multiple client instances
4. **Test ship controls** - Walk to ship, press E to grab wheel
5. **Test combat** - Grab cannons (E), aim (Q/E), fire (Space)
6. **Check logs** - Verify messages flowing correctly

## Making a PR

1. Follow spec-driven workflow (see CONTRIBUTING.md)
2. Create proposal in `spec/proposals/XXX-name/`
3. Update main spec (`spec/SPEC.md`)
4. Add CHANGELOG entry (`spec/CHANGELOG.md`)
5. Implement code changes
6. Test thoroughly (client + server)
7. Open draft PR with proposal + code
8. Mark ready for review when complete

## Need Help?

- Read the spec: `spec/SPEC.md`
- Check existing proposals: `spec/proposals/*/`
- Review CONTRIBUTING.md
- Look at similar features for patterns

When in doubt, the specification is the source of truth!
