# Raiders' Outpost through Terraforming Station Ambiguities (Pages 8-9)

## Source Text Review
**Pages 8-9** cover four complex facilities with player interaction: Raiders' Outpost, Shipyard, Solar Converter, and Terraforming Station.

---

## AMBIGUITY #47: Raiders' Outpost - Sequential Numbers Definition

**Rule Text:** "You must dock a set of three sequentially numbered ships to use the Raiders' Outpost."

**Ambiguity:** What exactly is "sequentially numbered"?
1. Must they be consecutive integers (1-2-3, 2-3-4, etc.)?
2. Can they wrap around (5-6-1)?
3. Must they be in order when docked?

**Interpretation:**
1. YES - Consecutive integers only (1-2-3, 2-3-4, 3-4-5, 4-5-6)
2. NO - Cannot wrap (6-1-2 is not valid)
3. NO - Order doesn't matter (docking 3-1-2 is same as 1-2-3)

**Valid sequences:** 1-2-3, 2-3-4, 3-4-5, 4-5-6 (only 4 possible)

**Digital Implementation:**

```javascript
function isSequentialSet(ships) {
  if (ships.length !== 3) return false;
  
  let values = ships.map(s => s.value).sort((a, b) => a - b);
  
  // Check if consecutive
  return (values[1] === values[0] + 1) && (values[2] === values[1] + 1);
}

function canUseRaidersOutpost(ships) {
  let validSequences = [
    [1, 2, 3],
    [2, 3, 4],
    [3, 4, 5],
    [4, 5, 6]
  ];
  
  let sorted = ships.map(s => s.value).sort((a, b) => a - b);
  return validSequences.some(seq => 
    seq.every((val, idx) => val === sorted[idx])
  );
}
```

---

## AMBIGUITY #48: Raiders' Outpost - Bumping Higher Sequence

**Rule Text:** "If the Raiders' Outpost is occupied, you may dock a higher-value sequence here and move the original ships to the Maintenance Bay."

**Ambiguity:**
1. What is a "higher-value sequence"? Sum of values? Highest ship? Lowest ship?
2. Can you bump a 1-2-3 with another 1-2-3?
3. Do bumped ships go to Maintenance Bay immediately or at end of turn?

**Interpretation:**
1. Minimum value of sequence determines "higher": 2-3-4 > 1-2-3 (minimum 2 > minimum 1)
2. NO - Must be strictly higher. Same sequence cannot bump itself
3. IMMEDIATELY - Ships go to Maintenance Bay as part of the bumping action

**Valid bumps:**
- 2-3-4 can bump 1-2-3
- 3-4-5 can bump 1-2-3 or 2-3-4
- 4-5-6 can bump any other sequence

**Digital Implementation:**

```javascript
function getSequenceMinimum(ships) {
  return Math.min(...ships.map(s => s.value));
}

function canBumpSequence(newShips, existingShips) {
  let newMin = getSequenceMinimum(newShips);
  let existingMin = getSequenceMinimum(existingShips);
  
  return newMin > existingMin;
}

function useRaidersOutpost(player, ships) {
  if (!isSequentialSet(ships)) {
    throw new Error("Must dock sequential ships (e.g., 2-3-4)");
  }
  
  let existingShips = raidersOutpost.dockedShips;
  
  if (existingShips.length > 0) {
    // Facility occupied - check if can bump
    if (!canBumpSequence(ships, existingShips)) {
      throw new Error(`Cannot bump existing sequence. Need higher than ${getSequenceMinimum(existingShips)}-based sequence`);
    }
    
    // Move existing ships to Maintenance Bay
    let owner = existingShips[0].owner;
    maintenanceBay.add(existingShips);
    raidersOutpost.clear();
  }
  
  // Dock new ships
  raidersOutpost.dock(ships, player);
  
  // Execute raid
  conductRaid(player);
}
```

---

## AMBIGUITY #49: Raiders' Outpost - Stealing Distribution

**Rule Text:** "While docked at the Raiders' Outpost you may steal a total of four resources from any mix of players or one alien tech card of your choice from one player."

