# Research: Crow's Nest Viewport Expansion (c9v)

**Proposal Code:** c9v-crowsnest-viewport
**Created:** 2025-01-09
**Builds On:** d7v-diamond-viewport

## Overview

Research for expanding the visible viewport draw distance when players climb to the crow's nest (mast top) to provide strategic visibility advantage for navigation and combat awareness.

## Current Implementation Status

### Crow's Nest Zoom - Already Implemented

The crow's nest mechanic is **partially implemented**:

**Mast Control Point:** `/Users/rj/Git/rjcorwin/seacat/client/src/types.ts` (lines 121-127)
```typescript
mast: {
  sprite: Phaser.GameObjects.Graphics;
  indicator: Phaser.GameObjects.Graphics;
  relativePosition: { x: number; y: number };  // Center of ship (0, 0)
  controlledBy: string | null;  // Local-only, for camera zoom
};
```

**Zoom Behavior:** `/Users/rj/Git/rjcorwin/seacat/client/src/game/network/ShipCommands.ts` (lines 83-93)
- Grabbing mast (E key): Zooms camera to **0.8** (from 1.5) over 500ms
- Releasing mast: Restores zoom to **1.5** over 500ms
- Client-side only (no server sync)

**Zoom Constants:** `/Users/rj/Git/rjcorwin/seacat/client/src/game/utils/Constants.ts` (lines 75-81)
```typescript
export const CAMERA = {
  NORMAL_ZOOM: 1.5,           // Default gameplay zoom
  CROWS_NEST_ZOOM: 0.8,       // Zoomed-out view when at mast
} as const;
```

### The Problem: No Draw Distance Increase

**Current behavior:**
- Camera zooms to 0.8 → things appear **smaller**
- Viewport diamond size stays **35×35 tiles** → same area visible
- **Result:** You see the same area but smaller, not more area

**Expected behavior (from TODO):**
- Climbing crow's nest should increase **draw distance**
- Strategic advantage: see farther for navigation/threats
- Nautical realism: crow's nest purpose is lookout position

## Diamond Viewport System

### Configuration

**Constants:** `/Users/rj/Git/rjcorwin/seacat/client/src/game/utils/Constants.ts` (lines 57-73)
```typescript
export const VIEWPORT = {
  DIAMOND_SIZE_TILES: 35,              // 35×35 tile square (before rotation)
  DIAMOND_BORDER_TOP_TILES: 7,         // Sky space
  DIAMOND_BORDER_BOTTOM_TILES: 1,      // Sea space
  DIAMOND_BORDER_LEFT_TILES: 3,
  DIAMOND_BORDER_RIGHT_TILES: 3,
  FADE_ZONE_TILES: 3,                  // Smooth visibility transitions
  TARGET_ASPECT_RATIO: 16 / 9,
} as const;
```

**Pixel Dimensions:**
- Width: 35 tiles × 32px = **1120 pixels**
- Height: 35 tiles × 16px = **560 pixels**
- With borders: ~1280×720 window

### Culling Implementation

**ViewportManager:** `/Users/rj/Git/rjcorwin/seacat/client/src/game/utils/ViewportManager.ts`

**Diamond dimensions calculation** (lines 20-34):
```typescript
static getDiamondDimensions(): { width: number; height: number } {
  const tiles = Constants.VIEWPORT.DIAMOND_SIZE_TILES;
  return {
    width: tiles * Constants.TILE_WIDTH,   // 35 * 32 = 1120
    height: tiles * Constants.TILE_HEIGHT, // 35 * 16 = 560
  };
}
```

**Culling logic** (lines 36-56):
```typescript
static isInDiamond(
  worldX: number,
  worldY: number,
  centerWorldX: number,
  centerWorldY: number
): boolean {
  const dx = Math.abs(worldX - centerWorldX);
  const dy = Math.abs(worldY - centerWorldY);
  const { width, height } = this.getDiamondDimensions();
  const maxDx = width / 2;
  const maxDy = height / 2;
  // Manhattan distance for diamond shape
  const normalizedDist = (dx / maxDx) + (dy / maxDy);
  return normalizedDist <= 1.0;
}
```

**Key insight:** `getDiamondDimensions()` reads from `DIAMOND_SIZE_TILES` constant - changing this value changes culling boundaries.

### Visibility Updates (Every Frame)

