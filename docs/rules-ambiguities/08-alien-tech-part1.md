# Alien Tech Cards Part 1 - General Rules (Page 13)

## Source Text Review
**Page 13** covers general alien tech card rules and the first 4 specific cards: Alien City, Alien Monument, Booster Pod, Data Crystal, and Gravity Manipulator.

---

## AMBIGUITY #86: Alien Tech Cards - "Most May Be Used Immediately"

**Rule Text:** "Most alien tech cards may be used immediately after you acquire them."

**Ambiguity:**
1. What does "most" mean - which cards CANNOT be used immediately?
2. Does "immediately" mean on the same turn you acquire them?
3. Can you use a fuel-power card and then discard it on the same turn?

**Interpretation:**
1. Cards with DISCARD POWERS cannot be used immediately (see next ambiguity)
2. YES - "Immediately after you acquire them" means same turn
3. NO - "You may only discard an alien tech card you have not already used on your current turn"

**Example:** Acquire Booster Pod, use it to boost a ship (+1F cost), dock the ships. Cannot discard Booster Pod this turn.

**Digital Implementation:**

```javascript
function acquireAlienTech(player, card) {
  player.hand.push(card);
  card.usedThisTurn = false;
  card.acquiredThisTurn = true;
  
  // Can use fuel-power immediately (if not used yet)
  // Cannot discard immediately
}

function useAlienTechFuelPower(player, card) {
  if (card.fuelCost > player.fuel) {
    throw new Error(`Need ${card.fuelCost} fuel`);
  }
  
  if (card.usedThisTurn) {
    throw new Error("Already used this turn");
  }
  
  player.fuel -= card.fuelCost;
  card.usedThisTurn = true;
  
  // Apply card effect
}

function discardAlienTech(player, card) {
  if (card.usedThisTurn) {
    throw new Error("Cannot discard a card used this turn");
  }
  
  if (player.discardedThisTurn) {
    throw new Error("Already discarded a card this turn");
  }
  
  player.hand = player.hand.filter(c => c !== card);
  alienTechDiscard.push(card);
  player.discardedThisTurn = true;
  
  // Apply discard power
}
```

---

## AMBIGUITY #87: Alien Tech Cards - "One Discard Per Turn"

**Rule Text:** "You may only discard an alien tech card you have not already used on your current turn and then only one discard per turn."

**Ambiguity:**
1. Does this mean one discard total, or one discard per card type?
2. If you discard a card during your turn, can you discard another during an opponent's turn?
3. Does this apply to all players, or per player?

**Interpretation:**
1. ONE DISCARD TOTAL - Only one alien tech discard per turn (yours)
2. NO - "Per turn" means per your turn. You cannot discard during opponents' turns
3. PER PLAYER - Each player can discard once on their own turn

**Digital Implementation:**

```javascript
class Player {
  constructor() {
    this.hand = [];
    this.discardedThisTurn = false;
  }
  
  resetTurn() {
    this.discardedThisTurn = false;
    
    // Reset "used" flags on all cards
    for (let card of this.hand) {
      card.usedThisTurn = false;
      card.acquiredThisTurn = false;
    }
  }
}
```

---

## AMBIGUITY #88: Alien Tech Cards - "Fuel Payment... Once Per Turn"

**Rule Text:** "Alien tech cards that require a fuel payment can only be used once per turn."

**Ambiguity:**
1. Does "once per turn" mean once per card, or once total?
2. Can you use Booster Pod (+1) and then Gravity Manipulator (move points) in the same turn?
3. Does this apply only to fuel-power cards, or all cards?

**Interpretation:**
1. ONCE PER CARD - Each card can be used once per turn
2. YES - You can use multiple different cards (Booster Pod, then Gravity Manipulator, then Data Crystal, etc.)
3. ONLY FUEL-POWER CARDS - Victory point cards (Alien City, Alien Monument) and passive cards (Holographic Decoy) have no usage limit

**Digital Implementation:**

