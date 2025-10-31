import { GAME_WIDTH } from '../main';
import { convertIOSChildCoordinates, PLAYER_COLORS } from '../helpers';
import { Player } from '../game/player';

/**
 * Mini player HUD layer shown at the top of the screen for non-active players
 * Based on LayerPortPlayerMiniHUD.m from the original iOS implementation
 * 
 * Phase 5: Now connected to game state for real-time resource/colony display
 */
export class MiniPlayerHUDLayer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private playerIndex: number;
  private numPlayers: number;
  private expanded: boolean = false;
  
  // Phase 5: Resource and stat labels
  private scoreLabel: Phaser.GameObjects.Text | null = null;
  private oreLabel: Phaser.GameObjects.Text | null = null;
  private fuelLabel: Phaser.GameObjects.Text | null = null;
  private colonyLabel: Phaser.GameObjects.Text | null = null;
  private diceLabel: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, playerIndex: number, numPlayers: number) {
    this.scene = scene;
    this.playerIndex = playerIndex;
    this.numPlayers = numPlayers;
    
    this.container = scene.add.container(0, 0);
    this.createMiniHUD();
    this.positionTray();
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
    if (this.scoreLabel) {
      this.scoreLabel.setText(player.victoryPoints.total.toString());
    }
  }

  private createMiniHUD(): void {
    // Frame sprite (bottom-anchored)
    const frameSprite = this.scene.add.image(0, 0, 'player_tab_full_RO');
    frameSprite.setOrigin(0.5, 1);
    this.container.add(frameSprite);

    // Player score label
    const scorePos = convertIOSChildCoordinates(74 - 148 + 35 + 35 + 35 + 35 - 2, 4 + 30 - 443, 498);
    this.scoreLabel = this.scene.add.text(scorePos.x, scorePos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '84px',
      color: '#ffffff',
    });
    this.scoreLabel.setOrigin(0.5, 0.5);
    this.container.add(this.scoreLabel);

    // Resource labels
    const oreLabelPos = convertIOSChildCoordinates(75 - 148 - 2, 0 - 17 + 30 - 443, 498);
    this.oreLabel = this.scene.add.text(oreLabelPos.x, oreLabelPos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    this.oreLabel.setOrigin(0.5, 0.5);
    this.container.add(this.oreLabel);

    const fuelLabelPos = convertIOSChildCoordinates(73 - 148 + 35 - 2, 0 - 17 + 30 - 443, 498);
    this.fuelLabel = this.scene.add.text(fuelLabelPos.x, fuelLabelPos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    this.fuelLabel.setOrigin(0.5, 0.5);
    this.container.add(this.fuelLabel);

    const colonyLabelPos = convertIOSChildCoordinates(71 - 148 + 35 + 35 - 2, 0 - 17 + 30 - 443, 498);
    this.colonyLabel = this.scene.add.text(colonyLabelPos.x, colonyLabelPos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    this.colonyLabel.setOrigin(0.5, 0.5);
    this.container.add(this.colonyLabel);

    const diceLabelPos = convertIOSChildCoordinates(70 - 148 + 35 + 35 + 35 - 2, 0 - 17 + 30 - 443, 498);
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

    const colonySprite = this.scene.add.image(colonyLabelPos.x, colonyLabelPos.y + 48, `colony_${colorName}`);
    this.container.add(colonySprite);

    const dieSprite = this.scene.add.image(diceLabelPos.x, diceLabelPos.y + 48, `die_${colorName}`);
    this.container.add(dieSprite);

    // Tech card tray
    const cardTrayPos = convertIOSChildCoordinates(-182 * 0.5 + 3, -223 + 114, 498);
    const cardTray = this.scene.add.image(cardTrayPos.x, cardTrayPos.y, 'card_tray_vert_mini');
    cardTray.setOrigin(0, 1);
    this.container.add(cardTray);

    // Corner overlay with color tint
    const cornerPos = convertIOSChildCoordinates(67 - 1, 0 + 30 - 443, 498);
    const cornerOverlay = this.scene.add.image(cornerPos.x, cornerPos.y, 'port_corner_tint_mini');
    cornerOverlay.setTint(PLAYER_COLORS[this.playerIndex]);
    cornerOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.container.add(cornerOverlay);

    // Make interactive
    const frameSprite2 = this.container.getAt(0) as Phaser.GameObjects.Image;
    const hitArea = new Phaser.Geom.Rectangle(
      -frameSprite2.width / 2,
      -frameSprite2.height,
      frameSprite2.width,
      130
    );
    this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    this.container.on('pointerdown', () => this.toggle());
  }

  private positionTray(): void {
    const frameSprite = this.container.getAt(0) as Phaser.GameObjects.Image;
    const frameWidth = frameSprite.width;
    const spacing = 5 * 2;

    // X position based on player index and total players
    const posX = GAME_WIDTH * 0.5 - (this.numPlayers * 0.5 - this.playerIndex - 0.5) * (frameWidth + spacing);

    // Y position - show at top with tab visible
    // Frame is anchored at bottom (origin 0.5, 1), so Y position is where bottom edge sits
    // To show tab at top of screen, position the bottom edge at the tab height
    const visibleTabHeight = 120;  // Increased from 60 to show more of the tab
    const collapsedY = visibleTabHeight;

    this.container.setPosition(posX, collapsedY);
    this.container.setDepth(1000); // Above board and facilities
  }

  public toggle(): void {
    this.expanded = !this.expanded;

    const frameSprite = this.container.getAt(0) as Phaser.GameObjects.Image;
    const visibleTabHeight = 120;
    const collapsedY = visibleTabHeight;  // Show just the tab
    const expandedY = frameSprite.height;  // Show full frame

    const targetY = this.expanded ? expandedY : collapsedY;

    this.scene.tweens.add({
      targets: this.container,
      y: targetY,
      duration: 500,
      ease: this.expanded ? 'Sine.easeOut' : 'Sine.easeIn',
    });
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
