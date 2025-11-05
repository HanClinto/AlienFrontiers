# Territory Control and Bonuses - Rules Ambiguities (v2)

Based on: AlienFrontiersRules-2ndPrint.pdf (2011 Edition)

## Territory Control Mechanics

**Official Rules Text (Page 10):**
> "Each territory grants its controlling player a bonus over some aspect of the game. A player controls a territory if they have more colonies on that territory than any other single player. The controlling player takes the territory counter.
>
> A territory is not controlled by any player if two or more players are tied for the most colonies on a territory. No player earns the bonus for such a territory. The counter for a territory that is not controlled remains on the territory."

---

### Ambiguity #67: Control Determination Algorithm

**Rule Text:**
> "A player controls a territory if they have more colonies on that territory than any other single player."

**Ambiguity:**
What is the exact algorithm for determining control? How do you handle multi-way ties?

**Interpretation:**
Control is determined by STRICT MAJORITY of colonies on a single territory:
1. Count colonies for each player on the territory
2. Find the maximum count
3. If exactly ONE player has the maximum, they control the territory
4. If TWO OR MORE players are tied for maximum, NO ONE controls the territory

Examples:
- Red: 2, Blue: 1, Green: 1 → Red controls (strict majority)
- Red: 2, Blue: 2, Green: 1 → No control (tie at top)
- Red: 2, Blue: 2, Green: 2 → No control (three-way tie)
- Red: 1 → Red controls (only player present)

**Digital Implementation:**
```typescript
interface TerritoryState {
  colonies: Map<string, number>; // playerId -> colony count
}

function calculateControl(territory: TerritoryState): string | null {
  if (territory.colonies.size === 0) {
    return null; // Empty territory, no control
  }
  
  // Find max colony count
  const colonyCounts = Array.from(territory.colonies.values());
  const maxCount = Math.max(...colonyCounts);
  
  // Find all players with max count
  const playersWithMax = Array.from(territory.colonies.entries())
    .filter(([_, count]) => count === maxCount)
    .map(([playerId, _]) => playerId);
  
  // Control only if exactly one player has max
  return playersWithMax.length === 1 ? playersWithMax[0] : null;
}
```

---

### Ambiguity #68: Control Change Timing

**Rule Text:**
> "The controlling player takes the territory counter."

**Ambiguity:**
When exactly does control change? If multiple colonies are placed on the same territory in one turn (impossible normally, but consider alien tech cards), when is control recalculated?

**Interpretation:**
Control is recalculated IMMEDIATELY after each colony placement. The sequence is:
1. Colony is placed on territory
2. Control is recalculated
3. Territory counter changes hands if needed
4. Victory points are updated immediately

If control changes multiple times in one turn (via Polarity Device swapping colonies), each change triggers immediate VP updates.

**Digital Implementation:**
```typescript
function placeColony(
  territory: Territory,
  player: PlayerState,
  board: GameBoard
): void {
  // Add colony
  territory.addColony(player.id);
  player.coloniesAvailable -= 1;
  
  // Recalculate control immediately
  const previousController = territory.controller;
  const newController = calculateControl(territory);
  
  if (previousController !== newController) {
    updateTerritoryControl(territory, previousController, newController);
  }
  
  // Update VP (includes colony VP and control VP)
  updateAllVictoryPoints(board);
}
```

---

### Ambiguity #69: Empty Territory Control

**Rule Text:**
> "A player controls a territory if they have more colonies on that territory than any other single player."

**Ambiguity:**
Can a territory with zero colonies be controlled? What if all territories start empty?

**Interpretation:**
A territory with ZERO colonies cannot be controlled. At game start, all territories are empty and uncontrolled. Control only begins when at least one colony is placed.

**Digital Implementation:**
```typescript
function calculateControl(territory: TerritoryState): string | null {
  // Empty territory = no control
  if (territory.colonies.size === 0) {
    return null;
  }
  
  // Only one player present = they control
  if (territory.colonies.size === 1) {
    return Array.from(territory.colonies.keys())[0];
  }
  
  // Multiple players: check for majority
  return calculateMajority(territory);
}
```

---

### Ambiguity #70: Territory Counter Location

**Rule Text:**
> "The counter for a territory that is not controlled remains on the territory."

**Ambiguity:**
Where does the counter physically sit when controlled vs. uncontrolled? Does this matter for gameplay?

