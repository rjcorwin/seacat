# Decision: Cannon Loading Interaction Design

**Status:** Accepted
**Date:** 2025-11-11
**Deciders:** Project maintainers
**Proposal:** h2c-human-cannonball
**Decision:** Option 2 (Cycle Ammunition)

## Context

Players need a way to choose between two different cannon "ammunition" types:
1. **Cannonballs** - Standard projectiles for ship combat
2. **Human Cannonball** - Player becomes the projectile for traversal

Both use identical workflow after loading:
- Aim with arrow keys (horizontal + elevation)
- Fire with Space bar
- 4-second cooldown after firing

The question is: **How should players select which ammunition type to load?**

## Decision Drivers

- **Discoverability** - Players should understand the mechanic without a tutorial
- **Avoid Accidents** - Launching yourself should be deliberate, not accidental
- **Muscle Memory** - Should feel natural and consistent with existing controls
- **Single Player Support** - Should work solo (not require crew coordination)
- **UI Simplicity** - Minimize on-screen prompts and button hints
- **Future Extensibility** - May add more ammunition types later (chain shot, grape shot, etc.)
- **Controller-Friendly** - Must work well with Xbox gamepad (primary input method)

## Options Considered

### Option 1: Separate Buttons (Current Proposal)

**Keyboard:**
- `E` near cannon → Grab cannon control (loads cannonball)
- `F` near cannon → Load yourself (human cannonball mode)
- Arrow keys → Aim
- Space → Fire
- `E` again → Release control

**Xbox Controller:**
- `A` button near cannon → Grab cannon control (loads cannonball)
- `X` button near cannon → Load yourself (human cannonball mode)
- Right stick → Aim
- `RT` (Right Trigger) → Fire
- `B` button → Release control

**Pros:**
- ✅ Clear intent - different actions use different buttons
- ✅ Hard to accidentally launch yourself
- ✅ Mirrors existing A button pattern (grab control points)
- ✅ Simple state machine (not controlling vs controlling)
- ✅ No UI needed beyond proximity indicators
- ✅ **Controller: X button is standard "alternate action" in many games**
- ✅ **Controller: Face buttons (A/X) are easy to reach**

**Cons:**
- ❌ Uses two bindings for similar actions
- ❌ Not obvious that F/X is for human cannonball (needs icon hint)
- ❌ Doesn't extend well to 3+ ammunition types
- ❌ Requires different proximity indicators for each action
- ❌ **Controller: Uses up precious X button (only 4 face buttons available)**

**Edge Cases:**
- If someone else controls cannon, F/X still works (loads you into their aimed cannon)
- Can't load yourself if cannon is on cooldown

---

### Option 2: Cycle Ammunition

**Keyboard:**
- `E` near cannon → Grab cannon control
- `Tab` or `1/2/3` → Cycle ammunition type (cannonball, human, future types)
- Arrow keys → Aim
- Space → Fire current ammunition
- `E` again → Release control

**Xbox Controller:**
- `A` button near cannon → Grab cannon control
- `LB/RB` (Bumpers) → Cycle ammunition type
- Right stick → Aim
- `RT` → Fire current ammunition
- `B` button → Release control

**Pros:**
- ✅ Single "grab" action (familiar E/A button)
- ✅ Extends naturally to multiple ammunition types
- ✅ UI can show current ammo type (icon + name)
- ✅ Muscle memory: Tab/bumpers cycle like weapon switching in shooters
- ✅ Number keys allow direct selection on keyboard (faster)
- ✅ **Controller: Bumpers are PERFECT for cycling (used in every shooter)**
- ✅ **Controller: Doesn't consume extra face buttons**
- ✅ **Controller: Very discoverable (bumpers naturally = "switch")**

**Cons:**
- ❌ Extra step required (grab, then cycle, then aim, then fire)
- ❌ Requires UI indicator for current ammunition type
- ❌ Accidentally launching yourself is possible (cycle too far)
- ❌ Can't load yourself if someone else controls cannon
- ⚠️ **Controller: Bumpers might be used for other functions (sail adjustment?)**

