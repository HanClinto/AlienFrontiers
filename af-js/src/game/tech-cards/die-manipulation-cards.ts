/**
 * Die Manipulation Tech Cards
 * Cards that allow modifying ship dice values
 */

import { TechCard, TechCardType, TechCardPowerResult } from './base-tech-card';
import { Player } from '../player';
import { Ship } from '../ship';
import { DiceValue } from '../types';

/**
 * Booster Pod - Increase ship value by 1
 * Power: Pay 1 fuel to increase one ship's value by 1
 * Discard: None
 */
export class BoosterPod extends TechCard {
  constructor() {
    super(TechCardType.BOOSTER_POD, 'Booster Pod', 0, 'tech_bp');
  }

  hasPower(): boolean {
    return true;
  }

  hasDiscardPower(): boolean {
    return false;
  }

  getPowerCost(player: Player): number {
    let cost = 1;
    // Check for Pohl Foothills bonus (-1 fuel)
    // Note: TerritoryManager check would need to be injected via GameState
    // For now, this is a placeholder for the bonus logic
    return cost;
  }

  canUsePower(player: Player): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    return player.resources.fuel >= this.getPowerCost(player);
  }

  canUseDiscardPower(): boolean {
    return false;
  }

  usePower(player: Player, ship: Ship): TechCardPowerResult {
    if (!this.canUsePower(player)) {
      return { success: false, message: 'Cannot use Booster Pod power' };
    }

    if (!ship.diceValue || ship.diceValue >= 6) {
      return { success: false, message: 'Ship value cannot exceed 6' };
    }

    const cost = this.getPowerCost(player);
    player.resources.fuel -= cost;
    
    const oldValue = ship.diceValue;
    ship.diceValue = Math.min(6, ship.diceValue + 1) as DiceValue;
    
    this.markAsUsed();
    
    return {
      success: true,
      message: `Increased ship value from ${oldValue} to ${ship.diceValue}`,
      shipValueChanged: { shipId: ship.id, oldValue, newValue: ship.diceValue }
    };
  }

  useDiscardPower(): TechCardPowerResult {
    return { success: false, message: 'Booster Pod has no discard power' };
  }

  getPowerDescription(): string {
    return 'Pay 1 fuel to increase one ship\'s value by 1';
  }

  getDiscardPowerDescription(): string {
    return 'No discard power';
  }
}

/**
 * Stasis Beam - Decrease ship value by 1
 * Power: Pay 1 fuel to decrease one ship's value by 1
 * Discard: Place or move Isolation Field
 */
export class StasisBeam extends TechCard {
  constructor() {
    super(TechCardType.STASIS_BEAM, 'Stasis Beam', 0, 'tech_sb');
  }

  hasPower(): boolean {
    return true;
  }

  hasDiscardPower(): boolean {
    return true;
  }

  getPowerCost(player: Player): number {
    let cost = 1;
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

  usePower(player: Player, ship: Ship): TechCardPowerResult {
    if (!this.canUsePower(player)) {
      return { success: false, message: 'Cannot use Stasis Beam power' };
    }

    if (!ship.diceValue || ship.diceValue <= 1) {
      return { success: false, message: 'Ship value cannot go below 1' };
    }

    const cost = this.getPowerCost(player);
    player.resources.fuel -= cost;
    
    const oldValue = ship.diceValue;
    ship.diceValue = Math.max(1, ship.diceValue - 1) as DiceValue;
    
    this.markAsUsed();
    
    return {
      success: true,
      message: `Decreased ship value from ${oldValue} to ${ship.diceValue}`,
      shipValueChanged: { shipId: ship.id, oldValue, newValue: ship.diceValue }
    };
  }

  useDiscardPower(player: Player, territoryId: string): TechCardPowerResult {
    if (!this.canUseDiscardPower(player)) {
      return { success: false, message: 'Cannot use Stasis Beam discard power' };
    }

    // TODO: Implement actual field movement in territory system
    this.markAsUsed();
    
    return {
      success: true,
      message: `Placed/moved Isolation Field to ${territoryId}`,
      fieldMoved: { type: 'isolation', from: '', to: territoryId }
    };
  }

  getPowerDescription(): string {
    return 'Pay 1 fuel to decrease one ship\'s value by 1';
  }

  getDiscardPowerDescription(): string {
    return 'Discard to place or move the Isolation Field';
  }
}

/**
 * Polarity Device - Swap values of two ships
 * Power: Pay 1 fuel to swap the values of two ships
 * Discard: Swap two colonies
 */
export class PolarityDevice extends TechCard {
  constructor() {
    super(TechCardType.POLARITY_DEVICE, 'Polarity Device', 0, 'tech_pd');
  }

  hasPower(): boolean {
    return true;
  }

  hasDiscardPower(): boolean {
    return true;
  }

