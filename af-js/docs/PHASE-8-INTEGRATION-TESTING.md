# Phase 8: Integration Testing Checklist

**Status**: In Progress  
**Date Started**: October 31, 2025  
**Tester**: Manual verification required

## Overview

This document provides a comprehensive integration testing checklist for Alien Frontiers. These tests verify that all game systems work together correctly in real gameplay scenarios.

## Test Environment

- **Build**: Hash ed657bb420b9872561a9
- **Bundle Size**: 484 KiB main + 7.96 MB vendor
- **Browser**: Modern browser with JavaScript enabled
- **Resolution**: 1536×2048 portrait (iPad resolution)

---

## 1. 2-Player Game: Human vs AI

### Setup
- [ ] Start new game with 2 players
- [ ] Player 1: Human (any color)
- [ ] Player 2: AI Easy

### Turn Sequence
- [ ] Verify turn order displayed correctly
- [ ] Verify current player highlighted in HUD
- [ ] Verify AI takes turns automatically
- [ ] Verify smooth transitions between turns

### Core Gameplay
- [ ] Roll dice and verify results displayed
- [ ] Use Colony Constructor to place colony
  - [ ] Territory Selector modal appears with animations
  - [ ] Modal has glow effect and smooth entrance
  - [ ] Can select available territory
  - [ ] Colony appears on board with correct color
  - [ ] Territory control updates correctly
  - [ ] Control change triggers glow animation
- [ ] Use Terraforming Station
  - [ ] Can swap two dice values
  - [ ] Dice update immediately
  - [ ] Resource cost deducted correctly
- [ ] Use Colonist Hub
  - [ ] Can upgrade colony to city
  - [ ] City appears on board (stacked colony)
  - [ ] Territory control recalculated

### Visual Feedback
- [ ] Resource transactions show floating text
  - [ ] Ore, Fuel, Energy all display correctly
  - [ ] Text stacks vertically (no overlap)
  - [ ] Animation fades out smoothly
- [ ] Territory control changes show glow animation
  - [ ] Blue glow pulses on territory name
  - [ ] Lasts appropriate duration
  - [ ] Doesn't interfere with gameplay

### Victory Condition
- [ ] Game ends when player reaches 8 points
- [ ] Victory message displayed
- [ ] Can return to main menu

---

## 2. 4-Player Game: Mixed Human/AI

### Setup
- [ ] Start new game with 4 players
- [ ] Player 1: Human (Blue)
- [ ] Player 2: AI Easy (Green)
- [ ] Player 3: Human (Red)  
- [ ] Player 4: AI Medium (Yellow)

### Multi-Player Dynamics
- [ ] All 4 players cycle through turns correctly
- [ ] HUD shows all 4 player colors
- [ ] Resource counts update for each player
- [ ] Victory points track correctly for all

### Raiders Outpost Testing
- [ ] Human player uses Raiders Outpost
  - [ ] Raiders Choice Modal appears with animation
  - [ ] Modal has glow effect and smooth entrance
  - [ ] Can choose "Steal Resources" or "Steal Tech Card"
  
- [ ] Choose "Steal Resources"
  - [ ] Player Selector Modal appears with animations
  - [ ] Shows all opponents (3 other players)
  - [ ] Each player button shows name and color
  - [ ] Can select target player
  - [ ] Resource Picker Modal appears
  - [ ] Can select ore, fuel, energy amounts
  - [ ] +/− buttons work correctly
  - [ ] Resources transferred from target to player
  - [ ] Both player resource counts update
  
- [ ] Choose "Steal Tech Card"
  - [ ] Tech card stolen from target
  - [ ] Card removed from target's hand
  - [ ] Card added to player's hand

### AI Raiders Behavior
- [ ] AI player uses Raiders Outpost
  - [ ] AI automatically chooses option
  - [ ] AI automatically selects target player
  - [ ] Resources/cards transferred correctly
  - [ ] Notification displays AI action

### Edge Cases
- [ ] All territories full (no available slots)
  - [ ] Colony Constructor disabled or shows "No space"
- [ ] Target player has no resources
  - [ ] Raiders shows "No resources to steal"
- [ ] Last tech card in deck
  - [ ] Card stolen successfully
  - [ ] Deck reshuffles if needed

---

## 3. AI-Only Game

### Setup
- [ ] Start new game with 4 AI players
- [ ] Player 1: AI Easy
- [ ] Player 2: AI Easy
- [ ] Player 3: AI Medium
- [ ] Player 4: AI Hard

### AI Behavior
- [ ] All AI players make decisions automatically
- [ ] Turn progression smooth and fast
- [ ] AI uses all facilities correctly:
  - [ ] Colony Constructor
  - [ ] Terraforming Station
  - [ ] Raiders Outpost
  - [ ] Colonist Hub
