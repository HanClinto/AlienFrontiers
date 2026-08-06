import assert from "node:assert/strict";
import test from "node:test";

import { AIType, EventName } from "../js/game/constants.js";
import { GameHistory } from "../js/game/game-history.js";
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

test("touching a Lunar Mine die passes through for a later legal placement", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.activeShips[0].value = 3;
  player.activeShips[1].value = 4;
  state.toggleShipSelection(player.activeShips[0]);
  assert.equal(state.commitSelectedShips(state.lunarMine), true);
  state.toggleShipSelection(player.activeShips[1]);

  assert.equal(state.touchShip(player.activeShips[0]), true);
  assert.equal(player.activeShips[1].dock.orbital, state.lunarMine);
  assert.equal(player.ore, 2);
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

  for (let step = 0; step < 12 && state.currentPlayerIndex === 0; step += 1) {
    SimpleAI.step(state);
  }

  assert.equal(state.currentPlayerIndex, 1);
  assert.equal(state.players[0].numUndockedShips, 0);
  assert.equal(state.currentPlayer.numUndockedShips, 3);
});

test("SimpleAI makes bounded progress when Solar is full", () => {
  const state = new GameState(2, [AIType.easy, AIType.human]);
  const [player, opponent] = state.players;
  player.initialRollDone = true;
  player.fuel = 0;
  while (opponent.activeNativeShips.length < 6) {
    opponent.activateShip();
  }
  state.burroughsDesert.colonyCounts[opponent.playerIndex] = 1;
  opponent.ore = 1;
  opponent.fuel = 1;
  assert.equal(state.purchaseArtifactShip(opponent), true);
  for (const ship of [...opponent.activeShips]) {
    state.solarConverter.dockShip(ship);
  }

  let previousUndocked = player.numUndockedShips;
  for (let step = 0; step < 6 && state.currentPlayerIndex === 0; step += 1) {
    assert.equal(SimpleAI.step(state), true);
    const currentUndocked = state.players[0].numUndockedShips;
    assert.ok(currentUndocked < previousUndocked || state.currentPlayerIndex === 1);
    previousUndocked = currentUndocked;
  }
  assert.equal(state.currentPlayerIndex, 1);
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

test("builds, shuffles, deals, and displays the exact 22-card tech deck", () => {
  const state = new GameState(4, [AIType.human, AIType.human, AIType.human, AIType.human], Math.random, () => 0.25);
  const expectedCounts = Object.fromEntries(TECH_CARD_DEFINITIONS.map(({ type, count }) => [type, count]));
  const actualCounts = Object.fromEntries(TECH_CARD_DEFINITIONS.map(({ type }) => [
    type,
    state.allTech.filter((card) => card.type === type).length,
  ]));

  assert.equal(state.allTech.length, 22);
  assert.deepEqual(actualCounts, expectedCounts);
  assert.deepEqual(state.allTech.map((card) => card.cardID), Array.from({ length: 22 }, (_, index) => index));
  assert.deepEqual(state.players.map((player) => player.cards.length), [1, 1, 1, 1]);
  assert.deepEqual(
    state.players.map((player) => player.selectedCard),
    state.players.map((player) => player.cards[0]),
  );
  assert.equal(state.techDisplayDeck.length, 3);
  assert.equal(state.techDrawDeck.length, 15);
  assert.equal(new Set([
    ...state.players.flatMap((player) => player.cards),
    ...state.techDisplayDeck,
    ...state.techDrawDeck,
  ]).size, 22);
});

test("every enabled tech card exposes its original visible description", () => {
  for (const definition of TECH_CARD_DEFINITIONS) {
    assert.ok(definition.powerText || definition.discardText, definition.title);
  }
});

test("tech cards can be selected and highlighted on their owning opponent", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const opponent = state.players[1];
  const card = opponent.cards[0];

  assert.equal(state.selectTechCard(card), true);
  assert.equal(opponent.selectedCard, card);
  assert.equal(state.currentPlayer.selectedCard, state.currentPlayer.cards[0]);
});

test("gaining a tech card selects it only when no card is already selected", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const firstCard = state.techDisplayDeck[0];
  const secondCard = state.techDisplayDeck.find((card) => card.type !== firstCard.type);
  player.cards = [];
  player.selectedCard = null;

  assert.equal(player.addCard(firstCard), true);
  assert.equal(player.selectedCard, firstCard);
  assert.equal(player.addCard(secondCard), true);
  assert.equal(player.selectedCard, firstCard);
});