```javascript
function useBoosterPod(player, ship) {
  let card = player.hand.find(c => c.id === 'BoosterPod');
  
  if (card.usedThisTurn) {
    throw new Error("Booster Pod already used this turn");
  }
  
  let cost = getAlienTechCost(player, card);  // Checks Pohl Foothills
  
  if (player.fuel < cost) {
    throw new Error(`Need ${cost} fuel`);
  }
  
  player.fuel -= cost;
  ship.value = Math.min(6, ship.value + 1);
  card.usedThisTurn = true;
}

function useGravityManipulator(player, ship1, ship2) {
  let card = player.hand.find(c => c.id === 'GravityManipulator');
  
  if (card.usedThisTurn) {
    throw new Error("Gravity Manipulator already used this turn");
  }
  
  // ... (both cards can be used in same turn)
}
```

---

## AMBIGUITY #89: Alien Tech Cards - Face-Up Requirement

**Rule Text:** "Your alien tech cards are placed on the table face-up where all players can see them."

**Ambiguity:**
1. Is this mandatory, or optional?
2. Can you hide cards in your hand?
3. What about Holographic Decoy - should opponents know you have it?

**Interpretation:**
1. MANDATORY - All cards must be visible to all players (public information)
2. NO - Cards are not in your "hand" in the traditional sense, they are on the table
3. YES - Holographic Decoy is face-up. Opponents know you have it and cannot steal resources

**Digital Implementation:**

```javascript
class Player {
  constructor() {
    this.hand = [];  // Called "hand" but actually public/visible
  }
}

// In UI, display all players' alien tech cards
function renderPlayerBoard(player) {
  return {
    name: player.name,
    alienTechCards: player.hand.map(c => ({
      id: c.id,
      name: c.name,
      usedThisTurn: c.usedThisTurn
    }))
  };
}
```

---

## AMBIGUITY #90: Alien Tech Cards - "One Copy Each"

**Rule Text:** "You may only possess one copy of each alien tech card."

**Ambiguity:**
1. What happens if you claim a card you already have?
2. Is it discarded, or do you not claim it?
3. Does this apply during game setup or only during play?

**Interpretation:**
1. CANNOT CLAIM - You cannot claim a card you already possess
2. STAYS IN DECK - Card remains available for other players (or draw again?)
3. ONLY DURING PLAY - This rule applies to claiming cards from Alien Artifact

**NOTE:** The rules don't explicitly state what happens. Most reasonable interpretation: If you would claim a card you already have, draw another card instead (reshuffle and redraw).

**Digital Implementation:**

```javascript
function claimAlienTechCard(player) {
  let card = alienTechDeck.pop();
  
  // Check for duplicate
  if (player.hand.some(c => c.id === card.id)) {
    // Reshuffle and draw another
    alienTechDeck.push(card);
    shuffleDeck(alienTechDeck);
    return claimAlienTechCard(player);  // Recursive
  }
  
  player.hand.push(card);
  card.usedThisTurn = false;
  card.acquiredThisTurn = true;
  
  return card;
}
```

---

## AMBIGUITY #91: Alien Tech Cards - Ship Value Limits

**Rule Text:** "If a card allows you to change a ship's value then the value may never be lower than 1 or higher than 6."

**Ambiguity:**
1. What happens if you try to boost a 6?
2. What happens if you try to decrease a 1?
3. Is this enforced automatically, or can you waste fuel?

**Interpretation:**
1. ILLEGAL MOVE - Cannot boost a 6 (or boost a 5 by 2)
2. ILLEGAL MOVE - Cannot decrease a 1
3. ENFORCED - Game should prevent illegal moves (not allow fuel waste)

**Digital Implementation:**

```javascript
function useBoosterPod(player, ship) {
  if (ship.value >= 6) {
    throw new Error("Ship already at maximum value (6)");
  }
  
  // ... use card
  ship.value = Math.min(6, ship.value + 1);
}

function usePolarityDevice(player, ship) {
  // Flip to opposite face: 1↔6, 2↔5, 3↔4
  let opposites = { 1: 6, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1 };
  ship.value = opposites[ship.value];
}

function useGravityManipulator(player, ship1, ship2) {
  if (ship1.value <= 1) {
    throw new Error("Cannot decrease ship1 below 1");
  }
  
  if (ship2.value >= 6) {
    throw new Error("Cannot increase ship2 above 6");
  }
  
  ship1.value -= 1;
  ship2.value += 1;
}
```

