# Section 8.3: Territory Edge Cases

## 8.3.1 Territory Control Edge Cases

**Edge Case: Simultaneous Colony Placement (Temporal Warper)**
- Player A has 2 colonies on Asimov Crater, Player B has 2 colonies
- Player A uses Temporal Warper to take 2 extra turns
- During first extra turn: Player A places 3rd colony on Asimov (gains control: 3 vs 2)
- During second extra turn: Player B has not played yet, Player A retains control
- Resolution: Control recalculated after each colony placement during extra turns

**Edge Case: Positron Field Removes Control**
- Player has 3 colonies on Lem Badlands (controls territory)
- Opponent places Positron Field on Lem Badlands
- All of player's colonies removed (player now has 0 colonies)
- Opponent has 1 colony on Lem Badlands (gains control: 1 vs 0)
- Resolution: Positron Field can shift territory control by removing placer's colonies

**Edge Case: Tie in Colony Count**
- Player A has 2 colonies on Bradbury Plateau
- Player B has 2 colonies on Bradbury Plateau
- Tie: No player controls Bradbury Plateau (no bonuses awarded)
- Resolution: Strict majority required (tie = no control)

**Edge Case: Field Generator Removal Restores Control**
- Player A has 2 colonies on Pohl Foothills (controls territory)
- Player B places Isolation Field on Pohl Foothills (blocks bonuses for all players)
- Player A still controls territory but cannot use bonus (+1 ship value at Shipyard)
- Player B uses Booster Pod discard to remove Isolation Field
- Player A regains access to bonus immediately
- Resolution: Control persists, bonus access restored when field removed

```typescript
interface TerritoryControlEdgeCases {
  recalculateControlAfterColonyPlacement(territory: Territory, game: GameState): Player | null {
    const colonyCounts = new Map<Player, number>();
    
    // Count colonies for each player
    territory.colonies.forEach(colony => {
      const count = colonyCounts.get(colony.owner) || 0;
      colonyCounts.set(colony.owner, count + 1);
    });
    
    // Find player with strict majority
    let maxCount = 0;
    let controllingPlayer: Player | null = null;
    
    colonyCounts.forEach((count, player) => {
      if (count > maxCount) {
        maxCount = count;
        controllingPlayer = player;
      } else if (count === maxCount) {
        controllingPlayer = null;  // Tie, no control
      }
    });
    
    return controllingPlayer;
  }
  
  checkFieldGeneratorBlocksBonus(territory: Territory, player: Player): boolean {
    if (territory.hasIsolationField) {
      console.log('Isolation Field blocks territory bonus');
      return true;  // Bonus blocked
    }
    
    return false;  // Bonus available
  }
}
```

## 8.3.2 Burroughs Desert Edge Cases

**Edge Case: Multiple Players Acquire Relic Ship**
- Turn 1: Player A acquires Relic Ship (3 ore)
- Turn 2 GATHER: Relic Ship returns to Burroughs Desert
- Turn 2: Player B acquires Relic Ship (3 ore)
- Turn 3 GATHER: Relic Ship returns to Burroughs Desert
- Resolution: Relic Ship cycles between players (only one player has it at a time)

**Edge Case: Losing Control While Having Relic Ship**
- Player A controls Burroughs Desert (1 colony)
- Player A has Relic Ship
- Opponent places 2nd colony on Burroughs Desert (opponent gains control: 2 vs 1)
- Player A loses control but retains Relic Ship until next GATHER phase
- Resolution: Control loss does NOT force immediate Relic Ship return

**Edge Case: Insufficient Ore to Acquire Relic Ship**
- Player has 2 ore (needs 3 ore)
- Relic Ship available at Burroughs Desert
- Player cannot acquire Relic Ship (insufficient ore)
- Resolution: Player must have exactly 3 ore to acquire Relic Ship

**Edge Case: Relic Ship Returns During GATHER Phase**
- Player A has Relic Ship at end of turn
- GATHER phase starts: Relic Ship returns to Burroughs Desert FIRST
- Then Player A (current player) can re-acquire Relic Ship for 3 ore
- Resolution: Return happens before acquisition opportunity

