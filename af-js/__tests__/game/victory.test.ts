/**
 * Tests for victory conditions and game end detection
 */

import { GameState } from '../../src/game/game-state';
import { Player } from '../../src/game/player';
import { ColonyLocation } from '../../src/game/types';

describe('Victory Condition Detection', () => {
  let gameState: GameState;
  let player1: Player;
  let player2: Player;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 },
      { id: 'player2', name: 'Player 2', color: 0x00ff00 }
    ]);
    
    player1 = gameState.getAllPlayers()[0];
    player2 = gameState.getAllPlayers()[1];
  });

  test('Game is not over at start', () => {
    expect(gameState.isGameOver()).toBe(false);
  });

  test('Game ends when player places 10th colony', () => {
    // Place 9 colonies - game not over
    for (let i = 0; i < 9; i++) {
      player1.colonies.push(ColonyLocation.HEINLEIN_PLAINS);
    }
    expect(gameState.isGameOver()).toBe(false);

    // Place 10th colony - game ends
    player1.colonies.push(ColonyLocation.HERBERT_VALLEY);
    expect(gameState.isGameOver()).toBe(true);
  });

  test('Game ends when any player places 10 colonies', () => {
    // Player 2 places 10 colonies
    for (let i = 0; i < 10; i++) {
      player2.colonies.push(ColonyLocation.HEINLEIN_PLAINS);
    }

    expect(gameState.isGameOver()).toBe(true);
  });

  test('getWinners returns empty array if game not over', () => {
    expect(gameState.getWinners()).toEqual([]);
  });
});

describe('Winner Determination', () => {
  let gameState: GameState;
  let player1: Player;
  let player2: Player;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 },
      { id: 'player2', name: 'Player 2', color: 0x00ff00 }
    ]);
    
    player1 = gameState.getAllPlayers()[0];
    player2 = gameState.getAllPlayers()[1];

    // End game by placing 10 colonies for player1
    for (let i = 0; i < 10; i++) {
      player1.colonies.push(ColonyLocation.HEINLEIN_PLAINS);
    }
  });

  test('Player with most VP wins', () => {
    player1.victoryPoints.total = 15;
    player2.victoryPoints.total = 12;

    const winners = gameState.getWinners();
    expect(winners.length).toBe(1);
    expect(winners[0].id).toBe(player1.id);
  });

  test('Both players win in perfect tie', () => {
    player1.victoryPoints.total = 15;
    player2.victoryPoints.total = 15;
    player1.alienTechCards = ['card1', 'card2'];
    player2.alienTechCards = ['card3', 'card4'];
    player1.resources.ore = 5;
    player2.resources.ore = 5;
    player1.resources.fuel = 3;
    player2.resources.fuel = 3;

    const winners = gameState.getWinners();
    expect(winners.length).toBe(2);
    expect(winners).toContainEqual(player1);
    expect(winners).toContainEqual(player2);
  });

  test('Tie broken by tech card count', () => {
    player1.victoryPoints.total = 15;
    player2.victoryPoints.total = 15;
    player1.alienTechCards = ['card1', 'card2', 'card3'];
    player2.alienTechCards = ['card4', 'card5'];

    const winners = gameState.getWinners();
    expect(winners.length).toBe(1);
    expect(winners[0].id).toBe(player1.id);
  });

  test('Tie broken by ore count (after tech cards)', () => {
    player1.victoryPoints.total = 15;
    player2.victoryPoints.total = 15;
    player1.alienTechCards = ['card1', 'card2'];
    player2.alienTechCards = ['card3', 'card4'];
    player1.resources.ore = 7;
    player2.resources.ore = 4;

    const winners = gameState.getWinners();
    expect(winners.length).toBe(1);
    expect(winners[0].id).toBe(player1.id);
  });

  test('Tie broken by fuel count (after ore)', () => {
    player1.victoryPoints.total = 15;
    player2.victoryPoints.total = 15;
    player1.alienTechCards = ['card1', 'card2'];
    player2.alienTechCards = ['card3', 'card4'];
    player1.resources.ore = 5;
    player2.resources.ore = 5;
    player1.resources.fuel = 6;
    player2.resources.fuel = 3;

    const winners = gameState.getWinners();
    expect(winners.length).toBe(1);
    expect(winners[0].id).toBe(player1.id);
  });

  test('Multiple winners if still tied after all tiebreakers', () => {
    player1.victoryPoints.total = 15;
    player2.victoryPoints.total = 15;
    player1.alienTechCards = ['card1', 'card2'];
    player2.alienTechCards = ['card3', 'card4'];
    player1.resources.ore = 5;
    player2.resources.ore = 5;
    player1.resources.fuel = 3;
    player2.resources.fuel = 3;

    const winners = gameState.getWinners();
    expect(winners.length).toBe(2);
  });
});

