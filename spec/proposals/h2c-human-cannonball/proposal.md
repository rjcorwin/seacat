# h2c-human-cannonball: Load Yourself Into Cannon

**Status:** Draft
**Created:** 2025-11-10
**Proposal Code:** h2c (Human Cannonball)

## Motivation

Players should be able to load themselves into ship cannons and launch across the map, providing a fun and chaotic traversal mechanic that leverages the existing projectile physics system. This feature adds:

1. **Novel Traversal:** Fast travel across water/islands via dramatic cannon launch
2. **Emergent Gameplay:** Players can use cannons to board enemy ships from above, escape danger, or perform daring stunts
3. **Reuses Existing Systems:** Projectile physics, network protocol, and rendering already exist for cannonballs
4. **Low Risk:** Additive feature that doesn't modify core gameplay

The feature is whimsical and aligns with the game's lighthearted multiplayer ship combat aesthetic.

## Goals

### Primary Goals

1. **Player-Controlled Launching:** Players can load themselves into cannons and fire themselves across the map
2. **Reuse Projectile Physics:** Use existing 3D ballistic system (ground + height separation, gravity, trajectory)
3. **Safe Landing:** Players land safely on ground, water, or ships without taking damage
4. **Visual Feedback:** Show player sprite during flight with camera follow and landing effects
5. **Network Synchronization:** All clients see flying players with consistent trajectories

### Secondary Goals

