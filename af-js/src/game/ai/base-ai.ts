/**
 * Base AI Player
 * Abstract class for AI decision-making
 */

import { GameState } from '../game-state';
import { Player } from '../player';
import { AIPersonality, AIDifficulty, AIDecision, AIDecisionType, getAIPersonality } from './ai-types';
import { GameStateEvaluator } from './evaluator';

/**
 * Base AI player class
 * Subclasses implement specific decision strategies
 */
export abstract class BaseAI {
  protected personality: AIPersonality;
  protected evaluator: GameStateEvaluator;

  constructor(difficulty: AIDifficulty) {
    this.personality = getAIPersonality(difficulty);
    this.evaluator = new GameStateEvaluator(this.personality);
  }

  /**
   * Get AI personality
   */
  getPersonality(): AIPersonality {
    return { ...this.personality };
  }

  /**
   * Make all decisions for a complete turn
   * Returns list of decisions to execute
   */
  abstract planTurn(gameState: GameState, playerId: string): AIDecision[];

  /**
   * Decide where to place ships at facilities
   */
  abstract decideShipPlacements(gameState: GameState, playerId: string): AIDecision[];

  /**
   * Decide whether to use tech card powers
   */
  abstract decideTechCardUsage(gameState: GameState, playerId: string): AIDecision[];

  /**
   * Decide where to place colonies
   */
  abstract decideColonyPlacement(gameState: GameState, playerId: string): AIDecision | null;

  /**
   * Evaluate current position
   */
  evaluatePosition(gameState: GameState, playerId: string): number {
    return this.evaluator.evaluate(gameState, playerId);
  }

  /**
   * Find best decision among options
   */
  protected findBestDecision(decisions: AIDecision[]): AIDecision | null {
    if (decisions.length === 0) return null;
    
    return decisions.reduce((best, current) => 
      current.value > best.value ? current : best
    );
  }

  /**
   * Get player object
   */
  protected getPlayer(gameState: GameState, playerId: string): Player {
    const player = gameState.getAllPlayers().find(p => p.id === playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }
    return player;
  }
}

/**
 * Simple heuristic AI
 * Makes decisions based on immediate value without lookahead
 */
export class HeuristicAI extends BaseAI {
  /**
   * Plan complete turn using greedy heuristics
   */
  planTurn(gameState: GameState, playerId: string): AIDecision[] {
    const decisions: AIDecision[] = [];

    // 1. Decide ship placements
    decisions.push(...this.decideShipPlacements(gameState, playerId));

    // 2. Decide tech card usage
    decisions.push(...this.decideTechCardUsage(gameState, playerId));

    // 3. Decide colony placement (if applicable)
    const colonyDecision = this.decideColonyPlacement(gameState, playerId);
    if (colonyDecision) {
      decisions.push(colonyDecision);
    }

    return decisions;
  }

  /**
   * Decide ship placements at facilities
   */
  decideShipPlacements(gameState: GameState, playerId: string): AIDecision[] {
    const player = this.getPlayer(gameState, playerId);
    const decisions: AIDecision[] = [];
    
    // Get available ships that can be placed
    // Note: Ships are managed by the game state, not directly on player
    // For now, assume we have dice rolled that we can place
    const availableShips: any[] = []; // TODO: Get from game state
    if (availableShips.length === 0) return decisions;

    // Get all facilities
    const facilities = gameState.getAllFacilities();
    
    // Evaluate each facility
    for (const facility of facilities) {
      // Find ships that can dock at this facility
      const compatibleShips = this.findCompatibleShips(availableShips, facility);
      
      if (compatibleShips.length === 0) continue;

      // Calculate value of docking at this facility
      const facilityValue = this.evaluateFacilityValue(
        gameState, 
        playerId, 
        facility.type, 
        compatibleShips
      );

      // Create decision for this facility
      decisions.push({
        type: 'ship_placement' as any,
        value: facilityValue,
        data: {
          facilityId: facility.id,
          facilityType: facility.type,
          ships: compatibleShips.map(s => s.id)
        },
        reasoning: `Dock ${compatibleShips.length} ship(s) at ${facility.type} (value: ${facilityValue.toFixed(2)})`
      });
    }

    // Sort by value and return top decisions
    return decisions.sort((a, b) => b.value - a.value);
  }

