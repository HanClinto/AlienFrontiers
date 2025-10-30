/**
 * Colony-building facilities tests
 * Tests for Colony Constructor, Terraforming Station, and Colonist Hub
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ColonyConstructor } from '../../src/game/facilities/colony-constructor';
import { TerraformingStation } from '../../src/game/facilities/terraforming-station';
import { ColonistHub } from '../../src/game/facilities/colonist-hub';
import { ShipManager } from '../../src/game/ship';
import { PlayerManager } from '../../src/game/player';
import { PlayerColor } from '../../src/game/types';

describe('Colony Constructor', () => {
  let facility: ColonyConstructor;
  let shipManager: ShipManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    facility = new ColonyConstructor();
    shipManager = new ShipManager();
    playerManager = new PlayerManager();
    
    playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
    playerManager.addResources('p1', { ore: 5 });
    shipManager.createPlayerShips('p1');
  });

  test('should have 2 dock groups with 3 docks each', () => {
    const groups = facility.getDockGroups();
    expect(groups).toHaveLength(2);
    expect(groups[0].maxCapacity).toBe(3);
    expect(groups[1].maxCapacity).toBe(3);
  });

  test('should require exactly 3 ships', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships.forEach(s => s.diceValue = 4);
    
    expect(facility.canDock(player, [ships[0], ships[1]])).toBe(false); // 2 ships
    expect(facility.canDock(player, ships)).toBe(true); // 3 ships
  });

  test('should require ships of same value', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 3;
    ships[1].diceValue = 3;
    ships[2].diceValue = 3;
    expect(facility.canDock(player, ships)).toBe(true);
    
    ships[2].diceValue = 4; // Different value
    expect(facility.canDock(player, ships)).toBe(false);
  });

  test('should require 3 ore', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships.forEach(s => s.diceValue = 4);
    
    expect(facility.canDock(player, ships)).toBe(true);
    
    playerManager.removeResources('p1', { ore: 3 });
    expect(facility.canDock(player, ships)).toBe(false);
  });

  test('should spend 3 ore and place colony', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships.forEach(s => s.diceValue = 5);
    
    const result = facility.execute(player, ships);
    expect(result.success).toBe(true);
    expect(result.resourcesSpent?.ore).toBe(3);
    expect(result.colonyPlaced).toBe(true);
  });
});

describe('Terraforming Station', () => {
  let facility: TerraformingStation;
  let shipManager: ShipManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    facility = new TerraformingStation();
    shipManager = new ShipManager();
    playerManager = new PlayerManager();
    
    playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
    playerManager.addResources('p1', { fuel: 2, ore: 2 });
    shipManager.createPlayerShips('p1');
  });

  test('should have 1 dock', () => {
    const groups = facility.getDockGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0].maxCapacity).toBe(1);
  });

  test('should require exactly 1 ship with value 6', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    
    ships[0].diceValue = 6;
    expect(facility.canDock(player, [ships[0]])).toBe(true);
    
    ships[0].diceValue = 5;
    expect(facility.canDock(player, [ships[0]])).toBe(false);
    
    ships[0].diceValue = 6;
    ships[1].diceValue = 6;
    expect(facility.canDock(player, [ships[0], ships[1]])).toBe(false); // Too many ships
  });

  test('should require 1 fuel and 1 ore', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships[0].diceValue = 6;
    
    expect(facility.canDock(player, [ships[0]])).toBe(true);
    
    playerManager.removeResources('p1', { fuel: 2 });
    expect(facility.canDock(player, [ships[0]])).toBe(false);
  });

  test('should place colony and return ship to stock', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships[0].diceValue = 6;
    
    const result = facility.execute(player, [ships[0]]);
    expect(result.success).toBe(true);
    expect(result.resourcesSpent).toEqual({ fuel: 1, ore: 1 });
    expect(result.colonyPlaced).toBe(true);
    expect(result.shipReturned).toBe(true);
  });
});

describe('Colonist Hub', () => {
  let facility: ColonistHub;
  let shipManager: ShipManager;
  let playerManager: PlayerManager;

  beforeEach(() => {
    facility = new ColonistHub();
    shipManager = new ShipManager();
    playerManager = new PlayerManager();
    
    playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
    playerManager.addResources('p1', { fuel: 5, ore: 5 });
    shipManager.createPlayerShips('p1');
  });

  test('should have 4 tracks', () => {
    const tracks = facility.getTracks();
    expect(tracks).toHaveLength(4);
  });

  test('should allow claiming an empty track', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships[0].diceValue = 3;
    
    expect(facility.canDock(player, [ships[0]])).toBe(true);
  });

  test('should advance track by number of ships', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships.forEach(s => s.diceValue = 2);
    
    const result = facility.execute(player, [ships[0], ships[1]]);
    expect(result.success).toBe(true);
    expect(result.advancementMade).toBe(2);
    
    const track = facility.getPlayerTrack('p1');
    expect(track?.progress).toBe(2);
  });

  test('should place colony at step 7', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships.forEach(s => s.diceValue = 4);
    
    // Advance to step 3
    facility.execute(player, [ships[0], ships[1], ships[2]]); // 3 ships
    let track = facility.getPlayerTrack('p1');
    expect(track?.progress).toBe(3);
    
    // Advance to step 6
    facility.execute(player, [ships[0], ships[1], ships[2]]); // 3 more
    track = facility.getPlayerTrack('p1');
    expect(track?.progress).toBe(6);
    
    // Advance to step 7 and place colony (if resources available)
    const result = facility.execute(player, [ships[0]]); // 1 more = 7 total
    expect(result.success).toBe(true);
    expect(result.colonyPlaced).toBe(true);
    expect(result.resourcesSpent).toEqual({ fuel: 1, ore: 1 });
    
    // Track should be reset after colony placement
    track = facility.getPlayerTrack('p1');
    expect(track).toBeUndefined();
  });

  test('should not place colony if lacking resources at step 7', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships.forEach(s => s.diceValue = 3);
    
    // Remove resources
    playerManager.removeResources('p1', { fuel: 5, ore: 5 });
    
    // Advance to step 7
    facility.execute(player, ships); // 3 ships
    facility.execute(player, ships); // 6 total
    const result = facility.execute(player, [ships[0]]); // 7 total
    
    expect(result.success).toBe(true);
    expect(result.colonyPlaced).toBe(false); // No resources
    
    const track = facility.getPlayerTrack('p1');
    expect(track?.progress).toBe(7); // Still at 7, not reset
  });

  test('should support multiple players with different tracks', () => {
    playerManager.createPlayer('p2', 'Bob', PlayerColor.BLUE, 1);
    playerManager.addResources('p2', { fuel: 5, ore: 5 });
    shipManager.createPlayerShips('p2');
    
    const player1 = playerManager.getPlayer('p1')!;
    const player2 = playerManager.getPlayer('p2')!;
    const ships1 = shipManager.getPlayerShips('p1');
    const ships2 = shipManager.getPlayerShips('p2');
    
    ships1.forEach(s => s.diceValue = 2);
    ships2.forEach(s => s.diceValue = 3);
    
    // Player 1 advances
    facility.execute(player1, [ships1[0], ships1[1]]);
    
    // Player 2 advances on different track
    facility.execute(player2, [ships2[0]]);
    
    const track1 = facility.getPlayerTrack('p1');
    const track2 = facility.getPlayerTrack('p2');
    
    expect(track1?.progress).toBe(2);
    expect(track2?.progress).toBe(1);
  });

  test('should reject when all tracks are claimed', () => {
    // Create 4 players to fill all tracks
    for (let i = 1; i <= 4; i++) {
      const id = `p${i}`;
      if (i > 1) {
        playerManager.createPlayer(id, `Player${i}`, PlayerColor.RED, i - 1);
        playerManager.addResources(id, { fuel: 5, ore: 5 });
        shipManager.createPlayerShips(id);
      }
      
      const player = playerManager.getPlayer(id)!;
      const ships = shipManager.getPlayerShips(id);
      ships[0].diceValue = 2;
      facility.execute(player, [ships[0]]);
    }
    
    // Try 5th player
    playerManager.createPlayer('p5', 'Player5', PlayerColor.GREEN, 4);
    playerManager.addResources('p5', { fuel: 5, ore: 5 });
    shipManager.createPlayerShips('p5');
    
    const player5 = playerManager.getPlayer('p5')!;
    const ships5 = shipManager.getPlayerShips('p5');
    ships5[0].diceValue = 3;
    
    expect(facility.canDock(player5, [ships5[0]])).toBe(false);
  });
});
