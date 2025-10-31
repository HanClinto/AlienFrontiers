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
    test('changes ship to any value', () => {
      const card = new GravityManipulator();
      card.setOwner(player);
      
      const result = card.usePower(player, ship, 6);
      expect(result.success).toBe(true);
      expect(ship.diceValue).toBe(6);
      expect(player.resources.fuel).toBe(7); // costs 3 fuel
    });

    test('rejects invalid values', () => {
      const card = new GravityManipulator();
      card.setOwner(player);
      
      const result1 = card.usePower(player, ship, 0);
      expect(result1.success).toBe(false);
      
      const result2 = card.usePower(player, ship, 7);
      expect(result2.success).toBe(false);
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
    test('discard destroys opponent ship', () => {
      const card = new PlasmaCannon();
      card.setOwner(player);
      
      const result = card.useDiscardPower(player, opponentShip);
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
      
      const result = card.useDiscardPower(player, ownShip);
      expect(result.success).toBe(false);
    });
  });

  describe('HolographicDecoy', () => {
    test('discard places Repulsor Field', () => {
      const card = new HolographicDecoy();
      card.setOwner(player);
      
      const result = card.useDiscardPower(player, 'herbert_valley');
      expect(result.success).toBe(true);
      expect(result.fieldMoved?.type).toBe('repulsor');
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
    test('gains fuel each turn', () => {
      const card = new ResourceCache();
      card.setOwner(player);
      
      const result = card.usePower(player, 'fuel');
      expect(result.success).toBe(true);
      expect(player.resources.fuel).toBe(11);
      expect(result.resourcesGained?.fuel).toBe(1);
    });

    test('gains ore each turn', () => {
      const card = new ResourceCache();
      card.setOwner(player);
      
      const result = card.usePower(player, 'ore');
      expect(result.success).toBe(true);
      expect(player.resources.ore).toBe(11);
      expect(result.resourcesGained?.ore).toBe(1);
    });

    test('can only be used once per turn', () => {
      const card = new ResourceCache();
      card.setOwner(player);
      
      card.usePower(player, 'fuel');
      const result2 = card.usePower(player, 'ore');
      expect(result2.success).toBe(false);
    });
  });
});
