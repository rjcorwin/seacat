# Code Review Guide - h2c-human-cannonball

**Recommended reading order:**

## 1. Start with proposal (understand the design)

- `spec/proposals/h2c-human-cannonball/proposal.md` (skim for context)
- `spec/proposals/h2c-human-cannonball/decision-h2c-loading-interaction.md` (interaction design)

## 2. Type definitions (understand data structures)

- `client/src/types.ts` - Lines 138-149 (cannon ammo type), Line 177 (projectile sprite union)
- `server/mcp-servers/types.ts` - Lines 1-5 (AmmunitionType enum), Lines 24-26 (cannon state)

## 3. Server implementation (how it works)

- `server/mcp-servers/ShipParticipant.ts` - Lines 241-247 (cycle_ammo handler)
- `server/mcp-servers/ShipServer.ts` - Lines 526-561 (handleCycleAmmunition)
- `server/mcp-servers/ShipServer.ts` - Lines 650-789 (fireProjectile with human support)

## 4. Client input handling (user interaction)

- `client/src/game/input/ShipInputHandler.ts` - Lines 267-281 (Tab/LB/RB cycling)
- `client/src/game/network/ShipCommands.ts` - Lines 308-327 (cycleAmmunition command)

## 5. Client projectile physics (the core mechanic)

- `client/src/game/managers/ProjectileManager.ts` - Lines 104-148 (spawn with player sprite)
- `client/src/game/managers/ProjectileManager.ts` - Lines 299-402 (landing detection - CRITICAL)

## 6. Ship boarding integration (Phase 4)

- `client/src/game/GameScene.ts` - Lines 391-417 (player-landed event handler)

## 7. UI/Visual polish

- `client/src/game/rendering/ShipRenderer.ts` - Lines 273-290 (ammo indicator)

## 8. Specification updates

- `spec/SPEC.md` - Lines 1407-1467 (Phase 6 section)
- `spec/CHANGELOG.md` - Lines 10-23 (status tracking)

---

## Critical sections to review carefully

**⚠️ ProjectileManager.ts:299-402** (landing detection has coordinate system gotcha)
- Must use screen coordinates (sprite.x/y) for ship collision, NOT ground coordinates
- This was a bug that caused landing detection to always fail

**⚠️ ProjectileManager.ts:245-296** (ship damage skip for human cannonballs)
- Human cannonballs must skip ship damage collision check
- Added `if (proj.type !== 'human_cannonball')` wrapper
- This was a critical bug that caused players to damage ships and get stuck invisible

**⚠️ GameScene.ts:391-417** (ship boarding state management)
- Handles player-landed event and updates onShip state
- Must correctly calculate ship-relative position for boarding
- Must clear control state after landing

---

## Key Implementation Details

**Physics:**
- Reuses existing 3D projectile physics (ground + height coordinate separation)
- Same gravity (150 px/s²) and trajectory simulation as cannonballs
- 5-second projectile lifetime (both client & server) for safety net
- 200ms min flight time prevents instant water collision from deck-level firing

**Collision Detection:**
- OBB (Oriented Bounding Box) collision for rotated ship decks
- Ship-relative position calculated using inverse rotation
- Order: Out of bounds → Ship deck → Water/ground

**Network Protocol:**
- Extended `game/projectile_spawn` with `type: 'human_cannonball'` and `playerId`
- New message: `ship/cycle_ammo` for ammunition switching
- Client-side landing detection (no server validation needed for boarding)

**Bug Fixes During Implementation:**
1. Coordinate system mismatch: Used screen coords instead of ground coords for collision
2. Ship damage triggering: Added `if (proj.type !== 'human_cannonball')` check
3. Water splash on ship landing: Fixed collision detection logic
4. Green circle placeholder: Replaced with actual player sprite
