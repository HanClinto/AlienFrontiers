# Section 4: Territories & Control Bonuses (Part 2)

**Pages 34-37 of Complete Rules Reference**

---

## 4.5 Heinlein Plains

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   HEINLEIN PLAINS
        Orbital Market 1:1 Trade (Fuel ↔ Ore)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Bonus Effect

**Orbital Market uses 1:1 fuel↔ore trade ratio (no ships needed)**

```typescript
function orbitalMarketWithHeinlein(player: Player): void {
  // Check Heinlein control (Ref: Ambiguity #79)
  if (player.controlsTerritory(TerritoryType.HEINLEIN_PLAINS)) {
    // 1:1 conversion without ships!
    const choice = player.chooseConversion();
    
    if (choice === "fuel_to_ore") {
      // 1 fuel → 1 ore (perfect efficiency)
      player.fuel -= 1;
      player.ore += 1;
    } else if (choice === "ore_to_fuel") {
      // 1 ore → 1 fuel (perfect efficiency)
      player.ore -= 1;
      player.fuel += 1;
    }
    
    // No ships required! (Ref: Ambiguity #79)
    // Can do ONCE per turn (Ref: Ambiguity #80)
  } else {
    // Normal Orbital Market (requires ships)
    // 1 ship: 1:2 fuel→ore
    // 2 ships: 1:1 fuel→ore
    // 3 ships: 2:1 fuel→ore
  }
}
```

### Timing

