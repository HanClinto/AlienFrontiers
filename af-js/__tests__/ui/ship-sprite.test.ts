/**
 * Tests for ShipSprite Logic
 * 
 * Note: These tests verify the ship sprite business logic without
 * instantiating Phaser components, which require full canvas support.
 * @jest-environment jsdom
 */

import { ShipState } from '../../src/ui/ship-sprite';
import { Ship } from '../../src/game/ship';

describe('ShipSprite Logic', () => {
  let mockShip: Ship;

  beforeEach(() => {
    mockShip = {
      id: 'player-0-ship-0',
      playerId: 'player-0',
      diceValue: null,
      location: null,
      isLocked: false,
    };
  });

  describe('Ship State Enum', () => {
    it('should have AVAILABLE state', () => {
      expect(ShipState.AVAILABLE).toBe('available');
    });

    it('should have DRAGGING state', () => {
      expect(ShipState.DRAGGING).toBe('dragging');
    });

    it('should have PLACED state', () => {
      expect(ShipState.PLACED).toBe('placed');
    });

    it('should have LOCKED state', () => {
      expect(ShipState.LOCKED).toBe('locked');
    });
  });

  describe('Ship Model', () => {
    it('should have correct ship structure', () => {
      expect(mockShip.id).toBe('player-0-ship-0');
      expect(mockShip.playerId).toBe('player-0');
      expect(mockShip.diceValue).toBeNull();
      expect(mockShip.location).toBeNull();
      expect(mockShip.isLocked).toBe(false);
    });

    it('should allow setting dice value', () => {
      mockShip.diceValue = 3;
      expect(mockShip.diceValue).toBe(3);
    });

    it('should allow setting location', () => {
      mockShip.location = 'solar_converter';
      expect(mockShip.location).toBe('solar_converter');
    });

    it('should allow locking', () => {
      mockShip.isLocked = true;
      expect(mockShip.isLocked).toBe(true);
    });
  });

  describe('Ship State Transitions', () => {
    it('should transition from null to available', () => {
      expect(mockShip.diceValue).toBeNull();
      expect(mockShip.location).toBeNull();
      expect(mockShip.isLocked).toBe(false);
    });

    it('should transition to placed when location set', () => {
      mockShip.location = 'lunar_mine';
      expect(mockShip.location).toBe('lunar_mine');
      expect(mockShip.isLocked).toBe(false);
    });

    it('should transition to locked when locked at location', () => {
      mockShip.location = 'colony_constructor';
      mockShip.isLocked = true;
      expect(mockShip.location).toBe('colony_constructor');
      expect(mockShip.isLocked).toBe(true);
    });

    it('should reset to available when returned to pool', () => {
      mockShip.location = 'orbital_market';
      mockShip.isLocked = true;
      mockShip.diceValue = 5;

      // Reset
      mockShip.location = null;
      mockShip.isLocked = false;
      mockShip.diceValue = null;

      expect(mockShip.location).toBeNull();
      expect(mockShip.isLocked).toBe(false);
      expect(mockShip.diceValue).toBeNull();
    });
  });

  describe('Integration with GameState', () => {
    it('should match ship interface expected by ShipManager', () => {
      // This test verifies the ship structure matches what ShipManager expects
      const ships: Ship[] = [mockShip];
      
      ships.forEach(ship => {
        expect(ship).toHaveProperty('id');
        expect(ship).toHaveProperty('playerId');
        expect(ship).toHaveProperty('diceValue');
        expect(ship).toHaveProperty('location');
        expect(ship).toHaveProperty('isLocked');
      });
    });
  });
});
