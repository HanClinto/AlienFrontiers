# Section 5: Field Generators

**Pages 38-41 of Complete Rules Reference**

---

## 5.1 Field Generator System

### Overview

Field generators are **special cards** that players can place on territories to **block or restrict** opponent actions. There are **3 types**:

1. **Isolation Field** - Blocks territory bonus usage
2. **Positron Field** - Removes player colonies from territory
3. **Repulsor Field** - Prevents new colony placement

### Acquisition

Field generators acquired from:

```typescript
// Field generators come from tech cards
// Several tech cards have "discard power" to place field generators:
// - Booster Pod (discard) → Place field generator
// - Other cards with similar powers
```

### Placement Rules

```typescript
function placeFieldGenerator(
  player: Player,
  fieldType: FieldType,
  territory: Territory
): void {
  // Check if territory already has this field type (Ref: Ambiguity #85)
  if (territory.hasFieldGenerator(fieldType)) {
    throw new Error(`${territory.name} already has ${fieldType}`);
  }
  
  // Place field generator
  territory.addFieldGenerator(fieldType, player);
  
  // Apply immediate effects (Positron only)
  if (fieldType === FieldType.POSITRON) {
    applyPositronEffect(territory, player);
  }
  
  // Update territory control
  updateTerritoryControl(territory);
}
```

### Removal

Field generators removed when:

```typescript
// Removal conditions:
// 1. Player uses Booster Pod discard power to remove
// 2. No other removal mechanism (permanent until removed)
```

---

## 5.2 Isolation Field

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   ISOLATION FIELD
        Blocks Territory Bonus for ALL Players
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Effect

**No player can use territory bonus while Isolation Field present**

```typescript
function hasBonus(player: Player, territory: TerritoryType): boolean {
  const territoryObj = getTerritory(territory);
  
  // Check Isolation Field (Ref: Ambiguity #86)
  if (territoryObj.hasFieldGenerator(FieldType.ISOLATION)) {
    return false; // Bonus blocked for ALL players
  }
  
  // Check control
  return territoryObj.controlledBy === player;
}
```

### Timing

- **When Applied:** Continuously while present
- **Affects:** ALL players (including placer)
- **Duration:** Until removed

### Special Rules

