/**
 * Tests for tech card deck initialization and management
 */

import { GameState } from '../../src/game/game-state';
import { TechCardType } from '../../src/game/tech-cards';

describe('Tech Card Deck Initialization', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 },
      { id: 'player2', name: 'Player 2', color: 0x00ff00 }
    ]);
  });

  test('Deck initializes with correct total count (22 cards)', () => {
    expect(gameState.getTechCardDeckSize()).toBe(22);
    expect(gameState.getTechCardDiscardSize()).toBe(0);
  });

  test('Deck contains correct card distribution', () => {
    // We need to draw all cards to verify composition
    const drawnCards: TechCardType[] = [];
    
    while (gameState.getTechCardDeckSize() > 0) {
      const card = gameState.drawTechCard('player1');
      if (card) {
        drawnCards.push(card.type);
      }
    }

    expect(drawnCards.length).toBe(22);

    // Count each card type
    const cardCounts: Map<TechCardType, number> = new Map();
    drawnCards.forEach(type => {
      cardCounts.set(type, (cardCounts.get(type) || 0) + 1);
    });

    // Verify VP cards (1 each)
    expect(cardCounts.get(TechCardType.ALIEN_CITY)).toBe(1);
    expect(cardCounts.get(TechCardType.ALIEN_MONUMENT)).toBe(1);

    // Verify die manipulation cards (2 each)
    expect(cardCounts.get(TechCardType.BOOSTER_POD)).toBe(2);
    expect(cardCounts.get(TechCardType.STASIS_BEAM)).toBe(2);
    expect(cardCounts.get(TechCardType.POLARITY_DEVICE)).toBe(2);
    expect(cardCounts.get(TechCardType.TEMPORAL_WARPER)).toBe(2);
    expect(cardCounts.get(TechCardType.GRAVITY_MANIPULATOR)).toBe(2);

    // Verify colony manipulation cards (2 each)
    expect(cardCounts.get(TechCardType.ORBITAL_TELEPORTER)).toBe(2);
    expect(cardCounts.get(TechCardType.DATA_CRYSTAL)).toBe(2);

    // Verify combat/defense cards (2 each)
    expect(cardCounts.get(TechCardType.PLASMA_CANNON)).toBe(2);
    expect(cardCounts.get(TechCardType.HOLOGRAPHIC_DECOY)).toBe(2);

    // Verify resource generation cards (2 each)
    expect(cardCounts.get(TechCardType.RESOURCE_CACHE)).toBe(2);
  });

  test('Drawing card reduces deck size', () => {
    const initialSize = gameState.getTechCardDeckSize();
    gameState.drawTechCard('player1');
    expect(gameState.getTechCardDeckSize()).toBe(initialSize - 1);
  });

  test('Drawing card assigns it to player', () => {
    const player = gameState.getActivePlayer()!;
    const initialCardCount = player.alienTechCards.length;
    
    gameState.drawTechCard(player.id);
    
    expect(player.alienTechCards.length).toBe(initialCardCount + 1);
  });

  test('Discarding card moves it to discard pile', () => {
    const player = gameState.getActivePlayer()!;
    const card = gameState.drawTechCard(player.id)!;
    
    const deckSizeBefore = gameState.getTechCardDeckSize();
    const discardSizeBefore = gameState.getTechCardDiscardSize();
    
    gameState.discardTechCard(card);
    
    expect(gameState.getTechCardDeckSize()).toBe(deckSizeBefore);
    expect(gameState.getTechCardDiscardSize()).toBe(discardSizeBefore + 1);
    expect(player.alienTechCards.length).toBe(0);
  });

  test('Empty deck reshuffles discard pile', () => {
    // Draw all cards
    const allCards = [];
    while (gameState.getTechCardDeckSize() > 0) {
      const card = gameState.drawTechCard('player1');
      if (card) allCards.push(card);
    }

    expect(gameState.getTechCardDeckSize()).toBe(0);

    // Discard all cards
    allCards.forEach(card => gameState.discardTechCard(card));
    
    expect(gameState.getTechCardDeckSize()).toBe(0);
    expect(gameState.getTechCardDiscardSize()).toBe(22);

    // Drawing from empty deck should reshuffle discard
    gameState.drawTechCard('player2');
    
    expect(gameState.getTechCardDeckSize()).toBe(21); // 22 - 1 drawn
    expect(gameState.getTechCardDiscardSize()).toBe(0);
  });

  test('Drawing from completely empty deck returns null', () => {
    // Draw all cards
    while (gameState.getTechCardDeckSize() > 0) {
      gameState.drawTechCard('player1');
    }

    // Deck and discard both empty
    expect(gameState.getTechCardDeckSize()).toBe(0);
    expect(gameState.getTechCardDiscardSize()).toBe(0);

    const card = gameState.drawTechCard('player1');
    expect(card).toBeNull();
  });

  test('Deck is shuffled (cards not in predictable order)', () => {
    // Create two game states and verify decks differ
    const gameState2 = new GameState('test-game-2');
    gameState2.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 }
    ]);

    const deck1Cards: TechCardType[] = [];
    const deck2Cards: TechCardType[] = [];

    // Draw 10 cards from each deck
    for (let i = 0; i < 10; i++) {
      const card1 = gameState.drawTechCard('player1');
      const card2 = gameState2.drawTechCard('player1');
      if (card1) deck1Cards.push(card1.type);
      if (card2) deck2Cards.push(card2.type);
    }

    // With shuffling, it's extremely unlikely both decks have the same order
    // (1/24! probability for first card, etc.)
    // We'll check if at least one position differs
    let hasDifference = false;
    for (let i = 0; i < deck1Cards.length; i++) {
      if (deck1Cards[i] !== deck2Cards[i]) {
        hasDifference = true;
        break;
      }
    }

    // NOTE: This test has a very small chance of failing due to random chance
    // If it fails consistently, there's a shuffling problem
    expect(hasDifference).toBe(true);
  });
});

