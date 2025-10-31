/**
 * Territory System Tests
 * Tests for territory, field generators, and bonuses
 */

import { Territory, TerritoryType, FieldType, FieldGenerator } from '../../src/game/territory';
import { TerritoryManager, TerritoryBonusManager } from '../../src/game/territory-manager';
import { Player } from '../../src/game/player';
import { PlayerColor } from '../../src/game/types';

describe('Territory', () => {
  let territory: Territory;

  beforeEach(() => {
    territory = new Territory(
      TerritoryType.HEINLEIN_PLAINS,
      'Heinlein Plains',
      3,
      'Gain 1 ore'
    );
  });

  test('initializes with correct properties', () => {
    expect(territory.id).toBe(TerritoryType.HEINLEIN_PLAINS);
    expect(territory.name).toBe('Heinlein Plains');
    expect(territory.maxColonies).toBe(3);
    expect(territory.bonusDescription).toBe('Gain 1 ore');
  });

  test('starts with no colonies', () => {
    expect(territory.getColonies()).toHaveLength(0);
    expect(territory.getControllingPlayer()).toBeNull();
  });

  describe('Colony Placement', () => {
    test('places colony successfully', () => {
      const result = territory.placeColony('player1');
      expect(result).toBe(true);
      expect(territory.getPlayerColonyCount('player1')).toBe(1);
      expect(territory.isControlledBy('player1')).toBe(true);
    });

    test('tracks multiple colonies', () => {
      territory.placeColony('player1');
      territory.placeColony('player2');
      territory.placeColony('player1');
      
      expect(territory.getPlayerColonyCount('player1')).toBe(2);
      expect(territory.getPlayerColonyCount('player2')).toBe(1);
      expect(territory.isControlledBy('player1')).toBe(true);
    });

    test('prevents placement when full', () => {
      territory.placeColony('player1');
      territory.placeColony('player2');
      territory.placeColony('player1');
      
      expect(territory.isFull()).toBe(true);
      const result = territory.placeColony('player2');
      expect(result).toBe(false);
    });

    test('removes colony successfully', () => {
      territory.placeColony('player1');
      const result = territory.removeColony('player1');
      expect(result).toBe(true);
      expect(territory.getPlayerColonyCount('player1')).toBe(0);
    });

    test('moves colony to another territory', () => {
      const target = new Territory(
        TerritoryType.ASIMOV_CRATER,
        'Asimov Crater',
        3,
        'Gain 1 energy'
      );

      territory.placeColony('player1');
      const result = territory.moveColonyTo('player1', target);
      
      expect(result).toBe(true);
      expect(territory.getPlayerColonyCount('player1')).toBe(0);
      expect(target.getPlayerColonyCount('player1')).toBe(1);
    });

    test('swaps colonies between players', () => {
      territory.placeColony('player1');
      territory.placeColony('player2');
      
      const result = territory.swapColonies('player1', 'player2');
      expect(result).toBe(true);
    });
  });

  describe('Territory Control', () => {
    test('grants control to player with most colonies', () => {
      territory.placeColony('player1');
      territory.placeColony('player1');
      territory.placeColony('player2');
      
      expect(territory.isControlledBy('player1')).toBe(true);
      expect(territory.getControllingPlayer()).toBe('player1');
    });

    test('no control on tie', () => {
      territory.placeColony('player1');
      territory.placeColony('player2');
      
      expect(territory.getControllingPlayer()).toBeNull();
    });

    test('updates control when colonies change', () => {
      territory.placeColony('player1');
      territory.placeColony('player2');
      territory.placeColony('player2');
      
      expect(territory.isControlledBy('player2')).toBe(true);
      
      territory.removeColony('player2');
      expect(territory.getControllingPlayer()).toBeNull();
    });
  });

  describe('Field Generators', () => {
    test('places Isolation Field', () => {
      const field: FieldGenerator = {
        type: FieldType.ISOLATION,
        territoryId: territory.id
      };
      
      territory.placeFieldGenerator(field);
      expect(territory.getFieldGenerator()).toEqual(field);
    });

    test('Isolation Field nullifies bonus', () => {
      territory.placeColony('player1');
      expect(territory.isBonusActive()).toBe(true);
      
      const field: FieldGenerator = {
        type: FieldType.ISOLATION,
        territoryId: territory.id
      };
      territory.placeFieldGenerator(field);
      
      expect(territory.isBonusActive()).toBe(false);
    });

    test('places Repulsor Field', () => {
      const field: FieldGenerator = {
        type: FieldType.REPULSOR,
        territoryId: territory.id
      };
      
      territory.placeFieldGenerator(field);
      expect(territory.hasRepulsorField()).toBe(true);
    });

    test('Repulsor Field prevents colony placement', () => {
      const field: FieldGenerator = {
        type: FieldType.REPULSOR,
        territoryId: territory.id
      };
      territory.placeFieldGenerator(field);
      
      const result = territory.placeColony('player1');
      expect(result).toBe(false);
    });

    test('Positron Field grants bonus VP', () => {
      territory.placeColony('player1');
      
      const field: FieldGenerator = {
        type: FieldType.POSITRON,
        territoryId: territory.id
      };
      territory.placeFieldGenerator(field);
      
      expect(territory.getPositronVP('player1')).toBe(1);
      expect(territory.getPositronVP('player2')).toBe(0);
    });

    test('removes field generator', () => {
      const field: FieldGenerator = {
        type: FieldType.ISOLATION,
        territoryId: territory.id
      };
      territory.placeFieldGenerator(field);
      
      const removed = territory.removeFieldGenerator();
      expect(removed).toEqual(field);
      expect(territory.getFieldGenerator()).toBeNull();
    });
  });
});

