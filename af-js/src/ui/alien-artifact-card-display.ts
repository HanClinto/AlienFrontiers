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
  private bgSprite: Phaser.GameObjects.Image;
  private cardImage: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private claimButton: Phaser.GameObjects.Container | null = null;
  private isHovered: boolean = false;
  private isSelected: boolean = false;

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

    // Create card background (88x120 @1x, 176x240 @2x)
    this.bgSprite = scene.add.image(0, 0, 'tech_layer_bg');
    this.bgSprite.setOrigin(0.5, 0.5);
    this.add(this.bgSprite);

    // Create card image positioned at (0, 14) in iOS coordinates = (0, 28) @2x
    this.cardImage = scene.add.image(0, 28, card.imageKey);
    this.cardImage.setOrigin(0.5, 0.5);
    this.add(this.cardImage);

    // Create name text positioned at (0, -13) in iOS = (0, -26) @2x
    this.nameText = scene.add.text(0, -26, card.name, {
      fontFamily: 'DIN-Medium',
      fontSize: '24px', // iOS 12 * 2
      color: '#000000',
      align: 'center',
      wordWrap: { width: 160 }
    });
    this.nameText.setOrigin(0.5, 0.5);
    this.add(this.nameText);

    // Create claim button (smaller for the artifact display)
    this.createClaimButton(scene);

    // Set interactive for hover and selection
    this.setSize(176, 240); // @2x card size
    this.setInteractive({ cursor: 'pointer' });

    // Hover and click effects
    this.on('pointerover', () => {
      this.isHovered = true;
      this.updateVisualState();
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.updateVisualState();
    });

    this.on('pointerdown', () => {
      this.isSelected = !this.isSelected;
      this.updateVisualState();
    });

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Create claim button
   */
  private createClaimButton(scene: Phaser.Scene): void {
    this.claimButton = scene.add.container(0, 140);
    
    const buttonBg = scene.add.rectangle(0, 0, 80, 24, 0x00ff00, 1);
    buttonBg.setStrokeStyle(2, 0x000000);
    
    const buttonText = scene.add.text(0, 0, 'TAKE', {
      fontSize: '12px',
      color: '#000000',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5, 0.5);
    
    this.claimButton.add([buttonBg, buttonText]);
    this.claimButton.setSize(80, 24);
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
   * Update visual state based on hover/selection
   */
  private updateVisualState(): void {
    // Change background texture based on selection
    if (this.isSelected) {
      this.bgSprite.setTexture('tech_layer_bg_selected');
    } else {
      this.bgSprite.setTexture('tech_layer_bg');
    }

    // Adjust alpha based on hover state
    const alpha = this.isHovered || this.isSelected ? 1.0 : 0.85;
    this.cardImage.setAlpha(alpha);
    this.bgSprite.setAlpha(alpha);
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
    this.bgSprite.destroy();
    this.cardImage.destroy();
    this.nameText.destroy();
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

    // Create title (smaller, positioned above cards)
    this.titleText = scene.add.text(0, -200, 'ALIEN\nARTIFACT', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'left'
    });
    this.titleText.setOrigin(0, 1);
    this.add(this.titleText);

    // Create deck/discard info (positioned near title)
    this.deckSizeText = scene.add.text(0, -165, 'Deck: 0', {
      fontSize: '12px',
      color: '#ffffff'
    });
    this.deckSizeText.setOrigin(0, 0);
    this.add(this.deckSizeText);

    this.discardSizeText = scene.add.text(0, -150, 'Discard: 0', {
      fontSize: '12px',
      color: '#ffffff'
    });
    this.discardSizeText.setOrigin(0, 0);
    this.add(this.discardSizeText);

    // Create cycle button (positioned below title)
    this.cycleButton = this.createCycleButton(scene);
    this.add(this.cycleButton);

    // Add to scene
    scene.add.existing(this);
    this.setDepth(100); // Above board but below modals
    this.setVisible(false); // Hidden by default
  }

  /**
   * Create cycle button
   */
  private createCycleButton(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const button = scene.add.container(0, -120);
    
    const buttonBg = scene.add.rectangle(0, 0, 90, 28, 0x3366ff, 1);
    buttonBg.setStrokeStyle(2, 0xffffff);
    
    const buttonText = scene.add.text(0, 0, 'CYCLE', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5, 0.5);
    
    button.add([buttonBg, buttonText]);
    button.setSize(90, 28);
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

    // Create new card sprites stacked vertically (like iOS)
    // iOS: ccp(30, -5 - 42 * cnt) @1x = (60, -10 - 84*cnt) @2x
    const startX = 60;
    const startY = -10;
    const verticalSpacing = -84;  // Cards stack downward

    visibleCards.forEach((card, index) => {
      const sprite = new VisibleTechCardSprite(
        this.scene,
        startX,
        startY + (index * verticalSpacing),
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
