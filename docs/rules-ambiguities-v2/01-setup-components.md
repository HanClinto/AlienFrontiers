# Setup and Components - Rules Ambiguities (v2)

Based on: AlienFrontiersRules-2ndPrint.pdf (2011 Edition)

## Components List

**Official Rules Text:**
> 24 Ships in Four Colors, 22 Alien Tech Cards, 8 Territory Counters, 3 Field Generator Counters, 20 Gray ore Tokens, 30 Orange fuel Tokens, 36 Colony Tokens in Four Colors, 1 Relic Ship, 1 Game Board, 1 Victory Point Scoreboard

---

### Ambiguity #1: Colony Token Distribution Per Color

**Rule Text:**
> "36 Colony Tokens in Four Colors"

**Ambiguity:**
Does each color have exactly 9 colony tokens (36 ÷ 4), or is the distribution uneven?

**Interpretation:**
Each of the four player colors has exactly 9 colony tokens (9 × 4 = 36 total). This is confirmed by the setup rules stating players take 6, 7, or 8 colonies depending on player count and variant.

**Digital Implementation:**
```typescript
const COLONY_TOKENS_PER_COLOR = 9;

interface GameComponents {
  colonyTokens: {
    red: number;    // 9
    blue: number;   // 9
    green: number;  // 9
    yellow: number; // 9
  };
}
```

---

### Ambiguity #2: Ship Distribution Per Color

**Rule Text:**
> "24 Ships in Four Colors"

**Ambiguity:**
Does each color have exactly 6 ships (24 ÷ 4)? The setup says players start with 3 ships and 3 more are in the "ship stock" - does this account for all ships?

**Interpretation:**
Each color has exactly 6 ships total (6 × 4 = 24). At game start in 4-player, each player has 3 ships in hand and 3 in the ship stock. Players can acquire additional ships from the stock via the Shipyard facility.

**Digital Implementation:**
```typescript
const SHIPS_PER_COLOR = 6;

interface PlayerState {
  activeShips: number[];    // Currently available (starts at 3)
  stockShips: number;       // Available to purchase (starts at 3)
}

// Maximum ships a player can ever have
const MAX_SHIPS_PER_PLAYER = 6;
```

---

## 4-Player Setup

**Official Rules Text (Page 5):**
> "Each player chooses a color then takes three ships (dice) of that color and places them on the Shipyard image near the words 'Maintenance Bay'. Place the remaining three ships of each color on the table near the Shipyard. This is the ship stock."
>
> "Each player takes six colony tokens of the color that matches their ships."
>
> "Choose player one by rolling for high number. Counting clockwise from player one, player two receives one fuel, player three receives one ore, and player four receives one fuel and one ore."

---

### Ambiguity #3: Starting Resources for Player 1

**Rule Text:**
> "Counting clockwise from player one, player two receives one fuel..."

**Ambiguity:**
Player 1 is not mentioned. Does Player 1 receive any starting resources?

**Interpretation:**
Player 1 receives NO starting resources (0 fuel, 0 ore). The compensation only applies to players 2, 3, and 4 to offset turn-order advantage.

**Digital Implementation:**
```typescript
function getStartingResources(playerPosition: number): { fuel: number; ore: number } {
  switch (playerPosition) {
    case 1: return { fuel: 0, ore: 0 };
    case 2: return { fuel: 1, ore: 0 };
    case 3: return { fuel: 0, ore: 1 };
    case 4: return { fuel: 1, ore: 1 };
    default: throw new Error(`Invalid player position: ${playerPosition}`);
  }
}
```

---

### Ambiguity #4: Starting Colonies in 4-Player Game

**Rule Text:**
> "Each player takes six colony tokens"

**Ambiguity:**
Does each player start with 6 colonies on the board, or 6 colonies available to place?

**Interpretation:**
Each player has 6 colony tokens in their SUPPLY (not on the board). All colonies start unplaced. Players must build colonies during gameplay via the Colony Constructor or Colonist Hub facilities.

