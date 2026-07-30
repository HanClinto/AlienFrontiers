import { CCLayer, CCLabelTTF, CCNode, ccp } from "./cocos/core.js";
import { CCMenu, CCMenuItemImage } from "./cocos/menu.js";

export const ButtonTags = Object.freeze({
  sprite: 0,
  labelShadow: 1,
  label: 2,
});

export class AFLayer extends CCLayer {
  constructor(assets) {
    super();
    this.assets = assets;
  }

  buttonFromImage(upImage, downImage, callback, options = {}) {
    const button = new CCMenuItemImage(
      this.assets.image(upImage),
      this.assets.image(downImage),
      callback,
      options.inactiveImage ? this.assets.image(options.inactiveImage) : null,
    );
    const buttonMenu = new CCMenu();
    buttonMenu.addChild(button);

    const wrapper = new CCNode();
    wrapper.contentSize = { ...button.contentSize };
    wrapper.addChild(buttonMenu, ButtonTags.sprite, ButtonTags.sprite);

    if (options.label !== undefined) {
      if (options.textShadow) {
        const shadow = new CCLabelTTF(options.label, "DIN-Black", options.fontSize, "rgba(0,0,0,0.5)");
        shadow.setPosition(ccp(3, -1));
        wrapper.addChild(shadow, ButtonTags.labelShadow, ButtonTags.labelShadow);
      }
      const label = new CCLabelTTF(options.label, "DIN-Black", options.fontSize, options.fontColor ?? "#fff");
      label.setPosition(ccp(1, 1));
      wrapper.addChild(label, ButtonTags.label, ButtonTags.label);
    }
    return wrapper;
  }

  setButtonLabel(wrapper, caption) {
    wrapper.getChildByTag(ButtonTags.label)?.setString(caption);
    wrapper.getChildByTag(ButtonTags.labelShadow)?.setString(caption);
  }
}