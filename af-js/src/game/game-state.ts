/**
 * Core game state management
 * Central hub for all game state and operations
 */

import { TurnPhase, GamePhase } from './types';
import { ShipManager, Ship } from './ship';
import { PlayerManager, Player } from './player';
import { FacilityManager } from './facility-manager';
import { OrbitalFacility, FacilityExecutionResult } from './facilities/base-facility';

/**
 * Main game state class
 * Coordinates all game components and enforces rules
 */
export class GameState {
  private shipManager: ShipManager;
  private playerManager: PlayerManager;
  private facilityManager: FacilityManager;
  private phase: GamePhase;
  private gameId: string;

  constructor(gameId: string) {
    this.gameId = gameId;
    this.shipManager = new ShipManager();
    this.playerManager = new PlayerManager();
    this.facilityManager = new FacilityManager();
    this.phase = {
      current: TurnPhase.ROLL_DICE,
      activePlayerId: '',
      roundNumber: 1
    };
  }

  /**
   * Initialize a new game with players
   */
  initializeGame(playerConfigs: Array<{ id: string; name: string; color: any; isAI?: boolean }>): void {
    // Create players in order
    playerConfigs.forEach((config, index) => {
      this.playerManager.createPlayer(
        config.id,
        config.name,
        config.color,
        index,
        config.isAI || false
      );
      
      // Create ships for each player
      this.shipManager.createPlayerShips(config.id);
    });

    // Set first player as active
    const players = this.playerManager.getPlayersInTurnOrder();
    if (players.length > 0) {
      this.phase.activePlayerId = players[0].id;
    }
  }

  /**
   * Get current game phase
   */
  getPhase(): GamePhase {
    return { ...this.phase };
  }

  /**
   * Get active player
   */
  getActivePlayer(): Player | undefined {
    return this.playerManager.getPlayer(this.phase.activePlayerId);
  }

  /**
   * Get all players
   */
  getAllPlayers(): Player[] {
    return this.playerManager.getAllPlayers();
  }

  /**
   * Get ship manager (read-only access)
   */
  getShipManager(): ShipManager {
    return this.shipManager;
  }

  /**
   * Get player manager (read-only access)
   */
  getPlayerManager(): PlayerManager {
    return this.playerManager;
  }

  /**
   * Get facility manager (read-only access)
   */
  getFacilityManager(): FacilityManager {
    return this.facilityManager;
  }

  /**
   * Get a specific facility by ID
   */
  getFacility(facilityId: string): OrbitalFacility | undefined {
    return this.facilityManager.getFacility(facilityId);
  }

  /**
   * Get all facilities
   */
  getAllFacilities(): OrbitalFacility[] {
    return this.facilityManager.getAllFacilities();
  }

  /**
   * Advance to next turn phase
   */
  advancePhase(): void {
    const phaseOrder: TurnPhase[] = [
      TurnPhase.ROLL_DICE,
      TurnPhase.PLACE_SHIPS,
      TurnPhase.RESOLVE_ACTIONS,
      TurnPhase.COLLECT_RESOURCES,
      TurnPhase.PURCHASE,
      TurnPhase.END_TURN
    ];

    const currentIndex = phaseOrder.indexOf(this.phase.current);
    
    if (currentIndex < phaseOrder.length - 1) {
      // Move to next phase in current turn
      this.phase.current = phaseOrder[currentIndex + 1];
    } else {
      // End of turn - move to next player
      this.advanceToNextPlayer();
    }
  }

  /**
   * Advance to next player's turn
   */
  private advanceToNextPlayer(): void {
    const players = this.playerManager.getPlayersInTurnOrder();
    const currentIndex = players.findIndex(p => p.id === this.phase.activePlayerId);
    
    if (currentIndex === players.length - 1) {
      // Last player - start new round with first player
      this.phase.activePlayerId = players[0].id;
      this.phase.roundNumber++;
    } else {
      // Move to next player
      this.phase.activePlayerId = players[currentIndex + 1].id;
    }

    // Reset to ROLL_DICE phase
    this.phase.current = TurnPhase.ROLL_DICE;
    
    // Undock all ships from facilities for previous player
    const previousPlayerId = currentIndex === players.length - 1 ? players[players.length - 1].id : players[currentIndex].id;
    this.facilityManager.undockAllShips(previousPlayerId);
    
    // Return all ships to pool for new player
    this.shipManager.returnAllShipsToPool(this.phase.activePlayerId);
  }

  /**
   * Execute roll dice phase
   */
  rollDice(): number[] {
    if (this.phase.current !== TurnPhase.ROLL_DICE) {
      throw new Error('Cannot roll dice outside ROLL_DICE phase');
    }

    const rolls = this.shipManager.rollDice(this.phase.activePlayerId);
    this.advancePhase();
    return rolls;
  }

