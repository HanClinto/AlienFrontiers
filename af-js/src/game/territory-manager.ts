/**
 * Territory Manager
 * Manages all territories, bonuses, and field generators
 */

import { Territory, TerritoryType, FieldType, FieldGenerator } from './territory';
import { Player } from './player';

/**
 * Territory bonus implementations
 * These match the official Alien Frontiers rules
 */
export class TerritoryBonusManager {
  /**
   * Apply Asimov Crater bonus: +1 colony advance at Colonist Hub when docking multiple ships
   * Note: This is checked at Colonist Hub facility
   */
  static applyAsimovCrater(): void {
    // Passive bonus - handled by Colonist Hub facility
  }

  /**
   * Apply Bradbury Plateau bonus: -1 ore cost at Colony Constructor
   * Note: This is checked at Colony Constructor facility
   */
  static applyBradburyPlateau(): void {
    // Passive bonus - handled by Colony Constructor facility
  }

  /**
   * Apply Burroughs Desert bonus: Purchase Relic Ship for 1 fuel + 1 ore
   * Note: Relic Ship is a special ship that returns to territory instead of ship stock
   */
  static applyBurrowsDesert(): void {
    // Active bonus - handled by Relic Ship purchase logic
  }

  /**
   * Apply Heinlein Plains bonus: 1:1 fuel-to-ore ratio at Orbital Market
   * Note: This is checked at Orbital Market facility
   */
  static applyHeinleinPlains(): void {
    // Passive bonus - handled by Orbital Market facility
  }

  /**
   * Apply Herbert Valley bonus: -1 fuel and ore cost at Shipyard
   * Note: This is checked at Shipyard facility
   */
  static applyHerbertValley(): void {
    // Passive bonus - handled by Shipyard facility
  }

  /**
   * Apply Lem Badlands bonus: +1 fuel per ship at Solar Converter
   * Note: This is checked at Solar Converter facility
   */
  static applyLemBadlands(): void {
    // Passive bonus - handled by Solar Converter facility
  }

  /**
   * Apply Pohl Foothills bonus: -1 fuel cost for tech card powers
   * Note: This is checked in tech cards during getPowerCost()
   */
  static applyPohlFoothills(): void {
    // Passive bonus - handled by tech cards
  }

  /**
   * Apply Van Vogt Mountains bonus: First ship at Lunar Mine may be any value
   * Note: This is checked at Lunar Mine facility
   */
  static applyVanVogtMountains(): void {
    // Passive bonus - handled by Lunar Mine facility
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
   * Create all 8 territories with official rule bonuses
   */
  private initializeTerritories(): void {
    const territoryDefs = [
      {
        type: TerritoryType.ASIMOV_CRATER,
        name: 'Asimov Crater',
        maxColonies: 3,
        bonus: 'Advance colony +1 extra level when docking multiple ships at Colonist Hub'
      },
      {
        type: TerritoryType.BRADBURY_PLATEAU,
        name: 'Bradbury Plateau',
        maxColonies: 3,
        bonus: 'Pay 1 less ore at Colony Constructor'
      },
      {
        type: TerritoryType.BURROUGHS_DESERT,
        name: 'Burroughs Desert',
        maxColonies: 3,
        bonus: 'Purchase Relic Ship for 1 fuel + 1 ore'
      },
      {
        type: TerritoryType.HEINLEIN_PLAINS,
        name: 'Heinlein Plains',
        maxColonies: 3,
        bonus: 'Trading ratio is always 1:1 fuel-to-ore at Orbital Market'
      },
      {
        type: TerritoryType.HERBERT_VALLEY,
        name: 'Herbert Valley',
        maxColonies: 3,
        bonus: 'Pay 1 less fuel and ore at Shipyard'
      },
      {
        type: TerritoryType.LEM_BADLANDS,
        name: 'Lem Badlands',
        maxColonies: 3,
        bonus: 'Gain +1 fuel per ship at Solar Converter'
      },
      {
        type: TerritoryType.POHL_FOOTHILLS,
        name: 'Pohl Foothills',
        maxColonies: 3,
        bonus: 'Pay 1 less fuel for tech card powers'
      },
      {
        type: TerritoryType.VAN_VOGT_MOUNTAINS,
        name: 'Van Vogt Mountains',
        maxColonies: 3,
        bonus: 'First ship at Lunar Mine may be any value'
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
   * Note: In the official rules, bonuses are passive and checked at facilities,
   * not applied automatically at start of turn. This method is kept for 
   * potential future use but doesn't apply any bonuses currently.
   */
  applyStartOfTurnBonuses(player: Player): void {
    // Official rules don't grant automatic resources at start of turn
    // Bonuses are contextual and checked when using facilities:
    // - Asimov Crater: checked at Colonist Hub
    // - Bradbury Plateau: checked at Colony Constructor
    // - Burroughs Desert: Relic Ship purchase option
    // - Heinlein Plains: checked at Orbital Market
    // - Herbert Valley: checked at Shipyard
    // - Lem Badlands: checked at Solar Converter
    // - Pohl Foothills: checked in tech cards
    // - Van Vogt Mountains: checked at Lunar Mine
  }

  /**
   * Check if player has Heinlein Plains bonus
   */
  hasHeinleinPlainsBonus(playerId: string): boolean {
    const territory = this.territories.get(TerritoryType.HEINLEIN_PLAINS);
    if (!territory) return false;
    return territory.isControlledBy(playerId) && territory.isBonusActive();
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
   * Place a colony on a territory
   * @param playerId Player placing the colony
   * @param territoryId Territory to place colony on
   * @returns true if successful, false if not possible
   */
  placeColony(playerId: string, territoryId: string): boolean {
    const territory = this.territories.get(territoryId);
    if (!territory) return false;
    
    return territory.placeColony(playerId);
  }

  /**
   * Check if a colony can be placed on a territory
   * @param playerId Player attempting to place colony
   * @param territoryId Territory to check
   * @returns true if placement is possible
   */
  canPlaceColony(playerId: string, territoryId: string): boolean {
    const territory = this.territories.get(territoryId);
    if (!territory) return false;
    
    return territory.canPlaceColony(playerId);
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
