export class AssetCache {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.images = new Map();
    this.textFiles = new Map();
  }

  async preloadImages(fileNames) {
    await Promise.all(fileNames.map((fileName) => this.loadImage(fileName)));
  }

  async loadImage(fileName) {
    if (this.images.has(fileName)) {
      return this.images.get(fileName);
    }
    const image = new Image();
    const loaded = new Promise((resolve, reject) => {
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error(`Unable to load ${fileName}`)), { once: true });
    });
    image.src = new URL(fileName, this.baseUrl).href;
    await loaded;
    this.images.set(fileName, image);
    return image;
  }

  image(fileName) {
    const image = this.images.get(fileName);
    if (!image) {
      throw new Error(`Image was not preloaded: ${fileName}`);
    }
    return image;
  }

  async loadText(fileName) {
    if (this.textFiles.has(fileName)) {
      return this.textFiles.get(fileName);
    }
    const response = await fetch(new URL(fileName, this.baseUrl));
    if (!response.ok) {
      throw new Error(`Unable to load ${fileName}: ${response.status}`);
    }
    const text = await response.text();
    this.textFiles.set(fileName, text);
    return text;
  }
}