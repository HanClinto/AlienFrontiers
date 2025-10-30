export class MenuButton {
  private rectangle: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    width: number = 400,
    height: number = 80
  ) {
    // Create rounded rectangle background
    this.rectangle = scene.add.rectangle(x, y, width, height, 0xcccccc);
    this.rectangle.setOrigin(0, 0);
    this.rectangle.setInteractive({ useHandCursor: true });
    this.rectangle.setStrokeStyle(4, 0xffffff);

    // Create text
    this.text = scene.add.text(x + width / 2, y + height / 2, text, {
      color: '#000000',
      fontSize: '42px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    this.text.setOrigin(0.5);

    // Add hover effects
    this.rectangle.on('pointerover', () => {
      this.rectangle.setFillStyle(0xffffff);
    });

    this.rectangle.on('pointerout', () => {
      this.rectangle.setFillStyle(0xcccccc);
    });

    this.rectangle.on('pointerdown', () => {
      this.rectangle.setFillStyle(0xaaaaaa);
    });

    this.rectangle.on('pointerup', () => {
      this.rectangle.setFillStyle(0xffffff);
      onClick();
    });
  }

  public setVisible(visible: boolean): void {
    this.rectangle.setVisible(visible);
    this.text.setVisible(visible);
  }

  public destroy(): void {
    this.rectangle.destroy();
    this.text.destroy();
  }
}
