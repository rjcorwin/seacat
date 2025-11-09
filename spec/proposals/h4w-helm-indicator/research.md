# Research: Helm Wheel Rotation Indicator (h4w)

**Created**: 2025-11-08
**Status**: Draft

## Background

Seacat features ship steering controlled via a ship's wheel (helm). Players can grab the wheel control point and turn left/right using arrow keys or gamepad. The server tracks wheel rotation state as `wheelAngle` from -π to +π (-180° to +180°), with 0 being the centered (neutral) position.

Currently, players have no visual feedback about:
1. How far they've turned the wheel
2. Which direction the wheel is turned (left vs right)
3. When the wheel is centered (neutral steering)

## Current Implementation

### Server-Side Wheel State
**Location**: `server/mcp-servers/ShipServer.ts:115, 230-262`

The ship server tracks three wheel-related values:
```typescript
wheelAngle: number;              // Current wheel angle in radians (-PI to PI, 0 = centered)
turnRate: number;                // Current rotation rate in radians/second
wheelTurningDirection: 'left' | 'right' | null; // Active player input direction
```

**Wheel mechanics:**
- Turn rate: 90°/sec (π/2 radians per second)
- Range: -180° to +180° (-π to π radians)
- Center: 0° (0 radians)
- Rudder efficiency: 10% (turn rate = wheelAngle * 0.1)

When player holds left/right arrow:
1. `wheelTurningDirection` is set to 'left' or 'right'
2. `wheelAngle` increases/decreases at 90°/sec
3. `wheelAngle` is clamped to [-π, π]
4. `turnRate` is calculated as `wheelAngle * 0.1`
5. Ship rotation changes based on `turnRate`

### Server Broadcast
**Location**: `server/mcp-servers/ShipParticipant.ts:330`

The server broadcasts `wheelAngle` in position updates:
```typescript
wheelAngle: state.wheelAngle,
```

### Client Reception
**Problem**: The client's `ShipData` interface (`client/src/types.ts:40-79`) does NOT include `wheelAngle`. The server is sending it, but the client isn't receiving or using it.

Current `ShipData` fields:
- rotation
- rotationDelta
- speedLevel
- deckBoundary
- controlPoints
- cannons
- health/maxHealth/sinking

**Missing**: `wheelAngle`

### Wheel Control UI
**Location**: `client/src/game/input/ShipInputHandler.ts:491-511`

