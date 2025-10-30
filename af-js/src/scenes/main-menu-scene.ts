import { CENTER_X, CENTER_Y, GAME_HEIGHT, GAME_WIDTH } from '../main';
import { ImageButton } from '../ui/image-button';

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

    // Calculate button positions (similar to original iOS positions)
    const startY = 1200; // Lower on screen, matching reference image
    const spacing = 160; // Space between buttons

    // Create menu buttons using pre-rendered images
    new ImageButton(this, CENTER_X, startY, 'btn_play', 'btn_play_pushed', () => {
      this.scene.start('PlayerSetup');
    });

    new ImageButton(this, CENTER_X, startY + spacing, 'btn_rules', 'btn_rules_pushed', () => {
      console.log('Quick Rules button clicked');
      // TODO: Implement Quick Rules scene
    });

    new ImageButton(this, CENTER_X, startY + spacing * 2, 'btn_achievements', 'btn_achievements_pushed', () => {
      console.log('Achievements button clicked');
      // TODO: Implement Achievements scene
    });
  }
}