```typescript
interface BurroughsDesertEdgeCases {
  handleRelicShipAcquisition(player: Player, game: GameState): boolean {
    // Check timing (must be GATHER phase)
    if (game.currentPhase !== 'GATHER') {
      throw new Error('Relic Ship can only be acquired during GATHER phase');
    }
    
    // Check ore requirement
    if (player.ore < 3) {
      console.log('Insufficient ore to acquire Relic Ship (need 3 ore)');
      return false;
    }
    
    // Check availability
    if (game.relicShip.location !== 'burroughs_desert') {
      console.log('Relic Ship not available (already acquired by another player)');
      return false;
    }
    
    // Acquire Relic Ship
    player.ore -= 3;
    game.relicShip.owner = player;
    game.relicShip.location = 'player_hand';
    player.hasRelicShip = true;
    
    return true;
  }
}
```

## 8.3.3 Territory Bonus Stacking Edge Cases

**Edge Case: Multiple Territory Bonuses on Same Action**
- Player controls Bradbury Plateau (−1 ore at Colony Constructor)
- Player controls Asimov Crater (+1 colony advance at Colonist Hub)
- Player docks pair at Colony Constructor (Bradbury applies: 2 ore instead of 3)
- Player docks pair at Colonist Hub (Asimov applies: +1 advance)
- Resolution: Different territory bonuses apply to different actions independently

**Edge Case: Heinlein Plains + Orbital Market Multiple Uses**
- Player controls Heinlein Plains (1:1 Orbital Market, once per turn)
- Player docks ships [3, 4] at Orbital Market
- First trade: Uses Heinlein bonus (1:1 ratio)
- Second trade: Uses standard ratios (no Heinlein bonus, already used)
- Resolution: Heinlein bonus is once-per-turn (not once-per-ship)

**Edge Case: Lem Badlands + Solar Converter + Multiple Ships**
- Player controls Lem Badlands (+1 fuel per ship at Solar Converter)
- Player docks ships [4, 5, 6] at Solar Converter
- Ship 4: ⌈4/2⌉ + 1 (Lem) = 2 + 1 = 3 fuel
- Ship 5: ⌈5/2⌉ + 1 (Lem) = 3 + 1 = 4 fuel
- Ship 6: ⌈6/2⌉ + 1 (Lem) = 3 + 1 = 4 fuel
- Total: 11 fuel
- Resolution: Lem bonus applies per ship (not per turn)

**Edge Case: Van Vogt Mountains + Lunar Mine + Minimum Update**
- Player controls Van Vogt Mountains (bypass Lunar Mine minimum)
- Lunar Mine minimum is 5
- Player docks value-3 ship at Lunar Mine (bypasses minimum)
- Value-3 ship does NOT update minimum (bypass only affects acceptance)
- Minimum remains at 5
- Resolution: Van Vogt bypass does NOT prevent minimum updates from higher-value ships

```typescript
interface TerritoryBonusStackingEdgeCases {
  applyMultipleTerritoryBonuses(player: Player, action: Action): void {
    // Each territory bonus applies independently to relevant actions
    if (action.type === 'colony_constructor' && player.controlsBradburyPlateau) {
      action.oreCost -= 1;  // Bradbury bonus
    }
    
    if (action.type === 'colonist_hub' && player.controlsAsimovCrater) {
      action.colonyAdvance += 1;  // Asimov bonus
    }
    
    // Bonuses do NOT interfere with each other
  }
  
  trackHeinleinUsage(player: Player, game: GameState): void {
    if (player.controlsHeinleinPlains) {
      if (!player.usedHeinleinBonusThisTurn) {
        player.usedHeinleinBonusThisTurn = true;
        console.log('Heinlein Plains bonus used (1:1 ratio)');
      } else {
        console.log('Heinlein Plains bonus already used this turn');
      }
    }
    
    // Reset at end of turn
    game.onCleanupPhaseEnd(() => {
      player.usedHeinleinBonusThisTurn = false;
    });
  }
}
```

---

## 8.4 Tech Card Edge Cases

## 8.4.1 Tech Card Acquisition Edge Cases

**Edge Case: Claiming Last Tech Card**
- 11 tech cards already claimed
- Only 1 tech card remains in deck (e.g., Temporal Warper)
- Player docks ships at Alien Artifact (total ≥ 8)
- Player claims last tech card
- Alien Artifact now has no effect (deck empty)
- Resolution: Alien Artifact effectively closed after all 12 cards claimed

**Edge Case: Over-Committing to Alien Artifact**
- Player docks ships [4, 5, 6] at Alien Artifact (total 15)
- Only need total ≥ 8 to claim card
- Excess value provides no benefit (no extra cards)
- Resolution: Inefficient use of ships (should use minimum ships to reach 8)

