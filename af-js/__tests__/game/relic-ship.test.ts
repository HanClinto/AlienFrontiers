/**
 * Relic Ship Tests
 * Tests for Burroughs Desert bonus and Relic Ship mechanics
 */

import { GameState } from '../../src/game/game-state';
import { PlayerColor } from '../../src/game/types';

describe('Relic Ship (Burroughs Desert Bonus)', () => {
  let gameState: GameState;
  let player1Id: string;
  let player2Id: string;

  beforeEach(() => {
    gameState = new GameState('test-game');
    
    // Create two players
    player1Id = 'player1';
    player2Id = 'player2';
    
    gameState.initializeGame([
      { id: player1Id, name: 'Player 1', color: PlayerColor.RED },
      { id: player2Id, name: 'Player 2', color: PlayerColor.BLUE }
    ]);
  });

  test('cannot purchase Relic Ship without controlling Burroughs Desert', () => {
    const result = gameState.purchaseRelicShip(player1Id);
    expect(result.success).toBe(false);
    expect(result.message).toContain('control Burroughs Desert');
  });

  test('can purchase Relic Ship when controlling Burroughs Desert', () => {
    const players = gameState.getAllPlayers();
    const player1 = players.find(p => p.id === player1Id);
    expect(player1).toBeDefined();
    if (!player1) return;
    
    // Give resources for colony placement (3 ore + 1 fuel) and Relic Ship (1 ore + 1 fuel)
    player1.resources.fuel = 10;
    player1.resources.ore = 10;
    
    // Give player 1 control of Burroughs Desert
    gameState.placeColonyOnTerritory(player1Id, 'burroughs_desert');
    
    const result = gameState.purchaseRelicShip(player1Id);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Purchased Relic Ship');
    expect(player1.resources.fuel).toBe(8); // 10 - 1 (colony) - 1 (relic) = 8
    expect(player1.resources.ore).toBe(6); // 10 - 3 (colony) - 1 (relic) = 6
    
    // Check Relic Ship exists
    const relicShip = gameState.getShipManager().getRelicShip();
    expect(relicShip).toBeDefined();
    expect(relicShip?.playerId).toBe(player1Id);
    expect(relicShip?.isRelicShip).toBe(true);
  });

  test('cannot purchase Relic Ship without sufficient resources', () => {
    const players = gameState.getAllPlayers();
    const player1 = players.find(p => p.id === player1Id);
    expect(player1).toBeDefined();
    if (!player1) return;
    
    // Give resources for colony placement only
    player1.resources.fuel = 1;
    player1.resources.ore = 3;
    
    // Give player 1 control of Burroughs Desert
    gameState.placeColonyOnTerritory(player1Id, 'burroughs_desert');
    
    // Now player has no resources left for Relic Ship
    
    const result = gameState.purchaseRelicShip(player1Id);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Insufficient resources');
  });

  test('cannot purchase Relic Ship if already owned', () => {
    const players = gameState.getAllPlayers();
    const player1 = players.find(p => p.id === player1Id);
    expect(player1).toBeDefined();
    if (!player1) return;
    
    player1.resources.fuel = 10;
    player1.resources.ore = 10;
    
    // Give player 1 control of Burroughs Desert
    gameState.placeColonyOnTerritory(player1Id, 'burroughs_desert');
    
    // First purchase succeeds
    const result1 = gameState.purchaseRelicShip(player1Id);
    expect(result1.success).toBe(true);
    
    // Second purchase fails
    const result2 = gameState.purchaseRelicShip(player1Id);
    expect(result2.success).toBe(false);
    expect(result2.message).toContain('already has');
  });

  test('Relic Ship returns to territory when losing control of Burroughs Desert', () => {
    const players = gameState.getAllPlayers();
    const player1 = players.find(p => p.id === player1Id);
    expect(player1).toBeDefined();
    if (!player1) return;
    
    player1.resources.fuel = 10;
    player1.resources.ore = 10;
    
    // Give player 1 control of Burroughs Desert (1 colony)
    gameState.placeColonyOnTerritory(player1Id, 'burroughs_desert');
    
    // Purchase Relic Ship
    gameState.purchaseRelicShip(player1Id);
    expect(gameState.getShipManager().playerHasRelicShip(player1Id)).toBe(true);
    
    // Player 2 places colony on Burroughs Desert (now tied, neither controls)
    const player2 = players.find(p => p.id === player2Id);
    expect(player2).toBeDefined();
    if (!player2) return;
    
    player2.resources.fuel = 10;
    player2.resources.ore = 10;
    gameState.placeColonyOnTerritory(player2Id, 'burroughs_desert');
    
    // Player 1 should have lost Relic Ship
    expect(gameState.getShipManager().playerHasRelicShip(player1Id)).toBe(false);
    
    // Relic Ship should be available for repurchase
    const relicShip = gameState.getShipManager().getRelicShip();
    expect(relicShip).toBeDefined();
    expect(relicShip?.playerId).toBe(''); // No owner
  });

  test('Relic Ship from Terraforming Station returns to Burroughs Desert', () => {
    const players = gameState.getAllPlayers();
    const player1 = players.find(p => p.id === player1Id);
    expect(player1).toBeDefined();
    if (!player1) return;
    
    player1.resources.fuel = 10;
    player1.resources.ore = 10;
    
    // Give player 1 control of Burroughs Desert
    gameState.placeColonyOnTerritory(player1Id, 'burroughs_desert');
    
    // Purchase Relic Ship
    gameState.purchaseRelicShip(player1Id);
    const relicShip = gameState.getShipManager().getRelicShip();
    expect(relicShip).toBeDefined();
    if (!relicShip) return;
    
    // Simulate using Relic Ship at Terraforming Station
    relicShip.diceValue = 6;
    relicShip.location = 'terraforming_station';
    
    // Return ship to stock (Terraforming Station effect)
    gameState.getShipManager().returnShipToStock(relicShip.id);
    
    // Relic Ship should still exist but not owned by player
    const relicAfter = gameState.getShipManager().getRelicShip();
    expect(relicAfter).toBeDefined();
    expect(relicAfter?.playerId).toBe(''); // Returned to territory
    expect(relicAfter?.isRelicShip).toBe(true);
  });

  test('Relic Ship can be repurchased after returning to territory', () => {
    const players = gameState.getAllPlayers();
    const player1 = players.find(p => p.id === player1Id);
    expect(player1).toBeDefined();
    if (!player1) return;
    
    player1.resources.fuel = 10;
    player1.resources.ore = 10;
    
    // Give player 1 control of Burroughs Desert
    gameState.placeColonyOnTerritory(player1Id, 'burroughs_desert');
    
    // Purchase Relic Ship
    gameState.purchaseRelicShip(player1Id);
    
    // Manually return Relic Ship to territory
    gameState.returnRelicShipToTerritory(player1Id);
    expect(gameState.getShipManager().playerHasRelicShip(player1Id)).toBe(false);
    
    // Repurchase should work
    const result = gameState.purchaseRelicShip(player1Id);
    expect(result.success).toBe(true);
    expect(gameState.getShipManager().playerHasRelicShip(player1Id)).toBe(true);
  });

  test('Relic Ship is colorless and has special isRelicShip flag', () => {
    const players = gameState.getAllPlayers();
    const player1 = players.find(p => p.id === player1Id);
    expect(player1).toBeDefined();
    if (!player1) return;
    
    player1.resources.fuel = 10;
    player1.resources.ore = 10;
    
    // Give player 1 control of Burroughs Desert
    gameState.placeColonyOnTerritory(player1Id, 'burroughs_desert');
    
    // Purchase Relic Ship
    gameState.purchaseRelicShip(player1Id);
    
    const relicShip = gameState.getShipManager().getRelicShip();
    expect(relicShip).toBeDefined();
    expect(relicShip?.id).toBe('relic-ship');
    expect(relicShip?.isRelicShip).toBe(true);
    expect(relicShip?.playerId).toBe(player1Id);
  });
});
