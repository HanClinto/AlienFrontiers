# Coordinate Verification Analysis

## Problem
Need to verify that facility positions in Phaser match iOS exactly, accounting for board offset.

## iOS System (@1x = 768×1024 points)

### Board Image
- Size: 2048×2048 pixels @2x = 1024×1024 points
- Position in scene: `ccp(1024*0.5 - 54, 1024*0.5)` = `(458, 512)` with center anchor
- Left edge: 458 - 512 = **-54** (off-screen)
- Right edge: 458 + 512 = **970**
- Top edge: 512 - 512 = **0**
- Bottom edge: 512 + 512 = **1024**

### Facility Containers (LayerOrbitals)
- Container position: `(0, 0)` in scene space (NOT relative to board)
- Facilities positioned at their scene coordinates
- Example: Alien Artifact at `(601, 794)` in scene space

### Key Insight
Facilities are in **SCENE coordinates**, not board-relative coordinates!

The board sprite is just visual background. Facilities are positioned absolutely in the scene.

## Phaser System (@2x = 1536×2048 pixels)

### Board Image  
- Size: 2048×2048 pixels @2x
- Should be positioned at: `((458 * 2), ((1024 - 512) * 2))` = `(916, 1024)` with center anchor
  - X: 458 points * 2 = 916 pixels
  - Y: (1024 - 512) points * 2 = 1024 pixels (inverted Y-axis)

**Current code uses (970, 1024) - THIS IS WRONG!**

### Facility Containers
- Should be at `(0, 0)` in scene space (matching iOS)
- Facilities positioned at scene coordinates * 2, with Y inverted

## Verification Examples

### Alien Artifact
**iOS (@1x points):**
- Scene position: (601, 794)
- Relative to board left edge (-54): 601 - (-54) = **655 from board left**
- Relative to board top edge (0): 794 - 0 = **794 from board top**

**Phaser (@2x pixels):**
- Scene position should be: (601 * 2, (1024 - 794) * 2) = **(1202, 460)**
- This is in FACILITY_DOCKS currently ✅

### But wait - are these relative to board or scene?

Let me think about this differently...

## The Real Question

iOS has two coordinate spaces:
1. **Scene space**: Where CCLayers like LayerOrbitals are positioned (0,0)
2. **Board space**: The visual board background (shifted by -54)

Facilities use **scene space**, not board-relative space.

In iOS:
- Scene origin: bottom-left of screen
- Board left edge: -54 (off-screen)
- Facility at (601, 794) is **601 pixels from scene origin (left edge of screen)**

In Phaser:
- Scene origin: top-left of screen  
- Board should be positioned to match iOS visual appearance
- Facilities should be at scene coordinates, converted: (x*2, (1024-y)*2)

## The Board Offset Issue

The iOS board is at scene position (458, 512) @1x.

If we want facilities to align with board visuals:
- Option A: Position board at (458*2, 1024) = (916, 1024) and keep facility coords as-is
- Option B: Position board differently and adjust facility coords

**Current implementation uses boardX = 970**

Let me calculate where board SHOULD be for facilities to align...

## Recalculation

If Alien Artifact facility is at:
- iOS scene: (601, 794) @1x
- iOS relative to board center (458, 512): (601-458, 794-512) = (143, 282)

If we want facility at Phaser scene (1202, 460):
- Board center should be at: (1202 - 143*2, 460 + 282*2) = (1202 - 286, 460 + 564) = (916, 1024) ✅

So **boardX should be 916, not 970!**

## Conclusion

The board position in game-scene.ts is INCORRECT:
```typescript
const boardX = 970;  // WRONG!
```

Should be:
```typescript
const boardX = 916;  // 458 points * 2 = 916 pixels
```

Or more explicitly:
```typescript
const boardX = (1024 * 0.5 - 54) * 2;  // = (512 - 54) * 2 = 916
```

This will make the board offset match iOS exactly, and facilities will align properly.
