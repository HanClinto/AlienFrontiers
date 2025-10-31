/**
 * TechCardHand - Visual display of player's tech card hand
 * 
 * Handles:
 * - Card display in player's hand
 * - Card selection/preview
 * - Card usage
 * - Card animations
 */

import * as Phaser from 'phaser';
import { TechCard, TechCardType } from '../game/tech-cards';

/**
 * Individual tech card sprite
 */
export class TechCardSprite extends Phaser.GameObjects.Container {
  private card: TechCard;
  private cardGraphic: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private typeText: Phaser.GameObjects.Text;
  private isSelected: boolean = false;
  private isHovered: boolean = false;

  // Callbacks
  public onSelect?: (card: TechCard) => void;
  public onUse?: (card: TechCard) => void;

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
    this.nameText = scene.add.text(0, -40, card.name, {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 90 }
    });
    this.nameText.setOrigin(0.5, 0.5);
    this.add(this.nameText);

    // Create type text
    this.typeText = scene.add.text(0, 35, card.type.toUpperCase(), {
      fontSize: '10px',
      color: '#ffff00',
      fontStyle: 'bold'
    });
    this.typeText.setOrigin(0.5, 0.5);
    this.add(this.typeText);

    // Draw initial card
    this.drawCard();

    // Set interactive
    this.setSize(100, 140);
    this.setInteractive({ cursor: 'pointer' });

    // Click to select
    this.on('pointerdown', () => {
      this.toggleSelection();
    });

    // Double-click to use
    this.on('pointerdblclick', () => {
      if (this.onUse) {
        this.onUse(this.card);
      }
    });

    // Hover effects
    this.on('pointerover', () => {
      this.isHovered = true;
      this.drawCard();
      this.setScale(1.1);
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.drawCard();
      this.setScale(1.0);
    });

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Draw the card
   */
  private drawCard(): void {
    this.cardGraphic.clear();

    const width = 100;
    const height = 140;
    const radius = 10;

    // Card background color based on type
    let bgColor: number;
    if (this.card.victoryPoints > 0) {
      bgColor = 0x9966ff; // Purple for VP cards
    } else if (this.card.type.includes('manipulation')) {
      bgColor = 0x3366ff; // Blue for manipulation
    } else if (this.card.type.includes('resource')) {
      bgColor = 0xff6633; // Orange for resources
    } else {
      bgColor = 0x666666; // Gray for others
    }

    // Adjust alpha based on state
    const alpha = this.isSelected ? 1.0 : (this.isHovered ? 0.9 : 0.7);

    // Draw rounded rectangle for card
    this.cardGraphic.fillStyle(bgColor, alpha);
    this.cardGraphic.fillRoundedRect(-width/2, -height/2, width, height, radius);

    // Draw border
    const borderColor = this.isSelected ? 0xffff00 : (this.isHovered ? 0xffffff : 0x000000);
    const borderWidth = this.isSelected ? 4 : 2;
    this.cardGraphic.lineStyle(borderWidth, borderColor, 1);
    this.cardGraphic.strokeRoundedRect(-width/2, -height/2, width, height, radius);

    // Draw VP indicator if card has VP
    if (this.card.victoryPoints && this.card.victoryPoints > 0) {
      this.cardGraphic.fillStyle(0xffff00, 1);
      this.cardGraphic.fillCircle(width/2 - 15, -height/2 + 15, 12);
      this.cardGraphic.lineStyle(2, 0x000000, 1);
      this.cardGraphic.strokeCircle(width/2 - 15, -height/2 + 15, 12);

      // Draw VP number
      const vpText = this.scene.add.text(width/2 - 15, -height/2 + 15, this.card.victoryPoints.toString(), {
        fontSize: '14px',
        color: '#000000',
        fontStyle: 'bold'
      });
      vpText.setOrigin(0.5, 0.5);
      this.add(vpText);
    }
  }

  /**
   * Toggle card selection
   */
  private toggleSelection(): void {
    this.isSelected = !this.isSelected;
    this.drawCard();

    if (this.isSelected && this.onSelect) {
      this.onSelect(this.card);
    }
  }

  /**
   * Set selected state
   */
  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.drawCard();
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
    this.cardGraphic.destroy();
    this.nameText.destroy();
    this.typeText.destroy();
    super.destroy(fromScene);
  }
}

/**
 * Tech card hand display
 */
export class TechCardHand extends Phaser.GameObjects.Container {
  private cardSprites: TechCardSprite[] = [];
  private selectedCard: TechCardSprite | null = null;
  private previewPanel: Phaser.GameObjects.Container | null = null;
  private useButton: Phaser.GameObjects.Container | null = null;
  private discardButton: Phaser.GameObjects.Container | null = null;