When controlling the wheel:
- Left/right arrows or gamepad left stick horizontal axis
- Sends `wheelTurnStart('left'/'right')` when input begins
- Sends `wheelTurnStop()` when input ends
- Wheel "locks" at current angle when input stops (doesn't auto-center)

## User Experience Problem

**Lack of Steering Feedback**:
Players controlling the wheel cannot:
1. See how far left/right they've turned
2. Know when the wheel is centered (neutral steering)
3. Understand why the ship continues turning after releasing controls (locked wheel)
4. Judge how much correction is needed to straighten out

**Impact on Gameplay**:
- Steering feels imprecise and unpredictable
- Players oversteer and oscillate
- Hard to maintain a steady course
- Confusing for new players (why does ship keep turning?)
- No feedback for gamepad players (who may not see keyboard held down)

## UI Indicator Approaches

### Approach 1: Text Display (Simple)
**Implementation**: Show wheel angle as text above the wheel control point

Example: "Wheel: -45°" or "Wheel: ←45°"

**Pros**:
- Extremely simple to implement (one line of text)
- Precise numerical feedback
- Easy to understand

**Cons**:
- Not visually intuitive
- Requires reading during gameplay
- Doesn't feel immersive
- Hard to judge at a glance

**Verdict**: ⚠️ Functional but not elegant

### Approach 2: Arc Indicator (Recommended)
**Implementation**: Draw a circular arc above the wheel showing rotation range and current position

Visual elements:
- Base arc showing full range (180° arc, gray)
- Filled arc showing current rotation (colored based on direction)
- Center marker (vertical line at 0°)
- Current position indicator (bright marker)

```
       ↑ (center)
    ───|───
   /   |   \
  |  ←●    |  (turned left 45°)
   \       /
    ───────
```

**Pros**:
- Visual and intuitive (like a gauge)
- Shows center position clearly
- Shows rotation direction at a glance
- Scales well with different zoom levels
- Matches physical wheel metaphor

**Cons**:
- More complex to draw (arc geometry)
- Requires calculating arc positions

**Verdict**: ✅ Best balance of clarity and immersion

### Approach 3: Wheel Sprite Rotation
**Implementation**: Render an actual wheel sprite that rotates visually

**Pros**:
- Most realistic and immersive
- Directly represents physical wheel
- Beautiful visual presentation

**Cons**:
- Requires wheel sprite asset
- Hard to see rotation amount at small sizes
- May be obscured by other sprites
- Overkill for MVP

**Verdict**: ⚠️ Save for future enhancement

### Approach 4: Horizontal Bar Indicator
**Implementation**: Show a horizontal bar with left/right segments and center marker

```
[←←←|→→→]
     ●
```

**Pros**:
- Simple to understand
- Works well as HUD element
- Easy to draw (rectangles)

**Cons**:
- Takes up screen space (HUD)
- Less intuitive for rotation
- Disconnected from ship/wheel position

**Verdict**: ❌ Not suitable for ship control context

### Approach 5: Direction Arrows (Minimal)
**Implementation**: Show ← or → arrow when wheel is turned left/right, nothing when centered

**Pros**:
- Extremely minimal
- Clear direction indication

**Cons**:
- Doesn't show magnitude
- Doesn't show center position
- Too simplistic for precise steering

**Verdict**: ❌ Insufficient feedback

## Recommended Design: Arc Indicator

### Visual Specification

**Position**: Directly above the wheel control point, similar to where grabable indicators appear

**Components**:
1. **Background arc** (gray, 0.3 alpha):
   - 180° arc (semicircle)
   - Radius: 30px from control point
   - Line width: 3px
   - Shows full rotation range (-90° to +90° visually)

2. **Center marker** (white, 1.0 alpha):
   - Vertical line at top of arc (0°)
   - Length: 10px
   - Line width: 2px
   - Always visible (reference point)

3. **Current angle indicator** (color-coded, 0.9 alpha):
   - Filled arc from center to current angle
   - Green if centered (within ±5°)
   - Cyan if turned left
   - Magenta if turned right
   - Line width: 4px (thicker than background)

4. **Position marker** (bright dot):
   - Circle at current angle position
   - Radius: 4px
   - Same color as filled arc
   - Pulses slightly (optional animation)

### Mathematical Calculations

**Arc geometry**:
```typescript
const indicatorRadius = 30; // pixels
const arcStartAngle = -Math.PI / 2; // -90° (left limit in screen space)
const arcEndAngle = Math.PI / 2;    // +90° (right limit in screen space)

// Convert wheel angle (-π to π) to screen angle
// Note: wheel angle = -π means hard left, +π means hard right
// Screen arc: -90° (left) to +90° (right)
const screenAngle = (wheelAngle / Math.PI) * (Math.PI / 2);
```

**Position marker**:
```typescript
const markerX = centerX + Math.cos(screenAngle + Math.PI/2) * indicatorRadius;
const markerY = centerY + Math.sin(screenAngle + Math.PI/2) * indicatorRadius;
```

**Color logic**:
```typescript
const CENTERED_THRESHOLD = Math.PI / 36; // ±5°

let color: number;
if (Math.abs(wheelAngle) < CENTERED_THRESHOLD) {
  color = 0x00ff00; // Green (centered)
} else if (wheelAngle < 0) {
  color = 0x00ffff; // Cyan (left)
} else {
  color = 0xff00ff; // Magenta (right)
}
```

### Depth Ordering
- Indicator depth: 520 (above cannons at 500, below nothing)
- Shows when controlling wheel only
- Hidden when not controlling

## Integration Points

### Type Definitions
**File**: `client/src/types.ts`

Add to `ShipData` interface:
```typescript
export interface ShipData {
  rotation: number;
  rotationDelta?: number;
  speedLevel: number;
  wheelAngle?: number; // NEW: Current wheel rotation (-PI to PI, 0 = centered)
  // ... rest of fields
}
```

Add to `Ship` interface:
```typescript
export interface Ship {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  // ... existing fields ...
  wheelAngle: number; // NEW: Track current wheel angle
  wheelIndicator?: Phaser.GameObjects.Graphics; // NEW: Graphics object for indicator
}
```

### ShipManager Modifications
**File**: `client/src/game/managers/ShipManager.ts`

**Changes needed**:
1. Create `wheelIndicator` graphics in ship creation (line ~214)
2. Update `wheelAngle` from server in `updateShip()` (line ~270)
3. Pass wheel angle to renderer in `interpolateShips()` (line ~428)

### ShipRenderer Modifications
**File**: `client/src/game/rendering/ShipRenderer.ts`

**New method**:
```typescript
drawWheelIndicator(
  graphics: Phaser.GameObjects.Graphics,
  wheelControlPoint: ControlPoint,
  shipSprite: Phaser.GameObjects.Sprite,
  shipRotation: number,
  wheelAngle: number,
  isControlledByUs: boolean
): void
```

**Rendering conditions**:
- Only draw if `isControlledByUs === true`
- Position above wheel control point (same as grabable indicator)
- Rotate with ship using isometric rotation

## Constraints and Considerations

### Technical Constraints
1. Must receive `wheelAngle` from server (add to client types)
2. Must only show when local player is controlling wheel
3. Must position correctly with ship rotation
4. Must not obscure other UI (cannons, grabable indicators)

### Visual Constraints
1. Must be visible against water/deck background
2. Must scale appropriately with zoom
3. Must clearly indicate center position
4. Should use consistent color scheme (match existing UI)

### Gameplay Constraints
1. Must help players center wheel quickly
2. Should provide immediate visual feedback
3. Must work at all ship rotations
4. Should be intuitive for new players

## Prior Art

### Other Games
- **Sea of Thieves**: Shows wheel rotation with full 3D wheel model
- **Assassin's Creed IV: Black Flag**: Shows helm wheel rotating visually
- **World of Warships**: Shows rudder position as horizontal bar indicator
- **Sailing simulators**: Often use compass rose or heading indicator

### Common Pattern
Most sailing games show wheel/rudder state visually, either as:
1. Rotating wheel sprite (most immersive)
2. Gauge/arc indicator (most clear)
3. Text/number display (most precise)

Arc indicators are common in racing games for steering feedback (e.g., Forza, Gran Turismo).

## Open Questions

1. **Indicator visibility**: Should it show when near wheel but not controlling? (Probably no - only when controlling)
2. **Animation**: Should the arc animate/pulse when at center? (Nice-to-have)
3. **Audio feedback**: Should centering play a subtle click sound? (Future enhancement)
4. **Auto-center**: Should wheel auto-return to center when released? (Major gameplay change, needs separate proposal)
5. **Gamepad vibration**: Should gamepad vibrate when wheel hits limits? (g4p enhancement)

## Success Criteria

A successful implementation should:
1. Clearly show current wheel rotation at a glance
2. Make it easy to find and return to center
3. Provide instant visual feedback when turning
4. Help players steer more precisely
5. Work correctly at all ship orientations
6. Not obscure other important UI elements

## References

- **w3l-wheel-steering proposal**: Original wheel steering implementation
- **g4p-gamepad-support**: Gamepad controls for wheel
- **Existing proposals**:
  - i2m-true-isometric (rotation math)
  - s6r-ship-sprite-rendering (depth ordering)
  - b8s-cannonball-shadows (similar visual indicator work)

## Next Steps

1. Write formal proposal.md with technical design
2. Create implementation.md with step-by-step plan
3. Add `wheelAngle` to client `ShipData` interface
4. Implement arc indicator renderer
5. Integrate with ShipManager
6. Test at various wheel angles and ship rotations
7. Update CHANGELOG.md
