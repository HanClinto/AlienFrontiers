# Turn Structure & Timing Ambiguities (Page 6)

## Source Text Review
**Page 6** covers turn flow, ship assignment, alien tech usage, territory control, scoring, and game end conditions.

---

## AMBIGUITY #11: Gather Ships from Where?

**Rule Text:** "Gather all of your ships from the board and roll them."

**Ambiguity:** 
1. Does "from the board" include ships in Maintenance Bay?
2. What about ships on Terraforming Station (which return to ship stock, not to player)?
3. What about the Relic Ship from Burroughs Desert?

**Interpretation:**
1. YES - Maintenance Bay is part of "the board" (ships placed there are "still considered in play" per page 8)
2. NO - Terraforming Station ship returns to ship stock at "the beginning of your next turn" which happens BEFORE you gather (see Ambiguity #12)
3. YES - If you control Burroughs Desert and purchased the Relic Ship, it's in your fleet and gets gathered

**Digital Implementation:**

```javascript
function gatherAndRollFleet(player) {
  // Step 1: Return Terraforming Station ship to stock (if applicable)
  if (player.shipOnTerraformingStation) {
    returnToShipStock(player.shipOnTerraformingStation);
    player.shipOnTerraformingStation = null;
  }
  
  // Step 2: Gather all ships from all facilities (including Maintenance Bay)
  let ships = [];
  for (let facility of allFacilities) {
    ships.push(...facility.getShipsOwnedBy(player.id));
    facility.removeShipsOwnedBy(player.id);
  }
  
  // Step 3: Roll all gathered ships
  for (let ship of ships) {
    ship.value = rollDie();
  }
  
  player.fleet = ships;
  return ships;
}
```

---

## AMBIGUITY #12: Terraforming Station Ship Return Timing

**Rule Text:** "The ship docked at the Terraforming Station is completely consumed by the colony creation process and is returned to the ship stock at the beginning of your next turn."

**Ambiguity:** Does "beginning of your next turn" mean:
1. Before you gather and roll?
2. After you gather and roll?
3. As part of gathering (just doesn't get rolled)?

**Interpretation:** BEFORE you gather. The sequence is:
1. "Beginning of turn" - Terraforming ship returns to stock
2. "Gather and Roll Your Fleet" - Gather remaining ships and roll them

This interpretation makes sense because:
- Ship is "consumed" (destroyed/sacrificed)
- It goes to "ship stock" not back to player
- You can rebuild it via Shipyard "only after it has returned to the ship stock"

**Digital Implementation:**

```javascript
// Phase: Turn Start
function onTurnStart(player) {
  // Sub-phase 1: Terraforming Station cleanup
  if (player.shipOnTerraformingStation) {
    returnToShipStock(player.shipOnTerraformingStation);
    player.shipOnTerraformingStation = null;
  }
  
  // Sub-phase 2: Gather and roll
  gatherAndRollFleet(player);
}
```

---

## AMBIGUITY #13: "Must Place All Ships If Possible"

**Rule Text:** "You must place all of your ships at orbital facilities on your turn if possible. If you cannot legally place one or more of your ships at any orbital facility, place them in the Maintenance Bay."

**Ambiguity:**
1. What defines "possible"? If you have resources to pay a cost but choose not to, is that facility still "possible"?
2. Can you voluntarily place ships in Maintenance Bay even if legal moves exist?
3. Must you place ships optimally, or just legally?

**Interpretation:**
1. "Possible" means "legally available" - you meet ship requirements AND can pay costs. If you HAVE the resources, you must consider it possible
2. NO - You cannot voluntarily place ships in Maintenance Bay if legal moves exist
3. You must place legally, not optimally - the player chooses which legal facility, but cannot skip placement

**Digital Implementation:**

```javascript
function mustPlaceShip(ship, player, gameState) {
  // Find all facilities where this ship CAN be placed
  let legalFacilities = facilities.filter(f => 
    f.hasAvailableDocks() &&
    f.meetsShipRequirements(ship, player) &&
    player.canPayCost(f.getCost())
  );
  
  return legalFacilities.length > 0;
}

function validateShipPlacement(player, unplacedShips) {
  for (let ship of unplacedShips) {
    if (mustPlaceShip(ship, player, gameState)) {
      throw new Error("You must place all ships where possible");
    }
  }
  // All unplaced ships had no legal moves, they go to Maintenance Bay
  maintenanceBay.addShips(unplacedShips);
}
```

---

## AMBIGUITY #14: "Immediately Pay Any Applicable Cost"

**Rule Text:** "A facility can only be used if it has sufficient unused docking ports, you have ships of the required values, and you can immediately pay any applicable cost."

**Ambiguity:** Does "immediately pay" mean:
1. You must have the resources RIGHT NOW (before docking)?
2. You can dock, gain benefits from other facilities, then pay?

**Interpretation:** You must have resources BEFORE docking. "Immediately" means the cost is paid as part of the docking action, not deferred.

**Example:** You cannot dock at Terraforming Station (costs 1F+1O) if you only have 1F, even if you plan to use Solar Converter first to get more fuel. You must have 1F+1O available at time of docking.

**Digital Implementation:**

```javascript
function canUseFacility(facility, ships, player) {
  let cost = facility.getCost(ships, player);
  
  return (
    facility.hasAvailableDocks(ships.length) &&
    facility.meetsShipRequirements(ships) &&
    player.fuel >= cost.fuel &&  // Must have resources NOW
    player.ore >= cost.ore
  );
}
```

---

## AMBIGUITY #15: Alien Tech Usage Timing

**Rule Text:** "You may use your alien tech cards at any time during your turn."

**Ambiguity:**
1. Can you use tech AFTER docking a ship but BEFORE paying its cost?
2. Can you use tech BETWEEN docking ships at different facilities?
3. Can you use tech to modify a ship that's already docked?

**Interpretation:**
1. NO - Cost payment is "immediate" per Ambiguity #14, happens atomically with docking
2. YES - "Any time during your turn" means between discrete actions
3. NO - Once a ship is docked, its value is locked. Tech cards modify "unplaced ships" (pages 13-15)

**Digital Implementation:**

```javascript
// Turn structure with tech windows
const turnPhases = {
  GATHER_ROLL: 'gather_roll',
  TECH_OR_ASSIGN: 'tech_or_assign',  // Flexible phase
  CLEANUP: 'cleanup'
};

// In TECH_OR_ASSIGN phase:
function allowedActions(player) {
  return {
    useTechCard: player.alienTech.filter(card => card.canUse()),
    placeShips: player.fleet.filter(ship => !ship.isDocked)
  };
}
```

---

## AMBIGUITY #16: "Each Alien Tech Card May Be Used Only Once Per Turn"

**Rule Text:** "Each alien tech card may be used only once per turn."

**Ambiguity:** Does "once per turn" mean:
1. Each card TYPE (e.g., Booster Pod) once per turn?
2. Each card INSTANCE once per turn?
3. You can use a card's fuel power once AND discard power once in same turn?

**Interpretation:**
1. Each card INSTANCE - if you somehow had two Booster Pods (impossible per rules), you could use both
2. "Each alien tech card" is singular, refers to individual card
3. NO - "You may only discard an alien tech card you have not already used on your current turn" (explicit rule on page 13)

**Digital Implementation:**

```javascript
class AlienTechCard {
  constructor(name) {
    this.name = name;
    this.usedFuelPowerThisTurn = false;
    this.usedDiscardPowerThisTurn = false;
  }
  
  canUseFuelPower() {
    return !this.usedFuelPowerThisTurn && !this.usedDiscardPowerThisTurn;
  }
  
  canDiscard() {
    return !this.usedFuelPowerThisTurn && !this.usedDiscardPowerThisTurn;
  }
}
```

---

## AMBIGUITY #17: "Only One Discard Power Per Turn"

**Rule Text:** "You may only use one discard power from your alien tech cards each turn."

**Ambiguity:** If you have 3 different alien tech cards with discard powers, can you only discard ONE of them per turn?

**Interpretation:** YES - You can only use ONE discard power total per turn, regardless of how many cards you have.

**Example:** You have Booster Pod, Data Crystal, and Gravity Manipulator. You can discard ONE of them this turn, not all three.

**Digital Implementation:**

```javascript
function validateDiscardPower(player) {
  let discardsUsedThisTurn = player.alienTech.filter(
    card => card.usedDiscardPowerThisTurn
  ).length;
  
  if (discardsUsedThisTurn >= 1) {
    throw new Error("Only one discard power per turn");
  }
}
```

---

## AMBIGUITY #18: Territory Control Change Timing

**Rule Text:** "If colony placement results in your having more colonies on the territory than any other player, you 'control' that territory. You take its counter, gain an extra victory point, and may use the territory's bonus."

**Ambiguity:** When exactly do you gain/lose control?
1. Immediately when colony is placed?
2. At end of turn?
3. Can control change multiple times in one turn?

**Interpretation:** IMMEDIATELY when colony is placed. The text says "results in" (causal), not "at end of turn". You gain the counter and VP immediately, and "may use the territory's bonus" implies you can use it on the same turn.

**Example:** You place a colony on Asimov Crater, gaining control. You can immediately use its bonus (extra advance at Colonist Hub) on the same turn.

**Digital Implementation:**

```javascript
function placeColony(player, territory) {
  territory.colonies[player.id]++;
  player.coloniesRemaining--;
  
  // Check for control change IMMEDIATELY
  let newController = calculateController(territory);
  
  if (newController !== territory.controller) {
    // Remove control from previous controller
    if (territory.controller) {
      removeControl(territory.controller, territory);
    }
    
    // Grant control to new controller
    if (newController) {
      grantControl(newController, territory);
    }
    
    territory.controller = newController;
  }
  
  updateScoreboard();  // Update immediately
}
```

---

## AMBIGUITY #19: Lose Control Timing

**Rule Text:** "If you no longer have more colonies on the territory than any other player, you lose control of the territory. You immediately return the territory card, lose a victory point, and can no longer use its bonus."

**Ambiguity:** Can you lose control on YOUR turn or only on opponent's turns?

**Interpretation:** You can lose control on ANY turn, including your own.

**Example:** You control Lem Badlands with 2 colonies. An opponent places their 2nd colony there. Now you're tied, so you BOTH lose control immediately (even though it's opponent's turn). The counter goes back to the territory.

**Digital Implementation:**

```javascript
function calculateController(territory) {
  let colonyCounts = Object.entries(territory.colonies);
  let maxCount = Math.max(...colonyCounts.map(([_, count]) => count));
  let leaders = colonyCounts.filter(([_, count]) => count === maxCount);
  
  // If tied (multiple leaders), NO ONE controls it
  return leaders.length === 1 ? leaders[0][0] : null;
}
```

---

## AMBIGUITY #20: Scoring Update Frequency

**Rule Text:** "Scoring is not cumulative. It is a snapshot of the current board and hand situation at any single point in time... Your score will fluctuate up and down as the game progresses, and each time circumstances change the scoreboard should be updated."

**Ambiguity:** How often should the scoreboard be updated?
1. After every single action?
2. Only at end of turn?
3. Only when VP-affecting events occur?

**Interpretation:** Update whenever VP-affecting events occur:
- Colony placed (±1 VP)
- Territory control gained/lost (±1 VP)
- Alien City/Monument acquired/stolen (±1 VP)
- Positron Field moved (±1 VP for old/new controller)

Not necessary to update after non-VP actions (docking ships, gaining resources).

**Digital Implementation:**

```javascript
function calculateVictoryPoints(player, gameState) {
  let vp = 0;
  
  // 1 VP per colony on territories
  for (let territory of gameState.territories) {
    vp += territory.colonies[player.id] || 0;
  }
  
  // 1 VP per territory controlled
  vp += gameState.territories.filter(
    t => t.controller === player.id
  ).length;
  
  // 1 VP for Alien City
  if (player.hasCard('AlienCity')) vp++;
  
  // 1 VP for Alien Monument
  if (player.hasCard('AlienMonument')) vp++;
  
  // 1 VP if controlling territory with Positron Field
  let positronTerritory = gameState.territories.find(
    t => t.hasFieldGenerator('PositronField')
  );
  if (positronTerritory && positronTerritory.controller === player.id) {
    vp++;
  }
  
  return vp;
}
```

---

## AMBIGUITY #21: Resource Limit - What Counts?

**Rule Text:** "If you have more than eight total resource tokens at the end of your turn you must return your choice of excess tokens to the appropriate resource stocks."

**Ambiguity:** Does "total resource tokens" mean:
1. Fuel + Ore combined = 8 max?
2. 8 fuel + 8 ore = 16 max?

**Interpretation:** COMBINED. "Total" means sum of all resources. 8 is the hand limit for fuel + ore combined.

**Examples:**
- 5 fuel + 3 ore = 8 total ✓ (legal)
- 4 fuel + 5 ore = 9 total ✗ (must discard 1)
- 8 fuel + 0 ore = 8 total ✓ (legal)
- 8 fuel + 8 ore = 16 total ✗ (must discard 8)

**Digital Implementation:**

```javascript
function enforceResourceLimit(player) {
  let totalResources = player.fuel + player.ore;
  
  if (totalResources > 8) {
    let excess = totalResources - 8;
    // Player chooses which resources to discard
    return {
      mustDiscard: true,
      amount: excess,
      options: ['fuel', 'ore']
    };
  }
  
  return { mustDiscard: false };
}
```

---

## AMBIGUITY #22: Game End - "Immediately" Means What?

**Rule Text:** "The game ends as soon as one player places their last colony on a territory."

**Ambiguity:**
1. Does the active player finish their turn?
2. Can other players take their final turns?
3. What if multiple players place their last colony in the same round?

**Interpretation:**
1. NO - Game ends IMMEDIATELY, mid-turn
2. NO - No other players get turns
3. Impossible - game ends when FIRST player places last colony

**Example:** You have 1 colony left. You place it on Lem Badlands at 2pm in your turn. Game ends at 2pm. You don't get to use more alien tech cards or place more ships (even though you have unplaced ships). Scoring happens immediately.

**Digital Implementation:**

```javascript
function placeColony(player, territory) {
  territory.colonies[player.id]++;
  player.coloniesRemaining--;
  
  // Check for game end IMMEDIATELY
  if (player.coloniesRemaining === 0) {
    endGame();  // No further actions allowed
    return { gameEnded: true };
  }
  
  updateScoreboard();
  return { gameEnded: false };
}
```

---

## AMBIGUITY #23: Tie-Breaking Order

**Rule Text:** "If there is a tie, the tied players compare their number of alien tech cards to determine the winner. Persistent ties can be resolved by comparing ore tokens then fuel tokens. Still tied? Play again!"

**Ambiguity:** What is the exact tie-breaking priority?

**Interpretation:** 
1. Victory Points (primary)
2. Number of Alien Tech Cards
3. Number of Ore Tokens
4. Number of Fuel Tokens
5. Play again (or in digital: random/turn order)

**Digital Implementation:**

```javascript
function determineWinner(players) {
  // Sort by tie-breaking criteria
  players.sort((a, b) => {
    // 1. Victory Points
    if (a.vp !== b.vp) return b.vp - a.vp;
    
    // 2. Alien Tech Cards
    if (a.alienTech.length !== b.alienTech.length) {
      return b.alienTech.length - a.alienTech.length;
    }
    
    // 3. Ore Tokens
    if (a.ore !== b.ore) return b.ore - a.ore;
    
    // 4. Fuel Tokens
    if (a.fuel !== b.fuel) return b.fuel - a.fuel;
    
    // 5. Still tied - use turn order as deterministic tie-breaker
    return a.turnOrder - b.turnOrder;
  });
  
  return players[0];
}
```

---

## SUMMARY: Critical Turn Structure Decisions

1. **Terraforming ship returns BEFORE gathering** (beginning of turn)
2. **Must place all ships where legal moves exist** (no voluntary Maintenance Bay)
3. **Costs must be payable before docking** (no deferred payment)
4. **Tech cards modify unplaced ships only** (not after docking)
5. **Each card usable once per turn** (fuel power OR discard, not both)
6. **Only ONE discard power per turn** (across all cards)
7. **Territory control changes immediately** (not at end of turn)
8. **Resource limit is 8 total** (fuel + ore combined)
9. **Game ends immediately** (when last colony placed, mid-turn)
10. **Tie-breaking order**: VP → Tech Cards → Ore → Fuel → Turn Order

---

**Next Section:** Alien Artifact & Colonist Hub (Page 7)
