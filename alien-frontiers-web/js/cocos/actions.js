import { ccp } from "./core.js";

class CCActionInterval {
  constructor(duration) {
    this.duration = Math.max(0, duration);
    this.elapsed = 0;
    this.done = false;
    this.target = null;
  }

  start(target) {
    this.target = target;
    this.elapsed = 0;
    this.done = false;
    this.onStart();
  }

  onStart() {}

  update() {}

  step(deltaTime) {
    const available = Math.max(0, this.duration - this.elapsed);
    const consumed = Math.min(deltaTime, available);
    this.elapsed += consumed;
    const progress = this.duration === 0 ? 1 : this.elapsed / this.duration;
    this.update(progress);
    this.done = this.elapsed >= this.duration;
    return deltaTime - consumed;
  }
}

export class CCMoveTo extends CCActionInterval {
  constructor(duration, position) {
    super(duration);
    this.endPosition = ccp(position.x, position.y);
  }

  onStart() {
    this.startPosition = ccp(this.target.position.x, this.target.position.y);
  }

  update(progress) {
    this.target.setPosition(
      this.startPosition.x + (this.endPosition.x - this.startPosition.x) * progress,
      this.startPosition.y + (this.endPosition.y - this.startPosition.y) * progress,
    );
  }
}

export class CCScaleTo extends CCActionInterval {
  constructor(duration, scaleX, scaleY = scaleX) {
    super(duration);
    this.endScaleX = scaleX;
    this.endScaleY = scaleY;
  }

  onStart() {
    this.startScaleX = this.target.scaleX;
    this.startScaleY = this.target.scaleY;
  }

  update(progress) {
    this.target.setScale(
      this.startScaleX + (this.endScaleX - this.startScaleX) * progress,
      this.startScaleY + (this.endScaleY - this.startScaleY) * progress,
    );
  }
}

export class CCRotateBy extends CCActionInterval {
  constructor(duration, angle) {
    super(duration);
    this.angle = angle;
  }

  onStart() {
    this.startRotation = this.target.rotation;
  }

  update(progress) {
    this.target.rotation = this.startRotation + this.angle * progress;
  }
}

export class CCDelayTime extends CCActionInterval {}

export class CCSequence {
  constructor(...actions) {
    this.actions = actions.flat();
    this.target = null;
    this.index = 0;
    this.done = false;
  }

  start(target) {
    this.target = target;
    this.index = 0;
    this.done = this.actions.length === 0;
    this.actions[0]?.start(target);
  }

  step(deltaTime) {
    let remaining = deltaTime;
    while (!this.done) {
      const action = this.actions[this.index];
      remaining = action.step(remaining);
      if (!action.done) {
        break;
      }
      this.index += 1;
      if (this.index >= this.actions.length) {
        this.done = true;
      } else {
        this.actions[this.index].start(this.target);
        if (remaining <= 0) {
          break;
        }
      }
    }
    return remaining;
  }
}

export class CCRepeatForever {
  constructor(action) {
    this.action = action;
    this.target = null;
    this.done = false;
  }

  start(target) {
    this.target = target;
    this.done = false;
    this.action.start(target);
  }

  step(deltaTime) {
    let remaining = this.action.step(deltaTime);
    if (this.action.done) {
      this.action.start(this.target);
      if (remaining > 0) {
        remaining = this.action.step(remaining);
      }
    }
    return remaining;
  }
}

export class CCEaseElasticInOut extends CCActionInterval {
  constructor(action, period = 0.3) {
    super(action.duration);
    this.action = action;
    this.period = period;
  }

  onStart() {
    this.action.start(this.target);
  }

  update(progress) {
    if (progress === 0 || progress === 1) {
      this.action.update(progress);
      return;
    }
    const doubled = progress * 2;
    const periodOffset = this.period / 4;
    const eased = doubled < 1
      ? -0.5 * 2 ** (10 * (doubled - 1))
        * Math.sin(((doubled - 1) - periodOffset) * Math.PI * 2 / this.period)
      : 2 ** (-10 * (doubled - 1))
        * Math.sin(((doubled - 1) - periodOffset) * Math.PI * 2 / this.period) * 0.5 + 1;
    this.action.update(eased);
  }
}

export class CCEaseElasticOut extends CCActionInterval {
  constructor(action, period = 0.3) {
    super(action.duration);
    this.action = action;
    this.period = period;
  }

  onStart() {
    this.action.start(this.target);
  }

  update(progress) {
    if (progress === 0 || progress === 1) {
      this.action.update(progress);
      return;
    }
    const periodOffset = this.period / 4;
    const eased = 2 ** (-10 * progress)
      * Math.sin((progress - periodOffset) * Math.PI * 2 / this.period) + 1;
    this.action.update(eased);
  }
}

export class CCEaseSineInOut extends CCActionInterval {
  constructor(action) {
    super(action.duration);
    this.action = action;
  }

  onStart() {
    this.action.start(this.target);
  }

  update(progress) {
    this.action.update(-(Math.cos(Math.PI * progress) - 1) / 2);
  }
}