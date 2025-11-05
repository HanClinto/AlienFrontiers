# Section 6: Alien Tech Cards (Part 1)

**Pages 42-47 of Complete Rules Reference**

---

## 6.1 Tech Card System

### Overview

**12 unique Alien Tech Cards** provide powerful abilities. Each card has:

1. **Fuel Power** - Activated by spending fuel (reusable)
2. **Discard Power** - One-time use, card discarded permanently

### Acquisition

Claim tech cards at **Alien Artifact** facility:

```typescript
function alienArtifactEffect(player: Player, ships: Ship[]): void {
  // Requirement: Total die value ≥ 8
  const total = ships.reduce((sum, ship) => sum + ship.value, 0);
  if (total < 8) {
    throw new Error(`Need total ≥ 8, have ${total}`);
  }
  
  // Draw tech card from deck
  const card = techCardDeck.draw();
  
  // Check if player already has this card (Ref: Ambiguity #98)
  if (player.hasCard(card.type)) {
    // Cycle deck: Put card on bottom, draw next
    techCardDeck.putOnBottom(card);
    const newCard = techCardDeck.draw();
    player.addCard(newCard);
  } else {
    player.addCard(card);
  }
  
  // Ships → Maintenance Bay
  ships.forEach(ship => ship.location = Facility.MAINTENANCE_BAY);
}
```

### Visibility (Ref: Ambiguity #95, #96)

```typescript
// Tech cards are PUBLIC information
class Player {
  public techCards: TechCard[] = [];
  
  // All players can see opponent tech cards
  public getTechCards(): TechCard[] {
    return this.techCards; // Visible to all
  }
}

// UI should display opponent tech cards clearly
function renderOpponentHand(opponent: Player): void {
  opponent.techCards.forEach(card => {
    // Show card face-up
    displayCard(card, CardVisibility.PUBLIC);
  });
}
```

**Ambiguity #95 Resolution:** Tech cards are PUBLIC (visible to all players)

**Ambiguity #96 Resolution:** Opponent can see your tech cards at all times

### Power Activation Timing

