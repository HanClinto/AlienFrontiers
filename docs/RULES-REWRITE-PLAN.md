# Alien Frontiers Rules Rewrite Plan

**Goal:** Rewrite rules to eliminate all 165 identified ambiguities while maintaining identical gameplay patterns and improving strategic flexibility.

---

## Core Design Principles

1. **Zero Gameplay Changes** - Same mechanics, strategy, and balance
2. **Maximum Clarity** - Eliminate all ambiguity for deterministic implementation
3. **Enhanced Flexibility** - Allow interleaved tech card and ship docking actions
4. **Digital-Ready** - Specifications suitable for boardgame.io implementation
5. **Player-Friendly** - Clear language with excellent examples

---

## Major Structural Changes

### 1. NEW: Flexible Action Phase System

**Replace rigid "tech then dock" with interleaved actions:**

#### Old System (2nd Print):
```
Turn Phases:
1. Gather Phase (return ships from facilities)
2. Roll Phase (roll your fleet)
3. Use Tech Cards (modify ship values)
4. Assign Fleet (dock all ships)
5. End Turn (resource limit check)
```

#### New System (Rewrite):
```
Turn Phases:
1. GATHER Phase (automatic)
   - Return ships from Maintenance Bay to hand
   - Return ships from Terraforming Station to stock/Burroughs Desert
   
2. ROLL Phase (automatic)
   - Roll all ships in hand
   - Evaluate passive effects (Resource Cache)
   
3. ACTION Phase (flexible, player-driven)
   Player takes actions in any order until passing:
   - Use tech card fuel power (once per card per turn)
   - Discard tech card for power (once total per turn)
   - Dock ship(s) at facility (resolve immediately)
   - Move docked ship with Orbital Teleporter
   
   Restrictions:
   - Each tech card used max once per turn
   - Only one discard power per turn
   - Must dock all ships that have legal placements before passing
   - Once ship docked, cannot modify its value
   
4. CLEANUP Phase (automatic)
   - Check resource limit (max 8 total fuel+ore)
   - Player chooses which to discard to reach 8
   - Recalculate all victory points
   - Advance turn marker
```

**Benefits:**
- ✅ React to facility availability dynamically
- ✅ Optimize tech card usage based on what's actually available
- ✅ Reduces feel-bad moments (wasted Booster Pod, etc.)
- ✅ More strategic depth without complexity increase
- ✅ Natural flow matches player intuition

---

## Document Structure

### Section 1: Components & Setup (8 pages)

**1.1 Components List**
- Itemized with quantities
- Component images/diagrams
- Terminology definitions

**1.2 Setup Procedures**
- Step-by-step with diagrams
- Separate procedures for 2/3/4 player games
- Long-game variant clearly marked
- Blocking ship placement rules

**1.3 Core Concepts**
- Victory Points (recalculated snapshot system)
- Territory Control (strict majority algorithm)
- Resource Limits (8 max, checked at cleanup)
- Ship States (unplaced → docked → committed)

---

### Section 2: Turn Structure (4 pages)

**2.1 Turn Phases Overview**
- Phase flowchart with decision points
- State diagram showing ship lifecycle

**2.2 GATHER Phase**
```
GATHER Phase - Automatic
1. If you have ships on Maintenance Bay:
   - Return all ships to your hand
2. If you have ships on Terraforming Station:
   - If ship is Relic Ship: Return to Burroughs Desert
   - Otherwise: Return to ship stock (forfeited)
3. If you lost control of Burroughs Desert:
   - Return Relic Ship to Burroughs Desert (if you had it)
4. Proceed to ROLL Phase
```

**2.3 ROLL Phase**
```
ROLL Phase - Automatic
1. Roll all ships currently in your hand (typically 3-4 dice)
2. All ships are now in "unplaced" state
3. Evaluate passive card effects:
   - Resource Cache: Count odd/even ships, gain resources
4. Proceed to ACTION Phase
```

**2.4 ACTION Phase - Detailed Rules**

