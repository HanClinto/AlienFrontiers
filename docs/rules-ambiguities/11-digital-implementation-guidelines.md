# Digital Implementation Guidelines & UX Recommendations

## Purpose
This document provides architectural guidance and user experience recommendations for implementing Alien Frontiers as a digital board game. Based on the 130 ambiguities analyzed in Documents 1-10, this guide addresses complexity management, turn structure, and player interaction patterns.

---

## Turn Phases to Simplify Complexity

The rules describe a flexible turn where players can "use alien tech and assign ships in any order" (Page 16). For digital implementation, structured phases provide clarity while maintaining strategic flexibility.

### Recommended Phase Structure

```javascript
enum TurnPhase {
  GATHER = 'gather',      // Auto-gather ships from Maintenance Bay, Terraforming
  ROLL = 'roll',          // Roll fleet (player action)
  RESOURCE_CACHE = 'resource_cache',  // Auto-check Resource Cache (if present)
  MAIN = 'main',          // Ship assignment and alien tech usage
  DISCARD = 'discard',    // Discard down to 8 resources
  END = 'end'             // Auto-cleanup and pass turn
}

class TurnManager {
  constructor(player) {
    this.player = player;
    this.phase = TurnPhase.GATHER;
    this.shipsPlaced = [];
    this.techCardsUsed = [];
  }
  
  // Phase transition logic
  advancePhase() {
    switch (this.phase) {
      case TurnPhase.GATHER:
        this.gatherShips();
        this.phase = TurnPhase.ROLL;
        break;
        
      case TurnPhase.ROLL:
        // Player must explicitly roll
        // (Button click or auto-roll after 3 seconds)
        break;
        
      case TurnPhase.RESOURCE_CACHE:
        this.checkResourceCache();
        this.phase = TurnPhase.MAIN;
        break;
        
      case TurnPhase.MAIN:
        // Player explicitly ends main phase
        // (Validation: all ships assigned or in Maintenance Bay)
        if (this.canEndMainPhase()) {
          this.phase = TurnPhase.DISCARD;
        }
        break;
        
      case TurnPhase.DISCARD:
        this.discardToEight();
        this.phase = TurnPhase.END;
        break;
        
      case TurnPhase.END:
        this.cleanup();
        game.nextPlayer();
        break;
    }
  }
  
  // Check if main phase can end
  canEndMainPhase() {
    // All ships must be assigned (docked or in Maintenance Bay)
    return this.player.fleet.every(s => s.docked || s.inMaintenanceBay);
  }
}
```

### Phase Transition UX

**Gather Phase (Auto):**
- Show animation of ships moving from Maintenance Bay/Terraforming to fleet
- Display count: "Gathering 3 ships..."
- Duration: 0.5s per ship

**Roll Phase (Player Action):**
- Prominent "Roll Dice" button
- Show dice rolling animation (2 seconds)
- Play satisfying sound effect
- Auto-advance after roll completes

**Resource Cache Phase (Auto, if applicable):**
- Show Resource Cache card highlighting
- Display odd/even count calculation
- Animate resource gain
- If equal: Show "Resource Cache discarded" message

**Main Phase (Flexible):**
- Primary UI state (most time spent here)
- Two simultaneous action types available:
  - Ship assignment (click ship → click facility)
  - Alien tech usage (click card → select targets)
- "End Turn" button (enabled when all ships assigned)
- Visual indicator: Ships remaining to assign

**Discard Phase (Player Action, if needed):**
- Only appears if resources > 8
- Show resource selection UI
- Highlight resources to discard (player choice)
- Confirm button

**End Phase (Auto):**
- Reset turn flags (card usage, discard tracking)
- Brief summary: "Turn complete" (0.5s)
- Pass to next player

---

## Automated Validation

### Legal Move Highlighting

