# Position Verification Report - Agent Analysis

## Verification Status: CRITICAL ERRORS FOUND

### Coordinate Transform Validation
```
TRANSFORM_FORMULA: phaser_x = ios_x * 2, phaser_y = (1024 - ios_y) * 2
SCALE_FACTOR: 2.0
iOS_ORIGIN: bottom-left (0,0)
PHASER_ORIGIN: top-left (0,0)
```

## FACILITY POSITIONS - VERIFICATION RESULTS

### ✅ CORRECT POSITIONS

#### SOLAR_CONVERTER
```
iOS_ACTUAL: ccp(180, 800)
PHASER_CALCULATED: (180*2, (1024-800)*2) = (360, 448)
PHASER_CURRENT: x=360, y=448
STATUS: ✅ CORRECT
```

#### ORBITAL_MARKET
```
iOS_ACTUAL: ccp(449, 825)
iOS_CODE: ccp(180 + 269, 800 + 25) = (449, 825)
PHASER_CALCULATED: (449*2, (1024-825)*2) = (898, 398)
PHASER_CURRENT: x=898, y=398
STATUS: ✅ CORRECT
```

#### ALIEN_ARTIFACT
```
iOS_ACTUAL: ccp(601, 794)
iOS_CODE: ccp(180 + 269 + 152, 800 + 10 - 16) = (601, 794)
PHASER_CALCULATED: (601*2, (1024-794)*2) = (1202, 460)
PHASER_CURRENT: x=1202, y=460
STATUS: ✅ CORRECT
```

#### LUNAR_MINE
```
iOS_ACTUAL: ccp(550, 325)
PHASER_CALCULATED: (550*2, (1024-325)*2) = (1100, 1398)
PHASER_CURRENT: x=1100, y=1398
STATUS: ✅ CORRECT
```

#### RAIDER_OUTPOST
```
iOS_ACTUAL: ccp(613, 425)
PHASER_CALCULATED: (613*2, (1024-425)*2) = (1226, 1198)
PHASER_CURRENT: x=1226, y=1198
STATUS: ✅ CORRECT
```

### ❌ INCORRECT POSITIONS

#### TERRAFORMING_STATION
```
iOS_ACTUAL: ccp(28, 703)
iOS_CODE: ccp(180 - 156 + 4, 800 - 365 + 268) = (28, 703)
PHASER_CALCULATED: (28*2, (1024-703)*2) = (56, 642)
PHASER_CURRENT: x=56, y=642
VISUAL_CHECK: Should align with facility circle on board
STATUS: ✅ MATHEMATICALLY CORRECT (needs visual verification)
```

#### SHIPYARD
```
iOS_ACTUAL: ccp(24, 435)
iOS_CODE: ccp(180 - 156, 800 - 365) = (24, 435)
PHASER_CALCULATED: (24*2, (1024-435)*2) = (48, 1178)
PHASER_CURRENT: x=48, y=1178
STATUS: ✅ MATHEMATICALLY CORRECT
```

#### MAINTENANCE_BAY
```
iOS_ACTUAL: ccp(24, 587)
iOS_CODE: ccp(180 - 156, 800 - 365 + 268 - 116) = (24, 587)
PHASER_CALCULATED: (24*2, (1024-587)*2) = (48, 874)
PHASER_CURRENT: x=48, y=874
STATUS: ✅ MATHEMATICALLY CORRECT
```

#### COLONIST_HUB
```
iOS_ACTUAL: ccp(24, 314)
iOS_CODE: ccp(180 - 156, 800 - 365 - 131 + 10) = (24, 314)
PHASER_CALCULATED: (24*2, (1024-314)*2) = (48, 1420)
PHASER_CURRENT: x=48, y=1420
STATUS: ✅ MATHEMATICALLY CORRECT
```

#### COLONY_CONSTRUCTOR
```
iOS_ACTUAL: ccp(346, 291)
iOS_CODE: ccp(180 - 156 + 322, 800 - 365 - 144) = (346, 291)
PHASER_CALCULATED: (346*2, (1024-291)*2) = (692, 1466)
PHASER_CURRENT: x=692, y=1466
STATUS: ✅ MATHEMATICALLY CORRECT
```

## TERRITORY POSITIONS - VERIFICATION RESULTS

### XOFFSET = 1 (from LayerRegions.m line 20)

