import { GAME_WIDTH, GAME_HEIGHT } from '../main';
import { PlayerHUDLayer, MiniPlayerHUDLayer } from '../layers';
import { GameState } from '../game/game-state';
import { HeuristicAI } from '../game/ai/base-ai';
import { AIDifficulty, getAIPersonality } from '../game/ai/ai-types';
import { TurnControls } from '../ui/turn-controls';
import { ShipSprite } from '../ui/ship-sprite';
import { FacilitySprite, FACILITY_DATA } from '../ui/facility-sprite';
import { DiceRollManager } from '../ui/dice-sprite';
import { TerritorySprite, ColonySprite, TERRITORY_DATA } from '../ui/territory-sprite';
import { TechCardHand } from '../ui/tech-card-hand';
import { AlienArtifactCardDisplay } from '../ui/alien-artifact-card-display';
import { NotificationManager } from '../ui/action-notification';
import { AIActionAnimator } from '../ui/ai-action-animator';
import { VictoryOverlay } from '../ui/victory-overlay';
import { ShipLocation } from '../game/types';
import * as BoardLayout from '../config/board-layout';
import { TerritorySelectorModal } from '../ui/modals/territory-selector-modal';
import { PlayerSelectorModal } from '../ui/modals/player-selector-modal';
import { ResourcePickerModal } from '../ui/modals/resource-picker-modal';
import { RaidersChoiceModal } from '../ui/modals/raiders-choice-modal';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Game',
};

type PlayerController = 'Human' | 'AI: Cadet' | 'AI: Spacer' | 'AI: Pirate' | 'AI: Admiral';

interface PlayerConfig {
  controller: PlayerController;
  color: string;
}

/**
 * Main game scene that displays the game board, docking bays, and player trays.
 * Based on SceneGameiPad.m from the original iOS implementation.
 * 
 * This scene coordinates the various HUD layers and game board display.
 * Individual HUD components are modularized into separate layer classes:
 * - PlayerHUDLayer: Main player tray at bottom (from LayerHUDPort.m)
 * - MiniPlayerHUDLayer: Mini trays at top for other players (from LayerPortPlayerMiniHUD.m)
 * 
 * Phase 5: Now integrated with GameState for complete game logic
 */
export class GameScene extends Phaser.Scene {
  private numPlayers: number = 2;
  private currentPlayer: number = 0;
  private miniPlayerHUDs: MiniPlayerHUDLayer[] = [];
  private mainPlayerHUD: PlayerHUDLayer | null = null;
  
  // Phase 5: Game state integration
  private gameState: GameState | null = null;
  private playerConfigs: PlayerConfig[] = [];
  private aiPlayers: Map<string, HeuristicAI> = new Map();
  
  // Phase 5: Turn controls
  private turnControls: TurnControls | null = null;
  
  // Phase 5: Ship sprites
  private shipSprites: Map<string, ShipSprite> = new Map();
  
  // Phase 5: Facility sprites
  private facilitySprites: Map<ShipLocation, FacilitySprite> = new Map();
  private facilitiesContainer: Phaser.GameObjects.Container | null = null;
  private facilityVisuals: any[] = []; // FacilityVisual instances
  
  // Phase 5: Dice roll manager
  private diceRollManager: DiceRollManager | null = null;
  
  // Phase 5: Territory sprites
  private territorySprites: Map<string, TerritorySprite> = new Map();
  private colonySprites: ColonySprite[] = [];
  
  // Phase 5: Tech card hand
  private techCardHand: TechCardHand | null = null;
  private alienArtifactDisplay: AlienArtifactCardDisplay | null = null;
  
  // Phase 5: AI visualization
  private notificationManager: NotificationManager | null = null;
  private aiAnimator: AIActionAnimator | null = null;
  
  // Phase 5: Victory overlay
  private victoryOverlay: VictoryOverlay | null = null;
  
  // Phase 7: Modals
  private territorySelectorModal: TerritorySelectorModal | null = null;
  private playerSelectorModal: PlayerSelectorModal | null = null;
  private resourcePickerModal: ResourcePickerModal | null = null;
  private raidersChoiceModal: RaidersChoiceModal | null = null;
  
  // Debug UI
  private debugText: Phaser.GameObjects.Text | null = null;
  private showDebug: boolean = true;

  constructor() {
    super(sceneConfig);
  }

  public init(data: any): void {
    // Accept number of players and configurations from player setup scene
    this.numPlayers = data?.numPlayers || 2;
    this.playerConfigs = data?.playerConfigs || [
      { controller: 'Human', color: '#952034' },
      { controller: 'AI: Cadet', color: '#007226' }
    ];
    this.currentPlayer = 0;
    
    // Initialize game state
    this.initializeGameState();
  }
  
  /**
   * Initialize the game state with player configurations
   */
  private initializeGameState(): void {
    this.gameState = new GameState('game-1');
    
    // Create player configs for GameState
    const statePlayerConfigs = [];
    for (let i = 0; i < this.numPlayers; i++) {
      const config = this.playerConfigs[i];
      const isAI = config.controller.startsWith('AI:');
      
      statePlayerConfigs.push({
        id: `player-${i}`,
        name: isAI ? config.controller : `Player ${i + 1}`,
        color: config.color,
        isAI
      });
      
      // Create AI instance for AI players
      if (isAI) {
        const difficulty = this.getAIDifficulty(config.controller);
        this.aiPlayers.set(`player-${i}`, new HeuristicAI(difficulty));
      }
    }
    
    this.gameState.initializeGame(statePlayerConfigs);
    
    console.log('GameState initialized:', this.gameState);
    console.log('Active player:', this.gameState.getActivePlayer());
    console.log('AI players:', Array.from(this.aiPlayers.keys()));
  }
  
  /**
   * Map controller string to AI difficulty
   */
  private getAIDifficulty(controller: PlayerController): AIDifficulty {
    switch (controller) {
      case 'AI: Cadet':
        return AIDifficulty.CADET;
      case 'AI: Spacer':
        return AIDifficulty.SPACER;
      case 'AI: Pirate':
        return AIDifficulty.PIRATE;
      case 'AI: Admiral':
        return AIDifficulty.ADMIRAL;
      default:
        return AIDifficulty.CADET;
    }
  }