**Ship State Machine:**
```
UNPLACED: In hand, can be modified by tech cards
    ↓ (dock at facility)
DOCKED: At facility, waiting to complete requirement
    ↓ (facility requirement met)
COMMITTED: Used at facility, effect resolved, cannot modify
```

**Available Actions:**

| Action Type | Frequency | Requirements | Effect |
|------------|-----------|--------------|---------|
| Use Tech Card (Fuel Power) | Once per card | Pay fuel, target unplaced ships | Modify ship values, gain resources, etc. |
| Discard Tech Card (Discard Power) | Once per turn total | Card not used this turn | Place field generator, move colony, etc. |
| Dock Ship at Facility | Multiple times | Ship in hand, facility has space | Ship becomes docked, resolve if requirement met |
| Move Ship (Orbital Teleporter) | Once | Pay fuel, ship at valid facility | Move ship to different facility |

**Action Validation Rules:**
```typescript
Player can continue taking actions if:
- They have unused tech cards AND sufficient fuel
- They have unplaced ships AND available facilities
- They have docked ships that can be moved (Orbital Teleporter)

Player MUST pass when:
- No unplaced ships remain, OR
- All remaining unplaced ships have NO legal dock locations

Player CANNOT pass if:
- Unplaced ships exist AND legal dock locations available
```

**Examples:**
```
Example 1: Basic Action Sequence
Roll: [2, 3, 5]

Action 1: Dock ship(3) at Lunar Mine
  Result: Gain 1 ore, ship committed

Action 2: Use Booster Pod (1 fuel) on ship(2)
  Result: ship(2) becomes 3, now [3, 5] in hand

Action 3: Dock ships [3, 5] at Shipyard
  Result: Shipyard requires pair - not met yet
  
Action 4: Dock ship(5) at Shipyard
  Result: Pair complete (3+3), build new ship
  
Action 5: Pass (all ships docked)

Example 2: Reactive Strategy
Roll: [2, 4, 6]

Action 1: Check Shipyard (sees it's blocked by opponent)
  
Action 2: Use Plasma Cannon (2 fuel) on Shipyard
  Result: Remove 2 opponent ships to Maintenance Bay
  
Action 3: Dock ships [2, 4] at Shipyard (now available)
  Result: Pair complete, build ship
  
Action 4: Dock ship(6) at Lunar Mine
  Result: Gain 1 ore
  
Action 5: Pass (all ships docked)

Example 3: Changing Your Mind
Roll: [1, 1, 5]

Action 1: Use Booster Pod (1 fuel) on ship(1)
  Result: ship(1) becomes 2, now [2, 1, 5] in hand
  
Action 2: Realize pair of 1s would have been better
  Result: TOO LATE - cannot undo Booster Pod use
  
Action 3: Dock ships [2, 1, 5] at available facilities
  Result: Must commit to modified ships
```

**2.5 CLEANUP Phase**
```
CLEANUP Phase - Automatic
1. Resource Limit Check:
   - Total = player's fuel + ore
   - If Total > 8:
     * Player chooses which resources to discard
     * Discard until Total = 8
     
2. Victory Point Recalculation:
   - VP = colonies placed + territories controlled + Positron Fields + VP cards
   - Update VP display for all players
   
3. Game End Check:
   - If any player placed last colony: Game ends immediately
   - Standard game: Check if any player ≥ 12 VP (tie-breakers apply)
   - Long game: Check if any player ≥ 14 VP (tie-breakers apply)
   
4. Advance turn to next player
```

---

### Section 3: Facilities (12 pages, 1-1.5 pages each)

**Standardized Facility Format:**

```
[FACILITY NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DOCKING REQUIREMENTS:
• [Specific requirement, e.g., "Pair of ships with same value"]
• [Capacity info, e.g., "2 dock spaces"]

EFFECT:
[Exact effect with timing]

TIMING:
• When Effect Resolves: [Immediate/After all ships docked/etc.]
• Persistence: [Ships remain/Ships go to Maintenance Bay/etc.]

SPECIAL RULES:
• [Any unique mechanics]
• [Interaction exceptions]

STATE DIAGRAM:
[Visual showing ship flow through facility]

EXAMPLES:
[2-3 detailed examples including edge cases]

INTERACTIONS:
• Territory Bonuses: [Relevant territory modifiers]
• Tech Cards: [Relevant card interactions]
• Field Generators: [Relevant field effects]
```