**Digital Implementation:**
```typescript
interface PlayerState {
  coloniesAvailable: number;  // 6 in 4-player
  coloniesOnBoard: Colony[];  // Empty at start
}

// Win condition: place all colonies
function hasWon(player: PlayerState): boolean {
  return player.coloniesAvailable === 0; // All 6 placed
}
```

---

### Ambiguity #5: Starting Ships in 4-Player Game

**Rule Text:**
> "takes three ships (dice) of that color and places them on the Shipyard image near the words 'Maintenance Bay'"

**Ambiguity:**
Are these ships "on the Maintenance Bay" facility (which has specific rules about gathering ships), or just physically placed near it as a staging area?

**Interpretation:**
The ships are placed as a STAGING AREA near the Maintenance Bay image, NOT docked at the Maintenance Bay facility. On each player's first turn, they gather and roll all 3 ships normally. The Maintenance Bay facility is where ships go during a turn if they cannot be legally docked elsewhere.

**Digital Implementation:**
```typescript
interface PlayerState {
  shipsInHand: number[];      // Available to roll (3 at start)
  shipsOnBoard: DockedShip[]; // Empty at game start
  shipsInStock: number;       // Available to purchase (3 at start)
}

// First turn: gather from "staging area", not from facilities
function startFirstTurn(player: PlayerState): void {
  // Roll the 3 ships from shipsInHand
  player.shipsInHand = rollDice(3);
}
```

---

## 3-Player Setup

**Official Rules Text (Page 5):**
> "Each player takes seven colony tokens."
>
> "Take the ships of the unclaimed color, turn them all so that the 1 faces are on top, and use them to cover docking ports marked with three dots."
> - One ship at the Solar Converter
> - One ship at the Lunar Mine
> - Two ships at the Orbital Market
> - Two ships at the Shipyard
>
> "At the beginning of the game, player two receives one fuel token and player three receives one ore token."

---

### Ambiguity #6: Blocking Ships Permanence in 3-Player

**Rule Text:**
> "These ships will stay in place throughout the game and may not be moved, removed, or changed."

**Ambiguity:**
Can these blocking ships be affected by Plasma Cannon, Orbital Teleporter, or other player effects? What if a field generator affects the facility?

**Interpretation:**
Blocking ships are PERMANENTLY IMMUTABLE. They:
- Cannot be moved by any card or effect
- Cannot be removed by any card or effect  
- Cannot have their value changed
- Do not count as "player ships" for targeting purposes
- Are immune to all game effects (Plasma Cannon, Orbital Teleporter, field generators, etc.)

**Digital Implementation:**
```typescript
interface BlockingShip {
  value: 1;  // Always 1
  facility: FacilityType;
  isBlocking: true;  // Flag to prevent any modifications
  isImmutable: true;
}

function canTargetShip(ship: Ship | BlockingShip): boolean {
  if ('isBlocking' in ship && ship.isBlocking) {
    return false; // Blocking ships cannot be targeted
  }
  return true;
}

// Blocking ships reduce available docking ports
function getAvailableDocks(facility: Facility): number {
  const totalDocks = facility.maxDocks;
  const playerShips = facility.dockedShips.filter(s => !s.isBlocking).length;
  const blockingShips = facility.dockedShips.filter(s => s.isBlocking).length;
  
  return totalDocks - playerShips - blockingShips;
}
```

---

### Ambiguity #7: Starting Resources in 3-Player

**Rule Text:**
> "At the beginning of the game, player two receives one fuel token and player three receives one ore token."

**Ambiguity:**
What does Player 1 receive? The 4-player rules say Player 1 gets nothing, but this is not explicitly stated for 3-player.

**Interpretation:**
Consistent with 4-player, Player 1 receives NO starting resources (0 fuel, 0 ore). Only Players 2 and 3 receive compensation.

