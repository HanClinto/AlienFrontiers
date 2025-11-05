# Section 7.5: Must-Dock-All Rule & Validation

## 7.5.1 Must-Dock-All Rule Overview

The **Must-Dock-All Rule** requires players to dock (or attempt to dock) all available ships during their ACTION phase. Players cannot voluntarily keep ships in hand if valid docking opportunities exist.

### Core Principle

**Rule:** If you have ships in hand and valid facilities exist where those ships can be docked, you MUST dock those ships before ending your turn.

**Exceptions:**
- No facilities accept your ship values (e.g., all ships below Lunar Mine minimum)
- All facilities are full (rare, only possible with specific game states)
- Strategic tech card usage requires holding ships (e.g., Gravity Manipulator adjustment before docking)

```typescript
interface MustDockAllRule {
  validateTurnEnd(player: Player, game: GameState): boolean {
    // Check if player has ships in hand
    if (player.shipsInHand.length === 0) {
      return true;  // No ships to dock, valid turn end
    }
    
    // Check if any facility can accept remaining ships
    const hasValidFacility = game.facilities.some(facility => {
      return player.shipsInHand.some(ship => {
        return facility.canAcceptShip(ship, player, game);
      });
    });
    
    if (hasValidFacility) {
      throw new Error('Must dock all ships before ending turn. Valid facilities exist.');
    }
    
    return true;  // No valid facilities, can end turn
  }
}
```

### Validation Logic

**Step 1: Check Ships in Hand**
- If no ships in hand → Valid turn end
- If ships in hand → Continue validation

**Step 2: Check Facility Availability**
- For each ship in hand, check all facilities
- If ANY facility can accept ANY ship → Must dock that ship
- If NO facilities can accept ANY ships → Valid turn end

**Step 3: Tech Card Exception**
- If player can use tech card to modify ships → Allow holding ships temporarily
- Player must use tech card power, then re-validate Must-Dock-All

```typescript
interface MustDockAllValidation {
  checkFacilityAvailability(ship: Ship, facilities: Facility[], player: Player, game: GameState): Facility[] {
    return facilities.filter(facility => {
      // Check basic acceptance
      if (!facility.acceptsShips) {
        return false;
      }
      
      // Facility-specific checks
      switch (facility.type) {
        case 'lunar_mine':
          return ship.value >= facility.currentMinimum || player.controlsVanVogtMountains;
        
        case 'colonist_hub':
          // Must have pair or use tech card
          return player.shipsInHand.some(other => other !== ship && other.value === ship.value);
        
        case 'colony_constructor':
          // Must have pair or use Polarity Device
          return player.shipsInHand.some(other => other !== ship && other.value === ship.value) ||
                 player.hasPolarity Device;
        
        case 'terraforming_station':
          // Check if this ship helps reach thresholds
          const totalShips = player.shipsInHand.length + game.terraformingStation.committedShips.length;
          const totalValue = player.shipsInHand.reduce((sum, s) => sum + s.value, 0) +
                            game.terraformingStation.committedShips.reduce((sum, s) => sum + s.value, 0);
          return totalShips >= 3 && totalValue >= 20;
        
        case 'alien_artifact':
          // Check if this ship helps reach value 8
          const committedValue = game.alienArtifact.committedShips.reduce((sum, s) => sum + s.value, 0);
          return (committedValue + ship.value) <= 8 + player.shipsInHand.reduce((sum, s) => sum + s.value, 0);
        
        default:
          return true;  // Other facilities accept all ships
      }
    });
  }
}
```

### Examples

**Example 1: Valid Turn End (No Valid Facilities)**
- Player has ships [2, 3] in hand
- Lunar Mine minimum is 5
- No other ships to pair with for Colonist Hub/Colony Constructor
- Not enough value for Terraforming Station
- Valid turn end: No facilities accept ships

**Example 2: Invalid Turn End (Valid Facility Exists)**
- Player has ships [4, 5] in hand
- Lunar Mine minimum is 3
- Player attempts to end turn
- Invalid: Lunar Mine accepts both value-4 and value-5 ships
- Player must dock at least one ship at Lunar Mine

**Example 3: Tech Card Exception**
- Player has ships [3, 4] in hand
- Player has Booster Pod tech card (can adjust ship values)
- Player holds ships to use Booster Pod (adjust value-3 to value-4)
- After Booster Pod: Player has [4, 4] → Can pair at Colonist Hub
- Player must dock paired ships after tech card usage

**Example 4: Strategic Holding (Invalid)**
- Player has ships [5, 5, 6] in hand
- Player wants to hold value-6 ship for next turn
- Invalid: Player can dock 5+5 at Colonist Hub
- Player must dock all ships that can be docked

### Edge Cases

