# Proposal: Fix Cannon Elevation Speed (e4c)

**Status:** Draft
**Created:** 2025-11-09
**Code:** e4c-cannon-elevation

## Problem Statement

Cannon pitch/elevation adjustment is currently **way too slow**. Players must hold the adjustment key for ~22.5 seconds to traverse the full elevation range (15° to 60°), making combat feel sluggish and unresponsive.

### Root Cause

A recent change (commit 7f1c4b8, Nov 8 2025) overcorrected the "too fast" problem by applying two slowdown mechanisms simultaneously:

- **Before:** 60 msg/s × 5°/msg = 300°/second (too fast - felt instant)
- **After:** 20 msg/s × 0.1°/msg = 2°/second (way too slow - takes 22.5s for full range)

The combined effect was a **150x slowdown** instead of the intended moderate adjustment.

## Goals

1. Find a responsive elevation speed that feels good in combat
2. Balance between "instant" and "sluggish"
3. Consider simplifying the dual-layer throttling mechanism
4. Maintain network efficiency

## Proposed Solutions

### Option 1: Quick Fix (Adjust Server Step Size)

**Change:** Increase server-side elevation step from 0.1° to 1.0°

**Implementation:**
```typescript
// server/mcp-servers/ShipServer.ts:619
const elevationStep = Math.PI / 180; // 1.0° per message (was π/1800 = 0.1°)
```

**Result:**
- Speed: 20 msg/s × 1.0°/msg = **20°/second**
- Full range (45°): **2.25 seconds**
- 10x faster than current, 15x slower than original

**Pros:**
- Minimal change (1 line)
- Quick to test and iterate
- Keeps client-side throttling for network efficiency

**Cons:**
- Still has dual-layer control (client throttle + server step)
- May need further tuning

---

### Option 2: Simplification (Remove Client Throttling)

**Change:** Remove 50ms client throttle, rely only on server-side step size for speed control

**Implementation:**

**Client (ShipInputHandler.ts):**
```typescript
// Remove throttling check - send every frame when key is held
handleCannonElevation(direction: 'up' | 'down') {
  // Remove: if (now - this.lastElevationTime < ELEVATION_THROTTLE_MS) return;
  this.shipCommands.adjustCannonElevation(controllingShip, controllingCannon.id, direction);
}
```

**Server (ShipServer.ts):**
```typescript
// Reduce step size to compensate for higher message rate
const elevationStep = Math.PI / 540; // 0.33° per message
```

**Result:**
- Speed: 60 msg/s × 0.33°/msg = **20°/second** (same as Option 1)
- Full range (45°): **2.25 seconds**
- Simpler mental model: one control point instead of two

**Pros:**
- Removes complexity (one less throttle mechanism)
- More responsive - updates every frame instead of every 50ms
- Smoother visual feedback
- Consistent with wheel steering (no throttling)

**Cons:**
- Slightly higher network traffic (60 vs 20 messages/sec = +200 bytes/sec)
- Need to tune server step size carefully

---

### Option 3: Hybrid (Increase Both Values)

**Change:** Reduce client throttle AND increase server step

**Implementation:**

**Client:**
```typescript
private static readonly ELEVATION_THROTTLE_MS = 16; // ~60 FPS (was 50ms)
```

**Server:**
```typescript
const elevationStep = Math.PI / 540; // 0.33° per message (was 0.1°)
```

**Result:**
- Speed: 60 msg/s × 0.33°/msg = **20°/second**
- Full range (45°): **2.25 seconds**

**Pros:**
- Balanced approach
- Maintains some throttling for network protection
- Can fine-tune both values independently

**Cons:**
- Most complex - two parameters to tune
- 16ms throttle is essentially "no throttle" at 60 FPS

---

### Option 4: Aggressive Fix (Match Aim Speed)

**Change:** Match elevation speed to horizontal aim speed (currently 20°/second)

**Implementation:**
```typescript
// server/mcp-servers/ShipServer.ts
const elevationStep = Math.PI / 180; // 1.0° per message (same as aim)
```

**With current 50ms throttle:**
- Speed: 20 msg/s × 1.0°/msg = **20°/second**
- Full range (45°): **2.25 seconds**
- Matches horizontal aim feel

