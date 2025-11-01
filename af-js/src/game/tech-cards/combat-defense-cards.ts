/**
 * Combat and Defense Tech Cards
 * Cards for attacking opponents and defending territories
 */

import { TechCard, TechCardType, TechCardPowerResult } from './base-tech-card';
import { Player } from '../player';
import { Ship } from '../ship';

/**
 * Plasma Cannon - Remove opponent's ships from facility
 * Power: Pay 1 fuel per ship to remove opponent's ships from one facility
 * Discard: Return one opponent's ship to stock (if they have >3 ships)
 */
export class PlasmaCannon extends TechCard {
  constructor() {
    super(TechCardType.PLASMA_CANNON, 'Plasma Cannon', 0, 'tech_pc');
  }

  hasPower(): boolean {
    return true; // Official rules: Has power to remove ships from facility
  }

  hasDiscardPower(): boolean {
    return true;
  }

  getPowerCost(player: Player, shipCount: number = 1): number {
    // Official rules: Pay 1 fuel per ship removed
    let cost = shipCount;
    // Pohl Foothills bonus would reduce this (checked by GameState)
    return cost;
  }

  canUsePower(player: Player, shipCount: number = 1): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    return player.resources.fuel >= this.getPowerCost(player, shipCount);
  }

  canUseDiscardPower(player: Player): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    return true;
  }

  usePower(player: Player, targetShips: Ship[], facilityId: string): TechCardPowerResult {
    const shipCount = targetShips.length;
    if (!this.canUsePower(player, shipCount)) {
      return { success: false, message: `Cannot use Plasma Cannon power (need ${this.getPowerCost(player, shipCount)} fuel)` };
    }

    // Cannot target own ships
    if (targetShips.some(ship => ship.playerId === player.id)) {
      return { success: false, message: 'Cannot target your own ships' };
    }

    // All ships must be from the same facility
    // TODO: Validate all ships are from same facility in GameState
    
    // GameState will:
    // - Deduct fuel cost
    // - Move ships to Maintenance Bay (or stock if from Terraforming Station)
    this.markAsUsed();
    
    return {
      success: true,
      message: `Removed ${shipCount} ship${shipCount > 1 ? 's' : ''} from ${facilityId} (cost: ${this.getPowerCost(player, shipCount)} fuel)`,
      // Ships moved to Maintenance Bay - GameState handles this
    };
  }

  useDiscardPower(player: Player, targetShip: Ship, targetPlayerShipCount: number): TechCardPowerResult {
    if (!this.canUseDiscardPower(player)) {
      return { success: false, message: 'Cannot use Plasma Cannon discard power' };
    }

    // Cannot target own ships
    if (targetShip.playerId === player.id) {
      return { success: false, message: 'Cannot target your own ships' };
    }

    // Official rules: Target player must have more than 3 ships on board
    if (targetPlayerShipCount <= 3) {
      return { success: false, message: 'Target player must have more than 3 ships on board' };
    }

    // TODO: Implement ship return to stock in GameState
    this.markAsUsed();
    
    return {
      success: true,
      message: `Returned ship ${targetShip.id} to stock (player had ${targetPlayerShipCount} ships)`,
      shipDestroyed: targetShip.id // Returns to stock, not destroyed, but same effect
    };
  }

  getPowerDescription(): string {
    return 'Pay 1 fuel per ship to remove opponent\'s ships from one facility to Maintenance Bay';
  }

  getDiscardPowerDescription(): string {
    return 'Discard to return one opponent\'s ship to stock (if they have >3 ships)';
  }
}

/**
 * Holographic Decoy - Place Repulsor Field
 * Power: None
 * Discard: Place or move the Repulsor Field
 */
export class HolographicDecoy extends TechCard {
  constructor() {
    super(TechCardType.HOLOGRAPHIC_DECOY, 'Holographic Decoy', 0, 'tech_hd');
  }

  hasPower(): boolean {
    return false;
  }

  hasDiscardPower(): boolean {
    return true;
  }

  getPowerCost(): number {
    return 0;
  }

  canUsePower(): boolean {
    return false;
  }

  canUseDiscardPower(player: Player): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    return true;
  }

  usePower(): TechCardPowerResult {
    return { success: false, message: 'Holographic Decoy has no power' };
  }

  useDiscardPower(player: Player, territoryId: string): TechCardPowerResult {
    if (!this.canUseDiscardPower(player)) {
      return { success: false, message: 'Cannot use Holographic Decoy discard power' };
    }

    // TODO: Implement field movement
    this.markAsUsed();
    
    return {
      success: true,
      message: `Placed/moved Repulsor Field to ${territoryId}`,
      fieldMoved: { type: 'repulsor', from: '', to: territoryId }
    };
  }

  getPowerDescription(): string {
    return 'No power';
  }

  getDiscardPowerDescription(): string {
    return 'Discard to place or move the Repulsor Field (prevents colony placement)';
  }
}
