/**
 * AlienArtifactCardDisplay - Visual display of visible tech cards at Alien Artifact
 * 
 * Shows:
 * - 3 visible tech cards
 * - Deck size
 * - Discard pile size
 * - Cycle button (discard all visible and draw 3 new)
 * - Claim button (for each card when eligible)
 */

import * as Phaser from 'phaser';
import { TechCard } from '../game/tech-cards';

/**
 * Individual visible tech card sprite at Alien Artifact
 */
export class VisibleTechCardSprite extends Phaser.GameObjects.Container {
  private card: TechCard;
  private cardGraphic: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private typeText: Phaser.GameObjects.Text;
  private claimButton: Phaser.GameObjects.Container | null = null;
  private isHovered: boolean = false;

  // Callbacks
  public onClaim?: (card: TechCard) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    card: TechCard
  ) {
    super(scene, x, y);

    this.card = card;

    // Create card background
    this.cardGraphic = scene.add.graphics();
    this.add(this.cardGraphic);

    // Create name text
    this.nameText = scene.add.text(0, -50, card.name, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 110 }
    });
    this.nameText.setOrigin(0.5, 0.5);
    this.add(this.nameText);

    // Create type text
    this.typeText = scene.add.text(0, 40, this.getTypeLabel(), {
      fontSize: '10px',
      color: '#ffff00',
      fontStyle: 'bold'
    });
    this.typeText.setOrigin(0.5, 0.5);
    this.add(this.typeText);

    // Create claim button
    this.createClaimButton(scene);

    // Draw initial card
    this.drawCard();

    // Set interactive for hover
    this.setSize(120, 160);
    this.setInteractive({ cursor: 'pointer' });

    // Hover effects
    this.on('pointerover', () => {
      this.isHovered = true;
      this.drawCard();
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.drawCard();
    });

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Get type label for display
   */
  private getTypeLabel(): string {
    if (this.card.victoryPoints > 0) {
      return `VP (${this.card.victoryPoints})`;
    }
    return this.card.type.replace(/_/g, ' ').toUpperCase();
  }

  /**
   * Create claim button
   */
  private createClaimButton(scene: Phaser.Scene): void {
    this.claimButton = scene.add.container(0, 70);
    
    const buttonBg = scene.add.rectangle(0, 0, 100, 28, 0x00ff00, 1);
    buttonBg.setStrokeStyle(2, 0x000000);
    
    const buttonText = scene.add.text(0, 0, 'CLAIM', {
      fontSize: '14px',
      color: '#000000',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5, 0.5);
    
    this.claimButton.add([buttonBg, buttonText]);
    this.claimButton.setSize(100, 28);
    this.claimButton.setInteractive({ cursor: 'pointer' });
    
    this.claimButton.on('pointerdown', () => {
      if (this.onClaim) {
        this.onClaim(this.card);
      }
    });

    // Hover effect for button
    this.claimButton.on('pointerover', () => {
      buttonBg.setFillStyle(0x00dd00);
    });

    this.claimButton.on('pointerout', () => {
      buttonBg.setFillStyle(0x00ff00);
    });

    this.add(this.claimButton);
  }

  /**
   * Draw the card
   */
  private drawCard(): void {
    this.cardGraphic.clear();

    const width = 120;
    const height = 160;
    const radius = 10;

    // Card background color based on type
    let bgColor: number;
    if (this.card.victoryPoints > 0) {
      bgColor = 0x9966ff; // Purple for VP cards
    } else if (this.card.type.includes('manipulation')) {
      bgColor = 0x3366ff; // Blue for manipulation
    } else if (this.card.type.includes('resource')) {
      bgColor = 0xff6633; // Orange for resources
    } else if (this.card.type.includes('combat') || this.card.type.includes('defense')) {
      bgColor = 0xff3333; // Red for combat
    } else {
      bgColor = 0x666666; // Gray for others
    }

    // Adjust alpha based on state
    const alpha = this.isHovered ? 1.0 : 0.85;

    // Draw rounded rectangle for card
    this.cardGraphic.fillStyle(bgColor, alpha);
    this.cardGraphic.fillRoundedRect(-width/2, -height/2, width, height, radius);

    // Draw border
    const borderColor = this.isHovered ? 0xffff00 : 0xffffff;
    const borderWidth = this.isHovered ? 3 : 2;
    this.cardGraphic.lineStyle(borderWidth, borderColor, 1);
    this.cardGraphic.strokeRoundedRect(-width/2, -height/2, width, height, radius);
  }

  /**
   * Enable/disable claim button
   */
  public setClaimEnabled(enabled: boolean): void {
    if (this.claimButton) {
      this.claimButton.setVisible(enabled);
      this.claimButton.setAlpha(enabled ? 1.0 : 0.5);
    }
  }

  /**
   * Get card data
   */
  public getCard(): TechCard {
    return this.card;
  }

  /**
   * Clean up
   */
  public destroy(fromScene?: boolean): void {
    if (this.claimButton) {
      this.claimButton.destroy();
    }
    this.cardGraphic.destroy();
    this.nameText.destroy();
    this.typeText.destroy();
    super.destroy(fromScene);
  }
}

