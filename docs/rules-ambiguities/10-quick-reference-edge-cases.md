# Quick Reference & Edge Cases (Page 16)

## Source Text Review
**Page 16** provides quick reference summaries for game end, scoring, turn flow, and facility actions. This section analyzes cross-rule interactions and edge cases not covered in previous documents.

---

## AMBIGUITY #116: Game End - "Final Unplaced Colony"

**Rule Text:** "The game ends immediately when any player lands their final unplaced colony on a territory."

**Ambiguity:**
1. What is an "unplaced colony"?
2. Does this mean when you place your 8th colony (for 2/3 players) or 7th (for 4 players)?
3. Does the game end mid-turn or at end of turn?

**Interpretation:**
1. Colony from your STOCK (not yet on the board)
2. YES - 8th colony for 2/3 players, 7th for 4 players (see Ambiguity #3)
3. IMMEDIATELY - Game ends the moment the colony is placed (no further actions)

**Digital Implementation:**

```javascript
function placeColony(player, territory) {
  territory.colonies[player.id]++;
  player.coloniesRemaining--;
  updateScore(player, +1);
  updateTerritoryControl(territory);
  
  // Check for game end
  if (player.coloniesRemaining === 0) {
    endGame();  // Immediate end
  }
}
```

---

## AMBIGUITY #117: Scoring - Positron Field VP

**Rule Text:** "1 VP for controlling the territory with the Positron Field"

**Ambiguity:**
1. Is this in addition to the +1 VP from Positron Field itself?
2. Or is this the same VP counted differently?
3. What if Positron Field is not on any territory?

**Interpretation:**
1. SAME VP - This is redundant with Ambiguity #78
2. The Quick Reference lists it separately for clarity, but it's the same +1 VP
3. NO VP - If Positron Field not in play, no one gets this VP

**Scoring Summary:**
- 1 VP per colony placed: 8 VP (2/3 players) or 7 VP (4 players)
- 1 VP per territory controlled: 0-8 VP (varies)
- 1 VP for Positron Field control: 0-1 VP (if in play and you control it)
- 1 VP for Alien City: 0-1 VP (if you have it)
- 1 VP for Alien Monument: 0-1 VP (if you have it)

**Digital Implementation:**

```javascript
function calculateFinalScore(player) {
  let vp = 0;
  
  // Colonies
  vp += player.coloniesPlaced;
  
  // Territory control
  for (let territory of player.controlledTerritories) {
    vp += 1;  // Base control
    
    // Positron Field (if on this territory)
    if (territory.hasField('PositronField')) {
      vp += 1;  // Already counted, but listed separately in Quick Ref
    }
  }
  
  // Alien tech VP cards
  vp += player.hand.filter(c => c.id === 'AlienCity').length;
  vp += player.hand.filter(c => c.id === 'AlienMonument').length;
  
  return vp;
}
```

---

## AMBIGUITY #118: Tiebreakers - Order of Resolution

**Rule Text:** "Ties are broken by number of alien tech cards. Persistent ties are broken by number of ore tokens, then by number of fuel tokens."

**Ambiguity:**
1. Does "number of alien tech cards" include VP cards (Alien City, Alien Monument)?
2. What if there's still a tie after all three tiebreakers?
3. Are tiebreakers cumulative or sequential?

**Interpretation:**
1. YES - All cards in hand count (including Alien City, Alien Monument)
2. SHARED VICTORY - Extremely rare, but both players win
3. SEQUENTIAL - Check tech cards first, then ore if tied, then fuel if still tied

**Example:**
- Player A: 12 VP, 3 tech cards, 5 ore, 2 fuel
- Player B: 12 VP, 3 tech cards, 5 ore, 4 fuel
- Result: Player B wins (more fuel)

**Digital Implementation:**

```javascript
function determineWinner(players) {
  // Sort by VP (descending)
  players.sort((a, b) => {
    let vpDiff = b.victoryPoints - a.victoryPoints;
    if (vpDiff !== 0) return vpDiff;
    
    // Tiebreaker 1: Alien tech cards
    let techDiff = b.hand.length - a.hand.length;
    if (techDiff !== 0) return techDiff;
    
    // Tiebreaker 2: Ore
    let oreDiff = b.ore - a.ore;
    if (oreDiff !== 0) return oreDiff;
    
    // Tiebreaker 3: Fuel
    let fuelDiff = b.fuel - a.fuel;
    return fuelDiff;
  });
  
  // Check for tied winners
  let winners = [players[0]];
  for (let i = 1; i < players.length; i++) {
    if (players[i].victoryPoints === winners[0].victoryPoints &&
        players[i].hand.length === winners[0].hand.length &&
        players[i].ore === winners[0].ore &&
        players[i].fuel === winners[0].fuel) {
      winners.push(players[i]);
    } else {
      break;
    }
  }
  
  return winners;  // One or more winners
}
```

---

## AMBIGUITY #119: Turn Flow - "Assign All Ships"

**Rule Text:** "Assign all of your ships to your choice of orbital facilities for which you qualify and gain benefits immediately."

**Ambiguity:**
1. Must you assign ALL ships?
2. Or can you leave ships unplaced?
3. What if you cannot place any ships legally?

**Interpretation:**
1. MUST TRY - You should place as many ships as possible
2. CAN LEAVE UNPLACED - If you choose not to use a ship (strategic choice)
3. MAINTENANCE BAY - Ships that cannot be placed legally go to Maintenance Bay

**Clarification:** The rule says "assign all" but Maintenance Bay exists for ships that CANNOT be placed. Unplaced ships by CHOICE is ambiguous, but most reasonable interpretation is that you're encouraged to place all ships but not strictly required.

**Digital Implementation:**

```javascript
function assignShips(player) {
  // Player assigns ships to facilities
  for (let ship of player.fleet) {
    if (!ship.docked) {
      // Try to place ship
      let facility = player.chooseFleetPlacement(ship);
      
      if (facility) {
        facility.dock(ship, player);
      } else {
        // Cannot or choose not to place
        maintenanceBay.add(ship, player);
      }
    }
  }
}
```

---

## AMBIGUITY #120: Resource Discard - Timing

**Rule Text:** "Once all ships have been assigned and alien tech used, discard down to eight resources."

**Ambiguity:**
1. Can you use alien tech AFTER discarding resources?
2. Can you use alien tech DURING discard?
3. What if you have exactly 8 resources?

**Interpretation:**
1. NO - Alien tech use happens BEFORE discard phase
2. NO - Discard is final step (no more actions)
3. NO DISCARD - "Discard down to" means reduce to 8 if over (not discard 8)

**Example:** You have 12 resources (6F + 6O). Discard 4 to get down to 8 total (any combination).

**Digital Implementation:**

```javascript
function endTurn(player) {
  // All ships assigned, all alien tech used
  
  // Discard down to 8
  let totalResources = player.fuel + player.ore;
  
  if (totalResources > 8) {
    let toDiscard = totalResources - 8;
    
    // Player chooses which to discard
    while (toDiscard > 0) {
      let choice = player.chooseResourceToDiscard();
      
      if (choice === 'fuel' && player.fuel > 0) {
        player.fuel--;
        toDiscard--;
      } else if (choice === 'ore' && player.ore > 0) {
        player.ore--;
        toDiscard--;
      }
    }
  }
  
  // Reset turn flags
  player.resetTurn();
  
  // Pass to next player
  game.nextPlayer();
}
```

---

## AMBIGUITY #121: Alien Tech Timing - "At Any Time"

**Rule Text:** "Use alien tech cards as appropriate at any time during your turn."

**Ambiguity:**
1. Can you use alien tech before rolling?
2. Can you use alien tech while docking ships?
3. Can you use alien tech after all ships are docked?

**Interpretation:**
1. NO - "After you roll your fleet" is implied (Resource Cache checks after rolling)
2. YES - During ship placement phase (e.g., Booster Pod before docking)
3. YES - Before end of turn (e.g., discard powers)

**Clarification:** "At any time" means during the main phase of your turn (after rolling, before discarding resources).

**Digital Implementation:**

```javascript
class Turn {
  constructor(player) {
    this.player = player;
    this.phase = 'gather';  // gather, roll, main, discard, end
  }
  
  canUseAlienTech() {
    return this.phase === 'main';
  }
  
  advance() {
    if (this.phase === 'gather') {
      this.player.gatherShips();
      this.phase = 'roll';
    } else if (this.phase === 'roll') {
      this.player.rollFleet();
      checkResourceCache(this.player);
      this.phase = 'main';
    } else if (this.phase === 'main') {
      // Player assigns ships and uses alien tech
      // When done, advance to discard
      this.phase = 'discard';
    } else if (this.phase === 'discard') {
      this.player.discardToEight();
      this.phase = 'end';
    } else if (this.phase === 'end') {
      this.player.resetTurn();
      game.nextPlayer();
    }
  }
}
```

---

## AMBIGUITY #122: Edge Case - Multiple Colonies on Final Turn

**Scenario:** Player places two colonies on the same turn (e.g., Colonist Hub + Colony Constructor). One is their 7th colony, one is their 8th.

**Ambiguity:**
1. Does the game end after the first colony (7th)?
2. Or do they place both?
3. What if both are placed simultaneously?

**Interpretation:**
1. IMMEDIATE END - Game ends when first colony is placed
2. CANNOT PLACE SECOND - Turn ends immediately
3. IF SIMULTANEOUS - Both count (but this shouldn't happen based on facility rules)

**Example:** You're at 7 colonies. You dock ships at Colonist Hub and advance to final space. Pay 1F+1O to place colony. Game ends immediately. You cannot use any more ships this turn.

**Digital Implementation:**

```javascript
function placeColony(player, territory) {
  territory.colonies[player.id]++;
  player.coloniesRemaining--;
  updateScore(player, +1);
  updateTerritoryControl(territory);
  
  if (player.coloniesRemaining === 0) {
    endGame();  // Immediate end, no further actions
    throw new GameEndException("Game ended");
  }
}

// When using facilities
function useColonistHub(player, ships) {
  // ... advance colony on track
  
  if (colonistHub.isOnFinalSpace(player)) {
    if (player.fuel >= 1 && player.ore >= 1) {
      player.fuel--;
      player.ore--;
      placeColony(player, player.chooseTerritory());  // May end game here
    }
  }
}
```

---

## AMBIGUITY #123: Edge Case - Colonist Hub + Game End

**Scenario:** Player has 1 colony left to place. They dock ships at Colonist Hub and advance to final space. They DON'T have 1F+1O to pay.

**Ambiguity:**
1. Does the game continue?
2. Can they place the colony later (on another turn)?
3. Is the colony stuck on the track?

**Interpretation:**
1. YES - Game continues (colony not placed yet)
2. YES - Colony remains on track until they pay 1F+1O
3. YES - Colony is on the track (see Ambiguity #33-34)

**Digital Implementation:**

```javascript
function useColonistHub(player, ships) {
  // Advance colony
  for (let ship of ships) {
    colonistHub.advanceColony(player, 1);
  }
  
  // Check if on final space
  if (colonistHub.isOnFinalSpace(player)) {
    if (player.fuel >= 1 && player.ore >= 1) {
      // Player can choose to pay
      if (player.wantsToPay()) {
        player.fuel--;
        player.ore--;
        placeColony(player, player.chooseTerritory());
      }
    }
    // If cannot pay, colony stays on track
  }
}
```

---

## AMBIGUITY #124: Edge Case - Terraforming Station + Game End

**Scenario:** Player has 1 colony left. They dock a 6 at Terraforming Station, pay 1F+1O, place final colony. Game ends.

**Ambiguity:**
1. Does the ship return to stock on their next turn?
2. Or does game end prevent this?
3. Does it matter?

**Interpretation:**
1. NO NEXT TURN - Game has ended
2. YES - Game end prevents ship return
3. DOESN'T MATTER - Scoring is complete, ship return is irrelevant

**Digital Implementation:**

```javascript
function useTerraformingStation(player, ship) {
  if (ship.value !== 6) {
    throw new Error("Must dock value 6 ship");
  }
  
  if (player.fuel < 1 || player.ore < 1) {
    throw new Error("Need 1F + 1O");
  }
  
  player.fuel--;
  player.ore--;
  
  terraformingStation.dock(ship, player);
  
  placeColony(player, player.chooseTerritory());  // May end game
  
  // If game didn't end, ship will return next turn
}
```

---

## AMBIGUITY #125: Edge Case - Raiders' Outpost + No Valid Targets

**Scenario:** Player docks 3-4-5 at Raiders' Outpost. All opponents have Holographic Decoy (cannot steal resources). All opponents have <4 ships (cannot steal ship via Plasma Cannon discard). No alien tech cards to steal.

**Ambiguity:**
1. Can they use Raiders' Outpost with no effect?
2. Must they steal SOMETHING?
3. What if they can only steal Holographic Decoy?

**Interpretation:**
1. YES - Facility use is valid, but no benefit gained
2. NO - They can choose to steal nothing (forfeit raid)
3. VALID TARGET - They can steal Holographic Decoy (see Ambiguity #101)

**Digital Implementation:**

```javascript
function useRaidersOutpost(player, ships, targets) {
  // Validate ships
  validateSequentialShips(ships);
  
  // Try to steal
  let stolenCount = 0;
  
  for (let target of targets) {
    if (target.type === 'resource') {
      if (target.player.hand.some(c => c.id === 'HolographicDecoy')) {
        console.log("Cannot steal resources - Holographic Decoy");
        continue;
      }
      
      // Steal resource
      target.player[target.resourceType]--;
      player[target.resourceType]++;
      stolenCount++;
    } else if (target.type === 'alienTech') {
      // Steal alien tech
      let card = stealAlienTech(player, target.player);
      stolenCount++;
    }
  }
  
  if (stolenCount === 0) {
    console.log("Raiders' Outpost used but nothing stolen");
  }
}
```

---

## AMBIGUITY #126: Edge Case - All Facilities Full

**Scenario:** All orbital facilities are occupied (all docks full). Player rolls fleet and cannot place any ships legally.

**Ambiguity:**
1. Do all ships go to Maintenance Bay?
2. Can they use Plasma Cannon to clear a facility?
3. Can they use Orbital Teleporter to make room?

**Interpretation:**
1. YES - Ships that cannot be placed go to Maintenance Bay (see Quick Reference)
2. YES - Can use Plasma Cannon (if they have it and fuel) to remove opponent ships
3. NO - Orbital Teleporter moves YOUR ships, doesn't help with full facilities

**Digital Implementation:**

```javascript
function assignShips(player) {
  // Try to place each ship
  for (let ship of player.fleet) {
    let legalFacilities = findLegalFacilities(ship, player);
    
    if (legalFacilities.length === 0) {
      // Cannot place legally
      maintenanceBay.add(ship, player);
    } else {
      // Player chooses facility
      let facility = player.chooseFacility(legalFacilities);
      facility.dock(ship, player);
    }
  }
}
```

---

## AMBIGUITY #127: Edge Case - Simultaneous Control Changes

**Scenario:** Player uses Polarity Device discard to swap colonies. This causes control changes on TWO territories simultaneously.

**Ambiguity:**
1. Which territory control is resolved first?
2. Do both territories check for Positron Field VP changes?
3. Can this create paradoxes?

**Interpretation:**
1. SIMULTANEOUSLY - Both territories update at same time (no ordering issues)
2. YES - Both territories recalculate control and update VPs
3. NO PARADOXES - Control is deterministic based on colony counts

**Digital Implementation:**

```javascript
function discardPolarityDevice(player, territory1, colony1Owner, territory2, colony2Owner) {
  // ... validation
  
  // Swap colonies
  territory1.colonies[colony1Owner]--;
  territory2.colonies[colony1Owner]++;
  territory2.colonies[colony2Owner]--;
  territory1.colonies[colony2Owner]++;
  
  // Update both territories (order doesn't matter)
  updateTerritoryControl(territory1);
  updateTerritoryControl(territory2);
  
  // Discard card
  player.hand = player.hand.filter(c => c.id !== 'PolarityDevice');
  alienTechDiscard.push('PolarityDevice');
}
```

---

## AMBIGUITY #128: Edge Case - Resource Cache with 0 Ships

**Scenario:** Player has all ships docked (0 ships in fleet when Resource Cache checks).

**Ambiguity:**
1. What happens with 0 odd and 0 even?
2. Is this considered "equal"?
3. Does Resource Cache trigger?

**Interpretation:**
1. 0 ODD = 0 EVEN - Equal count
2. YES - 0 = 0 (equal)
3. YES - Get 1F+1O and discard Resource Cache

**Digital Implementation:**

```javascript
function checkResourceCache(player) {
  let card = player.hand.find(c => c.id === 'ResourceCache');
  
  if (!card || card.acquiredThisTurn) {
    return;
  }
  
  let oddCount = player.fleet.filter(s => s.value % 2 === 1).length;
  let evenCount = player.fleet.filter(s => s.value % 2 === 0).length;
  
  if (oddCount > evenCount) {
    player.ore++;
  } else if (evenCount > oddCount) {
    player.fuel++;
  } else {
    // Equal (including 0 = 0)
    player.fuel++;
    player.ore++;
    
    player.hand = player.hand.filter(c => c !== card);
    alienTechDiscard.push(card);
  }
}
```

---

## AMBIGUITY #129: Edge Case - Lunar Mine with No Ships

**Scenario:** Lunar Mine has no ships docked. Player wants to dock a ship of any value.

**Ambiguity:**
1. What is the "highest value" if Lunar Mine is empty?
2. Can you dock a 1?
3. Does Van Vogt Mountains override this?

**Interpretation:**
1. NO SHIPS = NO MINIMUM (or minimum = 1)
2. YES - Any ship can be first ship docked
3. YES - Van Vogt allows any value as first ship anyway

**Digital Implementation:**

```javascript
function dockAtLunarMine(player, ship, shipsDockedThisTurnByPlayer) {
  let currentShips = lunarMine.getShips();
  let minRequired = currentShips.length > 0 
    ? Math.max(...currentShips.map(s => s.value))
    : 1;  // No ships = any value (minimum 1)
  
  // Van Vogt Mountains exception
  if (shipsDockedThisTurnByPlayer.length === 0 && 
      player.controlsTerritory('VanVogtMountains')) {
    minRequired = 1;
  }
  
  if (ship.value < minRequired) {
    throw new Error(`Ship must be ≥ ${minRequired}`);
  }
  
  lunarMine.dock(ship, player);
  player.ore++;
}
```

---

## AMBIGUITY #130: Edge Case - Isolation Field on All Territories

**Scenario:** Through multiple Stasis Beam discards, Isolation Field has been moved around. Can it be on multiple territories?

**Ambiguity:**
1. Can multiple Isolation Fields exist?
2. Or is there only one that moves?
3. What if someone uses Booster Pod to remove it?

**Interpretation:**
1. NO - Only ONE Isolation Field exists (see Ambiguity #79)
2. MOVES - Stasis Beam discard moves the single Isolation Field
3. REMOVED - It's removed from play, can be rebuilt later

**Clarification:** The rules say "THE Isolation Field" (singular). Only one exists at a time.

**Digital Implementation:**

```javascript
// Global singleton
const isolationField = {
  location: null  // Only one location at a time
};

function discardStasisBeam(player, targetTerritory) {
  // Move Isolation Field
  if (isolationField.location) {
    isolationField.location.removeField('IsolationField');
  }
  
  isolationField.location = targetTerritory;
  targetTerritory.addField('IsolationField');
  
  // ... rest of discard logic
}
```

---

## SUMMARY: Critical Edge Cases and Clarifications

**Game End:**
1. **Immediate end** when final colony placed (no further actions)
2. **Cannot place second colony** if first colony ends game
3. **Terraforming ship doesn't return** if game ends

**Scoring:**
4. **Positron Field VP** same as control bonus (counted once, listed separately)
5. **Tiebreakers:** Alien tech cards → Ore → Fuel (sequential)
6. **Tied winners possible** (rare, but allowed)

**Turn Flow:**
7. **Assign ships before discard** (cannot use alien tech during discard)
8. **Ships cannot be placed** go to Maintenance Bay
9. **Resource discard to 8** (not discard 8)

**Edge Cases:**
10. **Colonist Hub final space** - Colony can stay on track if cannot pay
11. **Raiders with no targets** - Can use facility with no effect
12. **All facilities full** - Ships go to Maintenance Bay
13. **Resource Cache with 0 ships** - Equal (0=0), get 1F+1O and discard
14. **Lunar Mine empty** - Any ship can be first (no minimum)
15. **Only one Isolation Field** - Moves between territories, not duplicated

**Final Note:** After 130 ambiguities analyzed across 10 documents, these rules provide a complete deterministic foundation for implementing Alien Frontiers in boardgame.io or any digital platform.

---

**End of Rules Ambiguity Analysis**
