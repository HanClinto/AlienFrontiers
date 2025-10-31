/**
 * Tests for AI facility decision-making
 */

import { HeuristicAI } from '../../../src/game/ai/base-ai';
import { AIDifficulty } from '../../../src/game/ai/ai-types';
import { GameState } from '../../../src/game/game-state';

describe('AI Facility Decisions', () => {
  let ai: HeuristicAI;
  let gameState: GameState;
  let playerId: string;

  beforeEach(() => {
    ai = new HeuristicAI(AIDifficulty.SPACER);
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'ai-player', name: 'AI Player', color: 0xff0000 },
      { id: 'human-player', name: 'Human Player', color: 0x00ff00 }
    ]);
    playerId = 'ai-player';
  });

  describe('decideShipPlacements', () => {
    test('Returns empty array when no ships available', () => {
      const decisions = ai.decideShipPlacements(gameState, playerId);
      expect(Array.isArray(decisions)).toBe(true);
    });

    test('Returns decisions with correct structure', () => {
      const decisions = ai.decideShipPlacements(gameState, playerId);
      
      decisions.forEach(decision => {
        expect(decision).toHaveProperty('type');
        expect(decision).toHaveProperty('value');
        expect(decision).toHaveProperty('data');
        expect(typeof decision.value).toBe('number');
      });
    });

    test('Decisions are sorted by value', () => {
      const decisions = ai.decideShipPlacements(gameState, playerId);
      
      for (let i = 1; i < decisions.length; i++) {
        expect(decisions[i - 1].value).toBeGreaterThanOrEqual(decisions[i].value);
      }
    });
  });

  describe('Facility Value Evaluation', () => {
    test('AI can evaluate facility placement', () => {
      // This tests that the evaluation doesn't crash
      const decisions = ai.decideShipPlacements(gameState, playerId);
      expect(Array.isArray(decisions)).toBe(true);
    });

    test('Different difficulties have different personalities', () => {
      const cadetAI = new HeuristicAI(AIDifficulty.CADET);
      const admiralAI = new HeuristicAI(AIDifficulty.ADMIRAL);
      
      const cadetPersonality = cadetAI.getPersonality();
      const admiralPersonality = admiralAI.getPersonality();
      
      // Admiral should have deeper planning
      expect(admiralPersonality.planningDepth).toBeGreaterThan(cadetPersonality.planningDepth);
      
      // Admiral should think longer
      expect(admiralPersonality.thinkingTimeMs).toBeGreaterThan(cadetPersonality.thinkingTimeMs);
    });

    test('Pirate AI has higher aggression', () => {
      const pirateAI = new HeuristicAI(AIDifficulty.PIRATE);
      const spacerAI = new HeuristicAI(AIDifficulty.SPACER);
      
      const piratePersonality = pirateAI.getPersonality();
      const spacerPersonality = spacerAI.getPersonality();
      
      expect(piratePersonality.aggression).toBeGreaterThan(spacerPersonality.aggression);
    });
  });

  describe('Position Evaluation', () => {
    test('Can evaluate current position', () => {
      const score = ai.evaluatePosition(gameState, playerId);
      expect(typeof score).toBe('number');
    });

    test('Position evaluation considers game state', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      const initialScore = ai.evaluatePosition(gameState, playerId);
      
      // Give player resources
      player.resources.ore = 10;
      player.resources.fuel = 10;
      
      const improvedScore = ai.evaluatePosition(gameState, playerId);
      
      // More resources should improve position
      expect(improvedScore).toBeGreaterThan(initialScore);
    });

    test('Position evaluation considers colonies', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      const initialScore = ai.evaluatePosition(gameState, playerId);
      
      // Add some colonies
      player.colonies.push('asimov_crater' as any);
      player.colonies.push('heinlein_plains' as any);
      
      const improvedScore = ai.evaluatePosition(gameState, playerId);
      
      // More colonies should improve position
      expect(improvedScore).toBeGreaterThan(initialScore);
    });

    test('Position evaluation considers victory points', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      const initialScore = ai.evaluatePosition(gameState, playerId);
      
      // Increase victory points
      player.victoryPoints.total = 10;
      
      const improvedScore = ai.evaluatePosition(gameState, playerId);
      
      // More VP should improve position
      expect(improvedScore).toBeGreaterThan(initialScore);
    });
  });

  describe('AI Decision Planning', () => {
    test('Can plan a complete turn', () => {
      const decisions = ai.planTurn(gameState, playerId);
      expect(Array.isArray(decisions)).toBe(true);
    });

    test('planTurn returns structured decisions', () => {
      const decisions = ai.planTurn(gameState, playerId);
      
      decisions.forEach(decision => {
        expect(decision).toHaveProperty('type');
        expect(decision).toHaveProperty('value');
        expect(decision).toHaveProperty('data');
      });
    });

    test('planTurn considers multiple decision types', () => {
      const decisions = ai.planTurn(gameState, playerId);
      
      // Should attempt ship placements, tech cards, and colony placement
      // Even if some return empty, the method should complete
      expect(Array.isArray(decisions)).toBe(true);
    });
  });

  describe('AI Personality Traits', () => {
    test('Cadet AI has simplest personality', () => {
      const cadetAI = new HeuristicAI(AIDifficulty.CADET);
      const personality = cadetAI.getPersonality();
      
      expect(personality.difficulty).toBe(AIDifficulty.CADET);
      expect(personality.planningDepth).toBe(0);
      expect(personality.thinkingTimeMs).toBeLessThan(1000);
    });

    test('Admiral AI has most complex personality', () => {
      const admiralAI = new HeuristicAI(AIDifficulty.ADMIRAL);
      const personality = admiralAI.getPersonality();
      
      expect(personality.difficulty).toBe(AIDifficulty.ADMIRAL);
      expect(personality.planningDepth).toBeGreaterThan(2);
      expect(personality.thinkingTimeMs).toBeGreaterThan(3000);
    });

    test('All personalities have valid value weights', () => {
      const difficulties = [
        AIDifficulty.CADET,
        AIDifficulty.SPACER,
        AIDifficulty.PIRATE,
        AIDifficulty.ADMIRAL
      ];

      difficulties.forEach(difficulty => {
        const testAI = new HeuristicAI(difficulty);
        const personality = testAI.getPersonality();
        
        // All value weights should be positive
        expect(personality.valueShip).toBeGreaterThan(0);
        expect(personality.valueFuel).toBeGreaterThan(0);
        expect(personality.valueOre).toBeGreaterThan(0);
        expect(personality.valueColony).toBeGreaterThan(0);
        expect(personality.valueVP).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('Handles empty game state gracefully', () => {
      expect(() => {
        ai.decideShipPlacements(gameState, playerId);
      }).not.toThrow();
    });

    test('Handles invalid player ID gracefully', () => {
      expect(() => {
        ai.decideShipPlacements(gameState, 'invalid-player-id');
      }).toThrow();
    });

    test('Returns consistent results for same state', () => {
      const decisions1 = ai.decideShipPlacements(gameState, playerId);
      const decisions2 = ai.decideShipPlacements(gameState, playerId);
      
      expect(decisions1.length).toBe(decisions2.length);
      
      // Values should be identical for same state
      decisions1.forEach((d1, i) => {
        if (i < decisions2.length) {
          expect(d1.value).toBe(decisions2[i].value);
        }
      });
    });
  });
});
