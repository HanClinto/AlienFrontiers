# Section 1: Components & Setup (Part 1)

**Pages 1-6 of Complete Rules Reference**

---

## 1.1 Components List

### Game Board
- **1 Game Board** showing the orbital facilities and 8 territories on Mars

### Player Components (per player)
- **3 Player Ships** (dice) in player color (red, blue, yellow, or green)
- **7 Colony Markers** in player color
- **1 Victory Point Marker** in player color
- **1 Player Aid Card** (reference for facilities and turn structure)

### Shared Components
- **1 Relic Ship** (gray die) - neutral ship available for purchase
- **24 Alien Tech Cards** (2 copies of each of 12 unique cards)
- **3 Field Generator Tokens**:
  - 1 Isolation Field (nullifies territory bonus)
  - 1 Positron Field (grants +1 VP)
  - 1 Repulsor Field (prevents colony placement/removal)
- **8 Territory Control Markers** (numbered 1-8 for territory bonuses)
- **Fuel Tokens** (orange cubes representing solar energy)
- **Ore Tokens** (gray cubes representing refined ore)

### Component Summary Table

| Component | Quantity | Purpose |
|-----------|----------|---------|
| Game Board | 1 | Display facilities and territories |
| Player Ships (per color) | 3 | Roll and dock at facilities |
| Relic Ship (gray) | 1 | Purchasable 4th ship |
| Colony Markers (per color) | 7 | Place on territories for VP and control |
| VP Markers (per color) | 1 | Track victory points on VP track |
| Territory Control Markers | 8 | Indicate which player controls each territory |
| Field Generator Tokens | 3 | Modify territory bonuses |
| Alien Tech Cards | 24 | Special powers and VP cards |
| Fuel Tokens | ~50 | Primary resource for card powers |
| Ore Tokens | ~50 | Primary resource for colonies |

---

## 1.2 Component Terminology

Understanding these terms is essential for rule clarity:

### Ship States

**Unplaced Ship**
- Ship in player's hand after rolling
- Can be modified by tech card fuel powers
- Not yet committed to a facility
- Example: After rolling [2, 4, 6], all three ships are unplaced

**Docked Ship**
- Ship placed at a facility, waiting for requirement completion
- Cannot be modified by tech cards
- Still visible at facility location
- Example: Two ships with value 3 at Shipyard (waiting for pair)

**Committed Ship**
- Ship whose facility effect has been resolved
- Cannot be modified or moved (except by Orbital Teleporter)
- Remains at facility until GATHER phase
- Example: Ships at Lunar Mine after gaining ore

### Resource Terms

**Fuel** (orange cubes)
- Primary resource for alien tech card powers
- Gained from Solar Converter facility
- Combined with ore for 8-resource limit

**Ore** (gray cubes)
- Primary resource for placing colonies
- Gained from Lunar Mine facility
- Combined with fuel for 8-resource limit

**Resource Limit**
- Maximum of 8 total resources (fuel + ore combined)
- Checked during CLEANUP phase only
- Player chooses which resources to discard to reach 8

### Victory Point Terms

**Snapshot Victory Points**
- VP recalculated from current game state each CLEANUP phase
- NOT cumulative across turns
- Sources: Colonies placed + Territories controlled + Positron Fields + VP cards

**Colony**
- Marker placed on a territory
- Each colony = 1 VP
- Maximum 7 colonies per player
- Placed via Colony Constructor, Colonist Hub, or Terraforming Station

**Territory Control**
- Strict majority of colonies on a territory (more than any single opponent)
- Each controlled territory = 1 VP
- Grants territory bonus while controlled
- Marked by Territory Control Marker

### Facility Terms

**Dock Space**
- Location at facility where ship can be placed
- Some facilities have limited spaces (2-3 docks)
- Others have unlimited capacity (Lunar Mine, Solar Converter, etc.)