  getPowerCost(player: Player): number {
    let cost = 1;
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

  usePower(player: Player, ship1: Ship, ship2: Ship): TechCardPowerResult {
    if (!this.canUsePower(player)) {
      return { success: false, message: 'Cannot use Polarity Device power' };
    }

    if (!ship1.diceValue || !ship2.diceValue) {
      return { success: false, message: 'Both ships must have dice values' };
    }

    const cost = this.getPowerCost(player);
    player.resources.fuel -= cost;
    
    const temp = ship1.diceValue;
    ship1.diceValue = ship2.diceValue;
    ship2.diceValue = temp;
    
    this.markAsUsed();
    
    return {
      success: true,
      message: `Swapped ship values: ${ship1.id} and ${ship2.id}`
    };
  }

  useDiscardPower(player: Player, territoryId: string): TechCardPowerResult {
    if (!this.canUseDiscardPower(player)) {
      return { success: false, message: 'Cannot use Polarity Device discard power' };
    }

    // TODO: Implement colony swapping in territory system
    this.markAsUsed();
    
    return {
      success: true,
      message: `Swapped colonies on ${territoryId}`
    };
  }

  getPowerDescription(): string {
    return 'Pay 1 fuel to swap the values of two ships';
  }

  getDiscardPowerDescription(): string {
    return 'Discard to swap two colonies on a territory';
  }
}

/**
 * Temporal Warper - Reroll ships
 * Power: Pay 1 fuel to reroll any number of ships
 * Discard: Claim a tech card from discard pile
 */
export class TemporalWarper extends TechCard {
  constructor() {
    super(TechCardType.TEMPORAL_WARPER, 'Temporal Warper', 0, 'tech_tw');
  }

  hasPower(): boolean {
    return true;
  }

  hasDiscardPower(): boolean {
    return true;
  }

  getPowerCost(player: Player): number {
    let cost = 1;
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

  usePower(player: Player, ships: Ship[]): TechCardPowerResult {
    if (!this.canUsePower(player)) {
      return { success: false, message: 'Cannot use Temporal Warper power' };
    }

    const cost = this.getPowerCost(player);
    player.resources.fuel -= cost;
    
    // Reroll ships
    const rerolledIds: string[] = [];
    ships.forEach(ship => {
      ship.diceValue = (Math.floor(Math.random() * 6) + 1) as DiceValue;
      rerolledIds.push(ship.id);
    });
    
    this.markAsUsed();
    
    return {
      success: true,
      message: `Rerolled ${ships.length} ship(s)`,
      shipsRerolled: rerolledIds
    };
  }

  useDiscardPower(player: Player, techCardType: TechCardType): TechCardPowerResult {
    if (!this.canUseDiscardPower(player)) {
      return { success: false, message: 'Cannot use Temporal Warper discard power' };
    }

    // TODO: Implement claiming from discard pile
    this.markAsUsed();
    
    return {
      success: true,
      message: `Claimed ${techCardType} from discard pile`,
      techCardClaimed: techCardType
    };
  }

  getPowerDescription(): string {
    return 'Pay 1 fuel to reroll any number of your ships';
  }

  getDiscardPowerDescription(): string {
    return 'Discard to claim one tech card from the discard pile';
  }
}

/**
 * Gravity Manipulator - Move points between ships
 * Power: Pay 2 fuel to decrease one ship by 1 and increase another by 1
 * Discard: Place or move the Repulsor Field
 */
export class GravityManipulator extends TechCard {
  constructor() {
    super(TechCardType.GRAVITY_MANIPULATOR, 'Gravity Manipulator', 0, 'tech_gm');
  }

  hasPower(): boolean {
    return true;
  }

  hasDiscardPower(): boolean {
    return true;
  }

  getPowerCost(player: Player): number {
    let cost = 2; // Official rules: Pay 2 fuel to move dice values
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

  usePower(player: Player, decreaseShip: Ship, increaseShip: Ship): TechCardPowerResult {
    if (!this.canUsePower(player)) {
      return { success: false, message: 'Cannot use Gravity Manipulator power' };
    }

    // Official rules: Decrease one ship by 1, increase another by 1
    if (!decreaseShip.diceValue || decreaseShip.diceValue <= 1) {
      return { success: false, message: 'Cannot decrease ship below 1' };
    }

    if (!increaseShip.diceValue || increaseShip.diceValue >= 6) {
      return { success: false, message: 'Cannot increase ship above 6' };
    }

    const cost = this.getPowerCost(player);
    player.resources.fuel -= cost;
    
    const oldValueDecrease = decreaseShip.diceValue;
    const oldValueIncrease = increaseShip.diceValue;
    
    decreaseShip.diceValue = (decreaseShip.diceValue - 1) as DiceValue;
    increaseShip.diceValue = (increaseShip.diceValue + 1) as DiceValue;
    
    this.markAsUsed();
    
    return {
      success: true,
      message: `Moved 1 point from ship ${decreaseShip.id} (${oldValueDecrease}→${decreaseShip.diceValue}) to ship ${increaseShip.id} (${oldValueIncrease}→${increaseShip.diceValue})`
    };
  }

  useDiscardPower(player: Player, territoryId: string): TechCardPowerResult {
    if (!this.canUseDiscardPower(player)) {
      return { success: false, message: 'Cannot use Gravity Manipulator discard power' };
    }

    // TODO: Implement field movement in territory system
    this.markAsUsed();
    
    return {
      success: true,
      message: `Placed/moved Repulsor Field to ${territoryId}`,
      fieldMoved: { type: 'repulsor', from: '', to: territoryId }
    };
  }

  getPowerDescription(): string {
    return 'Pay 2 fuel to decrease one ship by 1 and increase another ship by 1';
  }

  getDiscardPowerDescription(): string {
    return 'Discard to place or move the Repulsor Field (blocks colony add/remove)';
  }
}
