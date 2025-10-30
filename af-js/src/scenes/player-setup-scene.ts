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

    // Original iOS coordinates (768x1024) * 2 = our coordinates (1536x2048)
    const SCALE_FACTOR = 2;

    // Add "GAME SETUP" title - original: (384, 900)
    this.add.image(384 * SCALE_FACTOR, 900 * SCALE_FACTOR, 'title_game_setup');

    // Back button - original: (100, 974)
    new ImageButton(this, 100 * SCALE_FACTOR, 974 * SCALE_FACTOR, 'btn_back', 'btn_back_pushed', () => {
      this.scene.start('MainMenu');
    });

    // Play button - original: (384, 600)
    new ImageButton(this, 384 * SCALE_FACTOR, 600 * SCALE_FACTOR, 'btn_play', 'btn_play_pushed', () => {
      console.log('Starting game with configs:', this.playerConfigs.slice(0, this.numPlayers));
      // TODO: Start the actual game scene
    });

    // Number of players button - original: (384, 525)
    this.numPlayersButton = new LabeledButton(
      this,
      384 * SCALE_FACTOR,
      525 * SCALE_FACTOR,
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

    // Player buttons using original iOS coordinates
    // Player 1 - original: (384 - 100, 400) = (284, 400)
    this.playerButtons[0] = new LabeledButton(
      this,
      (384 - 100) * SCALE_FACTOR,
      400 * SCALE_FACTOR,
      'btn_blank',
      'btn_blank_pushed',
      this.playerConfigs[0].controller,
      this.playerConfigs[0].color,
      20,
      () => this.cyclePlayerController(0)
    );

    // Player 2 - original: (384 + 100, 400) = (484, 400)
    this.playerButtons[1] = new LabeledButton(
      this,
      (384 + 100) * SCALE_FACTOR,
      400 * SCALE_FACTOR,
      'btn_blank',
      'btn_blank_pushed',
      this.playerConfigs[1].controller,
      this.playerConfigs[1].color,
      20,
      () => this.cyclePlayerController(1)
    );

    // Player 3 - original: (384 - 100, 400 - 75) = (284, 325)
    this.playerButtons[2] = new LabeledButton(
      this,
      (384 - 100) * SCALE_FACTOR,
      (400 - 75) * SCALE_FACTOR,
      'btn_blank',
      'btn_blank_pushed',
      this.playerConfigs[2].controller,
      this.playerConfigs[2].color,
      20,
      () => this.cyclePlayerController(2)
    );

    // Player 4 - original: (384 + 100, 400 - 75) = (484, 325)
    this.playerButtons[3] = new LabeledButton(
      this,
      (384 + 100) * SCALE_FACTOR,
      (400 - 75) * SCALE_FACTOR,
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
