import { getGameHeight, getGameWidth } from '../helpers';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: true,
    visible: true,
    key: 'Boot',
};

/**
 * The initial scene that loads all necessary assets to the game and displays a loading bar.
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super(sceneConfig);
        console.log('BootScene constructor called');
    }

    public preload(): void {
        console.log('BootScene preload called');
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

            console.log('All assets loaded successfully');
            this.scene.start('MainMenu');
        });
        
        this.load.on('loaderror', (file: any) => {
            console.error('Error loading file:', file.key, file.src);
        });

        this.loadAssets();
    }

    /**
     * All assets that need to be loaded by the game (sprites, images, animations, tiles, music, etc)
     * should be added to this method. Once loaded in, the loader will keep track of them, independent of which scene
     * is currently active, so they can be accessed anywhere.
     */
    private loadAssets() {
        // Load UI assets
        this.load.setPath('assets/ui/');

        // Load main menu assets
        this.load.image('background', 'af_ipad_gui_bg-ipadhd.png');
        this.load.image('title', 'af_title-ipadhd.png');

        // Load main menu button images
        this.load.image('btn_play', 'menu_play_big-ipadhd.png');
        this.load.image('btn_play_pushed', 'menu_play_big_pushed-ipadhd.png');
        this.load.image('btn_rules', 'menu_rules-ipadhd.png');
        this.load.image('btn_rules_pushed', 'menu_rules_pushed-ipadhd.png');
        this.load.image('btn_achievements', 'menu_achievements.png');
        this.load.image('btn_achievements_pushed', 'menu_achievements_pushed.png');

        // Load player setup scene assets
        this.load.image('title_game_setup', 'af_game_setup-ipadhd.png');
        this.load.image('btn_back', 'menu_back-ipadhd.png');
        this.load.image('btn_back_pushed', 'menu_back_pushed-ipadhd.png');
        this.load.image('btn_blank', 'menu_button_blank-ipadhd.png');
        this.load.image('btn_blank_pushed', 'menu_button_blank_pushed-ipadhd.png');

        // Load game assets
        this.load.setPath('assets/game/');

        // Game board
        this.load.image('game_board', 'af_ipad_board-ipadhd.png');

        // Player tray frames
        this.load.image('player_tab_large', 'hud_port_player_tab_large-ipadhd.png');
        this.load.image('player_tab_full', 'hud_port_player_tab_full-ipadhd.png');
        this.load.image('player_tab_full_RO', 'hud_port_player_tab_full_RO-ipadhd.png');

        // Tray overlays
        this.load.image('port_corner_tint', 'hud_port_corner_tint-ipadhd.png');
        this.load.image('port_corner_tint_mini', 'hud_port_corner_tint_mini-ipadhd.png');
        this.load.image('port_edge_tint', 'hud_port_edge_tint-ipadhd.png');

        // Buttons
        this.load.image('button_roll_up', 'button_roll_up-ipadhd.png');
        this.load.image('button_roll_down', 'button_roll_down-ipadhd.png');
        this.load.image('button_roll_glow', 'button_roll_glow-ipadhd.png');
        this.load.image('tray_btn_undo', 'tray_btn_undo-ipadhd.png');
        this.load.image('tray_btn_undo_active', 'tray_btn_undo_active-ipadhd.png');
        this.load.image('tray_btn_undo_inactive', 'tray_btn_undo_inactive-ipadhd.png');
        this.load.image('tray_btn_redo', 'tray_btn_redo-ipadhd.png');
        this.load.image('tray_btn_redo_active', 'tray_btn_redo_active-ipadhd.png');
        this.load.image('tray_btn_redo_inactive', 'tray_btn_redo_inactive-ipadhd.png');
        this.load.image('tray_btn_done', 'tray_btn_done-ipadhd.png');
        this.load.image('tray_btn_done_active', 'tray_btn_done_active-ipadhd.png');
        this.load.image('tray_btn_done_inactive', 'tray_btn_done_inactive-ipadhd.png');
        this.load.image('tray_btn_done_glow', 'tray_btn_done_glow-ipadhd.png');
        this.load.image('menu_button_68', 'menu_button_68-ipadhd.png');
        this.load.image('menu_button_68_active', 'menu_button_68_active-ipadhd.png');
        this.load.image('ondark_button', 'ondark_button-ipadhd.png');
        this.load.image('ondark_button_active', 'ondark_button_active-ipadhd.png');

        // Resource icons
        this.load.image('icon_ore', 'icon_ore-ipadhd.png');
        this.load.image('icon_fuel', 'icon_fuel-ipadhd.png');

        // Colony sprites for each player color
        this.load.image('colony_red', 'hud_colony_red-ipadhd.png');
        this.load.image('colony_green', 'hud_colony_green-ipadhd.png');
        this.load.image('colony_blue', 'hud_colony_blue-ipadhd.png');
        this.load.image('colony_yellow', 'hud_colony_yellow-ipadhd.png');

        // Die sprites for each player color
        this.load.image('die_red', 'hud_die_red-ipadhd.png');
        this.load.image('die_green', 'hud_die_green-ipadhd.png');
        this.load.image('die_blue', 'hud_die_blue-ipadhd.png');
        this.load.image('die_yellow', 'hud_die_yellow-ipadhd.png');

        // Tech card trays
        this.load.image('card_tray_horiz', 'hud_card_tray_white_horiz-ipadhd.png');
        this.load.image('card_tray_vert', 'hud_card_tray_white_vert-ipadhd.png');
        this.load.image('card_tray_vert_mini', 'hud_card_tray_mini_white_vert-ipadhd.png');
        this.load.image('card_tray_shadow_horiz', 'hud_card_tray_shadow_horiz-ipadhd.png');
        this.load.image('card_tray_shadow_vert', 'hud_card_tray_shadow_vert-ipadhd.png');

        // Raid buttons
        this.load.image('hud_button_ro_up', 'hud_button_ro_up-ipadhd.png');
        this.load.image('hud_button_ro_up_active', 'hud_button_ro_up_active-ipadhd.png');
        this.load.image('hud_button_ro_up_inactive', 'hud_button_ro_up_inactive-ipadhd.png');
        this.load.image('hud_button_ro_down', 'hud_button_ro_down-ipadhd.png');
        this.load.image('hud_button_ro_down_active', 'hud_button_ro_down_active-ipadhd.png');
        this.load.image('hud_button_ro_down_inactive', 'hud_button_ro_down_inactive-ipadhd.png');

        // Facility icons
        this.load.image('icons_sc', 'icons_sc-ipadhd.png');
        this.load.image('icons_sy', 'icons_sy-ipadhd.png');
        this.load.image('icons_lm', 'icons_lm-ipadhd.png');
        this.load.image('icons_cc', 'icons_cc-ipadhd.png');
        this.load.image('icons_ts', 'icons_ts-ipadhd.png');
        this.load.image('icons_raiders', 'icons_raiders-ipadhd.png');
        this.load.image('icons_ch', 'icons_ch-ipadhd.png');
        this.load.image('icons_om', 'icons_om-ipadhd.png');
        this.load.image('icons_aa', 'icons_aa-ipadhd.png');
        this.load.image('dock_normal', 'dock_normal-ipadhd.png');
        
        // Tech card backgrounds and images
        this.load.image('tech_layer_bg', 'tech_layer_bg-ipadhd.png');
        this.load.image('tech_layer_bg_selected', 'tech_layer_bg_selected-ipadhd.png');
        
        // Individual tech card images
        this.load.image('tech_ac', 'tech_ac-ipadhd.png'); // Alien City
        this.load.image('tech_am', 'tech_am-ipadhd.png'); // Alien Monument
        this.load.image('tech_bp', 'tech_bp-ipadhd.png'); // Booster Pod
        this.load.image('tech_sb', 'tech_sb-ipadhd.png'); // Stasis Beam
        this.load.image('tech_pd', 'tech_pd-ipadhd.png'); // Polarity Device
        this.load.image('tech_gm', 'tech_gm-ipadhd.png'); // Gravity Manipulator
        this.load.image('tech_ot', 'tech_ot-ipadhd.png'); // Orbital Teleporter
        this.load.image('tech_dc', 'tech_dc-ipadhd.png'); // Data Crystal
        this.load.image('tech_pc', 'tech_pc-ipadhd.png'); // Plasma Cannon
        this.load.image('tech_hd', 'tech_hd-ipadhd.png'); // Holographic Decoy
        this.load.image('tech_rc', 'tech_rc-ipadhd.png'); // Resource Cache
        this.load.image('tech_tw', 'tech_tw-ipadhd.png'); // Temporal Warper
        
        // Note: The original bitmap font (DIN_Tech_12-ipadhd.fnt) uses BMFont text format,
        // but Phaser 3 expects XML format. For now, we'll use system fonts.
        // TODO: Convert the font to XML format or use WebFont loader for DIN-Black.ttf
    }
}
