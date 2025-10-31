/**
 * Raiders' Outpost - Steal resources or alien tech
 * 3 ships, sequential values (e.g., 2-3-4)
 * Steal 4 total resources OR 1 alien tech card
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

export class RaidersOutpost extends OrbitalFacility {
  constructor() {
    super('raiders_outpost', 'Raiders\' Outpost', FacilityType.RAIDERS_OUTPOST);
    
    // Single dock group requiring 3 sequential ships
    this.dockGroups = [
      this.createDockGroup('raiders_outpost_main', 3, {
        shipCount: 3,
        valueConstraint: 'sequential'
      })
    ];
  }

  canDock(player: Player, ships: Ship[], dockGroupId?: string): boolean {
    // Must be exactly 3 ships
    if (ships.length !== 3) return false;
    
    // Ships must be sequential values (e.g., 2-3-4, 4-5-6)
    if (!this.validateShipValues(ships, { shipCount: 3, valueConstraint: 'sequential' })) {
      return false;
    }

    // Check if dock is available
    const group = this.dockGroups[0];
    const availableSpace = group.docks.filter(d => d.ship === null).length;
    return availableSpace === 3; // Must be empty
  }

  getDockRequirements(): DockRequirement[] {
    return [{
      shipCount: 3,
      valueConstraint: 'sequential'
    }];
  }

  execute(player: Player, ships: Ship[], options?: any): FacilityExecutionResult {
    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Must have 3 ships with sequential values (e.g., 2-3-4)']
      };
    }

    // Player can steal 4 resources OR 1 alien tech card
    // Choice handled in game state layer
    return {
      success: true,
      // resourcesGained will be set based on player choice
      // For now, indicate eligibility
      resourcesGained: { energy: 1 } // Placeholder for raid success
    };
  }

  /**
   * Check if current docked ships have lower sequence than new ships
   * Used for bumping mechanics
   */
  canBumpDockedShips(newShips: Ship[]): boolean {
    const dockedShips = this.getDockedShips();
    if (dockedShips.length === 0) return false;

    const newValues = newShips.map(s => s.diceValue || 0).sort((a, b) => a - b);
    const dockedValues = dockedShips.map(s => s.diceValue || 0).sort((a, b) => a - b);

    // New sequence must start with higher value than docked sequence
    return newValues[0] > dockedValues[0];
  }
}

