# Alien Tech Cards Part 2 - Rules Ambiguities (v2)

Based on: AlienFrontiersRules-2ndPrint.pdf (2011 Edition)

## Gravity Manipulator

**Official Rules Text (Page 13):**
> "Each turn you may pay two fuel to decrease the value of one unplaced ship by one point and increase the value of another unplaced ship by one point. You may discard a Gravity Manipulator to place the Repulsor Field on a territory or, if the Repulsor Field is already on a territory, move it to another territory."

---

### Ambiguity #112: Gravity Manipulator Value Transfer

**Rule Text:**
> "decrease the value of one unplaced ship by one point and increase the value of another unplaced ship by one point"

**Ambiguity:**
Must you decrease AND increase (i.e., transfer a point between two ships), or can you do just one action?

**Interpretation:**
You MUST do both actions - this is a point TRANSFER from one ship to another. You cannot:
- Only decrease a ship value
- Only increase a ship value
- The action is atomic: both changes happen together or not at all

**Digital Implementation:**
```typescript
function useGravityManipulator(
  sourceShip: Ship,
  targetShip: Ship,
  player: PlayerState
): void {
  // Must transfer between two different ships
  if (sourceShip === targetShip) {
    throw new Error('Must transfer between two different ships');
  }
  
  // Check value limits
  if (sourceShip.value <= 1) {
    throw new Error('Source ship cannot go below 1');
  }
  if (targetShip.value >= 6) {
    throw new Error('Target ship cannot exceed 6');
  }
  
  // Pay fuel cost
  const fuelCost = getAlienTechFuelCost('GRAVITY_MANIPULATOR', player);
  if (player.resources.fuel < fuelCost) {
    throw new Error('Insufficient fuel');
  }
  
  player.resources.fuel -= fuelCost;
  
  // Transfer point (atomic operation)
  sourceShip.value -= 1;
  targetShip.value += 1;
}
```

---

### Ambiguity #113: Gravity Manipulator Example Clarification

**Rule Text (Example):**
> "You roll a 1, 2, and 5. You pay two fuel and use the Gravity Manipulator to move one point from the 2 to the 5 making those two ships into a 1 and a 6."

**Ambiguity:**
The example says "making those two ships into a 1 and a 6." Does the ship showing 2 become a 1, or does the existing ship showing 1 change?

**Interpretation:**
The ship showing 2 becomes a 1 (after losing a point). The ship showing 5 becomes a 6 (after gaining a point). The ship showing 1 remains a 1.

Final result after transfer:
- Original: 1, 2, 5
- After Gravity Manipulator: 1, 1, 6 (the 2→1, the 5→6)

**Digital Implementation:**
```typescript
// Example implementation
function gravityManipulatorExample() {
  const ships = [
    { value: 1 },
    { value: 2 },
    { value: 5 }
  ];
  
  // Transfer from ship[1] (value 2) to ship[2] (value 5)
  useGravityManipulator(ships[1], ships[2], player);
  
  // Result: [1, 1, 6]
  console.log(ships.map(s => s.value)); // [1, 1, 6]
}
```

---

### Ambiguity #114: Gravity Manipulator on Same Value Ships

**Rule Text:**
> "decrease the value of one unplaced ship by one point and increase the value of another unplaced ship by one point"

**Ambiguity:**
Can you use Gravity Manipulator to transfer between two ships showing the same value (e.g., two 3s)?

**Interpretation:**
YES - you can transfer between ships of the same value. This is useful for creating pairs or specific values.

Example:
- Roll: 3, 3, 4
- Use Gravity Manipulator: Transfer from first 3 to the 4
- Result: 2, 3, 5

**Digital Implementation:**
```typescript
function canUseGravityManipulator(
  sourceShip: Ship,
  targetShip: Ship
): boolean {
  // Ships can have same value (no restriction)
  // Must be different ship objects
  if (sourceShip === targetShip) {
    return false;
  }
  
  // Check value limits
  if (sourceShip.value <= 1 || targetShip.value >= 6) {
    return false;
  }
  
  return true;
}
```

---

## Holographic Decoy

**Official Rules Text (Page 14):**
> "There is no fuel cost associated with this card and it does not have a discard power. While you possess the Holographic Decoy a player may not use the Raiders' Outpost to steal resources from you. If the raiding player wishes to steal an alien tech card from you then they may only take your Holographic Decoy. If the raiding player already has a Holographic Decoy then the stolen card is discarded."

