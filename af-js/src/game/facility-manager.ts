/**
 * Facility Manager
 * Manages all orbital facilities and their interactions
 */

import { OrbitalFacility } from './facilities/base-facility';
import { SolarConverter } from './facilities/solar-converter';
import { LunarMine } from './facilities/lunar-mine';
import { RadonCollector } from './facilities/radon-collector';
import { ColonyConstructor } from './facilities/colony-constructor';
import { TerraformingStation } from './facilities/terraforming-station';
import { ColonistHub } from './facilities/colonist-hub';
import { OrbitalMarket } from './facilities/orbital-market';
import { MaintenanceBay } from './facilities/maintenance-bay';
import { AlienArtifact } from './facilities/alien-artifact';
import { RaidersOutpost } from './facilities/raiders-outpost';
import { Player } from './player';
import { Ship } from './ship';

/**
 * Manages all orbital facilities in the game
 */
export class FacilityManager {
  private facilities: Map<string, OrbitalFacility>;

  constructor() {
    this.facilities = new Map();
    this.initializeFacilities();
  }

  /**
   * Create all facility instances
   */
  private initializeFacilities(): void {
    const facilityInstances: OrbitalFacility[] = [
      new SolarConverter(),
      new LunarMine(),
      new RadonCollector(),
      new ColonyConstructor(),
      new TerraformingStation(),
      new ColonistHub(),
      new OrbitalMarket(),
      new MaintenanceBay(),
      new AlienArtifact(),
      new RaidersOutpost()
    ];

    facilityInstances.forEach(facility => {
      this.facilities.set(facility.id, facility);
    });
  }

  /**
   * Get a facility by ID
   */
  getFacility(facilityId: string): OrbitalFacility | undefined {
    return this.facilities.get(facilityId);
  }

  /**
   * Get all facilities
   */
  getAllFacilities(): OrbitalFacility[] {
    return Array.from(this.facilities.values());
  }

  /**
   * Check if ships can dock at a facility
   */
  canDockShips(facilityId: string, player: Player, ships: Ship[], dockGroupId?: string): boolean {
    const facility = this.facilities.get(facilityId);
    if (!facility) return false;
    
    return facility.canDock(player, ships, dockGroupId);
  }

  /**
   * Dock ships at a facility
   * Returns the dock group ID where ships were placed, or null if docking failed
   */
  dockShips(facilityId: string, player: Player, ships: Ship[], dockGroupId?: string): string | null {
    const facility = this.facilities.get(facilityId);
    if (!facility) return null;
    
    return facility.dockShips(player, ships, dockGroupId);
  }

  /**
   * Execute facility action with docked ships
   */
  executeFacilityAction(facilityId: string, player: Player, ships: Ship[]) {
    const facility = this.facilities.get(facilityId);
    if (!facility) {
      return {
        success: false,
        errors: ['Facility not found']
      };
    }
    
    return facility.execute(player, ships);
  }

  /**
   * Undock ships from a facility dock group
   */
  undockShips(facilityId: string, dockGroupId: string): Ship[] {
    const facility = this.facilities.get(facilityId);
    if (!facility) return [];
    
    return facility.undockShips(dockGroupId);
  }

  /**
   * Undock all ships from all facilities for a player (e.g., at end of turn)
   */
  undockAllShips(playerId: string): Ship[] {
    const undockedShips: Ship[] = [];
    
    this.facilities.forEach(facility => {
      const dockGroups = facility.getDockGroups();
      dockGroups.forEach(group => {
        const hasPlayerShips = group.docks.some(
          dock => dock.ship !== null && dock.ship.playerId === playerId
        );
        
        if (hasPlayerShips) {
          const ships = facility.undockShips(group.id);
          undockedShips.push(...ships.filter(s => s.playerId === playerId));
        }
      });
    });
    
    return undockedShips;
  }

  /**
   * Get all docked ships for a player across all facilities
   */
  getDockedShips(playerId: string): Array<{ facilityId: string; ship: Ship }> {
    const dockedShips: Array<{ facilityId: string; ship: Ship }> = [];
    
    this.facilities.forEach(facility => {
      const dockGroups = facility.getDockGroups();
      dockGroups.forEach(group => {
        group.docks.forEach(dock => {
          if (dock.ship && dock.ship.playerId === playerId) {
            dockedShips.push({
              facilityId: facility.id,
              ship: dock.ship
            });
          }
        });
      });
    });
    
    return dockedShips;
  }

  /**
   * Get facility by ship (find which facility a ship is docked at)
   */
  getFacilityByShip(ship: Ship): OrbitalFacility | undefined {
    const facilities = Array.from(this.facilities.values());
    
    for (const facility of facilities) {
      const dockGroups = facility.getDockGroups();
      const isDockedHere = dockGroups.some(group =>
        group.docks.some(dock => dock.ship === ship)
      );
      
      if (isDockedHere) {
        return facility;
      }
    }
    
    return undefined;
  }

  /**
   * Clear all docked ships (for game reset)
   */
  clearAllDocks(): void {
    this.facilities.forEach(facility => {
      const dockGroups = facility.getDockGroups();
      dockGroups.forEach(group => {
        group.docks.forEach(dock => {
          dock.ship = null;
          dock.isLocked = false;
        });
      });
    });
  }
}
