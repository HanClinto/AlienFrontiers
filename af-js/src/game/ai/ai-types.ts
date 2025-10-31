/**
 * AI Types and Difficulty Levels
 */

/**
 * AI difficulty levels
 * Based on original game personalities
 */
export enum AIDifficulty {
  CADET = 'cadet',       // Easy - Simple heuristics, makes mistakes
  SPACER = 'spacer',     // Medium - Better evaluation, moderate lookahead
  PIRATE = 'pirate',     // Hard - Aggressive, favors raids and attacks
  ADMIRAL = 'admiral'    // Expert - Deep search, optimal play
}

/**
 * AI personality traits
 * Affects decision-making weights
 */
export interface AIPersonality {
  difficulty: AIDifficulty;
  
  // Value weights (how AI scores different aspects)
  valueShip: number;              // Value of having a ship
  valueShipPerTurn: number;       // Value per turn (ship investment)
  valueFuel: number;              // Fuel resource value
  valueOre: number;               // Ore resource value
  valueEnergy: number;            // Energy resource value
  valueColony: number;            // Value of placed colony
  valueVP: number;                // Victory point value
  valueTech: number;              // Base tech card value
  valueTechPerTurn: number;       // Tech card value per turn
  valueTechVP: number;            // VP in tech cards (vulnerable)
  
  // Behavioral traits
  aggression: number;             // How much to hurt opponents (0-1)
  riskTolerance: number;          // Willingness to take risks (0-1)
  planningDepth: number;          // Turns to look ahead
  thinkingTimeMs: number;         // Max time to think (milliseconds)
  
  // Strategic preferences
  favorDieManipulation: number;   // Preference for die manipulation cards
  favorRaiding: number;           // Preference for raiding
  favorTerritories: number;       // Focus on territory control
}

/**
 * Get AI personality for difficulty level
 */
export function getAIPersonality(difficulty: AIDifficulty): AIPersonality {
  const base: AIPersonality = {
    difficulty,
    // Base values from iOS implementation
    valueShip: 11,
    valueShipPerTurn: 0.25,
    valueFuel: 0.30,
    valueOre: 0.9,
    valueEnergy: 0.5,
    valueColony: 12,
    valueVP: 1,
    valueTech: 0.25,
    valueTechPerTurn: 0.1,
    valueTechVP: -1,
    aggression: 0.5,
    riskTolerance: 0.5,
    planningDepth: 1,
    thinkingTimeMs: 1000,
    favorDieManipulation: 1.0,
    favorRaiding: 0.5,
    favorTerritories: 1.0
  };

  switch (difficulty) {
    case AIDifficulty.CADET:
      return {
        ...base,
        planningDepth: 0,         // No lookahead, just immediate value
        thinkingTimeMs: 500,      // Quick decisions
        aggression: 0.3,          // Less aggressive
        riskTolerance: 0.3,       // Conservative
        valueVP: 0.8,             // Slightly undervalues VPs
      };

    case AIDifficulty.SPACER:
      return {
        ...base,
        planningDepth: 1,         // 1-move lookahead
        thinkingTimeMs: 2000,     // Moderate thinking
        aggression: 0.5,          // Balanced
        riskTolerance: 0.5,       // Moderate risk
      };

    case AIDifficulty.PIRATE:
      return {
        ...base,
        planningDepth: 2,         // 2-move lookahead
        thinkingTimeMs: 3000,     // More thinking
        aggression: 0.9,          // Highly aggressive
        riskTolerance: 0.7,       // Willing to take risks
        favorRaiding: 1.5,        // Loves raiding
        valueOre: 0.7,            // Values ore less (prefers raiding)
      };

    case AIDifficulty.ADMIRAL:
      return {
        ...base,
        planningDepth: 3,         // 3-move lookahead
        thinkingTimeMs: 5000,     // Deep thinking
        aggression: 0.7,          // Strategic aggression
        riskTolerance: 0.4,       // Calculated risks
        valueVP: 1.2,             // Properly values VPs
        favorTerritories: 1.5,    // Strong territory focus
      };

    default:
      return base;
  }
}

/**
 * AI decision types
 */
export enum AIDecisionType {
  SHIP_PLACEMENT = 'ship_placement',
  TECH_CARD_USE = 'tech_card_use',
  TECH_CARD_DISCARD = 'tech_card_discard',
  COLONY_PLACEMENT = 'colony_placement',
  RESOURCE_TRADE = 'resource_trade',
  SHIP_PURCHASE = 'ship_purchase'
}

/**
 * AI decision result
 */
export interface AIDecision {
  type: AIDecisionType;
  value: number;              // Expected value of this decision
  data: any;                  // Decision-specific data
  reasoning?: string;         // Human-readable explanation
}