---

### Ambiguity #115: Holographic Decoy Resource Protection

**Rule Text:**
> "a player may not use the Raiders' Outpost to steal resources from you"

**Ambiguity:**
Does this completely prevent resource raiding, or does the raider have the option to take the Holographic Decoy instead?

**Interpretation:**
This COMPLETELY PREVENTS resource raiding. The raider has two options when targeting a player with Holographic Decoy:
1. Choose to raid alien tech card (forced to take Holographic Decoy only)
2. Choose different target player

They cannot raid resources at all.

**Digital Implementation:**
```typescript
function canRaidResources(
  raider: PlayerState,
  victim: PlayerState
): boolean {
  // Holographic Decoy: prevents resource raiding
  if (victim.hasCard('HOLOGRAPHIC_DECOY')) {
    return false;
  }
  
  return true;
}

function useRaidersOutpost(
  raider: PlayerState,
  victim: PlayerState,
  raidType: 'RESOURCES' | 'TECH_CARD'
): void {
  if (raidType === 'RESOURCES' && victim.hasCard('HOLOGRAPHIC_DECOY')) {
    throw new Error('Cannot raid resources from player with Holographic Decoy');
  }
  
  if (raidType === 'TECH_CARD') {
    raidAlienTechCard(raider, victim);
  } else {
    raidResources(raider, victim);
  }
}
```

---

### Ambiguity #116: Forced Holographic Decoy Theft

**Rule Text:**
> "If the raiding player wishes to steal an alien tech card from you then they may only take your Holographic Decoy."

**Ambiguity:**
Can the raider choose NOT to raid tech if they don't want the Holographic Decoy?

**Interpretation:**
YES - the raider can choose:
1. Raid tech card from victim (forced to take Holographic Decoy if victim has it)
2. Raid resources from victim (blocked if victim has Holographic Decoy)
3. Choose different target player

The key is: IF they choose to raid tech from a player with Holographic Decoy, they MUST take the Holographic Decoy (cannot take other cards).

**Digital Implementation:**
```typescript
function raidAlienTechCard(
  raider: PlayerState,
  victim: PlayerState
): AlienTechCard {
  // If victim has Holographic Decoy, MUST take it
  if (victim.hasCard('HOLOGRAPHIC_DECOY')) {
    const decoy = victim.removeCard('HOLOGRAPHIC_DECOY');
    
    // If raider already has one, discard it
    if (raider.hasCard('HOLOGRAPHIC_DECOY')) {
      discardPile.push(decoy);
      return decoy;
    }
    
    raider.addCard(decoy);
    return decoy;
  }
  
  // Normal raid: raider chooses card from victim's hand
  return raiderChoosesCard(raider, victim);
}
```

---

### Ambiguity #117: Holographic Decoy Duplicate Handling

**Rule Text:**
> "If the raiding player already has a Holographic Decoy then the stolen card is discarded."

