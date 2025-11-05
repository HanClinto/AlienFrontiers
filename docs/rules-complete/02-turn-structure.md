# Section 2: Turn Structure

**Pages 9-12 of Complete Rules Reference**

---

## 2.1 Turn Phases Overview

Each player's turn consists of four sequential phases. The first two (GATHER and ROLL) are automatic, while ACTION phase is player-driven and flexible.

### Phase Summary

| Phase | Type | Duration | Key Actions |
|-------|------|----------|-------------|
| GATHER | Automatic | Instant | Return ships from facilities to hand |
| ROLL | Automatic | Instant | Roll all ships, evaluate passive effects |
| ACTION | Player-driven | Variable | Use tech cards, dock ships (interleaved, flexible order) |
| CLEANUP | Automatic | Instant | Resource limit check, VP recalculation, game end check |

### Turn Sequence Flowchart

```
START TURN
    ↓
┌─────────────────────────────────────────┐
│   GATHER PHASE (Automatic)              │
│                                         │
│ 1. Return ships from Maintenance Bay    │
│    → Ships go to hand                   │
│                                         │
│ 2. Return ships from Terraforming       │
│    → Relic Ship: to Burroughs Desert    │
│    → Other ships: to stock (forfeited)  │
│                                         │
│ 3. Check Burroughs Desert control       │
│    → If lost: Return Relic Ship         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│   ROLL PHASE (Automatic)                │
│                                         │
│ 1. Roll all ships in hand (typically 3) │
│    → All ships become UNPLACED          │
│                                         │
│ 2. Evaluate Resource Cache (if owned)   │
│    → Count odd/even ships               │
│    → Gain resources automatically       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│   ACTION PHASE (Player-Driven, Flexible)            │
│                                                     │
│ Player takes actions in ANY ORDER until passing:    │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Option A: Use Tech Card FUEL POWER          │   │
│ │   • Pay fuel cost (Pohl Foothills -1)       │   │
│ │   • Apply effect (modify ships, gain, etc.) │   │
│ │   • Limit: Once per card per turn           │   │
│ │   • Target: Usually unplaced ships only     │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Option B: Discard Tech Card for POWER       │   │
│ │   • Discard card permanently                │   │
│ │   • Apply discard effect                    │   │
│ │   • Limit: Once per turn (across all cards) │   │
│ │   • Restriction: Cannot use then discard    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Option C: Dock Ship at Facility             │   │
│ │   • Ship must be UNPLACED                   │   │
│ │   • Facility must have available dock       │   │
│ │   • Ship becomes DOCKED or COMMITTED        │   │
│ │   • Resolve effect if requirement met       │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Option D: Move Ship (Orbital Teleporter)    │   │
│ │   • Pay 2 fuel (Pohl Foothills -1)          │   │
│ │   • Move DOCKED ship to different facility  │   │
│ │   • Limit: Once per turn                    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Option E: Pass (End ACTION phase)           │   │
│ │   • Validation: All ships must be docked    │   │
│ │   • OR: No legal dock locations exist       │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│   CLEANUP PHASE (Automatic)             │
│                                         │
│ 1. Resource Limit Check                 │
│    → Total = fuel + ore                 │
│    → If > 8: Player discards to 8       │
│                                         │
│ 2. Victory Point Recalculation          │
│    → VP = colonies + control +          │
│            Positron + VP cards          │
│    → Update all players' VP markers     │
│                                         │
│ 3. Game End Check                       │
│    → Last colony placed? END GAME       │
│    → Any player ≥ 12 VP? END GAME       │
│    → (14 VP for long-game variant)      │
│                                         │
│ 4. Advance Turn                         │
│    → Next player clockwise              │
└─────────────────────────────────────────┘
    ↓
NEXT PLAYER'S TURN
(or GAME END)
```

---

## 2.2 GATHER Phase

**Type:** Automatic  
**Timing:** Start of turn  
**Duration:** Instant

