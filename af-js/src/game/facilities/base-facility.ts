/**
 * Facility type definitions and interfaces
 */

import { Ship } from '../ship';
import { Player } from '../player';
import { Resources } from '../types';

/**
 * Facility identifiers
 */
export enum FacilityType {
  SOLAR_CONVERTER = 'solar_converter',
  LUNAR_MINE = 'lunar_mine',
  RADON_COLLECTOR = 'radon_collector',
  COLONIST_HUB = 'colonist_hub',
  COLONY_CONSTRUCTOR = 'colony_constructor',
  TERRAFORMING_STATION = 'terraforming_station',
  ORBITAL_MARKET = 'orbital_market',
  RAIDERS_OUTPOST = 'raiders_outpost',
  ALIEN_ARTIFACT = 'alien_artifact',
  MAINTENANCE_BAY = 'maintenance_bay'
}

/**
 * Dock requirement types
 */
export interface DockRequirement {
  shipCount: number | 'unlimited'; // Number of ships required
  valueConstraint?: 'same' | 'sequential' | 'ascending' | 'any'; // How values must relate
  exactValue?: number; // Specific value required (e.g., 6 for Terraforming)
  minValue?: number; // Minimum value required
  maxValue?: number; // Maximum value required
}

/**
 * Individual dock in a facility
 */
export interface Dock {
  index: number;
  ship: Ship | null;
  isLocked: boolean;
}

/**
 * Group of docks with shared requirements
 */
export interface DockGroup {
  id: string;
  facilityId: string;
  docks: Dock[];
  requirement: DockRequirement;
  maxCapacity: number;
}

/**
 * Result of facility execution
 */
export interface FacilityExecutionResult {
  success: boolean;
  resourcesGained?: Partial<Resources>;
  resourcesSpent?: Partial<Resources>;
  colonyPlaced?: boolean;
  shipReturned?: boolean; // Ship returns to stock (Terraforming)
  advancementMade?: number; // Track advancement (Colonist Hub)
  errors?: string[];
}

/**
 * Abstract base class for all orbital facilities
 */
export abstract class OrbitalFacility {
  readonly id: string;
  readonly name: string;
  readonly type: FacilityType;
  protected dockGroups: DockGroup[];

  constructor(id: string, name: string, type: FacilityType) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.dockGroups = [];
  }

  /**
   * Get all dock groups for this facility
   */
  getDockGroups(): DockGroup[] {
    return this.dockGroups;
  }

  /**
   * Get a specific dock group by ID
   */
  getDockGroup(groupId: string): DockGroup | undefined {
    return this.dockGroups.find(g => g.id === groupId);
  }

  /**
   * Check if ships can be docked at this facility
   */
  abstract canDock(player: Player, ships: Ship[], dockGroupId?: string): boolean;

  /**
   * Get docking requirements for this facility
   */
  abstract getDockRequirements(): DockRequirement[];

  /**
   * Execute the facility's action with docked ships
   */
  abstract execute(player: Player, ships: Ship[]): FacilityExecutionResult;

  /**
   * Dock ships at this facility
   * Returns the dock group ID where ships were placed
   */
  dockShips(player: Player, ships: Ship[], dockGroupId?: string): string | null {
    if (!this.canDock(player, ships, dockGroupId)) {
      return null;
    }

    // Find available dock group
    let targetGroup: DockGroup | undefined;
    
    if (dockGroupId) {
      targetGroup = this.getDockGroup(dockGroupId);
    } else {
      // Find first available group with enough space
      targetGroup = this.dockGroups.find(group => {
        const availableDocks = group.docks.filter(d => d.ship === null).length;
        return availableDocks >= ships.length;
      });
    }

    if (!targetGroup) {
      return null;
    }

    // Place ships in docks
    let shipIndex = 0;
    for (let dock of targetGroup.docks) {
      if (dock.ship === null && shipIndex < ships.length) {
        dock.ship = ships[shipIndex];
        shipIndex++;
      }
    }

    return targetGroup.id;
  }

  /**
   * Undock all ships from a dock group
   */
  undockShips(dockGroupId: string): Ship[] {
    const group = this.getDockGroup(dockGroupId);
    if (!group) return [];

    const ships: Ship[] = [];
    group.docks.forEach(dock => {
      if (dock.ship) {
        ships.push(dock.ship);
        dock.ship = null;
        dock.isLocked = false;
      }
    });

    return ships;
  }

  /**
   * Get all ships currently docked at this facility
   */
  getDockedShips(): Ship[] {
    const ships: Ship[] = [];
    this.dockGroups.forEach(group => {
      group.docks.forEach(dock => {
        if (dock.ship) {
          ships.push(dock.ship);
        }
      });
    });
    return ships;
  }

  /**
   * Clear all docks (end of turn)
   */
  clearAllDocks(): void {
    this.dockGroups.forEach(group => {
      group.docks.forEach(dock => {
        dock.ship = null;
        dock.isLocked = false;
      });
    });
  }

  /**
   * Validate ship values meet requirement
   */
  protected validateShipValues(ships: Ship[], requirement: DockRequirement): boolean {
    if (ships.length === 0) return false;

    const values = ships.map(s => s.diceValue).filter((v): v is NonNullable<typeof v> => v !== null);
    if (values.length !== ships.length) return false; // All ships must have values

    // Check exact value requirement
    if (requirement.exactValue !== undefined) {
      return values.every(v => v === requirement.exactValue);
    }

    // Check value constraint
    switch (requirement.valueConstraint) {
      case 'same':
        return values.every(v => v === values[0]);
      
      case 'sequential':
        const sorted = [...values].sort((a, b) => a - b);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] !== sorted[i - 1] + 1) return false;
        }
        return true;
      
      case 'ascending':
        for (let i = 1; i < values.length; i++) {
          if (values[i] <= values[i - 1]) return false;
        }
        return true;
      
      case 'any':
      default:
        return true;
    }
  }

  /**
   * Create a dock group
   */
  protected createDockGroup(
    groupId: string,
    capacity: number,
    requirement: DockRequirement
  ): DockGroup {
    const docks: Dock[] = [];
    for (let i = 0; i < capacity; i++) {
      docks.push({
        index: i,
        ship: null,
        isLocked: false
      });
    }

    return {
      id: groupId,
      facilityId: this.id,
      docks,
      requirement,
      maxCapacity: capacity
    };
  }
}
