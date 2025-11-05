# Section 3: Orbital Facilities (Part 2)

**Pages 19-24 of Complete Rules Reference**

---

## 3.6 Maintenance Bay

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    MAINTENANCE BAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Docking Requirements

- **Any ship** (any value)
- **Unlimited dock spaces**
- Multiple ships can dock per turn

**Simplest Facility (Ref: Ambiguity #44):**

```typescript
function canDockAtMaintenanceBay(ship: Ship): boolean {
  return true; // Always valid, no restrictions
}
```

### Effect

**Hold ships until next GATHER phase**

```typescript
function maintenanceBayEffect(player: Player, ship: Ship): void {
  // Ship persists at Maintenance Bay
  ship.location = Facility.MAINTENANCE_BAY;
  ship.state = ShipState.COMMITTED;
  
  // No immediate resource gain or other effect
}
```

### Timing

- **When Effect Resolves:** Immediately when ship docks (no real effect)
- **Ship Destination:** Ships **persist** at Maintenance Bay until next GATHER phase
- **Return:** Ships automatically return to hand during next GATHER phase

### Special Rules

**Strategic Ship Storage**

Maintenance Bay allows building "ship economy" across turns:

```
Turn 1: Dock ship(6) at Maintenance Bay
  Ship(6) stays at facility
  
Turn 2 GATHER: Ship(6) returns to hand
  Now have ship(6) + normal ships to roll
  Roll all ships together
```

**Unlimited Capacity (Ref: Ambiguity #44)**

No limit on ships at Maintenance Bay:

```typescript
// Player can dock all ships at Maintenance Bay
function maintenanceBayCapacity(): number {
  return Infinity; // Truly unlimited
}

// Example: Player docks ships [1, 2, 3, 4, 5, 6] all at once
// All ships persist until next GATHER
// Next turn: All 6 return to hand, roll them all
```

**No Resource Gain**

Unlike other facilities, Maintenance Bay grants no immediate benefit:

```
Dock ship at Solar Converter → Gain fuel
Dock ship at Lunar Mine → Gain ore
Dock ship at Maintenance Bay → Nothing (but ship saved for next turn)
```

**Plasma Cannon Interaction (Ref: Ambiguity #129)**

Ships removed by Plasma Cannon go to **target player's** Maintenance Bay:

```
Opponent has ship(6) at Solar Converter
Use Plasma Cannon (1 fuel) targeting that ship

Result:
  Ship(6) removed from Solar Converter
  Ship(6) → Opponent's Maintenance Bay (NOT yours)
  
Opponent's next turn GATHER:
  Ship(6) returns to opponent's hand
```

### State Diagram

```
Ship (any value) at hand
      ↓ Dock at Maintenance Bay
  [DOCKED]
      ↓ Requirement met (instant)
No immediate effect
      ↓
Ship stays at Maintenance Bay [COMMITTED]
      ↓ PERSISTS until next GATHER
Ship remains across opponent turns
      ↓ GATHER phase (your next turn)
Ship returns to hand automatically
      ↓ ROLL phase
Ship rolled normally with others
```

### Examples

**Example 1: Basic Ship Storage**

```
Setup:
  Player ships: [1, 2, 3]

Turn 1:
  Action: Dock ship(3) at Maintenance Bay
  Result: Ship(3) stays at Bay
  Other actions: Dock ships [1, 2] elsewhere
  
Turn 2 GATHER:
  Ship(3) returns to hand from Bay
  
Turn 2 ROLL:
  Roll remaining ships + ship(3)
  Typically roll 3 ships total (2 returned + 3 from Bay)
```

**Example 2: Building Fleet Size**

```
Setup:
  Player has 3 standard ships

Turn 1:
  Dock all 3 ships [2, 4, 6] at Maintenance Bay
  
Turn 2 GATHER:
  All 3 ships return to hand
  
Turn 2 ROLL:
  Roll all 3 ships
  
Turn 2 ACTION:
  Build new ship at Shipyard
  Now have 4 ships total!
  Dock all 4 at Maintenance Bay
  
Turn 3 GATHER:
  All 4 ships return to hand
  
Turn 3 ROLL:
  Roll 4 ships simultaneously!
  More ships = more options
```

**Example 3: Saving High-Value Ships**

```
Setup:
  Player rolled [6] (excellent value)
  No good facilities available this turn (all blocked)

Strategy:
  Dock ship(6) at Maintenance Bay
  Save the 6 for next turn when facilities might be available
  
Turn 2:
  Ship(6) returns to hand
  Re-roll it (or use tech cards to modify if needed)
  
Alternative Strategy:
  Keep ship(6) value by NOT returning it
  Wait... ships from Maintenance Bay are returned AND re-rolled
  So the 6 value is lost on re-roll
  
Correction:
  Maintenance Bay is for strategic timing, not value preservation
  Use Lunar Mine or other persisting facilities for value preservation
```

**Example 4: Plasma Cannon Defensive Use**

```
Setup:
  Opponent threatens your ship(6) at Lunar Mine
  Opponent has Plasma Cannon, 1 fuel

Opponent's Turn:
  Use Plasma Cannon on your ship(6)
  Ship(6) → Your Maintenance Bay (not removed from game)
  
Your Next Turn GATHER:
  Ship(6) returns to your hand
  Re-roll and use normally
  
Result:
  Plasma Cannon didn't eliminate ship permanently
  Just delayed it one turn (sent to Maintenance Bay)
```

### Interactions

**Territory Bonuses:**
- None affect Maintenance Bay directly

**Tech Cards:**
- **Plasma Cannon:** Ships removed go to target's Maintenance Bay (Ref: Ambiguity #129)
- **Orbital Teleporter:** Can move ships FROM Maintenance Bay to other facilities
  ```
  Turn 1: Dock ship(6) at Maintenance Bay
  Turn 2 ACTION: Use Orbital Teleporter (before GATHER)
    Move ship(6) from Maintenance Bay to Solar Converter
    Gain fuel from ship(6)
    Ship never returned to hand
  ```

**Field Generators:**
- None affect Maintenance Bay

**Edge Cases:**
- Unlimited capacity confirmed (Ref: Ambiguity #44)
- Ships return during GATHER automatically (Ref: Ambiguity #44)
- Plasma Cannon target goes to target's Bay, not attacker's (Ref: Ambiguity #129)

---

## 3.7 Orbital Market

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    ORBITAL MARKET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Docking Requirements

- **Pair of ships** with **same value**
- **2 dock spaces** (limited capacity)
- Both ships must dock to activate

**Clarification (Ref: Ambiguity #45):**

"Pair" means exactly 2 ships with matching values.

```typescript
function canActivateOrbitalMarket(ships: Ship[]): boolean {
  return ships.length === 2 && ships[0].value === ships[1].value;
}
```

### Effect

**Trade fuel for ore at ratio determined by ship value**

```typescript
function orbitalMarketEffect(player: Player, shipValue: number): void {
  // 1. Determine base trade ratio
  let ratio = shipValue; // Base: 1 ore per {shipValue} fuel
  
  // 2. Apply Heinlein Plains bonus (Ref: Ambiguity #76)
  const controlsHeinlein = player.controlsTerritory(TerritoryType.HEINLEIN_PLAINS);
  if (controlsHeinlein) {
    ratio = 1; // 1:1 trade regardless of ship value
  }
  
  // 3. Calculate maximum ore player can afford
  const maxOre = Math.floor(player.fuel / ratio);
  
  // 4. Prompt player to choose ore amount
  const oreToGain = promptTradeAmount(player, maxOre);
  
  // 5. Execute trade
  const fuelCost = oreToGain * ratio;
  player.fuel -= fuelCost;
  player.ore += oreToGain;
}
```

### Timing

- **When Effect Resolves:** Immediately when both ships docked
- **Ship Destination:** Both ships move to Maintenance Bay
- **Trade Amount:** Player chooses how much to trade

### Special Rules

**Trade Ratio (Ref: Ambiguity #46)**

Ratio = Ship value : 1 ore

| Ship Value | Fuel Cost per Ore | Example |
|------------|-------------------|---------|
| 1 | 1 fuel | 5 fuel → 5 ore |
| 2 | 2 fuel | 6 fuel → 3 ore |
| 3 | 3 fuel | 9 fuel → 3 ore |
| 4 | 4 fuel | 8 fuel → 2 ore |
| 5 | 5 fuel | 10 fuel → 2 ore |
| 6 | 6 fuel | 12 fuel → 2 ore |

**Lower ship values are MORE efficient for trading!**

**Heinlein Plains Bonus (Ref: Ambiguity #76)**

If player controls Heinlein Plains:

```typescript
// Normal trade (ship value 4):
// 4 fuel → 1 ore (expensive)

// With Heinlein Plains (any ship value):
// 1 fuel → 1 ore (always 1:1)

function calculateTradeRatio(player: Player, shipValue: number): number {
  const controlsHeinlein = player.controlsTerritory(TerritoryType.HEINLEIN_PLAINS);
  return controlsHeinlein ? 1 : shipValue;
}
```

**Partial Trade Allowed (Ref: Ambiguity #47)**

Player can trade less than maximum affordable:

```
Player has 10 fuel
Ship pair value: 3 (costs 3 fuel per ore)
Maximum affordable: 10 / 3 = 3 ore (9 fuel)

Player choices:
  A) Trade 9 fuel → 3 ore (maximum)
  B) Trade 6 fuel → 2 ore (partial)
  C) Trade 3 fuel → 1 ore (minimum)
  D) Trade 0 fuel → 0 ore (decline trade)
  
Leftover fuel remains in player's supply
```

**Must Have Fuel (Ref: Ambiguity #48)**

If player has 0 fuel when effect resolves:

```
Player has 0 fuel
Dock pair [2, 2] at Orbital Market

Result:
  Cannot afford any trade (0 / 2 = 0 ore)
  Effect fizzles, no resources exchanged
  Ships still go to Maintenance Bay
  
Lesson: Check fuel before committing ships!
```

### State Diagram

```
Ships [pair, same value] at hand
      ↓ Dock at Orbital Market
Ship 1 docks → [DOCKED] (waiting)
Ship 2 docks → [DOCKED] (waiting)
      ↓ Requirement met (pair complete)
Calculate trade ratio
Prompt player: How much ore?
      ↓
Trade fuel for ore
      ↓
Both ships → Maintenance Bay [COMMITTED]
      ↓ GATHER phase (next turn)
Ships return to hand
```

### Examples

**Example 1: Basic Trade**

```
Setup:
  Player has 12 fuel, 0 ore
  Player does NOT control Heinlein Plains
  Player ships: [3, 3]

Action:
  Dock ships [3, 3] at Orbital Market

Effect:
  Ratio: 3 fuel per 1 ore
  Maximum affordable: 12 / 3 = 4 ore
  Player chooses: Trade 9 fuel for 3 ore
  
Result:
  Fuel: 12 - 9 = 3 remaining
  Ore: 0 + 3 = 3 gained
  Ships [3, 3] → Maintenance Bay
```

**Example 2: Heinlein Plains Optimization**

```
Setup:
  Player has 10 fuel, 0 ore
  Player controls Heinlein Plains
  Player ships: [6, 6]

Action:
  Dock ships [6, 6] at Orbital Market

Effect:
  Base ratio: 6 fuel per ore (expensive!)
  Heinlein bonus: 1 fuel per ore (1:1 trade!)
  Maximum affordable: 10 / 1 = 10 ore
  Player chooses: Trade 10 fuel for 10 ore
  
Result:
  Fuel: 10 - 10 = 0 remaining
  Ore: 0 + 10 = 10 gained
  Ships [6, 6] → Maintenance Bay
  
Analysis:
  WITHOUT Heinlein: 10 fuel → 1 ore (10/6 = 1.66, round down)
  WITH Heinlein: 10 fuel → 10 ore
  Bonus grants 9 extra ore!
```

**Example 3: Low-Value Ship Efficiency**

```
Scenario A: High-value ships, no Heinlein
  Player has 12 fuel
  Ships: [6, 6]
  Ratio: 6 fuel per ore
  Result: 12 fuel → 2 ore

Scenario B: Low-value ships, no Heinlein
  Player has 12 fuel
  Ships: [1, 1]
  Ratio: 1 fuel per ore
  Result: 12 fuel → 12 ore
  
Analysis:
  Same fuel (12), different ships:
  - High ships (6,6): 2 ore
  - Low ships (1,1): 12 ore
  
  Low-value ships are MUCH more efficient at Orbital Market!
  Strategy: Use Stasis Beam to reduce ship values before trading
```

**Example 4: Partial Trade Strategy**

```
Setup:
  Player has 8 fuel, 5 ore
  Resource limit: 8 total (fuel + ore)
  Player ships: [2, 2]

Action:
  Dock ships [2, 2] at Orbital Market

Effect:
  Ratio: 2 fuel per ore
  Maximum affordable: 8 / 2 = 4 ore
  
Analysis:
  If trade 8 fuel → 4 ore:
    Total resources: 0 fuel + (5+4) ore = 9 total
    Exceeds limit! Must discard 1 at CLEANUP
  
  If trade 4 fuel → 2 ore:
    Total resources: 4 fuel + (5+2) ore = 11 total
    Still exceeds! Must discard 3 at CLEANUP
  
  If trade 0 fuel → 0 ore:
    Total resources: 8 fuel + 5 ore = 13 total
    Exceeds even without trading!
    
Strategy:
  Player should discard ore before trading
  Or accept resource waste at CLEANUP
```

### Interactions

**Territory Bonuses:**
- **Heinlein Plains:** 1:1 trade ratio (overrides ship value) (Ref: Ambiguity #76)
- **Data Crystal:** Can borrow Heinlein bonus from opponent

**Tech Cards:**
- **Stasis Beam:** Reduce ship value to 1 for maximum efficiency
  ```
  Ships: [6, 6]
  Use Stasis Beam twice: [6, 6] → [5, 5] → [4, 4]... NOT EFFICIENT
  
  Better: Start with low ships or use on different high ships
  Roll [1, 1]: Perfect for Orbital Market (1:1 ratio naturally)
  ```
- **Booster Pod:** Increase ship value (WORSE for trading, avoid)
- **Plasma Cannon:** Remove blocking ships if facility full

**Field Generators:**
- None affect Orbital Market directly

**Edge Cases:**
- Zero fuel: Cannot trade, effect fizzles (Ref: Ambiguity #48)
- Partial trades allowed (Ref: Ambiguity #47)
- Heinlein overrides ship value ratio (Ref: Ambiguity #76)
- Resource limit exceeded: Player discards at CLEANUP (Ref: Ambiguity #30)

---

## 3.8 Raiders' Outpost

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   RAIDERS' OUTPOST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Docking Requirements

- **3 sequential ships** (consecutive values)
- **3 dock spaces** (limited capacity)
- All 3 ships must be docked to activate

**Sequential Definition (Ref: Ambiguity #49):**

```typescript
function isSequential(ships: Ship[]): boolean {
  if (ships.length !== 3) return false;
  
  const values = ships.map(s => s.value).sort((a, b) => a - b);
  
  // Check if consecutive: [n, n+1, n+2]
  return values[1] === values[0] + 1 && values[2] === values[1] + 1;
}

// Valid sequences:
// [1, 2, 3] ✓
// [2, 3, 4] ✓
// [3, 4, 5] ✓
// [4, 5, 6] ✓

// Invalid:
// [1, 2, 4] ✗ (gap)
// [1, 3, 5] ✗ (skipped values)
// [2, 2, 3] ✗ (duplicate)
```

### Effect

**Raid opponent: Steal resources OR tech card**

```typescript
function raidersOutpostEffect(player: Player, target: Player, raidType: RaidType): void {
  if (raidType === RaidType.RESOURCES) {
    // Resource Raid (Ref: Ambiguity #50)
    const totalResources = target.fuel + target.ore;
    const stolenAmount = Math.floor(totalResources / 2); // Round down
    
    // Player chooses which resources to steal
    const stolen = promptResourceSteal(player, target, stolenAmount);
    
    target.fuel -= stolen.fuel;
    target.ore -= stolen.ore;
    player.fuel += stolen.fuel;
    player.ore += stolen.ore;
    
  } else if (raidType === RaidType.TECH_CARD) {
    // Tech Card Raid (Ref: Ambiguity #51)
    
    // Check for Holographic Decoy (Ref: Ambiguity #123)
    if (target.hasTechCard(TechCardType.HOLOGRAPHIC_DECOY)) {
      // Forced to steal Holographic Decoy
      const decoy = target.getTechCard(TechCardType.HOLOGRAPHIC_DECOY);
      target.techCards.remove(decoy);
      player.techCards.push(decoy);
      return;
    }
    
    // No Decoy: Player chooses card from target's hand
    const targetCards = target.techCards;
    if (targetCards.length === 0) {
      // Target has no cards, raid fails
      return;
    }
    
    const stolenCard = promptCardChoice(player, targetCards);
    target.techCards.remove(stolenCard);
    player.techCards.push(stolenCard);
  }
}
```

### Timing

- **When Effect Resolves:** Immediately when 3rd sequential ship docks
- **Ship Destination:** All 3 ships move to Maintenance Bay
- **Raid Choice:** Player chooses target and raid type

### Special Rules

**Resource Raid Calculation (Ref: Ambiguity #50)**

Stolen amount = ⌊(target's fuel + ore) / 2⌋

```
Target has 7 fuel, 4 ore (total 11)
Stolen: ⌊11 / 2⌋ = ⌊5.5⌋ = 5 resources

Raider chooses which resources to steal:
  Option A: 5 fuel, 0 ore
  Option B: 3 fuel, 2 ore
  Option C: 0 fuel, 5 ore (if target has 5 ore)
  etc.
```

**Raider's Choice (Ref: Ambiguity #52)**

Raider selects:
1. Which opponent to raid (in multi-player games)
2. Raid type (resources OR tech card)
3. Which specific resources/card to steal

**Holographic Decoy Protection (Ref: Ambiguity #123)**

If target owns Holographic Decoy:

```
Resource Raid: Decoy has NO effect (resources stolen normally)
Tech Card Raid: Decoy is FORCED target (must steal Decoy)

Example:
  Target has: Decoy, Booster Pod, Plasma Cannon
  Raider chooses tech card raid
  Raider MUST steal Decoy (no choice)
  Other cards protected by Decoy
```

**Equal Sequences (Ref: Ambiguity #53)**

Multiple players may have sequential ships ready:

```
Player A: Ready to dock [2, 3, 4]
Player B: Ready to dock [3, 4, 5]

Resolution:
  First come, first served (turn order)
  Player A docks first (if their turn)
  Player B docks later (on their turn)
  
No special "bidding" or conflict resolution
```

**Docking Order Matters (Ref: Ambiguity #54)**

Ships can dock in any order:

```
Sequential ships: [2, 3, 4]

Valid docking orders:
  A) Dock 2, then 3, then 4
  B) Dock 4, then 2, then 3
  C) Dock 3, then 4, then 2
  
All result in same effect (once all 3 docked)
```

### State Diagram

```
Ships [3 sequential] at hand
      ↓ Dock at Raiders' Outpost
Ship 1 docks → [DOCKED] (waiting)
Ship 2 docks → [DOCKED] (waiting)
Ship 3 docks → [DOCKED] (waiting)
      ↓ Requirement met (sequence complete)
Choose opponent to raid
Choose raid type (resources OR tech card)
      ↓ If resources:
Calculate ⌊total / 2⌋
Choose which resources to steal
      ↓ If tech card:
Check Holographic Decoy
Choose card from target's hand
      ↓
Execute raid
      ↓
All 3 ships → Maintenance Bay [COMMITTED]
      ↓ GATHER phase (next turn)
Ships return to hand
```

### Examples

**Example 1: Resource Raid**

```
Setup:
  Player ships: [2, 3, 4]
  Opponent has 5 fuel, 6 ore (total 11)

Action:
  Dock ships [2, 3, 4] at Raiders' Outpost
  Choose: Opponent
  Choose: Resource raid

Effect:
  Total: 5 + 6 = 11
  Stolen: ⌊11 / 2⌋ = 5 resources
  Player chooses: 3 fuel, 2 ore
  
Result:
  Opponent: 5 - 3 = 2 fuel, 6 - 2 = 4 ore
  Player: Gain 3 fuel, 2 ore
  Ships [2, 3, 4] → Maintenance Bay
```

**Example 2: Tech Card Raid**

```
Setup:
  Player ships: [1, 2, 3]
  Opponent has: Booster Pod, Data Crystal, Plasma Cannon

Action:
  Dock ships [1, 2, 3] at Raiders' Outpost
  Choose: Tech card raid
  Choose: Plasma Cannon

Effect:
  Plasma Cannon moves from opponent to player
  
Result:
  Opponent loses Plasma Cannon
  Player gains Plasma Cannon
  Ships [1, 2, 3] → Maintenance Bay
```

**Example 3: Holographic Decoy Blocking**

```
Setup:
  Player ships: [3, 4, 5]
  Opponent has: Holographic Decoy, Booster Pod, Temporal Warper

Action:
  Dock ships [3, 4, 5] at Raiders' Outpost
  Choose: Tech card raid

Effect:
  Check opponent's cards: Has Holographic Decoy!
  FORCED to steal Decoy (no choice)
  
Result:
  Player gains Holographic Decoy
  Opponent keeps Booster Pod and Temporal Warper
  Ships [3, 4, 5] → Maintenance Bay
  
Analysis:
  Decoy successfully protected other cards
  But player now has Decoy for defense
```

**Example 4: Odd Resources Rounding**

```
Setup:
  Player ships: [4, 5, 6]
  Opponent has 3 fuel, 2 ore (total 5)

Action:
  Dock ships [4, 5, 6] at Raiders' Outpost
  Choose: Resource raid

Effect:
  Total: 3 + 2 = 5
  Stolen: ⌊5 / 2⌋ = ⌊2.5⌋ = 2 resources
  Player chooses: 2 fuel
  
Result:
  Opponent: 3 - 2 = 1 fuel, 2 ore remains
  Player: Gain 2 fuel
  
Note:
  Opponent keeps 3 resources (1 fuel + 2 ore)
  Raider gets 2, victim keeps 3 (odd split favors victim)
```

### Interactions

**Territory Bonuses:**
- None affect Raiders' Outpost directly

**Tech Cards:**
- **Holographic Decoy:** Forces tech raid to steal Decoy (Ref: Ambiguity #123)
- **Booster Pod / Stasis Beam / Gravity Manipulator:** Can create sequential values
  ```
  Roll: [2, 5, 6]
  Use Stasis Beam on 5 → 4
  Use Stasis Beam on 6 → 5
  Result: [2, 4, 5] → NOT SEQUENTIAL (gap at 3)
  
  Better: Roll [3, 5, 6]
  Use Stasis Beam on 5 → 4
  Result: [3, 4, 6] → Still not sequential
  
  Actually create: [2, 3, 4]
  Roll [2, 3, 5]
  Use Stasis Beam on 5 → 4
  Result: [2, 3, 4] ✓ Sequential!
  ```
- **Plasma Cannon:** Remove blocking ships if facility full

**Field Generators:**
- None affect Raiders' Outpost

**Edge Cases:**
- Holographic Decoy forces tech raid target (Ref: Ambiguity #123)
- Resource steal amount rounds down (Ref: Ambiguity #50)
- Raider chooses which resources to steal (Ref: Ambiguity #52)
- Docking order doesn't matter (Ref: Ambiguity #54)
- Equal sequences: Turn order determines priority (Ref: Ambiguity #53)

---

## 3.9 Shipyard

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                       SHIPYARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Docking Requirements

- **Pair of ships** with **same value**
- **2 dock spaces** (limited capacity)
- Both ships must dock to activate

### Effect

**Build new ship (cost varies by current fleet size)**

```typescript
function shipyardEffect(player: Player): void {
  // 1. Count current fleet size
  const fleetSize = player.ships.length;
  
  // 2. Calculate base cost (Ref: Ambiguity #55)
  let fuelCost: number;
  let oreCost: number;
  
  if (fleetSize === 3) {
    // Building 4th ship
    fuelCost = 4;
    oreCost = 2;
  } else if (fleetSize === 4) {
    // Building 5th ship
    fuelCost = 5;
    oreCost = 3;
  } else if (fleetSize >= 5) {
    // Building 6th+ ship
    fuelCost = 6;
    oreCost = 4;
  }
  
  // 3. Apply Herbert Valley bonus (Ref: Ambiguity #79)
  const controlsHerbert = player.controlsTerritory(TerritoryType.HERBERT_VALLEY);
  if (controlsHerbert) {
    fuelCost -= 1;
    oreCost -= 1;
  }
  
  // 4. Check if player can afford cost
  if (player.fuel < fuelCost || player.ore < oreCost) {
    // Insufficient resources, build fails
    // Ships still go to Maintenance Bay
    return;
  }
  
  // 5. Pay cost
  player.fuel -= fuelCost;
  player.ore -= oreCost;
  
  // 6. Add new ship to player's fleet
  const newShip = new Ship(player.color);
  player.ships.push(newShip);
}
```

### Timing

- **When Effect Resolves:** Immediately when both ships docked
- **Ship Destination:** Both docked ships move to Maintenance Bay
- **New Ship:** Added to player's stock (available next turn)

### Special Rules

**Cost Table (Ref: Ambiguity #55)**

| Current Fleet | Next Ship | Base Cost | With Herbert Valley |
|---------------|-----------|-----------|---------------------|
| 3 ships | 4th ship | 4 fuel, 2 ore | 3 fuel, 1 ore |
| 4 ships | 5th ship | 5 fuel, 3 ore | 4 fuel, 2 ore |
| 5 ships | 6th ship | 6 fuel, 4 ore | 5 fuel, 3 ore |
| 6+ ships | 7th+ ship | 6 fuel, 4 ore | 5 fuel, 3 ore |

**Fleet Size Calculation (Ref: Ambiguity #56)**

Fleet size = All ships player owns (in hand, at facilities, forfeited to Terraforming)

```typescript
function calculateFleetSize(player: Player): number {
  let count = 0;
  
  // Ships in hand
  count += player.shipsInHand.length;
  
  // Ships at facilities
  count += player.shipsAtFacilities.length;
  
  // Ships forfeited to Terraforming Station (if any)
  count += player.shipsForfeitedToTerraforming;
  
  // Relic Ship (if owned)
  if (player.hasRelicShip) {
    count += 1;
  }
  
  return count;
}
```

**New Ship Availability (Ref: Ambiguity #57)**

```
Turn 1: Build 4th ship at Shipyard
  New ship added to stock (not in hand yet)
  Cannot use new ship this turn
  
Turn 2 GATHER: No effect (new ship wasn't at facility)
Turn 2 ROLL: Roll 3 original ships (new ship not rollable yet)

Turn 2 ACTION: Dock 3 ships at Maintenance Bay

Turn 3 GATHER: 3 ships return from Maintenance Bay
  New ship still in stock
  
Turn 3 ROLL: Roll 3 returned ships
  New ship joins hand somehow? NO!
  
CORRECTION:
  New ship available NEXT TURN after building
  Added to hand automatically at start of turn
  Or rolled with other ships
  
ACTUAL RULE:
  New ship goes to hand immediately (but turn already in progress)
  Effectively available next turn for rolling
```

**Insufficient Resources (Ref: Ambiguity #58)**

If player cannot afford cost:

```
Player has 2 fuel, 1 ore
Fleet size: 3 ships (building 4th)
Cost: 4 fuel, 2 ore

Action: Dock pair [3, 3] at Shipyard

Effect:
  Check resources: 2 < 4 fuel ✗
  Build fails: No ship added
  Resources unchanged: Still have 2 fuel, 1 ore
  Ships [3, 3] → Maintenance Bay anyway
  
Lesson: Verify resources before committing ships!
```

**Herbert Valley Discount (Ref: Ambiguity #79)**

If player controls Herbert Valley:

```
Building 4th ship:
  Base cost: 4 fuel, 2 ore
  Herbert bonus: -1 fuel, -1 ore
  Final cost: 3 fuel, 1 ore
  
Building 5th ship:
  Base cost: 5 fuel, 3 ore
  Herbert bonus: -1 fuel, -1 ore
  Final cost: 4 fuel, 2 ore
```

### State Diagram

```
Ships [pair, same value] at hand
      ↓ Dock at Shipyard
Ship 1 docks → [DOCKED] (waiting)
Ship 2 docks → [DOCKED] (waiting)
      ↓ Requirement met (pair complete)
Count fleet size
Calculate cost (with Herbert Valley if controlled)
Check resources
      ↓ If sufficient:
Pay fuel + ore cost
Add new ship to fleet
      ↓ If insufficient:
Build fails (no ship added)
      ↓
Both ships → Maintenance Bay [COMMITTED]
      ↓ New ship (if built):
Available next turn for rolling
```

### Examples

**Example 1: Building 4th Ship**

```
Setup:
  Player has 3 ships currently
  Player has 5 fuel, 3 ore
  Player does NOT control Herbert Valley
  Player ships: [4, 4]

Action:
  Dock ships [4, 4] at Shipyard

Effect:
  Fleet size: 3 ships
  Building: 4th ship
  Cost: 4 fuel, 2 ore
  Check: 5 ≥ 4 fuel ✓, 3 ≥ 2 ore ✓
  Pay: 5 - 4 = 1 fuel, 3 - 2 = 1 ore
  Add new ship to fleet
  
Result:
  Player now has 4 ships total
  New ship available next turn
  Resources: 1 fuel, 1 ore remaining
  Ships [4, 4] → Maintenance Bay
```

**Example 2: Herbert Valley Discount**

```
Setup:
  Player has 4 ships currently
  Player has 4 fuel, 2 ore (barely enough!)
  Player controls Herbert Valley
  Player ships: [6, 6]

Action:
  Dock ships [6, 6] at Shipyard

Effect:
  Fleet size: 4 ships
  Building: 5th ship
  Base cost: 5 fuel, 3 ore
  Herbert discount: -1 fuel, -1 ore
  Final cost: 4 fuel, 2 ore
  Check: 4 ≥ 4 ✓, 2 ≥ 2 ✓
  Pay: 4 - 4 = 0 fuel, 2 - 2 = 0 ore
  Add new ship
  
Result:
  Player now has 5 ships total
  Resources: 0 fuel, 0 ore remaining
  Ships [6, 6] → Maintenance Bay
  
Analysis:
  WITHOUT Herbert: Would need 5 fuel, 3 ore (not enough!)
  WITH Herbert: Exactly affordable
  Bonus saved the build!
```

**Example 3: Insufficient Resources**

```
Setup:
  Player has 3 ships
  Player has 3 fuel, 1 ore (not enough!)
  Cost to build 4th: 4 fuel, 2 ore
  Player ships: [2, 2]

Action:
  Dock ships [2, 2] at Shipyard

Effect:
  Fleet size: 3 ships
  Cost: 4 fuel, 2 ore
  Check: 3 < 4 fuel ✗
  Build FAILS
  Resources unchanged: 3 fuel, 1 ore
  
Result:
  NO new ship added (wasted ship actions!)
  Player still has 3 ships
  Ships [2, 2] → Maintenance Bay
  
Mistake: Should have gained more resources first
Strategy: Dock at Solar Converter/Lunar Mine before Shipyard
```

**Example 4: Building Multiple Ships**

```
Turn 1:
  Fleet: 3 ships
  Build 4th ship (cost: 4 fuel, 2 ore)
  
Turn 2:
  Fleet: 4 ships (includes new one)
  Build 5th ship (cost: 5 fuel, 3 ore)
  
Turn 3:
  Fleet: 5 ships
  Build 6th ship (cost: 6 fuel, 4 ore)
  
Turn 4:
  Fleet: 6 ships
  Build 7th ship (cost: 6 fuel, 4 ore) ← Cost plateaus
  
Analysis:
  Costs escalate up to 6th ship, then stay constant
  Each new ship = more dice rolled = more options
  But resource costs get expensive quickly!
```

### Interactions

**Territory Bonuses:**
- **Herbert Valley:** -1 fuel, -1 ore per ship built (Ref: Ambiguity #79)
- **Data Crystal:** Can borrow Herbert bonus from opponent

**Tech Cards:**
- **Booster Pod:** Increase ship value to create pair
- **Stasis Beam:** Decrease ship value to create pair
- **Gravity Manipulator:** Transfer points to create matching pair
  ```
  Roll: [3, 5]
  Use Gravity Manipulator: Transfer 1 point
  Result: [4, 4] ✓ Pair created!
  ```
- **Polarity Device:** Flip ship values
  ```
  Roll: [1, 6]
  Flip ship(1) → 6
  Result: [6, 6] ✓ Pair created!
  ```
- **Plasma Cannon:** Remove blocking ships if facility full

**Field Generators:**
- None affect Shipyard

**Edge Cases:**
- Fleet size includes ALL ships (hand, facilities, forfeited) (Ref: Ambiguity #56)
- Insufficient resources: Build fails, ships still go to Bay (Ref: Ambiguity #58)
- New ship available next turn (Ref: Ambiguity #57)
- Cost plateaus at 6th+ ship (Ref: Ambiguity #55)
- Herbert Valley applies to each build (Ref: Ambiguity #79)

---

**End of Section 3, Part 2**

*Continues in Section 3, Part 3: Solar Converter, Terraforming Station.*

---

## Cross-References

- **Ambiguities Resolved**: #44-58 (facilities), #76 (Heinlein Plains), #79 (Herbert Valley), #123 (Holographic Decoy)
  
- **Related Sections**:
  - Section 2 (Turn Structure): ACTION phase, GATHER phase
  - Section 4 (Territories): Territory bonus details
  - Section 6 (Alien Tech Cards): Card interactions
  - Section 8 (Edge Cases): Facility edge cases
