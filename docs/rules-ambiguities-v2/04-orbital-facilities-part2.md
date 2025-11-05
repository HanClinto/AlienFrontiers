# Orbital Facilities Part 2 - Rules Ambiguities (v2)

Based on: AlienFrontiersRules-2ndPrint.pdf (2011 Edition)

This document continues the analysis of orbital facilities, covering the remaining 4 facilities: Raiders' Outpost, Shipyard, Solar Converter, and Terraforming Station.

## Raiders' Outpost

**Official Rules Text (Page 8):**
> "You must dock a set of three sequentially numbered ships to use the Raiders' Outpost. There are docking ports for one set of three ships. If the Raiders' Outpost is occupied, either by your own ships or by the ships of another player, you may dock a higher-value sequence here and move the original ships to the Maintenance Bay.
>
> While docked at the Raiders' Outpost you may steal a total of four resources from any mix of players or one alien tech card of your choice from one player. If you steal an alien tech card that you already have, the stolen card is discarded immediately and you gain no benefit from doing so."

---

### Ambiguity #49: Sequential Numbering Definition

**Rule Text:**
> "You must dock a set of three sequentially numbered ships"

**Ambiguity:**
What counts as "sequentially numbered"? Must it be consecutive (1-2-3, 2-3-4, etc.), or could it be evenly spaced (1-3-5, 2-4-6)? The examples show consecutive sequences only.

**Interpretation:**
"Sequentially numbered" means CONSECUTIVE values only. Valid sequences:
- 1-2-3
- 2-3-4
- 3-4-5
- 4-5-6

Invalid sequences:
- 1-3-5 (not consecutive)
- 1-2-4 (gap in sequence)
- 6-5-4 (descending, not sequential)

**Digital Implementation:**
```typescript
function isValidSequence(ships: [Ship, Ship, Ship]): boolean {
  const values = ships.map(s => s.value).sort((a, b) => a - b);
  
  // Must be consecutive: each value is previous + 1
  return (
    values[1] === values[0] + 1 &&
    values[2] === values[1] + 1
  );
}

function canDockAtRaidersOutpost(ships: [Ship, Ship, Ship]): boolean {
  if (!isValidSequence(ships)) {
    return false;
  }
  
  // Must be between 1-2-3 and 4-5-6
  const minValue = Math.min(...ships.map(s => s.value));
  const maxValue = Math.max(...ships.map(s => s.value));
  
  return minValue >= 1 && maxValue <= 6;
}
```

---

### Ambiguity #50: "Higher-Value Sequence" Definition

**Rule Text:**
> "you may dock a higher-value sequence here and move the original ships to the Maintenance Bay"

**Ambiguity:**
What makes a sequence "higher-value"? Is it the sum of the three ships, the highest ship in the sequence, or the minimum ship in the sequence?

**Interpretation:**
"Higher-value" means HIGHER SUM of all three ships. This is confirmed by Example 2 which explicitly calculates totals:

- 1-2-3 (total 6) < 2-3-4 (total 9)
- 2-3-4 (total 9) < 3-4-5 (total 12)
- 3-4-5 (total 12) < 4-5-6 (total 15)

A 3-4 (total 7) cannot be bumped by 1-2-3 (total 6).

**Digital Implementation:**
```typescript
function getSequenceTotal(ships: Ship[]): number {
  return ships.reduce((sum, ship) => sum + ship.value, 0);
}

function canBumpSequence(
  newShips: [Ship, Ship, Ship],
  currentShips: Ship[]
): boolean {
  const newTotal = getSequenceTotal(newShips);
  const currentTotal = getSequenceTotal(currentShips);
  
  return newTotal > currentTotal;
}

function dockAtRaidersOutpost(
  ships: [Ship, Ship, Ship],
  player: PlayerState,
  outpost: RaidersOutpost
): void {
  if (!isValidSequence(ships)) {
    throw new Error('Ships must be sequentially numbered');
  }
  
  // Check if can bump existing ships
  if (outpost.dockedShips.length > 0) {
    if (!canBumpSequence(ships, outpost.dockedShips)) {
      throw new Error('New sequence must have higher total value');
    }
    
    // Move existing ships to Maintenance Bay
    outpost.dockedShips.forEach(ship => {
      placeOnMaintenanceBay(ship, getPlayer(ship.playerId));
    });
  }
  
  // Dock new ships
  outpost.dockedShips = ships;
}
```