**Example: Lunar Mine (Full Detail)**

```
LUNAR MINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DOCKING REQUIREMENTS:
• Single ship with value ≥ current highest ship at mine
• 6 dock spaces (unlimited capacity)
• Multiple ships may dock same turn (each checked individually)

EFFECT:
Gain 1 ore per ship docked

TIMING:
• When Effect Resolves: Immediately when each ship docks
• Persistence: Ships remain at Lunar Mine across turns
• Escalating Minimum: Highest ship value becomes new minimum

SPECIAL RULES:
• Initial State: No ships present, any value can dock
• Highest Value Calculation: Maximum of all docked ships (including same-turn docks)
• Multi-Ship Docking: Each ship must be ≥ highest when it docks
  - Ship A (value 3) docks → highest = 3
  - Ship B (value 2) cannot dock (2 < 3)
  - Ship C (value 5) docks → highest = 5
  - Ship D (value 5) docks → valid (5 = 5)

STATE DIAGRAM:
Empty Mine → First Ship Docks (any value) → Establishes Minimum
   ↓
Each Additional Ship: Must be ≥ Current Highest
   ↓
Ships Persist → Remain until Plasma Cannon or other removal

EXAMPLES:

Example 1: Basic Escalation
  Current state: Ships [3, 4] at mine
  Action: Dock ship(5)
  Result: Gain 1 ore, highest = 5
  New state: Ships [3, 4, 5] at mine

Example 2: Van Vogt Mountains Bonus
  Current state: Ships [5, 6] at mine
  Player controls Van Vogt Mountains
  Action: Dock ship(1) as first ship this turn
  Result: Bypass minimum check, gain 1 ore, highest remains 6
  Next ship: Must be ≥ 6 (normal rules apply)

Example 3: Same-Turn Multi-Dock
  Current state: Empty mine
  Action 1: Dock ship(2)
  Result: Gain 1 ore, highest = 2
  Action 2: Dock ship(2)
  Result: Gain 1 ore, highest = 2 (tie allowed)
  Action 3: Dock ship(1)
  Result: INVALID - 1 < 2

INTERACTIONS:
• Territory Bonuses:
  - Van Vogt Mountains: First ship per turn bypasses minimum check
  
• Tech Cards:
  - Booster Pod: Can increase ship value before docking
  - Polarity Device: Can flip ship to meet minimum
  - Plasma Cannon: Can remove opponent ships (to Maintenance Bay)
  
• Field Generators:
  - None affect Lunar Mine directly
```

---

### Section 4: Territories & Bonuses (10 pages)

**4.1 Territory Control Rules**
- Strict majority algorithm (pseudocode included)
- Tie-breaking: No control on ties
- Control change timing: Immediate after colony add/remove
- Territory counter placement rules

**4.2 Each Territory (1 page each)**

**Standardized Territory Format:**
```
[TERRITORY NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BONUS:
[Exact bonus text with timing]

CONTROL REQUIREMENT:
Strict majority of colonies (more than any single opponent)

TRIGGER:
[When bonus applies]

EFFECT DETAILS:
• [Specific mechanics]
• [Calculation methods]
• [Stacking rules]

SPECIAL CASES:
• [Unique interactions]
• [Exceptions]

EXAMPLES:
[3-4 examples showing common uses and edge cases]

INTERACTIONS:
• Facilities: [Which facilities are affected]
• Tech Cards: [Data Crystal usage, etc.]
• Field Generators: [Isolation/Positron/Repulsor effects]
```

---

### Section 5: Field Generators (4 pages)

**5.1 Field Generator System**
- Only one of each type exists
- Can stack multiple generators on same territory
- Precedence: Field generators override conflicting tech cards
- Placement/movement via discard powers

