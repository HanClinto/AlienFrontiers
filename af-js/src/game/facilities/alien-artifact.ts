/**
 * Alien Artifact - Acquire alien technology
 * Any ships, any values
 * Total > 7: claim 1 alien tech card
 * Each ship: option to cycle display (discard 3, draw 3)
 * Max 4 docks
 */

import { OrbitalFacility, FacilityType, DockRequirement, FacilityExecutionResult } from './base-facility';
import { Player } from '../player';
import { Ship } from '../ship';

export class AlienArtifact extends OrbitalFacility {
  constructor() {
    super('alien_artifact', 'Alien Artifact', FacilityType.ALIEN_ARTIFACT);
    
    // Single dock group with 4 docks
    this.dockGroups = [
      this.createDockGroup('alien_artifact_main', 4, {
        shipCount: 'unlimited',
        valueConstraint: 'any'
      })
    ];
  }

  canDock(player: Player, ships: Ship[], dockGroupId?: string): boolean {
    if (ships.length === 0 || ships.length > 4) return false;
    
    // All ships must have dice values
    if (!ships.every(s => s.diceValue !== null)) return false;

    // Check available space
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

  /**
   * Calculate total ship value
   */
  private getTotalValue(ships: Ship[]): number {
    return ships.reduce((sum, ship) => sum + (ship.diceValue || 0), 0);
  }

  execute(player: Player, ships: Ship[]): FacilityExecutionResult {
    if (!this.canDock(player, ships)) {
      return {
        success: false,
        errors: ['Invalid ship configuration for Alien Artifact']
      };
    }

    const totalValue = this.getTotalValue(ships);
    
    // Can claim tech card if total > 7
    const canClaimCard = totalValue > 7;

    return {
      success: true,
      // Note: Actual alien tech card acquisition handled in GameState
      // This just indicates eligibility
      resourcesGained: canClaimCard ? { energy: 1 } : undefined // Placeholder for card claim
    };
  }

  /**
   * Check if ships can claim an alien tech card
   */
  canClaimTechCard(ships: Ship[]): boolean {
    return this.getTotalValue(ships) > 7;
  }
}
