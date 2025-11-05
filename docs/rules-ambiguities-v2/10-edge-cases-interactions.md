# Edge Cases and Cross-System Interactions - Rules Ambiguities (v2)

Based on: AlienFrontiersRules-2ndPrint.pdf (2011 Edition)

This document covers complex interactions between game systems, rare edge cases, and scenarios not explicitly addressed in the rules.

## Multi-System Interactions

### Ambiguity #146: Stacking Multiple Territory Bonuses

**Scenario:**
Can you use Data Crystal to borrow multiple territory bonuses on the same turn?

**Interpretation:**
YES - you can use Data Crystal multiple times per turn (subject to fuel limits) to borrow multiple territory bonuses:
- Pay fuel for first territory bonus
- Pay fuel for second territory bonus
- Both bonuses active for remainder of turn

Since Data Crystal costs "1 fuel per colony" and can only be used once per turn as a fuel power, you can only borrow ONE territory bonus per turn.

**Digital Implementation:**
```typescript
interface TurnState {
  cardsUsedThisTurn: Set<string>;
  borrowedTerritoryBonuses: Territory[];
}

function useDataCrystal(
  territory: Territory,
  player: PlayerState,
  turn: TurnState
): void {
  // Can only use Data Crystal once per turn (fuel power restriction)
  if (turn.cardsUsedThisTurn.has('DATA_CRYSTAL')) {
    throw new Error('Already used Data Crystal this turn');
  }
  
  const cost = getDataCrystalCost(territory);
  player.resources.fuel -= cost;
  
  // Borrow bonus for entire turn
  turn.borrowedTerritoryBonuses.push(territory);
  turn.cardsUsedThisTurn.add('DATA_CRYSTAL');
}
```

---

### Ambiguity #147: Orbital Teleporter Chain Moves

**Scenario:**
If you have multiple ways to move ships (e.g., use Orbital Teleporter, then dock more ships, then use another card), what are the limits?

**Interpretation:**
You can only use Orbital Teleporter ONCE per turn (fuel power restriction). The moved ship:
- Cannot return to its source facility same turn
- CAN be moved to a third facility (if you had another way to move it)
- Counts toward facility requirements at its current location

**Digital Implementation:**
```typescript
function complexShipMovement(player: PlayerState, turn: TurnState): void {
  // Move ship from Lunar Mine to Alien Artifact
  moveShipWithTeleporter(ship6, lunarMine, alienArtifact, player, turn);
  
  // Ship is now at Alien Artifact, contributing value 6
  // Cannot return to Lunar Mine this turn
  
  // Could theoretically move to a third facility if another effect existed
  // (no such effect in base game)
}
```

---

### Ambiguity #148: Colony Placement with Multiple Paths

**Scenario:**
You have colonies available and can place via: (1) Colony Constructor, (2) Colonist Hub, (3) Terraforming Station. Can you use multiple paths in one turn?

**Interpretation:**
YES - you can place multiple colonies per turn using different methods:
- Use Colonist Hub to launch a colony
- Use Colony Constructor to place another colony
- Use Terraforming Station to place a third colony

Each is a separate facility action. The limit is your available colonies and resources.

**Digital Implementation:**
```typescript
function multiplColonyPlacementsOneTurn(player: PlayerState): void {
  // Method 1: Colonist Hub
  if (colonistHubTrack.colonyPosition === 7) {
    launchColonyFromHub(player, territory1);
    // Colony placed on territory1
  }
  
  // Method 2: Colony Constructor
  useColonyConstructor([ship1, ship2, ship3], player, territory2);
  // Colony placed on territory2
  
  // Method 3: Terraforming Station
  useTerraformingStation([ship4, ship5, ship6, ship7], player, territory3);
  // Colony placed on territory3
  
  // Result: 3 colonies placed in one turn
  // This is legal if you have resources and ships
}
```

---

### Ambiguity #149: Resource Limit with Territory Bonuses

**Scenario:**
You're at 8 resources (max). You control Lem Badlands (+1 fuel per ship at Solar Converter). Can you dock at Solar Converter?

