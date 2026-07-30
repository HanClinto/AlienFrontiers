import { CCNode, CCSprite } from "./core.js";

export class CCMenuItemImage extends CCSprite {
  constructor(normalImage, selectedImage, callback, disabledImage = null) {
    super(normalImage);
    this.normalImage = normalImage;
    this.selectedImage = selectedImage;
    this.disabledImage = disabledImage;
    this.callback = callback;
    this.interactive = true;
    this.isMenuItem = true;
    this.touchPriority = -128;
    this.enabled = true;
    this.selected = false;
  }

  activate() {
    this.callback?.(this);
  }

  draw(context) {
    const previousImage = this.image;
    this.image = !this.enabled && this.disabledImage
      ? this.disabledImage
      : this.selected ? this.selectedImage : this.normalImage;
    super.draw(context);
    this.image = previousImage;
  }
}

export class CCMenu extends CCNode {}