test("game log entries notify the HUD immediately", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const entries = [];
  state.events.on(EventName.logEntry, ({ object }) => entries.push(object));
  state.logMove("A visible test move");
  assert.equal(state.gameLog.at(-1), "A visible test move");
  assert.deepEqual(entries, ["A visible test move"]);
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

test("AI spends Artifact credit on its highest-valued legal displayed tech", () => {
  const state = new GameState(2, [AIType.hard, AIType.human]);
  const player = state.currentPlayer;
  const gravity = state.allTech.find((card) => card.type === TechCardType.gravityManipulator);
  const polarity = state.allTech.find((card) => card.type === TechCardType.polarityDevice);
  player.cards = [];
  state.techDisplayDeck = [gravity, polarity];
  player.artifactCreditAvailable = 8;
  player.artifactShufflesAvailable = 1;
  player.initialRollDone = true;

  assert.equal(SimpleAI.step(state), true);
  assert.equal(player.cards.includes(polarity), true);
  assert.equal(player.cards.includes(gravity), false);
  assert.equal(player.artifactCreditAvailable, 0);
});

test("AI completes favorable Orbital Market trades before docking remaining dice", () => {
  const state = new GameState(2, [AIType.medium, AIType.human]);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.fuel = 4;
  player.ore = 0;
  player.marketPrice = 2;

  assert.equal(SimpleAI.step(state), true);
  assert.deepEqual([player.fuel, player.ore], [2, 1]);
  assert.equal(SimpleAI.step(state), true);
  assert.deepEqual([player.fuel, player.ore], [0, 2]);
});

test("AI docks a high-value pair at Alien Artifact and buys tech", () => {
  const state = new GameState(2, [AIType.hard, AIType.human]);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.activeShips[0].value = 6;
  player.activeShips[1].value = 2;
  player.activeShips[2].value = 1;

  assert.equal(SimpleAI.step(state), true);
  assert.equal(player.artifactCreditAvailable, 8);
  assert.equal(player.activeShips.slice(0, 2).every(
    (ship) => ship.dock?.orbital === state.alienArtifact,
  ), true);
  const cardCount = player.cards.length;
  assert.equal(SimpleAI.step(state), true);
  assert.equal(player.cards.length, cardCount + 1);
  assert.equal(player.artifactCreditAvailable, 0);
});

test("AI docks an affordable pair at Orbital Market and trades", () => {
  const state = new GameState(2, [AIType.medium, AIType.human]);
  const [player, opponent] = state.players;
  player.initialRollDone = true;
  player.fuel = 2;
  player.ore = 0;
  player.activeShips[0].value = 2;
  player.activeShips[1].value = 2;
  player.activeShips[2].value = 1;
  opponent.activeShips[0].value = 3;
  opponent.activeShips[1].value = 3;
  state.shipyard.commitShipsFromPlayer(opponent, opponent.activeShips.slice(0, 2));

  assert.equal(SimpleAI.step(state), true);
  assert.equal(player.marketPrice, 2);
  assert.equal(player.activeShips.slice(0, 2).every(
    (ship) => ship.dock?.orbital === state.orbitalMarket,
  ), true);
  assert.equal(SimpleAI.step(state), true);
  assert.deepEqual([player.fuel, player.ore], [0, 1]);
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

test("touching an incumbent Raider die commits a selected higher straight", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const [firstPlayer, secondPlayer] = state.players;
  firstPlayer.initialRollDone = true;
  [1, 2, 3].forEach((value, index) => {
    firstPlayer.activeShips[index].value = value;
    state.toggleShipSelection(firstPlayer.activeShips[index]);
  });
  state.commitSelectedShips(state.raidersOutpost);
  firstPlayer.isRaiding = false;

  state.currentPlayerIndex = 1;
  secondPlayer.gatherShips();
  secondPlayer.initialRollDone = true;
  [2, 3, 4].forEach((value, index) => {
    secondPlayer.activeShips[index].value = value;
    state.toggleShipSelection(secondPlayer.activeShips[index]);
  });

  assert.equal(state.touchShip(firstPlayer.activeShips[0]), true);
  assert.deepEqual(
    state.raidersOutpost.docks.map((dock) => dock.dockedShip.value),
    [2, 3, 4],
  );
  assert.equal(
    firstPlayer.activeShips.every((ship) => ship.dock?.orbital === state.maintenanceBay),
    true,
  );
});

test("facility potential includes legal completions around selected dice", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  player.initialRollDone = true;
  player.activeShips[0].value = 4;
  player.activeShips[1].value = 4;
  player.activeShips[2].value = 6;
  state.toggleShipSelection(player.activeShips[0]);

  assert.equal(state.canUseOrbital(state.solarConverter), true);
  assert.equal(state.canUseOrbital(state.lunarMine), true);
  assert.equal(state.canUseOrbital(state.shipyard), false);
  player.fuel = 1;
  player.ore = 1;
  assert.equal(state.canUseOrbital(state.shipyard), true);
  assert.equal(state.canUseOrbital(state.colonyConstructor), false);
  assert.equal(state.canUseOrbital(state.maintenanceBay), true);

  player.activeShips[0].teleportRestriction = state.solarConverter;
  assert.equal(state.canUseOrbital(state.solarConverter), false);
});

test("resource raids cap at four and finish when scarce resources are exhausted", () => {
  const state = new GameState(3, [AIType.human, AIType.human, AIType.human]);
  const [raider, victimOne, victimTwo] = state.players;
  victimOne.cards = [];
  victimTwo.cards = [];
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

test("canceling a raid clears provisional resources without transferring them", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const [raider, victim] = state.players;
  victim.cards = [];
  victim.ore = 2;
  victim.fuel = 1;

  raider.startRaid();
  assert.equal(raider.adjustRaidResource(victim, "ore", 1), true);
  assert.equal(state.cancelPendingSelection(), true);
  assert.equal(raider.isRaiding, false);
  assert.deepEqual([victim.oreToRaid, victim.fuelToRaid], [0, 0]);
  assert.deepEqual([raider.ore, raider.fuel, victim.ore, victim.fuel], [0, 0, 2, 1]);
});

test("SimpleAI uses a straight and resolves its raid", () => {
  const state = new GameState(2, [AIType.easy, AIType.human], () => 0.2);
  const [raider, victim] = state.players;
  victim.cards = [];
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

test("Pirate prejudice changes raid targeting from the Admiral choice", () => {
  const makeState = (aiType) => {
    const state = new GameState(3, [aiType, AIType.medium, AIType.human]);
    const [raider, aiVictim, humanVictim] = state.players;
    for (const player of state.players) {
      player.cards = [];
    }
    state.heinleinPlains.colonyCounts[aiVictim.playerIndex] = 5;
    state.pohlFoothills.colonyCounts[humanVictim.playerIndex] = 4;
    aiVictim.ore = 4;
    humanVictim.ore = 4;
    raider.startRaid();
    return { state, raider, aiVictim, humanVictim };
  };

  const admiral = makeState(AIType.hard);
  assert.equal(SimpleAI.finishRaid(admiral.state, admiral.raider), true);
  assert.equal(admiral.aiVictim.ore, 0);
  assert.equal(admiral.humanVictim.ore, 4);

  const pirate = makeState(AIType.pirate);
  assert.equal(SimpleAI.finishRaid(pirate.state, pirate.raider), true);
  assert.equal(pirate.aiVictim.ore, 4);
  assert.equal(pirate.humanVictim.ore, 0);
});

test("Pirate prejudice changes colony denial from the Admiral choice", () => {
  const makeState = (aiType) => {
    const state = new GameState(3, [aiType, AIType.medium, AIType.human], () => 0.5);
    const [player, aiOpponent, humanOpponent] = state.players;
    for (const candidate of state.players) {
      candidate.cards = [];
      candidate.ore = 0;
      candidate.fuel = 0;
    }
    state.heinleinPlains.colonyCounts[player.playerIndex] = 1;
    state.heinleinPlains.colonyCounts[aiOpponent.playerIndex] = 2;
    state.pohlFoothills.colonyCounts[player.playerIndex] = 1;
    state.pohlFoothills.colonyCounts[humanOpponent.playerIndex] = 2;
    state.vanVogtMountains.colonyCounts[aiOpponent.playerIndex] = 1;
    state.vanVogtMountains.colonyCounts[humanOpponent.playerIndex] = 1;
    for (const region of state.regions.slice(2)) {
      region.hasRepulsorField = true;
    }
    player.coloniesToLaunch = 1;
    return { state, player };
  };

  const admiral = makeState(AIType.hard);
  assert.equal(SimpleAI.launchColony(admiral.state, admiral.player), true);
  assert.equal(admiral.state.heinleinPlains.coloniesForPlayer(0), 2);

  const pirate = makeState(AIType.pirate);
  assert.equal(SimpleAI.launchColony(pirate.state, pirate.player), true);
  assert.equal(pirate.state.pohlFoothills.coloniesForPlayer(0), 2);
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

test("Undo steps back through Gravity selection before canceling its queue", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const gravity = state.allTech.find((card) => card.type === TechCardType.gravityManipulator);
  player.cards = [];
  player.addCard(gravity);
  player.fuel = 2;
  player.activeShips[0].value = 4;
  player.activeShips[1].value = 3;

  assert.equal(state.beginTechPower(gravity), true);
  assert.equal(state.usePendingTechOnShip(player.activeShips[0]), true);
  assert.equal(state.stepBackPendingSelection(), true);
  assert.equal(state.pendingTechAction, "power-raise");
  assert.equal(state.pendingTechTargets[0], player.activeShips[0]);
  assert.equal(state.usePendingTechOnShip(player.activeShips[0]), true);
  assert.deepEqual(state.pendingTechTargets, []);
  assert.equal(state.usePendingTechOnShip(player.activeShips[1]), true);
  assert.equal(state.pendingTechAction, "power");
  assert.equal(state.pendingTechTargets[0], player.activeShips[1]);
  assert.equal(state.stepBackPendingSelection(), true);
  assert.equal(state.stepBackPendingSelection(), false);
  assert.equal(state.cancelPendingSelection(), true);
  assert.equal(state.pendingTechCard, null);
});

test("teleported dice follow original Gravity and Polarity target rules", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const gravity = state.allTech.find((card) => card.type === TechCardType.gravityManipulator);
  const polarity = state.allTech.find((card) => card.type === TechCardType.polarityDevice);
  const ship = player.activeShips[0];
  player.cards = [];
  player.addCard(gravity);
  player.addCard(polarity);
  player.fuel = 4;
  ship.value = 3;
  ship.teleportRestriction = state.solarConverter;

  assert.equal(gravity.canUsePowerOnShip(ship), false);
  assert.equal(gravity.canLowerGravityShip(ship, player.activeShips[1]), false);
  assert.equal(polarity.canUsePowerOnShip(ship), true);
  assert.equal(polarity.usePowerOnShip(ship), true);
  assert.equal(ship.value, 4);
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

test("Temporal Warper discard claims one eligible discarded tech and is undoable", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  state.history = new GameHistory();
  const player = state.currentPlayer;
  const warper = state.allTech.find((card) => card.type === TechCardType.temporalWarper);
  const claimed = state.allTech.find((card) => card.type === TechCardType.boosterPod);
  player.cards = [];
  state.techDrawDeck = state.techDrawDeck.filter((card) => card !== claimed && card !== warper);
  state.techDisplayDeck = state.techDisplayDeck.filter((card) => card !== claimed && card !== warper);
  player.addCard(warper);
  state.discardTechCard(claimed);

  assert.equal(state.beginTechDiscard(warper), true);
  assert.equal(state.pendingTechAction, "discard-card");
  assert.equal(state.claimPendingDiscardCard(claimed), true);
  assert.equal(player.cards.includes(claimed), true);
  assert.equal(player.cards.includes(warper), false);
  assert.equal(state.techDiscardDeck.includes(claimed), false);
  assert.equal(state.techDiscardDeck.at(-1), warper);
  assert.equal(player.techsDiscarded, 1);

  const restored = state.history.undo(state);
  assert.equal(restored.currentPlayer.cards.some((card) => card.cardID === warper.cardID), true);
  assert.equal(restored.techDiscardDeck.some((card) => card.cardID === claimed.cardID), true);
  assert.equal(restored.currentPlayer.techsDiscarded, 0);
});

test("Temporal Warper cannot retrieve a duplicate tech type", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const warper = state.allTech.find((card) => card.type === TechCardType.temporalWarper);
  const boosters = state.allTech.filter((card) => card.type === TechCardType.boosterPod);
  player.cards = [];
  player.addCard(warper);
  player.addCard(boosters[0]);
  state.discardTechCard(boosters[1]);

  assert.equal(warper.canClaimDiscardedCard(boosters[1]), false);
  assert.equal(state.beginTechDiscard(warper), false);
});

test("Temporal Warper rerolls selected legal ships and clears game history", () => {
  const rolls = sequenceRandom([0, 0.99]);
  const state = new GameState(2, [AIType.human, AIType.human], rolls);
  state.history = new GameHistory();
  const player = state.currentPlayer;
  const warper = state.allTech.find((card) => card.type === TechCardType.temporalWarper);
  player.cards = [];
  player.addCard(warper);
  player.initialRollDone = true;
  player.fuel = 2;
  player.activeShips[0].value = 3;
  player.activeShips[1].value = 4;
  state.history.createUndoPoint(state);

  assert.equal(state.beginTechPower(warper), true);
  assert.equal(state.usePendingTechOnShip(player.activeShips[0]), true);
  assert.equal(state.usePendingTechOnShip(player.activeShips[1]), true);
  assert.equal(state.confirmPendingTechPower(), true);
  assert.deepEqual(player.activeShips.slice(0, 2).map((ship) => ship.value), [1, 6]);
  assert.equal(player.fuel, 1);
  assert.equal(warper.tapped, true);
  assert.equal(state.history.canUndo, false);
  assert.equal(state.history.canRedo, false);
});

test("Temporal Warper rejects unrolled, docked, and teleport-restricted ships", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const warper = state.allTech.find((card) => card.type === TechCardType.temporalWarper);
  player.cards = [];
  player.addCard(warper);
  player.fuel = 1;
  assert.equal(warper.canUsePowerOnShip(player.activeShips[0]), false);

  player.initialRollDone = true;
  player.activeShips[0].teleportRestriction = state.solarConverter;
  assert.equal(warper.canUsePowerOnShip(player.activeShips[0]), false);
  player.activeShips[0].teleportRestriction = null;
  state.maintenanceBay.dockShip(player.activeShips[0]);
  assert.equal(warper.canUsePowerOnShip(player.activeShips[0]), false);
});

test("canceling Temporal Warper selection preserves existing undo history", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  state.history = new GameHistory();
  const player = state.currentPlayer;
  const warper = state.allTech.find((card) => card.type === TechCardType.temporalWarper);
  player.cards = [];
  player.addCard(warper);
  player.initialRollDone = true;
  player.fuel = 1;
  state.history.createUndoPoint(state);

  assert.equal(state.beginTechPower(warper), true);
  assert.equal(state.usePendingTechOnShip(player.activeShips[0]), true);
  assert.equal(state.cancelPendingSelection(), true);
  assert.equal(state.history.canUndo, true);
  assert.equal(warper.tapped, false);
  assert.equal(player.fuel, 1);
  assert.equal(player.selectedShips.length, 0);
});

test("Pohl control makes Temporal Warper rerolls free", () => {
  const state = new GameState(2, [AIType.human, AIType.human], () => 0);
  const player = state.currentPlayer;
  const warper = state.allTech.find((card) => card.type === TechCardType.temporalWarper);
  player.cards = [];
  player.addCard(warper);
  player.initialRollDone = true;
  player.fuel = 0;
  state.pohlFoothills.addColony(player.playerIndex);

  assert.equal(warper.adjustedFuelCost, 0);
  assert.equal(state.beginTechPower(warper), true);
  assert.equal(state.usePendingTechOnShip(player.activeShips[0]), true);
  assert.equal(state.confirmPendingTechPower(), true);
  assert.equal(player.fuel, 0);
});

test("Temporal Warper reroll resolves Resource Cache exactly once", () => {
  const state = new GameState(2, [AIType.human, AIType.human], () => 0);
  const player = state.currentPlayer;
  const warper = state.allTech.find((card) => card.type === TechCardType.temporalWarper);
  const cache = state.allTech.find((card) => card.type === TechCardType.resourceCache);
  player.cards = [];
  player.addCard(warper);
  player.addCard(cache);
  player.initialRollDone = true;
  player.fuel = 1;
  player.activeShips[0].value = 2;
  player.activeShips[1].value = 1;
  player.activeShips[2].value = 1;

  assert.equal(state.beginTechPower(warper), true);
  assert.equal(state.usePendingTechOnShip(player.activeShips[0]), true);
  assert.equal(state.confirmPendingTechPower(), true);
  assert.deepEqual([player.ore, player.fuel], [1, 0]);
  assert.equal(player.cards.includes(cache), true);
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

test("Stasis discard cannot place Isolation on the Repulsor region", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const stasis = state.allTech.find((card) => card.type === TechCardType.stasisBeam);
  player.cards = [];
  player.addCard(stasis);
  state.heinleinPlains.hasRepulsorField = true;

  assert.equal(state.beginTechDiscard(stasis), true);
  assert.equal(state.selectRegion(state.heinleinPlains), false);
  assert.equal(state.heinleinPlains.hasIsolationField, false);
  assert.equal(player.cards.includes(stasis), true);
});

test("Orbital Teleporter undocks a ship and forbids its origin until cleanup", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const teleporter = state.allTech.find((card) => card.type === TechCardType.orbitalTeleporter);
  player.cards = [];
  player.addCard(teleporter);
  player.fuel = 2;
  player.initialRollDone = true;
  const ship = player.activeShips[0];
  ship.value = 4;
  state.solarConverter.dockShip(ship);

  assert.equal(state.beginTechPower(teleporter), true);
  assert.equal(state.usePendingTechOnShip(ship), true);
  assert.equal(ship.docked, false);
  assert.equal(ship.teleportRestriction, state.solarConverter);
  assert.equal(player.fuel, 0);
  assert.equal(teleporter.tapped, true);
  state.toggleShipSelection(ship);
  assert.equal(state.commitSelectedShips(state.solarConverter), false);
  assert.equal(state.commitSelectedShips(state.maintenanceBay), true);
  player.endTurnCleanup();
  assert.equal(ship.teleportRestriction, null);
});

test("Orbital Teleporter cannot target Maintenance or Terraforming ships", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const teleporter = state.allTech.find((card) => card.type === TechCardType.orbitalTeleporter);
  player.cards = [];
  player.addCard(teleporter);
  player.fuel = 2;
  assert.equal(state.beginTechPower(teleporter), false);
});

test("Plasma Cannon removes payable enemy ships from one orbital", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const [player, victim] = state.players;
  const plasma = state.allTech.find((card) => card.type === TechCardType.plasmaCannon);
  player.cards = [];
  player.addCard(plasma);
  player.fuel = 2;
  victim.activeShips[0].value = 3;
  victim.activeShips[1].value = 4;
  state.solarConverter.dockShip(victim.activeShips[0]);
  state.solarConverter.dockShip(victim.activeShips[1]);

  assert.equal(state.beginTechPower(plasma), true);
  assert.equal(state.usePendingTechOnShip(victim.activeShips[0]), true);
  assert.equal(state.usePendingTechOnShip(victim.activeShips[1]), true);
  assert.equal(state.confirmPendingTechPower(), true);
  assert.equal(victim.activeShips.slice(0, 2).every((ship) => ship.dock.orbital === state.maintenanceBay), true);
  assert.equal(player.fuel, 0);
  assert.equal(plasma.tapped, true);
});

