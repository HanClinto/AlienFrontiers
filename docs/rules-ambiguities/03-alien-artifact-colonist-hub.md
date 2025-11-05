# Alien Artifact & Colonist Hub Ambiguities (Page 7)

## Source Text Review
**Page 7** covers two complex facilities: Alien Artifact (card cycling and claiming) and Colonist Hub (advancement track mechanics).

---

## AMBIGUITY #24: Alien Artifact - Cycling Is Optional Per Ship

**Rule Text:** "Each ship you dock at the Alien Artifact may be of any value and allows you to discard the alien tech cards on display and lay out three new cards from the deck. This is called 'cycling' and it is optional."

**Ambiguity:**
1. Is cycling optional per ship or per turn?
2. If you dock 3 ships, can you cycle 0 times, 1 time, 2 times, or 3 times?
3. Can you choose to cycle with ship #1, not cycle with ship #2, then cycle again with ship #3?

**Interpretation:**
- Cycling is optional **per ship**
- If you dock 3 ships, you can cycle 0-3 times (your choice for each ship)
- YES - You can cycle selectively with different ships

**Example:** You dock ships with values 2, 3, 4 (total 9, which is >7). You cycle with the 2 (discard 3 cards, draw 3 new). You don't like what you see, so you cycle with the 3 (discard those 3, draw 3 new). Now you see a card you want, so you DON'T cycle with the 4. You claim the card (since 2+3+4=9 > 7).

**Digital Implementation:**

```javascript
function dockAtAlienArtifact(player, ships) {
  let totalValue = 0;
  
  for (let ship of ships) {
    facility.dock(ship, player);
    totalValue += ship.value;
    
    // Prompt: cycle or not?
    if (player.chooseToCycle()) {
      alienArtifactDisplay.discard();
      alienArtifactDisplay.draw(3);
    }
  }
  
  // After all cycling complete, check if can claim
  if (totalValue > 7) {
    player.mayClaimCard(alienArtifactDisplay);
  }
}
```

---

## AMBIGUITY #25: Alien Artifact - Can You Claim Without Cycling?

**Rule Text:** "Each ship you dock at the Alien Artifact may be of any value and allows you to discard the alien tech cards on display... To claim one of the alien tech cards on display you need to have docked ships with a total value of more than 7."

**Ambiguity:** Can you dock ships totaling >7 and claim a card WITHOUT cycling at all?

**Interpretation:** YES. Cycling is optional. You can dock a 2 and a 6 (total 8) and immediately claim a card from the current display without cycling.

**Example:** The display shows [Plasma Cannon, Booster Pod, Data Crystal]. You want the Plasma Cannon. You dock a 5 and a 3 (total 8 > 7) and choose NOT to cycle with either ship. You claim Plasma Cannon.

**Digital Implementation:**

```javascript
// Cycling is separate from claiming
function dockAtAlienArtifact(player, ships) {
  let totalValue = ships.reduce((sum, s) => sum + s.value, 0);
  
  // Optional cycling phase
  for (let ship of ships) {
    if (player.wantsToCycle()) {
      cycleDisplay();
    }
  }
  
  // Claiming phase (if qualified)
  if (totalValue > 7) {
    let availableCards = display.filter(card => !player.hasCard(card.name));
    if (availableCards.length > 0) {
      player.mayClaimCard(availableCards);
    }
  }
}
```

---

## AMBIGUITY #26: Alien Artifact - Multiple Claims Per Turn

**Rule Text (Example 3):** "You could dock a fourth ship there and cycle the cards again but you could not claim a second alien tech card because the 'more than 7' requirement is a separate total for each card you claim."

**Ambiguity:** 
1. Can you claim multiple cards in one turn if you dock multiple sets of ships totaling >7?
2. Does each claim require a "fresh" set of ships, or is the total cumulative?

**Interpretation:**
- You CAN claim multiple cards in one turn
- Each claim requires a SEPARATE total >7
- Ships used for first claim cannot count toward second claim

**Example:** You dock 2+6 (total 8), claim card #1. Then you dock 3+5 (total 8), claim card #2. This is two separate claims, two separate totals.

**Clarification:** Example 3 says "you could not claim a second alien tech card" but this is because you've already counted those ships toward the FIRST claim. The "separate total" means you need NEW ships for the second claim.

**Digital Implementation:**

