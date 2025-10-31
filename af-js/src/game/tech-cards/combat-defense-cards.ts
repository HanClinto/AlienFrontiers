/**
 * Combat and Defense Tech Cards
 * Cards for attacking opponents and defending territories
 */

import { TechCard, TechCardType, TechCardPowerResult } from './base-tech-card';
import { Player } from '../player';
import { Ship } from '../ship';

/**
 * Plasma Cannon - Destroy opponent's ship
 * Power: None
 * Discard: Destroy one opponent's ship at a facility
 */
export class PlasmaCannon extends TechCard {
  constructor() {
    super(TechCardType.PLASMA_CANNON, 'Plasma Cannon', 0);
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
    return { success: false, message: 'Plasma Cannon has no power' };
  }

  useDiscardPower(player: Player, targetShip: Ship): TechCardPowerResult {
    if (!this.canUseDiscardPower(player)) {
      return { success: false, message: 'Cannot use Plasma Cannon discard power' };
    }

    // Cannot target own ships
    if (targetShip.playerId === player.id) {
      return { success: false, message: 'Cannot target your own ships' };
    }

    // TODO: Implement ship destruction logic in GameState
    this.markAsUsed();
    
    return {
      success: true,
      message: `Destroyed ship ${targetShip.id}`,
      shipDestroyed: targetShip.id
    };
  }

  getPowerDescription(): string {
    return 'No power';
  }

  getDiscardPowerDescription(): string {
    return 'Discard to destroy one opponent\'s ship at a facility';
  }
}

/**
 * Holographic Decoy - Place Repulsor Field
 * Power: None
 * Discard: Place or move the Repulsor Field
 */
export class HolographicDecoy extends TechCard {
  constructor() {
    super(TechCardType.HOLOGRAPHIC_DECOY, 'Holographic Decoy', 0);
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
