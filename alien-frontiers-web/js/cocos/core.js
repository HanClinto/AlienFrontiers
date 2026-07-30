export const DESIGN_WIDTH = 768;
export const DESIGN_HEIGHT = 1024;

export function ccp(x, y) {
  return { x, y };
}

function multiply(left, right) {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    tx: left.a * right.tx + left.c * right.ty + left.tx,
    ty: left.b * right.tx + left.d * right.ty + left.ty,
  };
}

function invert(matrix) {
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
  if (Math.abs(determinant) < Number.EPSILON) {
    throw new Error("Cannot invert a zero-scale node transform");
  }

  return {
    a: matrix.d / determinant,
    b: -matrix.b / determinant,
    c: -matrix.c / determinant,
    d: matrix.a / determinant,
    tx: (matrix.c * matrix.ty - matrix.d * matrix.tx) / determinant,
    ty: (matrix.b * matrix.tx - matrix.a * matrix.ty) / determinant,
  };
}

function transformPoint(matrix, point) {
  return ccp(
    matrix.a * point.x + matrix.c * point.y + matrix.tx,
    matrix.b * point.x + matrix.d * point.y + matrix.ty,
  );
}

export class CCNode {
  constructor() {
    this.position = ccp(0, 0);
    this.anchorPoint = ccp(0, 0);
    this.contentSize = { width: 0, height: 0 };
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;
    this.opacity = 255;
    this.visible = true;
    this.parent = null;
    this.children = [];
    this.tag = undefined;
    this.zOrder = 0;
    this.touchPriority = 0;
    this._arrivalOrder = 0;
    this._nextArrivalOrder = 0;
    this._actions = [];
    this.clipRect = null;
  }

  setPosition(pointOrX, y) {
    this.position = typeof pointOrX === "number"
      ? ccp(pointOrX, y)
      : ccp(pointOrX.x, pointOrX.y);
    return this;
  }

  setAnchorPoint(point) {
    this.anchorPoint = ccp(point.x, point.y);
    return this;
  }

  setScale(scaleX, scaleY = scaleX) {
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    return this;
  }

  addChild(child, zOrder = 0, tag) {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    child.parent = this;
    child.zOrder = zOrder;
    child.tag = tag;
    child._arrivalOrder = this._nextArrivalOrder++;
    this.children.push(child);
    this.children.sort((left, right) =>
      left.zOrder - right.zOrder || left._arrivalOrder - right._arrivalOrder);
    return child;
  }

  removeChild(child) {
    const childIndex = this.children.indexOf(child);
    if (childIndex !== -1) {
      this.children.splice(childIndex, 1);
      child.parent = null;
    }
  }

  removeAllChildren() {
    for (const child of this.children) {
      child.parent = null;
    }
    this.children.length = 0;
  }

  getChildByTag(tag) {
    return this.children.find((child) => child.tag === tag) ?? null;
  }

  getNodeToParentTransform() {
    const radians = -this.rotation * Math.PI / 180;
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);
    const anchorX = this.anchorPoint.x * this.contentSize.width;
    const anchorY = this.anchorPoint.y * this.contentSize.height;

    const transform = {
      a: cosine * this.scaleX,
      b: sine * this.scaleX,
      c: -sine * this.scaleY,
      d: cosine * this.scaleY,
      tx: this.position.x,
      ty: this.position.y,
    };
    transform.tx -= transform.a * anchorX + transform.c * anchorY;
    transform.ty -= transform.b * anchorX + transform.d * anchorY;
    return transform;
  }

  getNodeToWorldTransform() {
    const localTransform = this.getNodeToParentTransform();
    return this.parent
      ? multiply(this.parent.getNodeToWorldTransform(), localTransform)
      : localTransform;
  }

  convertToWorldSpace(point) {
    return transformPoint(this.getNodeToWorldTransform(), point);
  }

  convertToNodeSpace(point) {
    return transformPoint(invert(this.getNodeToWorldTransform()), point);
  }

  containsWorldPoint(point) {
    if (!this.visible || this.contentSize.width <= 0 || this.contentSize.height <= 0) {
      return false;
    }
    const localPoint = this.convertToNodeSpace(point);
    return localPoint.x >= 0 && localPoint.x <= this.contentSize.width
      && localPoint.y >= 0 && localPoint.y <= this.contentSize.height;
  }

  findTopmostNodeAt(point, predicate = () => true) {
    const matches = [];
    this.collectNodesAt(point, predicate, matches);
    return matches.reduce((best, candidate) => {
      if (!best || candidate.touchPriority < best.touchPriority) {
        return candidate;
      }
      return candidate.touchPriority === best.touchPriority ? candidate : best;
    }, null);
  }

  collectNodesAt(point, predicate, matches) {
    if (!this.visible) {
      return;
    }
    if (this.clipRect) {
      const localPoint = this.convertToNodeSpace(point);
      if (
        localPoint.x < this.clipRect.x
        || localPoint.x > this.clipRect.x + this.clipRect.width
        || localPoint.y < this.clipRect.y
        || localPoint.y > this.clipRect.y + this.clipRect.height
      ) {
        return;
      }
    }
    if (predicate(this) && this.containsWorldPoint(point)) {
      matches.push(this);
    }
    for (const child of this.children) {
      child.collectNodesAt(point, predicate, matches);
    }
  }

  runAction(action) {
    action.start(this);
    this._actions.push(action);
    return action;
  }

  stopAllActions() {
    this._actions.length = 0;
  }

  update(deltaTime) {
    this._actions = this._actions.filter((action) => {
      action.step(deltaTime);
      return !action.done;
    });
    for (const child of this.children) {
      child.update(deltaTime);
    }
  }
}

