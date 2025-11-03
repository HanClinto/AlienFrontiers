# Alien Frontiers Board Layout Export

Generated on: 2025-11-01T21:10:51.466Z

## Files

- **board-layout.figma.json** - Figma-compatible JSON structure (import via Figma plugin)
- **board-layout.csv** - Simple CSV for spreadsheet editing
- **board-layout.svg** - SVG for visual editing in Figma, Illustrator, or Inkscape

## Board Dimensions

- **Width**: 1536px
- **Height**: 2048px
- **Orientation**: Portrait
- **Scale**: 2x (retina)

## Element Types

### Facilities (10 total)
Each facility has a container origin and dock slots for ship placement:
- SOLAR_CONVERTER (1 dock)
- ORBITAL_MARKET (2 docks)
- ALIEN_ARTIFACT (1 dock)
- TERRAFORMING_STATION (2 docks)
- SHIPYARD (3 docks)
- MAINTENANCE_BAY (2 docks)
- COLONIST_HUB (4 docks)
- LUNAR_MINE (3 docks)
- RAIDER_OUTPOST (3 docks)
- COLONY_CONSTRUCTOR (3 docks)

### Territories (6 total)
Each territory has colony slots where players can place colonies:
- HEINLEIN_PLAINS (3 colonies, horizontal)
- ASIMOV_CRATER (3 colonies, horizontal)
- BRADBURY_PLATEAU (3 colonies, vertical)
- BURROUGHS_DESERT (3 colonies, vertical)
- HERBERT_VALLEY (3 colonies, horizontal)
- VAN_VOGT_MOUNTAINS (3 colonies, horizontal)

### Player Areas
- 4 player trays (bottom area)
- 4 player HUD positions (top corners)

### Controls
- ROLL_DICE button
- END_TURN button
- UNDO button
- REDO button

### Special Areas
- Dice area (for rolling display)
- Tech card hand (bottom left)

## Importing into Figma

### Method 1: SVG Import
1. Open Figma
2. File → Import → Choose `board-layout.svg`
3. Edit positions visually
4. File → Export → SVG with IDs
5. Use the re-import script (see below)

### Method 2: JSON Plugin
1. Install "JSON to Figma" plugin in Figma
2. Import `board-layout.figma.json`
3. Edit as needed
4. Export modified JSON
5. Use the re-import script

### Method 3: CSV Spreadsheet
1. Open `board-layout.csv` in Excel/Google Sheets
2. Edit X, Y, Width, Height values
3. Save as CSV
4. Use the re-import script

## Re-importing Modified Layout

After editing in Figma or a spreadsheet, you'll need to update the TypeScript configuration:

### From CSV:
```bash
npm run import-layout:csv exports/board-layout/board-layout-modified.csv
```

### From JSON:
```bash
npm run import-layout:json exports/board-layout/board-layout-modified.json
```

### From SVG:
```bash
npm run import-layout:svg exports/board-layout/board-layout-modified.svg
```

## Manual Update

You can also manually update the positions in:
```
src/config/board-layout.ts
```

## Color Legend

- **Blue** (#3380CC): Facilities and dock slots
- **Orange** (#CC8033): Territories and colony slots
- **Green** (#80CC4D): Player trays and HUD
- **Purple** (#994DCC): Turn controls
- **Red** (#CC4D4D): Dice area
- **Yellow** (#E6CC33): Tech card hand

## Notes

- All coordinates are in pixels at 2x scale (retina)
- Origin (0,0) is top-left corner
- X increases rightward, Y increases downward
- Dock positions are relative to facility container origins
- Colony positions are relative to territory centers
