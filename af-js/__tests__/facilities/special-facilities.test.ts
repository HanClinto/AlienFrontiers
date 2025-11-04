import { describe, test, expect, beforeEach } from '@jest/globals';
import { OrbitalMarket } from '../../src/game/facilities/orbital-market';
import { MaintenanceBay } from '../../src/game/facilities/maintenance-bay';
import { AlienArtifact } from '../../src/game/facilities/alien-artifact';
import { RaidersOutpost } from '../../src/game/facilities/raiders-outpost';
import { ShipManager } from '../../src/game/ship';
import { PlayerManager } from '../../src/game/player';
import { PlayerColor } from '../../src/game/types';

describe('Orbital Market', () => {
  let facility: OrbitalMarket;
  let shipManager: ShipManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    facility = new OrbitalMarket();
    shipManager = new ShipManager();
    playerManager = new PlayerManager();
    playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
    playerManager.addResources('p1', { fuel: 10 });
    shipManager.createPlayerShips('p1');
  });

  test('should have 2 dock groups with 2 docks each', () => {
    const groups = facility.getDockGroups();
    expect(groups).toHaveLength(2);
    expect(groups[0].maxCapacity).toBe(2);
    expect(groups[1].maxCapacity).toBe(2);
  });

  test('should trade fuel for ore', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships[0].diceValue = 3;
    ships[1].diceValue = 3;
    const result = facility.execute(player, [ships[0], ships[1]]);
    expect(result.success).toBe(true);
  });

  test('should require 2 ships of same value', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships[0].diceValue = 3;
    ships[1].diceValue = 4;
    
    expect(facility.canDock(player, [ships[0], ships[1]])).toBe(false);
  });

  test('should accept any matching pair', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    for (let value = 1; value <= 6; value++) {
      ships[0].diceValue = value as any;
      ships[1].diceValue = value as any;
      expect(facility.canDock(player, [ships[0], ships[1]])).toBe(true);
    }
  });

  test('should block when dock group is full', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    // Fill first group (orbital_market_group_1)
    ships[0].diceValue = 3 as any;
    ships[1].diceValue = 3 as any;
    facility.dockShips(player, [ships[0], ships[1]], 'orbital_market_group_1');
    
    // Try to dock again in same group - should fail (group is full)
    ships[2].diceValue = 3 as any;
    const canDockInFullGroup = facility.canDock(player, [ships[2]], 'orbital_market_group_1');
    expect(canDockInFullGroup).toBe(false); // Group 1 is full
    
    // But can still dock in group 2
    const canDockInOtherGroup = facility.canDock(player, [ships[2]], 'orbital_market_group_2');
    expect(canDockInOtherGroup).toBe(false); // Need 2 ships of same value, not 1
  });
});

describe('Maintenance Bay', () => {
  let facility: MaintenanceBay;
  let shipManager: ShipManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    facility = new MaintenanceBay();
    shipManager = new ShipManager();
    playerManager = new PlayerManager();
    playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
    shipManager.createPlayerShips('p1');
  });

  test('should have 20 docks', () => {
    expect(facility.getDockGroups()[0].maxCapacity).toBe(20);
  });

  test('should accept any ship value', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 1;
    expect(facility.canDock(player, [ships[0]])).toBe(true);
    
    ships[0].diceValue = 6;
    expect(facility.canDock(player, [ships[0]])).toBe(true);
  });

  test('should accept multiple ships at once', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 2;
    ships[1].diceValue = 5;
    ships[2].diceValue = 3;
    expect(facility.canDock(player, ships)).toBe(true);
  });

  test('should always be available (large capacity)', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships.forEach(s => s.diceValue = 3);
    
    // Can dock all ships
    expect(facility.canDock(player, ships)).toBe(true);
    facility.dockShips(player, ships);
    
    // Still has space after docking
    const dockedShips = facility.getDockedShips();
    expect(dockedShips.length).toBe(3);
    expect(facility.getDockGroups()[0].maxCapacity).toBe(20);
  });
});

describe('Alien Artifact', () => {
  let facility: AlienArtifact;
  let shipManager: ShipManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    facility = new AlienArtifact();
    shipManager = new ShipManager();
    playerManager = new PlayerManager();
    playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
    shipManager.createPlayerShips('p1');
  });

  test('should have 4 docks', () => {
    expect(facility.getDockGroups()[0].maxCapacity).toBe(4);
  });

  test('should accept any ship values', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 1;
    ships[1].diceValue = 6;
    expect(facility.canDock(player, [ships[0], ships[1]])).toBe(true);
  });

  test('should require total dice > 7 for tech card claim', () => {
    const ships = shipManager.getPlayerShips('p1');
    
    // Total = 5, should fail
    ships[0].diceValue = 2;
    ships[1].diceValue = 3;
    expect(facility.canClaimTechCard([ships[0], ships[1]])).toBe(false);
    
    // Total = 8, should succeed
    ships[0].diceValue = 3;
    ships[1].diceValue = 5;
    expect(facility.canClaimTechCard([ships[0], ships[1]])).toBe(true);
    
    // Total = 12, should succeed
    ships[0].diceValue = 6;
    ships[1].diceValue = 6;
    expect(facility.canClaimTechCard([ships[0], ships[1]])).toBe(true);
  });

  test('should block when facility reaches max capacity', () => {
    const player = playerManager.getPlayer('p1')!;
    playerManager.createPlayer('p2', 'Bob', PlayerColor.BLUE, 1);
    shipManager.createPlayerShips('p2');
    
    const ships1 = shipManager.getPlayerShips('p1');
    const ships2 = shipManager.getPlayerShips('p2');
    
    // Fill all 4 docks
    ships1.forEach(s => s.diceValue = 4);
    facility.dockShips(player, ships1.slice(0, 3));
    
    // Only 1 dock left
    ships2[0].diceValue = 5;
    expect(facility.canDock(playerManager.getPlayer('p2')!, [ships2[0]])).toBe(true);
    
    facility.dockShips(playerManager.getPlayer('p2')!, [ships2[0]]);
    
    // Now facility is full
    ships2[1].diceValue = 6;
    expect(facility.canDock(playerManager.getPlayer('p2')!, [ships2[1]])).toBe(false);
  });
});