test("canceling a pending Plasma power clears targets and selection rings", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const [player, victim] = state.players;
  const plasma = state.allTech.find((card) => card.type === TechCardType.plasmaCannon);
  player.cards = [];
  player.addCard(plasma);
  player.fuel = 2;
  state.solarConverter.dockShip(victim.activeShips[0]);

  assert.equal(state.beginTechPower(plasma), true);
  assert.equal(state.usePendingTechOnShip(victim.activeShips[0]), true);
  assert.equal(victim.activeShips[0].isSelected, true);
  assert.equal(state.cancelPendingSelection(), true);
  assert.equal(state.pendingTechCard, null);
  assert.deepEqual(state.pendingTechTargets, []);
  assert.equal(victim.activeShips[0].isSelected, false);
  assert.equal(plasma.tapped, false);
  assert.equal(player.fuel, 2);
});

test("Plasma Cannon enforces one orbital and discard destroys only surplus ships", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const [player, victim] = state.players;
  const plasma = state.allTech.find((card) => card.type === TechCardType.plasmaCannon);
  player.cards = [];
  player.addCard(plasma);
  player.fuel = 3;
  state.solarConverter.dockShip(victim.activeShips[0]);
  state.lunarMine.dockShip(victim.activeShips[1]);
  state.beginTechPower(plasma);
  assert.equal(state.usePendingTechOnShip(victim.activeShips[0]), true);
  assert.equal(state.usePendingTechOnShip(victim.activeShips[1]), false);

  state.pendingTechCard = null;
  state.pendingTechTargets = [];
  state.pendingTechAction = null;
  assert.equal(state.beginTechDiscard(plasma), true);
  assert.equal(state.usePendingTechOnShip(victim.activeShips[0]), false);
  victim.activateShip();
  assert.equal(state.usePendingTechOnShip(victim.activeShips[0]), true);
  assert.equal(victim.activeShips.length, 3);
  assert.equal(victim.allShips[0].active, false);
  assert.equal(state.techDiscardDeck.includes(plasma), true);
});

