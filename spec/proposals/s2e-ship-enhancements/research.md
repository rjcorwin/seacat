# Research: Ship Sprite Enhancements (s2e)

**Proposal Code:** s2e-ship-enhancements
**Created:** 2025-11-09
**Builds On:** s6r-ship-sprite-rendering

## Overview

Research for adding visual elements (helm, cannons, sail lines) to the existing ship sprite to provide visual feedback for control points and enhance nautical authenticity.

## Current Ship Sprite Status

### Technical Specifications

From **s6r-ship-sprite-rendering** (implemented):

- **Rendering tool:** Blender 3D with Python automation
- **Frame count:** 64 frames (5.625° per frame)
- **Frame size:** 256×256 pixels (upgraded from 128×128 for clarity)
- **Sprite sheet:** 2048×2048 pixels (8×8 grid)
- **File format:** PNG with alpha transparency
- **Current file:** `client/assets/sprites/ship1.png` (1.06 MB)
- **Source model:** `client/assets/blender/ship1.blend` (558 KB)

### Current Visual Elements

The existing ship sprite includes:
- **Hull:** Voxel-style body (dark wood #8B4513)
- **Deck:** Flat plank surface (lighter wood #DEB887)
- **Mast:** Vertical pole at center
- **Sails:** Rectangular white/cream cloth (#F5F5DC)
- **Optional details:** Railings, bowsprit (per BLENDER_GUIDE.md)

### What's Missing

Currently, the sprite lacks visual representation for:
1. **Steering wheel** (helm) at the stern
2. **Cannons** on port/starboard sides
3. **Rigging lines** connecting mast to sails

Players interact with these control points via colored circles, but the actual ship sprite shows no corresponding physical features.

## Control Point Positions

From **server/mcp-servers/index.ts** (configuration):

### Coordinate System

Ship-local coordinates where the ship faces **east** (rotation=0°):
- **X-axis:** Length (bow to stern)
  - Positive X = forward (bow)
  - Negative X = backward (stern)
- **Y-axis:** Beam (port to starboard)
  - Positive Y = starboard (right)
  - Negative Y = port (left)
- **Origin:** Ship center
- **Deck dimensions:** 128px length × 48px beam

### Wheel Position (Helm)

```typescript
wheelPosition: { x: -54, y: 0 }
```

- Located at **stern** (rear) of ship
- 54 pixels behind ship center
- Centered on ship's beam (y=0)
- Currently shown as control point circle only

### Sails Position

```typescript
sailsPosition: { x: 44, y: 0 }
```

- Located at **bow** (front) of ship
- 44 pixels forward from center
- Centered on ship's beam (y=0)
- Currently shown as control point circle only

### Cannon Positions (4 total)

```typescript
cannonPositions: {
  port: [
    { x: -10, y: -24 },  // Mid-ship port
    { x: 20, y: -24 }    // Forward port
  ],
  starboard: [
    { x: -10, y: 24 },   // Mid-ship starboard
    { x: 20, y: 24 }     // Forward starboard
  ]
}
```

**Port side (left, y=-24):**
- Mid-ship cannon: x=-10 (10px behind center)
- Forward cannon: x=20 (20px ahead of center)

**Starboard side (right, y=24):**
- Mid-ship cannon: x=-10
- Forward cannon: x=20

**Notes:**
- Cannons positioned at ±24 pixels from centerline (near deck edge at 48px beam)
- Two on each side for total of 4 cannons
- Forward/aft spacing of 30 pixels (from x=-10 to x=20)

## Visual Design Requirements

### Design Principles

From s6r-ship-sprite-rendering:
1. **Blocky/voxel aesthetic:** Maintain Minecraft-style using cube/cylinder primitives
2. **Isometric compatibility:** Visible from 60° pitch, 45° yaw camera angle
3. **High contrast:** Elements must stand out against hull/deck colors
4. **Appropriate scale:** Identifiable at 256×256 frame size
5. **Nautical authenticity:** Recognizable maritime elements

### Helm (Steering Wheel) Requirements

**Visual goals:**
- Traditional ship wheel design (circular with spokes)
- Clearly identifiable as a steering mechanism
- Positioned at stern where players expect a helm

**Suggested specifications:**
- **Size:** 12-16 pixels diameter (in world space)
- **Structure:**
  - Central hub (small cylinder)
  - 6-8 radial spokes (thin rectangular prisms)
  - Vertical post/pedestal connecting to deck
- **Color:** Medium/dark wood (#C19A6B camel or #654321 dark wood)
- **Height:** Slightly elevated above deck (~4-8px) for visibility

### Cannon Requirements

**Visual goals:**
- Clearly recognizable as ship cannons
- Distinct from other ship elements
- Visible on both port and starboard sides
- Oriented perpendicular to ship axis

**Suggested specifications:**
- **Barrel:**
  - Elongated cylinder, 10-14 pixels long
  - 4-6 pixels diameter
  - Tapered slightly at muzzle (optional detail)
- **Carriage/mount:**
  - Small cube or platform base
  - 6-8 pixels wide
- **Orientation:** 90° from ship's longitudinal axis (pointing directly left/right)
- **Color:** Dark metal (#4A4A4A dark gray) or bronze (#CD7F32)
- **Elevation:** Slightly tilted (5-10°) for visual interest (optional)

**Placement notes:**
- Position at exactly y=±24 (near deck edge)
- Barrels should protrude slightly beyond hull
- Maintain symmetry between port/starboard

### Rigging Lines Requirements

**Visual goals:**
- Provide nautical authenticity
- Visual connection between mast and sails
- Subtle, not dominating the sprite
- Traditional sailing ship aesthetic

**Suggested specifications:**
- **Pattern:** Lines from mast to sail corners
  - Minimum: 4 lines (one to each sail corner)
  - Expanded: 6-8 lines (add intermediate attachment points)
- **Thickness:** 0.5-1 pixel when rendered (very thin)
- **Color:** Dark brown/tan (#654321 dark wood or #8B7355 rope brown)
- **Style:** Straight lines (not sagging curves for simplicity)
- **Optional:** Vertical mast stays (mast to deck) for additional detail

**Implementation approach:**
- Use thin cylinders or Blender curve objects
- Convert curves to mesh for consistent rendering
- Keep minimal to avoid visual clutter
- Focus on functional rigging (sheets/halyards), not decorative

## Color Palette

### Existing Colors (from s6r)
- **Hull:** #8B4513 (saddle brown)
- **Deck:** #DEB887 (burly wood, lighter tan)
- **Sails:** #F5F5DC (beige/cream)

### New Element Colors

**Helm:**
- Option 1: #C19A6B (camel, medium wood) - matches nautical wood
- Option 2: #654321 (dark brown) - darker contrast
- Option 3: #808080 (gray) - metal wheel alternative

**Cannons:**
- Option 1: #4A4A4A (dark gray) - metal cannon
- Option 2: #2F2F2F (very dark gray) - iron cannon
- Option 3: #CD7F32 (bronze) - historical bronze cannon

**Rigging:**
- Option 1: #654321 (dark brown) - matches helm option 2
- Option 2: #8B7355 (medium brown) - rope/hemp color
- Option 3: #696969 (dim gray) - weathered rope

### Contrast Analysis

Against deck (#DEB887 - light tan):
- Dark gray cannons: ✓ Excellent contrast
- Dark brown helm/rigging: ✓ Good contrast
- Bronze cannons: ✓ Good contrast

Against hull (#8B4513 - dark brown):
- Dark gray cannons: ✓ Good contrast
- Dark brown rigging: ⚠ Lower contrast (acceptable for subtle rigging)
- Lighter wood helm: ✓ Good contrast if using #C19A6B

## Rendering Workflow

### Existing Infrastructure (from s6r)

**Files:**
- **Blender model:** `client/assets/blender/ship1.blend`
- **Render script:** `client/scripts/render-ship-frames.py`
- **Assembly script:** `client/scripts/assemble-sprite-sheet.sh`

**Workflow:**
1. Edit `ship1.blend` to add new elements
2. Run: `blender assets/blender/ship1.blend --background --python scripts/render-ship-frames.py`
3. Run: `./scripts/assemble-sprite-sheet.sh`
4. Output: `client/assets/sprites/ship1.png` (overwrites existing)

**Render time:** ~80-120 seconds for 64 frames

### Camera Setup (unchanged)

From s6r-ship-sprite-rendering:
- **Type:** Orthographic
- **Position:** X=10, Y=-10, Z=7
- **Rotation:** X=60°, Y=0°, Z=45°
- **Orthographic Scale:** 7-10
- **Resolution:** 256×256 pixels per frame
- **Shading:** Flat (Eevee or Workbench)

### No Changes Required

The existing render pipeline will work without modification. Simply:
1. Open Blender file
2. Add new geometric elements
3. Re-run existing scripts

## Modeling Constraints

### Scale Considerations

Ship fits in ~100×100 pixel core area of 256×256 frame:
- Helm wheel: 12-16px diameter ≈ 5-6% of frame width
- Cannon barrels: 10-14px length ≈ 4-5% of frame width
- Rigging thickness: 0.5-1px ≈ 0.2-0.4% of frame width

### Isometric Visibility

From 60° pitch camera angle:
- Top-down elements (helm wheel) highly visible
- Horizontal elements (cannon barrels) moderately visible
- Vertical elements (rigging lines) visible from most angles
- Forward-facing cannons (x=20) more prominent than aft cannons (x=-10)

### Rotation Considerations

All elements must be:
- Attached to ship (not floating)
- Symmetrical port/starboard (for consistent appearance across all 64 frames)
- Properly rotated with ship (positioned as children of ship object in Blender)

### Performance

- Current sprite sheet: 1.06 MB
- Added elements estimated to increase size by ~5-10%
- Target: Keep under 1.5 MB
- 64 frames non-negotiable (per s6r decision)

## Reference Materials

### Historical Ship Design

Traditional sailing ship features:
- **Helm position:** Always at stern for rudder control
- **Cannon placement:** Along broadside (port/starboard) for maximum firepower arc
- **Rigging types:**
  - Standing rigging: Fixed lines supporting mast (stays)
  - Running rigging: Adjustable lines controlling sails (sheets, halyards)

### Blocky/Voxel Style References

Examples maintaining aesthetic:
- Minecraft ships: Simple geometric forms, high contrast colors
- Lego ship models: Recognizable simplified features
- Stormworks: Build and Rescue: Functional blocky boat elements

### Isometric Sprite Examples

Games with similar camera angles:
- Factorio: Detailed small-scale industrial sprites
- RimWorld: Clear readable furniture/objects from 30-45° angle
- StarCraft: Recognizable units with distinct features

## Technical References

**Original proposal:** `spec/proposals/s6r-ship-sprite-rendering/`
- `proposal.md` - Full specification
- `decision-s6r-ship-sprite-rendering.md` - 64 frame decision rationale
- `BLENDER_GUIDE.md` - Step-by-step modeling instructions
- `IMPLEMENTATION_PLAN.md` - Render workflow

**Server configuration:** `server/mcp-servers/index.ts`
- Line ~72-90: Ship configuration with control point positions

**Client rendering:** `client/src/game/rendering/ShipRenderer.ts`
- `calculateShipSpriteFrame()` - Maps rotation to sprite frame index

## Open Questions

1. **Helm detail level:**
   - Simple 4-spoke wheel vs detailed 8-spoke?
   - Metal wheel or wood wheel?
   - Stand-alone pedestal or attached to railing?

2. **Cannon orientation:**
   - Perfectly horizontal (0° elevation)?
   - Slight downward tilt for visual interest?
   - Angled forward slightly (raked)?

3. **Rigging complexity:**
   - Minimal (4 corner lines only)?
   - Moderate (6-8 functional lines)?
   - Detailed (12+ lines with stays/shrouds)?

4. **Color choices:**
   - Match existing dark wood theme or introduce new colors?
   - Realistic (dark metal) or stylized (bronze/bright)?

5. **Additional details:**
   - Add cannon ports (portholes) in hull?
   - Add anchor at bow?
   - Add ship's wheel platform/deck?

## Recommendations

Based on research:

1. **Start simple:** Add basic geometric forms first, test render, iterate
2. **Prioritize cannons:** Most visually impactful and gameplay-relevant
3. **Keep rigging minimal:** 4-6 lines maximum to avoid visual noise
4. **Use dark colors:** Darker elements have better contrast against light deck
5. **Test early:** Render single frame (F12) before full 64-frame batch
6. **Maintain symmetry:** Ensure port/starboard elements mirror correctly

## Next Steps

1. Create detailed proposal with specific design choices
2. Create Blender modeling guide with step-by-step instructions
3. Implement in `ship1.blend`
4. Test render and iterate
5. Update sprite sheet and test in-game
