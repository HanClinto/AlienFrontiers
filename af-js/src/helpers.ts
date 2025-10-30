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