test("Orbital Teleporter discard moves a selected colony to another region", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const teleporter = state.allTech.find((card) => card.type === TechCardType.orbitalTeleporter);
  player.cards = [];
  player.addCard(teleporter);
  state.heinleinPlains.addColony(1);

  assert.equal(state.beginTechDiscard(teleporter), true);
  assert.equal(state.selectPlacedColony(state.heinleinPlains, state.players[1]), true);
  assert.equal(state.pendingTechAction, "discard-colony-destination");
  assert.equal(state.selectRegion(state.heinleinPlains), false);
  assert.equal(state.selectRegion(state.lemBadlands), true);
  assert.equal(state.heinleinPlains.coloniesForPlayer(1), 0);
  assert.equal(state.lemBadlands.coloniesForPlayer(1), 1);
  assert.equal(state.techDiscardDeck.includes(teleporter), true);
});

test("Undo steps Teleporter colony selection back to its first queue stage", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const teleporter = state.allTech.find((card) => card.type === TechCardType.orbitalTeleporter);
  player.cards = [];
  player.addCard(teleporter);
  state.heinleinPlains.addColony(1);

  assert.equal(state.beginTechDiscard(teleporter), true);
  assert.equal(state.selectPlacedColony(state.heinleinPlains, state.players[1]), true);
  assert.equal(state.stepBackPendingSelection(), true);
  assert.equal(state.pendingTechAction, "discard-colony-first");
  assert.equal(state.pendingColonyTargets[0].region, state.heinleinPlains);
  state.lemBadlands.addColony(0);
  assert.equal(state.selectPlacedColony(state.lemBadlands, player), true);
  assert.equal(state.pendingTechAction, "discard-colony-destination");
  assert.equal(state.pendingColonyTargets[0].region, state.lemBadlands);
  assert.equal(state.stepBackPendingSelection(), true);
  assert.equal(state.stepBackPendingSelection(), false);
});

