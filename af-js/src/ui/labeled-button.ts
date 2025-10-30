/**
 * LabeledButton - A button that uses pre-rendered image assets with a text label overlay
 */
export class LabeledButton {
  private normalImage: Phaser.GameObjects.Image;
  private pushedImage: Phaser.GameObjects.Image;
  private label: Phaser.GameObjects.Text;
  private container: Phaser.GameObjects.Container;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    normalImageKey: string,
    pushedImageKey: string,
    labelText: string,
    labelColor: string,
    fontSize: number,
    onClick: () => void
  ) {
    // Create container for the button
    this.container = scene.add.container(x, y);

    // Create the normal state image
    this.normalImage = scene.add.image(0, 0, normalImageKey);
    this.normalImage.setInteractive({ useHandCursor: true });

    // Create the pushed state image (initially hidden)
    this.pushedImage = scene.add.image(0, 0, pushedImageKey);
    this.pushedImage.setVisible(false);

    // Create the text label
    this.label = scene.add.text(0, 0, labelText, {
      color: labelColor,
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    this.label.setOrigin(0.5);

    // Add images and label to container
    this.container.add(this.normalImage);
    this.container.add(this.pushedImage);
    this.container.add(this.label);

    // Set up interaction handlers
    this.normalImage.on('pointerover', () => {
      // Subtle scale effect on hover
      scene.tweens.add({
        targets: this.container,
        scale: 1.05,
        duration: 100,
        ease: 'Power2'
      });
    });

    this.normalImage.on('pointerout', () => {
      // Reset scale
      scene.tweens.add({
        targets: this.container,
        scale: 1.0,
        duration: 100,
        ease: 'Power2'
      });
      // Show normal state
      this.normalImage.setVisible(true);
      this.pushedImage.setVisible(false);
    });

    this.normalImage.on('pointerdown', () => {
      // Show pushed state
      this.normalImage.setVisible(false);
      this.pushedImage.setVisible(true);
    });

    this.normalImage.on('pointerup', () => {
      // Show normal state
      this.normalImage.setVisible(true);
      this.pushedImage.setVisible(false);
      onClick();
    });
  }

  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  public destroy(): void {
    this.container.destroy();
  }

  public setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  public setText(text: string): void {
    this.label.setText(text);
  }

  public getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }
}