**5.2 Each Field Generator**
- Isolation Field (nullifies bonus, special Burroughs interaction)
- Positron Field (+1 VP to controller)
- Repulsor Field (prevents colony add/remove)

**5.3 Field Generator Interactions Matrix**

| Scenario | Isolation | Positron | Repulsor | Result |
|----------|-----------|----------|----------|---------|
| Control territory with all 3 | Bonus nullified | +1 VP | Colonies frozen | VP granted, no bonus, no changes |
| Data Crystal on Isolation territory | N/A | N/A | N/A | Cannot borrow bonus |
| Polarity Device swap to/from Repulsor | N/A | N/A | Blocked | Cannot swap |
| Booster Pod discard | Can remove | Can remove | Can remove | Any field removable from any territory |

---

### Section 6: Alien Tech Cards (20 pages)

**6.1 Alien Tech System Rules**
- Acquisition methods (Alien Artifact, Temporal Warper)
- One copy per player restriction
- Face-up visibility requirement
- Fuel powers: Once per card per turn
- Discard powers: Once total per turn
- Cannot use then discard same turn

**6.2 Card Template (Each Card 1.5-2 pages)**

```
[CARD NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CARD TYPE:
[VP Card / Fuel Power / Discard Power / Passive]

FUEL POWER: (if applicable)
Cost: [X fuel, modified by Pohl Foothills]
Timing: ACTION Phase only, once per turn
Target: [Unplaced ships / Docked ships / Territories / etc.]
Effect: [Exact mechanical effect]

DISCARD POWER: (if applicable)
Cost: Discard this card (once per turn total limit applies)
Timing: ACTION Phase only, cannot use if fuel power used this turn
Effect: [Exact mechanical effect]

RESTRICTIONS:
• [Usage limits]
• [Target restrictions]
• [Timing constraints]

SPECIAL RULES:
• [Unique mechanics]
• [Exceptions to standard rules]

DECISION TREE:
[Flowchart showing when/how to use card]

EXAMPLES:
Example 1: [Basic usage]
Example 2: [With territory bonus interaction]
Example 3: [Edge case or advanced tactic]
Example 4: [Common mistake to avoid]

STRATEGY NOTES:
• [When to use fuel power]
• [When to save for discard]
• [Combo potential with other cards]

INTERACTIONS:
• Pohl Foothills: [Fuel cost reduction if applicable]
• Holographic Decoy: [Raid protection if applicable]
• Relic Ship: [Special interactions if applicable]
```

**6.3 Tech Cards (Full List, Standardized)**

1. **Alien City** (VP Card)
2. **Alien Monument** (VP Card)
3. **Booster Pod** (Fuel Power + Discard Power)
   - Fuel: +1 to ship value (max 6)
   - Discard: Remove any field generator from any territory
4. **Data Crystal** (Fuel Power + Discard Power)
   - Fuel: Borrow territory bonus (1 fuel per colony on territory)
   - Discard: Place/move Positron Field
5. **Gravity Manipulator** (Fuel Power + Discard Power)
   - Fuel: Transfer 1 point between two unplaced ships
   - Discard: Place/move Repulsor Field
6. **Holographic Decoy** (Passive)
   - Prevents resource raids, forces tech raid to take Decoy
7. **Orbital Teleporter** (Fuel Power + Discard Power)
   - Fuel: Move one docked ship to different facility
   - Discard: Move any colony between territories
8. **Plasma Cannon** (Fuel Power + Discard Power)
   - Fuel: Remove opponent ships from one facility (1 fuel per ship)
   - Discard: Remove one opponent ship to stock (3-ship minimum enforced)
9. **Polarity Device** (Fuel Power + Discard Power)
   - Fuel: Flip ship to opposite face (7 - value)
   - Discard: Swap two colonies between territories
10. **Resource Cache** (Passive)
    - Gain fuel/ore based on odd/even ships after rolling
