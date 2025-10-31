/**
 * Turn Controls UI Component
 * Displays current turn phase and provides controls for phase transitions
 * Phase 5: Task 5
 */

import { GamePhase, TurnPhase } from '../game/types';

export class TurnControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  
  // UI elements
  private phaseText: Phaser.GameObjects.Text;
  private turnText: Phaser.GameObjects.Text;
  private activePlayerText: Phaser.GameObjects.Text;
  private rollButton: Phaser.GameObjects.Rectangle | null = null;
  private rollButtonText: Phaser.GameObjects.Text | null = null;
  private endTurnButton: Phaser.GameObjects.Rectangle | null = null;
  private endTurnButtonText: Phaser.GameObjects.Text | null = null;
  
  // Callbacks
  private onRollDice: (() => void) | null = null;
  private onEndTurn: (() => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    onRollDice?: () => void,
    onEndTurn?: () => void
  ) {
    this.scene = scene;
    this.onRollDice = onRollDice || null;
    this.onEndTurn = onEndTurn || null;
    
    this.container = scene.add.container(x, y);
    
    // Background panel
    const bg = scene.add.rectangle(0, 0, 400, 250, 0x1a1a2e, 0.9);
    bg.setStrokeStyle(3, 0x00ff00);
    this.container.add(bg);
    
    // Title
    const title = scene.add.text(0, -100, 'TURN CONTROLS', {
      fontSize: '20px',
      color: '#00ff00',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.container.add(title);
    
    // Phase display
    this.phaseText = scene.add.text(0, -60, 'Phase: ROLL DICE', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    this.phaseText.setOrigin(0.5);
    this.container.add(this.phaseText);
    
    // Turn counter
    this.turnText = scene.add.text(0, -35, 'Turn: 1', {
      fontSize: '16px',
      color: '#cccccc',
      fontFamily: 'Arial'
    });
    this.turnText.setOrigin(0.5);
    this.container.add(this.turnText);
    
    // Active player
    this.activePlayerText = scene.add.text(0, -10, 'Active: Player 1', {
      fontSize: '16px',
      color: '#ffcc00',
      fontFamily: 'Arial'
    });
    this.activePlayerText.setOrigin(0.5);
    this.container.add(this.activePlayerText);
    
    // Roll dice button
    this.createRollButton();
    
    // End turn button
    this.createEndTurnButton();
  }
  
  /**
   * Create roll dice button
   */
  private createRollButton(): void {
    const buttonY = 40;
    
    this.rollButton = this.scene.add.rectangle(0, buttonY, 180, 50, 0x00aa00);
    this.rollButton.setStrokeStyle(2, 0x00ff00);
    this.rollButton.setInteractive({ useHandCursor: true });
    
    this.rollButtonText = this.scene.add.text(0, buttonY, 'ROLL DICE', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.rollButtonText.setOrigin(0.5);
    
    // Hover effects
    this.rollButton.on('pointerover', () => {
      if (this.rollButton && this.rollButton.fillColor === 0x00aa00) {
        this.rollButton.setFillStyle(0x00cc00);
      }
    });
    
    this.rollButton.on('pointerout', () => {
      if (this.rollButton && this.rollButton.fillColor === 0x00cc00) {
        this.rollButton.setFillStyle(0x00aa00);
      }
    });
    
    this.rollButton.on('pointerdown', () => {
      if (this.rollButton && this.rollButton.fillColor !== 0x555555) {
        if (this.onRollDice) {
          this.onRollDice();
        }
      }
    });
    
    this.container.add(this.rollButton);
    this.container.add(this.rollButtonText);
  }
  
  /**
   * Create end turn button
   */
  private createEndTurnButton(): void {
    const buttonY = 100;
    
    this.endTurnButton = this.scene.add.rectangle(0, buttonY, 180, 50, 0xaa0000);
    this.endTurnButton.setStrokeStyle(2, 0xff0000);
    this.endTurnButton.setInteractive({ useHandCursor: true });
    
    this.endTurnButtonText = this.scene.add.text(0, buttonY, 'END TURN', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    });
    this.endTurnButtonText.setOrigin(0.5);
    
    // Hover effects
    this.endTurnButton.on('pointerover', () => {
      if (this.endTurnButton && this.endTurnButton.fillColor === 0xaa0000) {
        this.endTurnButton.setFillStyle(0xcc0000);
      }
    });
    
    this.endTurnButton.on('pointerout', () => {
      if (this.endTurnButton && this.endTurnButton.fillColor === 0xcc0000) {
        this.endTurnButton.setFillStyle(0xaa0000);
      }
    });
    
    this.endTurnButton.on('pointerdown', () => {
      if (this.endTurnButton && this.endTurnButton.fillColor !== 0x555555) {
        if (this.onEndTurn) {
          this.onEndTurn();
        }
      }
    });
    
    this.container.add(this.endTurnButton);
    this.container.add(this.endTurnButtonText);
  }
  
  /**
   * Update display with current game phase
   */
  public updatePhase(phase: GamePhase, activePlayerName: string): void {
    // Update phase text
    const phaseNames: Record<TurnPhase, string> = {
      [TurnPhase.ROLL_DICE]: 'ROLL DICE',
      [TurnPhase.PLACE_SHIPS]: 'PLACE SHIPS',
      [TurnPhase.RESOLVE_ACTIONS]: 'RESOLVE ACTIONS',
      [TurnPhase.COLLECT_RESOURCES]: 'COLLECT RESOURCES',
      [TurnPhase.PURCHASE]: 'PURCHASE',
      [TurnPhase.END_TURN]: 'END TURN'
    };
    
    this.phaseText.setText(`Phase: ${phaseNames[phase.current]}`);
    this.turnText.setText(`Turn: ${phase.roundNumber}`);
    this.activePlayerText.setText(`Active: ${activePlayerName}`);
    
    // Update button states based on phase
    this.updateButtonStates(phase.current);
  }
  
  /**
   * Update button enabled/disabled states based on current phase
   */
  private updateButtonStates(currentPhase: TurnPhase): void {
    // Roll button only enabled in ROLL_DICE phase
    if (this.rollButton && this.rollButtonText) {
      if (currentPhase === TurnPhase.ROLL_DICE) {
        this.rollButton.setFillStyle(0x00aa00);
        this.rollButton.setInteractive();
        this.rollButtonText.setColor('#ffffff');
      } else {
        this.rollButton.setFillStyle(0x555555);
        this.rollButton.disableInteractive();
        this.rollButtonText.setColor('#888888');
      }
    }
    
    // End turn button enabled after dice are rolled
    if (this.endTurnButton && this.endTurnButtonText) {
      if (currentPhase === TurnPhase.ROLL_DICE || currentPhase === TurnPhase.END_TURN) {
        this.endTurnButton.setFillStyle(0x555555);
        this.endTurnButton.disableInteractive();
        this.endTurnButtonText.setColor('#888888');
      } else {
        this.endTurnButton.setFillStyle(0xaa0000);
        this.endTurnButton.setInteractive();
        this.endTurnButtonText.setColor('#ffffff');
      }
    }
  }
  
  /**
   * Get the container for adding to scene
   */
  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
  
  /**
   * Show or hide the controls
   */
  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }
  
  /**
   * Clean up
   */
  public destroy(): void {
    this.container.destroy();
  }
}
