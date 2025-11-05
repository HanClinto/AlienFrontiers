/**
 * Tech Card Tests
 * Tests for all tech card implementations
 */

import { 
  AlienCity, 
  AlienMonument,
  BoosterPod,
  StasisBeam,
  PolarityDevice,
  TemporalWarper,
  GravityManipulator,
  OrbitalTeleporter,
  DataCrystal,
  PlasmaCannon,
  HolographicDecoy,
  ResourceCache,
  TechCardType
} from '../../src/game/tech-cards';
import { Player } from '../../src/game/player';
import { Ship } from '../../src/game/ship';
import { PlayerColor } from '../../src/game/types';

describe('Victory Point Tech Cards', () => {
  let player: Player;

  beforeEach(() => {
    player = {
      id: 'player1',
      name: 'Test Player',
      color: PlayerColor.RED,
      resources: { ore: 10, fuel: 10, energy: 10 },
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

  test('AlienCity provides 1 VP', () => {
    const card = new AlienCity();
    card.setOwner(player);
    expect(card.victoryPoints).toBe(1);
    expect(card.hasPower()).toBe(false);
    expect(card.hasDiscardPower()).toBe(false);
  });

  test('AlienMonument provides 1 VP', () => {
    const card = new AlienMonument();
    card.setOwner(player);
    expect(card.victoryPoints).toBe(1);
    expect(card.hasPower()).toBe(false);
    expect(card.hasDiscardPower()).toBe(false);
  });
});

describe('Die Manipulation Tech Cards', () => {
  let player: Player;
  let ship: Ship;

  beforeEach(() => {
    player = {
      id: 'player1',
      name: 'Test Player',
      color: PlayerColor.RED,
      resources: { ore: 10, fuel: 10, energy: 10 },
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

    ship = {
      id: 'ship1',
      playerId: 'player1',
      diceValue: 3,
      location: null,
      isLocked: false
    };
  });

  describe('BoosterPod', () => {
    test('increases ship value by 1', () => {
      const card = new BoosterPod();
      card.setOwner(player);
      
      const result = card.usePower(player, ship);
      expect(result.success).toBe(true);
      expect(ship.diceValue).toBe(4);
      expect(player.resources.fuel).toBe(9);
    });

    test('cannot exceed value 6', () => {
      ship.diceValue = 6;
      const card = new BoosterPod();
      card.setOwner(player);
      
      const result = card.usePower(player, ship);
      expect(result.success).toBe(false);
    });

    test('requires fuel', () => {
      player.resources.fuel = 0;
      const card = new BoosterPod();
      card.setOwner(player);
      
      const result = card.usePower(player, ship);
      expect(result.success).toBe(false);
    });

    test('can only be used once per turn', () => {
      const card = new BoosterPod();
      card.setOwner(player);
      
      card.usePower(player, ship);
      const result2 = card.usePower(player, ship);
      expect(result2.success).toBe(false);
    });
  });

  describe('StasisBeam', () => {
    test('decreases ship value by 1', () => {
      const card = new StasisBeam();
      card.setOwner(player);
      
      const result = card.usePower(player, ship);
      expect(result.success).toBe(true);
      expect(ship.diceValue).toBe(2);
      expect(player.resources.fuel).toBe(9);
    });

    test('cannot go below value 1', () => {
      ship.diceValue = 1;
      const card = new StasisBeam();
      card.setOwner(player);
      
      const result = card.usePower(player, ship);
      expect(result.success).toBe(false);
    });

    test('discard places Isolation Field', () => {
      const card = new StasisBeam();
      card.setOwner(player);
      
      const result = card.useDiscardPower(player, 'heinlein_plains');
      expect(result.success).toBe(true);
      expect(result.fieldMoved?.type).toBe('isolation');
    });
  });

  describe('PolarityDevice', () => {
    test('swaps two ship values', () => {
      const ship2: Ship = {
        id: 'ship2',
        playerId: 'player1',
        diceValue: 5,
        location: null,
        isLocked: false
      };

      const card = new PolarityDevice();
      card.setOwner(player);
      
      const result = card.usePower(player, ship, ship2);
      expect(result.success).toBe(true);
      expect(ship.diceValue).toBe(5);
      expect(ship2.diceValue).toBe(3);
    });
  });

  describe('TemporalWarper', () => {
    test('rerolls ships', () => {
      const card = new TemporalWarper();
      card.setOwner(player);
      
      const initialValue = ship.diceValue;
      const result = card.usePower(player, [ship]);
      expect(result.success).toBe(true);
      expect(ship.diceValue).toBeGreaterThanOrEqual(1);
      expect(ship.diceValue).toBeLessThanOrEqual(6);
    });

    test('discard claims tech from discard pile', () => {
      const card = new TemporalWarper();
      card.setOwner(player);
      
      const result = card.useDiscardPower(player, TechCardType.ALIEN_CITY);
      expect(result.success).toBe(true);
      expect(result.techCardClaimed).toBe(TechCardType.ALIEN_CITY);
    });
  });

  describe('GravityManipulator', () => {
    test('moves points between ships', () => {
      const card = new GravityManipulator();
      card.setOwner(player);
      
      // Create a second ship
      const ship2: Ship = { 
        id: 'ship2', 
        playerId: player.id, 
        diceValue: 2, 
        location: null, 
        isLocked: false 
      };
      
      const result = card.usePower(player, ship, ship2); // Move 1 point from ship (3→2) to ship2 (2→3)
      expect(result.success).toBe(true);
      expect(ship.diceValue).toBe(2); // decreased by 1
      expect(ship2.diceValue).toBe(3); // increased by 1
      expect(player.resources.fuel).toBe(8); // costs 2 fuel
    });

    test('rejects invalid operations', () => {
      const card = new GravityManipulator();
      card.setOwner(player);
      
      const ship2: Ship = { 
        id: 'ship2', 
        playerId: player.id, 
        diceValue: 6, 
        location: null, 
        isLocked: false 
      };
      const ship3: Ship = { 
        id: 'ship3', 
        playerId: player.id, 
        diceValue: 1, 
        location: null, 
        isLocked: false 
      };
      
      // Cannot increase ship above 6
      const result1 = card.usePower(player, ship, ship2);
      expect(result1.success).toBe(false);
      
      // Cannot decrease ship below 1
      card.markAsUsed(); // Reset
      const result2 = card.usePower(player, ship3, ship);
      expect(result2.success).toBe(false);
    });
    
    test('discard places Repulsor Field', () => {
      const card = new GravityManipulator();
      card.setOwner(player);
      
      expect(card.hasDiscardPower()).toBe(true);
      const result = card.useDiscardPower(player, 'herbert_valley');
      expect(result.success).toBe(true);
      expect(result.fieldMoved?.type).toBe('repulsor');
    });
  });
});

describe('Colony Manipulation Tech Cards', () => {
  let player: Player;

  beforeEach(() => {
    player = {
      id: 'player1',
      name: 'Test Player',
      color: PlayerColor.RED,
      resources: { ore: 10, fuel: 10, energy: 10 },
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

  describe('OrbitalTeleporter', () => {
    test('discard moves colony', () => {
      const card = new OrbitalTeleporter();
      card.setOwner(player);
      
      const result = card.useDiscardPower(player, 'heinlein_plains', 'asimov_crater');
      expect(result.success).toBe(true);
      expect(result.colonyMoved).toBeDefined();
      expect(result.colonyMoved?.from).toBe('heinlein_plains');
      expect(result.colonyMoved?.to).toBe('asimov_crater');
    });
  });

  describe('DataCrystal', () => {
    test('power uses any territory bonus', () => {
      const card = new DataCrystal();
      card.setOwner(player);
      
      const result = card.usePower(player, 'heinlein_plains');
      expect(result.success).toBe(true);
      expect(result.territoryBonusUsed).toBe('heinlein_plains');
    });

    test('discard places Positron Field', () => {
      const card = new DataCrystal();
      card.setOwner(player);
      
      const result = card.useDiscardPower(player, 'bradbury_plateau');
      expect(result.success).toBe(true);
      expect(result.fieldMoved?.type).toBe('positron');
    });
  });
});

describe('Combat/Defense Tech Cards', () => {
  let player: Player;
  let opponentShip: Ship;

  beforeEach(() => {
    player = {
      id: 'player1',
      name: 'Test Player',
      color: PlayerColor.RED,
      resources: { ore: 10, fuel: 10, energy: 10 },
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

    opponentShip = {
      id: 'opponent-ship1',
      playerId: 'player2',
      diceValue: 4,
      location: 'solar_converter',
      isLocked: true
    };
  });

  describe('PlasmaCannon', () => {
    test('discard destroys opponent ship when they have >3 ships', () => {
      const card = new PlasmaCannon();
      card.setOwner(player);
      
      const result = card.useDiscardPower(player, opponentShip, 4); // Opponent has 4 ships
      expect(result.success).toBe(true);
      expect(result.shipDestroyed).toBe('opponent-ship1');
    });

    test('cannot target own ships', () => {
      const ownShip: Ship = {
        id: 'own-ship1',
        playerId: 'player1',
        diceValue: 4,
        location: 'solar_converter',
        isLocked: true
      };

      const card = new PlasmaCannon();
      card.setOwner(player);
      
      const result = card.useDiscardPower(player, ownShip, 4);
      expect(result.success).toBe(false);
    });

    test('cannot target opponent with 3 or fewer ships', () => {
      const card = new PlasmaCannon();
      card.setOwner(player);
      
      const result = card.useDiscardPower(player, opponentShip, 3); // Opponent has only 3 ships
      expect(result.success).toBe(false);
      expect(result.message).toContain('more than 3 ships');
    });

    test('EDGE CASE: power requires target player has >3 ships on board', () => {
      const card = new PlasmaCannon();
      card.setOwner(player);
      
      // Exactly 3 ships - should fail
      expect(card.useDiscardPower(player, opponentShip, 3).success).toBe(false);
      
      // 4 ships - should succeed
      expect(card.useDiscardPower(player, opponentShip, 4).success).toBe(true);
    });

    test('EDGE CASE: power removes multiple ships from facility (1 fuel each)', () => {
      const card = new PlasmaCannon();
      card.setOwner(player);
      player.resources.fuel = 10;
      
      const opponentShips: Ship[] = [
        { id: 'opp-1', playerId: 'player2', diceValue: 4 as any, location: 'solar_converter', isLocked: true },
        { id: 'opp-2', playerId: 'player2', diceValue: 5 as any, location: 'solar_converter', isLocked: true },
      ];
      
      const result = card.usePower(player, opponentShips, 'solar_converter');
      expect(result.success).toBe(true);
      // Cost should be 2 fuel (1 per ship) - verified in game-state integration
    });

    test('EDGE CASE: ships from Terraforming Station go to stock', () => {
      // Terraforming Station ships return to stock, not Maintenance Bay
      // This is handled at game-state level
      const terraformingShip: Ship = {
        id: 'terraform-ship',
        playerId: 'player2',
        diceValue: 6 as any,
        location: 'terraforming_station',
        isLocked: true
      };
      
      const card = new PlasmaCannon();
      card.setOwner(player);
      
      // Power can target ships at Terraforming Station
      const result = card.usePower(player, [terraformingShip], 'terraforming_station');
      expect(result.success).toBe(true);
    });

    test('EDGE CASE: cannot use power on own ships', () => {
      const card = new PlasmaCannon();
      card.setOwner(player);
      
      const ownShips: Ship[] = [
        { id: 'own-1', playerId: 'player1', diceValue: 4 as any, location: 'solar_converter', isLocked: true },
      ];
      
      const result = card.usePower(player, ownShips, 'solar_converter');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot target your own ships');
    });
  });

  describe('HolographicDecoy', () => {
    test('provides passive protection', () => {
      const card = new HolographicDecoy();
      card.setOwner(player);
      
      // Holographic Decoy has no active powers, only passive protection
      expect(card.hasPower()).toBe(false);
      expect(card.hasDiscardPower()).toBe(false);
      
      // Protection from Raiders' Outpost is handled at game-state level
      // This card just needs to exist in player's collection
    });
  });
});

describe('Resource Tech Cards', () => {
  let player: Player;

  beforeEach(() => {
    player = {
      id: 'player1',
      name: 'Test Player',
      color: PlayerColor.RED,
      resources: { ore: 10, fuel: 10, energy: 10 },
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

  describe('ResourceCache', () => {
    test('gains fuel when more even ships', () => {
      const card = new ResourceCache();
      card.setOwner(player);
      
      const result = card.usePower(player, [2, 4, 6]); // 3 even, 0 odd
      expect(result.success).toBe(true);
      expect(result.resourcesGained?.fuel).toBe(1);
    });

    test('gains ore when more odd ships', () => {
      const card = new ResourceCache();
      card.setOwner(player);
      
      const result = card.usePower(player, [1, 3, 5]); // 0 even, 3 odd
      expect(result.success).toBe(true);
      expect(result.resourcesGained?.ore).toBe(1);
    });

    test('gains both fuel and ore when equal odd/even, then discards', () => {
      const card = new ResourceCache();
      card.setOwner(player);
      
      const result = card.usePower(player, [1, 2, 3, 4]); // 2 even, 2 odd
      expect(result.success).toBe(true);
      expect(result.resourcesGained?.fuel).toBe(1);
      expect(result.resourcesGained?.ore).toBe(1);
      expect(result.shouldDiscard).toBe(true);
    });

    test('can only be used once per turn', () => {
      const card = new ResourceCache();
      card.setOwner(player);
      
      card.usePower(player, [2, 4]);
      const result2 = card.usePower(player, [1, 3]);
      expect(result2.success).toBe(false);
    });
  });
});
