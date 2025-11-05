# Alien Tech Cards Part 2 - Remaining Cards (Pages 14-15)

## Source Text Review
**Pages 14-15** cover the remaining 6 alien tech cards: Holographic Decoy, Orbital Teleporter, Plasma Cannon, Polarity Device, Resource Cache, Stasis Beam, and Temporal Warper.

---

## AMBIGUITY #100: Holographic Decoy - Passive Protection

**Rule Text:** "There is no fuel cost associated with this card and it does not have a discard power. While you possess the Holographic Decoy a player may not use the Raiders' Outpost to steal resources from you."

**Ambiguity:**
1. Is this a passive effect (always active)?
2. Does it apply during opponents' turns?
3. Can you acquire and benefit from it on the same turn?

**Interpretation:**
1. YES - Passive effect (no activation required)
2. YES - Protects your resources at all times while you possess it
3. YES - Protection is immediate upon acquisition (unlike Resource Cache)

**Digital Implementation:**

```javascript
function useRaidersOutpost(raider, target, resourceType, amount) {
  // Check Holographic Decoy protection
  if (resourceType !== 'alienTech' && target.hand.some(c => c.id === 'HolographicDecoy')) {
    throw new Error("Target has Holographic Decoy - cannot steal resources");
  }
  
  // ... rest of raiding logic
}
```

---

## AMBIGUITY #101: Holographic Decoy - Card Theft

**Rule Text:** "If the raiding player wishes to steal an alien tech card from you then they may only take your Holographic Decoy. If the raiding player already has a Holographic Decoy then the stolen card is discarded."

**Ambiguity:**
1. Is this mandatory or optional?
2. Can the raider choose to steal resources instead?
3. What if you have multiple alien tech cards?

**Interpretation:**
1. MANDATORY - "They may only take your Holographic Decoy" means they cannot steal other cards
2. NO - If raider wants to steal an alien tech card, it MUST be Holographic Decoy (or nothing)
3. DOESN'T MATTER - Raider can only take Holographic Decoy (no choice)

**Clarification:** Raider has two options:
- Steal nothing (forfeit their raid)
- Steal Holographic Decoy (if they don't already have one, otherwise it's discarded)

**Digital Implementation:**

```javascript
function stealAlienTechCard(raider, target) {
  if (target.hand.some(c => c.id === 'HolographicDecoy')) {
    // Can only steal Holographic Decoy
    let decoy = target.hand.find(c => c.id === 'HolographicDecoy');
    target.hand = target.hand.filter(c => c !== decoy);
    
    if (raider.hand.some(c => c.id === 'HolographicDecoy')) {
      // Raider already has one, discard stolen copy
      alienTechDiscard.push(decoy);
    } else {
      raider.hand.push(decoy);
    }
  } else {
    // Normal alien tech theft (raider's choice)
    // ... (see Ambiguity #52-53)
  }
}
```

---

## AMBIGUITY #102: Orbital Teleporter - Movement Restrictions

**Rule Text:** "Each turn you may pay two fuel to move one of your docked ships from one orbital facility to a different orbital facility... You may not reuse the ship at the same facility from which it was removed."

**Ambiguity:**
1. Can you move a ship from Lunar Mine to Lunar Mine (different dock)?
2. What does "reuse the ship at the same facility" mean?
3. Can you dock a ship at Lunar Mine, teleport it to Alien Artifact, then teleport it back to Lunar Mine?

**Interpretation:**
1. NO - "Different orbital facility" means a different facility entirely (not just different dock)
2. Cannot move from Lunar Mine to Lunar Mine (even if different physical dock)
3. NO - Once moved FROM a facility, it cannot be moved back TO that facility on the same turn

**Digital Implementation:**

```javascript
function useOrbitalTeleporter(player, ship, fromFacility, toFacility) {
  if (fromFacility === toFacility) {
    throw new Error("Must move to different facility");
  }
  
  if (fromFacility.id === 'TerraformingStation') {
    throw new Error("Cannot move ship off Terraforming Station");
  }
  
  if (!fromFacility.hasShip(ship, player)) {
    throw new Error("Ship not docked at source facility");
  }
  
  if (ship.teleportedFrom.includes(fromFacility.id)) {
    throw new Error("Cannot return ship to facility it was moved from");
  }
  
  let cost = getAlienTechCost(player, { baseFuelCost: 2 });
  
  if (player.fuel < cost) {
    throw new Error(`Need ${cost} fuel`);
  }
  
  player.fuel -= cost;
  
  // Move ship
  fromFacility.removeShip(ship, player);
  ship.teleportedFrom.push(fromFacility.id);  // Track source
  
  // Ship can now be docked at new facility with other ships
  player.teleportedShips.push({ ship, fromFacility });
  
  let card = player.hand.find(c => c.id === 'OrbitalTeleporter');
  card.usedThisTurn = true;
}
```

