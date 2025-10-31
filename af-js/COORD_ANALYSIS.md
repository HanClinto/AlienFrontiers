# Coordinate System Analysis

## Issue
Facilities and their visual elements (docks, icons, labels) are not properly aligned with the board image markers.

## iOS System (Cocos2D)
- Screen: 768×1024 @1x portrait
- Origin: Bottom-left (0,0)
- Y increases upward, X increases rightward

## Phaser3 System
- Screen: 1536×2048 @2x portrait  
- Origin: Top-left (0,0)
- Y increases downward, X increases rightward

## Transform Formula
```
phaser_x = ios_x * 2
phaser_y = (1024 - ios_y) * 2
```

## iOS Facility Structure

Each facility is a Container (LayerOrbital subclass) positioned at specific coords:

Example - Alien Artifact:
```objc
aa = [LayerAlienArtifact node];
aa.position = ccp(180 + 269 + 152, 800 + 10 - 16);  // = (601, 794)
[self addChild:aa];
```

Within the container, child elements are positioned RELATIVELY:
```objc
// Labels (from top, anchor bottom-left)
label1.position = ccp(12, 80);      // "ALIEN"
label2.position = ccp(12, 67);      // "ARTIFACT"

// Docks (HORIZONTAL row, anchor top-left)
dock.position = ccp(12 + cnt * (dock.width + 2), 8 - 162);
// dock.width = 24px @1x = 48px @2x
// spacing = 2px @1x = 4px @2x
// So: x = 12 + cnt * 26 @1x = 24 + cnt * 52 @2x

// Icon (anchor bottom-left)
legend.position = ccp(12, 6 - 162);
```

## Current Phaser Implementation

### Problem 1: Dual Dock Systems
We have TWO places defining dock positions:

1. **board-layout.ts FACILITY_DOCKS** - Absolute coordinates for game logic
   ```ts
   ALIEN_ARTIFACT: {
     x: 1202,   // Facility center for gameplay
     y: 460,
     slots: 1,
   }
   ```

2. **facility-visual.ts** - Visual rendering with relative coords
   ```ts
   const dockY = (8 - 162) * 2; // -308px relative
   const dockX = 24 + i * 52;   // Horizontal spacing
   ```

These MUST align! Ships use FACILITY_DOCKS for snap-to positions, but visuals use facility-visual.ts.

### Problem 2: Alien Artifact Display Position
Currently using absolute coords:
```ts
const x = 1202 + 80;  // Was 1262
const y = 460 + 20;   // Was 450
```

Should use relative positioning from container:
```ts
// iOS: cards at ccp(30, -5 - 42*cnt) relative to facility
const x = 1202 + (30 * 2);      // = 1262
const y = 460 + ((-5) * 2);     // = 450
```

## Solution

### Option A: Use Container-Relative System
- FACILITY_DOCKS stores container origins
- getDockSlotPosition adds relative offsets
- Matches iOS architecture

### Option B: Use Absolute System
- Calculate absolute positions from iOS data
- FACILITY_DOCKS stores final dock positions
- Simpler for Phaser but loses iOS relationship

**Recommended: Option A** - Maintains consistency with iOS source and makes future adjustments easier.

## Facility Positions (iOS → Phaser)

| Facility | iOS | Phaser | Notes |
|----------|-----|--------|-------|
| Solar Converter | (180, 800) | (360, 448) | 1 dock |
| Orbital Market | (449, 825) | (898, 398) | 2 docks |
| Alien Artifact | (601, 794) | (1202, 460) | 1 dock |
| Terraforming Station | (28, 703) | (56, 642) | 2 docks |
| Shipyard | (24, 435) | (48, 1178) | 3 docks |
| Maintenance Bay | (24, 587) | (48, 874) | 2 docks |
| Colonist Hub | (24, 314) | (48, 1420) | 4 docks |
| Lunar Mine | (550, 325) | (1100, 1398) | 3 docks |
| Raider Outpost | (613, 425) | (1226, 1198) | 3 docks |
| Colony Constructor | (346, 291) | (692, 1466) | 3 docks |

## Dock Offsets (Relative to Container Origin)

iOS: `ccp(12 + cnt * 26, 8 - 162)` where cnt = 0,1,2,3

Phaser: `(24 + cnt * 52, -308)` @2x

For centered slots:
```ts
const offsetX = (slotIndex - (slots - 1) / 2) * 52;
const dockX = containerX + 24 + offsetX;
const dockY = containerY - 308;
```

Example - 3 docks (indices 0,1,2):
- Slot 0: offsetX = (0 - 1) * 52 = -52 → x = containerX + 24 - 52 = containerX - 28
- Slot 1: offsetX = (1 - 1) * 52 = 0   → x = containerX + 24
- Slot 2: offsetX = (2 - 1) * 52 = 52  → x = containerX + 24 + 52 = containerX + 76
