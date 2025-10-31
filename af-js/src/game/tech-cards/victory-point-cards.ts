/**
 * Victory Point Tech Cards
 * Alien City and Alien Monument - Simple VP cards with no powers
 */

import { VictoryPointCard, TechCardType } from './base-tech-card';

/**
 * Alien City - 1 Victory Point
 */
export class AlienCity extends VictoryPointCard {
  constructor() {
    super(TechCardType.ALIEN_CITY, 'Alien City', 1);
  }
}

/**
 * Alien Monument - 1 Victory Point
 */
export class AlienMonument extends VictoryPointCard {
  constructor() {
    super(TechCardType.ALIEN_MONUMENT, 'Alien Monument', 1);
  }
}