**Digital Implementation:**
```typescript
function getStartingResourcesThreePlayer(playerPosition: number): Resources {
  switch (playerPosition) {
    case 1: return { fuel: 0, ore: 0 };
    case 2: return { fuel: 1, ore: 0 };
    case 3: return { fuel: 0, ore: 1 };
    default: throw new Error(`Invalid position for 3-player: ${playerPosition}`);
  }
}
```

---

### Ambiguity #8: Which Docking Ports are "Marked with Three Dots"?

**Rule Text:**
> "use them to cover docking ports marked with three dots"

**Ambiguity:**
Which specific docking ports have three dots? The rules don't include the visual board layout. Must we block exactly one port per facility, or does each facility have a specific number?

**Interpretation:**
Based on the list provided:
- Solar Converter: 1 port blocked (has 3 total, leaves 2 available)
- Lunar Mine: 1 port blocked (has 3 total, leaves 2 available)
- Orbital Market: 2 ports blocked (has 4 total, leaves 2 available)
- Shipyard: 2 ports blocked (has 4 total, leaves 2 available)
- Other facilities: 0 ports blocked (fully available)

The three-dot marking indicates ports that should be blocked in 3-player games to prevent the board from being too open.

**Digital Implementation:**
```typescript
function setupThreePlayerBlocking(): BlockingShip[] {
  return [
    { facility: 'SOLAR_CONVERTER', value: 1, isBlocking: true },
    { facility: 'LUNAR_MINE', value: 1, isBlocking: true },
    { facility: 'ORBITAL_MARKET', value: 1, isBlocking: true },
    { facility: 'ORBITAL_MARKET', value: 1, isBlocking: true },
    { facility: 'SHIPYARD', value: 1, isBlocking: true },
    { facility: 'SHIPYARD', value: 1, isBlocking: true },
  ];
}
```

---

## 2-Player Setup

**Official Rules Text (Page 5):**
> "Each player takes eight colony tokens."
>
> "Take the ships of the unclaimed colors, turn them all so that the 1 faces are on top, and use them to cover all docking ports marked with dots."
> - One ship at the Solar Converter
> - Two ships at the Lunar Mine
> - Two ships at the Orbital Market
> - Three ships at the Colony Constructor
> - Four ships at the Shipyard
>
> "At the beginning of the game, player two receives one fuel token."

---

### Ambiguity #9: Two Unclaimed Colors in 2-Player

**Rule Text:**
> "Take the ships of the unclaimed colors"

**Ambiguity:**
In 2-player, there are two unclaimed colors (12 ships total). Do we use ships from both colors, or just one? How do we distribute 12 blocking ships?

**Interpretation:**
Use ships from BOTH unclaimed colors. The total blocking ships needed is: 1 + 2 + 2 + 3 + 4 = 12 ships, which exactly equals 2 colors × 6 ships. It doesn't matter which color blocks which facility.

**Digital Implementation:**
```typescript
function setupTwoPlayerBlocking(): BlockingShip[] {
  // 12 total blocking ships (2 unused colors × 6 ships each)
  return [
    { facility: 'SOLAR_CONVERTER', value: 1, isBlocking: true },
    { facility: 'LUNAR_MINE', value: 1, isBlocking: true },
    { facility: 'LUNAR_MINE', value: 1, isBlocking: true },
    { facility: 'ORBITAL_MARKET', value: 1, isBlocking: true },
    { facility: 'ORBITAL_MARKET', value: 1, isBlocking: true },
    { facility: 'COLONY_CONSTRUCTOR', value: 1, isBlocking: true },
    { facility: 'COLONY_CONSTRUCTOR', value: 1, isBlocking: true },
    { facility: 'COLONY_CONSTRUCTOR', value: 1, isBlocking: true },
    { facility: 'SHIPYARD', value: 1, isBlocking: true },
    { facility: 'SHIPYARD', value: 1, isBlocking: true },
    { facility: 'SHIPYARD', value: 1, isBlocking: true },
    { facility: 'SHIPYARD', value: 1, isBlocking: true },
  ];
}
```

