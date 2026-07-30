import { EventName } from "./constants.js";
import { Ship } from "./ship.js";
import { TechCardType } from "./tech-card.js";

export class Player {
  constructor(state, playerIndex, colorIndex, numPlayers, aiType) {
    this.state = state;
    this.playerIndex = playerIndex;
    this.colorIndex = colorIndex;
    this.aiType = aiType;
    this.fuel = playerIndex === 1 || playerIndex === 3 ? 1 : 0;
    this.ore = playerIndex === 2 || playerIndex === 3 ? 1 : 0;
    this.coloniesLeft = 6 + (4 - numPlayers);
    this.coloniesToLaunch = 0;
    this.marketPrice = 0;
    this.cards = [];
    this.selectedCard = null;
    this.techsDiscarded = 0;
    this.artifactCreditAvailable = 0;
    this.artifactShufflesAvailable = 0;
    this.initialRollDone = false;
    this.allShips = Array.from({ length: 6 }, (_, index) => new Ship(this, index));
    this.activeShips = [];
    this.inactiveShips = [...this.allShips];
  }

  get playerName() {
    return `[P${this.playerIndex + 1}]`;
  }

  get selectedShips() {
    return this.activeShips.filter((ship) => ship.isSelected);
  }

  get undockedShips() {
    return this.activeShips.filter((ship) => !ship.docked);
  }

  get numUndockedShips() {
    return this.undockedShips.length;
  }

  get resourcesNeededForNextShip() {
    return this.activeShips.length - 2;
  }

  get ableToMarketTrade() {
    return this.marketPrice > 0 && this.fuel >= this.marketPrice;
  }

  get vps() {
    const regionVPs = this.state.regions.reduce((total, region) => {
      const colonies = region.coloniesForPlayer(this.playerIndex);
      const controlsRegion = region.playerWithMajority === this.playerIndex;
      return total + colonies + (controlsRegion ? 1 : 0)
        + (controlsRegion && region.hasPositronField ? 1 : 0);
    }, 0);
    return regionVPs + this.cards.reduce((total, card) => total + card.victoryPoints, 0);
  }

  addCard(card) {
    if (this.cards.some((ownedCard) => ownedCard.type === card.type)) {
      this.state.discardTechCard(card);
      return false;
    }
    card.owner = this;
    this.cards.push(card);
    this.state.postEvent(EventName.techCardsChanged, card);
    return true;
  }

  removeCard(card) {
    const cardIndex = this.cards.indexOf(card);
    if (cardIndex === -1) {
      return false;
    }
    this.cards.splice(cardIndex, 1);
    card.owner = null;
    this.state.postEvent(EventName.techCardsChanged, card);
    return true;
  }

  applyResourceCache() {
    const cache = this.cards.find((card) => card.type === TechCardType.resourceCache);
    if (!cache) {
      return;
    }
    const oddShips = this.activeShips.filter((ship) => ship.value % 2 === 1).length;
    const evenShips = this.activeShips.length - oddShips;
    if (oddShips > evenShips) {
      this.ore += 1;
    } else if (evenShips > oddShips) {
      this.fuel += 1;
    } else {
      this.ore += 1;
      this.fuel += 1;
      this.removeCard(cache);
      this.state.discardTechCard(cache);
    }
    this.state.postEvent(EventName.resourcesChanged, this);
  }

  canPurchaseCard(card) {
    return this.artifactCreditAvailable >= 8
      && this.state.techDisplayDeck.includes(card)
      && !this.cards.some((ownedCard) => ownedCard.type === card.type);
  }

  purchaseCard(card) {
    if (!this.canPurchaseCard(card)) {
      return false;
    }
    this.state.techDisplayDeck.splice(this.state.techDisplayDeck.indexOf(card), 1);
    this.addCard(card);
    this.state.fillTechDisplayPile();
    this.artifactCreditAvailable = 0;
    this.artifactShufflesAvailable = 0;
    this.state.postEvent(EventName.techCardsChanged, this);
    this.state.logMove(`${this.playerName}: Purchased tech ${card.title}`);
    return true;
  }

  get canShuffleCards() {
    return this.artifactShufflesAvailable > 0 && this.state.techDisplayDeck.length > 0;
  }

  shuffleCards() {
    if (!this.canShuffleCards) {
      return false;
    }
    for (const card of this.state.techDisplayDeck) {
      this.state.discardTechCard(card);
    }
    this.state.techDisplayDeck = [];
    this.state.fillTechDisplayPile();
    this.artifactShufflesAvailable -= 1;
    this.state.postEvent(EventName.techCardsChanged, this);
    return true;
  }

  addColony() {
    this.coloniesToLaunch += 1;
    this.state.postEvent(EventName.launchColony, this);
  }

  setMarketPrice(price) {
    this.marketPrice = price;
    this.state.postEvent(EventName.marketPriceChanged, this);
  }

  doMarketTrade() {
    if (!this.ableToMarketTrade) {
      return false;
    }
    this.fuel -= this.marketPrice;
    this.ore += 1;
    this.state.postEvent(EventName.resourcesChanged, this);
    this.state.logMove(`${this.playerName}: Traded ${this.marketPrice} fuel for 1 ore.`);
    return true;
  }

  activateStartingShips() {
    for (let count = 0; count < 3; count += 1) {
      this.activateShip();
    }
  }

  activateShip() {
    const ship = this.inactiveShips.shift();
    if (!ship) {
      return;
    }
    this.activeShips.push(ship);
    ship.active = true;
    this.state.maintenanceBay.dockShip(ship);
    this.state.postEvent(EventName.shipActivated, ship);
  }

  gatherShips() {
    for (const ship of this.activeShips) {
      ship.undock();
    }
  }

  rollShips(random = Math.random) {
    if (this.initialRollDone) {
      return false;
    }
    for (const ship of this.activeShips) {
      if (!ship.docked && ship.active) {
        ship.roll(random);
      }
    }
    this.state.logMove(`${this.playerName}: Rolled: ${this.activeShips.map((ship) => ship.value).join(", ")}`);
    this.initialRollDone = true;
    this.applyResourceCache();
    this.state.postEvent(EventName.shipsRolled, this);
    return true;
  }

  endTurnCleanup() {
    this.setMarketPrice(0);
    this.initialRollDone = false;
    this.techsDiscarded = 0;
    this.artifactCreditAvailable = 0;
    this.artifactShufflesAvailable = 0;
    for (const card of this.cards) {
      card.setTapped(false);
    }
    for (const ship of this.allShips) {
      ship.isSelected = false;
    }
    if (this.ore + this.fuel > 8) {
      this.ore = Math.min(this.ore, 8);
      this.fuel = Math.min(this.fuel, 8 - this.ore);
      this.state.postEvent(EventName.resourcesChanged, this);
    }
  }
}