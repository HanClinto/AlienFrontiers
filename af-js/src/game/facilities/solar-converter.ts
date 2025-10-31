/**
 * Solar Converter - Converts solar energy to fuel
 * Any number of ships, any value
 * Gain fuel = ceil(shipValue / 2) per ship
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

export class SolarConverter extends OrbitalFacility {
  constructor() {
    super('solar_converter', 'Solar Converter', FacilityType.SOLAR_CONVERTER);
    
    // Single dock group with 5 docks
    this.dockGroups = [
      this.createDockGroup('solar_converter_main', 5, {
        shipCount: 'unlimited',
        valueConstraint: 'any'
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
    return availableSpace >= ships.length;
  }

  getDockRequirements(): DockRequirement[] {
    return [{
      shipCount: 'unlimited',
      valueConstraint: 'any'
    }];
  }

  execute(player: Player, ships: Ship[], options?: any): FacilityExecutionResult {
    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Ships do not meet Solar Converter requirements']
      };
    }

    // Calculate fuel gained: ceil(value / 2) per ship
    let fuelGained = 0;
    ships.forEach(ship => {
      if (ship.diceValue) {
        fuelGained += Math.ceil(ship.diceValue / 2);
      }
    });

    return {
      success: true,
      resourcesGained: { fuel: fuelGained }
    };
  }
}

