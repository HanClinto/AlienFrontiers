export const TechCardType = Object.freeze({
  alienCity: "alien-city",
  alienMonument: "alien-monument",
  boosterPod: "booster-pod",
  plasmaCannon: "plasma-cannon",
  resourceCache: "resource-cache",
  stasisBeam: "stasis-beam",
  gravityManipulator: "gravity-manipulator",
  polarityDevice: "polarity-device",
  dataCrystal: "data-crystal",
  orbitalTeleporter: "orbital-teleporter",
  holographicDecoy: "holographic-decoy",
  temporalWarper: "temporal-warper",
});

export const TECH_CARD_DEFINITIONS = Object.freeze([
  { type: TechCardType.alienCity, title: "Alien City", title1: "ALIEN", title2: "CITY", image: "tech_ac.png", count: 1, victoryPoints: 1, hasPower: false, hasDiscard: false, powerText: "Gain 1 Victory Point while you possess this card." },
  { type: TechCardType.alienMonument, title: "Alien Monument", title1: "ALIEN", title2: "MONUMENT", image: "tech_am.png", count: 1, victoryPoints: 1, hasPower: false, hasDiscard: false, powerText: "Gain 1 Victory Point while you possess this card." },
  { type: TechCardType.boosterPod, title: "Booster Pod", title1: "BOOSTER", title2: "POD", image: "tech_bp.png", count: 2, powerText: "Pay 1 fuel to add one point to one of your unplaced ships.", discardText: "Discard to remove all fields from a territory." },
  { type: TechCardType.plasmaCannon, title: "Plasma Cannon", title1: "PLASMA", title2: "CANNON", image: "tech_pc.png", count: 2, powerText: "Pay 1 fuel per ship to move other players' ships from one orbital facility to Maintenance Bay.", discardText: "Discard to destroy one ship. Its owner must have at least 4 ships." },
  { type: TechCardType.resourceCache, title: "Resource Cache", title1: "RESOURCE", title2: "CACHE", image: "tech_rc.png", count: 2, hasPower: false, hasDiscard: false, powerText: "After each roll: more even ships grants 1 fuel; more odd ships grants 1 ore; a tie grants both and discards this card." },
  { type: TechCardType.stasisBeam, title: "Stasis Beam", title1: "STASIS", title2: "BEAM", image: "tech_sb.png", count: 2, powerText: "Pay 1 fuel to subtract one point from one of your unplaced ships.", discardText: "Discard to place or move the Isolation Field." },
  { type: TechCardType.gravityManipulator, title: "Gravity Manipulator", title1: "GRAVITY", title2: "MANIPULATOR", image: "tech_gm.png", count: 2, baseFuelCost: 2, powerText: "Pay 2 fuel to move one point from one unplaced ship to another.", discardText: "Discard to place or move the Repulsor Field." },
  { type: TechCardType.polarityDevice, title: "Polarity Device", title1: "POLARITY", title2: "DEVICE", image: "tech_pd.png", count: 2, powerText: "Pay 1 fuel to flip one unplaced ship to its opposite face.", discardText: "Discard to swap two colonies on different territories." },
  { type: TechCardType.dataCrystal, title: "Data Crystal", title1: "DATA", title2: "CRYSTAL", image: "tech_dc.png", count: 2, powerText: "Pay 1 fuel per colony on a territory to use its bonus this turn.", discardText: "Discard to place or move the Positron Field." },
  { type: TechCardType.orbitalTeleporter, title: "Orbital Teleporter", title1: "ORBITAL", title2: "TELEPORTER", image: "tech_ot.png", count: 2, baseFuelCost: 2, powerText: "Pay 2 fuel to reuse one of your ships at a different orbital facility.", discardText: "Discard to move any colony to a different territory." },
  { type: TechCardType.holographicDecoy, title: "Holographic Decoy", title1: "HOLOGRAPHIC", title2: "DECOY", image: "tech_hd.png", count: 2, hasPower: false, hasDiscard: false, powerText: "Opponents may not raid fuel or ore from you.", discardText: "If an opponent steals tech from you, it must be this card." },
  { type: TechCardType.temporalWarper, title: "Temporal Warper", title1: "TEMPORAL", title2: "WARPER", image: "tech_tw.png", count: 2, powerText: "Pay 1 fuel to reroll any number of your unplaced ships.", discardText: "Review the discard pile, then discard to claim one tech." },
]);

