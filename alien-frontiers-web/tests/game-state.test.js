import assert from "node:assert/strict";
import test from "node:test";

import { AIType } from "../js/game/constants.js";
import { GameState } from "../js/game/game-state.js";
import { SimpleAI } from "../js/game/simple-ai.js";
import { TECH_CARD_DEFINITIONS, TechCardType } from "../js/game/tech-card.js";

function sequenceRandom(values) {
  let index = 0;
  return () => values[index++ % values.length];
}

test("initializes original player resources, colonies, and starting ships", () => {
  const state = new GameState(4, [AIType.human, AIType.easy, AIType.medium, AIType.hard]);

  assert.deepEqual(
    state.players.map((player) => [player.fuel, player.ore, player.coloniesLeft]),
    [[0, 0, 6], [1, 0, 6], [0, 1, 6], [1, 1, 6]],
  );
  assert.deepEqual(state.players.map((player) => player.activeShips.length), [3, 3, 3, 3]);
  assert.equal(state.players[0].numUndockedShips, 3);
  assert.deepEqual(state.players.slice(1).map((player) => player.numUndockedShips), [0, 0, 0]);
});

test("plays a deterministic turn through original Solar and Maintenance rules", () => {
  const state = new GameState(
    2,
    [AIType.human, AIType.human],
    sequenceRandom([0, 0.2, 0.99]),
  );
  const playerOne = state.currentPlayer;

  assert.equal(state.rollCurrentPlayerShips(), true);
  assert.deepEqual(playerOne.activeShips.map((ship) => ship.value), [1, 2, 6]);
  assert.equal(playerOne.initialRollDone, true);

  state.toggleShipSelection(playerOne.activeShips[0]);
  state.toggleShipSelection(playerOne.activeShips[2]);
  assert.equal(state.commitSelectedShips(state.solarConverter), true);
  assert.equal(playerOne.fuel, 4);
  assert.equal(playerOne.numUndockedShips, 1);
  assert.equal(playerOne.selectedShips.length, 0);

  state.toggleShipSelection(playerOne.activeShips[1]);
  assert.equal(state.commitSelectedShips(state.maintenanceBay), true);
  assert.equal(state.canEndTurn, true);
  assert.equal(state.gotoNextPlayer(), true);

  assert.equal(state.currentPlayerIndex, 1);
  assert.equal(state.currentPlayer.numUndockedShips, 3);
  assert.equal(state.currentPlayer.initialRollDone, false);
  assert.equal(playerOne.initialRollDone, false);
});

test("Lunar Mine enforces opponents' high die and awards one ore per ship", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const [playerOne, playerTwo] = state.players;
  const opponentShip = playerTwo.activeShips[0];
  opponentShip.value = 5;
  state.lunarMine.dockShip(opponentShip);

  playerOne.initialRollDone = true;
  playerOne.activeShips[0].value = 4;
  playerOne.activeShips[1].value = 5;
  state.toggleShipSelection(playerOne.activeShips[0]);
  assert.equal(state.commitSelectedShips(state.lunarMine), false);
  playerOne.activeShips[0].toggleSelect();
  state.toggleShipSelection(playerOne.activeShips[1]);
  assert.equal(state.commitSelectedShips(state.lunarMine), true);
  assert.equal(playerOne.ore, 1);
});

test("Shipyard requires a payable pair and activates the next ship", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  player.fuel = 1;
  player.ore = 1;
  player.initialRollDone = true;
  player.activeShips[0].value = 3;
  player.activeShips[1].value = 3;
  state.toggleShipSelection(player.activeShips[0]);
  state.toggleShipSelection(player.activeShips[1]);

  assert.equal(state.commitSelectedShips(state.shipyard), true);
  assert.equal(player.fuel, 0);
  assert.equal(player.ore, 0);
  assert.equal(player.activeShips.length, 4);
  assert.equal(player.activeShips[3].docked, true);
  assert.equal(player.activeShips[3].dock.orbital, state.maintenanceBay);
  assert.deepEqual(state.shipyard.docks.map((dock) => dock.dockedShip?.value), [3, 3]);
});