**GameScene.update()** (lines 429-435):
```typescript
const centerX = localPlayer.x;
const centerY = localPlayer.y;

this.mapManager.updateVisibleTiles(centerX, centerY);
this.shipManager.updateVisibility(centerX, centerY);
this.playerManager.updateVisibility(centerX, centerY);
this.projectileManager.updateVisibility(centerX, centerY);
```

**ShipManager.updateVisibility()** (lines 635-667):
```typescript
for (const [shipId, ship] of this.ships) {
  const isVisible = ViewportManager.isInDiamond(
    ship.x,
    ship.y,
    centerWorldX,
    centerWorldY
  );
  ship.sprite.setVisible(isVisible);
  // Also updates control point graphics visibility
}
```

**MapManager visibility:** Uses Chebyshev distance for fast culling + smooth fade animations.

## Control Point System

### Mast Control Point

**Position:** Ship center (0, 0 relative)
**Interaction distance:** 30 pixels
**Client-side only:** No server messages sent (unlike wheel/sails/cannons)

**Setup in ShipManager** (line 181):
```typescript
const mastRelative = { x: 0, y: 0 };
```

**Detection in ShipInputHandler** (line 67):
- Mast included in `nearControlPoints` Set when within 30 pixels
- Standard control point detection pattern

**Grab/Release Handling:** `/Users/rj/Git/rjcorwin/seacat/client/src/game/network/ShipCommands.ts`

On grab (lines 83-93):
```typescript
if (controlPoint === 'mast') {
  const ship = this.ships.get(shipId);
  if (ship) {
    ship.controlPoints.mast.controlledBy = this.playerId;
  }
  this.scene.cameras.main.zoomTo(Constants.CAMERA.CROWS_NEST_ZOOM, 500);
  console.log(`Climbed mast on ship ${shipId} - zooming out for better view`);
}
```

On release (lines 117-123):
```typescript
if (currentPoint === 'mast') {
  ship.controlPoints.mast.controlledBy = null;
  this.scene.cameras.main.zoomTo(Constants.CAMERA.NORMAL_ZOOM, 500);
  console.log(`Climbed down from mast on ship ${shipId} - zooming back to normal`);
}
```

## Player-Ship System

**Tracking:** `/Users/rj/Git/rjcorwin/seacat/client/src/game/GameScene.ts` (lines 79-81)
```typescript
private onShip: string | null = null;
private shipRelativePosition: { x: number; y: number } | null = null;
```

**Ship Boundary Detection** (lines 442-466):
- Checks if player within ship's OBB (Oriented Bounding Box)
- Updates `onShip` and calculates `shipRelativePosition`
- Used for player movement interpolation when on moving ship

## Viewport Scaling System

**Adaptive zoom:** `/Users/rj/Git/rjcorwin/seacat/client/src/game/utils/ViewportManager.ts` (lines 118-127)
```typescript
static calculateZoomToFit(gameWidth: number, gameHeight: number): number {
  const { width: diamondWidth, height: diamondHeight } = this.getDiamondDimensions();
  const targetWidth = diamondWidth + /* borders */;
  const targetHeight = diamondHeight + /* borders */;

  const scaleX = gameWidth / targetWidth;
  const scaleY = gameHeight / targetHeight;

  return Math.min(scaleX, scaleY) * 0.95; // 5% padding
}
```

**Window resize handling:** GameScene re-calculates zoom on resize events.

## Performance Considerations

### Current Culling Performance

**Map tiles:** Uses Chebyshev distance approximation (fast integer math)
**Ships/players/projectiles:** Manhattan distance for diamond check
**Updates:** Every frame (60 FPS) for all visible entities

**Estimated costs (35-tile diamond):**
- ~1225 tiles checked per frame (35×35 grid)
- ~2-10 ships visible
- ~4-20 players visible
- ~0-50 projectiles visible

### Scaling to Larger Viewport

