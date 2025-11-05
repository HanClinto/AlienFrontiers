# Colony Constructor through Orbital Market Ambiguities (Page 8)

## Source Text Review
**Page 8** covers four facilities: Colony Constructor, Lunar Mine, Maintenance Bay, and Orbital Market.

---

## AMBIGUITY #35: Colony Constructor - Territory Choice

**Rule Text:** "You must dock three ships of equal value and pay three ore to use the Colony Constructor. There are enough docking ports for two sets of triples to be docked simultaneously. Using the Colony Constructor allows you to land one of your unplaced colonies on a territory immediately."

**Ambiguity:** Can you place the colony on ANY territory, or are there restrictions?

**Interpretation:** ANY territory (that doesn't have a Repulsor Field on it). The rules don't specify restrictions, so player has free choice of which territory to colonize.

**Exception:** Page 12 says "The Repulsor Field prevents colonies from being added to or removed from the territory on which it is located."

**Digital Implementation:**

```javascript
function useColonyConstructor(player, ships) {
  // Validate: 3 ships of equal value
  if (ships.length !== 3 || !allSameValue(ships)) {
    throw new Error("Colony Constructor requires 3 ships of equal value");
  }
  
  // Validate: player has 3 ore
  if (player.ore < 3) {
    throw new Error("Colony Constructor costs 3 ore");
  }
  
  // Pay cost
  player.ore -= 3;
  
  // Choose territory (excluding those with Repulsor Field)
  let validTerritories = territories.filter(t => !t.hasFieldGenerator('RepulsorField'));
  let chosenTerritory = player.chooseTerritory(validTerritories);
  
  // Place colony
  placeColony(player, chosenTerritory);
}
```

---

## AMBIGUITY #36: Colony Constructor - Bradbury Plateau Interaction

**Rule Text (from page 10):** "Pay one less ore than usual when you use the Colony Constructor."

**Ambiguity:**
1. Does this reduce cost to 2 ore or 3 ore?
2. If it reduces to 2 ore, and another bonus reduces by 1 more, can it be 1 ore or even free?

**Interpretation:**
1. Reduces to 2 ore (3 - 1 = 2)
2. Multiple bonuses can stack. If you have Bradbury Plateau (−1 ore) and somehow get another −1 bonus, cost could be 1 ore
3. Cost cannot go below 0 (minimum 0 ore)

**Digital Implementation:**

```javascript
function getColonyConstructorCost(player) {
  let baseCost = 3;
  
  if (player.controlsTerritory('BradburyPlateau')) {
    baseCost -= 1;
  }
  
  // Other potential bonuses could apply here
  
  return Math.max(0, baseCost);  // Minimum 0
}
```

---

## AMBIGUITY #37: Colony Constructor - Simultaneous Usage

**Rule Text:** "There are enough docking ports for two sets of triples to be docked simultaneously."

**Ambiguity:** Does "simultaneously" mean:
1. Two different players can dock at same time (during same turn)?
2. Ships from multiple players persist across turns?

**Interpretation:** Ships from multiple players can be present at the facility at the SAME TIME (between turns). Ships remain docked until their owner's next turn when they're gathered.

**Example:**
- Player 1's turn: Docks 3-3-3 at Colony Constructor
- Player 2's turn: Docks 4-4-4 at Colony Constructor (6 total ships now docked)
- Player 3's turn: Cannot use Colony Constructor (no docking ports available)
- Player 1's next turn: Gathers their 3 ships, now only Player 2's ships remain

**Digital Implementation:**

```javascript
class ColonyConstructor {
  constructor() {
    this.maxSets = 2;  // Two sets of triples
    this.dockedShips = [];  // Persists across turns
  }
  
  hasAvailableDocks(shipsToAdd) {
    let currentSets = this.dockedShips.length / 3;
    let newSets = shipsToAdd.length / 3;
    return (currentSets + newSets) <= this.maxSets;
  }
  
  dock(ships, player) {
    if (!this.hasAvailableDocks(ships)) {
      throw new Error("Not enough docking ports at Colony Constructor");
    }
    this.dockedShips.push(...ships);
  }
}
```

---

## AMBIGUITY #38: Lunar Mine - Highest Value Persistence

**Rule Text:** "Each new ship docked at the Lunar Mine must be equal to or greater than the highest value ship currently docked here."

**Ambiguity:**
1. When do docked ships clear from Lunar Mine?
2. Does "highest value currently docked" mean highest across ALL players' ships?
3. Can the minimum required value increase during a single turn?

**Interpretation:**
1. Ships remain docked until gathered (at start of owner's turn)
2. YES - highest value across ALL ships from ALL players currently docked
3. YES - as you dock higher-value ships, the requirement increases

**Example:**
- Start of your turn: Lunar Mine has Player 2's [1, 4] docked. Highest = 4
- You dock a 4 (legal: 4 ≥ 4). Now highest = 4
- You dock a 6 (legal: 6 ≥ 4). Now highest = 6
- You want to dock a 5 (illegal: 5 < 6)
- Next player must dock ships ≥ 6

**Digital Implementation:**

```javascript
class LunarMine {
  constructor() {
    this.maxDocks = 5;
    this.dockedShips = [];
  }
  
  getHighestValue() {
    if (this.dockedShips.length === 0) return 1;  // No minimum if empty
    return Math.max(...this.dockedShips.map(s => s.value));
  }
  
  canDock(ship) {
    return (
      this.dockedShips.length < this.maxDocks &&
      ship.value >= this.getHighestValue()
    );
  }
  
  dock(ship, player) {
    if (!this.canDock(ship)) {
      throw new Error(`Ship must be ≥ ${this.getHighestValue()}`);
    }
    this.dockedShips.push(ship);
    player.ore++;  // Gain 1 ore per ship
  }
}
```

---

## AMBIGUITY #39: Lunar Mine - Van Vogt Mountains Exception

**Rule Text (from page 11):** "The first ship you dock at the Lunar Mine each turn may be any value."

**Ambiguity:**
1. Is this "first ship per turn" or "first ship per player per turn"?
2. If you dock a 2 as your first ship (via Van Vogt bonus), does that become the new minimum for your second ship?

**Interpretation:**
1. First ship per PLAYER per TURN (only helps the player who controls Van Vogt)
2. YES - after docking the 2, your next ship must be ≥ 2 (or ≥ highest from other players)

**Example:** You control Van Vogt Mountains. Lunar Mine has [5] docked. 
- Your first ship: Dock a 2 (legal via Van Vogt bonus). Lunar Mine now has [5, 2], highest = 5
- Your second ship: Must be ≥ 5 (Van Vogt only applies to first ship)

**Digital Implementation:**

```javascript
class LunarMine {
  dock(ship, player, isFirstShipThisTurn) {
    let minRequired = this.getHighestValue();
    
    // Van Vogt Mountains exception
    if (isFirstShipThisTurn && player.controlsTerritory('VanVogtMountains')) {
      minRequired = 1;  // Any value allowed for first ship
    }
    
    if (ship.value < minRequired) {
      throw new Error(`Ship must be ≥ ${minRequired}`);
    }
    
    this.dockedShips.push(ship);
    
    // Apply Lem Badlands bonus if controlled
    let oreGained = 1;
    player.ore += oreGained;
  }
}
```

---

## AMBIGUITY #40: Lunar Mine - Empty State Minimum

**Rule Text (from example):** "At the beginning of your turn there is a 1 and a 4 docked at the Lunar Mine."

**Ambiguity:** If Lunar Mine is completely empty (all ships gathered), what's the minimum value for the first ship?

**Interpretation:** ANY value (1-6). If no ships are docked, there's no minimum requirement. The rule says "must be equal to or greater than the highest value ship currently docked" - if nothing is docked, there's no highest value, so any ship qualifies.

**Digital Implementation:**

```javascript
getHighestValue() {
  if (this.dockedShips.length === 0) {
    return 1;  // Minimum die value (effectively no restriction)
  }
  return Math.max(...this.dockedShips.map(s => s.value));
}

// Or more explicitly:
canDock(ship) {
  if (this.dockedShips.length === 0) {
    return true;  // Any ship can dock when empty
  }
  return ship.value >= this.getHighestValue();
}
```

---

## AMBIGUITY #41: Maintenance Bay - Is It a Facility?

**Rule Text:** "If you cannot place a ship legally during your turn, place it here. Maintenance Bay gives the player no benefit, but ships placed here are still considered in play..."

**Ambiguity:**
1. Is Maintenance Bay an "orbital facility"?
2. Can you voluntarily dock ships at Maintenance Bay?
3. Does it have docking port limits?

**Interpretation:**
1. NO - It's a holding area, not an active facility
2. NO - Only ships that CANNOT be placed legally go here (see Ambiguity #13)
3. NO - Unlimited capacity

**Digital Implementation:**

```javascript
class MaintenanceBay {
  constructor() {
    this.ships = [];  // Unlimited capacity
  }
  
  // Cannot be chosen by player - only for forced placement
  canVoluntarilyDock() {
    return false;
  }
  
  // Automatically receives ships that can't go elsewhere
  receiveForcedPlacement(ships) {
    this.ships.push(...ships);
  }
  
  // No benefits granted
  grantBenefits() {
    return null;
  }
}

// Validation logic
function endShipPlacementPhase(player) {
  let unplacedShips = player.fleet.filter(s => !s.isDocked);
  
  for (let ship of unplacedShips) {
    if (anyLegalFacilityExists(ship, player)) {
      throw new Error("You must place ship at a facility");
    }
  }
  
  // All unplaced ships had no legal moves
  maintenanceBay.receiveForcedPlacement(unplacedShips);
}
```

---

## AMBIGUITY #42: Maintenance Bay - Ships Added by Other Means

**Rule Text:** "Any ships purchased through the Shipyard or Burroughs Desert are placed here, as are ships removed from facilities with the Plasma Cannon or from use of the Raiders' Outpost."

**Ambiguity:**
1. When a ship is placed in Maintenance Bay via Shipyard, is it immediately available that turn?
2. When are these ships gathered?

**Interpretation:**
1. NO - Ships added to Maintenance Bay via Shipyard are "claimed at the start of your next turn when you gather your fleet" (page 9)
2. Same as normal gathering - at start of owner's next turn

**Example:**
- Your turn: Use Shipyard, new ship goes to Maintenance Bay
- End your turn: New ship stays in Maintenance Bay
- Next turn start: Gather all ships (including new ship from Maintenance Bay) and roll them

**Digital Implementation:**

```javascript
function useShipyard(player) {
  // Build new ship
  let newShip = createShip(player.color);
  maintenanceBay.add(newShip, player);
  
  // Ship is NOT immediately available
  newShip.availableStartingNextTurn = true;
}

function gatherFleet(player) {
  let ships = [];
  
  // Gather from all facilities including Maintenance Bay
  for (let facility of allFacilities) {
    ships.push(...facility.getShipsOwnedBy(player.id));
  }
  
  // Roll all gathered ships
  ships.forEach(s => s.value = rollDie());
  
  player.fleet = ships;
}
```

---

## AMBIGUITY #43: Orbital Market - Multiple Trades Per Turn

**Rule Text:** "While docked at the Orbital Market you may pay fuel equal to the value of one of your docked ships to receive one ore. You may trade as many times as you wish on your turn."

**Ambiguity:**
1. Can you trade multiple times with the same pair of ships?
2. Does each trade consume fuel, or is it unlimited?
3. Can you acquire fuel during your turn and use it for additional trades?

**Interpretation:**
1. YES - The same pair of ships can be used for multiple trades
2. Each trade COSTS fuel (not unlimited)
3. YES - If you gain fuel from other facilities, you can return to make more trades

**Example:** You dock 3-3 at Orbital Market.
- Trade 1: Pay 3 fuel → gain 1 ore (remaining fuel: X-3)
- Dock at Solar Converter with other ships → gain 5 fuel
- Trade 2: Pay 3 fuel → gain 1 ore (using newly acquired fuel)
- Trade 3: Pay 3 fuel → gain 1 ore (if you still have 3 fuel)

**Digital Implementation:**

```javascript
function useOrbitalMarket(player, dockedShips) {
  // Validate: 2 ships of equal value
  if (dockedShips.length !== 2 || dockedShips[0].value !== dockedShips[1].value) {
    throw new Error("Orbital Market requires 2 ships of equal value");
  }
  
  let tradeValue = dockedShips[0].value;
  
  // Apply Heinlein Plains bonus
  if (player.controlsTerritory('HeinleinPlains')) {
    tradeValue = 1;  // Always 1:1 ratio
  }
  
  // Allow multiple trades
  while (player.wantsToTrade() && player.fuel >= tradeValue) {
    player.fuel -= tradeValue;
    player.ore += 1;
  }
}
```

---

## AMBIGUITY #44: Orbital Market - Heinlein Plains Always Active

**Rule Text (from page 10):** "Your trading ratio is always 1 Fuel for 1 Ore when using the Orbital Market."

**Ambiguity:** Does "always" mean the bonus overrides the ship value completely, or adds to it?

**Interpretation:** OVERRIDES completely. Regardless of ship values docked (even if you dock 6-6), the trade ratio is 1 fuel for 1 ore.

**Example:** You control Heinlein Plains and dock 6-6 at Orbital Market.
- WITHOUT Heinlein Plains: Pay 6 fuel → 1 ore (terrible ratio)
- WITH Heinlein Plains: Pay 1 fuel → 1 ore (great ratio!)

**Digital Implementation:**

```javascript
function getTradeRatio(player, dockedShips) {
  if (player.controlsTerritory('HeinleinPlains')) {
    return { fuel: 1, ore: 1 };  // Always 1:1
  }
  
  // Normal ratio: ship value fuel for 1 ore
  return { fuel: dockedShips[0].value, ore: 1 };
}
```

---

## AMBIGUITY #45: Orbital Market - Trade Timing

**Rule Text:** "While docked at the Orbital Market you may pay fuel equal to the value of one of your docked ships to receive one ore. You may trade as many times as you wish on your turn."

**Ambiguity:** Can you:
1. Dock at Orbital Market
2. Make 1 trade
3. Dock at Solar Converter (gain fuel)
4. Return to make more trades at Orbital Market?

**Interpretation:** The phrase "while docked" suggests trades happen during the docking action, not later. However, "on your turn" suggests flexibility. 

Most reasonable interpretation: You can make trades any time during your turn as long as ships remain docked at Orbital Market. If you gather ships, you lose access.

**Digital Implementation:**

```javascript
// Option A: Strict interpretation (trades only during docking)
function dockAtOrbitalMarket(player, ships) {
  facility.dock(ships);
  
  // Trade immediately
  while (player.wantsToTrade()) {
    makeTrade(player, ships[0].value);
  }
  
  // Cannot trade again later this turn
}

// Option B: Flexible interpretation (trades anytime while docked)
class OrbitalMarket {
  availableForTrading(player) {
    return this.hasShipsOwnedBy(player.id);
  }
  
  trade(player) {
    if (!this.availableForTrading(player)) {
      throw new Error("No ships docked at Orbital Market");
    }
    
    let ships = this.getShipsOwnedBy(player.id);
    let cost = getTradeRatio(player, ships).fuel;
    
    if (player.fuel >= cost) {
      player.fuel -= cost;
      player.ore += 1;
    }
  }
}
```

---

## AMBIGUITY #46: Orbital Market - Simultaneous Docking

**Rule Text:** "There are enough docking ports to accommodate two pairs of ships at any one time."

**Ambiguity:** Can two different players have ships docked simultaneously?

**Interpretation:** YES - Same logic as Colony Constructor (Ambiguity #37). Ships persist across turns, so multiple players can have ships present.

**Example:**
- Player 1 docks 3-3 (uses 1 of 2 pair slots)
- Player 2 docks 5-5 (uses 2 of 2 pair slots)
- Player 3 cannot dock (facility full)

**Digital Implementation:**

```javascript
class OrbitalMarket {
  constructor() {
    this.maxPairs = 2;
    this.dockedShips = [];
  }
  
  canDock(ships) {
    let currentPairs = this.dockedShips.length / 2;
    let newPairs = ships.length / 2;
    return (currentPairs + newPairs) <= this.maxPairs;
  }
}
```

---

## SUMMARY: Critical Colony Constructor through Orbital Market Decisions

**Colony Constructor:**
1. **Can place colony on any territory** (except those with Repulsor Field)
2. **Bradbury Plateau reduces cost** to 2 ore
3. **Two sets can be docked simultaneously** across multiple players

**Lunar Mine:**
4. **Minimum value increases dynamically** as ships are docked
5. **Van Vogt Mountains exempts first ship** per player per turn
6. **Empty Lunar Mine accepts any value** (no minimum when empty)
7. **Ships persist across turns** until gathered

**Maintenance Bay:**
8. **Not a voluntary facility** - only for forced placement
9. **Unlimited capacity** 
10. **Ships from Shipyard/Burroughs** go here and are gathered next turn

**Orbital Market:**
11. **Multiple trades allowed** with same ships (costs fuel each time)
12. **Heinlein Plains overrides ratio** to always 1:1
13. **Can trade with newly acquired fuel** during same turn
14. **Two pairs simultaneously** across multiple players

---

**Next Section:** Raiders' Outpost through Terraforming Station (Pages 8-9)
