export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(name, listener) {
    const listeners = this.listeners.get(name) ?? new Set();
    listeners.add(listener);
    this.listeners.set(name, listeners);
    return () => listeners.delete(listener);
  }

  post(name, object) {
    for (const listener of this.listeners.get(name) ?? []) {
      listener({ name, object });
    }
  }
}