export class TechCard {
  constructor(state, cardID, definition) {
    this.state = state;
    this.cardID = cardID;
    this.definition = definition;
    this.owner = null;
    this.tapped = false;
    this.isSelected = false;
  }

  get type() { return this.definition.type; }
  get title() { return this.definition.title; }
  get title1() { return this.definition.title1; }
  get title2() { return this.definition.title2; }
  get imageFilename() { return this.definition.image; }
  get victoryPoints() { return this.definition.victoryPoints ?? 0; }
  get baseFuelCost() { return this.definition.baseFuelCost ?? 1; }
  get hasPower() { return this.definition.hasPower ?? true; }
  get hasDiscard() { return this.definition.hasDiscard ?? true; }
  get powerText() { return this.definition.powerText ?? ""; }
  get discardText() { return this.definition.discardText ?? ""; }

  get adjustedFuelCost() {
    const discount = this.owner && this.state.pohlFoothills.playerHasBonus(this.owner) ? 1 : 0;
    return this.baseFuelCost - discount;
  }

  get canUsePower() {
    return this.owner === this.state.currentPlayer
      && this.hasPower
      && !this.tapped
      && this.owner.fuel >= this.adjustedFuelCost;
  }

  get canUseDiscard() {
    const canUse = this.owner === this.state.currentPlayer
      && this.hasDiscard
      && !this.tapped
      && this.owner.techsDiscarded === 0;
    if (!canUse || this.type !== TechCardType.temporalWarper) {
      return canUse;
    }
    return this.state.techDiscardDeck.some((card) =>
      !this.owner.cards.some((ownedCard) => ownedCard.type === card.type));
  }

  get hasImplementedRegionDiscard() {
    return [
      TechCardType.boosterPod,
      TechCardType.stasisBeam,
      TechCardType.gravityManipulator,
      TechCardType.dataCrystal,
    ].includes(this.type);
  }

  get hasImplementedShipDiscard() {
    return this.type === TechCardType.plasmaCannon;
  }

  get hasImplementedColonyDiscard() {
    return [TechCardType.orbitalTeleporter, TechCardType.polarityDevice].includes(this.type);
  }

  get hasImplementedCardDiscard() {
    return this.type === TechCardType.temporalWarper;
  }

  canClaimDiscardedCard(card) {
    return this.type === TechCardType.temporalWarper
      && this.canUseDiscard
      && this.state.techDiscardDeck.includes(card)
      && !this.owner.cards.some((ownedCard) => ownedCard.type === card.type);
  }

  useDiscardOnCard(card) {
    if (!this.canClaimDiscardedCard(card)) {
      return false;
    }
    const owner = this.owner;
    this.state.techDiscardDeck.splice(this.state.techDiscardDeck.indexOf(card), 1);
    owner.addCard(card);
    this.consumeDiscard();
    this.state.logMove(`${owner.playerName}: Discarded Temporal Warper to claim ${card.title}`);
    return true;
  }

  canUsePowerOnShip(ship) {
    if (!this.canUsePower || !ship || ship.player !== this.owner) {
      return false;
    }
    if (this.type === TechCardType.orbitalTeleporter) {
      return ship.docked
        && ship.dock.orbital !== this.state.maintenanceBay
        && ship.dock.orbital !== this.state.terraformingStation;
    }
    if (ship.docked) {
      return false;
    }
    if (
      ship.teleportRestriction
      && this.type !== TechCardType.polarityDevice
    ) {
      return false;
    }
    if (this.type === TechCardType.temporalWarper) {
      return this.owner.initialRollDone;
    }
    if (this.type === TechCardType.boosterPod) {
      return ship.value < 6;
    }
    if (this.type === TechCardType.stasisBeam) {
      return ship.value > 1;
    }
    if (this.type === TechCardType.gravityManipulator) {
      return ship.value < 6;
    }
    return this.type === TechCardType.polarityDevice;
  }

  useTemporalWarperPower(ships, random = this.state.random) {
    const uniqueShips = [...new Set(ships)];
    if (
      this.type !== TechCardType.temporalWarper
      || uniqueShips.length === 0
      || uniqueShips.length !== ships.length
      || uniqueShips.some((ship) => !this.canUsePowerOnShip(ship))
    ) {
      return false;
    }
    const owner = this.owner;
    const previousValues = uniqueShips.map((ship) => ship.value);
    owner.fuel -= this.adjustedFuelCost;
    for (const ship of uniqueShips) {
      if (ship.isSelected) {
        ship.toggleSelect();
      }
      ship.roll(random);
    }
    this.setTapped(true);
    owner.applyResourceCache();
    this.state.postEvent("resources-changed", owner);
    this.state.postEvent("ships-rolled", owner);
    this.state.logMove(
      `${owner.playerName}: Re-rolled ${previousValues.join(", ")} to ${uniqueShips.map((ship) => ship.value).join(", ")} using ${this.adjustedFuelCost} fuel`,
    );
    return true;
  }

