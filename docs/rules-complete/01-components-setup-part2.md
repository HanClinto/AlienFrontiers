# Section 1: Components & Setup (Part 2)

**Pages 7-8 of Complete Rules Reference**

---

## 1.6 Setup Visual Diagrams

### Initial Board State (2-Player Game)

```
┌─────────────────────────────────────────────────────────────┐
│                    ORBITAL FACILITIES                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Alien Artifact    Colonist Hub    Colony Constructor     │
│   [X] [ ] [ ]       [ ][ ][ ]...     [ ] [ ] [ ]           │
│   ↑ blocking ship   unlimited        3 docks               │
│                                                             │
│   Lunar Mine        Maintenance Bay   Orbital Market        │
│   [ ][ ][ ]...      [ ][ ][ ]...     [X] [ ]               │
│   unlimited         unlimited         ↑ blocking ship       │
│                                                             │
│   Raiders' Outpost  Shipyard         Solar Converter        │
│   [ ] [ ] [ ]       [X] [ ]          [ ][ ][ ]...          │
│   3 docks           ↑ blocking ship   unlimited             │
│                                                             │
│   Terraforming Station                                      │
│   [ ][ ][ ][ ]...                                           │
│   unlimited (4+ ships required)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MARS TERRITORIES                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Asimov Crater      Bradbury Plateau   Burroughs Desert   │
│   [ ][ ][ ][ ]       [ ][ ][ ][ ]       [RELIC]            │
│   Territory #1       Territory #2       Territory #3        │
│                                          ↑ Relic Ship here  │
│                                                             │
│   Heinlein Plains    Herbert Valley     Lem Badlands       │
│   [ ][ ][ ][ ]       [ ][ ][ ][ ]       [ ][ ][ ][ ]       │
│   Territory #4       Territory #5       Territory #6        │
│                                                             │
│   Pohl Foothills     Van Vogt Mountains                    │
│   [ ][ ][ ][ ]       [ ][ ][ ][ ]                          │
│   Territory #7       Territory #8                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PLAYER AREAS                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   RED PLAYER                    BLUE PLAYER                │
│   ┌─────────────────┐           ┌─────────────────┐       │
│   │ Resources:      │           │ Resources:      │       │
│   │   Fuel: 3 ●●●   │           │   Fuel: 3 ●●●   │       │
│   │   Ore:  2 ■■    │           │   Ore:  2 ■■    │       │
│   │                 │           │                 │       │
│   │ Ships: [2][3][4]│           │ Ships: [1][5][6]│       │
│   │ (in hand)       │           │ (in hand)       │       │
│   │                 │           │                 │       │
│   │ Colonies: ●●●●●●│           │ Colonies: ●●●●●●│       │
│   │ (7 available)   │           │ (7 available)   │       │
│   │                 │           │                 │       │
│   │ Tech Cards: 0   │           │ Tech Cards: 0   │       │
│   │ Victory Points: │           │ Victory Points: │       │
│   │ [VP Track: 0]   │           │ [VP Track: 0]   │       │
│   └─────────────────┘           └─────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SHARED COMPONENTS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Alien Tech Deck: [24 cards face-down]                    │
│   Field Generators: [Isolation] [Positron] [Repulsor]      │
│   Territory Control Markers: [1][2][3][4][5][6][7][8]      │
│   Resource Pool: [~50 Fuel] [~50 Ore]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Initial Board State (3-4 Player Games)

```
Same as 2-player, but:
- NO blocking ships at any facilities
- All facilities start completely empty
- 3-4 player areas instead of 2
```

---

## 1.7 First Turn Walkthrough

To help new players understand the flow, here's a complete first turn example.

### Turn 1 - Red Player

**Phase 1: GATHER** (Automatic)
```
No ships at facilities yet (first turn)
→ Skip to ROLL phase
```

**Phase 2: ROLL** (Automatic)
```
Red player rolls 3 ships: [2, 3, 5]
All ships now UNPLACED (in hand)
Check Resource Cache: Red has no tech cards yet
→ Proceed to ACTION phase
```

**Phase 3: ACTION** (Player choices)

*Action 1: Dock ship(5) at Solar Converter*
```
Requirements: Single ship, any value
Effect: Gain ⌈5/2⌉ = 3 fuel
State: ship(5) becomes COMMITTED
Resources: 3 → 6 fuel
```

*Action 2: Dock ship(3) at Lunar Mine*
```
Requirements: Value ≥ highest (mine is empty, any value OK)
Effect: Gain 1 ore
State: ship(3) becomes COMMITTED
Resources: 2 → 3 ore
Lunar Mine highest: 3
```

*Action 3: Dock ship(2) at Maintenance Bay*
```
Requirements: Any ship
Effect: Hold ship until next turn
State: ship(2) becomes COMMITTED (stays at facility)
Resources: Unchanged
```

*Action 4: Pass (all ships docked)*

**Phase 4: CLEANUP** (Automatic)
```
Resource Check: 6 fuel + 3 ore = 9 total
Exceeds limit of 8! Must discard 1 resource.
Red chooses to discard 1 fuel.
Final: 5 fuel, 3 ore

