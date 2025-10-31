/**
 * Tests for turn flow automation and phase management
 */

import { GameState } from '../../src/game/game-state';
import { TurnPhase } from '../../src/game/types';
import { Player } from '../../src/game/player';
import { TerritoryType } from '../../src/game/territory';

describe('Turn Flow Automation', () => {
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

  test('Game starts in ROLL_DICE phase', () => {
    expect(gameState.getPhase().current).toBe(TurnPhase.ROLL_DICE);
    expect(gameState.getPhase().roundNumber).toBe(1);
    expect(gameState.getPhase().activePlayerId).toBe(player1.id);
  });

  test('advancePhase progresses through all phases', () => {
    const expectedPhases: TurnPhase[] = [
      TurnPhase.ROLL_DICE,
      TurnPhase.PLACE_SHIPS,
      TurnPhase.RESOLVE_ACTIONS,
      TurnPhase.COLLECT_RESOURCES,
      TurnPhase.PURCHASE,
      TurnPhase.END_TURN
    ];

    expectedPhases.forEach((expectedPhase, index) => {
      expect(gameState.getPhase().current).toBe(expectedPhase);
      if (index < expectedPhases.length - 1) {
        gameState.advancePhase();
      }
    });
  });

  test('advancePhase from END_TURN moves to next player', () => {
    // Move through all phases to END_TURN
    while (gameState.getPhase().current !== TurnPhase.END_TURN) {
      gameState.advancePhase();
    }

    expect(gameState.getPhase().activePlayerId).toBe(player1.id);
    
    gameState.advancePhase(); // Move to next player
    
    expect(gameState.getPhase().activePlayerId).toBe(player2.id);
    expect(gameState.getPhase().current).toBe(TurnPhase.ROLL_DICE);
  });

  test('advancePhase advances round number after last player', () => {
    // Play through player 1's turn
    while (gameState.getPhase().current !== TurnPhase.END_TURN) {
      gameState.advancePhase();
    }
    gameState.advancePhase(); // Move to player 2

    expect(gameState.getPhase().roundNumber).toBe(1);

    // Play through player 2's turn
    while (gameState.getPhase().current !== TurnPhase.END_TURN) {
      gameState.advancePhase();
    }
    gameState.advancePhase(); // Move back to player 1

    expect(gameState.getPhase().roundNumber).toBe(2);
    expect(gameState.getPhase().activePlayerId).toBe(player1.id);
  });
});

describe('Resource Limit Enforcement', () => {
  let gameState: GameState;
  let player: Player;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 }
    ]);
    player = gameState.getActivePlayer()!;
  });

  test('Player with 8 or fewer resources keeps all resources', () => {
    player.resources.fuel = 3;
    player.resources.ore = 3;
    player.resources.energy = 2;

    // Advance to END_TURN phase
    while (gameState.getPhase().current !== TurnPhase.END_TURN) {
      gameState.advancePhase();
    }

    expect(player.resources.fuel).toBe(3);
    expect(player.resources.ore).toBe(3);
    expect(player.resources.energy).toBe(2);
  });

  test('Player with more than 8 resources discards to 8', () => {
    player.resources.fuel = 5;
    player.resources.ore = 4;
    player.resources.energy = 3; // Total: 12

    // Advance to END_TURN phase
    while (gameState.getPhase().current !== TurnPhase.END_TURN) {
      gameState.advancePhase();
    }

    const totalAfter = player.resources.fuel + player.resources.ore + player.resources.energy;
    expect(totalAfter).toBe(8);
  });

  test('Excess resources discarded (ore first, then fuel, then energy)', () => {
    player.resources.fuel = 3;
    player.resources.ore = 7;
    player.resources.energy = 2; // Total: 12, excess: 4

    // Advance to END_TURN phase
    while (gameState.getPhase().current !== TurnPhase.END_TURN) {
      gameState.advancePhase();
    }

    // Should discard 4 ore
    expect(player.resources.ore).toBe(3);
    expect(player.resources.fuel).toBe(3);
    expect(player.resources.energy).toBe(2);
  });

  test('Excess resources span multiple types when needed', () => {
    player.resources.fuel = 5;
    player.resources.ore = 3;
    player.resources.energy = 5; // Total: 13, excess: 5

    // Advance to END_TURN phase
    while (gameState.getPhase().current !== TurnPhase.END_TURN) {
      gameState.advancePhase();
    }

    // Should discard 3 ore, then 2 fuel
    expect(player.resources.ore).toBe(0);
    expect(player.resources.fuel).toBe(3);
    expect(player.resources.energy).toBe(5);
  });
});

describe('Territory Bonus Application', () => {
  let gameState: GameState;
  let player: Player;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 },
      { id: 'player2', name: 'Player 2', color: 0x00ff00 }
    ]);
    player = gameState.getActivePlayer()!;
  });

  test('Territory bonus system exists and can be called', () => {
    const territory = gameState.getTerritoryManager().getTerritory(TerritoryType.HEINLEIN_PLAINS);
    expect(territory).toBeDefined();
    
    // Test that applyStartOfTurnBonuses doesn't throw
    expect(() => {
      gameState.getTerritoryManager().applyStartOfTurnBonuses(player);
    }).not.toThrow();
  });
});

describe('Ship Management Between Turns', () => {
  let gameState: GameState;
  let player1: Player;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 },
      { id: 'player2', name: 'Player 2', color: 0x00ff00 }
    ]);
    player1 = gameState.getActivePlayer()!;
  });

  test('advanceToNextPlayer resets ships for new player', () => {
    // Just verify the mechanism exists - detailed testing in game-state tests
    gameState.rollDice();
    const ships = gameState.getShipManager().getPlayerShips(player1.id);
    
    expect(ships.length).toBe(3); // Each player starts with 3 ships
    
    // Move to next player
    while (gameState.getPhase().current !== TurnPhase.END_TURN) {
      gameState.advancePhase();
    }
    gameState.advancePhase();
    
    // New player is active
    expect(gameState.getActivePlayer()!.id).not.toBe(player1.id);
  });
});

describe('Phase-Specific Validation', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 }
    ]);
  });

  test('rollDice only works in ROLL_DICE phase', () => {
    expect(gameState.getPhase().current).toBe(TurnPhase.ROLL_DICE);
    
    // Should work and auto-advance to PLACE_SHIPS
    expect(() => gameState.rollDice()).not.toThrow();
    expect(gameState.getPhase().current).toBe(TurnPhase.PLACE_SHIPS);

    // Should throw error since we're no longer in ROLL_DICE phase
    expect(() => gameState.rollDice()).toThrow('Cannot roll dice outside ROLL_DICE phase');
  });

  test('dockShipsAtFacility only works in PLACE_SHIPS phase', () => {
    expect(gameState.getPhase().current).toBe(TurnPhase.ROLL_DICE);
    
    // Try to dock in wrong phase
    expect(() => gameState.dockShipsAtFacility('solar-converter', ['ship1'])).toThrow('Can only dock ships during PLACE_SHIPS phase');

    // Roll dice (auto-advances to PLACE_SHIPS)
    gameState.rollDice();
    expect(gameState.getPhase().current).toBe(TurnPhase.PLACE_SHIPS);

    // Now docking should work (though it will fail for other reasons like invalid ship)
    try {
      gameState.dockShipsAtFacility('solar-converter', ['ship1']);
    } catch (e: any) {
      // Error should be about ship not found, not about wrong phase
      expect(e.message).not.toContain('Can only dock ships during');
    }
  });
});
