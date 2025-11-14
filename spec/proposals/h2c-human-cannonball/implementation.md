# h2c-human-cannonball: Implementation Plan

**Status:** Ready for Implementation
**Created:** 2025-11-11
**Proposal:** h2c-human-cannonball

## Implementation Overview

This document provides a detailed, file-by-file implementation plan for the Human Cannonball feature. The implementation follows the phased approach defined in `proposal.md`.

---

## Phase 1: Ammunition Cycling System

**Goal:** Player can grab cannon, cycle between ammo types (Cannonball ↔ Human Cannonball), and see current selection in UI.

### 1.1 Server-Side: Add Ammunition State

#### File: `server/mcp-servers/types.ts`

**Location:** Line 62-72 (CannonControlPoint interface)

**Changes:**
```typescript
export interface CannonControlPoint {
  type: 'cannon';
  side: 'port' | 'starboard';
  index: number;
  relativePosition: Position;
  controlledBy: string | null;
  aimAngle: number;
  elevationAngle: number;
  cooldownRemaining: number;
  lastFired: number;
  currentAmmo: 'cannonball' | 'human_cannonball'; // NEW FIELD
}
```

**Add new message payload types (after line 201):**
```typescript
/**
 * Cycle ammunition type (h2c-human-cannonball Phase 1)
 */
export interface CycleAmmoPayload {
  side: 'port' | 'starboard';
  index: number;
  playerId: string;
}
```

**Update Projectile interface (line 207-213):**
```typescript
export interface Projectile {
  id: string;
  type: 'cannonball' | 'human_cannonball'; // NEW FIELD
  playerId?: string; // NEW FIELD (only for human_cannonball)
  sourceShip: string;
  spawnTime: number;
  spawnPosition: Position;
  initialVelocity: Velocity3D;
}
```

---

#### File: `server/mcp-servers/ShipServer.ts`

**Location:** Line 87-106 (cannons initialization)

**Change:** Add `currentAmmo: 'cannonball'` to cannon initialization:
```typescript
port: config.cannonPositions.port.map((pos, index) => ({
  // ... existing fields ...
  cooldownRemaining: 0,
  lastFired: 0,
  currentAmmo: 'cannonball', // NEW FIELD (default to cannonball)
})),
starboard: config.cannonPositions.starboard.map((pos, index) => ({
  // ... existing fields ...
  cooldownRemaining: 0,
  lastFired: 0,
  currentAmmo: 'cannonball', // NEW FIELD
})),
```

**Add new method (after `handleReleaseCannon()` method, around line 450):**
```typescript
/**
 * Cycle ammunition type for a cannon (h2c-human-cannonball Phase 1)
 */
handleCycleAmmo(playerId: string, side: 'port' | 'starboard', index: number) {
  const cannons = side === 'port' ? this.state.cannons.port : this.state.cannons.starboard;
  const cannon = cannons[index];

  if (!cannon) {
    console.warn(`Cannon not found: ${side}[${index}]`);
    return;
  }

  // Validate player is controlling this cannon
  if (cannon.controlledBy !== playerId) {
    console.warn(`Player ${playerId} cannot cycle ammo - not controlling ${side} cannon ${index}`);
    return;
  }

  // Toggle ammunition type
  cannon.currentAmmo = cannon.currentAmmo === 'cannonball' ? 'human_cannonball' : 'cannonball';

  console.log(`[ShipServer] Player ${playerId} cycled ${side} cannon ${index} ammo to: ${cannon.currentAmmo}`);
}
```

**Modify `handleReleaseCannon()` method (around line 430-445):**

Find the line that sets `cannon.controlledBy = null;` and add below it:
```typescript
cannon.controlledBy = null;
cannon.currentAmmo = 'cannonball'; // NEW: Reset to default when releasing control
```

**Modify `handleFireCannon()` method (around line 544-620):**

After the cooldown check (around line 570), add ammo type check:
```typescript
// Determine projectile type based on current ammo
const projectileType = cannon.currentAmmo;
const projectileId = `projectile-${this.state.participantId}-${side}-${index}-${Date.now()}`;

// Include playerId if firing human cannonball
const projectilePayload: any = {
  id: projectileId,
  type: projectileType,
  sourceShip: this.state.participantId,
  position: spawnPosition,
  velocity: spawnVelocity,
  timestamp: Date.now(),
};

// Add playerId for human cannonball projectiles
if (projectileType === 'human_cannonball') {
  projectilePayload.playerId = playerId;
}

// Return projectile spawn message
return {
  kind: 'game/projectile_spawn',
  to: [],
  payload: projectilePayload,
};
```

