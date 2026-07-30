import { DESIGN_HEIGHT, DESIGN_WIDTH, ccp } from "./core.js";

export class CCDirector {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha: false });
    this.scene = null;
    this._pressedNode = null;
    this._lastTimestamp = 0;
    this._frame = this._frame.bind(this);
    this._installPointerEvents();
  }

  runWithScene(scene) {
    this.replaceScene(scene);
    requestAnimationFrame(this._frame);
  }

  replaceScene(scene) {
    this.scene?.onExit?.();
    this.scene = scene;
    this.scene.onEnter?.();
  }

  convertToGL(clientX, clientY) {
    const bounds = this.canvas.getBoundingClientRect();
    return ccp(
      (clientX - bounds.left) * DESIGN_WIDTH / bounds.width,
      DESIGN_HEIGHT - (clientY - bounds.top) * DESIGN_HEIGHT / bounds.height,
    );
  }

  _installPointerEvents() {
    this.canvas.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      const point = this.convertToGL(event.clientX, event.clientY);
      this._pressedNode = this.scene?.findTopmostNodeAt(point, (node) => node.interactive) ?? null;
      if (this._pressedNode) {
        this._pressedNode.selected = true;
        this.canvas.setPointerCapture(event.pointerId);
      }
    });

    this.canvas.addEventListener("pointerup", (event) => {
      event.preventDefault();
      const point = this.convertToGL(event.clientX, event.clientY);
      const releasedNode = this.scene?.findTopmostNodeAt(point, (node) => node.interactive) ?? null;
      const pressedNode = this._pressedNode;
      if (pressedNode) {
        pressedNode.selected = false;
      }
      this._pressedNode = null;
      if (pressedNode && pressedNode === releasedNode && pressedNode.enabled) {
        pressedNode.activate();
      }
    });

    this.canvas.addEventListener("pointercancel", () => {
      if (this._pressedNode) {
        this._pressedNode.selected = false;
        this._pressedNode = null;
      }
    });
  }

  _frame(timestamp) {
    const deltaTime = this._lastTimestamp === 0
      ? 0
      : Math.min((timestamp - this._lastTimestamp) / 1000, 0.1);
    this._lastTimestamp = timestamp;
    this.scene?.update(deltaTime);
    this._render();
    requestAnimationFrame(this._frame);
  }

  _render() {
    const context = this.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#000033";
    context.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    context.setTransform(1, 0, 0, -1, 0, DESIGN_HEIGHT);
    if (this.scene) {
      this._renderNode(this.scene, 1);
    }
  }

  _renderNode(node, parentOpacity) {
    if (!node.visible) {
      return;
    }
    const context = this.context;
    const transform = node.getNodeToParentTransform();
    context.save();
    context.transform(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
    const opacity = parentOpacity * node.opacity / 255;
    context.globalAlpha = opacity;
    node.draw?.(context);
    for (const child of node.children) {
      this._renderNode(child, opacity);
    }
    context.restore();
  }
}