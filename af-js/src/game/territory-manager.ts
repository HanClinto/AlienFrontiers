/**
 * Territory Manager
 * Manages all territories, bonuses, and field generators
 */

import { Territory, TerritoryType, FieldType, FieldGenerator } from './territory';
import { Player } from './player';

/**
 * Territory bonus implementations
 */
export class TerritoryBonusManager {
  /**
   * Apply Heinlein Plains bonus: Gain 1 ore
   */
  static applyHeinleinPlains(player: Player): void {
    player.resources.ore += 1;
  }

  /**
   * Apply Pohl Foothills bonus: -1 fuel cost for tech card powers
   * Note: This is checked in tech cards during getPowerCost()
   */
  static applyPohlFoothills(): void {
    // Passive bonus - handled by tech cards
  }

  /**
   * Apply Van Vogt Mountains bonus: Gain 1 fuel
   */
  static applyVanVogtMountains(player: Player): void {
    player.resources.fuel += 1;
  }

  /**
   * Apply Bradbury Plateau bonus: Re-roll all ships once
   * Note: Must be triggered by player action
   */
  static applyBradburyPlateau(): void {
    // Active bonus - must be explicitly used
  }

  /**
   * Apply Asimov Crater bonus: Gain 1 energy
   */
  static applyAsimovCrater(player: Player): void {
    player.resources.energy += 1;
  }

  /**
   * Apply Herbert Valley bonus: Free colony placement
   * Note: This is checked during colony placement
   */
  static applyHerbertValley(): void {
    // Passive bonus - handled by colony placement logic
  }

  /**
   * Apply Lem Badlands bonus: +1 to all ship values
   * Note: This is checked during facility docking
   */
  static applyLemBadlands(): void {
    // Passive bonus - handled by facility logic
  }

  /**
   * Apply Burroughs Desert bonus: Draw extra tech card
   * Note: Must be triggered when acquiring tech
   */
  static applyBurrowsDesert(): void {
    // Active bonus - handled by tech card acquisition
  }
}

/**
 * Manages all territories in the game
 */
export class TerritoryManager {
  private territories: Map<string, Territory>;
  private fieldGenerators: Map<FieldType, FieldGenerator>;

  constructor() {
    this.territories = new Map();
    this.fieldGenerators = new Map();
    this.initializeTerritories();
    this.initializeFieldGenerators();
  }

  /**
   * Create all 8 territories
   */
  private initializeTerritories(): void {
    const territoryDefs = [
      {
        type: TerritoryType.HEINLEIN_PLAINS,
        name: 'Heinlein Plains',
        maxColonies: 3,
        bonus: 'Gain 1 ore at start of turn'
      },
      {
        type: TerritoryType.POHL_FOOTHILLS,
        name: 'Pohl Foothills',
        maxColonies: 3,
        bonus: 'Tech card powers cost 1 less fuel'
      },
      {
        type: TerritoryType.VAN_VOGT_MOUNTAINS,
        name: 'Van Vogt Mountains',
        maxColonies: 3,
        bonus: 'Gain 1 fuel at start of turn'
      },
      {
        type: TerritoryType.BRADBURY_PLATEAU,
        name: 'Bradbury Plateau',
        maxColonies: 3,
        bonus: 'Re-roll all ships once per turn'
      },
      {
        type: TerritoryType.ASIMOV_CRATER,
        name: 'Asimov Crater',
        maxColonies: 3,
        bonus: 'Gain 1 energy at start of turn'
      },
      {
        type: TerritoryType.HERBERT_VALLEY,
        name: 'Herbert Valley',
        maxColonies: 3,
        bonus: 'Place colonies for free'
      },
      {
        type: TerritoryType.LEM_BADLANDS,
        name: 'Lem Badlands',
        maxColonies: 3,
        bonus: '+1 to all ship values'
      },
      {
        type: TerritoryType.BURROUGHS_DESERT,
        name: 'Burroughs Desert',
        maxColonies: 3,
        bonus: 'Draw 1 extra tech card when acquiring'
      }
    ];

    territoryDefs.forEach(def => {
      const territory = new Territory(
        def.type,
        def.name,
        def.maxColonies,
        def.bonus
      );
      this.territories.set(def.type, territory);
    });
  }

  /**
   * Create field generators
   */
  private initializeFieldGenerators(): void {
    this.fieldGenerators.set(FieldType.ISOLATION, {
      type: FieldType.ISOLATION,
      territoryId: null
    });
    this.fieldGenerators.set(FieldType.POSITRON, {
      type: FieldType.POSITRON,
      territoryId: null
    });
    this.fieldGenerators.set(FieldType.REPULSOR, {
      type: FieldType.REPULSOR,
      territoryId: null
    });
  }

