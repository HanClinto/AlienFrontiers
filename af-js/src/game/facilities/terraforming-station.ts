/**
 * Terraforming Station - Advanced colony placement
 * 1 ship, value 6
 * Pay 1 fuel + 1 ore to place colony
 * Ship returns to stock next turn
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

export class TerraformingStation extends OrbitalFacility {
  constructor() {
    super('terraforming_station', 'Terraforming Station', FacilityType.TERRAFORMING_STATION);
    
    // Single dock requiring value 6
    this.dockGroups = [
      this.createDockGroup('terraforming_station_main', 1, {
        shipCount: 1,
        exactValue: 6
      })
    ];
  }

  canDock(player: Player, ships: Ship[], dockGroupId?: string): boolean {
    // Must be exactly 1 ship
    if (ships.length !== 1) return false;
    
    // Ship must have value 6
    const ship = ships[0];
    if (ship.diceValue !== 6) return false;

    // Player must have 1 fuel + 1 ore
    if (player.resources.fuel < 1 || player.resources.ore < 1) return false;

    // Check if dock is available
    const group = this.dockGroups[0];
    return group.docks[0].ship === null;
  }

  getDockRequirements(): DockRequirement[] {
    return [{
      shipCount: 1,
      exactValue: 6
    }];
  }

  execute(player: Player, ships: Ship[]): FacilityExecutionResult {
    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Must have 1 ship with value 6 and 1 fuel + 1 ore to use Terraforming Station']
      };
    }

    return {
      success: true,
      resourcesSpent: { fuel: 1, ore: 1 },
      colonyPlaced: true,
      shipReturned: true // Ship returns to stock next turn
    };
  }
}