**Interpretation:**
Territory counter location indicates control status:
- **Controlled**: Counter is with the controlling player (in their play area)
- **Uncontrolled**: Counter remains on the board (on the territory space)

This is a visual indicator. Gameplay-wise, what matters is WHO controls it, not where the counter physically sits, but the physical location helps players track control.

**Digital Implementation:**
```typescript
interface Territory {
  id: string;
  name: string;
  colonies: Map<string, number>;
  controller: string | null;
  counterLocation: 'BOARD' | string; // 'BOARD' or playerId
}

function updateTerritoryControl(
  territory: Territory,
  oldController: string | null,
  newController: string | null
): void {
  // Return counter to board if losing control
  if (oldController !== null) {
    const oldPlayer = getPlayer(oldController);
    oldPlayer.victoryPoints -= 1; // Lose control VP
  }
  
  // Give counter to new controller
  if (newController !== null) {
    const newPlayer = getPlayer(newController);
    newPlayer.victoryPoints += 1; // Gain control VP
    territory.counterLocation = newController;
  } else {
    territory.counterLocation = 'BOARD';
  }
  
  territory.controller = newController;
}
```

---

## Territory Bonuses (All 8 Territories)

### Asimov Crater

**Official Rules Text (Page 10):**
> "Advance your colony one extra level each turn in which you dock more than one ship at the Colonist Hub."

---

### Ambiguity #71: "More Than One Ship" Per Turn

**Rule Text:**
> "each turn in which you dock more than one ship at the Colonist Hub"

**Ambiguity:**
Does this mean docking 2+ ships on the SAME turn, or docking ships on multiple turns? Is it cumulative?

**Interpretation:**
"More than one ship" means 2+ ships docked at Colonist Hub ON THE SAME TURN. The bonus is per-turn, not cumulative.

Examples:
- Dock 2 ships on one turn: +2 advances (base) + 1 (bonus) = 3 total advances
- Dock 3 ships on one turn: +3 advances (base) + 1 (bonus) = 4 total advances
- Dock 1 ship per turn for 3 turns: No bonus (only 1 ship per turn)

**Digital Implementation:**
```typescript
function advanceColonyAtHub(
  shipsDockedThisTurn: number,
  player: PlayerState,
  track: ColonistHubTrack
): void {
  let advances = shipsDockedThisTurn;
  
  // Asimov Crater bonus: +1 if docked 2+ ships this turn
  if (player.controlsTerritory('ASIMOV_CRATER') && shipsDockedThisTurn > 1) {
    advances += 1;
  }
  
  track.colonyPosition = Math.min(track.colonyPosition + advances, 7);
}
```

---

### Ambiguity #72: Asimov Crater with Excess Advances

**Rule Text:**
> "If you earn more advances than are needed to move your colony to the seventh circle (see Asimov Crater below) and launch the colony immediately, you may use the excess advances to begin work on a new colony."

**Ambiguity:**
If Asimov Crater gives you an extra advance, and this causes you to have excess advances when launching, does the excess include the Asimov bonus?

**Interpretation:**
YES - the Asimov Crater bonus is included in the total advances, so it can contribute to excess advances.

Example:
- Colony at circle 5
- Dock 3 ships at Colonist Hub
- Asimov Crater: +1 bonus
- Total advances: 3 + 1 = 4
- Colony moves from 5 → 6 → 7, ready to launch
- Launch immediately: 2 excess advances (4 - 2 used = 2 remaining)
- New colony starts at circle 2

**Digital Implementation:**
```typescript
function dockAtColonistHubWithAsimov(
  ships: Ship[],
  player: PlayerState,
  track: ColonistHubTrack,
  shouldLaunch: boolean
): void {
  let advances = ships.length;
  
  // Asimov Crater bonus
  if (player.controlsTerritory('ASIMOV_CRATER') && ships.length > 1) {
    advances += 1;
  }
  
  const currentPosition = track.colonyPosition;
  const newPosition = currentPosition + advances;
  
  if (newPosition >= 7 && shouldLaunch) {
    const advancesToReach7 = 7 - currentPosition;
    const excessAdvances = advances - advancesToReach7;
    
    // Launch colony
    launchColony(player, track);
    
    // Apply excess to new colony (includes Asimov bonus in calculation)
    if (excessAdvances > 0 && player.coloniesAvailable > 0) {
      startNewColony(player, track, excessAdvances);
    }
  } else {
    track.colonyPosition = Math.min(newPosition, 7);
  }
}
```

