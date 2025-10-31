import { convertIOSChildCoordinates, PLAYER_COLORS } from '../helpers';
import { ImageButton } from '../ui/image-button';
import { LabeledButton } from '../ui/labeled-button';
import { Player } from '../game/player';

/**
 * Main player HUD layer shown at the bottom of the screen
 * Based on LayerHUDPort.m from the original iOS implementation
 * 
 * Phase 5: Now connected to game state for real-time resource/colony display
 */
export class PlayerHUDLayer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private playerIndex: number;
  
  // Phase 5: Resource and stat labels
  private playerScoreLabel: Phaser.GameObjects.Text | null = null;
  private oreLabel: Phaser.GameObjects.Text | null = null;
  private fuelLabel: Phaser.GameObjects.Text | null = null;
  private colonyLabel: Phaser.GameObjects.Text | null = null;
  private diceLabel: Phaser.GameObjects.Text | null = null;
  
  // Phase 7: Bradbury Plateau re-roll button
  private rerollButton: LabeledButton | null = null;
  private rerollAvailable: boolean = false;

  constructor(scene: Phaser.Scene, playerIndex: number = 0) {
    this.scene = scene;
    this.playerIndex = playerIndex;
    
    // iOS LayerHUDPort.m line 84:
    //   uiFrame.position = ccp(768 * 0.5, -117) initially, then animates to
    //   ccp(uiFrame.position.x, 234 * 0.5 - 19) = (384, 98)
    // 
    // The HUD frame sprite is 1500×468 pixels
    // 234 = 468/2 (half-height at @1x scale)
    // Position: 234 * 0.5 - 19 = 117 - 19 = 98 from bottom (center of frame)
    //
    // iOS coords (1536×2048 @2x): Y=98 from bottom
    // Phaser coords: Y = (2048 - 98) = 1950 from top
    // X: 768 * 0.5 = 384 iOS @1x = 768 Phaser @2x
    this.container = scene.add.container(768, 1950); // Correct position matching iOS
    this.createHUD();
  }
  
  /**
   * Phase 5: Update display with current player state
   */
  public updatePlayerState(player: Player): void {
    if (this.oreLabel) {
      this.oreLabel.setText(player.resources.ore.toString());
    }
    if (this.fuelLabel) {
      this.fuelLabel.setText(player.resources.fuel.toString());
    }
    if (this.colonyLabel) {
      this.colonyLabel.setText(player.colonies.length.toString());
    }
    if (this.diceLabel) {
      // TODO: Get actual ship count when ships are visible
      this.diceLabel.setText('3'); // Placeholder
    }
    if (this.playerScoreLabel) {
      this.playerScoreLabel.setText(player.victoryPoints.total.toString());
    }
  }

  private createHUD(): void {
    // Frame sprite (bottom-anchored)
    const frameSprite = this.scene.add.image(0, 0, 'player_tab_large');
    frameSprite.setOrigin(0.5, 1);
    this.container.add(frameSprite);

    // Tech card tray (must be first/bottom-most layer per UILayerTagCardTray = 0)
    const cardTrayPos = convertIOSChildCoordinates(706 - 375 - 148 - 349, 182 - 21 - 117 + 3);
    const cardTray = this.scene.add.image(cardTrayPos.x, cardTrayPos.y, 'card_tray_horiz');
    cardTray.setOrigin(0, 0.5);
    this.container.add(cardTray);

    // Roll button
    const rollButtonPos = convertIOSChildCoordinates(635 - 375, 92 - 117);
    const rollButton = new LabeledButton(
      this.scene,
      rollButtonPos.x,
      rollButtonPos.y,
      'button_roll_up',
      'button_roll_down',
      'ROLL',
      '#000000',
      32,
      () => console.log('Roll button clicked')
    );
    this.container.add(rollButton.getContainer());

    // Undo button
    const undoButtonPos = convertIOSChildCoordinates(640 + 62 - 375, 192 - 117);
    const undoButton = new ImageButton(
      this.scene,
      undoButtonPos.x,
      undoButtonPos.y,
      'tray_btn_undo',
      'tray_btn_undo_active',
      () => console.log('Undo clicked')
    );
    this.container.add(undoButton.getContainer());

    // Redo button
    const redoButtonPos = convertIOSChildCoordinates(640 + 62 + 68 - 375, 192 - 117);
    const redoButton = new ImageButton(
      this.scene,
      redoButtonPos.x,
      redoButtonPos.y,
      'tray_btn_redo',
      'tray_btn_redo_active',
      () => console.log('Redo clicked')
    );
    this.container.add(redoButton.getContainer());

    // Done button
    const doneButtonPos = convertIOSChildCoordinates(640 + 62 + 68 + 68 - 375, 192 - 117);
    const doneButton = new ImageButton(
      this.scene,
      doneButtonPos.x,
      doneButtonPos.y,
      'tray_btn_done',
      'tray_btn_done_active',
      () => console.log('Done clicked')
    );
    this.container.add(doneButton.getContainer());

    // Player score label
    const playerScorePos = convertIOSChildCoordinates(705 - 375, 193 - 117);
    this.playerScoreLabel = this.scene.add.text(playerScorePos.x, playerScorePos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '84px',
      color: '#ffffff',
    });
    this.playerScoreLabel.setOrigin(0.5, 0.5);
    this.container.add(this.playerScoreLabel);

    // Resource labels
    const oreLabelPos = convertIOSChildCoordinates(706 - 375 - 148, 182 + 22 - 117);
    this.oreLabel = this.scene.add.text(oreLabelPos.x, oreLabelPos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    this.oreLabel.setOrigin(0.5, 0.5);
    this.container.add(this.oreLabel);

    const fuelLabelPos = convertIOSChildCoordinates(706 - 375 - 148 + 35, 182 + 22 - 117);
    this.fuelLabel = this.scene.add.text(fuelLabelPos.x, fuelLabelPos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    this.fuelLabel.setOrigin(0.5, 0.5);
    this.container.add(this.fuelLabel);

    const colonyLabelPos = convertIOSChildCoordinates(706 - 375 - 148 + 35 + 35, 182 + 22 - 117);
    this.colonyLabel = this.scene.add.text(colonyLabelPos.x, colonyLabelPos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    this.colonyLabel.setOrigin(0.5, 0.5);
    this.container.add(this.colonyLabel);

    const diceLabelPos = convertIOSChildCoordinates(706 - 375 - 148 + 35 + 35 + 35, 182 + 22 - 117);
    this.diceLabel = this.scene.add.text(diceLabelPos.x, diceLabelPos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    this.diceLabel.setOrigin(0.5, 0.5);
    this.container.add(this.diceLabel);

    // Colony and die sprites
    const colorNames = ['red', 'green', 'blue', 'yellow'];
    const colorName = colorNames[this.playerIndex];
    
    const colonySprite = this.scene.add.image(colonyLabelPos.x + 2, colonyLabelPos.y + 54, `colony_${colorName}`);
    this.container.add(colonySprite);

    const dieSprite = this.scene.add.image(diceLabelPos.x + 2, diceLabelPos.y + 54, `die_${colorName}`);
    this.container.add(dieSprite);

    // Corner overlay with color tint
    const cornerPos = convertIOSChildCoordinates(67 + 640 - 375, 186 - 117);
    const cornerOverlay = this.scene.add.image(cornerPos.x, cornerPos.y, 'port_corner_tint');
    cornerOverlay.setTint(PLAYER_COLORS[this.playerIndex]);
    cornerOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.container.add(cornerOverlay);

    // Edge overlay with color tint
    const edgePos = convertIOSChildCoordinates(67 - 21 - 25 - 375, 186 - 68 - 117);
    const edgeOverlay = this.scene.add.image(edgePos.x, edgePos.y, 'port_edge_tint');
    edgeOverlay.setTint(PLAYER_COLORS[this.playerIndex]);
    edgeOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.container.add(edgeOverlay);

    // Menu button
    const menuButtonPos = convertIOSChildCoordinates(67 - 21 - 25 - 375 + 94 - 40, 126 - 117 - 82 - 2);
    const menuButton = new LabeledButton(
      this.scene,
      menuButtonPos.x,
      menuButtonPos.y,
      'menu_button_68',
      'menu_button_68_active',
      'MENU',
      '#000000',
      11,
      () => console.log('Menu clicked')
    );
    this.container.add(menuButton.getContainer());

    // Phase 7: Re-roll button (Bradbury Plateau bonus)
    const rerollButtonPos = convertIOSChildCoordinates(635 - 375 + 120, 92 - 117);
    this.rerollButton = new LabeledButton(
      this.scene,
      rerollButtonPos.x,
      rerollButtonPos.y,
      'menu_button_68',
      'menu_button_68_active',
      'RE-ROLL',
      '#ffffff',
      18,
      () => this.onRerollClicked()
    );
    this.rerollButton.getContainer().setVisible(false); // Hidden by default
    this.container.add(this.rerollButton.getContainer());

    // Help button
    const helpButtonPos = convertIOSChildCoordinates(67 - 21 - 25 - 375 + 94 + 40, 126 - 117 - 82 - 2);
    const helpButton = new LabeledButton(
      this.scene,
      helpButtonPos.x,
      helpButtonPos.y,
      'menu_button_68',
      'menu_button_68_active',
      'HELP',
      '#000000',
      11,
      () => console.log('Help clicked')
    );
    this.container.add(helpButton.getContainer());
  }

  /**
   * Phase 7: Set re-roll button visibility and availability
   */
  public setRerollAvailable(available: boolean): void {
    this.rerollAvailable = available;
    if (this.rerollButton) {
      this.rerollButton.getContainer().setVisible(available);
      if (!available) {
        // Grey out if used
        this.rerollButton.getContainer().setAlpha(0.5);
      } else {
        this.rerollButton.getContainer().setAlpha(1.0);
      }
    }
  }

  /**
   * Phase 7: Callback for re-roll button click
   */
  private onRerollClicked(): void {
    // This will be set by GameScene
    console.log('Re-roll button clicked');
  }

  /**
   * Phase 7: Set callback for re-roll button
   */
  public setRerollCallback(callback: () => void): void {
    this.onRerollClicked = callback;
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