**Ambiguity:**
Does the raiding action still succeed (resolving the Raiders' Outpost use), even though the card is discarded?

**Interpretation:**
YES - the raid succeeds:
1. Raider uses Raiders' Outpost (sequences ships, chooses victim)
2. Victim loses Holographic Decoy
3. Raider attempts to take it
4. Raider already has one, so stolen Holographic Decoy goes to discard pile
5. Raid is complete (raider used their one-raid-per-turn)

The victim still loses the card, but the raider doesn't gain it.

**Digital Implementation:**
```typescript
function raidHolographicDecoy(
  raider: PlayerState,
  victim: PlayerState
): void {
  const decoy = victim.removeCard('HOLOGRAPHIC_DECOY');
  
  if (raider.hasCard('HOLOGRAPHIC_DECOY')) {
    // Discard stolen card (duplicate)
    discardPile.push(decoy);
    
    // Raid still counts as used
    raider.hasUsedRaidersOutpostThisTurn = true;
  } else {
    // Add to raider's hand
    raider.addCard(decoy);
    raider.hasUsedRaidersOutpostThisTurn = true;
  }
}
```

---

## Orbital Teleporter

**Official Rules Text (Page 14):**
> "Each turn you may pay two fuel to move one of your docked ships from one orbital facility to a different orbital facility. You may only move one of your ships with the Orbital Teleporter but the moved ship may be used at the new facility in conjunction with other as yet unplaced ships from your fleet. You may not reuse the ship at the same facility from which it was removed. You may not change the value of the ship as it moves from one facility to the other. You may not use the Orbital Teleporter to move a ship off of the Terraforming Station or the Maintenance Bay. You may discard the Orbital Teleporter to move any single colony from one territory to another territory. See Repulsor Field above for exceptions."

---

### Ambiguity #118: Orbital Teleporter "Docked Ships"

**Rule Text:**
> "move one of your docked ships from one orbital facility to a different orbital facility"

**Ambiguity:**
Does "docked" mean ships you docked on THIS turn, or any of your ships at facilities (including from previous turns)?

**Interpretation:**
"Docked" means ships currently at facilities, INCLUDING:
- Ships you docked this turn
- Ships that persist at facilities from previous turns (e.g., Lunar Mine, Maintenance Bay)

You CANNOT move:
- Ships in your hand (not docked)
- Ships at Terraforming Station (explicitly forbidden)
- Ships at Maintenance Bay (explicitly forbidden)

**Digital Implementation:**
```typescript
interface Facility {
  name: string;
  dockedShips: Map<string, Ship[]>; // playerId -> ships
}

function canMoveShipWithTeleporter(
  ship: Ship,
  sourceFacility: Facility,
  player: PlayerState
): boolean {
  // Ship must be at a facility
  const playerShipsAtFacility = sourceFacility.dockedShips.get(player.id) || [];
  if (!playerShipsAtFacility.includes(ship)) {
    return false;
  }
  
  // Cannot move from Terraforming Station
  if (sourceFacility.name === 'TERRAFORMING_STATION') {
    return false;
  }
  
  // Cannot move from Maintenance Bay
  if (sourceFacility.name === 'MAINTENANCE_BAY') {
    return false;
  }
  
  return true;
}
```

---

### Ambiguity #119: Orbital Teleporter Reuse Restriction

**Rule Text:**
> "You may not reuse the ship at the same facility from which it was removed."

**Ambiguity:**
Does this mean you cannot move a ship from Facility A to Facility B, then back to Facility A on the same turn?

**Interpretation:**
YES - once you move a ship away from a facility, you cannot return it to that same facility on the same turn. However:
- You CAN move it to a second different facility (A → B, then B → C is allowed if you had multiple Orbital Teleporters)
- The restriction is per-turn, not permanent

**Digital Implementation:**
```typescript
interface TurnState {
  shipMovements: Map<Ship, Facility[]>; // Ship -> list of facilities it moved from
}

function canMoveShipToFacility(
  ship: Ship,
  targetFacility: Facility,
  turn: TurnState
): boolean {
  // Check if ship was moved from this facility earlier this turn
  const movementHistory = turn.shipMovements.get(ship) || [];
  
  if (movementHistory.includes(targetFacility)) {
    return false; // Cannot return to same facility
  }
  
  return true;
}

function moveShipWithTeleporter(
  ship: Ship,
  sourceFacility: Facility,
  targetFacility: Facility,
  player: PlayerState,
  turn: TurnState
): void {
  // Remove from source
  sourceFacility.removeShip(player.id, ship);
  
  // Track movement history
  if (!turn.shipMovements.has(ship)) {
    turn.shipMovements.set(ship, []);
  }
  turn.shipMovements.get(ship)!.push(sourceFacility);
  
  // Add to target
  targetFacility.addShip(player.id, ship);
}
```

---

### Ambiguity #120: Orbital Teleporter and Facility Requirements

**Rule Text:**
> "the moved ship may be used at the new facility in conjunction with other as yet unplaced ships from your fleet"

**Ambiguity:**
If you move a ship to a facility that requires multiple ships (e.g., Colony Constructor requires 3 ships), can the moved ship count toward the requirement?

**Interpretation:**
YES - the moved ship counts toward facility requirements. You can:
1. Move a ship to Colony Constructor
2. Dock 2 more ships from your hand
3. Use Colony Constructor with all 3 ships

The moved ship is treated as if it was just docked there.

**Digital Implementation:**
```typescript
function useColonyConstructorWithTeleporter(
  movedShip: Ship,
  additionalShips: [Ship, Ship],
  player: PlayerState
): void {
  // Move ship to Colony Constructor using Orbital Teleporter
  moveShipWithTeleporter(movedShip, sourceFacility, colonyConstructor, player, turn);
  
  // Dock two more ships from hand
  colonyConstructor.dockShip(player.id, additionalShips[0]);
  colonyConstructor.dockShip(player.id, additionalShips[1]);
  
  // Now have 3 ships total, can use facility
  const allShips = [movedShip, additionalShips[0], additionalShips[1]];
  useColonyConstructor(allShips, player, targetTerritory);
}
```

---

### Ambiguity #121: Orbital Teleporter Example 1

**Rule Text (Example 1):**
> "You roll a 2, 5, and 6. You dock the 6 at the Lunar Mine and receive one ore. You then pay two fuel and use your Orbital Teleporter to move the 6 to the Alien Artifact. Next you dock the 2 at the Alien Artifact to bring the ship total to 8 and claim an alien tech card."

**Ambiguity:**
Does moving a ship to a facility immediately trigger its benefit, or do you need to dock additional ships?

**Interpretation:**
Moving a ship to a facility COUNTS as having a ship there, but does NOT trigger immediate benefits. In the example:
1. Dock 6 at Lunar Mine → gain 1 ore (immediate benefit)
2. Move 6 to Alien Artifact → ship is now at Alien Artifact (total value = 6)
3. Dock 2 at Alien Artifact → total value = 8
4. Total value ≥ 8 → claim alien tech card

The moved ship contributes to the facility's requirements but doesn't trigger benefits until requirements are met.

**Digital Implementation:**
```typescript
function useAlienArtifactWithTeleporter(
  player: PlayerState,
  turn: TurnState
): void {
  // Dock 6 at Lunar Mine
  dockAtLunarMine(ship6, player);
  // -> Gain 1 ore immediately
  
  // Move 6 to Alien Artifact using Orbital Teleporter
  moveShipWithTeleporter(ship6, lunarMine, alienArtifact, player, turn);
  // -> Ship is now at Alien Artifact, current total = 6
  
  // Dock 2 at Alien Artifact
  alienArtifact.dockShip(player.id, ship2);
  // -> Current total = 6 + 2 = 8
  
  // Check if can claim card (total >= 8)
  if (alienArtifact.getTotalValue(player.id) >= 8) {
    claimAlienTechCard(player);
  }
}
```

---

### Ambiguity #122: Orbital Teleporter Ship Value Preservation

**Rule Text:**
> "You may not change the value of the ship as it moves from one facility to the other."

**Ambiguity:**
Is this just clarification (obvious), or does it interact with other effects?

**Interpretation:**
This is a CLARIFICATION that prevents potential exploits with alien tech cards that change ship values. You cannot:
1. Move a ship with Orbital Teleporter
2. Use Booster Pod/Stasis Beam/etc. mid-move to change its value

The ship value is locked during the move. You can change it before or after, but not during.

**Digital Implementation:**
```typescript
function moveShipWithTeleporter(
  ship: Ship,
  sourceFacility: Facility,
  targetFacility: Facility,
  player: PlayerState,
  turn: TurnState
): void {
  // Lock ship value during move
  const originalValue = ship.value;
  
  // Remove from source
  sourceFacility.removeShip(player.id, ship);
  
  // Verify value hasn't changed (safety check)
  if (ship.value !== originalValue) {
    throw new Error('Ship value cannot change during Orbital Teleporter move');
  }
  
  // Add to target
  targetFacility.addShip(player.id, ship);
  
  // Track movement
  if (!turn.shipMovements.has(ship)) {
    turn.shipMovements.set(ship, []);
  }
  turn.shipMovements.get(ship)!.push(sourceFacility);
}
```

---

### Ambiguity #123: Orbital Teleporter Discard Power

**Rule Text:**
> "You may discard the Orbital Teleporter to move any single colony from one territory to another territory. See Repulsor Field above for exceptions."

**Ambiguity:**
Can you move your own colonies, or any player's colony? Can you move a colony to an empty territory?

**Interpretation:**
You can move ANY player's colony (including your own or opponents'). You can move to any territory EXCEPT:
- Territories with Repulsor Field (cannot add colonies)
- The same territory (must move to different territory)

