# Human Cannonball - Research

## Existing Systems Analysis

### Cannon Combat System (c5x-ship-combat)

**Current Architecture:**
- Ships have 2 port and 2 starboard cannons
- Cannons fire projectiles using 3D physics (ground + height separation)
- Projectile spawning uses `game/projectile_spawn` message broadcast
- Server calculates initial velocity from aim angle + elevation

**Key Constants:**
- `CANNON_SPEED`: 300 px/s (initial projectile speed)
- `GRAVITY`: 150 px/s² (affects height velocity only)
- Fire cooldown: 4000ms (4 seconds)
- Elevation range: 15-60° (prevents deck/sky shots)
- Horizontal aim: ±45° from perpendicular

**Projectile Physics (p2v-projectile-velocity):**
```typescript
// 3D coordinate system
{
  groundX, groundY: number;    // Horizontal position on map
  groundVx, groundVy: number;  // Ground-plane velocity
  heightZ: number;             // Elevation above ground
  heightVz: number;            // Vertical velocity
}

// Physics update (client + server identical)
groundX += groundVx * dt;
groundY += groundVy * dt;
heightVz -= GRAVITY * dt;
heightZ += heightVz * dt;
```

**Spawn Position Calculation:**
```typescript
// Cannon muzzle offset from ship center
const cannonRelative = { x: -10, y: -24 }; // Example port cannon

// Rotate to world coordinates
const rotated = rotatePointIsometric(cannonRelative, shipRotation);
const spawnX = shipX + rotated.x;
const spawnY = shipY + rotated.y;
```

### Player System

**Player State (`types.ts:86-95`):**
```typescript
interface Player {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  targetPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  platformRef: string | null;
  onShip: string | null;
  lastWaveOffset: number;
}
```

**Player Movement:**
- Arrow keys for 8-directional movement
- Movement speed: 100 px/s
- Wave bobbing applied when in water (not on ship)
- Ship-relative positioning when on deck

**Player-Ship Interaction (`ShipInputHandler.ts`):**
- E key to grab/release control points
- Proximity detection: 30 pixel radius
- Control points: wheel, sails, mast, cannons (port/starboard × 2)

### Ship Control Points

**Cannon Control (`ShipInputHandler.ts:381-442`):**
- Player walks near cannon → yellow indicator appears
- Press E → grab cannon control
- Left/right arrows → horizontal aim (±45°)
- Up/down arrows → elevation adjustment (15-60°)
- Space bar → fire projectile

**Cannon State:**
```typescript
interface Cannon {
  sprite: Phaser.GameObjects.Graphics;
  relativePosition: { x: number; y: number };
  controlledBy: string | null;
  aimAngle: number;
  elevationAngle: number;
  cooldownRemaining: number;
}
```

### Projectile Spawning Protocol

**Server Side (`ShipServer.ts`):**
1. Player sends `ship/fire_cannon` message
2. Server validates: cannon exists, player controls it, not on cooldown
3. Server calculates spawn position (cannon muzzle)
4. Server calculates velocity from aim + elevation angles
5. Server broadcasts `game/projectile_spawn` to all clients
6. Server tracks projectile for hit validation

**Client Side (`ProjectileManager.ts:80-158`):**
1. Receive `game/projectile_spawn` message
2. Convert screen spawn position to ground coordinates
3. Create cannonball sprite (black circle, 8px diameter)
4. Create shadow ellipse at ground level
5. Store projectile with 3D physics state
6. Play cannon fire sound + camera shake
7. Show blast effect at spawn position

## Relevant Code Locations

### Client Side

**Projectile Management:**
- `client/src/game/managers/ProjectileManager.ts:76-158` - Projectile spawning
- `client/src/game/managers/ProjectileManager.ts:165-320` - Physics update loop
- `client/src/types.ts:170-188` - Projectile interface

**Cannon Controls:**
- `client/src/game/input/ShipInputHandler.ts:381-442` - Cannon proximity detection
- `client/src/game/input/ShipInputHandler.ts:520-570` - Cannon aiming + firing input
- `client/src/game/network/ShipCommands.ts` - Command messages to ship server