- **When Applied:** During ACTION phase, any time
- **Frequency:** ONCE per turn (Ref: Ambiguity #80)
- **Ships Required:** NONE (Ref: Ambiguity #79)

### Special Rules

**No Ships Required (Ref: Ambiguity #79)**

Heinlein bonus grants 1:1 conversion without docking ships:

```
Without Heinlein:
  Need 2 ships at Orbital Market for 1:1 conversion
  Ships used, go to Maintenance Bay

With Heinlein:
  No ships needed!
  Keep ships for other actions
  Still get 1:1 conversion
```

**Once Per Turn Limit (Ref: Ambiguity #80)**

Can only use Heinlein bonus ONCE per turn:

```
Turn sequence:
  1. Use Heinlein bonus: 1 fuel → 1 ore ✓
  2. Try Heinlein bonus again: BLOCKED (once per turn)
  
  Can still use normal Orbital Market with ships:
  3. Dock 3 ships at Orbital Market: 2 fuel → 1 ore ✓
  
Total: 3 fuel → 2 ore in one turn
```

**Direction Choice**

Player chooses conversion direction:

```typescript
// Each use, choose direction
if (player.controlsTerritory(TerritoryType.HEINLEIN_PLAINS)) {
  // Option A: 1 fuel → 1 ore
  // Option B: 1 ore → 1 fuel
  
  // Cannot split (e.g., 0.5 fuel → 0.5 ore)
  // Must choose one direction, full resource
}
```

**Stacks with Normal Orbital Market**

Can use both Heinlein bonus AND ship-based trades:

```
Example: Player controls Heinlein Plains
  Player ships: [2, 2, 4]
  Player resources: 5 fuel, 2 ore

Action sequence:
  1. Use Heinlein bonus (no ships):
     Trade 1 fuel → 1 ore
     Resources: 4 fuel, 3 ore
  
  2. Dock ships [2, 2] at Orbital Market:
     2 ships = 1:1 ratio
     Trade 1 fuel → 1 ore
     Resources: 3 fuel, 4 ore
     Ships [2, 2] → Maintenance Bay
  
  3. Use Heinlein again: BLOCKED (once per turn)
  
Total: 2 fuel → 2 ore conversion
Without Heinlein: Would need 4 ships for same result!
```

### Examples

**Example 1: Basic Heinlein Conversion**

```
Setup:
  Player controls Heinlein Plains
  Player has 3 fuel, 1 ore
  Player ships: [4, 5, 6] (available for other actions)

Action:
  Use Heinlein bonus: 1 fuel → 1 ore

Effect:
  Fuel: 3 - 1 = 2
  Ore: 1 + 1 = 2
  Ships: Still available (not used!)
  
Result:
  Converted efficiently without spending ships
  Ships free for Lunar Mine, Solar Converter, etc.
```

**Example 2: Reverse Direction**

```
Setup:
  Player controls Heinlein Plains
  Player has 1 fuel, 5 ore
  Player needs fuel for tech cards

Action:
  Use Heinlein bonus: 1 ore → 1 fuel

Effect:
  Ore: 5 - 1 = 4
  Fuel: 1 + 1 = 2
  
Result:
  Gained fuel without ship cost
  Can activate tech card fuel powers now
```

**Example 3: Combined with Normal Orbital Market**

```
Setup:
  Player controls Heinlein Plains
  Player has 7 fuel, 1 ore
  Player ships: [5, 5, 5]
  Player needs 4 ore for multiple Colony Constructors

Action:
  1. Heinlein bonus: 1 fuel → 1 ore
     Resources: 6 fuel, 2 ore
  
  2. Dock [5] at Orbital Market:
     1 ship = 1:2 ratio (1 fuel → 0.5 ore, round up to 1)
     Actually: 2 fuel → 1 ore (see Section 3.7)
     Resources: 4 fuel, 3 ore
     Ship [5] → Maintenance Bay
  
  3. Dock [5, 5] at Orbital Market:
     2 ships = 1:1 ratio
     1 fuel → 1 ore
     Resources: 3 fuel, 4 ore
     Ships [5, 5] → Maintenance Bay
  
Total: 4 fuel → 3 ore (+ Heinlein bonus)
Net: 4 ore gained for 4 fuel spent
```

**Example 4: Losing Control During Turn**

```
Setup:
  Player controls Heinlein (2 colonies vs opponent 1)
  Player has 4 fuel, 2 ore
  Opponent ships: [6, 6]

Turn sequence:
  1. Player uses Heinlein bonus FIRST:
     1 fuel → 1 ore
     Resources: 3 fuel, 3 ore ✓
  
  2. Opponent uses Colony Constructor:
     Places colony on Heinlein
     Heinlein: [O, O, P, P] → TIE → NO CONTROL
  
  3. Player tries Heinlein bonus again:
     BLOCKED (once per turn already used)
  
  If player had NOT used Heinlein bonus first:
     Would lose access when opponent placed colony
     Would get ZERO uses of bonus!
     
Strategy: Use Heinlein bonus EARLY before losing control!
```

### Interactions

**Facilities:**
- **Orbital Market:** Heinlein bonus separate from ship-based trades (Ref: Ambiguity #79, #80)
- Can use both in same turn

**Tech Cards:**
- **Data Crystal:** Can borrow Heinlein from opponent (1:1 conversion)
- **Resource Cache:** Heinlein helps reach odd totals safely

**Territories:**
- Heinlein combines with normal Orbital Market ratios

**Edge Cases:**
- No ships required (Ref: Ambiguity #79)
- Once per turn limit (Ref: Ambiguity #80)
- Can choose direction each use
- Stacks with ship-based Orbital Market

---

## 4.6 Lem Badlands

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    LEM BADLANDS
          +1 Fuel per Ship at Solar Converter
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Bonus Effect

**+1 fuel per ship when using Solar Converter**

```typescript
function solarConverterWithLem(player: Player, ship: Ship): void {
  // Base fuel calculation
  let fuel = Math.ceil(ship.value / 2);
  
  // Lem Badlands bonus (Ref: Ambiguity #81)
  if (player.controlsTerritory(TerritoryType.LEM_BADLANDS)) {
    fuel += 1; // +1 fuel per ship
  }
  
  player.fuel += fuel;
}

// Example calculations:
// Ship(3) without Lem: ⌈3/2⌉ = 2 fuel
// Ship(3) with Lem: ⌈3/2⌉ + 1 = 3 fuel

// Ship(6) without Lem: ⌈6/2⌉ = 3 fuel
// Ship(6) with Lem: ⌈6/2⌉ + 1 = 4 fuel
```

### Timing

- **When Applied:** During Solar Converter resolution
- **Per Ship:** +1 fuel for EACH ship (Ref: Ambiguity #81)
- **Unlimited:** No cap on bonus applications

### Special Rules

**Per-Ship Bonus (Ref: Ambiguity #81)**

Each ship gets +1 fuel:

```
Without Lem Badlands:
  Ships [3, 3, 3] at Solar Converter
  Ship(3): ⌈3/2⌉ = 2 fuel
  Ship(3): ⌈3/2⌉ = 2 fuel
  Ship(3): ⌈3/2⌉ = 2 fuel
  Total: 6 fuel

With Lem Badlands:
  Ships [3, 3, 3] at Solar Converter
  Ship(3): ⌈3/2⌉ + 1 = 3 fuel
  Ship(3): ⌈3/2⌉ + 1 = 3 fuel
  Ship(3): ⌈3/2⌉ + 1 = 3 fuel
  Total: 9 fuel
  
Bonus: 3 extra fuel (1 per ship)!
```

**Applies to All Ships**

Every ship docked at Solar Converter gets bonus:

```typescript
function solarConverterTurn(player: Player, ships: Ship[]): void {
  let totalFuel = 0;
  
  ships.forEach(ship => {
    let shipFuel = Math.ceil(ship.value / 2);
    
    if (player.controlsTerritory(TerritoryType.LEM_BADLANDS)) {
      shipFuel += 1;
    }
    
    totalFuel += shipFuel;
  });
  
  player.fuel += totalFuel;
  
  // Ships → Maintenance Bay
  ships.forEach(ship => ship.location = Facility.MAINTENANCE_BAY);
}
```

**Maximum Benefit**

With 4 ships (including Relic), maximum bonus:

```
Best case: 4 ships of value [6, 6, 6, 6]

Without Lem:
  Each ship: ⌈6/2⌉ = 3 fuel
  Total: 4 × 3 = 12 fuel

With Lem:
  Each ship: ⌈6/2⌉ + 1 = 4 fuel
  Total: 4 × 4 = 16 fuel
  
Bonus: 4 extra fuel!
```

### Examples

**Example 1: Basic Lem Bonus**

```
Setup:
  Player controls Lem Badlands
  Player has 2 fuel
  Player ships: [4, 5]

Action:
  Dock ships [4, 5] at Solar Converter

Effect:
  Ship(4): ⌈4/2⌉ + 1 = 2 + 1 = 3 fuel
  Ship(5): ⌈5/2⌉ + 1 = 3 + 1 = 4 fuel
  Total: 7 fuel gained
  
Result:
  Fuel: 2 + 7 = 9 total
  Ships [4, 5] → Maintenance Bay
  
Without Lem:
  Ship(4): 2 fuel
  Ship(5): 3 fuel
  Total: 5 fuel
  Bonus gave 2 extra fuel!
```

**Example 2: Maximum Fuel Generation**

```
Setup:
  Player controls Lem Badlands
  Player owns Relic Ship
  Player ships: [6, 6, 6, Relic(6)]
  Player has 0 fuel

Action:
  Dock all ships [6, 6, 6, 6] at Solar Converter

Effect:
  Ship(6): ⌈6/2⌉ + 1 = 3 + 1 = 4 fuel (×4 ships)
  Total: 16 fuel gained
  
Result:
  Fuel: 0 + 16 = 16
  BUT: Resource limit is 8!
  
CLEANUP Phase:
  Total resources: 16 fuel + 0 ore = 16
  Must discard: 16 - 8 = 8 resources
  Discard 8 fuel
  Final: 8 fuel, 0 ore
  
Analysis:
  Wasted 8 fuel due to cap
  Should spend fuel BEFORE over-collecting
```

**Example 3: Lem vs. Heinlein Strategy**

```
Scenario: Player controls BOTH Lem Badlands and Heinlein Plains

Option A: Use Solar Converter + Lem
  Ships [5, 5, 5] → Solar Converter
  Fuel: 3 × (⌈5/2⌉ + 1) = 3 × 4 = 12 fuel
  Ships → Maintenance Bay (unavailable next turn)

Option B: Use Solar Converter + Heinlein trades
  Ships [5, 5] → Solar Converter
  Fuel: 2 × (⌈5/2⌉ + 1) = 2 × 4 = 8 fuel
  Trade via Heinlein: 1 fuel → 1 ore
  Trade ships [5] at Orbital Market: etc.
  
Option A generates more fuel but uses all ships
Option B generates less fuel but preserves ship for ore
```

**Example 4: Data Crystal Borrowing**

```
Setup:
  Opponent controls Lem Badlands
  Player has Data Crystal tech card
  Player ships: [6, 6, 6]

Action:
  1. Activate Data Crystal (fuel power):
     Choose to borrow: Lem Badlands bonus
     Cost: 1 fuel
  
  2. Dock ships [6, 6, 6] at Solar Converter:
     Ship(6): ⌈6/2⌉ + 1 (borrowed Lem) = 4 fuel
     Ship(6): ⌈6/2⌉ + 1 (borrowed Lem) = 4 fuel
     Ship(6): ⌈6/2⌉ + 1 (borrowed Lem) = 4 fuel
     Total: 12 fuel gained
  
  3. Net gain: 12 - 1 (Data Crystal cost) = 11 fuel
  
Without Data Crystal:
  Would gain: 3 × 3 = 9 fuel
  Data Crystal adds 2 net fuel (11 vs 9)
```

### Interactions

**Facilities:**
- **Solar Converter:** +1 fuel per ship (Ref: Ambiguity #81)
- No effect on other facilities

**Tech Cards:**
- **Data Crystal:** Can borrow Lem from opponent
- **Booster Pod:** Increase ship value (more base fuel, then +1 Lem)
- **Resource Cache:** Lem helps generate fuel to avoid discard

**Territories:**
- Combines with Heinlein for maximum resource generation

**Edge Cases:**
- Bonus per ship, not per turn (Ref: Ambiguity #81)
- Resource cap may waste excess fuel
- Data Crystal can borrow from opponent

---

## 4.7 Pohl Foothills

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  POHL FOOTHILLS
              +1 Ship Value at Shipyard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Bonus Effect

**Built ships start with +1 die value at Shipyard**

```typescript
function shipyardWithPohl(player: Player, ships: Ship[]): void {
  // Calculate cost (not affected by Pohl)
  const N = player.ships.length; // Current fleet size
  const cost = (N * (N + 1)) / 2;
  
  if (player.ore < cost) {
    throw new Error(`Need ${cost} ore to build ship`);
  }
  
  // Pay cost
  player.ore -= cost;
  
  // Build new ship
  const newShip = new Ship(player);
  
  // Roll die for initial value
  newShip.value = rollDie(); // 1-6
  
  // Pohl Foothills bonus (Ref: Ambiguity #82)
  if (player.controlsTerritory(TerritoryType.POHL_FOOTHILLS)) {
    newShip.value += 1; // +1 to die roll
    // Max value becomes 7! (if rolled 6)
  }
  
  // Add to player's fleet
  player.ships.push(newShip);
  
  // Original ships → Maintenance Bay
  ships.forEach(ship => ship.location = Facility.MAINTENANCE_BAY);
}
```

### Timing

- **When Applied:** When new ship built at Shipyard
- **One-Time Bonus:** Applied to die roll, not persistent
- **Per Ship:** Each built ship gets +1 (if build multiple)

### Special Rules

**Die Roll Modification (Ref: Ambiguity #82)**

Pohl adds +1 to initial die roll:

```
Without Pohl:
  Build ship at Shipyard
  Roll die: 4
  New ship value: 4

With Pohl:
  Build ship at Shipyard
  Roll die: 4
  Add Pohl bonus: +1
  New ship value: 5
  
Can create value-7 ship:
  Roll die: 6
  Add Pohl bonus: +1
  New ship value: 7 (exceeds normal max!)
```

**Not Persistent**

Bonus only applies to INITIAL roll at Shipyard:

```
Turn 1: Build ship with Pohl
  Roll: 5 → Value 6 (5 + 1 Pohl)
  Ship added to fleet with value 6

Turn 2: ROLL phase
  All ships re-rolled (including new ship)
  New ship rolls: 3 → Value 3
  Pohl bonus NOT applied (only at Shipyard)
```

**Value-7 Ship Advantages**

Ship with value 7 has unique benefits:

```
Value-7 ship can:
  - Dock at any facility (meets all requirements)
  - Lunar Mine: Highest value (establishes minimum 7)
  - Alien Artifact: Total ≥8 with any ship ≥1
  - Terraforming: Helps reach 20 total
  
But: Only exists until next ROLL phase
     Next roll: Ship becomes 1-6 like others
```

**Multiple Ships Built**

If build multiple ships in one turn (rare), each gets bonus:

```
Turn 1: Have 3 ships, build 4th
  Cost: (3 × 4) / 2 = 6 ore
  Roll: 5 → 5 + 1 (Pohl) = 6

Same turn: Dock 4th ship in Maintenance Bay

Turn 2: Have 4 ships (including new one)
  Build 5th ship at Shipyard again (unlikely, very expensive)
  Cost: (4 × 5) / 2 = 10 ore
  Roll: 3 → 3 + 1 (Pohl) = 4
  
Each new ship gets +1 from Pohl
```

### Examples

**Example 1: Basic Pohl Ship**

```
Setup:
  Player controls Pohl Foothills
  Player has 3 ships (standard fleet)
  Player has 6 ore
  Player ships for docking: [5, 5]

Action:
  Dock ships [5, 5] at Shipyard

Effect:
  Cost: (3 × 4) / 2 = 6 ore
  Pay: 6 ore
  Roll die: 4
  Add Pohl bonus: +1
  New ship value: 5
  
Result:
  Fleet: 4 ships (3 old + 1 new)
  New ship starts with value 5
  Ships [5, 5] → Maintenance Bay
```

**Example 2: Lucky Roll to Value-7**

```
Setup:
  Player controls Pohl Foothills
  Player has 3 ships
  Player has 6 ore

Action:
  Build ship at Shipyard
  Roll die: 6 (lucky!)
  Add Pohl bonus: +1
  New ship value: 7 (exceeds normal max!)

Immediate use:
  Can dock value-7 ship at Lunar Mine
  Establishes minimum 7 (very high!)
  Next player needs 8+ to dock (difficult)
  
Or:
  Use value-7 for Alien Artifact (7 > 8, fails... wait)
  Actually: Alien Artifact needs total ≥8
  Ship(7) + Ship(1) = 8 ✓ Works!
  
Next turn ROLL phase:
  Value-7 ship re-rolled → becomes 1-6
  Lost special value (temporary bonus)
```

**Example 3: Strategic Timing**

```
Setup:
  Player controls Pohl Foothills
  Player has 3 ships with values [2, 2, 3]
  Player has 6 ore
  Turn goal: Use Alien Artifact (need total ≥8)

Plan A: Use existing ships
  Best pair: [3, 3] → Total 6 (not enough)
  Cannot use Alien Artifact

Plan B: Build ship first
  1. Dock [2, 2] at Shipyard
     Build new ship, roll 4 → 5 (with Pohl)
  2. Dock ships [3, 5] at Alien Artifact
     Total: 3 + 5 = 8 ✓
     Claim tech card!
     
Pohl bonus enabled Alien Artifact use!
```

**Example 4: Losing Pohl Before Building**

```
Setup:
  Player controls Pohl (2 colonies vs opponent 1)
  Player has 6 ore
  Player plans to build ship
  Opponent places colony on Pohl
  Pohl: [O, O, P, P] → TIE → NO CONTROL

Turn sequence:
  1. Opponent places colony on Pohl → Player loses control
  2. Player builds ship at Shipyard:
     Roll die: 5
     No Pohl bonus (lost control)
     New ship value: 5 (not 6)
     
Should have built ship BEFORE opponent placed colony!
```

### Interactions

**Facilities:**
- **Shipyard:** +1 to die roll when building (Ref: Ambiguity #82)
- **Lunar Mine:** Value-7 ship establishes high minimum
- **Alien Artifact:** Value-7 helps reach total ≥8

**Tech Cards:**
- **Data Crystal:** Can borrow Pohl from opponent (build with +1)
- **Booster Pod:** Cannot boost value-7 ship further (already exceeds max)
- **Temporal Warper:** Cannot re-roll Shipyard die (different facility)

**Territories:**
- No other territories affect Shipyard

**Edge Cases:**
- Bonus applies to initial die roll only (Ref: Ambiguity #82)
- Not persistent after ROLL phase
- Can create value-7 ship (temporary)
- Multiple ships built each get +1

---

## 4.8 Van Vogt Mountains

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                 VAN VOGT MOUNTAINS
        Bypass Lunar Mine Minimum Requirement
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Bonus Effect

**Ignore Lunar Mine minimum value requirement**

```typescript
function canDockAtLunarMine(player: Player, ship: Ship): boolean {
  // Check Van Vogt bypass (Ref: Ambiguity #83, #84)
  if (player.controlsTerritory(TerritoryType.VAN_VOGT_MOUNTAINS)) {
    return true; // Can dock any value!
  }
  
  // Normal rule: Must exceed current minimum
  const currentMinimum = lunarMine.getMinimum();
  return ship.value > currentMinimum;
}

function lunarMineEffect(player: Player, ships: Ship[]): void {
  // Count valid ships
  const validShips = ships.filter(ship => 
    canDockAtLunarMine(player, ship)
  );
  
  // Gain ore = number of valid ships
  player.ore += validShips.length;
  
  // All ships stay at Lunar Mine (persist)
  validShips.forEach(ship => {
    ship.location = Facility.LUNAR_MINE;
    ship.state = ShipState.COMMITTED;
  });
  
  // Update minimum (not affected by Van Vogt)
  if (validShips.length > 0) {
    const newMin = Math.max(...validShips.map(s => s.value));
    lunarMine.setMinimum(newMin);
  }
}
```

### Timing

- **When Applied:** During Lunar Mine docking check
- **Bypass Effect:** Ignore minimum value requirement
- **Minimum Still Updated:** Ships still set new minimum

### Special Rules

**Bypass Minimum (Ref: Ambiguity #83)**

Can dock ships of ANY value:

```
Setup:
  Lunar Mine minimum: 5 (from previous turn)
  Player controls Van Vogt Mountains
  Player ships: [2, 3, 4]

Without Van Vogt:
  Ship(2): 2 ≤ 5 ✗ Cannot dock
  Ship(3): 3 ≤ 5 ✗ Cannot dock
  Ship(4): 4 ≤ 5 ✗ Cannot dock
  Total: 0 ore gained

With Van Vogt:
  Ship(2): Bypass minimum ✓ Can dock
  Ship(3): Bypass minimum ✓ Can dock
  Ship(4): Bypass minimum ✓ Can dock
  Total: 3 ore gained!
```

**Minimum Still Increases (Ref: Ambiguity #84)**

Docked ships still establish new minimum:

```
Setup:
  Lunar Mine minimum: 5
  Player controls Van Vogt
  Player ships: [2, 3, 6]

Action:
  Dock ships [2, 3, 6] at Lunar Mine (bypass minimum)

Effect:
  Ship(2): Docks (bypass) → Stays at Lunar Mine
  Ship(3): Docks (bypass) → Stays at Lunar Mine
  Ship(6): Docks (normal) → Stays at Lunar Mine
  Gain 3 ore
  
  New minimum: max(2, 3, 6) = 6 (increased!)
  
Next turn:
  Minimum is now 6 (not 5)
  Lower-value ships increased the barrier
```

**Strategic Implications**

Van Vogt allows low-value ships but increases minimum:

```
Scenario: Player has ships [1, 1, 1]
  Lunar Mine minimum: 4
  Player controls Van Vogt

Option A: Dock all ships
  Dock [1, 1, 1] → 3 ore
  New minimum: 1 (lowered!)
  Opponents can dock easily next turn
  
Option B: Don't dock
  Skip Lunar Mine this turn
  Minimum stays 4 (harder for opponents)
  
Trade-off: Immediate ore vs. denying opponents
```

**Minimum Lowering**

Van Vogt can LOWER minimum (unusual):

```
Turn 1:
  Player A docks ship(6) at Lunar Mine
  Minimum: 6 (high barrier)

Turn 2:
  Player B controls Van Vogt
  Player B docks ships [2, 2, 2]
  New minimum: max(2, 2, 2) = 2 (lowered!)
  
Turn 3:
  Any player can dock value ≥3 ships
  Barrier removed (helps everyone)
```

### Examples

**Example 1: Bypass with Low Ships**

```
Setup:
  Player controls Van Vogt Mountains
  Lunar Mine minimum: 5
  Player ships: [1, 2, 3]

Action:
  Dock ships [1, 2, 3] at Lunar Mine

Effect:
  Ship(1): Bypass minimum ✓
  Ship(2): Bypass minimum ✓
  Ship(3): Bypass minimum ✓
  Gain 3 ore
  Ships stay at Lunar Mine
  
  New minimum: max(1, 2, 3) = 3
  
Result:
  Gained 3 ore (would get 0 without Van Vogt)
  Lowered minimum from 5 to 3 (helps opponents!)
```

**Example 2: Strategic Minimum Management**

```
Setup:
  Player controls Van Vogt Mountains
  Lunar Mine minimum: 6 (opponent set high)
  Player ships: [4, 5, 6, 6]

Option A: Dock all ships
  Dock [4, 5, 6, 6] → 4 ore
  New minimum: 6 (unchanged)
  
Option B: Dock only high ships
  Dock [6, 6] → 2 ore
  New minimum: 6 (unchanged)
  Save ships [4, 5] for other facilities
  
Option C: Dock only low ships
  Dock [4, 5] → 2 ore
  New minimum: 5 (lowered by 1)
  Save ships [6, 6] for other facilities
  
Option A: Max ore but uses all ships
Option B: Moderate ore, preserve barrier
Option C: Moderate ore, lower barrier (helps others)
```

**Example 3: Data Crystal Van Vogt Borrow**

```
Setup:
  Opponent controls Van Vogt Mountains
  Player has Data Crystal tech card
  Lunar Mine minimum: 6
  Player ships: [3, 4, 5]

Action:
  1. Activate Data Crystal (fuel power):
     Choose to borrow: Van Vogt Mountains
     Cost: 1 fuel
     
  2. Dock ships [3, 4, 5] at Lunar Mine:
     Bypass minimum (borrowed Van Vogt) ✓
     Gain 3 ore
     New minimum: 5
     
Result:
  Gained 3 ore (would get 0 without Data Crystal)
  Cost: 1 fuel
  Net: 3 ore for 1 fuel (excellent trade!)
```

**Example 4: Losing Van Vogt Mid-Turn**

```
Setup:
  Player controls Van Vogt (2 colonies vs opponent 1)
  Lunar Mine minimum: 6
  Player ships: [2, 3, 5]
  Opponent places colony on Van Vogt
  Van Vogt: [O, O, P, P] → TIE → NO CONTROL

Turn sequence:
  1. Player docks ship [5] at Lunar Mine:
     5 ≤ 6 ✗ Cannot dock (lost Van Vogt!)
     
  If player had docked BEFORE opponent placed colony:
     Would bypass minimum with Van Vogt
     Would gain ore
     
Strategy: Use Van Vogt EARLY before losing control!
```

### Interactions

**Facilities:**
- **Lunar Mine:** Bypass minimum requirement (Ref: Ambiguity #83)
- **Lunar Mine:** Still update minimum with docked values (Ref: Ambiguity #84)

**Tech Cards:**
- **Data Crystal:** Can borrow Van Vogt from opponent
- **Booster Pod:** Increase ship value (may not need Van Vogt)
- **Temporal Warper:** Re-roll low ships (alternative to Van Vogt)

**Territories:**
- Van Vogt unique (only territory affecting Lunar Mine)

**Edge Cases:**
- Bypasses minimum but still updates it (Ref: Ambiguity #83, #84)
- Can lower minimum (strategic choice)
- Data Crystal can borrow from opponent
- Control can change mid-turn

---

## 4.9 Territory Interaction Matrix

### Territory Bonuses Summary

| Territory | Bonus | Facility/System Affected | Frequency | Stacks? |
|-----------|-------|--------------------------|-----------|---------|
| **Asimov Crater** | +1 colony advance | Colonist Hub | Per use | Yes (with Monument) |
| **Bradbury Plateau** | -1 ore cost | Colony Constructor | Per use | Hypothetical |
| **Burroughs Desert** | Relic Ship access | Purchase for 3 ore | One-time | N/A |
| **Heinlein Plains** | 1:1 fuel↔ore | Orbital Market | Once/turn | Yes (with ships) |
| **Lem Badlands** | +1 fuel/ship | Solar Converter | Per ship | Yes (unlimited) |
| **Pohl Foothills** | +1 die value | Shipyard | Per build | Yes (per ship) |
| **Van Vogt Mountains** | Bypass minimum | Lunar Mine | Unlimited | N/A |

### Control Priority Strategy

**Early Game:**
1. **Burroughs Desert** (Relic Ship = 4th die)
2. **Lem Badlands** (Fuel generation engine)
3. **Heinlein Plains** (Flexible conversion)

**Mid Game:**
4. **Asimov Crater** (Colony rushing)
5. **Bradbury Plateau** (Colony cost reduction)
6. **Van Vogt Mountains** (Ore generation with bad rolls)

**Late Game:**
7. **Pohl Foothills** (Fleet expansion, value-7 ships)

### Multi-Territory Combos

**Resource Engine (Lem + Heinlein):**
```
Control both Lem Badlands and Heinlein Plains:
  Ships [6, 6, 6] → Solar Converter
  Gain: 3 × (3 + 1) = 12 fuel
  Trade via Heinlein: 1 fuel → 1 ore
  Net: 11 fuel, 1 ore
```

**Colony Rush (Asimov + Bradbury):**
```
Control both Asimov Crater and Bradbury Plateau:
  Ships [3, 3] → Colonist Hub
  Gain: 2 + 1 (Asimov) = 3 colony advancement
  
  Ships [4, 4] → Colony Constructor
  Cost: 3 - 1 (Bradbury) = 2 ore
  Place colony
  
Total: 4 colonies gained for 2 ore + 4 ships
```

**Fleet + Ore (Pohl + Van Vogt):**
```
Control both Pohl Foothills and Van Vogt Mountains:
  Build ship at Shipyard with Pohl (+1 value)
  Dock low-value ships at Lunar Mine with Van Vogt
  Gain ore even with bad rolls
```

---

**End of Section 4: Territories & Control Bonuses**

*Continues in Section 5: Field Generators.*

---

## Cross-References

- **Ambiguities Resolved**: #79-84 (Heinlein, Lem, Pohl, Van Vogt)
  
- **Related Sections**:
  - Section 3 (Facilities): Orbital Market, Solar Converter, Shipyard, Lunar Mine
  - Section 5 (Field Generators): Territory protection mechanics
  - Section 6 (Alien Tech Cards): Data Crystal territory borrowing
  - Section 7 (Advanced Rules): Territory control VP calculation