---

## AMBIGUITY #92: Alien Tech Cards - Deck Exhaustion

**Rule Text:** "If the alien tech draw deck is exhausted, reshuffle the discards to create a new draw deck."

**Ambiguity:**
1. Does this include cards discarded for field generators?
2. Does this include Alien City and Alien Monument (VP cards)?
3. What if the discard pile is also empty?

**Interpretation:**
1. YES - All discarded cards are reshuffled
2. NO - VP cards don't have discard powers, so they never enter discard pile
3. IMPOSSIBLE - At least one card must be in play or discard (unless all cards are held by players)

**Clarification:** If all cards are held by players and deck is empty, no more cards can be claimed.

**Digital Implementation:**

```javascript
function claimAlienTechCard(player) {
  if (alienTechDeck.length === 0) {
    // Reshuffle discard pile
    if (alienTechDiscard.length > 0) {
      alienTechDeck = [...alienTechDiscard];
      alienTechDiscard = [];
      shuffleDeck(alienTechDeck);
    } else {
      throw new Error("No alien tech cards available");
    }
  }
  
  // ... draw card
}
```

---

## AMBIGUITY #93: Alien City & Alien Monument - Multiple Copies

**Rule Text:** "There is one Alien City card and one Alien Monument card in the alien tech deck and a single player may possess both cards simultaneously."

**Ambiguity:**
1. Why mention "single player may possess both"?
2. Does this mean they are exempt from the "one copy each" rule?
3. Can two players each have an Alien City?

**Interpretation:**
1. CLARIFICATION - To confirm that Alien City and Alien Monument are different cards (not duplicates)
2. NO - They are different cards. "One copy each" means one copy of Alien City, one copy of Alien Monument
3. NO - Only one Alien City exists in the entire deck

**Digital Implementation:**

```javascript
const alienTechCards = [
  { id: 'AlienCity', name: 'Alien City', vp: 1, isUnique: true },
  { id: 'AlienMonument', name: 'Alien Monument', vp: 1, isUnique: true },
  { id: 'BoosterPod', name: 'Booster Pod', fuelCost: 1, isUnique: true },
  // ... (all cards are unique - only one of each type in deck)
];
```

---

## AMBIGUITY #94: Alien City & Alien Monument - No Discard Powers

**Rule Text:** "There is no fuel cost associated with these cards and they do not have discard powers."

**Ambiguity:**
1. Can you discard them for no effect?
2. Are they permanently held once acquired?
3. Do they count toward the "one discard per turn" limit if you discard them?

