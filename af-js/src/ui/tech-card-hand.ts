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
  private cardImage: Phaser.GameObjects.Image;
  private bgSprite: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
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

    // Background frame - iOS uses tech_layer_bg.png for tall cards
    this.bgSprite = scene.add.image(0, 0, 'tech_layer_bg');
    this.bgSprite.setOrigin(0.5, 0.5);
    this.add(this.bgSprite);

    // Card image - iOS: cardImage.position = ccp(0, 14) for tall layout
    // In Phaser @2x that's (0, 28) but we'll center it
    this.cardImage = scene.add.image(0, 0, card.imageKey);
    this.cardImage.setOrigin(0.5, 0.5);
    this.add(this.cardImage);

    // Card name label - iOS: label.position = ccp(0, 30 - 36 - 7) = ccp(0, -13)
    // At @2x: (0, -26)
    this.nameText = scene.add.text(0, -26, card.name, {
      fontFamily: 'DIN-Medium',
      fontSize: '24px',  // iOS 12 * 2 = 24
      color: '#000000',
      align: 'center',
      wordWrap: { width: 150 }
    });
    this.nameText.setOrigin(0.5, 1);
    this.add(this.nameText);

    // Update initial visual state
    this.updateVisualState();

    // Set interactive - iOS card size is ~88x120 @1x = 176x240 @2x
    this.setSize(176, 240);
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
      this.updateVisualState();
      this.setScale(1.05);
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.updateVisualState();
      this.setScale(1.0);
    });

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Update visual state based on selection/hover
   * iOS uses different background textures and opacity changes
   */
  private updateVisualState(): void {
    // Update background based on selection state
    // iOS: if (selected) tech_layer_bg_selected.png else tech_layer_bg.png
    if (this.isSelected) {
      this.bgSprite.setTexture('tech_layer_bg_selected');
    } else {
      this.bgSprite.setTexture('tech_layer_bg');
    }

    // Update opacity based on hover/select state
    // iOS uses opacity 127 for tapped/used cards, 255 for normal
    const alpha = this.isSelected || this.isHovered ? 1.0 : 0.85;
    this.cardImage.setAlpha(alpha);
    this.nameText.setAlpha(alpha);
  }

  /**
   * Toggle card selection
   */
  private toggleSelection(): void {
    this.isSelected = !this.isSelected;
    this.updateVisualState();

    if (this.isSelected && this.onSelect) {
      this.onSelect(this.card);
    }
  }

  /**
   * Set selected state
   */
  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.updateVisualState();
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
    this.bgSprite.destroy();
    this.cardImage.destroy();
    this.nameText.destroy();
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

    // No background panel needed - cards will be drawn on top of card tray background
    // Set origin to (0, 0) to match positioning expectations
    // (Card tray background is already rendered in PlayerHUDLayer)

    // Create buttons (positioned relative to card area)
    this.createButtons(scene);

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Create action buttons
   */
  private createButtons(scene: Phaser.Scene): void {
    // Position buttons to the right of where cards will appear
    // Cards: startX=84, spacing=178, max 6 cards = 84 + 178*5 = 974
    // Buttons positioned after last card
    
    // Use button
    this.useButton = scene.add.container(1000, 36);
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
    this.discardButton = scene.add.container(1100, 36);
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
    console.log(`TechCardHand.setCards called with ${cards.length} cards:`, cards.map(c => c.name));
    
    // Clear existing cards
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cardSprites = [];
    this.selectedCard = null;

    // Create new card sprites
    // iOS positioning: cards at x=42 + (88+1)*index, y=-12, anchor (0, 1) = bottom-left
    // At @2x: x=84 + 178*index, y=-24
    // iOS anchor (0, 1) is bottom-left, Phaser origin (0, 0) is top-left
    // Card height ~140px, so we need to add that to Y
    const startX = 84;      // iOS: 42 * 2
    const startY = 36;      // Center the cards vertically in the 72px card tray
    const spacing = 178;    // iOS: (88 + 1) * 2

    cards.forEach((card, index) => {
      console.log(`Creating card sprite ${index}: ${card.name} at position (${startX + (index * spacing)}, ${startY})`);

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
