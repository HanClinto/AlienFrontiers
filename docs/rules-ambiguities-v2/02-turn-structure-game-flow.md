# Turn Structure and Game Flow - Rules Ambiguities (v2)

Based on: AlienFrontiersRules-2ndPrint.pdf (2011 Edition)

## Turn Overview

**Official Rules Text (Page 6):**
> "Play begins with player one and moves clockwise. Each player performs the following tasks on their turn:
> 
> **Gather and Roll Your Fleet** - Gather all of your ships from the board and roll them.
>
> **Use Alien Tech Cards and Assign Your Fleet** - Do these tasks in any order you like. You may choose to use all, some, or none of your alien tech cards but you must dock all of your ships at orbital facilities on your turn if possible. If you cannot legally dock one or more of your ships at any orbital facility, place them on the Maintenance Bay."

---

### Ambiguity #16: Gather Phase Timing

**Rule Text:**
> "Gather all of your ships from the board and roll them."

**Ambiguity:**
When exactly do you gather ships? Before or after the previous player's turn completely ends? Can the previous player see your roll before their turn officially ends?

**Interpretation:**
Gathering and rolling happens at the START of your turn, after the previous player's turn has completely ended. The sequence is:
1. Previous player ends their turn
2. Your turn begins
3. You gather all ships from the board
4. You roll all ships immediately
5. You proceed with your turn

Players do not roll "in advance" during another player's turn.

**Digital Implementation:**
```typescript
interface TurnPhase {
  GATHER_AND_ROLL = 'GATHER_AND_ROLL',
  USE_TECH_AND_ASSIGN = 'USE_TECH_AND_ASSIGN',
  END_TURN = 'END_TURN'
}

function startTurn(player: PlayerState, board: GameBoard): void {
  // Phase 1: Gather and Roll
  const shipsToGather = board.getAllShipsForPlayer(player.id);
  player.shipsInHand = rollDice(shipsToGather.length);
  
  // Phase 2 begins after roll is complete
  player.currentPhase = TurnPhase.USE_TECH_AND_ASSIGN;
}
```

---

### Ambiguity #17: Ships from Terraforming Station

**Rule Text:**
> "The ship docked at the Terraforming Station is completely consumed by the colony creation process and is returned to the ship stock at the beginning of your next turn."

**Ambiguity:**
Do you gather the ship from the Terraforming Station during the "Gather and Roll Your Fleet" phase, or does it go directly to the ship stock (skipping your hand)?

**Interpretation:**
The ship at the Terraforming Station does NOT get gathered and rolled. It goes directly from the Terraforming Station to the ship stock at the beginning of your turn, BEFORE you gather your other ships. This happens automatically and is not optional.

Order of operations:
1. Turn begins
2. Return Terraforming Station ship to stock (if applicable)
3. Gather remaining ships from board
4. Roll all gathered ships

**Digital Implementation:**
```typescript
function startTurn(player: PlayerState, board: GameBoard): void {
  // Step 1: Handle Terraforming Station forfeit
  const terraformShip = board.getShipAt('TERRAFORMING_STATION', player.id);
  if (terraformShip) {
    returnShipToStock(player, terraformShip);
    board.removeShip('TERRAFORMING_STATION', terraformShip);
  }
  
  // Step 2: Gather remaining ships
  const shipsToGather = board.getAllShipsForPlayer(player.id);
  
  // Step 3: Roll gathered ships
  player.shipsInHand = rollDice(shipsToGather.length);
}
```

---

### Ambiguity #18: Ships from Maintenance Bay

**Rule Text:**
> "Any ships purchased through the Shipyard or Burroughs Desert are placed here until the player's next turn."

**Ambiguity:**
When you "gather all of your ships from the board", does this include ships on the Maintenance Bay? Or do Maintenance Bay ships get claimed separately before gathering?

**Interpretation:**
Ships on the Maintenance Bay ARE gathered and rolled during the normal "Gather and Roll Your Fleet" phase. The Maintenance Bay is part of "the board" for gathering purposes. All ships on facilities (including Maintenance Bay) are gathered and rolled together.

