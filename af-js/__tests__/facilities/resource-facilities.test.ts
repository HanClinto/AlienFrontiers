/**
 * Resource-generating facilities tests
 * Tests for Solar Converter, Lunar Mine, and Radon Collector
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { SolarConverter } from '../../src/game/facilities/solar-converter';
import { LunarMine } from '../../src/game/facilities/lunar-mine';
import { RadonCollector } from '../../src/game/facilities/radon-collector';
import { ShipManager } from '../../src/game/ship';
import { PlayerManager } from '../../src/game/player';
import { PlayerColor } from '../../src/game/types';

describe('Solar Converter', () => {
  let facility: SolarConverter;
  let shipManager: ShipManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    facility = new SolarConverter();
    shipManager = new ShipManager();
    playerManager = new PlayerManager();
    
    playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
    shipManager.createPlayerShips('p1');
  });

  test('should create with correct type and name', () => {
    expect(facility.id).toBe('solar_converter');
    expect(facility.name).toBe('Solar Converter');
  });

  test('should have 1 dock group with 5 docks', () => {
    const groups = facility.getDockGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].maxCapacity).toBe(5);
  });

  test('should accept ships with any value', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    // Set different values
    ships[0].diceValue = 1;
    ships[1].diceValue = 6;
    
    const canDock = facility.canDock(player, [ships[0], ships[1]]);
    expect(canDock).toBe(true);
  });

  test('should reject ships without dice values', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    const canDock = facility.canDock(player, [ships[0]]);
    expect(canDock).toBe(false);
  });

  test('should calculate fuel correctly: ceil(value / 2)', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 1; // ceil(1/2) = 1 fuel
    ships[1].diceValue = 3; // ceil(3/2) = 2 fuel
    ships[2].diceValue = 6; // ceil(6/2) = 3 fuel
    // Total: 6 fuel
    
    const result = facility.execute(player, ships);
    expect(result.success).toBe(true);
    expect(result.resourcesGained?.fuel).toBe(6);
  });

  test('should handle single ship', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 5; // ceil(5/2) = 3 fuel
    
    const result = facility.execute(player, [ships[0]]);
    expect(result.success).toBe(true);
    expect(result.resourcesGained?.fuel).toBe(3);
  });

  test('should reject more than 5 ships', () => {
    const player = playerManager.getPlayer('p1')!;
    playerManager.createPlayer('p2', 'Bob', PlayerColor.BLUE, 1);
    shipManager.createPlayerShips('p2');
    
    const ships = [
      ...shipManager.getPlayerShips('p1'),
      ...shipManager.getPlayerShips('p2')
    ];
    ships.forEach((s, i) => s.diceValue = ((i % 6) + 1) as any);
    
    const canDock = facility.canDock(player, ships);
    expect(canDock).toBe(false);
  });
});

describe('Lunar Mine', () => {
  let facility: LunarMine;
  let shipManager: ShipManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    facility = new LunarMine();
    shipManager = new ShipManager();
    playerManager = new PlayerManager();
    
    playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
    shipManager.createPlayerShips('p1');
  });

  test('should create with correct properties', () => {
    expect(facility.id).toBe('lunar_mine');
    expect(facility.name).toBe('Lunar Mine');
  });

  test('should gain 1 ore per ship', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 3;
    ships[1].diceValue = 4;
    
    const result = facility.execute(player, [ships[0], ships[1]]);
    expect(result.success).toBe(true);
    expect(result.resourcesGained?.ore).toBe(2);
  });

  test('should accept first ship of any value', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 1;
    
    const canDock = facility.canDock(player, [ships[0]]);
    expect(canDock).toBe(true);
  });

  test('should require ascending values', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    // First ship: value 3
    ships[0].diceValue = 3;
    facility.dockShips(player, [ships[0]]);
    
    // Second ship: value 4 (valid)
    ships[1].diceValue = 4;
    const canDock1 = facility.canDock(player, [ships[1]]);
    expect(canDock1).toBe(true);
    
    // Third ship: value 2 (invalid - too low)
    ships[2].diceValue = 2;
    const canDock2 = facility.canDock(player, [ships[2]]);
    expect(canDock2).toBe(false);
  });

  test('should allow equal value to highest docked', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 4;
    facility.dockShips(player, [ships[0]]);
    
    ships[1].diceValue = 4; // Equal value should be allowed
    const canDock = facility.canDock(player, [ships[1]]);
    expect(canDock).toBe(true);
  });
});

describe('Radon Collector', () => {
  let facility: RadonCollector;
  let shipManager: ShipManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    facility = new RadonCollector();
    shipManager = new ShipManager();
    playerManager = new PlayerManager();
    
    playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
    shipManager.createPlayerShips('p1');
  });

  test('should create with correct properties', () => {
    expect(facility.id).toBe('radon_collector');
    expect(facility.name).toBe('Radon Collector');
  });

  test('should have 3 docks', () => {
    const groups = facility.getDockGroups();
    expect(groups[0].maxCapacity).toBe(3);
  });

  test('should accept ships with value 1', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 1;
    
    const canDock = facility.canDock(player, [ships[0]]);
    expect(canDock).toBe(true);
  });

  test('should accept ships with value 2', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 2;
    
    const canDock = facility.canDock(player, [ships[0]]);
    expect(canDock).toBe(true);
  });

  test('should reject ships with value 3 or higher', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 3;
    expect(facility.canDock(player, [ships[0]])).toBe(false);
    
    ships[0].diceValue = 6;
    expect(facility.canDock(player, [ships[0]])).toBe(false);
  });

  test('should gain 1 fuel per ship', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 1;
    ships[1].diceValue = 2;
    
    const result = facility.execute(player, [ships[0], ships[1]]);
    expect(result.success).toBe(true);
    expect(result.resourcesGained?.fuel).toBe(2);
  });

  test('should allow mixed values of 1 and 2', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 1;
    ships[1].diceValue = 2;
    ships[2].diceValue = 1;
    
    const canDock = facility.canDock(player, ships);
    expect(canDock).toBe(true);
  });

  test('should reject more than 3 ships', () => {
    const player = playerManager.getPlayer('p1')!;
    playerManager.createPlayer('p2', 'Bob', PlayerColor.BLUE, 1);
    shipManager.createPlayerShips('p2');
    
    const allShips = [
      ...shipManager.getPlayerShips('p1'),
      shipManager.getPlayerShips('p2')[0]
    ];
    allShips.forEach(s => s.diceValue = 1);
    
    const canDock = facility.canDock(player, allShips);
    expect(canDock).toBe(false);
  });
});