### Purpose

Return ships from specific facilities to prepare for rolling.

### Detailed Procedure

**Step 1: Return Ships from Maintenance Bay (Ref: Ambiguity #44)**

```typescript
function gatherFromMaintenanceBay(player: Player): void {
  const shipsAtBay = getShipsAtFacility(player, Facility.MAINTENANCE_BAY);
  
  shipsAtBay.forEach(ship => {
    // Return to player's hand
    player.hand.push(ship);
    
    // Remove from Maintenance Bay
    removeShi pFromFacility(ship, Facility.MAINTENANCE_BAY);
  });
}
```

All ships at Maintenance Bay return to hand, regardless of quantity (unlimited capacity confirmed).

**Step 2: Return Ships from Terraforming Station (Ref: Ambiguity #65, #66)**

```typescript
function gatherFromTerraformingStation(player: Player): void {
  const shipsAtStation = getShipsAtFacility(player, Facility.TERRAFORMING_STATION);
  
  shipsAtStation.forEach(ship => {
    if (ship.isRelicShip()) {
      // Relic Ship: Return to Burroughs Desert
      returnRelicShipToBurroughsDesert();
    } else {
      // Regular ships: Return to stock (forfeited permanently)
      returnShipToStock(ship, player);
    }
    
    // Remove from Terraforming Station
    removeShipFromFacility(ship, Facility.TERRAFORMING_STATION);
  });
}
```

**Forfeited ships are permanently lost** - player must rebuild via Shipyard.

**Step 3: Check Burroughs Desert Control Loss (Ref: Ambiguity #78)**

```typescript
function checkBurroughsDesertControl(player: Player): void {
  const burroughsDesert = getTerritory(TerritoryType.BURROUGHS_DESERT);
  const currentControl = burroughsDesert.controlledBy;
  
  if (currentControl !== player && player.hasRelicShip && player.relicShipLocation !== "Burroughs Desert") {
    // Player lost control and Relic Ship is elsewhere (in hand, at facility, etc.)
    returnRelicShipToBurroughsDesert();
    player.hasRelicShip = false;
  }
}
```

If player loses control of Burroughs Desert and Relic Ship is not already there, it returns immediately.

### Ships That Do NOT Return

Ships at the following facilities persist across turns:
- **Lunar Mine** - Ships remain, establishing minimum dock value
- **Other facilities** (Alien Artifact, Colony Constructor, etc.) - Ships commit and remain until manually removed

**Special Case: First Turn**

```typescript
function gatherPhaseFirstTurn(player: Player): void {
  // No ships at facilities yet
  // Skip GATHER phase entirely
  // Proceed directly to ROLL phase
}
```

---

## 2.3 ROLL Phase

**Type:** Automatic  
**Timing:** After GATHER phase  
**Duration:** Instant

### Purpose

Roll all ships in hand to determine available ship values for this turn.

### Detailed Procedure

**Step 1: Roll All Ships in Hand**

```typescript
function rollPhase(player: Player): void {
  const shipsInHand = player.hand;
  
  shipsInHand.forEach(ship => {
    // Roll the die (d6)
    ship.value = rollDie(); // Returns 1-6
    
    // Ship becomes UNPLACED (can be modified by tech cards)
    ship.state = ShipState.UNPLACED;
  });
}
```

**Typical Roll Counts:**
- Standard: 3 ships (player's color)
- With Relic Ship: 4 ships (3 color + 1 gray)
- After Shipyard builds: 4+ ships
- After Terraforming forfeit: 2 ships (permanently reduced)

**Step 2: Evaluate Resource Cache (Ref: Ambiguity #132-135)**

If player owns Resource Cache card:

```typescript
function evaluateResourceCache(player: Player, ships: Ship[]): void {
  if (!player.hasTechCard(TechCardType.RESOURCE_CACHE)) {
    return; // Player doesn't own card
  }
  
  const oddShips = ships.filter(s => s.value % 2 === 1).length;
  const evenShips = ships.filter(s => s.value % 2 === 0).length;
  
  if (oddShips > evenShips) {
    // More odd: Gain 1 fuel
    player.fuel += 1;
  } else if (evenShips > oddShips) {
    // More even: Gain 1 ore
    player.ore += 1;
  } else if (oddShips === evenShips && oddShips > 0) {
    // Equal non-zero: Auto-discard Resource Cache, gain 3 fuel
    player.fuel += 3;
    discardTechCard(player, TechCardType.RESOURCE_CACHE);
  }
  // If 0 ships rolled (theoretical edge case): No effect
}
```

**Resource Cache Examples:**

| Roll | Odd | Even | Result |
|------|-----|------|--------|
| [1, 3, 5] | 3 | 0 | Gain 1 fuel (more odd) |
| [2, 4, 6] | 0 | 3 | Gain 1 ore (more even) |
| [1, 2, 3, 4] | 2 | 2 | Gain 3 fuel, discard card (equal) |
| [3, 4] | 1 | 1 | Gain 3 fuel, discard card (equal) |
| [5] | 1 | 0 | Gain 1 fuel (more odd) |

**IMPORTANT:** Resource Cache evaluation is **automatic and mandatory** - player cannot choose to skip it.

---

## 2.4 ACTION Phase - Core Mechanics

**Type:** Player-driven, flexible  
**Timing:** After ROLL phase  
**Duration:** Variable (until player passes)

### Key Innovation: Interleaved Actions

Unlike the original rigid "use tech cards then dock all ships" system, the rewritten rules allow **flexible action ordering**:

✅ **ALLOWED:**
- Dock ship → Use tech card → Dock another ship
- Use tech card → Check facility availability → Use different card
- Dock ship → Realize better option → Use card on remaining ships

❌ **NOT ALLOWED:**
- Modify ship after it's docked (ship state locks)
- Use tech card fuel power AND discard same card same turn
- Pass while unplaced ships have legal dock locations

### Ship State Machine (Critical Concept)

```
┌─────────────┐
│  UNPLACED   │ ← After rolling, before docking
│  (in hand)  │   CAN: Modify value with tech cards
│             │   CAN: Dock at facility
│             │   CANNOT: Remain after passing
└──────┬──────┘
       │ Dock at facility
       ↓
┌─────────────┐
│   DOCKED    │ ← At facility, waiting for requirement
│ (at facility│   CANNOT: Modify value
│  waiting)   │   CAN: Be moved by Orbital Teleporter
│             │   CAN: Contribute to facility requirement
└──────┬──────┘
       │ Requirement met
       ↓
┌─────────────┐
│  COMMITTED  │ ← Effect resolved, persists
│ (at facility│   CANNOT: Modify value
│  resolved)  │   CAN: Be moved by Orbital Teleporter
│             │   PERSISTS: Until GATHER phase
└─────────────┘
```

### Available Actions (Detailed)

#### Action Type A: Use Tech Card Fuel Power

**Requirements:**
- Player owns tech card
- Card not used this turn (once per card limit)
- Player has sufficient fuel for cost
- Valid target exists (usually unplaced ships)

**Procedure:**

```typescript
function useTechCardFuelPower(
  player: Player,
  card: TechCard,
  targets: Target[]
): boolean {
  // 1. Check card ownership
  if (!player.hasTechCard(card.type)) {
    return false; // Don't own card
  }
  
  // 2. Check if already used this turn
  if (card.usedThisTurn) {
    return false; // Already used
  }
  
  // 3. Calculate fuel cost (Pohl Foothills reduces by 1)
  const baseCost = card.fuelCost;
  const controlsPohl = player.controlsTerritory(TerritoryType.POHL_FOOTHILLS);
  const finalCost = Math.max(0, baseCost - (controlsPohl ? 1 : 0));
  
  // 4. Check fuel availability
  if (player.fuel < finalCost) {
    return false; // Insufficient fuel
  }
  
  // 5. Validate targets (card-specific)
  if (!card.validateTargets(targets)) {
    return false; // Invalid targets
  }
  
  // 6. Pay fuel cost
  player.fuel -= finalCost;
  
  // 7. Apply card effect
  card.applyFuelEffect(player, targets);
  
  // 8. Mark card as used this turn
  card.usedThisTurn = true;
  
  return true;
}
```

**Fuel Cost Examples:**

| Card | Base Cost | With Pohl Foothills | Final Cost |
|------|-----------|---------------------|------------|
| Booster Pod | 1 | Yes | 0 (free!) |
| Data Crystal | 1/colony | Yes | Max(0, count - 1) |
| Orbital Teleporter | 2 | Yes | 1 |
| Temporal Warper | 1 | No | 1 |

**Target Restrictions:**

Most tech card fuel powers can **only target UNPLACED ships**:

```typescript
// Booster Pod example
function boosterPodFuelPower(ship: Ship): boolean {
  if (ship.state !== ShipState.UNPLACED) {
    return false; // Ship already docked or committed
  }
  
  if (ship.value >= 6) {
    return false; // Already at maximum
  }
  
  // Increase ship value by 1
  ship.value += 1;
  return true;
}
```

**Exception:** Orbital Teleporter can target DOCKED/COMMITTED ships (moves them between facilities).

#### Action Type B: Discard Tech Card for Power

**Requirements:**
- Player owns tech card
- Card not used for fuel power this turn
- No card discarded yet this turn (once per turn total limit)
- Valid discard target exists

**Procedure:**

```typescript
function discardTechCardForPower(
  player: Player,
  card: TechCard,
  targets: Target[]
): boolean {
  // 1. Check card ownership
  if (!player.hasTechCard(card.type)) {
    return false;
  }
  
  // 2. Check if card used for fuel power this turn
  if (card.usedThisTurn) {
    return false; // Cannot use AND discard same turn
  }
  
  // 3. Check if already discarded a card this turn
  if (player.discardedCardThisTurn) {
    return false; // Only one discard per turn total
  }
  
  // 4. Validate targets (card-specific)
  if (!card.validateDiscardTargets(targets)) {
    return false;
  }
  
  // 5. Apply discard effect
  card.applyDiscardEffect(player, targets);
  
  // 6. Remove card from player's hand permanently
  player.techCards.remove(card);
  
  // 7. Mark that player discarded this turn
  player.discardedCardThisTurn = true;
  
  return true;
}
```

**Discard Power Examples:**

| Card | Discard Effect | Typical Use |
|------|----------------|-------------|
| Booster Pod | Remove any field generator | Clear Isolation/Repulsor blocking |
| Data Crystal | Place/move Positron Field | Gain +1 VP on controlled territory |
| Plasma Cannon | Remove 1 opponent ship to stock | Emergency colony protection |
| Temporal Warper | Claim any card from discard | Recover key card |

**Critical Restriction (Ref: Ambiguity #100):**

```typescript
// WRONG - Cannot do this:
useTechCardFuelPower(player, boosterPod, ship);
// ... later same turn ...
discardTechCardForPower(player, boosterPod, target); // INVALID!

// CORRECT - Choose one per turn:
useTechCardFuelPower(player, boosterPod, ship); // OK
// OR
discardTechCardForPower(player, boosterPod, target); // OK
// But not both
```

#### Action Type C: Dock Ship at Facility

**Requirements:**
- Ship is UNPLACED (in hand after rolling)
- Facility has available dock space
- Ship value meets facility requirements (if any)

**Procedure:**

```typescript
function dockShipAtFacility(
  player: Player,
  ship: Ship,
  facility: Facility
): boolean {
  // 1. Verify ship is unplaced
  if (ship.state !== ShipState.UNPLACED) {
    return false; // Ship already docked
  }
  
  // 2. Check facility capacity
  if (facility.isFull()) {
    return false; // No dock spaces available
  }
  
  // 3. Check facility-specific requirements
  if (!facility.canDock(ship, player)) {
    return false; // Requirements not met
  }
  
  // 4. Dock the ship
  ship.state = ShipState.DOCKED;
  ship.location = facility;
  facility.addShip(ship);
  
  // 5. Check if facility requirement now met
  if (facility.requirementMet(player)) {
    // Resolve facility effect immediately
    facility.resolveEffect(player);
    
    // Mark ships as COMMITTED
    facility.getShips(player).forEach(s => {
      s.state = ShipState.COMMITTED;
    });
  }
  
  return true;
}
```

**Facility Requirement Examples:**

| Facility | Requirement | Resolves When |
|----------|-------------|---------------|
| Shipyard | Pair (same value) | 2 ships docked with matching value |
| Lunar Mine | Value ≥ highest | Each ship docks (immediately) |
| Alien Artifact | Single ship value ≥ 8 | 1 ship with value 8+ docks |
| Terraforming Station | 4+ ships, total ≥ 20 | All ships docked, sum ≥ 20 |

**Multiple Ships Same Turn:**

Player can dock multiple ships at same facility in one turn:

```
Roll: [3, 3, 5]

Action 1: Dock ship(3) at Shipyard
  Result: 1 ship docked, requirement NOT met (need pair)

Action 2: Dock ship(3) at Shipyard
  Result: 2 ships docked, PAIR COMPLETE!
  Effect: Build new ship, both ships COMMITTED
  
Action 3: Dock ship(5) at Solar Converter
  Result: Gain 3 fuel, ship COMMITTED
```

#### Action Type D: Move Ship (Orbital Teleporter)

**Requirements:**
- Player owns Orbital Teleporter card
- Card not used this turn
- Player has sufficient fuel (2, or 1 with Pohl Foothills)
- Ship is DOCKED or COMMITTED at a facility
- Target facility has available dock space

**Procedure:**

```typescript
function orbitalTeleporterMove(
  player: Player,
  ship: Ship,
  targetFacility: Facility
): boolean {
  // 1. Verify card ownership and usage
  if (!player.hasTechCard(TechCardType.ORBITAL_TELEPORTER)) {
    return false;
  }
  
  if (player.orbitalTeleporterUsedThisTurn) {
    return false; // Once per turn
  }
  
  // 2. Calculate fuel cost
  const controlsPohl = player.controlsTerritory(TerritoryType.POHL_FOOTHILLS);
  const fuelCost = controlsPohl ? 1 : 2;
  
  if (player.fuel < fuelCost) {
    return false; // Insufficient fuel
  }
  
  // 3. Verify ship is docked/committed
  if (ship.state !== ShipState.DOCKED && ship.state !== ShipState.COMMITTED) {
    return false; // Ship must be at a facility
  }
  
  // 4. Verify target facility has space
  if (targetFacility.isFull()) {
    return false;
  }
  
  // 5. Pay fuel cost
  player.fuel -= fuelCost;
  
  // 6. Move ship
  const sourceFacility = ship.location;
  sourceFacility.removeShip(ship);
  targetFacility.addShip(ship);
  ship.location = targetFacility;
  
  // 7. Check if source facility requirement broken
  if (!sourceFacility.requirementMet(player)) {
    // Revert remaining ships to DOCKED state
    sourceFacility.getShips(player).forEach(s => {
      s.state = ShipState.DOCKED;
    });
  }
  
  // 8. Check if target facility requirement now met
  if (targetFacility.requirementMet(player)) {
    targetFacility.resolveEffect(player);
    targetFacility.getShips(player).forEach(s => {
      s.state = ShipState.COMMITTED;
    });
  }
  
  // 9. Mark Orbital Teleporter as used
  player.orbitalTeleporterUsedThisTurn = true;
  
  return true;
}
```

**Example Use Cases:**

```
Scenario 1: Facility Blocked
  Ship(6) at Solar Converter (COMMITTED)
  Opponent fills Alien Artifact with blocking ships
  
  Action: Orbital Teleporter ship(6) to Alien Artifact
  Result: Ship moves, now value ≥ 8 at Artifact
  Effect: Claim tech card, ship remains at Artifact

Scenario 2: Optimize Resources
  Ships [3, 3] at Shipyard (COMMITTED, already built ship)
  Lunar Mine is empty
  
  Action: Orbital Teleporter ship(3) to Lunar Mine
  Result: Ship moves, gain 1 ore
  Effect: Double-dip on ship usage
```

#### Action Type E: Pass (End ACTION Phase)

**Requirements:**
- All UNPLACED ships must be docked, OR
- No legal dock locations exist for remaining ships

**Validation:**

```typescript
function canPass(player: Player): boolean {
  const unplacedShips = player.ships.filter(s => s.state === ShipState.UNPLACED);
  
  if (unplacedShips.length === 0) {
    return true; // All ships docked
  }
  
  // Check if any unplaced ship has legal dock
  for (const ship of unplacedShips) {
    for (const facility of allFacilities) {
      if (facility.canDock(ship, player) && !facility.isFull()) {
        return false; // Legal dock exists, cannot pass
      }
    }
  }
  
  // No legal docks available
  return true;
}
```

**Must-Dock-All Rule (Ref: Ambiguity #21):**

Player **cannot** pass if unplaced ships can legally dock:

```
INVALID:
  Roll: [2, 4, 6]
  Action: Dock ship(6) at Lunar Mine
  Action: Pass ← INVALID! Ships [2, 4] can dock at Solar Converter

VALID:
  Roll: [1, 2, 3]
  All facilities blocked or require higher values
  Action: Pass ← VALID, no legal docks exist
```

---

## 2.5 CLEANUP Phase

**Type:** Automatic  
**Timing:** After ACTION phase (player passes)  
**Duration:** Instant

### Step 1: Resource Limit Check

**Maximum: 8 Total Resources (Ref: Ambiguity #30)**

```typescript
function enforceResourceLimit(player: Player): void {
  const totalResources = player.fuel + player.ore;
  
  if (totalResources <= 8) {
    return; // Within limit
  }
  
  // Player must discard down to 8
  const toDiscard = totalResources - 8;
  
  // Player chooses which resources to discard
  const choice = promptPlayerDiscard(player, toDiscard);
  
  player.fuel -= choice.fuelDiscarded;
  player.ore -= choice.oreDiscarded;
  
  // Verify final total
  console.assert(player.fuel + player.ore === 8);
}
```

**Player Choice Example:**

```
Player ends ACTION phase with: 6 fuel, 5 ore (total 11)
Must discard: 3 resources

Options:
  A) Discard 3 fuel → 3 fuel, 5 ore (total 8)
  B) Discard 2 fuel, 1 ore → 4 fuel, 4 ore (total 8)
  C) Discard 1 fuel, 2 ore → 5 fuel, 3 ore (total 8)
  D) Discard 3 ore → 6 fuel, 2 ore (total 8)

Player chooses based on strategy (future card costs, colony needs, etc.)
```

### Step 2: Victory Point Recalculation

**Snapshot System (Ref: Ambiguity #27, #28):**

VP recalculated from current game state, **NOT cumulative**.

```typescript
function recalculateVictoryPoints(player: Player, gameState: GameState): void {
  let newVP = 0;
  
  // 1. Colonies placed (1 VP each)
  const coloniesPlaced = player.colonies.filter(c => c.onBoard).length;
  newVP += coloniesPlaced;
  
  // 2. Territories controlled (1 VP each)
  const territoriesControlled = gameState.territories.filter(t =>
    t.controlledBy === player.id
  ).length;
  newVP += territoriesControlled;
  
  // 3. Positron Fields on controlled territories (+1 VP each)
  const controlledWithPositron = gameState.territories.filter(t =>
    t.controlledBy === player.id &&
    t.hasFieldGenerator(FieldType.POSITRON)
  ).length;
  newVP += controlledWithPositron;
  
  // 4. VP cards in hand (2 VP each)
  const vpCards = player.techCards.filter(c =>
    c.type === TechCardType.ALIEN_CITY ||
    c.type === TechCardType.ALIEN_MONUMENT
  ).length;
  newVP += vpCards * 2;
  
  // Update player VP (replaces previous value)
  player.victoryPoints = newVP;
  
  // Update VP marker on board
  moveVPMarker(player, newVP);
}
```

**Example VP Trajectory:**

| Turn | Colonies | Control | Positron | VP Cards | Total VP |
|------|----------|---------|----------|----------|----------|
| 1 | 0 | 0 | 0 | 0 | **0** |
| 3 | 2 | 1 | 0 | 0 | **3** |
| 5 | 3 | 2 | 1 | 1 (×2) | **8** |
| 7 | 4 | 2 (lost 1!) | 0 (lost!) | 1 (×2) | **8** (same!) |
| 9 | 5 | 3 | 1 | 1 (×2) | **11** |
| 10 | 6 | 3 | 1 | 1 (×2) | **12** ← GAME END |

Note Turn 7: VP stayed at 8 despite adding colony, because lost territory control and Positron Field.

### Step 3: Game End Check

**Three Triggers (Ref: Ambiguity #29):**

```typescript
function checkGameEnd(players: Player[], gameState: GameState): boolean {
  // Trigger 1: Any player placed last colony (immediate end)
  for (const player of players) {
    const coloniesPlaced = player.colonies.filter(c => c.onBoard).length;
    if (coloniesPlaced >= 7) {
      return true; // Game ends immediately
    }
  }
  
  // Trigger 2: Any player reached VP goal (checked at cleanup)
  const vpGoal = gameState.isLongGame ? 14 : 12;
  for (const player of players) {
    if (player.victoryPoints >= vpGoal) {
      return true; // Game ends after cleanup
    }
  }
  
  return false; // Game continues
}
```

**Standard Game:** 12 VP triggers end  
**Long Game:** 14 VP triggers end

**Tie-Breakers (See Section 7.3):**
1. Most VP (winner)
2. Most alien tech cards (winner)
3. Most ore (winner)
4. Most fuel (winner)
5. Shared victory

### Step 4: Advance Turn

If game not ended:

```typescript
function advanceTurn(gameState: GameState): void {
  // Reset turn-specific flags for ending player
  const currentPlayer = gameState.currentPlayer;
  currentPlayer.discardedCardThisTurn = false;
  currentPlayer.orbitalTeleporterUsedThisTurn = false;
  currentPlayer.techCards.forEach(card => {
    card.usedThisTurn = false;
  });
  
  // Advance to next player clockwise
  gameState.currentPlayer = getNextPlayer(currentPlayer);
}
```

---

**End of Section 2: Turn Structure**

*Continues in Section 3: Facilities (Part 1).*

---

## Cross-References

- **Ambiguities Resolved**: #16-30 (turn structure), #21 (must-dock-all), #27 (VP snapshot), #28 (VP not cumulative), #29 (game end), #30 (resource limit), #44 (Maintenance Bay), #65-66 (Terraforming Station), #78 (Burroughs control), #100 (tech card use/discard), #132-135 (Resource Cache)
  
- **Related Sections**:
  - Section 1 (Components & Setup): Core concepts, ship states
  - Section 3 (Facilities): Detailed facility mechanics
  - Section 6 (Alien Tech Cards): Individual card rules
  - Section 7.3 (Advanced Rules): Victory conditions and tie-breakers