**Digital Implementation:**
```typescript
function getAllShipsForPlayer(board: GameBoard, playerId: string): Ship[] {
  const ships: Ship[] = [];
  
  // Gather from all facilities including Maintenance Bay
  for (const facility of board.facilities) {
    const playerShips = facility.getShipsForPlayer(playerId);
    ships.push(...playerShips);
  }
  
  // Maintenance Bay is a facility, so its ships are included
  return ships;
}
```

---

### Ambiguity #19: Alien Tech Usage Timing

**Rule Text:**
> "You may use your alien tech cards at any time during your turn."

**Ambiguity:**
Can you use alien tech cards BEFORE rolling your dice? Can you use Booster Pod or Gravity Manipulator on dice that haven't been rolled yet?

**Interpretation:**
Alien tech cards can only be used AFTER rolling. The turn structure is:
1. Gather and roll (roll happens first)
2. Use tech cards and assign fleet (tech comes after rolling)

Cards like Booster Pod say "increase the value of one of your **unplaced** ships" - this refers to rolled dice that haven't been docked yet, not unrolled dice.

**Digital Implementation:**
```typescript
function startTurn(player: PlayerState): void {
  // Phase 1: Gather and Roll (mandatory, happens first)
  player.shipsInHand = rollDice(player.shipCount);
  
  // Phase 2: Use Tech and Assign (tech can modify rolled values)
  player.canUseTechCards = true;
  player.unplacedShips = [...player.shipsInHand];
}

function useBoosterPod(player: PlayerState, shipIndex: number): void {
  if (!player.canUseTechCards) {
    throw new Error('Cannot use tech cards before rolling');
  }
  
  // Modify an unplaced (rolled but not docked) ship
  player.unplacedShips[shipIndex] += 1;
}
```

---

### Ambiguity #20: Must Dock All Ships Rule

**Rule Text:**
> "you must dock all of your ships at orbital facilities on your turn if possible"

**Ambiguity:**
What does "if possible" mean? If you could dock a ship at a less-optimal facility, must you do so even if you'd prefer to save it for a better combination? Must you exhaust all technically legal placements?

**Interpretation:**
"If possible" means "if a legal docking exists". If you CAN legally dock a ship anywhere (has available ports, meets requirements, can pay costs), you MUST dock it somewhere. You cannot voluntarily leave ships undocked if legal placements exist.

However, you have discretion in WHERE to dock ships. You're not required to make the "best" play, just any legal play.

If no legal docking exists (all facilities full, can't meet requirements, can't pay costs), then the ship goes to Maintenance Bay.

**Digital Implementation:**
```typescript
function canDockShipAnywhere(
  ship: Ship, 
  board: GameBoard, 
  player: PlayerState
): boolean {
  for (const facility of board.facilities) {
    if (canDockShipAt(ship, facility, player)) {
      return true;
    }
  }
  return false;
}

function endTurnValidation(player: PlayerState, board: GameBoard): void {
  for (const ship of player.unplacedShips) {
    if (canDockShipAnywhere(ship, board, player)) {
      throw new Error('You must dock all ships if possible');
    }
  }
  
  // All ships that couldn't be docked are now on Maintenance Bay
  player.shipsOnMaintenanceBay = [...player.unplacedShips];
}
```

---

### Ambiguity #21: Immediate Benefits Rule

**Rule Text:**
> "You gain the benefits of an orbital facility, territory control, or alien tech immediately unless noted otherwise."

**Ambiguity:**
What does "immediately" mean? Can you use gained resources in the same action? If you dock at Lunar Mine and get ore, can you immediately use that ore at Colony Constructor?

**Interpretation:**
"Immediately" means benefits are gained as soon as the ship is docked, and those benefits CAN be used later in the same turn. Resources gained from one facility can be spent at another facility docked later in the same turn.

Order matters: You must dock ships sequentially, gaining benefits before docking the next ship.

