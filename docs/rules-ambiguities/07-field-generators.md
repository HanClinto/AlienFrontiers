# Field Generators Ambiguities (Page 12)

## Source Text Review
**Page 12** covers the three field generators: Isolation Field, Positron Field, and Repulsor Field. These are special counters placed on territories that alter rules.

---

## AMBIGUITY #74: Field Generators - General Precedence

**Rule Text:** "The three field generators alter the rules within the territory where they are located and, where there is a conflict, take precedence over alien tech card effects."

**Ambiguity:**
1. What does "take precedence over alien tech card effects" mean exactly?
2. Can you use a Data Crystal to borrow a bonus from a territory with an Isolation Field?
3. Do field generators block ALL alien tech card effects, or only conflicting ones?

**Interpretation:**
1. Field generator rules override alien tech card rules (e.g., Isolation Field blocks Data Crystal from borrowing bonus)
2. NO - Data Crystal specifically states "If the territory has the Isolation Field on it then you cannot use its bonus" (page 13)
3. ONLY CONFLICTING - Field generators don't blanket-block tech cards, only specific conflicts

**Example:** Repulsor Field on Asimov Crater blocks Polarity Device and Orbital Teleporter from swapping/removing colonies. But it doesn't block Booster Pod or Plasma Cannon which don't interact with colonies.

**Digital Implementation:**

```javascript
function canUseAlienTech(card, target) {
  // Check field generator conflicts
  if (card.id === 'DataCrystal' && target.hasField('IsolationField')) {
    return false;  // Cannot borrow bonus from Isolated territory
  }
  
  if (card.id === 'PolarityDevice' && target.hasField('RepulsorField')) {
    return false;  // Cannot swap colonies on Repulsor territory
  }
  
  if (card.id === 'OrbitalTeleporter' && target.hasField('RepulsorField')) {
    return false;  // Cannot remove colonies from Repulsor territory
  }
  
  // No conflict, allow
  return true;
}
```

---

## AMBIGUITY #75: Isolation Field - Placement Timing

**Rule Text:** "The first player to discard a Stasis Beam card will place the Isolation Field counter on a territory of their choice. Any subsequent player who discards a Stasis Beam card will move the counter to another territory."

**Ambiguity:**
1. Can you place/move the Isolation Field on the same turn you acquire Stasis Beam?
2. Can you place/move it during someone else's turn?
3. Does "discard" mean it goes to the discard pile or just that you use it?

**Interpretation:**
1. NO - You can only discard a card you "have not already used on your current turn" (page 13). Since you just acquired it, you used it this turn
2. NO - "You may only discard an alien tech card... then only one discard per turn" implies it's your turn
3. YES - Goes to discard pile (card is consumed)

**Timing:** Acquire Stasis Beam → End turn → Next turn or later, discard it to place/move Isolation Field

**Digital Implementation:**

```javascript
function discardStasisBeam(player, targetTerritory) {
  if (player.phase !== 'main') {
    throw new Error("Can only discard during your turn");
  }
  
  let card = player.hand.find(c => c.id === 'StasisBeam');
  if (!card) {
    throw new Error("Don't have Stasis Beam");
  }
  
  if (card.usedThisTurn) {
    throw new Error("Already used this card this turn");
  }
  
  if (player.discardedThisTurn) {
    throw new Error("Already discarded a card this turn");
  }
  
  // Move Isolation Field
  if (isolationField.location) {
    isolationField.location.removeField('IsolationField');
  }
  
  isolationField.location = targetTerritory;
  targetTerritory.addField('IsolationField');
  
  // Discard card
  player.hand = player.hand.filter(c => c !== card);
  alienTechDiscard.push(card);
  player.discardedThisTurn = true;
  
  // Nullify territory bonus for current controller
  if (targetTerritory.controller) {
    targetTerritory.controller.activeBonuses.delete(targetTerritory.bonus);
  }
}
```

---

## AMBIGUITY #76: Isolation Field - Effect on Current Controller

**Rule Text:** "The Isolation Field nullifies a territory's bonus."

