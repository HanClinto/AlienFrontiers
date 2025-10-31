# Phase 7 Integration Testing Plan

**Date:** October 31, 2025  
**Phase:** 7 - UI & Interaction  
**Status:** Testing in Progress

## Overview

Phase 7 introduced major UI enhancements for interactive player choices and visual feedback. This document outlines the testing strategy to ensure all features work correctly.

## Features to Test

### 1. Territory Selector Modal

**Implemented in:** Task 1  
**Files:** `territory-selector-modal.ts`, `game-scene.ts`, `game-state.ts`

**Test Cases:**

✅ **TC-TS-01: Colony Constructor Territory Selection**
- Setup: Player docks ships at Colony Constructor
- Expected: Modal shows all territories with colony counts
- Expected: Only territories with <4 colonies are selectable (green)
- Expected: Territories with 4 colonies are greyed out
- Expected: Selected territory receives colony, control updates

✅ **TC-TS-02: Terraforming Station Territory Selection**
- Setup: Player docks 3-of-a-kind at Terraforming Station
- Expected: Modal shows for territory selection
- Expected: Colony placed, ship returned to stock
- Expected: Colony sprite animates with bounce effect

✅ **TC-TS-03: Colonist Hub Territory Selection**
- Setup: Player advances Colonist Hub track to position 7
- Expected: Resources (1 fuel + 1 ore) deducted
- Expected: Modal shows after facility execution
- Expected: Colony placed on selected territory
- Expected: Track resets to empty

✅ **TC-TS-04: Multiple Colony Placements**
- Setup: Player uses both Colony Constructor and Terraforming Station same turn
- Expected: Two separate modal prompts
- Expected: Both colonies placed correctly
- Expected: Both animations play sequentially

✅ **TC-TS-05: Territory Full Edge Case**
- Setup: All territories have 4 colonies
- Expected: Modal shows but all options greyed out
- Expected: Cancel button available
- Expected: No colony placed if cancelled

### 2. Raiders Outpost Theft UI

**Implemented in:** Task 2  
**Files:** `raiders-choice-modal.ts`, `player-selector-modal.ts`, `resource-picker-modal.ts`

**Test Cases:**

✅ **TC-RO-01: Resource Theft Flow**
- Setup: Player docks ships at Raiders Outpost
- Expected: Choice modal shows "Steal Resources" vs "Steal Tech Card"
- Expected: After selecting resources, player selector shows other players
- Expected: After selecting target, resource picker shows with +/- buttons
- Expected: Resources transferred from target to raider
- Expected: Floating text shows resource changes

✅ **TC-RO-02: Tech Card Theft Flow**
- Setup: Player docks ships at Raiders Outpost
- Expected: After selecting "Steal Tech Card", player selector shows
- Expected: Only players with tech cards are selectable
- Expected: Random card stolen from target
- Expected: Card added to raiding player's hand

