# Phase 1 Test Scenarios

This document defines key test scenarios for Phase 1 core game state implementation.

## Test Scenario 1: Basic Game Setup

**Objective**: Verify game can be initialized with 2-5 players

**Steps**:
1. Create new GameState
2. Initialize with 2 players (Alice, Bob)
3. Verify each player has 3 ships
4. Verify game starts in ROLL_DICE phase
5. Verify first player is active

**Expected Results**:
- ✅ 2 players created with unique IDs
- ✅ 6 ships total (3 per player)
- ✅ Phase set to ROLL_DICE
- ✅ activePlayerId set to first player

**Status**: ✅ PASSING (game-state.test.ts)

---

## Test Scenario 2: Dice Rolling

**Objective**: Verify dice rolling mechanics work correctly

**Steps**:
1. Initialize game with 2 players
2. Active player rolls dice
3. Verify 3 dice values returned (1-6)
4. Verify ships have dice values assigned
5. Verify phase advances to PLACE_SHIPS

**Expected Results**:
- ✅ 3 dice values in range [1,6]
- ✅ Each ship has diceValue set
- ✅ Phase advances automatically

**Status**: ✅ PASSING (ship.test.ts, game-state.test.ts)

---

## Test Scenario 3: Ship Placement

**Objective**: Verify ships can be placed at facilities

**Steps**:
1. Initialize game and roll dice
2. Place ship at solar_converter
3. Verify ship location updated
4. Attempt to place ship without dice (should fail)
5. Lock ship and attempt to move it (should fail)

**Expected Results**:
- ✅ Ship placed successfully with valid dice
- ✅ Placement fails without dice value
- ✅ Locked ships cannot be moved

**Status**: ✅ PASSING (ship.test.ts)

---

## Test Scenario 4: Turn Flow

**Objective**: Verify turn phases advance correctly

**Steps**:
1. Initialize game with 2 players
2. Advance through all 6 phases
3. Verify each phase transition
4. Verify turn passes to next player
5. Verify round increments after all players

**Expected Results**:
- ✅ All 6 phases execute in order
- ✅ Turn passes to player 2
- ✅ After player 2, round increments and returns to player 1

**Status**: ✅ PASSING (game-state.test.ts)

---

## Test Scenario 5: Resource Management

**Objective**: Verify resource operations work correctly

**Steps**:
1. Initialize game
2. Add resources to player (ore: 5, fuel: 3)
3. Check player can afford cost (ore: 3, fuel: 2) → true
4. Remove resources (ore: 3, fuel: 2)
5. Check player can afford cost (ore: 5) → false

**Expected Results**:
- ✅ Resources added correctly
- ✅ canAfford returns accurate results
- ✅ Resources removed only when sufficient
- ✅ Resources not removed if insufficient

**Status**: ✅ PASSING (player.test.ts)

---

## Test Scenario 6: Colony Placement

**Objective**: Verify colony mechanics and VP calculation

**Steps**:
1. Initialize game
2. Add colony to player at ASIMOV_CRATER
3. Verify colony list updated
4. Verify VP updated (1 colony = 1 VP)
5. Attempt to add same colony again (should fail)
6. Add 7 more colonies + 1 alien tech card
7. Verify hasWon returns true (8 VP)

**Expected Results**:
- ✅ Colony added successfully first time
- ✅ VP calculated correctly (1 per colony)
- ✅ Duplicate colony rejected
- ✅ Win condition detected at 8 VP

**Status**: ✅ PASSING (player.test.ts, game-state.test.ts)

---

## Test Scenario 7: State Cloning

**Objective**: Verify deep cloning for AI lookahead

**Steps**:
1. Initialize game
2. Roll dice and add resources to player
3. Clone game state
4. Modify original (advance phase, add resources)
5. Verify clone unchanged

**Expected Results**:
- ✅ Clone creates independent copy
- ✅ Modifications to original don't affect clone
- ✅ Modifications to clone don't affect original
- ✅ Ships, players, phase all cloned correctly

**Status**: ✅ PASSING (ship.test.ts, player.test.ts, game-state.test.ts)

---

## Test Scenario 8: State Validation

**Objective**: Verify game state integrity checks

**Steps**:
1. Create game with 1 player (invalid)
2. Validate → should return errors
3. Create game with 2 players (valid)
4. Validate → should return no errors

**Expected Results**:
- ✅ Single player game flagged as invalid
- ✅ Multi-player game passes validation
- ✅ Error messages are descriptive

**Status**: ✅ PASSING (game-state.test.ts)

---

## Test Scenario 9: Serialization

**Objective**: Verify save/load functionality

**Steps**:
1. Initialize game with full state
2. Serialize to JSON
3. Deserialize from JSON
4. Verify all state matches original

**Expected Results**:
- ✅ All managers serialize correctly
- ✅ Deserialization recreates exact state
- ✅ Complex objects (arrays, nested) preserved

**Status**: ✅ PASSING (ship.test.ts, player.test.ts, game-state.test.ts)

---

## Test Coverage Summary

**Total Tests**: 58 passing
**Test Files**: 3
- ship.test.ts: 20 tests ✅
- player.test.ts: 21 tests ✅
- game-state.test.ts: 17 tests ✅

**Core Features Tested**:
- ✅ Ship creation and management
- ✅ Dice rolling mechanics
- ✅ Ship placement and locking
- ✅ Player creation and resource management
- ✅ Colony placement and VP calculation
- ✅ Game initialization and turn flow
- ✅ Phase transitions
- ✅ Win condition detection
- ✅ State cloning (critical for AI)
- ✅ State validation
- ✅ Serialization/deserialization

**Next Steps for Phase 2**:
1. Implement orbital facility logic (10 facilities)
2. Add facility-specific placement rules
3. Add resource collection logic
4. Test multi-ship facility interactions
