# Section 6.2: Alien Tech Cards (Part 4) & Summary

## 6.2.10 Resource Cache

**Card Type:** Alien Tech Card
**Acquisition:** Alien Artifact facility (total ship value ≥ 8)
**Visibility:** Public (all players can see)

### Fuel Power: Convert Resources

**Cost:** 1 fuel
**Timing:** ACTION phase, any time
**Effect:** Convert one resource type to another at 1:1 ratio

**Conversion Rules:**
```typescript
interface ResourceCacheFuelPower {
  cost: 1;  // fuel
  timing: 'ACTION_phase';
  conversions: ['fuel_to_ore', 'ore_to_fuel'];
  
  canActivate(player: Player): boolean {
    return player.fuel >= 1 && (player.fuel > 1 || player.ore >= 1);
  }
  
  execute(from: ResourceType, to: ResourceType, amount: number): void {
    // Validate conversion
    if (!['fuel', 'ore'].includes(from) || !['fuel', 'ore'].includes(to)) {
      throw new Error('Can only convert between fuel and ore');
    }
    
    if (from === to) {
      throw new Error('Cannot convert resource to itself');
    }
    
    // Pay activation cost (1 fuel)
    if (player.fuel < 1) {
      throw new Error('Insufficient fuel to activate Resource Cache');
    }
    player.fuel -= 1;
    
    // Validate sufficient source resource
    if (player[from] < amount) {
      throw new Error(`Insufficient ${from}: need ${amount}, have ${player[from]}`);
    }
    
    // Perform conversion
    player[from] -= amount;
    player[to] += amount;
  }
}
```

**Important:** The 1 fuel activation cost is SEPARATE from the conversion. For example:
- Convert 3 ore → 3 fuel costs: 1 fuel (activation) + 0 ore = net gain of 2 fuel
- Convert 3 fuel → 3 ore costs: 1 fuel (activation) + 3 fuel (conversion) = total 4 fuel spent

### Discard Power: Store Resources

**Cost:** Discard this card permanently
**Timing:** ACTION phase or CLEANUP phase
**Effect:** Store up to 5 resources (fuel + ore) beyond the normal 7-resource limit for the rest of the game

**Storage Mechanics:**
```typescript
interface ResourceCacheDiscardPower {
  cost: 'discard_card';
  timing: 'ACTION_phase | CLEANUP_phase';
  duration: 'rest_of_game';
  
  execute(): void {
    // Increase player's resource storage limit permanently
    player.resourceLimit = 12;  // Default 7 + 5 bonus
    
    // Discard card permanently
    player.techCards = player.techCards.filter(card => card !== this);
    game.discardedTechCards.push(this);
  }
}
```

**Storage Details:**
- Default resource limit: 7 total (fuel + ore combined)
- Resource Cache limit: 12 total (fuel + ore combined)
- Discard power is permanent (lasts rest of game)
- Can activate during ACTION phase (proactively) or CLEANUP phase (reactively)
- Critical for preventing resource waste during CLEANUP phase

### Examples

**Example 1: Basic Conversion (Fuel Power)**
- Player has 5 fuel, 1 ore
- Player needs 3 ore to use Colony Constructor
- Player uses Resource Cache fuel power (1 fuel) to convert 2 ore → 2 fuel (wait, this is backwards)
- Correction: Player uses Resource Cache fuel power (1 fuel) to convert 2 fuel → 2 ore
- Net cost: 1 fuel (activation) + 2 fuel (conversion) = 3 fuel spent
- Result: Player now has 2 fuel, 3 ore

**Example 2: Efficient Resource Management (Fuel Power)**
- Player has 6 fuel, 0 ore
- Orbital Market offers 2:1 trade (2 fuel → 1 ore)
- Resource Cache offers 1:1 conversion (plus 1 fuel activation)
- Option A (Orbital Market): Spend 4 fuel → gain 2 ore (net: 2 fuel, 2 ore)
- Option B (Resource Cache): Spend 1 fuel (activate) + 2 fuel (convert) → gain 2 ore (net: 3 fuel, 2 ore)
- Resource Cache is more efficient: Saves 1 fuel compared to Orbital Market

