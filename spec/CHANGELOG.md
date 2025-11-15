# Seacat Specification Changelog

All notable changes to the Seacat game specification and implementation will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **m3d-multi-steamdeck-deploy**: Deploy to multiple Steam Deck devices with a single command
  - Status: Draft (proposal created 2025-11-14)
  - Configuration file (`steamdeck-hosts.txt`) to specify target devices
  - Deploy to all listed devices sequentially from one command
  - Clear success/failure feedback per device
  - Resilient deployment (continues on partial failure)
  - Backward compatible (still works with single device)
  - Build once, deploy to all devices (efficient workflow)
  - Git-ignored personal config with committed example template
  - Enables rapid multi-player testing across multiple physical devices
  - See proposal: `spec/proposals/m3d-multi-steamdeck-deploy/`
  - See research: `spec/proposals/m3d-multi-steamdeck-deploy/research.md`

- **h2c-human-cannonball**: Load yourself into ship cannons and launch across the map
  - Status: Done (implemented 2025-11-13)
  - Players can cycle ammunition (Tab/LB/RB) to select human cannonball mode
  - Launch yourself as projectile with same aim/elevation controls as cannonballs
  - Player sprite visible during flight (not green circle)
  - Camera follows player during 2-3 second flight
  - Auto-board ships on deck landing, water splash on water landing
  - Out of bounds safety: respawn on source ship
  - Reuses 3D projectile physics (gravity, trajectory) with identical server/client simulation
  - Network protocol: `game/projectile_spawn` with `type: 'human_cannonball'` and `playerId`
  - Client-side landing detection (ship OBB collision, bounds checking)
  - Primary use case: Fast traversal and boarding enemy ships from above
  - See proposal: `spec/proposals/h2c-human-cannonball/`
  - See implementation: `spec/proposals/h2c-human-cannonball/implementation.md`

- **s2e-ship-enhancements**: Add helm, cannons, and rigging to ship sprite
  - Status: Draft (proposal created 2025-11-09)
  - Adds steering wheel (helm) at stern (x=-54, y=0)
  - Adds 4 cannons on port/starboard sides (positions from server config)
  - Adds 6 rigging lines connecting mast to sails
  - Maintains blocky/voxel Minecraft aesthetic from s6r
  - Uses existing Blender render pipeline (64 frames, 256×256 each)
  - Provides visual feedback for control point interactions
  - Enhances nautical authenticity and game readability
  - See proposal: `spec/proposals/s2e-ship-enhancements/`

- **c9v-crowsnest-viewport**: Expanded viewport when in crow's nest
  - Status: Done
  - Increases draw distance from 35 to 55 tiles when climbing mast (57% more area)
  - Provides strategic lookout advantage for navigation and combat
  - Automatic viewport switching on mast grab/release
  - Maintains 60 FPS performance with larger culling area
  - Seamless integration with existing diamond viewport system
  - Client-side only (no server sync required)
  - See proposal: `spec/proposals/c9v-crowsnest-viewport/`

- **b8s-cannonball-shadows**: Ground-level shadows for cannonball projectiles
  - Status: Done
  - Dynamic shadows that scale with projectile height
  - Improves depth perception and trajectory prediction
  - Uses simple ellipse graphics (no assets required)
  - Shadows positioned at ground level using isometric projection
  - Size and opacity decrease as cannonballs rise (6px→2px, 40%→10%)
  - Linear interpolation based on height (MAX_HEIGHT = 200px)
  - Integrated with diamond viewport culling
  - See proposal: `spec/proposals/b8s-cannonball-shadows/`

- **s8m-shimmer-particles**: Animated underwater shimmer particle system
  - Status: Done
  - Programmatic shimmer particles replace static background dots
  - 200 animated particles with smooth sine wave twinkling
  - Constrained to water area (below 190px horizon line)
  - Time-based animation for frame-rate independence
  - Configurable particle count, size, speed, and opacity
  - Automatically repositions on window resize
  - See proposal: `spec/seacat/proposals/s8m-shimmer-particles/`

- **v9d-debug-visualization**: Debug mode for development visualizations
  - Status: Done
  - `DEBUG_MODE` constant in `Constants.ts` to toggle debug visualizations
  - Ship boundary boxes now only shown when `DEBUG_MODE = true`
  - Grabbable point indicators now only shown when `DEBUG_MODE = true`
  - Cleaner production visuals while maintaining debugging capabilities
  - See proposal: `spec/seacat/proposals/v9d-debug-visualization/`

## Prior Changes

All prior changes were tracked in commit history and individual proposal documents.
See `spec/seacat/proposals/` for historical proposals and their implementation details.
