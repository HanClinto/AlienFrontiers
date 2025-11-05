# Section 7: Advanced Rules

## 7.1 Relic Ship Comprehensive Rules

The **Relic Ship** is a special fifth ship token that any player can acquire from Burroughs Desert territory. It functions as a standard ship but has unique acquisition, ownership, and return mechanics.

### Acquisition Requirements

**Location:** Burroughs Desert territory
**Cost:** 3 ore
**Timing:** GATHER phase only

```typescript
interface RelicShipAcquisition {
  location: 'burroughs_desert';
  cost: 3;  // ore
  timing: 'GATHER_phase';
  
  canAcquire(player: Player, game: GameState): boolean {
    // Must be GATHER phase
    if (game.currentPhase !== 'GATHER') {
      return false;
    }
    
    // Player must have 3 ore
    if (player.ore < 3) {
      return false;
    }
    
    // Relic Ship must be available (at Burroughs Desert, not in player's possession)
    if (game.relicShip.location !== 'burroughs_desert') {
      return false;
    }
    
    // Player must NOT already have Relic Ship
    if (player.hasRelicShip) {
      return false;
    }
    
    return true;
  }
  
  acquire(player: Player): void {
    // Pay cost
    player.ore -= 3;
    
    // Transfer Relic Ship to player
    game.relicShip.location = 'player_hand';
    game.relicShip.owner = player;
    player.hasRelicShip = true;
    player.shipsInHand.push(game.relicShip);
    
    // Log acquisition
    console.log(`${player.name} acquired Relic Ship from Burroughs Desert for 3 ore`);
  }
}
```

### Relic Ship Properties

**Die Value:** Determined by dice roll (same as regular ships)
**Ownership:** Temporary (returns to Burroughs Desert each GATHER phase)
**Usage:** Can be used at any facility (same as regular ships)
**Forfeiture:** Can be forfeited at Terraforming Station (returns to Burroughs Desert)

```typescript
interface RelicShip extends Ship {
  type: 'relic_ship';
  isRelic: true;
  returnsToDesert: true;  // Returns each GATHER phase
  
  // Same properties as regular ships
  value: number;  // Determined by dice roll
  location: 'hand' | 'facility' | 'supply' | 'burroughs_desert';
  owner: Player | null;
  currentFacility: Facility | null;
}
```

### Return Mechanics

**Automatic Return:** At the start of each GATHER phase, if any player has the Relic Ship, it returns to Burroughs Desert.

**Return Conditions:**
- Player has Relic Ship in hand (not yet docked)
- Player has Relic Ship at a facility (already docked)
- Player forfeited Relic Ship at Terraforming Station (previous turn)

```typescript
interface RelicShipReturn {
  timing: 'GATHER_phase_start';
  automatic: true;
  
  executeReturn(game: GameState): void {
    // Find current owner
    const currentOwner = game.players.find(p => p.hasRelicShip);
    
    if (currentOwner) {
      // Remove from owner's hand
      currentOwner.shipsInHand = currentOwner.shipsInHand.filter(s => !s.isRelic);
      currentOwner.hasRelicShip = false;
      
      // Remove from facility if docked
      if (game.relicShip.currentFacility) {
        game.relicShip.currentFacility.uncommitShip(game.relicShip);
        game.relicShip.currentFacility = null;
      }
      
      // Return to Burroughs Desert
      game.relicShip.location = 'burroughs_desert';
      game.relicShip.owner = null;
      
      console.log(`Relic Ship returned to Burroughs Desert at start of GATHER phase`);
    }
  }
}
```

**Critical Rule:** Relic Ship returns BEFORE player acquires it again. This means:
1. GATHER phase starts
2. Relic Ship returns to Burroughs Desert (if any player has it)
3. Current player can acquire Relic Ship (if they have 3 ore)
4. Current player continues GATHER phase (territory resources, field generator removal)

### Relic Ship Usage

**Facility Usage:** Relic Ship can be used at any facility, following standard facility rules.

**Examples:**

