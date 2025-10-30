import { GAME_WIDTH, GAME_HEIGHT } from '../main';
import { convertFromIOSCoordinates, PLAYER_COLORS } from '../helpers';
import { ImageButton } from '../ui/image-button';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Game',
};

interface PlayerTrayData {
  container: Phaser.GameObjects.Container;
  expanded: boolean;
  playerIndex: number;
}

/**
 * Main game scene that displays the game board, docking bays, and player trays.
 * Based on SceneGameiPad.m and LayerHUDPort.m from the original iOS implementation.
 */
export class GameScene extends Phaser.Scene {
  private numPlayers: number = 2;
  private currentPlayer: number = 0;
  private playerTrays: PlayerTrayData[] = [];
  private mainPlayerTray: Phaser.GameObjects.Container | null = null;

  constructor() {
    super(sceneConfig);
  }

  public init(data: any): void {
    // Accept number of players from player setup scene
    this.numPlayers = data?.numPlayers || 2;
    this.currentPlayer = 0;
  }

  public create(): void {
    // Add solid color background (matching LayerColorLayer from iOS)
    this.cameras.main.setBackgroundColor(0x000033);

    // Add the game board
    // Original iOS: gameBG.position = ccp([gameBG texture].contentSize.width * 0.5 - 54, [gameBG texture].contentSize.height * 0.5)
    // Board is positioned slightly left of center
    const board = this.add.image(0, 0, 'game_board');
    board.setOrigin(0.5, 0.5);
    const boardX = board.width * 0.5 - 54 * 2; // Scale the offset by 2
    const boardY = GAME_HEIGHT * 0.5;
    board.setPosition(boardX, boardY);

    // Add the main player HUD tray at the bottom
    this.createMainPlayerTray();

    // Add mini player trays at the top for other players
    this.createMiniPlayerTrays();

    this.input.on('pointerdown', this.onPointerDown, this);
  }