This is a strategic tool for changing territory control.

**Digital Implementation:**
```typescript
function discardOrbitalTeleporterToMoveColony(
  colonyOwner: string,
  sourceTerritory: Territory,
  targetTerritory: Territory,
  player: PlayerState
): void {
  // Cannot move to same territory
  if (sourceTerritory === targetTerritory) {
    throw new Error('Must move to different territory');
  }
  
  // Cannot move from territory with Repulsor Field
  if (sourceTerritory.hasRepulsorField) {
    throw new Error('Repulsor Field prevents colony removal');
  }
  
  // Cannot move to territory with Repulsor Field
  if (targetTerritory.hasRepulsorField) {
    throw new Error('Repulsor Field prevents colony addition');
  }
  
  // Move colony
  sourceTerritory.removeColony(colonyOwner);
  targetTerritory.addColony(colonyOwner);
  
  // Recalculate control for both territories
  recalculateControl(sourceTerritory);
  recalculateControl(targetTerritory);
  
  // Discard card
  discardCardForPower('ORBITAL_TELEPORTER', player);
}
```

---

## Plasma Cannon

**Official Rules Text (Page 14):**
> "Each turn you may pay one fuel per ship to remove other players' ships from one orbital facility. The removed ships are placed on the Maintenance Bay (see example 2 below for an exception to this rule). The Plasma Cannon may only remove ships from a single orbital facility and you may not use the Plasma Cannon on your own ships. You may discard a Plasma Cannon to return one ship belonging to another player to the ship stock. The target player must not be left with fewer than three ships of their color for their next turn. The Relic Ship does not count toward this tally. A ship removed in this manner may be regained via the Shipyard."

