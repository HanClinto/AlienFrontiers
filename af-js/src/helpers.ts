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
 * Converts iOS child coordinates relative to a container with a bottom-anchored frame
 * 
 * In iOS Cocos2D:
 * - Container sprites have anchor point (0.5, 0.5) by default (center)
 * - Children are positioned relative to the container's center
 * - The frame is 234 pixels tall in iOS coords (468 in Phaser)
 * 
 * In Phaser:
 * - We set frame origin to (0.5, 1) (bottom-center)
 * - Y=0 is at the BOTTOM of the frame
 * - Y=-468 would be at the TOP of the frame
 * 
 * To convert: iOS Y relative to center needs to be shifted by half frame height (234),
 * then negated for Phaser's upward direction, then scaled.
 * 
 * @param iosX - X coordinate in iOS system relative to container center
 * @param iosY - Y coordinate in iOS system relative to container center  
 * @param frameHeightIOS - Height of the frame in iOS coordinates (default 234 for main tray)
 * @returns Object with scaled coordinates for Phaser container with bottom-center origin
 */
export const convertIOSChildCoordinates = (
  iosX: number, 
  iosY: number, 
  frameHeightIOS: number = 234
): { x: number, y: number } => {
  const SCALE_FACTOR = 2;
  
  // Scale X coordinate (simple multiplication)
  const phaserX = iosX * SCALE_FACTOR;
  
  // Convert Y: shift from center-relative to bottom-relative, negate for upward direction, then scale
  // In iOS: Y=0 is at center, Y=-117 is at bottom  
  // In Phaser: Y=0 is at bottom, Y=-234 is at top (after scaling)
  // Formula: phaserY = -(iosY + frameHeightIOS/2) * SCALE_FACTOR
  const phaserY = -(iosY + frameHeightIOS / 2) * SCALE_FACTOR;
  
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