test("original SimpleAI fallback completes a turn with available facilities", () => {
  const state = new GameState(
    2,
    [AIType.easy, AIType.human],
    sequenceRandom([0, 0.2, 0.99]),
  );

  for (let step = 0; step < 8 && state.currentPlayerIndex === 0; step += 1) {
    SimpleAI.step(state);
  }

  assert.equal(state.currentPlayerIndex, 1);
  assert.equal(state.players[0].ore, 2);
  assert.equal(state.players[0].fuel, 3);
  assert.equal(state.players[0].numUndockedShips, 0);
  assert.equal(state.currentPlayer.numUndockedShips, 3);
});

test("local input cannot select ships during an AI turn", () => {
  const state = new GameState(2, [AIType.easy, AIType.human]);
  const ship = state.currentPlayer.activeShips[0];
  state.currentPlayer.initialRollDone = true;

  assert.equal(state.toggleShipSelection(ship), false);
  assert.equal(ship.isSelected, false);
});

test("Orbital Market sets a pair price, trades fuel for ore, and resets", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.fuel = 4;
  player.activeShips[0].value = 2;
  player.activeShips[1].value = 2;
  state.toggleShipSelection(player.activeShips[0]);
  state.toggleShipSelection(player.activeShips[1]);

  assert.equal(state.commitSelectedShips(state.orbitalMarket), true);
  assert.equal(player.marketPrice, 2);
  assert.equal(player.ableToMarketTrade, true);
  assert.equal(player.doMarketTrade(), true);
  assert.deepEqual([player.fuel, player.ore], [2, 1]);

  player.endTurnCleanup();
  assert.equal(player.marketPrice, 0);
  assert.equal(player.ableToMarketTrade, false);
});

test("regions resolve majority ties and colony victory points", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const region = state.heinleinPlains;

  assert.equal(region.playerWithMajority, -1);
  region.addColony(0);
  assert.equal(region.playerWithMajority, 0);
  assert.equal(state.players[0].vps, 2);
  region.addColony(1);
  assert.equal(region.playerWithMajority, -1);
  assert.deepEqual(state.players.map((player) => player.vps), [1, 1]);
  region.hasPositronField = true;
  region.addColony(0);
  assert.equal(state.players[0].vps, 4);
});

test("Colony Constructor queues and lands a colony before turn end", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.ore = 3;
  for (const ship of player.activeShips) {
    ship.value = 4;
    state.toggleShipSelection(ship);
  }

  assert.equal(state.commitSelectedShips(state.colonyConstructor), true);
  assert.equal(player.ore, 0);
  assert.equal(player.coloniesToLaunch, 1);
  assert.equal(state.canEndTurn, false);
  state.bradburyPlateau.hasRepulsorField = true;
  assert.equal(state.selectRegion(state.bradburyPlateau), false);
  assert.equal(state.selectRegion(state.heinleinPlains), true);
  assert.equal(player.coloniesToLaunch, 0);
  assert.equal(player.coloniesLeft, 7);
  assert.equal(state.heinleinPlains.coloniesForPlayer(0), 1);
  assert.equal(player.vps, 2);
  assert.equal(state.canEndTurn, true);
});

test("Bradbury control reduces Colony Constructor ore cost", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  state.bradburyPlateau.addColony(0);
  player.initialRollDone = true;
  player.ore = 2;
  for (const ship of player.activeShips) {
    ship.value = 5;
    state.toggleShipSelection(ship);
  }

  assert.equal(state.commitSelectedShips(state.colonyConstructor), true);
  assert.equal(player.ore, 0);
});

