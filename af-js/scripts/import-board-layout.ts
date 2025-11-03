/**
 * Script to import modified board layout back into TypeScript
 * 
 * Usage:
 *   npm run import-layout:csv path/to/modified.csv
 *   npm run import-layout:json path/to/modified.json
 *   npm run import-layout:svg path/to/modified.svg
 */

import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const format = args[0]; // csv, json, or svg
const filePath = args[1];

if (!format || !filePath) {
  console.error('Usage: npm run import-layout:<format> <file-path>');
  console.error('Formats: csv, json, svg');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

console.log(`Importing board layout from ${format.toUpperCase()}...`);
console.log(`File: ${filePath}\n`);

interface LayoutElement {
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  slots?: number;
  notes?: string;
}

function parseCSV(csvContent: string): LayoutElement[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const elements: LayoutElement[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 7) continue;
    
    elements.push({
      type: parts[0].trim(),
      name: parts[1].trim(),
      x: parseFloat(parts[2]),
      y: parseFloat(parts[3]),
      width: parseFloat(parts[4]),
      height: parseFloat(parts[5]),
      slots: parseInt(parts[6]) || 0,
      notes: parts[7]?.replace(/"/g, '').trim(),
    });
  }
  
  return elements;
}

function generateTypeScriptCode(elements: LayoutElement[]): string {
  const facilities: Record<string, any> = {};
  const territories: Record<string, any> = {};
  const playerTrays: Record<string, any> = {};
  const playerHUD: Record<string, any> = {};
  const turnControls: Record<string, any> = {};
  let diceArea: any = null;
  let techCardHand: any = null;
  
  // Group elements by type
  elements.forEach(element => {
    switch (element.type) {
      case 'Facility':
        facilities[element.name] = {
          x: element.x,
          y: element.y,
          slots: element.slots,
        };
        break;
      case 'Territory':
        const layout = element.notes?.includes('horizontal') ? 'horizontal' :
                       element.notes?.includes('vertical') ? 'vertical' : 'grid';
        territories[element.name] = {
          x: element.x,
          y: element.y,
          name: element.notes || element.name.replace(/_/g, ' '),
          maxColonies: element.slots,
          colonyLayout: layout,
        };
        break;
      case 'PlayerTray':
        const trayIndex = element.name.match(/Player_(\d+)_Tray/)?.[1];
        if (trayIndex) {
          playerTrays[trayIndex] = { x: element.x, y: element.y };
        }
        break;
      case 'PlayerHUD':
        const hudIndex = element.name.match(/Player_(\d+)_HUD/)?.[1];
        if (hudIndex) {
          playerHUD[hudIndex] = { x: element.x, y: element.y };
        }
        break;
      case 'Control':
        turnControls[element.name] = { x: element.x, y: element.y };
        break;
      case 'DiceArea':
        diceArea = {
          x: element.x + element.width / 2, // Center X
          y: element.y + element.height / 2, // Center Y
          spacing: 80,
          maxDice: element.slots,
        };
        break;
      case 'TechCardHand':
        techCardHand = {
          x: element.x,
          y: element.y,
          cardSpacing: Math.floor(element.width / (element.slots || 6)),
          maxCards: element.slots || 6,
        };
        break;
    }
  });
  
  // Generate TypeScript code
  let code = `// Auto-generated from ${format.toUpperCase()} import - ${new Date().toISOString()}\n\n`;
  
  code += `export const FACILITY_DOCKS: Record<string, DockPosition> = {\n`;
  Object.entries(facilities).forEach(([name, data]) => {
    code += `  ${name}: {\n`;
    code += `    x: ${data.x},\n`;
    code += `    y: ${data.y},\n`;
    code += `    slots: ${data.slots},\n`;
    code += `  },\n`;
  });
  code += `};\n\n`;
  
  code += `export const TERRITORIES: Record<string, TerritoryPosition> = {\n`;
  Object.entries(territories).forEach(([name, data]) => {
    code += `  ${name}: {\n`;
    code += `    x: ${data.x},\n`;
    code += `    y: ${data.y},\n`;
    code += `    name: "${data.name}",\n`;
    code += `    maxColonies: ${data.maxColonies},\n`;
    code += `    colonyLayout: '${data.colonyLayout}',\n`;
    code += `  },\n`;
  });
  code += `};\n\n`;
  
  code += `export const PLAYER_TRAYS: Record<number, Position> = {\n`;
  Object.entries(playerTrays).forEach(([index, data]) => {
    code += `  ${index}: { x: ${data.x}, y: ${data.y} },\n`;
  });
  code += `};\n\n`;
  
  code += `export const PLAYER_HUD_POSITIONS: Record<number, Position> = {\n`;
  Object.entries(playerHUD).forEach(([index, data]) => {
    code += `  ${index}: { x: ${data.x}, y: ${data.y} },\n`;
  });
  code += `};\n\n`;
  
  code += `export const TURN_CONTROLS = {\n`;
  Object.entries(turnControls).forEach(([name, data]) => {
    code += `  ${name}: {\n`;
    code += `    x: ${data.x},\n`;
    code += `    y: ${data.y},\n`;
    code += `  },\n`;
  });
  code += `};\n\n`;
  
  if (diceArea) {
    code += `export const DICE_AREA = {\n`;
    code += `  x: ${diceArea.x},\n`;
    code += `  y: ${diceArea.y},\n`;
    code += `  spacing: ${diceArea.spacing},\n`;
    code += `  maxDice: ${diceArea.maxDice},\n`;
    code += `};\n\n`;
  }
  
  if (techCardHand) {
    code += `export const TECH_CARD_HAND = {\n`;
    code += `  x: ${techCardHand.x},\n`;
    code += `  y: ${techCardHand.y},\n`;
    code += `  cardSpacing: ${techCardHand.cardSpacing},\n`;
    code += `  maxCards: ${techCardHand.maxCards},\n`;
    code += `};\n`;
  }
  
  return code;
}

// Read file content
const fileContent = fs.readFileSync(filePath, 'utf8');

let elements: LayoutElement[] = [];

if (format === 'csv') {
  elements = parseCSV(fileContent);
} else if (format === 'json') {
  // Parse Figma JSON format
  const json = JSON.parse(fileContent);
  console.log('JSON import not fully implemented yet.');
  console.log('Please use CSV format for now.');
  process.exit(0);
} else if (format === 'svg') {
  console.log('SVG import not fully implemented yet.');
  console.log('Please use CSV format for now.');
  process.exit(0);
}

console.log(`Parsed ${elements.length} elements`);

// Generate new TypeScript code
const newCode = generateTypeScriptCode(elements);

// Backup original file
const configPath = path.join(__dirname, '..', 'src', 'config', 'board-layout.ts');
const backupPath = configPath.replace('.ts', `.backup-${Date.now()}.ts`);

console.log(`\nCreating backup: ${path.basename(backupPath)}`);
fs.copyFileSync(configPath, backupPath);

// Read original file to preserve header and utility functions
const originalContent = fs.readFileSync(configPath, 'utf8');
const headerEnd = originalContent.indexOf('export const FACILITY_DOCKS');

if (headerEnd === -1) {
  console.error('Could not find FACILITY_DOCKS in original file');
  process.exit(1);
}

const header = originalContent.substring(0, headerEnd);

// Find utility functions (getDockSlotPosition, etc.)
const utilsStart = originalContent.indexOf('export function getDockSlotPosition');
const utils = utilsStart > -1 ? '\n' + originalContent.substring(utilsStart) : '';

// Combine header + new constants + utils
const finalContent = header + newCode + utils;

// Write new file
console.log(`Updating: ${configPath}`);
fs.writeFileSync(configPath, finalContent, 'utf8');

console.log('\n✅ Import complete!');
console.log('\nNext steps:');
console.log('1. Review the changes in board-layout.ts');
console.log('2. Run: npm run build');
console.log('3. Test the game to ensure positions are correct');
console.log(`4. If needed, restore from backup: ${path.basename(backupPath)}`);