**Modify position broadcast (around line 730-760):**

Add `currentAmmo` field to cannon state in broadcasts:
```typescript
cannons: {
  port: this.state.cannons.port.map(c => ({
    side: c.side,
    index: c.index,
    relativePosition: c.relativePosition,
    controlledBy: c.controlledBy,
    aimAngle: c.aimAngle,
    elevationAngle: c.elevationAngle,
    cooldownRemaining: c.cooldownRemaining,
    currentAmmo: c.currentAmmo, // NEW FIELD
  })),
  starboard: this.state.cannons.starboard.map(c => ({
    side: c.side,
    index: c.index,
    relativePosition: c.relativePosition,
    controlledBy: c.controlledBy,
    aimAngle: c.aimAngle,
    elevationAngle: c.elevationAngle,
    cooldownRemaining: c.cooldownRemaining,
    currentAmmo: c.currentAmmo, // NEW FIELD
  })),
},
```

---

#### File: `server/mcp-servers/ShipParticipant.ts`

**Location:** Line 75-122 (message handler switch)

**Add case for `ship/cycle_ammo` (after `ship/adjust_elevation`, around line 118):**
```typescript
case 'ship/cycle_ammo':
  this.handleCycleAmmo(envelope.payload as import('./types.js').CycleAmmoPayload);
  break;
```

**Add handler method (after `handleAdjustElevation()`, around line 195):**
```typescript
private handleCycleAmmo(payload: import('./types.js').CycleAmmoPayload) {
  this.server.handleCycleAmmo(payload.playerId, payload.side, payload.index);
  // Immediately broadcast updated cannon state
  this.broadcastPosition();
}
```

---

### 1.2 Client-Side: Input Handling

#### File: `client/src/types.ts`

**Location:** Line 170-188 (Projectile interface)

**Changes:**
```typescript
export interface Projectile {
  id: string;
  type: 'cannonball' | 'human_cannonball'; // NEW FIELD
  playerId?: string; // NEW FIELD (only for human_cannonball type)
  sprite: Phaser.GameObjects.Arc | Phaser.GameObjects.Sprite; // Updated Phase 4+ to support player sprites
  shadow: Phaser.GameObjects.Ellipse;

  // Ground position and velocity
  groundX: number;
  groundY: number;
  groundVx: number;
  groundVy: number;

  // Height position and velocity
  heightZ: number;
  heightVz: number;

  spawnTime: number;
  sourceShip: string;
  minFlightTime: number;
}
```

**Location:** Line 86-95 (Ship interface)

**Add `currentAmmo` field to cannons:**
```typescript
export interface Ship {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  // ... other fields ...
  cannons: {
    port: Array<{
      sprite: Phaser.GameObjects.Graphics;
      relativePosition: { x: number; y: number };
      controlledBy: string | null;
      aimAngle: number;
      elevationAngle: number;
      cooldownRemaining: number;
      currentAmmo?: 'cannonball' | 'human_cannonball'; // NEW FIELD
    }>;
    starboard: Array<{
      sprite: Phaser.GameObjects.Graphics;
      relativePosition: { x: number; y: number };
      controlledBy: string | null;
      aimAngle: number;
      elevationAngle: number;
      cooldownRemaining: number;
      currentAmmo?: 'cannonball' | 'human_cannonball'; // NEW FIELD
    }>;
  };
  // ... rest of fields ...
}
```

---

#### File: `client/src/game/input/ShipInputHandler.ts`

**Location:** Line 60-63 (input keys)

**Add Tab key binding:**
```typescript
private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
private interactKey: Phaser.Input.Keyboard.Key;
private spaceKey: Phaser.Input.Keyboard.Key;
private tabKey: Phaser.Input.Keyboard.Key; // NEW: For cycling ammunition
private gamepad: (() => Phaser.Input.Gamepad.Gamepad | null) | null = null;
```

**Location:** Line 86-100 (constructor)

