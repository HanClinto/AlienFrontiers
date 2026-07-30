import { createGameSnapshot, restoreGameSnapshot } from "./game-persistence.js";

function checkpoint(savedCheckpoint) {
  if (!savedCheckpoint) {
    return null;
  }
  return savedCheckpoint.snapshot
    ? savedCheckpoint
    : { snapshot: savedCheckpoint, previous: null };
}

export class GameHistory {
  constructor(savedHistory = null) {
    this.undoSnapshot = checkpoint(savedHistory?.undoSnapshot);
    this.redoSnapshot = checkpoint(savedHistory?.redoSnapshot);
  }

  get canUndo() {
    return this.undoSnapshot !== null;
  }

  get canRedo() {
    return this.redoSnapshot !== null;
  }

  createUndoPoint(state) {
    this.undoSnapshot = {
      snapshot: createGameSnapshot(state),
      previous: this.undoSnapshot,
    };
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
    this.redoSnapshot = {
      snapshot: createGameSnapshot(state),
      previous: this.redoSnapshot,
    };
    const restored = restoreGameSnapshot(this.undoSnapshot.snapshot);
    this.undoSnapshot = this.undoSnapshot.previous;
    restored.history = this;
    return restored;
  }

  redo(state) {
    if (!this.redoSnapshot) {
      return null;
    }
    this.undoSnapshot = {
      snapshot: createGameSnapshot(state),
      previous: this.undoSnapshot,
    };
    const restored = restoreGameSnapshot(this.redoSnapshot.snapshot);
    this.redoSnapshot = this.redoSnapshot.previous;
    restored.history = this;
    return restored;
  }
}