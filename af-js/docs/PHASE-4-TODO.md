# Phase 4: AI Opponents & Complete Game Flow

## Overview
Phase 4 completes the core game implementation by adding AI opponents, full turn automation, victory conditions, and all remaining game mechanics needed for a playable game.

## Goals
1. ✅ Implement AI decision-making for all game actions
2. ✅ Complete turn flow with automatic phase advancement
3. ✅ Add victory condition checking and game-over handling
4. ✅ Initialize tech card deck with proper distribution
5. ✅ Implement colony construction costs
6. ✅ Add comprehensive testing for AI and game flow

## Dependencies
- **Phase 1**: Core systems (ships, players, facilities, turns)
- **Phase 2**: All 10 orbital facilities with full functionality
- **Phase 3**: Tech cards (13 types) and territories (8 territories + 3 field generators)

---

## Task Breakdown

### Task 1: Tech Card Deck Initialization ⏳
**Priority**: High (blocks AI tech card decisions)

**Description**: Create and initialize the tech card deck with proper card distribution.

**Subtasks**:
1. Define card quantities (how many of each tech card type)
2. Create `initializeTechCardDeck()` method in GameState
3. Implement shuffle algorithm for tech card deck
4. Add draw card mechanics (already partially implemented)
5. Handle empty deck scenarios (reshuffle discard pile)

**Files to Modify**:
- `src/game/game-state.ts`: Add deck initialization
- `__tests__/game/game-state.test.ts`: Add deck tests

**Acceptance Criteria**:
- [ ] Deck contains correct number of each card type
- [ ] Cards are properly shuffled
- [ ] Drawing from empty deck reshuffles discard pile
- [ ] Tests verify deck composition and mechanics

---

### Task 2: Complete Turn Flow Automation ⏳
**Priority**: High (foundation for AI)

**Description**: Implement automatic phase advancement and turn management with proper game flow.

**Subtasks**:
1. Add automatic territory bonus application at turn start
2. Implement resource collection phase logic
3. Add end-turn cleanup (undock ships, reset used flags)
4. Implement discard-to-8 resource limit
5. Add phase-specific validation and constraints

**Files to Modify**:
- `src/game/game-state.ts`: Enhance advancePhase() and turn management
- `src/game/territory-manager.ts`: Auto-apply bonuses
- `src/game/player.ts`: Resource limit enforcement

**Acceptance Criteria**:
- [ ] Territory bonuses auto-apply at turn start
- [ ] Resources collected automatically in COLLECT_RESOURCES phase
- [ ] Players must discard to 8 resources at turn end
- [ ] Ships automatically undock at turn end
- [ ] Tests verify complete turn flow

---

### Task 3: AI Base Infrastructure ⏳
**Priority**: High (foundation for all AI)

**Description**: Create AI decision-making framework with evaluation functions.

**Subtasks**:
1. Create `src/game/ai/` directory
2. Implement `base-ai.ts` with abstract AI class
3. Create `ai-types.ts` with difficulty levels (Cadet, Spacer, Pirate, Admiral)
4. Implement game state evaluation function (score current position)
5. Add lookahead/tree search foundation

**Files to Create**:
- `src/game/ai/base-ai.ts`
- `src/game/ai/ai-types.ts`
- `src/game/ai/evaluator.ts`
- `src/game/ai/index.ts`

**Acceptance Criteria**:
- [ ] AI base class defines decision interface
- [ ] 4 difficulty levels implemented
- [ ] Evaluation function scores game states
- [ ] AI can be instantiated for players
- [ ] Tests verify AI infrastructure

---

### Task 4: AI Facility Decision-Making ⏳
**Priority**: Medium (core AI capability)

**Description**: Implement AI logic for optimal ship placement at orbital facilities.

**Subtasks**:
1. Implement facility evaluation (which facility provides best value)
2. Add ship-to-facility matching logic (dice value requirements)
3. Implement priority system for facility selection
4. Add dock group optimization
5. Consider multi-ship facility placements (Colonist Hub, Constructor)

**Files to Modify**:
- `src/game/ai/facility-ai.ts` (new)
- `src/game/ai/base-ai.ts`: Add facility decision method

**Acceptance Criteria**:
- [ ] AI evaluates all available facilities
- [ ] AI matches ships to facility requirements
- [ ] AI prioritizes valuable facilities (Colonist Hub > Solar Converter)
- [ ] AI handles multi-ship placements correctly
- [ ] Tests verify facility selection logic

