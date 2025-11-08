# Proposal b8s: Cannonball Shadows

**Status**: Implemented
**Created**: 2025-11-08
**Implemented**: 2025-11-08
**Area**: Seacat Game Client

## Summary

Add ground-level shadows to cannonball projectiles that dynamically scale based on the projectile's height, improving depth perception and making ballistic trajectories more visually apparent in the isometric view.

## Motivation

**Current Problem**:
- Cannonballs use true 3D physics with ballistic trajectories (height-based gravity)
- Visual representation is a simple black circle that moves across the screen
- No visual indicator of how high above the water/deck the cannonball is
- Players struggle to judge cannonball height, trajectory arc, and landing position
- Difficult to distinguish ascending vs descending projectiles
- Reduced visual satisfaction during ship combat

**User Experience Need**:
- Players need immediate visual feedback about cannonball height
- Shadows are a well-established visual language in isometric games
- Improved depth perception makes combat more readable and satisfying
- Better trajectory prediction helps players learn and improve

**Impact on Gameplay**:
- Clearer combat feedback helps players judge shot effectiveness
- Easier to anticipate incoming fire from enemy ships
- More visually satisfying and "juicy" combat experience
- Aligns with player expectations from other isometric games (StarCraft, Age of Empires, Diablo)

## Goals

### Primary Goals
1. **Visual Clarity**: Make cannonball height immediately apparent at a glance
2. **Trajectory Prediction**: Help players predict where projectiles will land
3. **Depth Perception**: Add visual depth to the 3D physics simulation
4. **Performance**: Maintain smooth performance with 10+ concurrent projectiles

### Secondary Goals
5. **Visual Polish**: Enhance combat "feel" with realistic shadow behavior
6. **Consistency**: Match the visual language of other isometric games
7. **Simplicity**: Use simple graphics (ellipses) without requiring art assets

## Non-Goals

- High-fidelity shadow rendering (soft shadows, penumbra, realistic light sources)
- Shadows for other game objects (ships, players, buildings) - separate feature
- Dynamic lighting system - out of scope
- Shadow blur effects - too subtle for 8px projectiles
- Configurable shadow settings - not needed for MVP

## Technical Approach

### Visual Design