describe('Raiders Outpost', () => {
  let facility: RaidersOutpost;
  let shipManager: ShipManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    facility = new RaidersOutpost();
    shipManager = new ShipManager();
    playerManager = new PlayerManager();
    playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
    playerManager.createPlayer('p2', 'Bob', PlayerColor.BLUE, 1);
    shipManager.createPlayerShips('p1');
    shipManager.createPlayerShips('p2');
  });

  test('should require sequential ships', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships[0].diceValue = 2;
    ships[1].diceValue = 3;
    ships[2].diceValue = 4;
    expect(facility.canDock(player, [ships[0], ships[1], ships[2]])).toBe(true);
  });

  test('should require exactly 3 ships', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships[0].diceValue = 2;
    ships[1].diceValue = 3;
    
    expect(facility.canDock(player, [ships[0], ships[1]])).toBe(false);
  });

  test('should reject non-sequential ships', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships[0].diceValue = 2;
    ships[1].diceValue = 4;
    ships[2].diceValue = 6;
    
    expect(facility.canDock(player, [ships[0], ships[1], ships[2]])).toBe(false);
  });

  test('should accept different sequential combinations', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    // Test 1-2-3
    ships[0].diceValue = 1;
    ships[1].diceValue = 2;
    ships[2].diceValue = 3;
    expect(facility.canDock(player, [ships[0], ships[1], ships[2]])).toBe(true);
    
    // Test 4-5-6
    ships[0].diceValue = 4;
    ships[1].diceValue = 5;
    ships[2].diceValue = 6;
    expect(facility.canDock(player, [ships[0], ships[1], ships[2]])).toBe(true);
  });

  test('should block when facility is occupied', () => {
    const player1 = playerManager.getPlayer('p1')!;
    const player2 = playerManager.getPlayer('p2')!;
    const ships1 = shipManager.getPlayerShips('p1');
    const ships2 = shipManager.getPlayerShips('p2');
    
    // Player 1 docks with 1-2-3
    ships1[0].diceValue = 1;
    ships1[1].diceValue = 2;
    ships1[2].diceValue = 3;
    facility.dockShips(player1, [ships1[0], ships1[1], ships1[2]]);
    
    // Player 2 cannot dock with 2-3-4 (lower sequence cannot bump)
    ships2[0].diceValue = 2;
    ships2[1].diceValue = 3;
    ships2[2].diceValue = 4;
    expect(facility.canDock(player2, [ships2[0], ships2[1], ships2[2]])).toBe(false);
  });

  test('should allow bumping with higher straight', () => {
    const player1 = playerManager.getPlayer('p1')!;
    const player2 = playerManager.getPlayer('p2')!;
    const ships1 = shipManager.getPlayerShips('p1');
    const ships2 = shipManager.getPlayerShips('p2');
    
    // Player 1 docks with 1-2-3
    ships1[0].diceValue = 1;
    ships1[1].diceValue = 2;
    ships1[2].diceValue = 3;
    facility.dockShips(player1, [ships1[0], ships1[1], ships1[2]]);
    
    // Player 2 with 2-3-4 should be able to bump
    ships2[0].diceValue = 2;
    ships2[1].diceValue = 3;
    ships2[2].diceValue = 4;
    expect(facility.canBumpDockedShips([ships2[0], ships2[1], ships2[2]])).toBe(true);
  });

  test('should not allow bumping with same or lower straight', () => {
    const player1 = playerManager.getPlayer('p1')!;
    const player2 = playerManager.getPlayer('p2')!;
    const ships1 = shipManager.getPlayerShips('p1');
    const ships2 = shipManager.getPlayerShips('p2');
    
    // Player 1 docks with 3-4-5
    ships1[0].diceValue = 3;
    ships1[1].diceValue = 4;
    ships1[2].diceValue = 5;
    facility.dockShips(player1, [ships1[0], ships1[1], ships1[2]]);
    
    // Player 2 with same sequence cannot bump
    ships2[0].diceValue = 3;
    ships2[1].diceValue = 4;
    ships2[2].diceValue = 5;
    expect(facility.canBumpDockedShips([ships2[0], ships2[1], ships2[2]])).toBe(false);
    
    // Player 2 with lower sequence cannot bump
    ships2[0].diceValue = 1;
    ships2[1].diceValue = 2;
    ships2[2].diceValue = 3;
    expect(facility.canBumpDockedShips([ships2[0], ships2[1], ships2[2]])).toBe(false);
  });
});
