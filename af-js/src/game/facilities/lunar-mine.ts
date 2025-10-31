/**
 * Lunar Mine - Extracts ore from the lunar surface
 * Ships must be >= highest docked value
 * Gain 1 ore per ship
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

export class LunarMine extends OrbitalFacility {
  constructor() {
    super('lunar_mine', 'Lunar Mine', FacilityType.LUNAR_MINE);
    
    // Single dock group with 5 docks
    this.dockGroups = [
      this.createDockGroup('lunar_mine_main', 5, {
        shipCount: 'unlimited',
        valueConstraint: 'ascending'
      })
    ];
  }

  canDock(player: Player, ships: Ship[], dockGroupId?: string): boolean {
    if (ships.length === 0 || ships.length > 5) return false;
    
    // All ships must have dice values
    if (!ships.every(s => s.diceValue !== null)) return false;

    // Check available space
    const group = dockGroupId ? this.getDockGroup(dockGroupId) : this.dockGroups[0];
    if (!group) return false;

    const availableSpace = group.docks.filter(d => d.ship === null).length;
    if (availableSpace < ships.length) return false;

    // Get currently docked ships
    const dockedShips = group.docks
      .filter(d => d.ship !== null)
      .map(d => d.ship!);

    if (dockedShips.length === 0) return true;

    // Find highest currently docked value
    const maxDockedValue = Math.max(...dockedShips.map(s => s.diceValue || 0));

    // All new ships must be >= highest docked value
    return ships.every(s => (s.diceValue || 0) >= maxDockedValue);
  }

  getDockRequirements(): DockRequirement[] {
    return [{
      shipCount: 'unlimited',
      valueConstraint: 'ascending'
    }];
  }

  execute(player: Player, ships: Ship[], options?: any): FacilityExecutionResult {
    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Ships do not meet Lunar Mine requirements']
      };
    }

    // Gain 1 ore per ship
    const oreGained = ships.length;

    return {
      success: true,
      resourcesGained: { ore: oreGained }
    };
  }
}

