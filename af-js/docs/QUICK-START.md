# Alien Frontiers - Developer Quick Start

## Phase 1: Core Game State (COMPLETE ✅)

### Quick Setup

```bash
cd af-js
npm install
npm test
```

All 58 tests should pass with 93.26% coverage.

---

## Core Architecture

### Game State Hierarchy

```
GameState (game-state.ts)
├── ShipManager (ship.ts)
│   └── Ship[] - 3 ships per player
├── PlayerManager (player.ts)
│   └── Player[] - 2-5 players
└── GamePhase (types.ts)
    ├── TurnPhase enum
    ├── activePlayerId
    └── roundNumber
```

### Key Classes

1. **GameState** - Main orchestrator
   - Coordinates all game components
   - Manages turn flow
   - Enforces game rules
   - Provides state cloning for AI

2. **ShipManager** - Ship operations
   - Roll dice for ships
   - Place ships at facilities
   - Lock/unlock ships
   - Track ship locations

3. **PlayerManager** - Player operations
   - Manage resources (ore, fuel, energy)
   - Track colonies and VP
   - Check win conditions
   - Handle turn order

---

## Usage Examples

### Initialize a Game

```typescript
import { GameState, PlayerColor } from './game';

const game = new GameState('game-1');

game.initializeGame([
  { id: 'p1', name: 'Alice', color: PlayerColor.RED },
  { id: 'p2', name: 'Bob', color: PlayerColor.BLUE }
]);
```

### Execute a Turn

```typescript
// Phase 1: Roll Dice
const rolls = game.rollDice(); // Returns [3, 5, 2]

// Phase 2: Place Ships
const shipManager = game.getShipManager();
const ships = shipManager.getPlayerShips('p1');

shipManager.placeShip(ships[0].id, 'solar_converter');
shipManager.placeShip(ships[1].id, 'lunar_mine');

// Lock ships to commit them
shipManager.lockShip(ships[0].id);
shipManager.lockShip(ships[1].id);

// Advance through remaining phases
game.advancePhase(); // RESOLVE_ACTIONS
game.advancePhase(); // COLLECT_RESOURCES
game.advancePhase(); // PURCHASE
game.advancePhase(); // END_TURN
game.advancePhase(); // Next player's ROLL_DICE
```

### Manage Resources

```typescript
const playerManager = game.getPlayerManager();

// Add resources
playerManager.addResources('p1', { ore: 3, fuel: 2 });

// Check affordability
if (playerManager.canAfford('p1', { ore: 2, fuel: 1 })) {
  playerManager.removeResources('p1', { ore: 2, fuel: 1 });
  // Purchase colony, etc.
}
```

### Track Victory

```typescript
// Add colony (1 VP)
playerManager.addColony('p1', ColonyLocation.ASIMOV_CRATER);

// Add alien tech (1 VP)
playerManager.addAlienTechCard('p1', 'tech-card-1');

// Check win condition
if (game.isGameOver()) {
  const winners = game.getWinners();
  console.log(`Winner: ${winners[0].name}`);
}
```

### Clone State for AI

```typescript
// Critical for AI lookahead
const clonedState = game.clone();

// AI can explore moves in cloned state
// without affecting the real game
clonedState.rollDice();
clonedState.advancePhase();

// Original game unchanged
const phase = game.getPhase();
console.log(phase.current); // Still ROLL_DICE
```

---

## Testing

### Run Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Test Structure

```
__tests__/
└── core/
    ├── ship.test.ts       (20 tests)
    ├── player.test.ts     (21 tests)
    └── game-state.test.ts (17 tests)
```

### Write a Test

```typescript
import { describe, test, expect } from '@jest/globals';
import { GameState, PlayerColor } from '../../src/game';

describe('My Feature', () => {
  test('should do something', () => {
    const game = new GameState('test-1');
    game.initializeGame([
      { id: 'p1', name: 'Alice', color: PlayerColor.RED }
    ]);
    
    expect(game.getAllPlayers()).toHaveLength(1);
  });
});
```

---

## Type Definitions

### Core Types (types.ts)

```typescript
enum TurnPhase {
  ROLL_DICE, PLACE_SHIPS, RESOLVE_ACTIONS,
  COLLECT_RESOURCES, PURCHASE, END_TURN
}

interface Resources {
  ore: number;
  fuel: number;
  energy: number;
}

type ShipLocation = 
  | 'solar_converter'
  | 'lunar_mine'
  | 'radon_collector'
  // ... more facilities
  | null;

type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;
```

### Ship Interface

```typescript
interface Ship {
  id: string;
  playerId: string;
  diceValue: DiceValue | null;
  location: ShipLocation;
  isLocked: boolean;
}
```

### Player Interface

```typescript
interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  resources: Resources;
  victoryPoints: VictoryPoints;
  colonies: ColonyLocation[];
  alienTechCards: string[];
  isAI: boolean;
  turnOrder: number;
}
```

---

## Game Flow

### Turn Phases (in order)

1. **ROLL_DICE** - Active player rolls 3 dice
2. **PLACE_SHIPS** - Place ships at facilities
3. **RESOLVE_ACTIONS** - Execute facility actions
4. **COLLECT_RESOURCES** - Collect from facilities
5. **PURCHASE** - Buy colonies/tech
6. **END_TURN** - Cleanup, next player

### Round Structure

```
Round 1:
  Player 1 → 6 phases
  Player 2 → 6 phases
  ...
  Player N → 6 phases

Round 2:
  Player 1 → 6 phases
  ...
```

---

## Key Rules Enforced

✅ Cannot roll dice outside ROLL_DICE phase  
✅ Cannot place ship without dice value  
✅ Cannot move locked ship  
✅ Resources only removed if sufficient  
✅ Cannot add duplicate colony  
✅ Game ends when any player reaches 8 VP  

---

## File Locations

### Source Code
- `src/game/types.ts` - Type definitions
- `src/game/ship.ts` - Ship management
- `src/game/player.ts` - Player management
- `src/game/game-state.ts` - Game orchestration
- `src/game/index.ts` - Module exports

### Tests
- `__tests__/core/` - Test files
- `jest.config.js` - Jest configuration

### Documentation
- `docs/PHASE-1-COMPLETE.md` - Phase 1 report
- `docs/test-scenarios/phase-1-scenarios.md` - Test scenarios

---

## Next Steps

Phase 1 is complete. Ready for Phase 2: Orbital Facilities.

See `.agents/implementation/phases-1-2-foundation.md` for Phase 2 details.

---

## Helpful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm test             # Run tests
npm run test:watch   # Watch mode

# Type checking
npx tsc --noEmit     # Check types without building

# Coverage
npm run test:coverage  # Generate coverage report
```

---

## Getting Help

- Phase 1 Documentation: `docs/PHASE-1-COMPLETE.md`
- Test Scenarios: `docs/test-scenarios/phase-1-scenarios.md`
- Implementation Plan: `.agents/implementation/`
- Agent Prompts: `.agents/01-game-state-agent.md`

---

*Last Updated: October 30, 2025*  
*Phase 1 Status: ✅ COMPLETE (93.26% coverage, 58/58 tests passing)*
