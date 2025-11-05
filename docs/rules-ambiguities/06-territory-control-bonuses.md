# Territory Control & Bonuses Ambiguities (Pages 10-11)

## Source Text Review
**Pages 10-11** cover territory control mechanics and all 8 territory bonuses: Asimov Crater, Bradbury Plateau, Burroughs Desert, Heinlein Plains, Herbert Valley, Lem Badlands, Pohl Foothills, and Van Vogt Mountains.

---

## AMBIGUITY #59: Territory Control - Tie Mechanics

**Rule Text:** "A territory is not controlled by any player if two or more players are tied for the most colonies on a territory. No player earns the bonus for such a territory. The counter for a territory that is not controlled remains on the territory."

**Ambiguity:**
1. If Red has 2 colonies and Yellow has 2 colonies, who has the counter?
2. If control was previously Red's, does Red lose the counter or keep it?
3. Can the counter be "in limbo" with no owner?

**Interpretation:**
1. NO ONE has the counter - it stays on the territory
2. Red loses the counter immediately (and loses 1 VP)
3. YES - Counter physically remains on the territory board location (not held by any player)

**Digital Implementation:**

```javascript
function updateTerritoryControl(territory) {
  let colonyCounts = Object.entries(territory.colonies)
    .filter(([_, count]) => count > 0);
  
  let maxCount = Math.max(...colonyCounts.map(([_, c]) => c));
  let leaders = colonyCounts.filter(([_, c]) => c === maxCount);
  
  let previousController = territory.controller;
  let newController = leaders.length === 1 ? leaders[0][0] : null;
  
  if (previousController !== newController) {
    // Remove from previous controller
    if (previousController) {
      removeControl(previousController, territory);
      updateScore(previousController, -1);  // Lose 1 VP for control
    }
    
    // Grant to new controller
    if (newController) {
      grantControl(newController, territory);
      updateScore(newController, +1);  // Gain 1 VP for control
    }
    
    territory.controller = newController;
  }
}
```

---

## AMBIGUITY #60: Territory Bonuses - Immediate Activation

**Rule Text (from page 6):** "If colony placement results in your having more colonies on the territory than any other player, you 'control' that territory. You take its counter, gain an extra victory point, and may use the territory's bonus."

**Ambiguity:** Can you use the territory bonus on the SAME TURN you gain control?

**Interpretation:** YES - "may use the territory's bonus" is present tense. You gain control immediately and can use the bonus on the same turn (if applicable).

**Example:** You place a colony on Asimov Crater, gaining control. Later in the same turn, you dock 2 ships at Colonist Hub and advance 3 circles (2 base + 1 Asimov bonus).

**Digital Implementation:**

```javascript
function placeColony(player, territory) {
  territory.colonies[player.id]++;
  player.coloniesRemaining--;
  updateScore(player, +1);  // Colony placement VP
  
  // Check and update control
  updateTerritoryControl(territory);
  
  // Player can now use bonus immediately if they control it
  if (territory.controller === player.id) {
    player.activeBonuses.add(territory.bonus);
  }
}
```

---

## AMBIGUITY #61: Asimov Crater - "More Than One Ship"

**Rule Text:** "Advance your colony one extra level when you dock more than one ship at the Colonist Hub."

**Ambiguity:**
1. Does "more than one" mean exactly 2, or 2+?
2. Is the bonus +1 total, or +1 per ship after the first?

**Interpretation:**
1. 2+ ships (any amount greater than 1)
2. +1 total bonus (not scaling)

**Examples:**
- Dock 1 ship: 1 advance (no bonus)
- Dock 2 ships: 2 base + 1 bonus = 3 advances
- Dock 3 ships: 3 base + 1 bonus = 4 advances
- Dock 4 ships: 4 base + 1 bonus = 5 advances

**Digital Implementation:**