**Add Tab key initialization:**
```typescript
constructor(
  scene: Phaser.Scene,
  ships: Map<string, Ship>,
  localPlayer: Phaser.GameObjects.Sprite,
  shipCommands: ShipCommands,
  playerId: string,
  cursors: Phaser.Types.Input.Keyboard.CursorKeys,
  interactKey: Phaser.Input.Keyboard.Key,
  spaceKey: Phaser.Input.Keyboard.Key
) {
  this.scene = scene;
  this.ships = ships;
  this.localPlayer = localPlayer;
  this.shipCommands = shipCommands;
  this.playerId = playerId;
  this.cursors = cursors;
  this.interactKey = interactKey;
  this.spaceKey = spaceKey;
  this.tabKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TAB); // NEW
}
```

**Location:** Line 72-75 (button state tracking)

**Add Tab/Bumper state tracking:**
```typescript
private lastInteractButtonState = false;
private lastFireButtonState = false;
private lastCycleAmmoButtonState = false; // NEW: Track Tab/LB/RB button state
```

**Location:** Inside `update()` method, after cannon firing logic (around line 600)

**Add ammunition cycling logic:**
```typescript
// Cycle ammunition type (h2c-human-cannonball Phase 1)
// Keyboard: Tab key
// Controller: LB or RB bumpers
const gamepad = this.gamepad?.();
const tabPressed = Phaser.Input.Keyboard.JustDown(this.tabKey);
const lbPressed = gamepad?.buttons[4]?.pressed && !this.lastCycleAmmoButtonState; // LB = index 4
const rbPressed = gamepad?.buttons[5]?.pressed && !this.lastCycleAmmoButtonState; // RB = index 5
const cycleAmmoPressed = tabPressed || lbPressed || rbPressed;

if (cycleAmmoPressed && this.controllingCannon) {
  console.log(`[ShipInputHandler] Cycling ammunition for ${this.controllingCannon.side} cannon ${this.controllingCannon.index}`);
  this.shipCommands.cycleAmmo(this.controllingCannon.side, this.controllingCannon.index);
}

// Update last button state for next frame
this.lastCycleAmmoButtonState = gamepad?.buttons[4]?.pressed || gamepad?.buttons[5]?.pressed || false;
```

---

#### File: `client/src/game/network/ShipCommands.ts`

**Add new method (after `adjustElevation()`, around line 100):**
```typescript
/**
 * Cycle ammunition type for cannon (h2c-human-cannonball Phase 1)
 */
cycleAmmo(side: 'port' | 'starboard', index: number) {
  if (!this.currentShip) {
    console.warn('Cannot cycle ammo - not controlling a ship');
    return;
  }

  this.client.send({
    kind: 'ship/cycle_ammo',
    to: [this.currentShip],
    payload: {
      side,
      index,
      playerId: this.playerId,
    },
  });

  console.log(`[ShipCommands] Sent cycle_ammo to ${this.currentShip}: ${side}[${index}]`);
}
```

---

### 1.3 Client-Side: UI Display

#### File: `client/src/game/rendering/ShipRenderer.ts`

**Location:** `drawCannon()` method signature (line 142)

**Update method signature to accept currentAmmo:**
```typescript
drawCannon(
  graphics: Phaser.GameObjects.Graphics,
  cannon: { relativePosition: { x: number; y: number }; controlledBy: string | null; aimAngle: number; elevationAngle: number; cooldownRemaining: number; currentAmmo?: 'cannonball' | 'human_cannonball' },
  shipSprite: Phaser.GameObjects.Sprite,
  shipRotation: number,
  isPlayerNear: boolean = false,
  isControlledByUs: boolean = false,
  currentCannonAim: number = 0
): void {
```

**Location:** Inside `drawCannon()`, after elevation indicator drawing (around line 254)

**Add ammunition type indicator (world-space graphics):**
```typescript
// Draw ammunition type indicator (h2c-human-cannonball Phase 1)
// Position to the right of elevation bar
const ammoType = cannon.currentAmmo || 'cannonball';
const ammoIndicatorX = elevBarX + 50; // Right of elevation bar
const ammoIndicatorY = elevBarY - 20;

if (ammoType === 'cannonball') {
  // Black filled circle for cannonball
  graphics.fillStyle(0x000000, 1);
  graphics.fillCircle(ammoIndicatorX, ammoIndicatorY, 8);
  graphics.lineStyle(2, 0xffffff, 1);
  graphics.strokeCircle(ammoIndicatorX, ammoIndicatorY, 8);
} else {
  // Green filled circle with yellow ring for human cannonball
  graphics.fillStyle(0x00ff00, 1);
  graphics.fillCircle(ammoIndicatorX, ammoIndicatorY, 8);
  graphics.lineStyle(2, 0xffffff, 1);
  graphics.strokeCircle(ammoIndicatorX, ammoIndicatorY, 8);
  graphics.lineStyle(2, 0xffff00, 1);
  graphics.strokeCircle(ammoIndicatorX, ammoIndicatorY, 11);
}
```