test("colony-moving discards cannot select a Repulsor source region", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const teleporter = state.allTech.find((card) => card.type === TechCardType.orbitalTeleporter);
  const polarity = state.allTech.find((card) => card.type === TechCardType.polarityDevice);
  player.cards = [];
  player.addCard(teleporter);
  player.addCard(polarity);
  state.heinleinPlains.addColony(1);
  state.lemBadlands.addColony(0);
  state.heinleinPlains.hasRepulsorField = true;

  assert.equal(state.beginTechDiscard(teleporter), true);
  assert.equal(state.selectPlacedColony(state.heinleinPlains, state.players[1]), false);
  assert.equal(teleporter.useTeleporterColonyDiscard(
    { region: state.heinleinPlains, player: state.players[1] },
    state.lemBadlands,
  ), false);
  assert.equal(polarity.usePolarityColonyDiscard(
    { region: state.heinleinPlains, player: state.players[1] },
    { region: state.lemBadlands, player },
  ), false);
});

test("Polarity discard swaps two selected colonies between regions", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const polarity = state.allTech.find((card) => card.type === TechCardType.polarityDevice);
  player.cards = [];
  player.addCard(polarity);
  state.heinleinPlains.addColony(0);
  state.lemBadlands.addColony(1);

  assert.equal(state.beginTechDiscard(polarity), true);
  assert.equal(state.selectPlacedColony(state.heinleinPlains, state.players[0]), true);
  assert.equal(state.selectPlacedColony(state.heinleinPlains, state.players[0]), false);
  assert.equal(state.selectPlacedColony(state.lemBadlands, state.players[1]), true);
  assert.deepEqual([
    state.heinleinPlains.coloniesForPlayer(0),
    state.heinleinPlains.coloniesForPlayer(1),
    state.lemBadlands.coloniesForPlayer(0),
    state.lemBadlands.coloniesForPlayer(1),
  ], [0, 1, 1, 0]);
  assert.equal(state.techDiscardDeck.includes(polarity), true);
});

