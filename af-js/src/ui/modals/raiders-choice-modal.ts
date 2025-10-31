import * as Phaser from 'phaser';

export type RaidersChoiceCallback = (choice: 'resources' | 'tech' | null) => void;

export class RaidersChoiceModal extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private panel: Phaser.GameObjects.Graphics;
  private callback: RaidersChoiceCallback | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2);
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x000000, 0.6);
    this.bg.fillRect(-scene.scale.width / 2, -scene.scale.height / 2, scene.scale.width, scene.scale.height);
    this.add(this.bg);

    this.panel = scene.add.graphics();
    const w = 520, h = 320;
    
    // Outer glow effect
    this.panel.fillStyle(0x4a90e2, 0.15);
    this.panel.fillRoundedRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 16);
    
    // Main panel background
    this.panel.fillStyle(0x1b1b2f, 1);
    this.panel.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    
    // Gradient border effect
    this.panel.lineStyle(3, 0x4a90e2, 1);
    this.panel.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    
    // Inner highlight for depth
    this.panel.lineStyle(2, 0xffffff, 0.2);
    this.panel.strokeRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 10);
    
    this.add(this.panel);

    const title = scene.add.text(0, -h / 2 + 36, 'Raiders Outpost: Choose', { fontSize: '24px', color: '#ffffff' });
    title.setOrigin(0.5);
    this.add(title);

    const resBtn = scene.add.text(0, -20, 'Steal Resources', { fontSize: '22px', color: '#ffffff', backgroundColor: '#4caf50' }).setInteractive();
    resBtn.setOrigin(0.5);
    resBtn.on('pointerdown', () => { this.hide('resources'); });
    this.add(resBtn);

    const techBtn = scene.add.text(0, 60, 'Steal Tech Card', { fontSize: '22px', color: '#ffffff', backgroundColor: '#f39c12' }).setInteractive();
    techBtn.setOrigin(0.5);
    techBtn.on('pointerdown', () => { this.hide('tech'); });
    this.add(techBtn);

    const cancel = scene.add.text(0, 140, 'Cancel', { fontSize: '18px', color: '#ffffff', backgroundColor: '#888888' }).setInteractive();
    cancel.setOrigin(0.5);
    cancel.on('pointerdown', () => { this.hide(null); });
    this.add(cancel);

    this.setDepth(2000);
    this.setVisible(false);
    scene.add.existing(this);
  }

  show(callback: RaidersChoiceCallback) {
    this.callback = callback;
    this.setVisible(true);
    this.setAlpha(0);
    this.setScale(0.9);
    
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  private hide(choice: 'resources' | 'tech' | null) {
    this.setVisible(false);
    if (this.callback) {
      this.callback(choice);
      this.callback = null;
    }
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
  }
}
