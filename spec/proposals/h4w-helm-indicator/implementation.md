# Implementation: Helm Wheel Rotation Indicator (h4w)

**Status**: Draft
**Created**: 2025-11-08

## Implementation Steps

This document provides step-by-step instructions for implementing the helm wheel rotation indicator.

## Step 1: Update Client Type Definitions

**File**: `client/src/types.ts`

**Changes:**

1. Add `wheelAngle` to `ShipData` interface (line ~79, after `sinking`):
```typescript
export interface ShipData {
  rotation: number;
  rotationDelta?: number;
  speedLevel: number;
  deckBoundary: {
    width: number;
    height: number;
  };
  controlPoints: {
    wheel: {
      worldPosition: { x: number; y: number };
      controlledBy: string | null;
    };
    sails: {
      worldPosition: { x: number; y: number };
      controlledBy: string | null;
    };
  };
  cannons?: {
    // ... cannon data ...
  };
  health?: number;
  maxHealth?: number;
  sinking?: boolean;
  wheelAngle?: number; // NEW: Current wheel rotation (-PI to PI, 0 = centered)
}
```

2. Add `wheelAngle` and `wheelIndicator` to `Ship` interface (line ~120, after `sinking`/`sinkStartTime`):
```typescript
export interface Ship {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  boundaryGraphics: Phaser.GameObjects.Graphics;
  targetPosition: { x: number; y: number };
  rotation: number;
  lastUpdate: number;
  velocity: { x: number; y: number };
  controlPoints: {
    wheel: ControlPoint;
    sails: ControlPoint;
    mast: ControlPoint;
  };
  cannons?: {
    port: CannonControlPoint[];
    starboard: CannonControlPoint[];
  };
  speedLevel: number;
  deckBoundary: {
    width: number;
    height: number;
  };
  lastWaveOffset: number;
  health: number;
  maxHealth: number;
  sinking: boolean;
  sinkStartTime: number;
  wheelAngle: number; // NEW: Current wheel rotation
  wheelIndicator?: Phaser.GameObjects.Graphics; // NEW: Indicator graphics object
}
```

## Step 2: Add Wheel Indicator Renderer

**File**: `client/src/game/rendering/ShipRenderer.ts`

**Location**: After `drawGrabableIndicator()` method (around line 330)

**New method:**

```typescript
/**
 * Draw wheel rotation indicator above wheel control point (h4w-helm-indicator)
 * Shows arc with current rotation, center marker, and position dot
 * Only visible when local player is controlling wheel
 * @param graphics Graphics object to draw on
 * @param wheelControlPoint Wheel control point data
 * @param shipSprite Ship sprite
 * @param shipRotation Ship rotation in radians
 * @param wheelAngle Current wheel angle in radians (-PI to PI, 0 = centered)
 * @param isControlledByUs Whether local player is controlling wheel
 */
drawWheelIndicator(
  graphics: Phaser.GameObjects.Graphics,
  wheelControlPoint: { relativePosition: { x: number; y: number } },
  shipSprite: Phaser.GameObjects.Sprite,
  shipRotation: number,
  wheelAngle: number,
  isControlledByUs: boolean
): void {
  graphics.clear();

  // Only draw if we're controlling the wheel
  if (!isControlledByUs) {
    return;
  }

  // Calculate wheel world position with rotation
  const rotatedPos = IsoMath.rotatePointIsometric(
    wheelControlPoint.relativePosition,
    shipRotation
  );
  const worldX = shipSprite.x + rotatedPos.x;
  const worldY = shipSprite.y + rotatedPos.y;

  // Position indicator above control point
  const INDICATOR_OFFSET = 35; // pixels above wheel
  const indicatorY = worldY - INDICATOR_OFFSET;
  const radius = 30;

  // 1. Draw background arc (full range: left to right, semicircle)
  graphics.lineStyle(3, 0x888888, 0.3);
  graphics.beginPath();
  graphics.arc(
    worldX,
    indicatorY,
    radius,
    -Math.PI,      // Start at left (-180°)
    0,             // End at right (0° = pointing down in Phaser coordinates)
    false
  );
  graphics.strokePath();

  // 2. Draw center marker (vertical line at top)
  graphics.lineStyle(2, 0xffffff, 1.0);
  graphics.beginPath();
  graphics.moveTo(worldX, indicatorY - radius);
  graphics.lineTo(worldX, indicatorY - radius - 10);
  graphics.strokePath();

  // 3. Draw filled arc from center to current angle
  const CENTERED_THRESHOLD = Math.PI / 36; // ±5°
  let color: number;
  if (Math.abs(wheelAngle) < CENTERED_THRESHOLD) {
    color = 0x00ff00; // Green (centered)
  } else if (wheelAngle < 0) {
    color = 0x00ffff; // Cyan (left)
  } else {
    color = 0xff00ff; // Magenta (right)
  }

  // Convert wheel angle (-π to π) to screen arc angle
  // Wheel: -π (full left), 0 (center), +π (full right)
  // Screen arc: -π (left), -π/2 (top/center), 0 (right)
  // Formula: screenAngle = -π/2 + (wheelAngle / π) * (π / 2)
  const arcAngle = -Math.PI / 2 + (wheelAngle / Math.PI) * (Math.PI / 2);

  graphics.lineStyle(4, color, 0.9);
  graphics.beginPath();
  graphics.arc(
    worldX,
    indicatorY,
    radius,
    -Math.PI / 2,  // Start at top (center position)
    arcAngle,      // End at current wheel angle
    wheelAngle < 0 // Anticlockwise if turning left
  );
  graphics.strokePath();

  // 4. Draw position marker (dot at current angle)
  const markerX = worldX + Math.cos(arcAngle) * radius;
  const markerY = indicatorY + Math.sin(arcAngle) * radius;
  graphics.fillStyle(color, 1.0);
  graphics.fillCircle(markerX, markerY, 4);
}
```

