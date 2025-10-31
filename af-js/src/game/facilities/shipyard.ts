/**
 * Shipyard - Build additional ships (4th, 5th, 6th)
 * 2 ships, same value
 * 3 dock groups (3 pairs can dock simultaneously)
 * 
 * Costs (reduced by Herbert Valley bonus):
 * - 4th ship: 1 fuel + 1 ore
 * - 5th ship: 2 fuel + 2 ore
 * - 6th ship: 3 fuel + 3 ore
 * 
 * New ship placed in Maintenance Bay, gathered next turn
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

export class Shipyard extends OrbitalFacility {
  constructor() {
    super('shipyard', 'Shipyard', FacilityType.SHIPYARD);
    
    // 3 dock groups with 2 ships each
    this.dockGroups = [
      this.createDockGroup('shipyard_group_1', 2, {
        shipCount: 2,
        valueConstraint: 'same'
      }),
      this.createDockGroup('shipyard_group_2', 2, {
        shipCount: 2,
        valueConstraint: 'same'
      }),
      this.createDockGroup('shipyard_group_3', 2, {
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
   * Calculate cost to build ship based on fleet size
   * @param currentShipCount Current number of ships player has (3-6)
   * @param hasHerbertValley Whether player controls Herbert Valley
   */
  private getShipCost(currentShipCount: number, hasHerbertValley: boolean): { fuel: number; ore: number } {
    // Determine which ship we're building (4th, 5th, or 6th)
    const shipNumber = currentShipCount + 1;
    
    let baseFuel = 0;
    let baseOre = 0;
    
    if (shipNumber === 4) {
      baseFuel = 1;
      baseOre = 1;
    } else if (shipNumber === 5) {
      baseFuel = 2;
      baseOre = 2;
    } else if (shipNumber === 6) {
      baseFuel = 3;
      baseOre = 3;
    }
    
    // Apply Herbert Valley bonus (-1 fuel, -1 ore, minimum 0)
    if (hasHerbertValley) {
      baseFuel = Math.max(0, baseFuel - 1);
      baseOre = Math.max(0, baseOre - 1);
    }
    
    return { fuel: baseFuel, ore: baseOre };
  }

  execute(player: Player, ships: Ship[], options?: any): FacilityExecutionResult {
    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Must have 2 ships of same value']
      };
    }

    // Get current ship count from options (injected by GameState)
    const currentShipCount = options?.currentShipCount || 3;
    
    // Check if player already has 6 ships (maximum)
    if (currentShipCount >= 6) {
      return {
        success: false,
        errors: ['Cannot build more than 6 ships']
      };
    }

    // Calculate cost with Herbert Valley bonus
    const hasHerbertValley = options?.hasHerbertValley || false;
    const cost = this.getShipCost(currentShipCount, hasHerbertValley);

    // Check if player has enough resources
    if (player.resources.fuel < cost.fuel || player.resources.ore < cost.ore) {
      return {
        success: false,
        errors: [
          hasHerbertValley
            ? `Need ${cost.fuel} fuel and ${cost.ore} ore (Herbert Valley bonus applied)`
            : `Need ${cost.fuel} fuel and ${cost.ore} ore`
        ]
      };
    }

    // Success: deduct resources, indicate ship should be built
    // Note: Actual ship creation handled by GameState
    return {
      success: true,
      resourcesSpent: { fuel: cost.fuel, ore: cost.ore },
      // Custom flag to indicate ship should be created
      shipReturned: false // Using existing flag, but really means "ship built"
    };
  }
}