**Example 3: Storage Extension (Discard Power)**
- Player has 7 total resources (4 fuel, 3 ore) at start of CLEANUP phase
- Player gains 3 fuel from Solar Converter during ACTION phase (would have 7 fuel, 3 ore = 10 total)
- Without Resource Cache: Must discard 3 resources down to 7 limit
- Player discards Resource Cache during ACTION phase before gaining resources
- With Resource Cache: Can store up to 12 resources (no discard needed)
- Player keeps all 10 resources (7 fuel, 3 ore)

**Example 4: Long-Game Resource Accumulation (Discard Power)**
- Player discards Resource Cache early in game (turn 3)
- Over next 5 turns, player accumulates resources without hitting limit
- By turn 8, player has 12 total resources (8 fuel, 4 ore)
- Player uses 3 ore for Colony Constructor, 3 fuel for tech card powers
- Player wins via colonies without resource bottleneck

### Interactions

**With Facilities:**
- **Orbital Market:** Resource Cache conversion (1:1 minus 1 fuel) more efficient than Orbital Market worst case (2:1)
- **Solar Converter:** Resource Cache storage enables stockpiling fuel without waste
- **Colony Constructor:** Convert fuel to ore when needed for colony placement
- **Shipyard:** Convert fuel to ore when building multiple ships
- **Raiders' Outpost:** Convert stolen ore to fuel for tech card powers

**With Territories:**
- **Heinlein Plains:** Heinlein offers 1:1 Orbital Market (once per turn), Resource Cache offers unlimited 1:1 (costs 1 fuel each)
- **Burroughs Desert:** Convert fuel to ore to acquire Relic Ship (3 ore cost)
- **Lem Badlands:** Extra fuel from Solar Converter benefits from Resource Cache storage

**With Tech Cards:**
- **Alien City:** Convert ore to fuel to power Alien City (3 fuel → 1 colony)
- **Gravity Manipulator:** Convert ore to fuel to power Gravity Manipulator (3 fuel → ±1 all ships)
- **Polarity Device:** Convert ore to fuel to power Polarity Device (3 fuel → modify Colony Constructor)
- **Temporal Warper:** Storage extension enables massive resource accumulation during extra turns

**With Field Generators:**
- No direct interactions (Resource Cache is resource management tool)

### Strategy Notes

**Fuel Power Efficiency:**
- Most efficient when converting ore → fuel for tech card powers
- Compare to Orbital Market ratios:
  - Orbital Market best case: 1:2 (1 ore → 2 fuel)
  - Resource Cache: 1:1 minus 1 fuel activation (net: 1 ore → 1 fuel, costs 1 fuel)
  - Orbital Market worst case: 2:1 (2 fuel → 1 ore)
  - Resource Cache: 1:1 minus 1 fuel activation (net: 1 fuel → 1 ore, costs 1 fuel)
- Use Resource Cache when Orbital Market offers poor ratios or requires ships

**Discard Power Timing:**
- Discard early if you anticipate long game (many turns)
- Discard proactively if you're about to exceed 7-resource limit
- Discard during CLEANUP phase as emergency measure to avoid waste
- Pairs well with Temporal Warper (extra turns generate massive resources)

**Resource Limit Math:**
- Default limit: 7 resources
- Resource Cache limit: 12 resources
- Benefit: +5 resource storage capacity
- Critical threshold: Discard when you expect to accumulate 8+ resources

**Priority Considerations:**
1. Early game: Hold Resource Cache for conversion flexibility
2. Mid game: Evaluate resource accumulation rate
3. Late game: Discard if approaching resource limit frequently
4. End game: Convert resources as needed for final colony push

---

## 6.2.11 Stasis Beam

**Card Type:** Alien Tech Card
**Acquisition:** Alien Artifact facility (total ship value ≥ 8)
**Visibility:** Public (all players can see)

### Fuel Power: Freeze Opponent's Ship

**Cost:** 2 fuel
**Timing:** ACTION phase, before opponent uses ship
**Effect:** Prevent one of opponent's ships from being used this turn (ship remains in opponent's hand but cannot be docked)

