import * as Phaser from 'phaser';

export type ResourcePickerSelection = { ore: number; fuel: number; energy: number };
export type ResourcePickerCallback = (selection: ResourcePickerSelection | null) => void;

export class ResourcePickerModal extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private panel: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private callback: ResourcePickerCallback | null = null;
  private oreAmount = 0;
  private fuelAmount = 0;
  private energyAmount = 0;
  private oreText!: Phaser.GameObjects.Text;
  private fuelText!: Phaser.GameObjects.Text;
  private energyText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2);
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x000000, 0.6);
    this.bg.fillRect(-scene.scale.width / 2, -scene.scale.height / 2, scene.scale.width, scene.scale.height);
    this.add(this.bg);

    this.panel = scene.add.graphics();
    const w = 600, h = 420;
    
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

    this.title = scene.add.text(0, -h / 2 + 40, 'Choose Resources', { fontSize: '28px', color: '#ffffff' });
    this.title.setOrigin(0.5);
    this.add(this.title);

    // ore
    this.oreText = scene.add.text(-150, -40, 'Ore: 0', { fontSize: '20px', color: '#ffffff' });
    const orePlus = scene.add.text(-60, -40, '+', { fontSize: '28px', color: '#a6e22e' }).setInteractive();
    const oreMinus = scene.add.text(-90, -40, '−', { fontSize: '28px', color: '#ff6b6b' }).setInteractive();
    orePlus.on('pointerdown', () => { this.oreAmount++; this.updateTexts(); });
    oreMinus.on('pointerdown', () => { if (this.oreAmount>0) this.oreAmount--; this.updateTexts(); });
    this.add(this.oreText); this.add(orePlus); this.add(oreMinus);

    // fuel
    this.fuelText = scene.add.text(-150, 0, 'Fuel: 0', { fontSize: '20px', color: '#ffffff' });
    const fuelPlus = scene.add.text(-60, 0, '+', { fontSize: '28px', color: '#a6e22e' }).setInteractive();
    const fuelMinus = scene.add.text(-90, 0, '−', { fontSize: '28px', color: '#ff6b6b' }).setInteractive();
    fuelPlus.on('pointerdown', () => { this.fuelAmount++; this.updateTexts(); });
    fuelMinus.on('pointerdown', () => { if (this.fuelAmount>0) this.fuelAmount--; this.updateTexts(); });
    this.add(this.fuelText); this.add(fuelPlus); this.add(fuelMinus);

    // energy
    this.energyText = scene.add.text(-150, 40, 'Energy: 0', { fontSize: '20px', color: '#ffffff' });
    const energyPlus = scene.add.text(-60, 40, '+', { fontSize: '28px', color: '#a6e22e' }).setInteractive();
    const energyMinus = scene.add.text(-90, 40, '−', { fontSize: '28px', color: '#ff6b6b' }).setInteractive();
    energyPlus.on('pointerdown', () => { this.energyAmount++; this.updateTexts(); });
    energyMinus.on('pointerdown', () => { if (this.energyAmount>0) this.energyAmount--; this.updateTexts(); });
    this.add(this.energyText); this.add(energyPlus); this.add(energyMinus);

    // confirm/cancel
    const confirm = scene.add.text(140, 140, 'Confirm', { fontSize: '22px', color: '#ffffff', backgroundColor: '#4a90e2' }).setInteractive();
    const cancel = scene.add.text(-240, 140, 'Cancel', { fontSize: '22px', color: '#ffffff', backgroundColor: '#666666' }).setInteractive();
    confirm.on('pointerdown', () => { this.hide({ ore: this.oreAmount, fuel: this.fuelAmount, energy: this.energyAmount }); });
    cancel.on('pointerdown', () => { this.hide(null); });
    this.add(confirm); this.add(cancel);

    this.setDepth(2000);
    this.setVisible(false);
    scene.add.existing(this);
  }

  private updateTexts() {
    this.oreText.setText(`Ore: ${this.oreAmount}`);
    this.fuelText.setText(`Fuel: ${this.fuelAmount}`);
    this.energyText.setText(`Energy: ${this.energyAmount}`);
  }

  show(maxTotal?: number, callback?: ResourcePickerCallback) {
    // maxTotal is optional - not enforced in this simple UI yet
    this.callback = callback || null;
    this.oreAmount = 0; this.fuelAmount = 0; this.energyAmount = 0;
    this.updateTexts();
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

  private hide(selection: ResourcePickerSelection | null) {
    this.setVisible(false);
    if (this.callback) {
      this.callback(selection);
      this.callback = null;
    }
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
  }
}