---

### Ambiguity #10: Starting Resources in 2-Player

**Rule Text:**
> "At the beginning of the game, player two receives one fuel token."

**Ambiguity:**
Player 1 is not mentioned. Does Player 1 get nothing?

**Interpretation:**
Player 1 receives NO starting resources (0 fuel, 0 ore). Only Player 2 receives 1 fuel as turn-order compensation. This is consistent with 3-player and 4-player patterns.

**Digital Implementation:**
```typescript
function getStartingResourcesTwoPlayer(playerPosition: number): Resources {
  switch (playerPosition) {
    case 1: return { fuel: 0, ore: 0 };
    case 2: return { fuel: 1, ore: 0 };
    default: throw new Error(`Invalid position for 2-player: ${playerPosition}`);
  }
}
```

---

## Long-Game Variant

**Official Rules Text (Page 5):**
> "Once you become skilled at Alien Frontiers you may wish to play longer games. To do this in the 4-player and 3-player scenarios, each player starts with all eight of their colony tokens."

---

### Ambiguity #11: Long-Game Variant for 2-Player

**Rule Text:**
> "To do this in the 4-player and 3-player scenarios, each player starts with all eight of their colony tokens."

**Ambiguity:**
Can the long-game variant be used in 2-player? The rules only mention 3-player and 4-player.

**Interpretation:**
The long-game variant is NOT explicitly supported for 2-player games. In 2-player, players already start with 8 colonies (the maximum in any normal setup). There is no "longer" variant available.

If you wanted to create a custom longer 2-player game, players could start with 9 colonies (all available tokens), but this is not an official rule.

**Digital Implementation:**
```typescript
interface GameSetup {
  playerCount: number;
  isLongGame: boolean;
}

function getStartingColonies(setup: GameSetup): number {
  if (setup.playerCount === 2) {
    return 8; // Always 8 for 2-player, no long-game variant
  }
  
  if (setup.isLongGame) {
    return 8; // Long game: 8 colonies for 3-player and 4-player
  }
  
  // Standard games
  return setup.playerCount === 3 ? 7 : 6;
}

function isLongGameAvailable(playerCount: number): boolean {
  return playerCount === 3 || playerCount === 4;
}
```

---

### Ambiguity #12: Long-Game Victory Condition

**Rule Text:**
> "each player starts with all eight of their colony tokens"

**Ambiguity:**
Does the victory condition remain "first player to place all colonies wins", or does it change to a different threshold?

**Interpretation:**
The victory condition remains UNCHANGED: "First player to place all their starting colonies wins." In long-game 4-player or 3-player, this means placing all 8 colonies instead of 6 or 7.

**Digital Implementation:**
```typescript
function checkVictory(player: PlayerState, setup: GameSetup): boolean {
  const startingColonies = getStartingColonies(setup);
  const placedColonies = player.coloniesOnBoard.length;
  
  return placedColonies >= startingColonies; // Must place all starting colonies
}
```

---

## Initial Alien Tech Distribution

**Official Rules Text (Page 5):**
> "Shuffle the alien tech cards and deal three cards face-up on the table near the Alien Artifact. This is your alien tech stock. Deal one alien tech card face-up to each player."

---

### Ambiguity #13: Starting Alien Tech Card Usage

**Rule Text:**
> "Deal one alien tech card face-up to each player."

**Ambiguity:**
Can players use their starting alien tech card immediately during setup, or only after their first turn begins? Can they use discard powers before the game starts?

**Interpretation:**
Players receive their starting alien tech card during setup but CANNOT use it until their first turn begins. Alien tech cards can only be used "during your turn" as stated in the gameplay rules. The card is visible to all players but inactive until that player's first turn.

