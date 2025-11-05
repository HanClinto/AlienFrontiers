# Field Generators - Rules Ambiguities (v2)

Based on: AlienFrontiersRules-2ndPrint.pdf (2011 Edition)

## Field Generators Overview

**Official Rules Text (Page 12):**
> "The three field generators alter the rules within the territory where they are located and, where there is a conflict, take precedence over alien tech card effects."

---

### Ambiguity #85: Field Generator Precedence

**Rule Text:**
> "where there is a conflict, take precedence over alien tech card effects"

**Ambiguity:**
What constitutes a "conflict"? If a field generator affects a territory, does it completely override alien tech cards, or only when they directly conflict?

**Interpretation:**
Field generators take precedence ONLY when there is a DIRECT CONFLICT between the field generator's effect and an alien tech card's effect on the same territory.

Examples of conflicts:
- **Isolation Field on Pohl Foothills** + **Data Crystal trying to use Pohl Foothills bonus**: Field generator wins, bonus cannot be used
- **Repulsor Field on Asimov Crater** + **Polarity Device trying to swap colony**: Field generator wins, swap cannot happen
- **Repulsor Field on territory** + **Orbital Teleporter trying to move colony TO that territory**: Field generator wins, cannot move

Non-conflicts (both can coexist):
- Positron Field on territory + any alien tech card not affecting that territory
- Isolation Field on one territory + tech card affecting a different territory

**Digital Implementation:**
```typescript
interface Territory {
  id: string;
  hasIsolationField: boolean;
  hasPositronField: boolean;
  hasRepulsorField: boolean;
}

function canUseTechOnTerritory(
  card: AlienTechCard,
  territory: Territory,
  action: TechAction
): boolean {
  // Check for conflicts
  
  // Isolation Field: prevents using territory bonus
  if (territory.hasIsolationField && action.type === 'USE_TERRITORY_BONUS') {
    return false; // Field generator wins
  }
  
  // Repulsor Field: prevents colony add/remove
  if (territory.hasRepulsorField && 
      (action.type === 'ADD_COLONY' || action.type === 'REMOVE_COLONY')) {
    return false; // Field generator wins
  }
  
  // No conflict: allow tech card
  return true;
}
```

---

## Isolation Field

**Official Rules Text (Page 12):**
> "The Isolation Field nullifies a territory's bonus. The first player to discard a Stasis Beam card will place the Isolation Field counter on a territory of their choice. Any subsequent player who discards a Stasis Beam card will move the counter to another territory."

---

### Ambiguity #86: Isolation Field Nullification Scope

**Rule Text:**
> "The Isolation Field nullifies a territory's bonus."

**Ambiguity:**
Does this prevent ALL uses of the territory bonus, including via Data Crystal? Does it affect only the controlling player, or everyone?

**Interpretation:**
Isolation Field COMPLETELY nullifies the territory bonus for EVERYONE:
- The controlling player cannot use the bonus
- Other players cannot use Data Crystal to borrow the bonus
- The bonus effectively does not exist while Isolation Field is present

**Digital Implementation:**
```typescript
function getTerritoryBonus(
  territory: Territory,
  player: PlayerState
): TerritoryBonus | null {
  // Isolation Field: no bonus available to anyone
  if (territory.hasIsolationField) {
    return null;
  }
  
  // Check if player controls territory
  if (territory.controller === player.id) {
    return territory.bonus;
  }
  
  return null;
}

function canUseDataCrystalOnTerritory(
  territory: Territory,
  player: PlayerState
): boolean {
  // Isolation Field: cannot use Data Crystal
  if (territory.hasIsolationField) {
    return false;
  }
  
  // Need colonies on territory
  if (territory.colonies.size === 0) {
    return false;
  }
  
  // Burroughs Desert: exempt from Data Crystal
  if (territory.id === 'BURROUGHS_DESERT') {
    return false;
  }
  
  return true;
}
```

---

### Ambiguity #87: Isolation Field Placement and Movement

**Rule Text:**
> "The first player to discard a Stasis Beam card will place the Isolation Field counter on a territory of their choice. Any subsequent player who discards a Stasis Beam card will move the counter to another territory."

**Ambiguity:**
Can you place/move the Isolation Field to the same territory it's already on? Can you choose not to move it? What if all territories are invalid targets?

