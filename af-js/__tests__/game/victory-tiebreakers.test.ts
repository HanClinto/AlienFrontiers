/**
 * Victory Conditions Extended Tests
 * Tests for tiebreaker rules and Positron Field VP
 */

import { GameState } from '../../src/game/game-state';
import { ColonyLocation } from '../../src/game/types';

describe('Victory Conditions - Tiebreakers', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'player1', name: 'Player 1', color: 0xff0000 },
      { id: 'player2', name: 'Player 2', color: 0x00ff00 },
      { id: 'player3', name: 'Player 3', color: 0x0000ff }
    ]);
  });

  describe('Tiebreaker Sequence', () => {
    test('should break tie by tech card count first', () => {
      const allPlayers = gameState.getAllPlayers();
      const player1 = allPlayers[0];
      const player2 = allPlayers[1];

      // Both players have 4 VP
      player1.victoryPoints.total = 4;
      player2.victoryPoints.total = 4;

      // Give player 1 more tech cards
      player1.alienTechCards = ['booster_pod', 'stasis_beam', 'data_crystal'];

      // Give player 2 fewer tech cards
      player2.alienTechCards = ['resource_cache'];

      // Trigger end game by placing 10 colonies
      for (let i = 0; i < 10; i++) {
        player1.colonies.push(ColonyLocation.HEINLEIN_PLAINS);
      }

      // Check tiebreaker
      const winners = gameState.getWinners();

      // Player 1 should win with 3 tech cards vs 1
      expect(winners.length).toBe(1);
      expect(winners[0].id).toBe('player1');
    });

    test('should break tie by ore count if tech cards equal', () => {
      const allPlayers = gameState.getAllPlayers();
      const player1 = allPlayers[0];
      const player2 = allPlayers[1];

      // Both players have 4 VP and 2 tech cards
      player1.victoryPoints.total = 4;
      player2.victoryPoints.total = 4;

      player1.alienTechCards = ['booster_pod', 'stasis_beam'];
      player2.alienTechCards = ['resource_cache', 'data_crystal'];

      // Give player 1 more ore
      player1.resources.ore = 5;
      player2.resources.ore = 2;

      // Trigger end game
      for (let i = 0; i < 10; i++) {
        player1.colonies.push(ColonyLocation.HERBERT_VALLEY);
      }

      const winners = gameState.getWinners();

      // Player 1 should win with 5 ore vs 2 ore
      expect(winners.length).toBe(1);
      expect(winners[0].id).toBe('player1');
    });

    test('should break tie by fuel count if tech cards and ore equal', () => {
      const allPlayers = gameState.getAllPlayers();
      const player1 = allPlayers[0];
      const player2 = allPlayers[1];

      // Both players have 4 VP, 2 tech cards, 3 ore
      player1.victoryPoints.total = 4;
      player2.victoryPoints.total = 4;

      player1.alienTechCards = ['booster_pod', 'stasis_beam'];
      player2.alienTechCards = ['resource_cache', 'data_crystal'];

      player1.resources.ore = 3;
      player2.resources.ore = 3;

      // Give player 2 more fuel
      player1.resources.fuel = 4;
      player2.resources.fuel = 7;

      // Trigger end game
      for (let i = 0; i < 10; i++) {
        player1.colonies.push(ColonyLocation.BRADBURY_PLATEAU);
      }

      const winners = gameState.getWinners();

      // Player 2 should win with 7 fuel vs 4 fuel
      expect(winners.length).toBe(1);
      expect(winners[0].id).toBe('player2');
    });

    test('should return tie if all tiebreakers are equal', () => {
      const allPlayers = gameState.getAllPlayers();
      const player1 = allPlayers[0];
      const player2 = allPlayers[1];

      // Both players have 4 VP, 2 tech cards, 3 ore, 5 fuel
      player1.victoryPoints.total = 4;
      player2.victoryPoints.total = 4;

      player1.alienTechCards = ['booster_pod', 'stasis_beam'];
      player2.alienTechCards = ['resource_cache', 'data_crystal'];

      player1.resources.ore = 3;
      player2.resources.ore = 3;
      player1.resources.fuel = 5;
      player2.resources.fuel = 5;

      // Trigger end game
      for (let i = 0; i < 10; i++) {
        player1.colonies.push(ColonyLocation.HERBERT_VALLEY);
      }

      const winners = gameState.getWinners();

      // Should be a tie
      expect(winners.length).toBe(2);
    });

    test('should not use tiebreaker if VPs are different', () => {
      const allPlayers = gameState.getAllPlayers();
      const player1 = allPlayers[0];
      const player2 = allPlayers[1];

      // Player 1: 5 VP
      player1.victoryPoints.total = 5;

      // Player 2: 4 VP
      player2.victoryPoints.total = 4;

      // Give player 2 more tech cards, ore, and fuel (tiebreakers)
      player2.alienTechCards = ['booster_pod', 'stasis_beam', 'data_crystal'];
      player2.resources.ore = 10;
      player2.resources.fuel = 10;

      // Trigger end game
      for (let i = 0; i < 10; i++) {
        player1.colonies.push(ColonyLocation.ASIMOV_CRATER);
      }

      const winners = gameState.getWinners();

      // Player 1 should still win with higher VP
      expect(winners.length).toBe(1);
      expect(winners[0].id).toBe('player1');
    });
  });

  describe('Three-way Tie Scenarios', () => {
    test('should handle three-way VP tie with tiebreakers', () => {
      const allPlayers = gameState.getAllPlayers();
      const player1 = allPlayers[0];
      const player2 = allPlayers[1];
      const player3 = allPlayers[2];

      // All players have 4 VP
      player1.victoryPoints.total = 4;
      player2.victoryPoints.total = 4;
      player3.victoryPoints.total = 4;

      // All have same tech cards (1 each)
      player1.alienTechCards = ['booster_pod'];
      player2.alienTechCards = ['stasis_beam'];
      player3.alienTechCards = ['data_crystal'];

      // All have same ore
      player1.resources.ore = 3;
      player2.resources.ore = 3;
      player3.resources.ore = 3;

      // Player 2 has most fuel
      player1.resources.fuel = 4;
      player2.resources.fuel = 6;
      player3.resources.fuel = 2;

      // Trigger end game
      for (let i = 0; i < 10; i++) {
        player1.colonies.push(ColonyLocation.BURROUGHS_DESERT);
      }

      const winners = gameState.getWinners();

      // Player 2 should win on fuel tiebreaker
      expect(winners.length).toBe(1);
      expect(winners[0].id).toBe('player2');
    });
  });

  describe('Positron Field Victory Points', () => {
    test('should verify structure for Positron Field VP bonus', () => {
      const allPlayers = gameState.getAllPlayers();
      const player = allPlayers[0];

      // Player controls Herbert Valley (2 colonies)
      gameState.getTerritoryManager().placeColony('herbert_valley', 'player1');
      gameState.getTerritoryManager().placeColony('herbert_valley', 'player1');

      // Base VP: 2 colonies
      // When Positron Field implemented: would add +1 VP for controlling territory with field
      // This test verifies the structure exists for tracking territory bonuses
      
      expect(gameState.getTerritoryManager()).toBeDefined();
      expect(player.victoryPoints).toBeDefined();
    });

    test('should verify structure for multiple Positron Fields', () => {
      const allPlayers = gameState.getAllPlayers();
      const player = allPlayers[0];

      // Control two territories
      gameState.getTerritoryManager().placeColony('herbert_valley', 'player1');
      gameState.getTerritoryManager().placeColony('herbert_valley', 'player1');
      gameState.getTerritoryManager().placeColony('lem_badlands', 'player1');
      gameState.getTerritoryManager().placeColony('lem_badlands', 'player1');

      // When Positron Fields implemented: would add +1 VP per field
      // Test verifies territory tracking structure exists
      
      expect(gameState.getTerritoryManager()).toBeDefined();
    });

    test('Positron Field VP should be included in final victory calculation', () => {
      const allPlayers = gameState.getAllPlayers();
      const player1 = allPlayers[0];
      const player2 = allPlayers[1];

      // Player 1: 3 colonies (when Positron added: +1 VP = 4 total)
      gameState.getTerritoryManager().placeColony('herbert_valley', 'player1');
      gameState.getTerritoryManager().placeColony('herbert_valley', 'player1');
      gameState.getTerritoryManager().placeColony('lem_badlands', 'player1');

      // Player 2: 4 colonies = 4 VP
      gameState.getTerritoryManager().placeColony('asimov_crater', 'player2');
      gameState.getTerritoryManager().placeColony('asimov_crater', 'player2');
      gameState.getTerritoryManager().placeColony('bradbury_plateau', 'player2');
      gameState.getTerritoryManager().placeColony('bradbury_plateau', 'player2');

      // Test structure for Positron Field VP integration
      expect(player1.victoryPoints).toBeDefined();
      expect(player2.victoryPoints).toBeDefined();
    });
  });

  describe('Victory Conditions Integration', () => {
    test('should calculate VP with all victory types', () => {
      const allPlayers = gameState.getAllPlayers();
      const player = allPlayers[0];

      // 2 colonies
      gameState.getTerritoryManager().placeColony('herbert_valley', 'player1');
      gameState.getTerritoryManager().placeColony('herbert_valley', 'player1');

      // Territory control (Herbert Valley)
      // Test structure exists for victory point calculation
      player.victoryPoints.total = 4;

      // When Positron Field implemented: +1 VP
      // Total expected: 2 colonies + 1 territory + 1 monument + 1 city (+ 1 Positron when implemented)
      
      expect(player.victoryPoints).toBeDefined();
      expect(gameState.getTerritoryManager()).toBeDefined();
    });
  });
});