```javascript
class FacilityValidator {
  // Highlight facilities based on current game state
  static getAvailableFacilities(player, ship) {
    let available = [];
    
    for (let facility of game.facilities) {
      let validation = this.validateShipPlacement(player, ship, facility);
      
      available.push({
        facility: facility,
        status: validation.status,  // 'legal', 'missing-resources', 'illegal'
        reason: validation.reason,
        cost: validation.cost
      });
    }
    
    return available;
  }
  
  // Example validation logic
  static validateShipPlacement(player, ship, facility) {
    switch (facility.id) {
      case 'ColonyConstructor':
        // Need 3 ships of same value
        let matchingShips = player.fleet.filter(s => 
          !s.docked && s.value === ship.value
        );
        
        if (matchingShips.length < 3) {
          return { status: 'illegal', reason: 'Need 3 ships of same value' };
        }
        
        if (player.ore < 3) {
          return { status: 'missing-resources', reason: 'Need 3 ore', cost: { ore: 3 } };
        }
        
        return { status: 'legal', cost: { ore: 3 } };
        
      case 'LunarMine':
        let minValue = facility.getHighestValue() || 1;
        
        // Check Van Vogt Mountains
        if (player.controlsTerritory('VanVogtMountains') && 
            player.shipsDockedThisTurn.length === 0) {
          minValue = 1;
        }
        
        if (ship.value < minValue) {
          return { status: 'illegal', reason: `Ship must be ≥ ${minValue}` };
        }
        
        return { status: 'legal', cost: null };
        
      // ... other facilities
    }
  }
}
```

### UI Implementation

**Visual Indicators:**
- **Green glow:** Facility available (have resources, meet requirements)
- **Yellow glow:** Facility available but need resources (show cost tooltip)
- **Red border:** Facility unavailable (cannot use with current ships)
- **Greyed out:** Facility occupied by max ships (full)

**Resource Cost Preview:**
```javascript
// Hover over facility shows projected cost
<FacilityCard 
  facility={colonyConstructor}
  onHover={() => showCostTooltip({ ore: 3 })}
  glowColor={player.ore >= 3 ? 'green' : 'yellow'}
/>
```

---

## Real-Time VP Tracking

### Dynamic Score Display

```javascript
class ScoreTracker {
  static calculateProjectedScore(player, hypotheticalChanges = {}) {
    let vp = 0;
    
    // Colonies
    vp += player.coloniesPlaced + (hypotheticalChanges.coloniesAdded || 0);
    
    // Territory control
    for (let territory of player.controlledTerritories) {
      vp += 1;  // Base control
      
      if (territory.hasField('PositronField')) {
        vp += 1;  // Positron bonus
      }
    }
    
    // Hypothetical territory control changes
    if (hypotheticalChanges.territoriesGained) {
      for (let territory of hypotheticalChanges.territoriesGained) {
        vp += 1;
        if (territory.hasField('PositronField')) vp += 1;
      }
    }
    
    if (hypotheticalChanges.territoriesLost) {
      for (let territory of hypotheticalChanges.territoriesLost) {
        vp -= 1;
        if (territory.hasField('PositronField')) vp -= 1;
      }
    }
    
    // Alien tech cards
    vp += player.hand.filter(c => c.id === 'AlienCity').length;
    vp += player.hand.filter(c => c.id === 'AlienMonument').length;
    
    return vp;
  }
  
  // Show projected VP change when hovering over action
  static showProjectedChange(player, action) {
    let current = this.calculateProjectedScore(player);
    let projected = this.calculateProjectedScore(player, action.changes);
    let delta = projected - current;
    
    return {
      current,
      projected,
      delta,
      deltaText: delta > 0 ? `+${delta} VP` : `${delta} VP`
    };
  }
}

// Example usage in UI
<ColonyConstructorButton 
  onClick={placeColony}
  onHover={() => {
    let projection = ScoreTracker.showProjectedChange(player, {
      changes: { coloniesAdded: 1, territoriesGained: [AsimovCrater] }
    });
    showTooltip(`Place colony: ${projection.deltaText}`);
  }}
/>
```

### Score Animation

```javascript
// Animate VP changes
function animateVPChange(player, oldVP, newVP) {
  let delta = newVP - oldVP;
  
  // Show floating text
  showFloatingText({
    text: delta > 0 ? `+${delta}` : `${delta}`,
    color: delta > 0 ? 'green' : 'red',
    position: player.scoreDisplay,
    duration: 2000
  });
  
  // Count up/down animation
  animateNumber(player.scoreDisplay, oldVP, newVP, 500);
}
```