11. **Stasis Beam** (Fuel Power + Discard Power)
    - Fuel: -1 to ship value (min 1)
    - Discard: Place/move Isolation Field
12. **Temporal Warper** (Fuel Power + Discard Power)
    - Fuel: Re-roll selected unplaced ships
    - Discard: Claim any card from discard pile

---

### Section 7: Advanced Rules (8 pages)

**7.1 Relic Ship (Burroughs Desert)**
- Purchase timing and cost
- Color-neutral status
- Return conditions (control loss, Isolation Field, Terraforming Station)
- Interactions with alien tech cards
- Repurchase rules

**7.2 Victory Points**
- Recalculation system (snapshot, not cumulative)
- VP sources breakdown
- Control VP timing
- Positron Field VP
- Tech card VP

**7.3 Game End & Tie-Breakers**
- Immediate end when last colony placed
- Standard game: 12 VP triggers check at cleanup
- Long game: 14 VP triggers check at cleanup
- Tie-breaker sequence:
  1. Most VP (winner)
  2. Most alien tech cards (winner)
  3. Most ore (winner)
  4. Most fuel (winner)
  5. Shared victory

**7.4 Resource Management**
- 8 resource limit (fuel + ore combined)
- Checked at cleanup phase only
- Temporary excess allowed during action phase
- Player choice which to discard

**7.5 Must-Dock-All Rule**
- All ships with legal docks must be placed
- Legal dock definition
- Passing validation
- Rare case: No legal docks available (pass allowed)

---

### Section 8: Edge Cases & Rare Scenarios (6 pages)

**Comprehensive coverage of all 165 ambiguities:**

**8.1 Multi-System Interactions**
- Stacking multiple territory bonuses (Data Crystal limitations)
- Orbital Teleporter chain moves
- Multiple colony placements same turn
- Resource limit with territory bonuses
- Relic Ship + alien tech interactions

**8.2 Facility Edge Cases**
- Running out of cards at Alien Artifact
- All docks blocked scenarios
- Terraforming Station with exactly 4 ships
- Lunar Mine with Van Vogt Mountains
- Raiders' Outpost equal sequences

**8.3 Territory Edge Cases**
- Three-way control ties
- Simultaneous control changes
- Empty territory states
- All territories blocked (Repulsor Fields)

**8.4 Card Edge Cases**
- Resource Cache with 0 ships (theoretical)
- Temporal Warper deck exhaustion
- Holographic Decoy duplicate handling
- Plasma Cannon Terraforming Station exception
- Polarity Device colony swap choices

**8.5 Deadlock Scenarios**
- All territories have Repulsor Fields (resolution)
- No colonies available (Colonist Hub restriction)
- All cards in players' hands (Alien Artifact failure)
- Maintenance Bay unlimited capacity

---

### Section 9: Quick Reference (4 pages)

**9.1 Turn Sequence Flowchart**
```
START TURN
    ↓
┌─────────────────────────┐
│   GATHER PHASE          │
│ ─ Return ships from     │
│   Maintenance Bay       │
│ ─ Forfeit Terraforming  │
│   Station ships         │
│ ─ Return Relic Ship if  │
│   lost control          │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│   ROLL PHASE            │
│ ─ Roll all ships        │
│ ─ Evaluate Resource     │
│   Cache                 │
└─────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│   ACTION PHASE (Loop until pass)    │
│                                     │
│ Choose one:                         │
│ ┌─────────────────────────────┐   │
│ │ Use Tech Card Fuel Power    │   │
│ │ (once per card)             │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ Discard Tech Card           │   │
│ │ (once per turn total)       │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ Dock Ship at Facility       │   │
│ │ (multiple times OK)         │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ Move Ship (Orbital          │   │
│ │ Teleporter, once)           │   │
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ Pass (must dock all first)  │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────┐
│   CLEANUP PHASE         │
│ ─ Check resource limit  │
│   (discard to 8)        │
│ ─ Recalculate VP        │
│ ─ Check game end        │
└─────────────────────────┘
    ↓
NEXT PLAYER'S TURN
```