describe('TerritoryManager', () => {
  let manager: TerritoryManager;
  let player: Player;

  beforeEach(() => {
    manager = new TerritoryManager();
    player = {
      id: 'player1',
      name: 'Test Player',
      color: PlayerColor.RED,
      resources: { ore: 0, fuel: 0, energy: 0 },
      colonies: [],
      alienTechCards: [],
      fieldGenerators: 0,
      isAI: false,
      turnOrder: 0,
      victoryPoints: {
        colonies: 0,
        alienTech: 0,
        territories: 0,
        bonuses: 0,
        total: 0
      }
    };
  });

  test('initializes all 8 territories', () => {
    const territories = manager.getAllTerritories();
    expect(territories).toHaveLength(8);
  });

  test('retrieves territory by ID', () => {
    const territory = manager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
    expect(territory).toBeDefined();
    expect(territory?.name).toBe('Heinlein Plains');
  });

  test('initializes all 3 field generators', () => {
    const isolation = manager.getFieldGenerator(FieldType.ISOLATION);
    const positron = manager.getFieldGenerator(FieldType.POSITRON);
    const repulsor = manager.getFieldGenerator(FieldType.REPULSOR);
    
    expect(isolation).toBeDefined();
    expect(positron).toBeDefined();
    expect(repulsor).toBeDefined();
  });

  describe('Field Generator Management', () => {
    test('places field generator on territory', () => {
      const result = manager.placeFieldGenerator(
        FieldType.ISOLATION,
        TerritoryType.HEINLEIN_PLAINS
      );
      
      expect(result).toBe(true);
      
      const territory = manager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      expect(territory?.getFieldGenerator()?.type).toBe(FieldType.ISOLATION);
    });

    test('moves field generator between territories', () => {
      manager.placeFieldGenerator(FieldType.ISOLATION, TerritoryType.HEINLEIN_PLAINS);
      manager.placeFieldGenerator(FieldType.ISOLATION, TerritoryType.ASIMOV_CRATER);
      
      const oldTerritory = manager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      const newTerritory = manager.getTerritory(TerritoryType.ASIMOV_CRATER);
      
      expect(oldTerritory?.getFieldGenerator()).toBeNull();
      expect(newTerritory?.getFieldGenerator()?.type).toBe(FieldType.ISOLATION);
    });

    test('removes field generator', () => {
      manager.placeFieldGenerator(FieldType.REPULSOR, TerritoryType.HERBERT_VALLEY);
      const result = manager.removeFieldGenerator(FieldType.REPULSOR);
      
      expect(result).toBe(true);
      
      const field = manager.getFieldGenerator(FieldType.REPULSOR);
      expect(field?.territoryId).toBeNull();
    });
  });

  describe('Territory Bonuses', () => {
    test('applies Heinlein Plains bonus (ore)', () => {
      const territory = manager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      territory?.placeColony(player.id);
      
      manager.applyStartOfTurnBonuses(player);
      expect(player.resources.ore).toBe(1);
    });

    test('applies Van Vogt Mountains bonus (fuel)', () => {
      const territory = manager.getTerritory(TerritoryType.VAN_VOGT_MOUNTAINS);
      territory?.placeColony(player.id);
      
      manager.applyStartOfTurnBonuses(player);
      expect(player.resources.fuel).toBe(1);
    });

    test('applies Asimov Crater bonus (energy)', () => {
      const territory = manager.getTerritory(TerritoryType.ASIMOV_CRATER);
      territory?.placeColony(player.id);
      
      manager.applyStartOfTurnBonuses(player);
      expect(player.resources.energy).toBe(1);
    });

    test('applies multiple bonuses', () => {
      const heinlein = manager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      const vanVogt = manager.getTerritory(TerritoryType.VAN_VOGT_MOUNTAINS);
      const asimov = manager.getTerritory(TerritoryType.ASIMOV_CRATER);
      
      heinlein?.placeColony(player.id);
      vanVogt?.placeColony(player.id);
      asimov?.placeColony(player.id);
      
      manager.applyStartOfTurnBonuses(player);
      
      expect(player.resources.ore).toBe(1);
      expect(player.resources.fuel).toBe(1);
      expect(player.resources.energy).toBe(1);
    });

    test('Isolation Field prevents bonus', () => {
      const territory = manager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      territory?.placeColony(player.id);
      
      manager.placeFieldGenerator(FieldType.ISOLATION, TerritoryType.HEINLEIN_PLAINS);
      manager.applyStartOfTurnBonuses(player);
      
      expect(player.resources.ore).toBe(0);
    });

    test('checks Pohl Foothills bonus', () => {
      const territory = manager.getTerritory(TerritoryType.POHL_FOOTHILLS);
      territory?.placeColony(player.id);
      
      expect(manager.hasPohlFoothillsBonus(player.id)).toBe(true);
      expect(manager.hasPohlFoothillsBonus('player2')).toBe(false);
    });

    test('checks Lem Badlands bonus', () => {
      const territory = manager.getTerritory(TerritoryType.LEM_BADLANDS);
      territory?.placeColony(player.id);
      
      expect(manager.hasLemBadlandsBonus(player.id)).toBe(true);
    });

    test('checks Herbert Valley bonus', () => {
      const territory = manager.getTerritory(TerritoryType.HERBERT_VALLEY);
      territory?.placeColony(player.id);
      
      expect(manager.hasHerbertValleyBonus(player.id)).toBe(true);
    });

    test('checks Burroughs Desert bonus', () => {
      const territory = manager.getTerritory(TerritoryType.BURROUGHS_DESERT);
      territory?.placeColony(player.id);
      
      expect(manager.hasBurrowsDesertBonus(player.id)).toBe(true);
    });
  });

  describe('Territory Control Tracking', () => {
    test('tracks controlled territories', () => {
      const heinlein = manager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      const asimov = manager.getTerritory(TerritoryType.ASIMOV_CRATER);
      
      heinlein?.placeColony(player.id);
      asimov?.placeColony(player.id);
      
      const controlled = manager.getControlledTerritories(player.id);
      expect(controlled).toHaveLength(2);
    });

    test('calculates Positron Field VP', () => {
      const territory = manager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      territory?.placeColony(player.id);
      
      manager.placeFieldGenerator(FieldType.POSITRON, TerritoryType.HEINLEIN_PLAINS);
      
      const vp = manager.getPositronVP(player.id);
      expect(vp).toBe(1);
    });

    test('calculates multiple Positron Field VP', () => {
      // Note: In actual game, only one Positron Field exists
      // This tests the calculation logic
      const heinlein = manager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      heinlein?.placeColony(player.id);
      
      manager.placeFieldGenerator(FieldType.POSITRON, TerritoryType.HEINLEIN_PLAINS);
      
      const vp = manager.getPositronVP(player.id);
      expect(vp).toBe(1);
    });
  });

  describe('Cloning', () => {
    test('clones manager state', () => {
      const territory = manager.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      territory?.placeColony(player.id);
      manager.placeFieldGenerator(FieldType.ISOLATION, TerritoryType.HEINLEIN_PLAINS);
      
      const cloned = manager.clone();
      const clonedTerritory = cloned.getTerritory(TerritoryType.HEINLEIN_PLAINS);
      
      expect(clonedTerritory?.getPlayerColonyCount(player.id)).toBe(1);
      expect(clonedTerritory?.getFieldGenerator()?.type).toBe(FieldType.ISOLATION);
    });
  });
});