  /**
   * Find ships that can dock at a facility
   */
  private findCompatibleShips(ships: any[], facility: any): any[] {
    // For now, return first ship that can dock
    // TODO: Implement proper ship combination logic based on dock requirements
    if (ships.length > 0) {
      return [ships[0]];
    }
    return [];
  }

  /**
   * Evaluate the value of docking at a facility
   */
  private evaluateFacilityValue(
    gameState: GameState,
    playerId: string,
    facilityType: string,
    ships: any[]
  ): number {
    const player = this.getPlayer(gameState, playerId);
    let value = 0;

    // Base values for different facility types
    switch (facilityType) {
      case 'solar_converter':
        // Value based on fuel gain
        value = this.personality.valueFuel * 2; // Typically gains 2+ fuel
        break;

      case 'lunar_mine':
        // Value based on ore gain
        value = this.personality.valueOre * 1; // Typically gains 1 ore
        break;

      case 'radon_collector':
        // Value based on fuel gain
        value = this.personality.valueFuel * 1; // Gains 1 fuel
        break;

      case 'colonist_hub':
        // High value if we need colonies
        const coloniesNeeded = 10 - player.colonies.length;
        value = this.personality.valueColony * Math.min(2, coloniesNeeded);
        break;

      case 'colony_constructor':
        // Very high value if we can afford it
        const canAffordColony = player.resources.ore >= 3 && player.resources.fuel >= 1;
        value = canAffordColony ? this.personality.valueColony * 5 : 0;
        break;

      case 'terraforming_station':
        // High value for getting colonies
        value = this.personality.valueColony * 4;
        break;

      case 'orbital_market':
        // Value based on trade needs
        const needsOre = player.resources.ore < 3;
        const needsFuel = player.resources.fuel < 3;
        value = needsOre ? this.personality.valueOre * 2 : 
                needsFuel ? this.personality.valueFuel * 2 : 1;
        break;

      case 'alien_artifact':
        // Value based on tech card value
        value = this.personality.valueTech * 3;
        break;

      case 'raiders_outpost':
        // Value based on aggression
        value = this.personality.aggression * 10;
        break;

      case 'maintenance_bay':
        // Value if we need more ships (assume 3 ships initially)
        const shipCount = 3; // Default ship count
        value = shipCount < 5 ? 15 : 5;
        break;

      default:
        value = 5; // Base value
    }

    // Adjust based on current game state
    const currentEval = this.evaluator.evaluate(gameState, playerId);
    
    // If we're behind, prioritize VP-generating facilities
    if (currentEval < 0) {
      if (facilityType === 'colony_constructor' || 
          facilityType === 'terraforming_station' ||
          facilityType === 'colonist_hub') {
        value *= 1.5;
      }
    }

    // If we're ahead, prioritize resource generation
    if (currentEval > 20) {
      if (facilityType === 'solar_converter' || 
          facilityType === 'lunar_mine') {
        value *= 1.3;
      }
    }

    return value;
  }

  /**
   * Decide tech card usage
   */
  decideTechCardUsage(gameState: GameState, playerId: string): AIDecision[] {
    const player = this.getPlayer(gameState, playerId);
    const decisions: AIDecision[] = [];
    
    // Check if player has any tech cards
    if (!player.alienTechCards || player.alienTechCards.length === 0) {
      return decisions;
    }

    // Evaluate each tech card for potential use
    for (const cardId of player.alienTechCards) {
      const cardValue = this.evaluateTechCardUsage(gameState, playerId, cardId);
      
      if (cardValue > 0) {
        decisions.push({
          type: 'tech_card_use' as any,
          value: cardValue,
          data: {
            cardId,
            action: 'use'
          },
          reasoning: `Use tech card ${cardId} (value: ${cardValue.toFixed(2)})`
        });
      }

      // Consider discarding for special effects
      const discardValue = this.evaluateTechCardDiscard(gameState, playerId, cardId);
      
      if (discardValue > 0) {
        decisions.push({
          type: 'tech_card_discard' as any,
          value: discardValue,
          data: {
            cardId,
            action: 'discard'
          },
          reasoning: `Discard tech card ${cardId} for effect (value: ${discardValue.toFixed(2)})`
        });
      }
    }

    return decisions.sort((a, b) => b.value - a.value);
  }

