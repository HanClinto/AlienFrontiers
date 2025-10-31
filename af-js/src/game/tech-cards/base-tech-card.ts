/**
 * Alien Tech Card System
 * Base classes and interfaces for tech cards
 */

import { Player } from '../player';
import { Ship } from '../ship';

/**
 * Tech card types
 */
export enum TechCardType {
  // Victory Point Cards
  ALIEN_CITY = 'alien_city',
  ALIEN_MONUMENT = 'alien_monument',
  
  // Die Manipulation Cards
  BOOSTER_POD = 'booster_pod',
  STASIS_BEAM = 'stasis_beam',
  POLARITY_DEVICE = 'polarity_device',
  TEMPORAL_WARPER = 'temporal_warper',
  GRAVITY_MANIPULATOR = 'gravity_manipulator',
  
  // Colony Manipulation Cards
  ORBITAL_TELEPORTER = 'orbital_teleporter',
  DATA_CRYSTAL = 'data_crystal',
  
  // Combat/Defense Cards
  PLASMA_CANNON = 'plasma_cannon',
  HOLOGRAPHIC_DECOY = 'holographic_decoy',
  
  // Resource Cards
  RESOURCE_CACHE = 'resource_cache'
}

/**
 * Result of using a tech card power
 */
export interface TechCardPowerResult {
  success: boolean;
  message?: string;
  shipValueChanged?: { shipId: string; oldValue: number; newValue: number };
  shipsRerolled?: string[];
  colonyMoved?: { from: string; to: string };
  fieldMoved?: { type: string; from: string; to: string };
  shipDestroyed?: string;
  techCardClaimed?: TechCardType;
  resourcesGained?: { fuel?: number; ore?: number };
  territoryBonusUsed?: string;
}

/**
 * Abstract base class for all tech cards
 */
export abstract class TechCard {
  readonly id: string;
  readonly type: TechCardType;
  readonly name: string;
  readonly victoryPoints: number;
  
  protected owner: Player | null;
  protected usedThisTurn: boolean;

  constructor(type: TechCardType, name: string, victoryPoints: number = 0) {
    this.id = `${type}_${Date.now()}_${Math.random()}`;
    this.type = type;
    this.name = name;
    this.victoryPoints = victoryPoints;
    this.owner = null;
    this.usedThisTurn = false;
  }

  /**
   * Get the card owner
   */
  getOwner(): Player | null {
    return this.owner;
  }

  /**
   * Set the card owner
   */
  setOwner(player: Player | null): void {
    this.owner = player;
  }

  /**
   * Check if card has been used this turn
   */
  hasBeenUsedThisTurn(): boolean {
    return this.usedThisTurn;
  }

  /**
   * Mark card as used this turn
   */
  markAsUsed(): void {
    this.usedThisTurn = true;
  }

  /**
   * Reset usage for new turn
   */
  resetForNewTurn(): void {
    this.usedThisTurn = false;
  }

  /**
   * Check if card has a usable power
   */
  abstract hasPower(): boolean;

  /**
   * Check if card has a discard power
   */
  abstract hasDiscardPower(): boolean;

  /**
   * Get fuel cost to use power
   */
  abstract getPowerCost(player: Player): number;

  /**
   * Check if player can use the power
   */
  abstract canUsePower(player: Player): boolean;

  /**
   * Check if player can use discard power
   */
  abstract canUseDiscardPower(player: Player): boolean;

  /**
   * Use the card's power (costs fuel)
   */
  abstract usePower(player: Player, ...args: any[]): TechCardPowerResult;

  /**
   * Use the card's discard power (discards card)
   */
  abstract useDiscardPower(player: Player, ...args: any[]): TechCardPowerResult;

  /**
   * Get description of the power
   */
  abstract getPowerDescription(): string;

  /**
   * Get description of the discard power
   */
  abstract getDiscardPowerDescription(): string;
}

/**
 * Simple VP tech card (no powers)
 */
export abstract class VictoryPointCard extends TechCard {
  hasPower(): boolean {
    return false;
  }

  hasDiscardPower(): boolean {
    return false;
  }

  getPowerCost(): number {
    return 0;
  }

  canUsePower(): boolean {
    return false;
  }

  canUseDiscardPower(): boolean {
    return false;
  }

  usePower(): TechCardPowerResult {
    return { success: false, message: 'This card has no power' };
  }

  useDiscardPower(): TechCardPowerResult {
    return { success: false, message: 'This card has no discard power' };
  }

  getPowerDescription(): string {
    return 'No power';
  }

  getDiscardPowerDescription(): string {
    return 'No discard power';
  }
}