test("SimpleAI uses Colony Constructor and lands its pending colony", () => {
  const state = new GameState(2, [AIType.easy, AIType.human], () => 0.4);
  const player = state.currentPlayer;
  player.ore = 3;

  SimpleAI.step(state);
  SimpleAI.step(state);

  assert.deepEqual(player.activeShips.map((ship) => ship.value), [3, 3, 3]);
  assert.equal(player.ore, 0);
  assert.equal(player.coloniesToLaunch, 0);
  assert.equal(player.coloniesLeft, 7);
  assert.equal(state.heinleinPlains.coloniesForPlayer(0), 1);
  assert.equal(player.vps, 2);
});

test("builds, shuffles, deals, and displays the exact 20-card tech deck", () => {
  const state = new GameState(4, [AIType.human, AIType.human, AIType.human, AIType.human], Math.random, () => 0.25);
  const expectedCounts = Object.fromEntries(TECH_CARD_DEFINITIONS.map(({ type, count }) => [type, count]));
  const actualCounts = Object.fromEntries(TECH_CARD_DEFINITIONS.map(({ type }) => [
    type,
    state.allTech.filter((card) => card.type === type).length,
  ]));

  assert.equal(state.allTech.length, 20);
  assert.deepEqual(actualCounts, expectedCounts);
  assert.deepEqual(state.allTech.map((card) => card.cardID), Array.from({ length: 20 }, (_, index) => index));
  assert.deepEqual(state.players.map((player) => player.cards.length), [1, 1, 1, 1]);
  assert.equal(state.techDisplayDeck.length, 3);
  assert.equal(state.techDrawDeck.length, 13);
  assert.equal(new Set([
    ...state.players.flatMap((player) => player.cards),
    ...state.techDisplayDeck,
    ...state.techDrawDeck,
  ]).size, 20);
});

test("Alien City and Monument add passive victory points", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  player.cards = [];
  player.addCard(state.allTech.find((card) => card.type === TechCardType.alienCity));
  player.addCard(state.allTech.find((card) => card.type === TechCardType.alienMonument));

  assert.equal(player.vps, 2);
});

test("Resource Cache resolves odd, even, and tied initial rolls", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const cache = state.allTech.find((card) => card.type === TechCardType.resourceCache);
  player.cards = [];
  player.addCard(cache);
  player.activeShips[0].value = 1;
  player.activeShips[1].value = 2;
  player.activeShips[2].value = 3;
  player.applyResourceCache();
  assert.deepEqual([player.ore, player.fuel], [1, 0]);

  player.activeShips.push(player.inactiveShips.shift());
  player.activeShips[3].active = true;
  player.activeShips[3].value = 4;
  player.applyResourceCache();
  assert.deepEqual([player.ore, player.fuel], [2, 1]);
  assert.equal(player.cards.includes(cache), false);
  assert.equal(state.techDiscardDeck.includes(cache), true);
});

test("Alien Artifact turns dice into credit and purchases a displayed card", () => {
  const state = new GameState(2, [AIType.human, AIType.human], Math.random, () => 0.25);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.activeShips[0].value = 3;
  player.activeShips[1].value = 5;
  state.toggleShipSelection(player.activeShips[0]);
  state.toggleShipSelection(player.activeShips[1]);

  assert.equal(state.commitSelectedShips(state.alienArtifact), true);
  assert.equal(player.artifactCreditAvailable, 8);
  assert.equal(player.artifactShufflesAvailable, 2);
  const card = state.techDisplayDeck[0];
  const drawCount = state.techDrawDeck.length;
  assert.equal(player.canPurchaseCard(card), true);
  assert.equal(player.purchaseCard(card), true);
  assert.equal(card.owner, player);
  assert.equal(player.cards.includes(card), true);
  assert.equal(state.techDisplayDeck.length, 3);
  assert.equal(state.techDrawDeck.length, drawCount - 1);
  assert.equal(player.artifactCreditAvailable, 0);
  assert.equal(player.artifactShufflesAvailable, 0);
});

