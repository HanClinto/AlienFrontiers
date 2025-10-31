/**
 * Tech Card Index
 * Central export for all tech card implementations
 */

// Base classes and types
export { 
  TechCard, 
  VictoryPointCard, 
  TechCardType, 
  TechCardPowerResult 
} from './base-tech-card';

// Victory Point Cards
export { AlienCity, AlienMonument } from './victory-point-cards';

// Die Manipulation Cards
export { 
  BoosterPod, 
  StasisBeam, 
  PolarityDevice, 
  TemporalWarper, 
  GravityManipulator 
} from './die-manipulation-cards';

// Colony Manipulation Cards
export { 
  OrbitalTeleporter, 
  DataCrystal 
} from './colony-manipulation-cards';

// Combat/Defense Cards
export { 
  PlasmaCannon, 
  HolographicDecoy 
} from './combat-defense-cards';

// Resource Cards
export { ResourceCache } from './resource-cards';