  /**
   * Dock ships at a facility during PLACE_SHIPS phase
   */
  dockShipsAtFacility(facilityId: string, shipIds: string[], dockGroupId?: string): string | null {
    if (this.phase.current !== TurnPhase.PLACE_SHIPS) {
      throw new Error('Can only dock ships during PLACE_SHIPS phase');
    }

    const player = this.getActivePlayer();
    if (!player) {
      throw new Error('No active player');
    }

    const ships = shipIds.map(id => this.shipManager.getShip(id)).filter((s): s is Ship => s !== undefined);
    
    if (ships.length !== shipIds.length) {
      throw new Error('Some ships not found');
    }

    // Verify all ships belong to active player
    if (!ships.every(s => s.playerId === player.id)) {
      throw new Error('Can only dock your own ships');
    }

    return this.facilityManager.dockShips(facilityId, player, ships, dockGroupId);
  }

  /**
   * Execute actions at docked facilities during RESOLVE_ACTIONS phase
   */
  resolveActions(): Map<string, FacilityExecutionResult> {
    if (this.phase.current !== TurnPhase.RESOLVE_ACTIONS) {
      throw new Error('Can only resolve actions during RESOLVE_ACTIONS phase');
    }

    const player = this.getActivePlayer();
    if (!player) {
      throw new Error('No active player');
    }

    const results = new Map<string, FacilityExecutionResult>();
    const dockedShips = this.facilityManager.getDockedShips(player.id);

    // Group ships by facility
    const shipsByFacility = new Map<string, Ship[]>();
    dockedShips.forEach(({ facilityId, ship }) => {
      if (!shipsByFacility.has(facilityId)) {
        shipsByFacility.set(facilityId, []);
      }
      shipsByFacility.get(facilityId)!.push(ship);
    });

    // Execute each facility's action
    shipsByFacility.forEach((ships, facilityId) => {
      const result = this.facilityManager.executeFacilityAction(facilityId, player, ships);
      results.set(facilityId, result);
    });

    this.advancePhase();
    return results;
  }

  /**
   * Undock ships from a facility
   */
  undockShipsFromFacility(facilityId: string, dockGroupId: string): Ship[] {
    if (this.phase.current !== TurnPhase.PLACE_SHIPS) {
      throw new Error('Can only undock ships during PLACE_SHIPS phase');
    }

    const player = this.getActivePlayer();
    if (!player) {
      throw new Error('No active player');
    }

    return this.facilityManager.undockShips(facilityId, dockGroupId);
  }

  /**
   * Get all docked ships for the active player
   */
  getDockedShips(): Array<{ facilityId: string; ship: Ship }> {
    const player = this.getActivePlayer();
    if (!player) return [];
    
    return this.facilityManager.getDockedShips(player.id);
  }

  /**
   * Check if game is over (any player has 8+ VP)
   */
  isGameOver(): boolean {
    const players = this.playerManager.getAllPlayers();
    return players.some(player => this.playerManager.hasWon(player.id));
  }

  /**
   * Get winner(s) - players with highest VP when game ends
   */
  getWinners(): Player[] {
    const players = this.playerManager.getAllPlayers();
    const maxVP = Math.max(...players.map(p => p.victoryPoints.total));
    return players.filter(p => p.victoryPoints.total === maxVP);
  }

  /**
   * Deep clone the game state
   * Critical for AI lookahead and undo functionality
   */
  clone(): GameState {
    const cloned = new GameState(this.gameId);
    cloned.shipManager = this.shipManager.clone();
    cloned.playerManager = this.playerManager.clone();
    // Note: FacilityManager is recreated fresh in constructor
    // Facility state (docked ships) is maintained in shipManager
    cloned.phase = { ...this.phase };
    return cloned;
  }

  /**
   * Validate game state integrity
   * Returns array of validation errors (empty if valid)
   */
  validate(): string[] {
    const errors: string[] = [];

    // Check players exist
    const players = this.playerManager.getAllPlayers();
    if (players.length < 2) {
      errors.push('Game requires at least 2 players');
    }
    if (players.length > 5) {
      errors.push('Game supports maximum 5 players');
    }

    // Check active player exists
    if (!this.playerManager.getPlayer(this.phase.activePlayerId)) {
      errors.push('Active player ID is invalid');
    }

    // Check each player has 3 ships
    players.forEach(player => {
      const ships = this.shipManager.getPlayerShips(player.id);
      if (ships.length !== 3) {
        errors.push(`Player ${player.name} should have 3 ships, has ${ships.length}`);
      }
    });

    // Check victory points are consistent
    players.forEach(player => {
      const expectedTotal = 
        player.victoryPoints.colonies +
        player.victoryPoints.alienTech +
        player.victoryPoints.territories +
        player.victoryPoints.bonuses;
      
      if (player.victoryPoints.total !== expectedTotal) {
        errors.push(`Player ${player.name} VP total mismatch: ${player.victoryPoints.total} vs ${expectedTotal}`);
      }
    });

    return errors;
  }

  /**
   * Serialize game state to JSON
   */
  toJSON(): any {
    return {
      gameId: this.gameId,
      phase: this.phase,
      ships: this.shipManager.toJSON(),
      players: this.playerManager.toJSON()
    };
  }

  /**
   * Deserialize game state from JSON
   */
  static fromJSON(data: any): GameState {
    const gameState = new GameState(data.gameId);
    gameState.phase = data.phase;
    gameState.shipManager = ShipManager.fromJSON(data.ships);
    gameState.playerManager = PlayerManager.fromJSON(data.players);
    return gameState;
  }
}