✅ **TC-RO-03: No Valid Targets**
- Setup: Only one player in game (shouldn't happen) OR all other players have 0 resources and 0 tech cards
- Expected: Modal handles gracefully
- Expected: Cancel option available

✅ **TC-RO-04: Resource Limits**
- Setup: Target has 2 ore, 0 fuel, 1 energy
- Expected: Resource picker allows max 2 ore, 0 fuel, 1 energy
- Expected: Cannot steal more than target possesses
- Expected: Picker shows current amounts

### 3. Bradbury Plateau Re-roll Button

**Implemented in:** Task 3  
**Files:** `player-hud-layer.ts`, `game-state.ts`, `game-scene.ts`

**Test Cases:**

✅ **TC-BR-01: Button Visibility**
- Setup: Player controls Bradbury Plateau territory
- Expected: Re-roll button appears next to ROLL button
- Expected: Button is active and clickable

✅ **TC-BR-02: Button Hidden Without Bonus**
- Setup: Player does NOT control Bradbury Plateau
- Expected: Re-roll button is hidden
- Expected: No re-roll option available

✅ **TC-BR-03: Re-roll Functionality**
- Setup: Player with Bradbury Plateau, after rolling dice
- Expected: Clicking button shows ship selection
- Expected: Selected ship's die value changes
- Expected: New value is rolled (1-6)
- Expected: Ship sprite updates with new value
- Expected: Notification shows "Re-rolled X → Y"

✅ **TC-BR-04: Once-Per-Turn Enforcement**
- Setup: Player re-rolls once
- Expected: Button becomes greyed out
- Expected: Cannot re-roll again this turn
- Expected: Button resets on next turn

✅ **TC-BR-05: Re-roll After Placement**
- Setup: Player rolls, places some ships, then re-rolls remaining ship
- Expected: Only unplaced ships shown for re-roll
- Expected: Placed ships unaffected

### 4. Colonist Hub Track Completion

**Implemented in:** Task 4  
**Files:** `game-state.ts`, `game-scene.ts`

**Test Cases:**

✅ **TC-CH-01: Track Advancement**
- Setup: Player docks 1 ship at Colonist Hub (empty track)
- Expected: Colony token placed on position 1
- Expected: Track advances by 1 per ship

✅ **TC-CH-02: Multiple Ships Same Turn**
- Setup: Player docks 3 ships at Colonist Hub
- Expected: Track advances 3 positions (to position 3)
- Expected: Single track used (not spread across multiple)

✅ **TC-CH-03: Completion with Resources**
- Setup: Track at position 6, player has 1 fuel + 1 ore, docks 1 ship
- Expected: Track advances to 7
- Expected: Resources deducted (1 fuel, 1 ore)
- Expected: Territory selector modal shows
- Expected: Colony placed on selected territory
- Expected: Track resets to empty

✅ **TC-CH-04: Completion Without Resources**
- Setup: Track at position 6, player has 0 fuel OR 0 ore, docks 1 ship
- Expected: Track advances to 7 but stays there
- Expected: No colony placement
- Expected: No modal shown
- Expected: Track stays at 7 until resources available

✅ **TC-CH-05: Second Colony**
- Setup: Player completes first colony, then docks ships again
- Expected: New track starts at position 1
- Expected: Same advancement rules apply
- Expected: Can complete multiple colonies over game

### 5. Visual Feedback Enhancements

**Implemented in:** Task 5  
**Files:** `game-scene.ts`

**Test Cases:**

✅ **TC-VF-01: Colony Placement Animation**
- Setup: Any colony placement (Constructor, Terraforming, Colonist Hub)
- Expected: Colony sprite scales from 0 to 1 with bounce
- Expected: Secondary bounce (1.0 → 1.1 → 1.0)
- Expected: Animation duration ~650ms total

✅ **TC-VF-02: Resource Change Floating Text**
- Setup: Any facility that spends/gains resources
- Expected: Floating text shows "+X Ore" or "-X Fuel"
- Expected: Text floats upward and fades out
- Expected: Green color for gains, red for costs
- Expected: Multiple resources show side-by-side

✅ **TC-VF-03: Victory Point Floating Text**
- Setup: Player gains VPs (colony placement, territory control)
- Expected: Gold "+X VP" text floats up
- Expected: Larger font than resource text
- Expected: Scales up while fading

✅ **TC-VF-04: Territory Control Glow**
- Setup: Territory control changes (3rd colony placed)
- Expected: Glow pulse animation at territory location
- Expected: Circle expands from center
- Expected: Fades out over 800ms

✅ **TC-VF-05: Animation Performance**
- Setup: Multiple animations simultaneously (2 colonies + resources)
- Expected: No lag or frame drops
- Expected: Animations don't overlap visually
- Expected: All complete correctly

## AI Player Handling

**Test Cases:**

✅ **TC-AI-01: AI Territory Selection**
- Setup: AI player uses Colony Constructor
- Expected: Territory automatically selected (no modal shown)
- Expected: AI uses placement strategy (balance, clustering, etc.)
- Expected: Colony placed correctly

✅ **TC-AI-02: AI Raiders Outpost**
- Setup: AI player uses Raiders Outpost
- Expected: Choice made automatically (resources or tech)
- Expected: Target selected based on strategy
- Expected: Theft executed correctly
- Expected: No UI modals shown

✅ **TC-AI-03: AI Bradbury Plateau Re-roll**
- Setup: AI controls Bradbury Plateau
- Expected: AI evaluates whether to re-roll
- Expected: Re-roll used strategically (poor rolls)
- Expected: No button shown to human player
- Expected: Notification shows AI action

✅ **TC-AI-04: AI Colonist Hub**
- Setup: AI completes Colonist Hub track
- Expected: Territory selected automatically
- Expected: Colony placed without modal
- Expected: Resources deducted correctly

## Edge Cases & Error Handling

**Test Cases:**

✅ **TC-EDGE-01: Cancel Territory Selection**
- Setup: Player opens territory selector
- Expected: Cancel button available
- Expected: No colony placed if cancelled
- Expected: No errors thrown

✅ **TC-EDGE-02: Cancel Raiders Choice**
- Setup: Player opens Raiders modals
- Expected: Can cancel at any step
- Expected: No theft if cancelled
- Expected: Turn continues normally

✅ **TC-EDGE-03: Network Delay Simulation**
- Setup: Add artificial delay to modal responses
- Expected: Game state doesn't advance until modal resolves
- Expected: No race conditions
- Expected: Turn phase managed correctly

✅ **TC-EDGE-04: Multiple Players Same Facility**
- Setup: Two players use Colony Constructor same round
- Expected: Each gets separate modal on their turn
- Expected: Territory availability updates between turns
- Expected: No conflicts or errors

✅ **TC-EDGE-05: Last Colony Placement**
- Setup: Player places 4th colony (game end condition)
- Expected: Victory check triggers
- Expected: Animations complete before victory screen
- Expected: Game ends correctly

## Performance & Polish

**Test Cases:**

✅ **TC-PERF-01: Modal Load Time**
- Expected: Modals appear instantly (<100ms)
- Expected: No visible delay
- Expected: Territory list pre-loaded

✅ **TC-PERF-02: Animation Smoothness**
- Expected: 60 FPS maintained during animations
- Expected: No stuttering or dropped frames
- Expected: Tweens complete correctly

✅ **TC-PERF-03: Memory Leaks**
- Setup: Play multiple games in succession
- Expected: Memory usage stable
- Expected: Modals destroyed properly
- Expected: No orphaned listeners

✅ **TC-PERF-04: Touch/Click Responsiveness**
- Expected: Buttons respond immediately
- Expected: No double-clicks registered
- Expected: Hover states work correctly

## Regression Testing

Ensure Phase 7 changes didn't break existing features:

✅ **TC-REG-01: Basic Facility Docking**
- All 11 facilities still work correctly

✅ **TC-REG-02: Ship Movement**
- Drag-and-drop still functions
- Locking/unlocking works

✅ **TC-REG-03: Resource Management**
- Gaining resources from Solar Converter, Lunar Mine
- Spending resources at Shipyard

✅ **TC-REG-04: Turn Flow**
- Roll → Place → Resolve → Next Player
- Phase transitions correct

✅ **TC-REG-05: Victory Conditions**
- 4 colonies triggers victory
- Victory screen shows correctly

## Test Execution Status

**Date:** October 31, 2025

- [ ] All TC-TS (Territory Selector) tests
- [ ] All TC-RO (Raiders Outpost) tests
- [ ] All TC-BR (Bradbury Re-roll) tests
- [ ] All TC-CH (Colonist Hub) tests
- [ ] All TC-VF (Visual Feedback) tests
- [ ] All TC-AI (AI Player) tests
- [ ] All TC-EDGE (Edge Cases) tests
- [ ] All TC-PERF (Performance) tests
- [ ] All TC-REG (Regression) tests

## Known Issues

*None currently identified - to be updated during testing*

## Test Summary

- **Total Test Cases:** 45
- **Passed:** TBD
- **Failed:** TBD
- **Blocked:** TBD
- **Coverage:** UI interactions, AI handling, edge cases, performance

## Sign-off

**Tester:** _________________  
**Date:** _________________  
**Status:** ☐ PASSED ☐ FAILED ☐ NEEDS WORK

---

**Next Steps:**
1. Execute manual testing of all test cases
2. Fix any issues discovered
3. Update test results in this document
4. Create automated UI tests where possible
5. Final build and deployment
