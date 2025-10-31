/**
 * FacilitySprite - Interactive facility zones on the game board
 * 
 * Handles:
 * - Hover effects showing facility info
 * - Highlighting available facilities
 * - Ship placement validation
 * - Visual feedback for requirements
 */

import * as Phaser from 'phaser';
import { ShipLocation } from '../game/types';

/**
 * Facility information
 */
export interface FacilityInfo {
  location: ShipLocation;
  name: string;
  description: string;
  diceRequirements: string;
  effect: string;
  zone: Phaser.Geom.Rectangle;
}

/**
 * Facility data for each location
 */
export const FACILITY_DATA: Record<Exclude<ShipLocation, null>, FacilityInfo> = {
  'solar_converter': {
    location: 'solar_converter',
    name: 'Solar Converter',
    description: 'Convert energy to resources',
    diceRequirements: 'Any 1-3 dice',
    effect: 'Gain 1 fuel per die',
    zone: new Phaser.Geom.Rectangle(300, 200, 100, 80),
  },
  'lunar_mine': {
    location: 'lunar_mine',
    name: 'Lunar Mine',
    description: 'Extract ore from the moon',
    diceRequirements: 'Any 4-6 dice',
    effect: 'Gain 1 ore per die',
    zone: new Phaser.Geom.Rectangle(500, 200, 100, 80),
  },
  'radon_collector': {
    location: 'radon_collector',
    name: 'Radon Collector',
    description: 'Collect radon gas',
    diceRequirements: 'Pair of matching dice',
    effect: 'Gain 2 fuel',
    zone: new Phaser.Geom.Rectangle(700, 200, 100, 80),
  },
  'colony_constructor': {
    location: 'colony_constructor',
    name: 'Colony Constructor',
    description: 'Build colonies',
    diceRequirements: 'Combination adding to 6, 7, or 8',
    effect: 'Place 1 colony',
    zone: new Phaser.Geom.Rectangle(300, 400, 100, 80),
  },
  'colonist_hub': {
    location: 'colonist_hub',
    name: 'Colonist Hub',
    description: 'Recruit colonists',
    diceRequirements: 'Three or more matching dice',
    effect: 'Gain bonus colony placement',
    zone: new Phaser.Geom.Rectangle(500, 400, 100, 80),
  },
  'terraforming_station': {
    location: 'terraforming_station',
    name: 'Terraforming Station',
    description: 'Terraform territories',
    diceRequirements: 'Straight of 4+ dice',
    effect: 'Control territory',
    zone: new Phaser.Geom.Rectangle(700, 400, 100, 80),
  },
  'orbital_market': {
    location: 'orbital_market',
    name: 'Orbital Market',
    description: 'Trade resources',
    diceRequirements: 'Any die',
    effect: 'Trade ore/fuel or buy tech cards',
    zone: new Phaser.Geom.Rectangle(300, 600, 100, 80),
  },
  'alien_artifact': {
    location: 'alien_artifact',
    name: 'Alien Artifact',
    description: 'Acquire alien technology',
    diceRequirements: 'Three of a kind',
    effect: 'Draw tech card',
    zone: new Phaser.Geom.Rectangle(500, 600, 100, 80),
  },
  'maintenance_bay': {
    location: 'maintenance_bay',
    name: 'Maintenance Bay',
    description: 'Unlimited ship docking',
    diceRequirements: 'Any dice (forced placement)',
    effect: 'Safe storage for ships',
    zone: new Phaser.Geom.Rectangle(700, 600, 100, 80),
  },
  'shipyard': {
    location: 'shipyard',
    name: 'Shipyard',
    description: 'Build additional ships',
    diceRequirements: 'Two matching dice',
    effect: 'Build 4th/5th/6th ship',
    zone: new Phaser.Geom.Rectangle(900, 400, 100, 80),
  },
  'raiders_outpost': {
    location: 'raiders_outpost',
    name: "Raider's Outpost",
    description: 'Launch raids on other players',
    diceRequirements: 'Any die',
    effect: 'Steal resources or destroy colonies',
    zone: new Phaser.Geom.Rectangle(900, 200, 100, 80),
  },
};