test("Alien Artifact rejects duplicate purchases and cycles the display", () => {
  const state = new GameState(2, [AIType.human, AIType.human], Math.random, () => 0.25);
  const player = state.currentPlayer;
  const displayedWithDuplicate = state.techDisplayDeck.find((displayed) =>
    state.allTech.some((card) => card !== displayed && card.type === displayed.type));
  const duplicate = state.allTech.find((card) =>
    card !== displayedWithDuplicate && card.type === displayedWithDuplicate.type);
  player.cards = [];
  player.addCard(duplicate);
  player.artifactCreditAvailable = 8;
  assert.equal(player.canPurchaseCard(displayedWithDuplicate), false);

  const previousDisplay = [...state.techDisplayDeck];
  player.artifactShufflesAvailable = 1;
  assert.equal(player.shuffleCards(), true);
  assert.equal(player.artifactShufflesAvailable, 0);
  assert.equal(state.techDisplayDeck.length, 3);
  assert.equal(previousDisplay.every((card) => state.techDiscardDeck.includes(card)), true);

  player.artifactCreditAvailable = 10;
  player.artifactShufflesAvailable = 2;
  player.endTurnCleanup();
  assert.equal(player.artifactCreditAvailable, 0);
  assert.equal(player.artifactShufflesAvailable, 0);
});

test("Raiders Outpost requires and displaces with a higher straight", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const [raider, victim] = state.players;
  raider.initialRollDone = true;
  [1, 2, 3].forEach((value, index) => {
    raider.activeShips[index].value = value;
    state.toggleShipSelection(raider.activeShips[index]);
  });
  assert.equal(state.commitSelectedShips(state.raidersOutpost), true);
  assert.equal(raider.isRaiding, true);
  assert.deepEqual(state.raidersOutpost.docks.map((dock) => dock.dockedShip.value), [1, 2, 3]);

  raider.isRaiding = false;
  state.currentPlayerIndex = 1;
  victim.gatherShips();
  victim.initialRollDone = true;
  [2, 3, 4].forEach((value, index) => {
    victim.activeShips[index].value = value;
    state.toggleShipSelection(victim.activeShips[index]);
  });
  assert.equal(state.commitSelectedShips(state.raidersOutpost), true);
  assert.deepEqual(state.raidersOutpost.docks.map((dock) => dock.dockedShip.value), [2, 3, 4]);
  assert.equal(raider.activeShips.every((ship) => ship.dock?.orbital === state.maintenanceBay), true);
});

test("resource raids cap at four and finish when scarce resources are exhausted", () => {
  const state = new GameState(3, [AIType.human, AIType.human, AIType.human]);
  const [raider, victimOne, victimTwo] = state.players;
  victimOne.ore = 2;
  victimOne.fuel = 1;
  victimTwo.ore = 1;
  victimTwo.fuel = 3;
  raider.startRaid();
  assert.equal(raider.adjustRaidResource(victimOne, "ore", 1), true);
  assert.equal(raider.adjustRaidResource(victimOne, "ore", 1), true);
  assert.equal(raider.adjustRaidResource(victimOne, "fuel", 1), true);
  assert.equal(raider.adjustRaidResource(victimTwo, "ore", 1), true);
  assert.equal(raider.adjustRaidResource(victimTwo, "fuel", 1), false);
  assert.equal(raider.raidSelectionComplete, true);
  assert.equal(raider.finishRaid(), true);
  assert.deepEqual([raider.ore, raider.fuel], [3, 1]);
  assert.deepEqual([victimOne.ore, victimOne.fuel, victimTwo.ore], [0, 0, 0]);

  victimOne.ore = 1;
  victimOne.fuel = 0;
  victimTwo.ore = 0;
  victimTwo.fuel = 0;
  raider.startRaid();
  raider.adjustRaidResource(victimOne, "ore", 1);
  assert.equal(raider.raidSelectionComplete, true);
});

