/**
 * Export board layout to Figma-compatible formats
 * 
 * This utility exports the board layout configuration to formats that can be
 * imported into Figma for visual editing and then re-imported.
 */

import * as BoardLayout from '../config/board-layout';

export interface FigmaFrame {
  type: 'FRAME';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children?: FigmaNode[];
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  strokeWeight?: number;
  cornerRadius?: number;
  effects?: FigmaEffect[];
}

export interface FigmaRectangle {
  type: 'RECTANGLE';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  strokeWeight?: number;
  cornerRadius?: number;
}

export interface FigmaText {
  type: 'TEXT';
  name: string;
  x: number;
  y: number;
  characters: string;
  fontSize?: number;
  fontFamily?: string;
  fills?: FigmaFill[];
}

export interface FigmaFill {
  type: 'SOLID';
  color: { r: number; g: number; b: number };
  opacity?: number;
}

export interface FigmaStroke {
  type: 'SOLID';
  color: { r: number; g: number; b: number };
  opacity?: number;
}

export interface FigmaEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR';
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
  visible?: boolean;
}

export type FigmaNode = FigmaFrame | FigmaRectangle | FigmaText;

export interface FigmaDocument {
  name: string;
  type: 'DOCUMENT';
  children: FigmaNode[];
  version: string;
}

/**
 * Color palette for different element types
 */
const COLORS = {
  facility: { r: 0.2, g: 0.5, b: 0.8 },      // Blue
  dock: { r: 0.3, g: 0.6, b: 0.9 },          // Light blue
  territory: { r: 0.8, g: 0.5, b: 0.2 },     // Orange
  colony: { r: 0.9, g: 0.6, b: 0.3 },        // Light orange
  player: { r: 0.5, g: 0.8, b: 0.3 },        // Green
  control: { r: 0.6, g: 0.3, b: 0.8 },       // Purple
  dice: { r: 0.8, g: 0.3, b: 0.3 },          // Red
  techCard: { r: 0.9, g: 0.8, b: 0.2 },      // Yellow
  background: { r: 0.95, g: 0.95, b: 0.95 }, // Light gray
};

/**
 * Export board layout as Figma JSON structure
 */