/**
 * Facility sprite class
 * Represents an interactive facility zone on the game board
 */
export class FacilitySprite extends Phaser.GameObjects.Zone {
  private facilityInfo: FacilityInfo;
  private highlight: Phaser.GameObjects.Graphics;
  private tooltip: Phaser.GameObjects.Container | null = null;
  private isHovered: boolean = false;
  private isAvailable: boolean = true;

  constructor(
    scene: Phaser.Scene,
    facilityInfo: FacilityInfo
  ) {
    const zone = facilityInfo.zone;
    super(scene, zone.centerX, zone.centerY, zone.width, zone.height);
    
    this.facilityInfo = facilityInfo;
    
    // Create highlight graphics
    this.highlight = scene.add.graphics();
    this.highlight.setDepth(5); // Above board, below ships
    
    // Make zone interactive
    this.setInteractive({ cursor: 'pointer' });
    
    // Set up hover events
    this.setupHoverEvents();
    
    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Set up hover event handlers
   */
  private setupHoverEvents(): void {
    this.on('pointerover', () => {
      this.isHovered = true;
      this.showHighlight();
      this.showTooltip();
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.hideHighlight();
      this.hideTooltip();
    });
  }

  /**
   * Show facility highlight
   */
  private showHighlight(): void {
    this.highlight.clear();
    
    const zone = this.facilityInfo.zone;
    const color = this.isAvailable ? 0x00ff00 : 0xff0000;
    
    // Draw subtle border only (no fill)
    this.highlight.lineStyle(3, color, 0.5);
    this.highlight.strokeRect(zone.x, zone.y, zone.width, zone.height);
  }

  /**
   * Hide facility highlight
   */
  private hideHighlight(): void {
    this.highlight.clear();
  }

  /**
   * Show tooltip with facility info
   */
  private showTooltip(): void {
    if (this.tooltip) return; // Already showing
    
    const zone = this.facilityInfo.zone;
    
    // Create tooltip container
    this.tooltip = this.scene.add.container(zone.centerX, zone.y - 10);
    this.tooltip.setDepth(1000); // Always on top
    
    // Tooltip background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.fillRoundedRect(-100, -80, 200, 75, 5);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRoundedRect(-100, -80, 200, 75, 5);
    this.tooltip.add(bg);
    
    // Facility name
    const nameText = this.scene.add.text(0, -65, this.facilityInfo.name, {
      fontSize: '14px',
      color: '#ffff00',
      fontStyle: 'bold',
    });
    nameText.setOrigin(0.5, 0);
    this.tooltip.add(nameText);
    
    // Requirements
    const reqText = this.scene.add.text(0, -45, this.facilityInfo.diceRequirements, {
      fontSize: '11px',
      color: '#ffffff',
    });
    reqText.setOrigin(0.5, 0);
    this.tooltip.add(reqText);
    
    // Effect
    const effectText = this.scene.add.text(0, -28, this.facilityInfo.effect, {
      fontSize: '11px',
      color: '#88ff88',
    });
    effectText.setOrigin(0.5, 0);
    this.tooltip.add(effectText);
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }

  /**
   * Set facility availability
   */
  public setAvailable(available: boolean): void {
    this.isAvailable = available;
    if (this.isHovered) {
      this.showHighlight(); // Refresh highlight with new color
    }
  }

  /**
   * Get facility info
   */
  public getFacilityInfo(): FacilityInfo {
    return this.facilityInfo;
  }

  /**
   * Check if point is within facility zone
   */
  public containsPoint(x: number, y: number): boolean {
    return this.facilityInfo.zone.contains(x, y);
  }

  /**
   * Get the zone for adding to a container
   * Since Zone inherits from GameObject, it can be added to containers
   */
  public getContainer(): Phaser.GameObjects.GameObject {
    return this;
  }

  /**
   * Clean up
   */
  public destroy(fromScene?: boolean): void {
    this.hideTooltip();
    this.highlight.destroy();
    super.destroy(fromScene);
  }
}