---

### Bradbury Plateau

**Official Rules Text (Page 10):**
> "Pay one less ore than usual when you use the Colony Constructor."

---

### Ambiguity #73: Bradbury Plateau Cost Reduction

**Rule Text:**
> "Pay one less ore than usual when you use the Colony Constructor."

**Ambiguity:**
Does this reduce the cost from 3 ore to 2 ore? Can it stack with other reductions? Can it go below 0?

**Interpretation:**
Reduces cost by exactly 1 ore: 3 ore → 2 ore. Cannot go below 0 ore (minimum cost is 0). Does not stack with other potential reductions (though no other cards reduce Colony Constructor cost).

**Digital Implementation:**
```typescript
function getColonyConstructorCost(player: PlayerState): number {
  let cost = 3; // Base cost
  
  // Bradbury Plateau: -1 ore
  if (player.controlsTerritory('BRADBURY_PLATEAU')) {
    cost -= 1;
  }
  
  // Cannot go below 0
  return Math.max(cost, 0);
}

function useColonyConstructor(
  ships: [Ship, Ship, Ship],
  player: PlayerState,
  territory: Territory
): void {
  const cost = getColonyConstructorCost(player);
  
  if (player.resources.ore < cost) {
    throw new Error(`Insufficient ore: need ${cost}, have ${player.resources.ore}`);
  }
  
  player.resources.ore -= cost;
  placeColony(territory, player);
}
```

---

### Burroughs Desert

**Official Rules Text (Page 10):**
> "Purchase the Relic Ship for 1 fuel and 1 ore. Place the ship on the Maintenance Bay and gather it with the rest of your fleet on your next turn. Return the ship to Burroughs Desert immediately if you lose control of this territory. The Relic Ship behaves exactly as any other ship in your fleet except that it has no color and any time the ship would be returned to the ship stock it is returned to Burroughs Desert instead."

---

### Ambiguity #74: Purchasing the Relic Ship

**Rule Text:**
> "Purchase the Relic Ship for 1 fuel and 1 ore."

**Ambiguity:**
When can you purchase the Relic Ship? Can you purchase it multiple times per turn? What if it's already in use by you or another player?

**Interpretation:**
You can purchase the Relic Ship:
- On your turn, any time during the "Use Tech and Assign Fleet" phase
- Once per turn maximum (purchasing is an action)
- Only if you control Burroughs Desert
- Only if the Relic Ship is currently on Burroughs Desert (not in use by anyone)

If another player has the Relic Ship, you cannot purchase it until they lose control of Burroughs Desert (which returns it).

**Digital Implementation:**
```typescript
interface RelicShip {
  location: 'BURROUGHS_DESERT' | 'IN_USE';
  currentOwner: string | null;
  value: number; // Current die value
}

function canPurchaseRelicShip(
  player: PlayerState,
  relicShip: RelicShip
): boolean {
  // Must control Burroughs Desert
  if (!player.controlsTerritory('BURROUGHS_DESERT')) {
    return false;
  }
  
  // Relic must be available (on the territory)
  if (relicShip.location !== 'BURROUGHS_DESERT') {
    return false;
  }
  
  // Must have resources
  if (player.resources.fuel < 1 || player.resources.ore < 1) {
    return false;
  }
  
  return true;
}

function purchaseRelicShip(
  player: PlayerState,
  relicShip: RelicShip
): void {
  if (!canPurchaseRelicShip(player, relicShip)) {
    throw new Error('Cannot purchase Relic Ship');
  }
  
  // Pay cost
  player.resources.fuel -= 1;
  player.resources.ore -= 1;
  
  // Place on Maintenance Bay
  relicShip.location = 'IN_USE';
  relicShip.currentOwner = player.id;
  placeOnMaintenanceBay(relicShip, player);
}
```

---

### Ambiguity #75: Relic Ship Return on Control Loss

**Rule Text:**
> "Return the ship to Burroughs Desert immediately if you lose control of this territory."

**Ambiguity:**
What happens to the Relic Ship's current state when returned? If it's docked at a facility, does it get removed immediately? What if it's in your hand (rolled but not docked)?

**Interpretation:**
"Immediately" means the Relic Ship is returned no matter where it currently is:
- **In hand (not docked)**: Removed from hand, returned to Burroughs Desert
- **Docked at facility**: Removed from facility, returned to Burroughs Desert
- **On Maintenance Bay**: Removed, returned to Burroughs Desert