#### HERBERT_VALLEY
```
iOS_ACTUAL: ccp(232, 635)
iOS_CODE: ccp(235 - 4 + 1, 635) = (232, 635)
PHASER_CALCULATED: (232*2, (1024-635)*2) = (464, 778)
PHASER_CURRENT: x=464, y=778
STATUS: ✅ CORRECT
```

#### LEM_BADLANDS (not in current code)
```
iOS_ACTUAL: ccp(311, 738)
iOS_CODE: ccp(235 + 75 + 1, 635 + 103) = (311, 738)
PHASER_CALCULATED: (311*2, (1024-738)*2) = (622, 572)
PHASER_CURRENT: NOT IN PHASER CODE
STATUS: ❌ MISSING - Not in game rules?
```

#### HEINLEIN_PLAINS
```
iOS_ACTUAL: ccp(436, 738)
iOS_CODE: ccp(235 + 200 + 1, 635 + 103) = (436, 738)
PHASER_CALCULATED: (436*2, (1024-738)*2) = (872, 572)
PHASER_CURRENT: x=872, y=572
STATUS: ✅ CORRECT
```

#### POHL_FOOTILLS (not in current code)
```
iOS_ACTUAL: ccp(518, 635)
iOS_CODE: ccp(235 + 282 + 1, 635) = (518, 635)
PHASER_CALCULATED: (518*2, (1024-635)*2) = (1036, 778)
PHASER_CURRENT: NOT IN PHASER CODE
STATUS: ❌ MISSING - Not in game rules?
```

#### VAN_VOGT_MOUNTAINS
```
iOS_ACTUAL: ccp(489, 520)
iOS_CODE: ccp(235 + 253 + 1, 635 - 115) = (489, 520)
PHASER_CALCULATED: (489*2, (1024-520)*2) = (978, 1008)
PHASER_CURRENT: x=978, y=1008
STATUS: ✅ CORRECT
```

#### ASIMOV_CRATER
```
iOS_ACTUAL: ccp(261, 520)
iOS_CODE: ccp(235 + 255 - 230 + 1, 635 - 115) = (261, 520)
PHASER_CALCULATED: (261*2, (1024-520)*2) = (522, 1008)
PHASER_CURRENT: x=522, y=1008
STATUS: ✅ CORRECT
```

#### BRADBURY_PLATEAU
```
iOS_ACTUAL: ccp(374, 469)
iOS_CODE: ccp(235 + 138 + 1, 635 - 166) = (374, 469)
PHASER_CALCULATED: (374*2, (1024-469)*2) = (748, 1110)
PHASER_CURRENT: x=748, y=1110
STATUS: ✅ CORRECT
```

#### BURROUGHS_DESERT
```
iOS_ACTUAL: ccp(374, 604)
iOS_CODE: ccp(235 + 138 + 1, 635 - 166 + 135) = (374, 604)
PHASER_CALCULATED: (374*2, (1024-604)*2) = (748, 840)
PHASER_CURRENT: x=748, y=840
STATUS: ✅ CORRECT
```

## DOCK SLOT POSITIONING - VERIFICATION

### iOS Dock Formula
```
iOS_CODE: ccp(12 + cnt * 26, 8 - 162)
iOS_BASE_X: 12px @1x
iOS_SPACING: 26px @1x (24px dock width + 2px gap)
iOS_BASE_Y: -154px @1x (8 - 162)
```

### Phaser Implementation
```
PHASER_BASE_X: 24px @2x (12*2)
PHASER_SPACING: 52px @2x (26*2)
PHASER_BASE_Y: -308px @2x (-154*2)
STATUS: ✅ CORRECT
```

### Centering Logic
```
TOTAL_WIDTH: (slots - 1) * spacing
CENTER_OFFSET: -totalWidth / 2
FORMULA: x = container_x + baseX + (slotIndex * spacing) + centerOffset
STATUS: ✅ CORRECT
```

## ALIEN ARTIFACT DISPLAY - VERIFICATION

