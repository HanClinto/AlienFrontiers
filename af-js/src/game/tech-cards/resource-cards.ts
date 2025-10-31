/**
 * Resource Generation Tech Cards
 * Cards that provide ongoing resource benefits
 */

import { TechCard, TechCardType, TechCardPowerResult } from './base-tech-card';
import { Player } from '../player';

/**
 * Resource Cache - Gain fuel or ore each turn
 * Power: Gain 1 fuel OR 1 ore (your choice) each turn
 * Discard: None
 */
export class ResourceCache extends TechCard {
  constructor() {
    super(TechCardType.RESOURCE_CACHE, 'Resource Cache', 0);
  }

  hasPower(): boolean {
    return true;
  }

  hasDiscardPower(): boolean {
    return false;
  }

  getPowerCost(): number {
    return 0; // Free power
  }

  canUsePower(player: Player): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    return true;
  }

  canUseDiscardPower(): boolean {
    return false;
  }

  usePower(player: Player, resourceType: 'fuel' | 'ore'): TechCardPowerResult {
    if (!this.canUsePower(player)) {
      return { success: false, message: 'Cannot use Resource Cache power' };
    }

    if (resourceType === 'fuel') {
      player.resources.fuel += 1;
      this.markAsUsed();
      return {
        success: true,
        message: 'Gained 1 fuel from Resource Cache',
        resourcesGained: { fuel: 1 }
      };
    } else if (resourceType === 'ore') {
      player.resources.ore += 1;
      this.markAsUsed();
      return {
        success: true,
        message: 'Gained 1 ore from Resource Cache',
        resourcesGained: { ore: 1 }
      };
    }

    return { success: false, message: 'Invalid resource type' };
  }

  useDiscardPower(): TechCardPowerResult {
    return { success: false, message: 'Resource Cache has no discard power' };
  }

  getPowerDescription(): string {
    return 'Gain 1 fuel OR 1 ore (your choice) each turn';
  }

  getDiscardPowerDescription(): string {
    return 'No discard power';
  }
}
