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

  test('should have 2 dock groups', () => {
    expect(facility.getDockGroups()).toHaveLength(2);
  });

  test('should trade fuel for ore', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships[0].diceValue = 3;
    ships[1].diceValue = 3;
    const result = facility.execute(player, [ships[0], ships[1]]);
    expect(result.success).toBe(true);
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

  test('should check tech card claim', () => {
    const ships = shipManager.getPlayerShips('p1');
    ships[0].diceValue = 2;
    ships[1].diceValue = 3;
    expect(facility.canClaimTechCard([ships[0], ships[1]])).toBe(false);
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
    shipManager.createPlayerShips('p1');
  });

  test('should require sequential ships', () => {
    const player = playerManager.getPlayer('p1')!;
    const ships = shipManager.getPlayerShips('p1');
    ships[0].diceValue = 2;
    ships[1].diceValue = 3;
    ships[2].diceValue = 4;
    expect(facility.canDock(player, [ships[0], ships[1], ships[2]])).toBe(true);
  });
});