test("Holographic Decoy blocks resources and is the only raidable card", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const [raider, victim] = state.players;
  const decoy = state.allTech.find((card) => card.type === TechCardType.holographicDecoy);
  const other = state.allTech.find((card) => card.type === TechCardType.boosterPod);
  raider.cards = [];
  victim.cards = [];
  victim.addCard(decoy);
  victim.addCard(other);
  victim.ore = 4;
  raider.startRaid();
  assert.equal(raider.adjustRaidResource(victim, "ore", 1), false);
  assert.equal(raider.selectRaidCard(other), false);
  assert.equal(raider.selectRaidCard(decoy), true);
  assert.equal(raider.finishRaid(), true);
  assert.equal(decoy.owner, raider);
  assert.equal(victim.cards.includes(decoy), false);
});

test("SimpleAI uses a straight and resolves its raid", () => {
  const state = new GameState(2, [AIType.easy, AIType.human], () => 0.2);
  const [raider, victim] = state.players;
  victim.ore = 2;
  victim.fuel = 2;
  SimpleAI.step(state);
  assert.deepEqual(raider.activeShips.map((ship) => ship.value), [2, 2, 2]);
  raider.activeShips[0].value = 1;
  raider.activeShips[1].value = 2;
  raider.activeShips[2].value = 3;
  SimpleAI.step(state);
  assert.equal(raider.isRaiding, true);
  SimpleAI.step(state);
  assert.equal(raider.isRaiding, false);
  assert.deepEqual([raider.ore, raider.fuel], [2, 2]);
  assert.deepEqual([victim.ore, victim.fuel], [0, 0]);
});

test("Booster, Stasis, and Polarity target one legal undocked ship", () => {
  const cases = [
    [TechCardType.boosterPod, 5, 6],
    [TechCardType.stasisBeam, 2, 1],
    [TechCardType.polarityDevice, 2, 5],
  ];
  for (const [type, startValue, expectedValue] of cases) {
    const state = new GameState(2, [AIType.human, AIType.human]);
    const player = state.currentPlayer;
    const card = state.allTech.find((candidate) => candidate.type === type);
    player.cards = [];
    player.addCard(card);
    player.fuel = 1;
    player.initialRollDone = true;
    player.activeShips[0].value = startValue;
    assert.equal(state.selectTechCard(card), true);
    assert.equal(state.beginTechPower(card), true);
    assert.equal(state.canEndTurn, false);
    assert.equal(state.usePendingTechOnShip(player.activeShips[0]), true);
    assert.equal(player.activeShips[0].value, expectedValue);
    assert.equal(player.fuel, 0);
    assert.equal(card.tapped, true);
    assert.equal(state.pendingTechCard, null);
  }
});

test("active tech powers reject illegal ships and honor Pohl discount", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const booster = state.allTech.find((card) => card.type === TechCardType.boosterPod);
  player.cards = [];
  player.addCard(booster);
  player.initialRollDone = true;
  player.activeShips[0].value = 6;
  player.activeShips[1].value = 4;
  state.maintenanceBay.dockShip(player.activeShips[1]);
  player.fuel = 0;
  assert.equal(state.beginTechPower(booster), false);

  state.pohlFoothills.addColony(0);
  player.activeShips[1].undock();
  assert.equal(booster.adjustedFuelCost, 0);
  assert.equal(state.beginTechPower(booster), true);
  assert.equal(state.usePendingTechOnShip(player.activeShips[0]), false);
  assert.equal(state.usePendingTechOnShip(player.activeShips[1]), true);
  assert.equal(player.activeShips[1].value, 5);
  player.endTurnCleanup();
  assert.equal(booster.tapped, false);
  assert.equal(player.selectedCard, null);
});

