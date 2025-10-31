/**
 * Core game state management
 * Central hub for all game state and operations
 */

import { TurnPhase, GamePhase } from './types';
import { ShipManager, Ship } from './ship';
import { PlayerManager, Player } from './player';
import { FacilityManager } from './facility-manager';
import { OrbitalFacility, FacilityExecutionResult } from './facilities/base-facility';
import { TerritoryManager } from './territory-manager';
import { Territory, TerritoryType, FieldType } from './territory';
import { 
  TechCard, 
  TechCardType,
  AlienCity,
  AlienMonument,
  BoosterPod,
  StasisBeam,
  PolarityDevice,
  TemporalWarper,
  GravityManipulator,
  OrbitalTeleporter,
  DataCrystal,
  PlasmaCannon,
  HolographicDecoy,
  ResourceCache
} from './tech-cards';
import { TechCardManager } from './tech-card-manager';

/**
 * Main game state class
 * Coordinates all game components and enforces rules
 */
export class GameState {
  private shipManager: ShipManager;
  private playerManager: PlayerManager;
  private facilityManager: FacilityManager;
  private territoryManager: TerritoryManager;
  private techCardManager: TechCardManager;
  private techCardDeck: TechCard[];  // DEPRECATED: Use techCardManager instead
  private techCardDiscard: TechCard[];  // DEPRECATED: Use techCardManager instead
  private phase: GamePhase;
  private gameId: string;
  private bradburyRerollUsed: boolean = false; // Phase 7: Track Bradbury Plateau re-roll usage