  /**
   * Evaluate the value of using a tech card
   */
  private evaluateTechCardUsage(
    gameState: GameState,
    playerId: string,
    cardId: string
  ): number {
    const player = this.getPlayer(gameState, playerId);
    let value = 0;

    // Base evaluation based on card type
    // Card IDs typically contain the card type
    const cardType = cardId.split('_')[0];

    switch (cardType) {
      case 'booster':
        // Booster Pod - adds to die value
        // High value if we need specific values
        value = this.personality.favorDieManipulation * 8;
        break;

      case 'stasis':
        // Stasis Beam - move Isolation Field
        // Value based on disrupting opponent bonuses
        value = this.personality.aggression * 12;
        break;

      case 'polarity':
        // Polarity Device - swap colonies
        // High value if we can steal territory control
        value = this.personality.favorTerritories * 15;
        break;

      case 'temporal':
        // Temporal Warper - reroll dice
        // Moderate value for flexibility
        value = this.personality.favorDieManipulation * 10;
        break;

      case 'gravity':
        // Gravity Manipulator - manipulate die values
        value = this.personality.favorDieManipulation * 9;
        break;

      case 'plasma':
        // Plasma Cannon - remove opponent ships
        // High value for aggressive players
        value = this.personality.favorRaiding * 15;
        break;

      case 'data':
        // Data Crystal - use territory bonus
        // Value depends on available bonuses
        value = this.personality.favorTerritories * 10;
        break;

      case 'holographic':
        // Holographic Decoy - protect ships
        // Defensive value
        value = (1 - this.personality.aggression) * 8;
        break;

      case 'resource':
        // Resource Cache - gain resources
        // Always useful
        value = 10;
        break;

      case 'orbital':
        // Orbital Teleporter - move colonies
        value = this.personality.favorTerritories * 12;
        break;

      default:
        value = 5; // Base value for unknown cards
    }

    // Adjust based on game state
    const currentEval = this.evaluator.evaluate(gameState, playerId);
    
    // If behind, prioritize aggressive/VP-generating cards
    if (currentEval < -10) {
      if (cardType === 'plasma' || cardType === 'polarity') {
        value *= 1.5;
      }
    }

    // If ahead, prioritize defensive cards
    if (currentEval > 20) {
      if (cardType === 'holographic') {
        value *= 1.5;
      }
    }

    return value;
  }

  /**
   * Evaluate the value of discarding a tech card for special effects
   */
  private evaluateTechCardDiscard(
    gameState: GameState,
    playerId: string,
    cardId: string
  ): number {
    // Discarding cards typically gives field generator effects
    const cardType = cardId.split('_')[0];
    let value = 0;

    switch (cardType) {
      case 'stasis':
        // Discard to place Isolation Field - very powerful
        value = this.personality.aggression * 18;
        break;

      case 'data':
        // Discard to place Positron Field - gain VP
        value = this.personality.valueVP * 20;
        break;

      case 'holographic':
        // Discard to place Repulsor Field - deny colonies
        value = this.personality.aggression * 15;
        break;

      default:
        // Most cards don't have discard effects
        value = 0;
    }

    return value;
  }

