/**
 * FacilityVisual - Visual representation of facilities on the board
 * 
 * Renders:
 * - Facility name labels
 * - Dock sprites showing available slots
 * - Icon sprites showing facility type/requirements
 */

import * as Phaser from 'phaser';
import { ShipLocation } from '../game/types';

/**
 * Facility visual configuration
 */
interface FacilityVisualConfig {
  location: ShipLocation;
  x: number;
  y: number;
  label: string;
  iconKey?: string;
  dockSlots: number;
}

/**
 * Facility visual configurations using iOS LayerOrbitals container positions
 * These are the positions where each facility layer is placed (from LayerOrbitals.m)
 * Docks, labels, and icons are positioned relative to these container origins
 * iOS coordinates converted to Phaser: x*2, (1024-y)*2
 */
export const FACILITY_VISUALS: Record<string, FacilityVisualConfig> = {
  SOLAR_CONVERTER: {
    location: 'solar_converter',
    x: 180 * 2,           // iOS: 180
    y: (1024 - 800) * 2,  // iOS: 800
    label: 'SOLAR CONVERTER',
    iconKey: 'icons_sc',
    dockSlots: 1,
  },
  SHIPYARD: {
    location: 'shipyard',
    x: (180 - 156) * 2,         // iOS: 180 - 156 = 24
    y: (1024 - (800 - 365)) * 2, // iOS: 800 - 365 = 435
    label: 'SHIPYARD',
    iconKey: 'icons_sy',
    dockSlots: 3,
  },
  LUNAR_MINE: {
    location: 'lunar_mine',
    x: 550 * 2,           // iOS: 550
    y: (1024 - 325) * 2,  // iOS: 325
    label: 'LUNAR MINE',
    iconKey: 'icons_lm',
    dockSlots: 3,
  },
  COLONY_CONSTRUCTOR: {
    location: 'colony_constructor',
    x: (180 - 156 + 322) * 2,         // iOS: 346
    y: (1024 - (800 - 365 - 144)) * 2, // iOS: 291
    label: 'COLONY CONSTRUCTOR',
    iconKey: 'icons_cc',
    dockSlots: 3,
  },
  TERRAFORMING_STATION: {
    location: 'terraforming_station',
    x: (180 - 156 + 4) * 2,           // iOS: 28
    y: (1024 - (800 - 365 + 268)) * 2, // iOS: 703
    label: 'TERRAFORMING STATION',
    iconKey: 'icons_ts',
    dockSlots: 2,
  },
  RAIDER_OUTPOST: {
    location: 'raiders_outpost',
    x: 613 * 2,           // iOS: 613
    y: (1024 - 425) * 2,  // iOS: 425
    label: 'RAIDER OUTPOST',
    iconKey: 'icons_raiders',
    dockSlots: 3,
  },
  MAINTENANCE_BAY: {
    location: 'maintenance_bay',
    x: (180 - 156) * 2,                   // iOS: 24
    y: (1024 - (800 - 365 + 268 - 116)) * 2, // iOS: 587
    label: 'MAINTENANCE BAY',
    iconKey: undefined,
    dockSlots: 2,
  },
  COLONIST_HUB: {
    location: 'colonist_hub',
    x: (180 - 156) * 2,                   // iOS: 24
    y: (1024 - (800 - 365 - 131 + 10)) * 2, // iOS: 314
    label: 'COLONIST HUB',
    iconKey: 'icons_ch',
    dockSlots: 4,
  },
  ORBITAL_MARKET: {
    location: 'orbital_market',
    x: (180 + 269) * 2,       // iOS: 449
    y: (1024 - (800 + 25)) * 2, // iOS: 825
    label: 'ORBITAL MARKET',
    iconKey: 'icons_om',
    dockSlots: 2,
  },
  ALIEN_ARTIFACT: {
    location: 'alien_artifact',
    x: (180 + 269 + 152) * 2,        // iOS: 601
    y: (1024 - (800 + 10 - 16)) * 2, // iOS: 794
    label: 'ALIEN ARTIFACT',
    iconKey: 'icons_aa',
    dockSlots: 1,
  },
};

