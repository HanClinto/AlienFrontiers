import { CENTER_X, CENTER_Y, GAME_HEIGHT, GAME_WIDTH } from '../main';
import { MenuButton } from '../ui/menu-button';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'MainMenu',
};

/**
 * The main menu scene that shows the game title, background, and menu buttons.
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(sceneConfig);
  }

  public create(): void {
    // Add background image (centered and scaled to fit)
    const background = this.add.image(CENTER_X, CENTER_Y, 'background');
    
    // Scale the background to fit the game height while maintaining aspect ratio
    const bgScale = GAME_HEIGHT / background.height;
    background.setScale(bgScale);

    // Add title logo at the top
    const title = this.add.image(CENTER_X, 300, 'title');
    
    // Scale title to fit width with some padding
    const titleScale = (GAME_WIDTH * 0.8) / title.width;
    title.setScale(titleScale);

    // Calculate button positions
    const buttonWidth = 600;
    const buttonHeight = 100;
    const buttonX = CENTER_X - buttonWidth / 2;
    const startY = CENTER_Y + 200;
    const spacing = 150;

    // Create menu buttons
    new MenuButton(this, buttonX, startY, 'PLAY', () => {
      this.scene.start('PlayerSetup');
    }, buttonWidth, buttonHeight);

    new MenuButton(this, buttonX, startY + spacing, 'QUICK RULES', () => {
      console.log('Quick Rules button clicked');
      // TODO: Implement Quick Rules scene
    }, buttonWidth, buttonHeight);

    new MenuButton(this, buttonX, startY + spacing * 2, 'ACHIEVEMENTS', () => {
      console.log('Achievements button clicked');
      // TODO: Implement Achievements scene
    }, buttonWidth, buttonHeight);
  }
}
