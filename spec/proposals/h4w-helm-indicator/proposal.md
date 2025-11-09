# Proposal: Helm Wheel Rotation Indicator (h4w)

**Status**: Draft
**Created**: 2025-11-08
**Proposal Code**: h4w

## Motivation

Players controlling the ship's wheel currently have no visual feedback about wheel rotation state. They cannot see:
- How far they've turned the wheel left or right
- When the wheel is centered (neutral steering)
- Why the ship continues turning after releasing controls

This makes steering imprecise and confusing, especially for new players and gamepad users.

## Goals

1. **Visual feedback**: Show current wheel rotation angle clearly
2. **Center indication**: Make it easy to find and return to neutral position
3. **Direction indication**: Show which way the wheel is turned
4. **Immediate feedback**: Update in real-time as player turns the wheel
5. **Non-intrusive**: Don't obscure other UI elements

## Non-Goals

- Auto-centering wheel (would require gameplay changes, separate proposal)
- Wheel sprite asset (save for visual polish phase)
- HUD-based indicator (keep indicator near control point)
- Audio feedback (future enhancement)

## Design

### Overview

Add an arc-style visual indicator that appears above the wheel control point when the local player is controlling it. The indicator shows:
- Full rotation range as a gray arc
- Current rotation as a colored fill
- Center position as a white vertical line
- Current angle as a bright marker dot

### Visual Specification

**Arc Indicator Components:**

1. **Background arc** (gray, 0.3 alpha):
   - 180° arc (semicircle above control point)
   - Radius: 30px
   - Line width: 3px
   - Shows full steering range

2. **Center marker** (white, 1.0 alpha):
   - Vertical line at top center (0° position)
   - Length: 10px extending outward
   - Line width: 2px
   - Reference for neutral steering

3. **Filled arc** (color-coded, 0.9 alpha):
   - Arc from center to current wheel angle
   - Green if centered (within ±5°)
   - Cyan if turned left (negative angle)
   - Magenta if turned right (positive angle)
   - Line width: 4px (thicker than background)

4. **Position marker** (bright dot):
   - Circle at current angle on arc
   - Radius: 4px
   - Matches filled arc color
   - Shows exact current position

**Rendering conditions:**
- Only visible when local player is controlling wheel
- Hidden when not controlling
- Positioned above wheel control point
- Rotates with ship (uses isometric rotation)
- Depth: 520 (above cannons at 500)

### Data Flow

**Server → Client:**

The server already broadcasts `wheelAngle` in position updates (`ShipParticipant.ts:330`), but the client doesn't receive it.

**Changes needed:**

1. Add `wheelAngle` to client's `ShipData` interface:
```typescript
export interface ShipData {
  rotation: number;
  rotationDelta?: number;
  speedLevel: number;
  wheelAngle?: number; // NEW: Current wheel rotation (-PI to PI, 0 = centered)
  // ... rest of fields
}
```

2. Add `wheelAngle` and `wheelIndicator` to client's `Ship` interface:
```typescript
export interface Ship {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  // ... existing fields ...
  wheelAngle: number; // NEW: Track current wheel angle
  wheelIndicator?: Phaser.GameObjects.Graphics; // NEW: Indicator graphics
}
```

3. Update `ShipManager.updateShip()` to:
   - Create `wheelIndicator` graphics on ship creation
   - Update `ship.wheelAngle` from `update.shipData.wheelAngle`

4. Update `ShipManager.interpolateShips()` to:
   - Call `shipRenderer.drawWheelIndicator()` when player is controlling wheel

### Implementation

**New ShipRenderer method:**

```typescript
/**
 * Draw wheel rotation indicator above wheel control point
 * Shows arc with current rotation and center marker
 * Only visible when player is controlling wheel
 */
drawWheelIndicator(
  graphics: Phaser.GameObjects.Graphics,
  wheelControlPoint: ControlPoint,
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
  const indicatorY = worldY - 35; // 35px above wheel
  const radius = 30;

  // 1. Draw background arc (full range)
  graphics.lineStyle(3, 0x888888, 0.3);
  graphics.beginPath();
  graphics.arc(
    worldX,
    indicatorY,
    radius,
    -Math.PI,      // Start at left (-180°)
    0,             // End at right (0° = pointing down in Phaser)
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
  // Screen arc: -π (left), -π/2 (top), 0 (right)
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

**ShipManager integration:**

1. **Ship creation** (`updateShip()` when `!ship`):
```typescript
// Create wheel indicator graphics
const wheelIndicator = this.scene.add.graphics();
wheelIndicator.setDepth(520); // Above cannons (500)

ship = {
  // ... existing fields ...
  wheelAngle: update.shipData.wheelAngle || 0,
  wheelIndicator: wheelIndicator,
};
```

2. **Ship update** (`updateShip()` existing ship):
```typescript
// Update wheel angle from server
ship.wheelAngle = update.shipData.wheelAngle || ship.wheelAngle || 0;
```

3. **Rendering** (`interpolateShips()`):
```typescript
// Draw wheel indicator if controlling wheel
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

4. **Visibility culling** (`updateVisibility()`):
```typescript
// Add to existing visibility updates
if (ship.wheelIndicator) {
  ship.wheelIndicator.setVisible(isVisible);
}
```

## Testing Plan

1. **Basic display**:
   - Grab ship wheel
   - Verify arc indicator appears above wheel
   - Verify indicator rotates with ship

2. **Rotation feedback**:
   - Turn wheel left → cyan arc grows left, marker moves left
   - Turn wheel right → magenta arc grows right, marker moves right
   - Center wheel → arc turns green

3. **Edge cases**:
   - Turn wheel to maximum left (-180°)
   - Turn wheel to maximum right (+180°)
   - Release wheel → indicator disappears

4. **Multi-ship**:
   - Control wheel on ship1 → indicator shows
   - Switch to ship2 wheel → indicator moves to ship2
   - Release → indicator disappears

5. **Visual integration**:
   - Verify doesn't obscure cannons
   - Verify doesn't obscure grabable indicators
   - Verify visible against water background

## Success Metrics

- Players can immediately see wheel rotation angle
- Players can easily return wheel to center
- Steering precision improves (less oscillation)
- New players understand locked-wheel mechanics

## Future Enhancements

1. **Wheel sprite**: Replace arc with rotating wheel graphic
2. **Audio feedback**: Subtle click when wheel centers
3. **Animation**: Pulse/glow when perfectly centered
4. **Gamepad vibration**: Haptic feedback at wheel limits
5. **Auto-center option**: Game mode where wheel returns to center

## References

- **w3l-wheel-steering**: Original wheel steering implementation
- **g4p-gamepad-support**: Gamepad controls
- **b8s-cannonball-shadows**: Similar visual indicator implementation
- **i2m-true-isometric**: Rotation mathematics