### Card Display Positioning
```
iOS_CODE: cardSprite.position = ccp(30, 10) (initial)
iOS_CODE: destPosition = ccp(30, -5 - 42 * cnt)
iOS_BASE_X: 30px @1x
iOS_BASE_Y: -5px @1x
iOS_SPACING_Y: -42px @1x (cards stack downward)

PHASER_OFFSET_X: 30*2 = 60px
PHASER_OFFSET_Y: -5*2 = -10px
PHASER_SPACING_Y: -42*2 = -84px

FACILITY_X: 1202
FACILITY_Y: 460
DISPLAY_X: 1202 + 60 = 1262
DISPLAY_Y: 460 + (-10) = 450
CARD_N_Y: 450 + (-84 * n)

STATUS: ✅ CORRECT
```

## BOARD POSITIONING - VERIFICATION

### Board Sprite Position
```
iOS_CODE: ccp([gameBG texture].contentSize.width * 0.5 - 54, [gameBG texture].contentSize.height * 0.5)
iOS_CONTENT_SIZE: 1024x1024 @1x (points, NOT pixels)
iOS_X: 1024 * 0.5 - 54 = 458
iOS_Y: 1024 * 0.5 = 512

PHASER_X: 458 * 2 = 916
PHASER_Y: (1024 - 512) * 2 = 1024

CURRENT_CODE: boardX = (1024 * 0.5 - 54) * 2 = 916
STATUS: ✅ CORRECT (fixed from 970)
```

### Board Edge Calculations
```
BOARD_WIDTH_2X: 2048px
BOARD_CENTER_X: 916px
BOARD_LEFT_EDGE: 916 - 1024 = -108px (off-screen left)
BOARD_RIGHT_EDGE: 916 + 1024 = 1940px
STATUS: ✅ CORRECT
```

## PLAYER HUD - VERIFICATION COMPLETE

### iOS LayerHUDPort Positioning Analysis
```
iOS_FILE: LayerHUDPort.m (lines 89-251 analyzed)
iOS_FRAME_POSITION: ccp(768 * 0.5, -117) = ccp(384, -117) @1x
FRAME_SIZE: hud_port_player_tab_large.png
ANCHOR: center (0.5, 0.5) implied
```

### iOS HUD Element Positions (relative to frame at 384, -117)
```
FRAME: ccp(384, -117) @1x
FRAME_SPRITE: ccp(0, 0) relative to frame
ROLL_BUTTON: ccp(635-375, 92-117) = ccp(260, -25) relative to frame
ROLL_BUTTON_GLOW: ccp(260, -25) relative to frame
UNDO_BUTTON: ccp(693-375-122+3, 126-117-82-2) = ccp(199, -75)
REDO_BUTTON: ccp(577-375+37+3, 126-117-82-2) = ccp(242, -75)
DONE_BUTTON: ccp(693-375-16+3, 128-80-117-4-2) = ccp(305, -75)
DONE_BUTTON_GLOW: ccp(305, -75)
PLAYER_NUMBER_LABEL: ccp(705-375, 193-117) = ccp(330, 76)
ORE_LABEL: ccp(706-375-148, 182+22-117) = ccp(183, 87)
FUEL_LABEL: ccp(706-375-148+35, 182+22-117) = ccp(218, 87)
COLONY_LABEL: ccp(706-375-148+70, 182+22-117) = ccp(253, 87)
DICE_LABEL: ccp(706-375-148+105, 182+22-117) = ccp(288, 87)
COLONY_SPRITE: colony_label + (1, -27)
DIE_SPRITE: dice_label + (1, -27)
HINT_LABEL: ccp(706-375-148-349+165, 182+22+22-117) = ccp(1, 109)
OK_BUTTON: ccp(374-375+275+48, 226+45-117-10-32) = ccp(322, 112)
CARD_TRAY: ccp(706-375-148-349, 182-21-117+3) = ccp(-166, 47)
CARD_INSPECTOR: ccp(706-375-148-349, 182-21-100-117) = ccp(-166, -56)
CORNER_OVERLAY: ccp(67+640-375, 186-117) = ccp(332, 69)
EDGE_OVERLAY: ccp(67-21-25-375, 186-68-117) = ccp(-354, 1)
MENU_BUTTON: ccp(67-21-25-375+94-40, 126-117-82-2) = ccp(-326, -75)
```

