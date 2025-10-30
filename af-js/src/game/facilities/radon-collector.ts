/**
 * Radon Collector - Collects radon gas for fuel
 * Ships with value 1 or 2
 * Gain 1 fuel per ship
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

export class RadonCollector extends OrbitalFacility {
  constructor() {
    super('radon_collector', 'Radon Collector', FacilityType.RADON_COLLECTOR);
    
    // Single dock group with 3 docks
    this.dockGroups = [
      this.createDockGroup('radon_collector_main', 3, {
        shipCount: 'unlimited',
        valueConstraint: 'any',
        maxValue: 2
      })
    ];
  }

  canDock(player: Player, ships: Ship[], dockGroupId?: string): boolean {
    if (ships.length === 0 || ships.length > 3) return false;
    
    // All ships must have dice values of 1 or 2
    if (!ships.every(s => s.diceValue === 1 || s.diceValue === 2)) return false;

    // Check available space
    const group = dockGroupId ? this.getDockGroup(dockGroupId) : this.dockGroups[0];
    if (!group) return false;

    const availableSpace = group.docks.filter(d => d.ship === null).length;
    return availableSpace >= ships.length;
  }

  getDockRequirements(): DockRequirement[] {
    return [{
      shipCount: 'unlimited',
      valueConstraint: 'any',
      maxValue: 2
    }];
  }

  execute(player: Player, ships: Ship[]): FacilityExecutionResult {
    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Ships do not meet Radon Collector requirements (must be value 1 or 2)']
      };
    }

    // Gain 1 fuel per ship
    const fuelGained = ships.length;

    return {
      success: true,
      resourcesGained: { fuel: fuelGained }
    };
  }
}