**Implementation Note:** The UI is integrated with the existing cannon control UI (drawn in world space next to the elevation bar) rather than as a separate screen-space overlay. This approach:
- Keeps ammo indicator visually grouped with other cannon controls (elevation, aim arc)
- Uses existing graphics rendering that's proven to work in the game
- Automatically inherits correct world-space positioning and rotation handling
- Avoids screen-space rendering issues (which don't work in this game's architecture)

---

## Phase 2: Basic Human Cannonball Launch

**Goal:** Player can launch from cannon as projectile and land safely on water/ground.

### 2.1 Client-Side: Projectile Spawning

#### File: `client/src/game/managers/ProjectileManager.ts`

**Location:** Line 80-158 (`spawnProjectile()` method)

**Modify to handle human cannonball type:**

After line 81 (destructure payload), add:
```typescript
const { id, type, playerId, position, velocity, timestamp, sourceShip } = payload;
```

After line 96 (console.log spawn info), check projectile type:
```typescript
console.log(`[ProjectileManager] Spawning projectile ${id} (type: ${type || 'cannonball'})`);
if (type === 'human_cannonball') {
  console.log(`  Human cannonball for player: ${playerId}`);
}
```

Replace sprite creation logic (around line 101-119) with:
```typescript
// Create projectile sprite based on type (h2c-human-cannonball Phase 2+)
// Updated in Phase 4+ to use actual player sprite instead of green circle
const sprite = type === 'human_cannonball'
  ? this.scene.add.sprite(position.x, position.y, 'player') // Player sprite for human cannonball
  : this.scene.add.circle(position.x, position.y, 4, 0x222222, 1.0); // Black circle for cannonball

sprite.setDepth(100); // Above ships and players
```

**Implementation Note:** Originally planned to use a green circle placeholder in Phase 2, but actual implementation uses player sprite immediately for better visual feedback.

Store projectile with type info (around line 125-145):
```typescript
this.projectiles.set(id, {
  id,
  type: type || 'cannonball', // NEW
  playerId, // NEW
  sprite,
  shadow,
  groundX: spawnGroundX,
  groundY: spawnGroundY,
  groundVx: velocity.groundVx,
  groundVy: velocity.groundVy,
  heightZ: spawnHeightZ,
  heightVz: velocity.heightVz,
  spawnTime: timestamp,
  sourceShip,
  minFlightTime: 200, // Minimum 200ms before water collision
});
```

---

#### File: `client/src/game/managers/ProjectileManager.ts`

**Location:** Line 165-320 (`updateProjectiles()` method)

**Add landing detection for human cannonballs:**

Inside the projectile update loop (around line 200-250), after physics update, add:
```typescript
// Check for landing (h2c-human-cannonball Phase 2)
if (projectile.type === 'human_cannonball' && projectile.heightZ <= 0) {
  console.log(`[ProjectileManager] Human cannonball ${projectile.id} landed at ground(${projectile.groundX.toFixed(1)}, ${projectile.groundY.toFixed(1)})`);

  // TODO Phase 2: Handle player landing
  // - Emit event to teleport player to landing position
  // - Show landing particle effects
  // - Resume normal player controls

  // For now, just despawn the projectile
  projectilesToRemove.push(projectile.id);
  continue; // Skip ship collision check
}
```

---

### 2.2 Client-Side: Player Hide/Show

**Note:** This will be implemented in Phase 2 after basic projectile spawning works. We need to:

1. Hide local player sprite when launching as human cannonball
2. Show local player sprite at landing position
3. Emit event from ProjectileManager to PlayerManager for landing teleport

---

### 2.3 Server-Side: Auto-Release Cannon Control

#### File: `server/mcp-servers/ShipServer.ts`

**Location:** Inside `handleFireCannon()` method (around line 620)

**Add auto-release logic for human cannonball:**
```typescript
// Auto-release cannon control if firing human cannonball (h2c-human-cannonball Phase 2)
if (projectileType === 'human_cannonball') {
  console.log(`[ShipServer] Auto-releasing ${side} cannon ${index} after launching player ${playerId}`);
  cannon.controlledBy = null;
  cannon.currentAmmo = 'cannonball'; // Reset to default
}
```