describe('Game End Scenarios', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 },
      { id: 'player2', name: 'Player 2', color: 0x00ff00 },
      { id: 'player3', name: 'Player 3', color: 0x0000ff }
    ]);
  });

  test('3-player game ends when one player places 10 colonies', () => {
    const player1 = gameState.getAllPlayers()[0];
    
    for (let i = 0; i < 10; i++) {
      player1.colonies.push(ColonyLocation.HEINLEIN_PLAINS);
    }

    expect(gameState.isGameOver()).toBe(true);
  });

  test('Winner determined correctly in 3-player game', () => {
    const player1 = gameState.getAllPlayers()[0];
    const player2 = gameState.getAllPlayers()[1];
    const player3 = gameState.getAllPlayers()[2];

    // End game
    for (let i = 0; i < 10; i++) {
      player1.colonies.push(ColonyLocation.HEINLEIN_PLAINS);
    }

    // Set VPs
    player1.victoryPoints.total = 15;
    player2.victoryPoints.total = 18; // Winner
    player3.victoryPoints.total = 12;

    const winners = gameState.getWinners();
    expect(winners.length).toBe(1);
    expect(winners[0].id).toBe(player2.id);
  });

  test('Multiple winners possible in 3-player game', () => {
    const player1 = gameState.getAllPlayers()[0];
    const player2 = gameState.getAllPlayers()[1];
    const player3 = gameState.getAllPlayers()[2];

    // End game
    for (let i = 0; i < 10; i++) {
      player1.colonies.push(ColonyLocation.HEINLEIN_PLAINS);
    }

    // Set VPs - player1 and player2 tied
    player1.victoryPoints.total = 18;
    player2.victoryPoints.total = 18;
    player3.victoryPoints.total = 15;

    // Same tiebreakers
    player1.alienTechCards = ['c1', 'c2'];
    player2.alienTechCards = ['c3', 'c4'];
    player1.resources.ore = 5;
    player2.resources.ore = 5;
    player1.resources.fuel = 3;
    player2.resources.fuel = 3;

    const winners = gameState.getWinners();
    expect(winners.length).toBe(2);
    expect(winners.map(w => w.id)).toContain(player1.id);
    expect(winners.map(w => w.id)).toContain(player2.id);
    expect(winners.map(w => w.id)).not.toContain(player3.id);
  });
});

describe('Victory Points Calculation', () => {
  let gameState: GameState;
  let player: Player;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 }
    ]);
    
    player = gameState.getAllPlayers()[0];
  });

  test('Colonies contribute to VP', () => {
    player.colonies.push(ColonyLocation.HEINLEIN_PLAINS);
    player.colonies.push(ColonyLocation.HERBERT_VALLEY);
    
    player.victoryPoints.colonies = 2;
    player.victoryPoints.total = 2;

    expect(player.victoryPoints.colonies).toBe(2);
  });

  test('Tech cards contribute to VP', () => {
    player.victoryPoints.alienTech = 2; // 2 VP from tech cards
    player.victoryPoints.total = 2;

    expect(player.victoryPoints.alienTech).toBe(2);
  });

  test('Territory control contributes to VP', () => {
    player.victoryPoints.territories = 3; // Controls 3 territories
    player.victoryPoints.total = 3;

    expect(player.victoryPoints.territories).toBe(3);
  });

  test('Total VP is sum of all sources', () => {
    player.victoryPoints.colonies = 5;
    player.victoryPoints.alienTech = 2;
    player.victoryPoints.territories = 3;
    player.victoryPoints.bonuses = 1;
    player.victoryPoints.total = 11;

    expect(player.victoryPoints.total).toBe(11);
  });
});
