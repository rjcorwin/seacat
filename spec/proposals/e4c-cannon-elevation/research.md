# Research: Cannon Elevation Control (e4c)

## Overview

Investigation into the cannon pitch/elevation adjustment mechanism that became "way too slow" after recent changes. The system controls how players adjust cannon elevation angles between 15° and 60°.

## Current Implementation

### Architecture

The cannon elevation system involves three main components:

1. **Client Input Handler** - Detects keyboard/gamepad input and throttles messages
2. **Network Layer** - Sends elevation adjustment messages to ship server
3. **Ship Server** - Applies elevation changes and broadcasts updates

### Client-Side Implementation

**File:** `client/src/game/input/ShipInputHandler.ts`

#### Input Detection (lines 232-249)
```typescript
// Keyboard: W/S keys adjust elevation
if (this.cursors.up.isDown) {
  this.handleCannonElevation('up');
} else if (this.cursors.down.isDown) {
  this.handleCannonElevation('down');
}

// Gamepad: Right stick Y-axis
const rightStickY = gamepad.axes[3]?.getValue() || 0;
if (Math.abs(rightStickY) > 0.2) {
  this.handleCannonElevation(rightStickY < 0 ? 'up' : 'down');
}
```

#### Message Throttling (lines 76-78, 548-560)
```typescript
// Constants
private static readonly ELEVATION_THROTTLE_MS = 50;
private lastElevationTime = 0;

// Throttle check
handleCannonElevation(direction: 'up' | 'down') {
  const now = Date.now();
  if (now - this.lastElevationTime < ShipInputHandler.ELEVATION_THROTTLE_MS) {
    return; // Skip if within throttle window
  }
  this.lastElevationTime = now;
  this.shipCommands.adjustCannonElevation(controllingShip, controllingCannon.id, direction);
}
```

**Effective Rate:** 50ms throttle = maximum **20 messages/second**

#### Network Command (ShipCommands.ts:265-276)
```typescript
adjustCannonElevation(shipId: string, cannonId: string, direction: 'up' | 'down') {
  this.client.send({
    type: 'ship/adjust_cannon_elevation',
    payload: { shipId, cannonId, direction }
  });
}
```

### Server-Side Implementation

**File:** `server/mcp-servers/ShipServer.ts`

#### Elevation Adjustment Handler (lines 607-634)
```typescript
async handleAdjustCannonElevation(participantId: string, payload: any) {
  const { shipId, cannonId, direction } = payload;
  const ship = this.ships.get(shipId);
  const cannon = ship.cannons.find(c => c.id === cannonId);

  // Elevation step: 0.1° per message
  const elevationStep = Math.PI / 1800; // 0.1 degrees in radians

  if (direction === 'up') {
    cannon.elevationAngle = Math.min(
      Math.PI / 3,  // 60° maximum
      cannon.elevationAngle + elevationStep
    );
  } else {
    cannon.elevationAngle = Math.max(
      Math.PI / 12, // 15° minimum
      cannon.elevationAngle - elevationStep
    );
  }
}
```

**Range:**
- Minimum: π/12 = 15°
- Maximum: π/3 = 60°
- Total range: 45°
- Step size: π/1800 = 0.1°

**Default:** π/6 = 30° (lines 94, 105 - cannon creation)

#### Message Handling (ShipParticipant.ts:201-205)
```typescript
case 'ship/adjust_cannon_elevation':
  await this.shipServer.handleAdjustCannonElevation(
    envelope.participant_id,
    envelope.payload.payload
  );
  break;
```

#### Broadcasting (ShipParticipant.ts:349-370)
Position updates broadcast at 60 FPS include current elevation angle for all cannons.

## The Problem: 150x Slowdown

### Recent Change History

**Commit:** 7f1c4b8 (November 8, 2025)
**Summary:** Adjusted cannon elevation speed

### Before the Change
- **Client throttle:** None - sending at ~60 messages/second (every frame)
- **Server step:** π/360 = 5° per message
- **Effective speed:** 60 msg/s × 5°/msg = **300°/second**
- **User feedback:** "Too fast - instant adjustment"

### After the Change (Current)
- **Client throttle:** 50ms = 20 messages/second
- **Server step:** π/1800 = 0.1° per message
- **Effective speed:** 20 msg/s × 0.1°/msg = **2°/second**
- **Full range time:** 45° ÷ 2°/s = **22.5 seconds** to traverse full range
- **User feedback:** "Way too slow"

### Root Cause Analysis

The problem is that **both** the client and server were adjusted:

1. **Client throttling** reduced rate from 60 → 20 msg/s (**3x slower**)
2. **Server step size** reduced from 5° → 0.1° (**50x smaller**)
3. **Combined effect:** 3× × 50× = **150× slower** than original

The server-side comment claims "At 60fps: 6°/second" but this is **outdated** - it assumes messages arrive every frame, but the 50ms client throttle limits them to 20/sec, not 60/sec.

## Control Flow

```
Player Input (W/S or Gamepad)
    ↓
ShipInputHandler.handleCannonElevation()
    ↓ (throttled to 50ms)
ShipCommands.adjustCannonElevation()
    ↓ (send 'ship/adjust_cannon_elevation')
[Network: MEW Protocol]
    ↓
ShipParticipant.handleMessage()
    ↓
ShipServer.handleAdjustCannonElevation()
    ↓ (apply ±0.1° step)
Ship cannon.elevationAngle updated
    ↓ (broadcast at 60 FPS)
[Network: MEW Protocol]
    ↓
Client receives position update
    ↓
Cannon visual indicator updated
```

## Performance Characteristics

### Current Timing
- **Input polling:** Every frame (~60 FPS)
- **Message sending:** Max 20/second (50ms throttle)
- **Position broadcasts:** 60/second
- **Elevation change per second:** 2°
- **Time to adjust 10°:** 5 seconds
- **Time for full range (45°):** 22.5 seconds

### Network Load
- Each elevation message: ~100 bytes
- Max bandwidth: 20 msg/s × 100 bytes = 2 KB/s per player
- Negligible impact on network

## Type Definitions

**File:** `server/mcp-servers/types.ts`

```typescript
interface Cannon {
  id: string;
  relativePosition: { x: number; y: number };
  controlledBy: string | null;
  aimAngle: number;        // ±π/4 from perpendicular
  elevationAngle: number;  // π/12 (15°) to π/3 (60°)
  cooldownRemaining: number;
}

interface AdjustCannonElevationPayload {
  shipId: string;
  cannonId: string;
  direction: 'up' | 'down';
}
```

## Related Systems

### Cannon Aiming (Horizontal)
- Similar throttle mechanism (50ms)
- Larger step size (π/180 = 1° per message)
- Aim speed: 20°/second (10x faster than current elevation)

### Ship Wheel Turning
- No throttling - continuous position updates
- Smooth, responsive feel

## Known Issues

Documented in `spec/TODO.md` (line 8):
```
- [ ] bug: our recent adjustment of the cannon pitch going up/down too fast now has it going way too slow
```

## Summary

The cannon elevation system is working as designed, but the design overcorrected for the "too fast" problem by applying two slowdown mechanisms simultaneously:

1. Client-side throttling (3x reduction)
2. Server-side step reduction (50x reduction)

This resulted in a 150x slowdown, making elevation adjustment impractically slow. The system needs rebalancing to find a middle ground between "instant" (300°/s) and "glacial" (2°/s).
