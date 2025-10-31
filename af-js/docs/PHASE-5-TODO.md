# Phase 5: UI/UX Integration

## Overview
Phase 5 connects the complete game logic (from Phase 4) to the Phaser UI. This brings the game to life with visual feedback, animations, and interactive gameplay.

## Goals
1. Connect GameState to Phaser scenes
2. Implement visual ship placement and movement
3. Create interactive facilities with feedback
4. Display resources, colonies, and game state
5. Animate turn flow and phase transitions
6. Visualize dice rolling
7. Show territories and colony placement
8. Implement tech card UI
9. Visualize AI turns
10. Create victory screen

## Dependencies
- **Phase 4**: Complete game logic, AI, turn flow, victory conditions ✅
- **Existing UI**: Boot, MainMenu, PlayerSetup, and GameScene shells ✅

---

## Task Breakdown

### Task 1: Connect GameState to GameScene ✅
**Priority**: Critical (foundation for all UI)  
**Status**: COMPLETE

**Description**: Integrate the game state management system with the Phaser GameScene.

**Subtasks**:
1. ✅ Import GameState into GameScene
2. ✅ Initialize GameState with player configurations from PlayerSetupScene
3. ✅ Create method to sync UI with game state
4. ✅ Implement state change event system
5. ✅ Add debug overlay showing game state

**Files Modified**:
- `src/scenes/game-scene.ts`: Added GameState integration (300+ lines)
- `src/layers/player-hud-layer.ts`: Added `updatePlayerState()` method
- `src/layers/mini-player-hud-layer.ts`: Added `updatePlayerState()` method

**Files Created**:
- `__tests__/scenes/game-scene.test.ts`: 6 tests for GameState integration

**Acceptance Criteria**:
- [x] GameState initialized when game starts
- [x] Player configurations passed from setup screen
- [x] Debug overlay shows current game state (toggle with D key)
- [x] State updates trigger UI refreshes
- [x] Tests verify state synchronization (6 tests passing)

---

### Task 2: Implement Ship Sprites ⏳
**Priority**: High (core gameplay)

**Description**: Create draggable ship sprites with visual states.

**Subtasks**:
1. Create ShipSprite class extending Phaser.Sprite
2. Implement drag-and-drop functionality
3. Add ship state visuals (undocked, docked, in-transit)
4. Implement ship-to-facility snapping
5. Show dice values on ships
6. Add ship placement validation feedback

**Files to Create**:
- `src/ui/ship-sprite.ts`

**Files to Modify**:
- `src/scenes/game-scene.ts`: Add ship sprite management
- `src/layers/player-hud-layer.ts`: Add ships to player tray

**Acceptance Criteria**:
- [ ] Ships are draggable from player tray
- [ ] Ships snap to valid facilities
- [ ] Dice values displayed on ships
- [ ] Visual feedback for valid/invalid placements
- [ ] Ships return to tray if placement fails

---

### Task 3: Facility Interaction System ⏳
**Priority**: High (core gameplay)

**Description**: Make facilities interactive with visual feedback.

**Subtasks**:
1. Create facility click zones on game board
2. Implement hover effects showing requirements
3. Add facility state indicators (available/occupied)
4. Show ship placement validation
5. Display facility effects on hover
6. Implement facility action feedback

**Files to Create**:
- `src/ui/facility-sprite.ts`
- `src/ui/facility-tooltip.ts`

**Files to Modify**:
- `src/scenes/game-scene.ts`: Add facility sprites

**Acceptance Criteria**:
- [ ] Facilities highlight on hover
- [ ] Tooltips show requirements and effects
- [ ] Visual indicators for occupied facilities
- [ ] Placement validation visible
- [ ] Facility actions trigger visual feedback

---

### Task 4: Resource & Colony Display ✅
**Priority**: High (game state visibility)  
**Status**: COMPLETE

**Description**: Update HUD to show real-time game state.

**Subtasks**:
1. ✅ Add resource counters (ore, fuel) to PlayerHUDLayer
2. ✅ Display tech card count
3. ✅ Show colony count with max (10)
4. ⏳ Add resource gain/loss animations (future enhancement)
5. ⏳ Implement resource limit warnings (3 max) (future enhancement)

**Files Modified**:
- `src/layers/player-hud-layer.ts`: Added `updatePlayerState()` method with real-time displays
- `src/layers/mini-player-hud-layer.ts`: Added `updatePlayerState()` method with real-time displays

**Acceptance Criteria**:
- [x] Resources update in real-time
- [ ] Animations show resource changes (deferred to polish phase)
- [x] Colony progress visible (X/10)
- [ ] Resource limits indicated (deferred to polish phase)
- [x] All players' states visible