```javascript
function dockAtAlienArtifact(player, ships) {
  let claimsThisTurn = 0;
  let shipsUsedForClaim = new Set();
  
  facility.dock(ships, player);
  
  // After docking all ships, check for claims
  let unusedShips = ships.filter(s => !shipsUsedForClaim.has(s.id));
  let totalValue = unusedShips.reduce((sum, s) => sum + s.value, 0);
  
  if (totalValue > 7) {
    if (player.claimCard()) {
      // Mark these ships as used for this claim
      unusedShips.forEach(s => shipsUsedForClaim.add(s.id));
      claimsThisTurn++;
    }
  }
  
  // Cannot make another claim with same ships
  // (but could make another claim with different ships on different turn)
}
```

---

## AMBIGUITY #27: Alien Artifact - Already Have Card

**Rule Text:** "You may not claim an alien tech card you already have."

**Ambiguity:** What happens if all 3 displayed cards are ones you already have?

**Interpretation:** You are stuck. You can cycle the display (discard all 3, draw 3 new) but if you don't want to cycle, you cannot claim anything. This is a strategic consideration - don't collect too many cards or you'll limit your Alien Artifact options.

**Digital Implementation:**

```javascript
function getClaimableCards(player, display) {
  return display.filter(card => {
    return !player.alienTech.some(owned => owned.name === card.name);
  });
}

// UI should show which cards are claimable vs already owned
function dockAtAlienArtifact(player, ships) {
  let claimableCards = getClaimableCards(player, display);
  
  if (claimableCards.length === 0) {
    // Show message: "All displayed cards are already in your collection"
    // Player's only option is to cycle (or not dock here at all)
  }
}
```

---

## AMBIGUITY #28: Colonist Hub - First Ship Requirements

**Rule Text:** "If you do not have a colony at the Colonist Hub then the first ship placed here requires you to place one of your unplaced colonies on the first advancement circle."

**Ambiguity:**
1. Is "the first ship" the first ship EVER, or first ship THIS TURN?
2. If you have a colony on track 1, and you dock at track 2, is that "the first ship"?

