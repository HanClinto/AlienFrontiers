/**
 * Core type definitions for Alien Frontiers game state
 * These types form the foundation of the game's data model
 */

/**
 * Turn phases in order of execution
 */
export enum TurnPhase {
  ROLL_DICE = 'ROLL_DICE',
  PLACE_SHIPS = 'PLACE_SHIPS',
  RESOLVE_ACTIONS = 'RESOLVE_ACTIONS',
  COLLECT_RESOURCES = 'COLLECT_RESOURCES',
  PURCHASE = 'PURCHASE',
  END_TURN = 'END_TURN'
}

/**
 * Player resources
 */
export interface Resources {
  ore: number;
  fuel: number;
  energy: number;
}

/**
 * Ship placement locations
 */
export type ShipLocation = 
  | 'solar_converter'
  | 'lunar_mine'
  | 'radon_collector'
  | 'colony_constructor'
  | 'colonist_hub'
  | 'terraforming_station'
  | 'orbital_market'
  | 'alien_artifact'
  | null; // null = in player's pool

/**
 * Dice value (1-6)
 */
export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Player colors
 */
export enum PlayerColor {
  RED = 'red',
  BLUE = 'blue',
  GREEN = 'green',
  YELLOW = 'yellow',
  PURPLE = 'purple'
}

/**
 * Colony locations on the planet
 */
export enum ColonyLocation {
  ASIMOV_CRATER = 'asimov_crater',
  BURROUGHS_DESERT = 'burroughs_desert',
  HEINLEIN_PLAINS = 'heinlein_plains',
  BRADBURY_PLATEAU = 'bradbury_plateau',
  CLARKE_MOUNTAINS = 'clarke_mountains',
  NIVEN_VALLEY = 'niven_valley',
  HERBERT_VALLEY = 'herbert_valley'
}

/**
 * Alien tech card categories
 */
export enum AlienTechCategory {
  ARTIFACT = 'artifact',
  SHIP = 'ship',
  COLONY = 'colony',
  POWER = 'power'
}

/**
 * Game phase tracking
 */
export interface GamePhase {
  current: TurnPhase;
  activePlayerId: string;
  roundNumber: number;
}

/**
 * Victory point tracking
 */
export interface VictoryPoints {
  colonies: number;
  alienTech: number;
  territories: number;
  bonuses: number;
  total: number;
}