**Edge Case: Plasma Cannon Prevents Tech Card Acquisition**
- Player docks ships [3, 5] at Alien Artifact (total 8)
- Opponent uses Plasma Cannon to remove value-5 ship
- Total becomes 3 (less than 8), no tech card claimed
- Resolution: Plasma Cannon timing prevents acquisition

```typescript
interface TechCardAcquisitionEdgeCases {
  claimTechCard(player: Player, game: GameState): TechCard | null {
    if (game.techCardDeck.length === 0) {
      console.log('No tech cards available (deck empty)');
      return null;
    }
    
    // Claim top card from deck
    const techCard = game.techCardDeck.pop();
    player.techCards.push(techCard);
    
    console.log(`${player.name} claimed ${techCard.name}`);
    
    return techCard;
  }
  
  warnOverCommitment(ships: Ship[], threshold: number = 8): void {
    const total = ships.reduce((sum, ship) => sum + ship.value, 0);
    
    if (total > threshold + 3) {
      console.warn(`Over-commitment: total ${total} significantly exceeds ${threshold}. Consider using fewer ships.`);
    }
  }
}
```

## 8.4.2 Tech Card Power Timing Edge Cases

**Edge Case: Multiple Tech Card Powers in One Turn**
- Player has Booster Pod, Gravity Manipulator, and Alien City
- Player uses Booster Pod fuel power (2 fuel, ±1 ship)
- Player uses Gravity Manipulator fuel power (3 fuel, ±1 all ships)
- Player uses Alien City fuel power (3 fuel, place colony)
- Total fuel cost: 2 + 3 + 3 = 8 fuel
- Resolution: Can use multiple tech card powers in single turn (if resources available)