**Lunar Mine:**
- Relic Ship value 6 docked at Lunar Mine
- Minimum updates to 6 (if previous minimum was lower)
- Relic Ship returns to Burroughs Desert at start of next GATHER phase
- Minimum REMAINS at 6 (does not reset when Relic Ship returns)

**Terraforming Station:**
- Player commits 3 ships including Relic Ship to Terraforming Station
- Total value ≥ 20, player places colony
- Player must forfeit 1 ship (can choose Relic Ship)
- If Relic Ship forfeited, it returns to Burroughs Desert immediately
- Relic Ship does NOT return to player's supply (it's not owned by player)

**Colonist Hub:**
- Relic Ship value 5, player pairs with regular ship value 5
- Player docks both at Colonist Hub, places colony
- Both ships return to supply (Relic Ship returns to Burroughs Desert, not player's supply)

**Maintenance Bay:**
- Relic Ship can be stored at Maintenance Bay
- Relic Ship remains at Maintenance Bay until GATHER phase
- At start of GATHER phase, Relic Ship returns to Burroughs Desert (even if stored)

### Relic Ship Interactions

**With Facilities:**
- **All Facilities:** Relic Ship can be used at any facility (no restrictions)
- **Lunar Mine:** Relic Ship can update minimum (minimum persists after Relic Ship returns)
- **Terraforming Station:** Relic Ship can be forfeited (returns to Burroughs Desert, not supply)
- **Maintenance Bay:** Relic Ship stored at Maintenance Bay still returns to Burroughs Desert each GATHER phase

**With Territories:**
- **Burroughs Desert:** Relic Ship acquired from here (3 ore cost)
- **Van Vogt Mountains:** Relic Ship can bypass Lunar Mine minimum (if player controls Van Vogt)
- **Pohl Foothills:** Relic Ship built at Shipyard gains +1 value (if player controls Pohl)
- **Lem Badlands:** Relic Ship at Solar Converter gains +1 fuel (if player controls Lem)

**With Tech Cards:**
- **Booster Pod:** Can adjust Relic Ship value (±1) for 2 fuel
- **Gravity Manipulator:** Relic Ship affected by Gravity Manipulator (±1 all ships)
- **Holographic Decoy:** Can shield Relic Ship from Plasma Cannon/Stasis Beam
- **Orbital Teleporter:** Can relocate Relic Ship between facilities
- **Plasma Cannon:** Can remove Relic Ship from facility (returns to Burroughs Desert)
- **Stasis Beam:** Can freeze Relic Ship (cannot dock that turn)

**With Field Generators:**
- No special interactions (Relic Ship follows standard field generator rules)

### Examples

**Example 1: Basic Acquisition and Return**
- Turn 1, GATHER phase: Player A has 3 ore
- Player A acquires Relic Ship from Burroughs Desert (pays 3 ore)
- Player A rolls dice: Relic Ship gets value 6
- Player A docks Relic Ship value-6 at Lunar Mine (updates minimum to 6)
- Turn 2, GATHER phase: Relic Ship returns to Burroughs Desert automatically
- Lunar Mine minimum remains at 6

**Example 2: Terraforming Station Forfeiture**
- Player B has Relic Ship value-7 and two regular ships value-6, value-7
- Player B commits all 3 ships to Terraforming Station (total 7+6+7 = 20)
- Player B places colony, must forfeit 1 ship
- Player B chooses to forfeit Relic Ship (returns to Burroughs Desert immediately)
- Player B's two regular ships return to supply
- Next GATHER phase: Relic Ship already at Burroughs Desert (available for acquisition)

**Example 3: Plasma Cannon Interaction**
- Player C has Relic Ship value-6 docked at Lunar Mine
- Opponent uses Plasma Cannon to remove Relic Ship
- Relic Ship returns to Burroughs Desert immediately (not to Player C's supply)
- Lunar Mine minimum does NOT update to 6 (Relic Ship removed before facility resolved)

**Example 4: Maintenance Bay Storage**
- Player D acquires Relic Ship (3 ore) during GATHER phase
- Player D rolls dice: Relic Ship gets value 4
- Player D docks Relic Ship at Maintenance Bay (stores it)
- Next GATHER phase: Relic Ship returns to Burroughs Desert (even though stored)
- Maintenance Bay is now empty

### Strategy Notes

**Acquisition Timing:**
- Best acquired when you have high ore and need extra ship for critical facility
- Cost: 3 ore (expensive, equivalent to Colony Constructor)
- Consider Burroughs Desert control: Opponent's colonies reduce your control

**Usage Priority:**
1. **Terraforming Station:** Forfeit Relic Ship (free 3 ore, no supply loss)
2. **Lunar Mine:** Update minimum (opponent must match or exceed)
3. **Colonist Hub/Colony Constructor:** Use for colony placement (returns to desert, not supply)
4. **Shipyard:** Build ships (Relic Ship + regular ships = fleet expansion)

**Return Mechanics:**
- Relic Ship returns at start of EVERY GATHER phase
- Cannot "hold onto" Relic Ship for multiple turns
- Plan usage for same turn as acquisition
- If stored at Maintenance Bay, still returns (no persistence)

**Forfeiture Strategy:**
- Terraforming Station forfeiture is ideal (no supply loss)
- Regular ships forfeited return to supply (lost until built again)
- Relic Ship forfeited returns to Burroughs Desert (available next turn)
- Net advantage: Forfeit Relic Ship, keep regular ships

---

## 7.2 Victory Points System

Victory Points (VP) are calculated based on colonies placed on territories. The first player to reach the VP threshold wins immediately.

### Victory Point Sources

**Primary VP Source:** Colonies placed on territories

**VP Calculation:**
```typescript
interface VictoryPointCalculation {
  calculateVP(player: Player): number {
    let totalVP = 0;
    
    // Count colonies on each territory
    game.territories.forEach(territory => {
      const colonyCount = territory.colonies.filter(c => c.owner === player).length;
      totalVP += colonyCount;
    });
    
    return totalVP;
  }
  
  // Snapshot calculation (for game end and tie-breaking)
  calculateVPSnapshot(player: Player, gameState: GameState): VictoryPointSnapshot {
    const colonyCounts = new Map<Territory, number>();
    let totalVP = 0;
    
    gameState.territories.forEach(territory => {
      const count = territory.colonies.filter(c => c.owner === player).length;
      colonyCounts.set(territory, count);
      totalVP += count;
    });
    
    return {
      totalVP: totalVP,
      colonyCounts: colonyCounts,
      timestamp: gameState.turnNumber
    };
  }
}
```

### Victory Thresholds

**Standard Game:** 4 colonies (4 VP)
**Long Game Variant:** 5 colonies (5 VP)

**Victory Condition:**
```typescript
interface VictoryCondition {
  checkVictory(player: Player, game: GameState): boolean {
    const playerVP = game.calculateVP(player);
    const threshold = game.variant === 'long_game' ? 5 : 4;
    
    if (playerVP >= threshold) {
      console.log(`${player.name} wins with ${playerVP} VP!`);
      return true;
    }
    
    return false;
  }
  
  // Check victory after each colony placement
  checkVictoryAfterColonyPlacement(player: Player, game: GameState): boolean {
    const victory = this.checkVictory(player, game);
    
    if (victory) {
      // Game ends immediately
      game.gameOver = true;
      game.winner = player;
      game.endReason = 'victory_points';
    }
    
    return victory;
  }
}
```

**Important:** Victory is checked immediately after each colony placement. If a player reaches the threshold during their turn, they win instantly (game does not continue to end of turn).

### Tie-Breaking

If multiple players reach the victory threshold simultaneously, tie-breaking rules apply:

**Tie-Breaking Order:**
1. **Most colonies on territories:** Player with most total colonies wins
2. **Territory control:** Player controlling most territories wins
3. **Resource total:** Player with most total resources (fuel + ore) wins
4. **Turn order:** Player earliest in turn order wins (first player advantage)

```typescript
interface TieBreaker {
  resolveTie(players: Player[], game: GameState): Player {
    // 1. Most colonies
    const maxColonies = Math.max(...players.map(p => game.calculateVP(p)));
    let winners = players.filter(p => game.calculateVP(p) === maxColonies);
    
    if (winners.length === 1) {
      return winners[0];
    }
    
    // 2. Territory control
    const territoryControl = winners.map(p => {
      return game.territories.filter(t => game.calculateTerritoryControl(t) === p).length;
    });
    const maxControl = Math.max(...territoryControl);
    winners = winners.filter((p, i) => territoryControl[i] === maxControl);
    
    if (winners.length === 1) {
      return winners[0];
    }
    
    // 3. Resource total
    const resourceTotals = winners.map(p => p.fuel + p.ore);
    const maxResources = Math.max(...resourceTotals);
    winners = winners.filter((p, i) => resourceTotals[i] === maxResources);
    
    if (winners.length === 1) {
      return winners[0];
    }
    
    // 4. Turn order (first player wins)
    return winners[0];
  }
}
```

### Victory Point Tracking

**Colony Placement Events:**
- Colonist Hub: +1 colony on chosen territory
- Colony Constructor: +1 colony on chosen territory
- Terraforming Station: +1 colony on chosen territory
- Alien City (fuel power): +1 colony on chosen territory
- Alien City (discard power): +2 colonies on chosen territories

**Colony Removal Events:**
- Positron Field: Remove all placer's colonies from target territory
- (No other mechanics remove colonies)

**VP Calculation Frequency:**
- After each colony placement (check for victory)
- After each colony removal (recalculate VP)
- At end of each turn (for tie-breaking)
- At game end (final VP snapshot)

### Examples

**Example 1: Standard Game Victory**
- Player A has 3 colonies (Asimov Crater: 2, Bradbury Plateau: 1)
- Player A uses Colony Constructor to place 4th colony on Heinlein Plains
- Player A now has 4 colonies = 4 VP (meets threshold)
- Game ends immediately, Player A wins

**Example 2: Long Game Victory**
- Game uses long game variant (5 colonies to win)
- Player B has 4 colonies (various territories)
- Player B uses Alien City discard power to place 2 more colonies
- Player B now has 6 colonies = 6 VP (exceeds threshold)
- Game ends immediately, Player B wins

**Example 3: Positron Field Colony Removal**
- Player C has 4 colonies (meets victory threshold)
- Opponent places Positron Field on territory with 2 of Player C's colonies
- Both colonies removed, Player C now has 2 colonies = 2 VP
- Game continues (Player C no longer meets threshold)

**Example 4: Tie-Breaking**
- Player D and Player E both place 4th colony on same turn (simultaneous via Temporal Warper)
- Tie-breaking:
  1. Both have 4 colonies (tie)
  2. Player D controls 3 territories, Player E controls 2 territories
  3. Player D wins (more territory control)

### Strategy Notes

**VP Accumulation Rate:**
- Early game (turns 1-3): 0-1 colonies expected
- Mid game (turns 4-6): 1-2 colonies expected
- Late game (turns 7+): 2-4 colonies expected

**Colony Placement Efficiency:**
- Colonist Hub: Requires ships at Colonist Hub (pairs or Alien Monument boost)
- Colony Constructor: Requires 3 ore + matching pair (most expensive)
- Terraforming Station: Requires ≥3 ships, total value ≥20, forfeit 1 ship (most restrictive)
- Alien City: Requires 3 fuel (fastest, no ships needed)

**Victory Timing:**
- Early victory (turn 5-6): Aggressive colony placement, ignore resource accumulation
- Late victory (turn 8+): Resource accumulation, then rapid colony placement
- Temporal Warper victory: Use 2 extra turns to place 2-4 colonies (instant win)

---

## 7.3 Game End Conditions and Tie-Breakers

The game can end through multiple conditions. The primary win condition is reaching the victory point threshold, but other end conditions exist.

### Primary Win Condition: Victory Points

**Threshold:** 4 colonies (standard game) or 5 colonies (long game variant)
**Timing:** Immediate upon reaching threshold (game ends instantly)

```typescript
interface PrimaryWinCondition {
  checkPrimaryWin(player: Player, game: GameState): boolean {
    const threshold = game.variant === 'long_game' ? 5 : 4;
    const playerVP = game.calculateVP(player);
    
    if (playerVP >= threshold) {
      game.gameOver = true;
      game.winner = player;
      game.endReason = 'victory_points';
      return true;
    }
    
    return false;
  }
}
```

### Secondary Win Condition: Maximum Turns

**Turn Limit:** 20 turns (optional house rule)
**Tie-Breaking:** Use standard tie-breaking rules (most colonies, territory control, resources, turn order)

```typescript
interface MaximumTurnsCondition {
  maxTurns: 20;
  
  checkMaxTurns(game: GameState): boolean {
    if (game.turnNumber >= this.maxTurns) {
      game.gameOver = true;
      game.endReason = 'maximum_turns';
      
      // Find winner via tie-breaking
      const players = game.players.sort((a, b) => {
        const aVP = game.calculateVP(a);
        const bVP = game.calculateVP(b);
        return bVP - aVP;  // Descending order
      });
      
      game.winner = game.tieBreaker.resolveTie(players.filter(p => {
        return game.calculateVP(p) === game.calculateVP(players[0]);
      }), game);
      
      return true;
    }
    
    return false;
  }
}
```

### Concession

**Voluntary:** Any player can concede at any time
**Effect:** Player removed from game, remaining players continue

```typescript
interface Concession {
  concede(player: Player, game: GameState): void {
    // Mark player as conceded
    player.conceded = true;
    player.active = false;
    
    // Remove player's colonies from territories
    game.territories.forEach(territory => {
      territory.colonies = territory.colonies.filter(c => c.owner !== player);
    });
    
    // Recalculate territory control
    game.territories.forEach(territory => {
      game.calculateTerritoryControl(territory);
    });
    
    // Check if only one player remains
    const activePlayers = game.players.filter(p => p.active);
    if (activePlayers.length === 1) {
      game.gameOver = true;
      game.winner = activePlayers[0];
      game.endReason = 'concession';
    }
    
    console.log(`${player.name} has conceded. ${activePlayers.length} players remain.`);
  }
}
```

### Deadlock Detection

**Deadlock:** No player can make progress toward victory
**Conditions:**
- All players have 0 resources (fuel + ore = 0)
- All players have 0 ships available (all ships in supply or committed)
- No tech cards available to generate resources

```typescript
interface DeadlockDetection {
  checkDeadlock(game: GameState): boolean {
    // Check if all players are stuck
    const allPlayersStuck = game.players.every(player => {
      // No resources
      const hasResources = player.fuel > 0 || player.ore > 0;
      
      // No ships in hand
      const hasShips = player.shipsInHand.length > 0;
      
      // No tech cards with useful powers
      const hasUsefulTechCards = player.techCards.some(card => {
        return card.hasFuelPower && player.fuel >= card.fuelCost;
      });
      
      return !hasResources && !hasShips && !hasUsefulTechCards;
    });
    
    if (allPlayersStuck) {
      game.gameOver = true;
      game.endReason = 'deadlock';
      
      // Winner is player with most VP
      const winner = game.players.reduce((max, player) => {
        return game.calculateVP(player) > game.calculateVP(max) ? player : max;
      });
      
      game.winner = winner;
      
      console.log('Deadlock detected. Game ends.');
      return true;
    }
    
    return false;
  }
}
```

### Complete Tie-Breaking Rules

**Tie-Breaking Criteria (in order):**

1. **Most Victory Points:** Player with most colonies wins
2. **Territory Control:** Player controlling most territories wins
3. **Resource Total:** Player with most total resources (fuel + ore) wins
4. **Ship Count:** Player with most ships (in hand + supply) wins
5. **Tech Card Count:** Player with most tech cards wins
6. **Turn Order:** First player in turn order wins

```typescript
interface CompleteTieBreaker {
  resolveTie(players: Player[], game: GameState): Player {
    let winners = players;
    
    // 1. Most Victory Points
    const vpCounts = winners.map(p => game.calculateVP(p));
    const maxVP = Math.max(...vpCounts);
    winners = winners.filter((p, i) => vpCounts[i] === maxVP);
    if (winners.length === 1) return winners[0];
    
    // 2. Territory Control
    const controlCounts = winners.map(p => {
      return game.territories.filter(t => game.calculateTerritoryControl(t) === p).length;
    });
    const maxControl = Math.max(...controlCounts);
    winners = winners.filter((p, i) => controlCounts[i] === maxControl);
    if (winners.length === 1) return winners[0];
    
    // 3. Resource Total
    const resourceTotals = winners.map(p => p.fuel + p.ore);
    const maxResources = Math.max(...resourceTotals);
    winners = winners.filter((p, i) => resourceTotals[i] === maxResources);
    if (winners.length === 1) return winners[0];
    
    // 4. Ship Count
    const shipCounts = winners.map(p => p.shipsInHand.length + p.shipsInSupply.length);
    const maxShips = Math.max(...shipCounts);
    winners = winners.filter((p, i) => shipCounts[i] === maxShips);
    if (winners.length === 1) return winners[0];
    
    // 5. Tech Card Count
    const techCardCounts = winners.map(p => p.techCards.length);
    const maxTechCards = Math.max(...techCardCounts);
    winners = winners.filter((p, i) => techCardCounts[i] === maxTechCards);
    if (winners.length === 1) return winners[0];
    
    // 6. Turn Order (first player wins)
    return winners[0];
  }
}
```

### Examples

**Example 1: Primary Win Condition**
- Player A places 4th colony during turn 6
- Game ends immediately (primary win condition met)
- Player A wins

**Example 2: Maximum Turns Tie-Breaking**
- Turn 20 completes, no player has 4 colonies
- Player B has 3 colonies, Player C has 3 colonies
- Tie-breaking:
  1. Both have 3 VP (tie)
  2. Player B controls 4 territories, Player C controls 2 territories
  3. Player B wins (more territory control)

**Example 3: Concession**
- Player D concedes during turn 8
- Player E and Player F continue playing
- Player E places 4th colony during turn 10
- Player E wins (primary win condition met)

**Example 4: Deadlock**
- Turn 15, all players have 0 fuel, 0 ore, 0 ships in hand
- No tech cards available to generate resources
- Deadlock detected, game ends
- Player G has 2 colonies, Player H has 1 colony
- Player G wins (most VP)

### Strategy Notes

**Pacing:**
- Standard game: Expect 6-10 turns
- Long game variant: Expect 10-15 turns
- Temporal Warper: Can reduce game length by 2-4 turns

**Victory Timing:**
- Aggressive strategy: Rush to 4 colonies (turns 5-7)
- Conservative strategy: Resource accumulation, then rapid colony placement (turns 8-10)
- Defensive strategy: Block opponent victories, win via tie-breaking (turns 10+)

**Tie-Breaking Preparation:**
- Control multiple territories (increases tie-breaker advantage)
- Accumulate resources (increases tie-breaker advantage)
- Acquire tech cards (increases tie-breaker advantage)

---

## 7.4 Resource Management Detailed Rules

Resources (fuel and ore) are the primary currency for actions in Alien Frontiers. Careful resource management is critical for victory.

### Resource Types

**Fuel:**
- Generated by: Solar Converter, territories (GATHER phase), tech cards, Relic Ship forfeiture
- Used for: Tech card fuel powers, Raiders' Outpost cost, Resource Cache conversion
- Storage limit: 7 total (fuel + ore combined) or 12 with Resource Cache discard

**Ore:**
- Generated by: Shipyard, territories (GATHER phase), Maintenance Bay, tech cards, Raiders' Outpost theft
- Used for: Colony Constructor cost, Shipyard ship building, Burroughs Desert Relic Ship acquisition, Resource Cache conversion
- Storage limit: 7 total (fuel + ore combined) or 12 with Resource Cache discard

```typescript
interface ResourceTypes {
  fuel: {
    sources: ['solar_converter', 'territories', 'tech_cards', 'relic_ship_forfeiture'];
    uses: ['tech_card_fuel_powers', 'raiders_outpost_cost', 'resource_cache_conversion'];
  };
  
  ore: {
    sources: ['shipyard', 'territories', 'maintenance_bay', 'tech_cards', 'raiders_outpost_theft'];
    uses: ['colony_constructor_cost', 'shipyard_cost', 'relic_ship_acquisition', 'resource_cache_conversion'];
  };
}
```

### Resource Limits

**Default Limit:** 7 total resources (fuel + ore combined)
**Resource Cache Limit:** 12 total resources (fuel + ore combined)

**Limit Enforcement:**
```typescript
interface ResourceLimits {
  defaultLimit: 7;
  resourceCacheLimit: 12;
  
  enforceLimit(player: Player, game: GameState): void {
    const limit = player.hasResourceCache ? this.resourceCacheLimit : this.defaultLimit;
    const totalResources = player.fuel + player.ore;
    
    if (totalResources > limit) {
      const excess = totalResources - limit;
      console.log(`${player.name} has ${totalResources} resources (limit ${limit}). Must discard ${excess}.`);
      
      // Player chooses which resources to discard
      player.chooseResourcesToDiscard(excess);
    }
  }
  
  // Called during CLEANUP phase
  applyLimitDuringCleanup(player: Player, game: GameState): void {
    this.enforceLimit(player, game);
  }
}
```

**Important:** Resource limit is enforced at the END of CLEANUP phase. During ACTION phase, players can temporarily exceed the limit (e.g., gain 8 fuel from Solar Converter while having 3 ore).

### Resource Generation

**GATHER Phase Sources:**
- Territory control bonuses (1 fuel or 1 ore per controlled territory)
- No facility-based generation during GATHER phase

**ACTION Phase Sources:**
- **Solar Converter:** ⌈ship_value / 2⌉ fuel per ship
- **Maintenance Bay:** 1 ore per ship (stored for next turn)
- **Shipyard:** Costs ore to build ships (net negative)
- **Orbital Market:** Trade resources at various ratios
- **Raiders' Outpost:** Steal 1 ore from opponent (costs 1 fuel)
- **Tech Cards:** Various tech card powers generate resources

```typescript
interface ResourceGeneration {
  // GATHER phase
  generateFromTerritories(player: Player, game: GameState): void {
    game.territories.forEach(territory => {
      const controller = game.calculateTerritoryControl(territory);
      
      if (controller === player) {
        // Generate 1 fuel or 1 ore based on territory type
        if (territory.bonus.type === 'fuel') {
          player.fuel += 1;
        } else if (territory.bonus.type === 'ore') {
          player.ore += 1;
        }
      }
    });
  }
  
  // ACTION phase (various sources)
  generateFromFacility(player: Player, facility: Facility, ships: Ship[]): void {
    if (facility.type === 'solar_converter') {
      ships.forEach(ship => {
        const baseFuel = Math.ceil(ship.value / 2);
        const lemBonus = player.controlsLemBadlands ? 1 : 0;
        player.fuel += baseFuel + lemBonus;
      });
    } else if (facility.type === 'maintenance_bay') {
      ships.forEach(ship => {
        player.ore += 1;  // Delayed until next turn
      });
    }
    // ... other facilities
  }
}
```

### Resource Consumption

**Colony Placement:**
- **Colony Constructor:** 3 ore (2 ore with Bradbury Plateau, 2 ore with Polarity Device discard)
- **Colonist Hub:** No resource cost (requires ships only)
- **Terraforming Station:** No resource cost (requires ships + forfeit 1 ship)
- **Alien City:** 3 fuel (fuel power) or discard card (discard power)

**Ship Building:**
- **Shipyard:** N×(N+1)/2 ore for N ships (cumulative cost per ship)

**Tech Card Usage:**
- Various fuel costs (1-4 fuel per power)

**Other Costs:**
- **Raiders' Outpost:** 1 fuel to raid
- **Relic Ship Acquisition:** 3 ore
- **Resource Cache Conversion:** 1 fuel + resources to convert

```typescript
interface ResourceConsumption {
  // Colony placement costs
  colonyConstructorCost(player: Player, game: GameState): number {
    let cost = 3;  // Base cost
    
    if (player.controlsBradburyPlateau) {
      cost -= 1;  // Bradbury bonus
    }
    
    // Note: Polarity Device discard sets cost to 2 (overrides Bradbury)
    
    return cost;
  }
  
  // Ship building cost
  shipyardCost(shipsBuilt: number, additionalShips: number): number {
    let totalCost = 0;
    
    for (let i = 1; i <= additionalShips; i++) {
      const n = shipsBuilt + i;
      totalCost += n;  // Cumulative cost per ship
    }
    
    return totalCost;
  }
}
```

### Resource Conversion

**Orbital Market:**
- 1 ore → 2 fuel (best ratio)
- 1 fuel → 1 ore (neutral ratio)
- 2 fuel → 1 ore (worst ratio)

**Resource Cache (Fuel Power):**
- 1 fuel (activation cost) + X resources to convert
- 1:1 conversion ratio
- More efficient than Orbital Market worst case (2:1)

**Heinlein Plains Bonus:**
- 1:1 conversion at Orbital Market (once per turn)
- No ships required

```typescript
interface ResourceConversion {
  // Orbital Market ratios
  orbitalMarketRatio(player: Player, from: ResourceType, to: ResourceType): number {
    if (from === 'ore' && to === 'fuel') {
      return 2;  // 1 ore → 2 fuel
    } else if (from === 'fuel' && to === 'ore') {
      return player.controlsHeinleinPlains ? 1 : 0.5;  // 1 fuel → 1 ore (or 2 fuel → 1 ore)
    }
    
    return 0;
  }
  
  // Resource Cache conversion
  resourceCacheConversion(player: Player, amount: number): void {
    // Pay activation cost
    player.fuel -= 1;
    
    // Convert resources 1:1
    // (player chooses which resources to convert)
  }
}
```

### Resource Strategy

**Early Game (Turns 1-3):**
- Focus on resource generation (Solar Converter, Maintenance Bay)
- Build resource base for mid-game colony placement
- Acquire Resource Cache for conversion flexibility

**Mid Game (Turns 4-6):**
- Balance resource generation and consumption
- Use resources for colony placement (Colony Constructor: 3 ore, Alien City: 3 fuel)
- Convert resources via Orbital Market or Resource Cache as needed

**Late Game (Turns 7+):**
- Prioritize colony placement over resource accumulation
- Use Temporal Warper to generate massive resources (2 extra turns)
- Spend all resources on victory push (4th colony)

**Resource Efficiency:**
- Solar Converter: Most efficient fuel generation (3 fuel per value-6 ship)
- Maintenance Bay: Steady ore generation (1 ore per ship per turn)
- Colony Constructor: Most expensive colony placement (3 ore)
- Alien City: Fastest colony placement (3 fuel, no ships needed)

### Ambiguities Resolved

- **#153-154:** Resource limit enforced at END of CLEANUP phase (can temporarily exceed during ACTION)
- **#155:** Resource Cache discard power increases limit to 12 (permanent for rest of game)
- **#156:** Relic Ship acquisition costs 3 ore (paid during GATHER phase)
- **#157:** Relic Ship forfeiture at Terraforming Station returns to Burroughs Desert (not supply)
- **#158:** Lunar Mine minimum persists after Relic Ship returns (does not reset)
- **#159:** Plasma Cannon removes Relic Ship, returns to Burroughs Desert (not player's supply)
- **#160:** Territory control bonuses generated during GATHER phase (1 fuel or 1 ore per territory)
- **#161:** Orbital Market ratios depend on ship values committed (not fixed)
- **#162:** Resource Cache conversion costs 1 fuel activation + resources to convert (separate costs)
- **#163:** Heinlein Plains bonus applies to Orbital Market (1:1 ratio, once per turn)
- **#164:** Bradbury Plateau bonus reduces Colony Constructor cost to 2 ore (from 3)
- **#165:** Polarity Device discard power sets Colony Constructor cost to 2 ore (does NOT stack with Bradbury)