**Interpretation:**
1. NO - "Do not have discard powers" implies you cannot discard them at all
2. YES - Once acquired, they stay with you for the game (cannot be stolen by Raiders' Outpost either, per Ambiguity #95)
3. N/A - Cannot be discarded

**Digital Implementation:**

```javascript
function discardAlienTech(player, card) {
  if (!card.hasDiscardPower) {
    throw new Error(`${card.name} cannot be discarded (no discard power)`);
  }
  
  // ... discard logic
}

const alienTechCards = [
  { id: 'AlienCity', name: 'Alien City', vp: 1, hasDiscardPower: false },
  { id: 'AlienMonument', name: 'Alien Monument', vp: 1, hasDiscardPower: false },
  { id: 'BoosterPod', name: 'Booster Pod', fuelCost: 1, hasDiscardPower: true },
  // ...
];
```

---

## AMBIGUITY #95: Booster Pod - Remove "Any Single Field Generator"

**Rule Text:** "You may discard a Booster Pod to remove any single field generator from the territory on which it is located."

**Ambiguity:**
1. Can you remove a field generator from a territory you don't control?
2. Can you remove a field generator from a territory with no colonies?
3. Which territory is "the territory on which it is located"?

**Interpretation:**
1. YES - No restriction on control
2. YES - No restriction on colonies
3. YOUR CHOICE - You choose which territory to target (phrasing is awkward but intent is clear)

**Digital Implementation:**

```javascript
function discardBoosterPod(player, targetTerritory, fieldType) {
  if (!targetTerritory.hasField(fieldType)) {
    throw new Error(`${targetTerritory.name} doesn't have ${fieldType}`);
  }
  
  targetTerritory.removeField(fieldType);
  
  // Update appropriate global field location
  if (fieldType === 'IsolationField') {
    isolationField.location = null;
    
    // Re-enable bonus if controlled
    if (targetTerritory.controller) {
      targetTerritory.controller.activeBonuses.add(targetTerritory.bonus);
    }
  } else if (fieldType === 'PositronField') {
    positronField.location = null;
  } else if (fieldType === 'RepulsorField') {
    repulsorField.location = null;
  }
  
  // Discard card
  player.hand = player.hand.filter(c => c.id !== 'BoosterPod');
  alienTechDiscard.push('BoosterPod');
  player.discardedThisTurn = true;
}
```

---

## AMBIGUITY #96: Data Crystal - Cost Calculation

**Rule Text:** "Each turn you may pay one fuel per colony on a territory to use that territory's bonus exactly as if you controlled the territory."

**Ambiguity:**
1. Is the cost 1F per colony total, or 1F per player with colonies?
2. If Red has 2 colonies and Yellow has 1 colony, what's the cost?
3. Do your own colonies count toward the cost?

**Interpretation:**
1. 1F PER COLONY TOTAL - Count all colonies on the territory
2. COST = 3F (2 Red + 1 Yellow = 3 total colonies)
3. YES - All colonies count (including yours if you have any)

**Example (from rules):** "Heinlein Plains has one green colony and one red colony on it, so you pay two fuel and use your Data Crystal to borrow the Heinlein Plains bonus."

**Digital Implementation:**

```javascript
function useDataCrystal(player, territory) {
  if (territory.id === 'BurroughsDesert') {
    throw new Error("Cannot use Data Crystal on Burroughs Desert");
  }
  
  if (territory.hasField('IsolationField')) {
    throw new Error("Cannot use bonus - Isolation Field active");
  }
  
  let totalColonies = Object.values(territory.colonies)
    .reduce((sum, count) => sum + count, 0);
  
  if (totalColonies === 0) {
    throw new Error("Territory has no colonies");
  }
  
  let cost = getAlienTechCost(player, { baseFuelCost: totalColonies });
  
  if (player.fuel < cost) {
    throw new Error(`Need ${cost} fuel (${totalColonies} colonies on territory)`);
  }
  
  player.fuel -= cost;
  
  // Temporarily grant bonus for this action
  player.tempBonuses.add(territory.bonus);
}
```

---

## AMBIGUITY #97: Data Crystal - "Exactly As If You Controlled"

**Rule Text:** "Use that territory's bonus exactly as if you controlled the territory."

**Ambiguity:**
1. Do you gain control of the territory?
2. Do you gain the +1 VP for control?
3. Can you use the bonus multiple times if you pay multiple times?

**Interpretation:**
1. NO - You don't gain control (just borrow the bonus)
2. NO - No control VP (just the bonus effect)
3. NO - "Once per turn" limit on fuel-power cards (Ambiguity #88)

**Example:** Use Data Crystal to borrow Lem Badlands bonus. Dock 3 ships at Solar Converter. Get +3 fuel bonus (one per ship). Do NOT gain control of Lem Badlands, do NOT gain +1 VP.

**Digital Implementation:**

```javascript
function useDataCrystal(player, territory) {
  // ... validation and cost
  
  // Grant bonus temporarily (for current action)
  player.tempBonuses.add(territory.bonus);
  
  // Mark card as used
  let card = player.hand.find(c => c.id === 'DataCrystal');
  card.usedThisTurn = true;
}

