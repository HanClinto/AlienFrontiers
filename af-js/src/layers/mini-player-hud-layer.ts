import { GAME_WIDTH } from '../main';
import { convertIOSChildCoordinates, PLAYER_COLORS } from '../helpers';

/**
 * Mini player HUD layer shown at the top of the screen for non-active players
 * Based on LayerPortPlayerMiniHUD.m from the original iOS implementation
 */
export class MiniPlayerHUDLayer {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private playerIndex: number;
  private numPlayers: number;
  private expanded: boolean = false;

  constructor(scene: Phaser.Scene, playerIndex: number, numPlayers: number) {
    this.scene = scene;
    this.playerIndex = playerIndex;
    this.numPlayers = numPlayers;
    
    this.container = scene.add.container(0, 0);
    this.createMiniHUD();
    this.positionTray();
  }

  private createMiniHUD(): void {
    // Frame sprite (bottom-anchored)
    const frameSprite = this.scene.add.image(0, 0, 'player_tab_full_RO');
    frameSprite.setOrigin(0.5, 1);
    this.container.add(frameSprite);

    // Player score label
    const scorePos = convertIOSChildCoordinates(74 - 148 + 35 + 35 + 35 + 35 - 2, 4 + 30 - 443, 498);
    const scoreLabel = this.scene.add.text(scorePos.x, scorePos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '84px',
      color: '#ffffff',
    });
    scoreLabel.setOrigin(0.5, 0.5);
    this.container.add(scoreLabel);

    // Resource labels
    const oreLabelPos = convertIOSChildCoordinates(75 - 148 - 2, 0 - 17 + 30 - 443, 498);
    const oreLabel = this.scene.add.text(oreLabelPos.x, oreLabelPos.y, '0', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    oreLabel.setOrigin(0.5, 0.5);
    this.container.add(oreLabel);

    const fuelLabelPos = convertIOSChildCoordinates(73 - 148 + 35 - 2, 0 - 17 + 30 - 443, 498);
    const fuelLabel = this.scene.add.text(fuelLabelPos.x, fuelLabelPos.y, '2', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    fuelLabel.setOrigin(0.5, 0.5);
    this.container.add(fuelLabel);

    const colonyLabelPos = convertIOSChildCoordinates(71 - 148 + 35 + 35 - 2, 0 - 17 + 30 - 443, 498);
    const colonyLabel = this.scene.add.text(colonyLabelPos.x, colonyLabelPos.y, '3', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    colonyLabel.setOrigin(0.5, 0.5);
    this.container.add(colonyLabel);

    const diceLabelPos = convertIOSChildCoordinates(70 - 148 + 35 + 35 + 35 - 2, 0 - 17 + 30 - 443, 498);
    const diceLabel = this.scene.add.text(diceLabelPos.x, diceLabelPos.y, '5', {
      fontFamily: 'Arial',
      fontSize: '44px',
      color: '#000000',
    });
    diceLabel.setOrigin(0.5, 0.5);
    this.container.add(diceLabel);

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

    // Y position - collapsed state (showing tab)
    const slideDistance = 380 * 2;
    const collapsedY = -slideDistance;

    this.container.setPosition(posX, collapsedY);
  }

  public toggle(): void {
    this.expanded = !this.expanded;

    const slideAmount = 380 * 2;
    const collapsedY = -slideAmount;
    const expandedY = 0;

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
