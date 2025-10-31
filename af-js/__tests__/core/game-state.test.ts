/**
 * GameState integration tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { GameState } from '../../src/game/game-state';
import { TurnPhase, PlayerColor } from '../../src/game/types';

describe('GameState', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState('test-game-1');
  });

  describe('initializeGame', () => {
    test('should initialize game with players', () => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED },
        { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
      ]);

      const players = gameState.getAllPlayers();
      expect(players).toHaveLength(2);
      expect(players[0].name).toBe('Alice');
      expect(players[1].name).toBe('Bob');
    });

    test('should create ships for each player', () => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED },
        { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
      ]);

      const shipManager = gameState.getShipManager();
      const p1Ships = shipManager.getPlayerShips('p1');
      const p2Ships = shipManager.getPlayerShips('p2');
      
      expect(p1Ships).toHaveLength(3);
      expect(p2Ships).toHaveLength(3);
    });

    test('should set first player as active', () => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED },
        { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
      ]);

      const phase = gameState.getPhase();
      expect(phase.activePlayerId).toBe('p1');
      expect(phase.current).toBe(TurnPhase.ROLL_DICE);
    });
  });

  describe('getActivePlayer', () => {
    test('should return current active player', () => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED },
        { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
      ]);

      const activePlayer = gameState.getActivePlayer();
      expect(activePlayer?.id).toBe('p1');
      expect(activePlayer?.name).toBe('Alice');
    });
  });

  describe('rollDice', () => {
    beforeEach(() => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED },
        { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
      ]);
    });

    test('should roll 3 dice for active player', () => {
      const rolls = gameState.rollDice();
      expect(rolls).toHaveLength(3);
      rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      });
    });

    test('should advance phase after rolling', () => {
      gameState.rollDice();
      const phase = gameState.getPhase();
      expect(phase.current).toBe(TurnPhase.PLACE_SHIPS);
    });

    test('should throw error if not in ROLL_DICE phase', () => {
      gameState.rollDice(); // First roll is OK
      expect(() => gameState.rollDice()).toThrow('Cannot roll dice outside ROLL_DICE phase');
    });
  });

  describe('advancePhase', () => {
    beforeEach(() => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED },
        { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
      ]);
    });

    test('should advance through all turn phases', () => {
      const phases = [
        TurnPhase.ROLL_DICE,
        TurnPhase.PLACE_SHIPS,
        TurnPhase.RESOLVE_ACTIONS,
        TurnPhase.COLLECT_RESOURCES,
        TurnPhase.PURCHASE,
        TurnPhase.END_TURN
      ];

      phases.forEach((expectedPhase, index) => {
        const phase = gameState.getPhase();
        expect(phase.current).toBe(expectedPhase);
        if (index < phases.length - 1) {
          gameState.advancePhase();
        }
      });
    });

    test('should advance to next player after END_TURN', () => {
      // Advance through all phases
      for (let i = 0; i < 6; i++) {
        gameState.advancePhase();
      }

      const phase = gameState.getPhase();
      expect(phase.activePlayerId).toBe('p2');
      expect(phase.current).toBe(TurnPhase.ROLL_DICE);
    });

    test('should increment round after all players finish', () => {
      // Player 1 completes turn
      for (let i = 0; i < 6; i++) {
        gameState.advancePhase();
      }
      
      // Player 2 completes turn
      for (let i = 0; i < 6; i++) {
        gameState.advancePhase();
      }

      const phase = gameState.getPhase();
      expect(phase.activePlayerId).toBe('p1');
      expect(phase.roundNumber).toBe(2);
    });
  });

  describe('isGameOver', () => {
    beforeEach(() => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED },
        { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
      ]);
    });

    test('should return false when no player has won', () => {
      expect(gameState.isGameOver()).toBe(false);
    });

    test('should return true when a player places 10 colonies', () => {
      const playerManager = gameState.getPlayerManager();
      
      // Give player 10 colonies (note: addColony prevents duplicates, so use unique locations)
      const colonies = [
        'asimov_crater', 'burroughs_desert', 'heinlein_plains',
        'bradbury_plateau', 'herbert_valley', 'lem_badlands',
        'pohl_foothills', 'van_vogt_mountains'
      ];
      
      colonies.forEach((colony: any) => {
        playerManager.addColony('p1', colony);
      });
      
      // Manually add 2 more to reach 10
      const player = playerManager.getPlayer('p1');
      if (player) {
        player.colonies.push('asimov_crater' as any);
        player.colonies.push('asimov_crater' as any);
      }
      
      expect(gameState.isGameOver()).toBe(true);
    });
  });

  describe('getWinners', () => {
    beforeEach(() => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED },
        { id: 'p2', name: 'Bob', color: PlayerColor.BLUE },
        { id: 'p3', name: 'Charlie', color: PlayerColor.GREEN }
      ]);
    });

    test('should return player with highest VP', () => {
      const playerManager = gameState.getPlayerManager();
      
      // Give p1 10 colonies to end game
      const p1 = playerManager.getPlayer('p1');
      if (p1) {
        for (let i = 0; i < 10; i++) {
          p1.colonies.push('asimov_crater' as any);
        }
      }
      
      // Give p2 more VP
      const p2 = playerManager.getPlayer('p2');
      if (p2) {
        p2.victoryPoints.total = 15;
      }
      
      const p1Player = playerManager.getPlayer('p1');
      if (p1Player) {
        p1Player.victoryPoints.total = 12;
      }
      
      const winners = gameState.getWinners();
      expect(winners).toHaveLength(1);
      expect(winners[0].id).toBe('p2');
    });

    test('should return multiple winners in case of tie', () => {
      const playerManager = gameState.getPlayerManager();
      
      // Give p1 10 colonies to end game
      const p1 = playerManager.getPlayer('p1');
      if (p1) {
        for (let i = 0; i < 10; i++) {
          p1.colonies.push('asimov_crater' as any);
        }
        p1.victoryPoints.total = 15;
      }
      
      // Give p2 same VP
      const p2 = playerManager.getPlayer('p2');
      if (p2) {
        p2.victoryPoints.total = 15;
        // Same resources for complete tie
        p2.alienTechCards = p1?.alienTechCards || [];
        p2.resources.ore = p1?.resources.ore || 0;
        p2.resources.fuel = p1?.resources.fuel || 0;
      }
      
      const winners = gameState.getWinners();
      expect(winners).toHaveLength(2);
    });
  });

  describe('clone', () => {
    beforeEach(() => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED },
        { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
      ]);
    });

    test('should create independent copy', () => {
      gameState.rollDice();
      const cloned = gameState.clone();
      
      // Modify original
      gameState.advancePhase();
      
      // Clone should remain unchanged
      const originalPhase = gameState.getPhase();
      const clonedPhase = cloned.getPhase();
      
      expect(originalPhase.current).toBe(TurnPhase.RESOLVE_ACTIONS);
      expect(clonedPhase.current).toBe(TurnPhase.PLACE_SHIPS);
    });

    test('should clone player resources independently', () => {
      const playerManager = gameState.getPlayerManager();
      playerManager.addResources('p1', { ore: 5 });
      
      const cloned = gameState.clone();
      
      // Modify original
      playerManager.addResources('p1', { ore: 3 });
      
      // Clone should be unchanged
      const originalPlayer = playerManager.getPlayer('p1');
      const clonedPlayer = cloned.getPlayerManager().getPlayer('p1');
      
      expect(originalPlayer?.resources.ore).toBe(8);
      expect(clonedPlayer?.resources.ore).toBe(5);
    });
  });

  describe('validate', () => {
    test('should return error for too few players', () => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED }
      ]);

      const errors = gameState.validate();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('at least 2 players');
    });

    test('should return no errors for valid state', () => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED },
        { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
      ]);

      const errors = gameState.validate();
      expect(errors).toHaveLength(0);
    });
  });

  describe('serialization', () => {
    test('should serialize and deserialize correctly', () => {
      gameState.initializeGame([
        { id: 'p1', name: 'Alice', color: PlayerColor.RED },
        { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
      ]);
      
      gameState.rollDice();
      gameState.getPlayerManager().addResources('p1', { ore: 5 });
      
      const json = gameState.toJSON();
      const restored = GameState.fromJSON(json);
      
      const phase = restored.getPhase();
      expect(phase.current).toBe(TurnPhase.PLACE_SHIPS);
      
      const player = restored.getPlayerManager().getPlayer('p1');
      expect(player?.resources.ore).toBe(5);
    });
  });
});