**Pros:**
- Consistent feel between horizontal and vertical aim
- Familiar to players (they've already experienced 20°/s on horizontal)
- Simple to explain: "1 degree per message"

**Cons:**
- None identified - this seems like the sweet spot

## Comparison Table

| Metric | Current | Option 1 | Option 2 | Option 3 | Option 4 |
|--------|---------|----------|----------|----------|----------|
| Client Throttle | 50ms | 50ms | None | 16ms | 50ms |
| Server Step | 0.1° | 1.0° | 0.33° | 0.33° | 1.0° |
| Message Rate | 20/s | 20/s | 60/s | 60/s | 20/s |
| Speed (°/s) | 2 | 20 | 20 | 20 | 20 |
| Full Range Time | 22.5s | 2.25s | 2.25s | 2.25s | 2.25s |
| Network (bytes/s) | 2000 | 2000 | 6000 | 6000 | 2000 |
| Complexity | High | High | Low | High | Medium |
| Consistency | - | - | Wheel-like | - | Aim-like |

## Recommendation

**Option 4: Aggressive Fix (Match Aim Speed)**

This option provides:
- **Consistency:** Matches existing horizontal aim speed (20°/s)
- **Simplicity:** One-line change, easy to understand
- **Network efficiency:** Keeps 50ms throttle
- **Good feel:** Fast enough for combat, controlled enough to aim
- **Proven:** Players are already comfortable with 20°/s on horizontal aim

### Implementation Steps

1. Change server elevation step:
   ```typescript
   // server/mcp-servers/ShipServer.ts:619
   const elevationStep = Math.PI / 180; // 1.0° (was π/1800)
   ```

2. Update comment to reflect actual speed:
   ```typescript
   // At 20 messages/second (50ms throttle): 20°/second
   ```

3. Test in-game:
   - Verify full range (15°-60°) takes ~2.25 seconds
   - Compare feel to horizontal aim
   - Adjust if needed

4. Consider future: If we want to simplify further, Option 2 could be explored, but Option 4 is the safe, proven path.

## Alternative Consideration

If 20°/s still feels too slow after testing, we could:
- Increase to 2.0° per message → 40°/s → 1.1 seconds for full range
- This would make elevation 2x faster than horizontal aim

But start with Option 4 and iterate based on playtesting.

## Impact

### User Experience
- **Before:** 22.5 seconds to adjust full range (frustrating)
- **After:** 2.25 seconds to adjust full range (responsive)
- **Improvement:** 10x faster

### Technical
- Files changed: 1 (`server/mcp-servers/ShipServer.ts`)
- Lines changed: 1-2 (value + comment)
- Network impact: None (maintains 50ms throttle)
- Breaking changes: None (compatible with existing clients)

### Testing
- Manual: Hold W/S keys and verify ~2 second full range traversal
- Compare: Ensure elevation feels similar to horizontal aim (Q/E keys)
- Edge cases: Verify min/max clamping still works (15°-60°)

## Open Questions

1. Should elevation be faster, slower, or same speed as horizontal aim?
2. Do we want to remove client throttling for even smoother feel? (Option 2)
3. Should we expose elevation/aim speeds as configurable constants?

## Future Work

- Extract magic numbers to constants file:
  ```typescript
  // client/src/game/utils/Constants.ts
  CANNON: {
    ELEVATION_MIN: Math.PI / 12,    // 15°
    ELEVATION_MAX: Math.PI / 3,     // 60°
    ELEVATION_DEFAULT: Math.PI / 6, // 30°
    ELEVATION_STEP: Math.PI / 180,  // 1.0° per message
    AIM_STEP: Math.PI / 180,        // 1.0° per message
    MESSAGE_THROTTLE_MS: 50,        // Client throttle
  }
  ```

- Consider unified cannon control config
- Add debug overlay showing current elevation/aim values
- Telemetry to track player adjustment patterns

## References

- Research: `spec/proposals/e4c-cannon-elevation/research.md`
- Original implementation: `c5x-ship-combat` proposal
- Related: Wheel steering (no throttle), horizontal aim (1° steps)
- Issue: `spec/TODO.md` line 8