This can happen mid-turn if you lose control (e.g., opponent places colony on Burroughs Desert during their turn).

**Digital Implementation:**
```typescript
function handleBurroughsDesertControlLoss(
  oldController: string,
  relicShip: RelicShip
): void {
  if (relicShip.currentOwner !== oldController) {
    return; // Not using Relic Ship
  }
  
  const player = getPlayer(oldController);
  
  // Remove from wherever it currently is
  if (relicShip.location === 'IN_USE') {
    // Remove from hand
    const index = player.shipsInHand.findIndex(s => s.isRelicShip);
    if (index !== -1) {
      player.shipsInHand.splice(index, 1);
    }
    
    // Remove from any facility
    for (const facility of board.facilities) {
      facility.removeRelicShipIfPresent();
    }
  }
  
  // Return to Burroughs Desert
  relicShip.location = 'BURROUGHS_DESERT';
  relicShip.currentOwner = null;
}
```

---

### Ambiguity #76: Relic Ship and Isolation Field

**Rule Text (Example 2):**
> "Your Relic Ship is docked at the Lunar Mine. Another player discards a Stasis Beam and places the Isolation Field on Burroughs Desert. You must return the Relic Ship to the territory immediately."

**Ambiguity:**
Why does the Isolation Field force return of the Relic Ship? The Isolation Field only nullifies territory bonuses, not control.

**Interpretation:**
This appears to be an ERROR in the rules or a special interaction. The Isolation Field:
- Nullifies territory bonuses
- Does NOT change control

However, the example suggests that when Isolation Field is on Burroughs Desert, the Relic Ship cannot be used (even if you still control it). This is a special case for Burroughs Desert's "bonus" which is the Relic Ship itself.

Interpretation: Isolation Field on Burroughs Desert prevents purchasing AND returns any active Relic Ship immediately.

**Digital Implementation:**
```typescript
function placeIsolationField(
  territory: Territory,
  relicShip: RelicShip
): void {
  territory.hasIsolationField = true;
  
  // Special case: Burroughs Desert with Isolation Field
  if (territory.id === 'BURROUGHS_DESERT' && relicShip.location === 'IN_USE') {
    // Force return of Relic Ship
    returnRelicShipToBurroughs(relicShip);
  }
}

function canPurchaseRelicShipWithIsolation(
  player: PlayerState,
  burroughsDesert: Territory
): boolean {
  // Cannot purchase if Isolation Field is on Burroughs Desert
  if (burroughsDesert.hasIsolationField) {
    return false;
  }
  
  return canPurchaseRelicShip(player);
}
```

---

### Ambiguity #77: Relic Ship at Terraforming Station

**Rule Text (Example 3):**
> "Your Relic Ship has a 6 showing and you dock it at the Terraforming Station to build a colony. At the start of your next turn the Relic Ship returns to Burroughs Desert instead of the ship stock and you may repurchase it on that same turn."

**Ambiguity:**
Can you immediately repurchase the Relic Ship after it returns? Does this count as having it "available" for purchase?

**Interpretation:**
YES - you can repurchase the Relic Ship on the same turn it returns from Terraforming Station. The sequence is:
1. Your turn begins
2. Relic Ship returns from Terraforming Station to Burroughs Desert
3. Relic Ship is now available for purchase
4. During your turn, you can repurchase it (if you control Burroughs Desert and have 1 fuel + 1 ore)

**Digital Implementation:**
```typescript
function startTurnWithRelicAtTerraforming(
  player: PlayerState,
  relicShip: RelicShip
): void {
  // Step 1: Return Relic Ship to Burroughs Desert
  if (relicShip.location === 'TERRAFORMING_STATION') {
    relicShip.location = 'BURROUGHS_DESERT';
    relicShip.currentOwner = null;
  }
  
  // Step 2: Gather other ships and roll
  gatherAndRollFleet(player);
  
  // Step 3: During turn, player can repurchase Relic Ship
  // (This happens during the "Use Tech and Assign Fleet" phase)
}
```

---

### Ambiguity #78: Relic Ship Color and Ownership

**Rule Text:**
> "The Relic Ship behaves exactly as any other ship in your fleet except that it has no color"

**Ambiguity:**
Does the Relic Ship count toward your ship total for purposes like the Terraforming Station "three ships minimum" rule? Can other players target it with Plasma Cannon?

