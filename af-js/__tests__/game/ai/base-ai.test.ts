/**
 * Tests for AI infrastructure
 */

import { AIDifficulty, getAIPersonality } from '../../../src/game/ai/ai-types';
import { GameStateEvaluator } from '../../../src/game/ai/evaluator';
import { createAI, HeuristicAI } from '../../../src/game/ai/base-ai';
import { GameState } from '../../../src/game/game-state';

describe('AI Personality', () => {
  test('Each difficulty has different personality', () => {
    const cadet = getAIPersonality(AIDifficulty.CADET);
    const spacer = getAIPersonality(AIDifficulty.SPACER);
    const pirate = getAIPersonality(AIDifficulty.PIRATE);
    const admiral = getAIPersonality(AIDifficulty.ADMIRAL);

    // Cadet has least planning depth
    expect(cadet.planningDepth).toBeLessThan(spacer.planningDepth);
    expect(spacer.planningDepth).toBeLessThan(admiral.planningDepth);

    // Pirate is most aggressive
    expect(pirate.aggression).toBeGreaterThan(cadet.aggression);
    expect(pirate.aggression).toBeGreaterThan(spacer.aggression);

    // Admiral thinks longest
    expect(admiral.thinkingTimeMs).toBeGreaterThan(cadet.thinkingTimeMs);
  });

  test('All personalities have valid value weights', () => {
    const difficulties = [
      AIDifficulty.CADET,
      AIDifficulty.SPACER,
      AIDifficulty.PIRATE,
      AIDifficulty.ADMIRAL
    ];

    difficulties.forEach(diff => {
      const personality = getAIPersonality(diff);
      
      expect(personality.valueShip).toBeGreaterThan(0);
      expect(personality.valueFuel).toBeGreaterThan(0);
      expect(personality.valueOre).toBeGreaterThan(0);
      expect(personality.valueColony).toBeGreaterThan(0);
      expect(personality.valueVP).toBeGreaterThan(0);
    });
  });
});

describe('Game State Evaluator', () => {
  let gameState: GameState;
  let evaluator: GameStateEvaluator;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 },
      { id: 'player2', name: 'Player 2', color: 0x00ff00 }
    ]);

    const personality = getAIPersonality(AIDifficulty.SPACER);
    evaluator = new GameStateEvaluator(personality);
  });

  test('Evaluator returns numeric score', () => {
    const score = evaluator.evaluate(gameState, 'player1');
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThan(0); // Should have some positive value for starting position
  });

  test('Player with more resources scores higher', () => {
    const player1 = gameState.getAllPlayers()[0];
    const player2 = gameState.getAllPlayers()[1];

    // Give player1 more resources
    player1.resources.fuel = 5;
    player1.resources.ore = 5;
    player2.resources.fuel = 1;
    player2.resources.ore = 1;

    const score1 = evaluator.evaluate(gameState, player1.id);
    const score2 = evaluator.evaluate(gameState, player2.id);

    expect(score1).toBeGreaterThan(score2);
  });

  test('Player with more VP scores higher', () => {
    const player1 = gameState.getAllPlayers()[0];
    const player2 = gameState.getAllPlayers()[1];

    // Give player1 more victory points
    player1.victoryPoints.total = 5;
    player2.victoryPoints.total = 2;

    const score1 = evaluator.evaluate(gameState, player1.id);
    const score2 = evaluator.evaluate(gameState, player2.id);

    expect(score1).toBeGreaterThan(score2);
  });

  test('Evaluator considers all factors', () => {
    const player1 = gameState.getAllPlayers()[0];
    
    const baseScore = evaluator.evaluate(gameState, player1.id);

    // Add resources
    player1.resources.fuel = 10;
    player1.resources.ore = 10;

    const scoreWithResources = evaluator.evaluate(gameState, player1.id);

    // Score should increase with more resources
    expect(scoreWithResources).toBeGreaterThan(baseScore);
  });

  test('Evaluator handles non-existent player', () => {
    const score = evaluator.evaluate(gameState, 'non-existent');
    expect(score).toBe(-Infinity);
  });
});

describe('Base AI', () => {
  test('createAI returns AI instance', () => {
    const ai = createAI(AIDifficulty.CADET);
    expect(ai).toBeInstanceOf(HeuristicAI);
  });

  test('AI can evaluate position', () => {
    const gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000, isAI: true }
    ]);

    const ai = createAI(AIDifficulty.SPACER);
    const score = ai.evaluatePosition(gameState, 'player1');

    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThan(0);
  });

  test('AI has personality matching difficulty', () => {
    const ai = createAI(AIDifficulty.ADMIRAL);
    const personality = ai.getPersonality();

    expect(personality.difficulty).toBe(AIDifficulty.ADMIRAL);
    expect(personality.planningDepth).toBe(3);
  });

  test('AI can plan turn (returns decisions)', () => {
    const gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000, isAI: true }
    ]);

    const ai = createAI(AIDifficulty.CADET);
    const decisions = ai.planTurn(gameState, 'player1');

    // Should return array (even if empty for now)
    expect(Array.isArray(decisions)).toBe(true);
  });
});

describe('AI Decision Making', () => {
  let gameState: GameState;
  let ai: HeuristicAI;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'ai-player', name: 'AI Player', color: 0xff0000, isAI: true },
      { id: 'human-player', name: 'Human Player', color: 0x00ff00 }
    ]);

    ai = new HeuristicAI(AIDifficulty.SPACER);
  });

  test('AI can decide ship placements', () => {
    const decisions = ai.decideShipPlacements(gameState, 'ai-player');
    expect(Array.isArray(decisions)).toBe(true);
    // Implementation is stub for now
  });

  test('AI can decide tech card usage', () => {
    const decisions = ai.decideTechCardUsage(gameState, 'ai-player');
    expect(Array.isArray(decisions)).toBe(true);
    // Implementation is stub for now
  });

  test('AI can decide colony placement', () => {
    const decision = ai.decideColonyPlacement(gameState, 'ai-player');
    // Implementation is stub for now, returns null
    expect(decision).toBeNull();
  });
});
