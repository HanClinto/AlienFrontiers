# Alien Tech Cards Part 3 - Rules Ambiguities (v2)

Based on: AlienFrontiersRules-2ndPrint.pdf (2011 Edition)

## Resource Cache

**Official Rules Text (Page 15):**
> "You receive free resources each turn for as long as you possess the Resource Cache. Count the odd and even value ships after you roll your fleet but before you use any alien tech cards.
> - If you have more odd ships, you receive one ore.
> - If you have more even ships, you receive one fuel.
> - If you have an equal number of odd and even ships you receive one fuel and one ore and you must immediately discard the Resource Cache.
>
> Unlike every other alien tech card, the Resource Cache cannot be used on the turn you acquire it.
>
> The Resource Cache card is only discarded if you roll equal numbers of odd and even valued ships."

---

### Ambiguity #132: Resource Cache Timing

**Rule Text:**
> "Count the odd and even value ships after you roll your fleet but before you use any alien tech cards."

**Ambiguity:**
At what exact point in the turn sequence do you count ships for Resource Cache?

**Interpretation:**
The sequence is:
1. Gather ships from Maintenance Bay
2. Roll your fleet
3. **COUNT SHIPS FOR RESOURCE CACHE** (before any tech cards)
4. Receive resources from Resource Cache
5. Use alien tech cards to modify ship values
6. Dock ships at facilities

This ensures Resource Cache is evaluated based on natural die rolls, not modified values.

**Digital Implementation:**
```typescript
interface TurnSequence {
  phase: 'GATHER' | 'ROLL' | 'RESOURCE_CACHE' | 'TECH_CARDS' | 'DOCK';
}

function executeTurnSequence(player: PlayerState): void {
  // Phase 1: Gather ships
  gatherShipsFromMaintenanceBay(player);
  
  // Phase 2: Roll fleet
  rollFleet(player);
  
  // Phase 3: Resource Cache (before any tech cards)
  if (player.hasCard('RESOURCE_CACHE')) {
    evaluateResourceCache(player);
  }
  
  // Phase 4: Use tech cards (can modify ship values)
  allowTechCardUse(player);
  
  // Phase 5: Dock ships
  allowShipDocking(player);
}

function evaluateResourceCache(player: PlayerState): void {
  const ships = player.shipsInHand;
  
  let oddCount = 0;
  let evenCount = 0;
  
  for (const ship of ships) {
    if (ship.value % 2 === 1) {
      oddCount++;
    } else {
      evenCount++;
    }
  }
  
  if (oddCount > evenCount) {
    player.resources.ore += 1;
  } else if (evenCount > oddCount) {
    player.resources.fuel += 1;
  } else {
    // Equal: gain both and discard card
    player.resources.ore += 1;
    player.resources.fuel += 1;
    discardCard(player, 'RESOURCE_CACHE');
  }
}
```

---

### Ambiguity #133: Resource Cache Odd/Even Calculation

**Rule Text:**
> "Count the odd and even value ships"

**Ambiguity:**
How do you count odd vs even? What values are odd and even?

**Interpretation:**
Standard odd/even:
- **Odd**: 1, 3, 5
- **Even**: 2, 4, 6

Count all ships in your hand after rolling.

**Digital Implementation:**
```typescript
function isOdd(value: number): boolean {
  return value % 2 === 1;
}

function isEven(value: number): boolean {
  return value % 2 === 0;
}

function countOddEvenShips(ships: Ship[]): { odd: number, even: number } {
  let odd = 0;
  let even = 0;
  
  for (const ship of ships) {
    if (isOdd(ship.value)) {
      odd++;
    } else {
      even++;
    }
  }
  
  return { odd, even };
}
```

---

### Ambiguity #134: Resource Cache Automatic Discard

**Rule Text:**
> "If you have an equal number of odd and even ships you receive one fuel and one ore and you must immediately discard the Resource Cache."

**Ambiguity:**
Is the discard mandatory (automatic), or optional? Can you keep the card if you want?

**Interpretation:**
The discard is MANDATORY (not optional). The word "must" makes this clear. If you roll equal odd/even, you:
1. Receive 1 fuel + 1 ore
2. MUST discard Resource Cache immediately
3. Cannot use it on future turns

