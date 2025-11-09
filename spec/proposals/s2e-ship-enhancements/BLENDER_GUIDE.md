# Blender Guide: Adding Helm, Cannons, and Rigging (s2e)

**Proposal:** s2e-ship-enhancements
**Prerequisites:** Blender 3.0+ installed, basic Blender navigation knowledge
**Time Required:** 1-2 hours
**Difficulty:** Intermediate

This guide walks through adding a steering wheel (helm), 4 cannons, and sail rigging lines to the existing `ship1.blend` model.

## Prerequisites

- Blender 3.0 or newer installed
- Existing `client/assets/blender/ship1.blend` from s6r-ship-sprite-rendering
- Basic Blender knowledge (navigation, object creation, materials)

## Overview

We'll add three sets of elements:
1. **Helm (steering wheel)** at stern (x=-54, y=0)
2. **4 Cannons** at specific positions (2 port, 2 starboard)
3. **6 Rigging lines** from mast to sails

All elements use simple geometric primitives (cubes, cylinders) to maintain the blocky voxel aesthetic.

---

## Part 1: Setup

### Step 1: Open Existing Model

1. Launch Blender
2. File → Open → Navigate to `/Users/rj/Git/rjcorwin/seacat/client/assets/blender/ship1.blend`
3. Click "Open"

You should see the existing ship model with hull, deck, mast, and sails.

### Step 2: Verify Ship Object

1. Ensure the main ship is selected (click on it if not)
2. In Outliner (top-right), confirm object is named **"Ship"** (required by render script)
3. Object should be at world origin (0, 0, 0) with 0° rotation

### Step 3: Understand Coordinate System

The ship faces **east** (positive X direction) at rotation 0:
- **+X**: Forward (bow)
- **-X**: Backward (stern)
- **+Y**: Starboard (right side)
- **-Y**: Port (left side)
- **+Z**: Up

### Step 4: Switch to Top View

1. Press **Numpad 7** (top orthographic view)
2. Or: View menu → Viewpoint → Top
3. This makes positioning elements easier

### Step 5: Create Material Palette

We'll need 3 materials:

**Material 1: Dark Wood (Helm)**
1. In Properties panel (right), click Material Properties (sphere icon)
2. Click "+ New" to create material
3. Name it "DarkWood_Helm"
4. Set Base Color to RGB (101, 67, 33) or hex #654321
5. Set Metallic to 0.0, Roughness to 0.8

**Material 2: Dark Metal (Cannons)**
1. Click "+" again to add another material slot
2. Click "+ New"
3. Name it "DarkMetal_Cannon"
4. Set Base Color to RGB (74, 74, 74) or hex #4A4A4A
5. Set Metallic to 0.7, Roughness to 0.3

**Material 3: Rope Brown (Rigging)**
1. Click "+" again
2. Click "+ New"
3. Name it "Rope_Rigging"
4. Set Base Color to RGB (139, 115, 85) or hex #8B7355
5. Set Metallic to 0.0, Roughness to 1.0

---

## Part 2: Add Helm (Steering Wheel)

### Step 1: Create Wheel Hub

1. Press **Shift + A** → Mesh → Cylinder
2. In the operator panel (bottom-left after creating):
   - Vertices: 16
   - Radius: 2 (Blender units = 2 pixels)
   - Depth: 1
3. Press **Tab** to enter Edit Mode
4. Press **S** (scale), **Z** (constrain to Z-axis), **0.5** → **Enter**
5. Press **Tab** to exit Edit Mode

### Step 2: Position Hub

1. Press **G** (grab/move)
2. Type: **X -54** → **Enter** (move to stern)
3. Press **G** again
4. Type: **Z 10** → **Enter** (raise above deck)

### Step 3: Create Wheel Spokes

We'll create 6 spokes radiating from the hub.

**Spoke 1 (pointing forward, 0°):**
1. Press **Shift + A** → Mesh → Cube
2. Press **S** (scale), **X** (X-axis), **0.1** → **Enter** (thin width)
3. Press **S**, **Y**, **3** → **Enter** (length 6 pixels)
4. Press **S**, **Z**, **0.1** → **Enter** (thin height)
5. Press **G**, **X -54** → **Enter**
6. Press **G**, **Y 3** → **Enter** (offset from center)
7. Press **G**, **Z 10** → **Enter** (match hub height)

**Spokes 2-6 (duplicate and rotate):**
1. With spoke selected, press **Shift + D** (duplicate) → **Enter**
2. Press **R** (rotate), **Z** (around Z-axis), **60** → **Enter**
3. Repeat steps 1-2 four more times (total 6 spokes at 60° intervals)

### Step 4: Create Wheel Rim

We'll approximate a rim with 6 small cubes at spoke ends.

