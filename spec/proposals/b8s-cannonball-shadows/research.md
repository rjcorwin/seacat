# Research: Cannonball Shadows (b8s)

**Created**: 2025-11-08
**Status**: Draft

## Background

Seacat features a 3D physics system for cannonballs with true ballistic trajectories. Projectiles have:
- Ground position (groundX, groundY) - horizontal position in world space
- Height (heightZ) - vertical position above ground level
- Full gravity simulation (150 px/s²)

Currently, cannonballs are rendered as simple black circles (8px diameter) with smoke trails, but lack shadows to indicate their height above the ground/water surface.

## Current Implementation

### Projectile Rendering
**Location**: `client/src/game/managers/ProjectileManager.ts:102-109`

Cannonballs are created as Phaser circles:
```typescript
const sprite = this.scene.add.circle(
  position.x,
  position.y,
  4, // radius = 4px (8px diameter)
  0x222222, // Dark gray/black
  1.0 // Full opacity
);
sprite.setDepth(100); // Above ships and players
```

### 3D Physics System
**Location**: `client/src/game/managers/ProjectileManager.ts:164-178`

The physics update loop maintains true 3D position:
```typescript
// Update ground position (no gravity - only horizontal movement)
proj.groundX += proj.groundVx * deltaS;
proj.groundY += proj.groundVy * deltaS;

// Update height (with gravity - only affects vertical component)
proj.heightVz -= this.GRAVITY * deltaS;
proj.heightZ += proj.heightVz * deltaS;

// Convert to screen coordinates for rendering
const screenX = proj.groundX - proj.groundY;
const screenY = (proj.groundX + proj.groundY) / 2 - proj.heightZ;
```

**Isometric projection formula**:
- `screenX = groundX - groundY`
- `screenY = (groundX + groundY) / 2 - heightZ`

This means as heightZ increases (cannonball goes up), the screenY decreases (moves up on screen).

### Existing Visual Effects
- **Smoke trails** (30% spawn chance per frame): Gray puffs with fade-out animation
- **Cannon blast**: Effect shown at spawn position
- **Hit effects**: Impact particles on ship hits
- **Water splash**: Large splash effect on water impact

## User Experience Problem

**Depth Perception Issue**:
When cannonballs are in flight, especially at high arcs, it's difficult for players to judge:
1. How high the cannonball is above the water/deck
2. Where the cannonball will land
3. Whether a cannonball is ascending or descending
4. The relative height between multiple cannonballs

**Impact on Gameplay**:
- Players can't predict cannonball trajectories as easily
- Reduced visual feedback for combat effectiveness
- Less satisfying visual presentation
- Harder to judge if cannonballs will hit ships or overshoot/undershoot

## Shadow Rendering Approaches

### Approach 1: Phaser Built-in FX Shadow
**API**: `sprite.preFX.addShadow()` or `sprite.postFX.addShadow()`
**Documentation**: https://docs.phaser.io/api-documentation/class/fx-shadow

**Pros**:
- Native Phaser 3 API
- Hardware-accelerated (WebGL)
- Automatic shadow rendering

**Cons**:
- Designed for sprite-based objects with textures
- May not work well with simple circle geometry
- Shadow direction is fixed (not dynamic based on height)
- Can't easily simulate ground-level shadows for 3D objects
- Overkill for simple circular shadows

**Verdict**: ❌ Not suitable for our use case

### Approach 2: Rex Rainbow Drop Shadow Plugin
**Package**: `phaser3-rex-plugins`
**Documentation**: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-dropshadow/

**Pros**:
- Configurable shadow parameters (distance, angle, color, alpha)
- Works with any game object

**Cons**:
- Requires WebGL render mode
- External dependency to manage
- Designed for UI-style drop shadows, not ground-projected shadows
- Shadow offset doesn't naturally map to 3D height
- More complex than needed

**Verdict**: ❌ Overly complex for our needs

### Approach 3: Custom Elliptical Shadow Sprites (RECOMMENDED)
**Implementation**: Draw a separate ellipse at ground level for each cannonball

**How it works**:
1. Create a semi-transparent black ellipse for each projectile
2. Position it at ground level (heightZ = 0 in the projection formula)
3. Scale size based on cannonball height:
   - Larger/darker when cannonball is low (near ground)
   - Smaller/lighter when cannonball is high (far from ground)
4. Render at lower depth than cannonball (behind it)

**Pros**:
- Simple to implement (native Phaser graphics)
- Accurate 3D-to-2D projection (uses existing isometric math)
- Performance-efficient (simple ellipse drawing)
- Natural visual mapping (shadow shrinks as ball rises)
- Consistent with game's visual style
- No external dependencies

**Cons**:
- Requires manual management (create/update/destroy)
- Needs tuning for size scaling curve

**Verdict**: ✅ Best approach for Seacat

### Approach 4: Sprite-Based Shadows with Texture
**Implementation**: Use a pre-rendered shadow texture (blurred ellipse)

**Pros**:
- Can have more sophisticated blur/gradient
- Potentially better visual quality
- Can be cached/reused

**Cons**:
- Requires asset creation
- More memory overhead
- Harder to scale dynamically
- Overkill for 8px cannonballs

**Verdict**: ⚠️ Future enhancement, not needed for MVP

## Shadow Physics

