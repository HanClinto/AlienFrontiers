/**
 * ShipSprite - Visual representation of a game ship
 * 
 * Handles:
 * - Visual appearance (color, dice value)
 * - Drag-and-drop functionality
 * - Visual states (available, placed, locked)
 * - Snap-to-facility placement
 */

import * as Phaser from 'phaser';
import { Ship } from '../game/ship';
import { ShipLocation, DiceValue } from '../game/types';

/**
 * Visual state of a ship
 */
export enum ShipState {
  AVAILABLE = 'available',    // In player tray, can be dragged
  DRAGGING = 'dragging',       // Currently being dragged
  PLACED = 'placed',           // Placed at facility, not locked
  LOCKED = 'locked'            // Committed to facility, immovable
}

/**
 * Ship sprite class
 * Extends Phaser.GameObjects.Container to hold sprite + dice value
 */
export class ShipSprite extends Phaser.GameObjects.Container {
  private ship: Ship;
  private shipGraphic: Phaser.GameObjects.Graphics;
  private diceText: Phaser.GameObjects.Text;
  private shipState: ShipState;
  private playerColor: number;
  private originalX: number;
  private originalY: number;

  // Drag event callbacks
  public onDragStart?: () => void;
  public onDragEnd?: (location: ShipLocation | null) => void;
  public onValidatePlacement?: (x: number, y: number) => { valid: boolean; location: ShipLocation | null };

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    ship: Ship,
    playerColor: string
  ) {
    super(scene, x, y);
    
    this.ship = ship;
    this.shipState = ShipState.AVAILABLE;
    this.playerColor = Phaser.Display.Color.HexStringToColor(playerColor).color;
    this.originalX = x;
    this.originalY = y;

    // Create ship visual
    this.shipGraphic = scene.add.graphics();
    this.add(this.shipGraphic);

    // Create dice value text
    this.diceText = scene.add.text(0, 0, '', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.diceText.setOrigin(0.5, 0.5);
    this.add(this.diceText);

    // Initial draw
    this.drawShip();
    this.updateDiceValue();

    // Enable drag
    this.setupDragAndDrop();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Draw the ship graphic
   */
  private drawShip(): void {
    this.shipGraphic.clear();

    const color = this.getColorForState();
    const alpha = this.getAlphaForState();

    // Ship body (simple triangle/rocket shape)
    this.shipGraphic.fillStyle(color, alpha);
    this.shipGraphic.beginPath();
    this.shipGraphic.moveTo(0, -20); // Top point
    this.shipGraphic.lineTo(-12, 20); // Bottom left
    this.shipGraphic.lineTo(12, 20);  // Bottom right
    this.shipGraphic.closePath();
    this.shipGraphic.fillPath();

    // Outline
    this.shipGraphic.lineStyle(2, 0x000000, 1);
    this.shipGraphic.strokePath();

    // Wings
    this.shipGraphic.fillStyle(color, alpha * 0.8);
    this.shipGraphic.fillTriangle(-12, 0, -20, 10, -12, 10);
    this.shipGraphic.fillTriangle(12, 0, 20, 10, 12, 10);

    // Window/cockpit
    this.shipGraphic.fillStyle(0x88ccff, alpha);
    this.shipGraphic.fillCircle(0, -5, 6);
  }

  /**
   * Get color based on current state
   */
  private getColorForState(): number {
    switch (this.shipState) {
      case ShipState.DRAGGING:
        return Phaser.Display.Color.GetColor(255, 255, 100); // Yellow highlight
      case ShipState.LOCKED:
        return Phaser.Display.Color.GetColor(128, 128, 128); // Gray
      default:
        return this.playerColor;
    }
  }

  /**
   * Get alpha based on current state
   */
  private getAlphaForState(): number {
    switch (this.shipState) {
      case ShipState.AVAILABLE:
        return 1.0;
      case ShipState.DRAGGING:
        return 0.8;
      case ShipState.PLACED:
        return 0.9;
      case ShipState.LOCKED:
        return 0.6;
      default:
        return 1.0;
    }
  }

  /**
   * Setup drag-and-drop functionality
   */
  private setupDragAndDrop(): void {
    // Set interactive
    this.setSize(40, 40);
    this.setInteractive({ cursor: 'pointer' });

    // Enable drag
    this.scene.input.setDraggable(this);

    // Drag start
    this.on('dragstart', (_pointer: Phaser.Input.Pointer) => {
      if (this.shipState === ShipState.LOCKED) return;
      
      this.setShipState(ShipState.DRAGGING);
      this.setDepth(1000); // Bring to front
      
      if (this.onDragStart) {
        this.onDragStart();
      }
    });

    // Dragging
    this.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.x = dragX;
      this.y = dragY;
    });

    // Drag end
    this.on('dragend', (_pointer: Phaser.Input.Pointer) => {
      if (this.shipState === ShipState.LOCKED) return;

      // Validate placement
      let validPlacement = false;
      let location: ShipLocation | null = null;

      if (this.onValidatePlacement) {
        const result = this.onValidatePlacement(this.x, this.y);
        validPlacement = result.valid;
        location = result.location;
      }

      if (validPlacement && location) {
        // Valid placement
        this.setShipState(ShipState.PLACED);
        this.ship.location = location;
        
        if (this.onDragEnd) {
          this.onDragEnd(location);
        }
      } else {
        // Invalid placement - return to original position
        this.returnToOriginalPosition();
        
        if (this.onDragEnd) {
          this.onDragEnd(null);
        }
      }

      this.setDepth(0); // Return to normal depth
    });

    // Hover effect
    this.on('pointerover', () => {
      if (this.shipState !== ShipState.LOCKED) {
        this.setScale(1.1);
      }
    });

    this.on('pointerout', () => {
      this.setScale(1.0);
    });
  }

  /**
   * Update dice value display
   */
  private updateDiceValue(): void {
    if (this.ship.diceValue) {
      this.diceText.setText(this.ship.diceValue.toString());
      this.diceText.setVisible(true);
    } else {
      this.diceText.setVisible(false);
    }
  }

  /**
   * Set ship visual state
   */
  public setShipState(newState: ShipState): void {
    this.shipState = newState;
    this.drawShip();
    
    // Update interactive state
    if (newState === ShipState.LOCKED) {
      this.disableInteractive();
    } else {
      this.setInteractive({ cursor: 'pointer' });
    }
  }

  /**
   * Get current ship visual state
   */
  public getShipState(): ShipState {
    return this.shipState;
  }

  /**
   * Update from ship model
   */
  public updateFromShip(ship: Ship): void {
    this.ship = ship;
    this.updateDiceValue();

    // Update state based on ship data
    if (ship.isLocked) {
      this.setShipState(ShipState.LOCKED);
    } else if (ship.location !== null) {
      this.setShipState(ShipState.PLACED);
    } else if (this.shipState !== ShipState.DRAGGING) {
      this.setShipState(ShipState.AVAILABLE);
    }
  }

  /**
   * Get underlying ship model
   */
  public getShip(): Ship {
    return this.ship;
  }

  /**
   * Set dice value
   */
  public setDiceValue(value: DiceValue): void {
    this.ship.diceValue = value;
    this.updateDiceValue();
  }

  /**
   * Return to original position
   */
  public returnToOriginalPosition(): void {
    this.x = this.originalX;
    this.y = this.originalY;
    this.setShipState(ShipState.AVAILABLE);
    this.ship.location = null;
  }

  /**
   * Set original position (when ship is moved to new home)
   */
  public setOriginalPosition(x: number, y: number): void {
    this.originalX = x;
    this.originalY = y;
  }

  /**
   * Move ship to specific position
   */
  public moveShipTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * Lock ship in place
   */
  public lock(): void {
    this.ship.isLocked = true;
    this.setShipState(ShipState.LOCKED);
  }

  /**
   * Unlock ship
   */
  public unlock(): void {
    this.ship.isLocked = false;
    this.setShipState(ShipState.AVAILABLE);
  }

  /**
   * Clean up
   */
  public destroy(fromScene?: boolean): void {
    this.shipGraphic.destroy();
    this.diceText.destroy();
    super.destroy(fromScene);
  }
}