**Edge Cases:**
- What's the default ammunition when you grab? (Probably cannonball)
- Does ammunition persist if you release and re-grab? (Probably reset to cannonball)

---

### Option 3: Context Menu

**Keyboard:**
- `E` near cannon → Opens radial menu or list
  - "Fire Cannonball"
  - "Load Yourself"
  - (Future: other ammo types)
- Arrow keys or mouse → Select option
- Enter/click → Enter aiming mode
- Arrow keys → Aim
- Space → Fire

**Xbox Controller:**
- `A` button near cannon → Opens radial menu
- Left stick or D-pad → Highlight option
- `A` button → Confirm selection, enter aiming mode
- Right stick → Aim
- `RT` → Fire

**Pros:**
- ✅ Explicit choice - no ambiguity
- ✅ Extends perfectly to many ammunition types
- ✅ Self-documenting (menu shows all options)
- ✅ Can show unavailable options (e.g., "Fire Cannonball (on cooldown)")
- ✅ **Controller: Radial menus work GREAT with analog sticks (see GTA V)**

**Cons:**
- ❌ Slow workflow (extra menu navigation step)
- ❌ Breaks flow of fast-paced gameplay
- ❌ Requires UI system for radial/list menus
- ❌ Takes player out of game world
- ❌ **Controller: Radial menus require significant UI work**
- ❌ **Controller: Accidental selections possible with stick drift**

**Edge Cases:**
- Menu could show who's currently controlling cannon
- Could show cooldown timers in menu

---

### Option 4: Hold Modifier Button

**Keyboard:**
- `E` near cannon → Grab cannon (loads cannonball)
- `Shift+E` near cannon → Load yourself (human cannonball)
- Arrow keys → Aim
- Space → Fire
- `E` again → Release control

**Xbox Controller:**
- `A` button near cannon → Grab cannon (loads cannonball)
- `LB+A` or `RB+A` near cannon → Load yourself
- Right stick → Aim
- `RT` → Fire
- `B` button → Release control

**Pros:**
- ✅ Single primary keybind (E/A)
- ✅ Modifier signals "special variant"
- ✅ Hard to accidentally trigger (requires two buttons)
- ✅ Common pattern in games (Shift/Bumper = alternate action)
- ✅ **Controller: LB+A is common pattern (e.g., sprint-action combos)**

**Cons:**
- ❌ Not immediately discoverable (how do you learn about modifier combos?)
- ❌ Doesn't extend to 3+ ammunition types
- ❌ Modifier keys/buttons can be awkward
- ❌ Breaks accessibility for players who can't press two buttons simultaneously
- ❌ **Controller: Two-button combos are uncomfortable (thumb + index finger)**
- ❌ **Controller: LB/RB might already be used for other actions**

**Edge Cases:**
- What if you press modifier+button while already controlling cannon? (Switch to human mode?)

---

### Option 5: Sequential Actions (Grab, Then Choose)

**Keyboard:**
- `E` near cannon → Grab cannon control (no ammo loaded yet)
- `Space` → Load cannonball, enter aiming mode
- `F` → Load yourself, enter aiming mode
- Arrow keys → Aim
- Space → Fire
- `E` → Release control

**Xbox Controller:**
- `A` button near cannon → Grab cannon control (no ammo loaded yet)
- `RT` → Load cannonball, enter aiming mode
- `X` button → Load yourself, enter aiming mode
- Right stick → Aim
- `RT` → Fire
- `B` → Release control

**Pros:**
- ✅ Separates "grab control" from "choose ammunition"
- ✅ Both Space/RT and F/X are available while controlling
- ✅ Can switch ammunition without releasing control
- ✅ Logical flow: grab → load → aim → fire

