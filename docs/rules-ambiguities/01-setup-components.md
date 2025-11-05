# Setup & Components Ambiguities (Page 5)

## Source Text Review
**Page 5** covers 4-player setup, 3-player variant, 2-player variant, and long-game variant.

---

## AMBIGUITY #1: Starting Resources - 4 Player
**Rule Text:** "Counting clockwise from player one, player two receives one fuel, player three receives one ore, and player four receives one fuel and one ore."

**Ambiguity:** Does player one receive ZERO resources?

**Interpretation:** Yes, player one receives no starting resources (implied by omission).

**Digital Implementation:** 
```javascript
const startingResources = {
  0: { fuel: 0, ore: 0 },  // Player 1
  1: { fuel: 1, ore: 0 },  // Player 2
  2: { fuel: 0, ore: 1 },  // Player 3
  3: { fuel: 1, ore: 1 }   // Player 4
};
```

---

## AMBIGUITY #2: Starting Ships Location
**Rule Text:** "Each player chooses a color then takes three ships (dice) of that color and places them on the picture of the Shipyard on the board. This is the Maintenance Bay."

**Ambiguity:** Ships are placed on "the picture of the Shipyard" but this location is called "Maintenance Bay" - are these the same location? Where exactly is Maintenance Bay on the board?

**Interpretation:** Maintenance Bay is a specific location (likely bottom left area of board showing a maintenance/repair facility). The text says "on the picture of the Shipyard" but immediately clarifies this location IS the Maintenance Bay (not the Shipyard facility).

**Digital Implementation:** 
- Create distinct `maintenanceBay` location in game state
- Do not confuse with `shipyard` facility (which is an orbital facility)
- Starting ships begin in `maintenanceBay`, not rolled yet

---

## AMBIGUITY #3: Starting Ship Values
**Rule Text:** "Each player chooses a color then takes three ships (dice) of that color and places them on the picture of the Shipyard on the board."

**Ambiguity:** What values do the starting ships have? Are they rolled at game start, or do they start face-up at specific values?

**Interpretation:** Ships are NOT rolled at setup. They are simply placed (likely showing whatever face they happen to be on). Player One will roll them on their first turn during "Gather and Roll Your Fleet."

**Digital Implementation:**
```javascript
// At setup, ships have no value (or arbitrary value)
player.ships = [null, null, null];
// On first turn, player gathers and rolls
player.ships = [rollDie(), rollDie(), rollDie()];
```

---

## AMBIGUITY #4: Initial Alien Tech Card Distribution
**Rule Text:** "Deal one alien tech card face-up to each player."

**Ambiguity:** 
1. Is this dealt randomly or chosen?
2. Can players receive duplicate cards?
3. What if a player is dealt a card another player already has?

**Interpretation:** 
1. "Deal" implies random distribution (not player choice)
2. Since each player gets ONE card and "You may only possess one copy of each alien tech card" (page 13), no duplicates are possible at setup
3. Multiple players CAN have the same type of card (e.g., both could have Booster Pod)

**Digital Implementation:**
```javascript
// Shuffle deck, deal 1 to each player
alienTechDeck.shuffle();
for (let player of players) {
  player.alienTech.push(alienTechDeck.draw());
}
```

---

## AMBIGUITY #5: Alien Tech Display vs Deck
**Rule Text:** "Shuffle the alien tech cards and deal three cards face-up on the table near the Alien Artifact. This is your alien tech stock. Deal one alien tech card face-up to each player. The remaining alien tech cards form a draw pile..."

**Ambiguity:** If there are 22 total alien tech cards, and we display 3 + deal 1 per player (4 in 4-player game), that's 3+4=7 cards. Are there 15 cards left in draw pile?

**Interpretation:** Correct math:
- 4-player: 3 (display) + 4 (dealt) = 7 used, 15 in draw pile
- 3-player: 3 (display) + 3 (dealt) = 6 used, 16 in draw pile
- 2-player: 3 (display) + 2 (dealt) = 5 used, 17 in draw pile

**Digital Implementation:**
```javascript
const totalCards = 22;
const display = 3;
const dealt = playerCount;
const drawPileSize = totalCards - display - dealt;
```

---

## AMBIGUITY #6: Unused Colony Tokens
**Rule Text:** "Each player takes six colony tokens of the color that matches their ships. Return the unused colony tokens to the game box, they will not be needed."

**Ambiguity:** 4-player game uses 6 colonies each. But variants say:
- 3-player: "Each player takes seven colony tokens"
- 2-player: "Each player takes eight colony tokens"
- Long-game 4/3-player: "each player starts with all eight of their colony tokens"

This implies there are MORE than 6 per color. How many total colony tokens exist per color?

