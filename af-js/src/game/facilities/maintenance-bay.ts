/**
 * Maintenance Bay - Default safe placement
 * Unlimited docks, any ships, any values
 * No benefit, but always available
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

export class MaintenanceBay extends OrbitalFacility {
  constructor() {
    super('maintenance_bay', 'Maintenance Bay', FacilityType.MAINTENANCE_BAY);
    
    // Create a large dock group (20 docks for unlimited feel)
    this.dockGroups = [
      this.createDockGroup('maintenance_bay_main', 20, {
        shipCount: 'unlimited',
        valueConstraint: 'any'
      })
    ];
  }

  canDock(player: Player, ships: Ship[], dockGroupId?: string): boolean {
    if (ships.length === 0) return false;
    
    // All ships must have dice values
    if (!ships.every(s => s.diceValue !== null)) return false;

    // Always has space (20 docks)
    const group = this.dockGroups[0];
    const availableSpace = group.docks.filter(d => d.ship === null).length;
    return availableSpace >= ships.length;
  }

  getDockRequirements(): DockRequirement[] {
    return [{
      shipCount: 'unlimited',
      valueConstraint: 'any'
    }];
  }

  execute(player: Player, ships: Ship[]): FacilityExecutionResult {
    // No action, no benefit
    return {
      success: true
    };
  }
}