**Cons:**
- ❌ Awkward that Space/RT is used twice (load cannonball AND fire)
- ❌ Requires state tracking (grabbed but not loaded)
- ❌ Extra step slows down combat
- ❌ UI needs to show "Press RT to load cannonball OR X to load yourself"
- ❌ **Controller: RT doing double-duty is very confusing**
- ❌ **Controller: Still consumes precious X button**

**Edge Cases:**
- Can you aim before loading? (Probably yes, aim is just visual)
- Can you switch ammo after loading but before firing? (Probably yes)

---

### Option 6: Separate Interaction Points

**Keyboard:**
- Cannon has two "hotspots":
  - **Side of cannon**: `E` → Grab cannon control (fires cannonballs)
  - **Muzzle of cannon**: `F` → Load yourself into muzzle
- Rest of workflow identical

**Xbox Controller:**
- Cannon has two "hotspots":
  - **Side of cannon**: `A` → Grab cannon control (fires cannonballs)
  - **Muzzle of cannon**: `X` → Load yourself into muzzle
- Rest of workflow identical

**Pros:**
- ✅ Spatially intuitive (muzzle = where you'd climb in)
- ✅ Clear visual distinction (two indicators at different positions)
- ✅ Hard to accidentally trigger wrong action
- ✅ Doesn't require cycling or menus
- ✅ **Controller: Works same as keyboard (no special considerations)**

**Cons:**
- ❌ Requires precise positioning (muzzle is small target)
- ❌ Cluttered UI (two indicators near same object)
- ❌ Doesn't extend to multiple ammunition types
- ❌ Weird if someone else is controlling (can you climb in their cannon?)
- ❌ **Controller: Analog stick movement less precise (harder to hit muzzle hotspot)**

**Edge Cases:**
- What if muzzle is pointing away from you? (Still allow interaction?)
- If ship is moving, muzzle hotspot moves too (hard to hit)

---

### Option 7: Auto-Detect Intent (Context-Sensitive Button)

**Keyboard:**
- `E` near cannon:
  - **If cannon is uncontrolled** → Grab control (loads cannonball)
  - **If someone else is controlling** → Load yourself into their cannon
- Arrow keys → Aim (if you grabbed control)
- Space → Fire
- `E` again → Release control

**Xbox Controller:**
- `A` button near cannon:
  - **If cannon is uncontrolled** → Grab control (loads cannonball)
  - **If someone else is controlling** → Load yourself into their cannon
- Right stick → Aim (if you grabbed control)
- `RT` → Fire
- `B` → Release control

**Pros:**
- ✅ Single keybind/button for everything
- ✅ Context-aware (game figures out intent)
- ✅ Encourages crew coordination (gunner + passenger)
- ✅ Simple UI (one indicator: "Press E" or "Press A")
- ✅ **Controller: Doesn't consume extra buttons**

**Cons:**
- ❌ Ambiguous in solo play (always grabs control, never loads yourself)
- ❌ Can't load yourself into uncontrolled cannon
- ❌ Hard to discover (requires seeing someone else at cannon first)
- ❌ Doesn't support solo human cannonball (major problem!)
- ❌ **Controller: Same issues as keyboard (no benefit from gamepad)**

**Edge Cases:**
- What if two players press button simultaneously? (Both try to grab control)

---

### Option 8: Unified Ammunition System (Inventory-Based)

**Keyboard:**
- Walk near cannon with `E` → Grab control
- Ammunition is selected from player inventory (1/2/3 keys or Tab)
- Current inventory item determines what fires
- Space → Fire current inventory item (if it's a projectile type)

**Xbox Controller:**
- Walk near cannon with `A` → Grab control
- Ammunition is selected from player inventory (D-pad or bumpers)
- Current inventory item determines what fires
- `RT` → Fire current inventory item (if it's a projectile type)

**Pros:**
- ✅ Unified with future inventory system
- ✅ Extends to many item types (not just ammo)
- ✅ Players can carry limited "human cannonball tokens"
- ✅ Could enable ammo crafting, trading, etc.
- ✅ **Controller: D-pad is perfect for inventory selection**

**Cons:**
- ❌ Requires entire inventory system (huge scope)
- ❌ Overcomplicated for simple mechanic
- ❌ Doesn't make sense ("carrying yourself as inventory item"?)
- ❌ Not viable for initial implementation
- ❌ **Controller: D-pad might be used for other functions**

**Edge Cases:**
- What if you're out of "human cannonball tokens"?

---

## Comparison Matrix

| Criteria | Option 1 (Separate) | Option 2 (Cycle) | Option 3 (Menu) | Option 4 (Modifier) | Option 5 (Sequential) | Option 6 (Spatial) | Option 7 (Auto) | Option 8 (Inventory) |
|----------|----------|----------|---------|----------|----------|----------|----------|----------|
| Discoverability | ⚠️ Medium | ✅ High | ✅ High | ❌ Low | ⚠️ Medium | ✅ High | ❌ Low | ❌ Low |
| Avoid Accidents | ✅ High | ⚠️ Medium | ✅ High | ✅ High | ⚠️ Medium | ✅ High | ⚠️ Medium | ✅ High |
| Muscle Memory | ✅ Good | ✅ Good | ❌ Poor | ✅ Good | ⚠️ OK | ⚠️ OK | ✅ Good | ❌ Poor |
| Solo Support | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| UI Simplicity | ✅ Simple | ⚠️ Needs indicator | ❌ Complex | ✅ Simple | ⚠️ Needs text | ⚠️ Two indicators | ✅ Simple | ❌ Complex |
| Extensibility (3+ types) | ❌ Poor | ✅ Excellent | ✅ Excellent | ⚠️ OK | ⚠️ OK | ❌ Poor | ❌ Poor | ✅ Excellent |
| **Controller-Friendly** | ⚠️ **OK** | ✅ **Excellent** | ✅ **Good** | ❌ **Poor** | ❌ **Poor** | ⚠️ **OK** | ⚠️ **OK** | ✅ **Good** |
| Implementation Complexity | ✅ Low | ⚠️ Medium | ❌ High | ✅ Low | ⚠️ Medium | ⚠️ Medium | ✅ Low | ❌ Very High |

## Recommended Decision

**✅ ACCEPTED: Option 2 (Cycle Ammunition with LB/RB Bumpers)**

This decision was made based on:
1. Primary input method is Xbox controller
2. LB/RB bumpers are industry standard for weapon/item switching
3. Extends naturally to 3+ ammunition types
4. Doesn't consume precious face buttons (X/Y remain available)
5. Provides foundation for future inventory system

## Controller Design Considerations

Since this game is **primarily played with Xbox controllers**, the chosen design must feel natural with a gamepad:

### Best Controller Options

**🥇 Option 2 (Cycle with Bumpers):**
- LB/RB bumpers are the *standard* way to switch weapons/items in controller games
- Doesn't consume precious face buttons (A/B/X/Y)
- Extends naturally to 3+ ammo types
- Players expect bumpers to cycle/switch
- **This is how every shooter handles weapon switching on controller**

**🥈 Option 3 (Radial Menu):**
- Radial menus work beautifully with analog sticks (see GTA V, Assassin's Creed)
- Self-documenting (shows all options visually)
- Good for 3+ ammo types
- Slightly slower than bumper cycling

### Worst Controller Options

**❌ Option 4 (Modifier):**
- LB+A combos are uncomfortable (index finger + thumb simultaneously)
- Hard to press while also using right stick for aiming
- Not accessible-friendly

**❌ Option 5 (Sequential):**
- RT doing double-duty (load AND fire) is extremely confusing on controller
- Violates principle of "one button, one action"

### Controller Button Budget

**Available buttons on Xbox controller:**
- Face buttons: A, B, X, Y (only 4! very limited)
- Bumpers: LB, RB (perfect for cycling/switching)
- Triggers: LT, RT (usually aim/fire)
- D-pad: 4 directions (good for quick selects)
- Sticks: Left (movement), Right (aim)
- Start/Select: Menus/map

**Current game usage (estimated):**
- A = Interact/grab control points
- B = Cancel/back
- X = ? (available)
- Y = ? (available)
- LB/RB = ? (available, likely for sail adjustment)
- LT/RT = ? (likely fire when controlling cannon)
- D-pad = ? (available)

## Factors to Consider

1. **Game is primarily played with Xbox controller:**
   - **Best controller support** → Option 2 (Cycle with bumpers)
   - Good controller support → Option 3 (Radial menu)
   - Acceptable → Option 1 (Separate buttons, uses X button)
   - Poor controller support → Options 4, 5 (modifier/sequential combos)

2. **Are more ammunition types planned?**
   - If yes → Option 2 (Cycle) or Option 3 (Menu)
   - If no → Option 1 (Separate) is simpler but less future-proof

3. **How important is fast iteration in combat?**
   - Very important → Option 1 (instant), Option 2 (one bumper press)
   - Less important → Option 3 (menu navigation OK)

4. **What's the target audience?**
   - Casual players → Option 3 (Menu) is most discoverable
   - Experienced gamers → Option 2 (bumper cycling is universal)

5. **Is crew coordination a priority?**
   - Yes → Could combine Option 7 (Auto-Detect) with any other option
   - No → Options 1 or 2 support solo play best

6. **How much UI complexity is acceptable?**
   - Minimal → Option 1 (just proximity indicators)
   - Some complexity OK → Option 2 (ammo type indicator) or Option 3 (radial menu)

## Notes

- All options assume the same post-selection workflow (aim → fire → cooldown)
- Options 2, 3, 5, 8 could combine with Option 7 for crew coordination
- Keybindings can be remapped in settings (doesn't affect design choice)
- **Controller button layout must be considered first-class, not an afterthought**
- Bumpers (LB/RB) are industry standard for cycling/switching on controllers

## Author's Recommendation

Given that this game is **primarily played with Xbox controllers**, the author recommends:

**🎯 Option 2: Cycle Ammunition (LB/RB Bumpers)**

### Why Option 2 is best for controller-first design:

1. **Bumpers are THE standard** for weapon/item switching in every controller game
2. **Doesn't waste face buttons** (X/Y remain available for other features)
3. **Extends naturally** to future ammo types (chain shot, grape shot, etc.)
4. **Discoverable** - players instinctively try bumpers for switching
5. **Fast** - one bumper press to toggle between cannonball and human
6. **Keyboard still works well** - Tab is also standard for switching weapons

### Implementation path:
1. Phase 1: Two ammo types (cannonball, human) - cycle with LB/RB
2. Show ammo indicator UI (small icon + name at bottom of screen)
3. Phase 2+: Add more ammo types, bumpers cycle through all
4. Optional: Add D-pad for direct selection (D-pad up = cannonball, D-pad down = human)

### Alternative if extensibility not needed:

**Option 1: Separate Buttons (A to grab, X to load yourself)**
- Simpler implementation (no ammo state tracking)
- Faster (no cycling step)
- But wastes the X button permanently
- Doesn't extend to 3+ ammo types

## Next Steps

1. ✅ **Decision document created** (this file)
2. ✅ **Get feedback from maintainers** (controller-first design confirmed)
3. ✅ **Decide on preferred option** (Option 2 selected)
4. ✅ **Update proposal.md with chosen design** (completed)
5. ⏳ Create mockups showing controller button layout + UI
6. ⏳ Prototype in code to validate controller feel
7. ⏳ Playtest with Xbox controller (most important!)
8. ⏳ Implement Phase 1 (Ammunition Cycling System)
9. ⏳ Implement Phase 2 (Basic Human Cannonball Launch)
10. ⏳ Continue with remaining phases (3-6)