test("Gravity Manipulator raises then lowers two different legal ships", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const gravity = state.allTech.find((card) => card.type === TechCardType.gravityManipulator);
  player.cards = [];
  player.addCard(gravity);
  player.fuel = 2;
  player.initialRollDone = true;
  player.activeShips[0].value = 4;
  player.activeShips[1].value = 3;

  assert.equal(state.beginTechPower(gravity), true);
  assert.equal(state.usePendingTechOnShip(player.activeShips[0]), true);
  assert.equal(state.pendingTechTargets[0], player.activeShips[0]);
  assert.equal(state.usePendingTechOnShip(player.activeShips[0]), false);
  assert.equal(state.usePendingTechOnShip(player.activeShips[1]), true);
  assert.deepEqual(player.activeShips.slice(0, 2).map((ship) => ship.value), [5, 2]);
  assert.equal(player.fuel, 0);
  assert.equal(gravity.tapped, true);
  assert.equal(state.pendingTechCard, null);
});

test("Booster removes fields while Stasis and Gravity move their fields", () => {
  const cases = [
    [TechCardType.stasisBeam, "hasIsolationField"],
    [TechCardType.gravityManipulator, "hasRepulsorField"],
  ];
  for (const [type, field] of cases) {
    const state = new GameState(2, [AIType.human, AIType.human]);
    const player = state.currentPlayer;
    const card = state.allTech.find((candidate) => candidate.type === type);
    player.cards = [];
    player.addCard(card);
    state.heinleinPlains[field] = true;
    assert.equal(state.beginTechDiscard(card), true);
    assert.equal(state.selectRegion(state.pohlFoothills), true);
    assert.equal(state.heinleinPlains[field], false);
    assert.equal(state.pohlFoothills[field], true);
    assert.equal(player.cards.includes(card), false);
    assert.equal(state.techDiscardDeck.includes(card), true);
    assert.equal(player.techsDiscarded, 1);
  }

  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const booster = state.allTech.find((card) => card.type === TechCardType.boosterPod);
  player.cards = [];
  player.addCard(booster);
  state.asimovCrater.hasPositronField = true;
  state.asimovCrater.hasRepulsorField = true;
  state.asimovCrater.hasIsolationField = true;
  state.beginTechDiscard(booster);
  state.selectRegion(state.asimovCrater);
  assert.deepEqual([
    state.asimovCrater.hasPositronField,
    state.asimovCrater.hasRepulsorField,
    state.asimovCrater.hasIsolationField,
  ], [false, false, false]);
  assert.equal(state.beginTechDiscard(state.allTech.find((card) => card.type === TechCardType.stasisBeam)), false);
});

test("Colonist Hub advances private tracks with Asimov bonus and launches overflow", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  state.asimovCrater.addColony(0);
  state.colonistHub.colonyPositions[0] = 5;
  player.initialRollDone = true;
  player.ore = 1;
  player.fuel = 1;
  state.toggleShipSelection(player.activeShips[0]);
  state.toggleShipSelection(player.activeShips[1]);

  assert.equal(state.commitSelectedShips(state.colonistHub), true);
  assert.equal(state.colonistHub.colonyPosition(0), 8);
  assert.equal(state.asimovCrater.bonusUsedThisTurn, true);
  assert.equal(state.colonistHub.advancementThisTurn, 3);
  assert.equal(state.colonistHub.launchColony(player), true);
  assert.equal(state.colonistHub.colonyPosition(0), 1);
  assert.deepEqual([player.ore, player.fuel, player.coloniesToLaunch], [0, 0, 1]);
  assert.equal(state.selectRegion(state.heinleinPlains), true);
});

test("Colonist Hub clamps unlaunched overflow and resets turn bonuses", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  state.colonistHub.colonyPositions[0] = 9;
  state.colonistHub.advancementThisTurn = 3;
  state.asimovCrater.bonusUsedThisTurn = true;
  player.endTurnCleanup();
  assert.equal(state.colonistHub.colonyPosition(0), 7);
  assert.equal(state.colonistHub.advancementThisTurn, 0);
  assert.equal(state.asimovCrater.bonusUsedThisTurn, false);
});