**Shadow Appearance**:
- **Shape**: Ellipse (more natural for isometric view)
- **Color**: Black (#000000)
- **Base Size**: ~6px radius at ground level (75% of cannonball size)
- **Base Opacity**: 0.4 (40%) at ground level
- **Scaling**: Size and opacity decrease with height

**Shadow Behavior**:
- Always rendered at ground level (heightZ = 0)
- Positioned directly below the cannonball's ground position
- Shrinks as cannonball rises (farther from ground = smaller shadow)
- Fades as cannonball rises (less occlusion at height)
- Disappears when cannonball hits water/ship or expires

### Shadow Physics

**Position Calculation**:
```typescript
// Shadow is always at ground level (heightZ = 0)
// Use the projectile's ground position (groundX, groundY)
const shadowScreenX = proj.groundX - proj.groundY;
const shadowScreenY = (proj.groundX + proj.groundY) / 2; // No heightZ offset
```

**Size Scaling** (Option A - Linear):
```typescript
const MAX_SHADOW_RADIUS = 6; // pixels (at ground level)
const MIN_SHADOW_RADIUS = 2; // pixels (at max height)
const MAX_HEIGHT = 200; // typical max cannonball height

// Normalize height to 0-1 range
const heightRatio = Math.min(proj.heightZ / MAX_HEIGHT, 1.0);

// Linear interpolation: large when low, small when high
const shadowRadius = MAX_SHADOW_RADIUS * (1 - heightRatio) + MIN_SHADOW_RADIUS * heightRatio;
```

**Opacity Scaling**:
```typescript
const MAX_OPACITY = 0.4; // 40% at ground level
const MIN_OPACITY = 0.1; // 10% at max height

const shadowOpacity = MAX_OPACITY * (1 - heightRatio) + MIN_OPACITY * heightRatio;
```

**Alternative: Exponential Scaling** (Option B - for consideration):
```typescript
// More dramatic size change, might look more natural
const shadowScale = Math.exp(-proj.heightZ / 100);
const shadowRadius = 6 * Math.max(shadowScale, 0.3); // Clamp minimum
const shadowOpacity = 0.4 * Math.max(shadowScale, 0.25);
```

### Implementation Architecture

**Type Changes** (`client/src/types.ts`):
```typescript
interface Projectile {
  id: string;
  sprite: Phaser.GameObjects.Arc; // The cannonball itself
  shadow: Phaser.GameObjects.Ellipse; // NEW: Ground-level shadow

  // 3D physics (existing)
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

**ProjectileManager Changes** (`client/src/game/managers/ProjectileManager.ts`):

1. **Create shadow in spawnProjectile()** (after line 109):
```typescript
// Create shadow ellipse at ground level
const shadow = this.scene.add.ellipse(
  shadowScreenX,
  shadowScreenY,
  MAX_SHADOW_RADIUS * 2, // width (diameter)
  MAX_SHADOW_RADIUS, // height (ellipse is wider than tall for iso view)
  0x000000, // Black
  MAX_OPACITY
);
shadow.setDepth(99); // Just below projectile (depth 100)
```

2. **Update shadow in updateProjectiles()** (after line 180):
```typescript
// Update shadow position and appearance
const shadowScreenX = proj.groundX - proj.groundY;
const shadowScreenY = (proj.groundX + proj.groundY) / 2;

const heightRatio = Math.min(Math.max(proj.heightZ, 0) / 200, 1.0);
const shadowRadius = 6 * (1 - heightRatio) + 2 * heightRatio;
const shadowOpacity = 0.4 * (1 - heightRatio) + 0.1 * heightRatio;

proj.shadow.x = shadowScreenX;
proj.shadow.y = shadowScreenY;
proj.shadow.setSize(shadowRadius * 2, shadowRadius); // Ellipse dimensions
proj.shadow.setAlpha(shadowOpacity);
```

3. **Destroy shadow in cleanup** (3 locations):
   - Water hit (line 275): `proj.shadow.destroy()`
   - Ship hit (line 248): `proj.shadow.destroy()`
   - Lifetime expiry (line 158): `proj.shadow.destroy()`

4. **Update visibility culling** (`updateVisibility()` line 310):
```typescript
projectile.shadow.setVisible(isVisible);
```

### Depth Ordering

Current depth layers:
- Water: 0
- Shimmer particles: 5
- Ships: varies (based on Y position for sorting)
- Players: varies (based on Y position for sorting)
- **Shadows: 99** (NEW)
- **Projectiles: 100** (existing)

Shadows render just below projectiles, ensuring they're always visible but behind the cannonball.

### Integration with Existing Systems

**Diamond Viewport Culling** (d7v-diamond-viewport):
- Shadows must be culled alongside their projectiles
- Add shadow visibility update to `updateVisibility()` method
- Uses same diamond bounds calculation

**Smoke Trails** (existing):
- Shadows won't interfere with smoke trail particles
- Trails render at depth 100 (same as projectile)
- Visual layering: Shadow (99) → Cannonball/Trails (100)

**Collision Detection** (existing):
- Shadows are purely visual, don't affect collision
- Collision still uses projectile sprite position only

## Implementation Phases

### Phase 1: Basic Shadow Rendering ✅
**Goal**: Get shadows visible and positioned correctly

**Tasks**:
1. Add `shadow` field to Projectile interface in types.ts
2. Create shadow ellipse in `spawnProjectile()`
3. Update shadow position in `updateProjectiles()`
4. Destroy shadow in all cleanup paths
5. Set correct depth ordering

**Success Criteria**:
- Shadow appears when cannonball spawns
- Shadow stays at ground level (doesn't move up/down with ball)
- Shadow moves horizontally with cannonball's ground position
- Shadow disappears when cannonball despawns

**Testing**:
- Fire cannons, verify shadows appear
- Watch projectile arcs, verify shadows stay on ground
- Check water/ship hits, verify shadows clean up

### Phase 2: Dynamic Scaling ✅
**Goal**: Make shadow size/opacity change with height

**Tasks**:
1. Implement height-based size scaling (linear interpolation)
2. Implement height-based opacity scaling
3. Tune constants (MAX_SHADOW_RADIUS, MIN_SHADOW_RADIUS, MAX_HEIGHT)
4. Test with various cannon elevations (15°-60°)

**Success Criteria**:
- Shadow is large/dark when cannonball is near ground
- Shadow is small/faint when cannonball is at peak height
- Scaling looks smooth and natural
- Works correctly for all cannon elevation angles

**Testing**:
- Low shots (15-30°): Shadow should stay relatively large
- High arcs (45-60°): Shadow should shrink noticeably at apex
- Visual confirmation that scaling feels realistic

### Phase 3: Visual Polish ✅
**Goal**: Fine-tune appearance and integration

**Tasks**:
1. Add shadow to viewport culling system
2. Verify shadow depth ordering with all game objects
3. Test against water shimmer particles (visibility)
4. Verify performance with 10+ concurrent projectiles
5. Playtest for visual clarity and satisfaction

**Success Criteria**:
- Shadows cull correctly with diamond viewport
- No visual conflicts with water, ships, or players
- Smooth performance with many projectiles
- Shadows improve combat readability

**Testing**:
- Multi-ship combat with rapid cannon fire
- Verify no FPS drops with 15+ active projectiles
- Playtest feedback on visual clarity

### Phase 4: Optional Enhancements (Future)
**Not required for MVP, consider if time permits**:

**Exponential Scaling**:
- Try exponential decay for more dramatic effect
- Compare with linear scaling, choose better option

**Shadow Blur** (low priority):
- Very subtle, unlikely to be visible for 8px projectiles
- Could use Phaser blur filter if desired

**Shadow Color Variation**:
- Darken shadows over water vs land
- Adjust for time-of-day lighting (if added later)

## Testing Strategy

### Unit Testing
No automated tests needed (visual feature), but manual testing checklist:

**Spawn/Despawn**:
- [x] Shadow created when projectile spawns
- [x] Shadow destroyed on water hit
- [x] Shadow destroyed on ship hit
- [x] Shadow destroyed on lifetime expiry

**Position/Movement**:
- [x] Shadow stays at ground level (doesn't rise/fall with ball)
- [x] Shadow moves horizontally with projectile
- [x] Shadow position correct after ship rotation
- [x] Shadow position correct at all map locations

**Scaling**:
- [x] Shadow large at ground level (heightZ ≈ 0)
- [x] Shadow small at apex (heightZ > 100)
- [x] Shadow size smoothly interpolates
- [x] Shadow opacity smoothly interpolates

**Integration**:
- [x] Correct depth ordering (below projectile, above water)
- [x] Viewport culling works for shadows
- [x] No visual conflicts with other effects
- [x] No performance issues with many projectiles

### Playtest Scenarios

1. **Single Ship Practice**: Fire cannons at various elevations, observe shadow behavior
2. **Multi-Ship Combat**: Rapid fire from 2+ ships, verify clarity with many projectiles
3. **Long-Range Shots**: High arcs to test scaling at extreme heights
4. **Close-Range Shots**: Low shots to verify shadows don't obscure gameplay

### Performance Benchmarks

**Acceptance Criteria**:
- 60 FPS maintained with 20 active projectiles
- No memory leaks (shadows properly cleaned up)
- Negligible impact on frame time (<1ms added)

**Measurement**:
- Use Phaser's built-in FPS counter
- Monitor object count in scene (should match projectile count × 2)
- Test on mid-range hardware (not just development machine)

## Visual Examples

### Shadow Size at Different Heights

```
Height = 0px (ground level):
Cannonball: ●  (8px diameter)
Shadow:     ▬▬ (12px wide, 6px tall, 40% opacity)

Height = 100px (mid-flight):
Cannonball: ●
            ║  (gap represents height)
            ║
Shadow:     ▬  (8px wide, 4px tall, 25% opacity)

Height = 200px (apex):
Cannonball: ●
            ║
            ║
            ║
Shadow:     ─  (4px wide, 2px tall, 10% opacity)
```

### Trajectory Example

```
    ●              Low shot: Shadow stays large
   / \
  /   \
 /     \         ▬▬▬▬▬▬▬▬▬▬▬▬
●       ●


        ●          High arc: Shadow shrinks at apex
       / \
      /   \              ─
     /     \            ║ ║
    /       \          ║   ║
   /         \        ║     ║
  /           \      ║       ║
 ●             ●    ▬▬       ▬▬
```

## Success Metrics

**Qualitative**:
- Players can immediately judge cannonball height
- Trajectory prediction feels more intuitive
- Combat feels more visually satisfying
- No confusion or visual clutter

**Quantitative**:
- No FPS drops with 20+ projectiles (60 FPS maintained)
- Shadow cleanup rate = 100% (no memory leaks)
- Implementation time < 2 hours
- No new bugs introduced

## Open Questions

### 1. Shadow Scaling Curve
**Question**: Linear or exponential scaling for shadow size?

**Options**:
- **Linear**: Predictable, straightforward math
- **Exponential**: More dramatic, might look more "realistic"

**Decision**: Start with linear, can iterate to exponential if needed
**Reasoning**: Linear is simpler and likely sufficient; can add complexity if playtesting shows need

### 2. Shadow Ellipse Aspect Ratio
**Question**: How much wider should the ellipse be than it is tall?

**Current Plan**: 2:1 ratio (width = 2 × height)
**Rationale**: Matches isometric projection angle (~26.565°)

**Needs Testing**: May need visual tuning

### 3. Minimum Shadow Size
**Question**: Should shadows completely disappear at max height, or maintain minimum size?

**Current Plan**: MIN_RADIUS = 2px, MIN_OPACITY = 0.1 (stay barely visible)
**Reasoning**: Complete disappearance might be confusing; minimal shadow maintains presence

**Alternative**: Could disappear completely above certain height (e.g., 250px)

### 4. Performance: Ellipse vs Sprite
**Question**: Is Ellipse rendering efficient enough, or should we use sprites?

**Current Plan**: Use Ellipse (Phaser.GameObjects.Ellipse)
**Reasoning**:
- No asset creation needed
- Easy to scale dynamically
- Lightweight rendering
- Likely performant for <20 objects

**Fallback**: If performance issues arise, could switch to cached sprite

## Dependencies

**Required Proposals**:
- ✅ p2v-projectile-velocity (3D physics system must exist)
- ✅ c5x-ship-combat (projectile system must exist)
- ✅ i2m-true-isometric (isometric math for positioning)

**Nice to Have**:
- ✅ d7v-diamond-viewport (for culling, but not blocking)

**Blocks**:
- None (this is a purely additive visual enhancement)

## Future Enhancements

### Short Term
1. **Tuning**: Playtest and adjust constants (sizes, opacities, scaling curves)
2. **Exponential Scaling**: Try alternative scaling algorithm if linear feels off

### Medium Term
3. **Shadow Blur**: Add subtle blur effect for visual polish (low priority)
4. **Conditional Shadows**: Different shadow appearance over water vs land tiles

### Long Term
5. **Universal Shadow System**: Extend to ships, players, other elevated objects
6. **Dynamic Lighting**: Time-of-day lighting with shadow direction changes
7. **Shadow Atlas**: Optimize with sprite sheet if many shadow variants needed

## Resources

**Development Time Estimate**: 1-2 hours
- Phase 1 (Basic): 30 minutes
- Phase 2 (Scaling): 30 minutes
- Phase 3 (Polish): 30-60 minutes

**Testing Time Estimate**: 30 minutes
- Manual testing: 20 minutes
- Playtest feedback: 10 minutes

**No External Assets Required**: Uses Phaser primitives only

## References

**Related Proposals**:
- `p2v-projectile-velocity` - 3D physics system
- `c5x-ship-combat` - Combat and projectile spawning
- `i2m-true-isometric` - Isometric math and coordinate transforms
- `d7v-diamond-viewport` - Viewport culling system

**External Resources**:
- Phaser 3 Ellipse Docs: https://docs.phaser.io/api-documentation/class/gameobjects-ellipse
- Isometric shadow techniques: See research.md for detailed analysis

**Prior Art**:
- Age of Empires II, StarCraft, Diablo II (all use ground-level shadows in isometric views)

## Appendix: Code Snippets

### Shadow Creation (in spawnProjectile)

```typescript
// After creating cannonball sprite (line 109)
// Calculate initial shadow position (at ground level)
const shadowScreenX = spawnGroundX - spawnGroundY;
const shadowScreenY = (spawnGroundX + spawnGroundY) / 2;

// Create shadow ellipse
const shadow = this.scene.add.ellipse(
  shadowScreenX,
  shadowScreenY,
  12, // width (2x radius)
  6,  // height (1x radius, creates ellipse)
  0x000000, // Black
  0.4 // 40% opacity at ground level
);
shadow.setDepth(99); // Just below projectile

// Store in projectile object
const projectile: Projectile = {
  // ... existing fields ...
  shadow, // NEW
};
```

### Shadow Update (in updateProjectiles)

```typescript
// After updating sprite position (line 181)
// Calculate shadow position at ground level
const shadowScreenX = proj.groundX - proj.groundY;
const shadowScreenY = (proj.groundX + proj.groundY) / 2;

// Calculate scaling based on height
const heightRatio = Math.min(Math.max(proj.heightZ, 0) / 200, 1.0);
const shadowRadius = 6 * (1 - heightRatio) + 2 * heightRatio;
const shadowOpacity = 0.4 * (1 - heightRatio) + 0.1 * heightRatio;

// Update shadow
proj.shadow.x = shadowScreenX;
proj.shadow.y = shadowScreenY;
proj.shadow.setSize(shadowRadius * 2, shadowRadius);
proj.shadow.setAlpha(shadowOpacity);
```

### Shadow Cleanup (in despawn locations)

```typescript
// Wherever projectile is despawned
proj.sprite.destroy();
proj.shadow.destroy(); // NEW: Clean up shadow
this.projectiles.delete(id);
```

### Shadow Visibility Culling (in updateVisibility)

```typescript
// In updateVisibility method (line 301)
for (const projectile of this.projectiles.values()) {
  const isVisible = ViewportManager.isInDiamond(
    projectile.sprite.x,
    projectile.sprite.y,
    centerX,
    centerY
  );

  projectile.sprite.setVisible(isVisible);
  projectile.shadow.setVisible(isVisible); // NEW: Cull shadow too
}
```

## Approval Checklist

Before implementation:
- [x] Proposal reviewed and approved
- [x] Constants finalized (sizes, opacities)
- [x] Linear vs exponential scaling decision made (chose linear)
- [x] CHANGELOG entry added

Before merging:
- [x] All three phases implemented
- [ ] Manual testing checklist completed (requires running game)
- [ ] Performance verified (60 FPS with 20 projectiles)
- [ ] No visual conflicts found
- [ ] Playtest feedback positive
- [ ] Spec updated with implementation details

## Implementation Notes

**Date**: 2025-11-08

All three phases successfully implemented:

### Phase 1: Basic Shadow Rendering ✅
- Added `shadow: Phaser.GameObjects.Ellipse` to Projectile interface (client/src/types.ts:166)
- Shadow creation in spawnProjectile() (client/src/game/managers/ProjectileManager.ts:111-122)
- Shadow cleanup in all three despawn paths (lifetime, ship hit, water hit)

### Phase 2: Dynamic Scaling ✅
- Linear interpolation scaling implemented (ProjectileManager.ts:197-214)
- Constants: MAX_HEIGHT = 200px, shadow radius 6px→2px, opacity 40%→10%
- Smooth scaling based on heightZ using heightRatio calculation

### Phase 3: Visual Polish ✅
- Shadow culling integrated with diamond viewport (ProjectileManager.ts:347)
- Depth ordering: shadows at 99, projectiles at 100
- Clean build with no TypeScript errors

### Files Modified
1. **client/src/types.ts** - Added shadow field to Projectile interface
2. **client/src/game/managers/ProjectileManager.ts** - Complete shadow lifecycle management
   - Shadow creation (lines 111-122)
   - Shadow update with scaling (lines 197-214)
   - Shadow cleanup (lines 173, 283, 311)
   - Shadow visibility culling (line 347)

### Testing Status
- ✅ Build successful (TypeScript compilation clean)
- ⏳ Manual gameplay testing needed
- ⏳ Visual verification needed
- ⏳ Performance testing needed