**Digital Implementation:**
```typescript
function dockShip(
  ship: Ship, 
  facility: Facility, 
  player: PlayerState
): void {
  // Validate can dock
  if (!canDockShipAt(ship, facility, player)) {
    throw new Error('Cannot dock ship at this facility');
  }
  
  // Pay costs first
  payCosts(facility.cost, player);
  
  // Dock the ship
  facility.dockShip(ship);
  
  // Grant benefits immediately (synchronously)
  const benefits = facility.getBenefits(ship);
  applyBenefits(benefits, player);
  
  // Player can now use these benefits for subsequent actions
}

// Example: Lunar Mine then Colony Constructor
function exampleTurn(player: PlayerState): void {
  // Dock 6 at Lunar Mine, gain 1 ore
  dockShip(ship6, LUNAR_MINE, player); // player.ore += 1
  
  // Now player has enough ore to use Colony Constructor
  dockShip(ship4a, COLONY_CONSTRUCTOR, player);
  dockShip(ship4b, COLONY_CONSTRUCTOR, player);
  dockShip(ship4c, COLONY_CONSTRUCTOR, player);
  // Can pay 3 ore (had 2, gained 1 from Lunar Mine)
}
```

---

### Ambiguity #22: Colony Placement Victory Points

**Rule Text:**
> "If you place a colony during your turn you earn a victory point and adjust the score track immediately."

**Ambiguity:**
Do you gain the victory point when the colony is placed on the board, or when you gain control of the territory? If you place a colony but don't gain control (tied), do you still get the point?

**Interpretation:**
You gain the victory point for PLACING the colony on the board, regardless of whether you control the territory. Victory points are scored separately:
- +1 VP for each colony on the board (yours)
- +1 VP for each territory you control

If you place a colony but don't control the territory (tied), you get +1 VP for the colony only.

**Digital Implementation:**
```typescript
function placeColony(
  territory: Territory, 
  player: PlayerState,
  board: GameBoard
): void {
  // Place the colony
  territory.addColony(player.id);
  player.coloniesAvailable -= 1;
  
  // +1 VP for placing the colony (always happens)
  player.victoryPoints += 1;
  
  // Check for territory control change
  const previousController = territory.controller;
  const newController = calculateControl(territory);
  
  if (previousController !== newController) {
    handleControlChange(territory, previousController, newController);
  }
  
  updateScoreboard(board);
}

function calculateVictoryPoints(player: PlayerState, board: GameBoard): number {
  let vp = 0;
  
  // +1 VP per colony on board
  vp += board.getColoniesForPlayer(player.id).length;
  
  // +1 VP per territory controlled
  vp += board.getTerritoriesControlledBy(player.id).length;
  
  // +1 VP for Alien City card
  if (player.hasAlienTechCard('ALIEN_CITY')) vp += 1;
  
  // +1 VP for Alien Monument card
  if (player.hasAlienTechCard('ALIEN_MONUMENT')) vp += 1;
  
  // +1 VP for controlling territory with Positron Field
  if (board.positronField && board.positronField.controller === player.id) {
    vp += 1;
  }
  
  return vp;
}
```

---

### Ambiguity #23: Territory Control Change Timing

**Rule Text:**
> "If colony placement results in your having more colonies on the territory than any other player, you 'control' that territory. You take its counter, gain an extra victory point, and may use the territory's bonus."

**Ambiguity:**
When exactly do you gain/lose control? If you place a colony and gain control, can you use that territory's bonus immediately on the same turn? When do you lose the +1 VP for losing control?

**Interpretation:**
Control changes happen IMMEDIATELY when colony placement resolves. If you gain control:
- Take the territory card immediately
- Gain +1 VP immediately (in addition to +1 VP for placing the colony)
- You can use the territory bonus later in the same turn (if applicable)

If you lose control:
- Return the territory card immediately
- Lose -1 VP immediately
- You can no longer use the territory bonus

**Digital Implementation:**
```typescript
function handleControlChange(
  territory: Territory,
  oldController: string | null,
  newController: string | null
): void {
  // Remove control from previous controller
  if (oldController) {
    const oldPlayer = getPlayer(oldController);
    oldPlayer.controlledTerritories.delete(territory.id);
    oldPlayer.victoryPoints -= 1; // Lose control VP immediately
  }
  
  // Grant control to new controller
  if (newController) {
    const newPlayer = getPlayer(newController);
    newPlayer.controlledTerritories.add(territory.id);
    newPlayer.victoryPoints += 1; // Gain control VP immediately
    territory.controller = newController;
  } else {
    territory.controller = null; // Tied, no one controls
  }
}

// Example: Can use newly controlled territory bonus same turn
function exampleControlBonus(player: PlayerState): void {
  // Place colony, gain control of Heinlein Plains
  placeColony(HEINLEIN_PLAINS, player, board);
  // Now player controls Heinlein Plains
  
  // Later in same turn: dock at Orbital Market
  // Heinlein Plains bonus: 1:1 trade ratio at Orbital Market
  dockShipAt(ORBITAL_MARKET, player); // Can use bonus immediately
}
```

