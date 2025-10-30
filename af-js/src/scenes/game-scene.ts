import { GAME_WIDTH, GAME_HEIGHT } from '../main';
import { convertFromIOSCoordinates, convertIOSChildCoordinates, PLAYER_COLORS } from '../helpers';
import { ImageButton } from '../ui/image-button';
import { LabeledButton } from '../ui/labeled-button';

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
    // The frame is 750x234 in iOS coords (1500x468 in Phaser), centered at Y=-117 (half height below bottom)
    // This makes the top edge sit exactly at the bottom screen edge (Y=0 in iOS)
    // In Phaser (top-left origin), we want the frame top to align with screen bottom
    // Container at Y=2048, frame sprite (centered at 0,0 in container) will have top at 2048-234=1814
    const posX = (768 * 0.5) * 2; // Center horizontally
    const posY = GAME_HEIGHT; // Position at bottom edge

    const trayContainer = this.add.container(posX, posY);
    this.mainPlayerTray = trayContainer;

    // Add frame sprite
    // Original iOS: frameSprite.position = ccp(0, 0)
    // Frame should extend upward from the container position at the bottom edge
    const frameSprite = this.add.image(0, 0, 'player_tab_large');
    frameSprite.setOrigin(0.5, 1); // Anchor at bottom-center so it extends upward
    trayContainer.add(frameSprite);

    // Roll button with label
    // Original iOS: rollButton.position = ccp(635 - 375, 92 - 117)
    const rollBtnPos = convertIOSChildCoordinates(635 - 375, 92 - 117);
    const rollButton = new LabeledButton(
      this,
      rollBtnPos.x,
      rollBtnPos.y,
      'button_roll_up',
      'button_roll_down',
      'ROLL',
      '#000000',
      32,
      () => this.onRollButtonTapped()
    );
    trayContainer.add(rollButton.getContainer());

    // Undo button
    // Original iOS: undoButton.position = ccp(693 - 375 - 122 + 3, 126 - 117 - 82 - 2)
    const undoBtnPos = convertIOSChildCoordinates(693 - 375 - 122 + 3, 126 - 117 - 82 - 2);
    const undoButton = new ImageButton(
      this,
      undoBtnPos.x,
      undoBtnPos.y,
      'tray_btn_undo',
      'tray_btn_undo_active',
      () => this.onUndoButtonTapped()
    );
    trayContainer.add(undoButton.getContainer());

    // Redo button
    // Original iOS: redoButton.position = ccp(577 - 375 + 37 + 3, 126 - 117 - 82 - 2)
    const redoBtnPos = convertIOSChildCoordinates(577 - 375 + 37 + 3, 126 - 117 - 82 - 2);
    const redoButton = new ImageButton(
      this,
      redoBtnPos.x,
      redoBtnPos.y,
      'tray_btn_redo',
      'tray_btn_redo_active',
      () => this.onRedoButtonTapped()
    );
    trayContainer.add(redoButton.getContainer());

    // Done button
    // Original iOS: doneButton.position = ccp(693 - 375 - 16 + 3, 128 - 80 - 117 - 4 - 2)
    const doneBtnPos = convertIOSChildCoordinates(693 - 375 - 16 + 3, 128 - 80 - 117 - 4 - 2);
    const doneButton = new ImageButton(
      this,
      doneBtnPos.x,
      doneBtnPos.y,
      'tray_btn_done',
      'tray_btn_done_active',
      () => this.onDoneButtonTapped()
    );
    trayContainer.add(doneButton.getContainer());

    // Player score label (upper right corner of tray)
    // Original iOS: label.position = CGPointMake(705 - 375, 193 - 117)
    const playerScorePos = convertIOSChildCoordinates(705 - 375, 193 - 117);
    const playerScoreLabel = this.add.text(playerScorePos.x, playerScorePos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '84px',
      color: '#ffffff',
    });
    playerScoreLabel.setOrigin(0.5, 0.5);
    trayContainer.add(playerScoreLabel);

    // Resource labels
    // Ore label - Original iOS: oreLabel.position = CGPointMake(706 - 375 - 148, 182 + 22 - 117)
    const oreLabelPos = convertIOSChildCoordinates(706 - 375 - 148, 182 + 22 - 117);
    const oreLabel = this.add.text(oreLabelPos.x, oreLabelPos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    oreLabel.setOrigin(0.5, 0.5);
    trayContainer.add(oreLabel);

    // Fuel label - Original iOS: fuelLabel.position = CGPointMake(706 - 375 - 148 + 35, 182 + 22 - 117)
    const fuelLabelPos = convertIOSChildCoordinates(706 - 375 - 148 + 35, 182 + 22 - 117);
    const fuelLabel = this.add.text(fuelLabelPos.x, fuelLabelPos.y, '2', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    fuelLabel.setOrigin(0.5, 0.5);
    trayContainer.add(fuelLabel);

    // Colony label - Original iOS: colonyLabel.position = CGPointMake(706 - 375 - 148 + 35 + 35, 182 + 22 - 117)
    const colonyLabelPos = convertIOSChildCoordinates(706 - 375 - 148 + 35 + 35, 182 + 22 - 117);
    const colonyLabel = this.add.text(colonyLabelPos.x, colonyLabelPos.y, '3', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    colonyLabel.setOrigin(0.5, 0.5);
    trayContainer.add(colonyLabel);

    // Dice label - Original iOS: diceLabel.position = CGPointMake(706 - 375 - 148 + 35 + 35 + 35, 182 + 22 - 117)
    const diceLabelPos = convertIOSChildCoordinates(706 - 375 - 148 + 35 + 35 + 35, 182 + 22 - 117);
    const diceLabel = this.add.text(diceLabelPos.x, diceLabelPos.y, '5', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    diceLabel.setOrigin(0.5, 0.5);
    trayContainer.add(diceLabel);

    // Tech card tray (must be first/bottom-most layer per UILayerTagCardTray = 0)
    // Original iOS: cardTray.position = CGPointMake(706 - 375 - 148 - 349, 182 - 21 - 117 + 3)
    const cardTrayPos = convertIOSChildCoordinates(706 - 375 - 148 - 349, 182 - 21 - 117 + 3);
    const cardTray = this.add.image(cardTrayPos.x, cardTrayPos.y, 'card_tray_horiz');
    cardTray.setOrigin(0, 0.5);
    trayContainer.add(cardTray);

    // Colony sprite (red player)
    const colonySprite = this.add.image(colonyLabelPos.x + 2, colonyLabelPos.y + 54, 'colony_red');
    trayContainer.add(colonySprite);

    // Die sprite (red player)
    const dieSprite = this.add.image(diceLabelPos.x + 2, diceLabelPos.y + 54, 'die_red');
    trayContainer.add(dieSprite);

    // Corner overlay with color tint
    // Original iOS: cornerOverlay.position = ccp(67 + 640 - 375, 186 - 117)
    const cornerPos = convertIOSChildCoordinates(67 + 640 - 375, 186 - 117);
    const cornerOverlay = this.add.image(cornerPos.x, cornerPos.y, 'port_corner_tint');
    cornerOverlay.setTint(PLAYER_COLORS[this.currentPlayer]);
    cornerOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    trayContainer.add(cornerOverlay);

    // Edge overlay with color tint
    // Original iOS: edgeOverlay.position = ccp(67 - 21 - 25 - 375, 186 - 68 - 117)
    const edgePos = convertIOSChildCoordinates(67 - 21 - 25 - 375, 186 - 68 - 117);
    const edgeOverlay = this.add.image(edgePos.x, edgePos.y, 'port_edge_tint');
    edgeOverlay.setTint(PLAYER_COLORS[this.currentPlayer]);
    edgeOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    trayContainer.add(edgeOverlay);

    // Menu button with label
    // Original iOS: menuButton.position = ccp(67 - 21 - 25 - 375 + 94 - 40, 126 - 117 - 82 - 2)
    const menuBtnPos = convertIOSChildCoordinates(67 - 21 - 25 - 375 + 94 - 40, 126 - 117 - 82 - 2);
    const menuButton = new LabeledButton(
      this,
      menuBtnPos.x,
      menuBtnPos.y,
      'menu_button_68',
      'menu_button_68_active',
      'MENU',
      '#000000',
      22,
      () => this.onMenuButtonTapped()
    );
    trayContainer.add(menuButton.getContainer());

    // Help button with label
    // Original iOS: helpButton.position = ccp(67 - 21 - 25 - 375 + 94 + 40, 126 - 117 - 82 - 2)
    const helpBtnPos = convertIOSChildCoordinates(67 - 21 - 25 - 375 + 94 + 40, 126 - 117 - 82 - 2);
    const helpButton = new LabeledButton(
      this,
      helpBtnPos.x,
      helpBtnPos.y,
      'menu_button_68',
      'menu_button_68_active',
      'HELP',
      '#000000',
      22,
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
   * Original iOS: activePosition Y = 1024 + (expanded ? 0 : 380)
   * With frame anchored at bottom (0.5, 1), this shows a tab at the top
   */
  private createMiniPlayerTray(playerIndex: number): PlayerTrayData {
    const trayContainer = this.add.container(0, 0);

    // Add frame sprite
    const frameSprite = this.add.image(0, 0, 'player_tab_full_RO');
    frameSprite.setOrigin(0.5, 1);
    trayContainer.add(frameSprite);

    // Calculate positions
    const frameWidth = frameSprite.width;
    const frameHeight = frameSprite.height;
    const spacing = 5 * 2; // Scale spacing
    
    // X position (centered based on number of players and index)
    // iOS: 768 * 0.5 - (numPlayers * 0.5 - playerIndex - 0.5) * (width + 5)
    const posX = GAME_WIDTH * 0.5 - (this.numPlayers * 0.5 - playerIndex - 0.5) * (frameWidth + spacing);
    
    // Y position when NOT expanded (showing only small tab at top)
    // iOS activePosition (not expanded): Y = 1024 + 380 (bottom of frame 380 pixels above screen top)
    // Frame is 498 pixels tall (iOS: 249), so visible portion is minimal
    // In Phaser with top-left origin and frame origin at bottom, we need negative Y
    const slideDistance = 380 * 2; // 380 pixels in iOS = 760 in Phaser
    const collapsedY = -slideDistance; // Negative Y shows tab at top
    
    // Expanded position (fully visible, slid down)
    const expandedY = 0; // At top edge

    // Start in collapsed position (showing tab, NOT expanded)
    trayContainer.setPosition(posX, collapsedY);

    // Player score label
    // Original iOS: playerScore.position = CGPointMake(74 - 148 + 35 + 35 + 35 + 35 - 2, 4 + 30 - 443)
    const scorePos = convertIOSChildCoordinates(74 - 148 + 35 + 35 + 35 + 35 - 2, 4 + 30 - 443);
    const scoreLabel = this.add.text(scorePos.x, scorePos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '84px',
      color: '#ffffff',
    });
    scoreLabel.setOrigin(0.5, 0.5);
    trayContainer.add(scoreLabel);

    // Resource labels (ore, fuel, colony, dice)
    const oreLabelPos = convertIOSChildCoordinates(75 - 148 - 2, 0 - 17 + 30 - 443);
    const oreLabel = this.add.text(oreLabelPos.x, oreLabelPos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    oreLabel.setOrigin(0.5, 0.5);
    trayContainer.add(oreLabel);

    const fuelLabelPos = convertIOSChildCoordinates(73 - 148 + 35 - 2, 0 - 17 + 30 - 443);
    const fuelLabel = this.add.text(fuelLabelPos.x, fuelLabelPos.y, '2', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    fuelLabel.setOrigin(0.5, 0.5);
    trayContainer.add(fuelLabel);

    const colonyLabelPos = convertIOSChildCoordinates(71 - 148 + 35 + 35 - 2, 0 - 17 + 30 - 443);
    const colonyLabel = this.add.text(colonyLabelPos.x, colonyLabelPos.y, '3', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    colonyLabel.setOrigin(0.5, 0.5);
    trayContainer.add(colonyLabel);

    const diceLabelPos = convertIOSChildCoordinates(70 - 148 + 35 + 35 + 35 - 2, 0 - 17 + 30 - 443);
    const diceLabel = this.add.text(diceLabelPos.x, diceLabelPos.y, '5', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    diceLabel.setOrigin(0.5, 0.5);
    trayContainer.add(diceLabel);

    // Colony and die sprites based on player color
    const colorNames = ['red', 'green', 'blue', 'yellow'];
    const colorName = colorNames[playerIndex];

    const colonySprite = this.add.image(colonyLabelPos.x, colonyLabelPos.y + 48, `colony_${colorName}`);
    trayContainer.add(colonySprite);

    const dieSprite = this.add.image(diceLabelPos.x, diceLabelPos.y + 48, `die_${colorName}`);
    trayContainer.add(dieSprite);

    // Tech card tray (vertical mini)
    const cardTrayPos = convertIOSChildCoordinates(-182 * 0.5 + 3, -223 + 114);
    const cardTray = this.add.image(cardTrayPos.x, cardTrayPos.y, 'card_tray_vert_mini');
    cardTray.setOrigin(0, 1);
    trayContainer.add(cardTray);

    // Corner overlay with color tint
    const cornerPos = convertIOSChildCoordinates(67 - 1, 0 + 30 - 443);
    const cornerOverlay = this.add.image(cornerPos.x, cornerPos.y, 'port_corner_tint_mini');
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
   * Original iOS: Slides 380 pixels (760 in Phaser)
   * Collapsed = showing small tab, Expanded = fully visible slid down
   */
  private toggleMiniPlayerTray(tray: PlayerTrayData): void {
    tray.expanded = !tray.expanded;

    const slideAmount = 380 * 2; // 380 iOS pixels = 760 Phaser pixels

    // Calculate Y positions
    // Collapsed: mostly off-screen, showing tab (-760)
    // Expanded: fully visible, slid down (0)
    const collapsedY = -slideAmount;
    const expandedY = 0;

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
