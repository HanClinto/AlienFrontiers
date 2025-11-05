# Orbital Facilities - Rules Ambiguities (v2)

Based on: AlienFrontiersRules-2ndPrint.pdf (2011 Edition)

## General Orbital Facility Rules

**Official Rules Text (Page 7):**
> "Surrounding the planet are the orbital facilities you will use to earn resources, expand your fleet, and land colonies. You may not dock ships at an orbital facility unless docking ports are available and you can meet both the ship and cost requirements."

---

### Ambiguity #31: "Both Ship and Cost Requirements"

**Rule Text:**
> "You may not dock ships at an orbital facility unless docking ports are available and you can meet both the ship and cost requirements."

**Ambiguity:**
Must you be able to pay costs BEFORE docking ships, or can you gain resources from earlier-docked ships and use them to pay for later ships?

**Interpretation:**
You must be able to pay costs IMMEDIATELY when docking. However, within a single facility that requires multiple ships (like Colony Constructor needing 3 ships), you can dock them sequentially if the facility's rules allow it. Resources gained earlier in the turn can be used for later docking actions.

The check happens at the moment you attempt to use the facility, not at the beginning of your turn.

**Digital Implementation:**
```typescript
function canDockAtFacility(
  ships: Ship[],
  facility: Facility,
  player: PlayerState
): boolean {
  // Check 1: Available docking ports
  if (facility.availableDocks < ships.length) {
    return false;
  }
  
  // Check 2: Ship requirements (value, quantity, patterns)
  if (!meetsShipRequirements(ships, facility)) {
    return false;
  }
  
  // Check 3: Can pay costs immediately
  if (!canPayCosts(facility.cost, player)) {
    return false;
  }
  
  return true;
}
```

---

## Alien Artifact

**Official Rules Text (Page 7):**
> "Each ship you dock at the Alien Artifact may be of any value and allows you to discard the alien tech cards on display and lay out three new cards from the deck. This is called 'cycling' and it is optional.
>
> To claim one of the alien tech cards on display you need to have docked ships with a total value of 8 or more. When you claim an alien tech card the count is reset to zero, so, to claim another card you need to dock new ships totaling 8 or more. Replace the claimed card with one from the draw pile. You may not claim an alien tech card you already have. There are enough docking ports to accommodate four ships at a time."

---

### Ambiguity #32: Cycling Before or After Claiming

**Rule Text:**
> "Each ship you dock at the Alien Artifact may be of any value and allows you to discard the alien tech cards on display and lay out three new cards from the deck."

**Ambiguity:**
If you dock ships totaling 8+, can you cycle the cards first to see if you want something different, then claim from the new set? Or must you claim from the current display before cycling?

**Interpretation:**
You can cycle BEFORE claiming. Each ship docked allows one cycle (optional). After all docking and cycling is complete, you check if your total is 8+ and can claim a card.

Order of operations for each ship docked:
1. Dock the ship
2. Optionally cycle the display (discard all 3, draw 3 new)
3. Check running total - if 8+, you may claim a card

**Digital Implementation:**
```typescript
interface AlienArtifactState {
  dockedShips: Ship[];
  displayCards: AlienTechCard[];
}

function dockAtAlienArtifact(
  ship: Ship,
  player: PlayerState,
  artifact: AlienArtifactState
): void {
  // Dock the ship
  artifact.dockedShips.push(ship);
  
  // Player may optionally cycle
  const wantsToCycle = promptPlayerToCycle(player);
  if (wantsToCycle) {
    discardCards(artifact.displayCards);
    artifact.displayCards = drawCards(3);
  }
  
  // Check if can claim (8+ total)
  const total = sumShipValues(artifact.dockedShips);
  if (total >= 8) {
    const canClaim = promptPlayerToClaim(player, artifact.displayCards);
    if (canClaim) {
      claimCard(player, artifact);
    }
  }
}
```

---

### Ambiguity #33: Claiming Multiple Cards Per Turn

**Rule Text:**
> "When you claim an alien tech card the count is reset to zero, so, to claim another card you need to dock new ships totaling 8 or more."

**Ambiguity:**
Can you claim multiple cards in one turn at the Alien Artifact? The rules say the count "resets to zero" - does this mean you can dock more ships to reach 8 again?

