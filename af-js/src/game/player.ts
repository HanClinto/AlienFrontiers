/**
 * Player state and management
 */

import { Resources, PlayerColor, VictoryPoints, ColonyLocation } from './types';

/**
 * Individual player state
 */
export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  resources: Resources;
  victoryPoints: VictoryPoints;
  colonies: ColonyLocation[];
  alienTechCards: string[]; // card IDs
  fieldGenerators: number; // count of field generators
  isAI: boolean;
  turnOrder: number;
}

/**
 * Player manager class
 * Handles player operations
 */
export class PlayerManager {
  private players: Map<string, Player>;

  constructor() {
    this.players = new Map();
  }

  /**
   * Create a new player
   */
  createPlayer(
    id: string,
    name: string,
    color: PlayerColor,
    turnOrder: number,
    isAI: boolean = false
  ): Player {
    const player: Player = {
      id,
      name,
      color,
      resources: { ore: 0, fuel: 0, energy: 0 },
      victoryPoints: { colonies: 0, alienTech: 0, territories: 0, bonuses: 0, total: 0 },
      colonies: [],
      alienTechCards: [],
      fieldGenerators: 0,
      isAI,
      turnOrder
    };

    this.players.set(id, player);
    return player;
  }

  /**
   * Get a player by ID
   */
  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  /**
   * Get all players
   */
  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  /**
   * Get players in turn order
   */
  getPlayersInTurnOrder(): Player[] {
    return this.getAllPlayers().sort((a, b) => a.turnOrder - b.turnOrder);
  }

  /**
   * Add resources to a player
   */
  addResources(playerId: string, resources: Partial<Resources>): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    if (resources.ore) player.resources.ore += resources.ore;
    if (resources.fuel) player.resources.fuel += resources.fuel;
    if (resources.energy) player.resources.energy += resources.energy;

    return true;
  }

  /**
   * Remove resources from a player
   * Returns true if player had enough resources
   */
  removeResources(playerId: string, resources: Partial<Resources>): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    // Check if player has enough resources
    if (resources.ore && player.resources.ore < resources.ore) return false;
    if (resources.fuel && player.resources.fuel < resources.fuel) return false;
    if (resources.energy && player.resources.energy < resources.energy) return false;

    // Deduct resources
    if (resources.ore) player.resources.ore -= resources.ore;
    if (resources.fuel) player.resources.fuel -= resources.fuel;
    if (resources.energy) player.resources.energy -= resources.energy;

    return true;
  }

  /**
   * Check if player can afford a cost
   */
  canAfford(playerId: string, cost: Partial<Resources>): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    if (cost.ore && player.resources.ore < cost.ore) return false;
    if (cost.fuel && player.resources.fuel < cost.fuel) return false;
    if (cost.energy && player.resources.energy < cost.energy) return false;

    return true;
  }

  /**
   * Add a colony to a player
   */
  addColony(playerId: string, location: ColonyLocation): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;
    if (player.colonies.indexOf(location) !== -1) return false;

    player.colonies.push(location);
    this.recalculateVictoryPoints(playerId);
    return true;
  }

  /**
   * Add an alien tech card to a player
   */
  addAlienTechCard(playerId: string, cardId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    player.alienTechCards.push(cardId);
    this.recalculateVictoryPoints(playerId);
    return true;
  }

  /**
   * Recalculate victory points for a player
   */
  recalculateVictoryPoints(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Colonies: 1 VP each
    player.victoryPoints.colonies = player.colonies.length;

    // Alien Tech: 1 VP each
    player.victoryPoints.alienTech = player.alienTechCards.length;

    // Territories: calculated separately (will be implemented in Phase 5)
    // player.victoryPoints.territories = this.calculateTerritoryVP(playerId);

    // Bonuses: various sources (will be implemented as features are added)
    // player.victoryPoints.bonuses = this.calculateBonusVP(playerId);

    // Total
    player.victoryPoints.total = 
      player.victoryPoints.colonies +
      player.victoryPoints.alienTech +
      player.victoryPoints.territories +
      player.victoryPoints.bonuses;
  }

  /**
   * Check if player has won (8+ VP)
   */
  hasWon(playerId: string): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;
    return player.victoryPoints.total >= 8;
  }

  /**
   * Clone player manager for game state cloning
   */
  clone(): PlayerManager {
    const cloned = new PlayerManager();
    this.players.forEach((player, id) => {
      cloned.players.set(id, {
        ...player,
        resources: { ...player.resources },
        victoryPoints: { ...player.victoryPoints },
        colonies: [...player.colonies],
        alienTechCards: [...player.alienTechCards]
      });
    });
    return cloned;
  }

  /**
   * Serialize for saving/loading
   */
  toJSON(): any {
    return {
      players: Array.from(this.players.entries())
    };
  }

  /**
   * Deserialize from saved state
   */
  static fromJSON(data: any): PlayerManager {
    const manager = new PlayerManager();
    if (data.players) {
      data.players.forEach(([id, player]: [string, Player]) => {
        manager.players.set(id, player);
      });
    }
    return manager;
  }
}
