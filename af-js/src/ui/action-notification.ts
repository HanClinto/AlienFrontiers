/**
 * ActionNotification - Floating notification for game actions
 * 
 * Displays messages for:
 * - AI actions
 * - Player actions
 * - Game events
 * - Turn changes
 */

import * as Phaser from 'phaser';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  AI_ACTION = 'ai_action'
}

/**
 * Individual notification sprite
 */
export class ActionNotification extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private messageText: Phaser.GameObjects.Text;
  private iconText: Phaser.GameObjects.Text;
  private lifetime: number;
  private fadeOutStarted: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    message: string,
    type: NotificationType = NotificationType.INFO,
    duration: number = 3000
  ) {
    super(scene, x, y);

    this.lifetime = duration;

    // Create background
    this.background = scene.add.graphics();
    this.add(this.background);

    // Determine colors based on type
    let bgColor: number;
    let icon: string;
    switch (type) {
      case NotificationType.SUCCESS:
        bgColor = 0x00aa00;
        icon = '✓';
        break;
      case NotificationType.WARNING:
        bgColor = 0xaa6600;
        icon = '⚠';
        break;
      case NotificationType.AI_ACTION:
        bgColor = 0x0066aa;
        icon = '🤖';
        break;
      case NotificationType.INFO:
      default:
        bgColor = 0x333333;
        icon = 'ℹ';
        break;
    }

    // Create icon
    this.iconText = scene.add.text(-5, 0, icon, {
      fontSize: '20px',
      color: '#ffffff'
    });
    this.iconText.setOrigin(0, 0.5);
    this.add(this.iconText);

    // Create message text
    this.messageText = scene.add.text(25, 0, message, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      wordWrap: { width: 350 }
    });
    this.messageText.setOrigin(0, 0.5);
    this.add(this.messageText);

    // Calculate background size based on text
    const padding = 15;
    const width = this.messageText.width + 40 + padding * 2;
    const height = Math.max(40, this.messageText.height + padding * 2);

    // Draw background
    this.background.fillStyle(bgColor, 0.9);
    this.background.fillRoundedRect(-padding, -height/2, width, height, 8);
    this.background.lineStyle(2, 0xffffff, 0.5);
    this.background.strokeRoundedRect(-padding, -height/2, width, height, 8);

    // Slide in animation
    this.setAlpha(0);
    this.x -= 50;
    scene.tweens.add({
      targets: this,
      alpha: 1,
      x: x,
      duration: 300,
      ease: 'Back.easeOut'
    });

    // Add to scene
    scene.add.existing(this);

    // Auto-remove after lifetime
    scene.time.delayedCall(this.lifetime, () => {
      this.fadeOut();
    });
  }

  /**
   * Fade out and destroy
   */
  private fadeOut(): void {
    if (this.fadeOutStarted) return;
    this.fadeOutStarted = true;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      x: this.x + 50,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.destroy();
      }
    });
  }

  /**
   * Manually dismiss notification
   */
  public dismiss(): void {
    this.fadeOut();
  }
}

/**
 * Notification manager - stacks notifications vertically
 */
export class NotificationManager {
  private scene: Phaser.Scene;
  private notifications: ActionNotification[] = [];
  private x: number;
  private startY: number;
  private spacing: number = 60;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.startY = y;
  }

  /**
   * Show a notification
   */
  public show(
    message: string,
    type: NotificationType = NotificationType.INFO,
    duration: number = 3000
  ): ActionNotification {
    // Calculate position (stack vertically)
    const y = this.startY + (this.notifications.length * this.spacing);

    const notification = new ActionNotification(
      this.scene,
      this.x,
      y,
      message,
      type,
      duration
    );

    this.notifications.push(notification);

    // Remove from tracking when destroyed
    notification.once('destroy', () => {
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
        this.repositionNotifications();
      }
    });

    return notification;
  }

  /**
   * Reposition notifications after one is removed
   */
  private repositionNotifications(): void {
    this.notifications.forEach((notification, index) => {
      const targetY = this.startY + (index * this.spacing);
      this.scene.tweens.add({
        targets: notification,
        y: targetY,
        duration: 300,
        ease: 'Quad.easeOut'
      });
    });
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    this.notifications.forEach(notification => notification.dismiss());
    this.notifications = [];
  }

  /**
   * Get notification count
   */
  public getCount(): number {
    return this.notifications.length;
  }
}