**Interpretation:**
You CAN claim multiple cards per turn if you dock enough ships. After claiming a card, the total resets to 0. You can continue docking ships (if ports available) and claim another card when you reach 8+ again.

Maximum possible: 4 ships docked, if they're all 6s (total 24), you could theoretically claim 2 cards (8 for first, 8 for second, 8 remaining).

**Digital Implementation:**
```typescript
function processAlienArtifactTurn(
  player: PlayerState,
  artifact: AlienArtifactState
): void {
  let currentTotal = 0;
  let cardsClaimedThisTurn = 0;
  
  while (player.hasUnplacedShips() && artifact.hasAvailableDocks()) {
    const ship = promptPlayerToSelectShip(player);
    
    // Dock ship
    artifact.dockedShips.push(ship);
    currentTotal += ship.value;
    
    // Optional cycle
    if (promptPlayerToCycle(player)) {
      cycleDisplay(artifact);
    }
    
    // Check for claim
    if (currentTotal >= 8) {
      const card = promptPlayerToSelectCard(player, artifact.displayCards);
      if (card && !player.hasCard(card.name)) {
        claimCard(player, card, artifact);
        cardsClaimedThisTurn += 1;
        currentTotal = 0; // Reset for next claim
      }
    }
  }
}
```

---

### Ambiguity #34: Cycling After Reaching 8

**Rule Text:**
> "After completing the moves in example 2 there is one dock open at the Alien Artifact. You could dock a fourth ship there and cycle the cards again but you could not claim a second alien tech card because the '8 or more' requirement is a separate total for each card you claim."

**Ambiguity:**
If you've already reached 8+ and claimed a card (resetting to 0), can you dock another ship and cycle even if you don't reach 8 again? Is cycling allowed without claiming?

**Interpretation:**
YES - you can dock ships and cycle without claiming. Cycling is independent of claiming. Each ship docked grants one optional cycle, regardless of whether you claim a card.

Scenario: You dock ships totaling 8, claim a card, reset to 0, dock one more ship (total now 1), and cycle. You cannot claim (< 8) but the cycle is still allowed.

**Digital Implementation:**
```typescript
function dockAtAlienArtifact(
  ship: Ship,
  player: PlayerState,
  artifact: AlienArtifactState
): void {
  artifact.dockedShips.push(ship);
  
  // Cycling is always optional, independent of claiming
  if (promptPlayerToCycle(player)) {
    cycleDisplay(artifact);
  }
  
  const total = calculateCurrentTotal(artifact);
  
  // Claiming only available if total >= 8
  if (total >= 8 && hasClaimableCards(artifact, player)) {
    if (promptPlayerToClaim(player)) {
      claimCard(player, artifact);
      resetTotal(artifact); // Next claim needs 8 more
    }
  }
}
```

---

### Ambiguity #35: Already Have Card Rule

**Rule Text:**
> "You may not claim an alien tech card you already have."

**Ambiguity:**
If all 3 cards on display are cards you already have, can you still cycle? Are you forced to cycle until at least one claimable card appears?