**Digital Implementation:**
```typescript
function evaluateResourceCache(player: PlayerState): void {
  const { odd, even } = countOddEvenShips(player.shipsInHand);
  
  if (odd === even) {
    // Equal: gain both resources
    player.resources.ore += 1;
    player.resources.fuel += 1;
    
    // MUST discard (not optional)
    const index = player.alienTechCards.findIndex(c => c.name === 'RESOURCE_CACHE');
    const card = player.alienTechCards.splice(index, 1)[0];
    discardPile.push(card);
  } else if (odd > even) {
    player.resources.ore += 1;
  } else {
    player.resources.fuel += 1;
  }
}
```

---

### Ambiguity #135: Resource Cache Cannot Use on Turn Acquired

**Rule Text:**
> "Unlike every other alien tech card, the Resource Cache cannot be used on the turn you acquire it."

**Ambiguity:**
Why this restriction? Does this mean you don't get resources on the turn you claim it?

**Interpretation:**
You do NOT evaluate Resource Cache on the turn you acquire it. The reason is timing:
- You acquire Resource Cache during your turn (after rolling)
- Resource Cache evaluates AFTER rolling (beginning of turn)
- Therefore, you already rolled this turn before acquiring it
- Resource Cache will evaluate on your NEXT turn (after rolling)

**Digital Implementation:**
```typescript
interface TurnState {
  cardsAcquiredThisTurn: Set<string>;
}

function evaluateResourceCache(player: PlayerState, turn: TurnState): void {
  // Skip if acquired this turn
  if (turn.cardsAcquiredThisTurn.has('RESOURCE_CACHE')) {
    return;
  }
  
  // Normal evaluation
  const { odd, even } = countOddEvenShips(player.shipsInHand);
  
  if (odd === even) {
    player.resources.ore += 1;
    player.resources.fuel += 1;
    discardCard(player, 'RESOURCE_CACHE');
  } else if (odd > even) {
    player.resources.ore += 1;
  } else {
    player.resources.fuel += 1;
  }
}

function claimAlienTechCard(
  card: AlienTechCard,
  player: PlayerState,
  turn: TurnState
): void {
  player.alienTechCards.push(card);
  
  // Track acquisition
  if (card.name === 'RESOURCE_CACHE') {
    turn.cardsAcquiredThisTurn.add('RESOURCE_CACHE');
  }
}
```

---

### Ambiguity #136: Resource Cache Only Discards on Equal

**Rule Text:**
> "The Resource Cache card is only discarded if you roll equal numbers of odd and even valued ships."

**Ambiguity:**
Can you voluntarily discard Resource Cache for any reason?

**Interpretation:**
Resource Cache:
- Has NO fuel power (cannot use during turn)
- Has NO discard power (cannot voluntarily discard)
- Is ONLY discarded when rolling equal odd/even

This makes it different from all other cards. Once you have it, you keep it until you roll equal odd/even, or lose it via Raiders' Outpost.

**Digital Implementation:**
```typescript
const RESOURCE_CACHE: AlienTechCard = {
  id: 'resource_cache_1',
  name: 'RESOURCE_CACHE',
  fuelCost: 0,
  hasFuelPower: false,
  hasDiscardPower: false,
  givesVP: false,
  canUseImmediately: false, // Special: cannot use on turn acquired
  autoDiscard: (player: PlayerState) => {
    const { odd, even } = countOddEvenShips(player.shipsInHand);
    return odd === even;
  }
};

function canDiscardCard(card: AlienTechCard): boolean {
  // Resource Cache cannot be voluntarily discarded
  if (card.name === 'RESOURCE_CACHE') {
    return false;
  }
  
  // Other cards can be discarded if they have discard power
  return card.hasDiscardPower;
}
```

---

### Ambiguity #137: Resource Cache Example Clarification

**Rule Text (Example):**
> "You dock a 3 and a 6 at the Alien Artifact and claim a Resource Cache card. You do not gain any benefit from the card until your next turn when you gather and roll your fleet."

**Ambiguity:**
Does this confirm the timing? Is the example accurate?

**Interpretation:**
YES - the example confirms:
1. Claim Resource Cache during your turn (after rolling)
2. Do NOT evaluate it this turn
3. On NEXT turn, gather and roll
4. AFTER rolling, evaluate Resource Cache
5. Gain resources based on odd/even count