Victory Points:
  Colonies placed: 0
  Territories controlled: 0
  Positron Fields: 0
  Tech cards: 0
  Total: 0 VP

Game end check: No player at 12 VP
→ Advance to Blue player's turn
```

### Turn 2 - Red Player (Next Turn)

**Phase 1: GATHER**
```
Ship(2) at Maintenance Bay → Return to hand
Ships(3, 5) at other facilities → Remain there (persist)
Red now has 1 ship in hand
```

**Phase 2: ROLL**
```
Roll 1 ship: [4]
Ship(4) now UNPLACED
```

**Phase 3: ACTION**
```
Red has only 1 ship this turn (others still at facilities from last turn)
Must dock ship(4) somewhere...
```

This illustrates how Maintenance Bay allows building "ship economy" across turns.

---

## 1.8 Game Flow Summary

### Overview

```
GAME SETUP
    ↓
┌─────────────────────────────────────────┐
│         PLAYER TURNS (Clockwise)        │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  GATHER: Return ships to hand    │  │
│  └──────────────────────────────────┘  │
│                ↓                        │
│  ┌──────────────────────────────────┐  │
│  │  ROLL: Roll all ships in hand    │  │
│  └──────────────────────────────────┘  │
│                ↓                        │
│  ┌──────────────────────────────────┐  │
│  │  ACTION: Use tech, dock ships    │  │
│  │  (Flexible, player-driven)       │  │
│  └──────────────────────────────────┘  │
│                ↓                        │
│  ┌──────────────────────────────────┐  │
│  │  CLEANUP: Check resources/VP     │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ↓ Next player OR Game End             │
└─────────────────────────────────────────┘
    ↓
GAME END (12 VP or all colonies placed)
    ↓
