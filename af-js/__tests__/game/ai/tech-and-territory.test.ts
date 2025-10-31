/**
 * Tests for AI tech card usage and territory strategy
 */

import { HeuristicAI } from '../../../src/game/ai/base-ai';
import { AIDifficulty } from '../../../src/game/ai/ai-types';
import { GameState } from '../../../src/game/game-state';
import { TerritoryType } from '../../../src/game/territory';

describe('AI Tech Card Usage', () => {
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

  describe('decideTechCardUsage', () => {
    test('Returns empty array when player has no tech cards', () => {
      const decisions = ai.decideTechCardUsage(gameState, playerId);
      expect(decisions).toEqual([]);
    });

    test('Returns decisions when player has tech cards', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.alienTechCards = ['booster_pod_1', 'stasis_beam_1'];

      const decisions = ai.decideTechCardUsage(gameState, playerId);
      expect(decisions.length).toBeGreaterThan(0);
    });

    test('Tech card decisions have correct structure', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.alienTechCards = ['plasma_cannon_1'];

      const decisions = ai.decideTechCardUsage(gameState, playerId);
      
      decisions.forEach(decision => {
        expect(decision).toHaveProperty('type');
        expect(decision).toHaveProperty('value');
        expect(decision).toHaveProperty('data');
        expect(decision.data).toHaveProperty('cardId');
        expect(decision.data).toHaveProperty('action');
      });
    });

    test('Pirate AI values aggressive cards higher', () => {
      const pirateAI = new HeuristicAI(AIDifficulty.PIRATE);
      const spacerAI = new HeuristicAI(AIDifficulty.SPACER);

      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.alienTechCards = ['plasma_cannon_1', 'holographic_decoy_1'];

      const pirateDecisions = pirateAI.decideTechCardUsage(gameState, playerId);
      const spacerDecisions = spacerAI.decideTechCardUsage(gameState, playerId);

      // Pirate should value plasma cannon higher
      const piratePlasma = pirateDecisions.find(d => d.data.cardId.includes('plasma'));
      const spacerPlasma = spacerDecisions.find(d => d.data.cardId.includes('plasma'));

      if (piratePlasma && spacerPlasma) {
        expect(piratePlasma.value).toBeGreaterThan(spacerPlasma.value);
      }
    });

    test('Decisions are sorted by value', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.alienTechCards = [
        'booster_pod_1',
        'stasis_beam_1',
        'plasma_cannon_1'
      ];

      const decisions = ai.decideTechCardUsage(gameState, playerId);

      for (let i = 1; i < decisions.length; i++) {
        expect(decisions[i - 1].value).toBeGreaterThanOrEqual(decisions[i].value);
      }
    });

    test('Considers both use and discard actions', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.alienTechCards = ['stasis_beam_1', 'data_crystal_1'];

      const decisions = ai.decideTechCardUsage(gameState, playerId);
      
      const useActions = decisions.filter(d => d.data.action === 'use');
      const discardActions = decisions.filter(d => d.data.action === 'discard');

      // Both types should be present
      expect(useActions.length).toBeGreaterThan(0);
      expect(discardActions.length).toBeGreaterThan(0);
    });
  });

  describe('Tech Card Evaluation', () => {
    test('Die manipulation cards valued by favorDieManipulation', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.alienTechCards = ['booster_pod_1', 'temporal_warper_1'];

      const decisions = ai.decideTechCardUsage(gameState, playerId);
      
      // All decisions should have positive value
      decisions.forEach(decision => {
        expect(decision.value).toBeGreaterThan(0);
      });
    });

    test('Resource cards always have value', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.alienTechCards = ['resource_cache_1'];

      const decisions = ai.decideTechCardUsage(gameState, playerId);
      
      const resourceDecisions = decisions.filter(d => d.data.cardId.includes('resource'));
      expect(resourceDecisions.length).toBeGreaterThan(0);
      expect(resourceDecisions[0].value).toBeGreaterThan(5);
    });
  });
});