---

## Smart Defaults

### Auto-Selection Logic

```javascript
class SmartDefaults {
  // When only one legal action exists
  static autoSelectSingleOption(player) {
    if (player.fleet.filter(s => !s.docked).length === 1) {
      let ship = player.fleet.find(s => !s.docked);
      let facilities = FacilityValidator.getAvailableFacilities(player, ship)
        .filter(f => f.status === 'legal');
      
      if (facilities.length === 1) {
        // Pre-highlight the only valid facility
        UI.highlightFacility(facilities[0].facility, 'auto-selected');
        return facilities[0];
      }
    }
    
    return null;
  }
  
  // Auto-pass when no actions remain
  static shouldAutoPass(player) {
    // All ships assigned
    if (!player.fleet.some(s => !s.docked && !s.inMaintenanceBay)) {
      // No alien tech cards with fuel
      let usableCards = player.hand.filter(c => 
        c.fuelCost <= player.fuel && !c.usedThisTurn
      );
      
      if (usableCards.length === 0) {
        return true;
      }
    }
    
    return false;
  }
  
  // Auto-discard lowest resources
  static autoDiscardLowest(player, count) {
    let discarded = [];
    
    while (count > 0) {
      // Prefer discarding fuel if equal (ore more valuable late-game)
      if (player.fuel >= player.ore && player.fuel > 0) {
        player.fuel--;
        discarded.push('fuel');
      } else if (player.ore > 0) {
        player.ore--;
        discarded.push('ore');
      }
      count--;
    }
    
    return discarded;
  }
}

// Auto-pass confirmation
if (SmartDefaults.shouldAutoPass(player)) {
  showConfirmDialog({
    title: "No Actions Remaining",
    message: "All ships assigned. End turn?",
    confirmText: "End Turn",
    cancelText: "Review",
    onConfirm: () => turnManager.advancePhase()
  });
}
```

---

## Visual Feedback

### Animation Guidelines

**Colony Placement:**
```javascript
function animateColonyPlacement(player, territory) {
  // 1. Colony piece slides from player board to territory (1s)
  let colony = createColonySprite(player.color);
  
  animateSprite(colony, {
    from: player.colonyStock,
    to: territory.position,
    duration: 1000,
    easing: 'easeOutQuad'
  });
  
  // 2. Colony lands with small bounce
  await delay(1000);
  playSound('colony-place.wav');
  
  // 3. Check territory control
  let controlChanged = updateTerritoryControl(territory);
  
  if (controlChanged) {
    // 4. Animate control marker transfer
    animateControlTransfer(territory.previousController, player, territory);
    
    // 5. Show VP change
    animateVPChange(player, player.vp, player.vp + 2);  // +1 colony, +1 control
  }
}

function animateControlTransfer(oldController, newController, territory) {
  // Territory card flies from old controller to new controller
  let card = territory.controlCard;
  
  if (oldController) {
    animateSprite(card, {
      from: oldController.territoryArea,
      to: territory.position,
      duration: 500
    });
    await delay(500);
  }
  
  animateSprite(card, {
    from: territory.position,
    to: newController.territoryArea,
    duration: 500
  });
  
  playSound('control-gained.wav');
  flashElement(newController.territoryArea, 'gold', 1000);
}
```

**Ghosted Previews:**
```javascript
class DockingPreview {
  static showGhost(ship, facility) {
    // Show transparent version of ship at facility
    let ghost = createGhostSprite(ship);
    ghost.opacity = 0.5;
    ghost.position = facility.getDockPosition();
    
    // Show resource cost overlay
    if (facility.cost) {
      showCostOverlay(facility, {
        fuel: facility.cost.fuel,
        ore: facility.cost.ore,
        canAfford: player.canAfford(facility.cost)
      });
    }
    
    // Show projected outcome
    if (facility.id === 'ColonistHub') {
      let projectedAdvances = calculateAdvances(ship, player);
      highlightTrackSpaces(player, projectedAdvances);
    }
  }
  
  static hideGhost() {
    removeGhostSprites();
    hideCostOverlays();
    unhighlightTrackSpaces();
  }
}

// Usage
ship.onMouseEnter((ship) => {
  for (let facility of availableFacilities) {
    DockingPreview.showGhost(ship, facility);
  }
});

ship.onMouseLeave(() => {
  DockingPreview.hideGhost();
});
```