**Interpretation:**
You can ATTEMPT to dock, but the resources gained are LOST if you exceed 8 total at end of turn. The sequence:
1. Dock at Solar Converter with Lem Badlands bonus
2. Gain fuel (potentially exceeding 8)
3. At end of turn, check if fuel + ore > 8
4. If yes, return excess to bank (your choice which to discard)

You CAN use the resources during your turn (before end-of-turn check).

**Digital Implementation:**
```typescript
function dockAtSolarConverterWithLimit(
  ships: Ship[],
  player: PlayerState
): void {
  // Calculate fuel gain
  let fuelGain = 0;
  for (const ship of ships) {
    fuelGain += Math.ceil(ship.value / 2);
  }
  
  // Lem Badlands: +1 per ship
  if (player.controlsTerritory('LEM_BADLANDS')) {
    fuelGain += ships.length;
  }
  
  // Add fuel (may exceed 8)
  player.resources.fuel += fuelGain;
  
  // Resources can be used during turn even if over 8
  // At end of turn, checkResourceLimit() will discard excess
}

function endTurn(player: PlayerState): void {
  const total = player.resources.fuel + player.resources.ore;
  
  if (total > 8) {
    const excess = total - 8;
    // Player chooses which resources to discard
    discardExcessResources(player, excess);
  }
}
```

---

### Ambiguity #150: Relic Ship Interactions with Alien Tech

**Scenario:**
Can you use Booster Pod, Polarity Device, or other cards on the Relic Ship?