```javascript
function dockAtColonistHub(player, ships) {
  let baseAdvances = ships.length;
  let bonusAdvances = 0;
  
  if (ships.length > 1 && player.controlsTerritory('AsimovCrater')) {
    bonusAdvances = 1;  // Fixed +1 bonus
  }
  
  let totalAdvances = baseAdvances + bonusAdvances;
  colonistHub.advanceColony(player.id, totalAdvances);
}
```

---

## AMBIGUITY #62: Bradbury Plateau - Minimum Cost

**Rule Text:** "Pay one less ore than usual when you use the Colony Constructor."

**Ambiguity:** Can the cost go below 0?

**Interpretation:** NO - minimum cost is 0 ore. This bonus alone reduces 3 ore to 2 ore. Combined with other bonuses, cost could theoretically reach 0 but not negative.

**Digital Implementation:**

```javascript
function getColonyConstructorCost(player) {
  let baseCost = 3;
  
  if (player.controlsTerritory('BradburyPlateau')) {
    baseCost -= 1;
  }
  
  // Could have other bonuses here
  
  return Math.max(0, baseCost);
}
```

---

## AMBIGUITY #63: Burroughs Desert - Relic Ship Purchase Timing

**Rule Text:** "Purchase the Relic Ship for 1 fuel and 1 ore. Place the ship on the Maintenance Bay and gather it with the rest of your fleet on your next turn."

**Ambiguity:**
1. Can you purchase the Relic Ship during your turn, then immediately use it?
2. Or must you wait until next turn?

