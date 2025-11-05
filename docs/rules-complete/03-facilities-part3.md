# Section 3: Orbital Facilities (Part 3)

**Pages 25-27 of Complete Rules Reference**

---

## 3.10 Solar Converter

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   SOLAR CONVERTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Docking Requirements

- **Single ship** (any value)
- **Unlimited dock spaces**
- Multiple ships can dock per turn

### Effect

**Gain fuel = ⌈ship value / 2⌉ per ship**

```typescript
function solarConverterEffect(player: Player, ship: Ship): void {
  // 1. Calculate base fuel gain (Ref: Ambiguity #59)
  let fuelGain = Math.ceil(ship.value / 2);
  
  // 2. Apply Lem Badlands bonus (Ref: Ambiguity #81)
  const controlsLem = player.controlsTerritory(TerritoryType.LEM_BADLANDS);
  if (controlsLem) {
    fuelGain += 1; // +1 fuel per ship
  }
  
  // 3. Grant fuel
  player.fuel += fuelGain;
}
```

### Timing

- **When Effect Resolves:** Immediately when each ship docks
- **Ship Destination:** Ships move to Maintenance Bay
- **Rounding:** Always round UP (ceiling function)

### Special Rules

**Rounding Per Ship (Ref: Ambiguity #59)**

Ceiling applied to **each ship individually**:

```typescript
// CORRECT: Round per ship
ship1 (value 3): ⌈3/2⌉ = ⌈1.5⌉ = 2 fuel
ship2 (value 5): ⌈5/2⌉ = ⌈2.5⌉ = 3 fuel
Total: 2 + 3 = 5 fuel

// WRONG: Don't sum then round
total_value = 3 + 5 = 8
⌈8/2⌉ = ⌈4⌉ = 4 fuel ✗ INCORRECT
```

**Fuel Calculation Table**

| Ship Value | Base Fuel | With Lem Badlands | Formula |
|------------|-----------|-------------------|---------|
| 1 | 1 | 2 | ⌈1/2⌉ = 1 |
| 2 | 1 | 2 | ⌈2/2⌉ = 1 |
| 3 | 2 | 3 | ⌈3/2⌉ = 2 |
| 4 | 2 | 3 | ⌈4/2⌉ = 2 |
| 5 | 3 | 4 | ⌈5/2⌉ = 3 |
| 6 | 3 | 4 | ⌈6/2⌉ = 3 |

**Lem Badlands Bonus (Ref: Ambiguity #81)**

If player controls Lem Badlands:

```typescript
function solarConverterWithLem(shipValue: number): number {
  const baseFuel = Math.ceil(shipValue / 2);
  return baseFuel + 1; // +1 per ship
}

// Example: Ship(5)
// Base: ⌈5/2⌉ = 3 fuel
// With Lem: 3 + 1 = 4 fuel
```

**Multiple Ships Same Turn**

Each ship evaluated independently:

```
Player does NOT control Lem Badlands
Dock ships [1, 3, 5] at Solar Converter

Ship(1): ⌈1/2⌉ = 1 fuel
Ship(3): ⌈3/2⌉ = 2 fuel
Ship(5): ⌈5/2⌉ = 3 fuel
Total: 1 + 2 + 3 = 6 fuel gained
```

### State Diagram

```
Ship (any value) at hand
      ↓ Dock at Solar Converter
  [DOCKED]
      ↓ Requirement met (instant)
Calculate ⌈value / 2⌉
Add Lem Badlands bonus (+1 if controlled)
Gain fuel
      ↓
Ship → Maintenance Bay [COMMITTED]
      ↓ GATHER phase (next turn)
Ship returns to hand
```

### Examples

**Example 1: Basic Fuel Generation**

```
Setup:
  Player has 2 fuel
  Player does NOT control Lem Badlands
  Player ships: [4, 5]

Action:
  Dock ships [4, 5] at Solar Converter

Effect:
  Ship(4): ⌈4/2⌉ = 2 fuel
  Ship(5): ⌈5/2⌉ = 3 fuel
  Total: 2 + 3 = 5 fuel gained
  
Result:
  Fuel: 2 + 5 = 7 total
  Ships [4, 5] → Maintenance Bay
```

**Example 2: Lem Badlands Bonus**

```
Setup:
  Player has 1 fuel
  Player controls Lem Badlands
  Player ships: [3, 3, 3]

Action:
  Dock ships [3, 3, 3] at Solar Converter

Effect:
  Ship(3): ⌈3/2⌉ + 1 = 2 + 1 = 3 fuel
  Ship(3): ⌈3/2⌉ + 1 = 2 + 1 = 3 fuel
  Ship(3): ⌈3/2⌉ + 1 = 2 + 1 = 3 fuel
  Total: 3 + 3 + 3 = 9 fuel gained
  
Result:
  Fuel: 1 + 9 = 10 total
  Ships [3, 3, 3] → Maintenance Bay
  
Analysis:
  WITHOUT Lem: 3 ships × 2 fuel = 6 fuel
  WITH Lem: 3 ships × 3 fuel = 9 fuel
  Bonus grants 3 extra fuel!
```

**Example 3: Rounding Advantage**

```
Odd-value ships benefit from ceiling rounding:

Ship(1): ⌈1/2⌉ = ⌈0.5⌉ = 1 fuel (100% efficiency)
Ship(2): ⌈2/2⌉ = ⌈1⌉ = 1 fuel (50% efficiency)
Ship(3): ⌈3/2⌉ = ⌈1.5⌉ = 2 fuel (67% efficiency)
Ship(4): ⌈4/2⌉ = ⌈2⌉ = 2 fuel (50% efficiency)
Ship(5): ⌈5/2⌉ = ⌈2.5⌉ = 3 fuel (60% efficiency)
Ship(6): ⌈6/2⌉ = ⌈3⌉ = 3 fuel (50% efficiency)

Odd ships (1, 3, 5) get "free" 0.5 rounded up!
Even ships (2, 4, 6) get exact half
```

**Example 4: Resource Limit Consideration**

```
Setup:
  Player has 5 fuel, 3 ore (total 8, at limit)
  Player ships: [6, 6, 6]

Action:
  Dock ships [6, 6, 6] at Solar Converter

Effect:
  Each ship(6): ⌈6/2⌉ = 3 fuel
  Total: 3 + 3 + 3 = 9 fuel gained
  
Result:
  Fuel: 5 + 9 = 14
  Total resources: 14 fuel + 3 ore = 17
  
CLEANUP Phase:
  Exceeds limit of 8!
  Must discard 17 - 8 = 9 resources
  Player chooses: Discard 9 fuel
  Final: 5 fuel, 3 ore
  
Analysis:
  Gained 9 fuel but only kept 5 (net 0 gain!)
  Should have used fuel for tech cards first
  Or docked fewer ships
```

### Interactions

**Territory Bonuses:**
- **Lem Badlands:** +1 fuel per ship (Ref: Ambiguity #81)
- **Data Crystal:** Can borrow Lem bonus from opponent

**Tech Cards:**
- **Booster Pod:** Increase ship value before docking (more fuel)
  ```
  Ship(5) → Booster Pod → 6
  Fuel: ⌈6/2⌉ = 3 (same as before!)
  
  Ship(4) → Booster Pod → 5
  Fuel: ⌈5/2⌉ = 3 (was 2, gained 1!)
  
  Strategy: Boost even ships to odd for extra fuel
  ```
- **Stasis Beam:** Decrease ship value (LESS fuel, not useful)
- **Plasma Cannon:** Remove blocking ships (not applicable, unlimited capacity)

**Field Generators:**
- None affect Solar Converter directly

**Edge Cases:**
- Rounding per ship, not per turn total (Ref: Ambiguity #59)
- Lem Badlands adds +1 per ship (Ref: Ambiguity #81)
- Unlimited capacity confirmed
- Resource limit may cause waste if not managed

---

## 3.11 Terraforming Station

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                 TERRAFORMING STATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Docking Requirements

- **Minimum 3 ships** (any values) (Ref: Ambiguity #60)
- **Total value ≥ 20** across all ships
- **Unlimited dock spaces**
- All ships must be docked before effect resolves

**Clarification (Ref: Ambiguity #60, #61):**

```typescript
function canActivateTerraformingStation(ships: Ship[]): boolean {
  if (ships.length < 3) {
    return false; // Need at least 3 ships
  }
  
  const totalValue = ships.reduce((sum, ship) => sum + ship.value, 0);
  if (totalValue < 20) {
    return false; // Total must be ≥ 20
  }
  
  return true;
}

// Valid examples:
// [6, 6, 6, 2] → 4 ships, total 20 ✓
// [6, 6, 6, 6] → 4 ships, total 24 ✓
// [5, 5, 5, 5] → 4 ships, total 20 ✓

// Invalid examples:
// [6, 6, 6] → 3 ships, total 18 ✗ (< 20)
// [6, 6] → 2 ships, total 12 ✗ (< 3 ships AND < 20)
```

### Effect

**Place 1 colony on any territory (forfeit 1 ship permanently)**

```typescript
function terraformingStationEffect(
  player: Player,
  ships: Ship[],
  territory: Territory,
  forfeitedShip: Ship
): void {
  // 1. Check Repulsor Field (Ref: Ambiguity #94)
  if (territory.hasFieldGenerator(FieldType.REPULSOR)) {
    // Cannot place colony
    // Ships still processed (forfeited + returned)
    processShips(player, ships, forfeitedShip);
    return;
  }
  
  // 2. Place colony on territory
  territory.addColony(player);
  
  // 3. Update territory control
  const newControl = determineStrictMajority(territory);
  territory.controlledBy = newControl;
  
  // 4. Process ships (Ref: Ambiguity #62, #65, #66)
  processShips(player, ships, forfeitedShip);
}

function processShips(player: Player, ships: Ship[], forfeitedShip: Ship): void {
  ships.forEach(ship => {
    if (ship === forfeitedShip) {
      // Forfeited ship handling
      if (ship.isRelicShip()) {
        // Relic Ship: Returns to Burroughs Desert
        returnRelicShipToBurroughsDesert();
        player.hasRelicShip = false;
      } else {
        // Regular ship: Removed from game permanently
        removeShipFromGame(ship, player);
        player.ships.remove(ship);
      }
    } else {
      // Non-forfeited ships: Go to Maintenance Bay
      ship.location = Facility.MAINTENANCE_BAY;
    }
  });
}
```

### Timing

- **When Effect Resolves:** When all required ships docked AND total ≥ 20
- **Ship Destination:** 
  - Forfeited ship: Removed permanently (or Relic Ship to Burroughs Desert)
  - Other ships: Maintenance Bay (return next GATHER phase)
- **Colony Placement:** Immediate during ACTION phase

### Special Rules

**Minimum Three Ships (Ref: Ambiguity #60)**

Cannot activate with only 2 ships, even if total ≥ 20:

```
Ships: [6, 6, 6, 2] → 4 ships, total 20 ✓ Valid
Ships: [6, 6, 6] → 3 ships, total 18 ✗ Invalid (< 20)
Ships: [6, 6, 8] → 3 ships, total 20 ✓ Valid (minimum case)

Hypothetical: [10, 10] → 2 ships, total 20 ✗ Invalid (< 3 ships)
(Note: Max ship value is 6, so [10, 10] impossible)
```

**Four-Ship Minimum (Ref: Ambiguity #61)**

With standard 6-sided dice, maximum per ship is 6:

```
Best case with 3 ships: [6, 6, 6] = 18 < 20 ✗

Therefore, MINIMUM 4 ships required in practice!

Possible with tech cards:
  Ship(6) + Booster Pod → 7 (impossible, max is 6!)
  
Actual minimum: 4 ships of [5, 5, 5, 5] = 20 ✓
```

**Player Chooses Forfeited Ship (Ref: Ambiguity #62)**

Player selects which ship to forfeit:

```
Ships docked: [4, 5, 5, 6]
Player chooses to forfeit: ship(4)

Result:
  Ship(4) removed permanently
  Ships [5, 5, 6] → Maintenance Bay
  
Strategy: Forfeit lowest-value or least useful ship
```

**Relic Ship Forfeiture (Ref: Ambiguity #65)**

If Relic Ship is forfeited:

```
Ships docked: [4, 5, 5, Relic(6)]
Player chooses to forfeit: Relic Ship

Result:
  Relic Ship → Burroughs Desert (not removed from game)
  Ships [4, 5, 5] → Maintenance Bay
  Relic Ship available for re-purchase
  
Special: Relic Ship cannot be permanently lost
```

**Return to Burroughs Desert (Ref: Ambiguity #66)**

All forfeited Relic Ships return to Burroughs Desert:

```typescript
function forfeitRelicShip(): void {
  // Relic Ship goes back to board
  relicShip.location = Territory.BURROUGHS_DESERT;
  relicShip.owner = null;
  
  // Player loses ownership
  player.hasRelicShip = false;
  
  // Available for any player to purchase again
}
```

**Repulsor Field Blocking (Ref: Ambiguity #94)**

If target territory has Repulsor Field:

```
Action: Use Terraforming Station, select Pohl Foothills
Check: Pohl Foothills has Repulsor Field

Result:
  Colony placement BLOCKED
  Ships still processed:
    - 1 ship forfeited permanently
    - Others go to Maintenance Bay
    
Analysis:
  Major loss! Forfeited ship with no colony gained
  ALWAYS check for Repulsor Fields first
  Use Booster Pod discard to remove Repulsor before committing
```

### State Diagram

```
Ships [≥3, total ≥ 20] at hand
      ↓ Dock at Terraforming Station
Ship 1 docks → [DOCKED] (waiting)
Ship 2 docks → [DOCKED] (waiting)
Ship 3 docks → [DOCKED] (waiting)
Ship 4+ docks → [DOCKED] (waiting)
      ↓ Requirement met (≥3 ships, total ≥ 20)
Player chooses territory
Player chooses which ship to forfeit
      ↓ Check Repulsor Field
If blocked: No colony placed (ships still processed)
If clear: Place colony on territory
      ↓ Process ships:
Forfeited ship:
  → Regular: Removed from game permanently
  → Relic: Returns to Burroughs Desert
Other ships:
  → Maintenance Bay [COMMITTED]
      ↓ GATHER phase (next turn)
Non-forfeited ships return to hand
```

### Examples

**Example 1: Basic Terraforming**

```
Setup:
  Player has 7 colonies placed (last one!)
  Player ships: [5, 5, 5, 5]
  Target: Heinlein Plains (no Repulsor)

Action:
  Dock ships [5, 5, 5, 5] at Terraforming Station
  Total: 5 + 5 + 5 + 5 = 20 ✓
  Choose territory: Heinlein Plains
  Choose to forfeit: ship(5) #1

Effect:
  Place colony on Heinlein Plains
  Forfeit ship(5) #1 → Removed from game
  Ships [5, 5, 5] → Maintenance Bay
  
Result:
  Player now has 7 colonies placed
  GAME ENDS! (last colony triggers end)
  Player's fleet: 3 ships (lost 1 permanently)
```

**Example 2: Relic Ship Forfeiture**

```
Setup:
  Player owns Relic Ship
  Player ships: [4, 5, 6, Relic(6)]
  Target: Burroughs Desert

Action:
  Dock ships [4, 5, 6, Relic(6)] at Terraforming
  Total: 4 + 5 + 6 + 6 = 21 ✓
  Choose territory: Burroughs Desert
  Choose to forfeit: Relic Ship

Effect:
  Place colony on Burroughs Desert
  Relic Ship → Burroughs Desert (not removed!)
  Ships [4, 5, 6] → Maintenance Bay
  
Result:
  Colony placed successfully
  Relic Ship back on board (can re-purchase)
  Player now has 3 standard ships
```

**Example 3: Insufficient Ships**

```
Setup:
  Player ships: [6, 6, 6]
  Total: 6 + 6 + 6 = 18

Action:
  Try to dock at Terraforming Station

Result:
  Cannot activate (18 < 20)
  Need at least 20 total
  
Solution:
  A) Dock 4th ship (if have one)
  B) Use Booster Pod to increase values
     Ship(6) + Booster → INVALID (max is 6)
  C) Wait for better rolls next turn
```

**Example 4: Repulsor Field Disaster**

```
Setup:
  Player ships: [5, 5, 5, 5]
  Target: Pohl Foothills
  Pohl Foothills has Repulsor Field (opponent placed it)

Action:
  Dock ships [5, 5, 5, 5] at Terraforming Station
  Choose territory: Pohl Foothills
  Choose to forfeit: ship(5) #1

Effect:
  Check Repulsor: BLOCKED! Cannot place colony
  Process ships anyway:
    Ship(5) #1 → Forfeited permanently (LOST!)
    Ships [5, 5, 5] → Maintenance Bay
    
Result:
  NO colony placed
  Lost 1 ship permanently
  Major strategic disaster
  
Lesson:
  ALWAYS check for Repulsor Fields before committing
  Use Booster Pod discard to remove Repulsor first
  Or choose different territory
```

### Interactions

**Territory Bonuses:**
- None affect Terraforming Station directly

**Tech Cards:**
- **Booster Pod:** Cannot exceed max value of 6 (not useful for reaching 20)
- **Booster Pod (discard):** Remove Repulsor Field before terraforming
- **Plasma Cannon (discard):** Remove opponent ships (not applicable here)
- **Data Crystal:** Borrow bonuses (doesn't help reach 20 total)

**Field Generators:**
- **Repulsor Field:** BLOCKS colony placement (Ref: Ambiguity #94)
  - Ship still forfeited even if blocked!
  - Critical to check before committing

**Edge Cases:**
- Minimum 3 ships required (Ref: Ambiguity #60)
- Practical minimum 4 ships with standard dice (Ref: Ambiguity #61)
- Player chooses forfeited ship (Ref: Ambiguity #62)
- Relic Ship returns to Burroughs Desert (Ref: Ambiguity #65, #66)
- Repulsor blocks placement but ships still processed (Ref: Ambiguity #94)
- Plasma Cannon cannot target Terraforming Station ships (Ref: Ambiguity #130)

---

## 3.12 Facility Comparison Table

### Quick Reference Matrix

| Facility | Requirement | Primary Benefit | Capacity | Ships Persist? | Cost |
|----------|-------------|-----------------|----------|----------------|------|
| **Alien Artifact** | Value ≥ 8 | Tech card | 3 | No (to Bay) | None |
| **Colonist Hub** | Any ship | Colony advance | ∞ | No (to Bay) | None |
| **Colony Constructor** | 3 ships | Place colony | 3 | No (to Bay) | 3 ore* |
| **Lunar Mine** | Value ≥ highest | 1 ore/ship | ∞ | Yes | None |
| **Maintenance Bay** | Any ship | Store ship | ∞ | Yes | None |
| **Orbital Market** | Pair | Fuel→Ore trade | 2 | No (to Bay) | Varies* |
| **Raiders' Outpost** | Sequential | Raid | 3 | No (to Bay) | None |
| **Shipyard** | Pair | Build ship | 2 | No (to Bay) | Varies* |
| **Solar Converter** | Any ship | Fuel gain | ∞ | No (to Bay) | None |
| **Terraforming** | ≥3, total ≥20 | Place colony | ∞ | Mixed* | 1 ship |

*Cost details:
- Colony Constructor: 3 ore (2 with Bradbury Plateau)
- Orbital Market: Fuel cost = ship value × ore gained (1:1 with Heinlein Plains)
- Shipyard: Varies by fleet size (see Section 3.9)
- Terraforming: 1 ship forfeited permanently

### Strategic Comparison

**Resource Generation:**
- **Best fuel:** Solar Converter (guaranteed, unlimited capacity)
- **Best ore:** Lunar Mine (persistent ships, escalating)
- **Resource conversion:** Orbital Market (fuel→ore)
- **Resource theft:** Raiders' Outpost (steal from opponents)

**Colony Placement:**
- **Fastest:** Terraforming Station (1 turn, high cost)
- **Most efficient:** Colony Constructor (3 ore, reusable ships)
- **Incremental:** Colonist Hub (build up over turns)

**Fleet Building:**
- **Only source:** Shipyard (escalating cost)

**Tech Acquisition:**
- **Only source:** Alien Artifact (random draw)

**Utility:**
- **Ship storage:** Maintenance Bay (unlimited, flexible)
- **Value preservation:** Lunar Mine (ships persist with value)

### Facility Pairing Strategies

**Turn 1 Combos:**
```
A) Resource Engine:
   - Solar Converter (gain fuel)
   - Lunar Mine (gain ore)
   - Maintenance Bay (save ship for Turn 2)

B) Colony Rush:
   - Lunar Mine ×2 (gain 2 ore)
   - Colony Constructor (spend 3 ore, need 1 more)

C) Tech Acquisition:
   - Booster Pod + Gravity Manipulator → value 8
   - Alien Artifact (claim tech card)
```

**Multi-Turn Strategies:**
```
A) Fleet Expansion:
   Turn 1: Solar Converter + Lunar Mine → Gain resources
   Turn 2: Shipyard (build 4th ship) → More dice
   Turn 3: Solar Converter ×4 → Massive fuel gain

B) Colony Spam:
   Turn 1: Colonist Hub ×3 → Advance colonies
   Turn 2: Colony Constructor → Place colony
   Turn 3: Repeat

C) Terraforming Rush:
   Turn 1: Build fleet at Shipyard
   Turn 2: Maintenance Bay ×4 (save all ships)
   Turn 3: Roll 4 ships, Terraforming Station
```

---

**End of Section 3: Orbital Facilities**

*Continues in Section 4: Territories & Bonuses (Part 1).*

---

## Cross-References

- **Ambiguities Resolved**: #59-66 (Solar Converter, Terraforming Station), #81 (Lem Badlands), #94 (Repulsor Field), #130 (Plasma Cannon restrictions)
  
- **Related Sections**:
  - Section 2 (Turn Structure): ACTION phase mechanics, ship states
  - Section 4 (Territories): Territory bonuses (Lem Badlands, Bradbury Plateau, etc.)
  - Section 5 (Field Generators): Repulsor Field blocking mechanics
  - Section 6 (Alien Tech Cards): Card interactions with facilities
  - Section 7 (Advanced Rules): Relic Ship forfeiture rules
  - Section 8 (Edge Cases): Facility interaction edge cases