1. Press **Shift + A** → Mesh → Cube
2. Press **S**, **0.6** → **Enter** (small connector cube)
3. Position at end of first spoke (approximately x=-54, y=6, z=10)
4. Duplicate 5 more times and rotate around Z-axis by 60° each

**Alternative (cleaner):** Use a torus:
1. Press **Shift + A** → Mesh → Torus
2. Major Radius: 6, Minor Radius: 0.5
3. Position at x=-54, z=10
4. Rotate 90° around X-axis: Press **R**, **X**, **90** → **Enter**

### Step 5: Create Wheel Post

1. Press **Shift + A** → Mesh → Cylinder
2. Vertices: 8, Radius: 1, Depth: 8
3. Position at x=-54, y=0, z=6 (halfway between deck and wheel)

### Step 6: Join Wheel Elements

1. Select hub (click)
2. Hold **Shift** and click each spoke, rim piece, and post
3. Press **Ctrl + J** (join)
4. Name object "Helm_Wheel" in Outliner

### Step 7: Apply Material

1. Select Helm_Wheel object
2. In Material Properties, click material slot
3. Select "DarkWood_Helm" from dropdown
4. Or click "+" and assign material

### Step 8: Test Visibility

1. Switch to camera view: Press **Numpad 0**
2. Press **F12** to render a test frame
3. Verify wheel is visible near stern

---

## Part 3: Add Cannons (4 total)

We'll create one cannon, then duplicate it 3 times.

### Step 1: Create Cannon Barrel

1. Press **Shift + A** → Mesh → Cylinder
2. Settings:
   - Vertices: 16
   - Radius: 2 (diameter = 4 pixels)
   - Depth: 12 (length = 12 pixels)
3. Press **R** (rotate), **Y** (around Y-axis), **90** → **Enter**
   - This makes cylinder horizontal along X-axis
4. Position: Press **G**, type **X -10**, **Y -24**, **Z 4** → **Enter**
   - This places it at port mid-ship position
5. Rotate to point perpendicular: Press **R**, **Z**, **90** → **Enter**
   - Now barrel points outward from ship (perpendicular)

### Step 2: Create Cannon Carriage

1. Press **Shift + A** → Mesh → Cube
2. Press **S** (scale), **X**, **0.6** → **Enter** (width 6 pixels)
3. Press **S**, **Y**, **0.8** → **Enter** (depth 8 pixels)
4. Press **S**, **Z**, **0.3** → **Enter** (height 3 pixels)
5. Position behind barrel: Press **G**, type **X -10**, **Y -20**, **Z 2** → **Enter**

### Step 3: Join Cannon Parts

1. Select barrel (click it)
2. Shift-click carriage
3. Press **Ctrl + J** (join)
4. Name object "Cannon_Port_Mid" in Outliner

### Step 4: Apply Cannon Material

1. Select Cannon_Port_Mid
2. Material Properties → Select "DarkMetal_Cannon"

### Step 5: Duplicate for Port Forward

1. With cannon selected, press **Shift + D** (duplicate)
2. Press **X** (constrain to X-axis), type **30** → **Enter**
   - Moves from x=-10 to x=20
3. Rename to "Cannon_Port_Forward"

### Step 6: Duplicate for Starboard Cannons

**Starboard Mid:**
1. Select Cannon_Port_Mid
2. Press **Shift + D** (duplicate)
3. Press **Y**, type **48** → **Enter**
   - Moves from y=-24 to y=24 (opposite side)
4. Press **R** (rotate), **Z**, **180** → **Enter**
   - Flips cannon to point outward on starboard side
5. Rename to "Cannon_Starboard_Mid"

**Starboard Forward:**
1. Select Cannon_Port_Forward
2. Press **Shift + D**, **Y**, **48** → **Enter**
3. Press **R**, **Z**, **180** → **Enter**
4. Rename to "Cannon_Starboard_Forward"

### Step 7: Verify Cannon Positions

In Top View (Numpad 7), verify:
- Port cannons point left (negative Y direction)
- Starboard cannons point right (positive Y direction)
- All cannons are at approximately same Z-height (deck level)

### Step 8: Test Render

1. Press **Numpad 0** (camera view)
2. Press **F12** (render)
3. Verify all 4 cannons are visible protruding from ship sides

---

## Part 4: Add Rigging Lines

We'll create thin cylindrical ropes connecting the mast to sail corners.

### Step 1: Identify Attachment Points

You'll need to note the world coordinates of:
- **Mast top:** Approximately (x=0, y=0, z=mast_height)
- **Mast mid:** Approximately (x=0, y=0, z=mast_height/2)
- **Sail corners:** Front-top, front-bottom, rear-top, rear-bottom

