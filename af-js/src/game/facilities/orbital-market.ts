/**
 * Orbital Market - Trade fuel for ore
 * 2 ships, same value
 * Trade fuel (equal to ship value) for 1 ore
 * Can trade multiple times per turn
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

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

    // Player must have fuel equal to ship value
    const shipValue = ships[0].diceValue || 0;
    if (player.resources.fuel < shipValue) return false;

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

  execute(player: Player, ships: Ship[]): FacilityExecutionResult {
    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Must have 2 ships of same value and fuel equal to ship value']
      };
    }

    const shipValue = ships[0].diceValue || 0;

    return {
      success: true,
      resourcesSpent: { fuel: shipValue },
      resourcesGained: { ore: 1 }
    };
  }
}