describe('Tech Card Deck Edge Cases', () => {
  test('Cannot draw card for non-existent player', () => {
    const gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 }
    ]);

    const card = gameState.drawTechCard('non-existent-player');
    
    // Card is drawn from deck but not assigned to anyone
    expect(card).not.toBeNull();
    expect(card!.getOwner()).toBeNull();
  });

  test('Cannot discard card that player does not own', () => {
    const gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 },
      { id: 'player2', name: 'Player 2', color: 0x00ff00 }
    ]);

    const card = gameState.drawTechCard('player1')!;
    const player2 = gameState.getAllPlayers()[1];

    // Try to discard from player2's perspective
    card.setOwner(player2);
    const result = gameState.discardTechCard(card);
    
    expect(result).toBe(false);
  });

  test('Reshuffling maintains card count', () => {
    const gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 }
    ]);

    // Draw 12 cards
    const cards = [];
    for (let i = 0; i < 12; i++) {
      cards.push(gameState.drawTechCard('player1')!);
    }

    // Discard 6 cards
    for (let i = 0; i < 6; i++) {
      gameState.discardTechCard(cards[i]);
    }

    expect(gameState.getTechCardDeckSize()).toBe(10); // 22 - 12 drawn
    expect(gameState.getTechCardDiscardSize()).toBe(6);

    // Draw rest of deck
    while (gameState.getTechCardDeckSize() > 0) {
      gameState.drawTechCard('player1');
    }

    expect(gameState.getTechCardDeckSize()).toBe(0);
    expect(gameState.getTechCardDiscardSize()).toBe(6);

    // Drawing triggers reshuffle
    gameState.drawTechCard('player1');

    // 6 cards reshuffled, 1 drawn = 5 left in deck, but we only have 4 left (6 shuffled - 1 drawn - 1 already drawn before = 4)
    // Wait: we discarded 6, drew rest (10), so we have 0 in deck, 6 in discard, 16 in player hands
    // Then draw 1 more, which reshuffles 6, draws 1, leaving 5
    expect(gameState.getTechCardDeckSize()).toBe(5);
    expect(gameState.getTechCardDiscardSize()).toBe(0);
  });
});
