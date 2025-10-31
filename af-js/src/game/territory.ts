/**
 * Territory System
 * Manages territories, colony placement, and majority control
 */

/**
 * Territory types with unique bonuses
 */
export enum TerritoryType {
  HEINLEIN_PLAINS = 'heinlein_plains',
  POHL_FOOTHILLS = 'pohl_foothills',
  VAN_VOGT_MOUNTAINS = 'van_vogt_mountains',
  BRADBURY_PLATEAU = 'bradbury_plateau',
  ASIMOV_CRATER = 'asimov_crater',
  HERBERT_VALLEY = 'herbert_valley',
  LEM_BADLANDS = 'lem_badlands',
  BURROUGHS_DESERT = 'burroughs_desert'
}

/**
 * Field generator types
 */
export enum FieldType {
  ISOLATION = 'isolation',     // Nullifies territory bonus
  POSITRON = 'positron',       // +1 VP to controlling player
  REPULSOR = 'repulsor'        // Prevents colony placement
}

/**
 * Colony on a territory
 */
export interface Colony {
  playerId: string;
  territoryId: string;
}

/**
 * Field generator placement
 */
export interface FieldGenerator {
  type: FieldType;
  territoryId: string | null; // null if not placed
}

/**
 * Territory bonus definition
 */
export interface TerritoryBonus {
  type: TerritoryType;
  name: string;
  description: string;
  apply: (playerId: string) => void; // Callback to apply bonus
}

/**
 * Individual territory
 */
export class Territory {
  readonly id: string;
  readonly type: TerritoryType;
  readonly name: string;
  readonly maxColonies: number;
  readonly bonusDescription: string;
  
  private colonies: Colony[];
  private fieldGenerator: FieldGenerator | null;
  private controllingPlayer: string | null;

  constructor(
    type: TerritoryType,
    name: string,
    maxColonies: number,
    bonusDescription: string
  ) {
    this.id = type;
    this.type = type;
    this.name = name;
    this.maxColonies = maxColonies;
    this.bonusDescription = bonusDescription;
    this.colonies = [];
    this.fieldGenerator = null;
    this.controllingPlayer = null;
  }

  /**
   * Get all colonies on this territory
   */
  getColonies(): Colony[] {
    return [...this.colonies];
  }

  /**
   * Get colonies for a specific player
   */
  getPlayerColonies(playerId: string): Colony[] {
    return this.colonies.filter(c => c.playerId === playerId);
  }

  /**
   * Get colony count for a player
   */
  getPlayerColonyCount(playerId: string): number {
    return this.colonies.filter(c => c.playerId === playerId).length;
  }

  /**
   * Check if territory is full
   */
  isFull(): boolean {
    return this.colonies.length >= this.maxColonies;
  }

  /**
   * Check if a Repulsor Field blocks placement
   */
  hasRepulsorField(): boolean {
    return this.fieldGenerator?.type === FieldType.REPULSOR;
  }

  /**
   * Check if can place colony
   */
  canPlaceColony(playerId: string): boolean {
    if (this.isFull()) return false;
    if (this.hasRepulsorField()) return false;
    return true;
  }

  /**
   * Place a colony on this territory
   */
  placeColony(playerId: string): boolean {
    if (!this.canPlaceColony(playerId)) return false;

    this.colonies.push({
      playerId,
      territoryId: this.id
    });

    this.updateControl();
    return true;
  }

  /**
   * Remove a colony from this territory
   */
  removeColony(playerId: string): boolean {
    const index = this.colonies.findIndex(c => c.playerId === playerId);
    if (index === -1) return false;

    this.colonies.splice(index, 1);
    this.updateControl();
    return true;
  }

  /**
   * Move a colony from this territory to another
   */
  moveColonyTo(playerId: string, targetTerritory: Territory): boolean {
    if (!this.getPlayerColonies(playerId).length) return false;
    if (!targetTerritory.canPlaceColony(playerId)) return false;

    this.removeColony(playerId);
    targetTerritory.placeColony(playerId);
    return true;
  }

  /**
   * Swap two colonies on this territory
   */
  swapColonies(player1Id: string, player2Id: string): boolean {
    const p1Colony = this.colonies.find(c => c.playerId === player1Id);
    const p2Colony = this.colonies.find(c => c.playerId === player2Id);

    if (!p1Colony || !p2Colony) return false;

    p1Colony.playerId = player2Id;
    p2Colony.playerId = player1Id;

    this.updateControl();
    return true;
  }

  /**
   * Calculate which player has majority control
   */
  private updateControl(): void {
    const counts = new Map<string, number>();
    
    this.colonies.forEach(colony => {
      counts.set(colony.playerId, (counts.get(colony.playerId) || 0) + 1);
    });

    let maxCount = 0;
    let leader: string | null = null;
    let tie = false;

    counts.forEach((count, playerId) => {
      if (count > maxCount) {
        maxCount = count;
        leader = playerId;
        tie = false;
      } else if (count === maxCount) {
        tie = true;
      }
    });

    this.controllingPlayer = tie ? null : leader;
  }

  /**
   * Get the controlling player (null if tie or no colonies)
   */
  getControllingPlayer(): string | null {
    return this.controllingPlayer;
  }

  /**
   * Check if a player controls this territory
   */
  isControlledBy(playerId: string): boolean {
    return this.controllingPlayer === playerId;
  }

  /**
   * Check if territory bonus is active
   */
  isBonusActive(): boolean {
    if (!this.controllingPlayer) return false;
    if (this.fieldGenerator?.type === FieldType.ISOLATION) return false;
    return true;
  }

  /**
   * Place or move a field generator
   */
  placeFieldGenerator(field: FieldGenerator): void {
    this.fieldGenerator = field;
  }

  /**
   * Remove field generator
   */
  removeFieldGenerator(): FieldGenerator | null {
    const field = this.fieldGenerator;
    this.fieldGenerator = null;
    return field;
  }

  /**
   * Get current field generator
   */
  getFieldGenerator(): FieldGenerator | null {
    return this.fieldGenerator;
  }

  /**
   * Get bonus VP from Positron Field
   */
  getPositronVP(playerId: string): number {
    if (!this.isControlledBy(playerId)) return 0;
    if (this.fieldGenerator?.type !== FieldType.POSITRON) return 0;
    return 1;
  }

  /**
   * Clone for game state cloning
   */
  clone(): Territory {
    const cloned = new Territory(
      this.type,
      this.name,
      this.maxColonies,
      this.bonusDescription
    );
    cloned.colonies = [...this.colonies];
    cloned.fieldGenerator = this.fieldGenerator ? { ...this.fieldGenerator } : null;
    cloned.controllingPlayer = this.controllingPlayer;
    return cloned;
  }
}