  constructor(gameId: string) {
    this.gameId = gameId;
    this.shipManager = new ShipManager();
    this.playerManager = new PlayerManager();
    this.facilityManager = new FacilityManager();
    this.territoryManager = new TerritoryManager();
    this.techCardManager = new TechCardManager();
    this.techCardDeck = [];
    this.techCardDiscard = [];
    this.phase = {
      current: TurnPhase.ROLL_DICE,
      activePlayerId: '',
      roundNumber: 1
    };
    
    // Initialize tech card deck
    this.initializeTechCardDeck();
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
   * Get territory manager (read-only access)
   */
  getTerritoryManager(): TerritoryManager {
    return this.territoryManager;
  }

  /**
   * Get a specific territory by ID
   */
  getTerritory(territoryId: string): Territory | undefined {
    return this.territoryManager.getTerritory(territoryId);
  }

  /**
   * Get all territories
   */
  getAllTerritories(): Territory[] {
    return this.territoryManager.getAllTerritories();
  }

  /**
   * Place colony on a territory
   * Costs 3 ore + 1 fuel (reduced by 1 ore if player controls Bradbury Plateau)
   */
  placeColonyOnTerritory(playerId: string, territoryId: string): boolean {
    const territory = this.territoryManager.getTerritory(territoryId);
    if (!territory) return false;
    
    const player = this.playerManager.getPlayer(playerId);
    if (!player) return false;
    
    // Calculate colony cost (3 ore + 1 fuel by default)
    let oreCost = 3;
    const fuelCost = 1;
    
    // Bradbury Plateau bonus reduces ore cost by 1
    if (this.territoryManager.hasBradburyPlateauBonus(playerId)) {
      oreCost -= 1;
    }
    
    // Check if player can afford the colony
    if (player.resources.ore < oreCost || player.resources.fuel < fuelCost) {
      return false;
    }
    
    // Deduct resources
    player.resources.ore -= oreCost;
    player.resources.fuel -= fuelCost;
    
    // Place colony on territory
    const success = territory.placeColony(playerId);
    if (!success) {
      // Refund resources if placement failed
      player.resources.ore += oreCost;
      player.resources.fuel += fuelCost;
      return false;
    }
    
    // Add colony to player's colonies array (using territory ID as ColonyLocation)
    this.playerManager.addColony(playerId, territoryId as any);
    
    return true;
  }

  /**
   * Move field generator to territory
   */
  placeFieldGenerator(fieldType: FieldType, territoryId: string): boolean {
    return this.territoryManager.placeFieldGenerator(fieldType, territoryId);
  }

  /**
   * Draw a tech card
   */
  drawTechCard(playerId: string): TechCard | null {
    if (this.techCardDeck.length === 0) {
      // Shuffle discard pile back into deck
      this.techCardDeck = [...this.techCardDiscard];
      this.techCardDiscard = [];
      this.shuffleTechCardDeck();
    }
    
    if (this.techCardDeck.length === 0) return null;
    
    const card = this.techCardDeck.pop()!;
    const player = this.playerManager.getPlayer(playerId);
    if (player) {
      card.setOwner(player);
      player.alienTechCards.push(card.id);
    }
    
    return card;
  }

  /**
   * Get tech card deck size
   * @deprecated Use techCardManager methods instead
   */
  getTechCardDeckSize(): number {
    return this.techCardManager.getDeckSize();
  }

  /**
   * Get tech card discard pile size
   * @deprecated Use techCardManager methods instead
   */
  getTechCardDiscardSize(): number {
    return this.techCardManager.getDiscardSize();
  }

  /**
   * Initialize tech card deck with all cards
   * Based on original game composition:
   * - 1x AlienCity, 1x AlienMonument (VP cards)
   * - 2x each: BoosterPod, StasisBeam, PolarityDevice, TemporalWarper, GravityManipulator (die manipulation)
   * - 2x each: OrbitalTeleporter, DataCrystal (colony manipulation)
   * - 2x each: PlasmaCannon, HolographicDecoy (combat/defense)
   * - 2x ResourceCache (resource generation)
   * Total: 22 cards
   */
  private initializeTechCardDeck(): void {
    this.techCardDeck = [];
    
    // Victory point cards (1 each)
    this.techCardDeck.push(new AlienCity());
    this.techCardDeck.push(new AlienMonument());
    
    // Die manipulation cards (2 each)
    for (let i = 0; i < 2; i++) {
      this.techCardDeck.push(new BoosterPod());
      this.techCardDeck.push(new StasisBeam());
      this.techCardDeck.push(new PolarityDevice());
      this.techCardDeck.push(new TemporalWarper());
      this.techCardDeck.push(new GravityManipulator());
    }
    
    // Colony manipulation cards (2 each)
    for (let i = 0; i < 2; i++) {
      this.techCardDeck.push(new OrbitalTeleporter());
      this.techCardDeck.push(new DataCrystal());
    }
    
    // Combat/defense cards (2 each)
    for (let i = 0; i < 2; i++) {
      this.techCardDeck.push(new PlasmaCannon());
      this.techCardDeck.push(new HolographicDecoy());
    }
    
    // Resource generation cards (2 each)
    for (let i = 0; i < 2; i++) {
      this.techCardDeck.push(new ResourceCache());
    }
    
    // Shuffle the deck
    this.shuffleTechCardDeck();
  }

  /**
   * Shuffle tech card deck
   */
  private shuffleTechCardDeck(): void {
    for (let i = this.techCardDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.techCardDeck[i], this.techCardDeck[j]] = 
        [this.techCardDeck[j], this.techCardDeck[i]];
    }
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
   * Automatically handles phase-specific actions
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
      
      // Execute automatic phase actions
      this.executePhaseActions();
    } else {
      // End of turn - move to next player
      this.advanceToNextPlayer();
    }
  }

  /**
   * Execute automatic actions for current phase
   */
  private executePhaseActions(): void {
    const player = this.getActivePlayer();
    if (!player) return;

    switch (this.phase.current) {
      case TurnPhase.ROLL_DICE:
        // Apply start-of-turn territory bonuses
        this.territoryManager.applyStartOfTurnBonuses(player);
        break;

      case TurnPhase.RESOLVE_ACTIONS:
        // Note: resolveActions() must be called manually during this phase
        // It will automatically advance to the next phase when complete
        break;

      case TurnPhase.COLLECT_RESOURCES:
        // Resource collection is handled by facilities during RESOLVE_ACTIONS
        // This phase is for collecting from other sources
        break;

      case TurnPhase.END_TURN:
        // Enforce discard to 8 resources
        this.enforceResourceLimit(player);
        break;
    }
  }

  /**
   * Enforce 8-resource limit at end of turn
   * Player must discard excess resources
   */
  private enforceResourceLimit(player: Player): void {
    const totalResources = player.resources.fuel + player.resources.ore + player.resources.energy;
    const maxResources = 8;

    if (totalResources > maxResources) {
      const excess = totalResources - maxResources;
      // For now, just discard ore first, then fuel, then energy
      // TODO: Let player choose which resources to discard
      
      let remaining = excess;
      if (player.resources.ore > 0) {
        const toDiscard = Math.min(remaining, player.resources.ore);
        player.resources.ore -= toDiscard;
        remaining -= toDiscard;
      }
      if (remaining > 0 && player.resources.fuel > 0) {
        const toDiscard = Math.min(remaining, player.resources.fuel);
        player.resources.fuel -= toDiscard;
        remaining -= toDiscard;
      }
      if (remaining > 0 && player.resources.energy > 0) {
        const toDiscard = Math.min(remaining, player.resources.energy);
        player.resources.energy -= toDiscard;
      }
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
    this.bradburyRerollUsed = false; // Reset re-roll flag for new turn
    this.advancePhase();
    return rolls;
  }

  /**
   * Phase 7: Check if Bradbury Plateau re-roll is available
   */
  canUseBradburyReroll(): boolean {
    if (this.phase.current !== TurnPhase.PLACE_SHIPS) return false;
    if (this.bradburyRerollUsed) return false;
    
    const player = this.getActivePlayer();
    if (!player) return false;
    
    return this.territoryManager.hasBradburyPlateauBonus(player.id);
  }

  /**
   * Phase 7: Re-roll a single die using Bradbury Plateau bonus
   */
  rerollDie(shipId: string): number | null {
    if (!this.canUseBradburyReroll()) {
      return null;
    }

    const player = this.getActivePlayer();
    if (!player) return null;

    const ship = this.shipManager.getPlayerShips(player.id).find(s => s.id === shipId);
    if (!ship || ship.diceValue === null) return null;

    // Re-roll the die
    const newRoll = (Math.floor(Math.random() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    ship.diceValue = newRoll;
    this.bradburyRerollUsed = true;

    return newRoll;
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
  resolveActions(
    territorySelections?: Map<string, string>,
    raidersChoices?: { choice: 'resources' | 'tech'; targetPlayerId?: string; resources?: { ore: number; fuel: number; energy: number } }
  ): Map<string, FacilityExecutionResult> {
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
      // Prepare facility options (e.g., territory bonuses)
      const options: any = {};
      
      // Orbital Market: Check Heinlein Plains bonus (1:1 trade ratio)
      if (facilityId === 'orbital_market') {
        options.hasHeinleinPlains = this.territoryManager.hasHeinleinPlainsBonus(player.id);
      }
      
      // Shipyard: Pass current ship count and Herbert Valley bonus
      if (facilityId === 'shipyard') {
        options.currentShipCount = this.shipManager.getPlayerShips(player.id).length;
        options.hasHerbertValley = this.territoryManager.hasHerbertValleyBonus(player.id);
      }
      
      // Add territory selection if provided
      if (territorySelections?.has(facilityId)) {
        options.territoryId = territorySelections.get(facilityId);
      }
      
      const result = this.facilityManager.executeFacilityAction(facilityId, player, ships, options);
      results.set(facilityId, result);
      
      // Apply the results if successful
      if (result.success) {
        // Add resources gained
        if (result.resourcesGained) {
          if (result.resourcesGained.ore) player.resources.ore += result.resourcesGained.ore;
          if (result.resourcesGained.fuel) player.resources.fuel += result.resourcesGained.fuel;
          if (result.resourcesGained.energy) player.resources.energy += result.resourcesGained.energy;
        }
        
        // Deduct resources spent
        if (result.resourcesSpent) {
          if (result.resourcesSpent.ore) player.resources.ore -= result.resourcesSpent.ore;
          if (result.resourcesSpent.fuel) player.resources.fuel -= result.resourcesSpent.fuel;
          if (result.resourcesSpent.energy) player.resources.energy -= result.resourcesSpent.energy;
        }
        
        // Handle colony placed (Colony Constructor, Colonist Hub, Terraforming Station)
        if (result.colonyPlaced && options?.territoryId) {
          const success = this.territoryManager.placeColony(player.id, options.territoryId);
          if (!success) {
            console.warn(`Failed to place colony on ${options.territoryId} for player ${player.id}`);
          }
        }
        
        // Handle ship built (Shipyard) - using shipReturned flag
        if (facilityId === 'shipyard' && result.shipReturned === false) {
          // Create new ship and dock it at Maintenance Bay
          const newShip = this.shipManager.createShip(player.id);
          newShip.location = 'maintenance_bay';
          this.facilityManager.dockShips('maintenance_bay', player, [newShip]);
        }
        
        // Handle Raiders Outpost theft
        if (facilityId === 'raiders_outpost' && raidersChoices) {
          if (raidersChoices.choice === 'resources' && raidersChoices.targetPlayerId && raidersChoices.resources) {
            // Steal resources from target player
            const targetPlayer = this.playerManager.getPlayer(raidersChoices.targetPlayerId);
            if (targetPlayer) {
              const stolen = raidersChoices.resources;
              // Take from target (capped at what they have)
              const actualOre = Math.min(stolen.ore, targetPlayer.resources.ore);
              const actualFuel = Math.min(stolen.fuel, targetPlayer.resources.fuel);
              const actualEnergy = Math.min(stolen.energy, targetPlayer.resources.energy);
              
              targetPlayer.resources.ore -= actualOre;
              targetPlayer.resources.fuel -= actualFuel;
              targetPlayer.resources.energy -= actualEnergy;
              
              // Give to raiding player
              player.resources.ore += actualOre;
              player.resources.fuel += actualFuel;
              player.resources.energy += actualEnergy;
            }
          } else if (raidersChoices.choice === 'tech' && raidersChoices.targetPlayerId) {
            // Steal random tech card from target player
            const targetPlayer = this.playerManager.getPlayer(raidersChoices.targetPlayerId);
            if (targetPlayer && targetPlayer.alienTechCards.length > 0) {
              const randomIndex = Math.floor(Math.random() * targetPlayer.alienTechCards.length);
              const stolenCard = targetPlayer.alienTechCards.splice(randomIndex, 1)[0];
              player.alienTechCards.push(stolenCard);
            }
          }
        }
        
        // Handle ship returned to stock (Terraforming Station)
        if (result.shipReturned === true) {
          // Ship is consumed - undock and return to stock
          // Ships are passed in the 'ships' parameter
          ships.forEach(ship => {
            ship.location = null;
            ship.diceValue = null;
            ship.isLocked = false;
          });
        }
        
        // Handle advancement made (Colonist Hub)
        // Track advancement is already managed in ColonistHub facility
        // result.advancementMade is informational only
      }
    });

    this.advancePhase();
    return results;
  }

  /**
   * Get facilities that require territory selection for the active player
   * Returns facility IDs that need territory selection (Colony Constructor, Terraforming Station)
   */
  getFacilitiesNeedingTerritorySelection(): string[] {
    const player = this.getActivePlayer();
    if (!player) return [];

    const dockedShips = this.facilityManager.getDockedShips(player.id);
    const facilitiesWithShips = new Set(dockedShips.map(({ facilityId }) => facilityId));
    
    const territorySelectingFacilities = ['colony_constructor', 'terraforming_station'];
    return territorySelectingFacilities.filter(id => facilitiesWithShips.has(id));
  }

  /**
   * Check if Raiders Outpost needs player choices
   */
  needsRaidersChoice(): boolean {
    const player = this.getActivePlayer();
    if (!player) return false;

    const dockedShips = this.facilityManager.getDockedShips(player.id);
    return dockedShips.some(({ facilityId }) => facilityId === 'raiders_outpost');
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
   * Check if game is over
   * Game ends when any player places their final colony (10 colonies placed)
   */
  isGameOver(): boolean {
    const players = this.playerManager.getAllPlayers();
    // Check if any player has placed all 10 colonies
    return players.some(player => player.colonies.length >= 10);
  }

  /**
   * Get winner(s) - players with highest VP when game ends
   * Ties are broken by: 1) tech card count, 2) ore count, 3) fuel count
   */
  getWinners(): Player[] {
    if (!this.isGameOver()) {
      return [];
    }

    const players = this.playerManager.getAllPlayers();
    const maxVP = Math.max(...players.map(p => p.victoryPoints.total));
    let winners = players.filter(p => p.victoryPoints.total === maxVP);

    // Break ties if needed
    if (winners.length > 1) {
      // First tiebreaker: tech card count
      const maxTechCards = Math.max(...winners.map(p => p.alienTechCards.length));
      winners = winners.filter(p => p.alienTechCards.length === maxTechCards);

      if (winners.length > 1) {
        // Second tiebreaker: ore count
        const maxOre = Math.max(...winners.map(p => p.resources.ore));
        winners = winners.filter(p => p.resources.ore === maxOre);

        if (winners.length > 1) {
          // Third tiebreaker: fuel count
          const maxFuel = Math.max(...winners.map(p => p.resources.fuel));
          winners = winners.filter(p => p.resources.fuel === maxFuel);
        }
      }
    }

    return winners;
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
   * Get tech card manager
   */
  getTechCardManager(): TechCardManager {
    return this.techCardManager;
  }

  /**
   * Get visible tech cards at Alien Artifact
   */
  getVisibleTechCards(): TechCard[] {
    return this.techCardManager.getVisibleCards();
  }

  /**
   * Get tech cards for a player by their IDs
   */
  getTechCardsByIds(cardIds: string[]): TechCard[] {
    return this.techCardManager.getCardsByIds(cardIds);
  }

  /**
   * Cycle tech cards at Alien Artifact
   * Called when player docks at Alien Artifact
   */
  cycleTechCards(): void {
    this.techCardManager.cycleVisibleCards();
  }

  /**
   * Claim a tech card from Alien Artifact
   * Returns true if successful
   */
  claimTechCard(playerId: string, cardId: string): boolean {
    const player = this.playerManager.getPlayer(playerId);
    if (!player) return false;

    // Check if player already has this card
    if (player.alienTechCards.includes(cardId)) {
      console.warn(`Player ${player.name} already has card ${cardId}`);
      return false;
    }

    const card = this.techCardManager.claimCard(cardId);
    if (!card) return false;

    // Add card to player's hand
    player.alienTechCards.push(card.id);
    
    // Note: VP is calculated dynamically when needed

    return true;
  }

  /**
   * Use a tech card's power
   */
  useTechCard(playerId: string, cardId: string, options?: any): boolean {
    const player = this.playerManager.getPlayer(playerId);
    if (!player) return false;

    // Check player has the card
    if (!player.alienTechCards.includes(cardId)) {
      console.warn(`Player ${player.name} does not have card ${cardId}`);
      return false;
    }

    const cards = this.getTechCardsByIds([cardId]);
    if (cards.length === 0) return false;

    const card = cards[0];

    // Execute card power
    const result = card.usePower(player, options);
    if (!result.success) {
      console.warn(`Failed to use card ${card.name}:`, result.message);
      return false;
    }

    return true;
  }

  /**
   * Discard a tech card
   */
  discardTechCard(playerId: string, cardId: string): boolean {
    const player = this.playerManager.getPlayer(playerId);
    if (!player) return false;

    // Check player has the card
    const cardIndex = player.alienTechCards.indexOf(cardId);
    if (cardIndex === -1) {
      console.warn(`Player ${player.name} does not have card ${cardId}`);
      return false;
    }

    const cards = this.getTechCardsByIds([cardId]);
    if (cards.length === 0) return false;

    const card = cards[0];

    // Execute discard power
    const result = card.useDiscardPower(player);
    if (!result.success) {
      console.warn(`Failed to discard card ${card.name}:`, result.message);
      return false;
    }

    // Remove card from player's hand
    player.alienTechCards.splice(cardIndex, 1);

    // Discard the card
    this.techCardManager.discardCard(card);

    // Note: VP is calculated dynamically when needed

    return true;
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