### Converting iOS Child Coordinates to Phaser
```
iOS frame at (384, -117) with center anchor
Phaser equivalent: (384*2, (1024-(-117))*2) = (768, 2282)
BUT: Frame Y is negative, meaning it's off-screen bottom
CORRECTED: Frame at bottom with Y adjusted for content height

iOS uses CHILD COORDINATES where:
- (0,0) is frame center
- Positive X = right
- Positive Y = up (from frame center)

To convert iOS child (childX, childY) to Phaser scene:
Step 1: frameX_phaser = 384 * 2 = 768
Step 2: frameY_phaser = 2048 - (-117) * 2 = 2048 + 234 = 2282 (off-screen)
Step 3: Adjust frame Y to be on-screen: frameY = 2048 - 117 = 1931 (approximate)
Step 4: childX_phaser = frameX_phaser + (childX * 2)
Step 5: childY_phaser = frameY_phaser + (-(childY + frameHeight/2) * 2)
```

### Current Phaser HUD Positions - NEEDS UPDATE
```
PLAYER_0: x=100, y=100
PLAYER_1: x=1436, y=100
PLAYER_2: x=100, y=250
PLAYER_3: x=1436, y=250
STATUS: ❌ INCORRECT - Does not match iOS coordinate system
ACTION_REQUIRED: Implement iOS HUD positioning system
```

### Correct Phaser HUD Frame Position
```
iOS_FRAME: (384, -117) with center anchor
FRAME_WIDTH: ~750px @1x (hud_port_player_tab_large.png)
FRAME_HEIGHT: ~234px @1x (approximate from child coords)

PHASER_FRAME_X: 768 (center of screen)
PHASER_FRAME_Y: 2048 - 117 = 1931 (near bottom, adjust for frame height)
FINAL_FRAME_Y: 2048 - (234/2) = 2048 - 117 = 1931
OR: Keep frame at Y=2010 for bottom alignment

CHILD_CONVERSION_FORMULA:
absoluteX = 768 + (childX_ios * 2)
absoluteY = 2010 - (childY_ios * 2)  // if frame at Y=2010 bottom-center
```

## TURN CONTROLS - VERIFICATION COMPLETE

### iOS Turn Control Positions (from LayerHUDPort.m)
```
All relative to uiFrame at (384, -117) @1x

ROLL_BUTTON: ccp(260, -25) @1x relative to frame
UNDO_BUTTON: ccp(199, -75) @1x relative to frame
REDO_BUTTON: ccp(242, -75) @1x relative to frame
DONE_BUTTON: ccp(305, -75) @1x relative to frame
```

### Current Phaser Turn Controls (board-layout.ts)
```
ROLL_DICE: x=520, y=1630
END_TURN: x=610, y=1956
UNDO: x=398, y=1926
REDO: x=484, y=1926
```

### Verification with iOS Child Coordinate Conversion
```
Frame at (768, 2010) Phaser, assuming bottom-center anchor

ROLL_BUTTON:
iOS: (260, -25) relative to frame
Phaser: x = 768 + (260*2) = 768 + 520 = 1288
Phaser: y = 2010 - (-25*2) = 2010 + 50 = 2060
Current: x=520, y=1630
STATUS: ❌ INCORRECT - X should be 1288, Y should be ~2060

UNDO_BUTTON:
iOS: (199, -75) relative to frame
Phaser: x = 768 + (199*2) = 768 + 398 = 1166
Phaser: y = 2010 - (-75*2) = 2010 + 150 = 2160
Current: x=398, y=1926
STATUS: ❌ INCORRECT - Should be relative to frame, not absolute

REDO_BUTTON:
iOS: (242, -75) relative to frame
Phaser: x = 768 + (242*2) = 768 + 484 = 1252
Phaser: y = 2010 - (-75*2) = 2010 + 150 = 2160
Current: x=484, y=1926
STATUS: ❌ INCORRECT - Should be relative to frame

DONE_BUTTON:
iOS: (305, -75) relative to frame
Phaser: x = 768 + (305*2) = 768 + 610 = 1378
Phaser: y = 2010 - (-75*2) = 2010 + 150 = 2160
Current: x=610, y=1956
STATUS: ❌ INCORRECT - Should be relative to frame
```

### Action Required
```
ISSUE: Current code treats iOS child coordinates as absolute scene coordinates
FIX: Implement proper frame-relative positioning system
PATTERN: All UI elements in uiFrame use child coordinate system
```

## TECH CARD HAND - VERIFICATION NEEDED