**Interpretation:**
When discarding a Stasis Beam:
- **First discard (field not on board)**: You MUST place it on any territory of your choice
- **Subsequent discards (field already on board)**: You MUST move it to a DIFFERENT territory

You cannot:
- Decline to place/move the field
- Move it to the same territory it's currently on
- Place it anywhere except a territory (e.g., cannot place it "off the board")

**Digital Implementation:**
```typescript
interface IsolationField {
  isOnBoard: boolean;
  currentTerritory: string | null;
}

function discardStasisBeam(
  player: PlayerState,
  targetTerritory: Territory,
  isolationField: IsolationField
): void {
  if (!player.hasCard('STASIS_BEAM')) {
    throw new Error('Player does not have Stasis Beam');
  }
  
  // Cannot move to same territory
  if (isolationField.isOnBoard && 
      isolationField.currentTerritory === targetTerritory.id) {
    throw new Error('Must move to different territory');
  }
  
  // Remove from old territory
  if (isolationField.isOnBoard && isolationField.currentTerritory) {
    const oldTerritory = getTerritory(isolationField.currentTerritory);
    oldTerritory.hasIsolationField = false;
  }
  
  // Place on new territory
  targetTerritory.hasIsolationField = true;
  isolationField.isOnBoard = true;
  isolationField.currentTerritory = targetTerritory.id;
  
  // Discard card
  discardCard(player, 'STASIS_BEAM');
}
```

---

### Ambiguity #88: Isolation Field and Burroughs Desert

**Rule Text (from Burroughs Desert example 2):**
> "Your Relic Ship is docked at the Lunar Mine. Another player discards a Stasis Beam and places the Isolation Field on Burroughs Desert. You must return the Relic Ship to the territory immediately."

**Ambiguity:**
Is this a special interaction, or does Isolation Field normally force Relic Ship return?

**Interpretation:**
This is a SPECIAL INTERACTION: Isolation Field on Burroughs Desert treats the Relic Ship as part of the "territory bonus" and nullifies it. Therefore:
- Placing Isolation Field on Burroughs Desert immediately returns any active Relic Ship
- While Isolation Field is on Burroughs Desert, the Relic Ship cannot be purchased (even if you control the territory)

This is unique to Burroughs Desert because the Relic Ship IS the bonus.

**Digital Implementation:**
```typescript
function placeIsolationFieldOnBurroughs(
  burroughs: Territory,
  isolationField: IsolationField,
  relicShip: RelicShip
): void {
  // Place Isolation Field
  burroughs.hasIsolationField = true;
  isolationField.currentTerritory = burroughs.id;
  
  // Special case: return Relic Ship if in use
  if (relicShip.location === 'IN_USE') {
    returnRelicShipToBurroughs(relicShip);
  }
}

function canPurchaseRelicShip(
  player: PlayerState,
  burroughs: Territory,
  relicShip: RelicShip
): boolean {
  // Isolation Field prevents purchase
  if (burroughs.hasIsolationField) {
    return false;
  }
  
  // Normal checks...
  return player.controlsTerritory('BURROUGHS_DESERT') &&
         relicShip.location === 'BURROUGHS_DESERT' &&
         player.resources.fuel >= 1 &&
         player.resources.ore >= 1;
}
```

---

## Positron Field

**Official Rules Text (Page 12):**
> "The Positron Field awards one victory point to the player controlling the territory where it is located. The first player to discard a Data Crystal card will place the Positron Field counter on a territory of their choice. Any subsequent player who discards a Data Crystal card will move the counter to another territory."

---

### Ambiguity #89: Positron Field VP Timing

**Rule Text:**
> "awards one victory point to the player controlling the territory"

**Ambiguity:**
Is the +1 VP awarded continuously (added to VP total while you control), or is it a one-time award when placed?

**Interpretation:**
The +1 VP is CONTINUOUS - it's awarded as long as you control the territory with the Positron Field. If control changes, the VP moves to the new controller.

This is similar to territory control VP (which is also continuous). Victory points are recalculated immediately when control changes.

**Digital Implementation:**
```typescript
function calculateVictoryPoints(player: PlayerState, board: GameBoard): number {
  let vp = 0;
  
  // Colonies: 1 VP per colony
  vp += player.coloniesPlaced;
  
  // Territory control: 1 VP per controlled territory
  for (const territory of board.territories) {
    if (territory.controller === player.id) {
      vp += 1;
      
      // Positron Field: +1 VP if on controlled territory
      if (territory.hasPositronField) {
        vp += 1;
      }
    }
  }
  
  // Alien tech cards
  vp += player.alienTechCards.filter(c => c.givesVP).length;
  
  return vp;
}
```

