# Board Layout Export/Import Guide

## Overview

The board layout for Alien Frontiers can now be exported to visual editing tools like Figma, modified, and then re-imported back into the game. This makes it easy to adjust positions, test different layouts, and maintain consistency.

## Quick Start

### Export Current Layout
```bash
npm run export-layout
```

This creates 3 files in `exports/board-layout/`:
- `board-layout.svg` - Visual representation (import to Figma)
- `board-layout.csv` - Spreadsheet format (edit in Excel)
- `board-layout.figma.json` - Figma JSON structure
- `README.md` - Detailed documentation

### Edit in Figma

**Option 1: SVG Import (Recommended)**
1. Open Figma
2. File → Import → Select `board-layout.svg`
3. Edit positions by dragging elements
4. Select all → Copy as SVG or use a plugin to export with positioning data
5. Re-import (see below)

**Option 2: CSV in Spreadsheet**
1. Open `board-layout.csv` in Excel, Google Sheets, or Numbers
2. Edit X, Y coordinates directly
3. Save as CSV
4. Re-import: `npm run import-layout:csv path/to/modified.csv`

### Re-import Modified Layout

After editing, re-import the changes:

```bash
# From CSV (most reliable)
npm run import-layout:csv exports/board-layout/board-layout-modified.csv

# From JSON
npm run import-layout:json exports/board-layout/board-layout-modified.json

# From SVG
npm run import-layout:svg exports/board-layout/board-layout-modified.svg
```

**Note**: CSV import is currently the most complete implementation.

### Test Changes

After re-importing:
```bash
npm run build
npm run dev
```

Then test in the browser to ensure all positions look correct.

## Board Structure

### Dimensions
- **Width**: 1536px
- **Height**: 2048px  
- **Orientation**: Portrait
- **Scale**: 2x (retina)

### Element Types

#### 1. Facilities (10 total)
Each facility is a container with docking slots for ships:
- **SOLAR_CONVERTER** - 8 docks (energy conversion)
- **ORBITAL_MARKET** - 2 dock groups (2 ships each)
- **ALIEN_ARTIFACT** - 4 docks (tech card acquisition)
- **TERRAFORMING_STATION** - 1 dock (colony placement)
- **SHIPYARD** - 3 dock groups (ship building)
- **MAINTENANCE_BAY** - 20 docks (overflow/default)
- **COLONIST_HUB** - 4 tracks (3 docks each)
- **LUNAR_MINE** - 5 docks (ore extraction)
- **RAIDER_OUTPOST** - 1 group of 3 docks (raiding)
- **COLONY_CONSTRUCTOR** - 2 groups (3 ships each)

#### 2. Territories (8 total)
Planet surface areas where colonies are placed:
- **HEINLEIN_PLAINS** - 3 colonies (horizontal)
- **ASIMOV_CRATER** - 3 colonies (horizontal)
- **BRADBURY_PLATEAU** - 3 colonies (vertical)
- **BURROUGHS_DESERT** - 3 colonies (vertical)
- **HERBERT_VALLEY** - 3 colonies (horizontal)
- **LEM_BADLANDS** - 3 colonies (horizontal)
- **POHL_FOOTHILLS** - 3 colonies (horizontal)
- **VAN_VOGT_MOUNTAINS** - 3 colonies (horizontal)

#### 3. Player Areas
- **Player Trays** (4) - Bottom area for ship pools
- **Player HUD** (4) - Top corners for resources/VP display

#### 4. Control Elements
- **ROLL_DICE** button - Start turn
- **END_TURN** button - Complete turn
- **UNDO** button - Undo last action
- **REDO** button - Redo action

#### 5. Special Areas
- **Dice Area** - Where rolled dice appear
- **Tech Card Hand** - Bottom left, holds acquired tech cards

## CSV Format

The CSV export has these columns:

```
Type,Name,X,Y,Width,Height,Slots,Notes
```

**Example rows:**
```csv
Facility,SOLAR_CONVERTER,360,448,120,80,8,Container origin
Dock,SOLAR_CONVERTER_dock_0,336,140,48,48,1,Slot 0
Territory,HEINLEIN_PLAINS,872,572,180,120,3,"Heinlein Plains"
Colony,HEINLEIN_PLAINS_colony_0,822,572,40,40,1,Slot 0
```

### Editing Tips

**To move a facility:**
1. Find the facility row (Type = "Facility")
2. Edit X and Y coordinates
3. The dock positions are calculated automatically based on the facility position

**To move a territory:**
1. Find the territory row (Type = "Territory")
2. Edit X and Y coordinates  
3. Colony positions are calculated automatically in the specified layout (horizontal/vertical/grid)