  /**
   * Get a territory by ID
   */
  getTerritory(territoryId: string): Territory | undefined {
    return this.territories.get(territoryId);
  }

  /**
   * Get all territories
   */
  getAllTerritories(): Territory[] {
    return Array.from(this.territories.values());
  }

  /**
   * Get territories controlled by a player
   */
  getControlledTerritories(playerId: string): Territory[] {
    return this.getAllTerritories().filter(t => t.isControlledBy(playerId));
  }

  /**
   * Get field generator
   */
  getFieldGenerator(type: FieldType): FieldGenerator | undefined {
    return this.fieldGenerators.get(type);
  }

  /**
   * Place or move a field generator
   */
  placeFieldGenerator(type: FieldType, territoryId: string): boolean {
    const field = this.fieldGenerators.get(type);
    if (!field) return false;

    const territory = this.territories.get(territoryId);
    if (!territory) return false;

    // Remove from previous territory
    if (field.territoryId) {
      const oldTerritory = this.territories.get(field.territoryId);
      oldTerritory?.removeFieldGenerator();
    }

    // Place on new territory
    field.territoryId = territoryId;
    territory.placeFieldGenerator(field);
    return true;
  }

  /**
   * Remove a field generator
   */
  removeFieldGenerator(type: FieldType): boolean {
    const field = this.fieldGenerators.get(type);
    if (!field || !field.territoryId) return false;

    const territory = this.territories.get(field.territoryId);
    if (!territory) return false;

    territory.removeFieldGenerator();
    field.territoryId = null;
    return true;
  }

  /**
   * Apply start-of-turn bonuses for a player
   */
  applyStartOfTurnBonuses(player: Player): void {
    const controlled = this.getControlledTerritories(player.id);
    
    controlled.forEach(territory => {
      if (!territory.isBonusActive()) return;

      switch (territory.type) {
        case TerritoryType.HEINLEIN_PLAINS:
          TerritoryBonusManager.applyHeinleinPlains(player);
          break;
        case TerritoryType.VAN_VOGT_MOUNTAINS:
          TerritoryBonusManager.applyVanVogtMountains(player);
          break;
        case TerritoryType.ASIMOV_CRATER:
          TerritoryBonusManager.applyAsimovCrater(player);
          break;
      }
    });
  }

  /**
   * Check if player has Pohl Foothills bonus
   */
  hasPohlFoothillsBonus(playerId: string): boolean {
    const territory = this.territories.get(TerritoryType.POHL_FOOTHILLS);
    if (!territory) return false;
    return territory.isControlledBy(playerId) && territory.isBonusActive();
  }

  /**
   * Check if player has Lem Badlands bonus
   */
  hasLemBadlandsBonus(playerId: string): boolean {
    const territory = this.territories.get(TerritoryType.LEM_BADLANDS);
    if (!territory) return false;
    return territory.isControlledBy(playerId) && territory.isBonusActive();
  }

  /**
   * Check if player has Herbert Valley bonus
   */
  hasHerbertValleyBonus(playerId: string): boolean {
    const territory = this.territories.get(TerritoryType.HERBERT_VALLEY);
    if (!territory) return false;
    return territory.isControlledBy(playerId) && territory.isBonusActive();
  }

  /**
   * Check if player has Burroughs Desert bonus
   */
  hasBurrowsDesertBonus(playerId: string): boolean {
    const territory = this.territories.get(TerritoryType.BURROUGHS_DESERT);
    if (!territory) return false;
    return territory.isControlledBy(playerId) && territory.isBonusActive();
  }

  /**
   * Check if player has Bradbury Plateau bonus
   */
  hasBradburyPlateauBonus(playerId: string): boolean {
    const territory = this.territories.get(TerritoryType.BRADBURY_PLATEAU);
    if (!territory) return false;
    return territory.isControlledBy(playerId) && territory.isBonusActive();
  }

  /**
   * Calculate total VP from Positron Fields
   */
  getPositronVP(playerId: string): number {
    let vp = 0;
    this.getAllTerritories().forEach(territory => {
      vp += territory.getPositronVP(playerId);
    });
    return vp;
  }

  /**
   * Clone for game state cloning
   */
  clone(): TerritoryManager {
    const cloned = new TerritoryManager();
    
    // Clone territories
    this.territories.forEach((territory, id) => {
      cloned.territories.set(id, territory.clone());
    });

    // Clone field generators
    this.fieldGenerators.forEach((field, type) => {
      cloned.fieldGenerators.set(type, { ...field });
    });

    return cloned;
  }
}