**Interpretation:**
YES - the Relic Ship is treated as a ship in your fleet for all purposes EXCEPT:
- It has no color (doesn't count toward "ships of your color")
- When removed, it goes to Burroughs Desert (not ship stock)

You CAN:
- Use Booster Pod to increase its value
- Use Polarity Device to flip it
- Use Stasis Beam to decrease its value
- Use Gravity Manipulator to transfer points to/from it
- Use Temporal Warper to re-roll it
- Move it with Orbital Teleporter
- Have it removed by Plasma Cannon (goes to Burroughs Desert)

**Digital Implementation:**
```typescript
function useBoosterPodOnRelicShip(relicShip: Ship, player: PlayerState): void {
  // Relic Ship can be modified like any ship
  if (relicShip.value >= 6) {
    throw new Error('Cannot increase above 6');
  }
  
  const fuelCost = getAlienTechFuelCost('BOOSTER_POD', player);
  player.resources.fuel -= fuelCost;
  relicShip.value += 1;
}

function removRelicShipWithPlasmaCannon(relicShip: Ship): void {
  // When removed, goes to Burroughs Desert (not Maintenance Bay)
  removeShipFromFacility(relicShip);
  returnRelicShipToBurroughs(relicShip);
}
```

---

## Edge Cases

### Ambiguity #151: Simultaneous Control Changes

**Scenario:**
You use Polarity Device to swap colonies between two territories. Both territories change control. How are VPs calculated?

**Interpretation:**
Control changes happen SEQUENTIALLY:
1. Remove colony from territory 1
2. Recalculate control for territory 1
3. Remove colony from territory 2
4. Recalculate control for territory 2
5. Add colony to territory 1 (from territory 2)
6. Recalculate control for territory 1
7. Add colony to territory 2 (from territory 1)
8. Recalculate control for territory 2
9. Update VPs for all affected players

VPs are updated after ALL changes complete.

**Digital Implementation:**
```typescript
function swapColoniesWithPolarityDevice(
  territory1: Territory,
  colony1Owner: string,
  territory2: Territory,
  colony2Owner: string
): void {
  // Track old controllers
  const oldController1 = territory1.controller;
  const oldController2 = territory2.controller;
  
  // Remove colonies
  territory1.removeColony(colony1Owner);
  territory2.removeColony(colony2Owner);
  
  // Add colonies
  territory1.addColony(colony2Owner);
  territory2.addColony(colony1Owner);
  
  // Recalculate control
  territory1.controller = calculateControl(territory1);
  territory2.controller = calculateControl(territory2);
  
  // Update VPs for all affected players
  const affectedPlayers = new Set([
    oldController1,
    oldController2,
    territory1.controller,
    territory2.controller,
    colony1Owner,
    colony2Owner
  ]);
  
  for (const playerId of affectedPlayers) {
    if (playerId) {
      recalculateVP(getPlayer(playerId));
    }
  }
}
```

---

### Ambiguity #152: Running Out of Colonies

**Scenario:**
You have 0 colonies remaining. Can you still use Colonist Hub to advance a colony?

**Interpretation:**
NO - you cannot use Colonist Hub if you have no colonies available:
- Cannot start a new colony on the track
- Cannot advance an existing colony if the track is empty

You must wait until a colony is removed from the board (e.g., via Polarity Device swap) to use Colonist Hub again.

**Digital Implementation:**
```typescript
function canUseColonistHub(player: PlayerState, track: ColonistHubTrack): boolean {
  // Need at least one colony available OR colony on track
  if (player.coloniesAvailable === 0 && track.colonyPosition === 0) {
    return false;
  }
  
  return true;
}

function dockAtColonistHub(
  ships: Ship[],
  player: PlayerState,
  track: ColonistHubTrack
): void {
  if (!canUseColonistHub(player, track)) {
    throw new Error('No colonies available to advance');
  }
  
  // If track is empty, start new colony
  if (track.colonyPosition === 0) {
    if (player.coloniesAvailable === 0) {
      throw new Error('No colonies available to start new colony');
    }
    player.coloniesAvailable -= 1;
    track.colonyPosition = 1;
  }
  
  // Advance colony
  advanceColony(ships.length, player, track);
}
```

---

### Ambiguity #153: All Cards in Players' Hands

**Scenario:**
All 12 alien tech cards are in players' hands. The deck and discard pile are both empty. What happens at Alien Artifact?

**Interpretation:**
If you dock at Alien Artifact and reach the required value, but no cards are available (deck and discard pile both empty), you CANNOT claim a card. The facility use succeeds but you gain nothing.

This is a rare but legal game state.

**Digital Implementation:**
```typescript
function claimFromAlienArtifact(player: PlayerState): void {
  const card = drawCardFromArtifact(artifact);
  
  if (card === null) {
    // No cards available
    console.log('No cards available in deck or discard pile');
    return; // Use succeeds but no card claimed
  }
  
  if (!canClaimCard(card, player)) {
    // Already have this card, return to discard
    artifact.discardPile.push(card);
  } else {
    player.alienTechCards.push(card);
  }
}
```

---

### Ambiguity #154: Three-Way Tie for Territory Control

**Scenario:**
Red, Blue, and Yellow each have 2 colonies on a territory. Who controls it?

**Interpretation:**
NO ONE controls it. Control requires STRICT MAJORITY. In a three-way tie:
- No player has more colonies than any other single player
- Territory counter remains on the board
- No player gets the territory bonus
- No player gets control VP

**Digital Implementation:**
```typescript
function calculateControl(territory: Territory): string | null {
  if (territory.colonies.size === 0) {
    return null;
  }
  
  // Find max colony count
  const counts = Array.from(territory.colonies.values());
  const maxCount = Math.max(...counts);
  
  // Count players with max
  const playersWithMax = Array.from(territory.colonies.entries())
    .filter(([_, count]) => count === maxCount)
    .map(([playerId, _]) => playerId);
  
  // Three-way tie (or any multi-way tie): no control
  if (playersWithMax.length > 1) {
    return null;
  }
  
  return playersWithMax[0];
}
```

---

### Ambiguity #155: Losing Last Colony from Colonist Hub Track

**Scenario:**
Your colony is at circle 6 on Colonist Hub. You use Polarity Device to swap it off the board. What happens to the Colonist Hub track?

**Interpretation:**
The Colonist Hub track is CLEARED (reset to circle 0). The colony on the track was placed on the board, so the track is now empty.

You can start a new colony on the track on your next turn (if you have colonies available).

**Digital Implementation:**
```typescript
function removeColonyViaPolarity(colony: Colony): void {
  // If colony was on Colonist Hub track, clear the track
  if (colony.location === 'COLONIST_HUB_TRACK') {
    const track = getColonistHubTrack(colony.owner);
    track.colonyPosition = 0;
    track.hasActiveColony = false;
  }
  
  // Remove colony from board
  removeColonyFromTerritory(colony);
}
```

---

### Ambiguity #156: Maximum Victory Points

**Scenario:**
Is there a maximum VP limit? Can you have more than 24 VP (max colonies)?

**Interpretation:**
NO VP LIMIT. You can have unlimited VP from:
- Colonies: max 12 per player (12 VP)
- Territory control: max 8 territories (8 VP)
- Positron Fields: max 8 (one per territory, 8 VP)
- Alien City + Alien Monument: 2 VP

Theoretical max: 12 + 8 + 8 + 2 = 30 VP (if one player controls all territories with Positron Fields on all, and has all colonies and both VP cards)

Practical max: Much lower due to competition.

**Digital Implementation:**
```typescript
function calculateVictoryPoints(player: PlayerState, board: GameBoard): number {
  let vp = 0;
  
  // No upper limit on VP
  
  // Colonies (unlimited)
  vp += player.coloniesPlaced;
  
  // Territory control (max 8)
  for (const territory of board.territories) {
    if (territory.controller === player.id) {
      vp += 1;
      
      // Positron Field (max 8, one per controlled territory)
      if (territory.hasPositronField) {
        vp += 1;
      }
    }
  }
  
  // Alien tech VP cards (max 2: City + Monument)
  vp += player.alienTechCards.filter(c => c.givesVP).length;
  
  return vp;
}
```

---

### Ambiguity #157: Terraforming Station with Exactly 4 Ships

**Scenario:**
You have exactly 4 ships (including Relic Ship). Can you use Terraforming Station?

**Interpretation:**
YES - you need at least 4 ships to use Terraforming Station:
- 3 ships of your color (remain in play)
- 1 ship of your color (forfeited)

The Relic Ship does NOT count toward the 3 remaining colored ships. So:
- 4 colored ships: 3 remain + 1 forfeited = OK
- 3 colored ships + Relic: 3 colored remain + 1 colored forfeited = NOT OK (would leave 2 colored)

**Digital Implementation:**
```typescript
function canUseTerraformingStation(player: PlayerState): boolean {
  const coloredShips = player.activeShips.filter(s => !s.isRelicShip);
  
  // Need at least 4 colored ships
  // (3 remain after forfeiting 1)
  return coloredShips.length >= 4;
}

function useTerraformingStation(
  ships: Ship[],
  player: PlayerState,
  territory: Territory
): void {
  if (!canUseTerraformingStation(player)) {
    throw new Error('Need at least 4 colored ships');
  }
  
  // Dock all ships at Terraforming Station
  for (const ship of ships) {
    terraformingStation.dockShip(player.id, ship);
  }
  
  // Place colony immediately
  placeColony(territory, player);
}
```

---

### Ambiguity #158: Plasma Cannon on Blocked Facility

**Scenario:**
All docks at Shipyard are full (opponent ships). You want to use Shipyard. Can you use Plasma Cannon to remove ALL opponent ships?

**Interpretation:**
YES - Plasma Cannon can remove multiple ships from one facility:
1. Pay fuel cost (1 fuel per ship)
2. Remove all opponent ships to Maintenance Bay
3. Docks are now available
4. Dock your ships and use Shipyard

This is a valid strategic use shown in Example 1 of Plasma Cannon.

**Digital Implementation:**
```typescript
function clearFacilityWithPlasmaCannon(
  facility: Facility,
  player: PlayerState
): void {
  // Get all opponent ships at facility
  const opponentShips: Ship[] = [];
  
  for (const [playerId, ships] of facility.dockedShips) {
    if (playerId !== player.id) {
      opponentShips.push(...ships);
    }
  }
  
  // Pay fuel cost
  let fuelCost = opponentShips.length;
  if (player.controlsTerritory('POHL_FOOTHILLS')) {
    fuelCost = Math.max(fuelCost - 1, 0);
  }
  
  player.resources.fuel -= fuelCost;
  
  // Remove all ships to Maintenance Bay
  for (const ship of opponentShips) {
    facility.removeShip(ship.ownerId, ship);
    maintenanceBay.addShip(ship.ownerId, ship);
  }
  
  // Facility is now available
}
```

---

### Ambiguity #159: Long Game Variant Tie-Breaker

**Scenario:**
In long game variant (14 VP to win), two players reach 14 VP on the same round. Who wins?

**Interpretation:**
Use standard tie-breakers:
1. Most VP (tied at 14)
2. Most alien tech cards
3. Most ore
4. Most fuel

If still tied, BOTH players win (shared victory).

**Digital Implementation:**
```typescript
function checkLongGameWinner(players: PlayerState[]): PlayerState[] | null {
  const playersAt14 = players.filter(p => p.victoryPoints >= 14);
  
  if (playersAt14.length === 0) {
    return null; // Game continues
  }
  
  if (playersAt14.length === 1) {
    return playersAt14; // Single winner
  }
  
  // Multiple players at 14+: use tie-breakers
  return resolveTieBreaker(playersAt14);
}

function resolveTieBreaker(players: PlayerState[]): PlayerState[] {
  // 1. Most VP
  const maxVP = Math.max(...players.map(p => p.victoryPoints));
  let winners = players.filter(p => p.victoryPoints === maxVP);
  
  if (winners.length === 1) return winners;
  
  // 2. Most alien tech cards
  const maxTech = Math.max(...winners.map(p => p.alienTechCards.length));
  winners = winners.filter(p => p.alienTechCards.length === maxTech);
  
  if (winners.length === 1) return winners;
  
  // 3. Most ore
  const maxOre = Math.max(...winners.map(p => p.resources.ore));
  winners = winners.filter(p => p.resources.ore === maxOre);
  
  if (winners.length === 1) return winners;
  
  // 4. Most fuel
  const maxFuel = Math.max(...winners.map(p => p.resources.fuel));
  winners = winners.filter(p => p.resources.fuel === maxFuel);
  
  // If still tied, shared victory
  return winners;
}
```

---

### Ambiguity #160: Field Generator Stacking Effects

**Scenario:**
A territory has both Isolation Field and Positron Field. What are the effects?

**Interpretation:**
BOTH effects apply:
- **Isolation Field**: Nullifies territory bonus (no one can use it)
- **Positron Field**: Awards +1 VP to controller (if any)

If someone controls the territory:
- They get +1 VP from Positron Field
- They do NOT get the territory bonus (Isolation Field)

If no one controls it (tie):
- No VP from Positron Field
- No territory bonus anyway (uncontrolled)

**Digital Implementation:**
```typescript
function getTerritoryEffects(
  territory: Territory,
  player: PlayerState
): TerritoryEffect {
  const effect: TerritoryEffect = {
    hasBonus: false,
    bonusVP: 0
  };
  
  // Check control
  if (territory.controller === player.id) {
    // Positron Field: +1 VP
    if (territory.hasPositronField) {
      effect.bonusVP += 1;
    }
    
    // Territory bonus (unless Isolation Field)
    if (!territory.hasIsolationField) {
      effect.hasBonus = true;
    }
  }
  
  return effect;
}
```

---

## Rare Scenarios

### Ambiguity #161: All Territories Have Repulsor Fields

**Scenario:**
Through repeated use of Booster Pod (remove field) and Gravity Manipulator (place field), all 8 territories have Repulsor Fields. Can anyone place colonies?

**Interpretation:**
NO - no one can place new colonies via Colony Constructor (all territories blocked). However:
- Colonist Hub still works (can launch colonies onto track position, but cannot place on territories)
- Terraforming Station blocked (cannot place on territories)
- Must remove a Repulsor Field (via Booster Pod) to place colonies again

This is a theoretical deadlock that would need to be resolved by players.

**Digital Implementation:**
```typescript
function canPlaceAnyColony(board: GameBoard): boolean {
  // Check if any territory allows colony placement
  for (const territory of board.territories) {
    if (!territory.hasRepulsorField) {
      return true;
    }
  }
  
  return false; // All territories blocked
}

function resolvRepulsorFieldDeadlock(player: PlayerState): void {
  // Must use Booster Pod to remove a Repulsor Field
  if (player.hasCard('BOOSTER_POD')) {
    // Discard Booster Pod to remove a Repulsor Field
    const targetTerritory = chooseTerritory(player);
    discardBoosterPodToRemoveField(player, targetTerritory, 'REPULSOR');
  } else {
    // Cannot place colonies until someone removes a field
    console.log('No territories available for colony placement');
  }
}
```

---

### Ambiguity #162: Alien Artifact Cycling Edge Case

**Scenario:**
You dock ships totaling 8+ at Alien Artifact. All revealed cards are ones you already have. Can you keep cycling?

**Interpretation:**
YES - you continue cycling until you find a card you don't have, or the deck/discard pile is empty:
1. Reach 8+ value at Alien Artifact
2. Draw top card
3. If you have it, return to discard pile
4. Draw next card
5. Repeat until you find one you don't have, or no cards remain

If no valid cards remain (all cards are in players' hands), you gain nothing.

**Digital Implementation:**
```typescript
function claimFromAlienArtifact(player: PlayerState, artifact: AlienArtifact): void {
  let attempts = 0;
  const maxAttempts = 100; // Safety limit
  
  while (attempts < maxAttempts) {
    const card = drawCardFromArtifact(artifact);
    
    if (card === null) {
      // No cards left
      return;
    }
    
    if (canClaimCard(card, player)) {
      // Found valid card
      player.alienTechCards.push(card);
      return;
    }
    
    // Already have this card, return to discard and try again
    artifact.discardPile.push(card);
    attempts++;
  }
  
  // Safety: shouldn't reach here
  throw new Error('Infinite loop detected in Alien Artifact cycling');
}
```

---

### Ambiguity #163: Raiders' Outpost with Equal Sequences

**Scenario:**
You place 3-4-5 at Raiders' Outpost. Opponent has 1-2-3. Both are sequences. Can you raid?

**Interpretation:**
YES - your sequence (3-4-5) has a HIGHER SUM than opponent's (1-2-3):
- Your sum: 3 + 4 + 5 = 12
- Opponent sum: 1 + 2 + 3 = 6
- 12 > 6, so you can raid

The rule is "higher value sequence" = higher sum, not higher individual ship values.

**Digital Implementation:**
```typescript
function canRaidWithSequence(
  raiderShips: Ship[],
  victimShips: Ship[]
): boolean {
  // Both must be valid sequences
  if (!isSequence(raiderShips) || !isSequence(victimShips)) {
    return false;
  }
  
  // Calculate sums
  const raiderSum = raiderShips.reduce((sum, ship) => sum + ship.value, 0);
  const victimSum = victimShips.reduce((sum, ship) => sum + ship.value, 0);
  
  // Raider must have higher sum
  return raiderSum > victimSum;
}
```

---

### Ambiguity #164: Maintenance Bay Unlimited Capacity

**Scenario:**
Can Maintenance Bay hold ships from all 4 players simultaneously? What's the limit?

**Interpretation:**
Maintenance Bay has UNLIMITED CAPACITY. It can hold:
- Ships from all players
- Any number of ships per player
- Ships persist across multiple turns

There is no limit to Maintenance Bay capacity.

**Digital Implementation:**
```typescript
interface MaintenanceBay {
  ships: Map<string, Ship[]>; // playerId -> ships
  capacity: number; // Infinity
}

function addToMaintenanceBay(ship: Ship, playerId: string): void {
  if (!maintenanceBay.ships.has(playerId)) {
    maintenanceBay.ships.set(playerId, []);
  }
  
  // No capacity check - unlimited
  maintenanceBay.ships.get(playerId)!.push(ship);
}

function getMaintenanceBayCount(playerId: string): number {
  return maintenanceBay.ships.get(playerId)?.length || 0;
}
```

---

### Ambiguity #165: Resource Cache Equal Ships with 0 Ships

**Scenario:**
You have no ships in hand (all docked or on Maintenance Bay). Is 0 odd = 0 even?

**Interpretation:**
This scenario SHOULD NOT OCCUR. Resource Cache evaluates AFTER rolling, and you always roll at least 3 ships. However, if it did occur:
- 0 odd = 0 even (equal)
- Gain 1 fuel + 1 ore
- Discard Resource Cache

**Digital Implementation:**
```typescript
function evaluateResourceCache(player: PlayerState): void {
  const { odd, even } = countOddEvenShips(player.shipsInHand);
  
  // Edge case: 0 ships (should not happen)
  if (odd === 0 && even === 0) {
    console.warn('Warning: No ships in hand for Resource Cache evaluation');
    // Treat as equal (0 = 0)
    player.resources.fuel += 1;
    player.resources.ore += 1;
    discardCard(player, 'RESOURCE_CACHE');
    return;
  }
  
  // Normal evaluation
  if (odd === even) {
    player.resources.fuel += 1;
    player.resources.ore += 1;
    discardCard(player, 'RESOURCE_CACHE');
  } else if (odd > even) {
    player.resources.ore += 1;
  } else {
    player.resources.fuel += 1;
  }
}
```

---

## Summary

This document identifies **20 ambiguities** (Ambiguities #146-165) covering edge cases and cross-system interactions:

**Multi-System Interactions (5 ambiguities):**
- Data Crystal can only borrow one territory bonus per turn (fuel power restriction)
- Orbital Teleporter chain moves limited by once-per-turn restriction
- Multiple colony placement paths can be used in one turn
- Resource limit checked at end of turn (can temporarily exceed during turn)
- Relic Ship can be modified by all alien tech cards (treated as normal ship except for removal)

**Edge Cases (10 ambiguities):**
- Simultaneous control changes calculated sequentially
- Cannot use Colonist Hub with 0 colonies available
- Alien Artifact use succeeds but gains nothing if no cards available
- Three-way territory ties result in no control
- Removing colony from Colonist Hub track clears the track
- No maximum VP limit (theoretical max ~30 VP)
- Terraforming Station requires 4 colored ships minimum
- Plasma Cannon can clear entire facility of opponent ships
- Long game variant uses standard tie-breakers
- Multiple field generators on same territory stack effects

**Rare Scenarios (5 ambiguities):**
- All territories with Repulsor Fields creates deadlock (must remove with Booster Pod)
- Alien Artifact cycles until finding valid card or deck empty
- Raiders' Outpost sequence comparison uses sum (higher sum wins)
- Maintenance Bay has unlimited capacity
- Resource Cache with 0 ships treats as equal (edge case)

---

## Final Summary of All Documents

**Total ambiguities identified: 165 across 10 documents**

1. **Setup and Components** (15 ambiguities, #1-15)
2. **Turn Structure and Game Flow** (15 ambiguities, #16-30)
3. **Orbital Facilities Part 1** (18 ambiguities, #31-48)
4. **Orbital Facilities Part 2** (18 ambiguities, #49-66)
5. **Territory Control and Bonuses** (18 ambiguities, #67-84)
6. **Field Generators** (12 ambiguities, #85-96)
7. **Alien Tech Cards Part 1** (15 ambiguities, #97-111)
8. **Alien Tech Cards Part 2** (20 ambiguities, #112-131)
9. **Alien Tech Cards Part 3** (14 ambiguities, #132-145)
10. **Edge Cases and Cross-System Interactions** (20 ambiguities, #146-165)

All major game systems covered with interpretations and TypeScript implementations for deterministic digital gameplay using boardgame.io framework.

