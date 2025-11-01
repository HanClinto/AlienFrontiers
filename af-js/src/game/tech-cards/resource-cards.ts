/**
 * Resource Generation Tech Cards
 * Cards that provide ongoing resource benefits
 */

import { TechCard, TechCardType, TechCardPowerResult } from './base-tech-card';
import { Player } from '../player';

/**
 * Resource Cache - Automatic resources based on odd/even ships
 * Power: Automatic - gain resources based on ship values after roll
 *        - More odd ships: gain 1 ore
 *        - More even ships: gain 1 fuel  
 *        - Equal odd/even: gain 1 fuel AND 1 ore, then discard this card
 * Discard: Automatically discarded when equal odd/even ships
 * 
 * NOTE: Cannot be used on turn acquired, only starts working next turn
 */
export class ResourceCache extends TechCard {
  constructor() {
    super(TechCardType.RESOURCE_CACHE, 'Resource Cache', 0, 'tech_rc');
  }

  hasPower(): boolean {
    return true; // Automatic power
  }

  hasDiscardPower(): boolean {
    return false; // Discarded automatically, not as a power
  }

  getPowerCost(): number {
    return 0; // Free automatic power
  }

  canUsePower(player: Player): boolean {
    if (this.usedThisTurn) return false;
    if (!this.owner || this.owner.id !== player.id) return false;
    return true;
  }

  canUseDiscardPower(): boolean {
    return false;
  }

  /**
   * Apply Resource Cache effect based on odd/even ship values
   * @param player The player who owns the card
   * @param ships Array of ship values to count
   * @returns Result indicating resources gained and if card should be discarded
   */
  usePower(player: Player, ships: number[]): TechCardPowerResult {
    if (!this.canUsePower(player)) {
      return { success: false, message: 'Cannot use Resource Cache power' };
    }

    // Count odd and even valued ships
    let oddCount = 0;
    let evenCount = 0;
    
    ships.forEach(value => {
      if (value % 2 === 0) {
        evenCount++;
      } else {
        oddCount++;
      }
    });

    this.markAsUsed();

    // More odd ships: gain 1 ore
    if (oddCount > evenCount) {
      player.resources.ore += 1;
      return {
        success: true,
        message: `Resource Cache: More odd ships (${oddCount} odd, ${evenCount} even) - gained 1 ore`,
        resourcesGained: { ore: 1 }
      };
    }
    
    // More even ships: gain 1 fuel
    if (evenCount > oddCount) {
      player.resources.fuel += 1;
      return {
        success: true,
        message: `Resource Cache: More even ships (${evenCount} even, ${oddCount} odd) - gained 1 fuel`,
        resourcesGained: { fuel: 1 }
      };
    }
    
    // Equal odd/even: gain 1 fuel AND 1 ore, then discard card
    player.resources.fuel += 1;
    player.resources.ore += 1;
    return {
      success: true,
      message: `Resource Cache: Equal ships (${oddCount} odd, ${evenCount} even) - gained 1 fuel and 1 ore, card discarded`,
      resourcesGained: { fuel: 1, ore: 1 },
      shouldDiscard: true
    };
  }

  useDiscardPower(): TechCardPowerResult {
    return { success: false, message: 'Resource Cache has no discard power' };
  }

  getPowerDescription(): string {
    return 'Automatic: More odd ships = 1 ore, more even ships = 1 fuel, equal = 1 fuel + 1 ore (then discard)';
  }

  getDiscardPowerDescription(): string {
    return 'Automatically discarded when rolling equal odd/even ships';
  }
}
