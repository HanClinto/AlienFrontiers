# Alien Tech Cards Part 1 - Rules Ambiguities (v2)

Based on: AlienFrontiersRules-2ndPrint.pdf (2011 Edition)

## Alien Tech Cards Overview

**Official Rules Text (Page 13):**
> "The alien tech cards allow you to bend the basic game rules. Most alien tech cards may be used immediately after you acquire them. Alien tech cards that require a fuel payment can only be used once per turn. You may only discard an alien tech card you have not already used on your current turn and then only one discard per turn.
>
> Your alien tech cards are placed on the table face-up where all players can see them.
>
> You may only possess one copy of each alien tech card. If a card allows you to change a ship's value then the value may never be lower than 1 or higher than 6.
>
> If the alien tech draw deck is exhausted, reshuffle the discards to create a new draw deck."

---

### Ambiguity #97: "Immediately After You Acquire Them"

**Rule Text:**
> "Most alien tech cards may be used immediately after you acquire them."

**Ambiguity:**
Does "immediately" mean on the same turn you acquire the card, or literally right after claiming it (before docking other ships)?

**Interpretation:**
"Immediately" means ON THE SAME TURN you acquire the card. You can use fuel powers or discard powers of newly acquired cards during the same turn you claim them.

Exception: Resource Cache explicitly states "cannot be used on the turn you acquire it."