## Step 3: Create Wheel Indicator in ShipManager

**File**: `client/src/game/managers/ShipManager.ts`

**Location 1**: Ship creation (line ~214, after creating mast graphics)

**Add:**
```typescript
// Create wheel rotation indicator (h4w-helm-indicator)
const wheelIndicator = this.scene.add.graphics();
wheelIndicator.setDepth(520); // Above cannons (500), below nothing
```

**Location 2**: Ship object initialization (line ~260, add to ship object before closing brace)

**Add:**
```typescript
// h4w-helm-indicator: Initialize wheel angle and indicator
wheelAngle: update.shipData.wheelAngle || 0,
wheelIndicator: wheelIndicator,
```

## Step 4: Update Wheel Angle from Server

**File**: `client/src/game/managers/ShipManager.ts`

**Location**: Ship update block (line ~300, after health/maxHealth sync)

**Add:**
```typescript
// h4w-helm-indicator: Sync wheel angle from server
ship.wheelAngle = update.shipData.wheelAngle !== undefined ?
  update.shipData.wheelAngle : ship.wheelAngle;
```

## Step 5: Render Wheel Indicator

**File**: `client/src/game/managers/ShipManager.ts`

**Location**: `interpolateShips()` method, after drawing control points (line ~500, after mast indicator)

**Add:**
```typescript
// h4w-helm-indicator: Draw wheel rotation indicator if controlling wheel
const isControllingWheel = this.getControllingShip() === ship.id &&
                           this.getControllingPoint() === 'wheel';
if (ship.wheelIndicator) {
  this.shipRenderer.drawWheelIndicator(
    ship.wheelIndicator,
    ship.controlPoints.wheel,
    ship.sprite,
    ship.rotation,
    ship.wheelAngle,
    isControllingWheel
  );
}
```

**Note**: Also add the same code in `updateShip()` for immediate rendering (around line 390, after mast indicator).

## Step 6: Add Wheel Indicator to Visibility Culling

**File**: `client/src/game/managers/ShipManager.ts`

**Location**: `updateVisibility()` method (line ~596, after cannon visibility)

**Add:**
```typescript
// Update wheel indicator visibility (h4w-helm-indicator)
if (ship.wheelIndicator) {
  ship.wheelIndicator.setVisible(isVisible);
}
```

## Step 7: Rebuild and Test

1. **Rebuild client:**
```bash
cd client
npm run build
```

2. **Start server** (if not running):
```bash
cd server
npm start
```

3. **Start client:**
```bash
cd client
npm start
```

4. **Test:**
   - Walk to ship wheel
   - Press E to grab wheel
   - Verify arc indicator appears above wheel
   - Press left arrow → verify cyan arc fills left, marker moves left
   - Press right arrow → verify magenta arc fills right, marker moves right
   - Center wheel → verify arc turns green
   - Release wheel (press E) → verify indicator disappears

## Verification Checklist

- [ ] `wheelAngle` added to `ShipData` interface
- [ ] `wheelAngle` and `wheelIndicator` added to `Ship` interface
- [ ] `drawWheelIndicator()` method added to `ShipRenderer`
- [ ] Wheel indicator graphics created in ship initialization
- [ ] Wheel angle synced from server in `updateShip()`
- [ ] Wheel indicator rendered in `updateShip()` and `interpolateShips()`
- [ ] Wheel indicator added to visibility culling
- [ ] Client builds without errors
- [ ] Indicator appears when controlling wheel
- [ ] Indicator shows correct rotation angle
- [ ] Indicator disappears when releasing wheel
- [ ] Indicator rotates with ship
- [ ] Colors correct (cyan left, magenta right, green centered)

## Known Issues / Edge Cases

1. **Server not sending wheelAngle**: Verify server is broadcasting it (already implemented in `ShipParticipant.ts:330`)
2. **Arc direction reversed**: If left/right appear backwards, negate `wheelAngle` in arc calculation
3. **Indicator obscured**: If hard to see, increase `INDICATOR_OFFSET` or adjust depth
4. **Performance**: Graphics objects are cheap, but if lag occurs, consider pooling

## Future Improvements

1. Add smooth interpolation for wheel angle updates
2. Add subtle pulse animation when centered
3. Add numeric degrees display for precision
4. Add audio cue when crossing center
5. Add gamepad vibration at wheel limits
