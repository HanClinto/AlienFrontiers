# Section 6: Alien Tech Cards (Part 2)

**Pages 48-53 of Complete Rules Reference**

---

## 6.2.4 Data Crystal

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    DATA CRYSTAL
          Borrow Opponent Territory Bonuses
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Fuel Power

**Cost:** 1 fuel  
**Effect:** Borrow one opponent's territory bonus this turn (Ref: Ambiguity #116)

```typescript
function dataCrystalFuelPower(player: Player, opponent: Player, territory: TerritoryType): void {
  // Check cost
  if (player.fuel < 1) {
    throw new Error("Need 1 fuel");
  }
  
  // Check opponent controls territory (Ref: Ambiguity #116)
  if (!opponent.controlsTerritory(territory)) {
    throw new Error(`${opponent.name} doesn't control ${territory}`);
  }
  
  // Check Isolation Field (Ref: Ambiguity #117)
  const territoryObj = getTerritory(territory);
  if (territoryObj.hasFieldGenerator(FieldType.ISOLATION)) {
    throw new Error(`${territory} has Isolation Field (bonus blocked)`);
  }
  
  // Pay cost
  player.fuel -= 1;
  
  // Grant bonus for this turn (Ref: Ambiguity #116)
  player.borrowedBonuses.set(territory, opponent);
  
  // Bonus applies to all uses this turn
}
```

### Discard Power

**Effect:** None (Data Crystal has no discard power) (Ref: Ambiguity #118)

```typescript
// Data Crystal ONLY has fuel power
// No discard power exists for this card
```

**Ambiguity #118 Resolution:** Data Crystal has NO discard power

### Timing

- **Fuel Power:** During ACTION phase, before using borrowed bonus (Ref: Ambiguity #116)
- **Duration:** Entire turn (all uses of that bonus)
- **Multiple Uses:** Can borrow different bonuses in same turn

### Special Rules

**Must Control to Borrow (Ref: Ambiguity #116):**

Can only borrow from opponent who CONTROLS territory:

```
Territory colonies: [Opponent A: 2, Opponent B: 1, Player: 0]
  → Opponent A controls (2 > 1, strict majority)
  → Player can borrow from Opponent A ✓
  → Player CANNOT borrow from Opponent B (doesn't control)

Territory colonies: [Opponent A: 1, Opponent B: 1, Player: 1]
  → TIE (1-1-1, no strict majority)
  → NO ONE controls
  → Player CANNOT borrow (no one to borrow from)
```

**Isolation Field Blocks Borrowing (Ref: Ambiguity #117):**

Cannot borrow bonus if Isolation Field present:

```
Setup:
  Opponent controls Lem Badlands (+1 fuel/ship)
  Lem Badlands has Isolation Field
  Player has Data Crystal

Action:
  Try to activate Data Crystal (borrow Lem bonus)
  Check Isolation: BLOCKED
  Cannot borrow bonus
  
Result:
  Isolation blocks ALL bonus usage (including borrowing)
  1 fuel NOT spent (power cannot activate)
```

**Turn-Wide Bonus (Ref: Ambiguity #116):**

Borrowed bonus applies to ALL uses this turn:

```
Turn sequence:
  1. Activate Data Crystal (borrow Lem from Opponent)
     Cost: 1 fuel
     Bonus: +1 fuel/ship at Solar Converter
  
  2. Dock ships [5, 6] at Solar Converter
     Ship(5): ⌈5/2⌉ + 1 (borrowed Lem) = 4 fuel
     Ship(6): ⌈6/2⌉ + 1 (borrowed Lem) = 4 fuel
     Total: 8 fuel
  
  3. Dock ship [4] at Solar Converter (later in turn)
     Ship(4): ⌈4/2⌉ + 1 (borrowed Lem, still active!) = 3 fuel
     
Borrowed bonus applied to BOTH Solar Converter uses!
Net gain: 3 ships × 1 fuel = 3 extra fuel for 1 fuel cost = +2 net
```

**Multiple Bonuses Per Turn:**

Can borrow multiple different bonuses:

```
Turn sequence:
  1. Activate Data Crystal (borrow Lem from Opponent A)
     Cost: 1 fuel
     Use Solar Converter with +1 fuel/ship
  
  2. Activate Data Crystal again (borrow Asimov from Opponent B)
     Cost: 1 fuel
     Use Colonist Hub with +1 colony advance
  
Total: 2 fuel for 2 different bonuses
Each bonus applies to all uses of respective facility
```

**Cannot Borrow from Self:**

Must borrow from opponent:

```
Player controls Bradbury Plateau (-1 ore cost)
Player tries to activate Data Crystal to borrow Bradbury

Result: INVALID
  - Cannot borrow from yourself
  - Already have the bonus (control territory)
  - Data Crystal only useful for opponent-controlled territories
```

### Examples

**Example 1: Borrowing Lem Badlands**

```
Setup:
  Opponent controls Lem Badlands
  Player has Data Crystal
  Player has 3 fuel
  Player ships: [6, 6, 6]

Action:
  1. Activate Data Crystal fuel power
     Borrow: Lem Badlands from Opponent
     Cost: 1 fuel → 2 fuel remaining
  
  2. Dock ships [6, 6, 6] at Solar Converter
     Each ship(6): ⌈6/2⌉ + 1 (borrowed Lem) = 4 fuel
     Total: 12 fuel gained
  
Result:
  Fuel: 2 + 12 = 14
  Net gain: 14 - 1 (Data Crystal cost) = 13 net
  
Without Data Crystal:
  Would gain: 3 × 3 = 9 fuel
  Data Crystal added: 12 - 9 = 3 extra fuel
  Cost 1 fuel, gained 3 extra = +2 net profit
```

**Example 2: Borrowing Van Vogt**

```
Setup:
  Opponent controls Van Vogt Mountains
  Player has Data Crystal
  Player has 2 fuel
  Lunar Mine minimum: 6
  Player ships: [3, 4, 5]

Action:
  1. Activate Data Crystal fuel power
     Borrow: Van Vogt Mountains from Opponent
     Cost: 1 fuel → 1 fuel remaining
  
  2. Dock ships [3, 4, 5] at Lunar Mine
     Bypass minimum with borrowed Van Vogt ✓
     All 3 ships dock
     Gain: 3 ore
     New minimum: 5 (from ship values)
  
Result:
  Without Data Crystal: 0 ore (ships too low)
  With Data Crystal: 3 ore
  Excellent value!
```

**Example 3: Isolation Field Blocking**

```
Setup:
  Opponent controls Asimov Crater
  Asimov has Isolation Field (opponent placed it to block self?)
  Player has Data Crystal
  Player ships: [2, 3]

Action:
  1. Try to activate Data Crystal
     Borrow: Asimov Crater from Opponent
     Check Isolation: BLOCKED
     Cannot activate
  
Result:
  Data Crystal cannot be used
  Isolation blocks borrowing
  Player cannot use Colonist Hub bonus
```

**Example 4: Multiple Bonuses Same Turn**

```
Setup:
  Opponent A controls Lem Badlands
  Opponent B controls Asimov Crater
  Player has Data Crystal
  Player has 4 fuel
  Player ships: [5, 6, 2, 3]

Action:
  1. Activate Data Crystal (borrow Lem from Opponent A)
     Cost: 1 fuel → 3 fuel remaining
  
  2. Dock ships [5, 6] at Solar Converter
     Ship(5): ⌈5/2⌉ + 1 (Lem) = 4 fuel
     Ship(6): ⌈6/2⌉ + 1 (Lem) = 4 fuel
     Total: 8 fuel
     Fuel: 3 + 8 = 11
  
  3. Activate Data Crystal again (borrow Asimov from Opponent B)
     Cost: 1 fuel → 10 fuel remaining
  
  4. Dock ships [2, 3] at Colonist Hub
     Ships: 2
     Asimov: +1
     Total: 3 advancement
  
Result:
  Used 2 fuel to borrow 2 different bonuses
  Gained 8 fuel + 3 colony advancement
  Very efficient multi-bonus turn!
```

### Interactions

**Facilities:**
- Can borrow any territory bonus affecting facilities
- **Solar Converter:** Borrow Lem for +1 fuel/ship (Ref: Ambiguity #81, #116)
- **Lunar Mine:** Borrow Van Vogt to bypass minimum (Ref: Ambiguity #83, #116)
- **Colonist Hub:** Borrow Asimov for +1 colony advance (Ref: Ambiguity #72, #116)
- **Colony Constructor:** Borrow Bradbury for -1 ore cost (Ref: Ambiguity #73, #116)
- **Orbital Market:** Borrow Heinlein for 1:1 conversion (Ref: Ambiguity #79, #116)
- **Shipyard:** Borrow Pohl for +1 ship value (Ref: Ambiguity #82, #116)

**Territories:**
- Must be controlled by opponent (Ref: Ambiguity #116)
- Isolation Field blocks borrowing (Ref: Ambiguity #117)

**Tech Cards:**
- NO discard power (Ref: Ambiguity #118)
- Most efficient tech card (1 fuel for powerful bonuses)

**Edge Cases:**
- Must control to borrow from (Ref: Ambiguity #116)
- Isolation blocks borrowing (Ref: Ambiguity #117)
- No discard power (Ref: Ambiguity #118)
- Bonus lasts entire turn
- Can borrow multiple bonuses per turn

### Strategy Notes

**High-Priority Targets:**
1. **Van Vogt Mountains:** Bypass Lunar Mine minimum (enables 3 ore)
2. **Lem Badlands:** +1 fuel/ship at Solar Converter (3-4 ships = 3-4 fuel)
3. **Asimov Crater:** +1 colony advance (especially with multiple Colonist Hub uses)
4. **Bradbury Plateau:** -1 ore cost at Colony Constructor (saves 1 ore)
5. **Heinlein Plains:** 1:1 Orbital Market (cheap conversion)
6. **Pohl Foothills:** +1 ship value at Shipyard (value-7 ship)

**Cost-Benefit Analysis:**
```
Data Crystal costs 1 fuel
  
Van Vogt: Enables 3 ore (worth ~6 fuel) → Massive value
Lem: Adds 3-4 fuel with 3-4 ships → Net +2-3 fuel
Asimov: Adds 1 colony (worth ~3 ore) → Good value
Bradbury: Saves 1 ore → Break-even
Heinlein: Saves ship docking → Moderate value
Pohl: +1 ship value → Situational
```

**Optimal Usage:**
- Activate BEFORE using facility
- Target opponent with strongest bonuses
- Use multiple times per turn if needed
- Check for Isolation Fields first
- Best card for "catch-up" strategy

---

## 6.2.5 Gravity Manipulator

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                 GRAVITY MANIPULATOR
           Modify Multiple Ship Values
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Fuel Power

**Cost:** 3 fuel  
**Effect:** +1 or -1 to ALL ship values this turn (Ref: Ambiguity #119)

```typescript
function gravityManipulatorFuelPower(player: Player, modifier: number): void {
  // Check cost
  if (player.fuel < 3) {
    throw new Error("Need 3 fuel");
  }
  
  // Validate modifier
  if (modifier !== 1 && modifier !== -1) {
    throw new Error("Modifier must be +1 or -1");
  }
  
  // Pay cost
  player.fuel -= 3;
  
  // Modify ALL ships (Ref: Ambiguity #119)
  player.getAllShips().forEach(ship => {
    ship.value += modifier;
    // Clamp to [1, 6]
    ship.value = Math.max(1, Math.min(6, ship.value));
  });
  
  // Modification persists until next ROLL phase
}
```

### Discard Power

**Effect:** Swap ship values with opponent (Ref: Ambiguity #120)

```typescript
function gravityManipulatorDiscardPower(player: Player, opponent: Player): void {
  // Remove card permanently
  player.removeCard(CardType.GRAVITY_MANIPULATOR);
  
  // Get all ships in hand (not committed) (Ref: Ambiguity #121)
  const playerShips = player.getShipsInHand();
  const opponentShips = opponent.getShipsInHand();
  
  // Swap values (Ref: Ambiguity #120)
  const playerValues = playerShips.map(s => s.value);
  const opponentValues = opponentShips.map(s => s.value);
  
  // Assign opponent's values to player's ships
  playerShips.forEach((ship, i) => {
    if (i < opponentValues.length) {
      ship.value = opponentValues[i];
    }
  });
  
  // Assign player's values to opponent's ships
  opponentShips.forEach((ship, i) => {
    if (i < playerValues.length) {
      ship.value = playerValues[i];
    }
  });
}
```

### Timing

- **Fuel Power:** During ACTION phase, before docking ships (Ref: Ambiguity #119)
- **Discard Power:** During ACTION phase, any time (Ref: Ambiguity #120)
- **Duration (Fuel):** Until next ROLL phase

### Special Rules

**Affects ALL Ships (Ref: Ambiguity #119):**

Fuel power modifies EVERY ship simultaneously:

```
Player ships: [2, 3, 5, 6]
Activate Gravity Manipulator: +1

Result: [3, 4, 6, 6]
  Ship(2) → 3
  Ship(3) → 4
  Ship(5) → 6
  Ship(6) → 6 (clamped at max)
  
All ships boosted together!
```

**Value Swap Details (Ref: Ambiguity #120, #121):**

Discard power swaps values between player and opponent:

```
Player ships in hand: [2, 4, 6]
Opponent ships in hand: [5, 5, 6]

Activate Gravity Manipulator discard:
  Player ships: [2, 4, 6] → [5, 5, 6]
  Opponent ships: [5, 5, 6] → [2, 4, 6]
  
Values swapped!

Only ships IN HAND affected (Ref: Ambiguity #121):
  Ships at facilities NOT swapped
  Ships in Maintenance Bay NOT swapped
  Only uncommitted hand ships
```

**Unequal Fleet Sizes:**

If fleets different sizes, swap what's available:

```
Player ships in hand: [2, 3]
Opponent ships in hand: [6, 6, 6, 6]

Swap:
  Player [2, 3] → [6, 6] (take first 2 opponent values)
  Opponent [6, 6, 6, 6] → [2, 3, 6, 6] (first 2 swapped, rest unchanged)
  
Partial swap when sizes differ
```

**Clamping Still Applies:**

Fuel power cannot exceed [1, 6]:

```
Player ships: [1, 6, 6, 6]
Activate Gravity Manipulator: +1

Result: [2, 6, 6, 6]
  Ship(1) → 2 ✓
  Ship(6) → 6 (clamped, no change)
  
3 ships already at max (wasted)
Only 1 ship actually boosted
```

### Examples

**Example 1: Mass Ship Boost**

```
Setup:
  Player has Gravity Manipulator
  Player has 5 fuel
  Player ships: [2, 3, 4, 5]
  Alien Artifact needs total ≥ 8

Action:
  1. Activate Gravity Manipulator fuel power
     Modifier: +1
     Cost: 3 fuel → 2 fuel remaining
     Ships: [2, 3, 4, 5] → [3, 4, 5, 6]
  
  2. Dock ships [3, 5] at Alien Artifact
     Total: 3 + 5 = 8 ✓
     Claim tech card
  
Without Gravity Manipulator:
  Best pair: [4, 5] = 9 ✓ (would still work)
  
But: All ships improved!
  Can use better combinations
  More flexibility
```

**Example 2: Strategic Value Swap**

```
Setup:
  Player has Gravity Manipulator
  Player ships in hand: [1, 1, 2]
  Opponent ships in hand: [5, 6, 6]
  Player rolled poorly, opponent rolled well

Action:
  Discard Gravity Manipulator
  Swap ship values
  
Effect:
  Player ships: [1, 1, 2] → [5, 6, 6] ✓
  Opponent ships: [5, 6, 6] → [1, 1, 2] ✗
  
Result:
  Player gained 3 high-value ships
  Opponent crippled with low values
  MAJOR swing!
  Opponent turn severely hampered
```

**Example 3: Partial Swap (Unequal Sizes)**

```
Setup:
  Player has Gravity Manipulator
  Player has Relic Ship (4 ships total)
  Player ships in hand: [2, 3, 4, Relic(5)]
  Opponent (3 ships): [6, 6, 6]

Action:
  Discard Gravity Manipulator
  Swap ship values
  
Effect:
  Player ships: [2, 3, 4, 5] → [6, 6, 6, 5]
    First 3 swapped, Relic(5) unchanged
  Opponent ships: [6, 6, 6] → [2, 3, 4]
    All 3 swapped
  
Result:
  Player gained 3 high-value ships (6, 6, 6)
  Kept Relic at value 5 (good)
  Opponent lost all high values
```

**Example 4: Lunar Mine Mass Boost**

```
Setup:
  Player has Gravity Manipulator
  Player has 4 fuel
  Lunar Mine minimum: 4
  Player ships: [3, 3, 3, 4]

Action:
  1. Activate Gravity Manipulator fuel power
     Modifier: +1
     Cost: 3 fuel → 1 fuel remaining
     Ships: [3, 3, 3, 4] → [4, 4, 4, 5]
  
  2. Dock ships [4, 4, 4, 5] at Lunar Mine
     All ships > 4 (wait, 4 is not > 4!)
     Only ship(5) can dock
     Ships [4, 4, 4] = 4, need > 4
  
Actually only ship(5) docks:
  Gain: 1 ore
  New minimum: 5
  
Should have boosted by +2 (need 3+2=5 to exceed minimum 4)
But cannot boost twice in one activation
```

### Interactions

**Facilities:**
- **All facilities:** Mass boost affects all ship values
- **Lunar Mine:** Can boost all ships to exceed minimum
- **Alien Artifact:** Easier to reach total ≥ 8

**Territories:**
- No direct territory interactions

**Tech Cards:**
- **Booster Pod:** Booster modifies single ship, Gravity modifies all
  - Booster: 2 fuel for 1 ship
  - Gravity: 3 fuel for ALL ships
  - Gravity more efficient with 3+ ships
- **Stasis Beam:** Similar to Gravity -1 modifier
- **Temporal Warper:** Re-roll vs. modify (different strategies)

**Edge Cases:**
- Affects ALL ships at once (Ref: Ambiguity #119)
- Swap only affects ships in hand (Ref: Ambiguity #121)
- Cannot exceed [1, 6] range
- Unequal fleets = partial swap
- Modification persists until next ROLL

### Strategy Notes

**Fuel Power:**
- Use when most ships need same adjustment
- Best with 3+ ships (cost 3 fuel, affects all)
- Check how many ships at min/max (avoid waste)
- Boost all to exceed Lunar Mine minimum
- Mass decrease to match Colony Constructor pairs

**Discard Power:**
- VERY powerful swing mechanism
- Use when opponent has significantly better rolls
- Devastating if opponent has all 6s, player has all 1s
- Only affects ships in hand (not committed)
- Choose opponent with best values

**Comparison to Booster Pod:**
```
Booster Pod: 2 fuel for 1 ship (+1 or -1)
Gravity Manipulator: 3 fuel for ALL ships (+1 or -1)

Break-even: 2 ships
  2 ships × 2 fuel = 4 fuel (Booster Pod)
  1 activation × 3 fuel = 3 fuel (Gravity)
  Gravity more efficient!

With 4 ships:
  4 ships × 2 fuel = 8 fuel (Booster Pod)
  1 activation × 3 fuel = 3 fuel (Gravity)
  Gravity MUCH more efficient!
```

**Optimal Usage:**
- Fuel power when boosting 2+ ships
- Discard when opponent rolled 5-6 average, player rolled 1-2
- Check for ships already at min/max (wasted adjustments)
- Combine with Lunar Mine for mass ore generation

---

## 6.2.6 Holographic Decoy

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                 HOLOGRAPHIC DECOY
          Protect Ships from Opponent Powers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Fuel Power

**Cost:** 1 fuel  
**Effect:** Shield one ship from opponent effects this turn (Ref: Ambiguity #122)

```typescript
function holographicDecoyFuelPower(player: Player, ship: Ship): void {
  // Check cost
  if (player.fuel < 1) {
    throw new Error("Need 1 fuel");
  }
  
  // Pay cost
  player.fuel -= 1;
  
  // Grant shield (Ref: Ambiguity #122)
  ship.isShielded = true;
  
  // Shield lasts until end of turn
  // Blocks: Plasma Cannon, Raiders' Outpost, Stasis Beam (Ref: Ambiguity #123)
}
```

### Discard Power

**Effect:** Shield ALL ships from opponent effects this turn (Ref: Ambiguity #124)

```typescript
function holographicDecoyDiscardPower(player: Player): void {
  // Remove card permanently
  player.removeCard(CardType.HOLOGRAPHIC_DECOY);
  
  // Shield all ships (Ref: Ambiguity #124)
  player.getAllShips().forEach(ship => {
    ship.isShielded = true;
  });
  
  // Shields last until end of turn
}
```

### Timing

- **Fuel Power:** During ACTION phase, before opponent actions (Ref: Ambiguity #122)
- **Discard Power:** During ACTION phase, before opponent actions (Ref: Ambiguity #124)
- **Duration:** Entire turn (until CLEANUP)

### Special Rules

**What Shield Blocks (Ref: Ambiguity #123):**

Shield protects from opponent card powers:

```typescript
// Shielded ships immune to:
// - Plasma Cannon (discard: remove ship)
// - Raiders' Outpost (remove ship from facility)
// - Stasis Beam (fuel: decrease ship value)
// - Gravity Manipulator (discard: swap values) (Ref: Ambiguity #125)

function plasmaCannon(attacker: Player, target: Ship): void {
  // Check shield (Ref: Ambiguity #123)
  if (target.isShielded) {
    throw new Error("Ship is shielded! Cannot target.");
  }
  
  // Remove ship
  removeShipFromGame(target);
}
```

**Gravity Manipulator Swap Blocked (Ref: Ambiguity #125):**

Shielded ships NOT swapped by Gravity Manipulator:

```
Player shields ship(6) with Holographic Decoy
Opponent uses Gravity Manipulator discard (swap values)

Result:
  Player's shielded ship(6): NOT swapped (keeps 6)
  Player's other ships: Swapped normally
  
Shield blocks Gravity Manipulator swap effect
```

**Shields Last Until End of Turn:**

```
Turn sequence:
  1. Player activates Holographic Decoy (shield ship)
  2. Opponent uses Plasma Cannon: BLOCKED
  3. Opponent uses Raiders' Outpost: BLOCKED
  4. CLEANUP phase: Shield expires
  
Next turn:
  Ship no longer shielded (must re-activate)
```

**Multiple Ships Shielded:**

Can shield multiple ships with multiple fuel power uses:

```
Player has Holographic Decoy
Player has 3 fuel
Player ships: [5, 6, 6]

Action:
  1. Shield ship(6) #1 → Cost 1 fuel
  2. Shield ship(6) #2 → Cost 1 fuel
  3. Shield ship(5) → Cost 1 fuel
  
All 3 ships shielded (cost 3 fuel)

OR: Discard Holographic Decoy → All ships shielded (cost card)
```

### Examples

**Example 1: Blocking Plasma Cannon**

```
Setup:
  Player has Holographic Decoy
  Player has 2 fuel
  Player has Relic Ship (value 6)
  Opponent has Plasma Cannon

Action:
  1. Player activates Holographic Decoy fuel power
     Target: Relic Ship
     Cost: 1 fuel → 1 fuel remaining
     Relic Ship shielded
  
Opponent's turn:
  Try to use Plasma Cannon discard on Relic Ship
  Check shield: BLOCKED
  Plasma Cannon cannot target shielded ship
  
Result:
  Relic Ship protected
  Opponent wasted Plasma Cannon or chose different target
```

**Example 2: Blocking Raiders' Outpost**

```
Setup:
  Player has ships [5, 6] at Lunar Mine (establishing minimum 6)
  Opponent planning to use Raiders' Outpost (remove player's ships)
  Player has Holographic Decoy
  Player has 3 fuel

Action:
  1. Shield ship(6) at Lunar Mine
     Cost: 1 fuel
  2. Shield ship(5) at Lunar Mine
     Cost: 1 fuel
  
Opponent's turn:
  Use Raiders' Outpost (sequential raid)
  Try to remove player's ships from Lunar Mine
  All ships shielded: BLOCKED
  Cannot remove shielded ships
  
Result:
  Player's Lunar Mine minimum preserved
  Opponent wasted Raiders' Outpost action
```

**Example 3: Mass Shield with Discard**

```
Setup:
  Player has Holographic Decoy
  Player ships: [5, 5, 6, Relic(6)]
  Multiple opponents with attack cards
  Player anticipating heavy opponent interference

Action:
  Discard Holographic Decoy
  All ships shielded for entire turn
  
Opponent A turn:
  Try Plasma Cannon: BLOCKED (all ships shielded)
  
Opponent B turn:
  Try Raiders' Outpost: BLOCKED (all ships shielded)
  
Opponent C turn:
  Try Stasis Beam: BLOCKED (all ships shielded)
  
Result:
  Player's entire fleet protected for turn
  All opponent attacks neutralized
  Worth discarding card
```

**Example 4: Gravity Manipulator Swap Protection**

```
Setup:
  Player has Holographic Decoy
  Player ships in hand: [1, 5, 6]
  Opponent ships in hand: [6, 6, 6]
  Opponent has Gravity Manipulator

Action:
  1. Player shields ship(6)
     Cost: 1 fuel
  
Opponent's turn:
  Discard Gravity Manipulator (swap values)
  
Effect:
  Player ship(1): Swap with opponent ship(6) → Becomes 6
  Player ship(5): Swap with opponent ship(6) → Becomes 6
  Player ship(6): SHIELDED → Stays 6 (not swapped)
  
  Opponent ships: [1, 5, 6] (took player's unshielded values)
  
Result:
  Player ships: [6, 6, 6] (all high!)
  Shielded ship protected from swap
  Other ships improved by swap (beneficial here!)
```

### Interactions

**Facilities:**
- **Raiders' Outpost:** Shielded ships cannot be removed (Ref: Ambiguity #123)
- No other facilities directly interact

**Tech Cards:**
- **Plasma Cannon:** Cannot target shielded ships (Ref: Ambiguity #123)
- **Stasis Beam:** Cannot decrease shielded ship values (Ref: Ambiguity #123)
- **Gravity Manipulator:** Cannot swap shielded ships (Ref: Ambiguity #125)
- **Temporal Warper:** No interaction (doesn't target opponents)

**Edge Cases:**
- Shield blocks opponent powers only (Ref: Ambiguity #122)
- Shield lasts until end of turn
- Discard shields ALL ships (Ref: Ambiguity #124)
- Gravity swap blocked for shielded ships (Ref: Ambiguity #125)
- Can shield multiple ships with multiple fuel uses

### Strategy Notes

**Fuel Power:**
- Use when opponent has specific attack card
- Shield high-value ships (6s, Relic Ship)
- Shield ships at key facilities (Lunar Mine minimum)
- Cheap (1 fuel per ship)
- Reactive defense

**Discard Power:**
- Use when facing multiple opponent attacks
- Use when entire fleet at risk
- Protects all ships for entire turn
- Worth discarding if prevents major losses
- Proactive defense

**When to Use:**
1. **Opponent has Plasma Cannon:** Shield Relic Ship or high-value ships
2. **Opponent has Raiders' Outpost:** Shield ships at Lunar Mine
3. **Opponent has Gravity Manipulator:** Shield best ships to prevent swap
4. **Opponent has Stasis Beam:** Shield ships needed for facility thresholds
5. **Multi-opponent game:** Discard to protect from all attacks

**Priority Targets to Shield:**
1. **Relic Ship:** Cannot be replaced if removed
2. **Ships at Lunar Mine:** Preserve minimum requirement
3. **Value 6 ships:** Highest utility
4. **Ships at Maintenance Bay:** Persist to next turn (shield before GATHER)

---

**End of Section 6 Part 2**

*Continues in Section 6: Alien Tech Cards (Part 3).*

---

## Cross-References

- **Ambiguities Resolved**: #116-125 (Data Crystal, Gravity Manipulator, Holographic Decoy)
  
- **Related Sections**:
  - Section 3 (Facilities): Raiders' Outpost, Lunar Mine, Solar Converter
  - Section 4 (Territories): Territory bonuses that can be borrowed
  - Section 5 (Field Generators): Isolation Field blocks Data Crystal
  - Section 7 (Advanced Rules): Ship protection mechanics
