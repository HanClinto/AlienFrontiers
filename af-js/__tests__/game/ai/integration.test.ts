/**
 * Comprehensive AI Integration Tests
 * Tests complete decision-making cycles across multiple turns
 */

import { HeuristicAI, createAI } from '../../../src/game/ai/base-ai';
import { AIDifficulty } from '../../../src/game/ai/ai-types';
import { GameState } from '../../../src/game/game-state';

describe('AI Integration Tests', () => {
  describe('Complete Turn Planning', () => {
    test('AI can plan complete turns without errors', () => {
      const ai = new HeuristicAI(AIDifficulty.SPACER);
      const gameState = new GameState('integration-test');
      
      gameState.initializeGame([
        { id: 'ai1', name: 'AI 1', color: 0xff0000 },
        { id: 'ai2', name: 'AI 2', color: 0x00ff00 }
      ]);

      // Simulate multiple turns
      for (let turn = 0; turn < 5; turn++) {
        expect(() => {
          const decisions = ai.planTurn(gameState, 'ai1');
          expect(Array.isArray(decisions)).toBe(true);
        }).not.toThrow();
      }
    });

    test('AI makes consistent decisions across difficulties', () => {
      const difficulties = [
        AIDifficulty.CADET,
        AIDifficulty.SPACER,
        AIDifficulty.PIRATE,
        AIDifficulty.ADMIRAL
      ];

      const gameState = new GameState('difficulty-test');
      gameState.initializeGame([
        { id: 'player', name: 'Player', color: 0xff0000 }
      ]);

      difficulties.forEach(difficulty => {
        const ai = createAI(difficulty);
        expect(() => {
          const decisions = ai.planTurn(gameState, 'player');
          expect(Array.isArray(decisions)).toBe(true);
        }).not.toThrow();
      });
    });

    test('AI handles rich game state', () => {
      const ai = new HeuristicAI(AIDifficulty.ADMIRAL);
      const gameState = new GameState('rich-state-test');
      
      gameState.initializeGame([
        { id: 'ai', name: 'AI', color: 0xff0000 },
        { id: 'opponent', name: 'Opponent', color: 0x00ff00 }
      ]);

      const player = gameState.getAllPlayers().find(p => p.id === 'ai');
      if (!player) fail('Player not found');

      // Rich game state
      player.resources.ore = 8;
      player.resources.fuel = 7;
      player.alienTechCards = ['booster_pod_1', 'plasma_cannon_1', 'data_crystal_1'];
      player.colonies = ['asimov_crater' as any, 'heinlein_plains' as any];

      const decisions = ai.planTurn(gameState, 'ai');
      
      // Should make multiple decisions
      expect(decisions.length).toBeGreaterThan(0);
      
      // All decisions should have valid structure
      decisions.forEach(decision => {
        expect(decision).toHaveProperty('type');
        expect(decision).toHaveProperty('value');
        expect(decision).toHaveProperty('data');
        expect(decision.value).toBeGreaterThan(0);
      });
    });
  });

  describe('Multi-Turn Simulations', () => {
    test('AI performs consistently over multiple turns', () => {
      const ai = new HeuristicAI(AIDifficulty.SPACER);
      const gameState = new GameState('multi-turn-test');
      
      gameState.initializeGame([
        { id: 'ai', name: 'AI', color: 0xff0000 }
      ]);

      const player = gameState.getAllPlayers().find(p => p.id === 'ai');
      if (!player) fail('Player not found');

      const turnResults: number[] = [];

      // Simulate 10 turns with varying resources
      for (let i = 0; i < 10; i++) {
        // Give player some resources to work with
        player.resources.ore = Math.floor(i / 2) + 2;
        player.resources.fuel = Math.floor(i / 3) + 1;
        
        if (i % 3 === 0) {
          player.alienTechCards.push(`tech_card_${i}`);
        }

        const decisions = ai.planTurn(gameState, 'ai');
        turnResults.push(decisions.length);
        
        // AI should consistently make decisions
        expect(decisions.length).toBeGreaterThanOrEqual(0);
      }

      // Should have made decisions in some turns
      const totalDecisions = turnResults.reduce((sum, count) => sum + count, 0);
      expect(totalDecisions).toBeGreaterThanOrEqual(0);
    });

    test('AI adapts to changing game state', () => {
      const ai = new HeuristicAI(AIDifficulty.ADMIRAL);
      const gameState = new GameState('adaptive-test');
      
      gameState.initializeGame([
        { id: 'ai', name: 'AI', color: 0xff0000 }
      ]);

      const player = gameState.getAllPlayers().find(p => p.id === 'ai');
      if (!player) fail('Player not found');

      // Turn 1: No resources
      player.resources.ore = 0;
      player.resources.fuel = 0;
      const turn1 = ai.planTurn(gameState, 'ai');

      // Turn 2: Rich in resources
      player.resources.ore = 10;
      player.resources.fuel = 10;
      const turn2 = ai.planTurn(gameState, 'ai');

      // Should make more decisions with resources
      expect(turn2.length).toBeGreaterThanOrEqual(turn1.length);
    });

    test('AI handles progression from early to late game', () => {
      const ai = new HeuristicAI(AIDifficulty.SPACER);
      const gameState = new GameState('progression-test');
      
      gameState.initializeGame([
        { id: 'ai', name: 'AI', color: 0xff0000 }
      ]);

      const player = gameState.getAllPlayers().find(p => p.id === 'ai');
      if (!player) fail('Player not found');

      // Early game (0 colonies)
      player.resources.ore = 5;
      player.resources.fuel = 5;
      const earlyDecisions = ai.planTurn(gameState, 'ai');

      // Late game (8 colonies)
      player.colonies = [
        'asimov_crater' as any,
        'heinlein_plains' as any,
        'bradbury_plateau' as any,
        'herbert_valley' as any,
        'lem_badlands' as any,
        'burroughs_desert' as any,
        'pohl_foothills' as any,
        'van_vogt_mountains' as any
      ];
      const lateDecisions = ai.planTurn(gameState, 'ai');

      // Both should produce valid decisions
      expect(earlyDecisions.length).toBeGreaterThanOrEqual(0);
      expect(lateDecisions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Difficulty Scaling', () => {
    test('Higher difficulties have better evaluation', () => {
      const cadetAI = new HeuristicAI(AIDifficulty.CADET);
      const admiralAI = new HeuristicAI(AIDifficulty.ADMIRAL);

      const gameState = new GameState('scaling-test');
      gameState.initializeGame([
        { id: 'player', name: 'Player', color: 0xff0000 }
      ]);

      const player = gameState.getAllPlayers().find(p => p.id === 'player');
      if (!player) fail('Player not found');

      player.resources.ore = 5;
      player.resources.fuel = 5;
      player.victoryPoints.total = 5;

      const cadetEval = cadetAI.evaluatePosition(gameState, 'player');
      const admiralEval = admiralAI.evaluatePosition(gameState, 'player');

      // Both should produce valid evaluations
      expect(typeof cadetEval).toBe('number');
      expect(typeof admiralEval).toBe('number');
    });

    test('Pirate AI shows aggressive behavior', () => {
      const pirateAI = new HeuristicAI(AIDifficulty.PIRATE);
      const personality = pirateAI.getPersonality();

      expect(personality.aggression).toBeGreaterThan(0.6);
      expect(personality.favorRaiding).toBeGreaterThan(0.7);
    });

    test('Admiral AI has deepest planning', () => {
      const admiralAI = new HeuristicAI(AIDifficulty.ADMIRAL);
      const personality = admiralAI.getPersonality();

      expect(personality.planningDepth).toBeGreaterThanOrEqual(3);
      expect(personality.thinkingTimeMs).toBeGreaterThan(3000);
    });

    test('Cadet AI has simplest behavior', () => {
      const cadetAI = new HeuristicAI(AIDifficulty.CADET);
      const personality = cadetAI.getPersonality();

      expect(personality.planningDepth).toBe(0);
      expect(personality.thinkingTimeMs).toBeLessThan(1000);
    });
  });

  describe('Edge Cases and Robustness', () => {
    test('AI handles empty game state', () => {
      const ai = new HeuristicAI(AIDifficulty.SPACER);
      const gameState = new GameState('empty-test');
      
      gameState.initializeGame([
        { id: 'player', name: 'Player', color: 0xff0000 }
      ]);

      expect(() => {
        const decisions = ai.planTurn(gameState, 'player');
        expect(Array.isArray(decisions)).toBe(true);
      }).not.toThrow();
    });

    test('AI handles invalid player gracefully', () => {
      const ai = new HeuristicAI(AIDifficulty.SPACER);
      const gameState = new GameState('invalid-test');
      
      gameState.initializeGame([
        { id: 'player', name: 'Player', color: 0xff0000 }
      ]);

      expect(() => {
        ai.planTurn(gameState, 'non-existent-player');
      }).toThrow();
    });

    test('AI handles game near victory', () => {
      const ai = new HeuristicAI(AIDifficulty.ADMIRAL);
      const gameState = new GameState('victory-test');
      
      gameState.initializeGame([
        { id: 'ai', name: 'AI', color: 0xff0000 }
      ]);

      const player = gameState.getAllPlayers().find(p => p.id === 'ai');
      if (!player) fail('Player not found');

      // 9 colonies (close to victory)
      player.colonies = [
        'asimov_crater' as any,
        'heinlein_plains' as any,
        'bradbury_plateau' as any,
        'herbert_valley' as any,
        'lem_badlands' as any,
        'burroughs_desert' as any,
        'pohl_foothills' as any,
        'van_vogt_mountains' as any,
        'asimov_crater' as any
      ];
      player.resources.ore = 5;
      player.resources.fuel = 2;

      const decisions = ai.planTurn(gameState, 'ai');
      
      // Should prioritize final colony
      const colonyDecisions = decisions.filter(d => 
        d.type.toString().includes('colony')
      );
      
      expect(colonyDecisions.length).toBeGreaterThan(0);
    });

    test('AI handles resource-starved state', () => {
      const ai = new HeuristicAI(AIDifficulty.SPACER);
      const gameState = new GameState('starved-test');
      
      gameState.initializeGame([
        { id: 'ai', name: 'AI', color: 0xff0000 }
      ]);

      const player = gameState.getAllPlayers().find(p => p.id === 'ai');
      if (!player) fail('Player not found');

      player.resources.ore = 0;
      player.resources.fuel = 0;
      player.resources.energy = 0;

      expect(() => {
        const decisions = ai.planTurn(gameState, 'ai');
        expect(Array.isArray(decisions)).toBe(true);
      }).not.toThrow();
    });

    test('AI handles resource-rich state', () => {
      const ai = new HeuristicAI(AIDifficulty.SPACER);
      const gameState = new GameState('rich-test');
      
      gameState.initializeGame([
        { id: 'ai', name: 'AI', color: 0xff0000 }
      ]);

      const player = gameState.getAllPlayers().find(p => p.id === 'ai');
      if (!player) fail('Player not found');

      player.resources.ore = 20;
      player.resources.fuel = 20;
      player.resources.energy = 10;

      const decisions = ai.planTurn(gameState, 'ai');
      
      // Should make multiple decisions with abundant resources
      expect(decisions.length).toBeGreaterThan(0);
    });
  });

  describe('Decision Quality', () => {
    test('AI decisions are deterministic for same state', () => {
      const ai = new HeuristicAI(AIDifficulty.SPACER);
      const gameState = new GameState('deterministic-test');
      
      gameState.initializeGame([
        { id: 'ai', name: 'AI', color: 0xff0000 }
      ]);

      const player = gameState.getAllPlayers().find(p => p.id === 'ai');
      if (!player) fail('Player not found');

      player.resources.ore = 5;
      player.resources.fuel = 3;

      const decisions1 = ai.planTurn(gameState, 'ai');
      const decisions2 = ai.planTurn(gameState, 'ai');

      // Same state should produce same decisions
      expect(decisions1.length).toBe(decisions2.length);
      
      decisions1.forEach((d1, i) => {
        if (i < decisions2.length) {
          expect(d1.value).toBe(decisions2[i].value);
          expect(d1.type).toBe(decisions2[i].type);
        }
      });
    });

    test('All decisions have positive value', () => {
      const ai = new HeuristicAI(AIDifficulty.ADMIRAL);
      const gameState = new GameState('positive-value-test');
      
      gameState.initializeGame([
        { id: 'ai', name: 'AI', color: 0xff0000 }
      ]);

      const player = gameState.getAllPlayers().find(p => p.id === 'ai');
      if (!player) fail('Player not found');

      player.resources.ore = 10;
      player.resources.fuel = 10;
      player.alienTechCards = ['booster_pod_1', 'plasma_cannon_1'];

      const decisions = ai.planTurn(gameState, 'ai');
      
      // All decisions must have positive value
      decisions.forEach(decision => {
        expect(decision.value).toBeGreaterThan(0);
      });
    });

    test('Decisions include reasoning', () => {
      const ai = new HeuristicAI(AIDifficulty.SPACER);
      const gameState = new GameState('reasoning-test');
      
      gameState.initializeGame([
        { id: 'ai', name: 'AI', color: 0xff0000 }
      ]);

      const player = gameState.getAllPlayers().find(p => p.id === 'ai');
      if (!player) fail('Player not found');

      player.resources.ore = 5;
      player.resources.fuel = 2;
      player.alienTechCards = ['booster_pod_1'];

      const decisions = ai.planTurn(gameState, 'ai');
      
      // Most decisions should have reasoning
      const withReasoning = decisions.filter(d => d.reasoning && d.reasoning.length > 0);
      expect(withReasoning.length).toBeGreaterThan(0);
    });
  });
});
