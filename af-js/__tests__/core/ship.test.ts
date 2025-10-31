/**
 * Ship management tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ShipManager, Ship } from '../../src/game/ship';
import { DiceValue } from '../../src/game/types';

describe('ShipManager', () => {
  let shipManager: ShipManager;

  beforeEach(() => {
    shipManager = new ShipManager();
  });

  describe('createPlayerShips', () => {
    test('should create 3 ships per player', () => {
      const ships = shipManager.createPlayerShips('player1');
      expect(ships).toHaveLength(3);
    });

    test('ships should have correct initial state', () => {
      const ships = shipManager.createPlayerShips('player1');
      
      ships.forEach((ship, index) => {
        expect(ship.id).toBe(`player1-ship-${index}`);
        expect(ship.playerId).toBe('player1');
        expect(ship.diceValue).toBeNull();
        expect(ship.location).toBeNull();
        expect(ship.isLocked).toBe(false);
      });
    });

    test('should create ships for multiple players', () => {
      const player1Ships = shipManager.createPlayerShips('player1');
      const player2Ships = shipManager.createPlayerShips('player2');
      
      expect(player1Ships).toHaveLength(3);
      expect(player2Ships).toHaveLength(3);
      expect(player1Ships[0].playerId).toBe('player1');
      expect(player2Ships[0].playerId).toBe('player2');
    });
  });

  describe('getPlayerShips', () => {
    test('should return only ships for specified player', () => {
      shipManager.createPlayerShips('player1');
      shipManager.createPlayerShips('player2');
      
      const player1Ships = shipManager.getPlayerShips('player1');
      expect(player1Ships).toHaveLength(3);
      expect(player1Ships.every(s => s.playerId === 'player1')).toBe(true);
    });

    test('should return empty array for non-existent player', () => {
      const ships = shipManager.getPlayerShips('nonexistent');
      expect(ships).toHaveLength(0);
    });
  });

  describe('rollDice', () => {
    test('should roll dice for all player ships', () => {
      shipManager.createPlayerShips('player1');
      const rolls = shipManager.rollDice('player1');
      
      expect(rolls).toHaveLength(3);
      rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      });
    });

    test('should assign dice values to ships', () => {
      shipManager.createPlayerShips('player1');
      shipManager.rollDice('player1');
      
      const ships = shipManager.getPlayerShips('player1');
      ships.forEach(ship => {
        expect(ship.diceValue).not.toBeNull();
        expect(ship.diceValue).toBeGreaterThanOrEqual(1);
        expect(ship.diceValue).toBeLessThanOrEqual(6);
      });
    });
  });

  describe('placeShip', () => {
    test('should place ship at location', () => {
      const ships = shipManager.createPlayerShips('player1');
      shipManager.rollDice('player1');
      
      const success = shipManager.placeShip(ships[0].id, 'solar_converter');
      expect(success).toBe(true);
      
      const ship = shipManager.getShip(ships[0].id);
      expect(ship?.location).toBe('solar_converter');
    });

    test('should not place ship without dice value', () => {
      const ships = shipManager.createPlayerShips('player1');
      const success = shipManager.placeShip(ships[0].id, 'solar_converter');
      expect(success).toBe(false);
    });

    test('should not place locked ship', () => {
      const ships = shipManager.createPlayerShips('player1');
      shipManager.rollDice('player1');
      shipManager.placeShip(ships[0].id, 'solar_converter');
      shipManager.lockShip(ships[0].id);
      
      const success = shipManager.placeShip(ships[0].id, 'lunar_mine');
      expect(success).toBe(false);
    });
  });

  describe('lockShip', () => {
    test('should lock ship at location', () => {
      const ships = shipManager.createPlayerShips('player1');
      shipManager.rollDice('player1');
      shipManager.placeShip(ships[0].id, 'solar_converter');
      
      const success = shipManager.lockShip(ships[0].id);
      expect(success).toBe(true);
      
      const ship = shipManager.getShip(ships[0].id);
      expect(ship?.isLocked).toBe(true);
    });

    test('should not lock ship without location', () => {
      const ships = shipManager.createPlayerShips('player1');
      const success = shipManager.lockShip(ships[0].id);
      expect(success).toBe(false);
    });
  });

  describe('returnShipToPool', () => {
    test('should clear ship state', () => {
      const ships = shipManager.createPlayerShips('player1');
      shipManager.rollDice('player1');
      shipManager.placeShip(ships[0].id, 'solar_converter');
      shipManager.lockShip(ships[0].id);
      
      shipManager.returnShipToPool(ships[0].id);
      
      const ship = shipManager.getShip(ships[0].id);
      expect(ship?.location).toBeNull();
      expect(ship?.isLocked).toBe(false);
      expect(ship?.diceValue).toBeNull();
    });
  });

  describe('returnAllShipsToPool', () => {
    test('should return all player ships to pool', () => {
      shipManager.createPlayerShips('player1');
      shipManager.rollDice('player1');
      
      const ships = shipManager.getPlayerShips('player1');
      ships.forEach(ship => {
        shipManager.placeShip(ship.id, 'solar_converter');
        shipManager.lockShip(ship.id);
      });
      
      shipManager.returnAllShipsToPool('player1');
      
      const returnedShips = shipManager.getPlayerShips('player1');
      returnedShips.forEach(ship => {
        expect(ship.location).toBeNull();
        expect(ship.isLocked).toBe(false);
        expect(ship.diceValue).toBeNull();
      });
    });
  });

  describe('getShipsAtLocation', () => {
    test('should return ships at specific location', () => {
      shipManager.createPlayerShips('player1');
      shipManager.createPlayerShips('player2');
      shipManager.rollDice('player1');
      shipManager.rollDice('player2');
      
      const p1Ships = shipManager.getPlayerShips('player1');
      const p2Ships = shipManager.getPlayerShips('player2');
      
      shipManager.placeShip(p1Ships[0].id, 'solar_converter');
      shipManager.placeShip(p1Ships[1].id, 'solar_converter');
      shipManager.placeShip(p2Ships[0].id, 'lunar_mine');
      
      const shipsAtSolar = shipManager.getShipsAtLocation('solar_converter');
      expect(shipsAtSolar).toHaveLength(2);
    });
  });

  describe('getAvailableShips', () => {
    test('should return unplaced and unlocked ships', () => {
      shipManager.createPlayerShips('player1');
      shipManager.rollDice('player1');
      
      const ships = shipManager.getPlayerShips('player1');
      shipManager.placeShip(ships[0].id, 'solar_converter');
      
      const available = shipManager.getAvailableShips('player1');
      expect(available).toHaveLength(2);
    });
  });

  describe('clone', () => {
    test('should create independent copy', () => {
      shipManager.createPlayerShips('player1');
      shipManager.rollDice('player1');
      
      const cloned = shipManager.clone();
      
      // Modify original
      const ships = shipManager.getPlayerShips('player1');
      shipManager.placeShip(ships[0].id, 'solar_converter');
      
      // Clone should be unchanged
      const clonedShips = cloned.getPlayerShips('player1');
      expect(clonedShips[0].location).toBeNull();
    });
  });

  describe('serialization', () => {
    test('should serialize and deserialize correctly', () => {
      shipManager.createPlayerShips('player1');
      shipManager.rollDice('player1');
      const ships = shipManager.getPlayerShips('player1');
      shipManager.placeShip(ships[0].id, 'solar_converter');
      
      const json = shipManager.toJSON();
      const restored = ShipManager.fromJSON(json);
      
      const restoredShips = restored.getPlayerShips('player1');
      expect(restoredShips).toHaveLength(3);
      expect(restoredShips[0].location).toBe('solar_converter');
    });
  });
});