/**
 * Alien Artifact card display panel
 */
export class AlienArtifactCardDisplay extends Phaser.GameObjects.Container {
  private cardSprites: VisibleTechCardSprite[] = [];
  private deckSizeText: Phaser.GameObjects.Text;
  private discardSizeText: Phaser.GameObjects.Text;
  private cycleButton: Phaser.GameObjects.Container;
  private titleText: Phaser.GameObjects.Text;
  private canClaim: boolean = false;

  // Callbacks
  public onClaimCard?: (card: TechCard) => void;
  public onCycleCards?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number
  ) {
    super(scene, x, y);

    // Create background panel
    const panelWidth = 420;
    const panelHeight = 280;
    const bg = scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.9);
    bg.setStrokeStyle(3, 0xffff00);
    bg.setOrigin(0, 0);
    this.add(bg);

    // Create title
    this.titleText = scene.add.text(10, 10, 'Alien Artifact - Tech Cards', {
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold'
    });
    this.add(this.titleText);

    // Create deck/discard info
    this.deckSizeText = scene.add.text(10, 240, 'Deck: 0', {
      fontSize: '12px',
      color: '#ffffff'
    });
    this.add(this.deckSizeText);

    this.discardSizeText = scene.add.text(10, 256, 'Discard: 0', {
      fontSize: '12px',
      color: '#ffffff'
    });
    this.add(this.discardSizeText);

    // Create cycle button
    this.cycleButton = this.createCycleButton(scene);
    this.add(this.cycleButton);

    // Add to scene
    scene.add.existing(this);
    this.setDepth(2000); // Above everything
    this.setVisible(false); // Hidden by default
  }

  /**
   * Create cycle button
   */
  private createCycleButton(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const button = scene.add.container(300, 245);
    
    const buttonBg = scene.add.rectangle(0, 0, 100, 30, 0x3366ff, 1);
    buttonBg.setStrokeStyle(2, 0xffffff);
    
    const buttonText = scene.add.text(0, 0, 'CYCLE', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5, 0.5);
    
    button.add([buttonBg, buttonText]);
    button.setSize(100, 30);
    button.setInteractive({ cursor: 'pointer' });
    
    button.on('pointerdown', () => {
      if (this.onCycleCards) {
        this.onCycleCards();
      }
    });

    // Hover effect
    button.on('pointerover', () => {
      buttonBg.setFillStyle(0x4488ff);
    });

    button.on('pointerout', () => {
      buttonBg.setFillStyle(0x3366ff);
    });

    return button;
  }

  /**
   * Update display with current cards
   */
  public updateDisplay(
    visibleCards: TechCard[],
    deckSize: number,
    discardSize: number,
    canClaimCard: boolean
  ): void {
    this.canClaim = canClaimCard;

    // Clear existing card sprites
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cardSprites = [];

    // Create new card sprites (3 cards side by side)
    const startX = 20;
    const startY = 120;
    const spacing = 130;

    visibleCards.forEach((card, index) => {
      const sprite = new VisibleTechCardSprite(
        this.scene,
        startX + (index * spacing),
        startY,
        card
      );

      sprite.onClaim = (claimedCard) => {
        if (this.onClaimCard && this.canClaim) {
          this.onClaimCard(claimedCard);
        }
      };

      // Only enable claim button if eligible
      sprite.setClaimEnabled(this.canClaim);

      this.cardSprites.push(sprite);
      this.add(sprite);
    });

    // Update deck/discard sizes
    this.deckSizeText.setText(`Deck: ${deckSize}`);
    this.discardSizeText.setText(`Discard: ${discardSize}`);
  }

  /**
   * Show the display
   */
  public show(): void {
    this.setVisible(true);
  }

  /**
   * Hide the display
   */
  public hide(): void {
    this.setVisible(false);
  }

  /**
   * Clean up
   */
  public destroy(fromScene?: boolean): void {
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cycleButton.destroy();
    this.deckSizeText.destroy();
    this.discardSizeText.destroy();
    this.titleText.destroy();
    super.destroy(fromScene);
  }
}
