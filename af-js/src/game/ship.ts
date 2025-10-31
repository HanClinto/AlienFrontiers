/**
 * Ship management system
 * Handles ship state, placement, and movement
 */

import { DiceValue, ShipLocation } from './types';

/**
 * Individual ship state
 */
export interface Ship {
  id: string;
  playerId: string;
  diceValue: DiceValue | null; // null when not rolled
  location: ShipLocation;
  isLocked: boolean; // true when committed to a facility
}

/**
 * Ship manager class
 * Handles all ship-related operations
 */
export class ShipManager {
  private ships: Map<string, Ship>;

  constructor() {
    this.ships = new Map();
  }

  /**
   * Create ships for a player (3 ships per player)
   */
  createPlayerShips(playerId: string): Ship[] {
    const playerShips: Ship[] = [];
    
    for (let i = 0; i < 3; i++) {
      const ship: Ship = {
        id: `${playerId}-ship-${i}`,
        playerId,
        diceValue: null,
        location: null,
        isLocked: false
      };
      
      this.ships.set(ship.id, ship);
      playerShips.push(ship);
    }
    
    return playerShips;
  }

  /**
   * Create a single new ship for a player (used by Shipyard)
   */
  createShip(playerId: string): Ship {
    const existingShips = this.getPlayerShips(playerId);
    const shipIndex = existingShips.length;
    
    const ship: Ship = {
      id: `${playerId}-ship-${shipIndex}`,
      playerId,
      diceValue: null,
      location: null,
      isLocked: false
    };
    
    this.ships.set(ship.id, ship);
    return ship;
  }

  /**
   * Get all ships for a player
   */
  getPlayerShips(playerId: string): Ship[] {
    return Array.from(this.ships.values())
      .filter(ship => ship.playerId === playerId);
  }

  /**
   * Get ships at a specific location
   */
  getShipsAtLocation(location: ShipLocation): Ship[] {
    return Array.from(this.ships.values())
      .filter(ship => ship.location === location);
  }

  /**
   * Get a specific ship
   */
  getShip(shipId: string): Ship | undefined {
    return this.ships.get(shipId);
  }

  /**
   * Roll dice for all player's ships
   */
  rollDice(playerId: string): DiceValue[] {
    const playerShips = this.getPlayerShips(playerId);
    const rolls: DiceValue[] = [];

    playerShips.forEach(ship => {
      const roll = (Math.floor(Math.random() * 6) + 1) as DiceValue;
      ship.diceValue = roll;
      rolls.push(roll);
    });

    return rolls;
  }

  /**
   * Place a ship at a location
   * Returns true if placement was successful
   */
  placeShip(shipId: string, location: ShipLocation): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) return false;
    if (ship.isLocked) return false;
    if (ship.diceValue === null) return false;

    ship.location = location;
    return true;
  }

  /**
   * Lock a ship (commit to facility)
   */
  lockShip(shipId: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) return false;
    if (ship.location === null) return false;

    ship.isLocked = true;
    return true;
  }

  /**
   * Return ship to player pool (unlock and clear location)
   */
  returnShipToPool(shipId: string): boolean {
    const ship = this.ships.get(shipId);
    if (!ship) return false;

    ship.location = null;
    ship.isLocked = false;
    ship.diceValue = null;
    return true;
  }

  /**
   * Return all ships to pools (end of turn)
   */
  returnAllShipsToPool(playerId: string): void {
    const playerShips = this.getPlayerShips(playerId);
    playerShips.forEach(ship => {
      ship.location = null;
      ship.isLocked = false;
      ship.diceValue = null;
    });
  }

  /**
   * Get available ships (not placed or locked)
   */
  getAvailableShips(playerId: string): Ship[] {
    return this.getPlayerShips(playerId)
      .filter(ship => ship.location === null && !ship.isLocked);
  }

  /**
   * Clone ship state for game state cloning
   */
  clone(): ShipManager {
    const cloned = new ShipManager();
    this.ships.forEach((ship, id) => {
      cloned.ships.set(id, { ...ship });
    });
    return cloned;
  }

  /**
   * Serialize for saving/loading
   */
  toJSON(): any {
    return {
      ships: Array.from(this.ships.entries())
    };
  }

  /**
   * Deserialize from saved state
   */
  static fromJSON(data: any): ShipManager {
    const manager = new ShipManager();
    if (data.ships) {
      data.ships.forEach(([id, ship]: [string, Ship]) => {
        manager.ships.set(id, ship);
      });
    }
    return manager;
  }
}