The sequence is:
1. Claim card from Alien Artifact
2. Card goes into your hand (visible to all)
3. During the same turn, you can use its fuel power (if you haven't already used it) or discard it

**Digital Implementation:**
```typescript
interface AlienTechCard {
  id: string;
  name: string;
  fuelCost: number;
  hasFuelPower: boolean;
  hasDiscardPower: boolean;
  canUseImmediately: boolean; // false only for Resource Cache
}

function claimAlienTechCard(
  card: AlienTechCard,
  player: PlayerState,
  turn: TurnState
): void {
  // Add to player's hand
  player.alienTechCards.push(card);
  
  // Mark as available for use this turn (except Resource Cache)
  if (card.canUseImmediately) {
    turn.newlyAcquiredCards.push(card.id);
  }
}

function canUseCardThisTurn(
  card: AlienTechCard,
  player: PlayerState,
  turn: TurnState
): boolean {
  // Resource Cache: cannot use on turn acquired
  if (!card.canUseImmediately && turn.newlyAcquiredCards.includes(card.id)) {
    return false;
  }
  
  return true;
}
```

---

### Ambiguity #98: "Once Per Turn" Fuel Powers

**Rule Text:**
> "Alien tech cards that require a fuel payment can only be used once per turn."

**Ambiguity:**
Does "once per turn" mean once per card, or once total across all cards? Can you use multiple different fuel-based cards on the same turn?

**Interpretation:**
"Once per turn" applies PER CARD, not total. You can use MULTIPLE different fuel-based cards on the same turn, but each individual card can only be used once.

Examples:
- Use Booster Pod (1 fuel) + Stasis Beam (1 fuel) on same turn: ALLOWED
- Use Booster Pod (1 fuel) twice on same turn: NOT ALLOWED
- Use Gravity Manipulator (2 fuel) + Plasma Cannon (variable fuel) on same turn: ALLOWED

**Digital Implementation:**
```typescript
interface TurnState {
  cardsUsedThisTurn: Set<string>; // Card IDs
  cardsDiscardedThisTurn: Set<string>; // Card IDs
}

function canUseCardFuelPower(
  card: AlienTechCard,
  player: PlayerState,
  turn: TurnState
): boolean {
  // Cannot use if already used this turn
  if (turn.cardsUsedThisTurn.has(card.id)) {
    return false;
  }
  
  // Cannot use if discarded this turn
  if (turn.cardsDiscardedThisTurn.has(card.id)) {
    return false;
  }
  
  // Need sufficient fuel
  const fuelCost = getAlienTechFuelCost(card, player);
  if (player.resources.fuel < fuelCost) {
    return false;
  }
  
  return true;
}
```

---

### Ambiguity #99: Discard Restrictions

**Rule Text:**
> "You may only discard an alien tech card you have not already used on your current turn and then only one discard per turn."

**Ambiguity:**
Can you discard a card on the same turn you acquire it? Does "one discard per turn" mean one card total, or one discard power per turn?

**Interpretation:**
- You CAN discard a card on the same turn you acquire it (as long as you haven't used its fuel power)
- "One discard per turn" means ONE CARD TOTAL can be discarded per turn
- You cannot use a card's fuel power and then discard it on the same turn

**Digital Implementation:**
```typescript
function canDiscardCard(
  card: AlienTechCard,
  player: PlayerState,
  turn: TurnState
): boolean {
  // Cannot discard if already used fuel power this turn
  if (turn.cardsUsedThisTurn.has(card.id)) {
    return false;
  }
  
  // Cannot discard if already discarded a card this turn
  if (turn.cardsDiscardedThisTurn.size > 0) {
    return false;
  }
  
  // Alien City and Alien Monument: no discard power
  if (!card.hasDiscardPower) {
    return false;
  }
  
  return true;
}

function discardCardForPower(
  card: AlienTechCard,
  player: PlayerState,
  turn: TurnState
): void {
  if (!canDiscardCard(card, player, turn)) {
    throw new Error('Cannot discard card');
  }
  
  // Remove from player's hand
  const index = player.alienTechCards.findIndex(c => c.id === card.id);
  player.alienTechCards.splice(index, 1);
  
  // Mark as discarded
  turn.cardsDiscardedThisTurn.add(card.id);
  
  // Apply discard effect
  applyDiscardEffect(card, player);
}
```

---

### Ambiguity #100: Duplicate Card Restriction

**Rule Text:**
> "You may only possess one copy of each alien tech card."

**Ambiguity:**
What happens if you try to claim a card you already have? Can you claim it to cycle the Alien Artifact? What about raiding duplicates?

**Interpretation:**
- You CANNOT claim a card you already possess (when using Alien Artifact normally)
- You CAN raid a duplicate card from an opponent (using Raiders' Outpost), but it is IMMEDIATELY DISCARDED
- You CANNOT use Temporal Warper to reclaim a card you already have from the discard pile

**Digital Implementation:**
```typescript
function canClaimCard(
  card: AlienTechCard,
  player: PlayerState
): boolean {
  // Cannot possess duplicates
  return !player.alienTechCards.some(c => c.name === card.name);
}

function claimCardFromAlienArtifact(
  card: AlienTechCard,
  player: PlayerState
): void {
  if (!canClaimCard(card, player)) {
    throw new Error('Already possess this card');
  }
  
  player.alienTechCards.push(card);
}

function raidAlienTechCard(
  card: AlienTechCard,
  victim: PlayerState,
  raider: PlayerState
): void {
  // Remove from victim
  const index = victim.alienTechCards.findIndex(c => c.id === card.id);
  victim.alienTechCards.splice(index, 1);
  
  // If raider already has this card, discard it
  if (!canClaimCard(card, raider)) {
    discardPile.push(card);
  } else {
    raider.alienTechCards.push(card);
  }
}
```

---

### Ambiguity #101: Ship Value Limits

**Rule Text:**
> "If a card allows you to change a ship's value then the value may never be lower than 1 or higher than 6."

**Ambiguity:**
Can you attempt to use a card that would change a ship's value outside 1-6, and it just caps at the limit? Or is the action invalid?

**Interpretation:**
The action is INVALID if it would result in a ship value < 1 or > 6. You cannot use the card in a way that would violate this rule.

Examples:
- Ship showing 1, cannot use Stasis Beam to decrease to 0 (invalid)
- Ship showing 6, cannot use Booster Pod to increase to 7 (invalid)
- Ship showing 1, can use Gravity Manipulator to move point away IF another ship receives it (resulting in 1 → stays 1 after transfer? No, this is complex - see Gravity Manipulator ambiguities)

**Digital Implementation:**
```typescript
function canIncreaseShipValue(ship: Ship, amount: number): boolean {
  return (ship.value + amount) <= 6;
}

function canDecreaseShipValue(ship: Ship, amount: number): boolean {
  return (ship.value - amount) >= 1;
}

function useBoosterPod(
  ship: Ship,
  player: PlayerState
): void {
  if (!canIncreaseShipValue(ship, 1)) {
    throw new Error('Cannot increase ship value above 6');
  }
  
  const fuelCost = getAlienTechFuelCost('BOOSTER_POD', player);
  player.resources.fuel -= fuelCost;
  ship.value += 1;
}
```

---

### Ambiguity #102: Deck Exhaustion and Reshuffling

**Rule Text:**
> "If the alien tech draw deck is exhausted, reshuffle the discards to create a new draw deck."

**Ambiguity:**
When exactly does reshuffling occur? If you try to claim a card but the deck is empty, do you reshuffle before claiming, or does claiming fail?

**Interpretation:**
Reshuffling occurs AUTOMATICALLY when the deck is exhausted and a card needs to be drawn. The sequence is:
1. Player docks at Alien Artifact and reaches required value
2. Check if deck has cards
3. If deck is empty, reshuffle discard pile into new deck
4. Draw top card and offer to player

If the discard pile is ALSO empty (all cards are in players' hands), then no card can be claimed.

**Digital Implementation:**
```typescript
interface AlienArtifact {
  deck: AlienTechCard[];
  discardPile: AlienTechCard[];
}

function drawCardFromArtifact(artifact: AlienArtifact): AlienTechCard | null {
  // If deck is empty, reshuffle discards
  if (artifact.deck.length === 0) {
    if (artifact.discardPile.length === 0) {
      return null; // No cards available anywhere
    }
    
    // Reshuffle
    artifact.deck = shuffle(artifact.discardPile);
    artifact.discardPile = [];
  }
  
  // Draw top card
  return artifact.deck.pop()!;
}

function claimFromArtifact(
  player: PlayerState,
  artifact: AlienArtifact
): void {
  const card = drawCardFromArtifact(artifact);
  
  if (card === null) {
    throw new Error('No cards available in deck or discard pile');
  }
  
  if (!canClaimCard(card, player)) {
    // Return to discard if player already has it
    artifact.discardPile.push(card);
  } else {
    player.alienTechCards.push(card);
  }
}
```

---

## Alien City and Alien Monument

**Official Rules Text (Page 13):**
> "Each of these cards is worth one victory point. There is one Alien City card and one Alien Monument card in the alien tech deck and a single player may possess both cards simultaneously. There is no fuel cost associated with these cards and they do not have discard powers."

---

### Ambiguity #103: Victory Point Cards

**Rule Text:**
> "Each of these cards is worth one victory point."

**Ambiguity:**
Are these VP cards permanent, or can they be lost? Can they be raided by Raiders' Outpost?

**Interpretation:**
- VP cards give +1 VP each as long as you possess them
- They CAN be raided by Raiders' Outpost (they are alien tech cards)
- If raided and the raider already has the card, it goes to discard pile
- They count toward VP total (recalculated snapshot)

**Digital Implementation:**
```typescript
function calculateVictoryPoints(player: PlayerState, board: GameBoard): number {
  let vp = 0;
  
  // Colonies
  vp += player.coloniesPlaced;
  
  // Territory control
  for (const territory of board.territories) {
    if (territory.controller === player.id) {
      vp += 1;
      if (territory.hasPositronField) {
        vp += 1;
      }
    }
  }
  
  // Alien tech VP cards
  const vpCards = player.alienTechCards.filter(c => 
    c.name === 'ALIEN_CITY' || c.name === 'ALIEN_MONUMENT'
  );
  vp += vpCards.length;
  
  return vp;
}
```

---

### Ambiguity #104: Possessing Both Cards

**Rule Text:**
> "a single player may possess both cards simultaneously"

**Ambiguity:**
Why is this explicitly stated? Is it to clarify they are separate cards (not duplicates of each other)?

**Interpretation:**
This clarifies that Alien City and Alien Monument are DIFFERENT cards (not duplicates). You can possess both because they have different names.

The "one copy of each card" rule means one Alien City + one Alien Monument is allowed.

**Digital Implementation:**
```typescript
function canClaimCard(
  card: AlienTechCard,
  player: PlayerState
): boolean {
  // Check for duplicate by NAME, not by type
  return !player.alienTechCards.some(c => c.name === card.name);
}

// Alien City and Alien Monument are different cards
const ALIEN_CITY: AlienTechCard = {
  id: 'alien_city_1',
  name: 'ALIEN_CITY',
  fuelCost: 0,
  hasFuelPower: false,
  hasDiscardPower: false,
  givesVP: true,
  canUseImmediately: true
};

const ALIEN_MONUMENT: AlienTechCard = {
  id: 'alien_monument_1',
  name: 'ALIEN_MONUMENT',
  fuelCost: 0,
  hasFuelPower: false,
  hasDiscardPower: false,
  givesVP: true,
  canUseImmediately: true
};

// Player can have both at once
function canHaveBothVPCards(player: PlayerState): boolean {
  const hasCity = player.alienTechCards.some(c => c.name === 'ALIEN_CITY');
  const hasMonument = player.alienTechCards.some(c => c.name === 'ALIEN_MONUMENT');
  return hasCity && hasMonument; // Both allowed
}
```

---

### Ambiguity #105: No Powers for VP Cards

**Rule Text:**
> "There is no fuel cost associated with these cards and they do not have discard powers."

**Ambiguity:**
Can you discard these cards for any reason? Can they be used with Temporal Warper?

**Interpretation:**
- VP cards CANNOT be discarded (they have no discard power)
- They provide no fuel power (cannot use during turn)
- They simply give +1 VP permanently
- If you want to get rid of them (unlikely), you'd need to lose them via Raiders' Outpost

The only way to lose a VP card is:
1. Raiders' Outpost steals it
2. Card goes to discard if raider already has it
3. Can be reclaimed later via Temporal Warper

**Digital Implementation:**
```typescript
function canDiscardCard(
  card: AlienTechCard,
  player: PlayerState,
  turn: TurnState
): boolean {
  // VP cards cannot be discarded
  if (card.name === 'ALIEN_CITY' || card.name === 'ALIEN_MONUMENT') {
    return false;
  }
  
  // Other checks...
  return card.hasDiscardPower && 
         !turn.cardsUsedThisTurn.has(card.id) &&
         turn.cardsDiscardedThisTurn.size === 0;
}
```

---

## Booster Pod

**Official Rules Text (Page 13):**
> "Each turn you may pay one fuel to increase the value of one of your unplaced ships by one point. You may discard a Booster Pod to remove any single field generator from the game board. A field generator removed in this manner may be rebuilt in the normal manner at a later time."

---

### Ambiguity #106: "Unplaced Ships"

**Rule Text:**
> "increase the value of one of your unplaced ships"

**Ambiguity:**
Does "unplaced" mean ships in your hand (rolled but not docked), or ships anywhere (including on Maintenance Bay)?

**Interpretation:**
"Unplaced" means ships that have been rolled this turn but NOT YET DOCKED at a facility. This includes:
- Ships in your hand after rolling
- Ships that were on Maintenance Bay and are now in your hand

"Unplaced" does NOT include:
- Ships already docked at facilities this turn
- Ships still on Maintenance Bay (not in hand yet)

**Digital Implementation:**
```typescript
interface PlayerTurnState {
  shipsInHand: Ship[]; // Rolled but not docked
  shipsDockedThisTurn: Ship[]; // Already placed
}

function canUseBoosterPodOnShip(
  ship: Ship,
  turnState: PlayerTurnState
): boolean {
  // Must be in hand (unplaced)
  if (!turnState.shipsInHand.includes(ship)) {
    return false;
  }
  
  // Cannot be already docked
  if (turnState.shipsDockedThisTurn.includes(ship)) {
    return false;
  }
  
  // Cannot exceed value 6
  if (ship.value >= 6) {
    return false;
  }
  
  return true;
}
```

---

### Ambiguity #107: Booster Pod Discard Power Change

**Rule Text (2nd Print):**
> "You may discard a Booster Pod to remove any single field generator from the game board."

**Context:**
In the Final version, this read: "remove any single field generator from the territory on which it is located."

**Ambiguity:**
Is the 2nd Print wording intentionally broader? Can you remove field generators from ANY territory, not just territories you have colonies on?

**Interpretation:**
YES - the 2nd Print intentionally broadened the power. You can remove ANY field generator from ANY territory on the board:
- No requirement to control the territory
- No requirement to have colonies on the territory
- Can remove Isolation Field, Positron Field, or Repulsor Field
- Removed field generator can be rebuilt later by discarding the appropriate card

This is a significant strategic power.

**Digital Implementation:**
```typescript
function discardBoosterPodToRemoveField(
  player: PlayerState,
  territory: Territory,
  fieldType: 'ISOLATION' | 'POSITRON' | 'REPULSOR'
): void {
  // Check if field is present
  if (fieldType === 'ISOLATION' && !territory.hasIsolationField) {
    throw new Error('No Isolation Field on this territory');
  }
  if (fieldType === 'POSITRON' && !territory.hasPositronField) {
    throw new Error('No Positron Field on this territory');
  }
  if (fieldType === 'REPULSOR' && !territory.hasRepulsorField) {
    throw new Error('No Repulsor Field on this territory');
  }
  
  // Remove field generator (no restrictions on territory)
  if (fieldType === 'ISOLATION') {
    territory.hasIsolationField = false;
  } else if (fieldType === 'POSITRON') {
    territory.hasPositronField = false;
    // Update VP if someone controlled it
    if (territory.controller) {
      recalculateVP(getPlayer(territory.controller));
    }
  } else {
    territory.hasRepulsorField = false;
  }
  
  // Discard Booster Pod
  discardCardForPower('BOOSTER_POD', player);
}
```

---

### Ambiguity #108: Field Generator Rebuilding

**Rule Text:**
> "A field generator removed in this manner may be rebuilt in the normal manner at a later time."

**Ambiguity:**
What does "rebuilt in the normal manner" mean? Does this affect the deck or available cards?

**Interpretation:**
"Rebuilt in the normal manner" means:
- The field generator counter is removed from the board (returned to supply)
- It can be placed back on the board by discarding the appropriate alien tech card:
  - Stasis Beam → Isolation Field
  - Data Crystal → Positron Field
  - Gravity Manipulator → Repulsor Field
- No special restriction or penalty for rebuilding

This does NOT affect which cards are in the deck or available. It simply means the physical field generator counter is returned to supply.

**Digital Implementation:**
```typescript
interface FieldGeneratorSupply {
  isolationFieldAvailable: boolean;
  positronFieldAvailable: boolean;
  repulsorFieldAvailable: boolean;
}

// When Booster Pod removes a field generator
function removeFieldGenerator(
  fieldType: 'ISOLATION' | 'POSITRON' | 'REPULSOR',
  supply: FieldGeneratorSupply
): void {
  // Field generator is removed from board
  // It's now available in supply (ready to be rebuilt)
  if (fieldType === 'ISOLATION') {
    supply.isolationFieldAvailable = true;
  } else if (fieldType === 'POSITRON') {
    supply.positronFieldAvailable = true;
  } else {
    supply.repulsorFieldAvailable = true;
  }
}

// When a card is discarded to place a field generator
function placeFieldGenerator(
  fieldType: 'ISOLATION' | 'POSITRON' | 'REPULSOR',
  territory: Territory,
  supply: FieldGeneratorSupply
): void {
  // Can only place if available in supply
  // (should always be available since there's only one of each)
  
  if (fieldType === 'ISOLATION') {
    territory.hasIsolationField = true;
    supply.isolationFieldAvailable = false;
  } else if (fieldType === 'POSITRON') {
    territory.hasPositronField = true;
    supply.positronFieldAvailable = false;
  } else {
    territory.hasRepulsorField = true;
    supply.repulsorFieldAvailable = false;
  }
}
```

---

## Data Crystal

**Official Rules Text (Page 13):**
> "Each turn you may pay one fuel per colony on a territory to use that territory's bonus exactly as if you controlled the territory. If a territory has no colonies on it then you cannot use its bonus. If the territory has the Isolation Field on it then you cannot use its bonus. Burroughs Desert is exempt from the Data Crystal's power because its bonus plays out over more than a single turn. You may discard a Data Crystal to place the Positron Field on a territory or, if the Positron Field is already on a territory, move it to another territory."

---

### Ambiguity #109: Data Crystal Cost Calculation

**Rule Text:**
> "pay one fuel per colony on a territory"

**Ambiguity:**
Do you count ALL colonies on the territory (from all players), or only your own colonies?

**Interpretation:**
You count ALL colonies on the territory, regardless of which player owns them. This is the total colony count on that territory.

Examples:
- Territory has 2 red + 1 blue colony = 3 total colonies, costs 3 fuel
- Territory has 1 yellow colony only = 1 fuel
- Territory has no colonies = cannot use Data Crystal on it

**Digital Implementation:**
```typescript
function getDataCrystalCost(territory: Territory): number {
  let totalColonies = 0;
  for (const count of territory.colonies.values()) {
    totalColonies += count;
  }
  return totalColonies;
}

function useDataCrystalOnTerritory(
  territory: Territory,
  player: PlayerState
): void {
  // Cannot use on empty territory
  if (territory.colonies.size === 0) {
    throw new Error('Territory has no colonies');
  }
  
  // Cannot use on Isolation Field territory
  if (territory.hasIsolationField) {
    throw new Error('Isolation Field prevents using bonus');
  }
  
  // Cannot use on Burroughs Desert
  if (territory.id === 'BURROUGHS_DESERT') {
    throw new Error('Burroughs Desert exempt from Data Crystal');
  }
  
  // Pay fuel cost
  const cost = getDataCrystalCost(territory);
  const fuelCost = getAlienTechFuelCost('DATA_CRYSTAL', player);
  const totalCost = cost + fuelCost; // Base cost + Pohl Foothills reduction
  
  if (player.resources.fuel < totalCost) {
    throw new Error('Insufficient fuel');
  }
  
  player.resources.fuel -= totalCost;
  
  // Grant temporary bonus for this turn
  grantTerritoryBonus(territory, player);
}
```

---

### Ambiguity #110: Data Crystal and Pohl Foothills

**Rule Text:**
> "Each turn you may pay one fuel per colony on a territory"

**Ambiguity:**
If you control Pohl Foothills (-1 fuel for alien tech), does this reduce the Data Crystal cost?

**Interpretation:**
YES - Pohl Foothills reduces the TOTAL cost of using Data Crystal by 1 fuel. This applies to the entire fuel payment, not per colony.

Examples:
- Territory with 3 colonies: Normally 3 fuel. With Pohl Foothills: 2 fuel total
- Territory with 1 colony: Normally 1 fuel. With Pohl Foothills: 0 fuel (free)
- Territory with 5 colonies: Normally 5 fuel. With Pohl Foothills: 4 fuel total

**Digital Implementation:**
```typescript
function useDataCrystalWithPohl(
  territory: Territory,
  player: PlayerState
): void {
  let cost = getDataCrystalCost(territory);
  
  // Pohl Foothills: -1 fuel for using alien tech card
  if (player.controlsTerritory('POHL_FOOTHILLS')) {
    cost = Math.max(cost - 1, 0);
  }
  
  if (player.resources.fuel < cost) {
    throw new Error('Insufficient fuel');
  }
  
  player.resources.fuel -= cost;
  grantTerritoryBonus(territory, player);
}
```

---

### Ambiguity #111: Data Crystal Example and Heinlein Plains

**Rule Text (Example):**
> "You roll a 1, 6, and 6. You have a lot of fuel and you need to convert it to ore, but the pair of 6s gives you a very poor trading ratio at the Orbital Market. Heinlein Plains has one green colony and one red colony on it, so you pay two fuel and use your Data Crystal to borrow the Heinlein Plains bonus. You now receive a 1:1 trade ratio at the Orbital Market, no matter what value pair you dock there."

**Ambiguity:**
Does the Data Crystal bonus persist for the entire turn, or just for one facility use?

**Interpretation:**
The Data Crystal bonus persists FOR THE ENTIRE TURN after you pay for it. In the example, you:
1. Roll ships
2. Pay 2 fuel to use Data Crystal on Heinlein Plains
3. Gain Heinlein Plains bonus (1:1 trade ratio) for the rest of your turn
4. Can dock at Orbital Market multiple times with the 1:1 ratio

**Digital Implementation:**
```typescript
interface PlayerTurnState {
  activeDataCrystalBonuses: Territory[]; // Territories borrowed this turn
}

function useDataCrystal(
  territory: Territory,
  player: PlayerState,
  turn: PlayerTurnState
): void {
  // Pay cost
  const cost = getDataCrystalCost(territory);
  player.resources.fuel -= cost;
  
  // Grant bonus for entire turn
  turn.activeDataCrystalBonuses.push(territory);
}

function hasHeinleinPlainsBonus(
  player: PlayerState,
  turn: PlayerTurnState
): boolean {
  // Check if controlling Heinlein Plains
  if (player.controlsTerritory('HEINLEIN_PLAINS')) {
    return true;
  }
  
  // Check if borrowed via Data Crystal
  return turn.activeDataCrystalBonuses.some(t => t.id === 'HEINLEIN_PLAINS');
}
```

---

## Summary

This document identifies **15 ambiguities** (Ambiguities #97-111) in Alien Tech Card general rules and first 3 cards:

**General Rules (6 ambiguities):**
- "Immediately after acquire" means same turn (except Resource Cache)
- "Once per turn" applies per card (can use multiple cards same turn)
- Can discard card same turn acquired (if not used)
- One discard total per turn
- Cannot possess duplicate cards (raided duplicates discarded)
- Ship value changes invalid if result < 1 or > 6
- Deck reshuffles automatically when exhausted

**Alien City and Alien Monument (3 ambiguities):**
- VP cards give +1 VP each (permanent while possessed)
- Can possess both simultaneously (different cards, not duplicates)
- Cannot discard (no discard power), only lose via Raiders' Outpost

**Booster Pod (3 ambiguities):**
- "Unplaced" means rolled but not docked (in hand)
- Discard power broadened in 2nd Print (any field generator, any territory)
- Removed field generators can be rebuilt by discarding appropriate card

**Data Crystal (3 ambiguities):**
- Cost is 1 fuel per colony (all colonies, all players)
- Pohl Foothills reduces total cost by 1 fuel
- Bonus persists entire turn after payment

**Total ambiguities so far: 111 across 7 documents**

Next document should cover: **Alien Tech Cards Part 2** (Gravity Manipulator, Holographic Decoy, Orbital Teleporter, Plasma Cannon, Polarity Device, Resource Cache, Stasis Beam, Temporal Warper)