---

### Ambiguity #90: Positron Field on Uncontrolled Territory

**Rule Text:**
> "awards one victory point to the player controlling the territory"

**Ambiguity:**
What if the Positron Field is on an uncontrolled territory (tie for most colonies)? Does anyone get the VP?

**Interpretation:**
NO ONE gets the VP if the territory is uncontrolled. The Positron Field only awards VP to the controlling player. If there's no controller (tie), there's no VP award.

This is consistent with territory bonuses: you need to control the territory to get the benefit.

**Digital Implementation:**
```typescript
function getPositronFieldVP(territory: Territory): number {
  // Only awards VP if territory is controlled
  if (territory.hasPositronField && territory.controller !== null) {
    return 1;
  }
  return 0;
}

function handleControlChange(
  territory: Territory,
  oldController: string | null,
  newController: string | null
): void {
  // Update territory control VP
  if (oldController) {
    const oldPlayer = getPlayer(oldController);
    oldPlayer.victoryPoints -= 1; // Lose control VP
    
    // Also lose Positron Field VP if present
    if (territory.hasPositronField) {
      oldPlayer.victoryPoints -= 1;
    }
  }
  
  if (newController) {
    const newPlayer = getPlayer(newController);
    newPlayer.victoryPoints += 1; // Gain control VP
    
    // Also gain Positron Field VP if present
    if (territory.hasPositronField) {
      newPlayer.victoryPoints += 1;
    }
  }
  
  territory.controller = newController;
}
```

---

### Ambiguity #91: Positron Field Placement Strategy

**Rule Text:**
> "Any subsequent player who discards a Data Crystal card will move the counter to another territory."

**Ambiguity:**
Can you strategically move the Positron Field to a territory you don't control to deny VP to an opponent?

**Interpretation:**
YES - you can move the Positron Field to any territory, including:
- A territory you don't control (denying VP to the controller)
- An uncontrolled territory (no one gets VP)
- A territory controlled by an opponent (giving them +1 VP, but this could be strategic if it moves it away from someone with more VP)

This is a valid strategic choice.

**Digital Implementation:**
```typescript
function discardDataCrystal(
  player: PlayerState,
  targetTerritory: Territory,
  positronField: PositronField
): void {
  if (!player.hasCard('DATA_CRYSTAL')) {
    throw new Error('Player does not have Data Crystal');
  }
  
  // Cannot move to same territory
  if (positronField.isOnBoard && 
      positronField.currentTerritory === targetTerritory.id) {
    throw new Error('Must move to different territory');
  }
  
  // Remove from old territory (update VPs)
  if (positronField.isOnBoard && positronField.currentTerritory) {
    const oldTerritory = getTerritory(positronField.currentTerritory);
    oldTerritory.hasPositronField = false;
    
    // Recalculate VP for old controller
    if (oldTerritory.controller) {
      recalculateVP(getPlayer(oldTerritory.controller));
    }
  }
  
  // Place on new territory (update VPs)
  targetTerritory.hasPositronField = true;
  positronField.isOnBoard = true;
  positronField.currentTerritory = targetTerritory.id;
  
  // Recalculate VP for new controller
  if (targetTerritory.controller) {
    recalculateVP(getPlayer(targetTerritory.controller));
  }
  
  // Discard card
  discardCard(player, 'DATA_CRYSTAL');
}
```

---

## Repulsor Field

**Official Rules Text (Page 12):**
> "The Repulsor Field prevents colonies from being added to or removed from the territory on which it is located. The Repulsor Field does not prevent its own movement or removal, nor does it prevent the movement or removal of any other field generator that is also on that territory. The first player to discard a Gravity Manipulator card will place the Repulsor Field counter on a territory of their choice. Any subsequent player who discards a Gravity Manipulator card will move the counter to another territory."

---

### Ambiguity #92: Repulsor Field Scope

**Rule Text:**
> "prevents colonies from being added to or removed from the territory on which it is located"

**Ambiguity:**
Does this prevent ALL colony additions/removals, including normal placement via Colony Constructor, or only special effects like Polarity Device and Orbital Teleporter?