**Fuel Powers (Ref: Ambiguity #99, #100, #101):**

```typescript
// Fuel powers activated during ACTION phase
function actionPhase(player: Player): void {
  // Can activate fuel powers in any order with ship docking
  // Examples:
  //   1. Fuel power → Dock ships
  //   2. Dock ships → Fuel power
  //   3. Fuel power → Fuel power → Dock ships
  //   4. Dock ships → Fuel power → Dock ships
  
  // Fuel powers are INSTANT (Ref: Ambiguity #99)
  // No "persistent until end of turn" unless stated
}
```

**Discard Powers (Ref: Ambiguity #102, #103):**

```typescript
// Discard powers also activated during ACTION phase
function discardPower(player: Player, card: TechCard): void {
  // Card discarded permanently (Ref: Ambiguity #102)
  player.removeCard(card);
  techCardDiscard.add(card);
  
  // Effect applied immediately
  card.applyDiscardEffect(player);
  
  // Card gone forever (not recycled to deck)
}
```

**Ambiguity #99:** Fuel powers are INSTANT effects (not persistent)

**Ambiguity #100:** Fuel powers can be used multiple times per turn (if can afford fuel)

**Ambiguity #101:** Can interleave fuel powers with ship docking

**Ambiguity #102:** Discard powers remove card permanently

**Ambiguity #103:** Discard powers activated during ACTION phase

### Tech Card Limit

```typescript
// No explicit limit on number of tech cards (Ref: Ambiguity #97)
// Practical limit: 12 cards total in game (1 of each type)
// Player can theoretically acquire all 12 if lucky

class Player {
  public techCards: TechCard[] = []; // No max size
  
  // But: Can only have 1 copy of each card type
  public hasCard(cardType: CardType): boolean {
    return this.techCards.some(card => card.type === cardType);
  }
}
```

**Ambiguity #97:** No limit on tech cards per player (except 1 of each type)

---

## 6.2 Individual Tech Cards

### Card Template Format

Each card documented with:
- **Fuel Power:** Reusable ability (costs fuel)
- **Discard Power:** One-time ability (discards card)
- **Timing:** When powers can be activated
- **Examples:** 4 usage scenarios
- **Interactions:** With facilities, territories, other cards
- **Strategy Notes:** Optimal usage patterns

---

## 6.2.1 Alien City

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      ALIEN CITY
            Immediate Colony Placement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Fuel Power

**Cost:** 3 fuel  
**Effect:** Place 1 colony on any territory (immediate)

```typescript
function alienCityFuelPower(player: Player, territory: Territory): void {
  // Check cost
  if (player.fuel < 3) {
    throw new Error("Need 3 fuel");
  }
  
  // Check Repulsor Field (Ref: Ambiguity #94)
  if (territory.hasFieldGenerator(FieldType.REPULSOR)) {
    // Fuel still spent! (same as Colony Constructor)
    player.fuel -= 3;
    throw new Error(`Cannot place colony: Repulsor Field on ${territory.name}`);
  }
  
  // Check capacity
  if (territory.colonies.length >= 3) {
    throw new Error("Territory full (3 colonies max)");
  }
  
  // Pay cost
  player.fuel -= 3;
  
  // Place colony
  territory.addColony(player);
  
  // Update territory control
  updateTerritoryControl(territory);
}
```

### Discard Power

**Effect:** Place 2 colonies (any territories, immediate)

```typescript
function alienCityDiscardPower(player: Player): void {
  // Remove card permanently
  player.removeCard(CardType.ALIEN_CITY);
  
  // Player chooses 2 territories
  const territory1 = player.chooseTerritory();
  const territory2 = player.chooseTerritory(); // Can be same or different
  
  // Place colonies (check Repulsor for each)
  placeColonyIfPossible(player, territory1);
  placeColonyIfPossible(player, territory2);
}

function placeColonyIfPossible(player: Player, territory: Territory): void {
  // Check Repulsor
  if (territory.hasFieldGenerator(FieldType.REPULSOR)) {
    // Colony placement blocked (no fuel cost, so not wasted)
    return;
  }
  
  // Check capacity
  if (territory.colonies.length >= 3) {
    return; // Skip if full
  }
  
  // Place colony
  territory.addColony(player);
  updateTerritoryControl(territory);
}
```

### Timing

- **Fuel Power:** During ACTION phase, any time (Ref: Ambiguity #101)
- **Discard Power:** During ACTION phase, any time (Ref: Ambiguity #103)
- **No Ships Required:** Placement independent of ship docking

### Special Rules

**Repulsor Interaction (Ref: Ambiguity #94):**

```
Fuel Power with Repulsor:
  Cost: 3 fuel (charged even if blocked)
  Effect: Colony placement BLOCKED
  Result: Lost 3 fuel, no colony (waste!)

Discard Power with Repulsor:
  Cost: Card discarded (still lost)
  Effect: Blocked colonies not placed
  Result: May only place 0-2 colonies (partial effect)
```

**Multiple Placements:**

Discard power can place on same territory twice:

```
Player discards Alien City
Choose: Burroughs Desert (both placements)

Result:
  2 colonies placed on Burroughs
  Player may gain control (2 colonies)
  Excellent for territory takeover!
```

**Fuel Power vs. Colony Constructor:**

```
Alien City Fuel Power:
  Cost: 3 fuel
  Ships: None required
  Result: 1 colony

Colony Constructor:
  Cost: 3 ore (2 with Bradbury)
  Ships: 2 ships (any values)
  Result: 1 colony
  
Comparison:
  Alien City faster (no ships needed)
  Colony Constructor cheaper (2 ore < 3 fuel often)
```

### Examples

**Example 1: Basic Fuel Power**

```
Setup:
  Player has Alien City
  Player has 5 fuel, 2 ore
  Burroughs colonies: [Opponent, Opponent, empty]
  Player needs Burroughs control for Relic Ship

Action:
  Activate Alien City fuel power
  Cost: 3 fuel
  Target: Burroughs Desert
  
Effect:
  Fuel: 5 - 3 = 2
  Place colony on Burroughs
  Burroughs: [O, O, P] → Tie (2-1, not strict majority)
  
Next turn:
  Place 1 more colony → Control (2-2-1? No, P has 1 vs O has 2)
  
Actually: [O, O, P] → Opponent controls (2 > 1)
Need 1 more colony to tie: [O, O, P, P] → Tie
```

**Example 2: Discard Power Territory Takeover**

```
Setup:
  Player has Alien City
  Lem Badlands colonies: [Opponent, Opponent, empty]
  Opponent controls Lem (2 > 0)
  Player has 1 fuel (not enough for fuel power)

Action:
  Discard Alien City
  Place 2 colonies on Lem Badlands
  
Effect:
  Lem colonies: [O, O, P, P] → Tie (2-2)
  No one controls (need strict majority)
  
  But: Opponent lost control!
  Opponent loses +1 fuel/ship bonus
  
Later:
  Player places 3rd colony on Lem
  Player controls (3 > 2, strict majority)
  Gains +1 fuel/ship bonus
```

**Example 3: Repulsor Blocking Fuel Power**

```
Setup:
  Player has Alien City
  Player has 4 fuel
  Opponent placed Repulsor on Heinlein Plains
  Player tries to place colony on Heinlein

Action:
  Activate Alien City fuel power
  Target: Heinlein Plains
  Check Repulsor: BLOCKED
  
Effect:
  Fuel: 4 - 3 = 1 (still charged!)
  No colony placed
  Major waste!
  
Lesson: Check Repulsor Fields before using fuel powers
```

**Example 4: Discard Power Multi-Territory**

```
Setup:
  Player has Alien City
  Player has 6 colonies placed (1 short of max 7)
  Player needs control of Asimov and Bradbury

Action:
  Discard Alien City
  Place colony #1 on Asimov Crater
  Place colony #2 on Bradbury Plateau
  
Effect:
  Asimov: Player gains control (+1 VP, +1 colony advance)
  Bradbury: Player gains control (+1 VP, -1 ore cost)
  Total VP increase: +2
  Total colonies: 6 + 2 = 8 (over limit!)
  
Wait: Max 7 colonies!
  Can only place 1 colony (already at 6)
  Second placement blocked by limit
  
Discard power partially wasted
```

### Interactions

**Facilities:**
- **Colony Constructor:** Alien City faster but costs fuel vs. ore
- **Colonist Hub:** Alien City instant vs. gradual advancement
- **Terraforming Station:** Alien City cheaper (3 fuel vs. 1 ship forfeit)

**Territories:**
- Can target any territory (check Repulsor first)
- Enables rapid territory control flips

**Tech Cards:**
- **Alien Monument:** Similar effect (2 colonies), different cost
- **Repulsor Field:** Blocks both fuel and discard powers

**Field Generators:**
- **Repulsor Field:** BLOCKS placement (Ref: Ambiguity #94)
- **Isolation Field:** No interaction (doesn't block placement)

**Edge Cases:**
- Fuel power costs 3 fuel even if Repulsor blocks
- Discard power can place both colonies on same territory
- Subject to 7 colony per player limit
- No ships required (major advantage)

### Strategy Notes

**Fuel Power Usage:**
- Use when have excess fuel but no ore
- Quick territory takeover without ships
- Emergency colony placement
- Check Repulsor Fields first!

**Discard Power Usage:**
- Last colony rush (place 2 for victory)
- Simultaneous multi-territory takeover
- When have 5-6 colonies (maximize placements)
- More valuable than fuel power (2 vs. 1 colony)

**Priority Targets:**
1. Burroughs Desert (Relic Ship control)
2. Territories where opponents have 2 colonies (steal control)
3. High-value bonuses (Lem, Asimov, Bradbury)

---

## 6.2.2 Alien Monument

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   ALIEN MONUMENT
         Colony Track Advancement Bonus
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Fuel Power

**Cost:** 1 fuel  
**Effect:** +1 colony advancement this turn

```typescript
function alienMonumentFuelPower(player: Player): void {
  // Check cost
  if (player.fuel < 1) {
    throw new Error("Need 1 fuel");
  }
  
  // Pay cost
  player.fuel -= 1;
  
  // Grant bonus (Ref: Ambiguity #110)
  player.colonyAdvancementBonus += 1;
  
  // Bonus applies to ALL Colonist Hub uses this turn
}
```

### Discard Power

**Cost:** Card discarded  
**Effect:** +2 colony advancement this turn (Ref: Ambiguity #111)

```typescript
function alienMonumentDiscardPower(player: Player): void {
  // Remove card permanently
  player.removeCard(CardType.ALIEN_MONUMENT);
  
  // Grant bonus (Ref: Ambiguity #111)
  player.colonyAdvancementBonus += 2;
  
  // Bonus applies to ALL Colonist Hub uses this turn
}
```

### Timing

- **Fuel Power:** Activate BEFORE using Colonist Hub (Ref: Ambiguity #110)
- **Discard Power:** Activate BEFORE using Colonist Hub (Ref: Ambiguity #111)
- **Duration:** Entire turn (all Colonist Hub uses)

### Special Rules

**Turn-Wide Bonus (Ref: Ambiguity #110, #111):**

Bonus applies to ALL Colonist Hub uses in turn:

```typescript
function colonistHubWithMonument(player: Player, numShips: number): void {
  let advancement = numShips;
  
  // Asimov Crater bonus
  if (player.controlsTerritory(TerritoryType.ASIMOV_CRATER)) {
    advancement += 1;
  }
  
  // Alien Monument bonus (Ref: Ambiguity #110, #111)
  advancement += player.colonyAdvancementBonus;
  
  player.advanceColonyTrack(advancement);
}

// At end of turn, reset bonus
function cleanupPhase(player: Player): void {
  player.colonyAdvancementBonus = 0;
  // ... other cleanup
}
```

**Multiple Uses Per Turn:**

```
Turn sequence:
  1. Activate Alien Monument fuel power (+1 advancement)
  2. Use Colonist Hub with 2 ships → 2 + 1 = 3 advancement
  3. Use Colonist Hub with 1 ship → 1 + 1 = 2 advancement
  
Total: 5 advancement from 3 ships (normally 3)
Bonus applied twice!
```

**Stacking with Asimov:**

```
Player controls Asimov Crater
Player activates Alien Monument fuel power

Colonist Hub with 3 ships:
  Base: 3 (ships)
  Asimov: +1
  Monument: +1
  Total: 5 advancement
  
With discard power:
  Base: 3 (ships)
  Asimov: +1
  Monument: +2 (discard)
  Total: 6 advancement!
```

**Fuel vs. Discard Power:**

```
Fuel Power: +1 advancement, reusable (1 fuel each time)
Discard Power: +2 advancement, one-time (card lost)

When to discard:
  - Last turn before victory (maximize advancement)
  - Have 4-5 colonies on track (push to 7)
  - Multiple Colonist Hub uses planned this turn
```

### Examples

**Example 1: Basic Fuel Power**

```
Setup:
  Player has Alien Monument
  Player has 3 fuel
  Player has 2 colonies on track
  Player ships: [4, 5, 6]

Action:
  1. Activate Alien Monument fuel power
     Cost: 1 fuel → 2 fuel remaining
     Bonus: +1 advancement this turn
  
  2. Dock ships [4, 5, 6] at Colonist Hub
     Base: 3 advancement
     Monument: +1
     Total: 4 advancement
  
Result:
  Colonies on track: 2 + 4 = 6
  Without Monument: Would be 2 + 3 = 5
  Gained 1 extra colony progress
```

**Example 2: Discard Power with Asimov**

```
Setup:
  Player has Alien Monument
  Player controls Asimov Crater
  Player has 4 colonies on track
  Player ships: [2, 3, 5]
  Last turn to maximize colonies!

Action:
  1. Discard Alien Monument
     Bonus: +2 advancement this turn
     Card lost permanently
  
  2. Dock ships [2, 3, 5] at Colonist Hub
     Base: 3 advancement
     Asimov: +1
     Monument discard: +2
     Total: 6 advancement
  
Result:
  Colonies: 4 + 6 = 10 (over limit!)
  Max 7 colonies → Place 7
  Reached maximum in one turn!
```

**Example 3: Multiple Colonist Hub Uses**

```
Setup:
  Player has Alien Monument
  Player has 3 colonies on track
  Player ships: [1, 2, 3, 4]
  Player has 2 fuel

Action:
  1. Activate Alien Monument fuel power
     Cost: 1 fuel → 1 fuel remaining
     Bonus: +1 advancement this turn
  
  2. Dock ship [1] at Colonist Hub
     Base: 1
     Monument: +1
     Total: 2 advancement
     Colonies: 3 + 2 = 5
  
  3. Dock ships [2, 3, 4] at Colonist Hub
     Base: 3
     Monument: +1 (still active!)
     Total: 4 advancement
     Colonies: 5 + 4 = 9 (over limit!)
     Place max 7
  
Result:
  Reached 7 colonies
  Monument bonus applied to BOTH uses
  Very efficient!
```

**Example 4: Forgetting to Activate**

```
Setup:
  Player has Alien Monument
  Player has 5 colonies on track
  Player ships: [3, 3]

Action (WRONG):
  1. Dock ships [3, 3] at Colonist Hub
     Base: 2 advancement
     Total: 2 advancement
     Colonies: 5 + 2 = 7 (maximum!)
  
  2. Try to activate Alien Monument fuel power
     TOO LATE! Already docked ships
     Cannot retroactively apply bonus
  
Result:
  Forgot to activate Monument first
  Wasted potential +1 advancement
  
Correct sequence:
  1. Activate Monument FIRST
  2. Then dock ships at Colonist Hub
```

### Interactions

**Facilities:**
- **Colonist Hub:** Primary use case (Ref: Ambiguity #110, #111)
- **Colony Constructor:** No interaction (doesn't advance track)
- **Terraforming Station:** No interaction (direct placement)

**Territories:**
- **Asimov Crater:** Stacks with Monument (Ref: Ambiguity #72, #110)
  - Asimov: +1 per use
  - Monument: +1 (fuel) or +2 (discard)
  - Combined: +2 or +3 per Colonist Hub use

**Tech Cards:**
- **Alien City:** Alternative colony method (direct placement)
- No other cards directly affect colony advancement

**Edge Cases:**
- Must activate BEFORE Colonist Hub (Ref: Ambiguity #110, #111)
- Bonus lasts entire turn (all uses)
- Stacks with Asimov Crater
- Discard grants +2 (not +1) (Ref: Ambiguity #111)
- Subject to 7 colony max (excess wasted)

### Strategy Notes

**Fuel Power:**
- Use when planning multiple Colonist Hub actions
- Cheap (1 fuel) and reusable
- Best with Asimov control
- Activate early in ACTION phase

**Discard Power:**
- Use for final colony push (4-5 → 7)
- Combine with Asimov for +3 total
- Worth discarding if guarantees victory
- More valuable than fuel power (permanent +2)

**Optimal Timing:**
1. Activate Monument (fuel or discard)
2. Use Colonist Hub multiple times
3. Maximize advancement per ship

---

## 6.2.3 Booster Pod

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    BOOSTER POD
       Ship Value Modification & Field Generators
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Fuel Power

**Cost:** 2 fuel  
**Effect:** +1 or -1 to any ship's die value (this turn)

```typescript
function boosterPodFuelPower(player: Player, ship: Ship, modifier: number): void {
  // Check cost
  if (player.fuel < 2) {
    throw new Error("Need 2 fuel");
  }
  
  // Validate modifier
  if (modifier !== 1 && modifier !== -1) {
    throw new Error("Modifier must be +1 or -1");
  }
  
  // Pay cost
  player.fuel -= 2;
  
  // Modify ship value (Ref: Ambiguity #112, #113)
  ship.value += modifier;
  
  // Clamp to valid range [1, 6] (Ref: Ambiguity #114)
  ship.value = Math.max(1, Math.min(6, ship.value));
  
  // Modified value persists until next ROLL phase
}
```

### Discard Power

**Effect:** Place OR remove 1 field generator (Ref: Ambiguity #115)

```typescript
function boosterPodDiscardPower(player: Player, action: string): void {
  // Remove card permanently
  player.removeCard(CardType.BOOSTER_POD);
  
  if (action === "place") {
    // Place field generator
    const fieldType = player.chooseFieldType();
    const territory = player.chooseTerritory();
    placeFieldGenerator(player, fieldType, territory);
  } else if (action === "remove") {
    // Remove field generator (Ref: Ambiguity #115)
    const territory = player.chooseTerritory();
    const fieldType = player.chooseFieldType();
    
    if (!territory.hasFieldGenerator(fieldType)) {
      throw new Error("No such field generator on territory");
    }
    
    territory.removeFieldGenerator(fieldType);
  }
}
```

### Timing

- **Fuel Power:** During ACTION phase, before docking ship (Ref: Ambiguity #112)
- **Discard Power:** During ACTION phase, any time (Ref: Ambiguity #115)
- **Duration (Fuel):** Until next ROLL phase (Ref: Ambiguity #113)

### Special Rules

**Persistent Modification (Ref: Ambiguity #113):**

Ship value change lasts until next ROLL:

```
Turn 1:
  ROLL: Ship rolls 4
  ACTION: Activate Booster Pod (+1) → Ship value 5
  Use ship at facility (value 5)
  Ship → Maintenance Bay (value still 5)
  
  GATHER (Turn 2): Ship returns to hand (value still 5!)
  ROLL (Turn 2): Ship re-rolled → Value changes to new roll
  
Modified value persists through GATHER phase!
```

**Value Clamping (Ref: Ambiguity #114):**

Cannot exceed [1, 6] range:

```typescript
// Ship value 6, try to boost
boosterPodFuelPower(player, ship, +1);
// ship.value = min(6 + 1, 6) = 6 (no change!)
// 2 fuel wasted!

// Ship value 1, try to decrease
boosterPodFuelPower(player, ship, -1);
// ship.value = max(1 - 1, 1) = 1 (no change!)
// 2 fuel wasted!
```

**Multiple Uses:**

Can use Booster Pod multiple times per turn:

```
Ship value: 3
Use Booster Pod: 3 + 1 = 4 (cost 2 fuel)
Use Booster Pod again: 4 + 1 = 5 (cost 2 fuel)
Use Booster Pod again: 5 + 1 = 6 (cost 2 fuel)

Total: 3 → 6 (cost 6 fuel)
Allows extreme value manipulation
```

**Field Generator Placement (Ref: Ambiguity #115):**

Discard power can place OR remove:

```
Option A: Place field generator
  Choose type: Isolation / Positron / Repulsor
  Choose territory: Any
  Field placed immediately

Option B: Remove field generator
  Choose territory: Any with field
  Choose type: Which field to remove
  Field removed immediately
  
Powerful for:
  - Removing opponent Repulsor before Colony Constructor
  - Removing opponent Isolation before using territory bonus
  - Placing Repulsor on opponent's target territory
```

### Examples

**Example 1: Lunar Mine Minimum**

```
Setup:
  Player has Booster Pod
  Lunar Mine minimum: 5
  Player ships: [4, 5, 6]
  Player has 3 fuel

Action:
  1. Activate Booster Pod fuel power
     Target: Ship(4)
     Modifier: +1
     Cost: 2 fuel → 1 fuel remaining
     Ship value: 4 + 1 = 5
  
  2. Dock ships [5, 5, 6] at Lunar Mine
     All ships > 5 (wait, 5 is not > 5!)
     Actually: Ship(5) ≤ 5 (cannot dock)
     Only ship(6) can dock
  
Actually need ship > 5, not ≥ 5:
  Ship(5) after boost still cannot dock
  Should have boosted to 6!
```

**Example 2: Alien Artifact Threshold**

```
Setup:
  Player has Booster Pod
  Player ships: [3, 4]
  Player has 4 fuel
  Need total ≥ 8 for Alien Artifact

Action:
  1. Activate Booster Pod fuel power
     Target: Ship(4)
     Modifier: +1
     Cost: 2 fuel → 2 fuel remaining
     Ship value: 4 + 1 = 5
  
  2. Dock ships [3, 5] at Alien Artifact
     Total: 3 + 5 = 8 ✓
     Claim tech card!
  
Result:
  Without Booster Pod: 3 + 4 = 7 (too low)
  With Booster Pod: 3 + 5 = 8 ✓
  Enabled Alien Artifact use
```

**Example 3: Removing Repulsor Field**

```
Setup:
  Player has Booster Pod
  Opponent placed Repulsor on Bradbury Plateau
  Player needs to place colony on Bradbury
  Player ships: [5, 5]
  Player has 3 ore

Action:
  1. Discard Booster Pod (discard power)
     Choose action: Remove field generator
     Choose territory: Bradbury Plateau
     Choose type: Repulsor Field
     Repulsor removed!
  
  2. Dock ships [5, 5] at Colony Constructor
     Target: Bradbury Plateau
     Cost: 3 - 1 (Bradbury) = 2 ore
     Place colony ✓
  
Result:
  Removed Repulsor blocking
  Placed colony successfully
  Cost: 1 tech card + 2 ore
```

**Example 4: Value Persistence**

```
Turn 1 ACTION:
  Ship rolled 3
  Activate Booster Pod: 3 + 1 = 4
  Dock ship(4) at Maintenance Bay (storage)
  
Turn 1 CLEANUP:
  Ship still value 4 (modification persists)
  
Turn 2 GATHER:
  Ship returns from Maintenance Bay
  Ship still value 4! (Ref: Ambiguity #113)
  
Turn 2 ROLL:
  Ship re-rolled → 5 (new value)
  Booster Pod modification lost
  
Analysis:
  Modification lasted through GATHER
  Only lost at next ROLL phase
```

### Interactions

**Facilities:**
- **Lunar Mine:** Helps exceed minimum requirement
- **Alien Artifact:** Helps reach total ≥ 8
- **All facilities:** Value modification affects requirements

**Territories:**
- Field generator placement affects all territories
- Removal counters opponent field strategies

**Tech Cards:**
- **Stasis Beam:** Opposite effect (decrease values)
- **Gravity Manipulator:** Similar (modify values)
- Booster Pod most versatile (fuel AND discard powers)

**Field Generators:**
- Discard power places/removes any field type (Ref: Ambiguity #115)
- Strategic: Remove Repulsor before Colony Constructor
- Strategic: Place Isolation on opponent's controlled territory

**Edge Cases:**
- Value modification persists until next ROLL (Ref: Ambiguity #113)
- Cannot exceed [1, 6] range (Ref: Ambiguity #114)
- Can modify multiple ships per turn (cost 2 fuel each)
- Discard power can place OR remove (Ref: Ambiguity #115)

### Strategy Notes

**Fuel Power:**
- Use to meet facility requirements (Lunar Mine, Alien Artifact)
- Boost odd ships to even for better Solar Converter efficiency
- Boost ships in Maintenance Bay (persist until next ROLL)
- Check value limits before using (avoid wasting fuel)

**Discard Power:**
- Remove Repulsor before Colony Constructor/Terraforming
- Remove Isolation before using territory bonus
- Place Repulsor on opponent's target territory (defensive)
- More valuable for removal than placement (reactive)

**Optimal Targets:**
1. Remove Repulsor from high-value territory
2. Boost ship to meet facility threshold
3. Place Isolation on opponent's key territory
4. Store boosted ship in Maintenance Bay (persist value)

---

**End of Section 6 Part 1**

*Continues in Section 6: Alien Tech Cards (Part 2).*

---

## Cross-References

- **Ambiguities Resolved**: #95-103, #110-115 (Tech card visibility, timing, Alien Monument, Booster Pod)
  
- **Related Sections**:
  - Section 2 (Turn Structure): ACTION phase timing for tech card powers
  - Section 3 (Facilities): Interactions with all facilities
  - Section 4 (Territories): Territory bonuses and control
  - Section 5 (Field Generators): Booster Pod placement/removal
  - Section 7 (Advanced Rules): Tech card acquisition rules