**Freeze Mechanics:**
```typescript
interface StasisBeamFuelPower {
  cost: 2;  // fuel
  timing: 'ACTION_phase';
  duration: 'current_turn_only';
  
  canActivate(player: Player, game: GameState): boolean {
    return player.fuel >= 2 && 
           game.currentPlayer !== player &&  // Must be opponent's turn
           game.currentPlayer.shipsInHand.length > 0;
  }
  
  execute(targetShip: Ship, opponent: Player): void {
    // Validate target
    if (targetShip.owner === player) {
      throw new Error('Cannot target your own ships');
    }
    
    if (targetShip.location !== 'hand') {
      throw new Error('Can only target ships in opponent\'s hand');
    }
    
    // Check for Holographic Decoy protection
    if (targetShip.isShielded) {
      console.log('Ship is shielded by Holographic Decoy - Stasis Beam has no effect');
      player.fuel -= 2;  // Still pay cost
      return;
    }
    
    // Freeze ship
    targetShip.isFrozen = true;
    targetShip.frozenUntilEndOfTurn = true;
    
    // Pay cost
    player.fuel -= 2;
  }
  
  // Validation during opponent's ACTION phase
  canDockShip(ship: Ship): boolean {
    if (ship.isFrozen) {
      throw new Error('Ship is frozen by Stasis Beam - cannot dock this turn');
    }
    return true;
  }
}
```

**Important:** Stasis Beam targets ships in opponent's HAND (not yet docked). Once opponent docks a ship, Stasis Beam cannot freeze it. Use Plasma Cannon to remove ships already at facilities.

### Discard Power: Freeze All Opponent Ships