**Player Management:**
- `client/src/game/managers/PlayerManager.ts:57-103` - Remote player updates
- `client/src/game/managers/PlayerManager.ts:111-163` - Position interpolation
- `client/src/game/input/PlayerInputHandler.ts` - Player movement input

### Server Side

**Ship Server:**
- `server/mcp-servers/ShipServer.ts:689-719` - Velocity calculation from aim/elevation
- `server/mcp-servers/ShipServer.ts:544-620` - Fire cannon handler
- `server/mcp-servers/ShipParticipant.ts:208-223` - Fire cannon message handler

**Message Handlers:**
- `server/mcp-servers/ShipParticipant.ts:104-119` - Grab cannon
- `server/mcp-servers/ShipParticipant.ts:120-135` - Aim cannon
- `server/mcp-servers/ShipParticipant.ts:136-151` - Adjust elevation
- `server/mcp-servers/ShipParticipant.ts:152-167` - Fire cannon

## Key Insights

### What Can Be Reused

1. **Projectile Physics System**
   - Same 3D coordinate system (ground + height)
   - Same gravity constant (150 px/s²)
   - Same rendering (sprite + shadow)
   - Same network protocol (`game/projectile_spawn`)

2. **Spawn Position Calculation**
   - Isometric rotation transforms
   - Relative → world coordinate conversion
   - Spawn height = 0 (deck level)

3. **Velocity Calculation**
   - Horizontal speed from elevation angle
   - Vertical component from elevation angle
   - Inverse isometric transform for ground velocity

4. **Network Architecture**
   - Ship server owns cannon state
   - Server validates before spawning
   - Broadcast spawn to all clients
   - Client-side prediction with server authority

### What Needs Modification

1. **Projectile Type**
   - Cannonballs are `type: 'cannonball'`
   - Need new type: `type: 'player'` or `type: 'human_cannonball'`
   - Different collision behavior (no ship damage)
   - Different visual (player sprite instead of black circle)

2. **Collision Detection**
   - Cannonballs check ship OBB collision
   - Human cannonballs check ground/water collision only
   - Landing triggers player teleport + animation

3. **Spawn Source**
   - Cannonballs spawned by player controlling cannon
   - Human cannonballs spawn player themselves
   - Player must be near cannon but not controlling it

4. **Trajectory Limits**
   - Cannonballs: 2s client lifetime, 5s server validation window
   - Human cannonballs: may need longer (players travel farther?)
   - Need max distance limit to prevent out-of-bounds

### Physics Considerations

**Existing Projectile Range:**
- Horizontal speed at 45° elevation: 300 × cos(45°) ≈ 212 px/s
- Vertical speed at 45° elevation: 300 × sin(45°) ≈ 212 px/s
- Flight time to ground: t = 2 × vz / g = 2 × 212 / 150 ≈ 2.83 seconds
- Horizontal distance: 212 px/s × 2.83s ≈ 600 pixels (~18-19 tiles)

**Scaling for Players:**
- Option 1: Same speed (300 px/s) → ~600px range
- Option 2: Higher speed (450 px/s) → ~900px range (dramatic launches)
- Option 3: Adjustable speed based on cannon elevation

**Landing Impact:**
- Water landing: Safe (player enters swimming state, wave bobbing)
- Ground landing: Safe (player teleported to landing position)
- Ship landing: Safe? Or damage player/ship?
- Out of bounds: Teleport back to launch position (safety)

### User Experience Flow

**Current Cannon Firing:**
1. Walk near cannon
2. Press E to grab cannon
3. Aim with arrows (horizontal + elevation)
4. Press Space to fire
5. Wait 4s cooldown before next shot

**Proposed Human Cannonball:**
1. Walk near cannon (NOT controlling it)
2. Press [special key] to "load yourself" (new action)
3. Cannon aims automatically? Or player aims before loading?
4. Countdown timer? (3... 2... 1... FIRE!)
5. Player sprite becomes projectile
6. Arc through air with camera following
7. Land at destination → teleport player, show particles
8. Resume normal controls

