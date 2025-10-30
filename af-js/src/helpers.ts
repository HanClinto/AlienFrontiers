export const getGameWidth = (scene: Phaser.Scene) => {
  return scene.game.scale.width;
}

export const getGameHeight = (scene: Phaser.Scene) => {
  return scene.game.scale.height;
}

/**
 * Converts coordinates from iOS Cocos2D system (768x1024, bottom-left origin)
 * to Phaser system (1536x2048, top-left origin)
 * 
 * @param x - X coordinate in iOS system (0-768)
 * @param y - Y coordinate in iOS system (0-1024)
 * @returns Object with converted x and y coordinates
 */
export const convertFromIOSCoordinates = (x: number, y: number): { x: number, y: number } => {
  const IOS_WIDTH = 768;
  const IOS_HEIGHT = 1024;
  const SCALE_FACTOR = 2;
  
  // Scale X coordinate (simple multiplication)
  const phaserX = x * SCALE_FACTOR;
  
  // Scale and invert Y coordinate (Cocos2D: bottom-left origin, Phaser: top-left origin)
  const phaserY = (IOS_HEIGHT - y) * SCALE_FACTOR;
  
  return { x: phaserX, y: phaserY };
}

/**
 * Converts iOS child coordinates relative to a container positioned at the bottom
 * In iOS, children are positioned relative to container's anchor point (center by default)
 * When we use origin (0.5, 1) for the container in Phaser, we need to adjust Y coordinates
 * 
 * @param iosX - X coordinate in iOS system relative to container
 * @param iosY - Y coordinate in iOS system relative to container
 * @returns Object with scaled coordinates for Phaser container with bottom-center origin
 */
export const convertIOSChildCoordinates = (iosX: number, iosY: number): { x: number, y: number } => {
  const SCALE_FACTOR = 2;
  
  // Scale X coordinate (simple multiplication)
  const phaserX = iosX * SCALE_FACTOR;
  
  // In iOS, Y is relative to container center. In Phaser with origin(0.5, 1), 
  // Y=0 is at the bottom of the container. We need to negate Y to flip it.
  const phaserY = -iosY * SCALE_FACTOR;
  
  return { x: phaserX, y: phaserY };
}

/**
 * Converts a color from iOS format to web hex format
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns Hex color string
 */
export const colorToHex = (r: number, g: number, b: number): number => {
  return (r << 16) | (g << 8) | b;
}

/**
 * Player colors from the original game
 */
export const PLAYER_COLORS = [
  0x952034, // Red (Player 1)
  0x007226, // Green (Player 2)
  0x005A96, // Blue (Player 3)
  0xFFC200, // Yellow (Player 4)
];
