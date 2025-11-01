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

  canDock(player: Player, ships: Ship[], dockGroupId?: string, options?: any): boolean {
    // Must be exactly 3 ships
    if (ships.length !== 3) return false;
    
    // All ships must have same value
    if (!this.validateShipValues(ships, { shipCount: 3, valueConstraint: 'same' })) {
      return false;
    }

    // Player must have ore to pay (2 with Bradbury Plateau, 3 normally)
    const oreCost = options?.hasBradburyPlateau ? 2 : 3;
    if (player.resources.ore < oreCost) return false;

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
    // Calculate ore cost with Bradbury Plateau bonus
    let oreCost = 3;
    if (options?.hasBradburyPlateau) {
      oreCost = 2; // Official rules: -1 ore cost
    }

    // Check resources (use dynamic cost for final check)
    if (player.resources.ore < oreCost) {
      return {
        success: false,
        errors: [`Need ${oreCost} ore to use Colony Constructor`]
      };
    }

    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Must have 3 ships of same value to use Colony Constructor']
      };
    }

    return {
      success: true,
      resourcesSpent: { ore: oreCost },
      colonyPlaced: true
    };
  }
}