---

### Ambiguity #124: Plasma Cannon Fuel Cost

**Rule Text:**
> "pay one fuel per ship to remove other players' ships from one orbital facility"

**Ambiguity:**
Does "one fuel per ship" mean total cost, or 1 fuel per ship removed? Does Pohl Foothills reduce the total or per-ship?

**Interpretation:**
Cost is 1 fuel PER SHIP removed. If you remove 3 ships, you pay 3 fuel. Pohl Foothills reduces the TOTAL cost by 1 fuel (not per ship).

Examples:
- Remove 1 ship: 1 fuel (0 fuel with Pohl Foothills)
- Remove 3 ships: 3 fuel (2 fuel with Pohl Foothills)
- Remove 5 ships: 5 fuel (4 fuel with Pohl Foothills)

**Digital Implementation:**
```typescript
function usePlasmaCannon(
  facility: Facility,
  shipsToRemove: Ship[],
  player: PlayerState
): void {
  let fuelCost = shipsToRemove.length; // 1 fuel per ship
  
  // Pohl Foothills: -1 fuel total
  if (player.controlsTerritory('POHL_FOOTHILLS')) {
    fuelCost = Math.max(fuelCost - 1, 0);
  }
  
  if (player.resources.fuel < fuelCost) {
    throw new Error('Insufficient fuel');
  }
  
  player.resources.fuel -= fuelCost;
  
  // Remove ships to Maintenance Bay
  for (const ship of shipsToRemove) {
    facility.removeShip(ship.ownerId, ship);
    maintenanceBay.addShip(ship.ownerId, ship);
  }
}
```

---

### Ambiguity #125: Plasma Cannon Single Facility Restriction

**Rule Text:**
> "The Plasma Cannon may only remove ships from a single orbital facility"

**Ambiguity:**
Does this mean one facility per turn, or one facility per use? Can you use Plasma Cannon multiple times per turn if you have multiple copies?

**Interpretation:**
One facility per USE. Since you can only use each card once per turn, this effectively means one facility per turn. Even if you somehow had multiple Plasma Cannons (impossible due to duplicate restriction), each use targets one facility.

**Digital Implementation:**
```typescript
function usePlasmaCannon(
  facility: Facility,
  shipsToRemove: Ship[],
  player: PlayerState,
  turn: TurnState
): void {
  // All ships must be from the SAME facility
  for (const ship of shipsToRemove) {
    if (!facility.hasShip(ship)) {
      throw new Error('All ships must be from same facility');
    }
  }
  
  // Cannot remove own ships
  for (const ship of shipsToRemove) {
    if (ship.ownerId === player.id) {
      throw new Error('Cannot remove own ships');
    }
  }
  
  // Pay and remove
  const fuelCost = calculatePlasmaCost(shipsToRemove.length, player);
  player.resources.fuel -= fuelCost;
  
  for (const ship of shipsToRemove) {
    facility.removeShip(ship.ownerId, ship);
    maintenanceBay.addShip(ship.ownerId, ship);
  }
  
  turn.cardsUsedThisTurn.add('PLASMA_CANNON');
}
```

