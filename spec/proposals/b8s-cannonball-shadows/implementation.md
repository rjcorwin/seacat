# Implementation: Cannonball Shadows (b8s)

**Date**: 2025-11-08
**Status**: Implemented
**Implementation Time**: ~1 hour

## Overview

Successfully implemented ground-level shadows for cannonball projectiles with dynamic scaling based on height. All three phases completed in a single implementation session.

## Changes Made

### 1. Type Definitions (`client/src/types.ts`)

**Lines Modified**: 158-181

Added `shadow` field to Projectile interface:
```typescript
export interface Projectile {
  id: string;
  sprite: Phaser.GameObjects.Arc;
  shadow: Phaser.GameObjects.Ellipse; // NEW: Ground-level shadow
  // ... rest of interface
}
```

### 2. ProjectileManager (`client/src/game/managers/ProjectileManager.ts`)

#### Shadow Creation (Lines 111-122)
Added shadow ellipse creation in `spawnProjectile()`:
- Creates ellipse at ground level (heightZ = 0)
- Initial size: 12px width × 6px height
- Initial opacity: 40% (0.4 alpha)
- Depth: 99 (just below projectile at depth 100)

```typescript
const shadowScreenX = spawnGroundX - spawnGroundY;
const shadowScreenY = (spawnGroundX + spawnGroundY) / 2;
const shadow = this.scene.add.ellipse(
  shadowScreenX,
  shadowScreenY,
  12, 6,
  0x000000,
  0.4
);
shadow.setDepth(99);
```

#### Shadow Update with Scaling (Lines 197-214)
Added shadow position and scaling logic in `updateProjectiles()`:
- Calculates ground-level position every frame
- Linear interpolation for size: 6px → 2px radius
- Linear interpolation for opacity: 40% → 10%
- Scales based on height ratio (heightZ / 200px)

```typescript
const shadowScreenX = proj.groundX - proj.groundY;
const shadowScreenY = (proj.groundX + proj.groundY) / 2;
const heightRatio = Math.min(Math.max(proj.heightZ, 0) / 200, 1.0);
const shadowRadius = 6 * (1 - heightRatio) + 2 * heightRatio;
const shadowOpacity = 0.4 * (1 - heightRatio) + 0.1 * heightRatio;

proj.shadow.x = shadowScreenX;
proj.shadow.y = shadowScreenY;
proj.shadow.setSize(shadowRadius * 2, shadowRadius);
proj.shadow.setAlpha(shadowOpacity);
```

#### Shadow Cleanup (Lines 173, 283, 311)
Added shadow destruction in all three despawn paths:
1. **Lifetime expiry** (line 173): `proj.shadow.destroy();`
2. **Ship hit** (line 283): `proj.shadow.destroy();`
3. **Water hit** (line 311): `proj.shadow.destroy();`

#### Viewport Culling (Line 347)
Integrated shadows with diamond viewport culling:
```typescript
projectile.sprite.setVisible(isVisible);
projectile.shadow.setVisible(isVisible); // Cull shadow with projectile
```

## Implementation Decisions

### 1. Linear vs Exponential Scaling
**Decision**: Linear interpolation
**Reasoning**:
- Simpler calculation (better performance)
- Predictable behavior
- Sufficient for 8px projectiles
- Can iterate to exponential if playtesting shows need

### 2. Shadow Constants
**Decision**:
- MAX_HEIGHT = 200px
- Shadow radius: 6px → 2px
- Shadow opacity: 40% → 10%

**Reasoning**:
- 200px captures typical cannonball apex from testing
- 6px radius is 75% of cannonball (8px), feels proportional
- Minimum 2px ensures shadow remains visible
- 40% opacity balances visibility with subtlety
- 10% minimum prevents complete disappearance

### 3. Ellipse Dimensions
**Decision**: Width = 2 × height (12px × 6px at ground level)
**Reasoning**:
- Matches isometric projection (~2:1 aspect ratio)
- Looks more natural than perfect circle
- Aligns with game's isometric visual style

### 4. Depth Ordering
**Decision**: Shadows at depth 99, projectiles at depth 100
**Reasoning**:
- Shadows always render behind projectiles
- Still visible above water (depth 0) and most terrain
- Consistent with game's depth layering system

## Technical Notes

### Isometric Projection
Shadows use the same isometric projection math as the game:
- Ground position (groundX, groundY) represents "true" position
- Screen position calculated: `screenX = groundX - groundY, screenY = (groundX + groundY) / 2`
- Shadow ignores heightZ (always at ground level)
- Projectile includes heightZ offset: `screenY = ... - heightZ`

