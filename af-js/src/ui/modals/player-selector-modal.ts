import * as Phaser from 'phaser';
import { Player } from '../../game/player';

export type PlayerSelectorCallback = (playerId: string | null) => void;

export class PlayerSelectorModal extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private panel: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private callback: PlayerSelectorCallback | null = null;
  private buttonContainers: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2);
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x000000, 0.6);
    this.bg.fillRect(-scene.scale.width / 2, -scene.scale.height / 2, scene.scale.width, scene.scale.height);
    this.add(this.bg);

    this.panel = scene.add.graphics();
    const w = 700, h = 700;
    
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

    this.title = scene.add.text(0, -h / 2 + 40, 'Choose Player', { fontSize: '32px', color: '#ffffff' });
    this.title.setOrigin(0.5);
    this.add(this.title);

    this.setDepth(2000);
    this.setVisible(false);
    scene.add.existing(this);
  }

  show(players: Player[], callback: PlayerSelectorCallback) {
    this.callback = callback;
    // clear old buttons
    this.buttonContainers.forEach(b => b.destroy());
    this.buttonContainers = [];

    const startY = -240;
    players.forEach((p, i) => {
      const y = startY + i * 90;
      const container = this.createPlayerButton(p, 0, y);
      this.buttonContainers.push(container);
      this.add(container);
    });

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

  private createPlayerButton(player: Player, x: number, y: number) {
    const container = this.scene.add.container(x, y);
    const w = 600, h = 72;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x2d2d44, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    bg.lineStyle(2, 0x666666, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    container.add(bg);

    const nameText = this.scene.add.text(-w / 2 + 20, -10, player.name, { fontSize: '20px', color: '#ffffff' });
    container.add(nameText);

    const colorBox = this.scene.add.rectangle(w / 2 - 40, 0, 40, 40, Phaser.Display.Color.HexStringToColor(player.color).color);
    container.add(colorBox);

    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', () => {
      this.hide(player.id);
    });

    return container;
  }

  private hide(selected: string | null) {
    this.setVisible(false);
    if (this.callback) {
      this.callback(selected);
      this.callback = null;
    }
  }

  destroy(fromScene?: boolean) {
    this.buttonContainers.forEach(b => b.destroy());
    this.buttonContainers = [];
    super.destroy(fromScene);
  }
}
