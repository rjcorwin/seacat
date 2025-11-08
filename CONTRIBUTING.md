# Contributing to Seacat

Thank you for contributing to Seacat! This guide covers how to contribute changes, from initial design through implementation to release.

---

## Quick Start

1. Fork and clone the repository
2. `cd client && npm install && npm run build`
3. `cd ../server && npm install`
4. Make changes following the workflow below
5. Test your changes (run client + server)
6. Submit PR

---

## Spec-Driven Development Workflow

Seacat follows a spec-driven development approach where specifications are designed and documented before code implementation. All changes begin with a CHANGELOG entry that tracks the proposal and implementation status throughout the lifecycle.

**Note:** If you've already implemented code changes, that's okay! Before opening your PR, create a proposal documenting the design, incorporate it into the relevant spec, and add a CHANGELOG entry. This ensures we maintain clear documentation of all changes.

### Lifecycle Stages

1. **Draft** - Add CHANGELOG entry, design and write proposals in proposals/ (in Draft PR)
2. **Incorporate** - Update specs, mark CHANGELOG entry as needing implementation (still Draft PR)
3. **Implementation Planning** - Create implementation.md in proposal directory if needed (still Draft PR)
4. **Implementation** - Write code, tests, examples, update CHANGELOG status (still Draft PR)
5. **Review** - Get feedback, iterate or revert if needed (PR Ready for Review)
6. **Merge** - Merge approved changes (specs + code together)
7. **Release** - Tag version with all merged changes (happens later)

### Folder Structure & Naming

**Proposals:** `spec/proposals/XXX-name/`
- XXX = unique 3-character alphanumeric code (e.g., `a7z`, `k3p`, `m9w`; avoid 001, 002, or bat, tok)
- name = kebab-case description (e.g., `message-batching`, `token-limits`)
- Each proposal directory contains:
  - `proposal.md` - Main specification with motivation, goals, technical details
  - `research.md` - Background research, constraints, current state, prior art
  - `decision-XXX-name.md` - Individual ADR-style decision records as needed
  - `implementation.md` - Step-by-step implementation plan (optional, for complex changes)

### Core Documents

- **Proposals** - Design rationale, research, decisions, and implementation plans (stay in `proposals/` permanently)
- **Main Specs** - Authoritative documentation (updated from proposals)
- **CHANGELOG.md** - Tracks status of all proposals (Draft → Needs Implementation → In Progress → Done → Released)

---

## Development Setup

### Client Development

```bash
cd client
npm install
npm run dev     # Watch mode + auto-reload
```

### Server Development

```bash
cd server
npm install
mew space up    # Start MEW space
```

### Testing Your Changes

1. Start the server in one terminal: `cd server && mew space up`
2. Start the client in another: `cd client && npm start`
3. Test multiplayer by running multiple client instances
4. Check logs: `tail -f server/.mew/logs/envelope-history.jsonl`

---

## Submitting PRs

### PR Guidelines

- Keep PRs focused on a logical unit of changes (may include multiple proposals)
- Follow the spec-driven workflow above
- Test gameplay changes with multiple clients
- Update specs if changing game mechanics/behavior
- Include screenshots/videos for visual changes

### PR Structure

A typical PR includes:
1. **Proposals** in `spec/proposals/XXX-name/` (with optional implementation.md)
2. **Spec updates** incorporating the proposals
3. **CHANGELOG entries** tracking status
4. **Code implementation** in client/ and/or server/

### Review Process

- Open as **Draft PR** while working through stages 1-4
- Mark **Ready for Review** when implementation is complete
- Address feedback; may need to iterate or revert to draft
- Once approved, maintainers will merge

---

## Getting Help

- Open an issue for questions or discussions
- Check existing proposals in `spec/proposals/` for examples
- Join the [MEW Protocol Discord](https://discord.gg/mew-protocol) (coming soon!)

---

## Common Tasks

### Adding a New Game Feature

1. Create proposal: `spec/proposals/XXX-feature-name/proposal.md`
2. Add CHANGELOG entry in "Unreleased" section
3. Update `spec/SPEC.md` with feature description
4. Implement in `client/src/` (usually in a manager or renderer)
5. Update server if needed (MCP messages, space.yaml)
6. Test with multiple clients
7. Submit PR

### Adding a New MCP Message Type

1. Create proposal documenting the message
2. Update server MCP server: `server/mcp-servers/ship-server/`
3. Update client to send/receive: `client/src/network/`
4. Update spec with message format
5. Test message flow
6. Submit PR

### Creating New Maps

1. Use [Tiled Map Editor](https://www.mapeditor.org/)
2. Save as JSON format (.tmj)
3. Place in `client/assets/maps/`
4. See `client/assets/maps/README.md` for tileset details
5. Test collision and rendering
6. Submit PR with map file

---

## Code Style

### Client Code (TypeScript/Phaser)

- Use TypeScript strict mode
- Add JSDoc comments for public APIs
- Follow manager pattern for game systems
- Keep GameScene as orchestrator (delegate to managers)
- Use descriptive variable names
- Group related functionality in modules

### Server Code (MEW Space)

- Follow MEW Protocol conventions
- Document space.yaml changes
- Keep MCP server implementations focused
- Test with multiple clients

---

## Architecture

Seacat follows a clean architecture pattern:

**Client:**
- `src/game/GameScene.ts` - Main orchestrator
- `src/managers/` - Game system logic (ships, players, collisions, etc.)
- `src/rendering/` - Visual rendering (sprites, effects, water, etc.)
- `src/input/` - Input handling (keyboard, mouse, gamepad)
- `src/network/` - MEW Protocol communication

**Server:**
- `space.yaml` - Space configuration
- `mcp-servers/` - Game logic MCP servers (ship operations, etc.)

---

## Performance Guidelines

- Profile before optimizing
- Use object pooling for frequently created/destroyed objects (projectiles, effects)
- Cull rendering for off-screen entities
- Batch sprite drawing when possible
- Keep network messages compact

---

## Need More Examples?

Check out existing proposals in `spec/proposals/` to see how features are designed and implemented:
- `s7g-gamescene-refactor/` - Large refactoring example
- `c5x-ship-combat/` - Multi-phase feature implementation
- `h4v-grabable-hover-indicator/` - Small polish feature