export function exportToFigmaJSON(): FigmaDocument {
  const children: FigmaNode[] = [];

  // Board background
  children.push({
    type: 'RECTANGLE',
    name: 'Board Background',
    x: 0,
    y: 0,
    width: 1536,
    height: 2048,
    fills: [{ type: 'SOLID', color: COLORS.background, opacity: 1 }],
    cornerRadius: 0,
  });

  // Facilities layer
  const facilitiesFrame: FigmaFrame = {
    type: 'FRAME',
    name: 'Facilities',
    x: 0,
    y: 0,
    width: 1536,
    height: 2048,
    children: [],
  };

  Object.entries(BoardLayout.FACILITY_DOCKS).forEach(([name, dock]) => {
    // Facility container
    const facilityFrame: FigmaFrame = {
      type: 'FRAME',
      name: name,
      x: dock.x,
      y: dock.y,
      width: 120,
      height: 80,
      fills: [{ type: 'SOLID', color: COLORS.facility, opacity: 0.7 }],
      strokes: [{ type: 'SOLID', color: COLORS.facility, opacity: 1 }],
      strokeWeight: 2,
      cornerRadius: 8,
      children: [],
    };

    // Add label
    facilityFrame.children!.push({
      type: 'TEXT',
      name: `${name}_label`,
      x: 10,
      y: 5,
      characters: name.replace(/_/g, ' '),
      fontSize: 12,
      fontFamily: 'Inter',
      fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 }],
    });

    // Add dock slots
    for (let i = 0; i < dock.slots; i++) {
      const slotPos = BoardLayout.getDockSlotPosition(name, i);
      facilityFrame.children!.push({
        type: 'RECTANGLE',
        name: `${name}_dock_${i}`,
        x: slotPos.x - dock.x,
        y: slotPos.y - dock.y,
        width: 48,
        height: 48,
        fills: [{ type: 'SOLID', color: COLORS.dock, opacity: 0.5 }],
        strokes: [{ type: 'SOLID', color: COLORS.dock, opacity: 1 }],
        strokeWeight: 1,
        cornerRadius: 4,
      });
    }

    facilitiesFrame.children!.push(facilityFrame);
  });

  children.push(facilitiesFrame);

  // Territories layer
  const territoriesFrame: FigmaFrame = {
    type: 'FRAME',
    name: 'Territories',
    x: 0,
    y: 0,
    width: 1536,
    height: 2048,
    children: [],
  };

  Object.entries(BoardLayout.TERRITORIES).forEach(([name, territory]) => {
    // Territory container
    const territoryFrame: FigmaFrame = {
      type: 'FRAME',
      name: name,
      x: territory.x,
      y: territory.y,
      width: 180,
      height: 120,
      fills: [{ type: 'SOLID', color: COLORS.territory, opacity: 0.6 }],
      strokes: [{ type: 'SOLID', color: COLORS.territory, opacity: 1 }],
      strokeWeight: 2,
      cornerRadius: 12,
      children: [],
    };

    // Add label
    territoryFrame.children!.push({
      type: 'TEXT',
      name: `${name}_label`,
      x: 10,
      y: 5,
      characters: territory.name,
      fontSize: 14,
      fontFamily: 'Inter',
      fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 }],
    });

    // Add colony slots
    for (let i = 0; i < territory.maxColonies; i++) {
      const colonyPos = BoardLayout.getColonyPosition(name, i);
      territoryFrame.children!.push({
        type: 'RECTANGLE',
        name: `${name}_colony_${i}`,
        x: colonyPos.x - territory.x,
        y: colonyPos.y - territory.y,
        width: 40,
        height: 40,
        fills: [{ type: 'SOLID', color: COLORS.colony, opacity: 0.4 }],
        strokes: [{ type: 'SOLID', color: COLORS.colony, opacity: 1 }],
        strokeWeight: 1,
        cornerRadius: 20,
      });
    }

    territoriesFrame.children!.push(territoryFrame);
  });

  children.push(territoriesFrame);

  // Player trays layer
  const playerTraysFrame: FigmaFrame = {
    type: 'FRAME',
    name: 'Player Trays',
    x: 0,
    y: 0,
    width: 1536,
    height: 2048,
    children: [],
  };

  Object.entries(BoardLayout.PLAYER_TRAYS).forEach(([index, position]) => {
    playerTraysFrame.children!.push({
      type: 'RECTANGLE',
      name: `Player_${index}_Tray`,
      x: position.x,
      y: position.y,
      width: 200,
      height: 150,
      fills: [{ type: 'SOLID', color: COLORS.player, opacity: 0.5 }],
      strokes: [{ type: 'SOLID', color: COLORS.player, opacity: 1 }],
      strokeWeight: 2,
      cornerRadius: 8,
    });
  });

  children.push(playerTraysFrame);

  // Player HUD layer
  const playerHUDFrame: FigmaFrame = {
    type: 'FRAME',
    name: 'Player HUD',
    x: 0,
    y: 0,
    width: 1536,
    height: 2048,
    children: [],
  };

  Object.entries(BoardLayout.PLAYER_HUD_POSITIONS).forEach(([index, position]) => {
    playerHUDFrame.children!.push({
      type: 'RECTANGLE',
      name: `Player_${index}_HUD`,
      x: position.x,
      y: position.y,
      width: 300,
      height: 120,
      fills: [{ type: 'SOLID', color: COLORS.player, opacity: 0.6 }],
      strokes: [{ type: 'SOLID', color: COLORS.player, opacity: 1 }],
      strokeWeight: 2,
      cornerRadius: 8,
    });
  });

  children.push(playerHUDFrame);

  // Turn controls layer
  const controlsFrame: FigmaFrame = {
    type: 'FRAME',
    name: 'Turn Controls',
    x: 0,
    y: 0,
    width: 1536,
    height: 2048,
    children: [],
  };

  Object.entries(BoardLayout.TURN_CONTROLS).forEach(([name, position]) => {
    controlsFrame.children!.push({
      type: 'RECTANGLE',
      name: name,
      x: position.x,
      y: position.y,
      width: BoardLayout.SIZES.BUTTON_WIDTH,
      height: BoardLayout.SIZES.BUTTON_HEIGHT,
      fills: [{ type: 'SOLID', color: COLORS.control, opacity: 0.7 }],
      strokes: [{ type: 'SOLID', color: COLORS.control, opacity: 1 }],
      strokeWeight: 2,
      cornerRadius: 8,
    });

    controlsFrame.children!.push({
      type: 'TEXT',
      name: `${name}_label`,
      x: position.x + 10,
      y: position.y + 15,
      characters: name.replace(/_/g, ' '),
      fontSize: 14,
      fontFamily: 'Inter',
      fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 1 }],
    });
  });

  children.push(controlsFrame);

  // Dice area
  children.push({
    type: 'RECTANGLE',
    name: 'Dice Area',
    x: BoardLayout.DICE_AREA.x - 200,
    y: BoardLayout.DICE_AREA.y - 40,
    width: 400,
    height: 80,
    fills: [{ type: 'SOLID', color: COLORS.dice, opacity: 0.3 }],
    strokes: [{ type: 'SOLID', color: COLORS.dice, opacity: 1 }],
    strokeWeight: 2,
    cornerRadius: 8,
  });

  // Tech card hand area
  children.push({
    type: 'RECTANGLE',
    name: 'Tech Card Hand',
    x: BoardLayout.TECH_CARD_HAND.x,
    y: BoardLayout.TECH_CARD_HAND.y,
    width: BoardLayout.TECH_CARD_HAND.cardSpacing * BoardLayout.TECH_CARD_HAND.maxCards,
    height: BoardLayout.SIZES.TECH_CARD_HEIGHT,
    fills: [{ type: 'SOLID', color: COLORS.techCard, opacity: 0.3 }],
    strokes: [{ type: 'SOLID', color: COLORS.techCard, opacity: 1 }],
    strokeWeight: 2,
    cornerRadius: 8,
  });

  return {
    name: 'Alien Frontiers Board Layout',
    type: 'DOCUMENT',
    version: '1.0.0',
    children,
  };
}

