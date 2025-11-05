# Section 6.2: Alien Tech Cards (Part 3)

## 6.2.7 Orbital Teleporter

**Card Type:** Alien Tech Card
**Acquisition:** Alien Artifact facility (total ship value ≥ 8)
**Visibility:** Public (all players can see)

### Fuel Power: Relocate Ship Between Facilities

**Cost:** 2 fuel
**Timing:** ACTION phase, any time before docking ships
**Effect:** Move one of your ships (from hand OR already committed to a facility) to a different facility

**Requirements:**
- Must have at least 2 fuel
- Must have at least one ship to relocate
- Target facility must accept ships of that value
- Cannot move ships that are "locked in" (e.g., ships at Lunar Mine that have updated the minimum)

**State Transitions:**
```typescript
interface OrbitalTeleporterFuelPower {
  cost: 2;  // fuel
  timing: 'ACTION_phase';
  
  canActivate(player: Player): boolean {
    return player.fuel >= 2 && 
           (player.shipsInHand.length > 0 || player.committedShips.length > 0);
  }
  
  execute(ship: Ship, targetFacility: Facility): void {
    // Remove ship from current location
    if (ship.location === 'hand') {
      player.shipsInHand = player.shipsInHand.filter(s => s !== ship);
    } else if (ship.location === 'facility') {
      ship.currentFacility.uncommitShip(ship);
    }
    
    // Validate target facility accepts this ship
    if (!targetFacility.canAcceptShip(ship)) {
      throw new Error('Target facility cannot accept this ship value');
    }
    
    // Move ship to target facility
    targetFacility.commitShip(ship);
    ship.location = 'facility';
    ship.currentFacility = targetFacility;
    
    // Pay cost
    player.fuel -= 2;
  }
}
```

### Discard Power: Move Ship and Gain Bonus

**Cost:** Discard this card permanently
**Timing:** ACTION phase, any time
**Effect:** Relocate one ship AND gain a bonus based on target facility

**Bonus Structure:**
- **Alien Artifact:** Gain 1 fuel
- **Colonist Hub:** +1 colony advance (if placing colony this turn)
- **Colony Constructor:** -1 ore cost for colony placement
- **Lunar Mine:** Ship arrives with value +1 (does not update minimum if already set)
- **Maintenance Bay:** Gain 1 ore
- **Orbital Market:** Next trade is 1:1 ratio (any resource)
- **Raiders' Outpost:** Raid does not cost 1 fuel
- **Shipyard:** -1 ore discount on ship construction
- **Solar Converter:** Ship converts at +1 value (⌈(value+1)/2⌉ fuel)
- **Terraforming Station:** Ship counts as value +2 toward total

**Important:** The bonus applies immediately when the ship arrives at the target facility. If the facility requires activation (e.g., Orbital Market), the bonus persists until used.

```typescript
interface OrbitalTeleporterDiscardPower {
  cost: 'discard_card';
  timing: 'ACTION_phase';
  
  bonuses: Map<Facility, Bonus> = {
    ALIEN_ARTIFACT: { type: 'resource', resource: 'fuel', amount: 1 },
    COLONIST_HUB: { type: 'colony_advance', amount: 1 },
    COLONY_CONSTRUCTOR: { type: 'ore_discount', amount: 1 },
    LUNAR_MINE: { type: 'ship_value_boost', amount: 1 },
    MAINTENANCE_BAY: { type: 'resource', resource: 'ore', amount: 1 },
    ORBITAL_MARKET: { type: 'trade_ratio_boost', target: '1:1' },
    RAIDERS_OUTPOST: { type: 'free_raid', waiveFuelCost: true },
    SHIPYARD: { type: 'ore_discount', amount: 1 },
    SOLAR_CONVERTER: { type: 'conversion_boost', amount: 1 },
    TERRAFORMING_STATION: { type: 'ship_value_boost', amount: 2 }
  };
  
  execute(ship: Ship, targetFacility: Facility): void {
    // Relocate ship (same logic as fuel power)
    relocateShip(ship, targetFacility);
    
    // Apply facility-specific bonus
    const bonus = this.bonuses[targetFacility.type];
    applyBonus(player, bonus);
    
    // Discard card permanently
    player.techCards = player.techCards.filter(card => card !== this);
    game.discardedTechCards.push(this);
  }
}
```