---

### Ambiguity #24: End of Turn Resource Limit

**Rule Text:**
> "If you have more than eight total resource tokens at the end of your turn you must return your choice of excess tokens to the appropriate resource stocks."

**Ambiguity:**
Does "total resource tokens" mean fuel + ore combined? Can you have 8 fuel and 8 ore (16 total), or must fuel + ore ≤ 8?

**Interpretation:**
"Total resource tokens" means fuel + ore COMBINED. Maximum is 8 total resources in any combination. Examples:
- 8 fuel + 0 ore = OK (8 total)
- 5 fuel + 3 ore = OK (8 total)
- 6 fuel + 3 ore = Must discard 1 (9 total)
- 8 fuel + 8 ore = Must discard 8 (16 total)

**Digital Implementation:**
```typescript
interface Resources {
  fuel: number;
  ore: number;
}

const MAX_RESOURCES = 8;

function endTurn(player: PlayerState): void {
  const totalResources = player.resources.fuel + player.resources.ore;
  
  if (totalResources > MAX_RESOURCES) {
    const excess = totalResources - MAX_RESOURCES;
    promptPlayerToDiscardResources(player, excess);
  }
  
  // Move to next player
  nextPlayer();
}

function discardResources(
  player: PlayerState, 
  fuelToDiscard: number, 
  oreToDiscard: number
): void {
  if (fuelToDiscard + oreToDiscard !== getExcessResources(player)) {
    throw new Error('Must discard exact excess amount');
  }
  
  player.resources.fuel -= fuelToDiscard;
  player.resources.ore -= oreToDiscard;
}
```

---

### Ambiguity #25: When to Discard Excess Resources

**Rule Text:**
> "If you have more than eight total resource tokens at the end of your turn"

**Ambiguity:**
Can you go over 8 resources during your turn, or must you stay at ≤8 at all times? Can you gain 10 ore then spend 3 before end of turn?

**Interpretation:**
You can TEMPORARILY exceed 8 resources during your turn. The limit is only checked at END of turn. You can gain resources, spend some, and as long as you end with ≤8, no discard is required.

This allows tactical resource management (e.g., gain 5 ore, spend 2 at Colony Constructor, end with 3).

**Digital Implementation:**
```typescript
function dockAtLunarMine(player: PlayerState, ships: Ship[]): void {
  // Can temporarily exceed max during turn
  player.resources.ore += ships.length;
  // No limit check here
}

function useColonyConstructor(player: PlayerState): void {
  if (player.resources.ore < 3) {
    throw new Error('Insufficient ore');
  }
  player.resources.ore -= 3;
  // Can spend resources to get back under limit
}

function endTurn(player: PlayerState): void {
  // Only check limit at end of turn
  enforceResourceLimit(player);
}
```

---

## End of Game and Scoring

**Official Rules Text (Page 6):**
> "Scoring is not cumulative. It is a snapshot of the current board and hand situation at any single point in time. Use the scoreboard to track the current standings throughout the game. Your score will fluctuate up and down as the game progresses, and each time circumstances change the scoreboard should be updated.
>
> You score 1 victory point for...
> - Each of your colony tokens on a territory
> - Each territory you control
> - Having the Alien City card
> - Having the Alien Monument card
> - Controlling the territory with the Positron Field
>
> The game ends as soon as one player places their last colony on a territory."

---

### Ambiguity #26: Scoring "Not Cumulative"

**Rule Text:**
> "Scoring is not cumulative. It is a snapshot of the current board and hand situation at any single point in time."

**Ambiguity:**
What does "not cumulative" mean? Players aren't "banking" points that can't be lost?

