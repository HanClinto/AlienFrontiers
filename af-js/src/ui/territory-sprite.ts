/**
 * ColonySprite - Visual representation of a player's colony on a territory
 * 
 * Handles:
 * - Visual appearance with player color
 * - Placement animation
 * - Hover effects
 */

import * as Phaser from 'phaser';

/**
 * Colony sprite class
 */
export class ColonySprite extends Phaser.GameObjects.Container {
  private colonyGraphic: Phaser.GameObjects.Graphics;
  private playerColor: number;
  private territoryName: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    territoryName: string,
    playerColor: string
  ) {
    super(scene, x, y);

    this.territoryName = territoryName;
    this.playerColor = Phaser.Display.Color.HexStringToColor(playerColor).color;

    // Create colony graphic (dome/building)
    this.colonyGraphic = scene.add.graphics();
    this.add(this.colonyGraphic);

    // Initial draw
    this.drawColony();

    // Set interactive for hover effect
    this.setSize(40, 40);
    this.setInteractive({ cursor: 'pointer' });

    // Hover effect
    this.on('pointerover', () => {
      this.setScale(1.1);
    });

    this.on('pointerout', () => {
      this.setScale(1.0);
    });

    // Add to scene
    scene.add.existing(this);

    // Play placement animation
    this.playPlacementAnimation();
  }

  /**
   * Draw the colony
   */
  private drawColony(): void {
    this.colonyGraphic.clear();

    // Colony base (hexagon or dome shape)
    this.colonyGraphic.fillStyle(this.playerColor, 1);
    this.colonyGraphic.beginPath();
    
    // Simple dome/semi-circle
    this.colonyGraphic.arc(0, 10, 20, Math.PI, 0, false);
    this.colonyGraphic.closePath();
    this.colonyGraphic.fillPath();

    // Base platform
    this.colonyGraphic.fillRect(-20, 10, 40, 5);

    // Outline
    this.colonyGraphic.lineStyle(2, 0x000000, 1);
    this.colonyGraphic.strokePath();
    this.colonyGraphic.strokeRect(-20, 10, 40, 5);

    // Window/detail
    this.colonyGraphic.fillStyle(0xffff00, 0.8);
    this.colonyGraphic.fillCircle(0, 5, 4);
  }

  /**
   * Play placement animation
   */
  private playPlacementAnimation(): void {
    // Start from scale 0 and pop in
    this.setScale(0);
    this.setAlpha(0);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Get territory name
   */
  public getTerritory(): string {
    return this.territoryName;
  }

  /**
   * Clean up
   */
  public destroy(fromScene?: boolean): void {
    this.colonyGraphic.destroy();
    super.destroy(fromScene);
  }
}

/**
 * TerritorySprite - Visual representation of a territory zone
 * 
 * Handles:
 * - Territory boundaries
 * - Control indicators
 * - Colony placement zones
 * - Hover effects showing bonuses
 */