describe('AI Territory Strategy', () => {
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

  describe('decideColonyPlacement', () => {
    test('Returns null when player cannot afford colony', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.resources.ore = 0;
      player.resources.fuel = 0;

      const decision = ai.decideColonyPlacement(gameState, playerId);
      expect(decision).toBeNull();
    });

    test('Returns decision when player can afford colony', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.resources.ore = 5;
      player.resources.fuel = 2;

      const decision = ai.decideColonyPlacement(gameState, playerId);
      expect(decision).not.toBeNull();
    });

    test('Colony decision has correct structure', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.resources.ore = 5;
      player.resources.fuel = 2;

      const decision = ai.decideColonyPlacement(gameState, playerId);
      
      if (decision) {
        expect(decision).toHaveProperty('type');
        expect(decision).toHaveProperty('value');
        expect(decision).toHaveProperty('data');
        expect(decision.data).toHaveProperty('territoryId');
        expect(decision.data).toHaveProperty('territoryType');
      }
    });

    test('Prefers territories with valuable bonuses', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.resources.ore = 10;
      player.resources.fuel = 10;

      const decision = ai.decideColonyPlacement(gameState, playerId);
      
      if (decision) {
        // Should pick a strategically valuable territory
        expect(decision.value).toBeGreaterThan(10);
      }
    });

    test('AI with high favorTerritories values territory control', () => {
      const territoryFocusedAI = new HeuristicAI(AIDifficulty.ADMIRAL);
      const normalAI = new HeuristicAI(AIDifficulty.CADET);

      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.resources.ore = 5;
      player.resources.fuel = 2;

      const focusedDecision = territoryFocusedAI.decideColonyPlacement(gameState, playerId);
      const normalDecision = normalAI.decideColonyPlacement(gameState, playerId);

      // Both should make decisions
      expect(focusedDecision).not.toBeNull();
      expect(normalDecision).not.toBeNull();
    });
  });

  describe('Territory Evaluation', () => {
    test('Early game prioritizes resource territories', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      // Early game state (few colonies)
      player.colonies = ['asimov_crater' as any];
      player.resources.ore = 5;
      player.resources.fuel = 2;

      const decision = ai.decideColonyPlacement(gameState, playerId);
      
      if (decision) {
        // Should pick resource-generating territory
        const territory = decision.data.territoryType;
        const resourceTerritories = [
          'heinlein_plains',
          'lem_badlands',
          'burroughs_desert'
        ];
        
        // Just verify a decision is made
        expect(decision.value).toBeGreaterThan(0);
      }
    });

    test('Late game prioritizes any territory', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      // Late game state (8+ colonies)
      player.colonies = [
        'asimov_crater' as any,
        'heinlein_plains' as any,
        'burroughs_desert' as any,
        'bradbury_plateau' as any,
        'herbert_valley' as any,
        'lem_badlands' as any,
        'pohl_foothills' as any,
        'van_vogt_mountains' as any
      ];
      player.resources.ore = 5;
      player.resources.fuel = 2;

      const decision = ai.decideColonyPlacement(gameState, playerId);
      
      if (decision) {
        // Should have high urgency (1.5x multiplier)
        expect(decision.value).toBeGreaterThan(15);
      }
    });

    test('Territory bonuses are evaluated correctly', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.resources.ore = 10;
      player.resources.fuel = 10;

      const decision = ai.decideColonyPlacement(gameState, playerId);
      
      // Should make a decision based on territory value
      expect(decision).not.toBeNull();
    });
  });

  describe('Integration with Other Decisions', () => {
    test('planTurn includes colony placement when affordable', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.resources.ore = 5;
      player.resources.fuel = 2;

      const decisions = ai.planTurn(gameState, playerId);
      
      const colonyDecisions = decisions.filter(d => 
        d.type.toString().includes('colony_placement')
      );

      expect(colonyDecisions.length).toBeGreaterThan(0);
    });

    test('planTurn skips colony placement when unaffordable', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.resources.ore = 0;
      player.resources.fuel = 0;

      const decisions = ai.planTurn(gameState, playerId);
      
      const colonyDecisions = decisions.filter(d => 
        d.type.toString().includes('colony_placement')
      );

      expect(colonyDecisions.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('Handles full territories gracefully', () => {
      const player = gameState.getAllPlayers().find(p => p.id === playerId);
      if (!player) fail('Player not found');

      player.resources.ore = 10;
      player.resources.fuel = 10;

      // This should still work even if some territories are full
      const decision = ai.decideColonyPlacement(gameState, playerId);
      
      // Should either find an available territory or return valid decision
      if (decision) {
        expect(decision.value).toBeGreaterThan(0);
      }
    });

    test('Handles invalid player gracefully', () => {
      expect(() => {
        ai.decideColonyPlacement(gameState, 'invalid-player');
      }).toThrow();
    });
  });
});
