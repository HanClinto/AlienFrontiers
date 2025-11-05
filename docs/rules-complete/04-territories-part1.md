# Section 4: Territories & Control Bonuses (Part 1)

**Pages 28-33 of Complete Rules Reference**

---

## 4.1 Territory Control System

### Control Algorithm

Territory control uses **strict majority** of colonies:

```typescript
function determineStrictMajority(territory: Territory): Player | null {
  // Count colonies per player
  const colonyCounts = new Map<Player, number>();
  
  territory.colonies.forEach(colony => {
    const count = colonyCounts.get(colony.owner) || 0;
    colonyCounts.set(colony.owner, count + 1);
  });
  
  // Find player with most colonies
  let maxPlayer: Player | null = null;
  let maxCount = 0;
  let tieExists = false;
  
  colonyCounts.forEach((count, player) => {
    if (count > maxCount) {
      maxPlayer = player;
      maxCount = count;
      tieExists = false;
    } else if (count === maxCount) {
      tieExists = true; // Multiple players tied at max
    }
  });
  
  // Strict majority: no ties allowed
  if (tieExists || maxCount === 0) {
    return null; // No control
  }
  
  return maxPlayer;
}
```

### Control Rules

**Strict Majority Required (Ref: Ambiguity #67, #68)**

```
Territory with 3 colony slots:

Colonies: [Red, Red, Blue]
  → Red: 2, Blue: 1
  → Red has STRICT MAJORITY (2 > 1)
  → Red controls territory

Colonies: [Red, Red, empty]
  → Red: 2, others: 0
  → Red has STRICT MAJORITY (2 > 0)
  → Red controls territory

Colonies: [Red, Blue, empty]
  → Red: 1, Blue: 1
  → TIE (1 = 1)
  → NO ONE controls territory

Colonies: [empty, empty, empty]
  → All: 0
  → NO ONE controls territory
```

**Control Changes (Ref: Ambiguity #69)**

Control updates occur when colonies placed/removed:

```typescript
function updateTerritoryControl(territory: Territory): void {
  const previousController = territory.controlledBy;
  const newController = determineStrictMajority(territory);
  
  if (previousController !== newController) {
    // Control changed!
    territory.controlledBy = newController;
    
    // Trigger effects
    if (territory.type === TerritoryType.BURROUGHS_DESERT) {
      // Burroughs Desert: losing player checks at GATHER
      if (previousController && !previousController.hasRelicShip) {
        // Will check at next GATHER phase
      }
    }
    
    // Update VP snapshots (may trigger victory)
    recalculateAllVictoryPoints();
  }
}
```

**Bonus Application (Ref: Ambiguity #70)**

Bonuses apply only while controlling:

```typescript
function hasBonus(player: Player, territory: TerritoryType): boolean {
  const territory = getTerritory(territory);
  return territory.controlledBy === player;
}

// Example: Bradbury Plateau
function colonyConstructorCost(player: Player): number {
  const baseCost = 3; // ore
  
  if (hasBonus(player, TerritoryType.BRADBURY_PLATEAU)) {
    return baseCost - 1; // 2 ore with bonus
  }
  
  return baseCost; // 3 ore without
}
```

### Territory Capacity

All territories have **3 colony slots** (Ref: Ambiguity #71):

```
┌─────────────┬─────────────┬─────────────┐
│   Colony    │   Colony    │   Colony    │
│   Slot 1    │   Slot 2    │   Slot 3    │
└─────────────┴─────────────┴─────────────┘

Maximum: 3 colonies per territory
Multiple players can have colonies on same territory
Control determined by strict majority
```

---

## 4.2 Asimov Crater

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    ASIMOV CRATER
         +1 Colony Advance at Colonist Hub
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Bonus Effect

**+1 colony advancement when using Colonist Hub**

```typescript
function colonistHubEffect(player: Player, numShips: number): void {
  // Base advancement
  let advancement = numShips;
  
  // Asimov Crater bonus (Ref: Ambiguity #72)
  if (player.controlsTerritory(TerritoryType.ASIMOV_CRATER)) {
    advancement += 1;
  }
  
  // Advance colonies
  player.advanceColonyTrack(advancement);
}
```

### Timing

- **When Applied:** During Colonist Hub resolution
- **Per Use or Per Turn:** PER USE of Colonist Hub (Ref: Ambiguity #72)
- **Multiple Uses:** Can benefit multiple times per turn if dock repeatedly

### Special Rules

**Per-Use Bonus (Ref: Ambiguity #72)**

Bonus applies to EACH Colonist Hub use:

```
Example: Use Colonist Hub twice in one turn

Use #1:
  Dock 2 ships → Base 2 advancement
  Asimov bonus → +1 advancement
  Total: 3 advancement

Use #2:
  Dock 1 ship → Base 1 advancement
  Asimov bonus → +1 advancement
  Total: 2 advancement

Turn total: 3 + 2 = 5 advancement from 3 ships!
Without Asimov: Would be 3 advancement
```

**Stacking with Other Bonuses**

Asimov combines with tech card effects:

```typescript
function colonistHubWithBonuses(player: Player, numShips: number): void {
  let advancement = numShips;
  
  // Asimov Crater bonus
  if (player.controlsTerritory(TerritoryType.ASIMOV_CRATER)) {
    advancement += 1;
  }
  
  // Alien Monument discard power (Ref: Ambiguity #111)
  // +2 advancement if discarded this turn
  // (Applied separately, not multiplicative)
  
  player.advanceColonyTrack(advancement);
}
```

### Examples

**Example 1: Single Use with Bonus**

```
Setup:
  Player controls Asimov Crater
  Player has 3 colonies on track
  Player ships: [1, 2, 3]

Action:
  Dock ships [1, 2, 3] at Colonist Hub

Effect:
  Base advancement: 3 (one per ship)
  Asimov bonus: +1
  Total: 4 advancement
  
Result:
  Colonies on track: 3 + 4 = 7
  Without Asimov: Would be 3 + 3 = 6
```

**Example 2: Multiple Uses Per Turn**

```
Setup:
  Player controls Asimov Crater
  Player has 2 colonies on track
  Player ships: [4, 5, 6, 6]

Action:
  Use #1: Dock ship [4] at Colonist Hub
    → 1 ship + 1 Asimov = 2 advancement
  
  Use #2: Dock ships [5, 6, 6] at Colonist Hub
    → 3 ships + 1 Asimov = 4 advancement
  
  Turn total: 2 + 4 = 6 advancement
  
Result:
  Colonies on track: 2 + 6 = 8 (OVER LIMIT)
  Can only place 7 colonies (limit)
  1 advancement wasted
```

**Example 3: Losing Control Mid-Turn**

```
Setup:
  Player controls Asimov Crater (2 colonies vs opponent 1)
  Player has 4 colonies on track
  Player ships: [2, 3]
  Opponent ships: [5, 5, 5] (will place colony)

Turn sequence:
  1. Player uses Colonist Hub:
     Dock ships [2, 3] → 2 + 1 Asimov = 3 advancement
     Colonies: 4 + 3 = 7
  
  2. Opponent uses Colony Constructor:
     Places colony on Asimov Crater
     Asimov colonies: [Opponent, Opponent, Player, Player]
     Control: Opponent now controls (2 > 2... wait, TIE!)
     
  Actually: [O, O, P, P] is 2-2 TIE → NO CONTROL
  
  3. If player had used Colonist Hub AFTER opponent:
     No Asimov bonus (don't control anymore)
     Would only get 2 advancement instead of 3
     
Strategy: Use Asimov bonuses EARLY in turn before losing control!
```

**Example 4: Interaction with Alien Monument**

```
Setup:
  Player controls Asimov Crater
  Player has Alien Monument tech card
  Player has 3 colonies on track
  Player ships: [5]

Action:
  1. Discard Alien Monument (discard power: +2 colony advancement this turn)
  2. Dock ship [5] at Colonist Hub

Effect:
  Base advancement: 1 ship
  Asimov bonus: +1
  Alien Monument discard: +2
  Total: 1 + 1 + 2 = 4 advancement
  
Result:
  Colonies on track: 3 + 4 = 7 (maximum!)
  Reached last colony from single ship!
```

### Interactions

**Facilities:**
- **Colonist Hub:** +1 advancement per use (Ref: Ambiguity #72)
- **Colony Constructor:** No effect (doesn't advance track)
- **Terraforming Station:** No effect (direct placement)

**Tech Cards:**
- **Alien Monument (discard):** +2 advancement combines with Asimov (Ref: Ambiguity #111)
- **Data Crystal:** Can borrow Asimov from opponent if they control
- **Holographic Decoy:** No interaction (doesn't affect colonies)

**Field Generators:**
- None affect Asimov Crater bonus

**Edge Cases:**
- Bonus applies per use, not per turn (Ref: Ambiguity #72)
- Control can change mid-turn (affects later uses)
- Cannot exceed 7 colonies on track (excess wasted)

---

## 4.3 Bradbury Plateau

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  BRADBURY PLATEAU
       -1 Ore Cost at Colony Constructor (2→1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Bonus Effect

**Reduce Colony Constructor ore cost by 1** (3 → 2 ore)

```typescript
function colonyConstructorCost(player: Player): number {
  const baseCost = 3; // ore
  
  // Bradbury Plateau bonus (Ref: Ambiguity #73)
  if (player.controlsTerritory(TerritoryType.BRADBURY_PLATEAU)) {
    return baseCost - 1; // 2 ore
  }
  
  return baseCost; // 3 ore
}

function colonyConstructorEffect(player: Player, ships: Ship[]): void {
  const cost = colonyConstructorCost(player);
  
  if (player.ore < cost) {
    throw new Error(`Not enough ore! Need ${cost}, have ${player.ore}`);
  }
  
  // Deduct ore
  player.ore -= cost;
  
  // Choose territory and place colony
  const territory = player.chooseTerritory();
  placeColony(player, territory);
  
  // Ships to Maintenance Bay
  ships.forEach(ship => ship.location = Facility.MAINTENANCE_BAY);
}
```

### Timing

- **When Applied:** During Colony Constructor cost calculation
- **Per Use or Per Turn:** PER USE (Ref: Ambiguity #73)
- **Cost Reduction:** Applied before ore deduction

### Special Rules

**Per-Use Reduction (Ref: Ambiguity #73)**

Each Colony Constructor use gets -1 ore:

```
Example: Use Colony Constructor twice in one turn

Use #1:
  Cost: 3 ore (base) - 1 (Bradbury) = 2 ore
  Pay: 2 ore
  Effect: Place colony

Use #2:
  Cost: 3 ore (base) - 1 (Bradbury) = 2 ore
  Pay: 2 ore
  Effect: Place colony

Total: 4 ore spent for 2 colonies
Without Bradbury: Would cost 6 ore!
Savings: 2 ore
```

**Cannot Go Below Zero**

Cost cannot be negative:

```typescript
function colonyConstructorCost(player: Player): number {
  let cost = 3; // base ore cost
  
  // Bradbury Plateau bonus
  if (player.controlsTerritory(TerritoryType.BRADBURY_PLATEAU)) {
    cost -= 1;
  }
  
  // Hypothetical future bonuses
  // if (player.hasAnotherBonus()) {
  //   cost -= 3;
  // }
  
  // Minimum 0 ore
  return Math.max(0, cost);
}
```

**Interaction with Repulsor Field**

Bradbury bonus applies even if target blocked:

```
Action: Use Colony Constructor targeting Pohl Foothills
Check: Pohl has Repulsor Field (blocks colony placement)

Cost Calculation:
  Base: 3 ore
  Bradbury: -1 ore
  Final: 2 ore
  
Effect:
  Pay 2 ore (still charged!)
  Colony placement BLOCKED by Repulsor
  Ships → Maintenance Bay
  
Result:
  Lost 2 ore with no colony placed
  Major waste!
  
Lesson: ALWAYS check Repulsor Fields before committing ore
```

### Examples

**Example 1: Basic Cost Reduction**

```
Setup:
  Player controls Bradbury Plateau
  Player has 4 ore, 2 fuel
  Player ships: [3, 3]

Action:
  Dock ships [3, 3] at Colony Constructor
  Choose territory: Heinlein Plains (no Repulsor)

Effect:
  Cost: 3 - 1 (Bradbury) = 2 ore
  Pay: 2 ore
  Place colony on Heinlein Plains
  Ships [3, 3] → Maintenance Bay
  
Result:
  Ore: 4 - 2 = 2 remaining
  Colony successfully placed
  Saved 1 ore vs. base cost
```

**Example 2: Multiple Colonies in One Turn**

```
Setup:
  Player controls Bradbury Plateau
  Player has 10 ore (saved up!)
  Player ships: [2, 2, 4, 4, 6, 6]

Action:
  Use #1: Dock [2, 2] → Colony Constructor → 2 ore
  Use #2: Dock [4, 4] → Colony Constructor → 2 ore
  Use #3: Dock [6, 6] → Colony Constructor → 2 ore
  
  Total: 3 colonies for 6 ore
  Without Bradbury: Would cost 9 ore
  Savings: 3 ore!
  
Result:
  Ore: 10 - 6 = 4 remaining
  Placed 3 colonies in one turn
  MASSIVE progress toward victory
```

**Example 3: Insufficient Ore**

```
Setup:
  Player controls Bradbury Plateau
  Player has 1 ore, 5 fuel
  Player ships: [5, 5]

Action:
  Try to use Colony Constructor

Cost Calculation:
  Need: 3 - 1 (Bradbury) = 2 ore
  Have: 1 ore
  Short: 1 ore
  
Result:
  CANNOT use Colony Constructor
  Need to gain more ore first
  
Options:
  A) Dock at Lunar Mine to gain ore
  B) Trade at Orbital Market (fuel → ore)
  C) Wait until next turn
```

**Example 4: Losing Control Before Using**

```
Setup:
  Player controls Bradbury (2 colonies vs opponent 1)
  Player has 2 ore
  Player ships: [4, 4]
  Opponent ships: [5, 5, 5]

Turn sequence:
  1. Opponent uses Colony Constructor first:
     Places colony on Bradbury
     Bradbury: [O, O, P, P] → 2-2 TIE → NO CONTROL
  
  2. Player tries to use Colony Constructor:
     Cost: 3 ore (no Bradbury bonus!)
     Have: 2 ore
     CANNOT ACTIVATE
     
  If player had acted FIRST:
     Cost: 2 ore (with Bradbury)
     Would succeed!
     
Strategy: Use Bradbury bonuses EARLY before opponents disrupt!
```

### Interactions

**Facilities:**
- **Colony Constructor:** -1 ore cost per use (Ref: Ambiguity #73)
- **Colonist Hub:** No effect (doesn't cost ore)
- **Terraforming Station:** No effect (costs ship, not ore)

**Tech Cards:**
- **Data Crystal:** Can borrow Bradbury from opponent
- **Repulsor Field:** Blocks colony but still charges reduced cost (waste!)
- **Booster Pod (discard):** Remove Repulsor before using Colony Constructor

**Field Generators:**
- **Repulsor Field:** BLOCKS placement but doesn't prevent cost reduction

**Edge Cases:**
- Cost reduction applies per use (Ref: Ambiguity #73)
- Control can change mid-turn
- Cost charged even if Repulsor blocks placement
- Cannot reduce cost below 0 ore

---

## 4.4 Burroughs Desert

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  BURROUGHS DESERT
               Relic Ship Acquisition
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Relic Ship Rules

**Acquisition (Ref: Ambiguity #74, #75)**

Player can purchase Relic Ship when controlling Burroughs:

```typescript
function purchaseRelicShip(player: Player): void {
  // Check control (Ref: Ambiguity #74)
  if (!player.controlsTerritory(TerritoryType.BURROUGHS_DESERT)) {
    throw new Error("Must control Burroughs Desert to purchase Relic Ship");
  }
  
  // Check availability
  if (relicShip.owner !== null) {
    throw new Error("Relic Ship already owned by another player");
  }
  
  // Check cost (Ref: Ambiguity #75)
  const cost = 3; // ore
  if (player.ore < cost) {
    throw new Error(`Not enough ore! Need ${cost}, have ${player.ore}`);
  }
  
  // Purchase
  player.ore -= cost;
  relicShip.owner = player;
  player.hasRelicShip = true;
  
  // Remove from Burroughs Desert
  relicShip.location = PlayerHand;
  
  // Relic Ship treated as 4th ship (Ref: Ambiguity #76)
  // Rolled at ROLL phase like other ships
}
```

**Losing Relic Ship (Ref: Ambiguity #77, #78)**

```typescript
function checkRelicShipOwnership(player: Player): void {
  // Happens during GATHER phase
  
  if (player.hasRelicShip && 
      !player.controlsTerritory(TerritoryType.BURROUGHS_DESERT)) {
    
    // Player lost control → Returns Relic Ship
    relicShip.owner = null;
    relicShip.location = Territory.BURROUGHS_DESERT;
    player.hasRelicShip = false;
    
    // Relic Ship available for purchase again
  }
}

// GATHER phase pseudocode (Ref: Ambiguity #78)
function gatherPhase(player: Player): void {
  // 1. Return ships from Maintenance Bay
  returnShipsFromMaintenanceBay(player);
  
  // 2. Return ships from Terraforming Station
  returnShipsFromTerraformingStation(player);
  
  // 3. Check Burroughs control for Relic Ship (Ref: Ambiguity #78)
  checkRelicShipOwnership(player);
  
  // 4. Continue to ROLL phase
}
```

### Timing

- **Purchase When:** Any time during ACTION phase while controlling Burroughs
- **Cost:** 3 ore (Ref: Ambiguity #75)
- **Lose When:** At GATHER phase if no longer control Burroughs (Ref: Ambiguity #78)

### Special Rules

**Control Requirement (Ref: Ambiguity #74)**

Must control Burroughs to purchase:

```
Burroughs colonies: [Player A, Player A, Player B]
  → Player A: 2 colonies (strict majority)
  → Player A can purchase Relic Ship
  → Player B cannot (doesn't control)

Burroughs colonies: [Player A, Player B, empty]
  → 1-1 tie → NO CONTROL
  → No one can purchase Relic Ship
```

**Purchase Cost (Ref: Ambiguity #75)**

Costs 3 ore (not free):

```
Player controls Burroughs Desert
Player has 2 ore, 5 fuel

Action: Try to purchase Relic Ship
  Need: 3 ore
  Have: 2 ore
  Short: 1 ore
  
Result: CANNOT purchase yet
```

**Fourth Ship Status (Ref: Ambiguity #76)**

Relic Ship acts as a 4th ship:

```typescript
// During ROLL phase
function rollPhase(player: Player): void {
  const ships = player.getAllShips(); // Includes Relic Ship!
  
  ships.forEach(ship => {
    ship.value = rollDie();
  });
  
  // Example: Player has 3 standard ships + Relic
  // Rolls: [2, 4, 5, 6] (Relic rolled 6)
  // Can dock Relic like any other ship
}
```

**Ownership Check Timing (Ref: Ambiguity #78)**

Checked at GATHER phase START:

```
Turn sequence:

CLEANUP Phase (previous turn):
  Player loses Burroughs control (opponent placed colony)
  Player still HAS Relic Ship (not lost yet!)

GATHER Phase (current turn):
  1. Return ships from Maintenance Bay
  2. Return ships from Terraforming
  3. → CHECK BURROUGHS CONTROL ← (Ref: Ambiguity #78)
     Player doesn't control → Lose Relic Ship
     Relic Ship → Burroughs Desert
  4. Continue to ROLL

Result:
  Relic Ship lost at start of turn
  Cannot roll Relic Ship this turn
```

**Re-Purchase After Forfeiture (Ref: Ambiguity #65)**

If forfeited at Terraforming Station, can re-purchase:

```
Turn 1:
  Player owns Relic Ship
  Uses Terraforming Station, forfeits Relic
  Relic → Burroughs Desert (available)

Turn 2:
  Player controls Burroughs (still)
  Can purchase Relic Ship again for 3 ore
  Relic back in player's hand
```

### Examples

**Example 1: Basic Purchase**

```
Setup:
  Player controls Burroughs (2 colonies vs opponent 1)
  Player has 5 ore, 3 fuel
  Relic Ship on Burroughs (available)

Action:
  Purchase Relic Ship

Effect:
  Pay: 3 ore
  Gain: Relic Ship (counts as 4th ship)
  
Result:
  Ore: 5 - 3 = 2
  Fleet: 3 standard + 1 Relic = 4 ships
  Next ROLL: Roll 4 dice!
```

**Example 2: Losing Control → Losing Relic**

```
Setup:
  Player owns Relic Ship
  Player controls Burroughs (2 colonies vs opponent 1)
  Opponent's turn: Places colony on Burroughs
  Burroughs: [O, O, P, P] → 2-2 TIE → NO CONTROL

CLEANUP Phase (end of opponent's turn):
  Player no longer controls Burroughs
  Relic Ship NOT lost yet (checked at GATHER)

Player's GATHER Phase (start of next turn):
  1. Return ships from facilities
  2. Check Burroughs control:
     Player doesn't control → Lose Relic Ship
     Relic → Burroughs Desert
  3. Continue to ROLL
  
Result:
  Player rolls only 3 ships this turn
  Lost Relic Ship permanently (until re-purchased)
```

**Example 3: Re-Gaining Control**

```
Turn 1:
  Player loses Burroughs control
  GATHER: Relic Ship → Burroughs Desert

Turn 2:
  Player's ACTION phase:
    Use Colony Constructor on Burroughs
    Burroughs: [P, P, O] → Player controls!
    
  Later in ACTION phase:
    Purchase Relic Ship again (3 ore)
    Relic back in hand
    
  NEXT ROLL phase:
    Roll 4 ships again!
```

**Example 4: Strategic Forfeit and Re-Purchase**

```
Setup:
  Player owns Relic Ship
  Player controls Burroughs (3 colonies, opponent 0)
  Player needs last colony to win

Action:
  Use Terraforming Station:
    Dock ships [5, 5, 5, Relic(6)]
    Total: 21 ✓
    Choose to forfeit: Relic Ship
    Place colony (WINNING colony!)
    
Effect:
  Relic → Burroughs Desert (not removed!)
  Player wins game immediately
  
Analysis:
  Relic Ship preserved (not permanently lost)
  If game continued, could re-purchase
  Smart choice: forfeit Relic instead of standard ship
```

### Interactions

**Facilities:**
- **Terraforming Station:** Can forfeit Relic, returns to Burroughs (Ref: Ambiguity #65, #66)
- All facilities: Relic Ship docks like standard ship

**Tech Cards:**
- **Booster Pod:** Works on Relic Ship
- **Stasis Beam:** Works on Relic Ship
- **Plasma Cannon:** Can target Relic Ship
- **Temporal Warper:** Can re-roll Relic Ship

**Territories:**
- **Data Crystal:** Can borrow Burroughs control to purchase Relic

**Field Generators:**
- None affect Relic Ship specifically

**Edge Cases:**
- Must control Burroughs to purchase (Ref: Ambiguity #74)
- Costs 3 ore (Ref: Ambiguity #75)
- Acts as 4th ship (Ref: Ambiguity #76)
- Ownership checked at GATHER start (Ref: Ambiguity #78)
- Returns to Burroughs if forfeited (Ref: Ambiguity #65, #66)
- Cannot be permanently removed from game

---

**End of Section 4 Part 1**

*Continues in Section 4: Territories & Bonuses (Part 2).*

---

## Cross-References

- **Ambiguities Resolved**: #67-78 (Territory control, Asimov, Bradbury, Burroughs, Relic Ship)
  
- **Related Sections**:
  - Section 2 (Turn Structure): GATHER phase timing for Relic Ship check
  - Section 3 (Facilities): Colonist Hub, Colony Constructor, Terraforming Station interactions
  - Section 5 (Field Generators): Repulsor Field blocking colonies
  - Section 6 (Alien Tech Cards): Data Crystal, Alien Monument, Booster Pod
  - Section 7 (Advanced Rules): Victory conditions, Relic Ship comprehensive rules