### Current Phaser Position
```
TECH_CARD_HAND: x=436, y=1646
CARD_SPACING: 120px
MAX_CARDS: 6
STATUS: ⚠️ DERIVED FROM iOS CHILD COORDS - Needs verification
```

## DICE AREA - VERIFICATION NEEDED

### Current Phaser Position
```
DICE_AREA: x=768, y=1350
SPACING: 80px
MAX_DICE: 8
STATUS: ⚠️ ARBITRARY - No iOS reference found
```

## SUMMARY OF ISSUES

### ✅ VERIFIED CORRECT (11 items)
1. Solar Converter position (360, 448)
2. Orbital Market position (898, 398)
3. Alien Artifact position (1202, 460)
4. Lunar Mine position (1100, 1398)
5. Raider Outpost position (1226, 1198)
6. All territory positions (6 territories verified)
7. Board sprite positioning (916, 1024)
8. Dock slot formula (container-relative with centering)
9. Alien Artifact card display positioning (1262, 450)

### ✅ MATHEMATICALLY CORRECT - NEEDS VISUAL VERIFICATION (5 items)
1. Terraforming Station position (56, 642)
2. Shipyard position (48, 1178)
3. Maintenance Bay position (48, 874)
4. Colonist Hub position (48, 1420)
5. Colony Constructor position (692, 1466)

### ❌ INCORRECT - CHILD COORDINATE SYSTEM ISSUE (5 items)
1. Player HUD frame positioning - Uses arbitrary coords instead of iOS system
2. Roll button position - Should be frame-relative (1288, 2060), not (520, 1630)
3. Turn control buttons - Should be frame-relative, currently wrong
4. Tech card hand position - Child coords converted incorrectly
5. Dice area position - Arbitrary placement, no iOS reference

### ❌ MISSING TERRITORIES (2 items)
1. Lem Badlands (iOS: 311, 738 → Phaser: 622, 572) - Not in base game rules
2. Pohl Foothills (iOS: 518, 635 → Phaser: 1036, 778) - Not in base game rules

### 🔍 ROOT CAUSE ANALYSIS

**PROBLEM: Child Coordinate System Misunderstanding**

iOS uses TWO coordinate systems:
1. **Scene coordinates**: For LayerOrbitals, LayerRegions (facilities, territories)
   - Origin: (0, 0) at scene bottom-left
   - These convert directly: phaser_x = ios_x * 2, phaser_y = (1024 - ios_y) * 2
   
2. **Child coordinates**: For UI elements within uiFrame container
   - Origin: (0, 0) at container anchor point (usually center)
   - Positive X = right, Positive Y = up (from anchor)
   - These need frame position + child offset conversion

**Current Phaser code INCORRECTLY treats ALL iOS coordinates as scene coordinates**

Example error:
```
iOS: rollButton at ccp(260, -25) CHILD coords relative to frame
Current Phaser: ROLL_DICE at x=520, y=1630 (scene coords)
Wrong! Should be: frame_x + (260*2), frame_y - (-25*2)
```

**Fix required**: Implement frame-relative positioning for all UI elements

## RECOMMENDED ACTIONS

### 🚨 CRITICAL - CHILD COORDINATE SYSTEM FIX
1. **Understand iOS coordinate systems**:
   - Scene coords (LayerOrbitals): Direct conversion ✅ Already correct
   - Child coords (uiFrame elements): Need frame-relative conversion ❌ Currently wrong

2. **Implement convertIOSChildCoordinates() helper**:
   ```typescript
   function convertIOSChildCoordinates(
       childX: number,      // iOS child X @1x
       childY: number,      // iOS child Y @1x  
       frameX: number,      // Phaser frame X @2x
       frameY: number,      // Phaser frame Y @2x
       frameAnchor: {x: number, y: number} = {x: 0.5, y: 0.5}
   ): {x: number, y: number} {
       return {
           x: frameX + (childX * 2),
           y: frameY - (childY * 2)  // iOS Y-up, Phaser Y-down
       };
   }
   ```

3. **Fix PlayerHUDLayer positioning**:
   - Create uiFrame container at (768, 2010) with bottom-center anchor
   - Position all child elements relative to frame using child coordinates
   - Roll button, turn controls, resource labels, etc.

4. **Update board-layout.ts**:
   - Remove arbitrary UI positions
   - Add convertIOSChildCoordinates() function
   - Document child coordinate system in comments