export class CCLayer extends CCNode {}

export class CCScene extends CCNode {}

export class CCSprite extends CCNode {
  constructor(imageOrWidth = 0, height = 0) {
    super();
    this.anchorPoint = ccp(0.5, 0.5);
    this.color = { r: 255, g: 255, b: 255 };
    if (typeof imageOrWidth === "number") {
      this.image = null;
      this.contentSize = { width: imageOrWidth, height };
    } else {
      this.image = imageOrWidth;
      this.sourceRect = null;
      this.contentSize = {
        width: imageOrWidth.naturalWidth || imageOrWidth.width,
        height: imageOrWidth.naturalHeight || imageOrWidth.height,
      };
    }
  }

  draw(context) {
    if (!this.image) {
      return;
    }
    const { width, height } = this.contentSize;
    context.save();
    if (this.color.r === this.color.g && this.color.g === this.color.b) {
      context.filter = `brightness(${this.color.r / 255})`;
    }
    context.scale(1, -1);
    if (this.sourceRect) {
      const { x, y, width: sourceWidth, height: sourceHeight } = this.sourceRect;
      context.drawImage(
        this.image,
        x,
        y,
        sourceWidth,
        sourceHeight,
        0,
        -height,
        width,
        height,
      );
    } else {
      context.drawImage(this.image, 0, -height, width, height);
    }
    context.restore();
  }
}

export class CCSpriteFrame extends CCSprite {
  constructor(image, sourceRect) {
    super(sourceRect.width, sourceRect.height);
    this.image = image;
    this.sourceRect = sourceRect;
  }
}

export class CCLayerColor extends CCLayer {
  constructor(color, width = DESIGN_WIDTH, height = DESIGN_HEIGHT) {
    super();
    this.color = color;
    this.contentSize = { width, height };
  }

  draw(context) {
    context.fillStyle = this.color;
    context.fillRect(0, 0, this.contentSize.width, this.contentSize.height);
  }
}

export class CCLabelTTF extends CCNode {
  constructor(text, fontName, fontSize, color = "#fff", options = {}) {
    super();
    this.text = String(text);
    this.fontName = fontName;
    this.fontSize = fontSize;
    this.color = color;
    this.dimensions = options.dimensions ?? null;
    this.maxWidth = options.maxWidth ?? null;
    this.horizontalAlignment = options.horizontalAlignment ?? "center";
    this.verticalAlignment = options.verticalAlignment ?? "center";
    this.renderFontSize = fontSize;
    this.anchorPoint = ccp(0.5, 0.5);
    this._measure();
  }

  setString(text) {
    this.text = String(text);
    this._measure();
  }

  _measure() {
    const fallbackWidth = Math.max(1, this.text.length * this.fontSize * 0.62);
    const fallbackMetrics = {
      width: fallbackWidth,
      ascent: this.fontSize * 0.8,
      descent: this.fontSize * 0.2,
    };
    if (typeof document === "undefined") {
      const scale = this.maxWidth && fallbackWidth > this.maxWidth
        ? this.maxWidth / fallbackWidth
        : 1;
      this.renderFontSize = this.fontSize * scale;
      this.textMetrics = {
        width: fallbackMetrics.width * scale,
        ascent: fallbackMetrics.ascent * scale,
        descent: fallbackMetrics.descent * scale,
      };
      this.contentSize = this.dimensions
        ? { ...this.dimensions }
        : { width: this.textMetrics.width, height: this.renderFontSize };
      return;
    }
    const context = document.createElement("canvas").getContext("2d");
    context.font = `${this.fontSize}px "${this.fontName}"`;
    const initialMetrics = context.measureText(this.text);
    const scale = this.maxWidth && initialMetrics.width > this.maxWidth
      ? this.maxWidth / initialMetrics.width
      : 1;
    this.renderFontSize = this.fontSize * scale;
    context.font = `${this.renderFontSize}px "${this.fontName}"`;
    const metrics = context.measureText(this.text);
    this.textMetrics = {
      width: Math.max(1, metrics.width),
      ascent: metrics.actualBoundingBoxAscent || fallbackMetrics.ascent * scale,
      descent: metrics.actualBoundingBoxDescent || fallbackMetrics.descent * scale,
    };
    this.contentSize = this.dimensions
      ? { ...this.dimensions }
      : {
        width: this.textMetrics.width,
        height: this.textMetrics.ascent + this.textMetrics.descent,
      };
  }

  draw(context) {
    context.save();
    context.translate(0, this.contentSize.height);
    context.scale(1, -1);
    context.fillStyle = this.color;
    context.font = `${this.renderFontSize}px "${this.fontName}"`;
    context.textAlign = this.horizontalAlignment;
    context.textBaseline = "alphabetic";
    const x = this.horizontalAlignment === "left"
      ? 0
      : this.horizontalAlignment === "right" ? this.contentSize.width : this.contentSize.width / 2;
    const textHeight = this.textMetrics.ascent + this.textMetrics.descent;
    const top = this.verticalAlignment === "top"
      ? 0
      : this.verticalAlignment === "bottom"
        ? this.contentSize.height - textHeight
        : (this.contentSize.height - textHeight) / 2;
    context.fillText(this.text, x, top + this.textMetrics.ascent);
    context.restore();
  }
}