**Ambiguity:**
1. Can you split the 4 resources between multiple players?
2. Can you steal from yourself (take your own resources)?
3. If stealing resources, can you choose fuel vs ore?
4. Is the steal action mandatory?

**Interpretation:**
1. YES - "from any mix of players" means you can take 2 from Player A, 2 from Player B, etc.
2. NO - Cannot steal from yourself (you're the raider)
3. YES - You choose which resources (fuel or ore) from each player
4. YES - The steal is the benefit of using the facility (like gaining ore from Lunar Mine)

**Digital Implementation:**

```javascript
function conductRaid(raider) {
  let choice = raider.chooseRaidType();
  
  if (choice === 'resources') {
    let totalToSteal = 4;
    let stolen = [];
    
    while (totalToSteal > 0) {
      let target = raider.chooseTarget(otherPlayers);
      let resourceType = raider.chooseResourceType(['fuel', 'ore']);
      let amount = Math.min(1, totalToSteal, target[resourceType]);
      
      target[resourceType] -= amount;
      raider[resourceType] += amount;
      totalToSteal -= amount;
      stolen.push({ target, resourceType, amount });
      
      if (!raider.wantsToContinue() || totalToSteal === 0) break;
    }
  } else if (choice === 'alienTech') {
    let target = raider.chooseTarget(otherPlayers);
    let card = raider.chooseCard(target.alienTech);
    
    // Check if raider already has this card
    if (raider.hasCard(card.name)) {
      card.discard();  // Immediately discarded
    } else {
      raider.alienTech.push(card);
      target.alienTech = target.alienTech.filter(c => c !== card);
    }
  }
}
```

---

## AMBIGUITY #50: Raiders' Outpost - Holographic Decoy Interaction

**Rule Text (from page 14):** "While you possess the Holographic Decoy a player may not use the Raiders' Outpost to steal resources from you. If the raiding player wishes to steal an alien tech card from you then they may only take your Holographic Decoy."

**Ambiguity:**
1. If raider chooses to steal resources, and one target has Holographic Decoy, can they steal from OTHER players?
2. If ALL players have Holographic Decoy, can you still steal resources?
3. If you steal someone's Holographic Decoy, do they lose protection immediately?

**Interpretation:**
1. YES - Holographic Decoy only protects the owner's resources, not everyone's
2. NO - You cannot steal resources from ANY player who has Holographic Decoy. Must steal alien tech instead
3. YES - Protection lost immediately when card changes hands

**Digital Implementation:**

```javascript
function conductRaid(raider) {
  let eligibleForResourceTheft = otherPlayers.filter(
    p => !p.hasCard('HolographicDecoy')
  );
  
  if (eligibleForResourceTheft.length === 0) {
    // Must steal alien tech if everyone protected
    let choice = raider.chooseRaidType(['alienTech']);  // No resource option
  } else {
    let choice = raider.chooseRaidType(['resources', 'alienTech']);
  }
  
  // When stealing tech from Holographic Decoy owner
  if (target.hasCard('HolographicDecoy')) {
    let forcedCard = target.alienTech.find(c => c.name === 'HolographicDecoy');
    stealCard(raider, target, forcedCard);
  }
}
```

---

## AMBIGUITY #51: Shipyard - Ship Count Determination

**Rule Text:** "Each pair of docked ships, along with the payment of the appropriate fuel and ore, earns one new ship from the ship stock. 4th ship: pay one fuel and one ore. 5th ship: pay two fuel and two ore. 6th ship: pay three fuel and three ore."

**Ambiguity:**
1. Is the cost based on CURRENT ship count or TOTAL ships ever built?
2. If you have 5 ships and build a 6th, what's the cost?
3. If you have 6 ships, lose 2 (via Plasma Cannon), then rebuild, what's the cost?

**Interpretation:**
1. CURRENT ship count (ships you currently have in play + stock)
2. Building the 6th ship costs 3F+3O
3. "Because it is possible to lose ships while playing, you may build your 4th, 5th, or 6th ship more than once" - cost is based on which position you're filling

**Example:**
- Start with 3 ships → build 4th (cost: 1F+1O) → now have 4 ships
- Lose 2 ships to Plasma Cannon → now have 2 ships  
- Build 3rd ship (cost: 0F+0O assuming no cost for 3rd) - NO! 
- Build 4th ship again (cost: 1F+1O) → now have 3 ships
- Build 5th ship (cost: 2F+2O) → now have 4 ships

**Digital Implementation:**

```javascript
function getShipyardCost(player) {
  let currentShipCount = player.getTotalShips();  // In play + stock
  let shipToBuild = currentShipCount + 1;
  
  let costs = {
    1: { fuel: 0, ore: 0 },  // Starting ships (not built)
    2: { fuel: 0, ore: 0 },  // Starting ships (not built)
    3: { fuel: 0, ore: 0 },  // Starting ships (not built)
    4: { fuel: 1, ore: 1 },
    5: { fuel: 2, ore: 2 },
    6: { fuel: 3, ore: 3 }
  };
  
  if (shipToBuild > 6) {
    throw new Error("Cannot have more than 6 ships");
  }
  
  return costs[shipToBuild];
}

function useShipyard(player, ships) {
  if (player.getTotalShips() >= 6) {
    throw new Error("Already have maximum ships");
  }
  
  let cost = getShipyardCost(player);
  
  // Apply Herbert Valley bonus
  if (player.controlsTerritory('HerbertValley')) {
    cost.fuel = Math.max(0, cost.fuel - 1);
    cost.ore = Math.max(0, cost.ore - 1);
  }
  
  if (player.fuel < cost.fuel || player.ore < cost.ore) {
    throw new Error(`Need ${cost.fuel}F and ${cost.ore}O`);
  }
  
  player.fuel -= cost.fuel;
  player.ore -= cost.ore;
  
  // New ship goes to Maintenance Bay
  let newShip = createShip(player.color);
  maintenanceBay.add(newShip, player);
}
```

---

## AMBIGUITY #52: Shipyard - No Ships in Stock

**Rule Text:** "If there are no ships of your color in the ship stock on your turn then you may not use the Shipyard."

**Ambiguity:**
1. What if your new ship would come from Maintenance Bay or the board, not ship stock?
2. Does "ship stock" mean the shared supply or your personal reserve?

**Interpretation:**
1. Ships are created and placed in Maintenance Bay. "Ship stock" refers to your personal reserve (the 3 ships you started with that aren't in play)
2. If all 6 of your ships are in play/Maintenance Bay, you cannot build more

**Clarification:** This rule seems to be about component limits. You have 6 physical ship dice. If all 6 are in use, you can't build a 7th.

**Digital Implementation:**

```javascript
function canUseShipyard(player) {
  return player.getTotalShips() < 6;
}

// Ship stock is conceptual - represents unused ship components
class Player {
  getTotalShips() {
    let inPlay = this.fleet.length;
    let inMaintenanceBay = maintenanceBay.getShipsOwnedBy(this.id).length;
    let onBoard = allFacilities.reduce((sum, f) => 
      sum + f.getShipsOwnedBy(this.id).length, 0
    );
    
    return inPlay + inMaintenanceBay + onBoard;
  }
}
```

---

## AMBIGUITY #53: Solar Converter - Rounding Per Ship

**Rule Text:** "You gain fuel equal to one half the value of each ship you dock here. Round up for each ship."

**Ambiguity:**
1. Do you round per ship, then sum? Or sum, then round?
2. What are the exact fuel gains for each die value?

**Interpretation:** Round per ship FIRST, then sum. "Round up for each ship" is explicit.

**Fuel gains:**
- 1 → 0.5 → rounds to 1 fuel
- 2 → 1.0 → 1 fuel (no rounding needed)
- 3 → 1.5 → rounds to 2 fuel
- 4 → 2.0 → 2 fuel
- 5 → 2.5 → rounds to 3 fuel
- 6 → 3.0 → 3 fuel

**Digital Implementation:**

```javascript
function useSolarConverter(player, ships) {
  let totalFuel = 0;
  
  for (let ship of ships) {
    let baseGain = ship.value / 2;
    let roundedGain = Math.ceil(baseGain);
    totalFuel += roundedGain;
  }
  
  // Apply Lem Badlands bonus
  if (player.controlsTerritory('LemBadlands')) {
    totalFuel += ships.length;  // +1 per ship
  }
  
  player.fuel += totalFuel;
  
  return totalFuel;
}
```

---

## AMBIGUITY #54: Solar Converter - Lem Badlands Stacking

**Rule Text (from page 11):** "Gain 1 additional fuel for each ship you dock at the Solar Converter."

**Ambiguity:** If you dock 3 ships at Solar Converter while controlling Lem Badlands, how much total fuel?

**Interpretation:** Base fuel + bonus fuel.

**Example:** Dock ships with values 3, 4, 5:
- Base fuel: ceil(3/2) + ceil(4/2) + ceil(5/2) = 2 + 2 + 3 = 7 fuel
- Lem Badlands bonus: +3 fuel (1 per ship)
- Total: 10 fuel

**Digital Implementation:**

```javascript
function calculateSolarConverterFuel(player, ships) {
  let baseFuel = ships.reduce((sum, ship) => {
    return sum + Math.ceil(ship.value / 2);
  }, 0);
  
  let bonusFuel = 0;
  if (player.controlsTerritory('LemBadlands')) {
    bonusFuel = ships.length;
  }
  
  return {
    base: baseFuel,
    bonus: bonusFuel,
    total: baseFuel + bonusFuel
  };
}
```

---

## AMBIGUITY #55: Terraforming Station - Ship Consumption Timing

**Rule Text:** "The ship docked at the Terraforming Station is completely consumed by the colony creation process and is returned to the ship stock at the beginning of your next turn."

**Ambiguity:**
1. When exactly is the ship "consumed"? Immediately when docked? Or at beginning of next turn?
2. Can the ship be manipulated while on Terraforming Station?
3. Can it be moved via Orbital Teleporter?

**Interpretation:**
1. Ship remains on facility until beginning of next turn, THEN returns to stock (see Ambiguity #12)
2. NO - "Completely consumed" means it's locked in
3. NO - Explicitly stated "A ship docked at the Terraforming Station may not be re-used via the Orbital Teleporter card"

**Digital Implementation:**

```javascript
function useTerraformingStation(player, ship) {
  // Validate: ship must be value 6
  if (ship.value !== 6) {
    throw new Error("Terraforming Station requires a 6");
  }
  
  // Validate: costs 1F + 1O
  if (player.fuel < 1 || player.ore < 1) {
    throw new Error("Terraforming Station costs 1F + 1O");
  }
  
  // Validate: cannot reduce fleet below 3
  if (player.getTotalShips() <= 3) {
    throw new Error("Cannot reduce fleet below 3 ships");
  }
  
  // Pay cost
  player.fuel--;
  player.ore--;
  
  // Place colony
  let territory = player.chooseTerritory();
  placeColony(player, territory);
  
  // Ship is consumed (will return to stock at start of next turn)
  terraformingStation.dock(ship, player);
  ship.isConsumed = true;
  ship.returnToStockNextTurn = true;
}
```

---

## AMBIGUITY #56: Terraforming Station - Minimum Fleet Calculation

**Rule Text:** "You cannot use the Terraforming Station if doing so would reduce your fleet to fewer than three ships of your color."

**Ambiguity:**
1. Does "fleet" mean currently rolled ships, or total ships owned?
2. Does "ships of your color" exclude the Relic Ship?
3. Is the minimum 3 ships before or after using Terraforming Station?

**Interpretation:**
1. TOTAL ships owned (in play + stock)
2. YES - Explicitly mentioned in Plasma Cannon rules (page 14): "The Relic Ship does not count toward this tally"
3. After using - you must have at least 3 ships AFTER the Terraforming Station ship is consumed

**Examples:**
- You have 3 colored ships + 1 Relic Ship = Cannot use Terraforming (would have 2 colored ships after)
- You have 4 colored ships = Can use Terraforming (would have 3 colored ships after)
- You have 6 ships = Can use Terraforming (would have 5 ships after)

**Digital Implementation:**

```javascript
function canUseTerraformingStation(player, ship) {
  // Count ships of player's color (exclude Relic Ship)
  let coloredShips = player.getAllShips().filter(s => 
    s.color === player.color
  ).length;
  
  // After consuming one ship, must still have at least 3
  return coloredShips - 1 >= 3;
}
```

---

## AMBIGUITY #57: Terraforming Station - Relic Ship Exception

**Rule Text (from page 10):** "Your Relic Ship has a 6 showing and you dock it at the Terraforming Station to build a colony. At the start of your next turn the Relic Ship returns to Burroughs Desert instead of the ship stock and you may repurchase it on that same turn."

**Ambiguity:**
1. Can you use Relic Ship at Terraforming Station?
2. Does it follow normal rules or special rules?
3. Does Relic Ship count toward the "minimum 3 ships" requirement?

**Interpretation:**
1. YES - Relic Ship behaves "exactly as any other ship in your fleet" (page 10)
2. SPECIAL - It returns to Burroughs Desert instead of ship stock
3. NO - As stated in Ambiguity #56, Relic Ship doesn't count toward minimum

**Example:** You have 3 colored ships + Relic Ship (showing 6). You CANNOT use Relic Ship at Terraforming Station because you don't have enough colored ships (3 colored - 0 consumed from this action = 3, which meets minimum, but Relic Ship doesn't count toward total for the check).

**Actually**, re-reading: You can use ANY ship including Relic Ship, but the minimum requirement is about colored ships. So:
- 3 colored + 1 Relic = Can use Relic Ship (3 colored remain)
- 3 colored + 1 Relic = CANNOT use colored ship (would have 2 colored after)

**Digital Implementation:**

```javascript
function useTerraformingStation(player, ship) {
  // If using a colored ship, check minimum
  if (ship.color === player.color) {
    let coloredShipCount = player.getColoredShips().length;
    if (coloredShipCount - 1 < 3) {
      throw new Error("Would reduce colored ships below 3");
    }
  }
  
  // Dock and consume ship
  terraformingStation.dock(ship, player);
  
  // Ship return destination depends on type
  if (ship.isRelicShip) {
    ship.returnToBurroughsDesert = true;
  } else {
    ship.returnToShipStock = true;
  }
}
```

---

## AMBIGUITY #58: Terraforming Station - Multiple Uses Per Turn

**Rule Text:** "There is only one docking port available at this facility."

**Ambiguity:** Can one player use Terraforming Station multiple times in one turn if they have multiple 6s?

**Interpretation:** NO - Only one docking port means only one ship can be docked at a time. Once you dock a ship, the facility is occupied until that ship is gathered (next turn).

**However**, this conflicts with physical game reality: if you dock a 6 at Terraforming Station, it stays there until next turn. You cannot dock a second 6 on the same turn because the port is occupied.

**Digital Implementation:**

```javascript
class TerraformingStation {
  constructor() {
    this.dockedShip = null;  // Only 1 ship at a time
  }
  
  canDock() {
    return this.dockedShip === null;
  }
  
  dock(ship, player) {
    if (!this.canDock()) {
      throw new Error("Terraforming Station is occupied");
    }
    this.dockedShip = ship;
  }
}
```

---

## SUMMARY: Critical Raiders' Outpost through Terraforming Station Decisions

**Raiders' Outpost:**
1. **Sequential = consecutive integers** only (1-2-3, 2-3-4, 3-4-5, 4-5-6)
2. **Higher sequence = higher minimum** (2-3-4 > 1-2-3)
3. **Can steal 4 resources from any mix** of players
4. **Holographic Decoy blocks resource theft** but forces card theft

**Shipyard:**
5. **Cost based on current ship count** (not total ever built)
6. **Maximum 6 ships per player** (component limit)
7. **Herbert Valley reduces each cost** by 1F+1O

**Solar Converter:**
8. **Round up per ship individually** (then sum)
9. **Lem Badlands adds +1 fuel per ship** (stacks with base)

**Terraforming Station:**
10. **Ship consumed returns to stock next turn** (not immediately)
11. **Minimum 3 COLORED ships after use** (Relic Ship doesn't count)
12. **Relic Ship returns to Burroughs Desert** (not ship stock)
13. **Only 1 docking port** (cannot use multiple times per turn)
14. **Cannot use Orbital Teleporter** on Terraforming Station ship

---

**Next Section:** Territory Control & Bonuses (Pages 10-11)
