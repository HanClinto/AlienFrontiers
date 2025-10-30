export class MenuButton {
  private static readonly BUTTON_DEFAULT_COLOR = 0xcccccc;
  private static readonly BUTTON_HOVER_COLOR = 0xffffff;
  private static readonly BUTTON_PRESSED_COLOR = 0xaaaaaa;
  private static readonly BUTTON_STROKE_WIDTH = 4;
  private static readonly BUTTON_STROKE_COLOR = 0xffffff;

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
    this.rectangle = scene.add.rectangle(x, y, width, height, MenuButton.BUTTON_DEFAULT_COLOR);
    this.rectangle.setOrigin(0, 0);
    this.rectangle.setInteractive({ useHandCursor: true });
    this.rectangle.setStrokeStyle(MenuButton.BUTTON_STROKE_WIDTH, MenuButton.BUTTON_STROKE_COLOR);

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
      this.rectangle.setFillStyle(MenuButton.BUTTON_HOVER_COLOR);
    });

    this.rectangle.on('pointerout', () => {
      this.rectangle.setFillStyle(MenuButton.BUTTON_DEFAULT_COLOR);
    });

    this.rectangle.on('pointerdown', () => {
      this.rectangle.setFillStyle(MenuButton.BUTTON_PRESSED_COLOR);
    });

    this.rectangle.on('pointerup', () => {
      this.rectangle.setFillStyle(MenuButton.BUTTON_HOVER_COLOR);
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