**Digital Implementation:**
```typescript
function resourceCacheExample() {
  // Turn 1: Acquire Resource Cache
  const ship3 = { value: 3 };
  const ship6 = { value: 6 };
  
  dockAtAlienArtifact([ship3, ship6], player);
  const card = claimAlienTechCard('RESOURCE_CACHE', player, turn);
  
  // No benefit this turn
  // (already rolled, Resource Cache evaluates after rolling)
  
  // Turn 2: Next turn begins
  gatherShipsFromMaintenanceBay(player);
  rollFleet(player); // Roll: e.g., [2, 4, 5]
  
  // Evaluate Resource Cache (after rolling, before tech cards)
  const { odd, even } = countOddEvenShips(player.shipsInHand);
  // odd = 1 (the 5), even = 2 (the 2 and 4)
  // even > odd, so gain 1 fuel
  player.resources.fuel += 1;
}
```

---

## Stasis Beam

**Official Rules Text (Page 15):**
> "Each turn you may pay one fuel to decrease the value of one of your unplaced ships by one point. You may discard a Stasis Beam to place the Isolation Field on a territory or, if the Isolation Field is already on a territory, move it to another territory."

---

### Ambiguity #138: Stasis Beam Value Decrease Limit

**Rule Text:**
> "decrease the value of one of your unplaced ships by one point"

**Ambiguity:**
Can you decrease a ship showing 1? What's the minimum value?

**Interpretation:**
You CANNOT decrease a ship showing 1 (minimum value is 1). Attempting to decrease below 1 is invalid.

**Digital Implementation:**
```typescript
function useStasisBeam(
  ship: Ship,
  player: PlayerState
): void {
  // Cannot decrease below 1
  if (ship.value <= 1) {
    throw new Error('Cannot decrease ship value below 1');
  }
  
  // Must be unplaced
  if (!player.shipsInHand.includes(ship)) {
    throw new Error('Ship must be unplaced');
  }
  
  // Pay fuel cost
  const fuelCost = getAlienTechFuelCost('STASIS_BEAM', player);
  player.resources.fuel -= fuelCost;
  
  // Decrease value
  ship.value -= 1;
}
```

---

### Ambiguity #139: Stasis Beam Example

**Rule Text (Example):**
> "You roll a 1, 2 and 5. You pay one fuel and use the Stasis Beam's power to decrease the 2 to a 1 so that you can use the pair of 1s to get a favorable trading ratio at the Orbital Market."

**Ambiguity:**
Why is this useful? What's the trading ratio benefit?

**Interpretation:**
At Orbital Market, the trading ratio is based on ship value:
- Pair of 5s: 5:1 (5 fuel → 1 ore)
- Pair of 1s: 1:1 (1 fuel → 1 ore)

Lower values give better ratios when trading fuel for ore. The example shows:
1. Roll: 1, 2, 5
2. Use Stasis Beam on the 2 → becomes 1
3. Now have pair of 1s (1, 1, 5)
4. Trade at Orbital Market with 1:1 ratio (best possible)

**Digital Implementation:**
```typescript
function stasisBeamExample() {
  const ships = [
    { value: 1 },
    { value: 2 },
    { value: 5 }
  ];
  
  // Use Stasis Beam on ship showing 2
  useStasisBeam(ships[1], player);
  // ships[1].value is now 1
  
  // Now have: [1, 1, 5]
  // Dock pair of 1s at Orbital Market
  const pair = [ships[0], ships[1]];
  dockAtOrbitalMarket(pair, player);
  
  // Trade ratio = 1:1 (based on ship value of 1)
  // Pay 1 fuel, gain 1 ore (best ratio)
  tradeAtOrbitalMarket(player, 1); // Trade once
  // Cost: 1 fuel, Gain: 1 ore
}
```

---

### Ambiguity #140: Stasis Beam vs Booster Pod Symmetry

**Rule Text:**
> "decrease the value of one of your unplaced ships by one point"

**Ambiguity:**
Stasis Beam decreases by 1, Booster Pod increases by 1. Are they perfect opposites?

**Interpretation:**
YES - they are symmetric:
- **Booster Pod**: +1 to ship value (max 6)
- **Stasis Beam**: -1 to ship value (min 1)

Both cost 1 fuel (2 fuel with Pohl Foothills reduction = 0 fuel).

**Digital Implementation:**
```typescript
function compareBoosterPodAndStasisBeam() {
  const ship = { value: 3 };
  
  // Booster Pod: increase
  useBoosterPod(ship, player);
  console.log(ship.value); // 4
  
  // Stasis Beam: decrease
  useStasisBeam(ship, player);
  console.log(ship.value); // 3 (back to original)
  
  // Limits
  const ship1 = { value: 1 };
  useStasisBeam(ship1, player); // ERROR: cannot go below 1
  
  const ship6 = { value: 6 };
  useBoosterPod(ship6, player); // ERROR: cannot go above 6
}
```