/**
 * Export board layout as CSV (for simple position editing)
 */
export function exportToCSV(): string {
  const rows: string[] = [];
  
  // Header
  rows.push('Type,Name,X,Y,Width,Height,Slots,Notes');

  // Facilities
  Object.entries(BoardLayout.FACILITY_DOCKS).forEach(([name, dock]) => {
    rows.push(`Facility,${name},${dock.x},${dock.y},120,80,${dock.slots},Container origin`);
    
    // Add dock slots
    for (let i = 0; i < dock.slots; i++) {
      const slotPos = BoardLayout.getDockSlotPosition(name, i);
      rows.push(`Dock,${name}_dock_${i},${slotPos.x},${slotPos.y},48,48,1,Slot ${i}`);
    }
  });

  // Territories
  Object.entries(BoardLayout.TERRITORIES).forEach(([name, territory]) => {
    rows.push(`Territory,${name},${territory.x},${territory.y},180,120,${territory.maxColonies},"${territory.name}"`);
    
    // Add colony slots
    for (let i = 0; i < territory.maxColonies; i++) {
      const colonyPos = BoardLayout.getColonyPosition(name, i);
      rows.push(`Colony,${name}_colony_${i},${colonyPos.x},${colonyPos.y},40,40,1,Slot ${i}`);
    }
  });

  // Player trays
  Object.entries(BoardLayout.PLAYER_TRAYS).forEach(([index, position]) => {
    rows.push(`PlayerTray,Player_${index}_Tray,${position.x},${position.y},200,150,0,Player ${index}`);
  });

  // Player HUD
  Object.entries(BoardLayout.PLAYER_HUD_POSITIONS).forEach(([index, position]) => {
    rows.push(`PlayerHUD,Player_${index}_HUD,${position.x},${position.y},300,120,0,Player ${index}`);
  });

  // Turn controls
  Object.entries(BoardLayout.TURN_CONTROLS).forEach(([name, position]) => {
    rows.push(`Control,${name},${position.x},${position.y},${BoardLayout.SIZES.BUTTON_WIDTH},${BoardLayout.SIZES.BUTTON_HEIGHT},0,${name.replace(/_/g, ' ')}`);
  });

  // Special areas
  rows.push(`DiceArea,Dice_Area,${BoardLayout.DICE_AREA.x},${BoardLayout.DICE_AREA.y},400,80,${BoardLayout.DICE_AREA.maxDice},Rolling area`);
  rows.push(`TechCardHand,Tech_Card_Hand,${BoardLayout.TECH_CARD_HAND.x},${BoardLayout.TECH_CARD_HAND.y},${BoardLayout.TECH_CARD_HAND.cardSpacing * BoardLayout.TECH_CARD_HAND.maxCards},${BoardLayout.SIZES.TECH_CARD_HEIGHT},${BoardLayout.TECH_CARD_HAND.maxCards},Card hand`);

  return rows.join('\n');
}

