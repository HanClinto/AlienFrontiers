import { createGameSnapshot, restoreGameSnapshot } from "./game-persistence.js";

export class GameHistory {
  constructor() {
    this.undoSnapshot = null;
    this.redoSnapshot = null;
  }

  get canUndo() {
    return this.undoSnapshot !== null;
  }

  get canRedo() {
    return this.redoSnapshot !== null;
  }

  createUndoPoint(state) {
    this.undoSnapshot = createGameSnapshot(state);
    this.redoSnapshot = null;
  }

  clear() {
    this.undoSnapshot = null;
    this.redoSnapshot = null;
  }

  undo(state) {
    if (!this.undoSnapshot) {
      return null;
    }
    this.redoSnapshot = createGameSnapshot(state);
    const restored = restoreGameSnapshot(this.undoSnapshot);
    this.undoSnapshot = null;
    restored.history = this;
    return restored;
  }

  redo(state) {
    if (!this.redoSnapshot) {
      return null;
    }
    this.undoSnapshot = createGameSnapshot(state);
    const restored = restoreGameSnapshot(this.redoSnapshot);
    this.redoSnapshot = null;
    restored.history = this;
    return restored;
  }
}