  /**
   * Decide colony placement
   */
  decideColonyPlacement(gameState: GameState, playerId: string): AIDecision | null {
    const player = this.getPlayer(gameState, playerId);
    
    // Check if player can afford a colony
    const canAfford = player.resources.ore >= 3 && player.resources.fuel >= 1;
    if (!canAfford) return null;

    // Get all territories
    const territories = gameState.getAllTerritories();
    const decisions: AIDecision[] = [];

    // Evaluate each territory
    for (const territory of territories) {
      const territoryValue = this.evaluateTerritoryForColony(
        gameState,
        playerId,
        territory.id
      );

      if (territoryValue > 0) {
        decisions.push({
          type: 'colony_placement' as any,
          value: territoryValue,
          data: {
            territoryId: territory.id,
            territoryType: territory.type
          },
          reasoning: `Place colony on ${territory.type} (value: ${territoryValue.toFixed(2)})`
        });
      }
    }

    // Return best decision
    return this.findBestDecision(decisions);
  }

  /**
   * Evaluate the value of placing a colony on a territory
   */
  private evaluateTerritoryForColony(
    gameState: GameState,
    playerId: string,
    territoryId: string
  ): number {
    const territory = gameState.getTerritory(territoryId);
    if (!territory) return 0;

    const player = this.getPlayer(gameState, playerId);
    let value = this.personality.valueColony; // Base colony value (12)

    // Check current control
    const controllingPlayer = territory.getControllingPlayer();
    const playerColonies = territory.getColonies().filter(c => c.playerId === playerId).length;
    const maxColonies = 3; // Territories can hold 3 colonies

    // Can't place if full
    if (territory.getColonies().length >= maxColonies) {
      return 0;
    }

    // Bonus for taking control
    if (!controllingPlayer || controllingPlayer !== playerId) {
      value += this.personality.favorTerritories * 10;
    }

    // Bonus for maintaining control
    if (controllingPlayer === playerId) {
      value += this.personality.favorTerritories * 5;
    }

    // Evaluate territory bonus value
    const bonusValue = this.evaluateTerritoryBonus(gameState, playerId, territory.type);
    value += bonusValue * this.personality.favorTerritories;

    // Strategic considerations based on game phase
    const totalColonies = player.colonies.length;
    
    // Early game: focus on resource territories
    if (totalColonies < 4) {
      if (territory.type === 'heinlein_plains' || 
          territory.type === 'lem_badlands' ||
          territory.type === 'burroughs_desert') {
        value *= 1.3;
      }
    }

    // Mid game: focus on VP-generating territories
    if (totalColonies >= 4 && totalColonies < 8) {
      if (territory.type === 'bradbury_plateau' ||
          territory.type === 'asimov_crater') {
        value *= 1.2;
      }
    }

    // Late game: rush to 10 colonies
    if (totalColonies >= 8) {
      value *= 1.5; // Any colony is valuable
    }

    return value;
  }

  /**
   * Evaluate the value of a territory's bonus
   */
  private evaluateTerritoryBonus(
    gameState: GameState,
    playerId: string,
    territoryType: string
  ): number {
    let value = 0;

    switch (territoryType) {
      case 'heinlein_plains':
        // Better trading ratio at Orbital Market
        value = this.personality.valueOre * 2 + this.personality.valueFuel * 2;
        break;

      case 'lem_badlands':
        // Extra fuel from Solar Converter
        value = this.personality.valueFuel * 3;
        break;

      case 'burroughs_desert':
        // Relic Ship (extra ship)
        value = this.personality.valueShip * 1.5;
        break;

      case 'bradbury_plateau':
        // Cheaper colonies at Colony Constructor
        value = this.personality.valueColony * 2;
        break;

      case 'asimov_crater':
        // Extra colony advancement at Colonist Hub
        value = this.personality.valueColony * 1.5;
        break;

      case 'herbert_valley':
        // Cheaper ships at Maintenance Bay
        value = this.personality.valueShip;
        break;

      case 'pohl_foothills':
        // Cheaper tech card usage
        value = this.personality.valueTech * 2;
        break;

      case 'van_vogt_mountains':
        // Flexible Lunar Mine docking
        value = this.personality.valueOre * 1.5;
        break;

      default:
        value = 5;
    }

    return value;
  }
}

/**
 * Create AI instance for difficulty level
 */
export function createAI(difficulty: AIDifficulty): BaseAI {
  // For now, all difficulties use HeuristicAI
  // TODO: Implement more sophisticated AI for higher difficulties
  return new HeuristicAI(difficulty);
}