1. **Trajectory Preview:** Show arc preview before launch (optional, Phase 2)
2. **Landing Precision:** Players can aim to land on specific targets (ships, islands)
3. **Cooldown Management:** Prevent spam launches (share cannon's 4s cooldown)

### Non-Goals

1. **Combat Mechanics:** No damage to ships or players on landing (pure traversal)
2. **AI Agent Support:** Initially human players only (AI could use later)
3. **Mid-Flight Control:** No steering during flight (ballistic only)
4. **Landing Damage:** No fall damage or injury mechanics

## Design Overview

### High-Level Flow

```
┌──────────────┐
│ Walk near    │
│ cannon       │──→ Yellow indicator appears
└──────┬───────┘
       │
       │ Press F (new keybind)
       ▼
┌──────────────┐
│ Aim mode     │──→ Arrow keys adjust aim/elevation
│ (standing at │    Trajectory preview shows arc
│ cannon)      │    Press Space to confirm
└──────┬───────┘
       │
       │ Press Space
       ▼
┌──────────────┐
│ Player → │──→ Player sprite becomes projectile
│ projectile   │    Camera follows during flight
└──────┬───────┘    Cannon blast effect at launch
       │
       │ Physics simulation (2-3 seconds)
       ▼
┌──────────────┐
│ Landing      │──→ Player teleports to landing position
│ detection    │    Splash/dust particle effects
└──────┬───────┘    Resume normal player controls
       │
       ▼
   Continue playing
```

### User Experience

**Step 1: Approach Cannon**
- Walk near cannon (within 30px radius)
- Yellow indicator appears above cannon
- UI prompt: "Press F to load yourself"

**Step 2: Aim Mode**
- Press F → enter aiming mode
- Player stands at cannon position (locked movement)
- Arrow keys adjust horizontal aim (±45°) and elevation (15-60°)
- Dotted arc shows predicted trajectory
- UI shows estimated landing position
- Press Space to launch, or E to cancel

**Step 3: Launch**
- Player sprite becomes a projectile entity
- Camera smoothly follows player during flight
- Cannon blast effect at spawn position
- Player sprite rotates/tumbles during flight (animation)
- Other players see flying player with smoke trail

**Step 4: Landing**
- Detect ground/water collision when heightZ ≤ 0
- Show particle burst effect (splash if water, dust if ground)
- Teleport player to landing position
- Resume normal player controls
- Camera smoothly transitions back to follow mode

**Step 5: Cooldown**
- Cannon enters 4s cooldown (same as firing cannonball)
- Cannot fire cannonball OR launch human during cooldown
- Gray cooldown indicator shrinks on cannon sprite

### Key Mechanics

**Launch Trigger:**
- New keybind: **F key** (dedicated to human cannonball)
- Only works when: player near cannon AND not controlling cannon AND cannon not on cooldown
- Prevents accidental launches (different from E to grab cannon)

**Aiming:**
- Same controls as cannon aiming: left/right arrows (horizontal), up/down arrows (elevation)
- Range: horizontal ±45° from perpendicular, elevation 15-60°
- Trajectory arc preview drawn as dotted line (25 sample points along arc)
- Landing marker shows estimated impact point

**Physics:**
- **Launch speed:** 450 px/s (50% faster than cannonball for dramatic effect)
- **Gravity:** 150 px/s² (same as cannonballs)
- **Flight time:** ~4 seconds at 45° elevation
- **Range:** ~900-1000 pixels (~28-31 tiles)

**Collision & Landing:**
- Check water collision: heightZ ≤ 0 AND tile.properties.navigable === true
- Check ground collision: heightZ ≤ 0 AND tile walkable
- Check ship collision: OBB overlap at deck height (player boards ship from above)
- Out of bounds: teleport back to cannon position (safety net)

**Visual Rendering:**
- Player sprite during flight (not invisible)
- Rotate sprite continuously (tumbling animation)
- Smoke trail particles (same as cannonball)
- Shadow ellipse at ground level (same as cannonball)
- Camera lerp target = player projectile sprite

**Network Protocol:**
- Reuse `game/projectile_spawn` message with new type field
- Payload includes: `type: 'human_cannonball'`, `playerId`, `position`, `velocity`
- All clients spawn projectile + associate with player sprite
- Server validates landing position (prevents teleport exploits)

## Implementation Phases

### Phase 1: Basic Launch Mechanics ✅ FOUNDATION

**Goal:** Player can launch from cannon and land safely

**Client Changes:**
1. Add F key binding in `PlayerInputHandler.ts`
2. Detect "near cannon but not controlling" state
3. Send `ship/load_human_cannonball` message to ship server
4. Hide player sprite when launched (sprite becomes projectile)
5. Show player sprite at landing position

**Server Changes:**
1. Add message handler: `ship/load_human_cannonball`
2. Validate: player near cannon, cannon not on cooldown
3. Calculate spawn position (cannon muzzle)
4. Use default aim (45° elevation, perpendicular to ship)
5. Broadcast `game/projectile_spawn` with `type: 'human_cannonball'`
6. Set cannon cooldown to 4000ms

**Projectile Changes:**
1. Extend `Projectile` interface with `playerId?: string` field
2. In `ProjectileManager.spawnProjectile()`:
   - Check if `type === 'human_cannonball'`
   - Create player sprite instead of black circle
   - Store projectile with player ID reference
3. In `ProjectileManager.updateProjectiles()`:
   - Check water/ground landing (not ship collision yet)
   - On landing: emit event to teleport player to landing position
   - Destroy projectile sprite

**Success Criteria:**
- Player can press F near cannon
- Player sprite disappears and reappears at landing position
- Cannon enters cooldown after launch
- Other players see flying player sprite

---

### Phase 2: Aiming & Trajectory Preview

**Goal:** Player can aim before launch and see predicted arc

**Client Changes:**
1. Add "aiming mode" state in `ShipInputHandler.ts`
   - F key → enter aiming mode (lock player movement)
   - Arrow keys → adjust horizontal aim and elevation
   - Space → confirm launch
   - E → cancel aiming mode
2. Render trajectory preview:
   - Calculate 25 sample points along arc using physics formulas
   - Draw dotted line (white circles every N pixels)
   - Show landing marker (yellow circle) at impact point
3. UI overlay: "Aiming... Press SPACE to launch, E to cancel"

**Server Changes:**
1. Accept aim parameters in `ship/load_human_cannonball`:
   ```typescript
   {
     playerId: string,
     aimAngle: number,      // Horizontal aim
     elevationAngle: number // Vertical elevation
   }
   ```
2. Use provided angles instead of defaults
3. Validate angles within allowed ranges (±45° horizontal, 15-60° elevation)

**Trajectory Calculation:**
```typescript
// Sample arc in 25 steps from launch to landing
const samples = 25;
const dt = estimatedFlightTime / samples;

for (let i = 0; i <= samples; i++) {
  const t = i * dt;

  // Ground position
  const groundX = spawnGroundX + groundVx * t;
  const groundY = spawnGroundY + groundVy * t;

  // Height with gravity
  const heightZ = spawnHeightZ + heightVz * t - 0.5 * GRAVITY * t * t;

  // Convert to screen coordinates
  const screenX = groundX - groundY;
  const screenY = (groundX + groundY) / 2 - heightZ;

  // Draw preview dot
  graphics.fillCircle(screenX, screenY, 2);

  // Stop if hit ground
  if (heightZ <= 0) break;
}
```

**Success Criteria:**
- Player can aim with arrow keys before launch
- Dotted arc shows predicted trajectory
- Landing marker shows impact point accurately
- Space key launches, E key cancels

---

### Phase 3: Camera Follow & Effects

**Goal:** Smooth camera tracking and visual polish

**Client Changes:**
1. Camera follow during flight:
   ```typescript
   // In GameScene.update() when player is projectile
   if (playerProjectileActive) {
     const projectile = getPlayerProjectile(localPlayerId);
     camera.lerp(0.05); // Slower lerp for smooth follow
     camera.centerOn(projectile.sprite.x, projectile.sprite.y);
   }
   ```
2. Player sprite rotation during flight:
   ```typescript
   // Rotate sprite based on velocity direction + time
   const rotationSpeed = 0.1; // radians per frame
   playerProjectile.sprite.rotation += rotationSpeed;
   ```
3. Landing effects:
   - Water: Blue splash particles (reuse `createWaterSplash()`)
   - Ground: Brown dust particles (new effect)
   - Ship deck: Wood creak sound + small particle burst

**Server Changes:**
1. Track player projectile state (for hit validation)
2. Broadcast landing event: `game/player_landed`
   ```typescript
   {
     kind: 'game/player_landed',
     to: [],
     payload: {
       playerId: string,
       landingPosition: { x, y },
       landingType: 'water' | 'ground' | 'ship'
     }
   }
   ```

**Success Criteria:**
- Camera smoothly follows player during flight
- Player sprite rotates/tumbles realistically
- Landing shows appropriate particle effects
- Camera smoothly returns to normal follow after landing

---

### Phase 4: Ship Landing & Boarding

**Goal:** Players can land on moving ships

**Client Changes:**
1. Add ship collision check at landing:
   ```typescript
   // Check all ships for OBB collision at landing position
   ships.forEach(ship => {
     if (isPointInRotatedRect(landingPos, ship.pos, ship.boundary, ship.rotation)) {
       // Player landed on ship!
       onShip = ship.id;
       // Calculate ship-relative position
       shipRelativePosition = rotatePointIsometric(
         { x: landingX - ship.x, y: landingY - ship.y },
         -ship.rotation
       );
     }
   });
   ```
2. If landing on ship: automatically board (enter ship platform coordinates)

**Server Changes:**
1. Validate ship collision in landing position
2. Include ship reference in `game/player_landed` message:
   ```typescript
   {
     ...
     landingShip: string | null, // Ship ID if landed on deck
   }
   ```

**Success Criteria:**
- Player lands on ship deck → automatically boards
- Player position syncs correctly on moving ship
- Works for both local and remote players

---

### Phase 5: Polish & Edge Cases

**Goal:** Handle edge cases and add quality-of-life improvements

**Features:**
1. **Out of bounds safety:**
   - Detect map boundary collision during flight
   - Teleport back to cannon position with message: "Launch failed!"
2. **Cooldown UI:**
   - Show cooldown timer on cannon when in human cannonball cooldown
   - Different color indicator (purple?) vs cannonball cooldown (gray)
3. **Sound effects:**
   - Launch sound: "whoosh" or "BOING"
   - Flight sound: wind/whistle (looped during flight)
   - Landing sound: splash (water) or thud (ground)
4. **Prevent trolling:**
   - Can't launch if another player is aiming this cannon
   - Can't launch if ship is sinking
5. **Multi-player coordination:**
   - If cannon is controlled by another player, they can aim for you
   - UI: "Player2 is aiming for you. Press SPACE to launch"

**Success Criteria:**
- No crashes from edge cases (out of bounds, missing ship, etc.)
- Sound effects enhance experience
- Cooldown indicators are clear
- Multi-crew coordination works smoothly

## Technical Specification

### New Message Types

#### `ship/load_human_cannonball`
Player requests to load themselves into cannon.

```typescript
{
  kind: 'ship/load_human_cannonball',
  to: ['ship1'],
  payload: {
    playerId: string,
    side: 'port' | 'starboard',
    index: number,           // Cannon index (0, 1)
    aimAngle: number,        // Horizontal aim (radians, ±π/4)
    elevationAngle: number   // Elevation (radians, π/12 to π/3)
  }
}
```

#### `game/player_landed`
Server broadcasts when player lands from human cannonball.

```typescript
{
  kind: 'game/player_landed',
  to: [],
  payload: {
    playerId: string,
    landingPosition: { x: number, y: number },
    landingType: 'water' | 'ground' | 'ship',
    landingShip: string | null  // Ship ID if landed on ship
  }
}
```

### Projectile Type Extension

**Modified `game/projectile_spawn`:**
```typescript
{
  kind: 'game/projectile_spawn',
  to: [],
  payload: {
    id: string,
    type: 'cannonball' | 'human_cannonball',  // NEW
    playerId?: string,                         // NEW (only for human_cannonball)
    sourceShip: string,
    position: { x: number, y: number },
    velocity: {
      groundVx: number,
      groundVy: number,
      heightVz: number
    },
    timestamp: number
  }
}
```

### Code Changes Summary

**Client:**
- `client/src/types.ts:170-188` - Add `playerId?: string` to Projectile interface
- `client/src/game/input/PlayerInputHandler.ts` - Add F key binding, aiming mode
- `client/src/game/input/ShipInputHandler.ts` - Detect "near cannon but not controlling"
- `client/src/game/managers/ProjectileManager.ts` - Handle human_cannonball type
- `client/src/game/network/ShipCommands.ts` - Add `loadHumanCannonball()` method

**Server:**
- `server/mcp-servers/ShipServer.ts` - Add `handleLoadHumanCannonball()` method
- `server/mcp-servers/ShipParticipant.ts` - Add message handler for `ship/load_human_cannonball`
- `server/mcp-servers/types.ts` - Add projectile type field

### Constants

```typescript
// In Constants.ts
export const HUMAN_CANNONBALL_SPEED = 450; // px/s (1.5x cannonball speed)
export const HUMAN_CANNONBALL_LIFETIME = 6000; // ms (longer than cannonball)
```

## Success Criteria

### Functional Requirements

- ✅ Player can press F near cannon to load themselves
- ✅ Player can aim with arrow keys (horizontal + elevation)
- ✅ Trajectory preview shows accurate arc and landing position
- ✅ Player sprite becomes projectile during flight
- ✅ Camera follows player smoothly during flight
- ✅ Player lands safely on water, ground, or ship deck
- ✅ Landing position syncs correctly across all clients
- ✅ Cannon enters 4s cooldown after launch

### Visual Requirements

- ✅ Player sprite visible during flight (not invisible)
- ✅ Smoke trail follows player projectile
- ✅ Shadow ellipse renders at ground level
- ✅ Landing shows splash (water) or dust (ground) particles
- ✅ Trajectory preview draws dotted arc clearly

### Network Requirements

- ✅ All clients see flying player at same position
- ✅ Physics simulation matches on all clients
- ✅ Server validates landing position (prevents exploits)
- ✅ No desync between local and remote players

### Quality Requirements

- ✅ No crashes from edge cases (out of bounds, missing ship)
- ✅ Frame rate remains 60 FPS with multiple flying players
- ✅ Controls are intuitive and responsive
- ✅ Feature is fun and encourages experimentation

## Alternatives Considered

### 1. Auto-Aim to Nearest Target

**Pros:**
- Simpler UX (no aiming required)
- Faster to use (press F and go)

**Cons:**
- Less player agency (can't choose destination)
- Harder to implement target selection
- Doesn't leverage existing cannon aiming UI

**Decision:** Rejected in favor of manual aiming

### 2. Use E Key (Same as Grab Cannon)

**Pros:**
- Fewer keybinds (reuse existing key)
- Context-sensitive interaction

**Cons:**
- Risk of accidental launches
- Confusing (grab cannon OR load yourself?)
- Harder to cancel once triggered

**Decision:** Rejected in favor of dedicated F key

### 3. Launch Speed = Cannonball Speed (300 px/s)

**Pros:**
- Consistent with existing projectiles
- Easier balance

**Cons:**
- Less dramatic/exciting
- Shorter range (~600px vs ~900px)
- Feels underwhelming for a "human cannonball"

**Decision:** Rejected in favor of 450 px/s (1.5x speed)

### 4. Damage on Landing

**Pros:**
- More realistic
- Adds risk/reward

**Cons:**
- Punishes experimentation
- Requires health system for players (doesn't exist yet)
- Discourages using the feature

**Decision:** Rejected in favor of safe landings

## Future Enhancements

### Phase 6+: Advanced Features

1. **Power Charge:**
   - Hold Space to charge launch power (longer press = farther distance)
   - UI shows power meter filling up
   - Max charge = 600 px/s, min = 300 px/s

2. **Landing Roll:**
   - Player sprite does a roll animation on landing (if on ground)
   - Slight momentum in landing direction (slide a few pixels)

3. **Multi-Launch:**
   - Multiple players can load into same cannon
   - Launch sequence fires all players in rapid succession
   - Synchronized launches for dramatic effect

4. **AI Agent Support:**
   - AI agents can calculate optimal launch trajectory
   - Use human cannonball for navigation shortcuts
   - Requires pathfinding integration

5. **Cannon Upgrade System:**
   - Different cannons have different launch speeds
   - Longer barrels = farther range
   - Player-built cannons on custom maps

6. **Mid-Air Tricks:**
   - Press arrow keys during flight for spin/flip animations
   - Purely cosmetic (doesn't affect trajectory)
   - Score multiplier for successful tricks (leaderboard)

## Dependencies

**Required:**
- c5x-ship-combat (cannon system)
- p2v-projectile-velocity (3D physics)
- i2m-true-isometric (coordinate transforms)

**Optional:**
- b8s-cannonball-shadows (shadow rendering)
- g4p-controller-support (gamepad input for aiming)

## Risks & Mitigations

### Risk: Exploit for Fast Travel

**Impact:** Players spam human cannonball to travel faster than ships
**Mitigation:** 4s cooldown + limited range (~900px) prevents abuse

### Risk: Out of Bounds Crashes

**Impact:** Player lands outside map boundaries → game crash
**Mitigation:** Validate landing position server-side, teleport back if invalid

### Risk: Camera Disorientation

**Impact:** Camera following projectile makes players dizzy
**Mitigation:** Smooth lerp (0.05 factor), optional "cinematic mode" toggle

### Risk: Network Desync

**Impact:** Remote players see flying player in wrong position
**Mitigation:** Reuse proven projectile physics (identical on all clients)

## Testing Plan

### Unit Tests

1. Projectile physics calculations (ground velocity, height, landing position)
2. Trajectory preview accuracy (sample points match actual flight)
3. Cooldown enforcement (cannot launch during cooldown)
4. Edge case validation (out of bounds, missing ship, etc.)

### Integration Tests

1. Multi-player launch (all clients see same trajectory)
2. Ship landing (player boards correctly)
3. Camera follow (smooth transition in/out of flight)
4. Cooldown sync (all clients see same cooldown state)

### Manual Tests

1. Launch from each cannon position (port/starboard, front/back)
2. Land on water, ground, ship deck, out of bounds
3. Launch while ship is moving/turning
4. Multi-crew coordination (player A aims, player B launches)
5. Spam launches (verify cooldown prevents abuse)

## Open Questions

1. **Should launching interrupt ship controls?**
   - If player is controlling wheel, does launch auto-release?
   - Recommendation: Yes (auto-release all controls on launch)

2. **Can you launch from enemy ships?**
   - No ship ownership currently exists
   - Recommendation: Yes (any player can use any cannon)

3. **What happens if ship sinks mid-flight?**
   - Player is projectile (detached from ship)
   - Recommendation: Continue flight normally (player is airborne)

4. **Trajectory preview accuracy vs performance?**
   - 25 sample points = 25 position calculations per frame
   - Recommendation: Only calculate when aim changes (not every frame)

## References

- `spec/SPEC.md:1089-1407` - Milestone 9: Ship-to-Ship Combat
- `spec/proposals/c5x-ship-combat/` - Cannon combat system
- `spec/proposals/p2v-projectile-velocity/` - Projectile physics
- `spec/proposals/i2m-true-isometric/` - Coordinate transforms
