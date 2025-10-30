import { GameSetup } from '../game/setup/game_setup';
import { CENTER_X } from '../main';
import { MenuButton } from '../ui/menu-button';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'MainMenu',
};

/**
 * The initial scene that starts, shows the splash screens, and loads the necessary assets.
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(sceneConfig);
  }

  gameSetup: GameSetup = new GameSetup();

  public create(): void {
    this.add
      .text(CENTER_X, 75, "Gotcha'!", {
        color: '#FFFFFF',
        fontSize: '48px',
      }).setOrigin(0.5);

    this.add
      .text(CENTER_X, 125, "Where Chess, Checkers,\nand Backgammon meet", {
        color: '#FFFFFF',
        fontSize: '18px',
        align: 'center',
      }).setOrigin(0.5);

    this.add
      .text(CENTER_X, 175, "Game by Rich Taylor", {
        color: '#FFFFFF',
        fontSize: '14px',
        align: 'center',
      }).setOrigin(0.5);

    this.add
      .text(CENTER_X, 200, "Developed by HanClinto Games, LLC", {
        color: '#FFFFFF',
        fontSize: '14px',
        align: 'center',
      }).setOrigin(0.5);

    new MenuButton(this, CENTER_X - 100, 350, 'Start Game', () => {
      this.scene.start('Game', this.gameSetup);
    })

    new MenuButton(this, CENTER_X - 100, 450, 'Settings', () =>
      console.log('settings button clicked')
    )

    new MenuButton(this, CENTER_X - 100, 550, 'Help', () =>
      console.log('help button clicked')
    )

    if (this.scale.fullscreen.available) {
      new MenuButton(this, CENTER_X - 100, 650, 'Fullscreen', () => {
        if (this.scale.isFullscreen) {
          this.scale.stopFullscreen();
        }
        else {
          this.scale.startFullscreen();
        }
      })
    }

  }
}