**Interpretation:**
1. First ship means: "if you don't currently have a colony on ANY advancement track"
2. If you already have a colony on a track, you must use that same track (see Ambiguity #29)

**Digital Implementation:**

```javascript
function dockAtColonistHub(player, ship) {
  let existingTrack = colonistHub.getTrackWithPlayerColony(player.id);
  
  if (!existingTrack) {
    // First ship - must start a new colony
    if (player.coloniesRemaining === 0) {
      throw new Error("No unplaced colonies available");
    }
    
    let availableTrack = colonistHub.getAvailableTrack();
    availableTrack.addColony(player.id);
    player.coloniesRemaining--;
    player.colonistHubTrack = availableTrack.id;
  } else {
    // Subsequent ship - advance existing colony
    existingTrack.advanceColony(player.id, 1);
  }
}
```

---

## AMBIGUITY #29: Colonist Hub - "Use Only One Track at a Time"

**Rule Text:** "Each player may not use more than one advancement track at a time."

**Ambiguity:**
1. Can you switch tracks between turns?
2. What if you launch a colony, then start a new one - can you use a different track?

**Interpretation:**
1. NO - Once you start on a track, you're locked to that track until colony is launched
2. YES - After launching, you can start on any available track (including your original track)

**Example:** You start a colony on Track 1. Over several turns, you advance it to circle 7 and launch it. Next turn, you can start a new colony on Track 2, Track 3, or Track 1 again.

**Digital Implementation:**

```javascript
function dockAtColonistHub(player, ship) {
  let activeTrack = colonistHub.getTrackWithPlayerColony(player.id);
  
  if (activeTrack) {
    // Must use same track until launched
    if (activeTrack.id !== requestedTrack.id) {
      throw new Error("You must complete your colony on Track " + activeTrack.id);
    }
    
    activeTrack.advanceColony(player.id, 1);
    
    // Check if ready to launch
    if (activeTrack.getColonyPosition(player.id) === 7) {
      // Player may choose to launch (costs 1F + 1O)
      if (player.chooseToLaunch() && player.fuel >= 1 && player.ore >= 1) {
        launchColony(player, activeTrack);
      }
    }
  }
}
```

---

## AMBIGUITY #30: Colonist Hub - Advancement Per Ship

**Rule Text:** "Each ship docked advances the colony one circle."

**Ambiguity:** 
1. If you dock 3 ships in one turn, do you advance 3 circles?
2. Does Asimov Crater bonus apply (+1 when docking >1 ship)?

**Interpretation:**
1. YES - Each ship = 1 advance, so 3 ships = 3 advances in one turn
2. YES - If you control Asimov Crater and dock 2+ ships, you get bonus advances

**Example:** You control Asimov Crater and dock 3 ships at Colonist Hub. You advance: 3 (base) + 1 (Asimov bonus) = 4 circles in one turn.

**Digital Implementation:**

```javascript
function dockAtColonistHub(player, ships) {
  let track = colonistHub.getTrackWithPlayerColony(player.id);
  let baseAdvances = ships.length;
  let bonusAdvances = 0;
  
  // Asimov Crater bonus: +1 if docking >1 ship
  if (ships.length > 1 && player.controlsTerritory('AsimovCrater')) {
    bonusAdvances = 1;
  }
  
  let totalAdvances = baseAdvances + bonusAdvances;
  track.advanceColony(player.id, totalAdvances);
}
```

---

## AMBIGUITY #31: Colonist Hub - Launch Timing

**Rule Text:** "When the colony reaches the seventh and final advancement circle you may launch it at your convenience by paying one fuel and one ore."

**Ambiguity:**
1. Can you launch immediately when reaching circle 7?
2. Must you launch, or can you wait?
3. Can you launch on a different turn?

**Interpretation:**
1. YES - "at your convenience" means you choose the timing
2. Optional - "may launch" not "must launch"
3. YES - You can wait multiple turns before launching (but cannot start a new colony until you launch the current one)

**Example:** You advance to circle 7 but only have 1 fuel and 0 ore. You choose not to launch. Next turn, you gather your ships from Colonist Hub, gain ore elsewhere, then use other ships to place a colony via Terraforming Station instead (see Ambiguity #33).

**Digital Implementation:**

```javascript
function dockAtColonistHub(player, ships) {
  let track = colonistHub.getTrackWithPlayerColony(player.id);
  track.advanceColony(player.id, ships.length);
  
  if (track.getColonyPosition(player.id) >= 7) {
    // Offer launch option (not mandatory)
    if (player.fuel >= 1 && player.ore >= 1) {
      let wantsToLaunch = player.promptLaunchOption();
      if (wantsToLaunch) {
        player.fuel--;
        player.ore--;
        launchColonyFromHub(player, track);
      }
    } else {
      // Cannot afford to launch - colony stays on track
    }
  }
}
```

---

## AMBIGUITY #32: Colonist Hub - Excess Advances

**Rule Text:** "If you earn more advances than are needed to move your colony to the seventh circle (see Asimov Crater below) and launch the colony immediately, you may use the excess advances to begin work on a new colony."

**Ambiguity:**
1. Must you launch immediately to use excess advances?
2. If you're at circle 6 and advance 4 circles, do you go to circle 10 (wrap around)?
3. How many excess advances carry over?

**Interpretation:**
1. YES - You must launch "immediately" (pay the 1F+1O right away) to use excess advances
2. NO - Colony stops at circle 7. If you have 6 advances and need 1, you have 5 excess
3. ALL excess advances carry over to a new colony

**Example:** Your colony is at circle 5. You dock 3 ships at Colonist Hub while controlling Asimov Crater. You advance 4 circles (3 base + 1 Asimov). That brings you to circle 5+4=9, but circle 7 is the max. You've "earned" 9-5=4 advances, but only "needed" 7-5=2 advances. You have 4-2=2 excess. If you pay 1F+1O immediately to launch, you can place a new colony on circle 2.

**Digital Implementation:**

```javascript
function dockAtColonistHub(player, ships) {
  let track = colonistHub.getTrackWithPlayerColony(player.id);
  let currentPosition = track.getColonyPosition(player.id);
  let earnedAdvances = ships.length + getAsimovBonus(player, ships.length);
  
  let newPosition = currentPosition + earnedAdvances;
  
  if (newPosition >= 7) {
    // Reached or exceeded circle 7
    let neededAdvances = 7 - currentPosition;
    let excessAdvances = earnedAdvances - neededAdvances;
    
    track.setColonyPosition(player.id, 7);
    
    // Offer immediate launch
    if (player.fuel >= 1 && player.ore >= 1 && player.wantsToLaunch()) {
      player.fuel--;
      player.ore--;
      let territory = player.chooseTerritory();
      placeColonyOnTerritory(player, territory);
      track.removeColony(player.id);
      
      // Apply excess advances to new colony
      if (excessAdvances > 0 && player.coloniesRemaining > 0) {
        track.addColony(player.id);
        player.coloniesRemaining--;
        track.setColonyPosition(player.id, excessAdvances);
      }
    }
  } else {
    // Hasn't reached circle 7 yet
    track.setColonyPosition(player.id, newPosition);
  }
}
```

---

## AMBIGUITY #33: Colonist Hub - Final Colony Not Locked

**Rule Text:** "Your final colony is not locked into the Colonist Hub. If your last colony is on the Colonist Hub and your roll gives you the opportunity to use the Terraforming Station or the Colony Constructor, you may remove the colony from the Colonist Hub and place it on a territory via the rules for those other facilities."

**Ambiguity:**
1. Is this optional or mandatory?
2. What happens to advancement progress if you remove the colony?
3. Can you do this with ANY colony on the hub, or only your final colony?

**Interpretation:**
1. OPTIONAL - "may remove" not "must remove"
2. Progress is LOST - You remove the colony token from the track entirely, losing all advances
3. ONLY final colony - Rule specifically says "your last colony" and "your final colony"

**Example:** You have 1 colony remaining and it's on Colonist Hub at circle 5. You roll a 6 and have 1F+1O. You can:
- Option A: Use Terraforming Station to place the colony immediately (ends game)
- Option B: Keep it on Colonist Hub and continue advancing

**Digital Implementation:**

```javascript
function canRemoveFinalColonyFromHub(player) {
  let track = colonistHub.getTrackWithPlayerColony(player.id);
  
  return (
    track !== null &&
    player.coloniesRemaining === 0 &&  // This is their final colony
    player.totalColoniesOnBoard === player.maxColonies - 1  // All other colonies placed
  );
}

function useAlternativePlacementMethod(player, method) {
  if (method === 'TerraformingStation' && canRemoveFinalColonyFromHub(player)) {
    // Remove from hub (lose progress)
    let track = colonistHub.getTrackWithPlayerColony(player.id);
    track.removeColony(player.id);
    player.coloniesRemaining = 1;  // Now available for placement
    
    // Use Terraforming Station
    useTerraformingStation(player);
  }
}
```

---

## AMBIGUITY #34: Colonist Hub - Ships from Different Turns

**Rule Text:** "Each additional ship you dock here, either on this turn or on subsequent turns, must be placed on this same track until that colony is launched."

**Ambiguity:** Do ships docked on previous turns remain on the Colonist Hub, or are they gathered at start of turn?

**Interpretation:** Ships are GATHERED at the start of your turn (per page 6: "Gather all of your ships from the board"). The rule "either on this turn or on subsequent turns" refers to the advancement progress (which persists), NOT the ships themselves.

**Example:** 
- Turn 1: Dock 2 ships at Colonist Hub → advance to circle 2 → gather ships
- Turn 2: Dock 1 ship at Colonist Hub → advance from circle 2 to circle 3 → gather ships
- The colony's position persists, but ships don't

**Digital Implementation:**

```javascript
// Track state persists across turns
class ColonistHubTrack {
  constructor() {
    this.colonies = {};  // { playerId: position }
    this.dockedShips = [];  // Cleared at start of each player's turn
  }
  
  advanceColony(playerId, amount) {
    this.colonies[playerId] = (this.colonies[playerId] || 0) + amount;
  }
}

// Ships are gathered every turn
function onTurnStart(player) {
  gatherShipsFromAllFacilities(player);  // Includes Colonist Hub
}
```

---

## SUMMARY: Critical Alien Artifact & Colonist Hub Decisions

**Alien Artifact:**
1. **Cycling is optional per ship** (can cycle 0, 1, 2, 3, or 4 times)
2. **Can claim without cycling** (if you like the current display)
3. **Each claim needs separate >7 total** (ships from first claim don't count toward second)
4. **Cannot claim cards you already own** (strategic consideration)

**Colonist Hub:**
5. **First ship starts a new colony** (if no colony on track)
6. **Locked to one track** until colony launched
7. **Each ship = 1 advance** (multiple ships = multiple advances)
8. **Launch is optional** ("may launch" at circle 7)
9. **Excess advances transfer** only if launch immediately
10. **Final colony can be removed** from hub to use other placement methods
11. **Ships are gathered each turn** (only colony position persists)

---

**Next Section:** Colony Constructor through Orbital Market (Page 8)