  canLowerGravityShip(ship, shipToRaise) {
    return this.canUsePower
      && ship
      && ship !== shipToRaise
      && ship.player === this.owner
      && !ship.docked
      && !ship.teleportRestriction
      && ship.value > 1;
  }

  usePowerOnShip(ship) {
    if (this.type === TechCardType.temporalWarper || !this.canUsePowerOnShip(ship)) {
      return false;
    }
    this.owner.fuel -= this.adjustedFuelCost;
    if (this.type === TechCardType.orbitalTeleporter) {
      ship.teleportRestriction = ship.dock.orbital;
      ship.undock();
    } else if (this.type === TechCardType.boosterPod) {
      ship.value += 1;
    } else if (this.type === TechCardType.stasisBeam) {
      ship.value -= 1;
    } else if (this.type === TechCardType.polarityDevice) {
      ship.value = 7 - ship.value;
    }
    if (this.type !== TechCardType.orbitalTeleporter) {
      ship.rollIndex += 1;
    }
    this.setTapped(true);
    this.state.postEvent("resources-changed", this.owner);
    this.state.postEvent("ship-changed", ship);
    return true;
  }

  useGravityPower(shipToRaise, shipToLower) {
    if (
      this.type !== TechCardType.gravityManipulator
      || !this.canUsePowerOnShip(shipToRaise)
      || !this.canLowerGravityShip(shipToLower, shipToRaise)
    ) {
      return false;
    }
    this.owner.fuel -= this.adjustedFuelCost;
    shipToRaise.value += 1;
    shipToLower.value -= 1;
    shipToRaise.rollIndex += 1;
    shipToLower.rollIndex += 1;
    this.setTapped(true);
    this.state.postEvent("resources-changed", this.owner);
    this.state.postEvent("ship-changed", shipToRaise);
    this.state.postEvent("ship-changed", shipToLower);
    return true;
  }

  dataCrystalCost(region) {
    return region.numColonies
      - (this.state.pohlFoothills.playerHasBonus(this.owner) ? 1 : 0);
  }

  canUsePowerOnRegion(region) {
    return this.type === TechCardType.dataCrystal
      && this.owner === this.state.currentPlayer
      && !this.tapped
      && region
      && region !== this.state.burroughsDesert
      && !region.hasIsolationField
      && region.numColonies > 0
      && !region.playerHasBonus(this.owner)
      && this.owner.fuel >= this.dataCrystalCost(region);
  }

  usePowerOnRegion(region) {
    if (!this.canUsePowerOnRegion(region)) {
      return false;
    }
    this.owner.fuel -= this.dataCrystalCost(region);
    this.owner.borrowingRegion = region;
    this.setTapped(true);
    this.state.postEvent("resources-changed", this.owner);
    return true;
  }

  plasmaCost(shipCount) {
    const discount = this.state.pohlFoothills.playerHasBonus(this.owner) ? 1 : 0;
    return shipCount - discount;
  }

  canTargetPlasmaShip(ship, selectedShips = []) {
    if (
      this.type !== TechCardType.plasmaCannon
      || this.owner !== this.state.currentPlayer
      || this.tapped
      || !ship
      || ship.player === this.owner
      || !ship.docked
      || ship.dock.orbital === this.state.maintenanceBay
    ) {
      return false;
    }
    if (
      selectedShips.length > 0
      && selectedShips[0].dock.orbital !== ship.dock.orbital
    ) {
      return false;
    }
    return this.owner.fuel >= this.plasmaCost(selectedShips.length + 1);
  }

  usePlasmaPower(ships) {
    if (
      ships.length === 0
      || ships.some((ship, index) => !this.canTargetPlasmaShip(ship, ships.slice(0, index)))
    ) {
      return false;
    }
    this.owner.fuel -= this.plasmaCost(ships.length);
    for (const ship of ships) {
      if (ship.dock.orbital === this.state.terraformingStation) {
        ship.player.deactivateShip(ship);
      } else {
        this.state.maintenanceBay.dockShip(ship);
      }
      if (ship.isSelected) {
        ship.toggleSelect();
      }
    }
    this.setTapped(true);
    this.state.postEvent("resources-changed", this.owner);
    return true;
  }

