/**
 * Territory Selector Modal
 * UI for selecting a territory to place a colony
 * Used by Colony Constructor, Terraforming Station, and Colonist Hub
 */

import * as Phaser from 'phaser';
import { Territory } from '../../game/territory';
import { Player } from '../../game/player';

/**
 * Territory selection callback
 */
export type TerritorySelectorCallback = (territoryId: string | null) => void;

/**
 * Territory option display data
 */
interface TerritoryOption {
  territory: Territory;
  isAvailable: boolean;
  reason?: string; // Why unavailable (if applicable)
}

/**
 * Modal for selecting which territory to place a colony on
 */
export class TerritorySelectorModal extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private panel: Phaser.GameObjects.Graphics;
  private titleText: Phaser.GameObjects.Text;
  private closeButton: Phaser.GameObjects.Container;
  private territoryButtons: Phaser.GameObjects.Container[];
  private callback: TerritorySelectorCallback | null = null;
  
  private readonly MODAL_WIDTH = 800;
  private readonly MODAL_HEIGHT = 900;
  private readonly BUTTON_WIDTH = 700;
  private readonly BUTTON_HEIGHT = 90;
  private readonly BUTTON_SPACING = 10;

  constructor(scene: Phaser.Scene) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2);
    
    this.territoryButtons = [];
    this.createBackground();
    this.createPanel();
    this.createTitle();
    this.createCloseButton();
    
    this.setVisible(false);
    this.setDepth(1000); // High depth to appear above game elements
    
    scene.add.existing(this);
  }

  /**
   * Create semi-transparent background overlay
   */
  private createBackground(): void {
    this.background = this.scene.add.graphics();
    this.background.fillStyle(0x000000, 0.7);
    this.background.fillRect(
      -this.scene.scale.width / 2,
      -this.scene.scale.height / 2,
      this.scene.scale.width,
      this.scene.scale.height
    );
    this.background.setInteractive(
      new Phaser.Geom.Rectangle(
        -this.scene.scale.width / 2,
        -this.scene.scale.height / 2,
        this.scene.scale.width,
        this.scene.scale.height
      ),
      Phaser.Geom.Rectangle.Contains
    );
    this.add(this.background);
  }

  /**
   * Create main modal panel with gradient and glow effect
   */
  private createPanel(): void {
    this.panel = this.scene.add.graphics();
    
    // Outer glow effect
    this.panel.fillStyle(0x4a90e2, 0.15);
    this.panel.fillRoundedRect(
      -this.MODAL_WIDTH / 2 - 8,
      -this.MODAL_HEIGHT / 2 - 8,
      this.MODAL_WIDTH + 16,
      this.MODAL_HEIGHT + 16,
      20
    );
    
    // Main panel background
    this.panel.fillStyle(0x1a1a2e, 1);
    this.panel.fillRoundedRect(
      -this.MODAL_WIDTH / 2,
      -this.MODAL_HEIGHT / 2,
      this.MODAL_WIDTH,
      this.MODAL_HEIGHT,
      16
    );
    
    // Border with gradient effect
    this.panel.lineStyle(4, 0x4a90e2, 1);
    this.panel.strokeRoundedRect(
      -this.MODAL_WIDTH / 2,
      -this.MODAL_HEIGHT / 2,
      this.MODAL_WIDTH,
      this.MODAL_HEIGHT,
      16
    );
    
    // Inner highlight
    this.panel.lineStyle(2, 0x6eb5ff, 0.5);
    this.panel.strokeRoundedRect(
      -this.MODAL_WIDTH / 2 + 4,
      -this.MODAL_HEIGHT / 2 + 4,
      this.MODAL_WIDTH - 8,
      this.MODAL_HEIGHT - 8,
      14
    );
    
    this.add(this.panel);
  }

  /**
   * Create title text
   */
  private createTitle(): void {
    this.titleText = this.scene.add.text(
      0,
      -this.MODAL_HEIGHT / 2 + 40,
      'Choose Territory for Colony',
      {
        fontSize: '36px',
        fontFamily: 'Arial Black',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center'
      }
    );
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);
  }

  /**
   * Create close button (X in top-right)
   */
  private createCloseButton(): void {
    this.closeButton = this.scene.add.container(
      this.MODAL_WIDTH / 2 - 40,
      -this.MODAL_HEIGHT / 2 + 40
    );
    
    const closeCircle = this.scene.add.circle(0, 0, 24, 0x666666);
    closeCircle.setStrokeStyle(2, 0xffffff);
    
    const closeX = this.scene.add.text(0, 0, '✕', {
      fontSize: '28px',
      color: '#ffffff'
    });
    closeX.setOrigin(0.5);
    
    this.closeButton.add([closeCircle, closeX]);
    this.closeButton.setSize(48, 48);
    this.closeButton.setInteractive(
      new Phaser.Geom.Circle(0, 0, 24),
      Phaser.Geom.Circle.Contains
    );
    
    this.closeButton.on('pointerdown', () => {
      this.hide(null);
    });
    
    this.closeButton.on('pointerover', () => {
      closeCircle.setFillStyle(0x888888);
    });
    
    this.closeButton.on('pointerout', () => {
      closeCircle.setFillStyle(0x666666);
    });
    
    this.add(this.closeButton);
  }

  /**
   * Show the modal with territory options
   * @param territories All territories in the game
   * @param currentPlayer The player placing the colony
   * @param callback Function to call when territory is selected (or null if cancelled)
   */
  show(
    territories: Territory[],
    currentPlayer: Player,
    callback: TerritorySelectorCallback
  ): void {
    this.callback = callback;
    
    // Clear previous buttons
    this.territoryButtons.forEach(btn => btn.destroy());
    this.territoryButtons = [];
    
    // Prepare territory options
    const options: TerritoryOption[] = territories.map(territory => {
      const isAvailable = territory.canPlaceColony(currentPlayer.id);
      let reason: string | undefined;
      
      if (territory.isFull()) {
        reason = 'Territory Full';
      } else if (territory.hasRepulsorField()) {
        reason = 'Blocked by Repulsor Field';
      }
      
      return { territory, isAvailable, reason };
    });
    
    // Create buttons for each territory
    const startY = -this.MODAL_HEIGHT / 2 + 120;
    
    options.forEach((option, index) => {
      const button = this.createTerritoryButton(
        option,
        currentPlayer,
        0,
        startY + index * (this.BUTTON_HEIGHT + this.BUTTON_SPACING)
      );
      this.territoryButtons.push(button);
      this.add(button);
    });
    
    // Show modal with entrance animation
    this.setVisible(true);
    this.setAlpha(0);
    this.setScale(0.9);
    
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  /**
   * Create a button for a territory option
   */
  private createTerritoryButton(
    option: TerritoryOption,
    currentPlayer: Player,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const button = this.scene.add.container(x, y);
    const { territory, isAvailable, reason } = option;
    
    // Button background
    const bg = this.scene.add.graphics();
    const bgColor = isAvailable ? 0x2c5f2d : 0x4a4a4a;
    const borderColor = isAvailable ? 0x4ade80 : 0x666666;
    
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(
      -this.BUTTON_WIDTH / 2,
      -this.BUTTON_HEIGHT / 2,
      this.BUTTON_WIDTH,
      this.BUTTON_HEIGHT,
      8
    );
    bg.lineStyle(3, borderColor, 1);
    bg.strokeRoundedRect(
      -this.BUTTON_WIDTH / 2,
      -this.BUTTON_HEIGHT / 2,
      this.BUTTON_WIDTH,
      this.BUTTON_HEIGHT,
      8
    );
    button.add(bg);
    
    // Territory name
    const nameText = this.scene.add.text(
      -this.BUTTON_WIDTH / 2 + 20,
      -this.BUTTON_HEIGHT / 2 + 15,
      territory.name,
      {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: isAvailable ? '#ffffff' : '#999999',
        fontStyle: 'bold'
      }
    );
    button.add(nameText);
    
    // Territory bonus description
    const bonusText = this.scene.add.text(
      -this.BUTTON_WIDTH / 2 + 20,
      -this.BUTTON_HEIGHT / 2 + 45,
      territory.bonusDescription,
      {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: isAvailable ? '#cccccc' : '#777777'
      }
    );
    button.add(bonusText);
    
    // Colony count and control status
    const colonyCount = territory.getColonies().length;
    const maxColonies = territory.maxColonies;
    const controllingPlayer = territory.getControllingPlayer();
    const isControlled = controllingPlayer === currentPlayer.id;
    
    const statusText = this.scene.add.text(
      this.BUTTON_WIDTH / 2 - 20,
      0,
      `${colonyCount}/${maxColonies}\n${isControlled ? '★ Controlled' : controllingPlayer ? 'Enemy' : 'Unclaimed'}`,
      {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: isAvailable ? '#ffffff' : '#777777',
        align: 'right'
      }
    );
    statusText.setOrigin(1, 0.5);
    button.add(statusText);
    
    // Reason for unavailability (if applicable)
    if (!isAvailable && reason) {
      const reasonText = this.scene.add.text(
        -this.BUTTON_WIDTH / 2 + 20,
        this.BUTTON_HEIGHT / 2 - 15,
        reason,
        {
          fontSize: '14px',
          fontFamily: 'Arial',
          color: '#ff6b6b',
          fontStyle: 'italic'
        }
      );
      button.add(reasonText);
    }
    
    // Make button interactive if available
    if (isAvailable) {
      button.setSize(this.BUTTON_WIDTH, this.BUTTON_HEIGHT);
      button.setInteractive(
        new Phaser.Geom.Rectangle(
          -this.BUTTON_WIDTH / 2,
          -this.BUTTON_HEIGHT / 2,
          this.BUTTON_WIDTH,
          this.BUTTON_HEIGHT
        ),
        Phaser.Geom.Rectangle.Contains
      );
      
      button.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x3a7f3d, 1);
        bg.fillRoundedRect(
          -this.BUTTON_WIDTH / 2,
          -this.BUTTON_HEIGHT / 2,
          this.BUTTON_WIDTH,
          this.BUTTON_HEIGHT,
          8
        );
        bg.lineStyle(3, 0x5ef362, 1);
        bg.strokeRoundedRect(
          -this.BUTTON_WIDTH / 2,
          -this.BUTTON_HEIGHT / 2,
          this.BUTTON_WIDTH,
          this.BUTTON_HEIGHT,
          8
        );
      });
      
      button.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(bgColor, 1);
        bg.fillRoundedRect(
          -this.BUTTON_WIDTH / 2,
          -this.BUTTON_HEIGHT / 2,
          this.BUTTON_WIDTH,
          this.BUTTON_HEIGHT,
          8
        );
        bg.lineStyle(3, borderColor, 1);
        bg.strokeRoundedRect(
          -this.BUTTON_WIDTH / 2,
          -this.BUTTON_HEIGHT / 2,
          this.BUTTON_WIDTH,
          this.BUTTON_HEIGHT,
          8
        );
      });
      
      button.on('pointerdown', () => {
        this.hide(territory.id);
      });
    }
    
    return button;
  }

  /**
   * Hide the modal and trigger callback
   */
  private hide(selectedTerritoryId: string | null): void {
    this.setVisible(false);
    
    if (this.callback) {
      this.callback(selectedTerritoryId);
      this.callback = null;
    }
  }

  /**
   * Cleanup
   */
  destroy(fromScene?: boolean): void {
    this.territoryButtons.forEach(btn => btn.destroy());
    this.territoryButtons = [];
    super.destroy(fromScene);
  }
}