**Edge Case: Tech Card Power During Opponent's Turn**
- Opponent's turn, opponent docks ships at facilities
- Player has Stasis Beam fuel power (2 fuel, freeze opponent's ship)
- Player uses Stasis Beam during opponent's ACTION phase
- Resolution: Some tech card powers can be used during opponent's turn (Stasis Beam, Plasma Cannon)

**Edge Case: Temporal Warper During Extra Turn**
- Player uses Temporal Warper fuel power (4 fuel, 1 extra turn)
- During extra turn, player attempts to use Temporal Warper again
- Cannot chain Temporal Warpers (extra turn restriction)
- Resolution: Temporal Warper cannot be used during extra turn

**Edge Case: Discarding Multiple Tech Cards in One Turn**
- Player has Alien City and Temporal Warper
- Player discards Alien City (place 2 colonies)
- Player discards Temporal Warper (2 extra turns)
- Resolution: Can discard multiple cards in single turn (if strategic)

```typescript
interface TechCardPowerTimingEdgeCases {
  canUsePowerDuringOpponentTurn(card: TechCard, game: GameState): boolean {
    // Only certain cards can be used during opponent's turn
    const opponentTurnCards = ['stasis_beam', 'plasma_cannon', 'holographic_decoy'];
    
    return opponentTurnCards.includes(card.id) && game.currentPlayer !== card.owner;
  }
  
  canUseTemporalWarperDuringExtraTurn(game: GameState): boolean {
    if (game.extraTurnInProgress) {
      console.log('Cannot use Temporal Warper during extra turn (chaining not allowed)');
      return false;
    }
    
    return true;
  }
  
  trackFuelCosts(player: Player, powers: TechCardPower[]): number {
    const totalCost = powers.reduce((sum, power) => sum + power.fuelCost, 0);
    
    if (player.fuel < totalCost) {
      throw new Error(`Insufficient fuel: need ${totalCost}, have ${player.fuel}`);
    }
    
    return totalCost;
  }
}
```

## 8.4.3 Tech Card Interaction Edge Cases

**Edge Case: Holographic Decoy vs. Multiple Attacks**
- Player uses Holographic Decoy discard (shield all ships)
- Opponent uses Plasma Cannon (blocked by shield)
- Opponent uses Stasis Beam (blocked by shield)
- Shield persists until end of turn (blocks all attacks)
- Resolution: Single Holographic Decoy discard blocks multiple attacks

**Edge Case: Data Crystal Borrowed Bonus + Isolation Field**
- Player uses Data Crystal to borrow Lem Badlands bonus from opponent
- Opponent places Isolation Field on Lem Badlands (blocks all bonuses)
- Data Crystal borrowed bonus also blocked
- Resolution: Isolation Field blocks borrowed bonuses

**Edge Case: Gravity Manipulator + Polarity Device Combo**
- Player has ships [3, 4] in hand
- Player uses Gravity Manipulator (3 fuel, +1 all ships)
- Ships become [4, 5] (sum = 9)
- Player uses Polarity Device fuel power (3 fuel, set target sum = 9)
- Player docks [4, 5] at Colony Constructor (meets modified requirement)
- Resolution: Tech card powers can combo efficiently

**Edge Case: Alien City vs. Repulsor Field**
- Player uses Alien City discard (place 2 colonies)
- Opponent has Repulsor Field on target territories
- Colony placement blocked by Repulsor Field
- Player loses Alien City card (discarded) but gains no colonies
- Resolution: Repulsor Field blocks Alien City colony placement

```typescript
interface TechCardInteractionEdgeCases {
  checkHolographicDecoyBlocksMultipleAttacks(player: Player, attacks: Attack[]): void {
    if (player.hasHolographicDecoyShield) {
      attacks.forEach(attack => {
        console.log(`${attack.type} blocked by Holographic Decoy shield`);
        attack.blocked = true;
      });
    }
  }
  
  checkIsolationBlocksDataCrystal(territory: Territory, player: Player): boolean {
    if (territory.hasIsolationField) {
      console.log('Isolation Field blocks Data Crystal borrowed bonus');
      return true;  // Borrowed bonus blocked
    }
    
    return false;  // Borrowed bonus available
  }
  
  checkRepulsorBlocksAlienCity(territories: Territory[]): Territory[] {
    return territories.filter(territory => {
      if (territory.hasRepulsorField) {
        console.log(`Repulsor Field blocks colony placement on ${territory.name}`);
        return false;  // Cannot place colony
      }
      
      return true;  // Can place colony
    });
  }
}
```

---

## 8.5 Deadlock Scenarios and Resolution

## 8.5.1 Complete Resource Depletion

**Scenario: All Players Have Zero Resources**
- Turn 10: All players have 0 fuel, 0 ore
- No ships in hand (all ships in supply or at facilities)
- No tech card powers available (no fuel to activate)
- Deadlock detected: No player can make progress

**Resolution:**
1. Calculate VP for each player
2. Player with most VP wins
3. If tied, use tie-breaking rules (territory control, ship count, turn order)

```typescript
interface ResourceDepletionDeadlock {
  detectDeadlock(game: GameState): boolean {
    // Check if all players are stuck
    const allPlayersStuck = game.players.every(player => {
      const hasResources = player.fuel > 0 || player.ore > 0;
      const hasShips = player.shipsInHand.length > 0;
      const hasUsefulTechCards = player.techCards.some(card => {
        return card.hasFuelPower && player.fuel >= card.fuelCost;
      });
      
      return !hasResources && !hasShips && !hasUsefulTechCards;
    });
    
    if (allPlayersStuck) {
      console.log('Deadlock detected: All players have no resources, ships, or useful tech cards');
      return true;
    }
    
    return false;
  }
  
  resolveDeadlock(game: GameState): Player {
    // Winner is player with most VP
    const players = game.players.sort((a, b) => {
      return game.calculateVP(b) - game.calculateVP(a);
    });
    
    // Apply tie-breaking if needed
    const maxVP = game.calculateVP(players[0]);
    const tiedPlayers = players.filter(p => game.calculateVP(p) === maxVP);
    
    if (tiedPlayers.length > 1) {
      return game.tieBreaker.resolveTie(tiedPlayers, game);
    }
    
    return players[0];
  }
}
```

## 8.5.2 Infinite Loop Prevention

**Scenario: Temporal Warper Chaining Attempt**
- Player uses Temporal Warper fuel power (4 fuel, 1 extra turn)
- During extra turn, player attempts to use Temporal Warper again
- System prevents chaining (cannot use Temporal Warper during extra turn)
- Resolution: Hard-coded restriction prevents infinite loops

**Scenario: Field Generator Placement/Removal Loop**
- Player A uses Booster Pod discard to place Isolation Field
- Player B uses Booster Pod discard to remove Isolation Field
- Player A attempts to use another Booster Pod to re-place Isolation Field
- Resolution: Allowed, but players run out of tech cards (each card discarded once)

```typescript
interface InfiniteLoopPrevention {
  preventTemporalWarperChaining(game: GameState, player: Player): void {
    if (game.extraTurnInProgress && game.extraTurnPlayer === player) {
      throw new Error('Cannot use Temporal Warper during extra turn (chaining not allowed)');
    }
  }
  
  limitFieldGeneratorActions(player: Player, game: GameState): void {
    // Each Booster Pod can only be discarded once
    // Each field generator can only be placed/removed once per Booster Pod discard
    // Natural limit: Only 12 tech cards total in game
    
    if (player.boosterPodDiscarded) {
      throw new Error('Booster Pod already discarded (cannot use again)');
    }
  }
}
```

## 8.5.3 Stalemate Detection

**Scenario: No Player Can Reach Victory Threshold**
- Turn 15: Player A has 3 colonies (needs 4 to win)
- Player B has 2 colonies (needs 4 to win)
- All players have 0 resources, no ships, no tech cards
- No player can place additional colonies
- Stalemate detected: No path to victory

**Resolution:**
1. Check if maximum turns reached (optional house rule: 20 turns)
2. If maximum turns reached, declare winner via tie-breaking
3. If no maximum turns, allow players to concede or continue (house rule)

```typescript
interface StalemateDetection {
  detectStalemate(game: GameState): boolean {
    // Check if no player can reach victory threshold
    const canAnyPlayerWin = game.players.some(player => {
      const currentVP = game.calculateVP(player);
      const threshold = game.variant === 'long_game' ? 5 : 4;
      
      // Check if player can reach threshold
      const hasResourcesForColony = player.fuel >= 3 || player.ore >= 3;
      const hasShipsForColony = player.shipsInHand.length >= 2;
      const hasTechCardsForColony = player.techCards.some(card => {
        return card.id === 'alien_city' || card.id === 'polarity_device';
      });
      
      return currentVP < threshold && (hasResourcesForColony || hasShipsForColony || hasTechCardsForColony);
    });
    
    if (!canAnyPlayerWin) {
      console.log('Stalemate detected: No player can reach victory threshold');
      return true;
    }
    
    return false;
  }
  
  resolveStalemate(game: GameState): Player {
    // Winner is player with most VP (even if below threshold)
    return game.tieBreaker.resolveTie(game.players, game);
  }
}
```

## 8.5.4 Concession Handling

**Scenario: Player Concedes Mid-Game**
- Turn 8: Player C concedes (falling too far behind)
- Player C's colonies removed from all territories
- Territory control recalculated
- Player A and Player B continue playing
- Resolution: Game continues with remaining players

**Scenario: All But One Player Concede**
- Turn 10: Player B concedes
- Turn 11: Player C concedes
- Only Player A remains (active)
- Player A declared winner by default
- Resolution: Last active player wins

```typescript
interface ConcessionHandling {
  handleConcession(player: Player, game: GameState): void {
    // Mark player as conceded
    player.conceded = true;
    player.active = false;
    
    // Remove player's colonies from all territories
    game.territories.forEach(territory => {
      territory.colonies = territory.colonies.filter(c => c.owner !== player);
    });
    
    // Recalculate territory control
    game.territories.forEach(territory => {
      game.calculateTerritoryControl(territory);
    });
    
    // Remove player from turn order
    game.turnOrder = game.turnOrder.filter(p => p !== player);
    
    // Check if only one player remains
    const activePlayers = game.players.filter(p => p.active);
    
    if (activePlayers.length === 1) {
      game.gameOver = true;
      game.winner = activePlayers[0];
      game.endReason = 'concession';
      console.log(`${activePlayers[0].name} wins (all other players conceded)`);
    } else {
      console.log(`${player.name} conceded. ${activePlayers.length} players remain.`);
    }
  }
}
```

---

## 8.6 Comprehensive Resolution Guide

### Priority Order for Conflicting Rules

When multiple rules or effects interact, apply the following priority order:

1. **Field Generators** (highest priority)
   - Repulsor Field blocks colony placement (overrides all colony placement methods)
   - Isolation Field blocks territory bonuses (overrides all bonus sources)
   - Positron Field removes placer's colonies (immediate one-time effect)

2. **Tech Card Discard Powers**
   - Discard powers override fuel powers (more powerful, one-time use)
   - Polarity Device discard sets fixed 2 ore cost (overrides Bradbury Plateau)
   - Alien City discard places 2 colonies (can be blocked by Repulsor Field)

3. **Territory Bonuses**
   - Territory bonuses apply unless blocked by Isolation Field
   - Multiple territory bonuses stack (if applicable to different actions)
   - Heinlein Plains once-per-turn limit enforced

4. **Tech Card Fuel Powers**
   - Fuel powers can be used multiple times (if resources available)
   - Some fuel powers stack with territory bonuses (e.g., Alien Monument + Asimov)
   - Holographic Decoy shields block opponent attacks (Plasma Cannon, Stasis Beam)

5. **Facility Base Rules** (lowest priority)
   - Facility requirements apply unless modified by tech cards or territories
   - Lunar Mine minimum enforced unless Van Vogt bypass active
   - Colony Constructor pair requirement enforced unless Polarity Device active

```typescript
interface ConflictingRulesResolution {
  resolvePriority(effects: Effect[]): Effect[] {
    // Sort effects by priority
    const priorityOrder = [
      'field_generator',      // Priority 1
      'tech_card_discard',    // Priority 2
      'territory_bonus',      // Priority 3
      'tech_card_fuel',       // Priority 4
      'facility_base'         // Priority 5
    ];
    
    return effects.sort((a, b) => {
      const aPriority = priorityOrder.indexOf(a.type);
      const bPriority = priorityOrder.indexOf(b.type);
      return aPriority - bPriority;
    });
  }
  
  applyEffects(effects: Effect[], game: GameState): void {
    // Apply effects in priority order
    const sortedEffects = this.resolvePriority(effects);
    
    sortedEffects.forEach(effect => {
      if (!effect.blocked) {
        effect.apply(game);
      }
    });
  }
}
```

### Common Edge Case Resolution Flowchart

```
START
  ↓
Check Field Generators
  ├─ Repulsor Field? → Block colony placement → END
  ├─ Isolation Field? → Block territory bonuses → Continue
  └─ Positron Field? → Remove placer colonies → Continue
  ↓
Check Tech Card Powers
  ├─ Discard Power Used? → Apply discard effect → Continue
  └─ Fuel Power Used? → Apply fuel effect → Continue
  ↓
Check Territory Bonuses
  ├─ Player Controls Territory? → Apply bonus → Continue
  └─ No Control? → Skip bonus → Continue
  ↓
Check Facility Requirements
  ├─ Requirements Met? → Allow action → END
  └─ Requirements Not Met? → Deny action → END
```

### Edge Case Quick Reference Table

| Situation | Resolution | Priority Level |
|-----------|-----------|----------------|
| Repulsor Field blocks colony placement | Colony placement fails (all methods) | Field Generator (1) |
| Isolation Field blocks territory bonus | Territory bonus unavailable | Field Generator (1) |
| Positron Field removes colonies | Placer's colonies removed immediately | Field Generator (1) |
| Polarity Device discard + Bradbury | Polarity Device sets 2 ore cost (no stack) | Tech Discard (2) |
| Alien Monument + Asimov Crater | Bonuses stack (+2 total colony advance) | Territory + Tech Fuel (3+4) |
| Holographic Decoy blocks Plasma Cannon | Plasma Cannon has no effect | Tech Fuel (4) |
| Van Vogt bypass Lunar Mine minimum | Ship can dock below minimum | Territory (3) |
| Multiple territory bonuses on different actions | Each bonus applies independently | Territory (3) |
| Heinlein Plains once-per-turn limit | First trade uses bonus, subsequent do not | Territory (3) |
| Temporal Warper chaining attempt | Cannot use during extra turn | Hard restriction |

### Final Ambiguity Resolution Summary

All 165 ambiguities from the original analysis have been resolved in this comprehensive rules reference:

- **Ambiguities #1-15:** Components, setup, core concepts (Section 1)
- **Ambiguities #16-30:** Turn structure, ACTION phase flexibility (Section 2)
- **Ambiguities #31-66:** All 9 facilities with complete mechanics (Section 3)
- **Ambiguities #67-84:** All 8 territories with control algorithm (Section 4)
- **Ambiguities #85-94:** Field generators with stacking rules (Section 5)
- **Ambiguities #95-135:** All 12 tech cards with fuel/discard powers (Section 6)
- **Ambiguities #136-165:** Advanced rules, resource management, edge cases (Sections 7-8)

This comprehensive rules reference provides complete, unambiguous specifications for implementing Alien Frontiers in boardgame.io framework with full TypeScript type safety.