// Later, when using a facility
function useSolarConverter(player, ships) {
  let baseFuel = ships.reduce((sum, ship) => 
    sum + Math.ceil(ship.value / 2), 0
  );
  
  let bonusFuel = 0;
  
  // Check both active and temp bonuses
  if (player.controlsTerritory('LemBadlands') || 
      player.tempBonuses.has('LemBadlands')) {
    bonusFuel = ships.length;
  }
  
  player.fuel += baseFuel + bonusFuel;
  
  // Clear temp bonuses after use
  player.tempBonuses.clear();
}
```

---

## AMBIGUITY #98: Data Crystal - Burroughs Desert Exemption

**Rule Text:** "Burroughs Desert is exempt from the Data Crystal's power because its bonus plays out over more than a single turn."

**Ambiguity:**
1. Can you pay fuel to use Data Crystal on Burroughs Desert with no effect?
2. Does the game prevent this, or allow it?
3. Why is this exemption necessary?

**Interpretation:**
1. NO - Game should prevent (see Implementation #96)
2. PREVENTED - Illegal move (waste of fuel)
3. MULTI-TURN - Relic Ship requires purchase (1F+1O) and then waiting until next turn to gather it. Cannot be "borrowed" for one action

**Digital Implementation:**

```javascript
function useDataCrystal(player, territory) {
  if (territory.id === 'BurroughsDesert') {
    throw new Error("Cannot use Data Crystal on Burroughs Desert (multi-turn bonus)");
  }
  
  // ... rest of logic
}
```

---

## AMBIGUITY #99: Gravity Manipulator - "Unplaced Ships"

**Rule Text:** "Each turn you may pay two fuel to decrease the value of one unplaced ship by one point and increase the value of another unplaced ship by one point."

**Ambiguity:**
1. Can you manipulate a ship that's already docked?
2. Can you manipulate ships in the Maintenance Bay?
3. Must you manipulate two different ships?

**Interpretation:**
1. NO - "Unplaced" means ships in your fleet (not yet docked)
2. NO - Ships in Maintenance Bay are not in your fleet yet
3. YES - "One... and... another" implies two different ships (cannot move points within same ship)

**Digital Implementation:**

```javascript
function useGravityManipulator(player, ship1, ship2) {
  if (!player.fleet.includes(ship1)) {
    throw new Error("Ship1 must be in your fleet (unplaced)");
  }
  
  if (!player.fleet.includes(ship2)) {
    throw new Error("Ship2 must be in your fleet (unplaced)");
  }
  
  if (ship1 === ship2) {
    throw new Error("Must manipulate two different ships");
  }
  
  if (ship1.value <= 1) {
    throw new Error("Ship1 would go below 1");
  }
  
  if (ship2.value >= 6) {
    throw new Error("Ship2 would go above 6");
  }
  
  let cost = getAlienTechCost(player, { baseFuelCost: 2 });
  
  if (player.fuel < cost) {
    throw new Error(`Need ${cost} fuel`);
  }
  
  player.fuel -= cost;
  ship1.value -= 1;
  ship2.value += 1;
  
  let card = player.hand.find(c => c.id === 'GravityManipulator');
  card.usedThisTurn = true;
}
```

---

## SUMMARY: Critical Alien Tech General Rules

**Usage Rules:**
1. **Most cards usable immediately** after acquisition (same turn)
2. **Fuel-power cards once per turn** (per card, not total)
3. **One discard per turn** (total, not per card)
4. **Cannot discard card used this turn** (fuel-power or discard, pick one)
5. **All cards face-up** (public information)

**Card Limits:**
6. **One copy of each card** per player (if claim duplicate, redraw)
7. **Ship values 1-6** (cannot boost 6, cannot decrease 1)
8. **Deck exhaustion:** Reshuffle discard pile

**Specific Cards:**
9. **Alien City & Alien Monument:** +1 VP each, no discard power (permanent)
10. **Booster Pod:** +1 ship value (1F), discard to remove field generator
11. **Data Crystal:** Borrow territory bonus (1F per colony), discard for Positron Field
12. **Cannot use Data Crystal on Burroughs Desert** (multi-turn bonus)
13. **Gravity Manipulator:** Move 1 point between ships (2F), discard for Repulsor Field
14. **Must manipulate two different ships** (cannot move points within same ship)

---

**Next Section:** Alien Tech Cards Part 2 (Pages 14-15)