**Blocks ALL Players (Ref: Ambiguity #86)**

Even controlling player cannot use bonus:

```
Setup:
  Player A controls Lem Badlands (3 colonies)
  Player B places Isolation Field on Lem Badlands

Effect:
  Player A still CONTROLS Lem (+1 VP)
  But cannot use +1 fuel/ship bonus
  Player B also cannot use bonus
  
Result:
  Territory control = VP only
  No functional bonus
```

**Control Still Matters**

Territory control grants VP even if bonus blocked:

```
Lem Badlands with Isolation Field:
  Player A: 3 colonies (controls)
  Player B: 1 colony
  
  Player A gets +1 VP (territory control)
  Player A CANNOT use +1 fuel/ship bonus (Isolation)
  Player B gets 0 VP
  Player B also cannot use bonus (doesn't control + Isolation)
```

**Stacking with Other Fields**

Can have multiple field types on same territory:

```typescript
function canPlaceFieldGenerator(
  territory: Territory,
  fieldType: FieldType
): boolean {
  // Cannot place duplicate of same type (Ref: Ambiguity #85)
  if (territory.hasFieldGenerator(fieldType)) {
    return false;
  }
  
  // CAN place different types (Ref: Ambiguity #88)
  return true;
}

// Example: Territory can have Isolation + Repulsor
```

### Examples

**Example 1: Blocking Lem Badlands**

```
Setup:
  Opponent controls Lem Badlands
  Opponent gets +1 fuel/ship at Solar Converter
  Player has Booster Pod tech card

Action:
  Discard Booster Pod → Place Isolation Field on Lem Badlands

Effect:
  Opponent loses +1 fuel/ship bonus
  Opponent still controls Lem (+1 VP)
  
Next turn:
  Opponent docks ships [6, 6, 6] at Solar Converter
  Without Isolation: 3 × (3 + 1) = 12 fuel
  With Isolation: 3 × 3 = 9 fuel
  Lost 3 fuel!
```

**Example 2: Blocking Asimov Crater**

```
Setup:
  Player A controls Asimov Crater
  Player A gets +1 colony advance at Colonist Hub
  Player B places Isolation Field on Asimov

Turn sequence:
  Player A uses Colonist Hub:
    Dock ships [3, 3] → 2 ships
    Base advancement: 2
    Asimov bonus: BLOCKED (Isolation Field)
    Total: 2 advancement (not 3!)
    
Lost 1 colony advancement per Colonist Hub use
```

**Example 3: Self-Blocking**

```
Setup:
  Player controls Van Vogt Mountains
  Player uses Van Vogt to bypass Lunar Mine minimum
  Opponent places Isolation Field on Van Vogt

Next turn:
  Player tries to use Lunar Mine:
    Ship(3), minimum is 5
    Van Vogt bypass BLOCKED (Isolation Field)
    Cannot dock ship(3)
    
  Player still controls Van Vogt (+1 VP)
  But cannot use bypass bonus
```

**Example 4: Multiple Fields**

```
Setup:
  Player controls Bradbury Plateau
  Opponent places Isolation Field on Bradbury
  Later, opponent places Repulsor Field on Bradbury

Effect:
  Isolation: Blocks -1 ore cost bonus
  Repulsor: Blocks colony placement
  
  Player uses Colony Constructor targeting Bradbury:
    Cost: 3 ore (no Bradbury bonus, Isolation blocks it)
    Placement: BLOCKED (Repulsor Field)
    Lost 3 ore with no colony!
    
Both fields active simultaneously (Ref: Ambiguity #88)
```

### Interactions

**Territories:**
- Blocks ALL territory bonuses (Asimov, Bradbury, Heinlein, Lem, Pohl, Van Vogt)
- Does NOT block Burroughs Relic Ship purchase (special case)

**Tech Cards:**
- **Data Crystal:** Cannot borrow bonus from territory with Isolation
- **Booster Pod (discard):** Can place or remove Isolation Field

**Field Generators:**
- Can stack with Positron and Repulsor (Ref: Ambiguity #88)
- Cannot place duplicate Isolation (Ref: Ambiguity #85)

**Edge Cases:**
- Affects ALL players including placer (Ref: Ambiguity #86)
- Territory control still grants VP
- Bonus blocked immediately when placed
- Lasts until removed

---

## 5.3 Positron Field

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   POSITRON FIELD
    Removes ALL of Placer's Colonies from Territory
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Effect

**When placed, removes ALL placer's colonies from target territory**

```typescript
function applyPositronEffect(territory: Territory, placer: Player): void {
  // Remove placer's colonies (Ref: Ambiguity #87)
  const placerColonies = territory.colonies.filter(c => c.owner === placer);
  
  placerColonies.forEach(colony => {
    territory.removeColony(colony);
    placer.returnColony(colony); // Back to player supply
  });
  
  // Update control (may change with colonies removed)
  const newControl = determineStrictMajority(territory);
  territory.controlledBy = newControl;
  
  // Recalculate VP (control may have changed)
  recalculateAllVictoryPoints();
}
```

### Timing

- **When Applied:** IMMEDIATELY when placed
- **Duration:** One-time effect (colonies removed, field stays)
- **Removal Effect:** Removes placer's colonies only

### Special Rules

**Removes Placer's Colonies Only (Ref: Ambiguity #87)**

Only removes colonies belonging to player who placed field:

```
Setup:
  Territory colonies: [Player A, Player A, Player B]
  Player A places Positron Field

Effect:
  Remove Player A's 2 colonies
  Player B's 1 colony stays
  
Result:
  Territory colonies: [Player B]
  Player B now controls (1 > 0, strict majority)
  Player A gave territory to Player B!
```

**Self-Destructive Effect**

Positron typically HURTS the placer:

```
Strategic use case:
  Player A controls territory (3 colonies)
  Player B has 2 colonies on same territory
  Player A is about to lose game
  
  Player A places Positron on territory:
    Remove own 3 colonies
    Player B still has 2 colonies
    Player B now controls (2 > 0)
    Player A denied opponent control briefly? No!
    
Actually harmful: Never place Positron on territory where you have colonies!
```

**Correct Usage**

Place on territory where you have NO colonies:

```
Setup:
  Territory colonies: [Opponent A, Opponent A, Opponent B]
  Player has 0 colonies on territory
  Opponent A controls (2 > 1)

Action:
  Player places Positron Field

Effect:
  Remove Player's colonies (0 colonies, no effect on Player!)
  Opponent colonies stay (field only removes placer's)
  
Wait, this doesn't help...

Actual Positron Rule (Clarification):
  Positron removes ALL colonies from territory (not just placer's)
  Re-read original rules!
```

**CORRECTION (Ref: Ambiguity #87):**

Upon review, Positron likely removes ALL colonies:

```typescript
function applyPositronEffect(territory: Territory, placer: Player): void {
  // CORRECTED: Remove ALL colonies from territory
  const allColonies = territory.colonies.slice();
  
  allColonies.forEach(colony => {
    territory.removeColony(colony);
    colony.owner.returnColony(colony);
  });
  
  // Territory now has 0 colonies
  territory.controlledBy = null; // No control
  
  // Recalculate VP
  recalculateAllVictoryPoints();
}
```

Let's use ambiguity document to clarify:

*Checking ambiguity #87...*

**Ambiguity #87 Resolution:**

Positron removes placer's colonies only (original interpretation correct):

```
Positron Field effect:
  Remove ALL of PLACER's colonies from territory
  Other players' colonies remain
  
Use case:
  Player has colonies on territory where opponents also have colonies
  Player wants to "reset" by removing own colonies
  Rarely useful (self-destructive)
  
Alternative interpretation:
  Maybe Positron is used OFFENSIVELY
  But rules say "placer's colonies" → self-targeting
```

### Examples

**Example 1: Self-Destructive Use**

```
Setup:
  Lem Badlands colonies: [Player, Player, Player]
  Player controls Lem (+1 VP, +1 fuel/ship)

Action:
  Player places Positron Field on Lem Badlands (accidentally?)

Effect:
  Remove Player's 3 colonies
  Lem Badlands colonies: []
  No control (Player lost +1 VP and bonus)
  
Result:
  Player lost territory control
  Positron is HARMFUL to placer!
```

**Example 2: Denying Opponent**

```
Setup:
  Asimov Crater colonies: [Player, Opponent, Opponent]
  Opponent controls (2 > 1, strict majority)
  Player cannot catch up (only 1 colony slot left)

Action:
  Player places Positron Field on Asimov

Effect:
  Remove Player's 1 colony
  Opponent's 2 colonies remain
  Asimov colonies: [Opponent, Opponent]
  Opponent STILL controls
  
Result:
  Positron did NOT help (made it worse!)
  Player should NOT have used Positron
```

**Example 3: Correct Use Case?**

```
Scenario: When is Positron useful?

Option A: Player has colonies on territory about to be lost
  - Opponent about to place winning colony
  - Player removes own colonies preemptively?
  - Doesn't prevent opponent from placing

Option B: Player wants to free up colony tokens
  - Has all 7 colonies placed
  - Wants to place colony elsewhere
  - Removes own colony from low-value territory
  - Frees up token for better territory
  
Option B makes sense!
```

**Example 4: Freeing Colony Tokens**

```
Setup:
  Player has 7 colonies placed (maximum)
  Player colonies spread across multiple territories
  Player wants to place colony on Burroughs (high value)
  
  Clarke Chasm colonies: [Player, Opponent, Opponent]
  Player doesn't control Clarke (low importance)

Action:
  Place Positron Field on Clarke Chasm

Effect:
  Remove Player's 1 colony from Clarke
  Player now has 6 colonies placed
  Can place 7th colony on Burroughs!
  
Result:
  Strategic use of Positron to reallocate colony
```

### Interactions

**Territories:**
- Removes placer's colonies from any territory (Ref: Ambiguity #87)
- May change territory control

**Facilities:**
- **Colony Constructor:** Can place colony after Positron removes old one
- **Colonist Hub:** Can build up new colonies after removal
- **Terraforming Station:** Direct placement bypasses Positron

**Tech Cards:**
- **Booster Pod (discard):** Can place or remove Positron

**Field Generators:**
- Can stack with Isolation and Repulsor (Ref: Ambiguity #88)
- Positron + Repulsor: Remove colonies, then prevent new placement

**Edge Cases:**
- Removes only placer's colonies (Ref: Ambiguity #87)
- One-time effect (immediate)
- Useful for freeing colony tokens
- Generally self-destructive

---

## 5.4 Repulsor Field

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                   REPULSOR FIELD
         Prevents Colony Placement on Territory
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Effect

**No player can place colonies on territory while Repulsor Field present**

```typescript
function canPlaceColony(player: Player, territory: Territory): boolean {
  // Check Repulsor Field (Ref: Ambiguity #94)
  if (territory.hasFieldGenerator(FieldType.REPULSOR)) {
    return false; // BLOCKED
  }
  
  // Check capacity
  if (territory.colonies.length >= 3) {
    return false; // Full
  }
  
  return true;
}

function colonyConstructorEffect(player: Player, territory: Territory): void {
  // Check Repulsor before placing
  if (territory.hasFieldGenerator(FieldType.REPULSOR)) {
    // Ore still spent! (Ref: Ambiguity #94)
    const cost = colonyConstructorCost(player);
    player.ore -= cost;
    
    // No colony placed
    throw new Error(`Cannot place colony: Repulsor Field on ${territory.name}`);
  }
  
  // Normal placement
  territory.addColony(player);
  player.ore -= colonyConstructorCost(player);
}
```

### Timing

- **When Applied:** Continuously while present
- **Affects:** ALL players (including placer)
- **Duration:** Until removed

### Special Rules

**Blocks ALL Colony Placement (Ref: Ambiguity #94)**

Affects all facilities that place colonies:

```
Blocked facilities:
  - Colony Constructor (pair of ships, costs ore)
  - Terraforming Station (≥3 ships, total ≥20)
  - Colonist Hub (does NOT place colonies, only advances track)
  
Colonist Hub works normally (only builds toward placement)
```

**Cost Still Charged (Ref: Ambiguity #94)**

Facility costs paid even if Repulsor blocks:

```
Colony Constructor:
  Cost: 3 ore (2 with Bradbury)
  Check Repulsor: BLOCKED
  Pay: 3 ore (still charged!)
  Effect: No colony placed (waste!)

Terraforming Station:
  Cost: 1 ship forfeited
  Check Repulsor: BLOCKED
  Pay: Ship forfeited permanently (still charged!)
  Effect: No colony placed (MAJOR waste!)
```

**Colonist Hub Not Affected**

Colonist Hub advances track, doesn't place colonies:

```
Player uses Colonist Hub with Repulsor on all territories:
  Dock ships [3, 3, 3]
  Advance colony track by 3
  No colonies placed directly
  Repulsor does NOT block
  
Later, when track reaches milestone:
  Player chooses territory to place colony
  Check Repulsor: BLOCKED (cannot place)
  Colony stays on track (unplaced)
```

**Strategic Use**

Place on high-value territories:

```
Priority targets:
  1. Burroughs Desert (deny Relic Ship access via control)
  2. Lem Badlands (deny +1 fuel/ship)
  3. Asimov Crater (deny +1 colony advance)
  4. Bradbury Plateau (deny -1 ore cost)
  
Block opponent from gaining control
```

### Examples

**Example 1: Blocking Colony Constructor**

```
Setup:
  Opponent about to use Colony Constructor on Heinlein
  Player has Booster Pod tech card

Action:
  Discard Booster Pod → Place Repulsor Field on Heinlein

Opponent's turn:
  Dock ships [4, 4] at Colony Constructor
  Choose territory: Heinlein Plains
  Check Repulsor: BLOCKED!
  Pay: 3 ore (still charged)
  Effect: No colony placed
  Ships → Maintenance Bay (normal)
  
Result:
  Opponent lost 3 ore and 2 ships
  No colony gained
  Major disruption!
```

**Example 2: Terraforming Disaster**

```
Setup:
  Opponent preparing to use Terraforming Station
  Opponent ships: [5, 5, 5, 5] (total 20)
  Player places Repulsor Field on target territory

Opponent's turn:
  Dock ships [5, 5, 5, 5] at Terraforming Station
  Choose territory: Pohl Foothills (has Repulsor!)
  Choose to forfeit: ship(5)
  Check Repulsor: BLOCKED!
  
Effect:
  Ship(5) forfeited permanently (LOST!)
  Ships [5, 5, 5] → Maintenance Bay
  No colony placed
  
Result:
  Opponent lost 1 ship permanently
  No colony gained
  CATASTROPHIC LOSS
  
Lesson: ALWAYS check Repulsor Fields before Terraforming!
```

**Example 3: Colonist Hub Works**

```
Setup:
  All territories have Repulsor Fields (opponent placed 8 total, impossible!)
  Actually: Only 3 field generators total (Isolation, Positron, Repulsor)
  
Revised: Heinlein has Repulsor Field
  Player uses Colonist Hub

Action:
  Dock ships [2, 2, 2] at Colonist Hub
  Advance colony track by 3
  Repulsor does NOT block (Colonist Hub doesn't place directly)
  
Later:
  Track reaches milestone (5th colony)
  Player chooses territory: Heinlein Plains
  Check Repulsor: BLOCKED
  Cannot place colony
  Colony stays on track (unplaced)
```

**Example 4: Strategic Defense**

```
Setup:
  Player controls Burroughs Desert (Relic Ship)
  Burroughs colonies: [Player, Player, Opponent]
  Player has strict majority (2 > 1)
  Opponent about to place 2nd colony on Burroughs

Action:
  Place Repulsor Field on Burroughs Desert

Effect:
  Opponent cannot place colonies on Burroughs
  Player retains control (Relic Ship safe)
  Opponent must attack different territory
  
Result:
  Defended critical territory
  Maintained Relic Ship access
```

### Interactions

**Facilities:**
- **Colony Constructor:** BLOCKED (Ref: Ambiguity #94)
- **Terraforming Station:** BLOCKED (Ref: Ambiguity #94)
- **Colonist Hub:** NOT blocked (doesn't place directly)

**Tech Cards:**
- **Booster Pod (discard):** Can place or remove Repulsor
- **Alien Monument/City:** Placement blocked by Repulsor

**Territories:**
- Blocks colony placement on any territory
- Particularly effective on high-value territories

**Field Generators:**
- Can stack with Isolation and Positron (Ref: Ambiguity #88)
- Isolation + Repulsor: Block bonus AND placement

**Edge Cases:**
- Blocks all colony placement methods (Ref: Ambiguity #94)
- Costs still charged if blocked (major waste)
- Colonist Hub not affected (indirect placement)
- Affects ALL players including placer

---

## 5.5 Field Generator Stacking

### Stacking Rules (Ref: Ambiguity #85, #88)

```typescript
function canPlaceFieldGenerator(
  territory: Territory,
  fieldType: FieldType
): boolean {
  // Cannot place duplicate of same type (Ref: Ambiguity #85)
  if (territory.hasFieldGenerator(fieldType)) {
    return false; // Already has this type
  }
  
  // CAN place different types (Ref: Ambiguity #88)
  return true;
}

// Maximum: 3 fields per territory (1 of each type)
// Isolation + Positron + Repulsor all on same territory
```

### Combination Effects

**Isolation + Repulsor:**
```
Effect: Block bonus AND colony placement
Use: Completely shut down territory
  - No functional bonus
  - No new colonies
  - Control matters for VP only
```

**Positron + Repulsor:**
```
Effect: Remove colonies AND prevent new ones
Use: Clear territory and lock it
  - Removes placer's colonies
  - Blocks future placement
  - Opponent cannot reclaim
```

**Isolation + Positron:**
```
Effect: Block bonus AND remove placer's colonies
Use: Sabotage own territory (rare)
  - Removes own colonies
  - Blocks bonus for everyone
  - Self-destructive
```

**All Three:**
```
Effect: Block bonus, remove colonies, prevent placement
Use: Total shutdown (requires 3 Booster Pods to place!)
  - Territory completely locked
  - No functional value
  - VP from control only
```

### Strategic Priorities

**Offensive:**
1. **Repulsor** on opponent's target territory (block placement)
2. **Isolation** on opponent's controlled territory (block bonus)
3. **Positron** rarely (self-destructive)

**Defensive:**
1. **Repulsor** on own controlled territory (prevent opponent takeover)
2. **Isolation** on opponent's territory (deny them bonus)

### Removal

Only method: **Booster Pod discard power**

```typescript
function removeFieldGenerator(
  player: Player,
  territory: Territory,
  fieldType: FieldType
): void {
  // Requires Booster Pod discard
  if (!player.hasCard(CardType.BOOSTER_POD)) {
    throw new Error("Need Booster Pod to remove field generator");
  }
  
  // Discard Booster Pod
  player.discardCard(CardType.BOOSTER_POD);
  
  // Remove field generator
  territory.removeFieldGenerator(fieldType);
  
  // If Repulsor removed, colonies can be placed again
  // If Isolation removed, bonuses work again
  // Positron removal has no effect (already removed colonies)
}
```

---

## 5.6 Field Generator Summary

### Quick Reference

| Field Type | Effect | Target | Duration | Removal |
|------------|--------|--------|----------|---------|
| **Isolation** | Block territory bonus | All players | Continuous | Booster Pod |
| **Positron** | Remove placer's colonies | Placer only | One-time | Booster Pod* |
| **Repulsor** | Block colony placement | All players | Continuous | Booster Pod |

*Positron removal doesn't restore colonies (already removed)

### Placement Priority

**High-Value Targets:**
1. **Burroughs Desert** (Relic Ship, control-dependent)
2. **Lem Badlands** (+1 fuel/ship, resource generation)
3. **Asimov Crater** (+1 colony advance, rushing)
4. **Bradbury Plateau** (-1 ore cost, economy)

**Field Type Choice:**
- **Repulsor:** Prevent opponent from gaining control
- **Isolation:** Deny opponent bonus if they already control
- **Positron:** Free up own colonies (rarely)

### Counter-Strategies

**Dealing with Field Generators:**

1. **Remove with Booster Pod:** Discard Booster Pod to remove field
2. **Target Different Territory:** Place colonies elsewhere
3. **Use Colonist Hub:** Indirect placement (bypasses Repulsor)
4. **Control for VP:** Territory control still grants VP even if bonus blocked

---

**End of Section 5: Field Generators**

*Continues in Section 6: Alien Tech Cards (Part 1).*

---

## Cross-References

- **Ambiguities Resolved**: #85-88, #94 (Field generator stacking, effects, Repulsor blocking)
  
- **Related Sections**:
  - Section 3 (Facilities): Colony Constructor, Terraforming Station interactions
  - Section 4 (Territories): Territory control and bonuses
  - Section 6 (Alien Tech Cards): Booster Pod placement/removal
  - Section 8 (Edge Cases): Field generator edge cases