  canDiscardOnShip(ship) {
    return this.type === TechCardType.plasmaCannon
      && this.canUseDiscard
      && ship
      && ship.player !== this.owner
      && ship.docked
      && (ship.isArtifactShip || ship.player.activeNativeShips.length > 3);
  }

  useDiscardOnShip(ship) {
    if (!this.canDiscardOnShip(ship)) {
      return false;
    }
    const owner = this.owner;
    ship.player.deactivateShip(ship);
    owner.techsDiscarded += 1;
    owner.removeCard(this);
    this.state.discardTechCard(this);
    return true;
  }

  consumeDiscard() {
    const owner = this.owner;
    this.state.checkArtifactShipControl();
    owner.techsDiscarded += 1;
    owner.removeCard(this);
    this.state.discardTechCard(this);
  }

  useTeleporterColonyDiscard(selection, destination) {
    if (
      this.type !== TechCardType.orbitalTeleporter
      || !this.canUseDiscard
      || !selection
      || !destination
      || selection.region === destination
      || selection.region.hasRepulsorField
      || selection.region.coloniesForPlayer(selection.player.playerIndex) <= 0
    ) {
      return false;
    }
    selection.region.colonyCounts[selection.player.playerIndex] -= 1;
    destination.colonyCounts[selection.player.playerIndex] += 1;
    this.state.checkArtifactShipControl();
    this.consumeDiscard();
    this.state.postEvent("colonies-changed", destination);
    return true;
  }

  usePolarityColonyDiscard(first, second) {
    if (
      this.type !== TechCardType.polarityDevice
      || !this.canUseDiscard
      || !first
      || !second
      || first.region === second.region
      || first.region.hasRepulsorField
      || second.region.hasRepulsorField
      || first.region.coloniesForPlayer(first.player.playerIndex) <= 0
      || second.region.coloniesForPlayer(second.player.playerIndex) <= 0
    ) {
      return false;
    }
    first.region.colonyCounts[first.player.playerIndex] -= 1;
    first.region.colonyCounts[second.player.playerIndex] += 1;
    second.region.colonyCounts[second.player.playerIndex] -= 1;
    second.region.colonyCounts[first.player.playerIndex] += 1;
    this.state.checkArtifactShipControl();
    this.consumeDiscard();
    this.state.postEvent("colonies-changed", first.region);
    return true;
  }

  useDiscardOnRegion(region) {
    if (!this.canUseDiscard || !this.hasImplementedRegionDiscard || !region) {
      return false;
    }
    if (this.type === TechCardType.stasisBeam && region.hasRepulsorField) {
      return false;
    }
    if (this.type === TechCardType.boosterPod) {
      region.hasPositronField = false;
      region.hasRepulsorField = false;
      region.hasIsolationField = false;
    } else if (this.type === TechCardType.stasisBeam) {
      for (const candidate of this.state.regions) {
        candidate.hasIsolationField = false;
      }
      region.hasIsolationField = true;
    } else if (this.type === TechCardType.gravityManipulator) {
      for (const candidate of this.state.regions) {
        candidate.hasRepulsorField = false;
      }
      region.hasRepulsorField = true;
    } else if (this.type === TechCardType.dataCrystal) {
      for (const candidate of this.state.regions) {
        candidate.hasPositronField = false;
      }
      region.hasPositronField = true;
    }
    this.state.checkArtifactShipControl();
    const owner = this.owner;
    owner.techsDiscarded += 1;
    owner.removeCard(this);
    this.state.discardTechCard(this);
    this.state.postEvent("tech-cards-changed", region);
    return true;
  }

  setTapped(tapped) {
    if (this.tapped === tapped) {
      return;
    }
    this.tapped = tapped;
    this.state.postEvent("card-tapped", this);
  }
}

export function buildTechDeck(state) {
  const cards = [];
  let cardID = 0;
  for (const definition of TECH_CARD_DEFINITIONS) {
    for (let count = 0; count < definition.count; count += 1) {
      cards.push(new TechCard(state, cardID, definition));
      cardID += 1;
    }
  }
  return cards;
}

export function shuffleTechCards(cards, random) {
  const source = [...cards];
  const shuffled = [];
  while (source.length > 0) {
    const card = source.pop();
    const index = shuffled.length === 0
      ? 0
      : Math.floor(random() * (shuffled.length + 1));
    shuffled.splice(index, 0, card);
  }
  return shuffled;
}