**Interpretation:**
You can cycle at any time (it's optional). If all displayed cards are duplicates, you have three options:
1. Don't claim anything (leave ships docked, turn ends)
2. Cycle to try to find a new card
3. Dock another ship and cycle again

You are NOT forced to cycle, and you are NOT forced to keep cycling until a claimable card appears.

**Digital Implementation:**
```typescript
function getClaimableCards(
  displayCards: AlienTechCard[],
  player: PlayerState
): AlienTechCard[] {
  return displayCards.filter(card => !player.hasCard(card.name));
}

function handleAlienArtifactClaim(
  player: PlayerState,
  artifact: AlienArtifactState
): void {
  const total = sumShipValues(artifact.dockedShips);
  
  if (total >= 8) {
    const claimableCards = getClaimableCards(artifact.displayCards, player);
    
    if (claimableCards.length === 0) {
      // No cards to claim (all duplicates)
      // Player can choose to:
      // 1. Cycle (if ships left and ports available)
      // 2. End their turn with ships docked
      promptPlayerForAction(player, ['CYCLE', 'END_TURN']);
    } else {
      // Can claim one of the available cards
      promptPlayerToClaim(player, claimableCards);
    }
  }
}
```

---

## Colonist Hub

**Official Rules Text (Page 7):**
> "The Colonist Hub has four 'advancement tracks' so that four players can use it simultaneously to ready colonies for territory placement. Each track contains three docking ports and seven advancement circles. A player may use only one advancement track at a time.
>
> If you do not have a colony at the Colonist Hub then the first ship docked here requires you to place one of your unplaced colonies on the first advancement circle. Each additional ship you dock here, either on this turn or on subsequent turns, must be placed on this same track until that colony is launched."

---

### Ambiguity #36: Multiple Colonist Hub Ships Per Turn

**Rule Text:**
> "Each additional ship you dock here, either on this turn or on subsequent turns, must be placed on this same track until that colony is launched."

**Ambiguity:**
Can you dock multiple ships at the Colonist Hub in a single turn? There are 3 docking ports per track - can you use all 3 on one turn?

**Interpretation:**
YES - you can dock multiple ships at Colonist Hub in one turn. Each ship advances the colony one circle. If you dock 3 ships in one turn, the colony advances 3 circles.

The 3 docking ports per track allow for 3 ships to be docked simultaneously, possibly from the same player in one turn, or from different turns.

**Digital Implementation:**
```typescript
interface ColonistHubTrack {
  playerId: string | null;
  colonyPosition: number; // 0-7 (0 = no colony, 7 = ready to launch)
  dockedShips: Ship[];     // Up to 3 ships
  maxDocks: 3;
}

function dockAtColonistHub(
  ship: Ship,
  player: PlayerState,
  hub: ColonistHubTrack
): void {
  // First ship: place colony on track
  if (hub.colonyPosition === 0) {
    if (player.coloniesAvailable === 0) {
      throw new Error('No colonies available to place on track');
    }
    hub.playerId = player.id;
    hub.colonyPosition = 1; // Place on first circle
    player.coloniesAvailable -= 1;
  }
  
  // Each ship advances colony one circle
  hub.dockedShips.push(ship);
  hub.colonyPosition = Math.min(hub.colonyPosition + 1, 7);
}
```

---

### Ambiguity #37: Launching Timing

**Rule Text:**
> "When the colony reaches the seventh advancement circle you may launch it at your convenience by paying one fuel and one ore."

**Ambiguity:**
When can you "launch" the colony? Immediately when it reaches the 7th circle? Later in the same turn? On a future turn? Must you launch it before docking more ships?

**Interpretation:**
You can launch "at your convenience" means:
- After reaching 7th circle (not before)
- On the same turn OR future turns
- At any point during your turn (before, during, or after docking other ships)

You do NOT have to launch immediately. The colony can sit on the 7th circle indefinitely until you choose to launch it.

**Digital Implementation:**
```typescript
function canLaunchColony(player: PlayerState, track: ColonistHubTrack): boolean {
  return (
    track.playerId === player.id &&
    track.colonyPosition >= 7 &&
    player.resources.fuel >= 1 &&
    player.resources.ore >= 1
  );
}

function launchColony(
  player: PlayerState,
  track: ColonistHubTrack,
  territory: Territory
): void {
  if (!canLaunchColony(player, track)) {
    throw new Error('Cannot launch colony');
  }
  
  // Pay cost
  player.resources.fuel -= 1;
  player.resources.ore -= 1;
  
  // Place colony on territory
  placeColony(territory, player);
  
  // Clear track
  track.colonyPosition = 0;
  track.playerId = null;
  track.dockedShips = [];
}
```

---

### Ambiguity #38: Excess Advances

**Rule Text:**
> "If you earn more advances than are needed to move your colony to the seventh circle (see Asimov Crater below) and launch the colony immediately, you may use the excess advances to begin work on a new colony."

**Ambiguity:**
How do "excess advances" work? If your colony is on circle 5 and you dock 3 ships (getting 3 advances to reach circle 7+1), do you start a new colony on circle 1 or circle 0?

**Interpretation:**
Excess advances apply to a NEW colony starting from scratch. Example:
- Colony at circle 5
- Dock 3 ships (3 advances)
- Colony moves to circle 6, 7, then you launch it
- 1 excess advance remains
- Place new colony on circle 1 (advance of 1 applied)

You must launch immediately to use excess advances. If you don't launch, excess advances are wasted.

**Digital Implementation:**
```typescript
function dockAtColonistHubWithExcess(
  ships: Ship[],
  player: PlayerState,
  track: ColonistHubTrack,
  shouldLaunch: boolean
): void {
  const advances = ships.length;
  const currentPosition = track.colonyPosition;
  const newPosition = currentPosition + advances;
  
  if (newPosition >= 7 && shouldLaunch) {
    const excessAdvances = newPosition - 7;
    
    // Launch current colony
    const territory = promptPlayerForTerritory(player);
    launchColony(player, track, territory);
    
    // Apply excess to new colony
    if (excessAdvances > 0 && player.coloniesAvailable > 0) {
      track.playerId = player.id;
      track.colonyPosition = excessAdvances; // Start at circle 1, 2, etc.
      player.coloniesAvailable -= 1;
    }
  } else {
    // Normal advance (don't launch or can't reach 7)
    track.colonyPosition = Math.min(newPosition, 7);
  }
}
```

---

### Ambiguity #39: Final Colony Not Locked

**Rule Text:**
> "Your final colony is not locked into the Colonist Hub. If your last colony is on the Colonist Hub and your roll gives you the opportunity to use the Terraforming Station or the Colony Constructor, you may remove the colony from the Colonist Hub and place it on a territory via the rules for those other facilities."

**Ambiguity:**
If you remove your last colony from the Colonist Hub to place via Terraforming Station or Colony Constructor, what happens to the ships you docked at the Colonist Hub? Do the advances count toward anything?

**Interpretation:**
The colony is simply REMOVED from the Colonist Hub track and placed via the other facility. Ships previously docked at Colonist Hub stay there (they were docked on a previous turn and already gathered). The advances on the Colonist Hub track are abandoned.

This is a strategic choice: spend more turns advancing at Colonist Hub (1 fuel + 1 ore to launch) vs. using Colony Constructor (3 ore) or Terraforming Station (1 fuel + 1 ore + lose a 6).

**Digital Implementation:**
```typescript
function removeColonyFromHub(
  player: PlayerState,
  track: ColonistHubTrack
): void {
  if (track.playerId !== player.id) {
    throw new Error('Not your colony on this track');
  }
  
  // Remove colony from track
  track.colonyPosition = 0;
  track.playerId = null;
  // Ships remain docked (were from previous turns)
  
  // Colony is returned to player's available pool
  player.coloniesAvailable += 1;
}

function useTerraformingStationWithHubColony(
  player: PlayerState,
  track: ColonistHubTrack,
  territory: Territory
): void {
  // Remove from hub
  removeColonyFromHub(player, track);
  
  // Use Terraforming Station normally
  useTerraformingStation(player, territory);
}
```

---

## Colony Constructor

**Official Rules Text (Page 8):**
> "You must dock three ships of equal value and pay three ore to use the Colony Constructor. There are enough docking ports for two sets of triples to be docked simultaneously. Using the Colony Constructor allows you to land one of your unplaced colonies on a territory immediately."

---

### Ambiguity #40: Docking Order at Colony Constructor

**Rule Text:**
> "You must dock three ships of equal value and pay three ore"

**Ambiguity:**
Must you dock all 3 ships before paying, or can you dock 1 ship, then 2 more? When exactly is the cost paid?

**Interpretation:**
You must dock all 3 ships to "use" the facility, then pay the cost. The docking is atomic - either all 3 ships dock (and you pay 3 ore), or none dock.

However, you can dock the ships sequentially within your turn as long as all 3 are docked before you claim the benefit.

**Digital Implementation:**
```typescript
function useColonyConstructor(
  ships: [Ship, Ship, Ship],
  player: PlayerState,
  constructor: ColonyConstructor,
  territory: Territory
): void {
  // Validate: all ships equal value
  if (ships[0].value !== ships[1].value || ships[1].value !== ships[2].value) {
    throw new Error('Ships must have equal value');
  }
  
  // Validate: can pay cost
  if (player.resources.ore < 3) {
    throw new Error('Insufficient ore');
  }
  
  // Validate: available docks
  if (constructor.availableDocks < 3) {
    throw new Error('Not enough docking ports');
  }
  
  // Dock all 3 ships
  ships.forEach(ship => constructor.dockShip(ship));
  
  // Pay cost
  player.resources.ore -= 3;
  
  // Place colony immediately
  placeColony(territory, player);
}
```

---

### Ambiguity #41: Territory Choice at Colony Constructor

**Rule Text:**
> "Using the Colony Constructor allows you to land one of your unplaced colonies on a territory immediately."

**Ambiguity:**
Can you place on any territory, or are there restrictions? Can you place on a territory with the Repulsor Field?

**Interpretation:**
You can place on ANY territory that doesn't have the Repulsor Field. The Repulsor Field prevents colonies from being added or removed (this is stated in the Field Generators section).

Otherwise, no restrictions - you can place on empty territories, territories you control, territories others control, etc.

**Digital Implementation:**
```typescript
function getValidTerritoriesForPlacement(board: GameBoard): Territory[] {
  return board.territories.filter(territory => {
    // Cannot place if Repulsor Field is present
    if (territory.hasFieldGenerator('REPULSOR')) {
      return false;
    }
    return true;
  });
}

function placeColonyViaConstructor(
  player: PlayerState,
  territory: Territory
): void {
  if (territory.hasFieldGenerator('REPULSOR')) {
    throw new Error('Cannot place colony: Repulsor Field active');
  }
  
  placeColony(territory, player);
}
```

---

## Lunar Mine

**Official Rules Text (Page 8):**
> "Each new ship docked at the Lunar Mine must be equal to or greater than the highest value ship currently docked here. There are enough docking ports to accommodate five ships at any one time. You gain one ore for each ship you dock here."

---

### Ambiguity #42: Lunar Mine Persistence Across Turns

**Rule Text:**
> "Each new ship docked at the Lunar Mine must be equal to or greater than the highest value ship currently docked here."

**Ambiguity:**
Do ships docked at the Lunar Mine stay there between turns, or are they gathered at the start of each player's turn? How does the "highest value" persist?

**Interpretation:**
Ships stay docked at Lunar Mine until their owner's next turn (like all facilities). The "highest value" check applies to ALL ships currently docked, including ships from previous players' turns.

Example timeline:
- Turn 1, Player A: Docks a 4 at Lunar Mine
- Turn 2, Player B: Must dock 4 or higher (the 4 is still there)
- Turn 3, Player A: Gathers the 4 from Lunar Mine

**Digital Implementation:**
```typescript
interface LunarMine {
  dockedShips: DockedShip[]; // Includes player ID and value
  maxDocks: 5;
}

function getHighestShipValue(mine: LunarMine): number {
  if (mine.dockedShips.length === 0) {
    return 0; // No minimum if empty
  }
  return Math.max(...mine.dockedShips.map(s => s.value));
}

function canDockAtLunarMine(ship: Ship, mine: LunarMine): boolean {
  const highestValue = getHighestShipValue(mine);
  return ship.value >= highestValue && mine.dockedShips.length < mine.maxDocks;
}

function dockAtLunarMine(
  ship: Ship,
  player: PlayerState,
  mine: LunarMine
): void {
  if (!canDockAtLunarMine(ship, mine)) {
    throw new Error('Ship value too low or no docks available');
  }
  
  mine.dockedShips.push({ playerId: player.id, value: ship.value });
  player.resources.ore += 1; // Gain 1 ore per ship
}
```

---

### Ambiguity #43: Multiple Ships at Lunar Mine Per Turn

**Rule Text:**
> "You cannot dock the 3 at the Lunar Mine because it is less than the 4 already docked there, but you can dock both your 4 and your 6. You earn two ore for docking both ships at the Lunar Mine."

**Ambiguity:**
When docking multiple ships in one turn, does each ship check against the original highest value, or against the highest value INCLUDING previously docked ships from the same turn?

**Interpretation:**
Each ship checks against the CURRENT highest value, including ships you just docked. The check is cumulative within the same turn.

Example: Highest is 3. You dock a 4 (OK). Now highest is 4. You dock a 5 (OK, because 5 >= 4). You cannot then dock a 3 (because 3 < 5).

**Digital Implementation:**
```typescript
function dockMultipleAtLunarMine(
  ships: Ship[],
  player: PlayerState,
  mine: LunarMine
): void {
  // Sort ships in ascending order for optimal docking
  const sortedShips = [...ships].sort((a, b) => a.value - b.value);
  
  for (const ship of sortedShips) {
    const currentHighest = getHighestShipValue(mine);
    
    if (ship.value >= currentHighest && mine.dockedShips.length < mine.maxDocks) {
      mine.dockedShips.push({ playerId: player.id, value: ship.value });
      player.resources.ore += 1;
    } else {
      throw new Error(`Cannot dock ship with value ${ship.value} (highest is ${currentHighest})`);
    }
  }
}
```

---

## Maintenance Bay

**Official Rules Text (Page 8):**
> "If you cannot dock a ship legally during your turn, place it here. Maintenance Bay gives the player no benefit. Any ships purchased through the Shipyard or Burroughs Desert are placed here until the player's next turn. A ship on the Maintenance Bay cannot be moved with an alien tech card. Ships removed from facilities with the Plasma Cannon or bumped from the Raiders' Outpost are placed at the Maintenance Bay until their player's next turn."

---

### Ambiguity #44: Maintenance Bay Capacity

**Rule Text:**
> "If you cannot dock a ship legally during your turn, place it here."

**Ambiguity:**
Is there a limit to how many ships can be on the Maintenance Bay? Can multiple players have ships there simultaneously?

**Interpretation:**
Maintenance Bay has UNLIMITED capacity. All players can have ships there simultaneously. It's not a "docking facility" with limited ports - it's a staging area for ships that couldn't be placed elsewhere.

**Digital Implementation:**
```typescript
interface MaintenanceBay {
  ships: Map<string, Ship[]>; // playerId -> ships
  // No maxDocks limit
}

function placeOnMaintenanceBay(
  ship: Ship,
  player: PlayerState,
  bay: MaintenanceBay
): void {
  if (!bay.ships.has(player.id)) {
    bay.ships.set(player.id, []);
  }
  bay.ships.get(player.id)!.push(ship);
  // No capacity check - unlimited
}
```

---

### Ambiguity #45: Orbital Teleporter and Maintenance Bay

**Rule Text:**
> "A ship on the Maintenance Bay cannot be moved with an alien tech card."

**Ambiguity:**
The Orbital Teleporter card says "You may not use the Orbital Teleporter to move a ship off of the Terraforming Station or the Maintenance Bay." Is this redundant, or does it clarify a special case?

**Interpretation:**
This is CLARIFICATION. The general rule is that Maintenance Bay ships can't be moved by alien tech. The Orbital Teleporter specifically calls this out because it's a card that moves ships.

Other cards that might try to affect Maintenance Bay ships (like Plasma Cannon removing ships from facilities) also cannot target Maintenance Bay ships.

**Digital Implementation:**
```typescript
function canMoveShipFromFacility(
  ship: DockedShip,
  fromFacility: Facility
): boolean {
  // Cannot move from Maintenance Bay or Terraforming Station
  if (fromFacility.type === 'MAINTENANCE_BAY') {
    return false;
  }
  if (fromFacility.type === 'TERRAFORMING_STATION') {
    return false;
  }
  return true;
}

function useOrbitalTeleporter(
  ship: DockedShip,
  fromFacility: Facility,
  toFacility: Facility
): void {
  if (!canMoveShipFromFacility(ship, fromFacility)) {
    throw new Error('Cannot move ship from this facility');
  }
  
  // Move ship
  fromFacility.removeShip(ship);
  toFacility.dockShip(ship);
}
```

---

## Orbital Market

**Official Rules Text (Page 8):**
> "You must dock two ships of equal value to use the Orbital Market. There are enough docking ports to accommodate two pairs of ships at any one time. While docked at the Orbital Market you may pay fuel equal to the value of one of your docked ships to receive one ore. You may trade as many times as you wish on your turn."

---

### Ambiguity #46: Trade Ratio at Orbital Market

**Rule Text:**
> "you may pay fuel equal to the value of one of your docked ships to receive one ore"

**Ambiguity:**
If you dock a pair of 5s, do you pay 5 fuel per trade or 10 fuel (both ships' values)? Does "one of your docked ships" mean you choose which ship's value to use?

**Interpretation:**
You pay fuel equal to ONE ship's value (since both are equal, it doesn't matter which). Docking a pair of 5s means each trade costs 5 fuel for 1 ore.

You don't add both ships together - the pair requirement is just to use the facility, but the trade ratio is based on a single ship's value.

**Digital Implementation:**
```typescript
function tradeAtOrbitalMarket(
  dockedShips: [Ship, Ship],
  player: PlayerState,
  timesToTrade: number
): void {
  // Both ships must have equal value
  const tradeRatio = dockedShips[0].value;
  const fuelCost = tradeRatio * timesToTrade;
  
  if (player.resources.fuel < fuelCost) {
    throw new Error('Insufficient fuel for trade');
  }
  
  player.resources.fuel -= fuelCost;
  player.resources.ore += timesToTrade;
}
```

---

### Ambiguity #47: Multiple Trades Per Turn

**Rule Text:**
> "You may trade as many times as you wish on your turn."

**Ambiguity:**
Does "as many times as you wish" mean you can trade unlimited times with one pair of ships, or does it mean you can dock multiple pairs and trade with each?

**Interpretation:**
BOTH. You can:
1. Trade multiple times with one pair (if you have enough fuel)
2. Dock a second pair (if ports available) and trade with them too

There's no limit to the number of trades per turn, only limited by your fuel supply and available docking ports.

**Digital Implementation:**
```typescript
interface OrbitalMarket {
  dockedPairs: Array<[Ship, Ship]>;
  maxPairs: 2;
}

function tradeMultipleTimes(
  player: PlayerState,
  market: OrbitalMarket
): void {
  // Player can trade with any/all docked pairs
  for (const pair of market.dockedPairs) {
    if (pair[0].playerId !== player.id) continue;
    
    const tradeRatio = pair[0].value;
    const maxTrades = Math.floor(player.resources.fuel / tradeRatio);
    
    const timesToTrade = promptPlayerForTradeCount(player, maxTrades);
    tradeAtOrbitalMarket(pair, player, timesToTrade);
  }
}
```

---

### Ambiguity #48: Trading After Gaining Fuel

**Rule Text:**
> "If you acquire three more fuel during your turn you may do the trade again."

**Ambiguity:**
Can you trade, gain more fuel from another facility (like Solar Converter), then return and trade more at the Orbital Market on the same turn?

**Interpretation:**
YES. The example explicitly states this is allowed. You can:
1. Dock at Orbital Market (pair of 3s)
2. Trade twice (6 fuel → 2 ore)
3. Dock at Solar Converter later in your turn (gain 3 fuel)
4. Trade again at Orbital Market (3 fuel → 1 ore)

Benefits are immediate and resources gained can be used immediately.

**Digital Implementation:**
```typescript
function exampleTurnWithMultipleActions(player: PlayerState): void {
  // Dock at Orbital Market
  dockAtOrbitalMarket([ship3a, ship3b], player);
  
  // Trade twice (6 fuel -> 2 ore)
  trade(player, 2); // player.fuel: 10 -> 4, player.ore: 0 -> 2
  
  // Dock at Solar Converter later
  dockAtSolarConverter([ship4], player); // +2 fuel
  // player.fuel: 4 -> 6
  
  // Trade again at Orbital Market (still docked from earlier)
  trade(player, 1); // player.fuel: 6 -> 3, player.ore: 2 -> 3
}
```

---

## Summary (Part 1)

This document identifies **18 ambiguities** (Ambiguities #31-48) for the first 5 orbital facilities:

**Alien Artifact:**
- Cycling can happen before claiming
- Multiple cards can be claimed per turn
- Cycling is independent of claiming
- Cannot claim duplicates, but can cycle to find new cards

**Colonist Hub:**
- Multiple ships can be docked per turn
- Launching timing is flexible ("at your convenience")
- Excess advances apply to new colonies
- Final colony can be removed to use other facilities

**Colony Constructor:**
- All 3 ships must be docked to use facility
- Can place on any territory except those with Repulsor Field
- Territory choice is made when using the facility

**Lunar Mine:**
- Ships persist across turns, creating escalating minimum values
- Each ship checks against current highest (including same-turn docks)
- Multiple ships can be docked per turn

**Maintenance Bay:**
- Unlimited capacity
- Cannot be affected by alien tech cards
- All unplaceable ships go here

**Orbital Market:**
- Trade ratio based on single ship value (not sum of pair)
- Unlimited trades per turn (limited by fuel)
- Can gain fuel and trade again same turn

Next section will cover: **Raiders' Outpost, Shipyard, Solar Converter, and Terraforming Station**
