/**
 * Tests for colony placement facilities
 * Tests Colony Constructor, Colonist Hub, and Terraforming Station
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { GameState } from '../../src/game/game-state';
import { PlayerColor, TurnPhase } from '../../src/game/types';
import { TerritoryType } from '../../src/game/territory';

describe('Colony Placement Facilities', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState('test-colony-placement');
    gameState.initializeGame([
      { id: 'p1', name: 'Alice', color: PlayerColor.RED },
      { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
    ]);
  });

  describe('TerritoryManager placeColony', () => {
    test('should place colony on territory', () => {
      const territoryManager = gameState.getTerritoryManager();
      const success = territoryManager.placeColony('p1', TerritoryType.HEINLEIN_PLAINS);
      
      expect(success).toBe(true);
      
      const territory = territoryManager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      expect(territory?.getPlayerColonyCount('p1')).toBe(1);
    });

    test('should update territory control after placement', () => {
      const territoryManager = gameState.getTerritoryManager();
      
      // Player 1 places 1 colony
      territoryManager.placeColony('p1', TerritoryType.ASIMOV_CRATER);

      const territory = territoryManager.getTerritory(TerritoryType.ASIMOV_CRATER);
      expect(territory?.isControlledBy('p1')).toBe(true);

      // Player 2 places 2 colonies (takes control)
      territoryManager.placeColony('p2', TerritoryType.ASIMOV_CRATER);
      territoryManager.placeColony('p2', TerritoryType.ASIMOV_CRATER);

      expect(territory?.isControlledBy('p2')).toBe(true);
      expect(territory?.isControlledBy('p1')).toBe(false);
    });

    test('should handle tie in colony count (no controller)', () => {
      const territoryManager = gameState.getTerritoryManager();
      
      // Both place 1 colony each (tie)
      territoryManager.placeColony('p1', TerritoryType.BRADBURY_PLATEAU);
      territoryManager.placeColony('p2', TerritoryType.BRADBURY_PLATEAU);

      const territory = territoryManager.getTerritory(TerritoryType.BRADBURY_PLATEAU);
      expect(territory?.getControllingPlayer()).toBeNull();
    });

    test('should not place colony when territory is full', () => {
      const territoryManager = gameState.getTerritoryManager();
      
      const territory = territoryManager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      const maxColonies = territory?.maxColonies || 0;

      // Fill territory
      for (let i = 0; i < maxColonies; i++) {
        const success = territoryManager.placeColony('p1', TerritoryType.HEINLEIN_PLAINS);
        expect(success).toBe(true);
      }

      // Try to place one more
      const failedPlacement = territoryManager.placeColony('p1', TerritoryType.HEINLEIN_PLAINS);
      expect(failedPlacement).toBe(false);
    });

    test('should check if colony can be placed', () => {
      const territoryManager = gameState.getTerritoryManager();
      
      // Should be able to place initially
      expect(territoryManager.canPlaceColony('p1', TerritoryType.VAN_VOGT_MOUNTAINS)).toBe(true);
      
      // Fill the territory
      const territory = territoryManager.getTerritory(TerritoryType.VAN_VOGT_MOUNTAINS);
      const maxColonies = territory?.maxColonies || 0;
      for (let i = 0; i < maxColonies; i++) {
        territoryManager.placeColony('p1', TerritoryType.VAN_VOGT_MOUNTAINS);
      }
      
      // Should not be able to place when full
      expect(territoryManager.canPlaceColony('p1', TerritoryType.VAN_VOGT_MOUNTAINS)).toBe(false);
    });
  });

  describe('Colony Constructor facility', () => {
    test('should require 3 ships of same value and 3 ore', () => {
      const facility = gameState.getFacility('colony_constructor');
      expect(facility).toBeDefined();
      
      const player = gameState.getAllPlayers().find(p => p.id === 'p1');
      expect(player).toBeDefined();
      
      // Not enough ore
      player!.resources.ore = 2;
      const shipManager = gameState.getShipManager();
      const ships = shipManager.getPlayerShips('p1').slice(0, 3);
      ships.forEach(s => s.diceValue = 4);
      
      expect(facility?.canDock(player!, ships)).toBe(false);
      
      // Enough ore
      player!.resources.ore = 3;
      expect(facility?.canDock(player!, ships)).toBe(true);
    });

    test('should not allow different ship values', () => {
      const facility = gameState.getFacility('colony_constructor');
      const player = gameState.getAllPlayers().find(p => p.id === 'p1');
      player!.resources.ore = 3;
      
      const shipManager = gameState.getShipManager();
      const ships = shipManager.getPlayerShips('p1').slice(0, 3);
      ships[0].diceValue = 3;
      ships[1].diceValue = 4;
      ships[2].diceValue = 5;
      
      expect(facility?.canDock(player!, ships)).toBe(false);
    });
  });

  describe('Terraforming Station facility', () => {
    test('should require 1 ship with value 6 and 1F+1O', () => {
      const facility = gameState.getFacility('terraforming_station');
      const player = gameState.getAllPlayers().find(p => p.id === 'p1');
      
      const shipManager = gameState.getShipManager();
      const ship = shipManager.getPlayerShips('p1')[0];
      ship.diceValue = 6;
      
      // Not enough resources
      player!.resources.fuel = 0;
      player!.resources.ore = 1;
      expect(facility?.canDock(player!, [ship])).toBe(false);
      
      // Enough resources
      player!.resources.fuel = 1;
      player!.resources.ore = 1;
      expect(facility?.canDock(player!, [ship])).toBe(true);
    });

    test('should not allow ship value other than 6', () => {
      const facility = gameState.getFacility('terraforming_station');
      const player = gameState.getAllPlayers().find(p => p.id === 'p1');
      player!.resources.fuel = 1;
      player!.resources.ore = 1;
      
      const shipManager = gameState.getShipManager();
      const ship = shipManager.getPlayerShips('p1')[0];
      ship.diceValue = 5;
      
      expect(facility?.canDock(player!, [ship])).toBe(false);
    });
  });

  describe('Colonist Hub facility', () => {
    test('should allow any ship values', () => {
      const facility = gameState.getFacility('colonist_hub');
      const player = gameState.getAllPlayers().find(p => p.id === 'p1');
      
      const shipManager = gameState.getShipManager();
      const ships = shipManager.getPlayerShips('p1').slice(0, 2);
      ships[0].diceValue = 2;
      ships[1].diceValue = 5;
      
      expect(facility?.canDock(player!, ships)).toBe(true);
    });

    test('should track player progress on separate tracks', () => {
      const facility = gameState.getFacility('colonist_hub') as any;
      
      // Claim tracks for both players
      facility.claimTrack('p1');
      facility.claimTrack('p2');
      
      const track1 = facility.getPlayerTrack('p1');
      const track2 = facility.getPlayerTrack('p2');
      
      expect(track1).toBeDefined();
      expect(track2).toBeDefined();
      expect(track1.playerId).toBe('p1');
      expect(track2.playerId).toBe('p2');
      expect(track1.progress).toBe(0);
      expect(track2.progress).toBe(0);
    });

    test('should not allow claiming more than 4 tracks', () => {
      const facility = gameState.getFacility('colonist_hub') as any;
      
      // Claim 4 tracks
      expect(facility.claimTrack('p1')).toBe(0);
      expect(facility.claimTrack('p2')).toBe(1);
      expect(facility.claimTrack('p3')).toBe(2);
      expect(facility.claimTrack('p4')).toBe(3);
      
      // Try to claim 5th track
      expect(facility.claimTrack('p5')).toBeNull();
    });
  });

  describe('Shipyard facility', () => {
    test('should require 2 ships of same value', () => {
      const facility = gameState.getFacility('shipyard');
      const player = gameState.getAllPlayers().find(p => p.id === 'p1');
      
      const shipManager = gameState.getShipManager();
      const ships = shipManager.getPlayerShips('p1').slice(0, 2);
      ships[0].diceValue = 4;
      ships[1].diceValue = 4;
      
      // Need resources for 4th ship
      player!.resources.fuel = 1;
      player!.resources.ore = 1;
      
      expect(facility?.canDock(player!, ships)).toBe(true);
    });

    test('should not allow different ship values', () => {
      const facility = gameState.getFacility('shipyard');
      const player = gameState.getAllPlayers().find(p => p.id === 'p1');
      player!.resources.fuel = 1;
      player!.resources.ore = 1;
      
      const shipManager = gameState.getShipManager();
      const ships = shipManager.getPlayerShips('p1').slice(0, 2);
      ships[0].diceValue = 3;
      ships[1].diceValue = 4;
      
      expect(facility?.canDock(player!, ships)).toBe(false);
    });
  });
});