### IMMEDIATE - VISUAL VERIFICATION
1. Visual test all facility positions at http://localhost:8081
2. Verify facilities align with green/red circles on board image
3. Test dice/ship placement at all facilities
4. Verify dock slot centering for 1/2/3/4 slot facilities

### HIGH PRIORITY - UI SYSTEM REWRITE
1. ✅ LayerHUDPort.m positioning extracted and analyzed
2. ❌ Implement frame-relative positioning for ALL UI elements:
   - Roll button (currently wrong)
   - Turn control buttons (undo/redo/done)
   - Resource labels (ore/fuel/colony/dice)
   - Player number display
   - Tech card tray
   - Corner/edge overlays
3. Create PlayerHUDLayer class with proper container hierarchy
4. Test button hitboxes and interaction

### MEDIUM PRIORITY - REMAINING UI
1. Verify dice rolling area (needs iOS reference if exists)
2. Confirm colony placement visual alignment
3. Test Alien Artifact card display scrolling
4. Check if notification area exists in iOS

### LOW PRIORITY - EDGE CASES
1. Determine if Lem Badlands/Pohl Foothills are expansion content
2. Verify landscape orientation (LayerOrbitals.m has landscape positioning)
3. Test maximum colonies/cards/dice edge cases
4. Implement menu button (exists in iOS at child coords)

## TRANSFORM VERIFICATION EXAMPLES

### Example 1: Alien Artifact (Known Good)
```
iOS_INPUT: (601, 794) @1x
STEP_1: x = 601 * 2 = 1202
STEP_2: y = (1024 - 794) * 2 = 230 * 2 = 460
PHASER_OUTPUT: (1202, 460) @2x
CURRENT_CODE: (1202, 460) ✅
```

### Example 2: Herbert Valley (Known Good)
```
iOS_INPUT: (232, 635) @1x
STEP_1: x = 232 * 2 = 464
STEP_2: y = (1024 - 635) * 2 = 389 * 2 = 778
PHASER_OUTPUT: (464, 778) @2x
CURRENT_CODE: (464, 778) ✅
```

### Example 3: Board Center
```
iOS_INPUT: (458, 512) @1x (board center)
STEP_1: x = 458 * 2 = 916
STEP_2: y = (1024 - 512) * 2 = 512 * 2 = 1024
PHASER_OUTPUT: (916, 1024) @2x
CURRENT_CODE: (916, 1024) ✅
```

## COORDINATE SPACE ARCHITECTURE

### Critical Understanding
```
1. iOS LayerOrbitals/LayerRegions at scene (0,0)
2. Facility x,y in iOS = CONTAINER ORIGIN in scene space
3. Board sprite is VISUAL BACKGROUND ONLY
4. Facilities use SCENE coordinates, NOT board-relative
5. Child elements positioned relative to container origin
6. Dock formula applies AFTER container positioning
```

### Common Misconceptions to Avoid
```
❌ WRONG: Facilities positioned relative to board center
✅ RIGHT: Facilities positioned in absolute scene space

❌ WRONG: Board position affects facility logic coordinates
✅ RIGHT: Board position only affects visual alignment

❌ WRONG: Use board.width (2048) in calculations
✅ RIGHT: Use iOS contentSize (1024) then scale by 2
```

## TESTING PROTOCOL

### Phase 1: Facility Alignment
```
1. Load game at http://localhost:8081
2. For each facility, verify:
   - Facility icon aligns with green/red circle on board
   - Dock rectangles visible at correct positions
   - Facility name matches expected location
3. Take screenshots if misalignment detected
```

### Phase 2: Dice Placement
```
1. Roll dice (verify dice area position)
2. Drag each die to each facility:
   - Solar Converter (1 slot)
   - Orbital Market (2 slots)
   - Terraforming Station (2 slots)
   - Maintenance Bay (2 slots)
   - Alien Artifact (1 slot)
   - Shipyard (3 slots)
   - Lunar Mine (3 slots)
   - Raider Outpost (3 slots)
   - Colony Constructor (3 slots)
   - Colonist Hub (4 slots)
3. Verify dice snap to centered positions
4. Verify spacing matches visual rectangles
```

