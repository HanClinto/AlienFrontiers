/**
 * AIActionAnimator - Animates and visualizes AI player actions
 * 
 * Handles:
 * - AI thinking indicator
 * - Ship placement animation
 * - Resource gain/loss
 * - Colony placement
 * - Tech card usage
 * - Turn actions
 */

import * as Phaser from 'phaser';
import { NotificationManager, NotificationType } from './action-notification';

/**
 * AI thinking indicator
 */
export class AIThinkingIndicator extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private dots: Phaser.GameObjects.Text;
  private dotCount: number = 0;
  private animationTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, aiName: string) {
    super(scene, x, y);

    // Create background
    this.background = scene.add.graphics();
    this.background.fillStyle(0x0066aa, 0.9);
    this.background.fillRoundedRect(0, 0, 200, 50, 10);
    this.background.lineStyle(2, 0xffffff, 0.5);
    this.background.strokeRoundedRect(0, 0, 200, 50, 10);
    this.add(this.background);

    // Create text
    this.text = scene.add.text(10, 15, `${aiName} thinking`, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.add(this.text);

    // Create animated dots
    this.dots = scene.add.text(this.text.width + 15, 15, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.add(this.dots);

    // Animate dots
    this.animationTimer = scene.time.addEvent({
      delay: 500,
      callback: () => {
        this.dotCount = (this.dotCount + 1) % 4;
        this.dots.setText('.'.repeat(this.dotCount));
      },
      loop: true
    });

    // Add to scene
    scene.add.existing(this);

    // Pulse animation
    scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  /**
   * Clean up
   */
  public destroy(fromScene?: boolean): void {
    if (this.animationTimer) {
      this.animationTimer.remove();
      this.animationTimer = null;
    }
    super.destroy(fromScene);
  }
}

/**
 * AI action animator
 */
export class AIActionAnimator {
  private scene: Phaser.Scene;
  private notificationManager: NotificationManager;
  private thinkingIndicator: AIThinkingIndicator | null = null;
  private speedMultiplier: number = 1.0; // 1.0 = normal, 2.0 = 2x speed, etc.

  constructor(scene: Phaser.Scene, notificationManager: NotificationManager) {
    this.scene = scene;
    this.notificationManager = notificationManager;
  }

  /**
   * Set animation speed multiplier
   */
  public setSpeed(multiplier: number): void {
    this.speedMultiplier = Math.max(0.1, Math.min(5.0, multiplier));
  }

  /**
   * Get base delay adjusted for speed
   */
  private getDelay(baseDelay: number): number {
    return baseDelay / this.speedMultiplier;
  }

  /**
   * Show AI thinking indicator
   */
  public showThinking(aiName: string): void {
    if (this.thinkingIndicator) {
      this.thinkingIndicator.destroy();
    }

    const x = this.scene.cameras.main.width / 2 - 100;
    const y = 100;

    this.thinkingIndicator = new AIThinkingIndicator(this.scene, x, y, aiName);
  }

  /**
   * Hide AI thinking indicator
   */
  public hideThinking(): void {
    if (this.thinkingIndicator) {
      this.scene.tweens.add({
        targets: this.thinkingIndicator,
        alpha: 0,
        duration: this.getDelay(300),
        onComplete: () => {
          if (this.thinkingIndicator) {
            this.thinkingIndicator.destroy();
            this.thinkingIndicator = null;
          }
        }
      });
    }
  }

  /**
   * Animate dice roll by AI
   */
  public async animateDiceRoll(aiName: string, values: number[]): Promise<void> {
    this.notificationManager.show(
      `${aiName} rolled: ${values.join(', ')}`,
      NotificationType.AI_ACTION,
      this.getDelay(2000)
    );

    return new Promise(resolve => {
      this.scene.time.delayedCall(this.getDelay(1000), () => resolve());
    });
  }

  /**
   * Animate ship placement by AI
   */
  public async animateShipPlacement(
    aiName: string,
    location: string,
    diceValue: number
  ): Promise<void> {
    this.notificationManager.show(
      `${aiName} placed ship (${diceValue}) at ${location}`,
      NotificationType.AI_ACTION,
      this.getDelay(2500)
    );

    // TODO: Highlight the facility where ship was placed
    // Could add a glow effect to the facility sprite

    return new Promise(resolve => {
      this.scene.time.delayedCall(this.getDelay(800), () => resolve());
    });
  }

  /**
   * Animate resource gain by AI
   */
  public async animateResourceGain(
    aiName: string,
    resources: { ore?: number; fuel?: number }
  ): Promise<void> {
    const parts: string[] = [];
    if (resources.ore) parts.push(`${resources.ore} ore`);
    if (resources.fuel) parts.push(`${resources.fuel} fuel`);

    this.notificationManager.show(
      `${aiName} gained: ${parts.join(', ')}`,
      NotificationType.SUCCESS,
      this.getDelay(2000)
    );

    return new Promise(resolve => {
      this.scene.time.delayedCall(this.getDelay(600), () => resolve());
    });
  }

  /**
   * Animate colony placement by AI
   */
  public async animateColonyPlacement(
    aiName: string,
    territory: string
  ): Promise<void> {
    this.notificationManager.show(
      `${aiName} placed colony in ${territory}`,
      NotificationType.AI_ACTION,
      this.getDelay(2500)
    );

    // TODO: Animate the colony sprite appearing
    // Could use scale-up animation with bounce effect

    return new Promise(resolve => {
      this.scene.time.delayedCall(this.getDelay(1000), () => resolve());
    });
  }

  /**
   * Animate tech card usage by AI
   */
  public async animateTechCardUsage(
    aiName: string,
    cardName: string,
    effect: string
  ): Promise<void> {
    this.notificationManager.show(
      `${aiName} used ${cardName}`,
      NotificationType.AI_ACTION,
      this.getDelay(3000)
    );

    if (effect) {
      await this.delay(this.getDelay(500));
      this.notificationManager.show(
        effect,
        NotificationType.INFO,
        this.getDelay(2500)
      );
    }

    return new Promise(resolve => {
      this.scene.time.delayedCall(this.getDelay(1000), () => resolve());
    });
  }

  /**
   * Animate tech card draw by AI
   */
  public async animateTechCardDraw(
    aiName: string,
    cardName?: string
  ): Promise<void> {
    const message = cardName
      ? `${aiName} drew tech card: ${cardName}`
      : `${aiName} drew a tech card`;

    this.notificationManager.show(
      message,
      NotificationType.AI_ACTION,
      this.getDelay(2000)
    );

    return new Promise(resolve => {
      this.scene.time.delayedCall(this.getDelay(600), () => resolve());
    });
  }

  /**
   * Animate turn end by AI
   */
  public async animateTurnEnd(aiName: string): Promise<void> {
    this.notificationManager.show(
      `${aiName} ended turn`,
      NotificationType.INFO,
      this.getDelay(1500)
    );

    return new Promise(resolve => {
      this.scene.time.delayedCall(this.getDelay(500), () => resolve());
    });
  }

  /**
   * Animate generic AI action
   */
  public async animateAction(
    aiName: string,
    action: string,
    delay: number = 800
  ): Promise<void> {
    this.notificationManager.show(
      `${aiName}: ${action}`,
      NotificationType.AI_ACTION,
      this.getDelay(2000)
    );

    return new Promise(resolve => {
      this.scene.time.delayedCall(this.getDelay(delay), () => resolve());
    });
  }

  /**
   * Show error/warning notification
   */
  public showWarning(message: string, duration: number = 3000): void {
    this.notificationManager.show(
      message,
      NotificationType.WARNING,
      this.getDelay(duration)
    );
  }

  /**
   * Show success notification
   */
  public showSuccess(message: string, duration: number = 2000): void {
    this.notificationManager.show(
      message,
      NotificationType.SUCCESS,
      this.getDelay(duration)
    );
  }

  /**
   * Show info notification
   */
  public showInfo(message: string, duration: number = 2000): void {
    this.notificationManager.show(
      message,
      NotificationType.INFO,
      this.getDelay(duration)
    );
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.scene.time.delayedCall(ms, () => resolve());
    });
  }

  /**
   * Clear all notifications
   */
  public clearNotifications(): void {
    this.notificationManager.clearAll();
  }

  /**
   * Clean up
   */
  public destroy(): void {
    if (this.thinkingIndicator) {
      this.thinkingIndicator.destroy();
      this.thinkingIndicator = null;
    }
    this.notificationManager.clearAll();
  }
}