---

## Temporal Warper

**Official Rules Text (Page 15):**
> "Each turn you may pay one fuel to re-roll as many of your unplaced ships as you like. You may discard a Temporal Warper to claim one alien tech card of your choice from the discard pile. You may look through the discard pile before discarding your Temporal Warper card."

---

### Ambiguity #141: Temporal Warper Re-roll Selection

**Rule Text:**
> "re-roll as many of your unplaced ships as you like"

**Ambiguity:**
Can you choose WHICH ships to re-roll, or must you re-roll all of them?

**Interpretation:**
You CHOOSE which ships to re-roll. You can:
- Re-roll all ships
- Re-roll some ships (select specific ones)
- Re-roll one ship
- Re-roll zero ships (though this would be pointless)

**Digital Implementation:**
```typescript
function useTemporalWarper(
  shipsToReroll: Ship[],
  player: PlayerState
): void {
  // Must all be unplaced
  for (const ship of shipsToReroll) {
    if (!player.shipsInHand.includes(ship)) {
      throw new Error('Can only re-roll unplaced ships');
    }
  }
  
  // Pay fuel cost
  const fuelCost = getAlienTechFuelCost('TEMPORAL_WARPER', player);
  player.resources.fuel -= fuelCost;
  
  // Re-roll selected ships
  for (const ship of shipsToReroll) {
    ship.value = rollDie();
  }
}

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}
```

---

### Ambiguity #142: Temporal Warper Example 1

**Rule Text (Example 1):**
> "You roll a 1, 2, and 5. You use the Temporal Warper to re-roll the 1 and 2, hoping to get some higher numbers."

**Ambiguity:**
Can you re-roll multiple times per turn with the same Temporal Warper?

**Interpretation:**
NO - like all fuel-based alien tech cards, Temporal Warper can only be used ONCE per turn. You choose which ships to re-roll, then re-roll them once.

If you're unlucky with the re-roll, you cannot use Temporal Warper again until your next turn.

**Digital Implementation:**
```typescript
function temporalWarperExample1() {
  const ships = [
    { value: 1 },
    { value: 2 },
    { value: 5 }
  ];
  
  // Choose to re-roll the 1 and 2
  const shipsToReroll = [ships[0], ships[1]];
  
  useTemporalWarper(shipsToReroll, player);
  // ships[0].value is now random 1-6
  // ships[1].value is now random 1-6
  // ships[2].value remains 5
  
  // Cannot use Temporal Warper again this turn
  // (already used once)
}
```

---

### Ambiguity #143: Temporal Warper Discard Power

**Rule Text:**
> "You may discard a Temporal Warper to claim one alien tech card of your choice from the discard pile. You may look through the discard pile before discarding your Temporal Warper card."

**Ambiguity:**
Can you claim ANY card from the discard pile, or are there restrictions?

**Interpretation:**
You can claim ANY card from the discard pile EXCEPT:
- Cards you already possess (duplicate restriction)
- If no valid cards in discard pile, you cannot use this power

You look through the discard pile first, then decide whether to discard Temporal Warper.

**Digital Implementation:**
```typescript
function canClaimFromDiscardPile(
  card: AlienTechCard,
  player: PlayerState
): boolean {
  // Cannot claim duplicates
  if (player.alienTechCards.some(c => c.name === card.name)) {
    return false;
  }
  
  return true;
}

function discardTemporalWarper(
  targetCard: AlienTechCard,
  player: PlayerState
): void {
  // Check if card is in discard pile
  const index = discardPile.findIndex(c => c.id === targetCard.id);
  if (index === -1) {
    throw new Error('Card not in discard pile');
  }
  
  // Check if can claim (no duplicates)
  if (!canClaimFromDiscardPile(targetCard, player)) {
    throw new Error('Already possess this card');
  }
  
  // Remove target card from discard pile
  discardPile.splice(index, 1);
  
  // Add to player's hand
  player.alienTechCards.push(targetCard);
  
  // Discard Temporal Warper
  discardCardForPower('TEMPORAL_WARPER', player);
}
```

---

### Ambiguity #144: Temporal Warper Looking at Discard Pile

**Rule Text:**
> "You may look through the discard pile before discarding your Temporal Warper card."

**Ambiguity:**
Can all players look at the discard pile at any time, or is this special to Temporal Warper?

