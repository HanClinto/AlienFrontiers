/**
 * Orbital Market - Trade fuel for ore or ore for fuel
 * 2 ships, same value
 * 
 * Trade Ratios:
 * - Fuel → Ore: Ship value fuel for 1 ore (e.g., 3 fuel → 1 ore)
 * - Ore → Fuel: 1 ore for ship value fuel (e.g., 1 ore → 3 fuel)
 * - Heinlein Plains bonus: Always 1:1 ratio (1 fuel ↔ 1 ore)
 * 
 * Can trade multiple times per turn as long as resources available
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

export interface OrbitalMarketOptions {
  direction: 'fuel-to-ore' | 'ore-to-fuel';
}

export class OrbitalMarket extends OrbitalFacility {
  constructor() {
    super('orbital_market', 'Orbital Market', FacilityType.ORBITAL_MARKET);
    
    // 2 dock groups with 2 ships each
    this.dockGroups = [
      this.createDockGroup('orbital_market_group_1', 2, {
        shipCount: 2,
        valueConstraint: 'same'
      }),
      this.createDockGroup('orbital_market_group_2', 2, {
        shipCount: 2,
        valueConstraint: 'same'
      })
    ];
  }

  canDock(player: Player, ships: Ship[], dockGroupId?: string): boolean {
    // Must be exactly 2 ships
    if (ships.length !== 2) return false;
    
    // Ships must have same value
    if (!this.validateShipValues(ships, { shipCount: 2, valueConstraint: 'same' })) {
      return false;
    }

    // Check available dock group
    if (dockGroupId) {
      const group = this.getDockGroup(dockGroupId);
      if (!group) return false;
      const availableSpace = group.docks.filter(d => d.ship === null).length;
      return availableSpace === 2; // Must be empty
    }

    // Find any available group
    return this.dockGroups.some(group => {
      const availableSpace = group.docks.filter(d => d.ship === null).length;
      return availableSpace === 2;
    });
  }

  getDockRequirements(): DockRequirement[] {
    return [{
      shipCount: 2,
      valueConstraint: 'same'
    }];
  }

  /**
   * Calculate trade ratio based on Heinlein Plains control
   * @param player Player making the trade
   * @param shipValue Value of docked ships
   * @param hasHeinleinPlains Whether player controls Heinlein Plains
   * @returns Object with fuelCost and fuelGain for each trade direction
   */
  private getTradeRatio(shipValue: number, hasHeinleinPlains: boolean): { fuelCost: number; fuelGain: number } {
    if (hasHeinleinPlains) {
      // Heinlein Plains: Always 1:1 ratio
      return { fuelCost: 1, fuelGain: 1 };
    } else {
      // Normal: Fuel cost = ship value, fuel gain = ship value
      return { fuelCost: shipValue, fuelGain: shipValue };
    }
  }

  /**
   * Execute a single trade at the Orbital Market
   * @param player Player executing the trade
   * @param ships Docked ships
   * @param options Trade options (direction)
   * @param hasHeinleinPlains Whether player controls Heinlein Plains (injected by GameState)
   */
  execute(player: Player, ships: Ship[], options?: any): FacilityExecutionResult {
    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Must have 2 ships of same value']
      };
    }

    const shipValue = ships[0].diceValue || 0;
    const hasHeinleinPlains = options?.hasHeinleinPlains || false;
    const direction = (options?.direction || 'fuel-to-ore') as 'fuel-to-ore' | 'ore-to-fuel';
    
    const ratio = this.getTradeRatio(shipValue, hasHeinleinPlains);

    if (direction === 'fuel-to-ore') {
      // Trade fuel for ore
      if (player.resources.fuel < ratio.fuelCost) {
        return {
          success: false,
          errors: [
            hasHeinleinPlains 
              ? 'Need 1 fuel to trade for 1 ore (Heinlein Plains bonus)'
              : `Need ${shipValue} fuel to trade for 1 ore`
          ]
        };
      }

      return {
        success: true,
        resourcesSpent: { fuel: ratio.fuelCost },
        resourcesGained: { ore: 1 }
      };
    } else {
      // Trade ore for fuel
      if (player.resources.ore < 1) {
        return {
          success: false,
          errors: ['Need 1 ore to trade for fuel']
        };
      }

      return {
        success: true,
        resourcesSpent: { ore: 1 },
        resourcesGained: { fuel: ratio.fuelGain }
      };
    }
  }
}