**9.2 Facilities Quick Reference Table**

| Facility | Requirement | Effect | Persistence | Capacity |
|----------|-------------|--------|-------------|----------|
| Alien Artifact | Value ≥ 8 | Claim tech card | Ships to Maintenance | 3 docks |
| Colonist Hub | Single ship | Advance colony 1 per ship | Ships to Maintenance | Unlimited |
| Colony Constructor | 3 ships (any value) | Place colony (3 ore - bonuses) | Ships to Maintenance | 3 docks |
| Lunar Mine | Value ≥ highest | Gain 1 ore per ship | Ships persist | Unlimited |
| Maintenance Bay | Any ship | Hold ships across turns | Ships persist | Unlimited |
| Orbital Market | Pair (same value) | Trade fuel for ore (ratio = value) | Ships to Maintenance | 2 docks |
| Raiders' Outpost | 3 sequential | Raid resources OR tech card | Ships to Maintenance | 3 docks |
| Shipyard | Pair (same value) | Build ship (cost by fleet size) | Ships to Maintenance | 2 docks |
| Solar Converter | Single ship | Gain fuel (⌈value/2⌉ per ship) | Ships to Maintenance | Unlimited |
| Terraforming Station | 4+ ships, total value ≥ 20 | Place colony (forfeit 1 ship) | 1 forfeited, rest to Maintenance | Unlimited |

**9.3 Territory Bonuses Quick Reference**

| Territory | Bonus | Trigger |
|-----------|-------|---------|
| Asimov Crater | +1 colony advance | When dock 2+ ships at Colonist Hub |
| Bradbury Plateau | -1 ore cost | When use Colony Constructor |
| Burroughs Desert | Purchase Relic Ship | Pay 1 fuel + 1 ore during Action Phase |
| Heinlein Plains | 1:1 trade ratio | When use Orbital Market |
| Herbert Valley | -1 fuel and -1 ore cost | Per ship built at Shipyard |
| Lem Badlands | +1 fuel per ship | When dock ships at Solar Converter |
| Pohl Foothills | -1 fuel cost | Per tech card fuel power used |
| Van Vogt Mountains | First ship any value | First ship per turn at Lunar Mine |

**9.4 Tech Card Summary Table**

| Card | Type | Fuel Cost | Fuel Effect | Discard Effect |
|------|------|-----------|-------------|----------------|
| Alien City | VP | — | — | — |
| Alien Monument | VP | — | — | — |
| Booster Pod | Both | 1 | +1 ship value | Remove field generator |
| Data Crystal | Both | 1/colony | Borrow territory bonus | Place/move Positron Field |
| Gravity Manipulator | Both | 2 | Transfer 1 point | Place/move Repulsor Field |
| Holographic Decoy | Passive | — | — | — |
| Orbital Teleporter | Both | 2 | Move ship | Move colony |
| Plasma Cannon | Both | 1/ship | Remove ships | Remove ship to stock |
| Polarity Device | Both | 1 | Flip ship (7-value) | Swap 2 colonies |
| Resource Cache | Passive | — | — | (Auto on equal) |
| Stasis Beam | Both | 1 | -1 ship value | Place/move Isolation Field |
| Temporal Warper | Both | 1 | Re-roll ships | Claim from discard |

**9.5 Action Phase Decision Tree**

```
START ACTION PHASE
    ↓
Do I have unplaced ships?
    ├─ NO → Do I have docked ships I can move?
    │       ├─ YES → Consider Orbital Teleporter
    │       └─ NO → MUST PASS
    │
    └─ YES → Choose strategy:
            │
            ├─ Modify ships first?
            │   ├─ Use Booster Pod (+1 value)
            │   ├─ Use Stasis Beam (-1 value)
            │   ├─ Use Polarity Device (flip)
            │   ├─ Use Gravity Manipulator (transfer)
            │   └─ Use Temporal Warper (re-roll)
            │
            ├─ Clear blocked facilities?
            │   └─ Use Plasma Cannon (remove opponent ships)
            │
            ├─ Borrow territory bonus?
            │   └─ Use Data Crystal (1 fuel per colony)
            │
            └─ Dock ships at facilities
                ├─ Check facility availability
                ├─ Check docking requirements
                ├─ Dock ship(s)
                └─ Resolve facility effect
```