---

### Task 5: Turn Flow UI Integration ✅
**Priority**: High (game progression)  
**Status**: COMPLETE

**Description**: Implement UI controls for turn management.

**Subtasks**:
1. ✅ Create turn phase indicator (Roll, Place, Resolve, Cleanup)
2. ✅ Add "Roll Dice" button
3. ✅ Add "End Turn" button
4. ✅ Show current player indicator
5. ✅ Display turn counter
6. ✅ Implement phase transition animations

**Files Created**:
- `src/ui/turn-controls.ts`: Complete turn control UI (250 lines)
- `__tests__/ui/turn-controls.test.ts`: 9 tests for turn controls

**Files Modified**:
- `src/scenes/game-scene.ts`: Added turn UI and phase management

**Acceptance Criteria**:
- [x] Current phase clearly visible
- [x] Phase-appropriate buttons enabled/disabled
- [x] Current player highlighted
- [x] Turn counter displayed
- [x] Smooth phase transitions

---

### Task 6: Dice Rolling Animation ⏳
**Priority**: Medium (visual polish)

**Description**: Animate dice rolling with visual results.

**Subtasks**:
1. Create dice sprite animations
2. Implement rolling animation (tumbling effect)
3. Show final dice values
4. Display dice in player tray
5. Implement tech card re-roll animations

**Files to Create**:
- `src/ui/dice-sprite.ts`
- `src/ui/dice-roller.ts`

**Acceptance Criteria**:
- [ ] Dice roll with animation
- [ ] Final values clearly visible
- [ ] Dice remain in player area
- [ ] Re-rolls animated differently
- [ ] Smooth, satisfying animations

---

### Task 7: Territory & Colony Visualization ⏳
**Priority**: Medium (game board state)

**Description**: Display territories and colonies on game board.

**Subtasks**:
1. Create territory zones on board
2. Add colony sprites with player colors
3. Show territory control indicators
4. Display territory bonuses
5. Implement colony placement animation
6. Show field generator effects

**Files to Create**:
- `src/ui/territory-sprite.ts`
- `src/ui/colony-sprite.ts`

**Files to Modify**:
- `src/scenes/game-scene.ts`: Add territory layer

**Acceptance Criteria**:
- [ ] Territories clearly defined
- [ ] Colonies visible with colors
- [ ] Control status indicated
- [ ] Bonuses displayed
- [ ] Placement animated
- [ ] Field generators shown

---

### Task 8: Tech Card UI ⏳
**Priority**: Medium (strategic gameplay)

**Description**: Implement tech card hand and usage interface.

**Subtasks**:
1. Create tech card hand display
2. Implement card selection/preview
3. Add "Use Card" button
4. Show card effects/text
5. Display discard pile count
6. Implement card gain/loss animations

**Files to Create**:
- `src/ui/tech-card-sprite.ts`
- `src/ui/tech-card-hand.ts`

**Files to Modify**:
- `src/layers/player-hud-layer.ts`: Add card area

**Acceptance Criteria**:
- [ ] Cards displayed in hand
- [ ] Card text readable
- [ ] Selection and usage clear
- [ ] Effects shown when used
- [ ] Discard pile visible
- [ ] Animations smooth

---

### Task 9: AI Turn Visualization ⏳
**Priority**: Medium (AI feedback)

**Description**: Show AI decision-making and actions.

**Subtasks**:
1. Display "AI Thinking" indicator
2. Animate AI ship placements with delays
3. Show AI tech card usage
4. Display AI colony placement
5. Add action descriptions/notifications
6. Implement adjustable AI speed

**Files to Create**:
- `src/ui/ai-action-animator.ts`
- `src/ui/action-notification.ts`

**Files to Modify**:
- `src/scenes/game-scene.ts`: Add AI visualization

**Acceptance Criteria**:
- [ ] AI turns have visible pacing
- [ ] Actions are clear and understandable
- [ ] Thinking indicator shown
- [ ] Notifications describe actions
- [ ] Speed adjustable
- [ ] Can skip/speed up AI turns

---

### Task 10: Victory Screen ⏳
**Priority**: Medium (game completion)

**Description**: Implement game-over detection and victory display.

**Subtasks**:
1. Detect victory condition in UI
2. Show winner announcement overlay
3. Display final scores for all players
4. Show tiebreaker breakdown if applicable
5. Add "Rematch" button
6. Add "Main Menu" button

**Files to Create**:
- `src/scenes/victory-scene.ts`
- `src/ui/score-display.ts`

**Files to Modify**:
- `src/scenes/game-scene.ts`: Add victory detection
- `src/scenes/index.ts`: Register victory scene