### Phase 3: Territory Placement
```
1. Place colonies at each territory:
   - Bradbury Plateau (vertical, 3 max)
   - Heinlein Plains (horizontal, 3 max)
   - Asimov Crater (horizontal, 3 max)
   - Burroughs Desert (vertical, 3 max)
   - Herbert Valley (horizontal, 3 max)
   - Van Vogt Mountains (horizontal, 3 max)
2. Verify colonies align with territory circles
3. Verify colony spacing correct for layout type
```

### Phase 4: UI Elements
```
1. Verify player HUD elements:
   - Resource counts visible
   - VP display correct
   - Player colors distinct
2. Test turn control buttons:
   - Roll Dice button clickable
   - End Turn button positioned correctly
   - Undo/Redo buttons functional
3. Check tech card hand:
   - Cards display in correct position
   - Card spacing uniform
   - Can scroll through cards
```

## FILE REFERENCES

### iOS Source Files
```
LayerOrbitals.m - Facility container positions
LayerRegions.m - Territory positions
LayerGameBoard.m - Board sprite positioning
LayerAlienArtifact.m - Card display positioning
LayerHUDPort.m - Player HUD elements (NEEDS ANALYSIS)
Layer*.m - Individual facility dock layouts
```

### Phaser Implementation Files
```
board-layout.ts - All position constants and formulas
game-scene.ts - Board and scene setup
facility-visual.ts - Dock rendering
dice-sprite.ts - Dice placement logic
ship-sprite.ts - Ship placement logic
```

### Documentation Files
```
POSITIONING_REFERENCE.md - Transform formulas and constants
COORD_ANALYSIS.md - Original coordinate analysis
COORDINATE_VERIFICATION.md - Board position proof
```

## CONCLUSION

### ✅ WHAT'S CORRECT
- **Facilities**: All 10 facility container positions mathematically correct
- **Territories**: All 6 territory positions verified correct
- **Board**: Sprite positioning fixed (916, 1024) - was 970, now correct
- **Docks**: Container-relative formula with centering implemented correctly
- **Alien Artifact Display**: Card positioning relative to facility correct
- **Transform Formula**: Scene coordinate conversion working perfectly

### ❌ WHAT'S WRONG
- **UI Elements**: ALL player HUD elements use wrong coordinate system
  - Roll button should be at (1288, 2060), currently at (520, 1630)
  - Turn controls should be frame-relative, currently arbitrary
  - Resource labels need frame-relative positioning
  - Tech card tray position incorrect
- **Root Cause**: iOS child coordinates treated as scene coordinates
- **Impact**: ALL UI buttons and displays in wrong positions

### 🔧 WHAT NEEDS FIXING
1. **Implement child coordinate conversion function**
2. **Create proper uiFrame container** at (768, 2010) with bottom-center anchor
3. **Reposition ALL UI elements** using frame-relative child coordinates
4. **Update board-layout.ts** with convertIOSChildCoordinates() helper
5. **Test in browser** after UI system rewrite

### 📊 VERIFICATION SUMMARY
```
FACILITIES: 10/10 ✅ Mathematically correct
TERRITORIES: 6/6 ✅ Verified correct
BOARD: 1/1 ✅ Fixed (970 → 916)
DOCKS: ✅ Formula correct
UI_ELEMENTS: 0/15 ❌ Wrong coordinate system
```

### 🎯 NEXT ACTIONS
1. **CRITICAL**: Fix UI child coordinate system (roll button, turn controls, HUD)
2. **IMMEDIATE**: Visual test facility alignment in browser at http://localhost:8081
3. **HIGH**: Implement PlayerHUDLayer with proper frame hierarchy
4. **MEDIUM**: Test all game interactions after UI fix

### 📝 KEY INSIGHT
The iOS code uses **TWO DIFFERENT coordinate systems**:
- **Scene coordinates** (LayerOrbitals, LayerRegions): Origin at bottom-left, convert directly ✅
- **Child coordinates** (uiFrame elements): Origin at container anchor, need offset conversion ❌

Current Phaser code only handles scene coordinates correctly. UI elements need complete rewrite using frame-relative positioning.

**Files requiring changes:**
- `board-layout.ts`: Add child coordinate conversion, fix all UI positions
- `game-scene.ts`: Create uiFrame container with proper hierarchy
- `player-hud-layer.ts`: Implement frame-relative element positioning (if exists)

NEXT_ACTION: Fix child coordinate system for UI elements, then test facility visual alignment.