**Tip:** In Edit Mode, select a vertex and check its coordinates in Transform properties (right panel).

### Step 2: Create First Rigging Line (Fore-Stay)

**Line from mast top to sail front-top corner:**

1. Press **Shift + A** → Mesh → Cylinder
2. Settings:
   - Vertices: 8 (low-poly for thin line)
   - Radius: 0.4 (diameter ≈ 0.8 pixels)
   - Depth: 20 (approximate - we'll adjust)
3. Position at mast base: Press **G**, type **X 0**, **Y 0**, **Z 5** → **Enter**
4. Rotate to angle toward sail: Press **R**, **Y**, **30** → **Enter** (adjust angle as needed)
5. Scale length to reach sail corner: Press **S**, **Z**, **1.2** → **Enter** (adjust as needed)

**Easier method using cursor:**
1. Place 3D cursor at mast top: Press **Shift + S** → Cursor to Selected
2. Add cylinder: **Shift + A** → Cylinder
3. In Edit Mode, move one end to sail corner coordinates
4. In Object Mode, Origin to Geometry: Object menu → Set Origin → Origin to Geometry

### Step 3: Create Remaining 5 Lines

Repeat the process for:

1. **Mast mid → Sail front-bottom:** Line from center of mast to bottom-front of sail
2. **Mast top → Sail rear-top:** Line from mast top to back-top of sail
3. **Mast mid → Sail rear-bottom:** Line from mast center to back-bottom of sail
4. **Mast mid → Sail left edge:** (Optional) lateral support
5. **Mast mid → Sail right edge:** (Optional) lateral support

### Step 4: Name Rigging Objects

In Outliner, name each line:
- "Rigging_Fore_Stay"
- "Rigging_Fore_Sheet"
- "Rigging_Aft_Stay"
- "Rigging_Aft_Sheet"
- "Rigging_Port_Sheet"
- "Rigging_Starboard_Sheet"

### Step 5: Apply Rigging Material

1. Select all rigging lines: Click first, then **Shift-click** others
2. Material Properties → Select "Rope_Rigging"

### Step 6: Join Rigging (Optional)

To simplify:
1. Select all rigging lines
2. Press **Ctrl + J** (join into single object)
3. Name "Rigging_Lines"

### Step 7: Test Visibility

1. Press **Numpad 0** (camera view)
2. Zoom in if needed: **Scroll wheel**
3. Press **F12** (render)
4. Verify rigging lines are visible (thin brown lines)
5. If too thick/thin, select rigging and scale: **S**, **0.8** or **1.2** → **Enter**

---

## Part 5: Final Adjustments

### Step 1: Parent Objects to Ship

To ensure all elements rotate with the ship:

1. Select Helm_Wheel
2. **Shift-click** Ship object (in Outliner or 3D view)
3. Press **Ctrl + P** (set parent) → Object (Keep Transform)
4. Repeat for all cannon objects and rigging

### Step 2: Verify Object Hierarchy

In Outliner, check:
```
Ship (main object)
├─ Helm_Wheel
├─ Cannon_Port_Mid
├─ Cannon_Port_Forward
├─ Cannon_Starboard_Mid
├─ Cannon_Starboard_Forward
└─ Rigging_Lines
```

### Step 3: Test Rotation

1. Select Ship object
2. Press **R** (rotate), **Z** (Z-axis), **45** → **Enter**
3. Verify all elements rotate with ship
4. Press **Ctrl + Z** (undo) to reset

### Step 4: Check Object Names

Render script looks for object named **"Ship"**:
1. In Outliner, verify main object is named exactly "Ship"
2. If not, rename it: Double-click name → type "Ship"

### Step 5: Save File

1. File → Save (or **Ctrl + S**)
2. Confirm save to `client/assets/blender/ship1.blend`

---

## Part 6: Render & Test

### Step 1: Render Single Test Frame

From Blender:
1. Press **Numpad 0** (camera view)
2. Adjust camera if needed: Select camera, press **G** / **R** to reposition
3. Press **F12** (render)
4. Check:
   - Helm visible near stern
   - 4 cannons visible on sides
   - Rigging lines connecting mast to sails
   - Good contrast/visibility

### Step 2: Render All 64 Frames

From terminal (in project root):

```bash
blender client/assets/blender/ship1.blend \
  --background \
  --python client/scripts/render-ship-frames.py
```

**Wait time:** ~90-120 seconds

**Output:** 64 PNG files in `client/assets/sprites/ship_frames/`

### Step 3: Assemble Sprite Sheet

From terminal:

```bash
cd client
./scripts/assemble-sprite-sheet.sh
```

**Output:** `client/assets/sprites/ship1.png` (2048×2048, 8×8 grid)

**Verify:**
```bash
ls -lh assets/sprites/ship1.png
# Should be ~1.1-1.2 MB
```

### Step 4: Test In-Game

1. Build client:
   ```bash
   cd client
   npm run build
   ```

2. Start server (in another terminal):
   ```bash
   cd server
   npm start
   ```

3. Start client:
   ```bash
   cd client
   npm start
   ```

4. In-game verification:
   - Look for helm wheel at stern when near wheel control point
   - Look for cannons on sides when near cannon control points
   - Rotate ship full 360° to check all frames
   - Verify rigging lines connect mast to sails

---

## Troubleshooting

### Helm Wheel Not Visible

**Issue:** Wheel doesn't show up in render.

**Fixes:**
- Check wheel position: Should be at x=-54, y=0, z=~10
- Verify wheel is parented to Ship object
- Check material is assigned
- Ensure wheel is not hidden (eye icon in Outliner)
- Verify camera can see stern angle

### Cannons Clipping Through Hull

**Issue:** Cannons intersect ship geometry incorrectly.

**Fixes:**
- Adjust Y-position to be exactly at deck edge (y=±24)
- Move cannons slightly outward if needed (y=±26)
- Check Z-height is above deck (z=3-4)
- Rotate to ensure barrel points perpendicular

### Rigging Lines Too Thick/Thin

**Issue:** Lines dominate sprite or are invisible.

**Fixes:**
- Too thick: Select rigging, press **S**, **0.7** → **Enter** (scale down)
- Too thin: Press **S**, **1.3** → **Enter** (scale up)
- Target: 0.5-1 pixel when rendered (0.4-0.8 Blender radius)

### Render Script Fails

**Issue:** `render-ship-frames.py` errors out.

**Fixes:**
- Verify ship object named exactly "Ship" (case-sensitive)
- Check Blender version 3.0+
- Run from project root directory
- Check Python script path: `client/scripts/render-ship-frames.py`

### Sprite Sheet Assembly Fails

**Issue:** `assemble-sprite-sheet.sh` errors.

**Fixes:**
- Install ImageMagick: `brew install imagemagick` (macOS)
- Verify 64 frames exist: `ls client/assets/sprites/ship_frames/*.png | wc -l` (should be 64)
- Check script permissions: `chmod +x client/scripts/assemble-sprite-sheet.sh`

### Elements Misaligned with Control Points

**Issue:** Visual elements don't match control point positions in-game.

**Fixes:**
- Double-check coordinates in Blender match server config exactly
- Helm: x=-54, y=0
- Cannons: Port (y=-24), Starboard (y=24)
- Verify ship origin is at (0,0,0) in Blender
- Check no unintended rotations on Ship object

---

## Tips & Best Practices

1. **Save often:** Press **Ctrl + S** frequently
2. **Use layers/collections:** Organize helm, cannons, rigging into collections for easy management
3. **Test render early:** Press **F12** frequently to check progress
4. **Iterate:** Start with basic shapes, refine after seeing test render
5. **Match aesthetic:** Keep elements blocky/voxel-style like existing ship
6. **Contrast matters:** Dark elements show better against light deck
7. **Parenting:** Always parent new objects to Ship for correct rotation
8. **Backup:** Keep a copy of original `ship1.blend` before major changes

---

## Reference Coordinates

Quick reference for positioning:

| Element | X | Y | Z | Notes |
|---------|---|---|---|-------|
| Helm wheel | -54 | 0 | 10 | Stern, centerline, elevated |
| Cannon port mid | -10 | -24 | 4 | Mid-ship, port side |
| Cannon port forward | 20 | -24 | 4 | Forward, port side |
| Cannon starboard mid | -10 | 24 | 4 | Mid-ship, starboard |
| Cannon starboard forward | 20 | 24 | 4 | Forward, starboard |
| Mast base | 0 | 0 | 0 | Center of ship |
| Mast top | 0 | 0 | ~20-30 | (Check existing mast height) |

---

## Next Steps

After completing this guide:
1. Review rendered sprite sheet for quality
2. Test in-game to verify alignment
3. Document any issues or deviations in proposal
4. Update CHANGELOG.md with implementation status
5. Consider future enhancements (animated elements, additional details)

---

## Additional Resources

- **Original s6r guide:** `spec/proposals/s6r-ship-sprite-rendering/BLENDER_GUIDE.md`
- **Blender docs:** https://docs.blender.org/manual/en/latest/
- **Blender hotkeys:** https://docs.blender.org/manual/en/latest/interface/keymap/introduction.html
- **Proposal:** `spec/proposals/s2e-ship-enhancements/proposal.md`

---

**Questions or issues?** Check the Troubleshooting section or refer back to the proposal for design specifications.