**Edge Case 1: Terraforming Station Partial Commitment**
- Player has ships [6, 7, 8] (total 21 ≥ 20, meets threshold)
- Player docks ships [6, 7] at Terraforming Station (total 13 < 20, insufficient)
- Player attempts to end turn with value-8 ship in hand
- Invalid: Value-8 ship would complete Terraforming Station requirement
- Player must dock value-8 ship OR undock ships [6, 7] first

**Edge Case 2: Alien Artifact Overload**
- Player has ships [3, 5, 6] in hand
- Player wants to claim tech card (need total ≥ 8)
- Player docks ships [3, 5] at Alien Artifact (total 8)
- Player attempts to keep value-6 ship in hand
- Valid: Value-6 ship would exceed useful threshold (total 14, only need 8)
- Player can keep value-6 ship for next facility

**Edge Case 3: Maintenance Bay as Catch-All**
- Player has ships [2, 3] in hand
- Lunar Mine minimum is 5 (ships cannot dock)
- No pairs for Colonist Hub/Colony Constructor
- Maintenance Bay always accepts ships (stores them)
- Player MUST dock ships at Maintenance Bay before ending turn

**Edge Case 4: Relic Ship Returns During Validation**
- Player has Relic Ship value-6 in hand
- Player's turn ends (CLEANUP phase)
- Relic Ship returns to Burroughs Desert automatically
- Must-Dock-All validation occurs BEFORE Relic Ship returns
- Player must dock Relic Ship if valid facility exists

---

## Section 8: Edge Cases and Complex Interactions

## 8.1 Facility Edge Cases

### 8.1.1 Alien Artifact Edge Cases

**Edge Case: Over-Committing Ships**
- Player docks ships [3, 4, 5] at Alien Artifact (total 12)
- Only need total ≥ 8 to claim tech card
- Excess value (12 - 8 = 4) provides no benefit
- Resolution: Allow over-commitment, but warn player of inefficiency

**Edge Case: Exact Value 8 with Multiple Combinations**
- Player has ships [2, 3, 3, 6] in hand
- Multiple ways to reach 8: [2, 6], [2, 3, 3], [3, 3] + additional
- Player can choose any combination
- Resolution: Player chooses optimal combination (fewest ships)

**Edge Case: Claiming Last Tech Card**
- 11 tech cards claimed, only 1 remains (e.g., Temporal Warper)
- Player docks ships at Alien Artifact (total ≥ 8)
- Player claims last tech card
- Resolution: No more tech cards available (Alien Artifact effectively closed)

**Edge Case: Plasma Cannon Removes Ship Before Threshold**
- Player docks ships [3, 5] at Alien Artifact (total 8)
- Opponent uses Plasma Cannon to remove value-5 ship
- Total becomes 3 (less than 8)
- Resolution: Player does NOT claim tech card (threshold not met)

```typescript
interface AlienArtifactEdgeCases {
  handleOverCommitment(ships: Ship[]): void {
    const total = ships.reduce((sum, ship) => sum + ship.value, 0);
    
    if (total > 8) {
      console.warn(`Over-commitment: total ${total} exceeds required 8. Consider using fewer ships.`);
    }
    
    // Allow over-commitment (no penalty, just inefficient)
  }
  
  handleLastTechCard(game: GameState): void {
    if (game.techCardDeck.length === 0) {
      console.log('No more tech cards available. Alien Artifact has no effect.');
      game.alienArtifact.disabled = true;
    }
  }
}
```

### 8.1.2 Colonist Hub Edge Cases

**Edge Case: Multiple Pairs Available**
- Player has ships [4, 4, 5, 5] in hand
- Can dock [4, 4] OR [5, 5] at Colonist Hub
- Player chooses which pair to use
- Resolution: Player selects optimal pair based on strategy

**Edge Case: Alien Monument Stacking**
- Player controls Asimov Crater (+1 colony advance)
- Player has Alien Monument fuel power (+1 colony advance)
- Player docks pair at Colonist Hub
- Total bonus: +2 colony advance (Asimov + Alien Monument)
- Resolution: Bonuses stack, player places colony 2 spaces forward on track

**Edge Case: Plasma Cannon Breaks Pair**
- Player docks ships [5, 5] at Colonist Hub
- Opponent uses Plasma Cannon to remove one value-5 ship
- Only one value-5 ship remains (no longer a pair)
- Resolution: Colony placement fails (no pair = no colony)

**Edge Case: Odd Number of Same-Value Ships**
- Player has ships [4, 4, 4] in hand
- Player docks two value-4 ships at Colonist Hub (pair valid)
- One value-4 ship remains in hand
- Resolution: Must dock remaining value-4 ship at different facility (Must-Dock-All rule)