export class TerritorySprite extends Phaser.GameObjects.Container {
  private territoryGraphic: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private bonusText: Phaser.GameObjects.Text | null = null;
  private territoryName: string;
  private controllingColor: number | null = null;
  private colonies: ColonySprite[] = [];
  private bonusVP: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    territoryName: string,
    bonusVP: number
  ) {
    super(scene, x, y);

    this.territoryName = territoryName;
    this.bonusVP = bonusVP;

    // Create territory graphic
    this.territoryGraphic = scene.add.graphics();
    this.add(this.territoryGraphic);

    // Create name text
    this.nameText = scene.add.text(0, -height/2 + 10, territoryName, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 5, y: 2 }
    });
    this.nameText.setOrigin(0.5, 0);
    this.add(this.nameText);

    // Initial draw
    this.drawTerritory(width, height);

    // Set interactive for hover
    this.setSize(width, height);
    this.setInteractive({ cursor: 'pointer' });

    // Hover effects
    this.on('pointerover', () => {
      this.showBonus();
      this.highlightTerritory(true);
    });

    this.on('pointerout', () => {
      this.hideBonus();
      this.highlightTerritory(false);
    });

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Draw the territory
   */
  private drawTerritory(width: number, height: number): void {
    this.territoryGraphic.clear();

    // Territory background (semi-transparent)
    const fillColor = this.controllingColor || 0x333333;
    const fillAlpha = this.controllingColor ? 0.3 : 0.1;
    
    this.territoryGraphic.fillStyle(fillColor, fillAlpha);
    this.territoryGraphic.fillRect(-width/2, -height/2, width, height);

    // Border
    const borderColor = this.controllingColor || 0x666666;
    this.territoryGraphic.lineStyle(2, borderColor, 0.8);
    this.territoryGraphic.strokeRect(-width/2, -height/2, width, height);
  }

  /**
   * Highlight territory
   */
  private highlightTerritory(highlight: boolean): void {
    if (highlight) {
      this.territoryGraphic.lineStyle(3, 0xffff00, 1);
      const bounds = this.getBounds();
      this.territoryGraphic.strokeRect(
        -bounds.width/2,
        -bounds.height/2,
        bounds.width,
        bounds.height
      );
    } else {
      // Redraw without highlight
      const bounds = this.getBounds();
      this.drawTerritory(bounds.width, bounds.height);
    }
  }

  /**
   * Show bonus text
   */
  private showBonus(): void {
    if (this.bonusText) return;

    const bonusStr = `+${this.bonusVP} VP at game end`;
    this.bonusText = this.scene.add.text(0, 20, bonusStr, {
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.bonusText.setOrigin(0.5, 0);
    this.add(this.bonusText);
  }

  /**
   * Hide bonus text
   */
  private hideBonus(): void {
    if (this.bonusText) {
      this.bonusText.destroy();
      this.bonusText = null;
    }
  }

  /**
   * Set controlling player color
   */
  public setControl(playerColor: string | null): void {
    if (playerColor) {
      this.controllingColor = Phaser.Display.Color.HexStringToColor(playerColor).color;
    } else {
      this.controllingColor = null;
    }

    // Redraw with new color
    const bounds = this.getBounds();
    this.drawTerritory(bounds.width, bounds.height);
  }

  /**
   * Add a colony to this territory
   */
  public addColony(colony: ColonySprite): void {
    this.colonies.push(colony);
    
    // Position colony within territory
    const index = this.colonies.length - 1;
    const spacing = 50;
    const startX = -spacing;
    
    colony.setPosition(
      this.x + startX + (index * spacing),
      this.y + 30
    );
  }

  /**
   * Get territory name
   */
  public getName(): string {
    return this.territoryName;
  }

  /**
   * Get number of colonies
   */
  public getColonyCount(): number {
    return this.colonies.length;
  }

  /**
   * Get bonus VP
   */
  public getBonusVP(): number {
    return this.bonusVP;
  }

  /**
   * Clean up
   */
  public destroy(fromScene?: boolean): void {
    this.colonies.forEach(colony => colony.destroy());
    this.territoryGraphic.destroy();
    this.nameText.destroy();
    if (this.bonusText) {
      this.bonusText.destroy();
    }
    super.destroy(fromScene);
  }
}

/**
 * Territory data for the game board
 */
export const TERRITORY_DATA = {
  'Asimov Crater': { bonusVP: 2, width: 200, height: 150, x: 200, y: 200 },
  'Burroughs Desert': { bonusVP: 3, width: 220, height: 140, x: 450, y: 200 },
  'Heinlein Plains': { bonusVP: 2, width: 200, height: 150, x: 700, y: 200 },
  'Herbert Valley': { bonusVP: 3, width: 220, height: 140, x: 200, y: 400 },
  'Bradbury Plateau': { bonusVP: 2, width: 200, height: 150, x: 450, y: 400 },
  'Clarke Mountains': { bonusVP: 3, width: 220, height: 140, x: 700, y: 400 }
};