---

## Phase 3: Camera Follow & Effects

**Goal:** Smooth camera tracking during flight and visual polish.

### 3.1 Camera Follow

#### File: `client/src/game/GameScene.ts`

**Add state tracking (around line 80):**
```typescript
private isInCrowsNest = false;
private flyingAsProjectile = false; // NEW: Track if local player is flying
private flyingProjectileId: string | null = null; // NEW: Track projectile ID
```

**Location:** Inside `update()` method, camera follow logic (around line 500)

**Modify camera follow to track flying player:**
```typescript
// Camera follow (h2c-human-cannonball Phase 3)
if (this.flyingAsProjectile && this.flyingProjectileId) {
  const projectile = this.projectiles.get(this.flyingProjectileId);
  if (projectile) {
    // Follow projectile during flight
    this.cameras.main.startFollow(projectile.sprite, false, 0.05, 0.05);
  }
} else {
  // Follow local player normally
  this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
}
```

---

### 3.2 Landing Effects

#### File: `client/src/game/managers/ProjectileManager.ts`

**Location:** Inside landing detection logic (Phase 2 TODO)

**Add particle effects:**
```typescript
if (projectile.type === 'human_cannonball' && projectile.heightZ <= 0) {
  console.log(`[ProjectileManager] Human cannonball ${projectile.id} landed`);

  // Check if landing on water or ground
  const tileX = Math.floor(projectile.groundX / this.map.tileWidth);
  const tileY = Math.floor(projectile.groundY / this.map.tileHeight);
  const tile = this.groundLayer.getTileAt(tileX, tileY);

  const isWater = tile?.properties?.navigable === true;

  // Show landing effect
  if (isWater) {
    this.effectsRenderer.createWaterSplash(screenX, screenY);
    this.sounds.waterSplash?.play();
  } else {
    // Create dust particle effect (new)
    this.effectsRenderer.createDustCloud(screenX, screenY);
    // TODO: Add landing sound effect
  }

  // Teleport player to landing position
  // TODO: Emit event to PlayerManager

  projectilesToRemove.push(projectile.id);
}
```

---

## Phase 4: Ship Landing & Boarding

**Goal:** Players can land on moving ships and automatically board them.

### 4.1 Ship Collision Detection

#### File: `client/src/game/managers/ProjectileManager.ts`

**Location:** Inside landing detection (Phase 3 code)

**IMPORTANT:** Add import for IsoMath at top of file:
```typescript
import * as IsoMath from '../utils/IsometricMath.js';
```

**Add ship collision check before water/ground check:**
```typescript
if (projectile.type === 'human_cannonball' && projectile.heightZ <= 0) {
  // Phase 4: Check for ship collision first (using screen coordinates)
  let landedOnShip = false;

  for (const [shipId, ship] of ships) {
    const isOnShip = this.collisionManager.isPointInRotatedRect(
      { x: proj.sprite.x, y: proj.sprite.y }, // CRITICAL: Use screen coordinates, not ground!
      { x: ship.sprite.x, y: ship.sprite.y },
      ship.deckBoundary,
      ship.rotation
    );

    if (isOnShip) {
      console.log(`[ProjectileManager] Human cannonball landed on ship ${shipId}!`);

      // Calculate ship-relative position using inverse rotation (use screen delta)
      const dx = proj.sprite.x - ship.sprite.x;
      const dy = proj.sprite.y - ship.sprite.y;
      const relativePos = IsoMath.rotatePointIsometric(
        { x: dx, y: dy },
        -ship.rotation
      );

      // Emit event to board ship
      this.scene.events.emit('player-landed', {
        playerId: proj.playerId,
        groundX: proj.groundX,
        groundY: proj.groundY,
        screenX: proj.sprite.x,
        screenY: proj.sprite.y,
        onShip: shipId,
        shipRelativePosition: relativePos
      });

      // Show hit effect for ship landing (Phase 5.3)
      this.effectsRenderer.createHitEffect(proj.sprite.x, proj.sprite.y);

      landedOnShip = true;
      break;
    }
  }

  if (!landedOnShip) {
    // Check water/ground landing (existing Phase 3 code)
    // ...
  }

  // Despawn projectile
  proj.sprite.destroy();
  proj.shadow.destroy();
  this.projectiles.delete(id);
}
```

