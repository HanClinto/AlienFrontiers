/**
 * Colony Manipulation Tech Cards
 * Cards that affect colony placement and territory control
 */

import { TechCard, TechCardType, TechCardPowerResult } from './base-tech-card';
import { Player } from '../player';

/**
 * Orbital Teleporter - Move docked ships or colonies
 * Power: Pay 2 fuel to move one docked ship to a different facility
 * Discard: Move one of your colonies to another territory
 * 
 * Official rules power restrictions:
 * - Can only move one ship per turn
 * - Cannot reuse ship at the same facility it was removed from
 * - Cannot change ship value during move
 * - Cannot move ship from Terraforming Station
 * - Moved ship can be used at new facility with other unplaced ships
 */
export class OrbitalTeleporter extends TechCard {
  constructor() {
    super(TechCardType.ORBITAL_TELEPORTER, 'Orbital Teleporter', 0, 'tech_ot');
  }

  hasPower(): boolean {
    return true;
  }

  hasDiscardPower(): boolean {
    return true;
  }

  getPowerCost(player: Player): number {
    let cost = 2; // Official rules: Pay 2 fuel
    // Pohl Foothills bonus would be checked here via GameState
    return cost;
  }

  canUsePower(player: Player): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    return player.resources.fuel >= this.getPowerCost(player);
  }

  canUseDiscardPower(player: Player): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    return true;
  }

  usePower(player: Player, fromFacility: string, toFacility: string, shipId: string): TechCardPowerResult {
    if (!this.canUsePower(player)) {
      return { success: false, message: 'Cannot use Orbital Teleporter power' };
    }

    // Official rules: Cannot move from Terraforming Station
    if (fromFacility === 'terraforming_station') {
      return { success: false, message: 'Cannot move ship from Terraforming Station' };
    }

    // Official rules: Cannot move to same facility
    if (fromFacility === toFacility) {
      return { success: false, message: 'Cannot move ship to the same facility' };
    }

    const cost = this.getPowerCost(player);
    player.resources.fuel -= cost;

    // TODO: GameState will handle actual ship movement
    this.markAsUsed();
    
    return {
      success: true,
      message: `Moved ship ${shipId} from ${fromFacility} to ${toFacility} (cost: ${cost} fuel)`
    };
  }

  useDiscardPower(player: Player, fromTerritory: string, toTerritory: string): TechCardPowerResult {
    if (!this.canUseDiscardPower(player)) {
      return { success: false, message: 'Cannot use Orbital Teleporter discard power' };
    }

    // TODO: Implement colony movement in territory system
    this.markAsUsed();
    
    return {
      success: true,
      message: `Moved colony from ${fromTerritory} to ${toTerritory}`,
      colonyMoved: { from: fromTerritory, to: toTerritory }
    };
  }

  getPowerDescription(): string {
    return 'Pay 2 fuel to move one docked ship to a different facility (cannot move from Terraforming Station)';
  }

  getDiscardPowerDescription(): string {
    return 'Discard to move one of your colonies to another territory';
  }
}

/**
 * Data Crystal - Use any territory bonus
 * Power: Use the bonus of any territory this turn
 * Discard: Place or move the Positron Field
 */
export class DataCrystal extends TechCard {
  constructor() {
    super(TechCardType.DATA_CRYSTAL, 'Data Crystal', 0, 'tech_dc');
  }

  hasPower(): boolean {
    return true;
  }

  hasDiscardPower(): boolean {
    return true;
  }

  getPowerCost(player: Player): number {
    // Official rules: Pay 1 fuel per colony on the territory
    // This is a dynamic cost that depends on the target territory
    // GameState needs to pass colony count when calling usePower
    return 1; // Base cost per colony
  }

  canUsePower(player: Player): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    // Actual fuel check will be done in usePower with colony count
    return player.resources.fuel >= 1;
  }

  canUseDiscardPower(player: Player): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    return true;
  }

  usePower(player: Player, territoryId: string, coloniesOnTerritory: number = 1): TechCardPowerResult {
    if (!this.canUsePower(player)) {
      return { success: false, message: 'Cannot use Data Crystal power' };
    }

    // Official rules: Cost is 1 fuel per colony on the territory
    const fuelCost = coloniesOnTerritory;
    if (player.resources.fuel < fuelCost) {
      return { success: false, message: `Need ${fuelCost} fuel (1 per colony on territory)` };
    }

    // TODO: Implement territory bonus usage - GameState will handle fuel deduction
    // GameState must deduct fuelCost from player's fuel
    this.markAsUsed();
    
    return {
      success: true,
      message: `Using bonus from ${territoryId} (cost: ${fuelCost} fuel for ${coloniesOnTerritory} ${coloniesOnTerritory === 1 ? 'colony' : 'colonies'})`,
      territoryBonusUsed: territoryId
    };
  }

  useDiscardPower(player: Player, territoryId: string): TechCardPowerResult {
    if (!this.canUseDiscardPower(player)) {
      return { success: false, message: 'Cannot use Data Crystal discard power' };
    }

    // TODO: Implement field movement
    this.markAsUsed();
    
    return {
      success: true,
      message: `Placed/moved Positron Field to ${territoryId}`,
      fieldMoved: { type: 'positron', from: '', to: territoryId }
    };
  }

  getPowerDescription(): string {
    return 'Use the bonus of any territory this turn';
  }

  getDiscardPowerDescription(): string {
    return 'Discard to place or move the Positron Field (+1 VP)';
  }
}