test("Undo steps Polarity colony selection back to its first queue stage", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  const polarity = state.allTech.find((card) => card.type === TechCardType.polarityDevice);
  player.cards = [];
  player.addCard(polarity);
  state.heinleinPlains.addColony(0);
  state.lemBadlands.addColony(1);
  state.asimovCrater.addColony(0);

  assert.equal(state.beginTechDiscard(polarity), true);
  assert.equal(state.selectPlacedColony(state.heinleinPlains, player), true);
  assert.equal(state.stepBackPendingSelection(), true);
  assert.equal(state.pendingTechAction, "discard-colony-first");
  assert.equal(state.pendingColonyTargets[0].region, state.heinleinPlains);
  assert.equal(state.selectPlacedColony(state.asimovCrater, player), true);
  assert.equal(state.pendingTechAction, "discard-colony");
  assert.equal(state.pendingColonyTargets[0].region, state.asimovCrater);
  assert.equal(state.selectPlacedColony(state.lemBadlands, state.players[1]), true);
  assert.equal(state.techDiscardDeck.includes(polarity), true);
});

test("Burroughs owner purchases the shared artifact ship without changing native costs", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  state.burroughsDesert.addColony(0);
  player.ore = 1;
  player.fuel = 1;
  assert.equal(state.canPurchaseArtifactShip(player), true);
  assert.equal(state.purchaseArtifactShip(player), true);
  assert.equal(state.artifactShip.player, player);
  assert.equal(state.artifactShip.active, true);
  assert.equal(state.artifactShip.dock.orbital, state.maintenanceBay);
  assert.equal(player.activeShips.length, 4);
  assert.equal(player.activeNativeShips.length, 3);
  assert.equal(player.resourcesNeededForNextShip, 1);
  assert.deepEqual([player.ore, player.fuel], [0, 0]);
});

