import { CCSpriteFrame } from "./core.js";

function valueAfterKey(dictionary, keyName) {
  const children = [...dictionary.children];
  const keyIndex = children.findIndex(
    (child) => child.tagName === "key" && child.textContent.trim() === keyName,
  );
  return keyIndex === -1 ? null : children[keyIndex + 1];
}

function parseRect(rectangle) {
  const values = rectangle.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
  if (!values || values.length !== 4) {
    throw new Error(`Invalid Cocos texture rectangle: ${rectangle}`);
  }
  return { x: values[0], y: values[1], width: values[2], height: values[3] };
}

export class CCSpriteFrameCache {
  constructor(assets) {
    this.assets = assets;
    this.frames = new Map();
  }

  async addSpriteFramesWithFile(plistFile, textureFile) {
    const [plist, texture] = await Promise.all([
      this.assets.loadText(plistFile),
      this.assets.loadImage(textureFile),
    ]);
    const documentNode = new DOMParser().parseFromString(plist, "application/xml");
    const parserError = documentNode.querySelector("parsererror");
    if (parserError) {
      throw new Error(`Unable to parse ${plistFile}: ${parserError.textContent}`);
    }
    const rootDictionary = documentNode.querySelector("plist > dict");
    const framesDictionary = valueAfterKey(rootDictionary, "frames");
    const children = [...framesDictionary.children];
    for (let index = 0; index < children.length; index += 2) {
      const frameName = children[index].textContent.trim();
      const frameDictionary = children[index + 1];
      const textureRect = valueAfterKey(frameDictionary, "textureRect").textContent;
      this.frames.set(frameName, { texture, sourceRect: parseRect(textureRect) });
    }
  }

  spriteFrameByName(frameName) {
    const frame = this.frames.get(frameName);
    if (!frame) {
      throw new Error(`Unknown sprite frame: ${frameName}`);
    }
    return new CCSpriteFrame(frame.texture, frame.sourceRect);
  }
}