### Performance Considerations
- Each projectile adds 1 ellipse (lightweight Phaser primitive)
- Typical load: 1-10 concurrent projectiles = 1-10 ellipses
- Ellipse rendering is highly optimized in Phaser WebGL
- No measurable performance impact expected

### Memory Management
- Shadows created/destroyed with projectiles (proper lifecycle)
- No memory leaks (destroy() called in all cleanup paths)
- Garbage collection handles cleanup automatically

## Testing Checklist

### Build Verification ✅
- [x] TypeScript compilation successful
- [x] No build errors or warnings
- [x] Bundle created successfully (6.7mb)

### Manual Testing (Pending)
- [ ] Shadows appear when projectiles spawn
- [ ] Shadows stay at ground level during flight
- [ ] Shadows shrink as projectiles rise
- [ ] Shadows fade as projectiles rise
- [ ] Shadows disappear on water hit
- [ ] Shadows disappear on ship hit
- [ ] Shadows cull with diamond viewport
- [ ] No visual conflicts with other elements
- [ ] Performance smooth with 10+ projectiles

### Visual Verification (Pending)
- [ ] Shadow size feels proportional
- [ ] Shadow opacity is visible but subtle
- [ ] Ellipse aspect ratio looks natural
- [ ] Depth ordering correct (below projectile)
- [ ] Works at all cannon elevations (15°-60°)

## Known Limitations

1. **No blur effect**: Shadows are solid ellipses, not blurred
   - Acceptable for 8px projectiles (blur would be imperceptible)
   - Could add soft edges in future if desired

2. **Fixed light direction**: Shadows directly below projectiles
   - Realistic for top-down isometric view
   - Dynamic lighting would require more complex system

3. **Uniform shadow color**: All shadows are black
   - Could vary by terrain in future (darker over sand, lighter over water)
   - Not critical for MVP

## Future Enhancements

### Short Term
1. **Tuning**: Adjust constants based on playtest feedback
   - Shadow size range (currently 6px → 2px)
   - Opacity range (currently 40% → 10%)
   - MAX_HEIGHT threshold (currently 200px)

2. **Exponential Scaling**: Try alternative scaling curve
   - May look more "natural" than linear
   - Easy to swap in for comparison

### Medium Term
3. **Shadow Blur**: Add subtle blur effect
   - Use Phaser blur filter/shader
   - Very low priority (minimal visual impact)

4. **Terrain-Aware Shadows**: Different appearance over water vs land
   - Lighter shadows over water (more reflection)
   - Darker shadows over sand/land (more absorption)

### Long Term
5. **Universal Shadow System**: Extend to other objects
   - Ships (large ground shadows)
   - Players (character shadows)
   - Other elevated objects

6. **Dynamic Lighting**: Time-of-day lighting system
   - Shadow direction changes with sun position
   - Shadow length varies by time
   - Much larger feature scope

## Success Criteria

### Completed ✅
- [x] All three implementation phases completed
- [x] TypeScript compilation successful
- [x] Clean code with comments
- [x] Follows existing code patterns
- [x] Integrated with viewport culling
- [x] Proper memory management

### Pending (Requires Game Testing)
- [ ] Improves depth perception
- [ ] Helps trajectory prediction
- [ ] No performance degradation
- [ ] No visual conflicts
- [ ] Positive playtest feedback

## Files Modified Summary

1. **client/src/types.ts** (1 line added)
   - Added shadow field to Projectile interface

2. **client/src/game/managers/ProjectileManager.ts** (4 sections modified)
   - Shadow creation in spawnProjectile()
   - Shadow update with scaling in updateProjectiles()
   - Shadow cleanup in 3 despawn locations
   - Shadow visibility culling in updateVisibility()

**Total Lines Changed**: ~30 lines of actual code (excluding comments)

## Next Steps

1. **Manual Testing**: Run game and verify visual behavior
2. **Performance Testing**: Stress test with 20+ projectiles
3. **Playtest Feedback**: Get user feedback on visual clarity
4. **Fine-tuning**: Adjust constants if needed
5. **Documentation**: Update main SPEC.md if approved

## References

- **Proposal**: `spec/proposals/b8s-cannonball-shadows/proposal.md`
- **Research**: `spec/proposals/b8s-cannonball-shadows/research.md`
- **CHANGELOG**: `spec/CHANGELOG.md` (entry added)
- **Related Proposals**:
  - p2v-projectile-velocity (3D physics foundation)
  - c5x-ship-combat (projectile system)
  - i2m-true-isometric (isometric math)
  - d7v-diamond-viewport (culling system)
