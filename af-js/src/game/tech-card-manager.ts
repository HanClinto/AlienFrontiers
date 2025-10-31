/**
 * Tech Card Manager
 * Manages the deck, discard pile, and visible cards for the Alien Artifact
 */

import { TechCard } from './tech-cards/base-tech-card';
import * as TechCards from './tech-cards';

export class TechCardManager {
  private deck: TechCard[] = [];
  private discardPile: TechCard[] = [];
  private visibleCards: TechCard[] = [];
  private allCards: Map<string, TechCard> = new Map(); // Track all cards by ID

  constructor() {
    this.initializeDeck();
    this.shuffle();
    this.drawVisibleCards();
  }

  /**
   * Initialize the deck with all tech cards
   * Based on original iOS game composition: 22 cards total
   * - 1x each: AlienCity, AlienMonument (VP cards)
   * - 2x each: BoosterPod, StasisBeam, PolarityDevice, GravityManipulator (die manipulation)
   * - 2x each: OrbitalTeleporter, DataCrystal (colony manipulation)
   * - 2x each: PlasmaCannon, HolographicDecoy (combat/defense)
   * - 2x each: ResourceCache (resource generation)
   * Note: TemporalWarper is implemented but not added (commented out in iOS)
   */
  private initializeDeck(): void {
    this.deck = [
      // Victory Point Cards (1 each)
      new TechCards.AlienCity(),
      new TechCards.AlienMonument(),
      
      // Die Manipulation Cards (2 each)
      new TechCards.BoosterPod(),
      new TechCards.BoosterPod(),
      
      new TechCards.StasisBeam(),
      new TechCards.StasisBeam(),
      
      new TechCards.PolarityDevice(),
      new TechCards.PolarityDevice(),
      
      // TemporalWarper is implemented but commented out in iOS
      // new TechCards.TemporalWarper(),
      // new TechCards.TemporalWarper(),
      
      new TechCards.GravityManipulator(),
      new TechCards.GravityManipulator(),
      
      // Colony Manipulation Cards (2 each)
      new TechCards.OrbitalTeleporter(),
      new TechCards.OrbitalTeleporter(),
      
      new TechCards.DataCrystal(),
      new TechCards.DataCrystal(),
      
      // Combat/Defense Cards (2 each)
      new TechCards.PlasmaCannon(),
      new TechCards.PlasmaCannon(),
      
      new TechCards.HolographicDecoy(),
      new TechCards.HolographicDecoy(),
      
      // Resource Cards (2 each)
      new TechCards.ResourceCache(),
      new TechCards.ResourceCache(),
    ];
    
    // Store all cards in map for easy lookup by ID
    this.deck.forEach(card => {
      this.allCards.set(card.id, card);
    });
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  private shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  /**
   * Draw cards to fill the visible slots (should be 3)
   */
  private drawVisibleCards(): void {
    while (this.visibleCards.length < 3 && this.deck.length > 0) {
      const card = this.deck.pop();
      if (card) {
        this.visibleCards.push(card);
      }
    }

    // If deck is empty and we still need cards, shuffle discard pile
    if (this.visibleCards.length < 3 && this.discardPile.length > 0) {
      this.deck = [...this.discardPile];
      this.discardPile = [];
      this.shuffle();
      this.drawVisibleCards();
    }
  }

  /**
   * Get the currently visible cards at the Alien Artifact
   */
  getVisibleCards(): TechCard[] {
    return [...this.visibleCards];
  }

  /**
   * Cycle the visible cards (discard all and draw new ones)
   * Called when a player docks at Alien Artifact
   */
  cycleVisibleCards(): void {
    // Move current visible cards to discard
    this.discardPile.push(...this.visibleCards);
    this.visibleCards = [];

    // Draw new cards
    this.drawVisibleCards();
  }

  /**
   * Claim a visible card
   * Returns the card if successful, null if card not found
   */
  claimCard(cardId: string): TechCard | null {
    const index = this.visibleCards.findIndex(card => card.id === cardId);
    if (index === -1) return null;

    const card = this.visibleCards.splice(index, 1)[0];
    
    // Draw a replacement card
    this.drawVisibleCards();

    return card;
  }

  /**
   * Discard a card from a player's hand
   */
  discardCard(card: TechCard): void {
    this.discardPile.push(card);
  }

  /**
   * Get a card by its ID
   */
  getCardById(cardId: string): TechCard | null {
    // Use the allCards map for efficient lookup
    return this.allCards.get(cardId) || null;
  }

  /**
   * Get cards by their IDs (for player hands)
   */
  getCardsByIds(cardIds: string[]): TechCard[] {
    return cardIds
      .map(id => this.getCardById(id))
      .filter((card): card is TechCard => card !== null);
  }

  /**
   * Draw a card from the deck
   * Returns null if deck is empty
   */
  drawCard(): TechCard | null {
    if (this.deck.length === 0) {
      // Shuffle discard pile back into deck if available
      if (this.discardPile.length > 0) {
        this.deck = [...this.discardPile];
        this.discardPile = [];
        this.shuffle();
      } else {
        return null;
      }
    }
    return this.deck.pop() || null;
  }

  /**
   * Get deck size
   */
  getDeckSize(): number {
    return this.deck.length;
  }

  /**
   * Get discard pile size
   */
  getDiscardSize(): number {
    return this.discardPile.length;
  }

  /**
   * Reset the manager (for new game)
   */
  reset(): void {
    this.deck = [];
    this.discardPile = [];
    this.visibleCards = [];
    this.initializeDeck();
    this.shuffle();
    this.drawVisibleCards();
  }
}
