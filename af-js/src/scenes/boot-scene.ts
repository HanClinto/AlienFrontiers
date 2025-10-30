import { getGameHeight, getGameWidth } from '../helpers';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: false,
    visible: false,
    key: 'Boot',
};

/**
 * The initial scene that loads all necessary assets to the game and displays a loading bar.
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super(sceneConfig);
    }

    public preload(): void {
        const halfWidth = getGameWidth(this) * 0.5;
        const halfHeight = getGameHeight(this) * 0.5;

        const progressBarHeight = 100;
        const progressBarWidth = 400;

        const progressBarContainer = this.add.rectangle(
            halfWidth,
            halfHeight,
            progressBarWidth,
            progressBarHeight,
            0x000000,
        );
        const progressBar = this.add.rectangle(
            halfWidth + 20 - progressBarContainer.width * 0.5,
            halfHeight,
            10,
            progressBarHeight - 20,
            0x888888,
        );

        const loadingText = this.add.text(halfWidth - 75, halfHeight - 100, 'Loading...').setFontSize(24);
        const percentText = this.add.text(halfWidth - 25, halfHeight, '0%').setFontSize(24);
        const assetText = this.add.text(halfWidth - 25, halfHeight + 100, '').setFontSize(24);

        this.load.on('progress', (value) => {
            progressBar.width = (progressBarWidth - 30) * value;

            const percent = value * 100;
            percentText.setText(`${percent}%`);
        });

        this.load.on('fileprogress', (file) => {
            assetText.setText(file.key);
        });

        this.load.on('complete', () => {
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
            progressBar.destroy();
            progressBarContainer.destroy();

            this.scene.start('MainMenu');
        });

        this.loadAssets();
    }

    /**
     * All assets that need to be loaded by the game (sprites, images, animations, tiles, music, etc)
     * should be added to this method. Once loaded in, the loader will keep track of them, independent of which scene
     * is currently active, so they can be accessed anywhere.
     */
    private loadAssets() {
        this.load.setPath('assets/ui/');

        // Load main menu assets
        this.load.image('background', 'af_ipad_gui_bg-ipadhd.png');
        this.load.image('title', 'af_title-ipadhd.png');

        // Load button images
        this.load.image('btn_play', 'menu_play_big-ipadhd.png');
        this.load.image('btn_play_pushed', 'menu_play_big_pushed-ipadhd.png');
        this.load.image('btn_rules', 'menu_rules-ipadhd.png');
        this.load.image('btn_rules_pushed', 'menu_rules_pushed-ipadhd.png');
        this.load.image('btn_achievements', 'menu_achievements.png');
        this.load.image('btn_achievements_pushed', 'menu_achievements_pushed.png');
    }
}