**Cost:** Discard this card permanently
**Timing:** ACTION phase, during opponent's turn
**Effect:** Prevent opponent from docking ANY ships this turn (opponent's ACTION phase becomes no-op)

**Mass Freeze Mechanics:**
```typescript
interface StasisBeamDiscardPower {
  cost: 'discard_card';
  timing: 'ACTION_phase';
  duration: 'current_turn_only';
  
  canActivate(player: Player, game: GameState): boolean {
    return game.currentPlayer !== player;  // Must be opponent's turn
  }
  
  execute(opponent: Player): void {
    // Freeze all ships in opponent's hand
    opponent.shipsInHand.forEach(ship => {
      if (!ship.isShielded) {  // Holographic Decoy still protects
        ship.isFrozen = true;
        ship.frozenUntilEndOfTurn = true;
      }
    });
    
    // Mark opponent's turn as frozen
    game.currentTurnFrozen = true;
    
    // Discard card permanently
    player.techCards = player.techCards.filter(card => card !== this);
    game.discardedTechCards.push(this);
  }
}
```

**Important:** Discard power does NOT prevent opponent from using tech card powers during their ACTION phase. Opponent can still:
- Use tech card fuel powers (Booster Pod, Gravity Manipulator, etc.)
- Use tech card discard powers
- Use Temporal Warper to take extra turn (frozen ships thaw next turn)

### Examples

**Example 1: Blocking High-Value Ship (Fuel Power)**
- Opponent's turn, opponent has ships [3, 6, 6] in hand
- Lunar Mine minimum is 5
- You use Stasis Beam (2 fuel) to freeze opponent's value-6 ship
- Opponent can only dock ships [3, 6] this turn
- Opponent cannot pair 6+6 at Colonist Hub
- Opponent's value-3 ship cannot dock at Lunar Mine (minimum 5)
- Opponent forced to suboptimal facility choice

**Example 2: Preventing Terraforming Station Colony (Fuel Power)**
- Opponent has ships [6, 7, 8] in hand (total 21 ≥ 20)
- Opponent plans to dock all 3 ships at Terraforming Station for colony
- You use Stasis Beam (2 fuel) to freeze value-8 ship
- Opponent can only dock [6, 7] at Terraforming Station (total 13 < 20)
- Opponent cannot place colony this turn

**Example 3: Total Turn Shutdown (Discard Power)**
- Opponent's turn, opponent has ships [4, 5, 6, 6] in hand
- Opponent is one colony away from victory
- You discard Stasis Beam to freeze ALL opponent ships
- Opponent cannot dock any ships this turn
- Opponent can still use tech card powers (Alien City, Booster Pod, etc.)
- Opponent's turn effectively wasted (no facility usage)

**Example 4: Combination with Plasma Cannon (Discard Power + Plasma Cannon)**
- Opponent's turn, opponent has ships [6, 6, 7] in hand
- You discard Stasis Beam to freeze all ships
- Opponent cannot dock ships this turn
- On your next turn, opponent has unfrozen ships [6, 6, 7]
- Opponent docks value-7 ship at Lunar Mine (updates minimum to 7)
- You use Plasma Cannon to remove value-7 ship before minimum updates
- Lunar Mine minimum remains lower

### Interactions

**With Facilities:**
- **Lunar Mine:** Freeze high-value ships to prevent minimum increase
- **Terraforming Station:** Freeze ships to prevent opponent from meeting 3-ship or value-20 thresholds
- **Colonist Hub:** Freeze one ship from a pair to prevent colony placement
- **Colony Constructor:** Freeze one ship from a pair to prevent colony placement
- **Alien Artifact:** Freeze ships to prevent opponent from reaching value-8 threshold

**With Territories:**
- No direct interactions (Stasis Beam affects ships in hand, territories affect facilities)

**With Tech Cards:**
- **Holographic Decoy:** Opponent can shield ships with Holographic Decoy to prevent Stasis Beam freeze
  - Fuel power: Shield 1 ship (1 fuel)
  - Discard power: Shield ALL ships (discard card)
  - Priority: Shield high-value ships or ships needed for critical facilities
- **Temporal Warper:** Opponent can use Temporal Warper to take extra turn after ships thaw
- **Booster Pod:** Stasis Beam does NOT prevent opponent from using Booster Pod (tech card power, not ship docking)
- **Gravity Manipulator:** Stasis Beam does NOT prevent opponent from using Gravity Manipulator
- **Plasma Cannon:** Stasis Beam (freeze ships in hand) + Plasma Cannon (remove ships at facilities) = total disruption

**With Field Generators:**
- No direct interactions (Stasis Beam affects ships in hand, field generators affect territories)

### Strategy Notes

**Fuel Power Efficiency:**
- Most efficient when targeting single high-value ship critical to opponent's strategy
- Compare to Plasma Cannon: Stasis Beam prevents docking (2 fuel), Plasma Cannon removes after docking (discard)
- Use when you know opponent's intended facility (Terraforming Station, Lunar Mine)
- Less effective if opponent has many ships (can work around frozen ship)

**Discard Power Timing:**
- Save for critical moments: Opponent one colony away from victory
- Use when opponent has optimal dice rolls (multiple high-value ships)
- Consider opponent's tech card powers (Alien City bypasses ship docking)
- Pair with Plasma Cannon next turn for maximum disruption

**Holographic Decoy Counterplay:**
- Opponent can shield ships to prevent freeze
- Priority targets: Unshielded high-value ships
- If all ships shielded, Stasis Beam has no effect (but still costs fuel/discard)

**Timing Window:**
- Fuel power: Use during opponent's ACTION phase BEFORE they dock ships
- Discard power: Use during opponent's ACTION phase BEFORE they dock ships
- Cannot freeze ships already at facilities (use Plasma Cannon instead)

**Resource Trade-offs:**
- Fuel power: 2 fuel to freeze 1 ship (repeatable)
- Discard power: Discard card to freeze ALL ships (one-time)
- Compare to Plasma Cannon: Discard to remove 1 ship at facility (one-time)

---

## 6.2.12 Temporal Warper

**Card Type:** Alien Tech Card
**Acquisition:** Alien Artifact facility (total ship value ≥ 8)
**Visibility:** Public (all players can see)

### Fuel Power: Take Extra Turn Phase

**Cost:** 4 fuel
**Timing:** CLEANUP phase, at end of your turn
**Effect:** Take an additional complete turn (GATHER → ROLL → ACTION → CLEANUP) immediately after current turn

**Extra Turn Mechanics:**
```typescript
interface TemporalWarperFuelPower {
  cost: 4;  // fuel
  timing: 'CLEANUP_phase';
  
  canActivate(player: Player): boolean {
    return player.fuel >= 4 && !game.extraTurnInProgress;
  }
  
  execute(): void {
    // Pay cost
    player.fuel -= 4;
    
    // Mark extra turn
    game.extraTurnInProgress = true;
    game.extraTurnPlayer = player;
    
    // Start new turn sequence
    startTurn(player);  // GATHER → ROLL → ACTION → CLEANUP
    
    // After extra turn completes
    game.extraTurnInProgress = false;
    game.extraTurnPlayer = null;
    
    // Resume normal turn order
    advanceToNextPlayer();
  }
}
```

**Important Turn Sequence:**
1. **Current Turn:** Player takes normal turn (GATHER → ROLL → ACTION → CLEANUP)
2. **CLEANUP Phase:** Player uses Temporal Warper fuel power (4 fuel)
3. **Extra Turn:** Player immediately takes another complete turn
4. **Extra CLEANUP:** Extra turn completes, normal turn order resumes
5. **Next Player:** Next player in turn order takes their turn

**Critical Rules:**
- Extra turn is a COMPLETE turn (all phases: GATHER, ROLL, ACTION, CLEANUP)
- Extra turn counts for territory control (can gain/lose territory control)
- Extra turn counts for resource limits (can exceed 7 resources then discard to 7 in extra CLEANUP)
- Cannot chain multiple Temporal Warpers (cannot use Temporal Warper during extra turn)

### Discard Power: Take Two Extra Turns

**Cost:** Discard this card permanently
**Timing:** CLEANUP phase, at end of your turn
**Effect:** Take TWO additional complete turns immediately after current turn

**Double Extra Turn Mechanics:**
```typescript
interface TemporalWarperDiscardPower {
  cost: 'discard_card';
  timing: 'CLEANUP_phase';
  
  execute(): void {
    // Mark double extra turn
    game.extraTurnsRemaining = 2;
    game.extraTurnPlayer = player;
    
    // Take first extra turn
    startTurn(player);  // GATHER → ROLL → ACTION → CLEANUP
    game.extraTurnsRemaining = 1;
    
    // Take second extra turn
    startTurn(player);  // GATHER → ROLL → ACTION → CLEANUP
    game.extraTurnsRemaining = 0;
    game.extraTurnPlayer = null;
    
    // Discard card permanently
    player.techCards = player.techCards.filter(card => card !== this);
    game.discardedTechCards.push(this);
    
    // Resume normal turn order
    advanceToNextPlayer();
  }
}
```

**Important:** Each extra turn is independent:
- Roll dice separately for each extra turn
- Resources accumulate across both extra turns
- Territory control recalculated after each extra turn
- Resource limit applies at end of each CLEANUP phase (discard down to 7 twice)

### Examples

**Example 1: Basic Extra Turn (Fuel Power)**
- Player's normal turn: Roll [3, 4, 5, 6], dock ships, gain 3 fuel from Solar Converter
- Player has 6 fuel at end of turn
- Player uses Temporal Warper (4 fuel) during CLEANUP
- Player takes extra turn: Roll [2, 3, 5, 6], dock ships, gain 2 ore from Maintenance Bay
- Player now has 2 fuel, 2 ore
- Normal turn order resumes (next player's turn)

**Example 2: Colony Rush (Discard Power)**
- Player is two colonies away from victory (needs 2 more colonies to reach 4 total)
- Player discards Temporal Warper during CLEANUP
- **First Extra Turn:**
  - GATHER: Relic Ship returns to supply (if player had it)
  - ROLL: Roll [4, 5, 5, 6]
  - ACTION: Dock 5+5 at Colony Constructor, place 1 colony
  - CLEANUP: Discard down to 7 resources
- **Second Extra Turn:**
  - GATHER: Collect resources from controlled territories
  - ROLL: Roll [3, 6, 6, 6]
  - ACTION: Dock 6+6 at Colonist Hub, place 1 colony
  - CLEANUP: Player now has 4 total colonies → WINS GAME
- Critical play: Two extra turns enable rapid victory

**Example 3: Resource Accumulation with Resource Cache**
- Player has Resource Cache (discard power used earlier, resource limit = 12)
- Player uses Temporal Warper fuel power (4 fuel)
- **Extra Turn:**
  - GATHER: Gain 1 fuel from Lem Badlands (controlled territory)
  - ROLL: Roll [6, 6, 6, 6]
  - ACTION: Dock all four value-6 ships at Solar Converter
  - Each ship generates ⌈6/2⌉ = 3 fuel
  - Lem Badlands bonus: +1 fuel per ship = 4 fuel per ship
  - Total: 4 ships × 4 fuel = 16 fuel gained
  - Player now has 16 fuel (exceeds normal 7 limit, but Resource Cache allows 12)
  - CLEANUP: Discard down to 12 resources (keep 12 fuel, 0 ore)
- Player uses massive fuel stockpile for tech card powers next turn

**Example 4: Combination with Stasis Beam Defense**
- Player discards Temporal Warper for 2 extra turns
- Opponent sees this and prepares Stasis Beam to freeze player's ships next turn
- **First Extra Turn:**
  - Player docks ships and gains resources
  - Opponent cannot use Stasis Beam (it's player's turn, not opponent's turn)
- **Second Extra Turn:**
  - Player docks more ships and gains more resources
  - Opponent still cannot use Stasis Beam
- After extra turns complete, normal turn order resumes
- Opponent's next turn: Player can use Stasis Beam on opponent

### Interactions

**With Facilities:**
- **All Facilities:** Can use facilities multiple times across extra turns (each turn is independent)
- **Lunar Mine:** Can update minimum multiple times across extra turns
- **Terraforming Station:** Can place colony in first extra turn, another colony in second extra turn
- **Alien Artifact:** Can claim tech card in extra turn (if value ≥8 threshold met)

**With Territories:**
- **Territory Control:** Recalculated after each extra turn (colonies placed/removed affect control)
- **All Territory Bonuses:** Apply during each extra turn independently
- **Burroughs Desert:** Relic Ship returns to Burroughs during GATHER phase of each extra turn

**With Tech Cards:**
- **Resource Cache:** Storage extension critical for managing resources across multiple turns
- **Alien City:** Can use Alien City fuel power (3 fuel → 1 colony) in each extra turn
- **Gravity Manipulator:** Can use Gravity Manipulator in each extra turn to optimize ship values
- **Cannot Chain Temporal Warpers:** Cannot use Temporal Warper during extra turn (only in normal turn CLEANUP)

**With Field Generators:**
- **All Field Generators:** Remain in place across extra turns
- **Positron Field:** Can place Positron Field in extra turn, removes colonies immediately
- **Booster Pod Discard:** Can place/remove field generators in extra turns via Booster Pod discard

### Strategy Notes

**Fuel Power Efficiency:**
- Cost: 4 fuel (expensive, but game-changing)
- Best used when you have optimal dice rolls and need immediate action
- Enables "double dipping" - use facilities twice before opponents can respond
- Critical for racing to victory (place 2 colonies in 2 turns)

**Discard Power Timing:**
- Save for end game when victory is within reach
- Two extra turns = 2 complete sets of facility uses
- Can place 2-4 colonies across two turns (depending on resources)
- Opponent cannot interrupt extra turns (no Stasis Beam, no Plasma Cannon until their turn)

**Resource Management:**
- Each extra turn generates resources (GATHER phase, facility usage)
- Resource limit applies at end of each CLEANUP phase
- Pair with Resource Cache to maximize resource retention (12 limit instead of 7)
- Calculate resource overflow carefully to avoid waste

**Victory Conditions:**
- Standard game: 4 colonies to win
- With 2 extra turns, can place 2+ colonies (win from 2 colonies)
- Long game variant: 5 colonies to win, 2 extra turns still provides massive advantage

**Priority Considerations:**
1. **Early Game:** Hold Temporal Warper, fuel power too expensive
2. **Mid Game:** Consider fuel power if optimal dice rolls and critical facility usage
3. **Late Game:** Discard power for victory rush (2 colonies in 2 turns)
4. **End Game:** Use when you're 2 colonies away from victory

**Counterplay:**
- Opponent can use Stasis Beam AFTER your extra turns complete
- Opponent can use Plasma Cannon AFTER your extra turns complete
- Opponent cannot interrupt extra turns (all opponent actions wait until their turn)
- Holographic Decoy cannot prevent Temporal Warper (it's not an attack on ships)

---

## Section 6.3: Tech Card System Summary

### Complete Tech Card List

| # | Card Name | Fuel Power | Fuel Cost | Discard Power | Strategy Focus |
|---|-----------|-----------|-----------|---------------|----------------|
| 1 | **Alien City** | 3 fuel → 1 colony | 3 | 2 colonies | Direct colony placement |
| 2 | **Alien Monument** | +1 colony advance | 1 | +2 colony advance | Colony advancement boost |
| 3 | **Booster Pod** | ±1 ship value | 2 | Place/remove field generator | Ship manipulation + field control |
| 4 | **Data Crystal** | Borrow territory bonus | 1 | None | Territory bonus flexibility |
| 5 | **Gravity Manipulator** | ±1 all ships | 3 | Swap values with opponent | Fleet-wide manipulation |
| 6 | **Holographic Decoy** | Shield 1 ship | 1 | Shield all ships | Defensive protection |
| 7 | **Orbital Teleporter** | Relocate 1 ship | 2 | Relocate + facility bonus | Facility optimization |
| 8 | **Plasma Cannon** | None | 0 | Remove opponent ship | Offensive disruption |
| 9 | **Polarity Device** | Modify Colony Constructor | 3 | Any ships → colony (2 ore) | Flexible colony placement |
| 10 | **Resource Cache** | Convert resources 1:1 | 1 | +5 resource storage | Resource management |
| 11 | **Stasis Beam** | Freeze 1 opponent ship | 2 | Freeze all opponent ships | Turn denial |
| 12 | **Temporal Warper** | 1 extra turn | 4 | 2 extra turns | Time manipulation |

### Tech Card Acquisition Priority

**Early Game (Turns 1-3):**
1. **Resource Cache** - Resource flexibility and storage
2. **Booster Pod** - Ship value manipulation
3. **Gravity Manipulator** - Fleet-wide control
4. **Data Crystal** - Territory bonus borrowing

**Mid Game (Turns 4-6):**
1. **Orbital Teleporter** - Facility optimization
2. **Holographic Decoy** - Defensive protection
3. **Alien Monument** - Colony advancement
4. **Polarity Device** - Colony placement flexibility

**Late Game (Turns 7+):**
1. **Temporal Warper** - Victory rush (2 extra turns)
2. **Alien City** - Direct colony placement
3. **Plasma Cannon** - Opponent disruption
4. **Stasis Beam** - Turn denial

### Tech Card Combo Strategies

**Colony Placement Combos:**
- **Alien City + Resource Cache:** Convert ore to fuel (1:1) to power Alien City (3 fuel → 1 colony)
- **Polarity Device + Booster Pod:** Adjust ship values to match Colony Constructor target total
- **Alien Monument + Asimov Crater:** Stack bonuses for +2 colony advance at Colonist Hub
- **Orbital Teleporter + Terraforming Station:** Relocate ship with +2 value bonus to meet thresholds

**Defensive Combos:**
- **Holographic Decoy + High-Value Ships:** Shield value-6+ ships from Plasma Cannon/Stasis Beam
- **Stasis Beam + Plasma Cannon:** Freeze opponent's ships in hand, remove ships at facilities
- **Booster Pod + Field Generators:** Place Isolation Field on opponent's critical territories

**Offensive Combos:**
- **Plasma Cannon + Lunar Mine:** Remove opponent's high-value ship to prevent minimum increase
- **Stasis Beam + Terraforming Station:** Freeze opponent's ships to prevent colony placement
- **Gravity Manipulator + Opponent's Lunar Mine:** Decrease all opponent ships below Lunar Mine minimum

**Resource Combos:**
- **Resource Cache + Temporal Warper:** Store 12 resources, use 2 extra turns to generate massive resources
- **Data Crystal + Lem Badlands:** Borrow +1 fuel per ship at Solar Converter bonus
- **Orbital Teleporter + Orbital Market:** Relocate ship with 1:1 trade bonus

**Time Manipulation Combos:**
- **Temporal Warper + Alien City:** Use 2 extra turns to place 2 colonies via Alien City
- **Temporal Warper + Resource Cache:** Accumulate 12+ resources across 2 extra turns
- **Temporal Warper + Colony Constructor:** Place 2 colonies in 2 turns (4 total colonies = win)

### Tech Card Synergy Matrix

| Card | Best Synergy With | Worst Synergy With |
|------|-------------------|-------------------|
| **Alien City** | Resource Cache, Temporal Warper | Polarity Device (both enable colony placement) |
| **Alien Monument** | Asimov Crater, Colonist Hub | Alien City (bypasses Colonist Hub) |
| **Booster Pod** | Polarity Device, Orbital Teleporter | Gravity Manipulator (fleet-wide more efficient) |
| **Data Crystal** | Territory-rich opponents, Lem/Pohl | Isolation Field (blocks borrowed bonuses) |
| **Gravity Manipulator** | Booster Pod, Lunar Mine | Stasis Beam (frozen ships can't dock anyway) |
| **Holographic Decoy** | Relic Ship, Lunar Mine ships | Temporal Warper (extra turns avoid attacks) |
| **Orbital Teleporter** | Lunar Mine, Terraforming Station | Maintenance Bay (already stores ships) |
| **Plasma Cannon** | Stasis Beam, Lunar Mine | Holographic Decoy (opponent shields ships) |
| **Polarity Device** | Booster Pod, Bradbury Plateau | Alien City (both enable colony placement) |
| **Resource Cache** | Temporal Warper, Orbital Market | Heinlein Plains (already offers 1:1) |
| **Stasis Beam** | Plasma Cannon, Terraforming Station | Holographic Decoy (opponent shields ships) |
| **Temporal Warper** | Resource Cache, Alien City | Stasis Beam (opponent freezes after extra turns) |

### Ambiguities Resolved

- **#136-138:** Resource Cache conversion cost is 1 fuel activation + resource conversion (separate costs)
- **#139:** Resource Cache discard power increases limit to 12 (not 7+5 per turn)
- **#140-142:** Stasis Beam targets ships in opponent's hand (not ships at facilities)
- **#143:** Stasis Beam discard power does NOT prevent tech card power usage
- **#144:** Holographic Decoy shields prevent Stasis Beam freeze
- **#145-148:** Temporal Warper extra turns are complete turns (GATHER → ROLL → ACTION → CLEANUP)
- **#149:** Cannot chain Temporal Warpers (cannot use during extra turn)
- **#150:** Temporal Warper extra turns count for territory control recalculation
- **#151:** Resource limit applies at end of each extra turn CLEANUP phase
- **#152:** Temporal Warper discard power provides 2 extra turns (not 3)

### Strategic Decision Tree

**When to Use Fuel Powers:**
```
IF (need immediate effect AND have sufficient fuel)
  THEN consider fuel power
  ELSE save fuel for critical tech cards

IF (fuel power solves immediate problem)
  THEN use fuel power
  ELSE consider discard power for bigger impact
```

**When to Use Discard Powers:**
```
IF (endgame AND need massive impact)
  THEN use discard power
  ELSE hold card for fuel power flexibility

IF (discard power enables victory)
  THEN use immediately
  ELSE evaluate fuel power alternatives
```

**Tech Card Priority Selection:**
```
EARLY_GAME: Resource Cache > Booster Pod > Gravity Manipulator
MID_GAME: Orbital Teleporter > Holographic Decoy > Alien Monument  
LATE_GAME: Temporal Warper > Alien City > Plasma Cannon

IF (opponent has lead)
  THEN prioritize offensive/disruptive cards (Plasma Cannon, Stasis Beam)
  ELSE prioritize efficiency cards (Resource Cache, Orbital Teleporter)
```
