# Phase 7: UI Integration for Phase 6 Features

**Started**: October 31, 2025  
**Status**: 🚧 IN PROGRESS  
**Lead Agent**: UI & Interaction Agent (05)

---

## 🎯 Phase 7 Objectives

Phase 7 implements the UI layer for all Phase 6 gameplay features, enabling player interaction with colony placement, resource theft, ship building, and territory bonuses.

## Agent Responsibilities

### Primary: UI & Interaction Agent (05)
- Colony placement territory selector modal
- Raiders Outpost theft choice UI
- Bradbury Plateau re-roll button
- Visual feedback for new facilities
- Integration with GameScene

### Supporting: Game State Agent (01)
- Colony placement validation
- Theft execution logic
- Re-roll mechanics
- Resource deduction

### Supporting: Board Facilities Agent (02)
- Facility state queries
- Action result handling
- Colonist Hub track status

### Supporting: Dice Manipulation Agent (03)
- Re-roll implementation
- Dice animation coordination

---

## 📋 Task List

### Task 1: Colony Placement Territory Selector 🎯 PRIORITY

**Goal**: Create modal UI for selecting which territory to place colony on

**User Flow**:
1. Player uses Colony Constructor, Terraforming Station, or completes Colonist Hub track
2. Modal appears: "Choose Territory for Colony"
3. Display all 8 territories with:
   - Territory name and bonus
   - Current control status (player colors)
   - Available spaces (e.g., "2/3 colonies")
   - Repulsor Field status (greyed out if blocked)
4. Player clicks territory
5. Validate placement (full/blocked check)
6. Place colony, update control, close modal

**Files to Create/Modify**:
- `src/ui/modals/territory-selector-modal.ts` (NEW)
- `src/scenes/game-scene.ts` (add modal integration)
- `src/game/game-state.ts` (expose territory data)

**Implementation Notes**:
```typescript
class TerritorySelectorModal extends Phaser.GameObjects.Container {
  private territories: Territory[];
  private callback: (territoryId: string) => void;
  
  show(territories: Territory[], callback: (id: string) => void): void {
    // Display modal with territory options
    // Highlight valid territories
    // Grey out blocked/full territories
  }
  
  private onTerritoryClick(territoryId: string): void {
    this.callback(territoryId);
    this.hide();
  }
}
```

**Coordination**:
- Game State Agent (01): Provides territory list with validation
- Board Facilities Agent (02): Triggers modal after facility action
- UI Agent (05): Implements modal and interactions

---

### Task 2: Raiders Outpost Theft Choice Modal

**Goal**: Allow player to choose what to steal after docking 3 sequential ships

**User Flow**:
1. Player docks 3 sequential ships at Raiders Outpost
2. Modal appears: "Choose Your Raid"
3. Two options:
   - "Steal 4 Resources" → Show player selection + resource type picker
   - "Steal 1 Alien Tech Card" → Show player selection (random card)
4. Player selects target player
5. If resources: Player selects types (e.g., 2 fuel + 2 ore)
6. Validate target has resources/cards
7. Execute theft, update displays, close modal

**Files to Create/Modify**:
- `src/ui/modals/raiders-choice-modal.ts` (NEW)
- `src/ui/modals/player-selector-modal.ts` (NEW - reusable)
- `src/ui/modals/resource-picker-modal.ts` (NEW - reusable)
- `src/scenes/game-scene.ts` (add modal integration)

**Implementation Notes**:
```typescript
class RaidersChoiceModal extends Phaser.GameObjects.Container {
  show(players: Player[], callback: (choice: RaidChoice) => void): void {
    // Show choice buttons
    // On "Steal Resources" → show PlayerSelector → show ResourcePicker
    // On "Steal Tech" → show PlayerSelector → execute
  }
}

interface RaidChoice {
  type: 'resources' | 'tech';
  targetPlayerId: string;
  resources?: { fuel: number; ore: number };
}
```

**Coordination**:
- Game State Agent (01): Executes theft logic
- UI Agent (05): Implements modal flow
- Board Facilities Agent (02): Returns raid choice in execute() result

---

### Task 3: Bradbury Plateau Re-Roll Button

**Goal**: Add UI button to re-roll all ships when controlling Bradbury Plateau

**User Flow**:
1. Player rolls dice → PLACE_SHIPS phase
2. If player controls Bradbury Plateau: Show "Re-Roll All Ships" button in HUD
3. Button shows once per turn
4. Player clicks button
5. Confirmation: "Use Bradbury Plateau Bonus?"
6. Re-roll all ships in player's pool
7. Button disappears (used)
8. Reset availability at start of next turn

**Files to Modify**:
- `src/ui/player-hud-layer.ts` (add re-roll button)
- `src/scenes/game-scene.ts` (handle re-roll action)
- `src/game/game-state.ts` (track bonus usage)

**Implementation Notes**:
```typescript
class PlayerHUDLayer extends Phaser.GameObjects.Container {
  private rerollButton: Phaser.GameObjects.Container;
  private rerollAvailable: boolean = false;
  
  showRerollButton(available: boolean): void {
    this.rerollButton.setVisible(available);
  }
  
  private onRerollClick(): void {
    // Show confirmation
    // Emit 'rerollRequested' event
    // Hide button after use
  }
}
```

**Coordination**:
- Dice Manipulation Agent (03): Implements re-roll logic
- Game State Agent (01): Tracks bonus usage per turn
- UI Agent (05): Implements button and confirmation

---

### Task 4: Colonist Hub Track Completion Flow

**Goal**: Handle UI flow when Colonist Hub track reaches step 7