---

### Ambiguity #126: Plasma Cannon and Terraforming Station Exception

**Rule Text (Example 2):**
> "You are the blue player and the red player has a ship on the Terraforming Station. You pay one fuel and use your Plasma Cannon to move the red ship off the Terraforming Station. Ordinarily a ship removed by the Plasma Cannon would go to the Maintenance Bay, but a ship on the Terraforming Station is forfeit on the player's next turn so you return it to the ship stock instead."

**Ambiguity:**
Is this a special rule for Terraforming Station, or does it apply to any situation where a ship would be forfeited?

**Interpretation:**
This is a SPECIAL RULE for Terraforming Station only. Ships at Terraforming Station are "forfeit" (would go to stock on owner's next turn), so when removed by Plasma Cannon they go directly to stock instead of Maintenance Bay.

This prevents the affected player from avoiding the forfeiture penalty.

**Digital Implementation:**
```typescript
function usePlasmaCannon(
  facility: Facility,
  shipsToRemove: Ship[],
  player: PlayerState
): void {
  const fuelCost = calculatePlasmaCost(shipsToRemove.length, player);
  player.resources.fuel -= fuelCost;
  
  for (const ship of shipsToRemove) {
    facility.removeShip(ship.ownerId, ship);
    
    // Special case: Terraforming Station ships go to stock
    if (facility.name === 'TERRAFORMING_STATION') {
      if (ship.isRelicShip) {
        returnRelicShipToBurroughs(ship);
      } else {
        returnShipToStock(ship);
      }
    } else {
      // Normal: go to Maintenance Bay
      maintenanceBay.addShip(ship.ownerId, ship);
    }
  }
}
```

---

### Ambiguity #127: Plasma Cannon Discard Power Minimum Ships

**Rule Text:**
> "You may discard a Plasma Cannon to return one ship belonging to another player to the ship stock. The target player must not be left with fewer than three ships of their color for their next turn."

**Ambiguity:**
How do you count "three ships for their next turn"? Does this include ships that would be forfeited (e.g., at Terraforming Station)?

**Interpretation:**
Count ships that will be AVAILABLE on their next turn:
- Ships on board (docked at facilities)
- Ships on Maintenance Bay
- EXCLUDE ships at Terraforming Station (forfeited next turn)
- EXCLUDE Relic Ship (explicitly stated)

The target player must have at least 3 colored ships remaining AFTER removing one AND accounting for forfeitures.

**Digital Implementation:**
```typescript
function canDiscardPlasmaCannonToRemoveShip(
  victim: PlayerState,
  targetShip: Ship
): boolean {
  // Count ships available for victim's next turn
  let availableShips = 0;
  
  for (const ship of victim.activeShips) {
    // Exclude Relic Ship
    if (ship.isRelicShip) {
      continue;
    }
    
    // Exclude ships at Terraforming Station (forfeit next turn)
    if (ship.location === 'TERRAFORMING_STATION') {
      continue;
    }
    
    // Exclude the ship we're removing
    if (ship === targetShip) {
      continue;
    }
    
    availableShips++;
  }
  
  // Must have at least 3 ships remaining
  return availableShips >= 3;
}

function discardPlasmaCannonToRemoveShip(
  targetShip: Ship,
  victim: PlayerState,
  player: PlayerState
): void {
  if (!canDiscardPlasmaCannonToRemoveShip(victim, targetShip)) {
    throw new Error('Would leave player with fewer than 3 ships');
  }
  
  // Remove ship to stock
  removeShipFromBoard(targetShip);
  returnShipToStock(targetShip);
  
  // Discard Plasma Cannon
  discardCardForPower('PLASMA_CANNON', player);
}
```

---

### Ambiguity #128: Plasma Cannon Example 4 Calculation

**Rule Text (Example 4):**
> "Red has four ships on the board: one at the Lunar Mine, two at the Alien Artifact, and one at the Terraforming Station. You want to discard your Plasma Cannon to remove the ship on the Lunar Mine but you cannot. Doing so would leave Red with three ships now, but on Red's next turn the ship on the Terraforming Station would be forfeited and Red would only have two ships for the next turn."

**Ambiguity:**
Is this calculation correct? Let's verify the count.

**Interpretation:**
The calculation is CORRECT:
- Red has 4 ships total
- Remove 1 (at Lunar Mine) via Plasma Cannon
- Red has 3 remaining NOW
- Red's next turn: 1 ship forfeited (at Terraforming Station)
- Red would have 2 ships for their next turn
- This violates the "at least 3 ships" rule

The Plasma Cannon discard checks FUTURE state (after forfeitures).

**Digital Implementation:**
```typescript
function calculateShipsAvailableNextTurn(player: PlayerState, shipToRemove: Ship): number {
  let count = 0;
  
  for (const ship of player.activeShips) {
    // Skip Relic Ship
    if (ship.isRelicShip) continue;
    
    // Skip ship being removed
    if (ship === shipToRemove) continue;
    
    // Skip ships at Terraforming Station (forfeit next turn)
    if (ship.location === 'TERRAFORMING_STATION') continue;
    
    count++;
  }
  
  return count;
}

// Example 4 verification
function example4() {
  const redPlayer = {
    activeShips: [
      { location: 'LUNAR_MINE', isRelicShip: false },      // Would remove this
      { location: 'ALIEN_ARTIFACT', isRelicShip: false },  // Remains
      { location: 'ALIEN_ARTIFACT', isRelicShip: false },  // Remains
      { location: 'TERRAFORMING_STATION', isRelicShip: false } // Forfeited
    ]
  };
  
  const shipToRemove = redPlayer.activeShips[0];
  const remainingShips = calculateShipsAvailableNextTurn(redPlayer, shipToRemove);
  // Result: 2 (only the two at Alien Artifact)
  // 2 < 3, so cannot use Plasma Cannon discard power
}
```

---

## Polarity Device

**Official Rules Text (Page 15):**
> "Each turn you may pay one fuel to flip one of your unplaced ships to its opposite face. You may discard a Polarity Device to swap the locations of any two colonies on any two territories. See Repulsor Field for exceptions."

---

### Ambiguity #129: Polarity Device Opposite Face

**Rule Text:**
> "flip one of your unplaced ships to its opposite face"

**Ambiguity:**
What is the "opposite face"? How is this calculated for each die value?

**Interpretation:**
"Opposite face" means the sum of opposite faces on a standard die equals 7:
- 1 ↔ 6
- 2 ↔ 5
- 3 ↔ 4

The formula is: opposite = 7 - current

**Digital Implementation:**
```typescript
function getPolarityDeviceOpposite(value: number): number {
  if (value < 1 || value > 6) {
    throw new Error('Invalid ship value');
  }
  return 7 - value;
}

function usePolarityDevice(
  ship: Ship,
  player: PlayerState
): void {
  // Pay fuel cost
  const fuelCost = getAlienTechFuelCost('POLARITY_DEVICE', player);
  player.resources.fuel -= fuelCost;
  
  // Flip to opposite face
  ship.value = getPolarityDeviceOpposite(ship.value);
}

// Examples
function polarityExamples() {
  console.log(getPolarityDeviceOpposite(1)); // 6
  console.log(getPolarityDeviceOpposite(2)); // 5
  console.log(getPolarityDeviceOpposite(3)); // 4
  console.log(getPolarityDeviceOpposite(4)); // 3
  console.log(getPolarityDeviceOpposite(5)); // 2
  console.log(getPolarityDeviceOpposite(6)); // 1
}
```

---

### Ambiguity #130: Polarity Device Discard Power Colony Swap

**Rule Text:**
> "swap the locations of any two colonies on any two territories"

**Ambiguity:**
Can you swap colonies from the same player, or must they be from different players? Can you swap your own two colonies?

**Interpretation:**
You can swap ANY two colonies, including:
- Your own colonies (both from you)
- Opponent colonies (both from same opponent)
- Mixed (one yours, one opponent's)

The only restrictions are:
- Both territories must have at least one colony
- Neither territory can have Repulsor Field

**Digital Implementation:**
```typescript
function discardPolarityDeviceToSwap(
  territory1: Territory,
  colony1Owner: string,
  territory2: Territory,
  colony2Owner: string,
  player: PlayerState
): void {
  // Check Repulsor Field
  if (territory1.hasRepulsorField || territory2.hasRepulsorField) {
    throw new Error('Repulsor Field prevents colony swapping');
  }
  
  // Check colonies exist
  if (!territory1.hasColonyFrom(colony1Owner)) {
    throw new Error('Colony 1 does not exist');
  }
  if (!territory2.hasColonyFrom(colony2Owner)) {
    throw new Error('Colony 2 does not exist');
  }
  
  // Swap colonies (can be same owner or different)
  territory1.removeColony(colony1Owner);
  territory2.removeColony(colony2Owner);
  
  territory1.addColony(colony2Owner);
  territory2.addColony(colony1Owner);
  
  // Recalculate control
  recalculateControl(territory1);
  recalculateControl(territory2);
  
  // Discard card
  discardCardForPower('POLARITY_DEVICE', player);
}
```

---

### Ambiguity #131: Polarity Device Example 2 Strategic Use

**Rule Text (Example 2):**
> "Herbert Valley has two yellow colonies on it and Lem Badlands has two red colonies on it. You discard the Polarity Device and swap one colony from each of those territories. Both territories now have one yellow colony and one red colony so neither red nor yellow control those two territories."

**Ambiguity:**
Can you choose WHICH colony to swap from each territory (if multiple exist from same player)?

**Interpretation:**
YES - you choose which specific colony to swap. In the example:
- Herbert Valley: 2 yellow colonies (you choose one to swap)
- Lem Badlands: 2 red colonies (you choose one to swap)
- Result: Each territory has 1 yellow + 1 red (no control)

This requires tracking individual colonies, not just counts.

**Digital Implementation:**
```typescript
interface Territory {
  colonies: string[]; // Array of player IDs (allows multiple from same player)
}

function discardPolarityDeviceToSwap(
  territory1: Territory,
  colony1Index: number,
  territory2: Territory,
  colony2Index: number,
  player: PlayerState
): void {
  // Get colony owners
  const colony1Owner = territory1.colonies[colony1Index];
  const colony2Owner = territory2.colonies[colony2Index];
  
  // Remove colonies
  territory1.colonies.splice(colony1Index, 1);
  territory2.colonies.splice(colony2Index, 1);
  
  // Add to opposite territories
  territory1.colonies.push(colony2Owner);
  territory2.colonies.push(colony1Owner);
  
  // Recalculate control
  recalculateControl(territory1);
  recalculateControl(territory2);
  
  discardCardForPower('POLARITY_DEVICE', player);
}
```

---

## Summary

This document identifies **20 ambiguities** (Ambiguities #112-131) in 5 more alien tech cards:

**Gravity Manipulator (3 ambiguities):**
- Must transfer point between two ships (atomic operation)
- Example shows 2→1 and 5→6, leaving other ships unchanged
- Can transfer between ships of same value

**Holographic Decoy (3 ambiguities):**
- Completely prevents resource raiding (not optional)
- If raiding tech, MUST take Holographic Decoy (forced)
- Duplicate Holographic Decoy discarded but raid still succeeds

**Orbital Teleporter (6 ambiguities):**
- "Docked" includes ships from previous turns (not just this turn)
- Cannot return ship to same facility same turn
- Moved ship counts toward facility requirements
- Moving doesn't trigger immediate benefits (waits for requirements)
- Ship value locked during move (cannot change mid-move)
- Discard power moves ANY player's colony (except Repulsor Field)

**Plasma Cannon (5 ambiguities):**
- Cost is 1 fuel per ship, Pohl Foothills reduces total by 1
- One facility per use (effectively per turn)
- Terraforming Station exception: ships go to stock (not Maintenance Bay)
- Discard power minimum counts FUTURE ships (after forfeitures)
- Example 4 calculation verified (accounts for Terraforming Station forfeit)

**Polarity Device (3 ambiguities):**
- Opposite face formula: 7 - current value
- Can swap any two colonies (same owner or different)
- Choose specific colony when multiple exist from same player

**Total ambiguities so far: 131 across 8 documents**

Next document should cover: **Alien Tech Cards Part 3** (Resource Cache, Stasis Beam, Temporal Warper)