**To adjust player HUD:**
1. Find PlayerHUD rows
2. Edit X and Y coordinates
3. Keep Player 0/1 at top, Player 2/3 below

## Color Legend (SVG/Figma)

- **Blue** (#3380CC): Facilities and dock slots
- **Orange** (#CC8033): Territories and colony slots
- **Green** (#80CC4D): Player trays and HUD
- **Purple** (#994DCC): Turn controls
- **Red** (#CC4D4D): Dice area
- **Yellow** (#E6CC33): Tech card hand area

## Coordinate System

- **Origin**: Top-left corner (0, 0)
- **X-axis**: Increases rightward
- **Y-axis**: Increases downward
- **Units**: Pixels at 2x scale (retina)

### Facility Coordinates

Facilities have a **container origin** (the X,Y in FACILITY_DOCKS). Dock slots are positioned relative to this origin using the formula:

```
dock_x = facility_x + 24 + (slot_index * 52) + center_offset
dock_y = facility_y - 308
```

### Territory Coordinates

Territories use **center positioning**. Colony slots radiate from the center:

**Horizontal layout:**
```
colony_x = territory_x + (index - (maxColonies-1)/2) * 50
colony_y = territory_y
```

**Vertical layout:**
```
colony_x = territory_x
colony_y = territory_y + (index - (maxColonies-1)/2) * 50
```

## Backup & Restore

### Automatic Backups

The import script automatically creates backups:
```
src/config/board-layout.backup-[timestamp].ts
```

### Manual Backup

Before making changes:
```bash
cp src/config/board-layout.ts src/config/board-layout.backup.ts
```

### Restore from Backup

```bash
cp src/config/board-layout.backup-[timestamp].ts src/config/board-layout.ts
npm run build
```

## Troubleshooting

### Issue: Elements overlap after re-import

**Solution**: Check that your edited coordinates maintain enough spacing:
- Facilities: ~150px apart
- Territories: ~200px apart  
- Player areas: Edge-aligned with margins

### Issue: Dock slots misaligned

**Solution**: The import script recalculates dock positions. You only need to edit the facility container position, not individual docks.

### Issue: Build fails after re-import

**Solution**: 
1. Restore from backup
2. Check the CSV for syntax errors (commas, quotes)
3. Ensure all numeric columns have valid numbers

### Issue: Game looks wrong but compiles

**Solution**:
1. Check browser console for errors
2. Verify coordinates are within bounds (0-1536 x, 0-2048 y)
3. Clear browser cache and reload

## Advanced Customization

### Adding New Facilities

1. Edit CSV, add new facility row
2. Add dock rows for the facility
3. Re-import
4. Update game logic in `src/game/facilities/` to create the new facility class

### Changing Colony Layouts

Edit the CSV territory row's Notes column:
- `"Territory Name, horizontal"` - Colonies in a row
- `"Territory Name, vertical"` - Colonies in a column  
- `"Territory Name, grid"` - Colonies in 2-column grid

### Custom Player Configurations

Edit PlayerTray and PlayerHUD rows for different player counts or arrangements.

## Scripts Reference

```bash
# Export current layout
npm run export-layout

# Import from CSV (recommended)
npm run import-layout:csv <path-to-csv>

# Import from JSON
npm run import-layout:json <path-to-json>

# Import from SVG  
npm run import-layout:svg <path-to-svg>

# Build and test
npm run build
npm run dev
```

## Files Modified

When you re-import, these files are updated:
- `src/config/board-layout.ts` - Main configuration (backed up automatically)

These files are NOT modified (constants preserved):
- `SIZES` - Element dimensions
- `ANIMATION_OFFSETS` - Hover effects
- `RESOURCE_ICONS` - Icon offsets
- Utility functions - `getDockSlotPosition()`, `getColonyPosition()`, etc.

## Best Practices

1. **Always export first** before making manual changes
2. **Use CSV for precision** - Exact pixel coordinates
3. **Use Figma for visualization** - See the whole board layout
4. **Test frequently** - Build and view in browser after changes
5. **Keep backups** - The script does this automatically, but keep your own too
6. **Version control** - Commit before and after layout changes

## Support

If you encounter issues:
1. Check this guide
2. Review the generated README.md in exports/board-layout/
3. Restore from backup and try again
4. Check git history for working versions

## Future Enhancements

Planned improvements:
- [ ] Full JSON import support (Figma plugins)
- [ ] Full SVG import with position parsing
- [ ] Visual diff tool to preview changes
- [ ] Automatic layout validation
- [ ] Interactive web-based editor
- [ ] Snap-to-grid helpers
- [ ] Layout presets (compact, spacious, etc.)
