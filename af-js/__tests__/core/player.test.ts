/**
 * Player management tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { PlayerManager } from '../../src/game/player';
import { PlayerColor, ColonyLocation } from '../../src/game/types';

describe('PlayerManager', () => {
  let playerManager: PlayerManager;

  beforeEach(() => {
    playerManager = new PlayerManager();
  });

  describe('createPlayer', () => {
    test('should create player with correct initial state', () => {
      const player = playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0, false);
      
      expect(player.id).toBe('p1');
      expect(player.name).toBe('Alice');
      expect(player.color).toBe(PlayerColor.RED);
      expect(player.resources).toEqual({ ore: 0, fuel: 0, energy: 0 });
      expect(player.victoryPoints.total).toBe(0);
      expect(player.colonies).toHaveLength(0);
      expect(player.alienTechCards).toHaveLength(0);
      expect(player.isAI).toBe(false);
      expect(player.turnOrder).toBe(0);
    });

    test('should create AI player', () => {
      const player = playerManager.createPlayer('ai1', 'AI', PlayerColor.BLUE, 1, true);
      expect(player.isAI).toBe(true);
    });
  });

  describe('getPlayer', () => {
    test('should retrieve player by ID', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      const player = playerManager.getPlayer('p1');
      expect(player?.name).toBe('Alice');
    });

    test('should return undefined for non-existent player', () => {
      const player = playerManager.getPlayer('nonexistent');
      expect(player).toBeUndefined();
    });
  });

  describe('getPlayersInTurnOrder', () => {
    test('should return players sorted by turn order', () => {
      playerManager.createPlayer('p3', 'Charlie', PlayerColor.GREEN, 2);
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.createPlayer('p2', 'Bob', PlayerColor.BLUE, 1);
      
      const players = playerManager.getPlayersInTurnOrder();
      expect(players[0].name).toBe('Alice');
      expect(players[1].name).toBe('Bob');
      expect(players[2].name).toBe('Charlie');
    });
  });

  describe('addResources', () => {
    test('should add resources to player', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addResources('p1', { ore: 3, fuel: 2 });
      
      const player = playerManager.getPlayer('p1');
      expect(player?.resources.ore).toBe(3);
      expect(player?.resources.fuel).toBe(2);
      expect(player?.resources.energy).toBe(0);
    });

    test('should accumulate resources', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addResources('p1', { ore: 3 });
      playerManager.addResources('p1', { ore: 2 });
      
      const player = playerManager.getPlayer('p1');
      expect(player?.resources.ore).toBe(5);
    });
  });

  describe('removeResources', () => {
    test('should remove resources from player', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addResources('p1', { ore: 5, fuel: 3 });
      const success = playerManager.removeResources('p1', { ore: 2, fuel: 1 });
      
      expect(success).toBe(true);
      const player = playerManager.getPlayer('p1');
      expect(player?.resources.ore).toBe(3);
      expect(player?.resources.fuel).toBe(2);
    });

    test('should fail if insufficient resources', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addResources('p1', { ore: 2 });
      const success = playerManager.removeResources('p1', { ore: 5 });
      
      expect(success).toBe(false);
      const player = playerManager.getPlayer('p1');
      expect(player?.resources.ore).toBe(2); // unchanged
    });
  });

  describe('canAfford', () => {
    test('should return true if player can afford cost', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addResources('p1', { ore: 5, fuel: 3 });
      
      const canAfford = playerManager.canAfford('p1', { ore: 3, fuel: 2 });
      expect(canAfford).toBe(true);
    });

    test('should return false if player cannot afford cost', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addResources('p1', { ore: 2, fuel: 3 });
      
      const canAfford = playerManager.canAfford('p1', { ore: 5 });
      expect(canAfford).toBe(false);
    });
  });

  describe('addColony', () => {
    test('should add colony to player', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      const success = playerManager.addColony('p1', ColonyLocation.ASIMOV_CRATER);
      
      expect(success).toBe(true);
      const player = playerManager.getPlayer('p1');
      expect(player?.colonies).toHaveLength(1);
      expect(player?.colonies[0]).toBe(ColonyLocation.ASIMOV_CRATER);
    });

    test('should not add duplicate colony', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addColony('p1', ColonyLocation.ASIMOV_CRATER);
      const success = playerManager.addColony('p1', ColonyLocation.ASIMOV_CRATER);
      
      expect(success).toBe(false);
      const player = playerManager.getPlayer('p1');
      expect(player?.colonies).toHaveLength(1);
    });

    test('should update victory points when colony added', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addColony('p1', ColonyLocation.ASIMOV_CRATER);
      
      const player = playerManager.getPlayer('p1');
      expect(player?.victoryPoints.colonies).toBe(1);
      expect(player?.victoryPoints.total).toBe(1);
    });
  });

  describe('addAlienTechCard', () => {
    test('should add alien tech card to player', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addAlienTechCard('p1', 'tech-1');
      
      const player = playerManager.getPlayer('p1');
      expect(player?.alienTechCards).toHaveLength(1);
      expect(player?.alienTechCards[0]).toBe('tech-1');
    });

    test('should update victory points when card added', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addAlienTechCard('p1', 'tech-1');
      
      const player = playerManager.getPlayer('p1');
      expect(player?.victoryPoints.alienTech).toBe(1);
      expect(player?.victoryPoints.total).toBe(1);
    });
  });

  describe('recalculateVictoryPoints', () => {
    test('should calculate total VP correctly', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addColony('p1', ColonyLocation.ASIMOV_CRATER);
      playerManager.addColony('p1', ColonyLocation.BURROUGHS_DESERT);
      playerManager.addAlienTechCard('p1', 'tech-1');
      
      const player = playerManager.getPlayer('p1');
      expect(player?.victoryPoints.colonies).toBe(2);
      expect(player?.victoryPoints.alienTech).toBe(1);
      expect(player?.victoryPoints.total).toBe(3);
    });
  });

  describe('hasWon', () => {
    test('should return false if player has less than 8 VP', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addColony('p1', ColonyLocation.ASIMOV_CRATER);
      expect(playerManager.hasWon('p1')).toBe(false);
    });

    test('should return true if player has 8 or more VP', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      // Add 8 colonies for 8 VP
      playerManager.addColony('p1', ColonyLocation.ASIMOV_CRATER);
      playerManager.addColony('p1', ColonyLocation.BURROUGHS_DESERT);
      playerManager.addColony('p1', ColonyLocation.HEINLEIN_PLAINS);
      playerManager.addColony('p1', ColonyLocation.BRADBURY_PLATEAU);
      playerManager.addColony('p1', ColonyLocation.CLARKE_MOUNTAINS);
      playerManager.addColony('p1', ColonyLocation.NIVEN_VALLEY);
      playerManager.addColony('p1', ColonyLocation.HERBERT_VALLEY);
      playerManager.addAlienTechCard('p1', 'tech-1');
      
      expect(playerManager.hasWon('p1')).toBe(true);
    });
  });

  describe('clone', () => {
    test('should create independent copy', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addResources('p1', { ore: 5 });
      
      const cloned = playerManager.clone();
      
      // Modify original
      playerManager.addResources('p1', { ore: 3 });
      
      // Clone should be unchanged
      const clonedPlayer = cloned.getPlayer('p1');
      expect(clonedPlayer?.resources.ore).toBe(5);
    });
  });

  describe('serialization', () => {
    test('should serialize and deserialize correctly', () => {
      playerManager.createPlayer('p1', 'Alice', PlayerColor.RED, 0);
      playerManager.addResources('p1', { ore: 5 });
      playerManager.addColony('p1', ColonyLocation.ASIMOV_CRATER);
      
      const json = playerManager.toJSON();
      const restored = PlayerManager.fromJSON(json);
      
      const player = restored.getPlayer('p1');
      expect(player?.name).toBe('Alice');
      expect(player?.resources.ore).toBe(5);
      expect(player?.colonies).toHaveLength(1);
    });
  });
});
