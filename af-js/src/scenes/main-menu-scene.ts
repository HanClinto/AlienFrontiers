import { CENTER_X, CENTER_Y, GAME_HEIGHT } from '../main';
import { ImageButton } from '../ui/image-button';
import { convertFromIOSCoordinates } from '../helpers';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'MainMenu',
};

/**
 * The main menu scene that shows the game title, background, and menu buttons.
 * Uses coordinate conversion from original iOS game (SceneMainMenuiPad.m)
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

    // Add title logo - original iOS: (384, 900)
    const titlePos = convertFromIOSCoordinates(384, 900);
    this.add.image(titlePos.x, titlePos.y, 'title');

    // Create menu buttons using original iOS coordinates
    // Play button - original iOS: (384, 600)
    const playPos = convertFromIOSCoordinates(384, 600);
    new ImageButton(this, playPos.x, playPos.y, 'btn_play', 'btn_play_pushed', () => {
      this.scene.start('PlayerSetup');
    });

    // Rules button - original iOS: (384, 520)
    const rulesPos = convertFromIOSCoordinates(384, 520);
    new ImageButton(this, rulesPos.x, rulesPos.y, 'btn_rules', 'btn_rules_pushed', () => {
      console.log('Quick Rules button clicked');
      // TODO: Implement Quick Rules scene
    });

    // Achievements button - original iOS: (384, 450)
    const achievementsPos = convertFromIOSCoordinates(384, 450);
    new ImageButton(this, achievementsPos.x, achievementsPos.y, 'btn_achievements', 'btn_achievements_pushed', () => {
      console.log('Achievements button clicked');
      // TODO: Implement Achievements scene
    });
  }
}