**Interpretation:**
Repulsor Field prevents ALL colony additions and removals:
- Cannot place new colonies via Colony Constructor
- Cannot remove colonies via Polarity Device
- Cannot move colonies to/from via Orbital Teleporter
- Cannot swap colonies via Polarity Device

The ONLY exception is field generator movement (stated explicitly in rules).

**Digital Implementation:**
```typescript
function canPlaceColonyOnTerritory(
  territory: Territory,
  method: 'COLONY_CONSTRUCTOR' | 'ORBITAL_TELEPORTER'
): boolean {
  // Repulsor Field: prevents all colony additions
  if (territory.hasRepulsorField) {
    return false;
  }
  
  // Other checks...
  return true;
}

function canRemoveColonyFromTerritory(
  territory: Territory,
  method: 'POLARITY_DEVICE' | 'ORBITAL_TELEPORTER'
): boolean {
  // Repulsor Field: prevents all colony removals
  if (territory.hasRepulsorField) {
    return false;
  }
  
  // Other checks...
  return true;
}
```

---

### Ambiguity #93: Repulsor Field and Colony Constructor

**Rule Text:**
> "prevents colonies from being added to or removed from the territory"

**Ambiguity:**
If Repulsor Field is on a territory, can you still use Colony Constructor but place the colony on a different territory?

**Interpretation:**
YES - Colony Constructor allows you to place a colony on "any territory of your choice" (except those with Repulsor Field). You can still use the facility, just not target the Repulsor Field territory.

This is different from Isolation Field (which nullifies the bonus itself). Repulsor Field only prevents targeting that specific territory.

**Digital Implementation:**
```typescript
function useColonyConstructor(
  ships: [Ship, Ship, Ship],
  player: PlayerState,
  targetTerritory: Territory
): void {
  // Repulsor Field: cannot target this territory
  if (targetTerritory.hasRepulsorField) {
    throw new Error('Cannot place colony on territory with Repulsor Field');
  }
  
  // Pay cost
  const cost = getColonyConstructorCost(player);
  if (player.resources.ore < cost) {
    throw new Error('Insufficient ore');
  }
  
  player.resources.ore -= cost;
  
  // Place colony
  placeColony(targetTerritory, player);
}
```

---

### Ambiguity #94: Repulsor Field Movement Immunity

**Rule Text:**
> "The Repulsor Field does not prevent its own movement or removal, nor does it prevent the movement or removal of any other field generator that is also on that territory."

**Ambiguity:**
How can multiple field generators be on the same territory? Are they stacked?

**Interpretation:**
YES - multiple field generators CAN be on the same territory simultaneously:
- Isolation Field + Positron Field on same territory
- Isolation Field + Repulsor Field on same territory
- All 3 field generators on same territory (theoretically possible)

When moving a field generator (by discarding the appropriate tech card), you can place it on a territory that already has other field generators. The Repulsor Field does NOT prevent field generator movement.

**Digital Implementation:**
```typescript
interface Territory {
  id: string;
  hasIsolationField: boolean;
  hasPositronField: boolean;
  hasRepulsorField: boolean;
  colonies: Map<string, number>;
}

function canMoveFieldGenerator(
  fieldType: 'ISOLATION' | 'POSITRON' | 'REPULSOR',
  targetTerritory: Territory
): boolean {
  // Field generators can ALWAYS be placed on any territory
  // Repulsor Field does NOT block field generator movement
  return true;
}

function discardGravityManipulator(
  player: PlayerState,
  targetTerritory: Territory,
  repulsorField: RepulsorField
): void {
  // Move Repulsor Field to target territory
  // Even if target already has other field generators
  
  if (repulsorField.isOnBoard && repulsorField.currentTerritory) {
    const oldTerritory = getTerritory(repulsorField.currentTerritory);
    oldTerritory.hasRepulsorField = false;
  }
  
  targetTerritory.hasRepulsorField = true;
  repulsorField.currentTerritory = targetTerritory.id;
  
  discardCard(player, 'GRAVITY_MANIPULATOR');
}
```

---

### Ambiguity #95: Repulsor Field and Polarity Device

**Rule Text (Example):**
> "If the Repulsor Field is on Asimov Crater then no new colonies may be added on that territory and the colonies already there cannot be swapped or removed by discarding a Polarity Device or Orbital Teleporter card."