  /**
   * Creates the main player HUD tray at the bottom of the screen
   * Based on LayerHUDPort.m buildGUI method
   */
  private createMainPlayerTray(): void {
    // Original iOS: uiFrame.position = ccp(768 * 0.5, -117)
    const pos = convertFromIOSCoordinates(768 * 0.5, -117);

    const trayContainer = this.add.container(pos.x, pos.y);
    this.mainPlayerTray = trayContainer;

    // Add frame sprite
    // Original iOS: frameSprite.position = ccp(0, 0)
    const frameSprite = this.add.image(0, 0, 'player_tab_large');
    trayContainer.add(frameSprite);

    // Roll button
    // Original iOS: rollButton.position = ccp(635 - 375, 92 - 117)
    const rollBtnX = (635 - 375) * 2;
    const rollBtnY = (92 - 117) * 2;
    const rollButton = new ImageButton(
      this,
      rollBtnX,
      rollBtnY,
      'button_roll_up',
      'button_roll_down',
      () => this.onRollButtonTapped()
    );
    trayContainer.add(rollButton.getContainer());

    // Undo button
    // Original iOS: undoButton.position = ccp(693 - 375 - 122 + 3, 126 - 117 - 82 - 2)
    const undoBtnX = (693 - 375 - 122 + 3) * 2;
    const undoBtnY = (126 - 117 - 82 - 2) * 2;
    const undoButton = new ImageButton(
      this,
      undoBtnX,
      undoBtnY,
      'tray_btn_undo',
      'tray_btn_undo_active',
      () => this.onUndoButtonTapped()
    );
    trayContainer.add(undoButton.getContainer());

    // Redo button
    // Original iOS: redoButton.position = ccp(577 - 375 + 37 + 3, 126 - 117 - 82 - 2)
    const redoBtnX = (577 - 375 + 37 + 3) * 2;
    const redoBtnY = (126 - 117 - 82 - 2) * 2;
    const redoButton = new ImageButton(
      this,
      redoBtnX,
      redoBtnY,
      'tray_btn_redo',
      'tray_btn_redo_active',
      () => this.onRedoButtonTapped()
    );
    trayContainer.add(redoButton.getContainer());

    // Done button
    // Original iOS: doneButton.position = ccp(693 - 375 - 16 + 3, 128 - 80 - 117 - 4 - 2)
    const doneBtnX = (693 - 375 - 16 + 3) * 2;
    const doneBtnY = (128 - 80 - 117 - 4 - 2) * 2;
    const doneButton = new ImageButton(
      this,
      doneBtnX,
      doneBtnY,
      'tray_btn_done',
      'tray_btn_done_active',
      () => this.onDoneButtonTapped()
    );
    trayContainer.add(doneButton.getContainer());

    // Player number label
    // Original iOS: label.position = CGPointMake(705 - 375, 193 - 117)
    const playerNumX = (705 - 375) * 2;
    const playerNumY = (193 - 117) * 2;
    const playerNumLabel = this.add.text(playerNumX, playerNumY, (this.currentPlayer + 1).toString(), {
      fontFamily: 'Arial',
      fontSize: '84px',
      color: '#ffffff',
    });
    playerNumLabel.setOrigin(0.5, 0.5);
    trayContainer.add(playerNumLabel);

    // Resource labels
    // Ore label - Original iOS: oreLabel.position = CGPointMake(706 - 375 - 148, 182 + 22 - 117)
    const oreLabelX = (706 - 375 - 148) * 2;
    const oreLabelY = (182 + 22 - 117) * 2;
    const oreLabel = this.add.text(oreLabelX, oreLabelY, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    oreLabel.setOrigin(0.5, 0.5);
    trayContainer.add(oreLabel);

    // Fuel label - Original iOS: fuelLabel.position = CGPointMake(706 - 375 - 148 + 35, 182 + 22 - 117)
    const fuelLabelX = (706 - 375 - 148 + 35) * 2;
    const fuelLabelY = (182 + 22 - 117) * 2;
    const fuelLabel = this.add.text(fuelLabelX, fuelLabelY, '2', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    fuelLabel.setOrigin(0.5, 0.5);
    trayContainer.add(fuelLabel);

    // Colony label - Original iOS: colonyLabel.position = CGPointMake(706 - 375 - 148 + 35 + 35, 182 + 22 - 117)
    const colonyLabelX = (706 - 375 - 148 + 35 + 35) * 2;
    const colonyLabelY = (182 + 22 - 117) * 2;
    const colonyLabel = this.add.text(colonyLabelX, colonyLabelY, '3', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    colonyLabel.setOrigin(0.5, 0.5);
    trayContainer.add(colonyLabel);

    // Dice label - Original iOS: diceLabel.position = CGPointMake(706 - 375 - 148 + 35 + 35 + 35, 182 + 22 - 117)
    const diceLabelX = (706 - 375 - 148 + 35 + 35 + 35) * 2;
    const diceLabelY = (182 + 22 - 117) * 2;
    const diceLabel = this.add.text(diceLabelX, diceLabelY, '5', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    diceLabel.setOrigin(0.5, 0.5);
    trayContainer.add(diceLabel);

    // Colony sprite (red player)
    const colonySprite = this.add.image(colonyLabelX + 2, colonyLabelY - 54, 'colony_red');
    trayContainer.add(colonySprite);

    // Die sprite (red player)
    const dieSprite = this.add.image(diceLabelX + 2, diceLabelY - 54, 'die_red');
    trayContainer.add(dieSprite);

    // Tech card tray
    // Original iOS: cardTray.position = CGPointMake(706 - 375 - 148 - 349, 182 - 21 - 117 + 3)
    const cardTrayX = (706 - 375 - 148 - 349) * 2;
    const cardTrayY = (182 - 21 - 117 + 3) * 2;
    const cardTray = this.add.image(cardTrayX, cardTrayY, 'card_tray_horiz');
    cardTray.setOrigin(0, 1);
    trayContainer.add(cardTray);

    // Corner overlay with color tint
    // Original iOS: cornerOverlay.position = ccp(67 + 640 - 375, 186 - 117)
    const cornerX = (67 + 640 - 375) * 2;
    const cornerY = (186 - 117) * 2;
    const cornerOverlay = this.add.image(cornerX, cornerY, 'port_corner_tint');
    cornerOverlay.setTint(PLAYER_COLORS[this.currentPlayer]);
    cornerOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    trayContainer.add(cornerOverlay);

    // Edge overlay with color tint
    // Original iOS: edgeOverlay.position = ccp(67 - 21 - 25 - 375, 186 - 68 - 117)
    const edgeX = (67 - 21 - 25 - 375) * 2;
    const edgeY = (186 - 68 - 117) * 2;
    const edgeOverlay = this.add.image(edgeX, edgeY, 'port_edge_tint');
    edgeOverlay.setTint(PLAYER_COLORS[this.currentPlayer]);
    edgeOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    trayContainer.add(edgeOverlay);

    // Menu button
    // Original iOS: menuButton.position = ccp(67 - 21 - 25 - 375 + 94 - 40, 126 - 117 - 82 - 2)
    const menuBtnX = (67 - 21 - 25 - 375 + 94 - 40) * 2;
    const menuBtnY = (126 - 117 - 82 - 2) * 2;
    const menuButton = new ImageButton(
      this,
      menuBtnX,
      menuBtnY,
      'menu_button_68',
      'menu_button_68_active',
      () => this.onMenuButtonTapped()
    );
    trayContainer.add(menuButton.getContainer());

    // Help button
    // Original iOS: helpButton.position = ccp(67 - 21 - 25 - 375 + 94 + 40, 126 - 117 - 82 - 2)
    const helpBtnX = (67 - 21 - 25 - 375 + 94 + 40) * 2;
    const helpBtnY = (126 - 117 - 82 - 2) * 2;
    const helpButton = new ImageButton(
      this,
      helpBtnX,
      helpBtnY,
      'menu_button_68',
      'menu_button_68_active',
      () => this.onHelpButtonTapped()
    );
    trayContainer.add(helpButton.getContainer());
  }

  /**
   * Creates mini player trays at the top of the screen for non-current players
   * Based on LayerPortPlayerMiniHUD.m
   */
  private createMiniPlayerTrays(): void {
    for (let i = 0; i < this.numPlayers; i++) {
      if (i === this.currentPlayer) continue; // Skip current player

      const tray = this.createMiniPlayerTray(i);
      this.playerTrays.push(tray);
    }
  }

  /**
   * Creates a single mini player tray
   * Original iOS positioning: ccp(768 * 0.5 - (numPlayers * 0.5 - playerIndex - 0.5) * (width + 5), 1024 + height)
   */
  private createMiniPlayerTray(playerIndex: number): PlayerTrayData {
    const trayContainer = this.add.container(0, 0);

    // Add frame sprite
    const frameSprite = this.add.image(0, 0, 'player_tab_full_RO');
    frameSprite.setOrigin(0.5, 1);
    trayContainer.add(frameSprite);

    // Calculate inactive position (off-screen at top)
    const frameWidth = frameSprite.width;
    const frameHeight = frameSprite.height;
    const spacing = 5 * 2; // Scale spacing
    const inactiveX = GAME_WIDTH * 0.5 - (this.numPlayers * 0.5 - playerIndex - 0.5) * (frameWidth + spacing);
    const inactiveY = -frameHeight;

    trayContainer.setPosition(inactiveX, inactiveY);

    // Player score label
    // Original iOS: playerScore.position = CGPointMake(74 - 148 + 35 + 35 + 35 + 35 - 2, 4 + 30 - 443)
    const scoreX = (74 - 148 + 35 + 35 + 35 + 35 - 2) * 2;
    const scoreY = (4 + 30 - 443) * 2;
    const scoreLabel = this.add.text(scoreX, scoreY, '0', {
      fontFamily: 'Arial',
      fontSize: '84px',
      color: '#ffffff',
    });
    scoreLabel.setOrigin(0.5, 0.5);
    trayContainer.add(scoreLabel);

    // Resource labels (ore, fuel, colony, dice)
    const oreLabelX = (75 - 148 - 2) * 2;
    const oreLabelY = (0 - 17 + 30 - 443) * 2;
    const oreLabel = this.add.text(oreLabelX, oreLabelY, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    oreLabel.setOrigin(0.5, 0.5);
    trayContainer.add(oreLabel);

    const fuelLabelX = (73 - 148 + 35 - 2) * 2;
    const fuelLabelY = (0 - 17 + 30 - 443) * 2;
    const fuelLabel = this.add.text(fuelLabelX, fuelLabelY, '2', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    fuelLabel.setOrigin(0.5, 0.5);
    trayContainer.add(fuelLabel);

    const colonyLabelX = (71 - 148 + 35 + 35 - 2) * 2;
    const colonyLabelY = (0 - 17 + 30 - 443) * 2;
    const colonyLabel = this.add.text(colonyLabelX, colonyLabelY, '3', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    colonyLabel.setOrigin(0.5, 0.5);
    trayContainer.add(colonyLabel);

    const diceLabelX = (70 - 148 + 35 + 35 + 35 - 2) * 2;
    const diceLabelY = (0 - 17 + 30 - 443) * 2;
    const diceLabel = this.add.text(diceLabelX, diceLabelY, '5', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    diceLabel.setOrigin(0.5, 0.5);
    trayContainer.add(diceLabel);

    // Colony and die sprites based on player color
    const colorNames = ['red', 'green', 'blue', 'yellow'];
    const colorName = colorNames[playerIndex];

    const colonySprite = this.add.image(colonyLabelX, colonyLabelY + 48, `colony_${colorName}`);
    trayContainer.add(colonySprite);

    const dieSprite = this.add.image(diceLabelX, diceLabelY + 48, `die_${colorName}`);
    trayContainer.add(dieSprite);

    // Tech card tray (vertical mini)
    const cardTrayX = (-182 * 0.5 + 3) * 2;
    const cardTrayY = (-223 + 114) * 2;
    const cardTray = this.add.image(cardTrayX, cardTrayY, 'card_tray_vert_mini');
    cardTray.setOrigin(0, 1);
    trayContainer.add(cardTray);

    // Corner overlay with color tint
    const cornerX = (67 - 1) * 2;
    const cornerY = (0 + 30 - 443) * 2;
    const cornerOverlay = this.add.image(cornerX, cornerY, 'port_corner_tint_mini');
    cornerOverlay.setTint(PLAYER_COLORS[playerIndex]);
    cornerOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    trayContainer.add(cornerOverlay);

    // Make the tray interactive for sliding
    const hitArea = new Phaser.Geom.Rectangle(-frameWidth / 2, -frameHeight, frameWidth, 130);
    trayContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    return {
      container: trayContainer,
      expanded: false,
      playerIndex: playerIndex,
    };
  }

  /**
   * Handle pointer down events to toggle mini player trays
   */
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    // Check if any mini tray was clicked
    for (const tray of this.playerTrays) {
      const bounds = tray.container.getBounds();
      if (bounds.contains(pointer.x, pointer.y)) {
        this.toggleMiniPlayerTray(tray);
        break;
      }
    }
  }

  /**
   * Toggles a mini player tray between expanded and collapsed states
   * Original iOS: Slides 380 pixels
   */
  private toggleMiniPlayerTray(tray: PlayerTrayData): void {
    tray.expanded = !tray.expanded;

    const frameSprite = tray.container.getAt(0) as Phaser.GameObjects.Image;
    const frameHeight = frameSprite.height;
    const slideAmount = 380 * 2; // Scale the slide amount

    // Calculate positions
    const spacing = 5 * 2;
    const baseX = GAME_WIDTH * 0.5 - (this.numPlayers * 0.5 - tray.playerIndex - 0.5) * (frameSprite.width + spacing);
    const collapsedY = -frameHeight;
    const expandedY = collapsedY + slideAmount;

    const targetY = tray.expanded ? expandedY : collapsedY;

    // Animate the slide with easing
    this.tweens.add({
      targets: tray.container,
      y: targetY,
      duration: 500,
      ease: tray.expanded ? 'Sine.easeOut' : 'Sine.easeIn',
    });
  }

  // Button handlers
  private onRollButtonTapped(): void {
    console.log('Roll button tapped');
  }

  private onUndoButtonTapped(): void {
    console.log('Undo button tapped');
  }

  private onRedoButtonTapped(): void {
    console.log('Redo button tapped');
  }

  private onDoneButtonTapped(): void {
    console.log('Done button tapped');
  }

  private onMenuButtonTapped(): void {
    console.log('Menu button tapped');
    // Could return to main menu
    // this.scene.start('MainMenu');
  }

  private onHelpButtonTapped(): void {
    console.log('Help button tapped');
  }
}