**Interpretation:**
Victory points are RECALCULATED from scratch based on current game state. Points are not "earned and kept" - they can be gained and lost. Examples:

- If you control a territory (+1 VP) then lose control, you lose that VP
- If you have 6 colonies (+6 VP) on the board, you have 6 VP (not "you've scored 6 points throughout the game")
- Scoreboard shows CURRENT state, not historical accumulation

**Digital Implementation:**
```typescript
// WRONG APPROACH (cumulative):
function placeColonyWrong(player: PlayerState): void {
  player.victoriePointsEarned += 1; // Never decreases
}

// CORRECT APPROACH (recalculated snapshot):
function calculateVictoryPoints(player: PlayerState, board: GameBoard): number {
  let vp = 0;
  
  // Recalculate from current state
  vp += board.getColoniesForPlayer(player.id).length;
  vp += board.getTerritoriesControlledBy(player.id).length;
  vp += player.hasCard('ALIEN_CITY') ? 1 : 0;
  vp += player.hasCard('ALIEN_MONUMENT') ? 1 : 0;
  vp += board.positronFieldController === player.id ? 1 : 0;
  
  return vp; // Pure function of current state
}

function updateScoreboard(board: GameBoard): void {
  for (const player of board.players) {
    // Recalculate entire score every time
    player.currentVP = calculateVictoryPoints(player, board);
  }
}
```

---

### Ambiguity #27: Game End Trigger Timing

**Rule Text:**
> "The game ends as soon as one player places their last colony on a territory."

**Ambiguity:**
Does the game end immediately when the colony is placed, or after the current turn completes? Can other players finish their turn? Can the triggering player continue their turn?

**Interpretation:**
The game ends IMMEDIATELY when a player places their last colony. The triggering player's turn ends at that moment. No further actions are taken (even if they have unplaced ships or unused tech cards).

Other players do NOT get additional turns to "catch up".

**Digital Implementation:**
```typescript
function placeColony(
  territory: Territory,
  player: PlayerState,
  game: GameState
): void {
  // Place the colony
  territory.addColony(player.id);
  player.coloniesAvailable -= 1;
  
  // Check for game end
  if (player.coloniesAvailable === 0) {
    game.isGameOver = true;
    game.triggeringPlayer = player.id;
    
    // Calculate final scores
    calculateFinalScores(game);
    
    // Turn ends immediately, no further actions allowed
    return;
  }
  
  // Continue turn if game not over
}
```

---

### Ambiguity #28: Game End with Colonist Hub

**Rule Text:**
> "When the colony reaches the seventh advancement circle you may launch it at your convenience by paying one fuel and one ore."

**Ambiguity:**
If your last colony is on the 7th circle of Colonist Hub (ready to launch but not yet paid for), does the game end when you pay to launch it, or only when you place it on a territory?

**Interpretation:**
The game ends when the colony is PLACED ON A TERRITORY, not when it's prepared or launched from Colonist Hub. The sequence is:

1. Colony reaches 7th circle (ready to launch)
2. Pay 1 fuel + 1 ore to launch
3. Choose territory and place colony
4. Game ends immediately (if this was last colony)

The "launch" from Colonist Hub is just the payment step. Placing on the territory is what ends the game.

**Digital Implementation:**
```typescript
function launchColonyFromHub(
  player: PlayerState,
  territory: Territory,
  game: GameState
): void {
  // Step 1: Validate colony is ready (on 7th circle)
  if (player.colonistHubProgress < 7) {
    throw new Error('Colony not ready to launch');
  }
  
  // Step 2: Pay cost
  if (player.resources.fuel < 1 || player.resources.ore < 1) {
    throw new Error('Insufficient resources to launch');
  }
  player.resources.fuel -= 1;
  player.resources.ore -= 1;
  
  // Step 3: Remove from hub
  player.colonistHubProgress = 0;
  
  // Step 4: Place on territory (THIS ends game if last colony)
  placeColony(territory, player, game);
  // If player.coloniesAvailable === 0, game ends in placeColony()
}
```

---

### Ambiguity #29: Final Scoring Verification

**Rule Text:**
> "Players tally up their victory points to verify the standings on the scoreboard, and the player with the most victory points wins."

