# Section 3: Orbital Facilities (Part 1)

**Pages 13-18 of Complete Rules Reference**

---

## 3.1 Facility Overview

The game board features **9 orbital facilities** where players dock ships to gain resources, build ships, place colonies, and acquire alien technology.

### Facility Quick Reference

| Facility | Requirement | Effect | Ship Destination | Capacity |
|----------|-------------|--------|------------------|----------|
| Alien Artifact | Value ≥ 8 | Claim tech card | Maintenance Bay | 3 docks |
| Colonist Hub | Single ship | Advance colony track (+1 per ship) | Maintenance Bay | Unlimited |
| Colony Constructor | 3 ships (any values) | Place colony (3 ore - bonuses) | Maintenance Bay | 3 docks |
| Lunar Mine | Value ≥ highest at mine | Gain 1 ore per ship | Ships persist | Unlimited |
| Maintenance Bay | Any ship | Hold ship until next turn | Ships persist | Unlimited |
| Orbital Market | Pair (same value) | Trade fuel for ore (ratio = value) | Maintenance Bay | 2 docks |
| Raiders' Outpost | 3 sequential ships | Raid resources OR tech card | Maintenance Bay | 3 docks |
| Shipyard | Pair (same value) | Build new ship (cost varies) | Maintenance Bay | 2 docks |
| Solar Converter | Single ship | Gain ⌈value/2⌉ fuel per ship | Maintenance Bay | Unlimited |
| Terraforming Station | 4+ ships, total ≥ 20 | Place colony (forfeit 1 ship) | 1 forfeited, rest to Maintenance Bay | Unlimited |

---

## 3.2 Alien Artifact

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     ALIEN ARTIFACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Docking Requirements

- **Single ship** with value **≥ 8**
- **3 dock spaces** (limited capacity)
- Ship value can reach 8 via:
  - Natural roll (6-sided die cannot reach 8 alone)
  - Tech card modification (Booster Pod, Gravity Manipulator)
  - Territory bonus (Data Crystal borrowing)
  - Relic Ship (potential for higher base roll)

