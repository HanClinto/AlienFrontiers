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
});

export const TECH_CARD_DEFINITIONS = Object.freeze([
  { type: TechCardType.alienCity, title: "Alien City", title1: "ALIEN", title2: "CITY", image: "tech_ac.png", count: 1, victoryPoints: 1, hasPower: false, hasDiscard: false },
  { type: TechCardType.alienMonument, title: "Alien Monument", title1: "ALIEN", title2: "MONUMENT", image: "tech_am.png", count: 1, victoryPoints: 1, hasPower: false, hasDiscard: false },
  { type: TechCardType.boosterPod, title: "Booster Pod", title1: "BOOSTER", title2: "POD", image: "tech_bp.png", count: 2 },
  { type: TechCardType.plasmaCannon, title: "Plasma Cannon", title1: "PLASMA", title2: "CANNON", image: "tech_pc.png", count: 2 },
  { type: TechCardType.resourceCache, title: "Resource Cache", title1: "RESOURCE", title2: "CACHE", image: "tech_rc.png", count: 2, hasPower: false, hasDiscard: false },
  { type: TechCardType.stasisBeam, title: "Stasis Beam", title1: "STASIS", title2: "BEAM", image: "tech_sb.png", count: 2 },
  { type: TechCardType.gravityManipulator, title: "Gravity Manipulator", title1: "GRAVITY", title2: "MANIPULATOR", image: "tech_gm.png", count: 2, baseFuelCost: 2 },
  { type: TechCardType.polarityDevice, title: "Polarity Device", title1: "POLARITY", title2: "DEVICE", image: "tech_pd.png", count: 2 },
  { type: TechCardType.dataCrystal, title: "Data Crystal", title1: "DATA", title2: "CRYSTAL", image: "tech_dc.png", count: 2 },
  { type: TechCardType.orbitalTeleporter, title: "Orbital Teleporter", title1: "ORBITAL", title2: "TELEPORTER", image: "tech_ot.png", count: 2, baseFuelCost: 2 },
  { type: TechCardType.holographicDecoy, title: "Holographic Decoy", title1: "HOLOGRAPHIC", title2: "DECOY", image: "tech_hd.png", count: 2, hasPower: false, hasDiscard: false },
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
    return this.owner === this.state.currentPlayer
      && this.hasDiscard
      && !this.tapped
      && this.owner.techsDiscarded === 0;
  }

  get hasImplementedRegionDiscard() {
    return [
      TechCardType.boosterPod,
      TechCardType.stasisBeam,
      TechCardType.gravityManipulator,
      TechCardType.dataCrystal,
    ].includes(this.type);
  }

  canUsePowerOnShip(ship) {
    if (!this.canUsePower || !ship || ship.player !== this.owner || ship.docked) {
      return false;
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

  canLowerGravityShip(ship, shipToRaise) {
    return this.canUsePower
      && ship
      && ship !== shipToRaise
      && ship.player === this.owner
      && !ship.docked
      && ship.value > 1;
  }

  usePowerOnShip(ship) {
    if (!this.canUsePowerOnShip(ship)) {
      return false;
    }
    this.owner.fuel -= this.adjustedFuelCost;
    if (this.type === TechCardType.boosterPod) {
      ship.value += 1;
    } else if (this.type === TechCardType.stasisBeam) {
      ship.value -= 1;
    } else if (this.type === TechCardType.polarityDevice) {
      ship.value = 7 - ship.value;
    }
    ship.rollIndex += 1;
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

  useDiscardOnRegion(region) {
    if (!this.canUseDiscard || !this.hasImplementedRegionDiscard || !region) {
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