  public create(): void {
    // Add solid color background (matching LayerColorLayer from iOS)
    this.cameras.main.setBackgroundColor(0x000033);

    // Add the game board
    // Original iOS code (iPadGameSceneOld.m line 38):
    //   gameBG.position = ccp([gameBG texture].contentSize.width * 0.5 - 54, [gameBG texture].contentSize.height * 0.5)
    // 
    // iOS coordinate system: origin at bottom-left, Phaser: origin at top-left
    //
    // CRITICAL MEASUREMENTS:
    // - Board image: 2048×2048 pixels
    // - Game viewport: 1536×2048 pixels (portrait iPad)
    // - iOS original: 1536×2048 (@2x retina)
    //
    // The board is WIDER than the viewport (2048 > 1536), so 256px on each side are off-screen
    // iOS positioned the board at X = (board.width/2 - 54) = (2048/2 - 54) = 970
    // This means 970px from left edge to center, so:
    //   Left edge of board: 970 - 1024 = -54 (54px off-screen on left)
    //   Right edge of board: 970 + 1024 = 1994 (458px off-screen on right, since viewport is 1536)
    //
    // In our viewport (1536 wide), to match iOS:
    // - Board center should be at: 1536/2 + (offset to match iOS positioning)
    // - iOS had board center at X=970 in a 1536-wide viewport
    // - So we should use X = 970
    
    const board = this.add.image(0, 0, 'game_board');
    board.setOrigin(0.5, 0.5);
    
    // Position to match iOS exactly
    const boardX = 970;           // iOS: board.width/2 - 54 = 1024 - 54 = 970
    const boardY = GAME_HEIGHT * 0.5;  // 1024 (centered vertically)
    board.setPosition(boardX, boardY);

    // Create facilities container positioned relative to board
    // iOS LayerOrbitals has position (0, 0) in portrait mode, which means
    // facilities are positioned relative to the board's coordinate system.
    // 
    // Board positioning:
    // - Center: (970, 1024)
    // - Size: 2048×2048
    // - Top-left corner: (970 - 1024, 1024 - 1024) = (-54, 0)
    //
    // iOS LayerOrbitals is at (0, 0) in scene coordinates, not relative to board
    // Facilities use absolute scene coordinates
    this.facilitiesContainer = this.add.container(0, 0);

    // Add the main player HUD tray at the bottom
    this.mainPlayerHUD = new PlayerHUDLayer(this, this.currentPlayer);
    
    // Phase 7: Set re-roll callback
    this.mainPlayerHUD.setRerollCallback(() => this.handleRerollClick());

    // Add mini player trays at the top for other players
    for (let i = 0; i < this.numPlayers; i++) {
      if (i === this.currentPlayer) continue; // Skip current player
      const miniHUD = new MiniPlayerHUDLayer(this, i, this.numPlayers);
      this.miniPlayerHUDs.push(miniHUD);
    }
    
    // Phase 5: Create territory zones (background layer)
    this.createTerritorySprites();
    
    // Phase 5: Create facility visuals (graphics)
    this.createFacilityVisuals();
    
    // Phase 5: Create facility interaction zones
    this.createFacilitySprites();
    
    // Phase 5: Add debug overlay
    this.createDebugUI();
    
    // Phase 5: Add turn controls
    this.createTurnControls();
    
    // Phase 5: Create ship sprites
    this.createShipSprites();
    
    // Phase 5: Create dice roll manager
    this.createDiceRollManager();
    
    // Phase 5: Create tech card hand
    this.createTechCardHand();
    
    // Phase 5: Create AI visualization system
    this.createAIVisualization();
    
    // Phase 5: Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }
  
  /**
   * Create turn controls UI
   */
  private createTurnControls(): void {
    if (!this.gameState) return;
    
    // Use board layout positions
    const x = BoardLayout.TURN_CONTROLS.ROLL_DICE.x;
    const y = BoardLayout.TURN_CONTROLS.ROLL_DICE.y - 60; // Position container above first button
    
    this.turnControls = new TurnControls(
      this,
      x,
      y,
      () => this.handleRollDice(),
      () => this.handleEndTurn()
    );
    
    // Initial update
    const phase = this.gameState.getPhase();
    const activePlayer = this.gameState.getActivePlayer();
    if (activePlayer) {
      this.turnControls.updatePhase(phase, activePlayer.name);
    }
  }
  
  /**
   * Handle roll dice button click
   */
  private async handleRollDice(): Promise<void> {
    if (!this.gameState || !this.diceRollManager) return;
    
    const activePlayer = this.gameState.getActivePlayer();
    if (!activePlayer) return;
    
    console.log('Rolling dice for', activePlayer.name);
    
    // Show dice
    this.diceRollManager.setVisible(true);
    
    // Roll dice for active player's ships (get values first)
    const rolls = this.gameState.getShipManager().rollDice(activePlayer.id);
    console.log('Rolled:', rolls);
    
    // Animate dice rolling
    try {
      await this.diceRollManager.rollAll(rolls, 1500, 150);
    } catch (error) {
      console.error('Error rolling dice:', error);
    }
    
    // Update ship sprites with dice values
    const ships = this.gameState.getShipManager().getPlayerShips(activePlayer.id);
    ships.forEach(ship => {
      const sprite = this.shipSprites.get(ship.id);
      if (sprite && ship.diceValue) {
        sprite.setDiceValue(ship.diceValue);
      }
    });
    
    // Advance phase
    this.gameState.advancePhase();
    this.updateTurnControls();
    this.updatePlayerHUDs();
  }
  
  /**
   * Handle end turn button click
   */
  private async handleEndTurn(): Promise<void> {
    if (!this.gameState) return;
    
    console.log('Ending turn...');
    
    const oldPlayerId = this.gameState.getActivePlayer()?.id;
    const currentPhase = this.gameState.getPhase().current;
    
    // If in PLACE_SHIPS phase, advance to RESOLVE_ACTIONS and execute them
    if (currentPhase === 'PLACE_SHIPS') {
      this.gameState.advancePhase(); // Move to RESOLVE_ACTIONS
      
      // Check if territory selection is needed (for Colony Constructor or Terraforming Station)
      const facilitiesNeedingSelection = this.gameState.getFacilitiesNeedingTerritorySelection();
      const needsRaiders = this.gameState.needsRaidersChoice();
      
      // Gather territory selections if needed
      let territorySelections: Map<string, string> | undefined;
      if (facilitiesNeedingSelection.length > 0) {
        territorySelections = await this.getTerritorySelectionsFromPlayer(facilitiesNeedingSelection);
      }
      
      // Gather Raiders Outpost choices if needed
      let raidersChoices: { choice: 'resources' | 'tech'; targetPlayerId?: string; resources?: { ore: number; fuel: number; energy: number } } | undefined;
      if (needsRaiders) {
        raidersChoices = await this.getRaidersChoicesFromPlayer();
      }
      
      // Execute facility actions with selections
      const results = this.gameState.resolveActions(territorySelections, raidersChoices);
      console.log('Facility actions resolved:', results);
      
      // Check if Colonist Hub placed a colony (needs territory selection retroactively)
      const colonistHubResult = results.get('colonist_hub');
      let colonistHubTerritoryId: string | null = null;
      if (colonistHubResult && colonistHubResult.colonyPlaced) {
        // Show territory selector for the colony
        colonistHubTerritoryId = await this.getColonistHubTerritorySelection();
        if (colonistHubTerritoryId) {
          // Place the colony on the selected territory
          const activePlayer = this.gameState.getActivePlayer();
          if (activePlayer) {
            const success = this.gameState['territoryManager'].placeColony(activePlayer.id, colonistHubTerritoryId);
            if (!success) {
              console.warn(`Failed to place Colonist Hub colony on ${colonistHubTerritoryId}`);
            }
          }
        }
      }
      
      // Update colony sprites after placement
      if (facilitiesNeedingSelection.length > 0 || colonistHubTerritoryId) {
        const activePlayer = this.gameState.getActivePlayer();
        if (activePlayer) {
          // Track control before placement for control change detection
          const territoriesBeforeControl = new Map<string, string | null>();
          const territories = this.gameState.getAllTerritories();
          territories.forEach(territory => {
            territoriesBeforeControl.set(territory.id, territory.getControllingPlayer());
          });
          
          this.updateColonySprites();
          
          // Animate the newly placed colonies
          if (territorySelections) {
            territorySelections.forEach((territoryId) => {
              this.animateColonyPlacement(territoryId, activePlayer.color);
            });
          }
          if (colonistHubTerritoryId) {
            this.animateColonyPlacement(colonistHubTerritoryId, activePlayer.color);
          }
          
          // Check for territory control changes and animate
          territories.forEach(territory => {
            const beforeControl = territoriesBeforeControl.get(territory.id);
            const afterControl = territory.getControllingPlayer();
            if (beforeControl !== afterControl) {
              this.animateTerritoryControlChange(territory.id);
            }
          });
        }
      }
      
      // Show resource change notifications (stacked vertically to avoid overlap)
      const hudX = 768; // Center of screen
      const hudYBase = 300; // Below board
      let resourceOffsetY = 0;
      
      results.forEach((result) => {
        if (result.resourcesSpent) {
          if (result.resourcesSpent.ore) {
            this.showResourceChangeText(hudX - 40, hudYBase + resourceOffsetY, 'Ore', -result.resourcesSpent.ore);
            resourceOffsetY += 30;
          }
          if (result.resourcesSpent.fuel) {
            this.showResourceChangeText(hudX + 40, hudYBase + resourceOffsetY, 'Fuel', -result.resourcesSpent.fuel);
            resourceOffsetY += 30;
          }
          if (result.resourcesSpent.energy) {
            this.showResourceChangeText(hudX, hudYBase + resourceOffsetY, 'Energy', -result.resourcesSpent.energy);
            resourceOffsetY += 30;
          }
        }
        if (result.resourcesGained) {
          if (result.resourcesGained.ore) {
            this.showResourceChangeText(hudX - 40, hudYBase + resourceOffsetY, 'Ore', result.resourcesGained.ore);
            resourceOffsetY += 30;
          }
          if (result.resourcesGained.fuel) {
            this.showResourceChangeText(hudX + 40, hudYBase + resourceOffsetY, 'Fuel', result.resourcesGained.fuel);
            resourceOffsetY += 30;
          }
          if (result.resourcesGained.energy) {
            this.showResourceChangeText(hudX, hudYBase + resourceOffsetY, 'Energy', result.resourcesGained.energy);
            resourceOffsetY += 30;
          }
        }
      });
      
      // Update HUDs after resource changes
      this.updatePlayerHUDs();
    } else {
      // For other phases, keep advancing until turn changes
      // This handles COLLECT_RESOURCES, PURCHASE, and END_TURN phases
      while (this.gameState.getActivePlayer()?.id === oldPlayerId) {
        this.gameState.advancePhase();
        // Break if we're back at ROLL_DICE (new player's turn)
        if (this.gameState.getPhase().current === 'ROLL_DICE') {
          break;
        }
      }
    }
    
    this.updateTurnControls();
    this.updatePlayerHUDs();
    this.updateTechCardHand();
    
    const newPlayer = this.gameState.getActivePlayer();
    
    // Check if turn changed to an AI player
    if (newPlayer && newPlayer.id !== oldPlayerId) {
      const config = this.playerConfigs.find(c => c.color === newPlayer.color);
      if (config && config.controller.startsWith('AI:')) {
        // Show notification of turn change
        if (this.aiAnimator) {
          this.aiAnimator.showInfo(`${newPlayer.name}'s turn`, 2000);
        }
        
        // Process AI turn after a short delay
        await this.delay(1000);
        await this.processAITurn();
      }
    }
  }
  
  /**
   * Process AI player's turn
   */
  private async processAITurn(): Promise<void> {
    if (!this.gameState || !this.aiAnimator) return;
    
    const activePlayer = this.gameState.getActivePlayer();
    if (!activePlayer) return;
    
    // Check if this is an AI player
    const config = this.playerConfigs.find(c => c.color === activePlayer.color);
    if (!config || !config.controller.startsWith('AI:')) return;
    
    // Get AI controller
    const ai = this.aiPlayers.get(activePlayer.id);
    if (!ai) return;
    
    console.log(`Processing AI turn for ${activePlayer.name}`);
    
    // Show thinking indicator
    this.aiAnimator.showThinking(activePlayer.name);
    
    // Simulate AI decision making delay
    await this.delay(800);
    
    // TODO: Actually execute AI actions
    // For now, just show some example notifications
    await this.aiAnimator.animateAction(activePlayer.name, 'Rolling dice...', 600);
    await this.aiAnimator.animateDiceRoll(activePlayer.name, [3, 4, 5]);
    await this.aiAnimator.animateAction(activePlayer.name, 'Placing ships...', 800);
    
    // Hide thinking indicator
    this.aiAnimator.hideThinking();
    
    // End AI turn
    await this.aiAnimator.animateTurnEnd(activePlayer.name);
    
    // Advance to next turn
    this.gameState.advancePhase();
    this.updateTurnControls();
  }
  
  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.time.delayedCall(ms, () => resolve());
    });
  }
  
  /**
   * Update turn controls with current phase
   */
  private updateTurnControls(): void {
    if (!this.turnControls || !this.gameState) return;
    
    const phase = this.gameState.getPhase();
    const activePlayer = this.gameState.getActivePlayer();
    if (activePlayer) {
      this.turnControls.updatePhase(phase, activePlayer.name);
    }
  }
  
  /**
   * Create territory sprites
   */
  private createTerritorySprites(): void {
    // Create territory zones on the board using layout config
    Object.entries(BoardLayout.TERRITORIES).forEach(([key, territory]) => {
      const territorySprite = new TerritorySprite(
        this,
        territory.x,
        territory.y,
        150, // width
        100, // height
        territory.name,
        1 // bonusVP
      );
      this.territorySprites.set(territory.name, territorySprite);
    });
    
    console.log(`Created ${this.territorySprites.size} territory sprites`);
  }
  
  /**
   * Create facility interaction zones
   */
  /**
   * Create facility visual representations (graphics, labels, icons)
   */
  private createFacilityVisuals(): void {
    if (!this.facilitiesContainer) return;

    // Import dynamically to avoid circular dependencies
    const { FacilityVisual, FACILITY_VISUALS } = require('../ui/facility-visual');
    
    // Create visual representation for each facility
    Object.values(FACILITY_VISUALS).forEach((config: any) => {
      const visual = new FacilityVisual(this, config);
      this.facilitiesContainer!.add(visual.getContainer());
      this.facilityVisuals.push(visual);
    });
    
    console.log(`Created ${this.facilityVisuals.length} facility visuals`);
  }

  private createFacilitySprites(): void {
    if (!this.facilitiesContainer) return;
    
    // Create a facility sprite for each facility location using board layout
    Object.values(FACILITY_DATA).forEach(facilityInfo => {
      // Get position from board layout (these are in iOS coordinates relative to board)
      const layoutKey = facilityInfo.name.toUpperCase().replace(/ /g, '_');
      const dockPos = BoardLayout.FACILITY_DOCKS[layoutKey];
      
      if (dockPos) {
        // Use the board layout positions directly since they're already relative to board
        const positionedFacilityInfo = {
          ...facilityInfo,
          x: dockPos.x,
          y: dockPos.y,
        };
        const facilitySprite = new FacilitySprite(this, positionedFacilityInfo);
        
        // Add to the facilities container instead of directly to scene
        this.facilitiesContainer!.add(facilitySprite.getContainer());
        
        this.facilitySprites.set(facilityInfo.location, facilitySprite);
      } else {
        console.warn(`No board layout position for facility: ${facilityInfo.name}`);
      }
    });
    
    console.log(`Created ${this.facilitySprites.size} facility sprites in container at (${this.facilitiesContainer.x}, ${this.facilitiesContainer.y})`);
  }
  
  /**
   * Create ship sprites for all players
   */
  private createShipSprites(): void {
    if (!this.gameState || !this.mainPlayerHUD) return;
    
    // Get all players
    const players = this.gameState.getAllPlayers();
    
    // Create ships for each player
    players.forEach((player, playerIndex) => {
      const ships = this.gameState!.getShipManager().getPlayerShips(player.id);
      
      // Get player tray position from board layout
      const trayPos = BoardLayout.PLAYER_TRAYS[playerIndex];
      if (!trayPos) {
        console.warn(`No tray position for player ${playerIndex}`);
        return;
      }
      
      ships.forEach((ship, shipIndex) => {
        const x = trayPos.x + (shipIndex * 60); // Space ships 60 pixels apart
        const y = trayPos.y;
        
        const shipSprite = new ShipSprite(
          this,
          x,
          y,
          ship,
          player.color
        );
        
        // Set up drag callbacks
        shipSprite.onDragStart = () => {
          console.log(`Dragging ship ${ship.id}`);
        };
        
        shipSprite.onDragEnd = (location) => {
          console.log(`Ship ${ship.id} dropped at ${location}`);
          this.updatePlayerHUDs();
        };
        
        shipSprite.onValidatePlacement = (x, y) => {
          return this.validateShipPlacement(ship.id, x, y);
        };
        
        this.shipSprites.set(ship.id, shipSprite);
      });
    });
    
    console.log(`Created ${this.shipSprites.size} ship sprites`);
  }
  
  /**
   * Create dice roll manager
   */
  private createDiceRollManager(): void {
    if (!this.gameState) return;
    
    this.diceRollManager = new DiceRollManager(this);
    
    // Create dice using board layout positions
    const maxDice = 3; // Start with 3 dice per player
    const startX = BoardLayout.getDicePosition(0, maxDice).x;
    const startY = BoardLayout.DICE_AREA.y;
    const spacing = BoardLayout.DICE_AREA.spacing;
    
    // Get active player color
    const activePlayer = this.gameState.getActivePlayer();
    const color = activePlayer ? Phaser.Display.Color.HexStringToColor(activePlayer.color).color : 0xffffff;
    
    this.diceRollManager.createDice(maxDice, startX, startY, spacing, color);
    
    // Initially hide dice until first roll
    this.diceRollManager.setVisible(false);
    
    console.log('Created dice roll manager');
  }
  
  /**
   * Create tech card hand display
   */
  private createTechCardHand(): void {
    if (!this.gameState) return;
    
    // Position using board layout
    const x = BoardLayout.TECH_CARD_HAND.x;
    const y = BoardLayout.TECH_CARD_HAND.y;
    
    this.techCardHand = new TechCardHand(this, x, y);
    
    // Set up callbacks
    this.techCardHand.onUseCard = (card) => {
      this.handleUseTechCard(card);
    };
    
    this.techCardHand.onDiscardCard = (card) => {
      this.handleDiscardTechCard(card);
    };
    
    // Create Alien Artifact card display
    this.createAlienArtifactDisplay();
    
    // Update with active player's cards
    this.updateTechCardHand();
    
    console.log('Created tech card hand');
  }

  /**
   * Create Alien Artifact card display
   */
  private createAlienArtifactDisplay(): void {
    if (!this.gameState) return;
    
    // Position near center-right of screen
    const x = 550;
    const y = 200;
    
    this.alienArtifactDisplay = new AlienArtifactCardDisplay(this, x, y);
    
    // Set up callbacks
    this.alienArtifactDisplay.onClaimCard = (card) => {
      this.handleClaimTechCard(card);
    };
    
    this.alienArtifactDisplay.onCycleCards = () => {
      this.handleCycleTechCards();
    };
    
    // Show it by default and update with current cards
    this.updateAlienArtifactDisplay();
    this.alienArtifactDisplay.show();
    
    console.log('Created Alien Artifact display');
  }

  /**
   * Handle using a tech card
   */
  private handleUseTechCard(card: any): void {
    if (!this.gameState) return;
    
    const activePlayer = this.gameState.getActivePlayer();
    if (!activePlayer) return;
    
    const success = this.gameState.useTechCard(activePlayer.id, card.id);
    if (success) {
      console.log(`Used: ${card.name}`);
      this.updateTechCardHand();
      this.showResourceChangeText(768, 400, card.name, 0); // Show card name at center
    } else {
      console.warn(`Cannot use ${card.name}`);
    }
  }

  /**
   * Handle discarding a tech card
   */
  private handleDiscardTechCard(card: any): void {
    if (!this.gameState) return;
    
    const activePlayer = this.gameState.getActivePlayer();
    if (!activePlayer) return;
    
    const success = this.gameState.discardTechCard(activePlayer.id, card.id);
    if (success) {
      console.log(`Discarded: ${card.name}`);
      this.updateTechCardHand();
    } else {
      console.warn(`Cannot discard ${card.name}`);
    }
  }

  /**
   * Handle claiming a tech card from Alien Artifact
   */
  private handleClaimTechCard(card: any): void {
    if (!this.gameState) return;
    
    const activePlayer = this.gameState.getActivePlayer();
    if (!activePlayer) return;
    
    const success = this.gameState.claimTechCard(activePlayer.id, card.id);
    if (success) {
      console.log(`Claimed: ${card.name}`);
      this.updateTechCardHand();
      this.updateAlienArtifactDisplay();
    } else {
      console.warn(`Cannot claim ${card.name}`);
    }
  }

  /**
   * Handle cycling tech cards at Alien Artifact
   */
  private handleCycleTechCards(): void {
    if (!this.gameState) return;
    
    this.gameState.cycleTechCards();
    console.log('Tech cards cycled');
    this.updateAlienArtifactDisplay();
  }

  /**
   * Update Alien Artifact display
   */
  private updateAlienArtifactDisplay(): void {
    if (!this.alienArtifactDisplay || !this.gameState) return;
    
    const visibleCards = this.gameState.getVisibleTechCards();
    const deckSize = this.gameState.getTechCardDeckSize();
    const discardSize = this.gameState.getTechCardDiscardSize();
    
    // Check if active player has ships at Alien Artifact with total > 7
    const activePlayer = this.gameState.getActivePlayer();
    const facility = this.gameState.getFacility('alien_artifact');
    let canClaim = false;
    
    if (activePlayer && facility) {
      const allShips = facility.getDockedShips();
      const playerShips = allShips.filter(ship => ship.playerId === activePlayer.id);
      const totalValue = playerShips.reduce((sum, ship) => sum + (ship.diceValue || 0), 0);
      canClaim = totalValue > 7;
    }
    
    this.alienArtifactDisplay.updateDisplay(visibleCards, deckSize, discardSize, canClaim);
  }
  
  /**
   * Update tech card hand with current player's cards
   */
  private updateTechCardHand(): void {
    if (!this.techCardHand || !this.gameState) return;
    
    const activePlayer = this.gameState.getActivePlayer();
    if (!activePlayer) return;
    
    // Get tech card instances from player's card IDs
    const cardIds = activePlayer.alienTechCards;
    const cards = this.gameState.getTechCardsByIds(cardIds);
    this.techCardHand.setCards(cards);
  }
  
  /**
   * Create AI visualization system
   */
  private createAIVisualization(): void {
    // Position notifications using board layout
    const x = BoardLayout.NOTIFICATION_AREA.x;
    const y = BoardLayout.NOTIFICATION_AREA.y;
    
    this.notificationManager = new NotificationManager(this, x, y);
    this.aiAnimator = new AIActionAnimator(this, this.notificationManager);
    
    // Default speed is 1.0x (can be adjusted with keyboard shortcuts)
    this.aiAnimator.setSpeed(1.0);
    
    console.log('Created AI visualization system');
  }
  
  /**
   * Validate ship placement at coordinates
   * Returns { valid: boolean, location: ShipLocation | null }
   */
  private validateShipPlacement(shipId: string, x: number, y: number): { valid: boolean; location: ShipLocation | null } {
    // Check each facility sprite
    const facilities = Array.from(this.facilitySprites.entries());
    for (const [location, facilitySprite] of facilities) {
      if (facilitySprite.containsPoint(x, y)) {
        // Found a facility, now validate if ship can be placed there
        const ship = this.gameState?.getShipManager().getShip(shipId);
        if (!ship || !ship.diceValue) {
          return { valid: false, location: null };
        }
        
        // TODO: Check facility requirements (dice values, player resources, etc.)
        // For now, allow any placement if ship has dice value
        return { valid: true, location: location };
      }
    }
    
    // Not over any facility
    return { valid: false, location: null };
  }
  
  /**
   * Create debug UI overlay
   */
  private createDebugUI(): void {
    if (!this.showDebug || !this.gameState) return;
    
    const debugBg = this.add.rectangle(20, 20, 500, 400, 0x000000, 0.7);
    debugBg.setOrigin(0, 0);
    
    this.debugText = this.add.text(30, 30, '', {
      fontSize: '16px',
      color: '#00ff00',
      fontFamily: 'monospace'
    });
    
    this.updateDebugUI();
    
    // Draw debug markers for board layout positions
    this.drawDebugMarkers();
  }
  
  /**
   * Draw visual markers at all board layout positions
   */
  private drawDebugMarkers(): void {
    const graphics = this.add.graphics();
    
    // Facility positions - RED circles
    Object.entries(BoardLayout.FACILITY_DOCKS).forEach(([name, pos]) => {
      graphics.lineStyle(2, 0xff0000, 0.8);
      graphics.strokeCircle(pos.x, pos.y, 40);
      this.add.text(pos.x, pos.y - 50, name, {
        fontSize: '12px',
        color: '#ff0000',
        backgroundColor: '#000000'
      }).setOrigin(0.5);
    });
    
    // Territory positions - GREEN circles
    Object.entries(BoardLayout.TERRITORIES).forEach(([name, pos]) => {
      graphics.lineStyle(2, 0x00ff00, 0.8);
      graphics.strokeCircle(pos.x, pos.y, 30);
      this.add.text(pos.x, pos.y + 40, pos.name, {
        fontSize: '10px',
        color: '#00ff00',
        backgroundColor: '#000000'
      }).setOrigin(0.5);
    });
    
    // Player tray positions - YELLOW circles
    Object.entries(BoardLayout.PLAYER_TRAYS).forEach(([index, pos]) => {
      graphics.lineStyle(2, 0xffff00, 0.8);
      graphics.strokeCircle(pos.x, pos.y, 25);
      this.add.text(pos.x, pos.y + 35, `Player ${index}`, {
        fontSize: '10px',
        color: '#ffff00',
        backgroundColor: '#000000'
      }).setOrigin(0.5);
    });
    
    // Dice area - CYAN circle
    graphics.lineStyle(2, 0x00ffff, 0.8);
    graphics.strokeCircle(BoardLayout.DICE_AREA.x, BoardLayout.DICE_AREA.y, 50);
    this.add.text(BoardLayout.DICE_AREA.x, BoardLayout.DICE_AREA.y, 'DICE', {
      fontSize: '12px',
      color: '#00ffff',
      backgroundColor: '#000000'
    }).setOrigin(0.5);
    
    // Turn controls - MAGENTA circle
    graphics.lineStyle(2, 0xff00ff, 0.8);
    graphics.strokeCircle(BoardLayout.TURN_CONTROLS.ROLL_DICE.x, BoardLayout.TURN_CONTROLS.ROLL_DICE.y, 30);
    this.add.text(BoardLayout.TURN_CONTROLS.ROLL_DICE.x, BoardLayout.TURN_CONTROLS.ROLL_DICE.y + 40, 'CONTROLS', {
      fontSize: '10px',
      color: '#ff00ff',
      backgroundColor: '#000000'
    }).setOrigin(0.5);
  }
  
  /**
   * Update debug UI with current game state
   */
  private updateDebugUI(): void {
    if (!this.debugText || !this.gameState) return;
    
    const phase = this.gameState.getPhase();
    const activePlayer = this.gameState.getActivePlayer();
    const allPlayers = this.gameState.getAllPlayers();
    
    let text = '=== GAME STATE ===\n';
    text += `Turn: ${phase.roundNumber}\n`;
    text += `Phase: ${phase.current}\n`;
    text += `Active: ${activePlayer?.name || 'None'}\n`;
    text += `\n=== PLAYERS ===\n`;
    
    allPlayers.forEach(player => {
      const isActive = player.id === phase.activePlayerId;
      text += `${isActive ? '>' : ' '} ${player.name}:\n`;
      text += `  Ore: ${player.resources.ore} | Fuel: ${player.resources.fuel}\n`;
      text += `  Colonies: ${player.colonies.length}\n`;
      text += `  Tech Cards: ${player.alienTechCards.length}\n`;
    });
    
    text += `\n[D] Toggle Debug`;
    
    this.debugText.setText(text);
  }
  
  /**
   * Setup keyboard shortcuts for testing
   */
  private setupKeyboardShortcuts(): void {
    // Toggle debug overlay with D key
    this.input.keyboard?.on('keydown-D', () => {
      this.showDebug = !this.showDebug;
      if (this.debugText) {
        this.debugText.setVisible(this.showDebug);
        // Also toggle the background
        const bg = this.debugText.parentContainer?.list[0];
        if (bg) {
          (bg as Phaser.GameObjects.Rectangle).setVisible(this.showDebug);
        }
      }
      if (this.showDebug && !this.debugText) {
        this.createDebugUI();
      }
    });
    
    // AI Speed controls
    // MINUS/UNDERSCORE: Slow down AI (0.5x)
    this.input.keyboard?.on('keydown-MINUS', () => {
      if (this.aiAnimator) {
        this.aiAnimator.setSpeed(0.5);
        this.aiAnimator.showInfo('AI Speed: 0.5x (Slow)', 1500);
      }
    });
    
    // EQUALS/PLUS: Normal AI speed (1.0x)
    this.input.keyboard?.on('keydown-PLUS', () => {
      if (this.aiAnimator) {
        this.aiAnimator.setSpeed(1.0);
        this.aiAnimator.showInfo('AI Speed: 1.0x (Normal)', 1500);
      }
    });
    
    // ZERO: Fast AI speed (2.0x)
    this.input.keyboard?.on('keydown-ZERO', () => {
      if (this.aiAnimator) {
        this.aiAnimator.setSpeed(2.0);
        this.aiAnimator.showInfo('AI Speed: 2.0x (Fast)', 1500);
      }
    });
    
    // ONE: Very fast AI speed (5.0x)
    this.input.keyboard?.on('keydown-ONE', () => {
      if (this.aiAnimator) {
        this.aiAnimator.setSpeed(5.0);
        this.aiAnimator.showInfo('AI Speed: 5.0x (Very Fast)', 1500);
      }
    });

    // A: Toggle Alien Artifact card display
    this.input.keyboard?.on('keydown-A', () => {
      if (this.alienArtifactDisplay) {
        const isVisible = this.alienArtifactDisplay.visible;
        if (isVisible) {
          this.alienArtifactDisplay.hide();
        } else {
          this.updateAlienArtifactDisplay();
          this.alienArtifactDisplay.show();
        }
      }
    });
  }
  
  /**
   * Update loop - sync UI with game state
   */
  public update(time: number, delta: number): void {
    if (this.gameState) {
      this.updateDebugUI();
      this.updatePlayerHUDs();
      this.checkForVictory();
    }
  }
  
  /**
   * Update all player HUD displays with current game state
   */
  private updatePlayerHUDs(): void {
    if (!this.gameState) return;
    
    const allPlayers = this.gameState.getAllPlayers();
    
    // Update main player HUD
    if (this.mainPlayerHUD) {
      const currentPlayer = allPlayers[this.currentPlayer];
      if (currentPlayer) {
        this.mainPlayerHUD.updatePlayerState(currentPlayer);
        
        // Phase 7: Update Bradbury Plateau re-roll button
        const canReroll = this.gameState.canUseBradburyReroll();
        this.mainPlayerHUD.setRerollAvailable(canReroll);
      }
    }
    
    // Update mini player HUDs
    this.miniPlayerHUDs.forEach((hud, index) => {
      // Mini HUDs are for other players
      let playerIndex = index;
      if (playerIndex >= this.currentPlayer) {
        playerIndex++; // Skip current player
      }
      const player = allPlayers[playerIndex];
      if (player) {
        hud.updatePlayerState(player);
      }
    });
  }
  
  /**
   * Check for victory condition and show overlay if game is won
   */
  private checkForVictory(): void {
    if (!this.gameState || this.victoryOverlay) return;
    
    // Check if game is over
    if (!this.gameState.isGameOver()) return;
    
    // Get winner(s)
    const winners = this.gameState.getWinners();
    if (winners.length === 0) return;
    
    const winner = winners[0];
    const isTied = winners.length > 1;
    
    console.log('Victory detected!', winner.name, isTied ? '(TIED)' : '');
    
    // Get all players for score display
    const allPlayers = this.gameState.getAllPlayers();
    
    // Create victory overlay
    this.victoryOverlay = new VictoryOverlay(
      this,
      allPlayers,
      winner,
      isTied
    );
    
    // Set up callbacks
    this.victoryOverlay.onRematch = () => {
      this.handleRematch();
    };
    
    this.victoryOverlay.onMainMenu = () => {
      this.handleMainMenu();
    };
    
    // Phase 7: Create modals
    this.territorySelectorModal = new TerritorySelectorModal(this);
    this.playerSelectorModal = new PlayerSelectorModal(this);
    this.resourcePickerModal = new ResourcePickerModal(this);
    this.raidersChoiceModal = new RaidersChoiceModal(this);
    
    // If tied, show tiebreaker info
    if (isTied) {
      const tiebreakerMsg = this.getTiebreakerMessage(winners);
      if (tiebreakerMsg) {
        this.victoryOverlay.showTiebreakerInfo(this, tiebreakerMsg);
      }
    }
  }
  
  /**
   * Get tiebreaker message
   */
  private getTiebreakerMessage(tiedPlayers: any[]): string {
    // In Alien Frontiers, tiebreaker is:
    // 1. Most colonies
    // 2. Most tech cards
    // 3. Tied game
    
    if (tiedPlayers.length < 2) return '';
    
    const names = tiedPlayers.map(p => p.name).join(' and ');
    return `Tied! ${names} share victory with equal scores.`;
  }
  
  /**
   * Handle rematch button
   */
  private handleRematch(): void {
    console.log('Rematch requested');
    
    // Destroy victory overlay
    if (this.victoryOverlay) {
      this.victoryOverlay.destroy();
      this.victoryOverlay = null;
    }
    
    // Restart the scene
    this.scene.restart();
  }
  
  /**
   * Handle main menu button
   */
  private handleMainMenu(): void {
    console.log('Returning to main menu...');
    
    // Destroy victory overlay
    if (this.victoryOverlay) {
      this.victoryOverlay.destroy();
      this.victoryOverlay = null;
    }
    
    // TODO: Switch to main menu scene
    // For now, just restart
    this.scene.restart();
  }

  /**
   * Phase 7: Get territory selections from player for facilities that need them
   */
  private async getTerritorySelectionsFromPlayer(facilityIds: string[]): Promise<Map<string, string>> {
    const selections = new Map<string, string>();
    const player = this.gameState?.getActivePlayer();
    if (!player || !this.territorySelectorModal) {
      return selections;
    }

    const territories = this.gameState.getAllTerritories();

    // Show modal for each facility that needs territory selection
    for (const facilityId of facilityIds) {
      const territoryId = await new Promise<string | null>((resolve) => {
        if (!this.territorySelectorModal) {
          resolve(null);
          return;
        }
        
        this.territorySelectorModal.show(territories, player, (selectedTerritoryId) => {
          resolve(selectedTerritoryId);
        });
      });

      if (territoryId) {
        selections.set(facilityId, territoryId);
      }
    }

    return selections;
  }

  /**
   * Phase 7: Get territory selection for Colonist Hub colony
   * Called after colony has been placed on track and resources spent
   */
  private async getColonistHubTerritorySelection(): Promise<string | null> {
    const player = this.gameState?.getActivePlayer();
    if (!player || !this.territorySelectorModal) {
      return null;
    }

    const territories = this.gameState.getAllTerritories();

    return new Promise<string | null>((resolve) => {
      if (!this.territorySelectorModal) {
        resolve(null);
        return;
      }
      
      this.territorySelectorModal.show(territories, player, (selectedTerritoryId) => {
        resolve(selectedTerritoryId);
      });
    });
  }

  /**
   * Phase 7: Get Raiders Outpost choices from player (choice, target, resources)
   */
  private async getRaidersChoicesFromPlayer(): Promise<{ choice: 'resources' | 'tech'; targetPlayerId?: string; resources?: { ore: number; fuel: number; energy: number } } | undefined> {
    const player = this.gameState?.getActivePlayer();
    if (!player || !this.raidersChoiceModal || !this.playerSelectorModal || !this.resourcePickerModal) {
      return undefined;
    }

    // Step 1: Choice modal (resources or tech)
    const choice = await new Promise<'resources' | 'tech' | null>((resolve) => {
      this.raidersChoiceModal!.show((selected) => {
        resolve(selected);
      });
    });

    if (!choice) return undefined;

    // Step 2: Player selector modal
    const allPlayers = this.gameState.getAllPlayers();
    const otherPlayers = allPlayers.filter(p => p.id !== player.id);
    
    if (otherPlayers.length === 0) return undefined;

    const targetPlayerId = await new Promise<string | null>((resolve) => {
      this.playerSelectorModal!.show(otherPlayers, (selected) => {
        resolve(selected);
      });
    });

    if (!targetPlayerId) return undefined;

    // Step 3: If resources chosen, show resource picker
    if (choice === 'resources') {
      const resources = await new Promise<{ ore: number; fuel: number; energy: number } | null>((resolve) => {
        this.resourcePickerModal!.show(4, (selected) => {
          resolve(selected);
        });
      });

      if (!resources) return undefined;

      return { choice, targetPlayerId, resources };
    } else {
      // Tech card theft - no further choices needed
      return { choice, targetPlayerId };
    }
  }

  /**
   * Phase 7: Update colony sprites after colony placement
   */
  private updateColonySprites(): void {
    if (!this.gameState) return;

    // Remove existing colony sprites
    this.colonySprites.forEach(sprite => sprite.destroy());
    this.colonySprites = [];

    // Get all territories and their colonies
    const territories = this.gameState.getAllTerritories();
    territories.forEach(territory => {
      const colonies = territory.getColonies();
      const territoryData = TERRITORY_DATA[territory.id];
      
      if (!territoryData) return;

      // Create sprites for each colony on this territory
      colonies.forEach((colony) => {
        const player = this.gameState!.getAllPlayers().find(p => p.id === colony.playerId);
        if (!player) return;

        const colonySprite = new ColonySprite(
          this,
          territoryData.x,
          territoryData.y,
          territory.name,
          player.color
        );
        
        this.colonySprites.push(colonySprite);
      });
    });
  }

  /**
   * Phase 7: Handle Bradbury Plateau re-roll button click
   */
  private handleRerollClick(): void {
    if (!this.gameState) return;

    const player = this.gameState.getActivePlayer();
    if (!player) return;

    // Get player's ships with dice values
    const ships = this.gameState.getShipManager().getPlayerShips(player.id);
    const rolledShips = ships.filter(s => s.diceValue !== null && s.location === null);

    if (rolledShips.length === 0) {
      console.log('No ships available to re-roll');
      return;
    }

    // For now, re-roll the first ship (TODO: Add ship selector modal)
    const shipToReroll = rolledShips[0];
    const oldValue = shipToReroll.diceValue;
    const newValue = this.gameState.rerollDie(shipToReroll.id);

    if (newValue !== null) {
      console.log(`Re-rolled ship from ${oldValue} to ${newValue}`);
      
      // Update ship sprite if it exists
      const shipSprite = this.shipSprites.get(shipToReroll.id);
      if (shipSprite) {
        shipSprite.setDiceValue(newValue as 1 | 2 | 3 | 4 | 5 | 6);
      }
      
      // Update HUDs to reflect that re-roll is now used
      this.updatePlayerHUDs();
      
      // Show notification
      if (this.aiAnimator) {
        this.aiAnimator.showInfo(`Re-rolled ${oldValue} → ${newValue}`, 2000);
      }
    }
  }

  /**
   * Phase 7: Animate colony placement with scale-up bounce effect
   */
  private animateColonyPlacement(territoryId: string, playerColor: string): void {
    // Find the last colony sprite added (most recent placement)
    // This assumes updateColonySprites was just called
    if (this.colonySprites.length === 0) return;

    const lastColony = this.colonySprites[this.colonySprites.length - 1];
    
    // Start at scale 0 and bounce up
    lastColony.setScale(0);
    this.tweens.add({
      targets: lastColony,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Small secondary bounce
        this.tweens.add({
          targets: lastColony,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 150,
          yoyo: true,
          ease: 'Sine.easeInOut'
        });
      }
    });
  }

  /**
   * Phase 7: Show floating text for resource changes (+/- amounts)
   */
  private showResourceChangeText(x: number, y: number, resource: string, amount: number): void {
    const color = amount > 0 ? '#00ff00' : '#ff0000';
    const prefix = amount > 0 ? '+' : '';
    const text = this.add.text(x, y, `${prefix}${amount} ${resource}`, {
      fontSize: '20px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });

    // Float up and fade out
    this.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  /**
   * Phase 7: Show floating text for victory point changes
   */
  private showVictoryPointText(x: number, y: number, amount: number): void {
    const color = '#ffd700'; // Gold color for VPs
    const prefix = amount > 0 ? '+' : '';
    const text = this.add.text(x, y, `${prefix}${amount} VP`, {
      fontSize: '24px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });

    // Float up and fade out with slight scale
    text.setScale(0.5);
    this.tweens.add({
      targets: text,
      y: y - 100,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 2000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  /**
   * Phase 7: Animate territory control change with glow pulse
   */
  private animateTerritoryControlChange(territoryId: string): void {
    const territoryData = TERRITORY_DATA[territoryId];
    if (!territoryData) return;

    // Create a temporary glow sprite
    const glow = this.add.circle(territoryData.x, territoryData.y, 60, 0xffffff, 0.5);
    
    // Pulse animation
    this.tweens.add({
      targets: glow,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        glow.destroy();
      }
    });
  }

  public shutdown(): void {
    // Clean up layers when scene shuts down
    if (this.mainPlayerHUD) {
      this.mainPlayerHUD.destroy();
    }
    this.miniPlayerHUDs.forEach(hud => hud.destroy());
    
    // Clean up turn controls
    if (this.turnControls) {
      this.turnControls.destroy();
    }
    
    // Clean up victory overlay
    if (this.victoryOverlay) {
      this.victoryOverlay.destroy();
      this.victoryOverlay = null;
    }
    
    // Clean up AI animator
    if (this.aiAnimator) {
      this.aiAnimator.destroy();
    }
  }
}