  // Callbacks
  public onUseCard?: (card: TechCard) => void;
  public onDiscardCard?: (card: TechCard) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number
  ) {
    super(scene, x, y);

    // Create background panel
    const bg = scene.add.rectangle(0, 0, 700, 180, 0x000000, 0.8);
    bg.setOrigin(0, 0);
    this.add(bg);

    // Create title
    const title = scene.add.text(10, 10, 'Tech Cards', {
      fontSize: '18px',
      color: '#ffff00',
      fontStyle: 'bold'
    });
    this.add(title);

    // Create buttons
    this.createButtons(scene);

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Create action buttons
   */
  private createButtons(scene: Phaser.Scene): void {
    // Use button
    this.useButton = scene.add.container(600, 140);
    const useBg = scene.add.rectangle(0, 0, 80, 30, 0x00ff00, 1);
    const useText = scene.add.text(0, 0, 'USE', {
      fontSize: '14px',
      color: '#000000',
      fontStyle: 'bold'
    });
    useText.setOrigin(0.5, 0.5);
    this.useButton.add([useBg, useText]);
    this.useButton.setSize(80, 30);
    this.useButton.setInteractive({ cursor: 'pointer' });
    this.useButton.on('pointerdown', () => this.handleUseCard());
    this.useButton.setVisible(false);
    this.add(this.useButton);

    // Discard button
    this.discardButton = scene.add.container(510, 140);
    const discardBg = scene.add.rectangle(0, 0, 80, 30, 0xff0000, 1);
    const discardText = scene.add.text(0, 0, 'DISCARD', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    discardText.setOrigin(0.5, 0.5);
    this.discardButton.add([discardBg, discardText]);
    this.discardButton.setSize(80, 30);
    this.discardButton.setInteractive({ cursor: 'pointer' });
    this.discardButton.on('pointerdown', () => this.handleDiscardCard());
    this.discardButton.setVisible(false);
    this.add(this.discardButton);
  }

  /**
   * Set cards in hand
   */
  public setCards(cards: TechCard[]): void {
    // Clear existing cards
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cardSprites = [];
    this.selectedCard = null;

    // Create new card sprites
    const startX = 20;
    const startY = 50;
    const spacing = 110;

    cards.forEach((card, index) => {
      const sprite = new TechCardSprite(
        this.scene,
        startX + (index * spacing),
        startY,
        card
      );

      sprite.onSelect = (selectedCard) => {
        this.handleCardSelect(sprite);
      };

      sprite.onUse = (usedCard) => {
        if (this.onUseCard) {
          this.onUseCard(usedCard);
        }
      };

      this.cardSprites.push(sprite);
      this.add(sprite);
    });

    // Hide buttons when cards change
    if (this.useButton) this.useButton.setVisible(false);
    if (this.discardButton) this.discardButton.setVisible(false);
  }

  /**
   * Handle card selection
   */
  private handleCardSelect(sprite: TechCardSprite): void {
    // Deselect previous card
    if (this.selectedCard && this.selectedCard !== sprite) {
      this.selectedCard.setSelected(false);
    }

    this.selectedCard = sprite;

    // Show buttons
    if (this.useButton) this.useButton.setVisible(true);
    if (this.discardButton) this.discardButton.setVisible(true);

    // Show preview (could be expanded)
    this.showPreview(sprite.getCard());
  }

  /**
   * Show card preview
   */
  private showPreview(card: TechCard): void {
    // Clear existing preview
    if (this.previewPanel) {
      this.previewPanel.destroy();
      this.previewPanel = null;
    }

    // Create preview panel
    this.previewPanel = this.scene.add.container(720, 90);
    
    const previewBg = this.scene.add.rectangle(0, 0, 250, 160, 0x000000, 0.9);
    previewBg.setOrigin(0, 0);
    
    const cardName = this.scene.add.text(10, 10, card.name, {
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
      wordWrap: { width: 230 }
    });
    
    const cardDesc = this.scene.add.text(10, 40, card.getPowerDescription(), {
      fontSize: '12px',
      color: '#ffffff',
      wordWrap: { width: 230 }
    });

    const vpText = card.victoryPoints > 0 ? ` (${card.victoryPoints} VP)` : '';
    const cardType = this.scene.add.text(10, 130, `${card.type}${vpText}`, {
      fontSize: '11px',
      color: '#cccccc'
    });

    this.previewPanel.add([previewBg, cardName, cardDesc, cardType]);
    this.add(this.previewPanel);
  }

  /**
   * Handle use card button
   */
  private handleUseCard(): void {
    if (this.selectedCard && this.onUseCard) {
      this.onUseCard(this.selectedCard.getCard());
      this.selectedCard = null;
      if (this.useButton) this.useButton.setVisible(false);
      if (this.discardButton) this.discardButton.setVisible(false);
      if (this.previewPanel) {
        this.previewPanel.destroy();
        this.previewPanel = null;
      }
    }
  }

  /**
   * Handle discard card button
   */
  private handleDiscardCard(): void {
    if (this.selectedCard && this.onDiscardCard) {
      this.onDiscardCard(this.selectedCard.getCard());
      this.selectedCard = null;
      if (this.useButton) this.useButton.setVisible(false);
      if (this.discardButton) this.discardButton.setVisible(false);
      if (this.previewPanel) {
        this.previewPanel.destroy();
        this.previewPanel = null;
      }
    }
  }

  /**
   * Get card count
   */
  public getCardCount(): number {
    return this.cardSprites.length;
  }

  /**
   * Show/hide hand
   */
  public setVisible(visible: boolean): this {
    super.setVisible(visible);
    return this;
  }

  /**
   * Clean up
   */
  public destroy(fromScene?: boolean): void {
    this.cardSprites.forEach(sprite => sprite.destroy());
    if (this.previewPanel) {
      this.previewPanel.destroy();
    }
    if (this.useButton) {
      this.useButton.destroy();
    }
    if (this.discardButton) {
      this.discardButton.destroy();
    }
    super.destroy(fromScene);
  }
}