test("artifact ship is lost immediately when Burroughs control is lost", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const [owner] = state.players;
  state.burroughsDesert.addColony(0);
  owner.ore = 1;
  owner.fuel = 1;
  state.purchaseArtifactShip(owner);
  state.burroughsDesert.addColony(1);
  assert.equal(state.artifactShip.active, false);
  assert.equal(state.artifactShip.player, null);
  assert.equal(owner.activeShips.includes(state.artifactShip), false);
});

test("artifact ship is lost immediately when Burroughs is isolated", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const owner = state.currentPlayer;
  const stasis = state.allTech.find((card) => card.type === TechCardType.stasisBeam);
  state.burroughsDesert.addColony(0);
  owner.ore = 1;
  owner.fuel = 1;
  state.purchaseArtifactShip(owner);
  owner.cards = [];
  owner.addCard(stasis);

  assert.equal(stasis.useDiscardOnRegion(state.burroughsDesert), true);
  assert.equal(state.burroughsDesert.hasIsolationField, true);
  assert.equal(state.artifactShip.active, false);
  assert.equal(state.artifactShip.player, null);
});

test("game ends when a player's final pending colony lands", () => {
  const state = new GameState(2, [AIType.human, AIType.human]);
  const player = state.currentPlayer;
  player.coloniesLeft = 1;
  player.coloniesToLaunch = 1;
  assert.equal(state.gameOver, false);
  assert.equal(state.selectRegion(state.heinleinPlains), true);
  assert.equal(player.coloniesLeft, 0);
  assert.equal(player.coloniesToLaunch, 0);
  assert.equal(state.gameOver, true);
  assert.equal(state.canEndTurn, false);
});

test("game-over ranking breaks VP ties by tech cards, ore, then fuel", () => {
  const state = new GameState(3, [AIType.human, AIType.human, AIType.human]);
  for (const player of state.players) {
    player.cards = [];
  }
  state.players[0].fuel = 1;
  state.players[1].ore = 1;
  state.players[2].addCard(state.allTech.find((card) => card.type === TechCardType.boosterPod));
  assert.deepEqual(
    state.winningPlayers.map((player) => player.playerIndex),
    [2, 1, 0],
  );
});