---

## AMBIGUITY #103: Orbital Teleporter - "Used at New Facility in Conjunction"

**Rule Text:** "The moved ship may be used at the new facility in conjunction with other as yet unplaced ships from your fleet."

**Ambiguity:**
1. Can you dock the teleported ship immediately?
2. Or is it just available for pairing?
3. Does the ship count as "placed" or "unplaced"?

**Interpretation:**
1. AVAILABLE FOR PAIRING - Ship can be docked at new facility with other ships from fleet
2. Must still meet facility requirements (e.g., Colonist Hub needs any value, Alien Artifact needs total > 7)
3. UNPLACED - Ship is available to dock (not yet docked at new facility)

**Example (from rules):** Roll 2, 5, 6. Dock 6 at Lunar Mine (+1 ore). Teleport 6 to Alien Artifact. Dock 2 at Alien Artifact (6+2=8, claim tech card).

**Digital Implementation:**

```javascript
function dockAtFacility(player, facility, ships) {
  // Include teleported ships that haven't been docked yet
  let availableShips = [
    ...player.fleet.filter(s => !s.docked),
    ...player.teleportedShips.filter(ts => !ts.ship.docked).map(ts => ts.ship)
  ];
  
  // Validate ships are available
  for (let ship of ships) {
    if (!availableShips.includes(ship)) {
      throw new Error(`Ship ${ship.value} not available`);
    }
    
    // Check if ship was teleported from this facility (cannot reuse)
    let teleportRecord = player.teleportedShips.find(ts => ts.ship === ship);
    if (teleportRecord && teleportRecord.fromFacility === facility) {
      throw new Error("Cannot reuse ship at facility it was moved from");
    }
  }
  
  // ... dock ships at facility
}
```

---

## AMBIGUITY #104: Orbital Teleporter - Discard Power (Colony Movement)

**Rule Text:** "You may discard the Orbital Teleporter to move any single colony from one territory to another territory. See Repulsor Field above for exceptions."

**Ambiguity:**
1. Can you move an opponent's colony?
2. Can you move a colony to a territory you already control?
3. Does moving a colony count as "adding" or "removing"?

**Interpretation:**
1. NO - "Any single colony" in context means YOUR colony (consistent with facility wording)
2. YES - No restriction (strategic to gain/maintain control)
3. BOTH - Counts as removing from source territory AND adding to destination territory