---

### Task 5: AI Tech Card Usage ⏳
**Priority**: Medium (strategic depth)

**Description**: Implement AI decision-making for when and how to use tech cards.

**Subtasks**:
1. Evaluate tech card power value vs fuel cost
2. Implement timing logic (when to use during turn)
3. Add discard decision logic (when to trigger discard powers)
4. Consider tech card combos and synergies
5. Implement card acquisition decisions (Alien Artifact)

**Files to Create**:
- `src/game/ai/tech-card-ai.ts`

**Files to Modify**:
- `src/game/ai/base-ai.ts`: Add tech card decision method

**Acceptance Criteria**:
- [ ] AI evaluates tech card power value
- [ ] AI uses cards at optimal timing
- [ ] AI makes smart discard decisions
- [ ] AI acquires valuable cards from Alien Artifact
- [ ] Tests verify tech card usage logic

---

### Task 6: AI Territory Strategy ⏳
**Priority**: Medium (territorial control)

**Description**: Implement AI decision-making for colony placement and territory control.

**Subtasks**:
1. Evaluate territory bonus values
2. Implement colony placement strategy
3. Add territory control assessment (when to compete vs concede)
4. Implement field generator placement decisions
5. Consider long-term territory value vs immediate benefits

**Files to Create**:
- `src/game/ai/territory-ai.ts`

**Files to Modify**:
- `src/game/ai/base-ai.ts`: Add territory decision method

**Acceptance Criteria**:
- [ ] AI evaluates territory bonuses
- [ ] AI places colonies strategically
- [ ] AI competes for valuable territories
- [ ] AI uses field generators effectively
- [ ] Tests verify territory strategy

---

### Task 7: Victory Condition & Game End ⏳
**Priority**: High (completes game loop)

**Description**: Implement game-over detection and winner determination.

**Subtasks**:
1. Detect when player places final colony (0 colonies left)
2. Calculate final victory points for all players
3. Determine winner(s) (handle ties)
4. Add game-over event/state
5. Prevent further actions after game ends

**Files to Modify**:
- `src/game/game-state.ts`: Enhance isGameOver() and getWinners()
- `src/game/player-manager.ts`: Add colony tracking

**Acceptance Criteria**:
- [ ] Game detects when last colony is placed
- [ ] Final VP calculated correctly
- [ ] Winner(s) determined (ties handled)
- [ ] Game state prevents post-game actions
- [ ] Tests verify victory conditions

---

### Task 8: Colony Construction Costs ⏳
**Priority**: Medium (resource management)

**Description**: Implement ore/fuel requirements for colony placement.

**Subtasks**:
1. Uncomment colony cost checking in game-state.ts
2. Define colony costs (3 ore + 1 fuel typically)
3. Validate player resources before placement
4. Deduct costs when colony is placed
5. Add cost validation to Colonist Hub

**Files to Modify**:
- `src/game/game-state.ts`: Enable cost checking
- `src/game/facilities/colonist-hub.ts`: Validate costs
- `src/game/player.ts`: Resource deduction

**Acceptance Criteria**:
- [ ] Colony placement requires 3 ore + 1 fuel
- [ ] Players without resources cannot place
- [ ] Costs deducted from player resources
- [ ] Tests verify cost enforcement

---

### Task 9: Comprehensive Testing ⏳
**Priority**: High (quality assurance)

**Description**: Add comprehensive tests for all Phase 4 features.

**Subtasks**:
1. Test tech card deck initialization and drawing
2. Test complete turn flow automation
3. Test AI decision-making for all actions
4. Test victory conditions and game end
5. Test colony construction costs
6. Integration tests for complete game scenarios

**Files to Create**:
- `__tests__/game/ai/base-ai.test.ts`
- `__tests__/game/ai/facility-ai.test.ts`
- `__tests__/game/ai/tech-card-ai.test.ts`
- `__tests__/game/ai/territory-ai.test.ts`
- `__tests__/game/turn-flow.test.ts`
- `__tests__/game/victory.test.ts`

**Acceptance Criteria**:
- [ ] AI tests cover all difficulty levels
- [ ] Turn flow tests verify complete sequences
- [ ] Victory condition tests cover all scenarios
- [ ] All Phase 4 tests passing
- [ ] Code coverage > 80%

---

### Task 10: Phase 4 Documentation ⏳
**Priority**: Medium (knowledge capture)