**Ambiguity:**
Can you use Polarity Device to swap two colonies if NEITHER territory has a Repulsor Field, even if one exists elsewhere?

**Interpretation:**
YES - Polarity Device can swap colonies between two territories as long as NEITHER territory has a Repulsor Field. The Repulsor Field only protects the specific territory it's on.

To swap colonies using Polarity Device:
- Source territory: must NOT have Repulsor Field
- Destination territory: must NOT have Repulsor Field

If either territory has a Repulsor Field, the swap is blocked.

**Digital Implementation:**
```typescript
function canSwapColoniesWithPolarityDevice(
  territory1: Territory,
  territory2: Territory
): boolean {
  // Both territories must allow colony changes
  if (territory1.hasRepulsorField || territory2.hasRepulsorField) {
    return false;
  }
  
  // Both territories must have at least one colony to swap
  if (territory1.colonies.size === 0 || territory2.colonies.size === 0) {
    return false;
  }
  
  return true;
}

function swapColonies(
  territory1: Territory,
  colony1Owner: string,
  territory2: Territory,
  colony2Owner: string
): void {
  if (!canSwapColoniesWithPolarityDevice(territory1, territory2)) {
    throw new Error('Cannot swap colonies with Repulsor Field present');
  }
  
  // Remove colonies
  territory1.removeColony(colony1Owner);
  territory2.removeColony(colony2Owner);
  
  // Add to opposite territories
  territory1.addColony(colony2Owner);
  territory2.addColony(colony1Owner);
  
  // Recalculate control for both territories
  recalculateControl(territory1);
  recalculateControl(territory2);
}
```

---

### Ambiguity #96: Repulsor Field Strategic Placement

**Rule Text:**
> "The first player to discard a Gravity Manipulator card will place the Repulsor Field counter on a territory of their choice."

**Ambiguity:**
Can you place the Repulsor Field on a territory you control to "lock in" your control?

**Interpretation:**
YES - this is a valid strategic use of the Repulsor Field:
- Place it on a territory you control with more colonies than opponents
- Prevents opponents from adding colonies to catch up
- "Locks in" your control of that territory
- Also prevents YOU from adding more colonies, but if you already have control, this may be acceptable

Conversely, you can place it on an opponent's controlled territory to prevent them from adding more colonies (but also prevents them from losing colonies).

**Digital Implementation:**
```typescript
function placeRepulsorFieldStrategically(
  player: PlayerState,
  territory: Territory
): void {
  // Valid strategies:
  
  // 1. Lock in your control
  if (territory.controller === player.id) {
    // You control this territory
    // Repulsor Field prevents opponents from adding colonies
    // You cannot add more, but you maintain control
  }
  
  // 2. Prevent opponent expansion
  if (territory.controller !== player.id && territory.controller !== null) {
    // Opponent controls this territory
    // Repulsor Field prevents them from adding more colonies
    // But also prevents you from catching up
  }
  
  // 3. Freeze contested territory
  if (territory.controller === null) {
    // Territory is contested (tie)
    // Repulsor Field freezes current state
    // No one can change colony counts
  }
  
  // Place field
  territory.hasRepulsorField = true;
}
```

---

## Summary

This document identifies **12 ambiguities** (Ambiguities #85-96) in Field Generators:

**General Field Generator Rules (1 ambiguity):**
- Field generators take precedence over tech cards ONLY when there's a direct conflict

**Isolation Field (4 ambiguities):**
- Nullifies territory bonus for everyone (including Data Crystal)
- Must be placed/moved to different territory each discard
- Special interaction with Burroughs Desert (returns Relic Ship, prevents purchase)
- Cannot be placed on same territory twice in a row

**Positron Field (3 ambiguities):**
- +1 VP is continuous (awarded while controlling territory)
- No VP awarded if territory is uncontrolled
- Can be strategically placed to deny VP or give VP to opponents

**Repulsor Field (5 ambiguities):**
- Prevents ALL colony additions/removals (including Colony Constructor)
- Can still use Colony Constructor to place on different territory
- Multiple field generators can stack on same territory
- Protects colonies from Polarity Device and Orbital Teleporter
- Can be strategically placed to lock in control or freeze territory

**Total ambiguities so far: 96 across 6 documents**

Next document should cover: **Alien Tech Cards** (12 cards, likely split into 2-3 documents)

