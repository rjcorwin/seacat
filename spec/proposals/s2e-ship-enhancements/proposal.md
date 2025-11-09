# Proposal: Ship Sprite Enhancements (s2e)

**Status:** Draft
**Created:** 2025-11-09
**Code:** s2e-ship-enhancements
**Builds On:** s6r-ship-sprite-rendering

## Motivation

The current ship sprite (from s6r-ship-sprite-rendering) provides a clean, recognizable sailing ship with hull, deck, mast, and sails. However, it lacks visual representation for three key interactive elements:

1. **Steering wheel (helm)** - Players interact with wheel control point at stern, but no wheel is visible
2. **Cannons** - Four cannons exist as control points for combat, but no cannons appear on the ship sprite
3. **Sail rigging** - Sails appear to float disconnected from the mast with no visible lines

### User Experience Impact

**Current state:** Players see colored control point circles but no corresponding physical features on the ship. This creates a disconnect between interaction and visual feedback.

**Desired state:** Players can visually identify the steering wheel at the stern, see cannons protruding from the ship's sides, and observe rigging lines connecting the mast to sails, creating a more authentic and readable game experience.

### From TODO List

```
- [ ] sprite: add helm, cannons, and sail lines to ship sprite
```

This enhancement is part of the MVP playtest preparation.

## Goals

### Primary Goals

1. **Add helm (steering wheel)** at position x=-54, y=0 (stern, centerline)
2. **Add 4 cannons** at positions defined in server config (2 port, 2 starboard)
3. **Add rigging lines** connecting mast to sail corners

### Secondary Goals

4. Maintain blocky/voxel Minecraft-style aesthetic (from s6r)
5. Ensure new elements are clearly visible at 256×256 frame size
6. Keep sprite sheet file size under 1.5 MB
7. Use existing render pipeline without modifications

### Non-Goals

- Animate elements (wheel spinning, cannons recoiling, sails billowing)
- Add decorative details unrelated to gameplay (flags, figureheads, etc.)
- Change existing ship hull/deck/mast structure
- Add more than 64 rotation frames

## Design

### Overview

Enhance the existing `ship1.blend` Blender model by adding three types of geometric elements:

1. **Helm wheel:** Circular spoke design at stern
2. **Cannons:** Cylinder barrels with cube carriages on both broadsides
3. **Rigging:** Thin cylinder "ropes" from mast to sail corners

All elements will use simple voxel-style geometry (cubes, cylinders) to match the existing ship aesthetic and will be rendered using the existing 64-frame rotation pipeline.

### Element 1: Helm (Steering Wheel)

**Position (ship-local coordinates):**
- X: -54 (stern, 54 pixels behind center)
- Y: 0 (centerline)
- Z: Deck height + 8 pixels (elevated for visibility)

**Geometric Design:**
- **Hub:** Small cylinder (4px diameter, 2px height)
- **Spokes:** 6 rectangular prisms radiating from hub (1px × 1px × 6px)
- **Rim:** Torus or 6-segment circle connecting spoke ends (12px outer diameter)
- **Post:** Thin cylinder (2px diameter) connecting wheel to deck (8px tall)

**Color:** #654321 (dark brown wood) for high contrast against light deck

**Visual from isometric camera:**
- Top-down view shows circular wheel clearly
- Spokes create recognizable wheel pattern
- Post grounds wheel to deck, preventing "floating" appearance

**Decision: 6-spoke wheel**
- Simpler than 8-spoke
- Still clearly identifiable as a ship's wheel
- Better visibility at small scale

### Element 2: Cannons (4 total)

**Positions (ship-local coordinates):**

| Cannon | Side | X | Y | Orientation |
|--------|------|---|---|-------------|
| Port Mid | Port | -10 | -24 | 90° (pointing left) |
| Port Forward | Port | 20 | -24 | 90° (pointing left) |
| Starboard Mid | Starboard | -10 | 24 | 270° (pointing right) |
| Starboard Forward | Starboard | 20 | 24 | 270° (pointing right) |