**Acceptance Criteria**:
- [ ] Victory detected automatically
- [ ] Winner clearly announced
- [ ] All scores displayed
- [ ] Tiebreakers explained
- [ ] Navigation options provided
- [ ] Celebration animation (optional)

---

## Implementation Order

### Sprint 1: Core Integration (Week 1)
1. **Task 1**: Connect GameState to GameScene
2. **Task 4**: Resource & Colony Display
3. **Task 5**: Turn Flow UI Integration

### Sprint 2: Gameplay Interaction (Week 2)
4. **Task 2**: Implement Ship Sprites
5. **Task 3**: Facility Interaction System
6. **Task 6**: Dice Rolling Animation

### Sprint 3: Strategic Elements (Week 3)
7. **Task 7**: Territory & Colony Visualization
8. **Task 8**: Tech Card UI

### Sprint 4: AI & Completion (Week 4)
9. **Task 9**: AI Turn Visualization
10. **Task 10**: Victory Screen

---

## Success Criteria

### Functional Requirements
- [ ] Complete game playable start-to-finish
- [ ] All game rules enforced through UI
- [ ] AI opponents fully functional
- [ ] Victory conditions detected and displayed
- [ ] All Phase 4 features accessible

### Quality Requirements
- [ ] Smooth 60fps gameplay
- [ ] Clear visual feedback for all actions
- [ ] Intuitive drag-and-drop mechanics
- [ ] No game state desync issues
- [ ] Responsive to user input (<100ms)

### UX Requirements
- [ ] New players can understand gameplay
- [ ] Current game state always visible
- [ ] Turn flow is clear and guided
- [ ] AI turns are watchable but not tedious
- [ ] Errors are explained visually

---

## Technical Considerations

### Performance
- Use object pooling for frequently created sprites
- Minimize game state cloning
- Batch visual updates when possible
- Optimize collision detection for drag-and-drop

### Synchronization
- Keep UI state in sync with GameState
- Use event system for state changes
- Avoid direct UI manipulation of game logic
- Clear separation of concerns

### Animation Timing
- AI actions: 500ms-1000ms per action
- Dice roll: 1-2 seconds
- Ship placement: 300ms
- Resource changes: 500ms
- Phase transitions: 800ms

---

## Assets Needed

### Existing Assets (from af-js/assets)
- ✅ Game board image
- ✅ Player tray images
- ✅ Button sprites
- ✅ Background images

### New Assets Needed
- [ ] Ship sprites (4 colors x 3 sizes)
- [ ] Dice sprites (1-6 faces)
- [ ] Colony tokens (4 colors)
- [ ] Tech card art (22 cards)
- [ ] Resource icons (ore, fuel)
- [ ] Facility icons/highlights
- [ ] Effect animations (optional)

---

## Known Challenges

### Drag-and-Drop Complexity
- Ship-to-facility validation
- Multi-ship facilities (Colonist Hub)
- Dice value matching
- Touch vs mouse input

**Mitigation**: Robust validation layer, clear visual feedback

### State Synchronization
- UI lagging behind game state
- Race conditions in animations
- Turn flow timing

**Mitigation**: Event-driven architecture, animation queuing

### AI Turn Pacing
- Too fast: Players can't follow
- Too slow: Tedious to watch
- Variable complexity per turn

**Mitigation**: Configurable AI speed, skip/fast-forward options

---

## Phase 5 Deliverables

### Code (estimated ~2,500 lines)
- `src/ui/` - UI components (~1,000 lines)
- `src/scenes/game-scene.ts` - Integration (~500 lines)
- `src/layers/` - HUD updates (~400 lines)
- Tests for UI components (~600 lines)

### Visual Assets
- Ship sprites
- Dice animations
- Colony tokens
- UI overlays
- Effect particles (optional)

### Documentation
- `docs/PHASE-5-COMPLETE.md`
- UI integration guide
- Player interaction guide

---

## Post-Phase 5

### Phase 6: Polish & Multiplayer
- Network multiplayer support
- Save/load game state
- Sound effects and music
- Improved animations
- Tutorial system
- Settings menu

---

## Notes

### Design Principles
- Visual clarity over flash
- Immediate feedback for actions
- Minimal UI chrome
- Information where you need it
- Accessible color schemes

### From iOS Implementation
- Drag-and-drop feel is critical
- Ship placement must feel smooth
- Clear visual hierarchy
- Subtle animations, not distracting
- Touch-friendly hit zones

---

**Status**: Phase 5 ready to begin
**Estimated Completion**: 10 tasks, ~4 weeks
**Dependencies**: Phase 4 complete ✅

