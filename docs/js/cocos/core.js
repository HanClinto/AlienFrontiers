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
    this._arrivalOrder = 0;
    this._nextArrivalOrder = 0;
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
    if (!this.visible) {
      return null;
    }
    for (let index = this.children.length - 1; index >= 0; index -= 1) {
      const match = this.children[index].findTopmostNodeAt(point, predicate);
      if (match) {
        return match;
      }
    }
    return predicate(this) && this.containsWorldPoint(point) ? this : null;
  }
}

export class CCLayer extends CCNode {}

export class CCScene extends CCNode {}

export class CCSprite extends CCNode {
  constructor(width = 0, height = 0) {
    super();
    this.anchorPoint = ccp(0.5, 0.5);
    this.contentSize = { width, height };
  }
}