**Facility Requirement Indicators:**
```javascript
class FacilityIndicator {
  static update(facility, player) {
    let status = FacilityValidator.validate(facility, player);
    
    // Color-coded border
    facility.borderColor = {
      'legal': '#00ff00',           // Green
      'missing-resources': '#ffaa00', // Yellow
      'illegal': '#ff0000'            // Red
    }[status.status];
    
    // Icon overlay
    facility.icon = {
      'legal': '✓',
      'missing-resources': '⚠',
      'illegal': '✗'
    }[status.status];
    
    // Tooltip
    facility.tooltip = status.reason || 'Available';
  }
}
```

**Particle Effects:**
```javascript
function playResourceGainEffect(player, resourceType, amount) {
  let particles = createParticleSystem({
    type: resourceType === 'fuel' ? 'flame' : 'crystal',
    count: amount * 5,
    color: resourceType === 'fuel' ? '#ff6600' : '#00aaff',
    sourcePosition: facility.position,
    targetPosition: player.resourceDisplay,
    duration: 1500
  });
  
  particles.play();
  
  // Count up with sound
  for (let i = 0; i < amount; i++) {
    setTimeout(() => {
      player[resourceType]++;
      playSound('resource-gain.wav', { pitch: 1.0 + (i * 0.1) });
    }, i * 150);
  }
}

function playResourceLossEffect(player, resourceType, amount) {
  // Similar but reverse direction and red color
  createParticleSystem({
    type: resourceType === 'fuel' ? 'flame' : 'crystal',
    count: amount * 5,
    color: '#ff0000',
    sourcePosition: player.resourceDisplay,
    targetPosition: 'off-screen',  // Resources disappear
    duration: 1000
  }).play();
}
```

---

## Strategic Hints

### Beginner Assistance Mode

```javascript
class StrategyAdvisor {
  static suggestOptimalPlacement(player, difficulty = 'beginner') {
    if (difficulty !== 'beginner') return null;
    
    let suggestions = [];
    
    // Analyze available ships
    for (let ship of player.fleet.filter(s => !s.docked)) {
      let facilityScores = this.scoreFacilityOptions(player, ship);
      
      if (facilityScores.length > 0) {
        suggestions.push({
          ship: ship,
          facility: facilityScores[0].facility,
          score: facilityScores[0].score,
          reason: facilityScores[0].reason
        });
      }
    }
    
    // Return top suggestion
    if (suggestions.length > 0) {
      suggestions.sort((a, b) => b.score - a.score);
      return suggestions[0];
    }
    
    return null;
  }
  
  static scoreFacilityOptions(player, ship) {
    let scores = [];
    
    // Colony Constructor (high priority if can place colony)
    if (this.canUseColonyConstructor(player, ship)) {
      scores.push({
        facility: 'ColonyConstructor',
        score: 100,  // Highest priority (places colony)
        reason: 'Place a colony (gains VP and territory control)'
      });
    }
    
    // Terraforming Station (high priority if last colony)
    if (ship.value === 6 && player.coloniesRemaining === 1 && 
        player.fuel >= 1 && player.ore >= 1) {
      scores.push({
        facility: 'TerraformingStation',
        score: 150,  // Win the game!
        reason: 'Place final colony and WIN!'
      });
    }
    
    // Colonist Hub (medium-high if close to final space)
    let hubPosition = colonistHub.getPosition(player);
    if (hubPosition >= 5) {
      scores.push({
        facility: 'ColonistHub',
        score: 80,
        reason: `Advance colony track (${8 - hubPosition} spaces to colony)`
      });
    }
    
    // Alien Artifact (medium if close to claiming card)
    let currentTotal = alienArtifact.getDockedTotal(player);
    if (currentTotal + ship.value > 7) {
      scores.push({
        facility: 'AlienArtifact',
        score: 70,
        reason: 'Claim an alien tech card'
      });
    }
    
    // Shipyard (medium if need more ships)
    if (player.getTotalShips() < 5) {
      scores.push({
        facility: 'Shipyard',
        score: 60,
        reason: 'Build additional ship for future turns'
      });
    }
    
    // Resource gathering (lower priority)
    if (player.fuel < 3) {
      scores.push({
        facility: 'SolarConverter',
        score: 40,
        reason: 'Gain fuel for future actions'
      });
    }
    
    if (player.ore < 3) {
      scores.push({
        facility: 'LunarMine',
        score: 40,
        reason: 'Gain ore for colony placement'
      });
    }
    
    return scores.sort((a, b) => b.score - a.score);
  }
}

// UI Display
function showStrategyHint(suggestion) {
  if (!suggestion) return;
  
  showTooltip({
    title: '💡 Suggestion',
    message: `Dock ${suggestion.ship.value} at ${suggestion.facility.name}`,
    reason: suggestion.reason,
    action: 'Click to auto-place',
    onClick: () => autoPlaceShip(suggestion.ship, suggestion.facility)
  });
}
```