---

### Ambiguity #51: Bumping Your Own Ships

**Rule Text:**
> "If the Raiders' Outpost is occupied, either by your own ships or by the ships of another player, you may dock a higher-value sequence here"

**Ambiguity:**
Why would you bump your own ships? If you already control the Raiders' Outpost, why replace your sequence?

**Interpretation:**
You might bump your own ships for several strategic reasons:
1. **Already raided**: You raided on a previous turn, ships still docked. Now you roll a better sequence and want to raid again.
2. **Better sequence**: You have a 1-2-3 docked but roll a 4-5-6, allowing you to bump your own sequence and conduct a stronger raid (the total doesn't matter for raiding, but positioning matters).
3. **Tactical repositioning**: Free up those ships for use elsewhere by moving them to Maintenance Bay.

**Digital Implementation:**
```typescript
function handleRaidersOutpostTurn(
  ships: [Ship, Ship, Ship],
  player: PlayerState,
  outpost: RaidersOutpost
): void {
  const isOwnShips = outpost.dockedShips.every(s => s.playerId === player.id);
  
  if (isOwnShips) {
    // Bumping own ships - confirm strategic choice
    console.log('You are bumping your own ships. This will move them to Maintenance Bay.');
  }
  
  // Proceed with bumping (same logic for own or opponent ships)
  dockAtRaidersOutpost(ships, player, outpost);
  
  // Conduct raid
  conductRaid(player, outpost);
}
```

---

### Ambiguity #52: Partial Sequence Bumping

**Rule Text (Example 2):**
> "A 3-4-5 are docked at the Raiders' Outpost. You use the Plasma Cannon to send the 5 back to the Maintenance Bay, leaving a 3 and 4 on the Raiders' Outpost. To dock a higher-value sequence at the Raiders' Outpost you must use a run of three ships that totals more than the sum of the ships currently docked there."

**Ambiguity:**
If only 2 ships remain after using Plasma Cannon, is the facility still "occupied"? Can anyone dock any valid sequence (since 2 ships is not a valid occupancy), or must they still beat the sum of the remaining ships?

**Interpretation:**
Even with partial ships remaining (after Plasma Cannon removes one), the facility is still "occupied" and you must dock a higher-value sequence. The sum comparison uses only the remaining ships.

In the example: 3+4=7, so you need a sequence totaling more than 7 (so 2-3-4, 3-4-5, or 4-5-6).

**Digital Implementation:**
```typescript
function getRaidersOutpostRequirement(outpost: RaidersOutpost): number {
  if (outpost.dockedShips.length === 0) {
    return 0; // No requirement if empty
  }
  
  // Sum of currently docked ships (even if partial)
  return getSequenceTotal(outpost.dockedShips);
}

function canDockAtRaidersOutpostWithBump(
  ships: [Ship, Ship, Ship],
  outpost: RaidersOutpost
): boolean {
  if (!isValidSequence(ships)) {
    return false;
  }
  
  const requiredTotal = getRaidersOutpostRequirement(outpost);
  const newTotal = getSequenceTotal(ships);
  
  // Must exceed current total (even if partial sequence remains)
  return newTotal > requiredTotal;
}
```

---

### Ambiguity #53: Raid Distribution

**Rule Text:**
> "you may steal a total of four resources from any mix of players"

**Ambiguity:**
Can you split the 4 resources across multiple players (e.g., 2 from Red, 2 from Blue)? Can you take from yourself? Must you take exactly 4, or can you take fewer?

**Interpretation:**
- You CAN split across multiple players (2 from Red, 1 from Blue, 1 from Yellow)
- You CANNOT take from yourself (that makes no sense)
- You can take UP TO 4 resources (you can choose to take fewer)
- You can choose fuel, ore, or any mix

**Digital Implementation:**
```typescript
interface RaidTarget {
  playerId: string;
  fuel: number;
  ore: number;
}

function conductResourceRaid(
  raidingPlayer: PlayerState,
  targets: RaidTarget[]
): void {
  const totalResources = targets.reduce((sum, t) => sum + t.fuel + t.ore, 0);
  
  if (totalResources > 4) {
    throw new Error('Cannot steal more than 4 resources');
  }
  
  // Cannot raid yourself
  for (const target of targets) {
    if (target.playerId === raidingPlayer.id) {
      throw new Error('Cannot raid yourself');
    }
    
    const targetPlayer = getPlayer(target.playerId);
    
    // Check target has resources
    if (targetPlayer.resources.fuel < target.fuel) {
      throw new Error(`Target does not have ${target.fuel} fuel`);
    }
    if (targetPlayer.resources.ore < target.ore) {
      throw new Error(`Target does not have ${target.ore} ore`);
    }
    
    // Transfer resources
    targetPlayer.resources.fuel -= target.fuel;
    targetPlayer.resources.ore -= target.ore;
    raidingPlayer.resources.fuel += target.fuel;
    raidingPlayer.resources.ore += target.ore;
  }
}
```

---

### Ambiguity #54: Alien Tech Raid vs. Resource Raid

**Rule Text:**
> "you may steal a total of four resources from any mix of players or one alien tech card of your choice from one player"

**Ambiguity:**
Is it "four resources OR one tech card" (mutually exclusive), or can you take some resources AND a tech card? Can you take 2 resources and half a tech card?

**Interpretation:**
It is MUTUALLY EXCLUSIVE. You choose ONE of:
- Option A: Steal up to 4 resources (fuel/ore) from any mix of players
- Option B: Steal 1 alien tech card from exactly 1 player

You cannot mix (e.g., 2 resources + 1 tech card).

**Digital Implementation:**
```typescript
enum RaidType {
  RESOURCES = 'RESOURCES',
  TECH_CARD = 'TECH_CARD'
}

interface ResourceRaidChoice {
  type: RaidType.RESOURCES;
  targets: RaidTarget[];
}

interface TechRaidChoice {
  type: RaidType.TECH_CARD;
  targetPlayerId: string;
  cardName: string;
}

type RaidChoice = ResourceRaidChoice | TechRaidChoice;

function conductRaid(
  raidingPlayer: PlayerState,
  choice: RaidChoice
): void {
  if (choice.type === RaidType.RESOURCES) {
    conductResourceRaid(raidingPlayer, choice.targets);
  } else {
    conductTechRaid(raidingPlayer, choice.targetPlayerId, choice.cardName);
  }
}
```

---

### Ambiguity #55: Stealing Duplicate Tech Cards

**Rule Text:**
> "If you steal an alien tech card that you already have, the stolen card is discarded immediately and you gain no benefit from doing so."

**Ambiguity:**
Can you intentionally steal a duplicate (to remove it from an opponent)? Is this a valid strategic choice, or is it prevented?

**Interpretation:**
You CAN steal a duplicate card intentionally. It is discarded immediately, but this might be strategically valuable:
1. Remove a powerful card from an opponent
2. Prevent other players from stealing a non-duplicate
3. Waste your raid when no better option exists

The rules allow it but warn you gain no benefit.

**Digital Implementation:**
```typescript
function conductTechRaid(
  raidingPlayer: PlayerState,
  targetPlayerId: string,
  cardName: string
): void {
  const targetPlayer = getPlayer(targetPlayerId);
  
  // Verify target has the card
  const cardIndex = targetPlayer.alienTechCards.findIndex(c => c.name === cardName);
  if (cardIndex === -1) {
    throw new Error('Target does not have this card');
  }
  
  // Remove card from target
  const stolenCard = targetPlayer.alienTechCards.splice(cardIndex, 1)[0];
  
  // Check if raiding player already has this card
  const isDuplicate = raidingPlayer.alienTechCards.some(c => c.name === cardName);
  
  if (isDuplicate) {
    // Discard immediately, no benefit
    discardCard(stolenCard);
    console.log(`Stolen card ${cardName} is a duplicate and was discarded.`);
  } else {
    // Add to raiding player's hand
    raidingPlayer.alienTechCards.push(stolenCard);
  }
}
```

---

### Ambiguity #56: Holographic Decoy Interaction

**Rule Text (from Alien Tech section):**
> "While you possess the Holographic Decoy a player may not use the Raiders' Outpost to steal resources from you. If the raiding player wishes to steal an alien tech card from you then they may only take your Holographic Decoy."

**Ambiguity:**
If you have the Holographic Decoy, can the raiding player choose to steal resources from other players (ignoring you), or are they forced to either take your Decoy or do nothing?

**Interpretation:**
The raiding player can STILL raid other players for resources. The Holographic Decoy only protects YOU from resource raids. They can:
1. Steal resources from other players (not you)
2. Steal your Holographic Decoy card
3. Steal a different tech card from another player

The Decoy doesn't prevent the raid, just protects your resources.

**Digital Implementation:**
```typescript
function getRaidableTargets(
  raidingPlayer: PlayerState,
  allPlayers: PlayerState[]
): PlayerState[] {
  return allPlayers.filter(p => {
    if (p.id === raidingPlayer.id) return false; // Cannot raid self
    
    // Player with Holographic Decoy cannot be raided for resources
    // But can still be raided for tech cards
    return true;
  });
}

function conductRaidWithDecoy(
  raidingPlayer: PlayerState,
  targetPlayer: PlayerState,
  choice: RaidChoice
): void {
  if (choice.type === RaidType.RESOURCES) {
    if (targetPlayer.hasCard('HOLOGRAPHIC_DECOY')) {
      throw new Error('Cannot steal resources from player with Holographic Decoy');
    }
    conductResourceRaid(raidingPlayer, choice.targets);
  } else {
    // Tech card raid
    if (targetPlayer.hasCard('HOLOGRAPHIC_DECOY')) {
      // Can only steal the Decoy
      if (choice.cardName !== 'HOLOGRAPHIC_DECOY') {
        throw new Error('Can only steal Holographic Decoy from this player');
      }
    }
    conductTechRaid(raidingPlayer, choice.targetPlayerId, choice.cardName);
  }
}
```

---

## Shipyard

**Official Rules Text (Page 9):**
> "You must dock two ships of equal value to use the Shipyard. There are enough docking ports to accommodate three pairs of ships at any one time. Each pair of docked ships, along with the payment of the appropriate fuel and ore, earns one new ship from the ship stock.
>
> - 4th ship: pay one fuel and one ore.
> - 5th ship: pay two fuel and two ore.
> - 6th ship: pay three fuel and three ore.
>
> Take a ship of your color from the ship stock and place it in the Maintenance Bay. Claim it at the start of your next turn when you gather your fleet. If there are no ships of your color in the ship stock on your turn then you may not use the Shipyard. Because it is possible to lose ships while playing, you may build your 4th, 5th, or 6th ship more than once during the game."

---

### Ambiguity #57: "4th Ship" Definition

**Rule Text:**
> "4th ship: pay one fuel and one ore."

**Ambiguity:**
Does "4th ship" mean the 4th ship you own (going from 3 to 4 ships), or the 4th ship you've built (cumulative throughout the game)? If you build your 4th ship, lose it, then rebuild it, what's the cost?

**Interpretation:**
"4th ship" means going from 3 ships to 4 ships in your CURRENT fleet count. The cost is based on how many ships you currently have, not how many you've built historically.

Example:
- Start with 3 ships
- Build 4th ship (1 fuel + 1 ore) → now have 4 ships
- Lose a ship via Terraforming Station → now have 3 ships
- Build again (1 fuel + 1 ore) → back to 4 ships
- Build 5th ship (2 fuel + 2 ore) → now have 5 ships

**Digital Implementation:**
```typescript
function getShipyardCost(player: PlayerState): { fuel: number; ore: number } {
  const currentShipCount = player.activeShips.length + player.stockShips;
  
  switch (currentShipCount) {
    case 3:
      return { fuel: 1, ore: 1 }; // Building 4th ship
    case 4:
      return { fuel: 2, ore: 2 }; // Building 5th ship
    case 5:
      return { fuel: 3, ore: 3 }; // Building 6th ship
    default:
      throw new Error(`Invalid ship count: ${currentShipCount}`);
  }
}

function buildShipAtShipyard(
  ships: [Ship, Ship],
  player: PlayerState,
  shipyard: Shipyard
): void {
  // Check equal value
  if (ships[0].value !== ships[1].value) {
    throw new Error('Ships must have equal value');
  }
  
  // Check stock availability
  if (player.stockShips === 0) {
    throw new Error('No ships available in stock');
  }
  
  // Calculate cost based on current fleet size
  const cost = getShipyardCost(player);
  
  if (player.resources.fuel < cost.fuel || player.resources.ore < cost.ore) {
    throw new Error('Insufficient resources');
  }
  
  // Pay cost
  player.resources.fuel -= cost.fuel;
  player.resources.ore -= cost.ore;
  
  // Move ship from stock to Maintenance Bay
  player.stockShips -= 1;
  placeOnMaintenanceBay(createShip(player.color), player);
}
```

---

### Ambiguity #58: Rebuilding Lost Ships

**Rule Text:**
> "Because it is possible to lose ships while playing, you may build your 4th, 5th, or 6th ship more than once during the game."

**Ambiguity:**
Can you build a 7th ship? What if you lose 2 ships - can you rebuild both?

**Interpretation:**
Maximum ships is 6 per player. You CANNOT build a 7th ship. However, if you lose ships (via Terraforming Station, Plasma Cannon discard, etc.), you can rebuild them back up to 6.

Example:
- Have 6 ships
- Use Terraforming Station, lose a ship → now have 5 ships
- Can rebuild 6th ship again (3 fuel + 3 ore)
- Cannot build 7th ship (only 6 ships per color exist)

**Digital Implementation:**
```typescript
const MAX_SHIPS_PER_PLAYER = 6;

function canBuildShip(player: PlayerState): boolean {
  const currentShips = player.activeShips.length;
  const stockShips = player.stockShips;
  const totalShips = currentShips + stockShips;
  
  // Can build if under max and have ships in stock
  return totalShips < MAX_SHIPS_PER_PLAYER && stockShips > 0;
}

function buildShip(player: PlayerState): void {
  if (!canBuildShip(player)) {
    throw new Error('Cannot build ship: at maximum or no stock available');
  }
  
  // Build logic...
}
```

---

### Ambiguity #59: Multiple Shipyard Builds Per Turn

**Rule Text:**
> "There are enough docking ports to accommodate three pairs of ships at any one time."

**Ambiguity:**
Can you build multiple ships in one turn if you have enough pairs and resources? Can you build your 4th and 5th ship on the same turn?

**Interpretation:**
YES - you can build multiple ships per turn if you have:
1. Multiple pairs of equal-value ships
2. Enough resources to pay for each build
3. Available docking ports (3 pairs max)

You could theoretically build 3 ships in one turn (if you had 6 ships to dock as 3 pairs and enough resources).

**Digital Implementation:**
```typescript
function buildMultipleShips(
  pairs: Array<[Ship, Ship]>,
  player: PlayerState,
  shipyard: Shipyard
): void {
  if (pairs.length > 3) {
    throw new Error('Shipyard only has docking for 3 pairs');
  }
  
  // Calculate total cost for all ships
  let totalFuel = 0;
  let totalOre = 0;
  let shipsNeeded = 0;
  
  for (let i = 0; i < pairs.length; i++) {
    const currentShipCount = player.activeShips.length + player.stockShips + i;
    const cost = getShipyardCostForCount(currentShipCount);
    totalFuel += cost.fuel;
    totalOre += cost.ore;
    shipsNeeded += 1;
  }
  
  // Validate resources
  if (player.resources.fuel < totalFuel || player.resources.ore < totalOre) {
    throw new Error('Insufficient resources for multiple builds');
  }
  
  if (player.stockShips < shipsNeeded) {
    throw new Error('Insufficient ships in stock');
  }
  
  // Execute builds
  for (const pair of pairs) {
    buildShipAtShipyard(pair, player, shipyard);
  }
}
```

---

## Solar Converter

**Official Rules Text (Page 9):**
> "You may dock ships of any value at the Solar Converter. There are enough docking ports to accommodate eight ships. You gain fuel equal to one half the value of each ship you dock here. Round up for each ship."

---

### Ambiguity #60: Rounding Per Ship vs. Total

**Rule Text:**
> "You gain fuel equal to one half the value of each ship you dock here. Round up for each ship."

**Ambiguity:**
Do you round up for each ship individually, or round up the total after adding all half-values?

**Interpretation:**
Round up for EACH SHIP individually, not the total. This is explicitly stated: "Round up for each ship."

Example:
- Dock a 3: gain ⌈3÷2⌉ = ⌈1.5⌉ = 2 fuel
- Dock a 4: gain ⌈4÷2⌉ = ⌈2.0⌉ = 2 fuel
- Total: 4 fuel

If you rounded the total: (3+4)÷2 = 3.5 → 4 fuel (different result)

**Digital Implementation:**
```typescript
function calculateSolarConverterFuel(ship: Ship): number {
  return Math.ceil(ship.value / 2);
}

function dockAtSolarConverter(
  ships: Ship[],
  player: PlayerState,
  converter: SolarConverter
): void {
  if (ships.length > 8) {
    throw new Error('Solar Converter only has 8 docking ports');
  }
  
  let totalFuel = 0;
  
  // Calculate fuel for each ship individually, rounding up each time
  for (const ship of ships) {
    const fuel = calculateSolarConverterFuel(ship);
    totalFuel += fuel;
  }
  
  player.resources.fuel += totalFuel;
  
  // Dock ships
  ships.forEach(ship => converter.dockShip(ship));
}
```

---

### Ambiguity #61: Solar Converter Rounding Table

**Rule Text:**
> "Round up for each ship"

**Ambiguity:**
What is the exact fuel gained for each die value?

**Interpretation:**
Explicit rounding table:
- Die value 1: ⌈1÷2⌉ = ⌈0.5⌉ = 1 fuel
- Die value 2: ⌈2÷2⌉ = ⌈1.0⌉ = 1 fuel
- Die value 3: ⌈3÷2⌉ = ⌈1.5⌉ = 2 fuel
- Die value 4: ⌈4÷2⌉ = ⌈2.0⌉ = 2 fuel
- Die value 5: ⌈5÷2⌉ = ⌈2.5⌉ = 3 fuel
- Die value 6: ⌈6÷2⌉ = ⌈3.0⌉ = 3 fuel

**Digital Implementation:**
```typescript
const SOLAR_CONVERTER_TABLE: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
  6: 3
};

function calculateSolarConverterFuelOptimized(ship: Ship): number {
  return SOLAR_CONVERTER_TABLE[ship.value] || 0;
}
```

---

### Ambiguity #62: Lem Badlands Bonus with Solar Converter

**Rule Text (from Territory Bonuses):**
> "Lem Badlands: Gain 1 additional fuel for each ship you dock at the Solar Converter."

**Ambiguity:**
If you control Lem Badlands and dock 2 ships at Solar Converter, do you gain +1 fuel total or +2 fuel (one per ship)?

**Interpretation:**
You gain +1 fuel PER SHIP. The wording "for each ship you dock" is clear.

Example: Dock a 3 and a 4 at Solar Converter while controlling Lem Badlands:
- Ship 3: 2 fuel (base) + 1 fuel (Lem Badlands) = 3 fuel
- Ship 4: 2 fuel (base) + 1 fuel (Lem Badlands) = 3 fuel
- Total: 6 fuel

**Digital Implementation:**
```typescript
function dockAtSolarConverterWithBonus(
  ships: Ship[],
  player: PlayerState,
  converter: SolarConverter,
  board: GameBoard
): void {
  let totalFuel = 0;
  
  const hasLemBadlands = player.controlledTerritories.has('LEM_BADLANDS');
  
  for (const ship of ships) {
    let fuel = calculateSolarConverterFuel(ship);
    
    // Lem Badlands: +1 fuel per ship
    if (hasLemBadlands) {
      fuel += 1;
    }
    
    totalFuel += fuel;
  }
  
  player.resources.fuel += totalFuel;
  ships.forEach(ship => converter.dockShip(ship));
}
```

---

## Terraforming Station

**Official Rules Text (Page 9):**
> "You must dock one ship with a value of 6 and pay one fuel and one ore to use the Terraforming Station. There is only one docking port available at this facility. Using the Terraforming Station allows you to land one of your unplaced colonies on a territory immediately. The ship docked at the Terraforming Station is completely consumed by the colony creation process and is returned to the ship stock at the beginning of your next turn. A ship forfeited in this manner may be rebuilt using the Shipyard only after it has returned to the ship stock.
>
> You cannot use the Terraforming Station if doing so would reduce your fleet to fewer than three ships of your color.
>
> A ship docked at the Terraforming Station may be removed by the Plasma Cannon card but may not be moved to another orbital facility."

---

### Ambiguity #63: Three Ship Minimum Calculation

**Rule Text:**
> "You cannot use the Terraforming Station if doing so would reduce your fleet to fewer than three ships of your color."

**Ambiguity:**
How do you count "fleet size" when checking this restriction? Do you count ships currently in hand, ships on board, or ships in stock?

**Interpretation:**
"Fleet" means ACTIVE ships (ships you can roll), not including ships in stock. Count:
- Ships currently docked on board
- Ships in your hand (this turn, before docking)

Don't count:
- Ships in the ship stock (not yet built)
- The Relic Ship (it's not "of your color")

You need at least 4 active ships to use Terraforming Station (4 - 1 = 3 remaining).

**Digital Implementation:**
```typescript
function canUseTerraformingStation(player: PlayerState): boolean {
  const activeShips = player.activeShips.length;
  
  // Need at least 4 ships (4 - 1 = 3 remaining)
  if (activeShips < 4) {
    return false;
  }
  
  // Check resources
  if (player.resources.fuel < 1 || player.resources.ore < 1) {
    return false;
  }
  
  // Must have a 6
  const hasSix = player.shipsInHand.some(s => s.value === 6);
  if (!hasSix) {
    return false;
  }
  
  return true;
}
```

---

### Ambiguity #64: Relic Ship at Terraforming Station

**Rule Text (from Burroughs Desert):**
> "Your Relic Ship has a 6 showing and you dock it at the Terraforming Station to build a colony. At the start of your next turn the Relic Ship returns to Burroughs Desert instead of the ship stock."

**Ambiguity:**
If you use the Relic Ship at Terraforming Station, does it count against the three-ship minimum? Can you use it if you only have 3 ships (2 colored + Relic)?

**Interpretation:**
The Relic Ship does NOT count toward the "three ships of your color" requirement. You need 3 colored ships remaining AFTER using Terraforming Station.

However, you CAN use the Relic Ship at Terraforming Station if you have at least 3 other colored ships. The Relic returns to Burroughs Desert (not ship stock) at the start of your next turn.

**Digital Implementation:**
```typescript
function canUseTerraformingStationWithRelic(
  player: PlayerState,
  usingRelicShip: boolean
): boolean {
  const coloredShips = player.activeShips.filter(s => s.color === player.color).length;
  
  if (usingRelicShip) {
    // Using Relic Ship: need at least 3 colored ships (they stay)
    return coloredShips >= 3;
  } else {
    // Using colored ship: need at least 4 colored ships (4 - 1 = 3 remaining)
    return coloredShips >= 4;
  }
}

function useTerraformingStation(
  ship: Ship,
  player: PlayerState,
  territory: Territory,
  station: TerraformingStation
): void {
  if (ship.value !== 6) {
    throw new Error('Must use a ship with value 6');
  }
  
  const isRelicShip = ship.color === null; // Relic has no color
  
  if (!canUseTerraformingStationWithRelic(player, isRelicShip)) {
    throw new Error('Would reduce fleet below 3 ships');
  }
  
  // Pay cost
  player.resources.fuel -= 1;
  player.resources.ore -= 1;
  
  // Dock ship (it stays until next turn)
  station.dockShip(ship);
  
  // Place colony immediately
  placeColony(territory, player);
  
  // Ship will return to stock (or Burroughs Desert for Relic) at start of next turn
}
```

---

### Ambiguity #65: Plasma Cannon Removing Terraforming Ship

**Rule Text:**
> "A ship docked at the Terraforming Station may be removed by the Plasma Cannon card"

**Ambiguity:**
If another player uses Plasma Cannon to remove your ship from Terraforming Station, does it go to Maintenance Bay or directly to ship stock? Do you keep the colony you built?

**Interpretation:**
If Plasma Cannon removes a ship from Terraforming Station:
1. The ship goes to ship stock IMMEDIATELY (not Maintenance Bay)
2. The colony you built remains on the board (the benefit was already gained)
3. This is an exception to normal Plasma Cannon behavior (usually ships go to Maintenance Bay)

Example 2 in the rules explicitly states: "a ship on the Terraforming Station is forfeit on the player's next turn so you return it to the ship stock instead."

**Digital Implementation:**
```typescript
function usePlasmaCannon(
  targetShip: DockedShip,
  targetFacility: Facility,
  player: PlayerState
): void {
  if (targetFacility.type === 'TERRAFORMING_STATION') {
    // Special case: ship goes to stock immediately, not Maintenance Bay
    const shipOwner = getPlayer(targetShip.playerId);
    
    if (targetShip.color === null) {
      // Relic Ship: return to Burroughs Desert
      returnRelicShipToBurroughs(targetShip);
    } else {
      // Colored ship: return to stock
      shipOwner.stockShips += 1;
    }
    
    targetFacility.removeShip(targetShip);
  } else {
    // Normal case: ship goes to Maintenance Bay
    targetFacility.removeShip(targetShip);
    placeOnMaintenanceBay(targetShip, getPlayer(targetShip.playerId));
  }
}
```

---

### Ambiguity #66: Orbital Teleporter and Terraforming Station

**Rule Text:**
> "A ship docked at the Terraforming Station may be removed by the Plasma Cannon card but may not be moved to another orbital facility."

**Ambiguity:**
Can you use Orbital Teleporter on a ship at Terraforming Station? The rules say it "may not be moved" but Plasma Cannon is explicitly allowed.

**Interpretation:**
Orbital Teleporter CANNOT move ships from Terraforming Station. The text "may not be moved to another orbital facility" is absolute. Plasma Cannon is an exception because it removes (doesn't move to another facility).

The Orbital Teleporter rules also explicitly state: "You may not use the Orbital Teleporter to move a ship off of the Terraforming Station or the Maintenance Bay."

**Digital Implementation:**
```typescript
function useOrbitalTeleporter(
  ship: DockedShip,
  fromFacility: Facility,
  toFacility: Facility,
  player: PlayerState
): void {
  // Cannot move from Terraforming Station or Maintenance Bay
  if (fromFacility.type === 'TERRAFORMING_STATION') {
    throw new Error('Cannot teleport ship from Terraforming Station');
  }
  
  if (fromFacility.type === 'MAINTENANCE_BAY') {
    throw new Error('Cannot teleport ship from Maintenance Bay');
  }
  
  // Move ship
  fromFacility.removeShip(ship);
  toFacility.dockShip(ship);
}
```

---

## Summary

This document identifies **18 additional ambiguities** (Ambiguities #49-66) for the remaining orbital facilities:

**Raiders' Outpost:**
- Sequential numbering means consecutive values (1-2-3, 2-3-4, etc.)
- Higher-value sequence means higher sum
- Can bump your own ships strategically
- Partial sequences after Plasma Cannon still require higher total
- Resource raids can split across players
- Tech raid and resource raid are mutually exclusive
- Can steal duplicates (discarded immediately)
- Holographic Decoy only protects resources, not tech

**Shipyard:**
- Cost based on current fleet size (not historical builds)
- Can rebuild lost ships multiple times
- Can build multiple ships per turn

**Solar Converter:**
- Round up for each ship individually (not total)
- Explicit fuel table: 1→1, 2→1, 3→2, 4→2, 5→3, 6→3
- Lem Badlands bonus: +1 fuel per ship

**Terraforming Station:**
- Three-ship minimum counts active ships only (not stock)
- Relic Ship doesn't count toward three-ship minimum
- Plasma Cannon removes ship to stock (not Maintenance Bay)
- Orbital Teleporter cannot move ships from Terraforming Station
- Colony benefit is kept even if ship removed by Plasma Cannon

**Total ambiguities so far: 66 across 4 documents**

Next document should cover: **Territory Control and Territory Bonuses** (all 8 territories)