**Digital Implementation:**
```typescript
interface SetupState {
  alienTechStock: AlienTechCard[];  // 3 face-up cards
  players: PlayerState[];
}

function dealStartingAlienTech(setup: SetupState): void {
  setup.players.forEach(player => {
    const card = drawAlienTechCard();
    player.alienTechCards.push(card);
    // Cards are received but cannot be used until turn starts
    card.canBeUsedThisTurn = false;
  });
}

function startPlayerTurn(player: PlayerState): void {
  // Enable alien tech cards at turn start
  player.alienTechCards.forEach(card => {
    card.canBeUsedThisTurn = true;
    card.hasBeenUsedThisTurn = false;
  });
}
```

---

### Ambiguity #14: Starting Alien Tech Duplicates

**Rule Text:**
> "Deal one alien tech card face-up to each player."
> (Later rule: "You may only possess one copy of each alien tech card.")

**Ambiguity:**
What happens if the same alien tech card is randomly dealt to multiple players during setup? The rules say you can only possess one copy, but setup deals randomly before this rule applies.

**Interpretation:**
During SETUP, multiple players CAN receive the same alien tech card (e.g., two players could both start with Booster Pod). The "one copy" rule only applies to ACQUIRING cards during gameplay (via Alien Artifact, Raiders' Outpost, etc.). Setup is an exception.

**Digital Implementation:**
```typescript
function dealStartingAlienTech(players: PlayerState[]): void {
  // During setup, duplicates ARE allowed
  players.forEach(player => {
    const card = drawRandomAlienTechCard();
    player.alienTechCards.push(card);
    // No duplicate check during setup
  });
}

function canClaimAlienTech(player: PlayerState, card: AlienTechCard): boolean {
  // During gameplay, duplicates are NOT allowed
  const alreadyHas = player.alienTechCards.some(c => c.name === card.name);
  return !alreadyHas;
}
```

---

### Ambiguity #15: Alien Tech Stock Replenishment During Setup

**Rule Text:**
> "Shuffle the alien tech cards and deal three cards face-up on the table near the Alien Artifact. This is your alien tech stock. Deal one alien tech card face-up to each player."

**Ambiguity:**
In what order do these happen? If we deal 3 to the stock first, then deal 1 to each of 4 players, we've dealt 7 cards total. Do we replenish the stock back to 3 cards after dealing to players?

**Interpretation:**
Order of operations:
1. Shuffle alien tech deck
2. Deal 3 cards face-up to create alien tech stock
3. Deal 1 card to each player (from the draw pile, not from the stock)
4. Stock remains at 3 cards

The stock and player cards are dealt from the same shuffled deck but the stock is not replenished during setup. Total cards dealt: 3 (stock) + number of players.

**Digital Implementation:**
```typescript
function setupAlienTech(playerCount: number): {
  stock: AlienTechCard[];
  playerCards: AlienTechCard[];
} {
  const deck = shuffleAlienTechDeck();
  
  // Deal 3 to stock
  const stock = deck.splice(0, 3);
  
  // Deal 1 to each player (from remaining deck)
  const playerCards = deck.splice(0, playerCount);
  
  // Remaining cards form draw pile
  // Stock stays at 3 cards (no replenishment during setup)
  
  return { stock, playerCards };
}
```

---

## Summary

This document identifies **15 ambiguities** in the Setup and Components rules for Alien Frontiers (2nd Print, 2011 edition). Key findings:

- **Player counts** affect colonies (6/7/8), starting resources, and blocking ships
- **Blocking ships** are permanently immutable and cannot be affected by any game effect
- **Starting resources** follow a pattern: P1 gets nothing, later players get compensation
- **Long-game variant** only applies to 3-player and 4-player games
- **Alien tech** setup involves dealing from a single deck with specific order
- **Setup duplicates** of alien tech cards ARE allowed (gameplay duplicates are not)

Next document should cover: **Turn Structure and Game Flow**