```typescript
interface ColonistHubEdgeCases {
  handleMultiplePairs(player: Player): Ship[] {
    const pairs = this.findAllPairs(player.shipsInHand);
    
    if (pairs.length > 1) {
      console.log(`Multiple pairs available: ${pairs.map(p => p.map(s => s.value).join('+'))}`);
      // Player chooses which pair to use
      return player.choosePair(pairs);
    }
    
    return pairs[0];
  }
  
  handleAlienMonumentStacking(player: Player, game: GameState): number {
    let colonyAdvance = 1;  // Base advance
    
    if (player.controlsAsimovCrater) {
      colonyAdvance += 1;  // Asimov bonus
    }
    
    if (player.usedAlienMonumentFuelPower) {
      colonyAdvance += 1;  // Alien Monument bonus
    }
    
    return colonyAdvance;
  }
}
```

### 8.1.3 Colony Constructor Edge Cases

**Edge Case: Bradbury Plateau + Polarity Device Discard**
- Player controls Bradbury Plateau (−1 ore, cost = 2 ore)
- Player uses Polarity Device discard (fixed 2 ore cost)
- Bradbury bonus does NOT stack with Polarity Device
- Resolution: Player pays 2 ore (Polarity Device overrides Bradbury)

**Edge Case: Repulsor Field Blocks Colony Placement**
- Player docks pair [6, 6] at Colony Constructor
- Player pays 3 ore
- Opponent has Repulsor Field on target territory
- Colony placement blocked (but ships still return to supply, ore still spent)
- Resolution: Player loses resources and ships, gains nothing

**Edge Case: Polarity Device Fuel Power with Bradbury**
- Player controls Bradbury Plateau (−1 ore)
- Player uses Polarity Device fuel power (modify requirement to sum = target)
- Player docks ships [3, 4] (sum = 7) at Colony Constructor
- Bradbury bonus applies (cost = 2 ore instead of 3)
- Resolution: Polarity Device fuel power stacks with Bradbury

**Edge Case: Multiple Pairs with Polarity Device**
- Player has ships [3, 3, 4, 4] in hand
- Player uses Polarity Device fuel power (target sum = 8)
- Player can dock [4, 4] (sum = 8) OR [3, 3] + additional (sum ≥ 8)
- Resolution: Player chooses optimal combination (fewest ships for efficiency)

```typescript
interface ColonyConstructorEdgeCases {
  calculateCost(player: Player, usingPolarityDeviceDiscard: boolean): number {
    if (usingPolarityDeviceDiscard) {
      return 2;  // Fixed cost, Bradbury does NOT apply
    }
    
    let cost = 3;  // Base cost
    
    if (player.controlsBradburyPlateau) {
      cost -= 1;  // Bradbury bonus applies
    }
    
    return cost;
  }
  
  handleRepulsorFieldBlock(player: Player, territory: Territory): void {
    if (territory.hasRepulsorField) {
      console.log('Colony placement blocked by Repulsor Field');
      // Ships already returned to supply
      // Ore already spent
      // No colony placed (no refund)
    }
  }
}
```

### 8.1.4 Lunar Mine Edge Cases

**Edge Case: Van Vogt Bypass with Minimum Update**
- Player controls Van Vogt Mountains (bypass minimum)
- Lunar Mine minimum is 5
- Player docks value-3 ship at Lunar Mine (bypasses minimum)
- Minimum does NOT update to 3 (bypass means "ignore minimum check, not update minimum")
- Resolution: Minimum remains at 5, player gains value-3 ship advantage

**Edge Case: Relic Ship Updates Minimum, Then Returns**
- Player docks Relic Ship value-6 at Lunar Mine
- Minimum updates to 6
- Next GATHER phase: Relic Ship returns to Burroughs Desert
- Minimum remains at 6 (does NOT reset when Relic Ship returns)
- Resolution: Minimum persists (permanent update)

**Edge Case: Plasma Cannon Prevents Minimum Update**
- Current minimum is 3
- Player docks value-6 ship at Lunar Mine (would update minimum to 6)
- Opponent uses Plasma Cannon to remove value-6 ship BEFORE facility resolves
- Minimum remains at 3 (ship removed before update)
- Resolution: Plasma Cannon timing prevents minimum update

**Edge Case: Multiple Ships at Lunar Mine**
- Player docks ships [4, 5, 6] at Lunar Mine
- Minimum is 2
- First ship (value-4) updates minimum to 4
- Second ship (value-5) updates minimum to 5
- Third ship (value-6) updates minimum to 6
- Resolution: Minimum updated progressively (highest value determines final minimum)

