# Positioning Reference for Agent Usage

## Coordinate System Transform

```
iOS_SCREEN_WIDTH_1X = 768
iOS_SCREEN_HEIGHT_1X = 1024
PHASER_SCREEN_WIDTH_2X = 1536
PHASER_SCREEN_HEIGHT_2X = 2048
SCALE_FACTOR = 2

phaser_x = ios_x * SCALE_FACTOR
phaser_y = (iOS_SCREEN_HEIGHT_1X - ios_y) * SCALE_FACTOR
```

## Origin Points

iOS: Bottom-left (0,0), Y-up
Phaser: Top-left (0,0), Y-down

## Board Positioning

```
iOS_BOARD_SIZE_1X = 1024
PHASER_BOARD_SIZE_2X = 2048

ios_board_x_1x = 1024 * 0.5 - 54 = 458
ios_board_y_1x = 1024 * 0.5 = 512

phaser_board_x_2x = 458 * 2 = 916
phaser_board_y_2x = (1024 - 512) * 2 = 1024

BOARD_HORIZONTAL_OFFSET_1X = -54
BOARD_HORIZONTAL_OFFSET_2X = -108
```

## Coordinate Space Architecture

- Facilities positioned in SCENE coordinates, NOT board-relative
- Board sprite is visual background only
- Board center: (916, 1024) Phaser @2x
- Board left edge: 916 - 1024 = -108 (off-screen left)
- Facility containers at absolute scene positions
- Docks positioned relative to facility container origin

## Container-Relative Positioning

Facility containers (LayerOrbitals, LayerRegions) at scene (0,0) in iOS
Facility x,y in FACILITY_DOCKS = container origin in scene space

```
DOCK_BASE_X_1X = 12
DOCK_SPACING_1X = 26
DOCK_Y_1X = 8 - 162 = -154

DOCK_BASE_X_2X = 24
DOCK_SPACING_2X = 52
DOCK_Y_2X = -308

dock_slot_x = container_x + DOCK_BASE_X_2X + (slotIndex * DOCK_SPACING_2X) + centerOffset
dock_slot_y = container_y + DOCK_Y_2X

centerOffset = -(numSlots - 1) * DOCK_SPACING_2X / 2
```

## Facility Positions (Scene Space @2x)

```
SOLAR_CONVERTER: x=242, y=1114
ORBITAL_MARKET: x=344, y=946
SHIPYARD: x=530, y=796
LUNAR_MINE: x=766, y=724
RAIDER_OUTPOST: x=1010, y=724
COLONY_CONSTRUCTOR: x=1246, y=796
COLONIST_HUB: x=1432, y=946
TERRAFORMING_STATION: x=1534, y=1114
ALIEN_ARTIFACT: x=1202, y=460
MAINTENANCE_BAY: x=796, y=1620
```

## iOS Reference Positions (@1x points)

```
SOLAR_CONVERTER: (121, 330)
ORBITAL_MARKET: (172, 389)
SHIPYARD: (265, 444)
LUNAR_MINE: (383, 470)
RAIDER_OUTPOST: (505, 470)
COLONY_CONSTRUCTOR: (623, 444)
COLONIST_HUB: (716, 389)
TERRAFORMING_STATION: (767, 330)
ALIEN_ARTIFACT: (601, 794)
MAINTENANCE_BAY: (398, 214)
```

## Alien Artifact Display Positioning

```
facility_x = 1202
facility_y = 460

CARD_OFFSET_X_1X = 30
CARD_OFFSET_Y_1X = -5
CARD_SPACING_Y_1X = -42

display_x = facility_x + (CARD_OFFSET_X_1X * 2) = 1262
display_y = facility_y + (CARD_OFFSET_Y_1X * 2) = 450

card_n_y = display_y + (CARD_SPACING_Y_1X * n * 2)
```

## Territory Positions (Scene Space @2x)

```
BRADBURY_PLATEAU: x=494, y=1256
HEINLEIN_PLAINS: x=862, y=1104
ASIMOV_CRATER: x=1038, y=870
BURROUGHS_DESERT: x=938, y=644
HERBERT_VALLEY: x=574, y=608
CLARKE_STATION: x=358, y=838
```

## Dock Slot Calculation

```typescript
function getDockSlotPosition(facility, slotIndex) {
    const totalWidth = (facility.slots - 1) * DOCK_SPACING_2X;
    const centerOffset = -totalWidth / 2;
    return {
        x: facility.x + DOCK_BASE_X_2X + (slotIndex * DOCK_SPACING_2X) + centerOffset,
        y: facility.y + DOCK_Y_2X
    };
}
```

## Visual Element Dimensions (@2x)

```
DOCK_SLOT_WIDTH = 48
DOCK_SLOT_GAP = 4
DOCK_SLOT_CENTER_SPACING = 52
DIE_SIZE = 68
SHIP_WIDTH = 48
SHIP_HEIGHT = 64
```

## Validation Formula

```
Given iOS position (x_ios, y_ios) @1x:
1. phaser_x = x_ios * 2
2. phaser_y = (1024 - y_ios) * 2
3. Verify against FACILITY_DOCKS or TERRITORIES

Given Phaser position (x_phaser, y_phaser) @2x:
1. ios_x = x_phaser / 2
2. ios_y = 1024 - (y_phaser / 2)
3. Verify against iOS LayerOrbitals.m / LayerRegions.m
```

## Critical Implementation Details

1. NEVER use board-relative coordinates for facilities
2. Board sprite position affects visual only, not logic coordinates
3. Container origin (0,0) in iOS = facility container scene position
4. Dock positions calculated relative to container, then centered
5. All iOS child positions use container-relative offsets
6. Scale factor always 2.0 for @1x → @2x conversion
7. Y-axis inversion formula: phaser_y = (1024 - ios_y) * 2

## File Locations

- `board-layout.ts`: FACILITY_DOCKS, TERRITORIES, getDockSlotPosition()
- `game-scene.ts`: Board positioning, facility creation, Alien Artifact display
- `facility-visual.ts`: Dock rendering, visual elements
- `dice-sprite.ts`: Dice placement animation
- `ship-sprite.ts`: Ship placement animation

## Common Errors to Avoid

1. Using board.width instead of iOS contentSize (1024 @1x not 2048 @2x)
2. Forgetting -54 horizontal offset in board positioning
3. Treating facility positions as board-relative instead of scene space
4. Using wrong scale factor (must be 2.0 for @1x → @2x)
5. Incorrect Y-axis inversion (must subtract from 1024 before scaling)
6. Hardcoding positions instead of using transform formula
7. Confusing points (@1x) with pixels (@2x)

## Testing Checklist

- [ ] Board centered at (916, 1024) with left edge at -108
- [ ] All 10 facilities align with green/red circles on board
- [ ] Dock slots align with visual rectangles on board
- [ ] Dice/ships snap to correct dock positions
- [ ] Horizontal centering correct for 1/2/3/4 slot facilities
- [ ] Alien Artifact display positioned correctly
- [ ] Territory circles align with colony placement positions
- [ ] No visual misalignment when testing at http://localhost:8081