**Ambiguity:**
Why "verify the standings on the scoreboard"? Should the scoreboard already be accurate? Is this a re-calculation or just confirmation?

**Interpretation:**
The scoreboard SHOULD already be accurate if it's been updated throughout the game. The "verification" is to:
1. Confirm no tracking errors occurred
2. Recalculate from scratch to ensure accuracy
3. Handle any edge cases or missed updates

Best practice: Recalculate all players' VPs from current board state at game end.

**Digital Implementation:**
```typescript
function endGame(game: GameState): GameResult {
  const finalScores: Map<string, number> = new Map();
  
  // Recalculate VP for each player from scratch
  for (const player of game.players) {
    const vp = calculateVictoryPoints(player, game.board);
    finalScores.set(player.id, vp);
    
    // Compare to scoreboard (should match)
    if (vp !== player.currentVP) {
      console.warn(`VP mismatch for ${player.id}: calculated=${vp}, tracked=${player.currentVP}`);
    }
  }
  
  // Determine winner
  return determineWinner(finalScores, game.players);
}
```

---

### Ambiguity #30: Tie-Breaking Rules

**Rule Text:**
> "If there is a tie, the tied players compare their number of alien tech cards to determine the winner. Persistent ties can be resolved by comparing ore tokens then fuel tokens. Still tied? Play again!"

**Ambiguity:**
For the alien tech tiebreaker, does "more cards" win, or "fewer cards" win? Do Alien City and Alien Monument count toward the tiebreaker count?

**Interpretation:**
MORE alien tech cards wins the tiebreaker (having more tech shows more successful exploration). All alien tech cards count, including Alien City and Alien Monument.

Tiebreaker order:
1. Most victory points wins
2. If tied on VP: Most alien tech cards wins
3. If tied on tech: Most ore tokens wins
4. If tied on ore: Most fuel tokens wins
5. If still tied: Rematch or shared victory

**Digital Implementation:**
```typescript
function determineWinner(
  scores: Map<string, number>,
  players: PlayerState[]
): GameResult {
  // Find highest VP
  const maxVP = Math.max(...scores.values());
  const tiedPlayers = players.filter(p => scores.get(p.id) === maxVP);
  
  if (tiedPlayers.length === 1) {
    return { winner: tiedPlayers[0].id };
  }
  
  // Tiebreaker 1: Most alien tech cards
  const maxTech = Math.max(...tiedPlayers.map(p => p.alienTechCards.length));
  const techTied = tiedPlayers.filter(p => p.alienTechCards.length === maxTech);
  
  if (techTied.length === 1) {
    return { winner: techTied[0].id };
  }
  
  // Tiebreaker 2: Most ore
  const maxOre = Math.max(...techTied.map(p => p.resources.ore));
  const oreTied = techTied.filter(p => p.resources.ore === maxOre);
  
  if (oreTied.length === 1) {
    return { winner: oreTied[0].id };
  }
  
  // Tiebreaker 3: Most fuel
  const maxFuel = Math.max(...oreTied.map(p => p.resources.fuel));
  const fuelTied = oreTied.filter(p => p.resources.fuel === maxFuel);
  
  if (fuelTied.length === 1) {
    return { winner: fuelTied[0].id };
  }
  
  // Still tied: shared victory or rematch
  return { winners: fuelTied.map(p => p.id), isTie: true };
}
```

---

## Summary

This document identifies **15 ambiguities** (Ambiguities #16-30) in the Turn Structure and Game Flow rules for Alien Frontiers (2nd Print, 2011 edition). Key findings:

- **Turn phases** are strictly ordered: Gather/Roll → Use Tech/Assign → End
- **Terraforming Station ships** return to stock before gathering other ships
- **Alien tech** can only be used after rolling, not before
- **Must dock all ships** if any legal placement exists (no optional undocking)
- **Immediate benefits** are gained synchronously and can be used same turn
- **Victory points** are recalculated snapshots, not cumulative totals
- **Resource limit** (8 max) only checked at end of turn
- **Game ends immediately** when last colony placed (turn doesn't complete)
- **Tie-breakers** favor more alien tech cards, then ore, then fuel

Next document should cover: **Orbital Facilities** (detailed requirements and effects for each facility)