**Implementation Notes:**
- **Coordinate System:** Must use `proj.sprite.x/y` (screen coordinates) for collision, NOT `proj.groundX/y` (pre-isometric coordinates). Using ground coordinates will always fail collision detection.
- **Rotation Math:** Use `IsoMath.rotatePointIsometric()` directly, not via CollisionManager.
- **Visual Effect:** Use `createHitEffect()` (exists) not `createDustCloud()` (doesn't exist).

---

### 4.2 Critical Bug Fix: Skip Ship Damage for Human Cannonballs

#### File: `client/src/game/managers/ProjectileManager.ts`

**Location:** Ship damage collision detection (around line 245)

**CRITICAL FIX:** Wrap the existing ship damage collision code to skip human cannonballs:

```typescript
// Phase 3: Check collision with ships (except source ship)
// h2c-human-cannonball: Skip ship damage for human cannonballs (they land on ships instead)
if (proj.type !== 'human_cannonball') {
  let hitShip = false;
  ships.forEach((ship) => {
    // ... existing ship damage collision code ...
  });

  if (hitShip) return; // Skip water check if we hit a ship
}

// h2c-human-cannonball Phase 2-5: Check for human cannonball landing
if (proj.type === 'human_cannonball' && proj.heightZ <= 0 && age > proj.minFlightTime) {
  // ... landing detection code from Phase 4.1 above ...
}
```

**Why This Is Critical:**
Without this check, human cannonballs trigger ship damage collision at deck height and despawn as weapon hits, preventing the player from landing. This causes:
- Player stays invisible (sprite never shown)
- No `player-landed` event emitted
- Player stuck in flying state
- Ship takes unintended damage

This was discovered during testing and is essential for the feature to work.

---

## Phase 5: Polish & Edge Cases

### 5.1 Out of Bounds Safety

#### File: `client/src/game/managers/ProjectileManager.ts`

**Location:** Inside landing detection

**Add bounds check:**
```typescript
if (projectile.type === 'human_cannonball' && projectile.heightZ <= 0) {
  // Check if out of bounds (h2c-human-cannonball Phase 5)
  const mapWidthPx = this.map.widthInPixels;
  const mapHeightPx = this.map.heightInPixels;

  const isOutOfBounds =
    projectile.groundX < 0 ||
    projectile.groundX > mapWidthPx ||
    projectile.groundY < 0 ||
    projectile.groundY > mapHeightPx;

  if (isOutOfBounds) {
    console.warn(`[ProjectileManager] Human cannonball out of bounds, respawning on source ship`);

    // Respawn player on source ship
    const sourceShip = ships.get(proj.sourceShip);
    if (sourceShip) {
      this.scene.events.emit('player-landed', {
        playerId: proj.playerId,
        groundX: sourceShip.sprite.x,
        groundY: sourceShip.sprite.y,
        screenX: sourceShip.sprite.x,
        screenY: sourceShip.sprite.y,
        onShip: proj.sourceShip,
        shipRelativePosition: { x: 0, y: 0 }
      });
    }

    proj.sprite.destroy();
    proj.shadow.destroy();
    this.projectiles.delete(id);
    return;
  }

  // Continue with normal landing detection...
}
```

---

### 5.2 Sound Effects

#### File: `client/src/game/GameScene.ts`

**Location:** preload() method (around line 100)

**Add human cannonball sound (optional, Phase 5+):**
```typescript
// Future: Add wind whistle sound for human cannonball flight
// this.load.audio('wind_whistle', 'assets/sounds/wind_whistle.mp3');
```

---

## Testing Checklist

### Phase 1 Testing
- [ ] Start server (`cd server && npm start`)
- [ ] Start client (`cd client && npm start`)
- [ ] Walk to cannon, press E to grab
- [ ] Verify ammo indicator shows "● Cannonball"
- [ ] Press Tab (or LB/RB on controller)
- [ ] Verify ammo indicator changes to "◉ Human Cannonball"
- [ ] Press Tab again, verify it cycles back
- [ ] Release cannon (E), grab again, verify resets to Cannonball
- [ ] Check server logs for `handleCycleAmmo` messages
- [ ] Check network traffic for `ship/cycle_ammo` messages

### Phase 2 Testing
- [ ] Grab cannon, cycle to Human Cannonball
- [ ] Fire with Space bar
- [ ] Verify green projectile spawns
- [ ] Verify projectile follows physics (arc trajectory)
- [ ] Verify projectile despawns when heightZ <= 0
- [ ] Check console logs for landing detection
- [ ] Verify cannon control is auto-released after firing

### Phase 3 Testing
- [ ] Launch as human cannonball
- [ ] Verify camera smoothly follows projectile
- [ ] Verify landing shows splash (water) or dust (ground)
- [ ] Verify camera returns to player after landing
- [ ] Test with multiple simultaneous launches

### Phase 4 Testing
- [ ] Launch toward moving ship
- [ ] Verify landing on ship deck auto-boards
- [ ] Verify player moves with ship after landing
- [ ] Test landing on different ship than launch ship

### Phase 5 Testing
- [ ] Aim cannon out of bounds (toward map edge)
- [ ] Fire as human cannonball
- [ ] Verify respawn on source ship deck
- [ ] Test edge case: ship sinks while player in flight
- [ ] Test edge case: launch during ship turn

---

## File Reference Summary

### Files to Modify

**Server (7 files):**
1. `server/mcp-servers/types.ts` - Add interfaces
2. `server/mcp-servers/ShipServer.ts` - Add ammo state & logic
3. `server/mcp-servers/ShipParticipant.ts` - Add message handler

**Client (8 files):**
4. `client/src/types.ts` - Update interfaces
5. `client/src/game/input/ShipInputHandler.ts` - Add Tab/bumper input
6. `client/src/game/network/ShipCommands.ts` - Add cycleAmmo() method
7. `client/src/game/GameScene.ts` - Add UI, camera follow
8. `client/src/game/managers/ProjectileManager.ts` - Handle human projectiles
9. `client/src/game/rendering/EffectsRenderer.ts` - Add dust cloud effect (Phase 3)
10. `client/src/game/managers/PlayerManager.ts` - Handle landing teleport (Phase 2-4)

### Files to Create

**None** - All changes are modifications to existing files.

---

## Implementation Order

1. **Phase 1 - Server** (types.ts → ShipServer.ts → ShipParticipant.ts)
2. **Phase 1 - Client** (types.ts → ShipInputHandler.ts → ShipCommands.ts → GameScene.ts)
3. **Test Phase 1** - Verify ammo cycling works
4. **Phase 2 - Server** (ShipServer.ts auto-release)
5. **Phase 2 - Client** (ProjectileManager.ts spawn & landing)
6. **Test Phase 2** - Verify launch & basic landing
7. **Phase 3** (Camera follow + effects)
8. **Test Phase 3** - Verify visual polish
9. **Phase 4** (Ship landing detection)
10. **Test Phase 4** - Verify ship boarding
11. **Phase 5** (Edge cases & polish)
12. **Test Phase 5** - Verify edge case handling

---

## Constants to Add

#### File: `client/src/game/utils/Constants.ts`

```typescript
// Human Cannonball (h2c-human-cannonball)
export const HUMAN_CANNONBALL_SPEED = 450; // px/s (1.5x cannonball speed)
export const HUMAN_CANNONBALL_LIFETIME = 6000; // ms (longer than cannonball)
```

---

## Notes for Implementation

1. **Breaking changes are acceptable** - Game is not released yet
2. **No trajectory preview** - Keeps aiming consistent with cannonballs
3. **Client-side landing** - Consistent with MEW Protocol architecture
4. **Deterministic physics** - Same simulation on all clients
5. **No mid-air collision** - Only check landing collision
6. **Multiple flying players** - Should work simultaneously with no limit
7. **Gamepad support** - LB/RB bumpers (buttons 4/5) for cycling

---

## UI Element Positions

**Ammo Indicator:**
- Position: Top-center of screen (x: camera.width/2, y: 20)
- Style: Yellow text on black background
- Font: 18px monospace
- Visible: Only when controlling cannon
- Content: "[icon] [Ammo Type]"
  - Cannonball: "● Cannonball"
  - Human Cannonball: "◉ Human Cannonball"

**Elevation Display (existing):**
- Position: Above cannon world position (see ShipRenderer.ts:240-257)
- Style: Segmented bar (9 segments for 15-60° range)
- This stays the same - ammo indicator goes elsewhere

---

## Ready to Implement!

This implementation plan is ready for code execution. Start with Phase 1 and test incrementally.