/**
 * Visual representation of a facility
 */
export class FacilityVisual {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private config: FacilityVisualConfig;

  constructor(scene: Phaser.Scene, config: FacilityVisualConfig) {
    this.scene = scene;
    this.config = config;

    // Config already contains Phaser coordinates from BoardLayout
    this.container = scene.add.container(config.x, config.y);

    this.createVisuals();
  }

  private createVisuals(): void {
    // iOS layout (from TOP to BOTTOM):
    // 1. Label at top (anchor bottom-left, positioned at labelY)
    // 2. Docks in middle (anchor bottom-left, positioned at dockY, HORIZONTAL ROW)
    // 3. Icon at bottom (anchor bottom-left, positioned at y=6*2=12 from container origin)
    
    // iOS Y coordinates (examples from LayerAlienArtifact.m):
    // - Label: y = 80, 67 (two lines, anchor bottom-left)
    // - Docks: y = 8 - 162 (from container origin, anchor bottom-left), HORIZONTAL: x = 12 + (cnt % 4) * (width + 2)
    // - Icon: y = 6 - 162 (from container origin, anchor bottom-left)
    
    // At 2x scale: multiply by 2
    const labelY = 80 * 2; // 160px (first line)
    const dockY = (8 - 162) * 2; // -308px (below container origin)
    const iconY = (6 - 162) * 2; // -312px
    const dockBaseX = 12 * 2; // 24px
    const dockSpacingX = 2 * 2; // 4px between docks horizontally

    // Add facility label at TOP
    const label = this.scene.add.text(dockBaseX, labelY, this.config.label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px', // 12pt * 2
      color: '#ffffff',
      fontStyle: 'bold',
    });
    label.setOrigin(0, 1); // Bottom-left anchor (iOS style)
    label.setAlpha(0.8); // ORBITAL_FONT_OPACITY = 0xCC ≈ 0.8
    this.container.add(label);

    // Add dock sprites in HORIZONTAL ROW (CENTERED)
    // iOS: x = 12 + (cnt % 4) * (dock.contentSize.width + 2)
    // dock.contentSize.width is ~24px @1x = 48px @2x
    // spacing is 2px @1x = 4px @2x
    // Total spacing between docks: 52px (48px width + 4px gap)
    const dockWidth = 48;
    const dockTotalSpacing = 52; // dockWidth + dockSpacingX
    
    // Calculate centering offset to match getDockSlotPosition()
    const totalWidth = (this.config.dockSlots - 1) * dockTotalSpacing;
    const centerOffset = -totalWidth / 2;
    
    try {
      for (let i = 0; i < this.config.dockSlots; i++) {
        const dockX = dockBaseX + i * dockTotalSpacing + centerOffset;
        const dock = this.scene.add.image(dockX, dockY, 'dock_normal');
        dock.setOrigin(0, 0); // Top-left anchor
        dock.setScale(1); // Don't scale - dock_normal is already correct size
        this.container.add(dock);
      }
    } catch (error) {
      console.warn(`Failed to load dock sprites for ${this.config.label}:`, error);
      // Fallback rectangles
      for (let i = 0; i < this.config.dockSlots; i++) {
        const dockX = dockBaseX + i * dockTotalSpacing + centerOffset;
        const dock = this.scene.add.rectangle(dockX, dockY, dockWidth, dockWidth, 0x444444, 0.6);
        dock.setOrigin(0, 0);
        dock.setStrokeStyle(2, 0x888888);
        this.container.add(dock);
      }
    }

    // Add icon sprite at BOTTOM
    if (this.config.iconKey) {
      try {
        const icon = this.scene.add.image(0, iconY, this.config.iconKey);
        icon.setOrigin(0, 1); // Bottom-left anchor (iOS style)
        icon.setScale(1); // Don't scale - icons are already correct size
        this.container.add(icon);
      } catch (error) {
        console.warn(`Failed to load icon ${this.config.iconKey} for ${this.config.label}:`, error);
      }
    }
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  public destroy(): void {
    this.container.destroy();
  }
}
