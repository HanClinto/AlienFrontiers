/**
 * Colony Manipulation Tech Cards
 * Cards that affect colony placement and territory control
 */

import { TechCard, TechCardType, TechCardPowerResult } from './base-tech-card';
import { Player } from '../player';

/**
 * Orbital Teleporter - Move colony on discard
 * Power: None
 * Discard: Move one of your colonies to another territory
 */
export class OrbitalTeleporter extends TechCard {
  constructor() {
    super(TechCardType.ORBITAL_TELEPORTER, 'Orbital Teleporter', 0);
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
    return { success: false, message: 'Orbital Teleporter has no power' };
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
    return 'No power';
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
    super(TechCardType.DATA_CRYSTAL, 'Data Crystal', 0);
  }

  hasPower(): boolean {
    return true;
  }

  hasDiscardPower(): boolean {
    return true;
  }

  getPowerCost(): number {
    return 0;
  }

  canUsePower(player: Player): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    return true;
  }

  canUseDiscardPower(player: Player): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    return true;
  }

  usePower(player: Player, territoryId: string): TechCardPowerResult {
    if (!this.canUsePower(player)) {
      return { success: false, message: 'Cannot use Data Crystal power' };
    }

    // TODO: Implement territory bonus usage
    this.markAsUsed();
    
    return {
      success: true,
      message: `Using bonus from ${territoryId}`,
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
