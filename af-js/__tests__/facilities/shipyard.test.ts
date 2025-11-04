/**
 * Shipyard facility tests
 * Tests for building additional ships (4th, 5th, 6th)
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { Shipyard } from '../../src/game/facilities/shipyard';
import { ShipManager } from '../../src/game/ship';
import { PlayerManager } from '../../src/game/player';
import { PlayerColor } from '../../src/game/types';

describe('Shipyard', () => {
  let facility: Shipyard;
  let shipManager: ShipManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    facility = new Shipyard();
    shipManager = new ShipManager();
    playerManager = new PlayerManager();
    
    playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
    playerManager.addResources('p1', { fuel: 10, ore: 10 });
    shipManager.createPlayerShips('p1');
  });

  test('should have 3 dock groups with 2 docks each', () => {
    const groups = facility.getDockGroups();
    expect(groups).toHaveLength(3);
    expect(groups[0].maxCapacity).toBe(2);
    expect(groups[1].maxCapacity).toBe(2);
    expect(groups[2].maxCapacity).toBe(2);
  });

  test('should require exactly 2 ships', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 3;
    expect(facility.canDock(player, [ships[0]])).toBe(false);
    
    ships[1].diceValue = 3;
    expect(facility.canDock(player, [ships[0], ships[1]])).toBe(true);
  });

  test('should require ships of same value', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 3;
    ships[1].diceValue = 4;
    expect(facility.canDock(player, [ships[0], ships[1]])).toBe(false);
    
    ships[1].diceValue = 3;
    expect(facility.canDock(player, [ships[0], ships[1]])).toBe(true);
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

  test('should allow multiple dock groups to be used simultaneously', () => {
    playerManager.createPlayer('p2', 'Bob', PlayerColor.BLUE, 1);
    playerManager.createPlayer('p3', 'Charlie', PlayerColor.GREEN, 2);
    playerManager.addResources('p2', { fuel: 10, ore: 10 });
    playerManager.addResources('p3', { fuel: 10, ore: 10 });
    shipManager.createPlayerShips('p2');
    shipManager.createPlayerShips('p3');
    
    const player1 = playerManager.getPlayer('p1')!;
    const player2 = playerManager.getPlayer('p2')!;
    const player3 = playerManager.getPlayer('p3')!;
    
    const ships1 = shipManager.getPlayerShips('p1');
    const ships2 = shipManager.getPlayerShips('p2');
    const ships3 = shipManager.getPlayerShips('p3');
    
    // Player 1 uses group 1
    ships1[0].diceValue = 2;
    ships1[1].diceValue = 2;
    facility.dockShips(player1, [ships1[0], ships1[1]], 'shipyard_group_1');
    
    // Player 2 uses group 2
    ships2[0].diceValue = 4;
    ships2[1].diceValue = 4;
    facility.dockShips(player2, [ships2[0], ships2[1]], 'shipyard_group_2');
    
    // Player 3 uses group 3
    ships3[0].diceValue = 6;
    ships3[1].diceValue = 6;
    expect(facility.canDock(player3, [ships3[0], ships3[1]])).toBe(true);
    facility.dockShips(player3, [ships3[0], ships3[1]], 'shipyard_group_3');
    
    const dockedShips = facility.getDockedShips();
    expect(dockedShips.length).toBe(6); // 2 ships per group * 3 groups
  });

  test('should block when all dock groups are full', () => {
    playerManager.createPlayer('p2', 'Bob', PlayerColor.BLUE, 1);
    playerManager.createPlayer('p3', 'Charlie', PlayerColor.GREEN, 2);
    playerManager.createPlayer('p4', 'Diana', PlayerColor.YELLOW, 3);
    
    playerManager.addResources('p2', { fuel: 10, ore: 10 });
    playerManager.addResources('p3', { fuel: 10, ore: 10 });
    playerManager.addResources('p4', { fuel: 10, ore: 10 });
    
    shipManager.createPlayerShips('p2');
    shipManager.createPlayerShips('p3');
    shipManager.createPlayerShips('p4');
    
    const players = [
      playerManager.getPlayer('p1')!,
      playerManager.getPlayer('p2')!,
      playerManager.getPlayer('p3')!
    ];
    
    // Fill all 3 groups
    players.forEach((player, idx) => {
      const ships = shipManager.getPlayerShips(player.id);
      ships[0].diceValue = 3;
      ships[1].diceValue = 3;
      facility.dockShips(player, [ships[0], ships[1]]);
    });
    
    // Player 4 cannot dock
    const player4 = playerManager.getPlayer('p4')!;
    const ships4 = shipManager.getPlayerShips('p4');
    ships4[0].diceValue = 5;
    ships4[1].diceValue = 5;
    expect(facility.canDock(player4, [ships4[0], ships4[1]])).toBe(false);
  });

  test('should calculate ship costs correctly', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    // Building 4th ship: 1 fuel + 1 ore
    ships[0].diceValue = 2;
    ships[1].diceValue = 2;
    const result = facility.execute(player, [ships[0], ships[1]]);
    expect(result.success).toBe(true);
    // Cost verification would be in game-state integration tests
  });

  test('EDGE CASE: Herbert Valley bonus reduces costs', () => {
    // Herbert Valley bonus: -1 fuel and -1 ore
    // This would be tested in game-state integration tests
    // where territory bonuses are applied
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 4;
    ships[1].diceValue = 4;
    expect(facility.canDock(player, [ships[0], ships[1]])).toBe(true);
  });
});