**Interpretation:** Must wait until NEXT TURN. "Gather it with the rest of your fleet on your next turn" is explicit. Same mechanic as Shipyard (Ambiguity #42).

**Example:**
- Your turn: Gain control of Burroughs Desert, pay 1F+1O, Relic Ship goes to Maintenance Bay
- End your turn: Relic Ship still in Maintenance Bay
- Next turn: Gather all ships including Relic Ship, roll all ships

**Digital Implementation:**

```javascript
function purchaseRelicShip(player) {
  if (!player.controlsTerritory('BurroughsDesert')) {
    throw new Error("Must control Burroughs Desert");
  }
  
  if (player.fuel < 1 || player.ore < 1) {
    throw new Error("Relic Ship costs 1F + 1O");
  }
  
  if (relicShip.owner !== null) {
    throw new Error("Relic Ship already in use");
  }
  
  player.fuel--;
  player.ore--;
  relicShip.owner = player.id;
  maintenanceBay.add(relicShip, player);
}
```

---

## AMBIGUITY #64: Burroughs Desert - Losing Control Mid-Turn

**Rule Text (Example 1):** "The next player builds a new colony and places it on Burroughs Desert. Now you both have one colony on Burroughs Desert so neither of you control the territory. You return the territory card and the Relic Ship to Burroughs Desert immediately."

**Ambiguity:**
1. If you lose control during someone else's turn, does Relic Ship return immediately?
2. What if the Relic Ship is docked at a facility?
3. What happens to the rolled value?

**Interpretation:**
1. YES - "immediately" means right when control is lost
2. The ship is removed from the facility and returned to Burroughs Desert
3. Value doesn't matter - ship is returned unrolled to the territory

**Digital Implementation:**

```javascript
function updateTerritoryControl(territory) {
  let previousController = territory.controller;
  let newController = calculateController(territory);
  
  if (previousController !== newController) {
    // Special case: Burroughs Desert
    if (territory.id === 'BurroughsDesert' && previousController) {
      returnRelicShip(previousController);
    }
    
    // ... rest of control logic
  }
}

function returnRelicShip(previousOwner) {
  // Remove from wherever it is (fleet, facility, Maintenance Bay)
  let ship = relicShip;
  
  if (ship.dockedAt) {
    ship.dockedAt.removeShip(ship);
  } else if (ship.inFleet) {
    previousOwner.fleet = previousOwner.fleet.filter(s => s !== ship);
  }
  
  ship.owner = null;
  ship.location = 'BurroughsDesert';
}
```

---

## AMBIGUITY #65: Burroughs Desert - Repurchase After Loss

**Rule Text:** "The player controlling Burroughs Desert may repurchase the Relic Ship on their turn."

**Ambiguity:**
1. If you lose control and regain it, can you repurchase immediately?
2. Does "repurchase" cost the same 1F+1O?

**Interpretation:**
1. YES - Once you control Burroughs Desert again, you can purchase on your turn
2. YES - Same cost (1F+1O) every time

**Example:**
- Turn 1: You control Burroughs, purchase Relic Ship (1F+1O)
- Turn 3: You lose control, return Relic Ship
- Turn 5: You regain control of Burroughs
- Turn 5 (same turn): You can purchase Relic Ship again (1F+1O)

**Digital Implementation:**

```javascript
function canPurchaseRelicShip(player) {
  return (
    player.controlsTerritory('BurroughsDesert') &&
    relicShip.owner === null &&
    player.fuel >= 1 &&
    player.ore >= 1
  );
}
```

---

## AMBIGUITY #66: Burroughs Desert - Isolation Field Interaction

**Rule Text (Example 2):** "Another player discards a Stasis Beam and places the Isolation Field on Burroughs Desert. You must return the Relic Ship to the territory immediately..."

**Ambiguity:**
1. Does Isolation Field prevent you from using the Relic Ship you already have?
2. Does it prevent purchase, or force return of existing ship?

**Interpretation:**
1. YES - Isolation Field "nullifies a territory's bonus" (page 12). The Relic Ship IS the bonus
2. FORCES RETURN - If Isolation Field is placed on Burroughs Desert while you have the Relic Ship, you must return it immediately

**This is controversial** - it suggests Isolation Field can retroactively remove bonuses you already have, which seems harsh but is explicitly stated in the example.

**Digital Implementation:**

```javascript
function placeIsolationField(territory) {
  territory.fieldGenerators.push('IsolationField');
  
  // Special case: Burroughs Desert
  if (territory.id === 'BurroughsDesert') {
    let relicOwner = relicShip.owner;
    if (relicOwner) {
      returnRelicShip(relicOwner);
    }
  }
  
  // Nullify territory bonus for current controller
  if (territory.controller) {
    territory.controller.activeBonuses.delete(territory.bonus);
  }
}
```

---

## AMBIGUITY #67: Heinlein Plains - Always 1:1 Ratio

**Rule Text:** "Your trading ratio is always 1 Fuel for 1 Ore when using the Orbital Market... you always trade at a one fuel for one ore ratio regardless of your docked ship values."

**Ambiguity:** Does this apply only while you control Heinlein Plains, or permanently once you've ever controlled it?

**Interpretation:** ONLY WHILE CONTROLLING - Bonuses are active only while you control the territory. If you lose control, you lose the bonus.

**Digital Implementation:**

```javascript
function getOrbitalMarketRatio(player, dockedShips) {
  // Check current control status
  if (player.currentlyControls('HeinleinPlains')) {
    return { fuel: 1, ore: 1 };
  }
  
  // Normal ratio based on ship value
  return { fuel: dockedShips[0].value, ore: 1 };
}
```

---

## AMBIGUITY #68: Herbert Valley - Stacking with Multiple Ships

**Rule Text:** "Pay 1 less fuel and ore than usual for each ship you build at the Shipyard."

**Ambiguity:** Does "for each ship" mean:
1. -1F and -1O per ship built (if building multiple in one turn)?
2. Or just -1F and -1O total (per use of Shipyard)?

**Interpretation:** Option 2 - The bonus is "1 less fuel and ore" per use of the Shipyard. You can only build one ship at a time anyway (each pair of docked ships builds one ship).

**Clarification:** "For each ship you build" means "whenever you build a ship" not "multiply by number of ships built."

**Digital Implementation:**

```javascript
function getShipyardCost(player) {
  let shipNumber = player.getTotalShips() + 1;
  
  let baseCost = {
    4: { fuel: 1, ore: 1 },
    5: { fuel: 2, ore: 2 },
    6: { fuel: 3, ore: 3 }
  }[shipNumber] || { fuel: 0, ore: 0 };
  
  // Herbert Valley bonus
  if (player.controlsTerritory('HerbertValley')) {
    baseCost.fuel = Math.max(0, baseCost.fuel - 1);
    baseCost.ore = Math.max(0, baseCost.ore - 1);
  }
  
  return baseCost;
}
```

---

## AMBIGUITY #69: Lem Badlands - Application Per Ship

**Rule Text:** "Gain 1 additional fuel for each ship you dock at the Solar Converter."

**Ambiguity:** Is this clearly per ship, or could it be interpreted as +1 total?

**Interpretation:** PER SHIP - "for each ship" is unambiguous. If you dock 3 ships, you gain +3 fuel.

**Example:** Dock 3, 4, 5 at Solar Converter while controlling Lem Badlands:
- Base: ceil(3/2) + ceil(4/2) + ceil(5/2) = 2+2+3 = 7 fuel
- Lem Badlands: +3 fuel (one per ship)
- Total: 10 fuel

**Digital Implementation:**

```javascript
function useSolarConverter(player, ships) {
  let baseFuel = ships.reduce((sum, ship) => 
    sum + Math.ceil(ship.value / 2), 0
  );
  
  let bonusFuel = 0;
  if (player.controlsTerritory('LemBadlands')) {
    bonusFuel = ships.length;  // +1 per ship
  }
  
  player.fuel += baseFuel + bonusFuel;
}
```

---

## AMBIGUITY #70: Pohl Foothills - "Each Alien Tech Card You Use"

**Rule Text:** "Pay one less fuel than normal for each alien tech card you use."

**Ambiguity:**
1. Is this per activation of a tech card?
2. Does it apply to discard powers?
3. What if you use multiple tech cards in one turn?

**Interpretation:**
1. YES - Per activation (each time you use a card's fuel power)
2. NO - Discard powers don't have fuel costs (they cost the card itself)
3. YES - Applies to each card used

**Example:** You control Pohl Foothills and use Booster Pod (normally costs 1F). Cost becomes 0F. You then use Temporal Warper (normally costs 1F). Cost becomes 0F.

**Digital Implementation:**

```javascript
function getAlienTechCost(player, card) {
  let baseCost = card.baseFuelCost;
  
  if (player.controlsTerritory('PohlFoothills')) {
    baseCost = Math.max(0, baseCost - 1);
  }
  
  return baseCost;
}

// Example usage
function useBoosterPod(player) {
  let cost = getAlienTechCost(player, boosterPod);  // 0 if controlling Pohl
  
  if (player.fuel < cost) {
    throw new Error(`Need ${cost} fuel`);
  }
  
  player.fuel -= cost;
  // ... boost ship value
}
```

---

## AMBIGUITY #71: Van Vogt Mountains - "First Ship Each Turn"

**Rule Text:** "The first ship you dock at the Lunar Mine each turn may be any value."

**Ambiguity:**
1. Is this tracked per player (your first ship per your turn)?
2. Or per turn globally (first ship docked by anyone)?

**Interpretation:** PER PLAYER - "The first ship YOU dock" means your first ship on your turn. Other players' actions don't affect this.

**Example:**
- Player 1 docks a 2 at Lunar Mine (not controlling Van Vogt)
- Your turn: You control Van Vogt. You can dock any value as YOUR first ship

**Digital Implementation:**

```javascript
function dockAtLunarMine(player, ship, shipsDockedThisTurnByPlayer) {
  let isFirstShipThisTurn = shipsDockedThisTurnByPlayer.length === 0;
  let minRequired = lunarMine.getHighestValue();
  
  // Van Vogt Mountains exception
  if (isFirstShipThisTurn && player.controlsTerritory('VanVogtMountains')) {
    minRequired = 1;  // Any value allowed
  }
  
  if (ship.value < minRequired) {
    throw new Error(`Ship must be ≥ ${minRequired}`);
  }
  
  lunarMine.dock(ship, player);
  player.ore++;
}
```

---

## AMBIGUITY #72: Multiple Territory Bonuses - Stacking

**Rule Text:** (Not explicitly stated)

**Ambiguity:** Can you benefit from multiple territory bonuses in the same turn?

**Interpretation:** YES - Each territory bonus is independent. If you control multiple territories, you get all their bonuses.

**Example:** You control both Herbert Valley and Bradbury Plateau:
- Dock 5-5-5 at Colony Constructor
- Cost: 3 ore (base) - 1 ore (Bradbury) = 2 ore
- Dock 3-3 at Shipyard to build 4th ship
- Cost: 1F+1O (base) - 1F-1O (Herbert) = 0F+0O (free!)

**Digital Implementation:**

```javascript
function getEffectiveCost(player, facility, baseCost) {
  let cost = { ...baseCost };
  
  // Apply all active territory bonuses
  for (let territory of player.controlledTerritories) {
    if (territory.bonus.appliesToFacility(facility)) {
      cost = territory.bonus.modify(cost);
    }
  }
  
  return cost;
}
```

---

## AMBIGUITY #73: Relic Ship - Color and Ownership

**Rule Text:** "The Relic Ship behaves exactly as any other ship in your fleet except that it has no color..."

**Ambiguity:**
1. Does "no color" mean it's colorless, or that it can be any color?
2. Can it be targeted by effects that target "ships of your color"?
3. Does it count toward ship maximums?

**Interpretation:**
1. COLORLESS - It has no color attribute
2. NO - "Ships of your color" specifically excludes Relic Ship (see Ambiguity #56)
3. NO - It's in addition to your 6 colored ships

**Digital Implementation:**

```javascript
class RelicShip extends Ship {
  constructor() {
    super();
    this.color = null;  // No color
    this.isRelicShip = true;
  }
}

function getShipsOfColor(player, color) {
  return player.fleet.filter(s => 
    s.color === color && !s.isRelicShip
  );
}

function getTotalShips(player) {
  let coloredShips = player.fleet.filter(s => !s.isRelicShip).length;
  let hasRelicShip = player.fleet.some(s => s.isRelicShip) ? 1 : 0;
  
  return { colored: coloredShips, relic: hasRelicShip, total: coloredShips + hasRelicShip };
}
```

---

## SUMMARY: Critical Territory Control & Bonuses Decisions

**General Territory Control:**
1. **Ties mean no control** (counter stays on territory)
2. **Control changes immediately** when colonies placed
3. **Bonuses active only while controlling** (not permanent)
4. **Multiple bonuses stack** (can benefit from several territories)

**Territory Bonuses:**
5. **Asimov Crater: +1 advance** when docking 2+ ships (not +1 per ship)
6. **Bradbury Plateau: -1 ore** for Colony Constructor (min 0)
7. **Burroughs Desert: Relic Ship** costs 1F+1O, used next turn
8. **Relic Ship returns immediately** when losing control or Isolation Field applied
9. **Heinlein Plains: Always 1:1 ratio** at Orbital Market
10. **Herbert Valley: -1F and -1O** per Shipyard use (can make it free)
11. **Lem Badlands: +1 fuel per ship** at Solar Converter
12. **Pohl Foothills: -1 fuel per tech card** use (can make them free)
13. **Van Vogt Mountains: First ship** can be any value at Lunar Mine

**Relic Ship Mechanics:**
14. **Colorless ship** (doesn't count as "your color")
15. **Doesn't count toward** minimum 3 ships for Terraforming
16. **Returns to Burroughs Desert** not ship stock
17. **Can be repurchased** after losing control

---

**Next Section:** Field Generators (Page 12)
