/**
 * Colony Constructor - Builds colonies quickly with 3 ships
 * 3 ships, same value
 * Pay 3 ore to place colony immediately
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

export class ColonyConstructor extends OrbitalFacility {
  constructor() {
    super('colony_constructor', 'Colony Constructor', FacilityType.COLONY_CONSTRUCTOR);
    
    // 2 dock groups with 3 ships each
    this.dockGroups = [
      this.createDockGroup('colony_constructor_group_1', 3, {
        shipCount: 3,
        valueConstraint: 'same'
      }),
      this.createDockGroup('colony_constructor_group_2', 3, {
        shipCount: 3,
        valueConstraint: 'same'
      })
    ];
  }

  canDock(player: Player, ships: Ship[], dockGroupId?: string): boolean {
    // Must be exactly 3 ships
    if (ships.length !== 3) return false;
    
    // All ships must have same value
    if (!this.validateShipValues(ships, { shipCount: 3, valueConstraint: 'same' })) {
      return false;
    }

    // Player must have 3 ore to pay
    if (player.resources.ore < 3) return false;

    // Check available dock group
    if (dockGroupId) {
      const group = this.getDockGroup(dockGroupId);
      if (!group) return false;
      const availableSpace = group.docks.filter(d => d.ship === null).length;
      return availableSpace === 3; // Must be empty
    }

    // Find any available group
    return this.dockGroups.some(group => {
      const availableSpace = group.docks.filter(d => d.ship === null).length;
      return availableSpace === 3;
    });
  }

  getDockRequirements(): DockRequirement[] {
    return [{
      shipCount: 3,
      valueConstraint: 'same'
    }];
  }

  execute(player: Player, ships: Ship[], options?: any): FacilityExecutionResult {
    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Must have 3 ships of same value and 3 ore to use Colony Constructor']
      };
    }

    return {
      success: true,
      resourcesSpent: { ore: 3 },
      colonyPlaced: true
    };
  }
}

