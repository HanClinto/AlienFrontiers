/**
 * Turn Controls Tests
 * Phase 5: Task 5
 */

import { TurnControls } from '../../src/ui/turn-controls';
import { TurnPhase } from '../../src/game/types';

describe('TurnControls', () => {
  let scene: any;
  let turnControls: TurnControls;
  let onRollDiceMock: jest.Mock;
  let onEndTurnMock: jest.Mock;

  beforeEach(() => {
    // Create minimal Phaser scene mock
    scene = {
      add: {
        container: jest.fn().mockReturnValue({
          add: jest.fn(),
          setVisible: jest.fn(),
          destroy: jest.fn()
        }),
        rectangle: jest.fn().mockReturnValue({
          setStrokeStyle: jest.fn().mockReturnThis(),
          setInteractive: jest.fn().mockReturnThis(),
          disableInteractive: jest.fn().mockReturnThis(),
          setFillStyle: jest.fn().mockReturnThis(),
          on: jest.fn(),
          fillColor: 0x00aa00
        }),
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setText: jest.fn().mockReturnThis(),
          setColor: jest.fn().mockReturnThis()
        })
      }
    };

    onRollDiceMock = jest.fn();
    onEndTurnMock = jest.fn();

    turnControls = new TurnControls(
      scene as any,
      100,
      100,
      onRollDiceMock,
      onEndTurnMock
    );
  });

  describe('Initialization', () => {
    it('should create turn controls', () => {
      expect(turnControls).toBeDefined();
    });

    it('should create UI container', () => {
      expect(scene.add.container).toHaveBeenCalled();
    });

    it('should create buttons', () => {
      expect(scene.add.rectangle).toHaveBeenCalled();
      expect(scene.add.text).toHaveBeenCalled();
    });
  });

  describe('Phase Updates', () => {
    it('should update phase display', () => {
      const phase = {
        current: TurnPhase.ROLL_DICE,
        activePlayerId: 'player-1',
        roundNumber: 1
      };

      turnControls.updatePhase(phase, 'Player 1');
      
      // Should update text displays
      expect(scene.add.text).toHaveBeenCalled();
    });

    it('should handle all phase types', () => {
      const phases = [
        TurnPhase.ROLL_DICE,
        TurnPhase.PLACE_SHIPS,
        TurnPhase.RESOLVE_ACTIONS,
        TurnPhase.COLLECT_RESOURCES,
        TurnPhase.PURCHASE,
        TurnPhase.END_TURN
      ];

      phases.forEach(phaseType => {
        const phase = {
          current: phaseType,
          activePlayerId: 'player-1',
          roundNumber: 1
        };

        expect(() => {
          turnControls.updatePhase(phase, 'Player 1');
        }).not.toThrow();
      });
    });
  });

  describe('Visibility', () => {
    it('should be able to hide controls', () => {
      const container = turnControls.getContainer();
      turnControls.setVisible(false);
      
      expect(container.setVisible).toHaveBeenCalledWith(false);
    });

    it('should be able to show controls', () => {
      const container = turnControls.getContainer();
      turnControls.setVisible(true);
      
      expect(container.setVisible).toHaveBeenCalledWith(true);
    });
  });

  describe('Cleanup', () => {
    it('should destroy properly', () => {
      const container = turnControls.getContainer();
      turnControls.destroy();
      
      expect(container.destroy).toHaveBeenCalled();
    });
  });

  describe('Container Access', () => {
    it('should provide container access', () => {
      const container = turnControls.getContainer();
      expect(container).toBeDefined();
    });
  });
});
