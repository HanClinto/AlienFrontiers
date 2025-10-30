import { CENTER_X, CENTER_Y, GAME_WIDTH } from '../main';
import { MenuButton } from '../ui/menu-button';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'PlayerSetup',
};

type PlayerController = 'Human' | 'Cadet' | 'Spacer' | 'Pirate' | 'Admiral';

interface PlayerConfig {
  controller: PlayerController;
}

/**
 * Scene for setting up the game with player count and controller selection.
 */
export class PlayerSetupScene extends Phaser.Scene {
  private numPlayers: number = 2;
  private playerConfigs: PlayerConfig[] = [];
  private numPlayersText: Phaser.GameObjects.Text | null = null;
  private playerControllerTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(sceneConfig);
  }

  public create(): void {
    // Add background
    const background = this.add.image(CENTER_X, CENTER_Y, 'background');
    const bgScale = 2048 / background.height;
    background.setScale(bgScale);

    // Title
    this.add.text(CENTER_X, 200, 'NEW GAME SETUP', {
      color: '#FFFFFF',
      fontSize: '64px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Number of players section
    this.add.text(CENTER_X, 400, 'Number of Players:', {
      color: '#FFFFFF',
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    this.numPlayersText = this.add.text(CENTER_X, 500, this.numPlayers.toString(), {
      color: '#FFFFFF',
      fontSize: '72px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Player count buttons
    const buttonWidth = 200;
    const buttonHeight = 80;
    
    new MenuButton(this, CENTER_X - 300, 600, '-', () => {
      if (this.numPlayers > 2) {
        this.numPlayers--;
        this.updatePlayerSetup();
      }
    }, buttonWidth, buttonHeight);

    new MenuButton(this, CENTER_X + 100, 600, '+', () => {
      if (this.numPlayers < 4) {
        this.numPlayers++;
        this.updatePlayerSetup();
      }
    }, buttonWidth, buttonHeight);

    // Initialize player configs
    this.updatePlayerSetup();

    // Start game button
    new MenuButton(this, CENTER_X - 300, 1750, 'START GAME', () => {
      console.log('Starting game with configs:', this.playerConfigs);
      // TODO: Start the actual game scene
    }, 600, 100);

    // Back button
    new MenuButton(this, CENTER_X - 300, 1870, 'BACK', () => {
      this.scene.start('MainMenu');
    }, 600, 100);
  }

  private updatePlayerSetup(): void {
    // Update number display
    if (this.numPlayersText) {
      this.numPlayersText.setText(this.numPlayers.toString());
    }

    // Clear existing player controller texts
    this.playerControllerTexts.forEach(text => text.destroy());
    this.playerControllerTexts = [];

    // Initialize or update player configs
    while (this.playerConfigs.length < this.numPlayers) {
      this.playerConfigs.push({ controller: 'Human' });
    }
    while (this.playerConfigs.length > this.numPlayers) {
      this.playerConfigs.pop();
    }

    // Display player controller options
    const startY = 800;
    const spacing = 180;

    for (let i = 0; i < this.numPlayers; i++) {
      const y = startY + i * spacing;
      
      // Player label
      const playerText = this.add.text(200, y, `Player ${i + 1}:`, {
        color: '#FFFFFF',
        fontSize: '42px',
        fontFamily: 'Arial, sans-serif',
      });
      this.playerControllerTexts.push(playerText);

      // Controller selection
      const controllerText = this.add.text(500, y, this.playerConfigs[i].controller, {
        color: '#FFFF00',
        fontSize: '42px',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      });
      controllerText.setInteractive({ useHandCursor: true });
      
      // Cycle through controller types on click
      controllerText.on('pointerdown', () => {
        const controllers: PlayerController[] = ['Human', 'Cadet', 'Spacer', 'Pirate', 'Admiral'];
        const currentIndex = controllers.indexOf(this.playerConfigs[i].controller);
        const nextIndex = (currentIndex + 1) % controllers.length;
        this.playerConfigs[i].controller = controllers[nextIndex];
        controllerText.setText(this.playerConfigs[i].controller);
      });

      this.playerControllerTexts.push(controllerText);
    }
  }
}