```typescript
interface LunarMineEdgeCases {
  handleVanVogtBypass(ship: Ship, currentMinimum: number): void {
    if (ship.value < currentMinimum) {
      console.log(`Van Vogt bypass: ${ship.value} < ${currentMinimum}, bypass allows docking`);
      // Ship docks successfully
      // Minimum does NOT update (bypass only affects acceptance, not minimum)
    }
  }
  
  handleRelicShipReturn(game: GameState): void {
    // Relic Ship returns to Burroughs Desert
    // Minimum persists (does NOT reset)
    console.log('Relic Ship returned. Lunar Mine minimum persists.');
  }
  
  handleMultipleShips(ships: Ship[], currentMinimum: number): number {
    let newMinimum = currentMinimum;
    
    ships.forEach(ship => {
      if (ship.value > newMinimum) {
        newMinimum = ship.value;
        console.log(`Lunar Mine minimum updated to ${newMinimum}`);
      }
    });
    
    return newMinimum;
  }
}
```

### 8.1.5 Maintenance Bay Edge Cases

**Edge Case: Relic Ship Storage**
- Player stores Relic Ship at Maintenance Bay
- Next GATHER phase: Relic Ship returns to Burroughs Desert (even though stored)
- Maintenance Bay is now empty
- Resolution: Relic Ship return overrides Maintenance Bay storage

