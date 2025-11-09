# Proposal: Crow's Nest Viewport Expansion (c9v)

**Status:** Draft
**Created:** 2025-01-09
**Code:** c9v-crowsnest-viewport
**Builds On:** d7v-diamond-viewport

## Motivation

The crow's nest (mast top) control point currently zooms the camera to 0.8 when grabbed, but the viewport diamond size stays fixed at 35×35 tiles. This means objects appear smaller but the player doesn't actually see more of the world - defeating the strategic purpose of a crow's nest lookout position.

### User Experience Impact

**Current state:**
- Player climbs mast (press E at ship center)
- Camera zooms out to 0.8 over 500ms
- Same area visible, just smaller
- No strategic advantage

**Desired state:**
- Player climbs mast
- Camera zooms out AND draw distance increases
- More area visible for navigation/threats
- Strategic lookout advantage (nautical realism)

### From TODO List

```
- [ ] mast zoom out (crows nest) should increase the draw distance of the viewable world
```

This enhancement is needed for MVP playtest to provide meaningful crow's nest gameplay.

## Goals

### Primary Goals

1. **Increase draw distance** when player controls mast (crow's nest)
2. **Restore normal draw distance** when player releases mast
3. **Maintain 60 FPS performance** with larger viewport
4. **Smooth transition** between viewport sizes

### Secondary Goals

5. Provide strategic visibility advantage for navigation
6. Match nautical expectations (crow's nest = extended view)
7. No impact on players who don't use crow's nest
8. Client-side only (no server sync required)

### Non-Goals

- Animate viewport expansion (instant switch is fine)
- Add climb animation to mast
- Visual indicator of player position on mast
- Change camera offset or zoom level
- Modify server ship state

## Design

### Overview

Extend the existing viewport system to support **two diamond sizes**:
1. **Normal viewport:** 35×35 tiles (current, for deck-level view)
2. **Crow's nest viewport:** 50-60 tiles (new, for mast-top view)

When player grabs mast control point, switch viewport size along with the existing camera zoom. When released, restore normal size.

### Implementation Options

## Option 1: Static Crow's Nest Constant (Recommended)

**Approach:** Add `DIAMOND_SIZE_CROWS_NEST` constant, switch between normal/crow's nest size based on mast control.

**Changes required:**

1. **Add constant** (`Constants.ts`):
```typescript
export const VIEWPORT = {
  DIAMOND_SIZE_TILES: 35,              // Normal deck-level view
  DIAMOND_SIZE_CROWS_NEST: 55,         // Crow's nest lookout view
  DIAMOND_BORDER_TOP_TILES: 7,
  // ... rest unchanged
} as const;
```

2. **Add viewport state** (`GameScene.ts`):
```typescript
private isInCrowsNest: boolean = false;  // Track crow's nest state

setInCrowsNest(inCrowsNest: boolean): void {
  this.isInCrowsNest = inCrowsNest;
  ViewportManager.setViewportSize(inCrowsNest ? 'crowsnest' : 'normal');
}
```

3. **Add size switching** (`ViewportManager.ts`):
```typescript
private static currentSize: 'normal' | 'crowsnest' = 'normal';

static setViewportSize(size: 'normal' | 'crowsnest'): void {
  this.currentSize = size;
}

static getDiamondDimensions(): { width: number; height: number } {
  const tiles = this.currentSize === 'crowsnest'
    ? Constants.VIEWPORT.DIAMOND_SIZE_CROWS_NEST
    : Constants.VIEWPORT.DIAMOND_SIZE_TILES;

  return {
    width: tiles * Constants.TILE_WIDTH,
    height: tiles * Constants.TILE_HEIGHT,
  };
}
```

4. **Update grab/release** (`ShipCommands.ts`):
```typescript
// On mast grab:
if (controlPoint === 'mast') {
  ship.controlPoints.mast.controlledBy = this.playerId;
  this.scene.cameras.main.zoomTo(Constants.CAMERA.CROWS_NEST_ZOOM, 500);
  this.scene.setInCrowsNest(true);  // NEW
}

// On mast release:
if (currentPoint === 'mast') {
  ship.controlPoints.mast.controlledBy = null;
  this.scene.cameras.main.zoomTo(Constants.CAMERA.NORMAL_ZOOM, 500);
  this.scene.setInCrowsNest(false);  // NEW
}
```

**Pros:**
- Simple and clean
- Matches existing zoom pattern
- Easy to test and debug
- No performance overhead (static constant switch)
- Existing visibility updates automatically work

**Cons:**
- Viewport switches instantly (zoom animates but viewport size doesn't)
- Hardcoded size (no smooth scaling)

**Performance:** No impact - same diamond culling math, just larger constant.

---

## Option 2: Dynamic Viewport Scaling

**Approach:** Calculate viewport size as function of camera zoom, so viewport automatically expands when zooming out.

**Changes required:**

1. **Add scaling function** (`ViewportManager.ts`):
```typescript
static getDiamondDimensions(): { width: number; height: number } {
  const zoom = Phaser.Cameras.Scene2D.Camera.main.zoom;  // Get current zoom
  const baseTiles = Constants.VIEWPORT.DIAMOND_SIZE_TILES;

  // Scale inversely with zoom: zoom 1.0 = 35 tiles, zoom 0.8 = 44 tiles, zoom 0.5 = 70 tiles
  const scaledTiles = Math.round(baseTiles / zoom);

  return {
    width: scaledTiles * Constants.TILE_WIDTH,
    height: scaledTiles * Constants.TILE_HEIGHT,
  };
}
```

2. **No ShipCommands changes needed** - viewport scales automatically with zoom animation.

**Pros:**
- Viewport animates smoothly with zoom (500ms)
- Automatic scaling for any zoom level
- Future-proof for zoom features

**Cons:**
- More complex (couples zoom and viewport)
- Harder to tune specific crow's nest size
- Potential performance cost (reading camera zoom every frame)
- May scale unexpectedly with other zoom features

**Performance:** Negligible (<0.01ms to read zoom value).

---

## Option 3: Hybrid - Tiered Viewport Sizes

**Approach:** Define multiple viewport tiers (small, normal, large), switch based on zoom thresholds.

**Changes required:**

1. **Add tiered constants** (`Constants.ts`):
```typescript
export const VIEWPORT = {
  DIAMOND_SIZE_CLOSE: 25,        // Zoom 2.0+ (close-up)
  DIAMOND_SIZE_NORMAL: 35,       // Zoom 1.0-2.0 (deck view)
  DIAMOND_SIZE_FAR: 55,          // Zoom <1.0 (crow's nest)
  // ... rest
} as const;
```

2. **Add tier selection** (`ViewportManager.ts`):
```typescript
static getDiamondDimensions(): { width: number; height: number } {
  const zoom = Phaser.Cameras.Scene2D.Camera.main.zoom;

  let tiles: number;
  if (zoom >= 2.0) {
    tiles = Constants.VIEWPORT.DIAMOND_SIZE_CLOSE;
  } else if (zoom >= 1.0) {
    tiles = Constants.VIEWPORT.DIAMOND_SIZE_NORMAL;
  } else {
    tiles = Constants.VIEWPORT.DIAMOND_SIZE_FAR;
  }

  return { width: tiles * Constants.TILE_WIDTH, height: tiles * Constants.TILE_HEIGHT };
}
```

**Pros:**
- Automatic tier switching
- Can add more tiers later (combat zoom, etc.)
- No explicit crow's nest state tracking

**Cons:**
- Over-engineered for single crow's nest feature
- Threshold values arbitrary
- Viewport snaps at tier boundaries

**Performance:** Same as Option 2 (negligible).

---

## Comparison Matrix

| Criterion | Option 1: Static Constant | Option 2: Dynamic Scaling | Option 3: Tiered Sizes |
|-----------|--------------------------|---------------------------|------------------------|
| **Simplicity** | ✅ Very simple | ⚠️ Moderate | ⚠️ Moderate |
| **Explicit control** | ✅ Exact size control | ❌ Coupled to zoom | ⚠️ Threshold-based |
| **Smooth transition** | ❌ Instant switch | ✅ Animates with zoom | ❌ Snaps at tiers |
| **Performance** | ✅ Zero overhead | ✅ Negligible | ✅ Negligible |
| **Future-proof** | ⚠️ Single use case | ✅ Works with any zoom | ✅ Extensible |
| **Debugging** | ✅ Easy to trace | ⚠️ Requires zoom inspection | ⚠️ Threshold logic |
| **Code clarity** | ✅ Explicit intent | ⚠️ Implicit coupling | ⚠️ Magic numbers |
| **Implementation time** | ✅ 15-20 minutes | ⚠️ 30 minutes | ⚠️ 30 minutes |

## Recommendation: Option 1 (Static Constant)

**Reasoning:**

1. **Matches existing pattern** - zoom already uses static constants (NORMAL_ZOOM, CROWS_NEST_ZOOM)
2. **Explicit and predictable** - exact control over crow's nest viewport size
3. **Simple to implement** - minimal code changes
4. **Easy to test** - binary state (normal vs crow's nest)
5. **No coupling** - viewport size independent of zoom implementation

**Specific size recommendation:** 55 tiles

**Rationale:**
- 35 tiles (normal) → 55 tiles (crow's nest) = **57% more area**
- 55 × 32px = 1760px width (reasonable for 1920×1080 displays)
- 55 × 16px = 880px height (fits 16:9 aspect ratio)
- Conservative enough for 60 FPS guarantee
- Meaningful strategic advantage without being overwhelming

**Tested alternative:** If 55 feels too small, increase to 60 tiles (71% more area).

## Implementation Plan

### Phase 1: Add Constant and State

1. **Add crow's nest constant** (`client/src/game/utils/Constants.ts`):
```typescript
export const VIEWPORT = {
  DIAMOND_SIZE_TILES: 35,
  DIAMOND_SIZE_CROWS_NEST: 55,  // NEW
  // ... rest unchanged
} as const;
```

2. **Add viewport state** (`client/src/game/GameScene.ts`):
```typescript
private isInCrowsNest: boolean = false;

public setInCrowsNest(inCrowsNest: boolean): void {
  this.isInCrowsNest = inCrowsNest;
  ViewportManager.setViewportSize(inCrowsNest ? 'crowsnest' : 'normal');
}

public getIsInCrowsNest(): boolean {
  return this.isInCrowsNest;
}
```

**Time estimate:** 2 minutes

### Phase 2: Update ViewportManager

1. **Add size state** (`client/src/game/utils/ViewportManager.ts`):
```typescript
private static currentSize: 'normal' | 'crowsnest' = 'normal';

public static setViewportSize(size: 'normal' | 'crowsnest'): void {
  this.currentSize = size;
}

public static getCurrentSize(): 'normal' | 'crowsnest' {
  return this.currentSize;
}
```

2. **Update getDiamondDimensions()** (replace lines 20-34):
```typescript
static getDiamondDimensions(): { width: number; height: number } {
  const tiles = this.currentSize === 'crowsnest'
    ? Constants.VIEWPORT.DIAMOND_SIZE_CROWS_NEST
    : Constants.VIEWPORT.DIAMOND_SIZE_TILES;

  return {
    width: tiles * Constants.TILE_WIDTH,
    height: tiles * Constants.TILE_HEIGHT,
  };
}
```

**Time estimate:** 3 minutes

### Phase 3: Wire Up Mast Control

1. **Update mast grab** (`client/src/game/network/ShipCommands.ts`, line ~90):
```typescript
if (controlPoint === 'mast') {
  const ship = this.ships.get(shipId);
  if (ship) {
    ship.controlPoints.mast.controlledBy = this.playerId;
  }
  this.scene.cameras.main.zoomTo(Constants.CAMERA.CROWS_NEST_ZOOM, 500);
  this.scene.setInCrowsNest(true);  // NEW
  console.log(`Climbed mast on ship ${shipId} - zooming out and expanding viewport`);
}
```

2. **Update mast release** (`client/src/game/network/ShipCommands.ts`, line ~120):
```typescript
if (currentPoint === 'mast') {
  ship.controlPoints.mast.controlledBy = null;
  this.scene.cameras.main.zoomTo(Constants.CAMERA.NORMAL_ZOOM, 500);
  this.scene.setInCrowsNest(false);  // NEW
  console.log(`Climbed down from mast on ship ${shipId} - restoring normal viewport`);
}
```

**Time estimate:** 2 minutes

### Phase 4: Test In-Game

1. Build client: `cd client && npm run build`
2. Start server: `cd server && npm start`
3. Start client: `cd client && npm start`
4. Test:
   - Spawn on ship
   - Walk to mast (center of ship)
   - Press E to grab mast
   - **Verify:** Camera zooms out AND more area visible (ships/tiles farther away appear)
   - Press E again to release
   - **Verify:** Camera zooms in AND viewport shrinks back to normal
   - Test with multiple ships in view
   - Test with map boundaries visible

**Time estimate:** 10 minutes

### Phase 5: Performance Testing

1. Spawn multiple ships (~5-10) near each other
2. Spawn multiple players (~10-15)
3. Fire cannons to create projectiles (~20-30)
4. Climb mast and verify:
   - FPS stays at 60
   - No stuttering during viewport expansion
   - All entities visible within new diamond
5. Check Chrome DevTools performance profile

**Time estimate:** 5 minutes

### Phase 6: Documentation

1. Update CHANGELOG.md with implementation status
2. Add comments to ViewportManager explaining size switching
3. Document crow's nest viewport size in research.md (if different from 55)

**Time estimate:** 3 minutes

**Total estimated time:** 25 minutes

## Testing

### Functional Tests

- [ ] Grabbing mast increases viewport size to 55 tiles
- [ ] Releasing mast restores viewport to 35 tiles
- [ ] Viewport switching is instant (no lag)
- [ ] Ships farther than 35 tiles become visible when at crow's nest
- [ ] Ships beyond 55 tiles remain culled
- [ ] Map tiles beyond normal range become visible
- [ ] Projectiles beyond normal range become visible

### Performance Tests

- [ ] FPS stays at 60 with crow's nest viewport
- [ ] No frame drops during mast grab/release
- [ ] Diamond culling completes <1ms per frame (55 tiles)
- [ ] Memory usage unchanged (no leaks from visibility updates)

### Edge Cases

- [ ] Grabbing mast on moving ship
- [ ] Releasing mast while ship rotates
- [ ] Multiple players on same ship (different crow's nest states)
- [ ] Window resize while at crow's nest
- [ ] Zoom adjustment while viewport expanded

### Cross-Platform Tests

- [ ] Works on macOS (development machine)
- [ ] Works on Steam Deck (Linux)
- [ ] No rendering differences between platforms

## Impact Assessment

### Performance Impact

**Viewport size increase:**
- 35×35 = 1,225 tiles (current)
- 55×55 = 3,025 tiles (crow's nest)
- **+147% tile checks**

**Culling performance:**
- Current: ~0.3ms per frame (35 tiles, tested in d7v)
- Expected: ~0.7ms per frame (55 tiles, extrapolated)
- **Still well under 1ms budget** (16.67ms frame time at 60 FPS)

**Entities visible:**
- Ships: +2-5 more ships visible
- Players: +5-10 more players visible
- Projectiles: +10-20 more projectiles visible
- **All within tested limits** (d7v tested 20+ ships)

**Conclusion:** Negligible performance impact, well within 60 FPS budget.

### User Experience Impact

**Positive:**
- Strategic advantage for crow's nest users
- Meaningful gameplay mechanic (navigation/scouting)
- Matches nautical expectations
- Optional (doesn't penalize non-users)

**Neutral:**
- Instant viewport switch (could animate in future)
- No visual feedback for viewport size (acceptable)

**Negative:**
- None identified

### Code Complexity Impact

**Low complexity:**
- 3 files modified
- ~20 lines of code added
- No new dependencies
- Extends existing systems cleanly

### Maintenance Impact

**Low maintenance:**
- Uses existing ViewportManager infrastructure
- No new frame-by-frame calculations
- Simple binary state (normal vs crow's nest)
- Easy to adjust size constant if needed

## Alternatives Considered

### Alternative 1: Animate Viewport Expansion

**Approach:** Smoothly interpolate viewport size from 35 → 55 tiles over 500ms (matching zoom animation).

**Pros:**
- Smooth visual transition
- Matches zoom animation timing
- Feels polished

**Cons:**
- Requires frame-by-frame interpolation
- Visibility updates 30× during animation (extra work)
- More complex state management
- Potential for visual artifacts (entities popping in/out mid-animation)

**Decision:** Rejected. Instant switch is simpler and avoids animation complexity. Zoom animation provides sufficient visual feedback.

---

### Alternative 2: Adjust Camera Offset

**Approach:** When at crow's nest, center camera on player instead of positioning player at bottom 1/3.

**Pros:**
- More symmetric view around player
- Could show more area ahead of ship

**Cons:**
- Disrupts established camera feel
- Complicates camera logic
- May feel disorienting during transition
- Not related to draw distance (separate feature)

**Decision:** Rejected. Camera offset is tuned for sky visibility - changing it is out of scope.

---

### Alternative 3: Ellipse Instead of Diamond

**Approach:** Use ellipse/circle viewport shape instead of diamond when at crow's nest.

**Pros:**
- More "realistic" field of view
- Could provide even more area in diagonals

**Cons:**
- Breaks diamond viewport system (d7v)
- Different culling math (slower sqrt operations)
- Inconsistent shape transitions
- Over-engineered

**Decision:** Rejected. Diamond shape is optimized and familiar - stick with it.

---

### Alternative 4: Server-Synced Crow's Nest State

**Approach:** Send mast control to server like wheel/sails/cannons, sync crow's nest state across all clients.

**Pros:**
- Other players could see who's in crow's nest
- Could add visual indicator (player sprite at mast top)
- More "realistic" multiplayer

**Cons:**
- Viewport is client-side rendering concern (no server authority needed)
- Increases network traffic for cosmetic feature
- Complicates mast control (currently simple client-side)
- Out of scope for draw distance feature

**Decision:** Rejected. Keep mast control client-side only - viewport is local rendering concern.

## Open Questions

1. **Viewport size:**
   - Start with 55 tiles or test 60 tiles first?
   - **Recommendation:** Start with 55, easy to increase if needed

2. **Zoom level:**
   - Keep 0.8 or zoom out further to 0.6?
   - **Recommendation:** Keep 0.8 (already tested and familiar)

3. **Future enhancements:**
   - Add animated viewport expansion later?
   - Add visual indicator of crow's nest state?
   - **Recommendation:** Ship minimal version first, iterate based on playtesting

4. **Other control points:**
   - Should wheel/sails also affect viewport?
   - **Recommendation:** No - crow's nest is unique lookout position

## Success Criteria

1. ✅ Grabbing mast increases viewport to 55+ tiles
2. ✅ Releasing mast restores viewport to 35 tiles
3. ✅ 60 FPS maintained with expanded viewport
4. ✅ Ships/tiles/projectiles beyond 35 tiles become visible at crow's nest
5. ✅ Instant viewport switching (no animation lag)
6. ✅ No visual artifacts or entity pop-in/pop-out
7. ✅ Playtesters report strategic advantage from crow's nest

## Timeline

- **Phase 1 (Constant/State):** 2 minutes
- **Phase 2 (ViewportManager):** 3 minutes
- **Phase 3 (Mast Control):** 2 minutes
- **Phase 4 (In-Game Test):** 10 minutes
- **Phase 5 (Performance):** 5 minutes
- **Phase 6 (Documentation):** 3 minutes

**Total estimated time:** 25 minutes

## References

- **Original viewport proposal:** `spec/proposals/d7v-diamond-viewport/`
- **Mast control:** `client/src/game/network/ShipCommands.ts` (lines 83-93, 117-123)
- **ViewportManager:** `client/src/game/utils/ViewportManager.ts`
- **Constants:** `client/src/game/utils/Constants.ts` (lines 57-81)

## Approval

This proposal follows the spec-driven workflow outlined in `CONTRIBUTING.md`. Implementation can proceed upon approval.