**Alternative Flow (Auto-Aim):**
1. Walk near cannon
2. Hover shows landing zone preview (based on current aim)
3. Press [key] to confirm and fire
4. Immediate launch (no aiming required)

**Alternative Flow (Aim First):**
1. Walk near cannon + press E → special "load mode"
2. Aim with arrows (just like firing cannonball)
3. UI shows trajectory arc preview
4. Press Space to confirm and launch
5. Cannot cancel once launched

## Technical Constraints

### Network Synchronization

**Challenge:** Player position updates sent at 10 Hz (every 100ms)
**Issue:** During 2-3 second flight, only 20-30 position updates
**Solution:** Clients simulate identical physics (already done for cannonballs)

**Validation:**
- Server tracks player projectile state
- Server validates landing position
- Prevents teleport exploits (must follow physics)

### Collision Edge Cases

1. **Player lands on moving ship:**
   - Need to check ship OBB collision at landing
   - Transfer to ship platform coordinates
   - Player "boards" ship from above

2. **Player lands out of map bounds:**
   - Detect map boundary collision
   - Teleport back to cannon position
   - Show "launch failed" message

3. **Player hits obstacle mid-flight:**
   - Unlikely (projectiles fly over terrain)
   - Could add terrain height map (future)
   - For now: only check collision at landing

### Camera Behavior

**Current:** Camera follows player with lerp (0.1 factor)
**During Flight:** Camera should follow projectile smoothly
**Implementation:**
- Temporarily switch camera target to projectile sprite
- After landing, switch back to player sprite
- Smooth transition to avoid jarring jumps

### Animation States

**Player sprite currently has:**
- 8-directional walk animations (N, NE, E, SE, S, SW, W, NW)
- Idle state (stopped animation)

**New state needed:**
- "Flying" or "tumbling" animation
- Could rotate player sprite during flight
- Or use specific "cannonball pose" frame

## Design Questions

1. **Can you load yourself if someone is controlling the cannon?**
   - Option A: No (cannon busy)
   - Option B: Yes (overrides their aim)
   - Recommendation: Option A (simpler, clearer)

2. **Who controls the aim?**
   - Option A: Player who loads themselves (aim before launch)
   - Option B: Player controlling cannon (team coordination)
   - Option C: Auto-aim to nearest island/ship
   - Recommendation: Option A (solo play support)

3. **What happens if you land on another player?**
   - Option A: Pass through (no collision)
   - Option B: Both players stunned briefly
   - Option C: Knockback effect
   - Recommendation: Option A (simplest)

4. **Cooldown mechanics?**
   - Option A: Share cannon's 4s cooldown (can't fire OR launch)
   - Option B: Separate cooldown (can fire then launch, or vice versa)
   - Recommendation: Option A (prevents spam)

5. **What key binding?**
   - Option A: E key (context-sensitive: grab cannon OR load yourself)
   - Option B: New key (Shift+E, or F)
   - Option C: Same as fire (Space) when near but not controlling
   - Recommendation: Option B or C (avoid accidental launches)

6. **Can AI agents use this?**
   - Future consideration (requires pathfinding + trajectory calculation)
   - Initially: human players only
   - Later: AI can calculate optimal launch angles for navigation

## Performance Impact

**Negligible:**
- Reuses existing projectile system
- One additional projectile type check in rendering
- Same network bandwidth as cannonball
- Camera follow already implemented

**Potential Issues:**
- Multiple players launching simultaneously
- Camera switching could be disorienting
- Need to disable player input during flight

## Related Proposals

- **c5x-ship-combat**: Cannon combat system (source of mechanics)
- **p2v-projectile-velocity**: 3D projectile physics (reused directly)
- **i2m-true-isometric**: Coordinate transforms (spawn position calculation)
- **b8s-cannonball-shadows**: Shadow rendering (human cannonball needs shadow too)

## References

- `spec/SPEC.md:1089-1407` - Milestone 9: Ship-to-Ship Combat
- `client/src/game/managers/ProjectileManager.ts` - Projectile lifecycle
- `server/mcp-servers/ShipServer.ts` - Cannon firing logic