**Edge Case: Plasma Cannon Removes Stored Ship**
- Player has value-6 ship stored at Maintenance Bay
- Opponent uses Plasma Cannon to remove stored ship
- Ship returns to player's supply (not hand)
- Resolution: Plasma Cannon can target stored ships (they're "at the facility")

**Edge Case: Unlimited Storage Capacity**
- Player stores ships [2, 3, 4, 5, 6] at Maintenance Bay over 5 turns
- All ships generate 1 ore each (5 ore total)
- No limit on stored ships
- Resolution: Allow unlimited storage (no maximum capacity)

**Edge Case: Orbital Teleporter Retrieves Stored Ship**
- Player has value-6 ship stored at Maintenance Bay
- Player uses Orbital Teleporter fuel power to move value-6 ship to hand
- Ship now available for docking this turn (instead of waiting until next turn)
- Resolution: Orbital Teleporter bypasses Maintenance Bay delay

```typescript
interface MaintenanceBayEdgeCases {
  handleRelicShipStorage(relicShip: Ship, game: GameState): void {
    // Store Relic Ship (valid action)
    this.storedShips.push(relicShip);
    relicShip.location = 'maintenance_bay';
    
    // At start of next GATHER phase, Relic Ship returns
    game.onGatherPhaseStart(() => {
      if (this.storedShips.includes(relicShip)) {
        this.storedShips = this.storedShips.filter(s => s !== relicShip);
        relicShip.location = 'burroughs_desert';
        console.log('Relic Ship returned from Maintenance Bay to Burroughs Desert');
      }
    });
  }
  
  handleUnlimitedStorage(ships: Ship[]): void {
    // No capacity limit (allow unlimited storage)
    this.storedShips.push(...ships);
    console.log(`${ships.length} ships stored. Total stored: ${this.storedShips.length}`);
  }
}
```

### 8.1.6 Orbital Market Edge Cases

**Edge Case: Heinlein Plains Once-Per-Turn Limit**
- Player controls Heinlein Plains (1:1 conversion, once per turn)
- Player docks ships at Orbital Market
- First trade uses Heinlein bonus (1:1 ratio)
- Second trade uses standard ratios (1:2, 1:1, or 2:1 depending on ships)
- Resolution: Heinlein bonus applies ONCE per turn (not per ship)

**Edge Case: Odd Total Value with Conversion**
- Player docks ships [3, 4] at Orbital Market (total 7)
- Player converts ore → fuel (1 ore → 2 fuel ratio)
- With 7 value, player gets ⌊7/1⌋ = 7 ore available to convert
- Player converts 3 ore → 6 fuel
- Resolution: Player chooses how much to convert (up to total value limit)

**Edge Case: Resource Cache vs. Orbital Market Efficiency**
- Player has 6 fuel, needs 3 ore
- Option A (Orbital Market): Dock ships, trade at 2:1 ratio (6 fuel → 3 ore, costs ships)
- Option B (Resource Cache): Use fuel power (1 fuel activation + 3 fuel → 3 ore = 4 fuel total, no ships)
- Resolution: Resource Cache more efficient (saves 2 fuel + keeps ships available)

**Edge Case: Multiple Ships with Different Values**
- Player docks ships [2, 5] at Orbital Market (total 7)
- Ship contributions: value-2 provides 2 resources, value-5 provides 5 resources
- Player can split conversions: Use value-2 for ore→fuel (1:2), value-5 for fuel→ore (1:1)
- Resolution: Player optimizes conversion based on ship values

```typescript
interface OrbitalMarketEdgeCases {
  handleHeinleinOncePerTurn(player: Player, game: GameState): void {
    if (player.controlsHeinleinPlains && !player.usedHeinleinBonusThisTurn) {
      console.log('Heinlein Plains bonus: First trade at 1:1 ratio');
      player.usedHeinleinBonusThisTurn = true;
      // Reset at end of turn
      game.onCleanupPhaseEnd(() => {
        player.usedHeinleinBonusThisTurn = false;
      });
    }
  }
  
  calculateConversionOptions(ships: Ship[]): ConversionOption[] {
    const totalValue = ships.reduce((sum, ship) => sum + ship.value, 0);
    
    return [
      { from: 'ore', to: 'fuel', ratio: 2, maxAmount: totalValue },
      { from: 'fuel', to: 'ore', ratio: 1, maxAmount: totalValue },
      { from: 'fuel', to: 'ore', ratio: 0.5, maxAmount: Math.floor(totalValue / 2) }
    ];
  }
}
```

### 8.1.7 Raiders' Outpost Edge Cases

**Edge Case: Holographic Decoy Shields Opponent**
- Player raids opponent using Raiders' Outpost
- Opponent has Holographic Decoy discard power active (shields all resources)
- Raid fails (no ore stolen)
- Player still pays 1 fuel cost (no refund)
- Resolution: Holographic Decoy blocks raid, player loses fuel

**Edge Case: Opponent Has Zero Ore**
- Player raids opponent at Raiders' Outpost
- Opponent has 0 ore (all fuel)
- Raid fails (cannot steal what doesn't exist)
- Player still pays 1 fuel cost
- Resolution: Raid can fail if opponent has no ore

**Edge Case: Sequential Raids**
- Player docks ships [3, 4, 5] at Raiders' Outpost
- Player raids 3 times (3 ships = 3 raids)
- Each raid costs 1 fuel (total 3 fuel)
- Each raid steals 1 ore (total 3 ore stolen)
- Resolution: Multiple ships enable multiple sequential raids

**Edge Case: Orbital Teleporter Free Raid Bonus**
- Player uses Orbital Teleporter discard power to move ship to Raiders' Outpost with free raid bonus
- Player raids without paying 1 fuel cost
- Player steals 1 ore (bonus waives fuel cost)
- Resolution: Orbital Teleporter discard bonus applies

```typescript
interface RaidersOutpostEdgeCases {
  executeRaid(player: Player, opponent: Player, isFree: boolean = false): void {
    // Pay fuel cost (unless free raid)
    if (!isFree) {
      if (player.fuel < 1) {
        throw new Error('Insufficient fuel to raid');
      }
      player.fuel -= 1;
    }
    
    // Check if opponent has ore
    if (opponent.ore === 0) {
      console.log('Raid failed: opponent has no ore');
      return;  // Fuel cost already paid (no refund)
    }
    
    // Check for Holographic Decoy shield
    if (opponent.hasHolographicDecoyShield) {
      console.log('Raid blocked by Holographic Decoy');
      return;  // Fuel cost already paid (no refund)
    }
    
    // Steal 1 ore
    opponent.ore -= 1;
    player.ore += 1;
    console.log(`${player.name} stole 1 ore from ${opponent.name}`);
  }
}
```

### 8.1.8 Shipyard Edge Cases

**Edge Case: Pohl Foothills Value-7 Ships**
- Player controls Pohl Foothills (+1 die value at Shipyard)
- Player builds ship with die value 6
- Ship is built with value 7 (6 + 1 bonus)
- Value-7 ship is valid (exceeds standard 1-6 range)
- Resolution: Allow value-7 ships from Pohl bonus

**Edge Case: Building Multiple Ships Sequentially**
- Player has 0 ships built initially
- Player docks ships at Shipyard to build 3 new ships
- Ship 1 costs: 1 ore (N=1, cost = 1×(1+1)/2 = 1)
- Ship 2 costs: 2 ore (N=2, cost = 2×(2+1)/2 = 3, cumulative = 3-1 = 2)
- Ship 3 costs: 3 ore (N=3, cost = 3×(3+1)/2 = 6, cumulative = 6-3 = 3)
- Total cost: 1+2+3 = 6 ore
- Resolution: Cumulative cost calculation (sequential builds)

**Edge Case: Insufficient Ore for Desired Ships**
- Player wants to build 4 ships (cost = 10 ore)
- Player has only 6 ore
- Player can build 3 ships (cost = 6 ore) instead
- Resolution: Player builds maximum ships affordable (partial fulfillment)

**Edge Case: Zero Ships Built (First Build)**
- Player has never built ships (N=0)
- Player builds first ship (N=1, cost = 1 ore)
- First ship costs 1 ore (minimum cost)
- Resolution: First ship always costs 1 ore

```typescript
interface ShipyardEdgeCases {
  calculateCumulativeCost(currentShipsBuilt: number, newShips: number, hasPohl: boolean): number {
    let totalCost = 0;
    
    for (let i = 1; i <= newShips; i++) {
      const n = currentShipsBuilt + i;
      const shipCost = (n * (n + 1)) / 2;
      const previousCost = currentShipsBuilt + i - 1;
      const cumulativeCost = shipCost - (currentShipsBuilt * (currentShipsBuilt + 1)) / 2;
      totalCost += n;  // Each ship costs N ore (cumulative)
    }
    
    return totalCost;
  }
  
  handlePohlBonus(ship: Ship, player: Player): void {
    if (player.controlsPohlFoothills) {
      ship.value += 1;  // +1 die value
      console.log(`Pohl Foothills bonus: Ship built with value ${ship.value}`);
    }
  }
  
  handleInsufficientOre(player: Player, desiredShips: number): number {
    let affordableShips = 0;
    let totalCost = 0;
    
    for (let i = 1; i <= desiredShips; i++) {
      const shipCost = player.shipsBuilt + i;
      
      if (totalCost + shipCost <= player.ore) {
        affordableShips = i;
        totalCost += shipCost;
      } else {
        break;
      }
    }
    
    console.log(`Insufficient ore. Can build ${affordableShips} of ${desiredShips} desired ships.`);
    return affordableShips;
  }
}
```

### 8.1.9 Solar Converter Edge Cases

**Edge Case: Lem Badlands Bonus Per Ship**
- Player controls Lem Badlands (+1 fuel per ship)
- Player docks ships [4, 5, 6] at Solar Converter
- Ship values: 4 generates ⌈4/2⌉ = 2 fuel + 1 (Lem) = 3 fuel
- Ship values: 5 generates ⌈5/2⌉ = 3 fuel + 1 (Lem) = 4 fuel
- Ship values: 6 generates ⌈6/2⌉ = 3 fuel + 1 (Lem) = 4 fuel
- Total: 3+4+4 = 11 fuel
- Resolution: Lem bonus applies per ship (not total)

**Edge Case: Odd-Value Ships (Rounding)**
- Player docks value-1 ship at Solar Converter
- Base fuel: ⌈1/2⌉ = ⌈0.5⌉ = 1 fuel
- Resolution: Ceiling rounding ensures minimum 1 fuel per ship

**Edge Case: Orbital Teleporter Conversion Boost**
- Player uses Orbital Teleporter discard power to move ship to Solar Converter with +1 value bonus
- Ship value-5 becomes value-6 for conversion
- Fuel generated: ⌈6/2⌉ = 3 fuel (instead of ⌈5/2⌉ = 3 fuel)
- With Lem Badlands: 3 + 1 = 4 fuel
- Resolution: Orbital Teleporter bonus applies before conversion calculation

**Edge Case: Resource Limit Overflow**
- Player has 6 fuel, 0 ore (6 total resources)
- Player docks ships generating 5 fuel at Solar Converter
- Player would have 11 fuel (exceeds 7 limit)
- Resolution: Player gains all 5 fuel during ACTION phase, discards down to 7 during CLEANUP phase

```typescript
interface SolarConverterEdgeCases {
  calculateFuelGeneration(ship: Ship, player: Player, hasTeleporterBonus: boolean = false): number {
    let value = ship.value;
    
    // Apply Orbital Teleporter bonus
    if (hasTeleporterBonus) {
      value += 1;
    }
    
    // Calculate base fuel (ceiling rounding)
    let fuel = Math.ceil(value / 2);
    
    // Apply Lem Badlands bonus
    if (player.controlsLemBadlands) {
      fuel += 1;
    }
    
    return fuel;
  }
  
  handleResourceOverflow(player: Player, fuelGenerated: number): void {
    player.fuel += fuelGenerated;
    
    const totalResources = player.fuel + player.ore;
    const limit = player.hasResourceCache ? 12 : 7;
    
    if (totalResources > limit) {
      console.warn(`Resource overflow: ${totalResources} > ${limit}. Will discard during CLEANUP.`);
    }
  }
}
```

### 8.1.10 Terraforming Station Edge Cases

**Edge Case: Plasma Cannon Removes Ship (Forfeit Still Required)**
- Player commits ships [6, 7, 8] to Terraforming Station (total 21)
- Opponent uses Plasma Cannon to remove value-8 ship
- Total becomes 6+7 = 13 (less than 20, colony placement fails)
- Player must still forfeit 1 ship (return to supply)
- Resolution: Forfeit requirement applies even if colony placement fails

**Edge Case: Orbital Teleporter +2 Value Bonus**
- Player commits ships [6, 6] to Terraforming Station (total 12, insufficient)
- Player uses Orbital Teleporter discard to move value-8 ship with +2 bonus
- Ship counts as value 10 (8+2), total becomes 6+6+10 = 22 (sufficient)
- Player places colony and forfeits 1 ship
- Resolution: Orbital Teleporter bonus counts toward value threshold

**Edge Case: Forfeiting Relic Ship**
- Player commits Relic Ship + 2 regular ships to Terraforming Station
- Player places colony, must forfeit 1 ship
- Player chooses to forfeit Relic Ship (returns to Burroughs Desert)
- Player's regular ships return to supply
- Resolution: Forfeiting Relic Ship is optimal (no supply loss)

**Edge Case: Exactly 3 Ships with Exactly Value 20**
- Player commits ships [6, 7, 7] to Terraforming Station (total 20, exact threshold)
- Player places colony (meets both requirements: ≥3 ships, value ≥20)
- Player forfeits 1 ship (must choose which ship to forfeit)
- Resolution: Player chooses optimal ship to forfeit (e.g., forfeit value-6, keep value-7s)

```typescript
interface TerraformingStationEdgeCases {
  validateRequirements(ships: Ship[], hasTeleporterBonus: boolean = false): boolean {
    // Check ship count
    if (ships.length < 3) {
      return false;
    }
    
    // Calculate total value (with bonus if applicable)
    let totalValue = ships.reduce((sum, ship) => sum + ship.value, 0);
    
    if (hasTeleporterBonus) {
      // Assume last ship has +2 bonus
      totalValue += 2;
    }
    
    // Check value threshold
    return totalValue >= 20;
  }
  
  handleForfeitWithFailure(player: Player, ships: Ship[]): void {
    // Colony placement failed (Plasma Cannon removed ship)
    // But forfeit still required
    
    const shipToForfeit = player.chooseShipToForfeit(ships);
    
    if (shipToForfeit.isRelic) {
      shipToForfeit.location = 'burroughs_desert';
    } else {
      shipToForfeit.location = 'supply';
      player.shipsInSupply.push(shipToForfeit);
    }
    
    console.log(`${player.name} forfeited ${shipToForfeit.value}-value ship despite failed colony placement`);
  }
}
```

---

## 8.2 Multi-System Interaction Edge Cases

### 8.2.1 Tech Card + Facility + Territory Combos

**Combo 1: Polarity Device + Colony Constructor + Bradbury Plateau**
- Player controls Bradbury Plateau (−1 ore cost at Colony Constructor)
- Player uses Polarity Device fuel power (3 fuel, modify requirement)
- Player docks ships [3, 4] at Colony Constructor (sum = 7, meets modified requirement)
- Ore cost: 3 ore (base) −1 (Bradbury) = 2 ore
- Resolution: Polarity Device fuel power stacks with Bradbury bonus

**Combo 2: Alien Monument + Colonist Hub + Asimov Crater**
- Player controls Asimov Crater (+1 colony advance)
- Player uses Alien Monument fuel power (1 fuel, +1 colony advance)
- Player docks pair at Colonist Hub
- Total advance: 1 (base) + 1 (Asimov) + 1 (Alien Monument) = 3 spaces forward
- Resolution: All bonuses stack additively

**Combo 3: Data Crystal + Lem Badlands + Solar Converter**
- Opponent controls Lem Badlands
- Player uses Data Crystal fuel power (1 fuel, borrow Lem bonus)
- Player docks value-6 ship at Solar Converter
- Fuel generated: ⌈6/2⌉ + 1 (borrowed Lem bonus) = 3 + 1 = 4 fuel
- Resolution: Borrowed bonus applies as if player controlled territory

**Combo 4: Orbital Teleporter + Terraforming Station + Pohl Foothills**
- Player uses Orbital Teleporter discard to move ship to Terraforming Station (+2 value bonus)
- Ship value-6 counts as value-8 (6+2)
- If player also controls Pohl Foothills (but Pohl only applies to Shipyard)
- Resolution: Bonuses do NOT stack (Pohl only applies to Shipyard, not Terraforming Station)

```typescript
interface MultiSystemCombos {
  calculateColonyConstructorCost(player: Player, usingPolarityFuel: boolean): number {
    let cost = 3;  // Base cost
    
    if (usingPolarityFuel && player.controlsBradburyPlateau) {
      cost -= 1;  // Bradbury bonus stacks with Polarity fuel power
    }
    
    return cost;
  }
  
  calculateColonyAdvance(player: Player, usedAlienMonument: boolean): number {
    let advance = 1;  // Base advance
    
    if (player.controlsAsimovCrater) {
      advance += 1;  // Asimov bonus
    }
    
    if (usedAlienMonument) {
      advance += 1;  // Alien Monument bonus
    }
    
    return advance;
  }
}
```

### 8.2.2 Field Generator + Tech Card + Facility Combos

**Combo 1: Isolation Field + Data Crystal + Territory Bonus**
- Opponent places Isolation Field on Lem Badlands (blocks territory bonuses)
- Player uses Data Crystal to borrow Lem bonus
- Isolation Field blocks borrowed bonus (Data Crystal fails)
- Resolution: Isolation Field takes precedence (blocks all bonuses including borrowed)

**Combo 2: Repulsor Field + Polarity Device + Colony Constructor**
- Opponent places Repulsor Field on target territory
- Player uses Polarity Device discard (2 ore, any ships → colony)
- Player pays 2 ore, docks ships, but colony placement blocked by Repulsor
- Player loses: 2 ore + ships + Polarity Device card
- Resolution: Repulsor Field blocks colony placement (Polarity Device does NOT bypass)

**Combo 3: Positron Field + Alien City + Territory**
- Opponent places Positron Field on territory with opponent's 2 colonies
- Positron Field removes opponent's 2 colonies
- Player uses Alien City discard power to place 2 new colonies on same territory
- Player's colonies placed successfully (Positron only affects placer's colonies)
- Resolution: Positron one-time effect (does NOT affect subsequent colony placements)

**Combo 4: Booster Pod + Isolation Field + Facility**
- Player uses Booster Pod discard to place Isolation Field on territory
- Isolation Field blocks territory bonuses for ALL players (including placer)
- Player cannot benefit from territory bonus while Isolation active
- Resolution: Self-inflicted penalty (strategic use to deny opponent critical bonuses)

```typescript
interface FieldGeneratorTechCardCombos {
  checkIsolationBlocksBorrowedBonus(territory: Territory, player: Player): boolean {
    if (territory.hasIsolationField) {
      console.log('Isolation Field blocks Data Crystal borrowed bonus');
      return true;  // Blocked
    }
    
    return false;  // Not blocked
  }
  
  checkRepulsorBlocksColonyPlacement(territory: Territory): boolean {
    if (territory.hasRepulsorField) {
      console.log('Repulsor Field blocks colony placement (including Polarity Device)');
      return true;  // Blocked
    }
    
    return false;  // Not blocked
  }
}
```

### 8.2.3 Relic Ship + Tech Card + Facility Combos

**Combo 1: Relic Ship + Orbital Teleporter + Lunar Mine**
- Player acquires Relic Ship (3 ore, value-6)
- Player uses Orbital Teleporter fuel power to move Relic Ship to Lunar Mine
- Lunar Mine minimum updates to 6
- Next GATHER phase: Relic Ship returns, minimum remains 6
- Resolution: Relic Ship enables permanent Lunar Mine minimum increase

**Combo 2: Relic Ship + Booster Pod + Terraforming Station**
- Player has Relic Ship value-5
- Player uses Booster Pod fuel power to adjust Relic Ship to value-6 (5+1)
- Player commits Relic Ship (value-6) + 2 regular ships to Terraforming Station
- Total value increased by Booster Pod adjustment
- Resolution: Booster Pod enhances Relic Ship for critical threshold

**Combo 3: Relic Ship + Holographic Decoy + Plasma Cannon Defense**
- Player has Relic Ship value-6 at Lunar Mine
- Opponent prepares Plasma Cannon to remove Relic Ship
- Player uses Holographic Decoy fuel power to shield Relic Ship
- Plasma Cannon blocked (Relic Ship protected)
- Resolution: Holographic Decoy protects Relic Ship from removal

**Combo 4: Relic Ship + Gravity Manipulator + Fleet Optimization**
- Player has Relic Ship value-4 + regular ships [3, 5]
- Player uses Gravity Manipulator fuel power (3 fuel, +1 all ships)
- Relic Ship becomes value-5, regular ships become [4, 6]
- Player docks Relic Ship (value-5) at Lunar Mine, pairs [4, 6] at Colonist Hub
- Resolution: Gravity Manipulator applies to Relic Ship (treated as regular ship)

```typescript
interface RelicShipTechCardCombos {
  applyBoosterPodToRelicShip(relicShip: Ship, adjustment: number): void {
    relicShip.value += adjustment;  // +1 or -1
    console.log(`Booster Pod adjusted Relic Ship to value ${relicShip.value}`);
  }
  
  applyGravityManipulatorToRelicShip(relicShip: Ship, allShips: Ship[], adjustment: number): void {
    // Gravity Manipulator affects ALL ships (including Relic Ship)
    allShips.forEach(ship => {
      ship.value += adjustment;
    });
    
    console.log(`Gravity Manipulator adjusted Relic Ship to value ${relicShip.value}`);
  }
}
```
