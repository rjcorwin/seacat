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

**Architecture Note:** This feature uses client-side landing detection, consistent with Seacat's MEW Protocol peer-to-peer architecture where players self-report positions. The ship server spawns the projectile but does not track or validate landing positions. All clients run identical deterministic physics to ensure consistency.

### High-Level Flow

```
┌──────────────┐
│ Walk near    │
│ cannon       │──→ Yellow indicator appears
└──────┬───────┘
       │
       │ Press E/A (grab control)
       ▼
┌──────────────┐
│ Controlling  │──→ Default: Cannonball selected
│ cannon       │    UI shows ammo type indicator
└──────┬───────┘
       │
       │ Press LB/RB (cycle ammunition)
       ▼
┌──────────────┐
│ Human        │──→ Ammo indicator: "Human Cannonball"
│ Cannonball   │    Arrow keys adjust aim/elevation
│ selected     │    Trajectory preview shows arc
└──────┬───────┘
       │
       │ Press Space/RT
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
- UI prompt: "Press E to grab cannon" (keyboard) or "Press A" (controller)

**Step 2: Grab Control**
- Press E/A → grab cannon control
- Player controls cannon (locked movement at cannon position)
- Default ammunition: **Cannonball** (ready to fire at ships)
- Ammo indicator appears next to elevation bar: Black circle with white border

**Step 3: Cycle to Human Cannonball**
- Press Tab (keyboard) or LB/RB bumpers (controller) → cycle ammunition type
- Ammo indicator updates: Green circle with white and yellow rings
- Arrow keys adjust horizontal aim (±45°) and elevation (15-60°)
- Aiming works exactly like regular cannonballs (no trajectory preview)

**Step 4: Launch**
- Press Space (keyboard) or RT (controller) → fire current ammunition
- Player sprite becomes a projectile entity
- Camera smoothly follows player during flight
- Cannon blast effect at spawn position
- Player sprite rotates/tumbles during flight (animation)
- Other players see flying player with smoke trail

**Step 5: Landing**
- Detect ground/water collision when heightZ ≤ 0
- Show particle burst effect (splash if water, dust if ground)
- Teleport player to landing position
- Resume normal player controls
- Camera smoothly transitions back to follow mode

**Step 6: Cooldown**
- Cannon enters 4s cooldown (same as firing cannonball)
- Cannot fire any ammunition type during cooldown
- Gray cooldown indicator shrinks on cannon sprite

### Key Mechanics

**Ammunition Selection:**
- **Keyboard:** Tab key cycles between ammunition types (Cannonball ↔ Human Cannonball)
- **Controller:** LB/RB bumpers cycle between ammunition types
- Default selection when grabbing cannon: **Cannonball**
- Selection resets to Cannonball when releasing control
- Current ammunition shown in UI indicator (positioned above altitude display)

**Aiming:**
- Same controls as cannon aiming: left/right arrows (horizontal), up/down arrows (elevation)
- **Controller:** Right stick for aiming (horizontal + elevation)
- Range: horizontal ±45° from perpendicular, elevation 15-60°
- Works identically for both Cannonball and Human Cannonball ammunition types
- No visual aids or trajectory preview (player relies on experience/intuition)

**Physics:**
- **Launch speed:** 450 px/s (50% faster than cannonball for dramatic effect)
- **Gravity:** 150 px/s² (same as cannonballs)
- **Flight time:** ~4 seconds at 45° elevation
- **Range:** ~900-1000 pixels (~28-31 tiles)

**Collision & Landing:**
- Check water collision: heightZ ≤ 0 AND tile.properties.navigable === true
- Check ground collision: heightZ ≤ 0 AND tile walkable
- Check ship collision: OBB overlap at deck height (player boards ship from above)
- Out of bounds: if landing position outside map, respawn player on source ship deck
- **Landing detection is client-side** - each client calculates independently using deterministic physics

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
- **Landing is client-side** - each client detects landing using identical physics simulation
- Player resumes normal position updates after landing (via existing MEW Protocol position messages)

## Implementation Phases

### Phase 1: Ammunition Cycling System ✅ FOUNDATION

**Goal:** Player can grab cannon, cycle between ammo types, and see current selection

**Client Changes:**
1. Add ammunition state to cannon control in `ShipInputHandler.ts`:
   ```typescript
   interface CannonControlState {
     side: 'port' | 'starboard';
     index: number;
     currentAmmo: 'cannonball' | 'human_cannonball';
   }
   ```
2. Add Tab key binding (keyboard) in `ShipInputHandler.ts`
3. Add LB/RB bumper bindings (controller) for cycling ammunition
4. Send `ship/cycle_ammo` message when player presses Tab/LB/RB
5. Create ammunition indicator UI element:
   - Shows current ammo type ("Cannonball" or "Human Cannonball")
   - Shows icon for each type
   - Positioned above the existing altitude display
   - Only visible when controlling cannon

**Server Changes:**
1. Add `currentAmmo` field to cannon state in `ShipServer.ts`
2. Add message handler: `ship/cycle_ammo`
   - Toggle between 'cannonball' and 'human_cannonball'
   - Broadcast updated ammo state to all clients
3. Modify `ship/fire_cannon` handler:
   - Check `currentAmmo` type
   - If 'cannonball': spawn cannonball projectile (existing behavior)
   - If 'human_cannonball': spawn human projectile (new behavior)

**UI Changes:**
1. Create `AmmoIndicator.ts` component in `client/src/game/ui/`
2. Show ammo type text + icon (e.g., "Cannonball" with cannon icon, "Human Cannonball" with player icon)
3. Position above existing altitude display
4. Update when receiving ammo state from server
5. Hide when not controlling cannon

**Success Criteria:**
- Player can press E to grab cannon (defaults to Cannonball)
- Player can press Tab/LB/RB to cycle ammunition
- UI indicator updates to show current ammunition type
- Other players see same ammo state on their clients

---

### Phase 2: Basic Human Cannonball Launch

**Goal:** Player can launch from cannon and land safely

**Client Changes:**
1. Extend `Projectile` interface with `playerId?: string` field in `types.ts`
2. In `ProjectileManager.spawnProjectile()`:
   - Check if `type === 'human_cannonball'`
   - Create player sprite instead of black circle
   - Store projectile with player ID reference
3. In `ProjectileManager.updateProjectiles()`:
   - Check water/ground landing (not ship collision yet)
   - On landing: emit event to teleport player to landing position
   - Destroy projectile sprite
4. Hide local player sprite when launched
5. Show local player sprite at landing position

**Server Changes:**
1. Modify `ship/fire_cannon` handler for human cannonball:
   - Validate: player controlling cannon, cannon not on cooldown
   - Calculate spawn position (cannon muzzle)
   - Use player's current aim angles (from existing aim state)
   - Broadcast `game/projectile_spawn` with `type: 'human_cannonball'`
   - Include `playerId` in projectile payload
   - Set cannon cooldown to 4000ms
   - Release player's cannon control automatically
   - **Note:** Ship server does NOT track landing - that's client-side

**Success Criteria:**
- Player can cycle to "Human Cannonball" and fire
- Player sprite disappears and reappears at landing position
- Cannon enters cooldown after launch
- Other players see flying player sprite
- Player automatically releases cannon control after launching

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
1. No server changes needed for landing
2. Landing is handled client-side with deterministic physics
3. Player resumes normal position updates via MEW Protocol after landing

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
1. No server changes needed
2. Ship landing detection is entirely client-side
3. Player boarding uses existing ship boarding logic (ship-relative positioning)

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
   - If player lands out of bounds: respawn on source ship deck
   - Consistent with projectile behavior (no special boundary clamping)
2. **Cooldown UI:**
   - Same cooldown indicator for both ammunition types (4s)
   - Gray cooldown indicator shrinks on cannon sprite (existing behavior)
3. **Sound effects:**
   - Launch sound: same as regular cannonball (existing cannon fire sound)
   - Flight sound: wind/whistle (looped during flight, unique to human cannonball)
   - Landing sound: splash (water) or thud (ground)
4. **Edge case handling:**
   - Can't fire human cannonball if ship is sinking
   - Same control restrictions as regular cannonballs (one player per cannon)

**Success Criteria:**
- No crashes from edge cases (out of bounds, missing ship, etc.)
- Sound effects enhance experience
- Cooldown indicators work consistently
- Edge cases handled gracefully

## Technical Specification

### New Message Types

#### `ship/cycle_ammo`
Player requests to cycle ammunition type for current cannon.

```typescript
{
  kind: 'ship/cycle_ammo',
  to: ['ship1'],
  payload: {
    playerId: string,
    side: 'port' | 'starboard',
    index: number           // Cannon index (0, 1)
  }
}
```

**Response:** Ship broadcasts updated cannon state with new `currentAmmo` value to all clients.

#### `game/cannon_state`
Ship broadcasts cannon state updates (including ammunition selection).

```typescript
{
  kind: 'game/cannon_state',
  to: [],
  payload: {
    shipId: string,
    side: 'port' | 'starboard',
    index: number,
    controlledBy: string | null,
    currentAmmo: 'cannonball' | 'human_cannonball',
    aimAngle: number,
    elevationAngle: number,
    cooldownRemaining: number
  }
}
```

**Note:** This message is sent when ammunition type changes, or when any cannon state changes.

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
- `client/src/types.ts:170-188` - Add `playerId?: string` and `type` to Projectile interface
- `client/src/game/input/ShipInputHandler.ts` - Add Tab/LB/RB bindings for cycling ammo
- `client/src/game/managers/ProjectileManager.ts` - Handle human_cannonball type
- `client/src/game/network/ShipCommands.ts` - Add `cycleAmmo()` method
- `client/src/game/ui/AmmoIndicator.ts` - **NEW FILE** - UI component for ammo display

**Server:**
- `server/mcp-servers/ShipServer.ts` - Add `handleCycleAmmo()` method, modify `handleFireCannon()`
- `server/mcp-servers/ShipParticipant.ts` - Add message handler for `ship/cycle_ammo`
- `server/mcp-servers/types.ts` - Add `currentAmmo` field to cannon state, add projectile type field

### Constants

```typescript
// In Constants.ts
export const HUMAN_CANNONBALL_SPEED = 450; // px/s (1.5x cannonball speed)
export const HUMAN_CANNONBALL_LIFETIME = 6000; // ms (longer than cannonball)
```

## Success Criteria

### Functional Requirements

- ✅ Player can grab cannon with E/A button
- ✅ Player can cycle ammunition with Tab/LB/RB
- ✅ Player can aim with arrow keys/right stick (horizontal + elevation)
- ✅ Aiming works identically for both ammo types (no trajectory preview)
- ✅ Player sprite becomes projectile during flight
- ✅ Camera follows player smoothly during flight
- ✅ Player lands safely on water, ground, or ship deck
- ✅ Landing position calculated identically on all clients (deterministic physics)
- ✅ Cannon enters 4s cooldown after launch

### Visual Requirements

- ✅ Player sprite visible during flight (not invisible)
- ✅ Smoke trail follows player projectile
- ✅ Shadow ellipse renders at ground level
- ✅ Landing shows splash (water) or dust (ground) particles
- ✅ Ammo indicator shows current ammunition type

### Network Requirements

- ✅ All clients see flying player at same position
- ✅ Physics simulation is deterministic (matches on all clients)
- ✅ Landing position calculated identically on all clients (same physics)
- ✅ Player resumes normal position updates after landing
- ⚠️ No server-side exploit prevention (consistent with current architecture)

### Quality Requirements

- ✅ No crashes from edge cases (out of bounds, missing ship)
- ✅ Frame rate remains 60 FPS with multiple flying players
- ✅ Controls are intuitive and responsive
- ✅ Feature is fun and encourages experimentation

## Alternatives Considered

See `decision-h2c-loading-interaction.md` for detailed analysis of 8 different interaction design options.

### Selected Approach: Option 2 (Cycle Ammunition)

**Design:**
- Grab cannon with E/A (same as existing controls)
- Cycle ammunition with Tab (keyboard) or LB/RB bumpers (controller)
- Fire with Space/RT (same as existing controls)

**Rationale:**
- ✅ **Controller-first design** - LB/RB bumpers are standard for weapon/item switching
- ✅ **Extends naturally** to future ammunition types (chain shot, grape shot, etc.)
- ✅ **Doesn't waste face buttons** - X/Y remain available for other features
- ✅ **Discoverable** - players instinctively try bumpers for switching
- ✅ **Familiar pattern** - Tab/bumpers used for weapon switching in most games
- ✅ **Foundation for inventory** - can integrate with future inventory system

**Rejected:** Option 1 (Separate Buttons) - would use F/X button for human cannonball, doesn't extend to 3+ ammo types

### Other Design Decisions

### 1. Launch Speed = 450 px/s (1.5x Cannonball Speed)

**Pros:**
- Dramatic and exciting
- Longer range (~900px vs ~600px)
- Feels appropriately "special"

**Cons:**
- Faster than cannonballs (less consistent)

**Decision:** Accepted - dramatic effect worth inconsistency

### 2. No Damage on Landing

**Pros:**
- Encourages experimentation
- No health system required
- Fun over realism

**Cons:**
- Less realistic
- No risk/reward

**Decision:** Accepted - safe landings prioritize fun

### 3. No Trajectory Preview

**Pros:**
- Consistent with cannonball firing (same aiming experience)
- Simpler implementation (no trajectory calculation/rendering)
- No visual clutter
- Players learn through practice (skill-based)
- Maintains game's "figure it out" philosophy

**Cons:**
- Less precision for first-time users
- May require trial-and-error

**Decision:** Accepted - keeps aiming consistent across all ammunition types

## Future Enhancements

### Phase 6+: Advanced Features

1. **Additional Ammunition Types:**
   - Chain shot (dual projectiles connected by chain)
   - Grape shot (scatter shot with multiple small projectiles)
   - Explosive shot (area damage on impact)
   - All accessible via Tab/LB/RB cycling

2. **Power Charge:**
   - Hold Space/RT to charge launch power (longer press = farther distance)
   - UI shows power meter filling up
   - Max charge = 600 px/s, min = 300 px/s

3. **Landing Roll:**
   - Player sprite does a roll animation on landing (if on ground)
   - Slight momentum in landing direction (slide a few pixels)

4. **Direct Selection (D-Pad):**
   - D-pad up = Cannonball
   - D-pad down = Human Cannonball
   - D-pad left/right = other ammo types
   - Faster than cycling with bumpers

5. **AI Agent Support:**
   - AI agents can calculate optimal launch trajectory
   - Use human cannonball for navigation shortcuts
   - Requires pathfinding integration

6. **Inventory Integration:**
   - Ammunition types come from player inventory
   - Limited ammo counts (except human cannonball = unlimited)
   - Ammo crafting and trading system

7. **Mid-Air Tricks:**
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

**Impact:** Player lands outside map boundaries → game crash or undefined behavior
**Mitigation:** Client-side bounds checking at landing - if out of bounds, respawn player on source ship deck (consistent with projectile behavior)

### Risk: Position Exploits (Client-Side Landing)

**Impact:** Modified clients could teleport to arbitrary positions
**Mitigation:** None - consistent with current MEW Protocol peer-to-peer architecture where players self-report positions. Deterministic physics on honest clients ensures consistency in normal gameplay.

### Risk: Camera Disorientation

**Impact:** Camera following projectile makes players dizzy
**Mitigation:** Smooth lerp (0.05 factor), optional "cinematic mode" toggle

### Risk: Network Desync

**Impact:** Remote players see flying player in wrong position or landing at different location
**Mitigation:**
- Reuse proven projectile physics (deterministic, identical on all clients)
- All clients receive same spawn message with identical initial conditions
- Landing position emerges from same physics simulation on all clients
- Player resumes normal position sync after landing via existing MEW Protocol messages

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
   - **Resolution:** Yes - player automatically releases cannon control after launching as human cannonball

2. **Can you launch from enemy ships?**
   - No ship ownership currently exists
   - Recommendation: Yes (any player can use any cannon)
   - **Resolution:** Yes - any player can grab any cannon and launch

3. **What happens if ship sinks mid-flight?**
   - Player is projectile (detached from ship)
   - Recommendation: Continue flight normally (player is airborne)
   - **Resolution:** Continue flight - player is independent projectile

4. **What if player releases cannon control while Human Cannonball is selected?**
   - Should ammunition selection persist on the cannon?
   - Recommendation: Reset to Cannonball when control is released (default state)
   - **Resolution:** Always reset to Cannonball on release - prevents confusion

5. **Should other players see which ammo type is loaded?**
   - Could show different indicator color/icon above cannon
   - Recommendation: Phase 6+ enhancement - not critical for MVP
   - **Resolution:** Not in initial implementation - only controller sees UI indicator

## References

- `spec/SPEC.md:1089-1407` - Milestone 9: Ship-to-Ship Combat
- `spec/proposals/c5x-ship-combat/` - Cannon combat system
- `spec/proposals/p2v-projectile-velocity/` - Projectile physics
- `spec/proposals/i2m-true-isometric/` - Coordinate transforms
