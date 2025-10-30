import { CENTER_X, CENTER_Y, GAME_HEIGHT, GAME_WIDTH } from '../main';
import { ImageButton } from '../ui/image-button';
import { LabeledButton } from '../ui/labeled-button';
import { convertFromIOSCoordinates } from '../helpers';

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

    // Convert iOS coordinates (768x1024, bottom-left origin) to Phaser (1536x2048, top-left origin)
    // Using utility function that handles scaling and Y-axis inversion

    // Add "GAME SETUP" title - original iOS: (384, 900)
    const titlePos = convertFromIOSCoordinates(384, 900);
    this.add.image(titlePos.x, titlePos.y, 'title_game_setup');

    // Back button - original iOS: (100, 974)
    const backPos = convertFromIOSCoordinates(100, 974);
    new ImageButton(this, backPos.x, backPos.y, 'btn_back', 'btn_back_pushed', () => {
      this.scene.start('MainMenu');
    });

    // Play button - original iOS: (384, 600)
    const playPos = convertFromIOSCoordinates(384, 600);
    new ImageButton(this, playPos.x, playPos.y, 'btn_play', 'btn_play_pushed', () => {
      console.log('Starting game with configs:', this.playerConfigs.slice(0, this.numPlayers));
      this.scene.start('Game', { numPlayers: this.numPlayers, playerConfigs: this.playerConfigs });
    });

    // Number of players button - original iOS: (384, 525)
    const numPlayersPos = convertFromIOSCoordinates(384, 525);
    this.numPlayersButton = new LabeledButton(
      this,
      numPlayersPos.x,
      numPlayersPos.y,
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
    // Player 1 - original iOS: (284, 400)
    const player1Pos = convertFromIOSCoordinates(384 - 100, 400);
    this.playerButtons[0] = new LabeledButton(
      this,
      player1Pos.x,
      player1Pos.y,
      'btn_blank',
      'btn_blank_pushed',
      this.playerConfigs[0].controller,
      this.playerConfigs[0].color,
      20,
      () => this.cyclePlayerController(0)
    );

    // Player 2 - original iOS: (484, 400)
    const player2Pos = convertFromIOSCoordinates(384 + 100, 400);
    this.playerButtons[1] = new LabeledButton(
      this,
      player2Pos.x,
      player2Pos.y,
      'btn_blank',
      'btn_blank_pushed',
      this.playerConfigs[1].controller,
      this.playerConfigs[1].color,
      20,
      () => this.cyclePlayerController(1)
    );

    // Player 3 - original iOS: (284, 325)
    const player3Pos = convertFromIOSCoordinates(384 - 100, 325);
    this.playerButtons[2] = new LabeledButton(
      this,
      player3Pos.x,
      player3Pos.y,
      'btn_blank',
      'btn_blank_pushed',
      this.playerConfigs[2].controller,
      this.playerConfigs[2].color,
      20,
      () => this.cyclePlayerController(2)
    );

    // Player 4 - original iOS: (484, 325)
    const player4Pos = convertFromIOSCoordinates(384 + 100, 325);
    this.playerButtons[3] = new LabeledButton(
      this,
      player4Pos.x,
      player4Pos.y,
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