### Expected Value Display

```javascript
class ExpectedValueCalculator {
  // Show EV for different facilities
  static calculateFacilityValue(player, ship, facility) {
    switch (facility.id) {
      case 'LunarMine':
        return { 
          immediate: '+1 ore', 
          ev: 1.0,
          explanation: '1 ore = ~1 VP (via colony placement)'
        };
        
      case 'SolarConverter':
        let fuel = Math.ceil(ship.value / 2);
        return {
          immediate: `+${fuel} fuel`,
          ev: fuel * 0.8,
          explanation: '1 fuel = ~0.8 VP (conversion to ore or tech cards)'
        };
        
      case 'ColonyConstructor':
        if (this.canUseColonyConstructor(player, ship)) {
          return {
            immediate: '+1 colony, potential territory control',
            ev: 2.5,  // 1 VP for colony + 1 VP for control + 0.5 for bonus
            explanation: 'Likely gains 2-3 VP immediately'
          };
        }
        return { immediate: 'Cannot use', ev: 0 };
        
      case 'RaidersOutpost':
        return {
          immediate: '4 resources or 1 alien tech card',
          ev: 3.0,
          explanation: '4 resources = ~3 VP, tech card = ~2-4 VP'
        };
        
      // ... other facilities
    }
  }
}
```

### Colony Placement Alerts

```javascript
class ColonyAlerts {
  static checkColonyOpportunities(player) {
    let alerts = [];
    
    // Can place via Colony Constructor
    if (this.hasTriple(player)) {
      if (player.ore >= 3) {
        alerts.push({
          type: 'ready',
          message: '🎯 You can place a colony via Colony Constructor!',
          priority: 'high'
        });
      } else {
        alerts.push({
          type: 'near',
          message: `⚠️ Need ${3 - player.ore} more ore for Colony Constructor`,
          priority: 'medium'
        });
      }
    }
    
    // Can place via Colonist Hub
    if (colonistHub.isOnFinalSpace(player)) {
      if (player.fuel >= 1 && player.ore >= 1) {
        alerts.push({
          type: 'ready',
          message: '🎯 You can place a colony via Colonist Hub!',
          priority: 'high'
        });
      } else {
        alerts.push({
          type: 'near',
          message: '⚠️ Need 1F + 1O to place colony from Colonist Hub',
          priority: 'medium'
        });
      }
    }
    
    // Can place via Terraforming Station
    if (player.fleet.some(s => s.value === 6 && !s.docked)) {
      if (player.fuel >= 1 && player.ore >= 1) {
        alerts.push({
          type: 'ready',
          message: '🎯 You can place a colony via Terraforming Station!',
          priority: 'high'
        });
      }
    }
    
    return alerts;
  }
}

// Display alerts in UI
function showColonyAlerts(player) {
  let alerts = ColonyAlerts.checkColonyOpportunities(player);
  
  for (let alert of alerts) {
    if (alert.priority === 'high') {
      showBanner({
        message: alert.message,
        color: 'green',
        duration: 5000,
        dismissible: true
      });
    }
  }
}
```

---

## Undo System

### Implementation Strategy