### Examples

**Example 1: Basic Relocation (Fuel Power)**
- Player has ships with values [3, 5, 6] in hand
- Player has 3 fuel
- Player wants to dock at Colonist Hub (requires pairs) but has no pair
- Player docks value-3 ship at Maintenance Bay (stores it)
- Player uses Orbital Teleporter fuel power (2 fuel) to move value-3 ship from Maintenance Bay to hand
- Now player has [3, 5, 6] in hand again, can pair 3+3 or 5+6 for Colonist Hub next turn

**Example 2: Lunar Mine Optimization (Fuel Power)**
- Lunar Mine minimum is currently 2
- Player has value-4 ship in hand
- Player wants to dock at Lunar Mine but doesn't want to increase minimum to 4
- Player docks value-2 ship at Lunar Mine (minimum stays at 2)
- Player uses Orbital Teleporter to move value-4 ship from hand to Raiders' Outpost
- Later, when opponent increases Lunar Mine minimum to 5, player can teleport value-4 ship to Lunar Mine without penalty

**Example 3: Discard Power with Terraforming Station Bonus**
- Player wants to place colony via Terraforming Station
- Terraforming Station requires ≥3 ships with total value ≥20
- Player has committed ships: [6, 6, 6] = total 18 (insufficient)
- Player has value-4 ship in hand
- Player discards Orbital Teleporter to move value-4 ship to Terraforming Station with +2 bonus
- Ship counts as value 6 (4+2), total becomes 6+6+6+6 = 24 ≥ 20 ✓
- Player places colony and forfeits one ship

**Example 4: Combination with Raiders' Outpost (Discard Power)**
- Player controls Lem Badlands territory (+1 fuel at Solar Converter)
- Player has value-6 ship at Solar Converter generating ⌈6/2⌉ + 1 = 4 fuel
- Player discards Orbital Teleporter to move value-6 ship to Raiders' Outpost with free raid bonus
- Player raids opponent without paying 1 fuel cost
- Player steals 1 ore from opponent
- Net gain: Freed up value-6 ship for future use, gained 1 ore, saved 1 fuel

### Interactions

**With Facilities:**
- **Lunar Mine:** Can move ships TO Lunar Mine after minimum is set, bypasses increasing minimum further (does not update)
- **Maintenance Bay:** Can retrieve stored ships without waiting until next turn
- **Terraforming Station:** Can relocate ships during same turn to meet 3-ship minimum
- **Raiders' Outpost:** Can move ships away after raiding to use elsewhere

**With Territories:**
- **Pohl Foothills:** Discard bonus at Shipyard stacks with Pohl (+1 value), creating double discount
- **Lem Badlands:** Discard bonus at Solar Converter stacks with Lem (+1 fuel per ship)
- **Van Vogt Mountains:** Can teleport low-value ships to Lunar Mine bypassing minimum

**With Tech Cards:**
- **Booster Pod:** Use Booster Pod to adjust ship value, then teleport to optimal facility
- **Gravity Manipulator:** Use Gravity Manipulator to adjust all ships, then teleport specific ships
- **Temporal Warper:** Teleport ships during extra turn to maximize facility usage
- **Holographic Decoy:** Shield ship before teleporting to protect from Plasma Cannon during move

**With Field Generators:**
- **Positron Field:** Cannot teleport ships to territories with Positron Field (colonies removed)
- **Repulsor Field:** Can teleport ships to Terraforming Station, but cannot place colony if Repulsor active

### Strategy Notes

**Fuel Power Efficiency:**
- Best used when you have ships at suboptimal facilities
- Enables "facility chaining" - dock at easy facility, then move to desired facility
- Critical for adapting to changing Lunar Mine minimum
- Can recover ships from Maintenance Bay immediately (instead of waiting until next turn)