**Clarification (Ref: Ambiguity #31):**

A "value 8 ship" means the ship's **current value** must be 8 or higher when docking. This can be achieved through modifications.

```typescript
function canDockAtAlienArtifact(ship: Ship): boolean {
  return ship.value >= 8;
}

// Example: Ship rolled 6, then Booster Pod (+1), then Booster Pod again (+1)
// Ship value: 6 + 1 + 1 = 8 ✓ Can dock at Alien Artifact
```

### Effect

**Claim any 1 tech card from top of deck**

```typescript
function alienArtifactEffect(player: Player, deckState: DeckState): void {
  // 1. Draw top card from tech deck
  const claimedCard = deckState.techDeck.shift();
  
  // 2. Check if deck empty (Ref: Ambiguity #32)
  if (!claimedCard) {
    // Deck exhausted: No card claimed, effect fizzles
    return;
  }
  
  // 3. Check if player already owns this card type (Ref: Ambiguity #33)
  const alreadyOwns = player.techCards.some(c => c.type === claimedCard.type);
  
  if (alreadyOwns) {
    // Player already has this card type
    // Card goes to discard pile
    deckState.discardPile.push(claimedCard);
  } else {
    // Player doesn't own this card yet
    // Add to player's hand face-up
    player.techCards.push(claimedCard);
  }
}
```

### Timing

- **When Effect Resolves:** Immediately when ship docks (instant)
- **Ship Destination:** Moves to Maintenance Bay (returns next GATHER phase)
- **Deck Cycling:** If deck exhausted during claim, reshuffle discard pile to form new deck (Ref: Ambiguity #34)

### Special Rules

**Deck Exhaustion (Ref: Ambiguity #32)**

If tech deck is empty when claiming:

```typescript
if (deckState.techDeck.length === 0) {
  // Check if discard pile has cards
  if (deckState.discardPile.length > 0) {
    // Reshuffle discard pile into deck
    deckState.techDeck = shuffle(deckState.discardPile);
    deckState.discardPile = [];
    
    // Now draw from reshuffled deck
    const claimedCard = deckState.techDeck.shift();
    // ... continue with claim logic
  } else {
    // Both deck AND discard empty (extremely rare)
    // Effect fizzles, no card claimed
    return;
  }
}
```

**Duplicate Cards (Ref: Ambiguity #33)**

Each tech card type has **2 copies** in the deck. Player can only own **1 copy** of each type.

```
Player owns: Booster Pod, Data Crystal
Deck top card: Booster Pod

Result: Booster Pod goes to discard pile (player already owns one)
Player must claim again on future turn to get different card
```

**Multiple Ships Same Turn**

Player can dock multiple ships at Alien Artifact if capacity allows:

```
Player has ships [8, 8] (via Booster Pods)
Artifact has 2 available docks

Action 1: Dock ship(8) → Claim card #1
Action 2: Dock ship(8) → Claim card #2

Result: 2 tech cards claimed, both ships to Maintenance Bay
```

### State Diagram

```
Ship (value ≥ 8) at hand
      ↓ Dock at Alien Artifact
  [DOCKED]
      ↓ Requirement met (instant)
Claim tech card from deck
      ↓
Ship → Maintenance Bay [COMMITTED]
      ↓ GATHER phase (next turn)
Ship returns to hand
```

### Examples

**Example 1: Basic Claim**

```
Setup:
  Player ships: [6, 3, 4]
  Player owns: 1 fuel
  Player controls: Pohl Foothills (fuel cost -1)
  Alien Artifact: Empty (3 docks available)

Action Sequence:
  1. Use Booster Pod (cost 1 fuel, reduced to 0 by Pohl)
     Ship(6) → 7
  
  2. Use Booster Pod again on same ship (if have 2nd copy? No, only 1/player)
     Alternative: Use Gravity Manipulator (2 fuel, reduced to 1)
     Transfer 1 point from ship(4) to ship(7)
     Ship(7) → 8, ship(4) → 3
  
  3. Dock ship(8) at Alien Artifact
     Result: Draw top card from deck
     Card is Data Crystal (player doesn't own)
     Player gains Data Crystal
     Ship(8) → Maintenance Bay

Next Turn:
  GATHER: Ship returns to hand
  ROLL: Re-roll the ship
```

**Example 2: Duplicate Card**

```
Setup:
  Player owns: Alien City, Booster Pod
  Alien Artifact: 1 dock available
  Player ship: [8] (already modified)
  Tech deck top card: Alien City

Action:
  Dock ship(8) at Alien Artifact

Result:
  Flip Alien City from deck
  Player already owns Alien City
  Alien City → Discard pile
  Player gains nothing this turn
  Ship(8) → Maintenance Bay

Strategy:
  Player should claim again next turn (different card on top)
```

**Example 3: Deck Cycling**

```
Setup:
  Tech deck: 1 card remaining (last card)
  Discard pile: 15 cards
  Player ship: [8]

Action:
  Dock ship(8) at Alien Artifact

Result:
  Draw last card from deck (e.g., Plasma Cannon)
  Player gains Plasma Cannon (if not owned)
  Tech deck now empty
  
Next Player's Turn (claims from Artifact):
  Tech deck empty, reshuffle discard pile
  Discard pile (15 cards) → Tech deck (shuffled)
  Draw top card of new deck
```

**Example 4: Facility Full (Blocking)**

```
Setup (2-player game):
  Alien Artifact: 1 blocking ship + 2 player ships = FULL (3/3 docks)
  Player wants to claim card
  Player has ship(8) available

Problem: No dock space available

Solution Options:
  A) Use Plasma Cannon to remove opponent ships (2 fuel per ship)
  B) Wait until GATHER phase (opponent ships may return)
  C) Use Orbital Teleporter to move own ship out (then dock new ship in)
  
Action (Choose A):
  1. Use Plasma Cannon (2 fuel)
     Remove 1 opponent ship → Maintenance Bay
     Artifact: 1 blocking ship + 1 player ship = 2/3 docks
  
  2. Dock ship(8) at Alien Artifact
     Claim tech card
     Ship(8) → Maintenance Bay
```

### Interactions

**Territory Bonuses:**
- **Pohl Foothills:** Does NOT affect Alien Artifact (no fuel cost involved)
- **Data Crystal:** Can borrow territory bonus to reach value 8
  - Example: Ship(6) + Data Crystal borrowing Van Vogt Mountains (first ship any value) ← Does NOT help reach 8
  - Example: Ship(7) + some theoretical "+1 ship value bonus" ← No such territory exists

**Tech Cards:**
- **Booster Pod:** +1 ship value (max 6 → 7, still need more)
- **Gravity Manipulator:** Transfer points between ships to create value 8
- **Temporal Warper:** Re-roll ships to try for better values
- **Polarity Device:** Flip ship (7-value), potential to create high values
  - Example: Ship(2) flipped → 5, still not 8
  - Example: Ship(1) flipped → 6, then Booster Pod → 7, then Gravity → 8 ✓
- **Stasis Beam:** -1 ship value (NOT helpful for reaching 8)
- **Plasma Cannon:** Remove blocking ships to free dock space

**Field Generators:**
- None directly affect Alien Artifact

**Edge Cases:**
- Multiple ships dock same turn: Each claims separate card
- Deck exhausted: Reshuffle discard pile
- Discard AND deck empty: Effect fizzles (extremely rare, see Ambiguity #155)

---

## 3.3 Colonist Hub

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     COLONIST HUB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Docking Requirements

- **Single ship** (any value)
- **Unlimited dock spaces**
- Multiple ships can dock per turn

**Clarification (Ref: Ambiguity #35):**

"Single ship" means each individual ship triggers the effect independently. You can dock multiple ships, and each advances the colony track.

### Effect

**Advance 1 colony marker per ship docked**

```typescript
function colonistHubEffect(player: Player, shipsDocked: Ship[]): void {
  shipsDocked.forEach(ship => {
    // Each ship advances 1 colony marker
    const colony = player.getAdvanceableColony();
    
    if (colony) {
      colony.advance(); // Move toward next territory placement
      
      // Check if colony reached target territory
      if (colony.readyToPlace()) {
        // See Section 3.3.1 for placement rules
        promptColonyPlacement(player, colony);
      }
    }
  });
}
```

### Timing

- **When Effect Resolves:** Immediately when each ship docks
- **Ship Destination:** Moves to Maintenance Bay (returns next GATHER phase)
- **Colony Advancement:** Happens during ACTION phase (not delayed to CLEANUP)

### Special Rules

**Multiple Ships (Ref: Ambiguity #36)**

Each ship docked at Colonist Hub triggers effect independently:

```
Action: Dock ships [2, 4, 6] at Colonist Hub (3 ships)

Result:
  Ship(2) docks → Advance colony #1 by 1
  Ship(4) docks → Advance colony #2 by 1
  Ship(6) docks → Advance colony #3 by 1
  
  Total: 3 colony advances
  All ships → Maintenance Bay
```

**Colony Track System**

Colonies advance along a track from stock toward territories:

```
[Stock] → [Advance 1] → [Advance 2] → [Advance 3] → [Place on Territory]
```

Each colony requires **3 advances** before placement (base rule, modified by bonuses).

**Asimov Crater Bonus (Ref: Ambiguity #37, #67)**

If player controls Asimov Crater AND docks **2+ ships** at Colonist Hub in same turn:

```typescript
function colonistHubWithAsimovCrater(player: Player, shipsDocked: Ship[]): void {
  const controlsAsimov = player.controlsTerritory(TerritoryType.ASIMOV_CRATER);
  const shipCount = shipsDocked.length;
  
  if (controlsAsimov && shipCount >= 2) {
    // Base advances: 1 per ship
    const baseAdvances = shipCount;
    
    // Asimov bonus: +1 additional advance (once per turn, not per ship)
    const totalAdvances = baseAdvances + 1;
    
    // Apply advances
    for (let i = 0; i < totalAdvances; i++) {
      advanceColony(player);
    }
  } else {
    // Standard: 1 advance per ship
    shipsDocked.forEach(() => advanceColony(player));
  }
}
```

**Example:**
```
Player controls Asimov Crater
Dock ships [3, 5] at Colonist Hub (2 ships)

Result:
  Base: 2 advances (1 per ship)
  Asimov: +1 advance (bonus for 2+ ships)
  Total: 3 advances (enough to complete 1 colony!)
```

**Excess Advances (Ref: Ambiguity #38)**

If colony advances exceed what's needed:

```
Colony at Advance 2/3 (needs 1 more to place)
Dock 3 ships at Colonist Hub (3 advances)

Result:
  Apply 1 advance → Colony ready to place
  Apply 2nd advance → Start new colony at Advance 1/3
  Apply 3rd advance → New colony at Advance 2/3

Excess advances roll over to next colony in stock
```

```typescript
function advanceColony(player: Player): void {
  let currentColony = player.getColonyInProgress();
  
  if (!currentColony) {
    // No colony in progress, start new one from stock
    currentColony = player.takeColonyFromStock();
    if (!currentColony) {
      // No colonies remaining in stock (all 7 placed or in progress)
      return; // Cannot advance further
    }
  }
  
  currentColony.advances++;
  
  if (currentColony.advances >= 3) {
    // Colony ready to place
    promptColonyPlacement(player, currentColony);
    
    // Excess advances (if any) continue to next colony
    const excess = currentColony.advances - 3;
    if (excess > 0) {
      // Start new colony with excess advances
      const nextColony = player.takeColonyFromStock();
      if (nextColony) {
        nextColony.advances = excess;
      }
    }
  }
}
```

### State Diagram

```
Ship (any value) at hand
      ↓ Dock at Colonist Hub
  [DOCKED]
      ↓ Requirement met (instant)
Advance 1 colony marker
      ↓
Ship → Maintenance Bay [COMMITTED]
      ↓ GATHER phase (next turn)
Ship returns to hand
```

### Examples

**Example 1: Basic Colony Advance**

```
Setup:
  Player has colony #1 at Advance 1/3
  Player ships: [3]

Action:
  Dock ship(3) at Colonist Hub

Result:
  Colony #1 advances to 2/3
  Ship(3) → Maintenance Bay
  
Next turn: Need 1 more advance to place colony
```

**Example 2: Asimov Crater Bonus**

```
Setup:
  Player controls Asimov Crater
  Player has colony #1 at Advance 0/3 (in stock)
  Player ships: [2, 5]

Action:
  Dock ships [2, 5] at Colonist Hub (2 ships)

Result:
  Base: 2 advances (1 per ship)
  Asimov: +1 advance (2+ ships bonus)
  Total: 3 advances
  
  Colony #1: 0 + 3 = 3/3 → Ready to place!
  Player places colony on desired territory
  Ships [2, 5] → Maintenance Bay
```

**Example 3: Excess Advances Rollover**

```
Setup:
  Colony #1 at Advance 2/3 (needs 1 more)
  Colony #2 in stock (Advance 0/3)
  Player ships: [1, 3, 6]

Action:
  Dock ships [1, 3, 6] at Colonist Hub (3 ships)

Result:
  Advance 1: Colony #1 → 3/3, ready to place
  Place colony #1 on territory
  
  Advance 2: Colony #2 → 1/3 (start new colony)
  Advance 3: Colony #2 → 2/3
  
  Ships [1, 3, 6] → Maintenance Bay
```

**Example 4: All Colonies Placed**

```
Setup:
  Player has 7 colonies already placed on board
  No colonies in stock
  Player ships: [4]

Action:
  Dock ship(4) at Colonist Hub

Result:
  Effect attempts to advance colony
  No colonies available to advance
  Effect fizzles (no harm done)
  Ship(4) → Maintenance Bay

Note: Game likely ending soon (player placed all 7 colonies!)
```

### Interactions

**Territory Bonuses:**
- **Asimov Crater:** +1 advance when 2+ ships docked (once per turn)
- **Bradbury Plateau:** Does NOT affect Colonist Hub (only Colony Constructor)

**Tech Cards:**
- **Booster Pod:** Can modify ship values (not useful here, any value works)
- **Plasma Cannon:** Remove blocking ships (not applicable, unlimited capacity)
- **Data Crystal:** Borrow Asimov bonus from opponent

**Field Generators:**
- None directly affect Colonist Hub

**Edge Cases:**
- Asimov bonus applies when **2+ ships** docked same turn (Ref: Ambiguity #37)
- Excess advances roll over to next colony (Ref: Ambiguity #38)
- If all 7 colonies placed/in-progress, effect fizzles (Ref: Ambiguity #153)

---

## 3.4 Colony Constructor

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   COLONY CONSTRUCTOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Docking Requirements

- **3 ships** (any values, can be different)
- **3 dock spaces** (limited capacity)
- All 3 ships must be docked to activate

**Clarification (Ref: Ambiguity #39):**

"3 ships" means exactly 3 ships from the same player. Ship values are irrelevant.

### Effect

**Place 1 colony on any territory (costs 3 ore - bonuses)**

```typescript
function colonyConstructorEffect(player: Player, territory: Territory): void {
  // 1. Calculate ore cost
  let oreCost = 3; // Base cost
  
  // 2. Apply Bradbury Plateau bonus (Ref: Ambiguity #40)
  const controlsBradbury = player.controlsTerritory(TerritoryType.BRADBURY_PLATEAU);
  if (controlsBradbury) {
    oreCost -= 1; // Cost reduced to 2 ore
  }
  
  // 3. Check if player has enough ore
  if (player.ore < oreCost) {
    // Insufficient ore, effect fails
    // Ships still go to Maintenance Bay (requirement was met)
    return;
  }
  
  // 4. Pay ore cost
  player.ore -= oreCost;
  
  // 5. Check if target territory has Repulsor Field (Ref: Ambiguity #94)
  if (territory.hasFieldGenerator(FieldType.REPULSOR)) {
    // Cannot place colony (Repulsor blocks placement)
    // Ore is lost (paid but effect failed)
    return;
  }
  
  // 6. Place colony on territory
  territory.addColony(player);
  
  // 7. Update territory control immediately
  const newControl = determineStrictMajority(territory);
  territory.controlledBy = newControl;
}
```

### Timing

- **When Effect Resolves:** Immediately when 3rd ship docks
- **Ship Destination:** All 3 ships move to Maintenance Bay
- **Ore Payment:** Happens during ACTION phase (not delayed)

### Special Rules

**Ore Cost Calculation (Ref: Ambiguity #40)**

Base cost: **3 ore**  
With Bradbury Plateau: **2 ore**

```
Player controls Bradbury Plateau: Cost = 2 ore
Player does NOT control Bradbury: Cost = 3 ore
```

**Insufficient Ore (Ref: Ambiguity #41)**

If player doesn't have enough ore when effect resolves:

```
Player has 1 ore
Dock 3 ships at Colony Constructor
Cost: 3 ore (player doesn't control Bradbury)

Result:
  Check ore: 1 < 3 (insufficient)
  Effect fails: No colony placed
  Ships still go to Maintenance Bay (requirement was met)
  Ore unchanged: Still have 1 ore

Lesson: Check ore before committing ships!
```

**Territory Selection**

Player chooses which territory to place colony on:

```typescript
function colonylacementChoice(player: Player, territories: Territory[]): Territory {
  // Player chooses from available territories
  const validTerritories = territories.filter(t => {
    // Cannot place on territory with Repulsor Field
    return !t.hasFieldGenerator(FieldType.REPULSOR);
  });
  
  // Prompt player to choose
  return promptTerritoryChoice(player, validTerritories);
}
```

**Repulsor Field Blocking (Ref: Ambiguity #94)**

If target territory has Repulsor Field:

```
Action: Use Colony Constructor, select Heinlein Plains
Check: Heinlein Plains has Repulsor Field

Result:
  Cannot place colony (Repulsor blocks)
  Ore is lost (3 ore paid but effect failed)
  Ships still go to Maintenance Bay

Strategy: Check for Repulsor Fields before committing ships!
Alternative: Use Booster Pod discard to remove Repulsor first
```

### State Diagram

```
Ships (any 3) at hand
      ↓ Dock at Colony Constructor
Ship 1 docks → [DOCKED] (waiting)
Ship 2 docks → [DOCKED] (waiting)
Ship 3 docks → [DOCKED] (waiting)
      ↓ Requirement met (3 ships)
Pay 3 ore (or 2 with Bradbury)
Place colony on territory
      ↓
All 3 ships → Maintenance Bay [COMMITTED]
      ↓ GATHER phase (next turn)
Ships return to hand
```

### Examples

**Example 1: Basic Colony Placement**

```
Setup:
  Player has 5 ore
  Player does NOT control Bradbury Plateau
  Player ships: [1, 3, 6]
  Colony Constructor: Empty

Action Sequence:
  1. Dock ship(1) → DOCKED (waiting)
  2. Dock ship(3) → DOCKED (waiting)
  3. Dock ship(6) → DOCKED (waiting), 3 ships triggers effect
  
Effect Resolution:
  Check ore: 5 ≥ 3 ✓
  Pay 3 ore: 5 - 3 = 2 ore remaining
  Choose territory: Heinlein Plains (no Repulsor)
  Place colony on Heinlein Plains
  Update control: Check strict majority
  
Result:
  Colony placed on Heinlein Plains
  Player has 2 ore remaining
  Ships [1, 3, 6] → Maintenance Bay
```

**Example 2: Bradbury Plateau Discount**

```
Setup:
  Player has 2 ore (only 2!)
  Player controls Bradbury Plateau
  Player ships: [2, 4, 5]

Action:
  Dock ships [2, 4, 5] at Colony Constructor (3 ships)

Effect:
  Base cost: 3 ore
  Bradbury discount: -1 ore
  Final cost: 2 ore
  
  Check ore: 2 ≥ 2 ✓
  Pay 2 ore: 2 - 2 = 0 ore remaining
  Place colony on chosen territory
  
Result:
  Colony placed successfully
  Player has 0 ore remaining
  Ships [2, 4, 5] → Maintenance Bay
```

**Example 3: Insufficient Ore Failure**

```
Setup:
  Player has 1 ore (not enough!)
  Player does NOT control Bradbury
  Player ships: [3, 3, 3]
  Colony Constructor: Empty

Action:
  Dock ships [3, 3, 3] at Colony Constructor

Effect:
  Cost: 3 ore
  Check ore: 1 < 3 ✗ (insufficient!)
  Effect fails: No colony placed
  Ore unchanged: Still have 1 ore
  
Result:
  NO colony placed (wasted ship actions!)
  Player still has 1 ore
  Ships [3, 3, 3] → Maintenance Bay
  
Mistake: Should have checked ore before committing ships
Strategy: Dock at Lunar Mine first to gain ore, then Constructor
```

**Example 4: Repulsor Field Blocking**

```
Setup:
  Player has 4 ore
  Player wants to place on Pohl Foothills
  Pohl Foothills has Repulsor Field (placed by opponent)
  Player ships: [2, 5, 6]

Action:
  Dock ships [2, 5, 6] at Colony Constructor
  Choose territory: Pohl Foothills

Effect:
  Cost: 3 ore
  Pay 3 ore: 4 - 3 = 1 ore
  Check Repulsor: Pohl Foothills HAS Repulsor ✗
  Colony placement BLOCKED
  
Result:
  NO colony placed (Repulsor prevented it)
  Player LOST 3 ore (paid but failed)
  Player has 1 ore remaining
  Ships [2, 5, 6] → Maintenance Bay
  
Lesson: Check for Repulsor Fields before choosing territory
Alternative: Use Booster Pod discard to remove Repulsor first
```

### Interactions

**Territory Bonuses:**
- **Bradbury Plateau:** -1 ore cost (cost becomes 2 ore)
- **Data Crystal:** Can borrow Bradbury bonus from opponent

**Tech Cards:**
- **Booster Pod (discard):** Remove Repulsor Field blocking desired territory
- **Plasma Cannon (discard):** Remove opponent ship (not directly useful here)
- **Polarity Device (discard):** Swap colonies after placement (different effect)

**Field Generators:**
- **Repulsor Field:** BLOCKS colony placement on that territory (Ref: Ambiguity #94)
- **Isolation Field:** Does NOT block placement (only nullifies bonus)
- **Positron Field:** Does NOT block placement (grants +1 VP if control)

**Edge Cases:**
- Insufficient ore: Effect fails, ships still go to Maintenance Bay (Ref: Ambiguity #41)
- Repulsor Field: Ore lost, no colony placed (Ref: Ambiguity #94)
- All 7 colonies already placed: Cannot use Constructor (Ref: Ambiguity #153)

---

## 3.5 Lunar Mine

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      LUNAR MINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Docking Requirements

- **Single ship** with value **≥ current highest ship at mine**
- **Unlimited dock spaces**
- Multiple ships can dock per turn (each checked independently)

**Escalating Minimum (Ref: Ambiguity #42):**

```typescript
function canDockAtLunarMine(ship: Ship, lunarMine: Facility): boolean {
  const shipsAtMine = lunarMine.getAllShips();
  
  if (shipsAtMine.length === 0) {
    // Empty mine: Any value can dock
    return true;
  }
  
  // Find highest ship value at mine
  const highestValue = Math.max(...shipsAtMine.map(s => s.value));
  
  // Ship must be ≥ highest (ties allowed)
  return ship.value >= highestValue;
}
```

### Effect

**Gain 1 ore per ship docked**

```typescript
function lunarMineEffect(player: Player, ship: Ship): void {
  // Grant 1 ore immediately
  player.ore += 1;
  
  // Ship persists at Lunar Mine (does NOT go to Maintenance Bay)
  ship.location = Facility.LUNAR_MINE;
  ship.state = ShipState.COMMITTED;
}
```

### Timing

- **When Effect Resolves:** Immediately when each ship docks
- **Ship Destination:** Ships **persist** at Lunar Mine (do NOT return during GATHER)
- **Highest Value:** Updated after each ship docks

### Special Rules

**Ships Persist (Ref: Ambiguity #43)**

Unlike most facilities, ships at Lunar Mine **remain there indefinitely**:

```
Turn 1: Dock ship(3) → Gain 1 ore, ship stays at Lunar Mine
Turn 2: Ship(3) still at Lunar Mine, NOT returned to hand
Turn 3: Ship(3) still at Lunar Mine...

Ships only leave Lunar Mine if:
- Removed by Plasma Cannon → Maintenance Bay
- Moved by Orbital Teleporter → Different facility
```

**Escalating Minimum Example**

```
Initial State: Lunar Mine empty

Turn 1, Player A:
  Dock ship(2) → Gain 1 ore, highest = 2
  
Turn 2, Player B:
  Dock ship(1) → INVALID (1 < 2)
  Dock ship(2) → VALID (2 = 2, tie allowed), gain 1 ore, highest = 2
  Dock ship(5) → VALID (5 > 2), gain 1 ore, highest = 5
  
Turn 3, Player A:
  Dock ship(4) → INVALID (4 < 5)
  Dock ship(6) → VALID (6 > 5), gain 1 ore, highest = 6
```

**Van Vogt Mountains Bonus (Ref: Ambiguity #83)**

If player controls Van Vogt Mountains:

```typescript
function lunarMineWithVanVogt(player: Player, ship: Ship, lunarMine: Facility): boolean {
  const controlsVanVogt = player.controlsTerritory(TerritoryType.VAN_VOGT_MOUNTAINS);
  const isFirstShipThisTurn = !player.dockedAtLunarMineThisTurn;
  
  if (controlsVanVogt && isFirstShipThisTurn) {
    // First ship this turn: Bypass minimum check
    player.dockedAtLunarMineThisTurn = true;
    return true; // Any value allowed
  }
  
  // Subsequent ships (or no Van Vogt): Normal rules apply
  return canDockAtLunarMine(ship, lunarMine);
}
```

**Example:**
```
Player controls Van Vogt Mountains
Lunar Mine highest: 6
Player ships: [1, 5]

Action Sequence:
  1. Dock ship(1) → Van Vogt bonus (first ship)
     Bypass minimum check, gain 1 ore
     Highest remains 6 (ship(1) doesn't affect it)
  
  2. Dock ship(5) → Normal rules (second ship)
     Check: 5 < 6 ✗ INVALID
     Cannot dock ship(5)
     
Result: Only ship(1) docked (via Van Vogt bonus)
```

**Multiple Ships Same Turn**

Each ship is evaluated independently:

```
Lunar Mine highest: 3
Player ships: [3, 4, 5]

Action Sequence:
  1. Dock ship(3) → Valid (3 = 3), gain 1 ore, highest = 3
  2. Dock ship(4) → Valid (4 > 3), gain 1 ore, highest = 4
  3. Dock ship(5) → Valid (5 > 4), gain 1 ore, highest = 5

Total: 3 ore gained, all 3 ships persist at Lunar Mine
```

### State Diagram

```
Ship (value ≥ highest) at hand
      ↓ Dock at Lunar Mine
  [DOCKED]
      ↓ Requirement met (instant)
Gain 1 ore
      ↓
Ship stays at Lunar Mine [COMMITTED]
      ↓ PERSISTS indefinitely
Ship remains at Lunar Mine (NOT returned during GATHER)
      ↓ Only leaves if removed/moved
Plasma Cannon → Maintenance Bay
OR Orbital Teleporter → Different facility
```

### Examples

**Example 1: Initial Dock**

```
Setup:
  Lunar Mine: Empty (no ships)
  Player ships: [2]

Action:
  Dock ship(2) at Lunar Mine

Result:
  Check highest: Mine empty, any value OK
  Gain 1 ore
  Ship(2) persists at Lunar Mine
  Highest = 2
  
Next Turn:
  Ship(2) still at Lunar Mine (not returned to hand)
  Player rolls remaining ships (typically 2 ships)
```

**Example 2: Escalating Minimum**

```
Setup:
  Lunar Mine: Ships [3, 5] (highest = 5)
  Player ships: [4, 6]

Action Sequence:
  1. Try ship(4) → 4 < 5 ✗ INVALID
  
  2. Dock ship(6) → 6 > 5 ✓ VALID
     Gain 1 ore
     Ship(6) persists at Lunar Mine
     Highest = 6
  
  3. Retry ship(4) → 4 < 6 ✗ STILL INVALID
  
Result:
  Only ship(6) docked
  Ship(4) remains in hand (must dock elsewhere)
```

**Example 3: Van Vogt Mountains Bypass**

```
Setup:
  Player controls Van Vogt Mountains
  Lunar Mine: Ships [6] (highest = 6)
  Player ships: [1, 2, 5]

Action Sequence:
  1. Dock ship(1) → Van Vogt bonus (first ship this turn)
     Bypass minimum check ✓
     Gain 1 ore
     Ship(1) persists, highest still 6
  
  2. Dock ship(5) → Normal rules (second ship)
     Check: 5 < 6 ✗ INVALID
  
  3. Dock ship(2) → Normal rules
     Check: 2 < 6 ✗ INVALID
  
Result:
  Only ship(1) docked (via Van Vogt)
  Ships [2, 5] must dock elsewhere
```

**Example 4: Plasma Cannon Removal**

```
Setup:
  Opponent has ships [5, 6] at Lunar Mine
  Player has Plasma Cannon, 2 fuel
  Player wants to "reset" the mine minimum

Action:
  Use Plasma Cannon fuel power (2 fuel)
  Target: Lunar Mine
  Remove 2 opponent ships (1 fuel each)

Result:
  Ships [5, 6] → Opponent's Maintenance Bay
  Lunar Mine now empty
  Highest = none (any value can dock next)
  
  Player can now dock low-value ships easily!
```

### Interactions

**Territory Bonuses:**
- **Van Vogt Mountains:** First ship per turn bypasses minimum check (Ref: Ambiguity #83)
- **Data Crystal:** Can borrow Van Vogt bonus from opponent

**Tech Cards:**
- **Booster Pod:** +1 ship value (to meet minimum)
- **Stasis Beam:** -1 ship value (NOT helpful here)
- **Polarity Device:** Flip ship (7-value) to potentially meet minimum
- **Plasma Cannon:** Remove opponent ships to lower minimum
- **Orbital Teleporter:** Move ship from Lunar Mine to different facility

**Field Generators:**
- None directly affect Lunar Mine

**Edge Cases:**
- Ships persist indefinitely (Ref: Ambiguity #43)
- Van Vogt bonus: First ship only, per turn (Ref: Ambiguity #83)
- Multiple ships: Each evaluated independently (Ref: Ambiguity #42)
- Empty mine: Any value can dock (Ref: Ambiguity #42)

---

**End of Section 3, Part 1**

*Continues in Section 3, Part 2: Maintenance Bay, Orbital Market, Raiders' Outpost, Shipyard.*

---

## Cross-References

- **Ambiguities Resolved**: #31-43 (facilities), #67 (Asimov Crater), #83 (Van Vogt Mountains), #94 (Repulsor Field), #153 (all colonies placed), #155 (deck exhaustion)
  
- **Related Sections**:
  - Section 2 (Turn Structure): ACTION phase mechanics
  - Section 4 (Territories): Territory bonus details
  - Section 5 (Field Generators): Repulsor Field blocking
  - Section 6 (Alien Tech Cards): Individual card interactions