test("Terraforming Station launches a colony and destroys its die next gather", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  player.activateShip();
  player.initialRollDone = true;
  player.ore = 1;
  player.fuel = 1;
  player.activeShips[0].value = 6;
  state.toggleShipSelection(player.activeShips[0]);

  assert.equal(state.commitSelectedShips(state.terraformingStation), true);
  assert.deepEqual([player.ore, player.fuel, player.coloniesToLaunch], [0, 0, 1]);
  assert.equal(player.activeShips[0].dock.orbital, state.terraformingStation);
  assert.equal(state.selectRegion(state.lemBadlands), true);
  player.gatherShips();
  assert.equal(player.activeShips.length, 3);
  assert.equal(player.inactiveShips.includes(player.allShips[0]), true);
  assert.equal(player.allShips[0].active, false);
});

test("Terraforming Station rejects native dice until a fourth ship exists", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.ore = 1;
  player.fuel = 1;
  player.activeShips[0].value = 6;
  state.toggleShipSelection(player.activeShips[0]);
  assert.equal(state.commitSelectedShips(state.terraformingStation), false);
});

test("existing facilities honor Heinlein, Van Vogt, Herbert, and Lem bonuses", () => {
  const marketState = new GameState(2, [AIType.human, AIType.human]);
  const marketPlayer = marketState.currentPlayer;
  marketState.heinleinPlains.addColony(0);
  marketPlayer.marketPrice = 5;
  marketPlayer.fuel = 1;
  assert.equal(marketPlayer.effectiveMarketPrice, 1);
  assert.equal(marketPlayer.doMarketTrade(), true);
  assert.deepEqual([marketPlayer.fuel, marketPlayer.ore], [0, 1]);

  const lunarState = new GameState(2, [AIType.human, AIType.human]);
  const [lunarPlayer, opponent] = lunarState.players;
  lunarState.vanVogtMountains.addColony(0);
  opponent.activeShips[0].value = 6;
  lunarState.lunarMine.dockShip(opponent.activeShips[0]);
  lunarPlayer.initialRollDone = true;
  lunarPlayer.activeShips[0].value = 2;
  lunarState.toggleShipSelection(lunarPlayer.activeShips[0]);
  assert.equal(lunarState.commitSelectedShips(lunarState.lunarMine), true);
  assert.equal(lunarState.vanVogtMountains.bonusUsedThisTurn, true);

  const shipState = new GameState(2, [AIType.human, AIType.human]);
  shipState.herbertValley.addColony(0);
  assert.equal(shipState.currentPlayer.resourcesNeededForNextShip, 0);

  const solarState = new GameState(2, [AIType.human, AIType.human]);
  solarState.lemBadlands.addColony(0);
  const solarPlayer = solarState.currentPlayer;
  solarPlayer.initialRollDone = true;
  solarPlayer.activeShips[0].value = 2;
  solarState.toggleShipSelection(solarPlayer.activeShips[0]);
  solarState.commitSelectedShips(solarState.solarConverter);
  assert.equal(solarPlayer.fuel, 2);
});

test("Data Crystal borrows a legal occupied bonus and moves Positron on discard", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const crystal = state.allTech.find((card) => card.type === TechCardType.dataCrystal);
  player.cards = [];
  player.addCard(crystal);
  state.lemBadlands.addColony(1);
  player.fuel = 1;
  assert.equal(state.beginTechPower(crystal), true);
  assert.equal(state.selectRegion(state.lemBadlands), true);
  assert.equal(player.borrowingRegion, state.lemBadlands);
  assert.equal(state.lemBadlands.playerHasBonus(player), true);
  assert.equal(player.fuel, 0);
  player.endTurnCleanup();
  assert.equal(player.borrowingRegion, null);

  crystal.tapped = false;
  player.techsDiscarded = 0;
  state.heinleinPlains.hasPositronField = true;
  assert.equal(state.beginTechDiscard(crystal), true);
  assert.equal(state.selectRegion(state.asimovCrater), true);
  assert.equal(state.heinleinPlains.hasPositronField, false);
  assert.equal(state.asimovCrater.hasPositronField, true);
});