**Discard Power Timing:**
- Save discard for critical colony placement at Terraforming Station (+2 value bonus is huge)
- Use when you need immediate facility bonus and ship relocation simultaneously
- Powerful with Raiders' Outpost (free raid = save 1 fuel)
- Consider discarding early if you have other movement options (Temporal Warper)

**Priority Targets for Relocation:**
- High-value ships stuck at Maintenance Bay
- Low-value ships that could be paired at Colonist Hub
- Ships at facilities where opponent placed Isolation Field
- Ships needed to complete Terraforming Station minimum

---

## 6.2.8 Plasma Cannon

**Card Type:** Alien Tech Card
**Acquisition:** Alien Artifact facility (total ship value ≥ 8)
**Visibility:** Public (all players can see)

### Fuel Power: None

**This card has NO fuel power.** Plasma Cannon is a discard-only tech card.

### Discard Power: Remove Opponent's Ship from Facility

**Cost:** Discard this card permanently
**Timing:** ACTION phase, after opponent docks ship but before facility resolves
**Effect:** Remove one of opponent's ships from any facility and return it to their supply

**Requirements:**
- Opponent must have at least one ship committed to a facility
- Cannot target ships in opponent's hand (only ships at facilities)
- Cannot target your own ships
- Can target ships at Maintenance Bay (even though they're "stored")

**Removal Mechanics:**
```typescript
interface PlasmaCannonDiscardPower {
  cost: 'discard_card';
  timing: 'ACTION_phase';
  hasFuelPower: false;
  
  canActivate(player: Player, game: GameState): boolean {
    // Must have at least one opponent with ships at facilities
    return game.players.some(opponent => 
      opponent !== player && 
      opponent.committedShips.length > 0
    );
  }
  
  execute(targetShip: Ship, opponent: Player): void {
    // Validate target
    if (targetShip.owner === player) {
      throw new Error('Cannot target your own ships');
    }
    
    if (targetShip.location !== 'facility') {
      throw new Error('Can only target ships at facilities');
    }
    
    // Check for Holographic Decoy protection
    if (targetShip.isShielded) {
      console.log('Ship is shielded by Holographic Decoy - Plasma Cannon has no effect');
      return;  // Plasma Cannon is still discarded but has no effect
    }
    
    // Remove ship from facility
    const facility = targetShip.currentFacility;
    facility.uncommitShip(targetShip);
    
    // Return ship to opponent's supply
    targetShip.location = 'supply';
    targetShip.currentFacility = null;
    opponent.shipsInSupply.push(targetShip);
    opponent.committedShips = opponent.committedShips.filter(s => s !== targetShip);
    
    // Discard card permanently
    player.techCards = player.techCards.filter(card => card !== this);
    game.discardedTechCards.push(this);
  }
}
```

**Important Timing:** Plasma Cannon must be used AFTER opponent docks the ship but BEFORE the facility effect resolves. This means:
- Cannot prevent opponent from docking (ship is already committed)
- CAN prevent facility effect from triggering (ship removed before resolution)
- Opponent does NOT get resources/benefits from the facility

### Facility-Specific Interactions

**Alien Artifact:**
- Remove ship before opponent claims tech card
- Opponent's total value drops below 8, no tech card awarded

**Colonist Hub:**
- Remove one ship from a pair, opponent cannot place colony
- If opponent had 3+ ships (e.g., values 4+4+5), remove the 5-ship, pair still works

**Colony Constructor:**
- Remove one ship from a pair, opponent loses entire action
- Opponent pays ore cost (if already paid) but gains nothing

**Lunar Mine:**
- Remove ship before it updates minimum
- Critical for keeping Lunar Mine minimum low
- If multiple ships committed, remove highest-value ship first

**Maintenance Bay:**
- Can target stored ships (they're still "at the facility")
- Forces opponent to lose stored ship permanently (returns to supply, not hand)

**Orbital Market:**
- Remove ship before trade completes
- Opponent loses resources already paid but gets nothing in return

**Raiders' Outpost:**
- Remove ship before raid completes
- Opponent paid 1 fuel but gains nothing
- Critical defensive play to prevent resource theft

**Shipyard:**
- Remove ship before construction completes
- Opponent pays ore cost but no new ship is built

**Solar Converter:**
- Remove ship before fuel generation
- Least impactful target (fuel is abundant)

**Terraforming Station:**
- Remove one ship from 3+ committed ships
- If total value drops below 20, opponent cannot place colony
- Opponent must still forfeit one ship (see Ambiguity #132)

### Examples

**Example 1: Blocking Lunar Mine Minimum Increase**
- Lunar Mine minimum is currently 3
- Opponent docks value-6 ship at Lunar Mine (would update minimum to 6)
- You discard Plasma Cannon to remove opponent's value-6 ship
- Lunar Mine minimum remains at 3
- Opponent's ship returns to their supply
- Critical play: Keeps Lunar Mine accessible for your low-value ships

**Example 2: Disrupting Colony Constructor**
- Opponent controls Bradbury Plateau (−1 ore cost at Colony Constructor)
- Opponent pays 2 ore and docks ships with values 5+5 at Colony Constructor
- You discard Plasma Cannon to remove one value-5 ship
- Opponent paid 2 ore but cannot place colony (no longer a pair)
- Opponent's removed ship returns to supply
- Other value-5 ship returns to opponent's hand (standard Colony Constructor behavior)

**Example 3: Preventing Tech Card Acquisition**
- Opponent docks ships with values 3+5 at Alien Artifact (total 8)
- You discard Plasma Cannon to remove value-5 ship
- Total becomes 3 (less than 8), opponent does not claim tech card
- Critical if opponent is about to get powerful card like Temporal Warper

**Example 4: Combination with Terraforming Station Minimum**
- Opponent commits 3 ships to Terraforming Station: values [6, 7, 8] = total 21
- You discard Plasma Cannon to remove value-8 ship
- Total becomes 6+7 = 13 (less than 20), opponent cannot place colony
- Opponent must still forfeit one of the two remaining ships (return to supply)
- Opponent loses: 1 ship removed by Plasma Cannon, 1 ship forfeited, gained nothing

### Interactions

**With Territories:**
- **Asimov Crater:** Remove ship from Colonist Hub before opponent uses +1 colony advance
- **Bradbury Plateau:** Opponent paid reduced ore cost at Colony Constructor but gains nothing
- **Burroughs Desert:** Cannot target Relic Ship (it's not owned by any player until acquired)
- **Van Vogt Mountains:** Remove ship from Lunar Mine bypassing minimum (still prevents minimum update)

**With Tech Cards:**
- **Holographic Decoy:** Opponent can shield ships with Holographic Decoy (fuel or discard power)
  - If ship is shielded, Plasma Cannon has no effect but is still discarded
  - Priority target: Unshielded high-value ships at Lunar Mine or Terraforming Station
- **Orbital Teleporter:** Opponent can teleport ship away before you use Plasma Cannon
  - Timing: Teleporter is ACTION phase, Plasma Cannon is also ACTION phase
  - Resolution: Active player (current turn) has priority
- **Temporal Warper:** Opponent can use extra turn to dock ships, you cannot use Plasma Cannon on previous turn's ships
- **Stasis Beam:** You can use Stasis Beam to freeze opponent's ship, then Plasma Cannon it

**With Field Generators:**
- **Isolation Field:** Removing ships from facilities in Isolation territories prevents opponent from gaining bonuses
- **Positron Field:** Removing ships from Colonist Hub/Colony Constructor prevents colony placement (Positron Field removes placer's colonies)
- **Repulsor Field:** Removing ships from Terraforming Station prevents colony placement (Repulsor blocks all placements)

### Strategy Notes

**Timing Considerations:**
- Plasma Cannon is reactive - you must wait for opponent to commit ship
- Cannot stockpile multiple Plasma Cannons (each card can only be acquired once per game)
- Use immediately when opponent commits to high-impact facility (Lunar Mine, Terraforming Station)

**Priority Targets:**
1. **Lunar Mine:** Prevent minimum increase (keeps facility accessible)
2. **Terraforming Station:** Prevent colony placement (opponent forfeits ship anyway)
3. **Colony Constructor:** Disrupt colony placement (opponent paid ore cost for nothing)
4. **Alien Artifact:** Prevent tech card acquisition (especially Temporal Warper, Resource Cache)
5. **Raiders' Outpost:** Prevent resource theft (opponent paid 1 fuel for nothing)

**Defensive Considerations:**
- Opponent can shield ships with Holographic Decoy
- Opponent can spread ships across multiple facilities to minimize Plasma Cannon impact
- Save Plasma Cannon for critical moments (opponent about to win via colony placement)

**Discard Timing:**
- No fuel power means card is dead weight until discard opportunity arises
- Consider acquiring early if you anticipate opponent's aggressive Lunar Mine strategy
- Pair with Stasis Beam or Data Crystal for maximum disruption

---

## 6.2.9 Polarity Device

**Card Type:** Alien Tech Card
**Acquisition:** Alien Artifact facility (total ship value ≥ 8)
**Visibility:** Public (all players can see)

### Fuel Power: Modify Colony Constructor Pair Requirement

**Cost:** 3 fuel
**Timing:** ACTION phase, before docking ships at Colony Constructor
**Effect:** Change Colony Constructor to accept ships whose total value equals a target number (instead of pair requirement)

**Modification Mechanics:**
```typescript
interface PolarityDeviceFuelPower {
  cost: 3;  // fuel
  timing: 'ACTION_phase';
  duration: 'current_turn_only';
  
  canActivate(player: Player): boolean {
    return player.fuel >= 3 && player.shipsInHand.length >= 2;
  }
  
  execute(targetTotal: number): void {
    // Modify Colony Constructor for current turn only
    game.colonyConstructorModified = {
      player: player,
      requirement: 'total_equals',
      targetValue: targetTotal,
      expiresEndOfTurn: true
    };
    
    // Pay cost
    player.fuel -= 3;
  }
  
  // Validation when docking at Colony Constructor
  validateShipsForModifiedConstructor(ships: Ship[]): boolean {
    const requirement = game.colonyConstructorModified;
    
    if (requirement && requirement.player === currentPlayer) {
      // Modified requirement: total equals target
      const total = ships.reduce((sum, ship) => sum + ship.value, 0);
      return total === requirement.targetValue;
    } else {
      // Standard requirement: exact pair
      return ships.length === 2 && ships[0].value === ships[1].value;
    }
  }
}
```

**Important:** The modification applies ONLY to the player who used the fuel power and ONLY for the current turn. Other players still use standard pair requirement.

### Fuel Power Examples

**Standard Use Cases:**

1. **Two Ships Summing to Target:**
   - Player has ships [3, 5]
   - Player uses Polarity Device (3 fuel) to set target = 8
   - Player docks ships 3+5 at Colony Constructor (total 8 = target ✓)
   - Player places colony

2. **Three Ships Summing to Target:**
   - Player has ships [2, 3, 4]
   - Player uses Polarity Device (3 fuel) to set target = 9
   - Player docks ships 2+3+4 at Colony Constructor (total 9 = target ✓)
   - Player places colony

3. **Bradbury Plateau Interaction:**
   - Player controls Bradbury Plateau (−1 ore cost at Colony Constructor)
   - Standard cost: 3 ore, Bradbury cost: 2 ore
   - Player uses Polarity Device to set target = 7
   - Player docks ships [2, 5] (total 7 = target ✓)
   - Player pays 2 ore and places colony

### Discard Power: Place Colony with Any Ships

**Cost:** Discard this card permanently
**Timing:** ACTION phase, when docking at Colony Constructor
**Effect:** Place colony using ANY combination of ships (no requirement) and pay only 2 ore (instead of 3)

**Discard Mechanics:**
```typescript
interface PolarityDeviceDiscardPower {
  cost: 'discard_card';
  timing: 'ACTION_phase';
  
  execute(ships: Ship[]): void {
    // Can use any combination of ships (no validation needed)
    if (ships.length === 0) {
      throw new Error('Must use at least one ship');
    }
    
    // Ore cost reduced to 2 (ignores Bradbury Plateau)
    const oreCost = 2;
    
    if (player.ore < oreCost) {
      throw new Error(`Insufficient ore: need ${oreCost}, have ${player.ore}`);
    }
    
    // Pay ore cost
    player.ore -= oreCost;
    
    // Commit ships to Colony Constructor
    ships.forEach(ship => {
      game.colonyConstructor.commitShip(ship);
    });
    
    // Place colony
    player.placeColony(chosenTerritory);
    
    // Return ships to supply
    ships.forEach(ship => {
      ship.location = 'supply';
      player.shipsInSupply.push(ship);
    });
    
    // Discard card permanently
    player.techCards = player.techCards.filter(card => card !== this);
    game.discardedTechCards.push(this);
  }
}
```

**Important:** Discard power ore cost is ALWAYS 2, even if player controls Bradbury Plateau. Bradbury Plateau's −1 ore bonus does NOT stack with Polarity Device's fixed 2-ore cost.

### Discard Power Examples

**Example 1: Single Ship Colony Placement**
- Player has only one ship in hand (value 6)
- Player discards Polarity Device
- Player docks value-6 ship at Colony Constructor
- Player pays 2 ore and places colony
- Critical play: Enables colony placement when no pairs available

**Example 2: Three Mismatched Ships**
- Player has ships [2, 3, 5] in hand
- Player discards Polarity Device
- Player docks all three ships at Colony Constructor
- Player pays 2 ore and places colony
- Ships return to supply

**Example 3: Bradbury Plateau Non-Interaction**
- Player controls Bradbury Plateau (−1 ore at Colony Constructor)
- Standard cost: 3 ore, Bradbury cost: 2 ore
- Player discards Polarity Device (fixed 2 ore cost)
- Bradbury bonus does NOT reduce cost to 1 ore (still pays 2)
- Net result: Discard power provides no ore advantage if Bradbury controlled

**Example 4: Combination with Repulsor Field**
- Opponent placed Repulsor Field on target territory (blocks colony placement)
- Player discards Polarity Device and docks ships at Colony Constructor
- Player pays 2 ore
- Colony placement is blocked by Repulsor Field
- Player loses: 2 ore + all docked ships + Polarity Device card
- Critical mistake: Always check for field generators before using Polarity Device discard

### Interactions

**With Facilities:**
- **Colony Constructor:** Primary interaction - modifies pair requirement or bypasses entirely
- **Colonist Hub:** Polarity Device enables getting ships to Colony Constructor when Colonist Hub inaccessible
- **Terraforming Station:** Alternative colony placement method if Terraforming Station too expensive

**With Territories:**
- **Bradbury Plateau:** 
  - Fuel power: Bradbury stacks (pay 2 ore instead of 3)
  - Discard power: Bradbury does NOT stack (still pay 2 ore)
- **Asimov Crater:** Polarity Device colonies do NOT gain +1 colony advance (only Colonist Hub colonies do)
- **All Territories:** Can target any territory for colony placement (unless blocked by Repulsor Field)

**With Tech Cards:**
- **Alien City:** Use Alien City (3 fuel → 1 colony) instead of Polarity Device if fuel abundant
- **Booster Pod:** Adjust ship values before using Polarity Device fuel power to hit exact total
- **Gravity Manipulator:** Use Gravity Manipulator (±1 all ships) to create matching pair, avoiding Polarity Device
- **Orbital Teleporter:** Teleport ships to create optimal set for Polarity Device fuel power

**With Field Generators:**
- **Repulsor Field:** Polarity Device does NOT bypass Repulsor Field (colony placement still blocked)
- **Positron Field:** Using Polarity Device on territory with Positron Field removes your own colonies
- **Isolation Field:** Polarity Device colonies on Isolation territories gain no territory bonuses

### Strategy Notes

**Fuel Power Efficiency:**
- Most efficient when you have 2-3 ships whose total matches a specific value
- Enables colony placement when dice rolls don't produce pairs
- Cost-effective: 3 fuel to place colony vs. 3 ore at Colony Constructor
- Consider fuel abundance: If fuel > ore, use Polarity Device; if ore > fuel, use standard Colony Constructor

**Discard Power Timing:**
- Best used late game when winning via colony placement critical
- Enables emergency colony placement with any ships
- Fixed 2-ore cost sometimes worse than Bradbury Plateau (2 ore) but bypasses pair requirement
- Critical if you're one colony away from victory

**Priority Considerations:**
1. Check for Repulsor Fields before using discard power
2. Compare costs: Polarity Device (2 ore) vs. Bradbury Plateau (2 ore) vs. Standard (3 ore)
3. Evaluate ship availability: Discard power works with single ship, fuel power needs multiple ships
4. Consider Alien City alternative: 3 fuel for colony (no ships needed) vs. 3 fuel for Polarity Device modification

**Resource Trade-offs:**
- Fuel power: Trade 3 fuel for flexible colony placement (save ore)
- Discard power: Trade card + 2 ore for guaranteed colony placement (no ship requirement)
- Standard Colony Constructor: 3 ore + matching pair (no tech card needed)

---

## Summary: Tech Cards Part 3 Comparison

| Card | Fuel Power | Fuel Cost | Discard Power | Best Use Case |
|------|-----------|-----------|---------------|---------------|
| **Orbital Teleporter** | Relocate 1 ship | 2 fuel | Relocate + facility bonus | Facility optimization, Lunar Mine adaptation |
| **Plasma Cannon** | None | N/A | Remove opponent's ship | Defensive disruption, Lunar Mine protection |
| **Polarity Device** | Modify Colony Constructor | 3 fuel | Any ships → colony (2 ore) | Flexible colony placement, emergency victory |

### Ambiguities Resolved

- **#126-127:** Orbital Teleporter fuel power can move ships from hand OR facilities to different facilities
- **#128:** Orbital Teleporter discard power bonuses apply immediately upon arrival at target facility
- **#129:** Plasma Cannon must be used AFTER ship docked but BEFORE facility effect resolves
- **#130:** Plasma Cannon can target ships at Maintenance Bay (they're still "at the facility")
- **#131:** Polarity Device fuel power applies only to the player who activated it and only for current turn
- **#132:** Terraforming Station forfeit requirement applies even if Plasma Cannon removes ships (see Section 3.9)
- **#133:** Polarity Device discard power ore cost is fixed at 2 (does NOT stack with Bradbury Plateau)
- **#134:** Polarity Device does NOT bypass Repulsor Field (colony placement still blocked)
- **#135:** Holographic Decoy shields prevent Plasma Cannon removal (Plasma Cannon still discarded but has no effect)

### Card Combo Strategies

**Orbital Teleporter + Lunar Mine:**
- Store ships at Maintenance Bay until Lunar Mine minimum increases
- Teleport ships to Lunar Mine after opponent raises minimum
- Discard power at Lunar Mine grants +1 ship value (bypasses minimum calculation)

**Plasma Cannon + Stasis Beam:**
- Use Stasis Beam (discard) to freeze opponent's ship at facility
- Use Plasma Cannon to remove frozen ship
- Opponent loses ship before facility effect resolves

**Polarity Device + Booster Pod:**
- Use Booster Pod (2 fuel) to adjust ship values: ±1 to one ship
- Use Polarity Device (3 fuel) to set Colony Constructor target total
- Adjust ships to match target total exactly

**Orbital Teleporter + Terraforming Station:**
- Commit 2 ships to Terraforming Station (insufficient for minimum)
- Discard Orbital Teleporter to move 3rd ship with +2 value bonus
- Meet 3-ship minimum and value ≥20 threshold

**Plasma Cannon + Holographic Decoy Defense:**
- Opponent has Plasma Cannon
- Use Holographic Decoy fuel power (1 fuel) to shield high-value ship
- Shield lasts until end of turn, blocks Plasma Cannon removal
- Secure critical facility usage (Lunar Mine minimum update, Terraforming Station colony)