VICTORY! (Tie-breakers if needed)
```

### Typical Game Arc

**Early Game (Turns 1-3)**
- Building resource engine (Solar Converter, Lunar Mine)
- First tech card acquisitions (Alien Artifact)
- Establishing territory presence

**Mid Game (Turns 4-7)**
- Competing for territory control
- Colony placements begin
- Tech card combos emerge
- Field generators deployed

**Late Game (Turns 8-12)**
- Race to 12 VP
- Aggressive Plasma Cannon usage
- Critical territory control battles
- Strategic Relic Ship purchases

**Average Game Length:**
- 2 players: 10-12 turns per player
- 3 players: 8-10 turns per player  
- 4 players: 7-9 turns per player

---

## 1.9 Common Setup Mistakes

### Mistake 1: Wrong Starting Resources

**WRONG:**
```
2-player game: Each player starts with 4 fuel, 3 ore
3-player game: Each player starts with 3 fuel, 2 ore
4-player game: Each player starts with 2 fuel, 1 ore
```

**CORRECT:**
```
ALL games: Each player starts with 3 fuel, 2 ore
Starting resources do NOT vary by player count
```

**Reference:** Ambiguity #4

### Mistake 2: Blocking Ships in 3-4 Player Games

**WRONG:**
```
Always use blocking ships at Alien Artifact, Shipyard, Orbital Market
```

**CORRECT:**
```
Blocking ships ONLY in 2-player games
3-player and 4-player games start with all facilities empty
```

**Reference:** Ambiguity #3

### Mistake 3: VP Markers Starting Position

**WRONG:**
```
VP markers start on "1" (everyone has 1 VP from existing)
```

**CORRECT:**
```
Standard game: VP markers start on "0"
Long-game variant: VP markers start on "1" (after initial colony placement)
```

**Reference:** Ambiguity #28

### Mistake 4: Relic Ship Placement

**WRONG:**
```
Relic Ship starts in general supply
Relic Ship starts at Maintenance Bay
```

**CORRECT:**
```
Relic Ship starts ON Burroughs Desert territory
Visible as available for purchase
```

**Reference:** Section 7.1 (Relic Ship rules, covered in later section)

### Mistake 5: Long-Game Colony Placement

**WRONG:**
```
Long-game: Each player places 1 colony on any territory (multiple allowed per territory)
```

**CORRECT:**
```
Long-game: Each player places 1 colony
Restriction: No territory can have 2+ colonies during initial placement
After all placed, territories CAN have multiple colonies
```

**Reference:** Ambiguity #5

---

## 1.10 Quick Setup Checklist

Print or reference this checklist for fast setup:

### Pre-Game
- [ ] Choose player count (2, 3, or 4)
- [ ] Choose game variant (Standard 12 VP or Long 14 VP)
- [ ] Determine first player randomly

### Board Setup
- [ ] Place game board in center
- [ ] Place 8 Territory Control Markers near territories
- [ ] Place 3 Field Generator Tokens near board
- [ ] Shuffle 24 Alien Tech Cards → face-down deck at Alien Artifact
- [ ] Place Relic Ship (gray die) ON Burroughs Desert
- [ ] Create resource pools (fuel and ore tokens)

### Player Setup
- [ ] Each player chooses color
- [ ] Each player takes: 3 ships, 7 colonies, 1 VP marker, 1 aid card
- [ ] Each player starts with: **3 fuel, 2 ore** (same for all player counts)
- [ ] Place VP markers on "0" (standard) or "1" (long-game after colony placement)

### 2-Player Only
- [ ] Choose 3rd unused color for blocking ships
- [ ] Place 1 blocking ship at Alien Artifact (center dock)
- [ ] Place 1 blocking ship at Shipyard (either dock)
- [ ] Place 1 blocking ship at Orbital Market (either dock)

### Long-Game Only
- [ ] After player setup, start colony placement
- [ ] First player places 1 colony on any empty territory
- [ ] Continue clockwise, each player places 1 colony on empty territory
- [ ] Place Territory Control Markers for controlled territories
- [ ] Move VP markers to "1" for each player

### Ready to Play
- [ ] First player begins with GATHER phase (skip if no ships at facilities)
- [ ] Proceed through turn phases: GATHER → ROLL → ACTION → CLEANUP

---

**End of Section 1, Part 2**

*Section 1 Complete. Continues in Section 2: Turn Structure.*

---

## Cross-References

- **Ambiguities Resolved**: #3 (blocking ships), #4 (starting resources), #5 (long-game variant), #28 (VP starting position)
  
- **Related Sections**:
  - Section 1.1 (Setup Part 1): Component lists and core concepts
  - Section 2 (Turn Structure): Detailed phase rules with ACTION phase flexibility
  - Section 7.1 (Advanced Rules): Relic Ship comprehensive mechanics
  - Section 7.3 (Advanced Rules): Victory conditions and tie-breakers