**Clarification:** Repulsor Field blocks movement if on EITHER territory (see Ambiguity #81).

**Digital Implementation:**

```javascript
function discardOrbitalTeleporter(player, fromTerritory, toTerritory) {
  if (fromTerritory.hasField('RepulsorField') || toTerritory.hasField('RepulsorField')) {
    throw new Error("Repulsor Field blocks colony movement");
  }
  
  if (fromTerritory.colonies[player.id] <= 0) {
    throw new Error("No colony to move from this territory");
  }
  
  // Move colony
  fromTerritory.colonies[player.id]--;
  toTerritory.colonies[player.id]++;
  
  // Update control on both territories
  updateTerritoryControl(fromTerritory);
  updateTerritoryControl(toTerritory);
  
  // Discard card
  player.hand = player.hand.filter(c => c.id !== 'OrbitalTeleporter');
  alienTechDiscard.push('OrbitalTeleporter');
  player.discardedThisTurn = true;
}
```

---

## AMBIGUITY #105: Plasma Cannon - "One Fuel Per Ship"

**Rule Text:** "Each turn you may pay one fuel per ship to remove other players' ships from one orbital facility."

**Ambiguity:**
1. Can you remove ships from multiple facilities?
2. Can you choose how many ships to remove?
3. What if there are fewer ships than you can afford?

**Interpretation:**
1. NO - "From one orbital facility" means single facility per use
2. YES - "One fuel per ship" implies you pay for each ship removed (your choice)
3. PAY FOR ACTUAL SHIPS - If there are 2 ships and you have 5 fuel, you pay 2 fuel

**Digital Implementation:**

```javascript
function usePlasmaCannon(player, facility, targetShips) {
  // Validate targets (cannot target own ships)
  for (let ship of targetShips) {
    if (ship.owner === player.id) {
      throw new Error("Cannot use Plasma Cannon on your own ships");
    }
    
    if (!facility.hasShip(ship)) {
      throw new Error("Ship not at this facility");
    }
  }
  
  let baseCost = targetShips.length;
  let cost = getAlienTechCost(player, { baseFuelCost: baseCost });
  
  if (player.fuel < cost) {
    throw new Error(`Need ${cost} fuel to remove ${targetShips.length} ships`);
  }
  
  player.fuel -= cost;
  
  // Remove ships
  for (let ship of targetShips) {
    facility.removeShip(ship);
    
    // Special case: Terraforming Station
    if (facility.id === 'TerraformingStation') {
      ship.owner.returnShipToStock(ship);
    } else {
      maintenanceBay.add(ship, ship.owner);
    }
  }
  
  let card = player.hand.find(c => c.id === 'PlasmaCannon');
  card.usedThisTurn = true;
}
```

---

## AMBIGUITY #106: Plasma Cannon - Terraforming Station Exception

**Rule Text (Example 2):** "Ordinarily a ship removed by the Plasma Cannon would go to the Maintenance Bay, but a ship on the Terraforming Station is forfeit on the player's next turn so you return it to the ship stock instead."

**Ambiguity:**
1. Is this mandatory or optional?
2. Does the ship go to Maintenance Bay first, or directly to ship stock?
3. Can the owner reclaim it on their next turn?

**Interpretation:**
1. MANDATORY - "So you return it" is not optional
2. DIRECTLY TO SHIP STOCK - Bypasses Maintenance Bay
3. NO - Ship is returned to stock (lost permanently unless rebuilt via Shipyard)

**Clarification:** This prevents the owner from gathering the ship on their next turn. The ship is forfeit immediately.

**Digital Implementation:**

```javascript
function usePlasmaCannon(player, facility, targetShips) {
  // ... validation and cost
  
  for (let ship of targetShips) {
    facility.removeShip(ship);
    
    if (facility.id === 'TerraformingStation') {
      // Forfeit immediately (return to stock)
      ship.owner.returnShipToStock(ship);
    } else {
      // Normal Plasma Cannon behavior (Maintenance Bay)
      maintenanceBay.add(ship, ship.owner);
    }
  }
  
  // ... mark card used
}
```

---

## AMBIGUITY #107: Plasma Cannon - Discard Power (Remove Ship Permanently)

**Rule Text:** "You may discard a Plasma Cannon to return one ship belonging to another player to the ship stock. The target player must have more than three ships of their color on the board. The Relic Ship does not count toward this tally."

**Ambiguity:**
1. Does "more than three" mean exactly 4, or 4+?
2. Does "on the board" include ships in Maintenance Bay?
3. Can you target a ship that's docked at a facility?

**Interpretation:**
1. 4+ SHIPS - Target must have at least 4 colored ships
2. YES - "On the board" includes everywhere except ship stock (fleet, docked, Maintenance Bay)
3. YES - No restriction on ship location (can be anywhere on board)

**Example (from rules):** Yellow has 6 ships on the board. Discard Plasma Cannon to remove yellow's 6 from Lunar Mine (return to ship stock).

**Digital Implementation:**

```javascript
function discardPlasmaCannon(player, targetPlayer, targetShip) {
  // Count colored ships (exclude Relic Ship)
  let coloredShips = targetPlayer.getShipsOnBoard().filter(s => !s.isRelicShip);
  
  if (coloredShips.length <= 3) {
    throw new Error(`Target must have more than 3 ships (has ${coloredShips.length})`);
  }
  
  if (targetShip.owner !== targetPlayer) {
    throw new Error("Ship doesn't belong to target player");
  }
  
  if (targetShip.isRelicShip) {
    throw new Error("Cannot target Relic Ship with discard power");
  }
  
  // Remove ship from wherever it is
  if (targetShip.dockedAt) {
    targetShip.dockedAt.removeShip(targetShip);
  } else if (targetShip.inFleet) {
    targetPlayer.fleet = targetPlayer.fleet.filter(s => s !== targetShip);
  } else if (targetShip.inMaintenanceBay) {
    maintenanceBay.remove(targetShip);
  }
  
  // Return to stock (permanent loss)
  targetPlayer.returnShipToStock(targetShip);
  
  // Discard card
  player.hand = player.hand.filter(c => c.id !== 'PlasmaCannon');
  alienTechDiscard.push('PlasmaCannon');
  player.discardedThisTurn = true;
}
```

---

## AMBIGUITY #108: Polarity Device - Flip Opposite Face

**Rule Text:** "Each turn you may pay one fuel to flip one of your unplaced ships to its opposite face."

**Ambiguity:**
1. What are the opposite faces?
2. Can you flip a 6 to a 1?
3. Can you flip the same ship multiple times in one turn?

**Interpretation:**
1. 1↔6, 2↔5, 3↔4 (opposite sides of a die)
2. YES - Opposite of 6 is 1
3. NO - "Once per turn" per card (Ambiguity #88)

**Example (from rules):** Roll 1, 2, 5. Pay 1F, flip 1 to 6.

**Digital Implementation:**

```javascript
function usePolarityDevice(player, ship) {
  if (!player.fleet.includes(ship) || ship.docked) {
    throw new Error("Ship must be unplaced");
  }
  
  let cost = getAlienTechCost(player, { baseFuelCost: 1 });
  
  if (player.fuel < cost) {
    throw new Error(`Need ${cost} fuel`);
  }
  
  player.fuel -= cost;
  
  // Flip to opposite face
  let opposites = { 1: 6, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1 };
  ship.value = opposites[ship.value];
  
  let card = player.hand.find(c => c.id === 'PolarityDevice');
  card.usedThisTurn = true;
}
```

---

## AMBIGUITY #109: Polarity Device - Discard Power (Swap Colonies)

**Rule Text:** "You may discard a Polarity Device to swap the locations of any two colonies on any two territories. See Repulsor Field for exceptions."

**Ambiguity:**
1. Can you swap colonies between territories you don't control?
2. Must both colonies be yours?
3. Can you swap with an empty territory?

**Interpretation:**
1. YES - "Any two territories" (no control restriction)
2. NO - "Any two colonies" suggests flexibility (see Example 2)
3. NO - Must be two actual colonies (cannot swap with nothing)

**Example 2 (from rules):** Herbert Valley has 2 yellow, Lem Badlands has 2 red. Swap one yellow and one red. Both territories now have 1 yellow and 1 red (ties).

**Clarification:** You can swap YOUR colony with ANY other colony (yours or opponent's).

**Digital Implementation:**

```javascript
function discardPolarityDevice(player, territory1, colony1Owner, territory2, colony2Owner) {
  if (territory1.hasField('RepulsorField') || territory2.hasField('RepulsorField')) {
    throw new Error("Repulsor Field blocks colony swapping");
  }
  
  if (territory1.colonies[colony1Owner] <= 0) {
    throw new Error(`No ${colony1Owner} colony on ${territory1.name}`);
  }
  
  if (territory2.colonies[colony2Owner] <= 0) {
    throw new Error(`No ${colony2Owner} colony on ${territory2.name}`);
  }
  
  // Swap colonies
  territory1.colonies[colony1Owner]--;
  territory2.colonies[colony1Owner]++;
  
  territory2.colonies[colony2Owner]--;
  territory1.colonies[colony2Owner]++;
  
  // Update control on both
  updateTerritoryControl(territory1);
  updateTerritoryControl(territory2);
  
  // Discard card
  player.hand = player.hand.filter(c => c.id !== 'PolarityDevice');
  alienTechDiscard.push('PolarityDevice');
  player.discardedThisTurn = true;
}
```

---

## AMBIGUITY #110: Resource Cache - Timing and Counting

**Rule Text:** "Count the odd and even value ships after you roll your fleet but before you use any alien tech cards."

**Ambiguity:**
1. Does this include ships in Maintenance Bay?
2. Does this include the Relic Ship?
3. What if you have 0 ships?

**Interpretation:**
1. NO - Only ships in your FLEET (rolled ships)
2. YES - If you have Relic Ship, it counts (it's in your fleet when rolled)
3. NO BENEFIT - 0 odd and 0 even = equal, so you get 1F+1O and discard

**Digital Implementation:**

```javascript
function checkResourceCache(player) {
  let card = player.hand.find(c => c.id === 'ResourceCache');
  
  if (!card || card.acquiredThisTurn) {
    return;  // Not active yet
  }
  
  // Count odd/even in fleet (after roll, before manipulation)
  let oddCount = player.fleet.filter(s => s.value % 2 === 1).length;
  let evenCount = player.fleet.filter(s => s.value % 2 === 0).length;
  
  if (oddCount > evenCount) {
    player.ore++;
  } else if (evenCount > oddCount) {
    player.fuel++;
  } else {
    // Equal - get both and discard
    player.fuel++;
    player.ore++;
    
    player.hand = player.hand.filter(c => c !== card);
    alienTechDiscard.push(card);
  }
}
```

---

## AMBIGUITY #111: Resource Cache - "Cannot Be Used on Turn You Acquire It"

**Rule Text:** "Unlike every other alien tech card, the Resource Cache cannot be used on the turn you acquire it."

**Ambiguity:**
1. Does it activate automatically on your NEXT turn?
2. Or do you need to "use" it somehow?
3. What if you acquire it on your last turn before game ends?

**Interpretation:**
1. YES - Activates automatically at start of each turn (after rolling)
2. NO ACTION NEEDED - Passive effect (checks fleet composition)
3. NO BENEFIT - Card is not active until next turn (game already ended)

**Digital Implementation:**

```javascript
function startTurn(player) {
  // Gather ships (from Maintenance Bay, Terraforming, etc.)
  player.gatherShips();
  
  // Roll fleet
  player.rollFleet();
  
  // Check Resource Cache BEFORE alien tech manipulation
  checkResourceCache(player);
  
  // Now player can use alien tech cards to manipulate ships
}
```

---

## AMBIGUITY #112: Resource Cache - Discard Condition

**Rule Text:** "The Resource Cache card is only discarded if you roll equal numbers of odd and even valued ships."

**Ambiguity:**
1. Can you voluntarily discard it for field generator powers?
2. Is automatic discard mandatory?
3. What if you manipulate ships to make them equal?

**Interpretation:**
1. NO - "Only discarded if" suggests it has no discard power
2. YES - Must discard if equal (get 1F+1O as consolation)
3. TOO LATE - Resource Cache checks BEFORE manipulation (see #110)

**Digital Implementation:**

```javascript
const alienTechCards = [
  // ...
  { 
    id: 'ResourceCache', 
    name: 'Resource Cache', 
    hasDiscardPower: false,  // Cannot voluntarily discard
    isPassive: true,
    checksAfterRoll: true
  },
  // ...
];
```

---

## AMBIGUITY #113: Stasis Beam - Decrease Value

**Rule Text:** "Each turn you may pay one fuel to decrease the value of one of your unplaced ships by one point."

**Ambiguity:**
1. Can you decrease a 1 to 0?
2. Why would you want to decrease a ship value?
3. Can you decrease the same ship multiple times?

**Interpretation:**
1. NO - Ship values 1-6 limit (Ambiguity #91)
2. STRATEGIC - Get matching values or better ratios (see example: 2→1 to get pair of 1s)
3. NO - Once per turn (Ambiguity #88)

**Example (from rules):** Roll 1, 2, 5. Pay 1F, decrease 2 to 1. Dock pair of 1s at Orbital Market (1:1 ratio).

**Digital Implementation:**

```javascript
function useStasisBeam(player, ship) {
  if (!player.fleet.includes(ship) || ship.docked) {
    throw new Error("Ship must be unplaced");
  }
  
  if (ship.value <= 1) {
    throw new Error("Ship already at minimum value (1)");
  }
  
  let cost = getAlienTechCost(player, { baseFuelCost: 1 });
  
  if (player.fuel < cost) {
    throw new Error(`Need ${cost} fuel`);
  }
  
  player.fuel -= cost;
  ship.value -= 1;
  
  let card = player.hand.find(c => c.id === 'StasisBeam');
  card.usedThisTurn = true;
}
```

---

## AMBIGUITY #114: Temporal Warper - Re-roll Multiple Ships

**Rule Text:** "Each turn you may pay one fuel to re-roll as many of your unplaced ships as you like."

**Ambiguity:**
1. Can you re-roll just one ship?
2. Can you re-roll all ships?
3. Do you choose which ships to re-roll before or after seeing results?

**Interpretation:**
1. YES - "As many... as you like" includes 1
2. YES - Includes all unplaced ships
3. BEFORE - Choose which ships to re-roll, then roll them (cannot re-roll based on results)

**Example (from rules):** Roll 1, 2, 5. Re-roll the 1 and 2 (hoping for higher values).

**Digital Implementation:**

```javascript
function useTemporalWarper(player, shipsToReroll) {
  for (let ship of shipsToReroll) {
    if (!player.fleet.includes(ship) || ship.docked) {
      throw new Error("Can only re-roll unplaced ships");
    }
  }
  
  let cost = getAlienTechCost(player, { baseFuelCost: 1 });
  
  if (player.fuel < cost) {
    throw new Error(`Need ${cost} fuel`);
  }
  
  player.fuel -= cost;
  
  // Re-roll selected ships
  for (let ship of shipsToReroll) {
    ship.value = rollDie();
  }
  
  let card = player.hand.find(c => c.id === 'TemporalWarper');
  card.usedThisTurn = true;
}
```

---

## AMBIGUITY #115: Temporal Warper - Discard Power (Claim from Discard)

**Rule Text:** "You may discard a Temporal Warper to claim one alien tech card of your choice from the discard pile. You may look through the discard pile before discarding your Temporal Warper card."

**Ambiguity:**
1. What if the discard pile is empty?
2. What if you already have the card you want to claim?
3. Can you claim a card that was just discarded by another player?

**Interpretation:**
1. CANNOT USE - If discard pile empty, cannot use this power
2. BLOCKED - Cannot claim (same as Ambiguity #90), would need to choose different card
3. YES - Any card in discard pile is fair game

**Example 2 (from rules):** Review discard pile, see Alien City. Discard Temporal Warper, take Alien City (+1 VP).

**Digital Implementation:**

```javascript
function discardTemporalWarper(player, cardIdFromDiscard) {
  if (alienTechDiscard.length === 0) {
    throw new Error("Discard pile is empty");
  }
  
  let targetCard = alienTechDiscard.find(c => c.id === cardIdFromDiscard);
  
  if (!targetCard) {
    throw new Error("Card not in discard pile");
  }
  
  if (player.hand.some(c => c.id === cardIdFromDiscard)) {
    throw new Error("You already have this card");
  }
  
  // Remove from discard pile
  alienTechDiscard = alienTechDiscard.filter(c => c !== targetCard);
  
  // Add to player's hand
  player.hand.push(targetCard);
  targetCard.usedThisTurn = false;
  targetCard.acquiredThisTurn = true;
  
  // Discard Temporal Warper
  let warper = player.hand.find(c => c.id === 'TemporalWarper');
  player.hand = player.hand.filter(c => c !== warper);
  alienTechDiscard.push(warper);
  player.discardedThisTurn = true;
}
```

---

## SUMMARY: Critical Alien Tech Card Decisions (Part 2)

**Holographic Decoy:**
1. **Passive protection** from resource theft (always active)
2. **Raiders can only steal Holographic Decoy** (not other cards)
3. **Duplicate stolen decoy discarded** (if raider already has one)

**Orbital Teleporter:**
4. **Move docked ship to different facility** (2F, once per turn)
5. **Cannot return to facility moved from** (one-way per turn)
6. **Cannot move off Terraforming Station** (ship is committed)
7. **Discard to move YOUR colony** between territories

**Plasma Cannon:**
8. **Remove opponent ships** (1F per ship, from one facility)
9. **Ships go to Maintenance Bay** (except Terraforming → ship stock)
10. **Discard to permanently remove ship** (target must have 4+ colored ships)
11. **Relic Ship doesn't count** toward 4+ ship minimum

**Polarity Device:**
12. **Flip ship to opposite face** (1↔6, 2↔5, 3↔4)
13. **Discard to swap two colonies** (can break control ties)
14. **Repulsor Field blocks swaps** (if on either territory)

**Resource Cache:**
15. **Passive income based on odd/even** (after roll, before manipulation)
16. **Cannot use turn acquired** (unlike other cards)
17. **Auto-discard if equal** (get 1F+1O as consolation)
18. **Cannot voluntarily discard** (no discard power)

**Stasis Beam:**
19. **Decrease ship value by 1** (1F, min value 1)
20. **Strategic for matching pairs** or better ratios
21. **Discard to place/move Isolation Field**

**Temporal Warper:**
22. **Re-roll any number of unplaced ships** (1F per use, not per ship)
23. **Choose before rolling** (cannot see results first)
24. **Discard to claim from discard pile** (powerful recovery)

---

**Next Section:** Quick Reference & Edge Cases (Page 16)