**Interpretation:**
The Relic Ship:
- Counts as a ship in your fleet for docking, rolling, and using facilities
- Does NOT count toward "ships of your color" requirements (e.g., Terraforming Station minimum)
- CAN be targeted by Plasma Cannon and other cards that affect "ships"
- Has no color, so it never goes to the ship stock (goes to Burroughs Desert instead)

**Digital Implementation:**
```typescript
interface Ship {
  value: number;
  color: PlayerColor | null; // null for Relic Ship
  isRelicShip: boolean;
}

function countColoredShips(player: PlayerState): number {
  return player.activeShips.filter(s => !s.isRelicShip).length;
}

function canUseTerraformingStationWithRelic(player: PlayerState): boolean {
  const coloredShips = countColoredShips(player);
  return coloredShips >= 4; // Need 4 colored ships (4 - 1 = 3 remaining)
}

function canTargetShipWithPlasmaCannon(ship: Ship): boolean {
  return true; // All ships, including Relic, can be targeted
}
```

---

### Heinlein Plains

**Official Rules Text (Page 10):**
> "Your trading ratio is always 1 fuel for 1 ore when using the Orbital Market."

---

### Ambiguity #79: Heinlein Plains Override

**Rule Text:**
> "Your trading ratio is always 1 fuel for 1 ore"

**Ambiguity:**
Does this override the normal ship value requirement? If you dock a pair of 6s, do you pay 6 fuel for 1 ore, or 1 fuel for 1 ore?

**Interpretation:**
Heinlein Plains OVERRIDES the normal trade ratio completely. Regardless of ship value, the ratio is always 1:1.

Examples:
- Dock pair of 3s: Normally 3 fuel → 1 ore. With Heinlein Plains: 1 fuel → 1 ore
- Dock pair of 6s: Normally 6 fuel → 1 ore. With Heinlein Plains: 1 fuel → 1 ore

This makes Heinlein Plains extremely valuable for efficient trading.

**Digital Implementation:**
```typescript
function getOrbitalMarketRatio(
  dockedShips: [Ship, Ship],
  player: PlayerState
): number {
  // Heinlein Plains: always 1:1 ratio
  if (player.controlsTerritory('HEINLEIN_PLAINS')) {
    return 1;
  }
  
  // Normal: ratio equals ship value
  return dockedShips[0].value;
}

function tradeAtOrbitalMarket(
  dockedShips: [Ship, Ship],
  player: PlayerState,
  timesToTrade: number
): void {
  const ratio = getOrbitalMarketRatio(dockedShips, player);
  const fuelCost = ratio * timesToTrade;
  
  if (player.resources.fuel < fuelCost) {
    throw new Error('Insufficient fuel');
  }
  
  player.resources.fuel -= fuelCost;
  player.resources.ore += timesToTrade;
}
```

---

### Herbert Valley

**Official Rules Text (Page 11):**
> "Pay 1 less fuel and ore than usual for each ship you build at the Shipyard."

---

### Ambiguity #80: Herbert Valley Cost Reduction

**Rule Text:**
> "Pay 1 less fuel and ore than usual"

**Ambiguity:**
Does "1 less" mean -1 fuel AND -1 ore (total -2 resources), or -1 from each (which equals -2 resources)? Can costs go below 0?

**Interpretation:**
"1 less fuel and ore" means -1 fuel AND -1 ore. The reduction applies to BOTH resources.

Examples:
- 4th ship: Normally 1 fuel + 1 ore. With Herbert Valley: 0 fuel + 0 ore (free)
- 5th ship: Normally 2 fuel + 2 ore. With Herbert Valley: 1 fuel + 1 ore
- 6th ship: Normally 3 fuel + 3 ore. With Herbert Valley: 2 fuel + 2 ore

Costs cannot go below 0. The minimum is 0 fuel + 0 ore.

**Digital Implementation:**
```typescript
function getShipyardCostWithBonus(player: PlayerState): Resources {
  const baseCost = getShipyardBaseCost(player);
  
  // Herbert Valley: -1 fuel and -1 ore
  if (player.controlsTerritory('HERBERT_VALLEY')) {
    baseCost.fuel = Math.max(baseCost.fuel - 1, 0);
    baseCost.ore = Math.max(baseCost.ore - 1, 0);
  }
  
  return baseCost;
}

function buildShipWithBonus(player: PlayerState): void {
  const cost = getShipyardCostWithBonus(player);
  
  if (player.resources.fuel < cost.fuel || player.resources.ore < cost.ore) {
    throw new Error('Insufficient resources');
  }
  
  player.resources.fuel -= cost.fuel;
  player.resources.ore -= cost.ore;
  
  // Build ship...
}
```