- [ ] No UI hangs or delays

### Performance
- [ ] Game runs at 55-60 FPS throughout
- [ ] No memory leaks over 20+ turns
- [ ] AI turn time reasonable:
  - [ ] Easy: 1-3 seconds
  - [ ] Medium: 3-8 seconds
  - [ ] Hard: 8-15 seconds
- [ ] No console errors

### Victory
- [ ] Game completes to victory
- [ ] Winning AI announced correctly
- [ ] Final scores displayed

---

## 4. Edge Case Testing

### Re-Roll Button
- [ ] Re-roll button visible during roll phase
- [ ] Button disabled after use (no second re-roll)
- [ ] Re-roll costs 1 ore (deducted correctly)
- [ ] Button unavailable if insufficient ore
- [ ] Button re-enables next turn
- [ ] AI uses re-roll intelligently

### Tech Cards
- [ ] Tech cards drawn from deck
- [ ] Tech cards played from hand
- [ ] Tech card effects apply correctly:
  - [ ] Alien Artifact: Steal colony
  - [ ] Gravity Manipulator: Change die value
  - [ ] Holographic Decoy: Extra action
  - [ ] Data Crystal: +2 VP
- [ ] Tech card discarded after use

### Territory Control
- [ ] Multiple colonies on same territory
- [ ] Colony + City on same territory (2 control)
- [ ] Control tied between players (no bonus)
- [ ] Control changes dynamically during turn
- [ ] Control bonuses apply immediately

### Resource Management
- [ ] Cannot perform action without resources
- [ ] Ore, Fuel, Energy tracked separately
- [ ] Resource transactions accurate
- [ ] Resource picker enforces limits

---

## 5. Visual Polish Verification

### Modal Animations
- [ ] Territory Selector:
  - [ ] Outer blue glow visible
  - [ ] Inner highlight visible
  - [ ] Entrance animation smooth (fade + scale)
  - [ ] Exit closes cleanly
  
- [ ] Raiders Choice Modal:
  - [ ] Same glow/highlight effects
  - [ ] Entrance animation smooth
  - [ ] Button hover states work
  
- [ ] Player Selector Modal:
  - [ ] Same visual enhancements
  - [ ] Player buttons clear and interactive
  
- [ ] Resource Picker Modal:
  - [ ] Same polish applied
  - [ ] +/− buttons responsive

### General UI
- [ ] All buttons have hover states
- [ ] Transitions smooth (no jarring jumps)
- [ ] Text readable and properly positioned
- [ ] No visual glitches or artifacts

---

## 6. Regression Testing

### Phase 7 Features
- [ ] Territory Selector works as expected
- [ ] Raiders Outpost works as expected
- [ ] Re-roll button works as expected
- [ ] Colonist Hub works as expected
- [ ] All animations play correctly

### Previous Phases
- [ ] Core dice rolling (Phase 1)
- [ ] Facility actions (Phase 2)
- [ ] Tech cards (Phase 3)
- [ ] AI decision-making (Phase 4-6)
- [ ] Resource management (all phases)

### No Regressions
- [ ] No new bugs introduced
- [ ] All previous features still work
- [ ] Performance still excellent

---

## Test Results Summary

### Pass/Fail Status
- [ ] All 2-player tests passed
- [ ] All 4-player tests passed
- [ ] All AI-only tests passed
- [ ] All edge cases handled
- [ ] All visual polish verified
- [ ] No regressions detected

### Issues Found
(Document any issues discovered during testing)

1. **Issue**: 
   - **Severity**: 
   - **Steps to Reproduce**: 
   - **Expected**: 
   - **Actual**: 
   - **Status**: 

### Performance Metrics
- **Average FPS**: ___ (target: 55-60)
- **Memory Usage**: ___ MB (stable)
- **AI Turn Time Easy**: ___ seconds
- **AI Turn Time Medium**: ___ seconds
- **AI Turn Time Hard**: ___ seconds
- **Load Time**: ___ seconds

---

## Completion Criteria

Phase 8 Integration Testing is complete when:

✅ All 6 test sections executed  
✅ All checklist items verified  
✅ No critical bugs found  
✅ Performance within acceptable ranges  
✅ Visual polish confirmed working  
✅ No regressions from previous phases

**Overall Status**: 🚧 IN PROGRESS

---

## Next Steps After Integration Testing

1. Execute Phase 7 Test Plan (45 manual test cases)
2. Address any issues found during integration testing
3. Create Phase 8 completion summary
4. Prepare for Phase 9 or release candidate