**Description**: Document all Phase 4 implementations and architecture.

**Subtasks**:
1. Document AI architecture and algorithms
2. Document turn flow sequences
3. Provide usage examples for AI integration
4. Document victory conditions
5. Create PHASE-4-COMPLETE.md

**Files to Create**:
- `docs/PHASE-4-COMPLETE.md`
- `docs/AI-ARCHITECTURE.md` (optional)

**Acceptance Criteria**:
- [ ] All AI classes documented
- [ ] Turn flow sequences documented
- [ ] Usage examples provided
- [ ] Architecture diagrams (optional)
- [ ] Complete summary of Phase 4

---

## Implementation Order

### Sprint 1: Foundation
1. Task 1: Tech Card Deck Initialization
2. Task 2: Complete Turn Flow Automation
3. Task 7: Victory Condition & Game End

### Sprint 2: AI Core
4. Task 3: AI Base Infrastructure
5. Task 4: AI Facility Decision-Making

### Sprint 3: AI Strategy
6. Task 5: AI Tech Card Usage
7. Task 6: AI Territory Strategy

### Sprint 4: Polish & Testing
8. Task 8: Colony Construction Costs
9. Task 9: Comprehensive Testing
10. Task 10: Phase 4 Documentation

---

## Success Criteria

### Functional Requirements
- ✅ AI can play complete game without human intervention
- ✅ All 4 difficulty levels work correctly
- ✅ Tech card deck properly initialized and managed
- ✅ Complete turn flow with all phases automated
- ✅ Victory conditions detect game end correctly
- ✅ Colony costs enforced properly

### Quality Requirements
- ✅ All tests passing (target: 200+ total tests)
- ✅ Code coverage > 80%
- ✅ No TypeScript compilation errors
- ✅ All Phase 3 functionality still working
- ✅ Comprehensive documentation

### Performance Requirements
- ✅ AI turn completes in < 5 seconds (Cadet/Spacer)
- ✅ AI turn completes in < 30 seconds (Admiral)
- ✅ Game state clone/evaluation performant

---

## Known Challenges

### AI Complexity
- Exhaustive search space for optimal moves
- Tech card timing and combo evaluation
- Multi-turn strategy planning

**Mitigation**: Start with simple heuristic AI, add search depth later

### Turn Flow Edge Cases
- Resource overflow (discard to 8)
- Tech card usage during various phases
- Field generator interactions

**Mitigation**: Comprehensive test coverage for edge cases

### Performance
- AI lookahead may be slow for complex states
- Game state cloning overhead

**Mitigation**: Optimize evaluation function, limit search depth

---

## Phase 4 Deliverables

### Code (estimated ~3,000 lines)
- `src/game/ai/` - AI implementation (~1,200 lines)
- `src/game/game-state.ts` - Turn flow & deck (~300 lines added)
- `__tests__/game/ai/` - AI tests (~800 lines)
- `__tests__/game/` - Turn flow & victory tests (~400 lines)

### Documentation
- `docs/PHASE-4-COMPLETE.md` - Comprehensive documentation
- `docs/AI-ARCHITECTURE.md` - AI design document (optional)
- Updated README.md with AI usage

### Quality
- All Phase 4 tests passing
- Total test count: 200+ tests (59 Phase 3 + 40+ Phase 4)
- Code coverage > 80%

---

## Post-Phase 4

### Phase 5: UI/UX Integration (Future)
- Connect game state to Phaser scenes
- Implement visual feedback for all actions
- Add animations for ships, facilities, territories
- Create player HUD and resource displays

### Phase 6: Multiplayer & Polish (Future)
- Network multiplayer support
- Save/load game state
- Sound effects and music
- Tutorial system
- Achievements

---

## Notes

### From Original iOS Implementation
- ExhaustiveAI uses depth-first search with time limit (5.9 seconds)
- AI assigns value scores to game states (VP, ships, resources, tech)
- SimpleAI uses greedy heuristics (simpler, faster)
- AI personalities differ in aggression and valuation weights

### Design Decisions
- Start with simpler heuristic AI before exhaustive search
- Implement evaluation function based on iOS values
- Use TypeScript for type safety in AI logic
- Keep AI logic separate from core game state

---

**Status**: Phase 4 ready to begin
**Estimated Completion**: 11 tasks
**Dependencies**: Phase 1, 2, 3 complete ✅