**Facility Requirement**
- Condition that must be met to activate facility effect
- Examples: Pair of ships (Shipyard), Value ≥ 8 (Alien Artifact), Three sequential (Raiders' Outpost)

**Blocking Ship**
- Opponent's ship at a facility
- May prevent your ships from docking (if facility full)
- Can be removed via Plasma Cannon

### Card Terms

**Fuel Power**
- Special ability activated by paying fuel cost
- Can be used once per card per turn
- Can only target unplaced ships (unless specified)
- Example: Booster Pod costs 1 fuel to increase ship value by 1

**Discard Power**
- Special ability activated by discarding the card
- Can only be used once per turn total (across all cards)
- Card is permanently removed from game
- Example: Booster Pod discard removes a field generator

**Tech Card Types**
- **VP Cards**: Alien City, Alien Monument (grant 2 VP each)
- **Passive Cards**: Resource Cache, Holographic Decoy (automatic effects)
- **Dual-Power Cards**: 8 cards with both fuel power and discard power

---

## 1.3 Setup Procedures

Setup varies by player count to maintain game balance.

### Setup Overview

**Common Steps (All Player Counts):**
1. Place game board in center of play area
2. Place Territory Control Markers (numbered 1-8) near corresponding territories
3. Place 3 Field Generator Tokens near board
4. Shuffle 24 Alien Tech Cards, form face-down deck near Alien Artifact
5. Place fuel and ore token pools near board
6. Place Relic Ship (gray die) on Burroughs Desert territory
7. Each player chooses a color and takes:
   - 3 ships (dice) in their color
   - 7 colony markers in their color
   - 1 VP marker in their color
   - 1 player aid card

**Initial Resources:**
- Each player starts with **3 fuel** and **2 ore**
- Place VP markers on "0" space of VP track

### 2-Player Setup

**Blocking Ships:**
- Use 3 ships from an unused color (e.g., green if red and blue are playing)
- Place blocking ships as follows:

| Facility | Blocking Ship Configuration |
|----------|----------------------------|
| Alien Artifact | 1 ship in center dock space |
| Shipyard | 1 ship in one dock space |
| Orbital Market | 1 ship in one dock space |
| Colony Constructor | No blocking ships |
| Colonist Hub | No blocking ships |
| Lunar Mine | No blocking ships |
| Maintenance Bay | No blocking ships |
| Raiders' Outpost | No blocking ships |
| Solar Converter | No blocking ships |
| Terraforming Station | No blocking ships |

**Why Blocking Ships?**
- Prevents dominant strategies from emerging
- Alien Artifact: Reduces tech card access rate
- Shipyard: Makes ship building more competitive
- Orbital Market: Limits early resource conversion

**Blocking Ship Rules:**
- Treated as opponent ships for all purposes
- Can be removed via Plasma Cannon
- Do NOT roll or take turns
- Do NOT gain resources or take actions
- Remain at facilities for entire game (unless removed)

**Ambiguity Resolution (Ref: Ambiguity #3):**
```typescript
// Blocking ships occupy dock spaces
const alienArtifactCapacity = 3;
const blockingShipsAtArtifact = 1;
const availableDocksForPlayers = alienArtifactCapacity - blockingShipsAtArtifact; // 2

// Blocking ships count for facility requirements
function canDockAtShipyard(playerShips: number, blockingShips: number): boolean {
  const totalShips = playerShips + blockingShips;
  const maxCapacity = 2;
  return totalShips <= maxCapacity;
}
```

### 3-Player Setup

**No Blocking Ships**
- All 9 facilities start empty
- Each player begins with standard starting resources (3 fuel, 2 ore)

### 4-Player Setup

**No Blocking Ships**
- All 9 facilities start empty
- Each player begins with standard starting resources (3 fuel, 2 ore)

**Note on 4-Player Balance:**
- Facilities become naturally competitive with more players
- Territory control becomes more contested
- Tech card availability more limited

### Setup Ambiguity Resolutions

**Starting Resources (Ref: Ambiguity #4):**
```typescript
interface PlayerStartingResources {
  fuel: number;  // Always 3
  ore: number;   // Always 2
}

// IMPORTANT: Does NOT vary by player count
function getStartingResources(playerCount: number): PlayerStartingResources {
  return { fuel: 3, ore: 2 }; // Same for 2, 3, or 4 players
}
```

**Blocking Ships Physical Placement (Ref: Ambiguity #3):**
```typescript
// For facilities with numbered dock spaces, use specific positions
const blockingShipPlacements = {
  alienArtifact: {
    dockSpace: 2, // Center dock (numbered 1, 2, 3)
    shipsCount: 1
  },
  shipyard: {
    dockSpace: 1, // Either dock (numbered 1, 2)
    shipsCount: 1
  },
  orbitalMarket: {
    dockSpace: 1, // Either dock (numbered 1, 2)
    shipsCount: 1
  }
};
```

---

## 1.4 Long-Game Variant

For extended play sessions or learning games.

### Standard Game vs Long Game

| Aspect | Standard Game | Long Game |
|--------|--------------|-----------|
| Victory Point Goal | 12 VP | 14 VP |
| Starting Colonies | 0 | 1 per player |
| Average Duration | 60-90 minutes | 90-120 minutes |
| Recommended For | Experienced players | Learning, casual play |

### Long-Game Setup Modification

**Additional Step After Standard Setup:**

1. **Starting Colonies (Ref: Ambiguity #5)**
   - Players place 1 colony each on territories
   - Placement order: Randomly determine first player, then clockwise
   - Restriction: No two colonies on same territory during initial placement
   
   ```typescript
   // Starting colony placement rules
   function canPlaceStartingColony(
     territory: Territory,
     colonies: Colony[]
   ): boolean {
     const coloniesOnTerritory = colonies.filter(c => c.territory === territory);
     return coloniesOnTerritory.length === 0; // Must be empty
   }
   
   // After all colonies placed, calculate initial control
   function calculateInitialControl(territories: Territory[]): void {
     territories.forEach(territory => {
       const control = determineStrictMajority(territory);
       if (control) {
         placeControlMarker(territory, control.player);
       }
     });
   }
   ```

2. **Initial Victory Points**
   - After colony placement, recalculate VP for all players
   - Each player has 1 VP from their colony
   - Move VP markers to "1" on VP track
   
3. **Control Markers**
   - After placement, each player controls 1 territory (their colony)
   - Place Territory Control Markers accordingly

**Long-Game Victory Condition (Ref: Ambiguity #29):**
- Game ends when any player reaches **14 VP** at end of CLEANUP phase
- Standard tie-breakers apply (see Section 7.3)

**Strategic Implications:**
- Players start with territory bonuses immediately
- Early control disputes more likely
- Tech card acquisition may be prioritized
- More resources in circulation from turn 1

---

## 1.5 Core Concepts

These fundamental concepts apply throughout the game.

### Victory Point System

**Snapshot Calculation (Ref: Ambiguity #27, #28):**

Victory points are **recalculated from scratch** each CLEANUP phase, not accumulated.

```typescript
function calculateVictoryPoints(player: Player, gameState: GameState): number {
  let vp = 0;
  
  // 1. Colonies placed (1 VP each)
  vp += player.colonies.filter(c => c.placed).length;
  
  // 2. Territories controlled (1 VP each)
  const controlledTerritories = gameState.territories.filter(t => 
    t.controlledBy === player.id
  );
  vp += controlledTerritories.length;
  
  // 3. Positron Fields on controlled territories (+1 VP each)
  const positronFields = controlledTerritories.filter(t =>
    t.hasFieldGenerator(FieldType.POSITRON)
  );
  vp += positronFields.length;
  
  // 4. VP cards in hand (2 VP each)
  const vpCards = player.techCards.filter(c => 
    c.type === TechCardType.ALIEN_CITY || 
    c.type === TechCardType.ALIEN_MONUMENT
  );
  vp += vpCards.length * 2;
  
  return vp;
}
```

**Example VP Calculation:**

Turn 5, Player has:
- 4 colonies placed on board
- Controls 2 territories (Heinlein Plains, Pohl Foothills)
- Pohl Foothills has Positron Field
- Holds Alien City card

```
VP Calculation:
  Colonies:     4 VP
  Control:      2 VP (2 territories)
  Positron:     1 VP (on controlled territory)
  Tech Cards:   2 VP (Alien City)
  ────────────────
  Total:        9 VP
```

**IMPORTANT: Not Cumulative**

If same player later loses control of Pohl Foothills:

```
VP Recalculation:
  Colonies:     4 VP (unchanged)
  Control:      1 VP (lost Pohl Foothills)
  Positron:     0 VP (no longer control territory with field)
  Tech Cards:   2 VP (Alien City, unchanged)
  ────────────────
  Total:        7 VP (decreased from 9)
```

### Territory Control System

**Strict Majority Algorithm (Ref: Ambiguity #67):**

A player controls a territory if they have **more colonies** than any single opponent.

```typescript
function determineStrictMajority(territory: Territory): Player | null {
  const colonyCounts: Map<Player, number> = new Map();
  
  // Count colonies for each player
  territory.colonies.forEach(colony => {
    const count = colonyCounts.get(colony.owner) || 0;
    colonyCounts.set(colony.owner, count + 1);
  });
  
  // Find player(s) with maximum colonies
  const maxCount = Math.max(...colonyCounts.values());
  const playersWithMax = Array.from(colonyCounts.entries())
    .filter(([player, count]) => count === maxCount);
  
  // Strict majority: only one player has max
  if (playersWithMax.length === 1) {
    return playersWithMax[0][0]; // Return the player
  }
  
  return null; // Tie or empty territory = no control
}
```

**Control Examples:**

| Territory State | Red | Blue | Yellow | Green | Control |
|-----------------|-----|------|--------|-------|---------|
| Example 1 | 2 | 1 | 0 | 0 | Red (2 > 1) |
| Example 2 | 2 | 2 | 0 | 0 | None (tie) |
| Example 3 | 3 | 2 | 1 | 0 | Red (3 > 2) |
| Example 4 | 0 | 0 | 0 | 0 | None (empty) |
| Example 5 | 1 | 1 | 1 | 1 | None (4-way tie) |

**Control Change Timing (Ref: Ambiguity #68):**

Control is reevaluated **immediately** after any colony placement or removal.

```typescript
function placeColony(territory: Territory, player: Player): void {
  // 1. Add colony to territory
  territory.colonies.push({ owner: player });
  
  // 2. Immediately recalculate control
  const newControl = determineStrictMajority(territory);
  
  // 3. Update control marker
  if (newControl !== territory.controlledBy) {
    // Control changed or lost
    territory.controlledBy = newControl;
    
    if (newControl) {
      placeControlMarker(territory, newControl);
    } else {
      removeControlMarker(territory);
    }
    
    // 4. Check Relic Ship return condition (Burroughs Desert only)
    if (territory.name === "Burroughs Desert") {
      checkRelicShipReturn(newControl);
    }
  }
}
```

### Resource Limit System

**8 Resource Maximum (Ref: Ambiguity #30):**

Players cannot have more than **8 total resources** (fuel + ore combined) at end of turn.

```typescript
interface ResourceState {
  fuel: number;
  ore: number;
}

function enforceResourceLimit(player: Player): void {
  const total = player.fuel + player.ore;
  
  if (total <= 8) {
    return; // Within limit
  }
  
  // Player must discard down to 8
  const toDiscard = total - 8;
  
  // Player chooses which resources to discard
  const discardChoice = promptPlayerResourceDiscard(player, toDiscard);
  
  player.fuel -= discardChoice.fuel;
  player.ore -= discardChoice.ore;
  
  // Verify total is now 8
  console.assert(player.fuel + player.ore === 8);
}
```

**Timing: CLEANUP Phase Only**

During ACTION phase, players may temporarily exceed 8 resources:

```typescript
// Example: Player has 7 fuel, 0 ore
// Docks 3 ships at Solar Converter, each grants 2 fuel
// Temporarily: 13 fuel, 0 ore (total = 13, exceeds limit)
// This is LEGAL during ACTION phase

// At CLEANUP phase:
// Player must discard 5 fuel to reach 8 total
// Final: 8 fuel, 0 ore
```

**Player Choice (Ref: Ambiguity #30):**

Player decides which resource types to discard:

```
Player State: 5 fuel, 6 ore (total 11)
Must discard: 3 resources

Valid choices:
- Discard 3 fuel → 2 fuel, 6 ore
- Discard 2 fuel, 1 ore → 3 fuel, 5 ore
- Discard 1 fuel, 2 ore → 4 fuel, 4 ore
- Discard 3 ore → 5 fuel, 3 ore
```

### Ship State System

Ships transition through three states during gameplay:

**State Diagram:**
```
┌─────────────────────────────────────────────────┐
│                 GATHER PHASE                    │
│  Ships return from facilities to hand           │
└──────────────────┬──────────────────────────────┘
                   ↓
          ┌────────────────┐
          │  UNPLACED      │ ← Initial state after rolling
          │  (in hand)     │   Can be modified by tech cards
          └────────┬───────┘
                   ↓ Player docks ship at facility
          ┌────────────────┐
          │  DOCKED        │ ← At facility, waiting for requirement
          │  (at facility) │   Cannot be modified by tech cards
          └────────┬───────┘
                   ↓ Facility requirement met
          ┌────────────────┐
          │  COMMITTED     │ ← Effect resolved, persists until GATHER
          │  (at facility) │   Can only be moved by Orbital Teleporter
          └────────────────┘
```

**State Transitions:**

```typescript
enum ShipState {
  UNPLACED = "unplaced",     // In hand, can modify
  DOCKED = "docked",         // At facility, waiting
  COMMITTED = "committed"    // Effect resolved, persists
}

class Ship {
  state: ShipState;
  value: number;
  location: Facility | null;
  
  // Can ship value be modified?
  canModifyValue(): boolean {
    return this.state === ShipState.UNPLACED;
  }
  
  // Can ship be docked?
  canDock(): boolean {
    return this.state === ShipState.UNPLACED;
  }
  
  // Can ship be moved?
  canMove(): boolean {
    // Only Orbital Teleporter can move docked/committed ships
    return this.state === ShipState.DOCKED || 
           this.state === ShipState.COMMITTED;
  }
}
```

**Example Sequence:**

```
Turn Start (GATHER Phase):
  Ships [at Maintenance Bay] → Return to hand

ROLL Phase:
  Roll 3 ships → [2, 4, 6]
  State: All UNPLACED

ACTION Phase:
  Action 1: Use Booster Pod (1 fuel) on ship(2)
    → ship(2) becomes 3 (still UNPLACED)
    → Now have [3, 4, 6]
  
  Action 2: Dock ships [3, 4] at facility
    → State: DOCKED (waiting for requirement)
  
  Action 3: Dock ship(6) at Lunar Mine
    → Requirement met (any value when empty)
    → Gain 1 ore
    → State: COMMITTED
  
  Action 4: Cannot use tech card on committed ship(6)
    → Tech cards only target UNPLACED ships

CLEANUP Phase:
  All ships remain COMMITTED until next GATHER phase
```

---

**End of Section 1, Part 1**

*Continues in Section 1, Part 2 with final setup details and visual diagrams.*

---

## Cross-References

- **Ambiguities Resolved**: #1 (component distribution), #2 (player count), #3 (blocking ships), #4 (starting resources), #5 (long-game variant), #27 (VP calculation), #28 (VP not cumulative), #29 (game end), #30 (resource limit), #67 (strict majority), #68 (control timing)
  
- **Related Sections**:
  - Section 1.2 (Setup Part 2): Visual diagrams
  - Section 2 (Turn Structure): Detailed phase rules
  - Section 4 (Territories): Territory bonuses
  - Section 7.3 (Advanced Rules): Victory conditions and tie-breakers
