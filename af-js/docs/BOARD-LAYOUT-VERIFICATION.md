# Game Board Layout Verification Checklist

**Reference**: `reference-screenshots/game_start_2players.jpg`  
**Current Build**: Hash 2de0528955933a6d639a  
**Date**: October 31, 2025

## Expected Layout (from iOS code and reference)

### Board Position
- [ ] **Board centered horizontally** with slight left offset (-54px in iOS, scaled to -108px)
- [ ] **Board fills most of screen vertically** (scaled to fit 2048px height)
- [ ] **Board background is dark blue/space themed** with Mars surface visible

### Main Player HUD (Bottom)
- [ ] **Position**: Bottom of screen at Y=1852 (iOS: Y=98 from bottom)
- [ ] **HUD frame**: Large player tab visible
- [ ] **Player number**: Large number showing victory points (center-right of HUD)
- [ ] **Resources display** (left side):
  - [ ] Ore count with icon
  - [ ] Fuel count with icon
  - [ ] Colony count with small colony marker
  - [ ] Dice count with small die marker
- [ ] **Roll button** (left-center): "ROLL" with up/down states
- [ ] **Undo/Redo buttons** (bottom-center): Small icons
- [ ] **Done button** (bottom-center): Larger button
- [ ] **Tech card tray** (left side): Horizontal tray for cards
- [ ] **Corner overlay tint**: Player color (red/green/blue/yellow)

### Mini Player HUDs (Top)
- [ ] **Visible for other players** (not current player)
- [ ] **Smaller compact version** of main HUD
- [ ] **Shows player resources and VP**

### Board Elements (Orbital Facilities)

#### Left Column (Top to Bottom):
1. [ ] **Solar Converter** (top-left, ~Y=448)
2. [ ] **Terraforming Station** (middle-left, ~Y=648)
3. [ ] **Colony Constructor** (lower-left, ~Y=1048)
4. [ ] **Colonist Hub** (bottom-left, ~Y=1448)

#### Center:
5. [ ] **Alien Artifact** (top-center, ~Y=298)
6. [ ] **Orbital Market** (upper-center, ~Y=398)

#### Right Column (Top to Bottom):
7. [ ] **Solar Converter** (top-right, mirrored from left)
8. [ ] **Lunar Mine** (right side, ~Y=848)
9. [ ] **Raiders Outpost** (lower-right, ~Y=1448)

#### Bottom Center:
10. [ ] **Maintenance Bay** (bottom-center, ~Y=1648)

### Territory Zones (on Mars Surface)
- [ ] **8 territories visible** on Mars surface
- [ ] **Territory names readable**:
  1. Asimov Crater (top)
  2. Bradbury Plateau
  3. Burroughs Desert
  4. Heinlein Plains
  5. Herbert Valley
  6. Lem Badlands
  7. Pohl Foothills
  8. Von Vogt Mountains
- [ ] **Colony placement zones** visible for each territory

### Visual Elements
- [ ] **Background**: Deep space/stars visible around Mars
- [ ] **Mars surface**: Reddish terrain with craters/features
- [ ] **Facility docking bays**: Clearly defined zones for dice placement
- [ ] **All text readable** at game resolution
- [ ] **No texture loading issues** (no triangles/missing textures)
- [ ] **Proper scaling**: Everything proportional to original iOS version

## Known Differences from iOS

### Screen Resolution
- **iOS Original**: 768×1024 (non-retina) or 1536×2048 (retina)
- **Our Game**: 1536×2048 (fixed portrait)
- **Scaling**: Should match retina iPad exactly

### Coordinate System
- **iOS**: Origin at bottom-left, Y increases upward
- **Phaser**: Origin at top-left, Y increases downward
- **Conversion**: Our code handles this with `convertFromIOSCoordinates()` helper

### Asset Differences
- **Board image**: `af_ipad_board-ipadhd.png` (2048×2048 pixels)
- **Background**: Using game board as primary background
- **HUD**: `hud_port_player_tab_large-ipadhd.png`

## Common Issues to Check

### If Board Looks Wrong:
1. **Too large/small**: Check board scaling in `game-scene.ts` line 180-190
2. **Wrong position**: Check boardX/boardY calculation
3. **Cut off**: Check game canvas size in browser
4. **Textures missing**: Ensure HTTP server running (not file://)

### If HUD Looks Wrong:
1. **Wrong position**: Check PlayerHUDLayer constructor (should be 768, 1852)
2. **Elements misaligned**: Check `convertIOSChildCoordinates()` in helpers
3. **Missing elements**: Check asset loading in boot-scene

### If Facilities Aren't Clickable:
1. **Hit boxes**: Check `FACILITY_DOCKS` in `board-layout.ts`
2. **Coordinate conversion**: Verify iOS→Phaser coordinate math
3. **Z-index issues**: Check scene layer ordering

## How to Verify

### Visual Comparison:
1. Open `reference-screenshots/game_start_2players.jpg`
2. Open game at `http://localhost:8080`
3. Navigate to game screen (2 players)
4. Compare side-by-side:
   - Board position and scale
   - HUD position and elements
   - Facility locations
   - Territory zones
   - Overall layout

### Pixel-Perfect Check:
1. Take screenshot of running game
2. Overlay with reference image
3. Use image editing software to check alignment
4. Verify key points:
   - Board edges
   - Facility centers
   - HUD corners
   - Text positions

### Interactive Verification:
1. Click on each facility
2. Verify dice can be placed
3. Check territory selection works
4. Ensure buttons respond correctly

## Current Known Issues

✅ **FIXED**: Board scaling (was oversized)
✅ **FIXED**: HUD positioning (was off-screen)
✅ **FIXED**: Texture loading (now using HTTP server)
⚠️ **TO VERIFY**: Exact facility positions match reference
⚠️ **TO VERIFY**: Territory zone positions match reference
⚠️ **TO VERIFY**: HUD button positions match reference

## Reference Measurements (from iOS code)

### Board:
- Position: `(768*0.5 - 54, height*0.5)` → Phaser: `(GAME_WIDTH*0.5 - 108, GAME_HEIGHT*0.5)`
- Size: 2048×2048 pixels (scaled to fit height)

### Main HUD:
- Position: `(768*0.5, 234*0.5 - 19)` → Phaser: `(768, 1852)`
- Size: Full width of screen

### Roll Button (relative to HUD):
- iOS offset: `(635-375, 92-117)` = `(260, -25)`
- Converted via `convertIOSChildCoordinates()`

## Next Steps

1. [ ] Open game at `http://localhost:8080`
2. [ ] Compare with `game_start_2players.jpg` reference
3. [ ] Document any discrepancies found
4. [ ] Make adjustments if needed
5. [ ] Test facility interaction
6. [ ] Verify all UI elements clickable
7. [ ] Confirm modal displays work correctly

---

**Status**: Ready for manual verification  
**Server**: Running at http://localhost:8080  
**Build**: Latest (Hash 2de0528955933a6d639a)