**Option 1: 50-tile diamond** (for crow's nest)
- ~2500 tiles checked (+104%)
- More ships/players/projectiles visible
- Still well within 60 FPS budget (tested in d7v)

**Option 2: 60-tile diamond**
- ~3600 tiles checked (+194%)
- Likely still acceptable (<1ms per frame)

**Option 3: Dynamic scaling**
- Switch between 35 (normal) and 50-60 (crow's nest)
- Visibility updates already called every frame
- No additional overhead for switching

## Zoom vs Draw Distance Relationship

### Current System (Decoupled)

Camera zoom and draw distance are **independent**:
- **Zoom:** Camera scale factor (1.5 normal, 0.8 crow's nest)
- **Draw distance:** Viewport diamond size (35 tiles, always)

**Result:** Zooming out makes things smaller but doesn't show more area.

### Desired System (Coupled for Crow's Nest)

When at crow's nest:
- **Zoom:** 0.8 (already implemented)
- **Draw distance:** Increase to 50-60 tiles (needs implementation)
- **Result:** See more area AND things are smaller (strategic lookout view)

### Mathematical Analysis

**Current crow's nest view:**
- Zoom: 0.8 (87.5% smaller than 1.5)
- Area: 1120×560 pixels (same as normal)
- Effective range: 35 tiles

**Proposed crow's nest view:**
- Zoom: 0.8 (same)
- Area: 1600×800 pixels (50 tiles) or 1920×960 pixels (60 tiles)
- Effective range: 50-60 tiles (43-71% more area)

**Visual result:**
- Objects appear smaller (zoom 0.8)
- More objects visible (larger diamond)
- Strategic advantage for navigation

## Nautical Realism

### Historical Crow's Nest Purpose

**Real sailing ships:**
- Lookout position high on mast
- Extended horizon visibility (3-4× deck level)
- Early warning for land, reefs, other ships
- Navigation aid in fog/night

**Game equivalent:**
- Climb mast → zoom out + see farther
- Spot enemy ships earlier
- Navigate around map obstacles
- Coordinate multi-ship tactics

### Player Expectations

Players familiar with nautical games expect:
- **Sea of Thieves:** Crow's nest increases FOV
- **Assassin's Creed Black Flag:** Viewpoint synchronization
- **Sid Meier's Pirates!:** Scout ship for visibility

## Implementation Constraints

### Technical Constraints

1. **Performance:** Diamond culling must stay under 1ms per frame
2. **Visibility updates:** Already called every frame (no new overhead)
3. **Camera zoom:** Smooth 500ms animation (already works)
4. **Viewport scaling:** Must not break window resize logic

### Design Constraints

1. **Balance:** Crow's nest should provide advantage without being mandatory
2. **Accessibility:** Don't penalize players who don't use crow's nest
3. **Multiplayer:** All clients calculate own viewport (no server sync needed)
4. **Control point:** Mast is client-side only (can't affect server state)

### Compatibility Constraints

1. **Existing zoom system:** Must work with current camera zoom animation
2. **ViewportManager:** Should extend `getDiamondDimensions()` logic
3. **All managers:** `updateVisibility()` methods already use ViewportManager
4. **Map fade system:** Must work with larger viewport sizes

## Reference Materials

### Original Proposals

- **d7v-diamond-viewport:** `spec/proposals/d7v-diamond-viewport/`
  - Diamond culling math (Manhattan distance)
  - Performance testing (60 FPS with 35 tiles)
  - Smooth fade zones (3-tile buffer)

### Key Files

- **Constants:** `client/src/game/utils/Constants.ts`
- **ViewportManager:** `client/src/game/utils/ViewportManager.ts`
- **ShipCommands:** `client/src/game/network/ShipCommands.ts`
- **GameScene:** `client/src/game/GameScene.ts`

## Open Questions

1. **Viewport size for crow's nest:**
   - 50 tiles? (43% more area, conservative)
   - 60 tiles? (71% more area, aggressive)
   - 55 tiles? (57% more area, balanced)

2. **Zoom level adjustment:**
   - Keep 0.8? (current)
   - Zoom out more to 0.6? (even smaller objects)
   - Adjust based on viewport size?

3. **Transition behavior:**
   - Animate viewport size change? (smooth expansion)
   - Instant switch? (simpler, matches current zoom)
   - Fade-in new visible area? (fancy but complex)

4. **Camera offset:**
   - Keep current offset? (player bottom 1/3 of screen)
   - Adjust for crow's nest view? (center player more)

5. **Multiplayer visibility:**
   - Should other players see you "in crow's nest" state?
   - Add climb animation? (future enhancement)
   - Visual indicator on mast? (player sprite at top)

## Recommendations

Based on research:

1. **Start with 50-tile viewport** - Conservative increase, proven performant
2. **Keep zoom at 0.8** - Already familiar to players
3. **Instant viewport switch** - Match current zoom transition simplicity
4. **No camera offset changes** - Avoid complexity
5. **Test with 60 tiles** - If 50 feels too small, easy to increase

## Next Steps

1. Create detailed proposal with implementation options
2. Evaluate performance impact of 50 vs 60 tile viewport
3. Design viewport state management (track crow's nest state)
4. Implement dynamic viewport sizing in ViewportManager
5. Test with multiple ships and players visible