**User Flow**:
1. Player docks ships, track reaches 7
2. If player has 1F + 1O: Auto-show territory selector
3. If player lacks resources: Show message "Need 1 Fuel + 1 Ore to complete colony"
4. Player selects territory
5. Deduct resources, place colony, reset track

**Files to Modify**:
- `src/game/game-state.ts` (detect track completion)
- `src/scenes/game-scene.ts` (show territory selector)
- Reuse territory selector from Task 1

**Implementation Notes**:
- Check track progress after each Colonist Hub action
- Show territory selector automatically (not a separate facility action)
- Visual indicator when track is at step 7

**Coordination**:
- Board Facilities Agent (02): Reports track completion
- Game State Agent (01): Handles resource deduction
- UI Agent (05): Shows selector and feedback

---

### Task 5: Visual Feedback for Phase 6 Features

**Goal**: Add visual polish for new Phase 6 mechanics

**Enhancements**:

1. **Shipyard Visual**:
   - Show ship count indicator (e.g., "3/6 ships")
   - Highlight when player can afford next ship
   - Different icon for ships 4-6 vs. 1-3

2. **Maintenance Bay Visual**:
   - "Unlimited Capacity" label
   - Show all docked ships (vertical stack)
   - Subtle glow to indicate safe haven

3. **Colony Facility Glow**:
   - Colony Constructor: Glow when player has 3 ore
   - Terraforming Station: Glow when player has 1F+1O and a 6-ship
   - Colonist Hub: Progress bar showing track advancement (0-7)

4. **Territory Display**:
   - Color-code territory borders by controller
   - Show colony count per player as colored dots
   - Repulsor Field: Red X overlay when active
   - Positron Field: Green + overlay
   - Isolation Field: Grey overlay

5. **Ship Sprite Differentiation**:
   - Ships 1-3: Standard sprites
   - Ships 4-6: Metallic sheen or star badge
   - Visual distinction in player HUD

**Files to Modify**:
- `src/ui/facility-sprite.ts` (add indicators)
- `src/ui/territory-sprite.ts` (add overlays)
- `src/ui/ship-sprite.ts` (add ship 4-6 variants)
- `src/ui/player-hud-layer.ts` (update ship display)

**Coordination**:
- Visual Design Agent (08): Asset creation
- UI Agent (05): Implementation
- Game State Agent (01): Provide state data

---

### Task 6: Integration Testing

**Goal**: Ensure all Phase 6 UI features work correctly

**Test Scenarios**:

1. **Colony Placement Flow**:
   - Test Colony Constructor with territory selector
   - Test Terraforming Station with ship consumption
   - Test Colonist Hub track completion
   - Verify territory control updates visually

2. **Raiders Outpost Flow**:
   - Test resource theft choice
   - Test tech card theft choice
   - Verify target validation
   - Check resource updates

3. **Bradbury Plateau Flow**:
   - Test re-roll button appearance
   - Test re-roll execution
   - Verify once-per-turn limitation
   - Check reset on new turn

4. **Shipyard Flow**:
   - Test building 4th ship
   - Test building 5th ship
   - Test building 6th ship
   - Verify Herbert Valley bonus application
   - Check auto-dock at Maintenance Bay

5. **Visual Updates**:
   - Territory control changes
   - Resource counters
   - Ship count indicators
   - Facility highlights

**Files to Test**:
- All new modal components
- `game-scene.ts` integration points
- `game-state.ts` action handling

**Coordination**:
- Integration Testing Agent (07): Create test plans
- Quality Assurance Agent (10): Manual testing
- UI Agent (05): Fix issues

---

## 🔄 Implementation Order

### Week 1: Core Modals (Tasks 1-2)
- Day 1-2: Territory selector modal (Task 1)
- Day 3-4: Raiders Outpost modals (Task 2)
- Day 5: Integration and testing

### Week 2: Bonuses & Polish (Tasks 3-5)
- Day 1: Bradbury Plateau re-roll (Task 3)
- Day 2: Colonist Hub completion flow (Task 4)
- Day 3-4: Visual feedback enhancements (Task 5)
- Day 5: Refinement and polish

### Week 3: Testing & Refinement (Task 6)
- Day 1-2: Integration testing
- Day 3-4: Bug fixes and UX improvements
- Day 5: Final polish and Phase 7 completion

---

## 🧪 Testing Strategy

### Unit Tests
- Modal component behavior
- Button state management
- Event handling

### Integration Tests
- Full colony placement flow
- Full raid flow
- Re-roll mechanics
- Visual state updates

### Manual Testing
- Play through complete games
- Test all edge cases
- Verify AI compatibility
- Check touch and mouse input

---

## 📊 Success Criteria

Phase 7 is complete when:
- ✅ Players can select territories for colony placement
- ✅ Raiders Outpost provides theft choices
- ✅ Bradbury Plateau re-roll button works
- ✅ Colonist Hub track completion is smooth
- ✅ All visual feedback is clear and helpful
- ✅ Integration tests pass
- ✅ Game feels polished and intuitive

---

## 🤝 Agent Coordination

### Daily Sync Points

**Morning Standup** (check todo list):
- UI Agent (05): Implementation status
- Game State Agent (01): Integration readiness
- Board Facilities Agent (02): Facility state exposure

**Evening Review** (update todo list):
- What shipped today
- Blockers for tomorrow
- Integration points for next day

### Communication Pattern

```
UI Agent (05) ─────→ Board Facilities Agent (02)
       │                      │
       │                      ↓
       ↓              Game State Agent (01)
   Visual                     │
   Updates                    ↓
       │              State Validation
       │                      │
       └──────────────────────┘
          Integration Testing Agent (07)
```

---

**Let's build the complete player experience!** 🎮