**Ambiguity:**
1. Does the controller lose the bonus immediately when Isolation Field is placed?
2. Can they use the bonus one last time on their current turn before it's nullified?
3. Does the controller still gain +1 VP for controlling the territory?

**Interpretation:**
1. YES - "Nullifies" is immediate (see Ambiguity #66 for Burroughs Desert Relic Ship example)
2. NO - Bonus is nullified immediately, cannot be used
3. YES - Control VP (+1) is separate from territory bonus. You still control the territory, just can't use its bonus

**Digital Implementation:**

```javascript
function placeIsolationField(territory) {
  territory.fields.add('IsolationField');
  
  // Nullify bonus immediately
  if (territory.controller) {
    territory.controller.activeBonuses.delete(territory.bonus);
    
    // Special case: Burroughs Desert
    if (territory.id === 'BurroughsDesert' && relicShip.owner === territory.controller.id) {
      returnRelicShip(territory.controller);
    }
  }
  
  // Controller still has control (+1 VP), just no bonus
}
```

---

## AMBIGUITY #77: Isolation Field - Moving Off Territory

**Rule Text (from Example 2, page 10):** "You must return the Relic Ship to the territory immediately and may not repurchase it until the Isolation Field is moved off Burroughs Desert."

**Ambiguity:**
1. Can you move the Isolation Field on your turn if you have Stasis Beam?
2. Is there any way to remove it without moving it elsewhere?
3. Does Booster Pod discard remove Isolation Field permanently?

**Interpretation:**
1. YES - Discard Stasis Beam to move it to another territory
2. NO - Stasis Beam only moves it, doesn't remove it. But see #3...
3. YES - "Discard a Booster Pod to remove any single field generator from the territory on which it is located. A field generator removed in this manner may be rebuilt in the normal manner at a later time" (page 13)

**Clarification:** "Rebuilt in the normal manner" means someone can discard the appropriate tech card to place it again.

**Digital Implementation:**

```javascript
function discardBoosterPod(player, targetTerritory) {
  // ... validation checks
  
  // Choose which field to remove (if multiple)
  let fieldToRemove = prompt("Which field generator to remove?", 
    targetTerritory.fields);
  
  targetTerritory.removeField(fieldToRemove);
  
  // Field is not "in play" anymore - must be rebuilt
  if (fieldToRemove === 'IsolationField') {
    isolationField.location = null;
    
    // Re-enable bonus if territory controlled
    if (targetTerritory.controller) {
      targetTerritory.controller.activeBonuses.add(targetTerritory.bonus);
      
      // Burroughs Desert: can repurchase Relic Ship now
      if (targetTerritory.id === 'BurroughsDesert') {
        // Already returned in #76, can repurchase on player's turn
      }
    }
  }
  
  // Discard Booster Pod
  player.hand = player.hand.filter(c => c.id !== 'BoosterPod');
  alienTechDiscard.push('BoosterPod');
}
```

---

## AMBIGUITY #78: Positron Field - Victory Point Source

**Rule Text:** "The Positron Field awards one victory point to the player controlling the territory where it is located."

**Ambiguity:**
1. Is this +1 VP in addition to the control VP (+1)?
2. Or is it replacing the control VP?
3. What if no one controls the territory (tie)?

**Interpretation:**
1. IN ADDITION - Controller gets +1 for control, +1 for Positron Field = +2 total
2. Not replacing - it's an additional VP
3. NO VP - If no one controls the territory, no one gets the Positron Field VP

**Example:** You control Herbert Valley with Positron Field:
- Base control: +1 VP
- Positron Field: +1 VP
- Total from this territory: +2 VP (plus you get Herbert Valley bonus)

**Digital Implementation:**

```javascript
function calculateVictoryPoints(player) {
  let vp = 0;
  
  // Colonies
  vp += player.coloniesPlaced;
  
  // Territory control
  for (let territory of player.controlledTerritories) {
    vp += 1;  // Control VP
    
    if (territory.hasField('PositronField')) {
      vp += 1;  // Positron Field bonus
    }
  }
  
  // Alien tech cards
  vp += player.hand.filter(c => c.isVictoryPoint).length;
  
  return vp;
}
```

---

## AMBIGUITY #79: Positron Field - Multiple Territories

**Rule Text:** (Not explicitly stated)

**Ambiguity:** Can you have multiple Positron Fields on different territories?

**Interpretation:** NO - Only one Positron Field exists. "The first player to discard a Data Crystal card will place THE Positron Field counter" (emphasis added). Subsequent discards MOVE it, not create new ones.

**Same applies to all field generators:** One Isolation Field, one Positron Field, one Repulsor Field.

**Digital Implementation:**

```javascript
// Global singletons
const isolationField = {
  location: null  // Territory or null
};

const positronField = {
  location: null
};

const repulsorField = {
  location: null
};

function discardDataCrystal(player, targetTerritory) {
  // ... validation
  
  // Move Positron Field (only one exists)
  if (positronField.location) {
    positronField.location.removeField('PositronField');
  }
  
  positronField.location = targetTerritory;
  targetTerritory.addField('PositronField');
  
  // Discard card
  player.hand = player.hand.filter(c => c.id !== 'DataCrystal');
  alienTechDiscard.push('DataCrystal');
}
```

---

## AMBIGUITY #80: Repulsor Field - "Added or Removed"

**Rule Text:** "The Repulsor Field prevents colonies from being added to or removed from the territory on which it is located."

**Ambiguity:**
1. Does this block Colony Constructor?
2. Does this block Colonist Hub?
3. Does this block Terraforming Station?
4. Does this block Alien Artifact?

**Interpretation:**
1. YES - Cannot place colonies on that territory via Colony Constructor
2. YES - Cannot place colonies on that territory via Colonist Hub
3. YES - Cannot place colonies on that territory via Terraforming Station
4. NO - Alien Artifact doesn't place colonies, it gives you a colony piece for later placement

**Clarification:** Repulsor Field blocks placement/removal, not acquisition of colony pieces.

**Digital Implementation:**

```javascript
function placeColony(player, territory) {
  if (territory.hasField('RepulsorField')) {
    throw new Error("Cannot place colony - Repulsor Field active");
  }
  
  territory.colonies[player.id]++;
  player.coloniesRemaining--;
  updateScore(player, +1);
  updateTerritoryControl(territory);
}

function removeColony(player, territory) {
  if (territory.hasField('RepulsorField')) {
    throw new Error("Cannot remove colony - Repulsor Field active");
  }
  
  territory.colonies[player.id]--;
  player.coloniesRemaining++;
  updateScore(player, -1);
  updateTerritoryControl(territory);
}
```

---

## AMBIGUITY #81: Repulsor Field - Polarity Device and Orbital Teleporter

**Rule Text (Example):** "If the Repulsor Field is on Asimov Crater then no new colonies may be added on that territory and the colonies already there cannot be swapped or removed by discarding a Polarity Device or Orbital Teleporter card."

**Ambiguity:**
1. Does Polarity Device swap colonies between two territories?
2. Can you swap colonies if Repulsor Field is on one territory but not the other?
3. Does Orbital Teleporter remove colonies or just move them?

**Interpretation:**
1. YES - Polarity Device swaps colonies (we'll see details on page 14)
2. NO - If EITHER territory has Repulsor Field, swap is blocked
3. REMOVES - Orbital Teleporter "removes" colonies (gives you colony pieces back)

**Digital Implementation:**

```javascript
function discardPolarityDevice(player, territory1, territory2) {
  // Check Repulsor Fields on BOTH territories
  if (territory1.hasField('RepulsorField') || territory2.hasField('RepulsorField')) {
    throw new Error("Cannot swap - Repulsor Field blocks colony movement");
  }
  
  // Swap colonies
  let temp = territory1.colonies[player.id];
  territory1.colonies[player.id] = territory2.colonies[player.id];
  territory2.colonies[player.id] = temp;
  
  // Update control on both
  updateTerritoryControl(territory1);
  updateTerritoryControl(territory2);
  
  // Discard card
  player.hand = player.hand.filter(c => c.id !== 'PolarityDevice');
  alienTechDiscard.push('PolarityDevice');
}

function discardOrbitalTeleporter(player, targetTerritories) {
  // Check all territories for Repulsor Field
  for (let territory of targetTerritories) {
    if (territory.hasField('RepulsorField')) {
      throw new Error(`Cannot remove from ${territory.id} - Repulsor Field`);
    }
  }
  
  // Remove colonies (up to 3 territories)
  for (let territory of targetTerritories) {
    if (territory.colonies[player.id] > 0) {
      territory.colonies[player.id]--;
      player.coloniesRemaining++;
      updateScore(player, -1);
      updateTerritoryControl(territory);
    }
  }
  
  // Discard card
  player.hand = player.hand.filter(c => c.id !== 'OrbitalTeleporter');
  alienTechDiscard.push('OrbitalTeleporter');
}
```

---

## AMBIGUITY #82: Repulsor Field - Self-Removal

**Rule Text:** "The Repulsor Field does not prevent its own movement or removal, nor does it prevent the movement or removal of any other field generator that is also on that territory."

**Ambiguity:**
1. Can multiple field generators be on the same territory?
2. If so, how do they interact?
3. Can you remove Repulsor Field while it's on a territory?

**Interpretation:**
1. YES - You can have multiple field generators on the same territory
2. ALL ACTIVE - Multiple fields all apply simultaneously (Isolation + Positron + Repulsor possible)
3. YES - Discard Booster Pod to remove Repulsor Field, or discard Gravity Manipulator to move it

**Example:** Territory has Isolation Field and Repulsor Field:
- Bonus nullified (Isolation)
- Cannot add/remove colonies (Repulsor)
- Can still move either field with appropriate tech card

**Digital Implementation:**

```javascript
class Territory {
  constructor(id, bonus) {
    this.id = id;
    this.bonus = bonus;
    this.fields = new Set();  // Can have multiple
    this.colonies = {};
    this.controller = null;
  }
  
  hasField(fieldType) {
    return this.fields.has(fieldType);
  }
  
  addField(fieldType) {
    this.fields.add(fieldType);
    
    if (fieldType === 'IsolationField' && this.controller) {
      this.controller.activeBonuses.delete(this.bonus);
    }
  }
  
  removeField(fieldType) {
    this.fields.delete(fieldType);
    
    if (fieldType === 'IsolationField' && this.controller) {
      this.controller.activeBonuses.add(this.bonus);
    }
  }
}
```

---

## AMBIGUITY #83: Field Generators - "Normal Manner" Rebuild

**Rule Text (Booster Pod):** "A field generator removed in this manner may be rebuilt in the normal manner at a later time."

**Ambiguity:** What is the "normal manner" for rebuilding?

**Interpretation:** Someone must discard the appropriate alien tech card:
- Isolation Field: Discard Stasis Beam
- Positron Field: Discard Data Crystal
- Repulsor Field: Discard Gravity Manipulator

**Clarification:** Removing with Booster Pod doesn't permanently eliminate the field - it just removes it from play. Anyone (including the same player) can rebuild it later by discarding the appropriate tech card.

**Digital Implementation:**

```javascript
function canRebuildField(fieldType) {
  // Fields are always rebuildable if someone has the card
  return {
    'IsolationField': 'StasisBeam',
    'PositronField': 'DataCrystal',
    'RepulsorField': 'GravityManipulator'
  }[fieldType];
}

// Example: Field was removed, now rebuilding
function discardStasisBeamAfterRemoval(player, targetTerritory) {
  // Same as normal placement - Isolation Field is back in play
  discardStasisBeam(player, targetTerritory);
}
```

---

## AMBIGUITY #84: Field Generators - Choosing Target Territory

**Rule Text:** "The first player to discard a [tech card] will place the [field] counter on a territory of their choice."

**Ambiguity:**
1. Can you place a field on a territory you don't control?
2. Can you place a field on a territory with no colonies?
3. Can you move a field to the same territory it's already on?

**Interpretation:**
1. YES - No restriction on control
2. YES - No restriction on colonies (though Positron Field VP won't apply if no one controls it)
3. NO - "Move the counter to ANOTHER territory" implies it must be different

**Strategy Note:** You might place Isolation Field on an opponent's controlled territory to nullify their bonus, or place Repulsor Field on a territory you control to lock in your lead.

**Digital Implementation:**

```javascript
function discardStasisBeam(player, targetTerritory) {
  // ... validation
  
  if (isolationField.location === targetTerritory) {
    throw new Error("Isolation Field already on this territory");
  }
  
  // No restriction on control or colonies
  moveIsolationField(targetTerritory);
  
  // Discard card
  player.hand = player.hand.filter(c => c.id !== 'StasisBeam');
  alienTechDiscard.push('StasisBeam');
  player.discardedThisTurn = true;
}
```

---

## AMBIGUITY #85: Field Generators - Interaction with Territory Control Changes

**Rule Text:** (Not explicitly stated)

**Ambiguity:**
1. If a territory has Positron Field and control changes, who gets the VP?
2. If a territory has Isolation Field and control changes, does the new controller get the bonus?

**Interpretation:**
1. NEW CONTROLLER - Positron Field VP is tied to current control (dynamic)
2. NO BONUS - Isolation Field nullifies bonus regardless of who controls

**Example Timeline:**
- Turn 1: Red controls Herbert Valley with Positron Field (+2 VP total)
- Turn 2: Yellow places colony, takes control of Herbert Valley
- Turn 2: Red loses -2 VP (control + Positron), Yellow gains +2 VP
- Turn 2: Yellow gets Herbert Valley bonus (Isolation Field not present)

**Digital Implementation:**

```javascript
function updateTerritoryControl(territory) {
  let previousController = territory.controller;
  let newController = calculateController(territory);
  
  if (previousController !== newController) {
    // Update VPs
    if (previousController) {
      updateScore(previousController, -1);  // Lose control VP
      
      if (territory.hasField('PositronField')) {
        updateScore(previousController, -1);  // Lose Positron VP
      }
      
      // Remove bonus (if not Isolated)
      if (!territory.hasField('IsolationField')) {
        previousController.activeBonuses.delete(territory.bonus);
      }
    }
    
    if (newController) {
      updateScore(newController, +1);  // Gain control VP
      
      if (territory.hasField('PositronField')) {
        updateScore(newController, +1);  // Gain Positron VP
      }
      
      // Grant bonus (if not Isolated)
      if (!territory.hasField('IsolationField')) {
        newController.activeBonuses.add(territory.bonus);
      }
    }
    
    territory.controller = newController;
  }
}
```

---

## SUMMARY: Critical Field Generator Decisions

**General Rules:**
1. **Only one of each field** exists (Isolation, Positron, Repulsor)
2. **Multiple fields can be on same territory** (all effects apply)
3. **Fields take precedence** over alien tech card effects
4. **Discard timing:** Can only discard on your turn, one per turn, and not a card used this turn

**Isolation Field (Stasis Beam):**
5. **Nullifies territory bonus** immediately (including Relic Ship return)
6. **Doesn't block control VP** (+1 for control still applies)
7. **Blocks Data Crystal** from borrowing bonus
8. **Can be removed** with Booster Pod or moved with another Stasis Beam

**Positron Field (Data Crystal):**
9. **+1 VP to controller** (in addition to +1 control VP)
10. **No controller = no VP** (ties don't get Positron VP)
11. **VP changes with control** (dynamic, not permanent)

**Repulsor Field (Gravity Manipulator):**
12. **Blocks all colony placement** (Constructor, Colonist Hub, Terraforming)
13. **Blocks all colony removal** (Polarity Device, Orbital Teleporter)
14. **Doesn't block Alien Artifact** (gives you colony piece, doesn't place)
15. **Swap blocked if EITHER territory** has Repulsor Field

**Field Removal:**
16. **Booster Pod removes any field** (can be rebuilt later)
17. **Rebuild by discarding appropriate card** (Stasis Beam, Data Crystal, or Gravity Manipulator)
18. **Fields don't prevent their own movement**

---

**Next Section:** Alien Tech Cards Part 1 (Page 13)