```javascript
class UndoManager {
  constructor() {
    this.history = [];
    this.maxStates = 10;
  }
  
  // Save game state for undo
  saveState(player, action) {
    let state = {
      action: action,
      gameState: this.captureGameState(player),
      timestamp: Date.now()
    };
    
    this.history.push(state);
    
    // Limit history size
    if (this.history.length > this.maxStates) {
      this.history.shift();
    }
  }
  
  // Capture relevant game state
  captureGameState(player) {
    return {
      // Player state
      fleet: player.fleet.map(s => ({ ...s })),
      fuel: player.fuel,
      ore: player.ore,
      hand: [...player.hand],
      
      // Facility state
      facilities: game.facilities.map(f => ({
        id: f.id,
        dockedShips: [...f.dockedShips]
      })),
      
      // Territory state (if action affects territories)
      territories: game.territories.map(t => ({
        id: t.id,
        colonies: { ...t.colonies },
        controller: t.controller
      }))
    };
  }
  
  // Undo last action
  undo() {
    if (this.history.length === 0) {
      return { success: false, reason: 'No actions to undo' };
    }
    
    let lastState = this.history.pop();
    
    // Check if action is undoable
    if (!this.canUndo(lastState.action)) {
      this.history.push(lastState);  // Restore to history
      return { 
        success: false, 
        reason: 'Cannot undo resource spending actions' 
      };
    }
    
    // Restore game state
    this.restoreGameState(lastState.gameState);
    
    return { success: true, action: lastState.action };
  }
  
  // Determine if action can be undone
  canUndo(action) {
    // Cannot undo resource spending
    if (action.type === 'resource-spend') {
      return false;
    }
    
    // Cannot undo alien tech usage (teaches consequences)
    if (action.type === 'alien-tech-use') {
      return false;
    }
    
    // Can undo ship placement (during main phase)
    if (action.type === 'ship-placement') {
      return game.turnPhase === TurnPhase.MAIN;
    }
    
    // Cannot undo after confirmation
    if (action.confirmed) {
      return false;
    }
    
    return true;
  }
  
  // Restore previous game state
  restoreGameState(state) {
    let player = game.currentPlayer;
    
    // Restore player state
    player.fleet = state.fleet.map(s => ({ ...s }));
    player.fuel = state.fuel;
    player.ore = state.ore;
    player.hand = [...state.hand];
    
    // Restore facility state
    for (let facilityState of state.facilities) {
      let facility = game.facilities.find(f => f.id === facilityState.id);
      facility.dockedShips = [...facilityState.dockedShips];
    }
    
    // Restore territory state
    for (let territoryState of state.territories) {
      let territory = game.territories.find(t => t.id === territoryState.id);
      territory.colonies = { ...territoryState.colonies };
      territory.controller = territoryState.controller;
    }
  }
}

// UI Integration
<UndoButton 
  onClick={() => {
    let result = undoManager.undo();
    
    if (result.success) {
      showMessage(`Undid: ${result.action.description}`);
    } else {
      showError(result.reason);
    }
  }}
  enabled={undoManager.history.length > 0}
  tooltip="Undo last ship placement (Ctrl+Z)"
/>
```

### Confirmation System

```javascript
class ConfirmationManager {
  // Show confirmation dialog for critical actions
  static confirmAction(action, options = {}) {
    return new Promise((resolve) => {
      showDialog({
        title: options.title || 'Confirm Action',
        message: action.description,
        details: this.getActionDetails(action),
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: () => {
          action.confirmed = true;
          undoManager.saveState(game.currentPlayer, action);
          resolve(true);
        },
        onCancel: () => resolve(false)
      });
    });
  }
  
  static getActionDetails(action) {
    switch (action.type) {
      case 'colony-placement':
        return [
          `Place colony on ${action.territory}`,
          `Cost: ${action.cost.ore} ore`,
          `Gain: +1 VP (colony)`,
          action.gainControl ? '+1 VP (territory control)' : ''
        ].filter(Boolean).join('\n');
        
      case 'alien-tech-discard':
        return [
          `Discard ${action.card.name}`,
          `Effect: ${action.effect}`,
          '⚠️ This action cannot be undone'
        ].join('\n');
        
      case 'end-turn':
        return [
          'End your turn',
          `${action.shipsUnassigned} ships will go to Maintenance Bay`,
          `Discarding ${action.resourcesToDiscard} resources`
        ].join('\n');
    }
  }
}

// Usage
async function placeColony(player, territory) {
  let action = {
    type: 'colony-placement',
    territory: territory.name,
    cost: { ore: 3 },
    gainControl: territory.colonies[player.id] + 1 > maxOpponentColonies
  };
  
  let confirmed = await ConfirmationManager.confirmAction(action, {
    title: 'Place Colony?'
  });
  
  if (confirmed) {
    // Execute action
    executeColonyPlacement(player, territory);
  }
}
```