---

### Lem Badlands

**Official Rules Text (Page 11):**
> "Gain 1 additional fuel for each ship you dock at the Solar Converter."

**Ambiguity:**
(Already covered in Ambiguity #62 in Orbital Facilities document)

**Interpretation:**
+1 fuel per ship docked at Solar Converter. This stacks with the normal fuel gain.

---

### Pohl Foothills

**Official Rules Text (Page 11):**
> "Pay one less fuel than normal for each alien tech card you use."

---

### Ambiguity #81: Pohl Foothills Fuel Reduction

**Rule Text:**
> "Pay one less fuel than normal for each alien tech card you use."

**Ambiguity:**
Does this apply to ALL fuel costs from alien tech cards, or only the "fuel power" (not discard powers)? Does it apply to cards with no fuel cost?

**Interpretation:**
Pohl Foothills reduces fuel costs for alien tech card FUEL POWERS only (not discard powers, which have no fuel cost). It reduces the cost by 1 fuel per use.

Examples:
- Booster Pod (normally 1 fuel): With Pohl Foothills, costs 0 fuel
- Gravity Manipulator (normally 2 fuel): With Pohl Foothills, costs 1 fuel
- Plasma Cannon (1 fuel per ship removed): With Pohl Foothills, 0 fuel per ship (but still requires the action)

Costs cannot go below 0.

**Digital Implementation:**
```typescript
function getAlienTechFuelCost(
  card: AlienTechCard,
  player: PlayerState
): number {
  let cost = card.fuelCost;
  
  // Pohl Foothills: -1 fuel per tech card use
  if (player.controlsTerritory('POHL_FOOTHILLS')) {
    cost = Math.max(cost - 1, 0);
  }
  
  return cost;
}

function useAlienTechCard(
  card: AlienTechCard,
  player: PlayerState,
  action: 'FUEL_POWER' | 'DISCARD_POWER'
): void {
  if (action === 'FUEL_POWER') {
    const fuelCost = getAlienTechFuelCost(card, player);
    
    if (player.resources.fuel < fuelCost) {
      throw new Error('Insufficient fuel');
    }
    
    player.resources.fuel -= fuelCost;
    applyCardEffect(card, player);
  } else {
    // Discard power: no fuel cost (Pohl Foothills doesn't apply)
    discardCard(card, player);
    applyDiscardEffect(card, player);
  }
}
```

---

### Ambiguity #82: Pohl Foothills with Plasma Cannon

**Rule Text (Example 2):**
> "You have a Plasma Cannon card which allows you to remove opponents' ships from an orbital facility at a cost of one fuel per ship. You choose to remove three ships from the Lunar Mine. Since you control Pohl Foothills you only pay 2 fuel for this action."

**Ambiguity:**
Does Pohl Foothills reduce the TOTAL cost by 1, or reduce the PER-SHIP cost by 1?

**Interpretation:**
Pohl Foothills reduces the TOTAL cost of using the card by 1 fuel, not the per-ship cost. This is confirmed by the example:

- Removing 3 ships: Normally 3 fuel (1 per ship)
- With Pohl Foothills: 2 fuel total (3 - 1 = 2)

If it reduced per-ship cost:
- Would be 0 fuel per ship, so 0 total (incorrect)

The reduction is applied ONCE per card use, not once per ship.

**Digital Implementation:**
```typescript
function usePlasmaCannon(
  shipsToRemove: number,
  player: PlayerState
): void {
  let fuelCost = shipsToRemove; // 1 fuel per ship
  
  // Pohl Foothills: -1 fuel for using the card (not per ship)
  if (player.controlsTerritory('POHL_FOOTHILLS')) {
    fuelCost = Math.max(fuelCost - 1, 0);
  }
  
  if (player.resources.fuel < fuelCost) {
    throw new Error('Insufficient fuel');
  }
  
  player.resources.fuel -= fuelCost;
  
  // Remove ships...
}
```

---

### Van Vogt Mountains

**Official Rules Text (Page 11):**
> "The first ship you dock at the Lunar Mine each turn may be any value."

---

### Ambiguity #83: Van Vogt Mountains "First Ship"

**Rule Text:**
> "The first ship you dock at the Lunar Mine each turn may be any value."

**Ambiguity:**
Does "first ship" mean the first ship YOU dock (on your turn), or the first ship docked by anyone (including previous players)?

**Interpretation:**
"First ship" means the first ship YOU dock at the Lunar Mine ON YOUR TURN. This bypasses the normal "must be >= highest value" rule for your first docking only.

Subsequent ships you dock on the same turn must follow normal rules (>= highest value, including your first ship).

**Digital Implementation:**
```typescript
interface PlayerTurnState {
  shipsDockedAtLunarMineThisTurn: number;
}

function canDockAtLunarMineWithBonus(
  ship: Ship,
  mine: LunarMine,
  player: PlayerState,
  turnState: PlayerTurnState
): boolean {
  // Van Vogt Mountains: first ship can be any value
  if (
    player.controlsTerritory('VAN_VOGT_MOUNTAINS') &&
    turnState.shipsDockedAtLunarMineThisTurn === 0
  ) {
    return true; // Bypass normal check
  }
  
  // Normal check: must be >= highest value
  const highestValue = getHighestShipValue(mine);
  return ship.value >= highestValue;
}

function dockAtLunarMineWithBonus(
  ship: Ship,
  player: PlayerState,
  mine: LunarMine,
  turnState: PlayerTurnState
): void {
  if (!canDockAtLunarMineWithBonus(ship, mine, player, turnState)) {
    throw new Error('Ship value too low');
  }
  
  mine.dockShip(ship);
  player.resources.ore += 1;
  turnState.shipsDockedAtLunarMineThisTurn += 1;
}
```

---

### Ambiguity #84: Van Vogt Mountains Multiple Ships

**Rule Text:**
> "If you want to receive a second ore you can also dock the 5 at the Lunar Mine."

**Ambiguity:**
After docking your first ship (any value) via Van Vogt Mountains, do subsequent ships need to be >= your first ship, or >= the original highest?

**Interpretation:**
Subsequent ships must be >= the CURRENT highest value (including your first ship). Van Vogt Mountains only bypasses the check for the first ship you dock.

Example from rules:
- Current highest at Lunar Mine: 5
- You control Van Vogt Mountains
- First ship: Dock a 1 (allowed via bonus, now highest is 5)
- Second ship: Must dock 5 or higher (1 doesn't change the highest of 5)

Your first ship doesn't necessarily become the new highest - the highest is the maximum of ALL ships docked.

**Digital Implementation:**
```typescript
function dockMultipleAtLunarMineWithBonus(
  ships: Ship[],
  player: PlayerState,
  mine: LunarMine
): void {
  const turnState: PlayerTurnState = { shipsDockedAtLunarMineThisTurn: 0 };
  
  for (const ship of ships) {
    // First ship: can be any value (Van Vogt Mountains)
    // Subsequent ships: must be >= current highest
    
    if (!canDockAtLunarMineWithBonus(ship, mine, player, turnState)) {
      throw new Error(`Cannot dock ship with value ${ship.value}`);
    }
    
    dockAtLunarMineWithBonus(ship, player, mine, turnState);
  }
}
```

---

## Summary

This document identifies **18 ambiguities** (Ambiguities #67-84) in Territory Control and Territory Bonuses:

**Territory Control Mechanics (4 ambiguities):**
- Control requires strict majority (no ties)
- Control changes immediately after colony placement
- Empty territories cannot be controlled
- Territory counter location indicates control status

**Territory Bonuses (14 ambiguities):**
- **Asimov Crater**: +1 advance when docking 2+ ships same turn, includes excess advances
- **Bradbury Plateau**: -1 ore at Colony Constructor (3 → 2)
- **Burroughs Desert**: Relic Ship purchase timing, control loss returns it immediately, Isolation Field interaction, Terraforming Station return, color/ownership rules
- **Heinlein Plains**: 1:1 trade ratio overrides ship value
- **Herbert Valley**: -1 fuel AND -1 ore at Shipyard
- **Lem Badlands**: +1 fuel per ship at Solar Converter
- **Pohl Foothills**: -1 fuel per tech card use (total, not per-unit)
- **Van Vogt Mountains**: First ship per turn at Lunar Mine can be any value

**Total ambiguities so far: 84 across 5 documents**

Next document should cover: **Field Generators** (Isolation Field, Positron Field, Repulsor Field)

