/**
 * Tests for colony construction costs
 */

import { GameState } from '../../src/game/game-state';
import { Player } from '../../src/game/player';
import { TerritoryType } from '../../src/game/territory';

describe('Colony Construction Costs', () => {
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

  describe('Normal Colony Costs', () => {
    test('Colony costs 3 ore + 1 fuel', () => {
      player1.resources.ore = 3;
      player1.resources.fuel = 1;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HEINLEIN_PLAINS);
      
      expect(success).toBe(true);
      expect(player1.resources.ore).toBe(0);
      expect(player1.resources.fuel).toBe(0);
    });

    test('Cannot place colony without enough ore', () => {
      player1.resources.ore = 2; // Not enough
      player1.resources.fuel = 1;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HEINLEIN_PLAINS);
      
      expect(success).toBe(false);
      expect(player1.resources.ore).toBe(2); // Unchanged
      expect(player1.resources.fuel).toBe(1); // Unchanged
    });

    test('Cannot place colony without enough fuel', () => {
      player1.resources.ore = 3;
      player1.resources.fuel = 0; // Not enough

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HEINLEIN_PLAINS);
      
      expect(success).toBe(false);
      expect(player1.resources.ore).toBe(3); // Unchanged
      expect(player1.resources.fuel).toBe(0); // Unchanged
    });

    test('Can place colony with extra resources', () => {
      player1.resources.ore = 10;
      player1.resources.fuel = 5;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HEINLEIN_PLAINS);
      
      expect(success).toBe(true);
      expect(player1.resources.ore).toBe(7); // 10 - 3
      expect(player1.resources.fuel).toBe(4); // 5 - 1
    });

    test('Cannot place colony with 0 ore', () => {
      player1.resources.ore = 0;
      player1.resources.fuel = 5;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HEINLEIN_PLAINS);
      
      expect(success).toBe(false);
    });

    test('Cannot place colony with 0 fuel', () => {
      player1.resources.ore = 10;
      player1.resources.fuel = 0;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HEINLEIN_PLAINS);
      
      expect(success).toBe(false);
    });
  });

  describe('Bradbury Plateau Bonus', () => {
    beforeEach(() => {
      // Give player1 control of Bradbury Plateau
      const territory = gameState.getTerritory(TerritoryType.BRADBURY_PLATEAU);
      if (territory) {
        territory.placeColony(player1.id);
        territory.placeColony(player1.id);
        // Bonus is automatically active when controlled
      }
    });

    test('Bradbury Plateau reduces ore cost by 1', () => {
      player1.resources.ore = 2; // Only need 2 with bonus
      player1.resources.fuel = 1;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HEINLEIN_PLAINS);
      
      expect(success).toBe(true);
      expect(player1.resources.ore).toBe(0); // 2 - 2
      expect(player1.resources.fuel).toBe(0); // 1 - 1
    });

    test('Can place colony with exactly 2 ore when controlling Bradbury Plateau', () => {
      player1.resources.ore = 2;
      player1.resources.fuel = 1;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.LEM_BADLANDS);
      
      expect(success).toBe(true);
      expect(player1.resources.ore).toBe(0);
    });

    test('Cannot place colony with only 1 ore even with Bradbury Plateau', () => {
      player1.resources.ore = 1;
      player1.resources.fuel = 1;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.LEM_BADLANDS);
      
      expect(success).toBe(false);
    });

    test('Bradbury Plateau does not reduce fuel cost', () => {
      player1.resources.ore = 2;
      player1.resources.fuel = 0; // Still need 1 fuel

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.LEM_BADLANDS);
      
      expect(success).toBe(false);
    });

    test('Player without Bradbury Plateau control still pays 3 ore', () => {
      player2.resources.ore = 2; // Not enough without bonus
      player2.resources.fuel = 1;

      const success = gameState.placeColonyOnTerritory(player2.id, TerritoryType.HERBERT_VALLEY);
      
      expect(success).toBe(false);
    });

    test('Multiple colonies with Bradbury Plateau bonus', () => {
      player1.resources.ore = 6; // Enough for 3 colonies (2 each)
      player1.resources.fuel = 3;

      const success1 = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HEINLEIN_PLAINS);
      expect(success1).toBe(true);
      expect(player1.resources.ore).toBe(4);
      expect(player1.resources.fuel).toBe(2);

      const success2 = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HERBERT_VALLEY);
      expect(success2).toBe(true);
      expect(player1.resources.ore).toBe(2);
      expect(player1.resources.fuel).toBe(1);

      const success3 = gameState.placeColonyOnTerritory(player1.id, TerritoryType.LEM_BADLANDS);
      expect(success3).toBe(true);
      expect(player1.resources.ore).toBe(0);
      expect(player1.resources.fuel).toBe(0);
    });
  });

  describe('Isolation Field on Bradbury Plateau', () => {
    beforeEach(() => {
      // Give player1 control of Bradbury Plateau
      const territory = gameState.getTerritory(TerritoryType.BRADBURY_PLATEAU);
      if (territory) {
        territory.placeColony(player1.id);
        territory.placeColony(player1.id);
        // Place Isolation Field to disable bonus
        const isolationField = { type: 'isolation' as any, territoryId: TerritoryType.BRADBURY_PLATEAU };
        territory.placeFieldGenerator(isolationField);
      }
    });

    test('Isolation Field on Bradbury Plateau disables ore discount', () => {
      player1.resources.ore = 2; // Not enough without bonus
      player1.resources.fuel = 1;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HEINLEIN_PLAINS);
      
      expect(success).toBe(false);
    });

    test('Normal cost applies when bonus is deactivated', () => {
      player1.resources.ore = 3; // Need full 3 ore
      player1.resources.fuel = 1;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HEINLEIN_PLAINS);
      
      expect(success).toBe(true);
      expect(player1.resources.ore).toBe(0);
      expect(player1.resources.fuel).toBe(0);
    });
  });

  describe('Invalid Scenarios', () => {
    test('Cannot place colony with invalid player', () => {
      const success = gameState.placeColonyOnTerritory('invalid-player', TerritoryType.HEINLEIN_PLAINS);
      expect(success).toBe(false);
    });

    test('Cannot place colony on invalid territory', () => {
      player1.resources.ore = 5;
      player1.resources.fuel = 2;

      const success = gameState.placeColonyOnTerritory(player1.id, 'invalid-territory');
      expect(success).toBe(false);
      // Resources should be unchanged
      expect(player1.resources.ore).toBe(5);
      expect(player1.resources.fuel).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    test('Placing colony on Bradbury Plateau itself costs normal amount', () => {
      // Player doesn't control it yet
      player1.resources.ore = 3;
      player1.resources.fuel = 1;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.BRADBURY_PLATEAU);
      
      expect(success).toBe(true);
      expect(player1.resources.ore).toBe(0);
      expect(player1.resources.fuel).toBe(0);
    });

    test('Resource costs are atomic - no partial deductions on failure', () => {
      player1.resources.ore = 2; // Not enough
      player1.resources.fuel = 1;

      const initialOre = player1.resources.ore;
      const initialFuel = player1.resources.fuel;

      const success = gameState.placeColonyOnTerritory(player1.id, TerritoryType.HEINLEIN_PLAINS);
      
      expect(success).toBe(false);
      expect(player1.resources.ore).toBe(initialOre);
      expect(player1.resources.fuel).toBe(initialFuel);
    });

    test('Can place colonies on different territories with sufficient resources', () => {
      player1.resources.ore = 12; // 3 * 4
      player1.resources.fuel = 4; // 1 * 4

      const territories = [
        TerritoryType.HEINLEIN_PLAINS,
        TerritoryType.HERBERT_VALLEY,
        TerritoryType.LEM_BADLANDS,
        TerritoryType.VAN_VOGT_MOUNTAINS
      ];

      // Place 1 colony on each territory (4 total)
      for (const territory of territories) {
        const success = gameState.placeColonyOnTerritory(player1.id, territory);
        expect(success).toBe(true);
      }

      expect(player1.colonies.length).toBe(4);
      expect(player1.resources.ore).toBe(0);
      expect(player1.resources.fuel).toBe(0);
    });
  });
});