---

## Additional UX Improvements

### 1. Tutorial Mode

```javascript
class TutorialSystem {
  static tutorials = [
    {
      id: 'first-turn',
      steps: [
        {
          message: 'Welcome! Click "Roll Dice" to start your turn.',
          highlight: '#roll-button',
          wait: 'roll-complete'
        },
        {
          message: 'Great! Now you have ships with different values.',
          highlight: '#fleet-area',
          wait: 'continue'
        },
        {
          message: 'Click a ship, then click a facility to assign it.',
          highlight: ['#fleet-area', '#facilities-area'],
          wait: 'ship-assigned'
        },
        {
          message: 'Excellent! Keep assigning ships or click "End Turn".',
          highlight: '#end-turn-button',
          wait: 'turn-complete'
        }
      ]
    },
    
    {
      id: 'colony-placement',
      trigger: (player) => player.ore >= 3 && hasTriple(player),
      steps: [
        {
          message: 'You have 3 ships of the same value and 3 ore!',
          highlight: '#colony-constructor',
          wait: 'continue'
        },
        {
          message: 'Use Colony Constructor to place a colony and gain VP.',
          highlight: '#colony-constructor',
          wait: 'colony-placed'
        }
      ]
    }
  ];
  
  static checkTriggers(player) {
    for (let tutorial of this.tutorials) {
      if (tutorial.trigger && tutorial.trigger(player)) {
        this.startTutorial(tutorial);
      }
    }
  }
}
```

### 2. Game Log / History

```javascript
class GameLog {
  static entries = [];
  
  static log(event) {
    let entry = {
      turn: game.turn,
      player: game.currentPlayer.name,
      action: event.action,
      details: event.details,
      timestamp: Date.now()
    };
    
    this.entries.push(entry);
    
    // Update UI
    this.updateLogDisplay();
  }
  
  static updateLogDisplay() {
    let logHTML = this.entries.slice(-10).reverse().map(e => `
      <div class="log-entry">
        <span class="turn">Turn ${e.turn}</span>
        <span class="player" style="color: ${e.player.color}">
          ${e.player.name}
        </span>
        <span class="action">${e.action}</span>
        ${e.details ? `<span class="details">${e.details}</span>` : ''}
      </div>
    `).join('');
    
    document.getElementById('game-log').innerHTML = logHTML;
  }
}

// Usage
GameLog.log({
  action: 'Placed colony',
  details: 'Asimov Crater (+1 VP, gained control +1 VP)'
});

GameLog.log({
  action: 'Used Booster Pod',
  details: 'Ship 3 → 4 (cost 1F)'
});
```

### 3. Keyboard Shortcuts

```javascript
class KeyboardShortcuts {
  static bindings = {
    'r': () => rollDice(),
    'e': () => endTurn(),
    'z': () => undoManager.undo(),
    'h': () => showHints(),
    'l': () => toggleGameLog(),
    'tab': () => cycleShipSelection(),
    'enter': () => confirmAction(),
    'escape': () => cancelAction()
  };
  
  static init() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger if typing in input field
      if (e.target.tagName === 'INPUT') return;
      
      let action = this.bindings[e.key.toLowerCase()];
      if (action) {
        e.preventDefault();
        action();
      }
    });
  }
}
```

### 4. Colorblind Mode

