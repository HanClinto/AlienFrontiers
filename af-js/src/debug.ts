/**
 * Debug utilities for testing and development
 */

/**
 * Get URL parameters
 */
export function getURLParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

/**
 * Get specific scene from URL parameter
 * Usage: ?scene=game or ?scene=playersetup
 */
export function getStartScene(): string | null {
  const params = getURLParams();
  return params.get('scene');
}

/**
 * Expose game instance and navigation methods globally for testing
 */
export function exposeDebugAPI(game: Phaser.Game): void {
  // Only expose when ?debug=true or forced
  const params = getURLParams();
  const isDebug = params.get('debug') === 'true' || (window as any).__FORCE_DEBUG__;
  
  if (!isDebug) {
    return;
  }

  (window as any).__GAME__ = game;
  (window as any).__DEBUG__ = {
    // Navigate to a specific scene
    goToScene: (sceneKey: string, data?: any) => {
      const scene = game.scene.getScene(sceneKey);
      if (scene) {
        game.scene.start(sceneKey, data);
        console.log(`Navigated to scene: ${sceneKey}`);
      } else {
        console.error(`Scene not found: ${sceneKey}`);
        console.log('Available scenes:', game.scene.getScenes(true).map(s => s.scene.key));
      }
    },

    // List all available scenes
    listScenes: () => {
      const scenes = game.scene.getScenes(true);
      console.log('Available scenes:', scenes.map(s => s.scene.key));
      return scenes.map(s => s.scene.key);
    },

    // Get current active scene
    getCurrentScene: () => {
      const active = game.scene.getScenes(true).find(s => s.scene.isActive());
      return active ? active.scene.key : null;
    },

    // Access to game for advanced debugging
    game: game,
  };

  console.log('Debug API exposed. Available methods:');
  console.log('  __DEBUG__.goToScene(sceneKey, data?) - Navigate to a scene');
  console.log('  __DEBUG__.listScenes() - List all scenes');
  console.log('  __DEBUG__.getCurrentScene() - Get current scene');
  console.log('  __GAME__ - Direct access to Phaser game instance');
}