**Geometric Design (per cannon):**
- **Barrel:** Elongated cylinder
  - Length: 12 pixels
  - Diameter: 4 pixels
  - Slightly tapered at muzzle (3.5px at tip)
- **Carriage:** Cube base
  - Width: 6 pixels
  - Depth: 8 pixels
  - Height: 3 pixels
- **Wheels:** Optional small cylinders under carriage (2px diameter)

**Color:** #4A4A4A (dark gray metal) for strong contrast

**Barrel orientation:** Perpendicular to ship's longitudinal axis (90°/270°)

**Visual from isometric camera:**
- Side view shows barrel length clearly
- Protrudes beyond hull edge for visibility
- Port/starboard symmetry maintained

**Decision: Dark gray metal**
- Highest contrast against both hull (brown) and deck (tan)
- Historically accurate for iron cannons
- More visible than bronze alternative

### Element 3: Rigging Lines

**Pattern:** Mast to sail corners (6 lines total)

**Line Positions:**
- **Fore-stay:** Mast top → Sail front-top corner
- **Fore-sheet:** Mast mid → Sail front-bottom corner
- **Aft-stay:** Mast top → Sail rear-top corner
- **Aft-sheet:** Mast mid → Sail rear-bottom corner
- **Port-sheet:** Mast mid → Sail left edge (optional)
- **Starboard-sheet:** Mast mid → Sail right edge (optional)

**Geometric Design:**
- **Type:** Thin cylinders (Blender mesh, not curves)
- **Diameter:** 0.8 pixels (renders to ~0.5-1px depending on angle)
- **Length:** Variable (15-30 pixels depending on connection points)

**Color:** #8B7355 (medium brown - rope/hemp color)

**Attachment points:**
- **Mast:** Create invisible anchor points at top (z=max) and mid (z=mid)
- **Sails:** Connect to visible corners/edges of sail geometry

**Visual from isometric camera:**
- Lines visible from multiple angles as thin brown threads
- Create visual connection without overwhelming sprite
- Add nautical authenticity

**Decision: 6 functional lines only**
- More than 4 (corners only) for realism
- Fewer than 12 to avoid visual clutter
- Focus on sheets/stays, skip decorative shrouds

### Color Palette Summary

| Element | Color | Hex | Rationale |
|---------|-------|-----|-----------|
| Helm wheel | Dark brown | #654321 | Matches nautical wood theme, contrasts with deck |
| Helm post | Dark brown | #654321 | Consistent with wheel |
| Cannon barrels | Dark gray | #4A4A4A | High contrast, metal appearance |
| Cannon carriages | Dark gray | #4A4A4A | Consistent with barrels |
| Rigging lines | Medium brown | #8B7355 | Rope color, subtle but visible |

### Scale & Proportions

All measurements in ship-local coordinate pixels (1:1 with world pixels):

- **Helm wheel:** 12px diameter (~5% of frame width)
- **Helm post:** 8px tall (~3% of frame height)
- **Cannon barrels:** 12px long, 4px diameter
- **Rigging lines:** 0.8px diameter (very thin)

### Positioning Verification

All elements positioned at exact server control point coordinates to ensure visual alignment:

```typescript
// From server/mcp-servers/index.ts
wheelPosition: { x: -54, y: 0 }  // ✓ Helm wheel here
cannonPositions: {
  port: [
    { x: -10, y: -24 },  // ✓ Cannon here
    { x: 20, y: -24 }    // ✓ Cannon here
  ],
  starboard: [
    { x: -10, y: 24 },   // ✓ Cannon here
    { x: 20, y: 24 }     // ✓ Cannon here
  ]
}
```

Rigging connects existing mast (center, z=0 to z=max) to existing sails.

## Implementation Plan

### Phase 1: Model Enhancements (Blender)