**Interpretation:**
The discard pile is PUBLIC INFORMATION - any player can look at it at any time. The rule text clarifies that you can look BEFORE committing to discard Temporal Warper (to ensure there's a card you want).

The sequence is:
1. Look through discard pile (public information)
2. Decide which card you want (if any)
3. If you want a card, discard Temporal Warper and claim it
4. If no desirable cards, keep Temporal Warper

**Digital Implementation:**
```typescript
interface DiscardPile {
  cards: AlienTechCard[];
  isPublic: boolean; // Always true
}

function viewDiscardPile(discardPile: DiscardPile): AlienTechCard[] {
  // Anyone can view at any time
  return [...discardPile.cards];
}

function discardTemporalWarperInteractive(
  player: PlayerState,
  discardPile: DiscardPile
): void {
  // Step 1: View discard pile
  const availableCards = viewDiscardPile(discardPile);
  
  // Step 2: Filter out cards player already has
  const validCards = availableCards.filter(c => 
    !player.alienTechCards.some(pc => pc.name === c.name)
  );
  
  // Step 3: Player chooses (or cancels)
  if (validCards.length === 0) {
    console.log('No valid cards in discard pile');
    return; // Don't discard Temporal Warper
  }
  
  const chosenCard = playerChoosesCard(validCards);
  
  // Step 4: Discard Temporal Warper and claim card
  discardTemporalWarper(chosenCard, player);
}
```

---

### Ambiguity #145: Temporal Warper Example 2

**Rule Text (Example 2):**
> "You review the alien tech discard pile and see an Alien City card. You discard your Temporal Warper and take the Alien City card."

**Ambiguity:**
Can you use Temporal Warper to reclaim VP cards? Is this a common strategy?

**Interpretation:**
YES - Temporal Warper is excellent for reclaiming valuable cards:
- **Alien City / Alien Monument**: +1 VP cards
- **Gravity Manipulator**: Powerful ship manipulation
- **Plasma Cannon**: Remove opponent ships
- Any card you lost via Raiders' Outpost

This is a strategic way to recover lost VP or powerful cards.

**Digital Implementation:**
```typescript
function temporalWarperExample2() {
  // Discard pile contains various cards
  const discardPile = [
    { name: 'ALIEN_CITY', givesVP: true },
    { name: 'BOOSTER_POD', givesVP: false },
    { name: 'STASIS_BEAM', givesVP: false }
  ];
  
  // Player reviews discard pile
  const alienCity = discardPile.find(c => c.name === 'ALIEN_CITY');
  
  // Player discards Temporal Warper to claim Alien City
  discardTemporalWarper(alienCity!, player);
  
  // Result:
  // - Player loses Temporal Warper
  // - Player gains Alien City (+1 VP)
  // - Temporal Warper goes to discard pile
  // - Alien City removed from discard pile
}
```

---

## Summary

This document identifies **14 ambiguities** (Ambiguities #132-145) in the final 3 alien tech cards:

**Resource Cache (6 ambiguities):**
- Evaluates after rolling, before using tech cards (exact timing)
- Odd = 1/3/5, Even = 2/4/6
- Automatic discard on equal odd/even (mandatory, not optional)
- Cannot use on turn acquired (no benefit until next turn)
- Only discarded on equal odd/even (no voluntary discard)
- Example confirms timing (no benefit turn acquired, evaluate next turn)

**Stasis Beam (3 ambiguities):**
- Cannot decrease below 1 (minimum ship value)
- Example shows trading ratio optimization (pair of 1s = 1:1 best ratio)
- Symmetric opposite of Booster Pod (+1 vs -1)

**Temporal Warper (5 ambiguities):**
- Choose which ships to re-roll (not all or nothing)
- Can only use once per turn (like all fuel-based cards)
- Can claim any card from discard pile (except duplicates)
- Discard pile is public information (can look before committing)
- Common strategy: reclaim VP cards or powerful cards

**Total ambiguities so far: 145 across 9 documents**

**All 12 Alien Tech Cards Completed:**
1. Alien City ✓
2. Alien Monument ✓
3. Booster Pod ✓
4. Data Crystal ✓
5. Gravity Manipulator ✓
6. Holographic Decoy ✓
7. Orbital Teleporter ✓
8. Plasma Cannon ✓
9. Polarity Device ✓
10. Resource Cache ✓
11. Stasis Beam ✓
12. Temporal Warper ✓

Next document should cover: **Edge Cases and Cross-System Interactions** (final summary document with rare scenarios)

