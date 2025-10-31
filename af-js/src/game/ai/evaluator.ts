/**
 * Game State Evaluation
 * Scores game states for AI decision-making
 */

import { GameState } from '../game-state';
import { Player } from '../player';
import { AIPersonality } from './ai-types';

/**
 * Evaluate game state from a player's perspective
 * Returns a score indicating how favorable the position is
 */
export class GameStateEvaluator {
  private personality: AIPersonality;

  constructor(personality: AIPersonality) {
    this.personality = personality;
  }

  /**
   * Evaluate game state for a specific player
   * Higher scores are better for the player
   */
  evaluate(gameState: GameState, playerId: string): number {
    const player = gameState.getAllPlayers().find(p => p.id === playerId);
    if (!player) return -Infinity;

    let score = 0;

    // Victory points (most important)
    score += this.evaluateVictoryPoints(player);

    // Resources
    score += this.evaluateResources(player);

    // Ships
    score += this.evaluateShips(gameState, player);

    // Colonies
    score += this.evaluateColonies(player);

    // Tech cards
    score += this.evaluateTechCards(player);

    // Territory control
    score += this.evaluateTerritoryControl(gameState, player);

    // Opponent disadvantage (aggression factor)
    if (this.personality.aggression > 0) {
      score += this.evaluateOpponentPosition(gameState, playerId) * this.personality.aggression;
    }

    return score;
  }

  /**
   * Evaluate victory points
   */
  private evaluateVictoryPoints(player: Player): number {
    return player.victoryPoints.total * this.personality.valueVP;
  }

  /**
   * Evaluate resources
   */
  private evaluateResources(player: Player): number {
    return (
      player.resources.fuel * this.personality.valueFuel +
      player.resources.ore * this.personality.valueOre +
      player.resources.energy * this.personality.valueEnergy
    );
  }

  /**
   * Evaluate ships
   */
  private evaluateShips(gameState: GameState, player: Player): number {
    const ships = gameState.getShipManager().getPlayerShips(player.id);
    const baseValue = ships.length * this.personality.valueShip;
    
    // Add per-turn value based on estimated turns remaining
    const estimatedTurnsRemaining = this.estimateTurnsRemaining(gameState, player);
    const turnValue = ships.length * this.personality.valueShipPerTurn * estimatedTurnsRemaining;
    
    return baseValue + turnValue;
  }

  /**
   * Evaluate colonies
   */
  private evaluateColonies(player: Player): number {
    const placedColonies = player.colonies.length;
    return placedColonies * this.personality.valueColony;
  }

  /**
   * Evaluate tech cards
   */
  private evaluateTechCards(player: Player): number {
    const cardCount = player.alienTechCards.length;
    const baseValue = cardCount * this.personality.valueTech;
    
    // Per-turn value
    const estimatedTurns = 10; // Rough estimate
    const turnValue = cardCount * this.personality.valueTechPerTurn * estimatedTurns;
    
    // VP in tech cards is vulnerable (negative)
    const vpValue = player.victoryPoints.alienTech * this.personality.valueTechVP;
    
    return baseValue + turnValue + vpValue;
  }

  /**
   * Evaluate territory control
   */
  private evaluateTerritoryControl(gameState: GameState, player: Player): number {
    const controlled = gameState.getTerritoryManager().getControlledTerritories(player.id);
    
    // Each controlled territory is worth its VP plus bonus value
    let score = 0;
    controlled.forEach(territory => {
      // VP for control
      score += this.personality.valueVP;
      
      // Bonus value varies by territory
      score += this.evaluateTerritoryBonus(territory.type) * this.personality.favorTerritories;
    });
    
    return score;
  }

  /**
   * Evaluate specific territory bonus value
   */
  private evaluateTerritoryBonus(territoryType: string): number {
    // Rough estimates of territory value
    switch (territoryType) {
      case 'heinlein_plains':  return 3;  // Better trading is very valuable
      case 'pohl_foothills':   return 4;  // Reduced tech costs is excellent
      case 'van_vogt_mountains': return 2; // Any die on Lunar Mine
      case 'asimov_crater':    return 3;  // Extra colonist hub advance
      case 'bradbury_plateau': return 3;  // Reduced colony cost
      case 'herbert_valley':   return 3;  // Reduced ship cost
      case 'lem_badlands':     return 2;  // Extra fuel from solar
      case 'burroughs_desert': return 2;  // Relic ship
      default: return 1;
    }
  }

  /**
   * Evaluate opponent positions (for aggression)
   * Returns negative of average opponent score
   */
  private evaluateOpponentPosition(gameState: GameState, playerId: string): number {
    const opponents = gameState.getAllPlayers().filter(p => p.id !== playerId);
    if (opponents.length === 0) return 0;

    let totalOpponentScore = 0;
    opponents.forEach(opponent => {
      // Use base evaluation without aggression to avoid recursion
      const tempPersonality = { ...this.personality, aggression: 0 };
      const tempEvaluator = new GameStateEvaluator(tempPersonality);
      totalOpponentScore += tempEvaluator.evaluate(gameState, opponent.id);
    });

    // Return negative average (hurting opponents is good)
    return -(totalOpponentScore / opponents.length);
  }

  /**
   * Estimate turns remaining in game
   */
  private estimateTurnsRemaining(gameState: GameState, player: Player): number {
    // Rough heuristic: game ends when someone places their last colony
    // Average player has 10 colonies, so estimate based on placed colonies
    const avgPlacedColonies = gameState.getAllPlayers()
      .reduce((sum, p) => sum + p.colonies.length, 0) / gameState.getAllPlayers().length;
    
    const avgRemainingColonies = 10 - avgPlacedColonies;
    
    // Assume 1-2 colonies per turn on average
    return Math.max(5, avgRemainingColonies / 1.5);
  }

  /**
   * Evaluate a potential move
   * Returns the value delta (change in score) from making this move
   */
  evaluateMove(gameState: GameState, playerId: string, move: () => void): number {
    // Get current score
    const currentScore = this.evaluate(gameState, playerId);

    // Clone game state and apply move
    const clonedState = gameState.clone();
    move();

    // Get new score
    const newScore = this.evaluate(clonedState, playerId);

    return newScore - currentScore;
  }
}
