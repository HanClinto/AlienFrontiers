import { GAME_WIDTH, GAME_HEIGHT } from '../main';
import { PlayerHUDLayer, MiniPlayerHUDLayer } from '../layers';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Game',
};

/**
 * Main game scene that displays the game board, docking bays, and player trays.
 * Based on SceneGameiPad.m from the original iOS implementation.
 * 
 * This scene coordinates the various HUD layers and game board display.
 * Individual HUD components are modularized into separate layer classes:
 * - PlayerHUDLayer: Main player tray at bottom (from LayerHUDPort.m)
 * - MiniPlayerHUDLayer: Mini trays at top for other players (from LayerPortPlayerMiniHUD.m)
 */
export class GameScene extends Phaser.Scene {
  private numPlayers: number = 2;
  private currentPlayer: number = 0;
  private miniPlayerHUDs: MiniPlayerHUDLayer[] = [];
  private mainPlayerHUD: PlayerHUDLayer | null = null;

  constructor() {
    super(sceneConfig);
  }

  public init(data: any): void {
    // Accept number of players from player setup scene
    this.numPlayers = data?.numPlayers || 2;
    this.currentPlayer = 0;
  }

  public create(): void {
    // Add solid color background (matching LayerColorLayer from iOS)
    this.cameras.main.setBackgroundColor(0x000033);

    // Add the game board
    // Original iOS: gameBG.position = ccp([gameBG texture].contentSize.width * 0.5 - 54, [gameBG texture].contentSize.height * 0.5)
    // Board is positioned slightly left of center
    const board = this.add.image(0, 0, 'game_board');
    board.setOrigin(0.5, 0.5);
    const boardX = board.width * 0.5 - 54 * 2; // Scale the offset by 2
    const boardY = GAME_HEIGHT * 0.5;
    board.setPosition(boardX, boardY);

    // Add the main player HUD tray at the bottom
    this.mainPlayerHUD = new PlayerHUDLayer(this, this.currentPlayer);

    // Add mini player trays at the top for other players
    for (let i = 0; i < this.numPlayers; i++) {
      if (i === this.currentPlayer) continue; // Skip current player
      const miniHUD = new MiniPlayerHUDLayer(this, i, this.numPlayers);
      this.miniPlayerHUDs.push(miniHUD);
    }
  }

  public shutdown(): void {
    // Clean up layers when scene shuts down
    if (this.mainPlayerHUD) {
      this.mainPlayerHUD.destroy();
    }
    this.miniPlayerHUDs.forEach(hud => hud.destroy());
  }
}
