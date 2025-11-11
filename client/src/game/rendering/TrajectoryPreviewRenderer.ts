import Phaser from 'phaser';
import { HUMAN_CANNONBALL_SPEED, TRAJECTORY_PREVIEW_SAMPLES } from '../utils/Constants.js';

/**
 * Renders trajectory preview arc for human cannonball launch (h2c-human-cannonball Phase 2)
 *
 * Shows a dotted arc indicating the predicted flight path and a landing marker.
 * Uses the same ballistic physics as the actual projectile for accuracy.
 */
export class TrajectoryPreviewRenderer {
  private readonly GRAVITY = 150; // px/s² (must match ProjectileManager and server)
  private dots: Phaser.GameObjects.Arc[] = [];
  private landingMarker: Phaser.GameObjects.Arc | null = null;

  constructor(private scene: Phaser.Scene) {
    // Create preview dots
    for (let i = 0; i < TRAJECTORY_PREVIEW_SAMPLES; i++) {
      const dot = this.scene.add.circle(0, 0, 3, 0xffff00, 0.7);
      dot.setDepth(10000); // Render above everything
      dot.setVisible(false);
      this.dots.push(dot);
    }

    // Create landing marker (red circle)
    this.landingMarker = this.scene.add.circle(0, 0, 8, 0xff0000, 0.8);
    this.landingMarker.setDepth(10000);
    this.landingMarker.setVisible(false);
  }

  /**
   * Show trajectory preview for human cannonball launch
   * @param spawnX - World X position where cannonball spawns
   * @param spawnY - World Y position where cannonball spawns
   * @param spawnZ - Height Z where cannonball spawns (in pixels above ground)
   * @param aimAngle - Horizontal aim angle (radians, relative to ship heading)
   * @param elevationAngle - Vertical aim angle (radians, 0 = horizontal, PI/2 = straight up)
   * @param shipRotation - Ship's current rotation (radians)
   */
  showTrajectory(
    spawnX: number,
    spawnY: number,
    spawnZ: number,
    aimAngle: number,
    elevationAngle: number,
    shipRotation: number
  ): void {
    // Calculate initial velocity (same as server logic)
    const absoluteAimAngle = shipRotation + aimAngle;
    const speed = HUMAN_CANNONBALL_SPEED;

    // 3D velocity components
    const horizontalSpeed = speed * Math.cos(elevationAngle);
    const verticalSpeed = speed * Math.sin(elevationAngle);

    // Ground plane velocity (isometric)
    const groundVx = horizontalSpeed * Math.cos(absoluteAimAngle);
    const groundVy = horizontalSpeed * Math.sin(absoluteAimAngle);

    // Simulate trajectory using same physics as ProjectileManager
    let groundX = spawnX;
    let groundY = spawnY;
    let heightZ = spawnZ;
    let heightVz = verticalSpeed;

    const deltaT = 0.05; // 50ms time step for smooth preview
    const maxSteps = 200; // Safety limit

    const trajectoryPoints: { x: number; y: number }[] = [];
    let landed = false;

    for (let step = 0; step < maxSteps && !landed; step++) {
      // Update position
      groundX += groundVx * deltaT;
      groundY += groundVy * deltaT;
      heightZ += heightVz * deltaT;
      heightVz -= this.GRAVITY * deltaT; // Apply gravity

      // Convert 3D to 2D screen position (isometric projection)
      const screenY = groundY - heightZ;

      trajectoryPoints.push({ x: groundX, y: screenY });

      // Check if landed (heightZ <= 0 and descending)
      if (heightZ <= 0 && heightVz < 0) {
        landed = true;
      }
    }

    // Sample points evenly along trajectory
    const totalPoints = trajectoryPoints.length;
    const step = Math.max(1, Math.floor(totalPoints / TRAJECTORY_PREVIEW_SAMPLES));

    for (let i = 0; i < this.dots.length; i++) {
      const pointIndex = i * step;
      if (pointIndex < totalPoints) {
        const point = trajectoryPoints[pointIndex];
        this.dots[i].setPosition(point.x, point.y);
        this.dots[i].setVisible(true);
      } else {
        this.dots[i].setVisible(false);
      }
    }

    // Show landing marker at final point
    if (trajectoryPoints.length > 0) {
      const landingPoint = trajectoryPoints[trajectoryPoints.length - 1];
      this.landingMarker!.setPosition(landingPoint.x, landingPoint.y);
      this.landingMarker!.setVisible(true);
    } else {
      this.landingMarker!.setVisible(false);
    }
  }

  /**
   * Hide trajectory preview
   */
  hideTrajectory(): void {
    this.dots.forEach(dot => dot.setVisible(false));
    if (this.landingMarker) {
      this.landingMarker.setVisible(false);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.dots.forEach(dot => dot.destroy());
    this.dots = [];
    if (this.landingMarker) {
      this.landingMarker.destroy();
      this.landingMarker = null;
    }
  }
}