/**
 * Export board layout as SVG (for visual editing in Figma/Illustrator)
 */
export function exportToSVG(): string {
  const svg: string[] = [];
  
  // SVG header
  svg.push('<?xml version="1.0" encoding="UTF-8"?>');
  svg.push('<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="2048" viewBox="0 0 1536 2048">');
  svg.push('  <title>Alien Frontiers Board Layout</title>');
  svg.push('  <defs>');
  svg.push('    <style>');
  svg.push('      .facility { fill: rgba(51, 128, 204, 0.7); stroke: rgb(51, 128, 204); stroke-width: 2; }');
  svg.push('      .dock { fill: rgba(77, 153, 230, 0.5); stroke: rgb(77, 153, 230); stroke-width: 1; }');
  svg.push('      .territory { fill: rgba(204, 128, 51, 0.6); stroke: rgb(204, 128, 51); stroke-width: 2; }');
  svg.push('      .colony { fill: rgba(230, 153, 77, 0.4); stroke: rgb(230, 153, 77); stroke-width: 1; }');
  svg.push('      .player { fill: rgba(128, 204, 77, 0.5); stroke: rgb(128, 204, 77); stroke-width: 2; }');
  svg.push('      .control { fill: rgba(153, 77, 204, 0.7); stroke: rgb(153, 77, 204); stroke-width: 2; }');
  svg.push('      .dice { fill: rgba(204, 77, 77, 0.3); stroke: rgb(204, 77, 77); stroke-width: 2; }');
  svg.push('      .techcard { fill: rgba(230, 204, 51, 0.3); stroke: rgb(230, 204, 51); stroke-width: 2; }');
  svg.push('      .label { fill: white; font-family: Arial, sans-serif; font-size: 12px; }');
  svg.push('    </style>');
  svg.push('  </defs>');
  svg.push('  ');
  svg.push('  <!-- Background -->');
  svg.push('  <rect x="0" y="0" width="1536" height="2048" fill="#f0f0f0"/>');
  svg.push('  ');

  // Facilities
  svg.push('  <!-- Facilities -->');
  svg.push('  <g id="facilities">');
  Object.entries(BoardLayout.FACILITY_DOCKS).forEach(([name, dock]) => {
    svg.push(`    <g id="${name}" data-type="facility">`);
    svg.push(`      <rect class="facility" x="${dock.x - 60}" y="${dock.y - 40}" width="120" height="80" rx="8"/>`);
    svg.push(`      <text class="label" x="${dock.x - 50}" y="${dock.y - 25}">${name.replace(/_/g, ' ')}</text>`);
    
    // Dock slots
    for (let i = 0; i < dock.slots; i++) {
      const slotPos = BoardLayout.getDockSlotPosition(name, i);
      svg.push(`      <rect class="dock" x="${slotPos.x - 24}" y="${slotPos.y - 24}" width="48" height="48" rx="4" data-slot="${i}"/>`);
    }
    svg.push(`    </g>`);
  });
  svg.push('  </g>');
  svg.push('  ');

  // Territories
  svg.push('  <!-- Territories -->');
  svg.push('  <g id="territories">');
  Object.entries(BoardLayout.TERRITORIES).forEach(([name, territory]) => {
    svg.push(`    <g id="${name}" data-type="territory">`);
    svg.push(`      <rect class="territory" x="${territory.x - 90}" y="${territory.y - 60}" width="180" height="120" rx="12"/>`);
    svg.push(`      <text class="label" x="${territory.x - 80}" y="${territory.y - 45}">${territory.name}</text>`);
    
    // Colony slots
    for (let i = 0; i < territory.maxColonies; i++) {
      const colonyPos = BoardLayout.getColonyPosition(name, i);
      svg.push(`      <circle class="colony" cx="${colonyPos.x}" cy="${colonyPos.y}" r="20" data-slot="${i}"/>`);
    }
    svg.push(`    </g>`);
  });
  svg.push('  </g>');
  svg.push('  ');

  // Player trays
  svg.push('  <!-- Player Trays -->');
  svg.push('  <g id="player-trays">');
  Object.entries(BoardLayout.PLAYER_TRAYS).forEach(([index, position]) => {
    svg.push(`    <rect class="player" x="${position.x}" y="${position.y}" width="200" height="150" rx="8" data-player="${index}"/>`);
    svg.push(`    <text class="label" x="${position.x + 10}" y="${position.y + 20}">Player ${index} Tray</text>`);
  });
  svg.push('  </g>');
  svg.push('  ');

  // Player HUD
  svg.push('  <!-- Player HUD -->');
  svg.push('  <g id="player-hud">');
  Object.entries(BoardLayout.PLAYER_HUD_POSITIONS).forEach(([index, position]) => {
    svg.push(`    <rect class="player" x="${position.x}" y="${position.y}" width="300" height="120" rx="8" data-player="${index}"/>`);
    svg.push(`    <text class="label" x="${position.x + 10}" y="${position.y + 20}">Player ${index} HUD</text>`);
  });
  svg.push('  </g>');
  svg.push('  ');

  // Turn controls
  svg.push('  <!-- Turn Controls -->');
  svg.push('  <g id="turn-controls">');
  Object.entries(BoardLayout.TURN_CONTROLS).forEach(([name, position]) => {
    svg.push(`    <rect class="control" x="${position.x}" y="${position.y}" width="${BoardLayout.SIZES.BUTTON_WIDTH}" height="${BoardLayout.SIZES.BUTTON_HEIGHT}" rx="8" data-control="${name}"/>`);
    svg.push(`    <text class="label" x="${position.x + 10}" y="${position.y + 30}">${name.replace(/_/g, ' ')}</text>`);
  });
  svg.push('  </g>');
  svg.push('  ');

  // Dice area
  svg.push('  <!-- Dice Area -->');
  svg.push(`  <rect class="dice" x="${BoardLayout.DICE_AREA.x - 200}" y="${BoardLayout.DICE_AREA.y - 40}" width="400" height="80" rx="8"/>`);
  svg.push(`  <text class="label" x="${BoardLayout.DICE_AREA.x - 180}" y="${BoardLayout.DICE_AREA.y - 15}">Dice Area</text>`);
  svg.push('  ');

  // Tech card hand
  svg.push('  <!-- Tech Card Hand -->');
  svg.push(`  <rect class="techcard" x="${BoardLayout.TECH_CARD_HAND.x}" y="${BoardLayout.TECH_CARD_HAND.y}" width="${BoardLayout.TECH_CARD_HAND.cardSpacing * BoardLayout.TECH_CARD_HAND.maxCards}" height="${BoardLayout.SIZES.TECH_CARD_HEIGHT}" rx="8"/>`);
  svg.push(`  <text class="label" x="${BoardLayout.TECH_CARD_HAND.x + 10}" y="${BoardLayout.TECH_CARD_HAND.y + 20}">Tech Card Hand</text>`);

  svg.push('</svg>');

  return svg.join('\n');
}

/**
 * Generate a TypeScript file from JSON positions (for re-import)
 */
export function generateTypeScriptFromJSON(jsonData: any): string {
  // This would parse modified JSON and regenerate the board-layout.ts file
  // Implementation would depend on the structure of the modified JSON
  return '// TypeScript generation from JSON - to be implemented';
}