```javascript
class ColorblindMode {
  static patterns = {
    red: '////',      // Diagonal lines
    blue: '\\\\\\\\',  // Reverse diagonal
    yellow: '||||',   // Vertical lines
    green: '----'     // Horizontal lines
  };
  
  static apply(element, color) {
    element.style.backgroundColor = color;
    element.style.backgroundImage = `url("data:image/svg+xml,${this.getPattern(color)}")`;
    element.dataset.colorName = color;
  }
  
  static getPattern(color) {
    let pattern = this.patterns[color] || '';
    return `<svg><pattern>${pattern}</pattern></svg>`;
  }
}
```

### 5. Mobile-Friendly Touch Gestures

```javascript
class TouchGestures {
  static init() {
    // Pinch to zoom
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
      this.initialScale = game.camera.scale;
    });
    
    document.addEventListener('gesturechange', (e) => {
      e.preventDefault();
      game.camera.scale = this.initialScale * e.scale;
    });
    
    // Two-finger pan
    let lastTouchPos = null;
    
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        let avgX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        let avgY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        if (lastTouchPos) {
          game.camera.x += avgX - lastTouchPos.x;
          game.camera.y += avgY - lastTouchPos.y;
        }
        
        lastTouchPos = { x: avgX, y: avgY };
      }
    });
    
    document.addEventListener('touchend', () => {
      lastTouchPos = null;
    });
  }
}
```

### 6. Accessibility Features

```javascript
class Accessibility {
  // Screen reader announcements
  static announce(message, priority = 'polite') {
    let announcer = document.getElementById('aria-announcer');
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    
    // Clear after 1 second
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
  
  // High contrast mode
  static enableHighContrast() {
    document.body.classList.add('high-contrast');
    
    // Increase border widths
    document.querySelectorAll('.facility').forEach(el => {
      el.style.borderWidth = '4px';
    });
  }
  
  // Focus management
  static manageFocus() {
    // When phase changes, focus appropriate element
    game.on('phaseChange', (phase) => {
      switch (phase) {
        case TurnPhase.ROLL:
          document.getElementById('roll-button').focus();
          break;
        case TurnPhase.MAIN:
          document.getElementById('fleet-area').focus();
          break;
        case TurnPhase.DISCARD:
          document.getElementById('resource-area').focus();
          break;
      }
    });
  }
}

// Usage
Accessibility.announce('Your turn has started');
Accessibility.announce('Colony placed on Asimov Crater', 'assertive');
```

### 7. Performance Optimization

```javascript
class PerformanceOptimizer {
  // Throttle expensive updates
  static throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
      let now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func(...args);
      }
    };
  }
  
  // Debounce hover effects
  static debounce(func, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  }
  
  // Lazy load animations
  static lazyLoadAnimations() {
    // Only animate elements in viewport
    let observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        } else {
          entry.target.classList.remove('animate');
        }
      });
    });
    
    document.querySelectorAll('.animated').forEach(el => {
      observer.observe(el);
    });
  }
}

// Apply optimizations
let updateScoreDisplay = PerformanceOptimizer.throttle(
  () => UI.updateAllScores(), 
  100  // Max once per 100ms
);

let showHoverPreview = PerformanceOptimizer.debounce(
  (ship, facility) => DockingPreview.showGhost(ship, facility),
  50  // Wait 50ms after hover stops
);
```

---

## Summary of Recommendations

### Critical for Launch
1. ✅ **Structured turn phases** (Gather → Roll → Main → Discard → End)
2. ✅ **Legal move validation** with color-coded indicators
3. ✅ **Real-time VP tracking** with projected changes
4. ✅ **Undo system** for ship placement (not resource spending)
5. ✅ **Game log** for action history

### High Priority (Enhance Experience)
6. ✅ **Animation system** for colony placement and control changes
7. ✅ **Ghosted previews** for ship docking
8. ✅ **Smart defaults** (auto-pass, auto-select)
9. ✅ **Strategic hints** for beginners
10. ✅ **Keyboard shortcuts**

### Nice to Have (Polish)
11. ✅ **Tutorial mode** with guided steps
12. ✅ **Colorblind mode** with patterns
13. ✅ **Mobile touch gestures**
14. ✅ **Accessibility features** (screen reader, high contrast)
15. ✅ **Performance optimization**

This comprehensive guide provides a complete roadmap for implementing Alien Frontiers with excellent user experience while maintaining the strategic depth and complexity that makes the game engaging.