**Interpretation:** The components list (page 3) says "36 Colony Tokens in Four Colors" = 9 per color.

**Breakdown:**
- Standard 4-player: 6 per player (24 used, 12 unused)
- Standard 3-player: 7 per player (21 used, 6 unused)
- Standard 2-player: 8 per player (16 used, 4 unused)
- Long-game 4-player: 8 per player (32 used, 4 unused)
- Long-game 3-player: 8 per player (24 used, 12 unused)
- Long-game 2-player: 8 per player (16 used, 4 unused)

**Digital Implementation:**
```javascript
const coloniesPerPlayer = {
  2: { standard: 8, long: 8 },
  3: { standard: 7, long: 8 },
  4: { standard: 6, long: 8 }
};
```

---

## AMBIGUITY #7: Blocking Ships in 3/2-Player Variants
**Rule Text (3-player):** "Take the ships of the unclaimed color, turn them all so that the 1 faces are on top, and use them to cover docking ports marked with three dots."

**Ambiguity:** 
1. These blocking ships "stay in place throughout the game and may not be moved, removed, or changed" - does this mean they count as "docked" and prevent other players from using those specific docking ports?
2. What if an effect would remove or manipulate these ships (e.g., Plasma Cannon)?

**Interpretation:** 
1. Yes, these ships permanently occupy docking ports, reducing available capacity
2. They should be immune to all card effects (treated as part of the board, not as player ships)

**Digital Implementation:**
```javascript
// Mark these as system-owned, not player-owned
facility.dockedShips.push({
  owner: 'SYSTEM',
  value: 1,
  isBlocking: true,
  cannotBeRemoved: true,
  cannotBeModified: true
});
```

---

## AMBIGUITY #8: First Player Determination
**Rule Text:** "Choose player one by rolling for high number."

**Ambiguity:** 
1. Do all players roll one die?
2. What happens on ties?
3. Does the winner become "player one" or do you assign positions randomly after determining first player?

**Interpretation:**
1. Each player rolls one die
2. Ties re-roll (standard practice)
3. Winner becomes player one, then assign clockwise seating order

**Digital Implementation:**
```javascript
function determineFirstPlayer(players) {
  let rolls = players.map(p => ({ player: p, roll: rollDie() }));
  rolls.sort((a, b) => b.roll - a.roll);
  
  // Handle ties at top
  while (rolls[0].roll === rolls[1].roll) {
    // Re-roll tied players
    for (let i = 0; i < rolls.length && rolls[i].roll === rolls[0].roll; i++) {
      rolls[i].roll = rollDie();
    }
    rolls.sort((a, b) => b.roll - a.roll);
  }
  
  return rolls[0].player;
}
```

---

## AMBIGUITY #9: Ship Stock Composition
**Rule Text:** "Place the remaining three ships of each color on the table near the Shipyard. This is the ship stock."

**Ambiguity:** Each player starts with 3 ships in hand and 3 in the ship stock = 6 total per player. Can players exceed 6 ships?

**Interpretation:** No. The Shipyard (page 9) allows building "4th ship", "5th ship", "6th ship" - implying 6 is the maximum. The rule "Because it is possible to lose ships while playing, you may build your 4th, 5th, or 6th ship more than once during the game" confirms ships can be lost and rebuilt, but never exceed 6.

**Digital Implementation:**
```javascript
const MAX_SHIPS_PER_PLAYER = 6;
const STARTING_SHIPS_IN_HAND = 3;
const STARTING_SHIPS_IN_STOCK = 3;
```

---

## AMBIGUITY #10: Territory Card Placement
**Rule Text:** "Place each territory card face-up on the matching territory on the board."

**Ambiguity:** Are territory "cards" and territory "counters" the same thing? Page 3 lists "8 Territory Counters" but text calls them "cards."

**Interpretation:** These are physical counters/tokens that get placed on the board, not cards held in hand. When you control a territory, you "take its counter" (page 6). Terminology is inconsistent but "counter" is more accurate.

**Digital Implementation:**
```javascript
// Territory counters are board state, not player inventory
territory.counter = {
  controlledBy: null,  // playerId when controlled
  bonus: territoryBonusType
};
```

---

## SUMMARY: Critical Setup Decisions

1. **Starting resources are asymmetric** by player order
2. **Starting ships are unrolled** and placed in Maintenance Bay
3. **Ship maximum is 6** per player (3 active + 3 in stock)
4. **Colony count varies** by player count and variant (6-8 per player)
5. **Blocking ships** in 2/3-player are immune to all effects
6. **First player** is determined by single die roll (ties re-roll)

---

**Next Section:** Turn Structure & Timing (Page 6)