---

### Section 10: Index & Glossary (4 pages)

**10.1 Terminology Glossary**
- **Unplaced Ship**: Ship in hand after rolling, not yet docked this turn
- **Docked Ship**: Ship at a facility, waiting for requirement completion
- **Committed Ship**: Ship whose facility effect has resolved
- **Strict Majority**: More colonies than any single opponent (ties = no control)
- **Snapshot VP**: Victory points recalculated from current game state
- **Field Generator Precedence**: Field generators override conflicting tech cards
- etc.

**10.2 Alphabetical Index**
- Cross-referenced to page numbers
- Includes facilities, territories, cards, rules, edge cases

**10.3 FAQ (Frequently Asked Questions)**
- 20-30 most common questions with clear answers
- References to relevant rule sections

---

## Implementation Timeline

### Phase 1: Core Rules Rewrite (4-6 weeks)
- Turn structure with flexible Action Phase
- Facilities with standardized format
- Territories with interaction matrices

### Phase 2: Tech Cards & Advanced Rules (3-4 weeks)
- All 12 tech cards with decision trees
- Relic Ship comprehensive rules
- Resource management system

### Phase 3: Edge Cases & Examples (2-3 weeks)
- All 165 ambiguities addressed
- 50+ detailed examples
- Edge case resolution guide

### Phase 4: Quick Reference & Polish (2 weeks)
- Flowcharts and tables
- Visual aids and diagrams
- Index and glossary
- Professional layout

### Phase 5: Playtesting & Validation (3-4 weeks)
- Test with new players (clarity)
- Test with experienced players (accuracy)
- Digital implementation validation
- Final revisions

**Total Estimated Timeline: 14-19 weeks**

---

## Estimated Page Count

| Section | Pages |
|---------|-------|
| 1. Components & Setup | 8 |
| 2. Turn Structure | 4 |
| 3. Facilities | 12 |
| 4. Territories & Bonuses | 10 |
| 5. Field Generators | 4 |
| 6. Alien Tech Cards | 20 |
| 7. Advanced Rules | 8 |
| 8. Edge Cases | 6 |
| 9. Quick Reference | 4 |
| 10. Index & Glossary | 4 |
| **Total** | **80 pages** |

**Current 2nd Print**: ~16 pages
**Increase**: ~5x page count
**Benefit**: ~165x ambiguity reduction

---

## Success Criteria

✅ **Zero Ambiguities**: All 165 identified ambiguities resolved
✅ **Deterministic**: Complete specification for digital implementation
✅ **Gameplay Identical**: No balance changes, same strategies work
✅ **Enhanced Flexibility**: Interleaved actions reduce feel-bad moments
✅ **Player Satisfaction**: New players learn faster, experienced players have reference
✅ **Digital-Ready**: boardgame.io implementation straightforward

---

## Deliverables

1. **Full Rulebook PDF** (80 pages, professional layout)
2. **Quick Start Guide** (4 pages, essential rules only)
3. **Reference Card** (2 pages double-sided, laminated)
4. **Digital Companion** (Interactive flowcharts and decision trees)
5. **Implementation Guide** (TypeScript interfaces for boardgame.io)

---

## Next Steps

1. ✅ **Complete**: Identify all ambiguities (165 found)
2. ✅ **Complete**: Design flexible Action Phase system
3. **In Progress**: Draft standardized facility templates
4. **TODO**: Draft territory bonus formats
5. **TODO**: Draft tech card decision trees
6. **TODO**: Create comprehensive examples
7. **TODO**: Professional layout and design
8. **TODO**: Playtesting and validation

---

**This plan maintains the brilliant core gameplay of Alien Frontiers while providing the clarity needed for both tabletop and digital play, with enhanced strategic flexibility through the interleaved Action Phase system.**
