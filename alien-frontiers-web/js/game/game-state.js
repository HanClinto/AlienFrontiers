import { AIType, EventName } from "./constants.js";
import { EventBus } from "./event-bus.js";
import { AlienArtifact, ColonyConstructor, ColonistHub, LunarMine, MaintenanceBay, OrbitalMarket, RaidersOutpost, Shipyard, SolarConverter, TerraformingStation } from "./orbital.js";
import { Player } from "./player.js";
import { Region, REGION_DEFINITIONS } from "./region.js";
import { buildTechDeck, shuffleTechCards } from "./tech-card.js";
import { Ship } from "./ship.js";

export class GameState {
  constructor(numPlayers, playerPersonalities, random = Math.random, cardRandom = () => 0.5) {
    if (numPlayers < 2 || numPlayers > 4) {
      throw new RangeError("Alien Frontiers supports two to four players");
    }
    this.numPlayers = numPlayers;
    this.random = random;
    this.cardRandom = cardRandom;
    this.events = new EventBus();
    this.currentPlayerIndex = 0;
    this.numTurns = 0;
    this.gameOver = false;
    this.pendingTechCard = null;
    this.pendingTechTargets = [];
    this.pendingColonyTargets = [];
    this.pendingTechAction = null;
    this.gameLog = [`Began new ${numPlayers} player game`];

    this.players = Array.from(
      { length: numPlayers },
      (_, index) => new Player(this, index, index, numPlayers, playerPersonalities[index]),
    );
    this.regions = REGION_DEFINITIONS.map(([propertyName, title]) => {
      const region = new Region(this, title);
      this[propertyName] = region;
      return region;
    });
    this.solarConverter = new SolarConverter(this);
    this.maintenanceBay = new MaintenanceBay(this);
    this.lunarMine = new LunarMine(this);
    this.shipyard = new Shipyard(this);
    this.orbitalMarket = new OrbitalMarket(this);
    this.colonyConstructor = new ColonyConstructor(this);
    this.alienArtifact = new AlienArtifact(this);
    this.raidersOutpost = new RaidersOutpost(this);
    this.colonistHub = new ColonistHub(this);
    this.terraformingStation = new TerraformingStation(this);
    this.artifactShip = new Ship(null, 6, this);

    this.allTech = buildTechDeck(this);
    this.techDrawDeck = shuffleTechCards(this.allTech, this.cardRandom);
    this.techDiscardDeck = [];
    this.techDisplayDeck = [];

    for (const player of this.players) {
      player.activateStartingShips();
      player.addCard(this.drawTechCard());
    }
    this.fillTechDisplayPile();
    this.currentPlayer.gatherShips();
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  get canEndTurn() {
    return !this.gameOver
      && this.currentPlayer.initialRollDone
      && this.currentPlayer.numUndockedShips === 0
      && this.currentPlayer.coloniesToLaunch === 0
      && !this.currentPlayer.isRaiding
      && !this.pendingTechCard;
  }

  postEvent(name, object) {
    this.events.post(name, object);
    this.events.post(EventName.stateChanged, object);
  }

  logMove(message) {
    this.gameLog.push(message);
    this.postEvent(EventName.logEntry, message);
  }

  createUndoPoint() {
    this.history?.createUndoPoint(this);
  }

  clearUndoRedo() {
    this.history?.clear();
  }

  checkGameOver() {
    if (this.gameOver) {
      return true;
    }
    this.gameOver = this.players.some((player) =>
      player.coloniesLeft === 0 && player.coloniesToLaunch === 0);
    if (this.gameOver) {
      this.postEvent(EventName.gameOver, this);
    }
    return this.gameOver;
  }

  get winningPlayers() {
    return [...this.players].sort((left, right) => right.score - left.score);
  }

  drawTechCard() {
    if (this.techDrawDeck.length === 0 && this.techDiscardDeck.length > 0) {
      this.techDrawDeck = shuffleTechCards(this.techDiscardDeck, this.cardRandom);
      this.techDiscardDeck = [];
    }
    return this.techDrawDeck.pop() ?? null;
  }

  fillTechDisplayPile() {
    while (this.techDisplayDeck.length < 3) {
      const card = this.drawTechCard();
      if (!card) {
        break;
      }
      this.techDisplayDeck.push(card);
    }
    this.postEvent(EventName.techCardsChanged, this);
  }

  discardTechCard(card) {
    card.owner = null;
    if (!this.techDiscardDeck.includes(card)) {
      this.techDiscardDeck.push(card);
    }
    this.postEvent(EventName.techCardsChanged, card);
  }

  canPurchaseArtifactShip(player) {
    return this.burroughsDesert.playerHasBonus(player)
      && !this.artifactShip.active
      && player.ore >= 1
      && player.fuel >= 1;
  }

  purchaseArtifactShip(player) {
    if (!this.canPurchaseArtifactShip(player)) {
      return false;
    }
    this.createUndoPoint();
    player.ore -= 1;
    player.fuel -= 1;
    this.artifactShip.player = player;
    this.artifactShip.active = true;
    player.activeShips.push(this.artifactShip);
    player.allShips.push(this.artifactShip);
    this.maintenanceBay.dockShip(this.artifactShip);
    this.postEvent(EventName.shipActivated, this.artifactShip);
    this.postEvent(EventName.resourcesChanged, player);
    return true;
  }

  checkArtifactShipControl() {
    const ship = this.artifactShip;
    if (
      ship?.active
      && ship.player
      && !this.burroughsDesert.playerHasBonus(ship.player)
    ) {
      ship.player.deactivateShip(ship);
    }
  }

  rollCurrentPlayerShips() {
    this.clearUndoRedo();
    return this.currentPlayer.rollShips(this.random);
  }

  toggleShipSelection(ship) {
    if (
      ship.player !== this.currentPlayer
      || ship.docked
      || !this.currentPlayer.initialRollDone
      || this.currentPlayer.aiType !== AIType.human
    ) {
      return false;
    }
    ship.toggleSelect();
    return true;
  }

  touchShip(ship) {
    if (ship.docked) {
      return this.commitSelectedShips(ship.dock.orbital);
    }
    return this.toggleShipSelection(ship);
  }

  canCommitShipsTo(orbital, ships) {
    return !ships.some((ship) => ship.teleportRestriction === orbital)
      && orbital.isValidMoveFromPlayer(this.currentPlayer, ships);
  }

  canUseOrbital(orbital) {
    const player = this.currentPlayer;
    if (
      !player.initialRollDone
      || player.isRaiding
      || player.coloniesToLaunch > 0
      || this.pendingTechCard
    ) {
      return false;
    }
    const selected = player.selectedShips;
    const candidates = player.undockedShips.filter((ship) => !ship.isSelected);
    const subsetCount = 2 ** candidates.length;
    for (let mask = 0; mask < subsetCount; mask += 1) {
      const ships = [...selected];
      for (let index = 0; index < candidates.length; index += 1) {
        if (mask & (1 << index)) {
          ships.push(candidates[index]);
        }
      }
      if (ships.length > 0 && this.canCommitShipsTo(orbital, ships)) {
        return true;
      }
    }
    return false;
  }

  commitSelectedShips(orbital) {
    if (!this.canCommitShipsTo(orbital, this.currentPlayer.selectedShips)) {
      return false;
    }
    this.createUndoPoint();
    return orbital.commitShipsFromPlayer(this.currentPlayer, this.currentPlayer.selectedShips);
  }

  selectTechCard(card) {
    if (!this.currentPlayer.cards.includes(card)) {
      return false;
    }
    this.currentPlayer.selectedCard = card;
    this.postEvent(EventName.techCardsChanged, card);
    return true;
  }

  beginTechPower(card) {
    const candidateShips = card.type === "plasma-cannon"
      ? this.players.flatMap((player) => player.activeShips)
      : card.type === "orbital-teleporter"
        ? this.currentPlayer.activeShips
        : this.currentPlayer.undockedShips;
    const hasTarget = card.type === "data-crystal"
      ? this.regions.some((region) => card.canUsePowerOnRegion(region))
      : card.type === "plasma-cannon"
        ? candidateShips.some((ship) => card.canTargetPlasmaShip(ship))
      : card.type === "gravity-manipulator"
      ? candidateShips.some((shipToRaise) =>
        card.canUsePowerOnShip(shipToRaise)
        && candidateShips.some((shipToLower) =>
          card.canLowerGravityShip(shipToLower, shipToRaise)))
      : candidateShips.some((ship) => card.canUsePowerOnShip(ship));
    const canStart = card.type === "data-crystal" || card.type === "plasma-cannon"
      ? card.owner === this.currentPlayer && !card.tapped
      : card.canUsePower;
    if (!this.currentPlayer.cards.includes(card) || !canStart || !hasTarget) {
      return false;
    }
    this.pendingTechCard = card;
    this.pendingTechTargets = [];
    this.pendingColonyTargets = [];
    this.pendingTechAction = card.type === "data-crystal"
      ? "power-region"
      : card.type === "plasma-cannon" ? "power-multi-ship" : "power";
    this.postEvent(EventName.techCardsChanged, card);
    return true;
  }

  usePendingTechOnShip(ship) {
    if (!this.pendingTechCard) {
      return false;
    }
    const card = this.pendingTechCard;
    if (this.pendingTechAction === "discard-ship") {
      if (!card.canDiscardOnShip(ship)) {
        return false;
      }
      this.createUndoPoint();
      if (!card.useDiscardOnShip(ship)) {
        return false;
      }
      this.clearPendingTech();
      this.postEvent(EventName.techCardsChanged, card);
      return true;
    }
    if (card.type === "plasma-cannon") {
      const selectedIndex = this.pendingTechTargets.indexOf(ship);
      if (selectedIndex >= 0) {
        this.pendingTechTargets.splice(selectedIndex, 1);
        if (ship.isSelected) {
          ship.toggleSelect();
        }
        this.postEvent(EventName.techCardsChanged, card);
        return true;
      }
      if (!card.canTargetPlasmaShip(ship, this.pendingTechTargets)) {
        return false;
      }
      this.pendingTechTargets.push(ship);
      if (!ship.isSelected) {
        ship.toggleSelect();
      }
      this.postEvent(EventName.techCardsChanged, card);
      return true;
    }
    if (card.type === "gravity-manipulator") {
      if (this.pendingTechTargets.length === 0) {
        if (!card.canUsePowerOnShip(ship)) {
          return false;
        }
        this.pendingTechTargets.push(ship);
        this.postEvent(EventName.techCardsChanged, card);
        return true;
      }
      if (!card.canLowerGravityShip(ship, this.pendingTechTargets[0])) {
        return false;
      }
      this.createUndoPoint();
      if (!card.useGravityPower(this.pendingTechTargets[0], ship)) {
        return false;
      }
      this.clearPendingTech();
      this.postEvent(EventName.techCardsChanged, card);
      return true;
    }
    if (!card.canUsePowerOnShip(ship)) {
      return false;
    }
    this.createUndoPoint();
    if (!card.usePowerOnShip(ship)) {
      return false;
    }
    this.clearPendingTech();
    this.postEvent(EventName.techCardsChanged, card);
    return true;
  }

  selectRegion(region) {
    if (
      this.pendingTechCard
      && this.pendingTechAction === "discard-colony-destination"
    ) {
      const card = this.pendingTechCard;
      const selection = this.pendingColonyTargets[0];
      if (
        card.type !== "orbital-teleporter"
        || !card.canUseDiscard
        || !selection
        || !region
        || selection.region === region
        || selection.region.hasRepulsorField
        || selection.region.coloniesForPlayer(selection.player.playerIndex) <= 0
      ) {
        return false;
      }
      this.createUndoPoint();
      if (!card.useTeleporterColonyDiscard(this.pendingColonyTargets[0], region)) {
        return false;
      }
      this.clearPendingTech();
      this.postEvent(EventName.techCardsChanged, region);
      return true;
    }
    if (this.pendingTechCard && this.pendingTechAction === "power-region") {
      const card = this.pendingTechCard;
      if (!card.canUsePowerOnRegion(region)) {
        return false;
      }
      this.createUndoPoint();
      if (!card.usePowerOnRegion(region)) {
        return false;
      }
      this.clearPendingTech();
      this.postEvent(EventName.techCardsChanged, region);
      return true;
    }
    if (this.pendingTechCard && this.pendingTechAction === "discard") {
      const card = this.pendingTechCard;
      if (!card.canUseDiscard || !card.hasImplementedRegionDiscard || !region) {
        return false;
      }
      this.createUndoPoint();
      if (!card.useDiscardOnRegion(region)) {
        return false;
      }
      this.clearPendingTech();
      this.postEvent(EventName.techCardsChanged, region);
      return true;
    }
    if (
      !this.regions.includes(region)
      || region.hasRepulsorField
      || this.currentPlayer.coloniesToLaunch <= 0
    ) {
      return false;
    }
    this.createUndoPoint();
    return region.launchColony(this.currentPlayerIndex);
  }

  beginTechDiscard(card) {
    if (
      !this.currentPlayer.cards.includes(card)
      || !card.canUseDiscard
      || (
        !card.hasImplementedRegionDiscard
        && !card.hasImplementedShipDiscard
        && !card.hasImplementedColonyDiscard
      )
    ) {
      return false;
    }
    this.pendingTechCard = card;
    this.pendingTechTargets = [];
    this.pendingColonyTargets = [];
    this.pendingTechAction = card.hasImplementedShipDiscard
      ? "discard-ship"
      : card.hasImplementedColonyDiscard ? "discard-colony" : "discard";
    this.postEvent(EventName.techCardsChanged, card);
    return true;
  }

  confirmPendingTechPower() {
    if (
      this.pendingTechAction !== "power-multi-ship"
      || !this.pendingTechCard
      || this.pendingTechTargets.length === 0
      || this.pendingTechTargets.some((ship, index) =>
        !this.pendingTechCard.canTargetPlasmaShip(ship, this.pendingTechTargets.slice(0, index)))
    ) {
      return false;
    }
    this.createUndoPoint();
    if (
      this.pendingTechAction !== "power-multi-ship"
      || !this.pendingTechCard?.usePlasmaPower(this.pendingTechTargets)
    ) {
      return false;
    }
    const card = this.pendingTechCard;
    this.clearPendingTech();
    this.postEvent(EventName.techCardsChanged, card);
    return true;
  }

  selectPlacedColony(region, player) {
    if (
      this.pendingTechAction !== "discard-colony"
      || region.hasRepulsorField
      || region.coloniesForPlayer(player.playerIndex) <= 0
    ) {
      return false;
    }
    const selection = { region, player };
    if (this.pendingTechCard.type === "orbital-teleporter") {
      this.pendingColonyTargets = [selection];
      this.pendingTechAction = "discard-colony-destination";
      this.postEvent(EventName.techCardsChanged, region);
      return true;
    }
    if (this.pendingTechCard.type === "polarity-device") {
      if (
        this.pendingColonyTargets.length > 0
        && this.pendingColonyTargets[0].region === region
      ) {
        return false;
      }
      this.pendingColonyTargets.push(selection);
      if (this.pendingColonyTargets.length < 2) {
        this.postEvent(EventName.techCardsChanged, region);
        return true;
      }
      const card = this.pendingTechCard;
      const [first, second] = this.pendingColonyTargets;
      if (
        !card.canUseDiscard
        || first.region === second.region
        || first.region.coloniesForPlayer(first.player.playerIndex) <= 0
        || second.region.coloniesForPlayer(second.player.playerIndex) <= 0
      ) {
        return false;
      }
      this.createUndoPoint();
      if (!card.usePolarityColonyDiscard(...this.pendingColonyTargets)) {
        return false;
      }
      this.clearPendingTech();
      this.postEvent(EventName.techCardsChanged, region);
      return true;
    }
    return false;
  }

  clearPendingTech() {
    this.pendingTechCard = null;
    this.pendingTechTargets = [];
    this.pendingColonyTargets = [];
    this.pendingTechAction = null;
  }

  cancelPendingSelection() {
    if (this.currentPlayer.isRaiding) {
      return this.currentPlayer.cancelRaid();
    }
    if (!this.pendingTechCard) {
      return false;
    }
    if (this.pendingTechAction === "power-multi-ship") {
      for (const ship of this.pendingTechTargets) {
        if (ship.isSelected) {
          ship.toggleSelect();
        }
      }
    }
    const card = this.pendingTechCard;
    this.clearPendingTech();
    this.postEvent(EventName.techCardsChanged, card);
    return true;
  }

  gotoNextPlayer() {
    if (!this.canEndTurn) {
      return false;
    }
    this.currentPlayer.endTurnCleanup();
    this.clearUndoRedo();
    this.pendingTechCard = null;
    this.pendingTechTargets = [];
    this.pendingColonyTargets = [];
    this.pendingTechAction = null;
    const nextPlayerIndex = (this.currentPlayerIndex + 1) % this.numPlayers;
    if (nextPlayerIndex < this.currentPlayerIndex) {
      this.numTurns += 1;
      this.postEvent(EventName.nextTurn, this);
    }
    this.currentPlayerIndex = nextPlayerIndex;
    this.currentPlayer.gatherShips();
    this.postEvent(EventName.nextPlayer, this);
    return true;
  }
}