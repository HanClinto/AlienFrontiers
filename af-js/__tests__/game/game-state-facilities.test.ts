/**
 * GameState facility integration tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { GameState } from '../../src/game/game-state';
import { PlayerColor, TurnPhase } from '../../src/game/types';

describe('GameState Facility Integration', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState('test-game');
    gameState.initializeGame([
      { id: 'p1', name: 'Alice', color: PlayerColor.RED },
      { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
    ]);
  });

  test('should initialize with facility manager', () => {
    const facilities = gameState.getAllFacilities();
    expect(facilities).toHaveLength(11);
  });

  test('should get specific facility by ID', () => {
    const facility = gameState.getFacility('solar_converter');
    expect(facility).toBeDefined();
    expect(facility?.name).toBe('Solar Converter');
  });

  test('should allow docking ships during PLACE_SHIPS phase', () => {
    // Roll dice to get to PLACE_SHIPS phase
    gameState.rollDice();
    expect(gameState.getPhase().current).toBe(TurnPhase.PLACE_SHIPS);

    const shipManager = gameState.getShipManager();
    const ships = shipManager.getPlayerShips('p1');
    ships.forEach(s => s.diceValue = 3);

    const dockGroupId = gameState.dockShipsAtFacility('solar_converter', [ships[0].id]);
    expect(dockGroupId).toBeDefined();
  });

  test('should throw error when docking outside PLACE_SHIPS phase', () => {
    expect(() => {
      gameState.dockShipsAtFacility('solar_converter', ['ship-1']);
    }).toThrow('Can only dock ships during PLACE_SHIPS phase');
  });

  test('should resolve actions during RESOLVE_ACTIONS phase', () => {
    gameState.rollDice(); // -> PLACE_SHIPS
    
    const shipManager = gameState.getShipManager();
    const ships = shipManager.getPlayerShips('p1');
    ships.forEach(s => s.diceValue = 3);
    
    gameState.dockShipsAtFacility('solar_converter', [ships[0].id]);
    gameState.advancePhase(); // -> RESOLVE_ACTIONS

    const results = gameState.resolveActions();
    expect(results.size).toBeGreaterThan(0);
  });

  test('should track docked ships', () => {
    gameState.rollDice(); // -> PLACE_SHIPS
    
    const shipManager = gameState.getShipManager();
    const ships = shipManager.getPlayerShips('p1');
    ships.forEach(s => s.diceValue = 3);
    
    gameState.dockShipsAtFacility('solar_converter', [ships[0].id]);
    
    const dockedShips = gameState.getDockedShips();
    expect(dockedShips.length).toBe(1);
    expect(dockedShips[0].facilityId).toBe('solar_converter');
  });

  test('should undock ships at end of turn', () => {
    gameState.rollDice(); // -> PLACE_SHIPS
    
    const shipManager = gameState.getShipManager();
    const ships = shipManager.getPlayerShips('p1');
    ships.forEach(s => s.diceValue = 3);
    
    gameState.dockShipsAtFacility('solar_converter', [ships[0].id]);
    expect(gameState.getDockedShips().length).toBe(1);

    // Advance to next player
    while (gameState.getPhase().current !== TurnPhase.ROLL_DICE || gameState.getActivePlayer()?.id === 'p1') {
      gameState.advancePhase();
    }

    // Ships should be undocked for p1
    const p1DockedShips = gameState.getFacilityManager().getDockedShips('p1');
    expect(p1DockedShips.length).toBe(0);
  });

  test('should provide access to facility manager', () => {
    const facilityManager = gameState.getFacilityManager();
    expect(facilityManager).toBeDefined();
    expect(facilityManager.getAllFacilities()).toHaveLength(11);
  });
});
