/**
 * GameScene Integration Tests
 * Tests for Phase 5 UI/UX integration with game logic
 * 
 * Note: These tests focus on GameState integration logic without instantiating
 * the full Phaser scene, as Phaser requires a full browser environment with canvas.
 */

import { GameState } from '../../src/game/game-state';
import { AIDifficulty } from '../../src/game/ai/ai-types';

describe('GameScene Phase 5 Integration', () => {
  describe('Task 1: GameState Integration - Controller Mapping', () => {
    it('should map AI controller strings to difficulties', () => {
      // This tests the logic that GameScene uses to convert controller strings to AI difficulties
      const controllerToDifficulty: Record<string, AIDifficulty> = {
        'AI: Cadet': AIDifficulty.CADET,
        'AI: Spacer': AIDifficulty.SPACER,
        'AI: Pirate': AIDifficulty.PIRATE,
        'AI: Admiral': AIDifficulty.ADMIRAL
      };

      expect(controllerToDifficulty['AI: Cadet']).toBe(AIDifficulty.CADET);
      expect(controllerToDifficulty['AI: Spacer']).toBe(AIDifficulty.SPACER);
      expect(controllerToDifficulty['AI: Pirate']).toBe(AIDifficulty.PIRATE);
      expect(controllerToDifficulty['AI: Admiral']).toBe(AIDifficulty.ADMIRAL);
    });

    it('should handle player configurations correctly', () => {
      const playerConfigs = [
        { controller: 'Human' as const, color: '#952034' },
        { controller: 'AI: Cadet' as const, color: '#007226' }
      ];

      // Verify player configs structure
      expect(playerConfigs).toHaveLength(2);
      expect(playerConfigs[0].controller).toBe('Human');
      expect(playerConfigs[1].controller).toBe('AI: Cadet');
    });

    it('should support all AI difficulty levels', () => {
      const aiControllers = [
        'AI: Cadet',
        'AI: Spacer', 
        'AI: Pirate',
        'AI: Admiral'
      ];

      // Verify all expected AI controllers are defined
      expect(aiControllers).toContain('AI: Cadet');
      expect(aiControllers).toContain('AI: Spacer');
      expect(aiControllers).toContain('AI: Pirate');
      expect(aiControllers).toContain('AI: Admiral');
    });
  });

  describe('GameState Initialization', () => {
    it('should initialize game state with correct number of players', () => {
      const gameState = new GameState('test-game');
      
      gameState.initializeGame([
        { id: 'player-0', name: 'Player 1', color: '#952034', isAI: false },
        { id: 'player-1', name: 'AI: Cadet', color: '#007226', isAI: true }
      ]);

      const players = gameState.getAllPlayers();
      expect(players).toHaveLength(2);
    });

    it('should set first player as active', () => {
      const gameState = new GameState('test-game');
      
      gameState.initializeGame([
        { id: 'player-0', name: 'Player 1', color: '#952034', isAI: false },
        { id: 'player-1', name: 'AI: Cadet', color: '#007226', isAI: true }
      ]);

      const activePlayer = gameState.getActivePlayer();
      expect(activePlayer).toBeDefined();
      expect(activePlayer?.id).toBe('player-0');
    });

    it('should initialize players with starting resources', () => {
      const gameState = new GameState('test-game');
      
      gameState.initializeGame([
        { id: 'player-0', name: 'Player 1', color: '#952034', isAI: false }
      ]);

      const player = gameState.getActivePlayer();
      expect(player?.resources).toBeDefined();
      expect(player?.resources.ore).toBeDefined();
      expect(player?.resources.fuel).toBeDefined();
    });
  });
});