### Ground Position Calculation
For a projectile at (groundX, groundY, heightZ), the shadow should render at:
```typescript
// Shadow is always at ground level (heightZ = 0)
const shadowScreenX = groundX - groundY;
const shadowScreenY = (groundX + groundY) / 2 - 0; // heightZ = 0 for ground
```

This is the same as the projectile's ground position projected to screen space.

### Shadow Size Scaling
Shadow should change based on height:
```typescript
// Option A: Linear scaling
const maxShadowRadius = 6; // pixels
const minShadowRadius = 2;
const maxHeight = 200; // typical max cannonball height
const t = Math.min(heightZ / maxHeight, 1.0);
const shadowRadius = maxShadowRadius * (1 - t) + minShadowRadius * t;

// Option B: Exponential scaling (more dramatic)
const shadowScale = Math.exp(-heightZ / 100); // Decays with height
const shadowRadius = 6 * shadowScale;
```

### Shadow Opacity
Opacity should also decrease with height:
```typescript
const maxOpacity = 0.5; // 50% at ground level
const minOpacity = 0.1; // 10% at max height
const shadowOpacity = maxOpacity * (1 - t) + minOpacity * t;
```

## Visual Design Considerations

### Shadow Appearance
- **Shape**: Ellipse (more realistic for isometric view than circle)
- **Color**: Black (#000000)
- **Base opacity**: 0.3-0.5 (subtle but visible)
- **Base size**: ~6px radius at ground level (slightly larger than cannonball)
- **Blur**: Not needed for 8px projectiles (would be imperceptible)

### Depth Ordering
- Shadow depth: 99 (just below projectile at 100)
- This ensures shadows render beneath cannonballs
- Shadows will render above water (depth 0) but below ships (depth varies)

### Performance Impact
Creating an ellipse per projectile has minimal overhead:
- Typical projectile count: 1-10 concurrent projectiles
- 2 graphics objects per projectile (ball + shadow) = 4-20 total objects
- Ellipse rendering is highly optimized in Phaser
- No performance concern

## Integration Points

### ProjectileManager Modifications
**File**: `client/src/game/managers/ProjectileManager.ts`

**Changes needed**:
1. Add `shadow` field to `Projectile` type
2. Create shadow ellipse in `spawnProjectile()`
3. Update shadow position/size in `updateProjectiles()`
4. Destroy shadow in cleanup (water hit, ship hit, lifetime expiry)

### Type Definitions
**File**: `client/src/types.ts`

```typescript
interface Projectile {
  id: string;
  sprite: Phaser.GameObjects.Arc; // Circle shape
  shadow: Phaser.GameObjects.Arc;  // NEW: Shadow ellipse

  groundX: number;
  groundY: number;
  groundVx: number;
  groundVy: number;

  heightZ: number;
  heightVz: number;

  spawnTime: number;
  sourceShip: string;
  minFlightTime: number;
}
```

## Constraints and Considerations

### Technical Constraints
1. Must work with existing 3D physics system
2. Must not impact projectile collision detection
3. Must work with diamond viewport culling (d7v)
4. Must be performant (10+ concurrent projectiles)

### Visual Constraints
1. Must be visible against water background (shimmer particles)
2. Must not obscure important gameplay elements
3. Must clearly indicate height without being distracting
4. Should feel natural and physically realistic

### Gameplay Constraints
1. Must help players judge trajectory
2. Should not make combat too easy (still requires skill)
3. Must work in multiplayer (all players see consistent shadows)

## Prior Art

### Other Games
- **Age of Empires II**: Units have circular shadows that scale with terrain height
- **StarCraft**: All flying units have shadows at ground level
- **Diablo II**: Isometric shadows for all characters and projectiles
- **Civilization VI**: Unit shadows rendered at tile level

### Common Pattern
Nearly all isometric games use ground-level shadows for flying/elevated objects. This is a well-established visual language that players understand intuitively.

## Open Questions

1. **Shadow scaling curve**: Linear or exponential? Need to playtest both
2. **Shadow color**: Pure black or dark gray? Could be affected by water color
3. **Minimum shadow size**: Should shadows disappear completely at max height or stay visible?
4. **Shadow blur**: Worth adding for visual polish or too subtle?
5. **Performance testing**: Test with 20+ concurrent projectiles to verify no lag

## Success Criteria

A successful implementation should:
1. Make cannonball height immediately apparent
2. Help players predict landing positions
3. Add visual depth without clutter
4. Perform well with multiple projectiles
5. Look natural in the isometric art style
6. Work correctly with existing effects (smoke trails, splashes)

## References

- **Phaser 3 Shadow FX Docs**: https://docs.phaser.io/api-documentation/class/fx-shadow
- **Rex Rainbow Drop Shadow Plugin**: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-dropshadow/
- **Isometric Game Development Guide 2025**: https://vocal.media/gamers/isometric-game-development-tools-and-engines-a-2025-guide-bp3kg09sw
- **Existing proposals**:
  - p2v-projectile-velocity (3D physics implementation)
  - c5x-ship-combat (combat system)
  - i2m-true-isometric (isometric math)

## Next Steps

1. Write formal proposal.md with technical design
2. Create decision document for scaling curve choice
3. Implement prototype with both linear and exponential scaling
4. Playtest and gather feedback
5. Update CHANGELOG.md