1. **Open existing model:** `client/assets/blender/ship1.blend`
2. **Add helm wheel:**
   - Create cylinder for hub at x=-54, y=0, z=deck+8
   - Create 6 spoke cubes radiating from hub
   - Add rim connecting spoke ends
   - Add post cylinder from wheel to deck
   - Apply dark brown material (#654321)
3. **Add cannons (4x):**
   - Create barrel cylinder (12px long, 4px diameter)
   - Create carriage cube (6×8×3 pixels)
   - Position at x=-10, y=-24 (port mid)
   - Rotate to point perpendicular (90°)
   - Apply dark gray material (#4A4A4A)
   - Duplicate for other 3 positions
4. **Add rigging (6 lines):**
   - Identify mast top/mid anchor points
   - Identify sail corner coordinates
   - Create thin cylinder (0.8px diameter) from mast to each sail corner
   - Apply medium brown material (#8B7355)
   - Repeat for all 6 connection points

**Time estimate:** 1-2 hours

### Phase 2: Test Render

1. Select single frame angle (e.g., frame 0 = east-facing)
2. Render test frame (F12 in Blender): `256×256 pixels`
3. Verify:
   - Helm wheel visible and recognizable
   - All 4 cannons positioned correctly and visible
   - Rigging lines visible but not overwhelming
   - Colors provide good contrast
   - Elements don't clip or intersect incorrectly
4. Iterate on sizes/positions as needed

**Time estimate:** 15-30 minutes

### Phase 3: Full Render

1. Run render script (from project root):
   ```bash
   blender client/assets/blender/ship1.blend \
     --background \
     --python client/scripts/render-ship-frames.py
   ```
2. Wait for 64 frames to render (~80-120 seconds)
3. Output: `client/assets/sprites/ship_frames/ship_000.png` through `ship_063.png`

**Time estimate:** 2-3 minutes

### Phase 4: Assemble Sprite Sheet

1. Run assembly script (from client directory):
   ```bash
   cd client
   ./scripts/assemble-sprite-sheet.sh
   ```
2. Output: `client/assets/sprites/ship1.png` (2048×2048, 8×8 grid)
3. Verify file size under 1.5 MB

**Time estimate:** 10-15 seconds

### Phase 5: Test In-Game

1. Build client: `cd client && npm run build`
2. Start server: `cd server && npm start`
3. Start client: `cd client && npm start`
4. Test:
   - Spawn ship and observe new visual elements
   - Rotate ship through full 360° to verify all frames
   - Check helm wheel visible when approaching stern
   - Check cannons visible on both sides
   - Check rigging lines connect properly
5. Verify control points align with visual elements

**Time estimate:** 10-15 minutes

### Phase 6: Documentation

1. Create BLENDER_GUIDE.md with step-by-step modeling instructions
2. Take screenshots of key steps
3. Document any deviations from original plan
4. Update CHANGELOG.md with proposal status

**Time estimate:** 30 minutes

## Testing

### Visual Quality Checks

- [ ] Helm wheel clearly identifiable as steering wheel from most angles
- [ ] All 4 cannons visible and distinct from hull
- [ ] Rigging lines visible but not dominating the sprite
- [ ] No visual artifacts (z-fighting, clipping, pixelation)
- [ ] Colors provide adequate contrast for readability

### Technical Checks

- [ ] Sprite sheet size under 1.5 MB
- [ ] All 64 frames render successfully
- [ ] Frames assemble into 8×8 grid correctly
- [ ] Sprite loads in Phaser without errors
- [ ] Frame selection matches rotation angles (no off-by-one errors)

### Gameplay Checks

- [ ] Helm visual aligns with wheel control point position
- [ ] Cannon visuals align with cannon control point positions (all 4)
- [ ] Ship rotates smoothly through all angles
- [ ] Elements visible when ship is far from camera (zoom out)
- [ ] Elements recognizable when ship is close to camera (zoom in)

### Cross-Platform Checks

- [ ] Sprite renders correctly on macOS (development machine)
- [ ] Sprite renders correctly on Steam Deck (Linux)
- [ ] No rendering differences between direct launch and Steam launcher

## Impact Assessment

### File Size Impact

**Current:**
- `ship1.blend`: 558 KB
- `ship1.png`: 1.06 MB

**Estimated after:**
- `ship1.blend`: ~600 KB (+7%)
- `ship1.png`: ~1.15 MB (+8%)

**Rationale:** Added geometry is minimal compared to existing hull/sails.

### Performance Impact

**Rendering:**
- Current: ~90 seconds for 64 frames
- Estimated: ~95 seconds (+5%)
- Negligible impact on development workflow

**Runtime:**
- No impact: sprite sheet loaded once at game start
- Frame selection remains O(1) lookup

### Maintenance Impact

**Low impact:**
- Uses existing render pipeline (no script changes)
- Simple geometric additions (cubes/cylinders)
- Easy to iterate or revert if needed

## Alternatives Considered

### Alternative 1: Runtime Overlays

**Approach:** Keep sprite unchanged, draw helm/cannons/rigging as runtime graphics overlays (like current control point circles).

**Pros:**
- No Blender modeling required
- Can animate independently (wheel spin, cannon recoil)
- Easy to update without re-rendering

**Cons:**
- Overlays don't rotate with sprite properly
- 2D overlays look flat on 3D-looking ship
- Increased runtime rendering complexity
- Less authentic appearance

**Decision:** Rejected. Baked-in sprite elements look better and align with existing s6r approach.

### Alternative 2: Separate Sprite Layers

**Approach:** Render cannons/helm/rigging as separate sprite sheets, composite at runtime.

**Pros:**
- Can toggle elements on/off
- Can animate layers independently
- Modular updates

**Cons:**
- 3× larger total sprite data
- Complex runtime compositing
- Alignment issues between layers
- Over-engineered for static elements

**Decision:** Rejected. Not worth complexity for static visual elements.

### Alternative 3: Higher Frame Count

**Approach:** Increase from 64 to 128 frames for even smoother rotation, making new details more visible.

**Pros:**
- Smoother rotation
- More viewing angles for details

**Cons:**
- Violates s6r decision (64 frames proven sufficient)
- Doubles render time (~3 minutes)
- Doubles sprite sheet size (~2 MB)
- Minimal visual benefit

**Decision:** Rejected. 64 frames is sufficient per s6r research.

## Open Questions

1. **Cannon elevation:**
   - Should cannons be perfectly horizontal or slightly tilted?
   - **Recommendation:** Horizontal for consistency with cannon control points

2. **Wheel detail level:**
   - 6 spokes or 8 spokes?
   - **Recommendation:** 6 spokes (simpler, still recognizable)

3. **Rigging complexity:**
   - 4 lines (corners only) or 6 lines (corners + mid)?
   - **Recommendation:** 6 lines (better visual balance)

4. **Cannon wheels:**
   - Add small wheels under cannon carriages?
   - **Recommendation:** Optional, test visibility in Phase 2

5. **Additional details:**
   - Add cannon ports (dark circles) in hull?
   - **Recommendation:** Not needed if cannons themselves are visible

## Success Criteria

1. ✅ Helm wheel visible and recognizable in at least 50 of 64 frames
2. ✅ All 4 cannons visible and distinct in at least 56 of 64 frames
3. ✅ Rigging lines visible in at least 48 of 64 frames
4. ✅ Sprite sheet under 1.5 MB
5. ✅ Control points visually align with sprite elements
6. ✅ New elements maintain blocky voxel aesthetic
7. ✅ Playtesters can identify helm, cannons, and rigging without explanation

## Timeline

- **Phase 1 (Modeling):** 1-2 hours
- **Phase 2 (Test):** 15-30 minutes
- **Phase 3-4 (Render):** 3-5 minutes
- **Phase 5 (Test in-game):** 15 minutes
- **Phase 6 (Documentation):** 30 minutes

**Total estimated time:** 2.5-3.5 hours

## References

- **Original proposal:** `spec/proposals/s6r-ship-sprite-rendering/proposal.md`
- **Decision doc:** `spec/proposals/s6r-ship-sprite-rendering/decision-s6r-ship-sprite-rendering.md`
- **Blender guide:** `spec/proposals/s6r-ship-sprite-rendering/BLENDER_GUIDE.md`
- **Server config:** `server/mcp-servers/index.ts` (lines ~72-90)
- **Research:** `spec/proposals/s2e-ship-enhancements/research.md`

## Approval

This proposal follows the spec-driven workflow outlined in `CONTRIBUTING.md`. Implementation can proceed upon approval.
