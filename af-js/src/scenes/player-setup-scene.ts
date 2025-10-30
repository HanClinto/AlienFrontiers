import { CENTER_X, CENTER_Y, GAME_HEIGHT, GAME_WIDTH } from '../main';
import { ImageButton } from '../ui/image-button';
import { LabeledButton } from '../ui/labeled-button';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'PlayerSetup',
};

type PlayerController = 'Human' | 'AI: Cadet' | 'AI: Spacer' | 'AI: Pirate' | 'AI: Admiral';

interface PlayerConfig {
  controller: PlayerController;
  color: string;
}

// Player colors from original game
const PLAYER_COLORS = [
  '#952034', // Red (Player 1)
  '#007226', // Green (Player 2)
  '#005A96', // Blue (Player 3)
  '#FFC200', // Yellow (Player 4)
];

/**
 * Scene for setting up the game with player count and controller selection.
 * Matches the original SceneStartGame.m implementation.
 */
export class PlayerSetupScene extends Phaser.Scene {
  private numPlayers: number = 2;
  private playerConfigs: PlayerConfig[] = [
    { controller: 'Human', color: PLAYER_COLORS[0] },
    { controller: 'AI: Cadet', color: PLAYER_COLORS[1] },
    { controller: 'AI: Spacer', color: PLAYER_COLORS[2] },
    { controller: 'AI: Admiral', color: PLAYER_COLORS[3] },
  ];
  private numPlayersButton: LabeledButton | null = null;
  private playerButtons: LabeledButton[] = [];

  constructor() {
    super(sceneConfig);
  }

  public create(): void {
    // Add background
    const background = this.add.image(CENTER_X, CENTER_Y, 'background');
    const bgScale = GAME_HEIGHT / background.height;
    background.setScale(bgScale);

    // Add "GAME SETUP" title
    const title = this.add.image(CENTER_X, 900, 'title_game_setup');
    const titleScale = (GAME_WIDTH * 0.7) / title.width;
    title.setScale(titleScale);

    // Back button (top left)
    new ImageButton(this, 200, 974, 'btn_back', 'btn_back_pushed', () => {
      this.scene.start('MainMenu');
    });

    // Play button (center)
    new ImageButton(this, CENTER_X, 1200, 'btn_play', 'btn_play_pushed', () => {
      console.log('Starting game with configs:', this.playerConfigs.slice(0, this.numPlayers));
      // TODO: Start the actual game scene
    });

    // Number of players button
    this.numPlayersButton = new LabeledButton(
      this,
      CENTER_X,
      1050,
      'btn_blank',
      'btn_blank_pushed',
      this.numPlayers.toString(),
      '#000000',
      36,
      () => {
        this.numPlayers = this.numPlayers + 1;
        if (this.numPlayers > 4) {
          this.numPlayers = 2;
        }
        this.updateView();
      }
    );

    // Create player buttons (2x2 grid)
    const gridCenterX = CENTER_X;
    const gridCenterY = 800;
    const gridSpacingX = 200;
    const gridSpacingY = 150;

    // Player 1 (top-left)
    this.playerButtons[0] = new LabeledButton(
      this,
      gridCenterX - gridSpacingX / 2,
      gridCenterY,
      'btn_blank',
      'btn_blank_pushed',
      this.playerConfigs[0].controller,
      this.playerConfigs[0].color,
      20,
      () => this.cyclePlayerController(0)
    );

    // Player 2 (top-right)
    this.playerButtons[1] = new LabeledButton(
      this,
      gridCenterX + gridSpacingX / 2,
      gridCenterY,
      'btn_blank',
      'btn_blank_pushed',
      this.playerConfigs[1].controller,
      this.playerConfigs[1].color,
      20,
      () => this.cyclePlayerController(1)
    );

    // Player 3 (bottom-left)
    this.playerButtons[2] = new LabeledButton(
      this,
      gridCenterX - gridSpacingX / 2,
      gridCenterY + gridSpacingY,
      'btn_blank',
      'btn_blank_pushed',
      this.playerConfigs[2].controller,
      this.playerConfigs[2].color,
      20,
      () => this.cyclePlayerController(2)
    );

    // Player 4 (bottom-right)
    this.playerButtons[3] = new LabeledButton(
      this,
      gridCenterX + gridSpacingX / 2,
      gridCenterY + gridSpacingY,
      'btn_blank',
      'btn_blank_pushed',
      this.playerConfigs[3].controller,
      this.playerConfigs[3].color,
      20,
      () => this.cyclePlayerController(3)
    );

    // Initialize visibility
    this.updateView();
  }

  private cyclePlayerController(playerIndex: number): void {
    const controllers: PlayerController[] = ['Human', 'AI: Cadet', 'AI: Spacer', 'AI: Pirate', 'AI: Admiral'];
    const currentController = this.playerConfigs[playerIndex].controller;
    const currentIndex = controllers.indexOf(currentController);
    const nextIndex = (currentIndex + 1) % controllers.length;
    this.playerConfigs[playerIndex].controller = controllers[nextIndex];
    this.updateView();
  }

  private updateView(): void {
    // Update number of players button
    if (this.numPlayersButton) {
      this.numPlayersButton.setText(this.numPlayers.toString());
    }

    // Update visibility and labels of player buttons
    for (let i = 0; i < 4; i++) {
      if (this.playerButtons[i]) {
        this.playerButtons[i].setVisible(i < this.numPlayers);
        this.playerButtons[i].setText(this.playerConfigs[i].controller);
      }
    }
  }
}
