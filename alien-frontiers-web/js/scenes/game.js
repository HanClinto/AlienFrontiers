import { AFLayer } from "../af-layer.js";
import { CCEaseSineInOut, CCMoveTo } from "../cocos/actions.js?v=2";
import { CCLayerColor, CCLabelTTF, CCNode, CCSprite, ccp } from "../cocos/core.js";
import { AIType, EventName } from "../game/constants.js";
import { SimpleAI } from "../game/simple-ai.js";

const PLAYER_DIE_PREFIXES = ["rd", "gn", "bl", "yl"];
const PLAYER_COLONY_IMAGES = [
  "hud_colony_red.png",
  "hud_colony_green.png",
  "hud_colony_blue.png",
  "hud_colony_yellow.png",
];
const PLAYER_DIE_IMAGES = [
  "hud_die_red.png",
  "hud_die_green.png",
  "hud_die_blue.png",
  "hud_die_yellow.png",
];
const PLAYER_COLONY_IMAGES_FULL = [
  "colony_red.png",
  "colony_green.png",
  "colony_blue.png",
  "colony_yellow.png",
];
const PLAYER_COLORS = ["#ff343e", "#40ff60", "#45caff", "#ffff60"];
const REGION_LAYOUTS = Object.freeze([
  { property: "herbertValley", position: [232, 635], title: "Herbert Valley", bonus: "bonus_herbert.png" },
  { property: "lemBadlands", position: [311, 738], title: "Lem Badlands", bonus: "bonus_lem.png" },
  { property: "heinleinPlains", position: [436, 738], title: "Heinlein Plains", bonus: "bonus_heinlein.png" },
  { property: "pohlFoothills", position: [518, 635], title: "Pohl Foothills", bonus: "bonus_pohl.png" },
  { property: "vanVogtMountains", position: [489, 520], upperTitle: "Van Vogt", title: "Mountains", bonus: "bonus_van_vogt.png" },
  { property: "asimovCrater", position: [261, 520], title: "Asimov Crater", bonus: "bonus_asimov.png" },
  { property: "bradburyPlateau", position: [374, 469], upperTitle: "Bradbury", title: "Plateau", bonus: "bonus_bradbury.png" },
  { property: "burroughsDesert", position: [374, 604], title: "Burroughs Desert", bonus: "bonus_burroughs.png" },
]);

export function rollingTrayPosition(shipIndex) {
  return ccp(
    600 + (shipIndex % 4) * 38,
    77 - Math.floor(shipIndex / 4) * 40,
  );
}

export function miniHUDPosition(numPlayers, playerIndex, expanded = false, frameWidth = 182) {
  return ccp(
    384 - (numPlayers * 0.5 - playerIndex - 0.5) * (frameWidth + 5),
    1024 + (expanded ? 0 : 380),
  );
}

export function techCardPosition(layout, cardIndex) {
  return layout === "tall"
    ? ccp(42 + 89 * cardIndex, -12)
    : ccp(30, -84 + 55 * cardIndex);
}

function tintedImage(image, color) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  context.globalCompositeOperation = "source-in";
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

export function regionAtBoardPoint(state, point) {
  const deltaX = point.x - 381;
  const deltaY = point.y - 580;
  const radius = Math.hypot(deltaX, deltaY);
  if (radius >= 210) {
    return null;
  }
  if (radius < 81) {
    return state.burroughsDesert;
  }
  let theta = Math.atan2(deltaX, deltaY);
  if (theta < 0) {
    theta += Math.PI * 2;
  }
  const slice = (Math.floor(theta * 1.114085542671068) + 7) % 7;
  return [
    state.heinleinPlains,
    state.pohlFoothills,
    state.vanVogtMountains,
    state.bradburyPlateau,
    state.asimovCrater,
    state.herbertValley,
    state.lemBadlands,
  ][slice];
}

class FacilityLayer extends CCNode {
  constructor(scene, orbital, position, hitBounds) {
    super();
    this.scene = scene;
    this.orbital = orbital;
    this.setPosition(position);

    const hitArea = new CCNode();
    hitArea.contentSize = { width: hitBounds.width, height: hitBounds.height };
    hitArea.setPosition(hitBounds.x, hitBounds.y);
    hitArea.interactive = true;
    hitArea.enabled = true;
    hitArea.activate = () => this.scene.commitShips(this.orbital);
    this.addChild(hitArea, -1);
  }

  label(text, position) {
    const label = new CCLabelTTF(text, "DIN-Medium", 12, "#fff");
    label.opacity = 204;
    label.setAnchorPoint(ccp(0, 1));
    label.setPosition(position);
    this.addChild(label, 1);
  }

  sprite(image, position, anchor = ccp(0, 0)) {
    const sprite = new CCSprite(image);
    sprite.setAnchorPoint(anchor);
    sprite.setPosition(position);
    this.addChild(sprite);
    return sprite;
  }
}

class SolarConverterLayer extends FacilityLayer {
  constructor(scene) {
    super(scene, scene.state.solarConverter, ccp(180, 800), { x: -8, y: -5, width: 125, height: 105 });
    this.label("SOLAR CONVERTER", ccp(0, 82));
    const dockImage = scene.assets.image("dock_normal.png");
    for (const dock of this.orbital.docks) {
      this.sprite(dockImage, this.dockPosition(dock.index));
    }
    this.sprite(scene.assets.image("icons_sc.png"), ccp(0, 6), ccp(0, 1));
  }

  dockPosition(index) {
    return ccp((index % 4) * 28, 8 - (Math.floor(index / 4) - 1) * 32);
  }
}

class MaintenanceBayLayer extends FacilityLayer {
  constructor(scene) {
    super(scene, scene.state.maintenanceBay, ccp(24, 587), { x: -8, y: -48, width: 150, height: 135 });
    this.label("MAINTENANCE", ccp(0, 73));
    this.label("BAY", ccp(0, 60));
    this.sprite(scene.assets.image("dock_mb.png"), ccp(27, 35), ccp(0, 1));
    const dockImage = scene.assets.image("dock_blank.png");
    for (const dock of this.orbital.docks) {
      this.sprite(dockImage, this.dockPosition(dock.index));
    }
  }

  dockPosition(index) {
    return ccp((index % 5) * 27, 12 - Math.floor(index / 5) * 26);
  }
}

class LunarMineLayer extends FacilityLayer {
  constructor(scene) {
    super(scene, scene.state.lunarMine, ccp(550, 325), { x: -8, y: -5, width: 130, height: 70 });
    this.label("LUNAR MINE", ccp(0, 53));
    this.iconWidth = scene.assets.image("icon_gte.png").naturalWidth;
    this.sprite(scene.assets.image("icon_gte.png"), ccp(0, 12));
    const dockImage = scene.assets.image("dock_normal.png");
    for (const dock of this.orbital.docks) {
      this.sprite(dockImage, this.dockPosition(dock.index));
    }
    this.sprite(scene.assets.image("icons_lm.png"), ccp(0, 7), ccp(0, 1));
  }

  dockPosition(index) {
    return ccp(this.iconWidth + 4 + index * 28, 8);
  }
}

class ShipyardLayer extends FacilityLayer {
  constructor(scene) {
    super(scene, scene.state.shipyard, ccp(24, 435), { x: -8, y: -5, width: 170, height: 70 });
    this.label("SHIPYARD", ccp(0, 53));
    this.dockPairWidth = scene.assets.image("dock_pair.png").naturalWidth;
    const dockImage = scene.assets.image("dock_pair.png");
    for (let groupIndex = 0; groupIndex < this.orbital.dockGroups.length; groupIndex += 1) {
      this.sprite(dockImage, ccp(groupIndex * (this.dockPairWidth + 2), 8));
    }
    this.sprite(scene.assets.image("icons_sy.png"), ccp(0, 7), ccp(0, 1));
  }

  dockPosition(index) {
    const groupIndex = Math.floor(index / 2);
    const groupX = groupIndex * (this.dockPairWidth + 2);
    return ccp(groupX + (index % 2 === 0 ? -1 : 25), 8);
  }
}

class OrbitalMarketLayer extends FacilityLayer {
  constructor(scene) {
    super(scene, scene.state.orbitalMarket, ccp(449, 825), { x: -8, y: -40, width: 115, height: 105 });
    this.label("ORBITAL MARKET", ccp(0, 53));
    this.dockPairWidth = scene.assets.image("dock_pair.png").naturalWidth;
    const dockImage = scene.assets.image("dock_pair.png");
    for (let groupIndex = 0; groupIndex < this.orbital.dockGroups.length; groupIndex += 1) {
      this.sprite(dockImage, ccp(groupIndex * (this.dockPairWidth + 2), 8));
    }
    this.sprite(scene.assets.image("icons_om.png"), ccp(0, 6), ccp(0, 1));
    this.tradeButton = scene.buttonFromImage(
      "button_medium_up.png",
      "button_medium_down.png",
      () => this.trade(),
      { label: "TRADE", fontSize: 12 },
    );
    this.tradeButton.setPosition(ccp(55, -27));
    this.addChild(this.tradeButton, 2);
  }

  dockPosition(index) {
    const groupIndex = Math.floor(index / 2);
    const groupX = groupIndex * (this.dockPairWidth + 2);
    return ccp(groupX + (index % 2 === 0 ? -1 : 25), 8);
  }

  trade() {
    if (this.scene.state.currentPlayer.aiType === AIType.human) {
      this.scene.state.currentPlayer.doMarketTrade();
    }
  }

  refresh() {
    const player = this.scene.state.currentPlayer;
    this.tradeButton.visible = player.aiType === AIType.human && player.ableToMarketTrade;
  }
}

class ColonyConstructorLayer extends FacilityLayer {
  constructor(scene) {
    super(scene, scene.state.colonyConstructor, ccp(346, 291), { x: -8, y: -5, width: 165, height: 70 });
    this.label("COLONY CONSTRUCTOR", ccp(0, 53));
    this.dockTripleWidth = scene.assets.image("dock_triple.png").naturalWidth;
    const dockImage = scene.assets.image("dock_triple.png");
    for (let groupIndex = 0; groupIndex < this.orbital.dockGroups.length; groupIndex += 1) {
      this.sprite(dockImage, ccp(groupIndex * (this.dockTripleWidth + 2), 8));
    }
    this.sprite(scene.assets.image("icons_cc.png"), ccp(0, 7), ccp(0, 1));
  }

  dockPosition(index) {
    const groupIndex = Math.floor(index / 3);
    const groupX = groupIndex * (this.dockTripleWidth + 2);
    return ccp(groupX + [-1, 25, 51][index % 3], 8);
  }
}

class RaidersOutpostLayer extends FacilityLayer {
  constructor(scene) {
    super(scene, scene.state.raidersOutpost, ccp(613, 425), { x: -8, y: -5, width: 165, height: 70 });
    this.label("RAIDERS' OUTPOST", ccp(0, 53));
    this.sprite(scene.assets.image("icon_gt.png"), ccp(0, 12));
    this.sprite(scene.assets.image("dock_straight.png"), ccp(22, 8));
    this.sprite(scene.assets.image("icon_to_mb.png"), ccp(102, 10));
    this.sprite(scene.assets.image("icons_raiders.png"), ccp(0, 7), ccp(0, 1));
  }

  dockPosition(index) {
    return ccp([21, 47, 73][index], 8);
  }
}

class RegionLayer extends CCNode {
  constructor(scene, layout) {
    super();
    this.scene = scene;
    this.region = scene.state[layout.property];
    this.colonyNodes = [];
    this.fieldNodes = [];
    this.setPosition(ccp(...layout.position));
    if (layout.upperTitle) {
      this.addRegionLabel(layout.upperTitle, ccp(8, 15));
    }
    this.addRegionLabel(layout.title, ccp(8, 1));
    const bonus = new CCSprite(scene.assets.image(layout.bonus));
    bonus.setPosition(ccp(8, -19));
    this.addChild(bonus, 1);
    this.refresh();
  }

  addRegionLabel(text, position) {
    const label = new CCLabelTTF(text, "DIN-Medium", 12, "#fff");
    label.opacity = 204;
    label.setPosition(position);
    this.addChild(label, 1);
  }

  refresh() {
    for (const node of this.colonyNodes) {
      this.removeChild(node);
    }
    this.colonyNodes.length = 0;
    for (const node of this.fieldNodes) {
      this.removeChild(node);
    }
    this.fieldNodes.length = 0;
    if (this.region.hasPositronField) {
      this.addField("field_positron_medium.png", ccp(3, 2), 0);
    }
    if (this.region.hasIsolationField) {
      this.addField("field_isolator_medium.png", ccp(4, -19), 0);
    }
    if (this.region.hasRepulsorField) {
      this.addField("field_repulsion_onecolony.png", ccp(4.5, -44), 4);
    }
    const playersWithColonies = this.scene.state.players.filter((player) =>
      this.region.coloniesForPlayer(player.playerIndex) > 0);
    playersWithColonies.forEach((player, activeIndex) => {
      const colonyCount = this.region.coloniesForPlayer(player.playerIndex);
      const colonyX = (playersWithColonies.length * 0.5 - (activeIndex + 1)) * 25;
      const colony = new CCSprite(this.scene.assets.image(PLAYER_COLONY_IMAGES_FULL[player.colorIndex]));
      colony.setAnchorPoint(ccp(0, 0));
      colony.setPosition(ccp(colonyX, -65));
      this.addChild(colony, 2);
      this.colonyNodes.push(colony);

      const counter = new CCLabelTTF(colonyCount, "DIN-Black", 20, "#fff");
      counter.setAnchorPoint(ccp(0, 0));
      counter.setPosition(ccp(colonyX + 15, -55));
      this.addChild(counter, 3);
      this.colonyNodes.push(counter);
    });
  }

  addField(fileName, position, zOrder) {
    const field = new CCSprite(this.scene.assets.image(fileName));
    field.setPosition(position);
    this.addChild(field, zOrder);
    this.fieldNodes.push(field);
  }
}

class TechCardView extends CCNode {
  constructor(scene, card, layout, onActivate = null) {
    super();
    this.scene = scene;
    this.card = card;
    this.layout = layout;
    const isTall = layout === "tall";
    const isTransparent = layout === "transparent";

    if (!isTransparent) {
      this.background = new CCSprite(scene.assets.image(
        isTall ? "tech_layer_bg.png" : "tech_layer_bg_mini_horiz.png",
      ));
      this.background.setPosition(isTall ? ccp(0, 0) : ccp(58, 0));
      this.addChild(this.background, 0);
    }

    this.cardImage = new CCSprite(scene.assets.image(card.imageFilename));
    this.cardImage.setPosition(isTall ? ccp(0, 14) : ccp(8, 0));
    if (!isTall) {
      this.cardImage.setScale(0.8);
    }
    this.addChild(this.cardImage, 1);

    this.title1 = this.addTitle(card.title1, isTall ? ccp(0, -13) : ccp(38, 5), isTall);
    this.title2 = this.addTitle(card.title2, isTall ? ccp(0, -27) : ccp(38, -9), isTall);
    if (onActivate) {
      const hitArea = new CCNode();
      hitArea.contentSize = isTall
        ? { width: 89, height: 92 }
        : isTransparent ? { width: 130, height: 40 } : { width: 182, height: 56 };
      hitArea.setPosition(
        isTall ? ccp(-44.5, -46) : isTransparent ? ccp(-22, -20) : ccp(-33, -28),
      );
      hitArea.interactive = true;
      hitArea.enabled = true;
      hitArea.touchPriority = -10;
      hitArea.activate = () => onActivate(card);
      this.addChild(hitArea, 3);
    }
    this.refresh();
  }

  addTitle(text, position, centered) {
    const label = new CCLabelTTF(
      text,
      "DIN-Medium",
      12,
      this.layout === "transparent" ? "#fff" : "#000",
    );
    label.setAnchorPoint(centered ? ccp(0.5, 1) : ccp(0, 0.5));
    label.setPosition(position);
    this.addChild(label, 2);
    return label;
  }

  refresh() {
    const opacity = this.card.tapped ? 127 : 255;
    this.cardImage.opacity = opacity;
    this.title1.opacity = opacity;
    this.title2.opacity = opacity;
    if (this.background) {
      const selected = this.card.owner?.selectedCard === this.card;
      const fileName = this.layout === "tall"
        ? selected ? "tech_layer_bg_selected.png" : "tech_layer_bg.png"
        : selected ? "tech_layer_bg_mini_horiz_selected.png" : "tech_layer_bg_mini_horiz.png";
      this.background.image = this.scene.assets.image(fileName);
    }
  }
}

class TechCardTray extends CCNode {
  constructor(scene, layout, onCardActivate = null) {
    super();
    this.scene = scene;
    this.layout = layout;
    this.onCardActivate = onCardActivate;
    this.cardNodes = [];
    this.signature = "";
    const background = new CCSprite(scene.assets.image(
      layout === "tall" ? "hud_card_tray_white_horiz.png" : "hud_card_tray_mini_white_vert.png",
    ));
    background.setAnchorPoint(ccp(0, 0.5));
    background.setPosition(ccp(-3, -12));
    this.addChild(background, 0);
  }

  refresh(player) {
    const signature = player.cards
      .map((card) => `${card.cardID}:${card.tapped ? 1 : 0}`)
      .join(",") + `|${player.selectedCard?.cardID ?? -1}`;
    if (signature === this.signature) {
      return;
    }
    this.signature = signature;
    for (const cardNode of this.cardNodes) {
      this.removeChild(cardNode);
    }
    this.cardNodes.length = 0;
    player.cards.forEach((card, cardIndex) => {
      const cardNode = new TechCardView(
        this.scene,
        card,
        this.layout,
        this.onCardActivate,
      );
      cardNode.setPosition(techCardPosition(this.layout, cardIndex));
      this.addChild(cardNode, cardIndex + 1);
      this.cardNodes.push(cardNode);
    });
  }
}

class AlienArtifactLayer extends FacilityLayer {
  constructor(scene) {
    super(scene, scene.state.alienArtifact, ccp(601, 794), { x: 0, y: -170, width: 140, height: 260 });
    this.label("ALIEN", ccp(12, 80));
    this.label("ARTIFACT", ccp(12, 67));
    const dockImage = scene.assets.image("dock_normal.png");
    for (const dock of this.orbital.docks) {
      this.sprite(dockImage, this.dockPosition(dock.index));
    }
    this.sprite(scene.assets.image("icons_aa.png"), ccp(12, -156), ccp(0, 1));

    this.cycleButton = scene.buttonFromImage(
      "ondark_button.png",
      "ondark_button_active.png",
      () => this.cycleCards(),
      {
        inactiveImage: "ondark_button_inactive.png",
        label: "CYCLE",
        fontSize: 11,
      },
    );
    this.cycleButton.setPosition(ccp(78, 31));
    this.addChild(this.cycleButton, 3);
    this.cardViews = [];
    this.signature = "";
    this.refresh();
  }

  dockPosition(index) {
    return ccp(12 + index * 28, -154);
  }

  cycleCards() {
    if (this.scene.state.currentPlayer.aiType === AIType.human) {
      this.scene.state.currentPlayer.shuffleCards();
    }
  }

  refresh() {
    const player = this.scene.state.currentPlayer;
    this.scene.setButtonIsEnabled(
      this.cycleButton,
      player.aiType === AIType.human && player.canShuffleCards,
    );
    const signature = this.scene.state.techDisplayDeck.map((card) => card.cardID).join(",");
    if (signature === this.signature) {
      return;
    }
    this.signature = signature;
    for (const cardView of this.cardViews) {
      this.removeChild(cardView);
    }
    this.cardViews.length = 0;
    this.scene.state.techDisplayDeck.forEach((card, cardIndex) => {
      const cardView = new TechCardView(
        this.scene,
        card,
        "transparent",
        (selectedCard) => this.scene.openArtifactCard(selectedCard),
      );
      cardView.setPosition(ccp(30, -5 - 42 * cardIndex));
      this.addChild(cardView, 2);
      this.cardViews.push(cardView);
    });
  }
}

class ArtifactCardDetail extends CCNode {
  constructor(scene) {
    super();
    this.scene = scene;
    this.card = null;
    this.visible = false;

    const blocker = new CCLayerColor("rgba(0,0,0,0.35)");
    blocker.interactive = true;
    blocker.enabled = true;
    blocker.touchPriority = -100;
    blocker.activate = () => {};
    this.addChild(blocker, 0);

    this.background = new CCSprite(scene.assets.image("aa_card_detail_box.png"));
    this.background.setPosition(ccp(678, 712));
    this.addChild(this.background, 1);
    const halfWidth = this.background.contentSize.width * 0.5;
    const height = this.background.contentSize.height;

    this.takeButton = scene.buttonFromImage(
      "ondark_button.png",
      "ondark_button_active.png",
      () => this.takeCard(),
      { inactiveImage: "ondark_button_inactive.png", label: "TAKE", fontSize: 11 },
    );
    this.takeButton.setPosition(ccp(halfWidth, 16));
    this.background.addChild(this.takeButton, 3);

    this.backButton = scene.buttonFromImage(
      "aa_back_button.png",
      "aa_back_button_active.png",
      () => this.close(),
    );
    this.backButton.setPosition(ccp(18, height - 18));
    this.background.addChild(this.backButton, 3);

    this.title1 = this.detailLabel("", ccp(halfWidth, height - 63));
    this.title2 = this.detailLabel("", ccp(halfWidth, height - 77));
    this.creditLabel = this.detailLabel("", ccp(halfWidth, 84));
    this.cardImage = null;
  }

  detailLabel(text, position) {
    const label = new CCLabelTTF(text, "DIN-Medium", 12, "#fff");
    label.setPosition(position);
    this.background.addChild(label, 2);
    return label;
  }

  open(card) {
    this.card = card;
    if (this.cardImage) {
      this.background.removeChild(this.cardImage);
    }
    this.cardImage = new CCSprite(this.scene.assets.image(card.imageFilename));
    this.cardImage.setPosition(ccp(
      this.background.contentSize.width * 0.5,
      this.background.contentSize.height - 36,
    ));
    this.background.addChild(this.cardImage, 2);
    this.title1.setString(card.title1);
    this.title2.setString(card.title2);
    this.refresh();
    this.visible = true;
  }

  refresh() {
    if (!this.card) {
      return;
    }
    const player = this.scene.state.currentPlayer;
    this.creditLabel.setString(`CREDIT ${player.artifactCreditAvailable} / 8`);
    this.scene.setButtonIsEnabled(
      this.takeButton,
      player.aiType === AIType.human && player.canPurchaseCard(this.card),
    );
  }

  takeCard() {
    if (this.card && this.scene.state.currentPlayer.purchaseCard(this.card)) {
      this.close();
    }
  }

  close() {
    this.visible = false;
    this.card = null;
  }
}

class PlayerMiniHUD extends CCNode {
  constructor(scene, player) {
    super();
    this.scene = scene;
    this.player = player;
    this.expanded = false;
    this.raidForced = false;
    this.targetPosition = null;

    this.frame = new CCSprite(scene.assets.image("hud_port_player_tab_full.png"));
    this.frame.setAnchorPoint(ccp(0.5, 1));
    this.addChild(this.frame, 0);

    const cornerImage = tintedImage(
      scene.assets.image("hud_port_corner_tint_mini.png"),
      PLAYER_COLORS[player.colorIndex],
    );
    this.corner = new CCSprite(cornerImage);
    this.corner.setPosition(ccp(66, -413));
    this.addChild(this.corner, 1);

    this.scoreLabel = this.label("0", 42, ccp(64, -409), "#fff");
    this.oreLabel = this.label("0", 22, ccp(-75, -430), "#000");
    this.fuelLabel = this.label("0", 22, ccp(-40, -430), "#000");
    this.colonyLabel = this.label("0", 22, ccp(-5, -430), "#000");
    this.diceLabel = this.label("0", 22, ccp(30, -430), "#000");

    this.colonyIcon = new CCSprite(scene.assets.image(PLAYER_COLONY_IMAGES[player.colorIndex]));
    this.colonyIcon.setPosition(ccp(-5, -406));
    this.addChild(this.colonyIcon, 2);
    this.dieIcon = new CCSprite(scene.assets.image(PLAYER_DIE_IMAGES[player.colorIndex]));
    this.dieIcon.setPosition(ccp(30, -406));
    this.addChild(this.dieIcon, 2);

    this.techTray = new TechCardTray(scene, "wide", (card) => this.selectRaidCard(card));
    this.techTray.setPosition(ccp(-88, -109));
    this.addChild(this.techTray, 1);

    this.raidControls = [];
    this.addRaidControl("ore", 1, ccp(-76, -458), "hud_button_RO_up.png", "hud_button_ro_up_active.png", "hud_button_ro_up_inactive.png");
    this.addRaidControl("ore", -1, ccp(-76, -482), "hud_button_ro_down.png", "hud_button_ro_down_active.png", "hud_button_ro_down_inactive.png");
    this.addRaidControl("fuel", 1, ccp(-42, -458), "hud_button_RO_up.png", "hud_button_ro_up_active.png", "hud_button_ro_up_inactive.png");
    this.addRaidControl("fuel", -1, ccp(-42, -482), "hud_button_ro_down.png", "hud_button_ro_down_active.png", "hud_button_ro_down_inactive.png");
    this.raidOreLabel = this.label("0", 18, ccp(-75.5, -472), "#000");
    this.raidFuelLabel = this.label("0", 18, ccp(-41.5, -472), "#000");

    this.tabHitArea = new CCNode();
    this.tabHitArea.contentSize = { width: 182, height: 65 };
    this.tabHitArea.setPosition(ccp(-91, -443));
    this.tabHitArea.interactive = true;
    this.tabHitArea.enabled = true;
    this.tabHitArea.touchPriority = -64;
    this.tabHitArea.activate = () => this.toggleExpanded();
    this.addChild(this.tabHitArea, 3);
    this.refresh();
  }

  label(text, fontSize, position, color) {
    const label = new CCLabelTTF(text, "DIN-Black", fontSize, color);
    label.setPosition(position);
    this.addChild(label, 2);
    return label;
  }

  addRaidControl(resource, delta, position, upImage, downImage, inactiveImage) {
    const button = this.scene.buttonFromImage(
      upImage,
      downImage,
      () => this.scene.state.currentPlayer.adjustRaidResource(this.player, resource, delta),
      { inactiveImage },
    );
    button.setPosition(position);
    this.addChild(button, 3);
    this.raidControls.push({ button, resource, delta });
  }

  selectRaidCard(card) {
    const currentPlayer = this.scene.state.currentPlayer;
    if (currentPlayer.isRaiding && this.player !== currentPlayer) {
      currentPlayer.selectRaidCard(card);
    }
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
    this.updatePosition();
  }

  updatePosition() {
    const destination = miniHUDPosition(
      this.scene.state.numPlayers,
      this.player.playerIndex,
      this.expanded,
      this.frame.contentSize.width,
    );
    if (!this.targetPosition) {
      this.setPosition(destination);
    } else if (
      destination.x !== this.targetPosition.x
      || destination.y !== this.targetPosition.y
    ) {
      this.stopAllActions();
      this.runAction(new CCEaseSineInOut(new CCMoveTo(0.5, destination)));
    }
    this.targetPosition = destination;
  }

  refresh() {
    const currentPlayer = this.scene.state.currentPlayer;
    const raidVictim = currentPlayer.isRaiding && this.player !== currentPlayer;
    if (currentPlayer.isRaiding) {
      this.expanded = raidVictim;
      this.raidForced = true;
    } else if (this.raidForced) {
      this.expanded = false;
      this.raidForced = false;
    }
    this.frame.image = this.scene.assets.image(
      raidVictim ? "hud_port_player_tab_full_RO.png" : "hud_port_player_tab_full.png",
    );
    this.scoreLabel.setString(this.player.vps);
    this.oreLabel.setString(this.player.ore - this.player.oreToRaid);
    this.fuelLabel.setString(this.player.fuel - this.player.fuelToRaid);
    this.oreLabel.color = this.player.oreToRaid > 0 ? "#c00" : "#000";
    this.fuelLabel.color = this.player.fuelToRaid > 0 ? "#c00" : "#000";
    this.colonyLabel.setString(this.player.coloniesLeft);
    this.diceLabel.setString(this.player.activeShips.length);
    this.techTray.refresh(this.player);
    this.raidOreLabel.setString(this.player.oreToRaid);
    this.raidFuelLabel.setString(this.player.fuelToRaid);
    this.raidOreLabel.visible = raidVictim;
    this.raidFuelLabel.visible = raidVictim;
    for (const control of this.raidControls) {
      control.button.visible = raidVictim;
      this.scene.setButtonIsEnabled(
        control.button,
        control.delta > 0
          ? currentPlayer.canRaidMore(this.player, control.resource)
          : this.player[`${control.resource}ToRaid`] > 0,
      );
    }
    this.updatePosition();
  }
}

class ShipSprite extends CCNode {
  constructor(scene, ship) {
    super();
    this.scene = scene;
    this.ship = ship;
    this.targetPosition = null;
    this.contentSize = { width: 43, height: 43 };
    this.setAnchorPoint(ccp(0.5, 0.5));
    this.interactive = true;
    this.enabled = true;
    this.activate = () => this.scene.toggleShip(this.ship);

    this.selectionSprite = new CCSprite(scene.assets.image("die_select.png"));
    this.selectionSprite.setPosition(ccp(21.5, 21.5));
    this.addChild(this.selectionSprite, 0);
    this.frameSprite = null;
    this.refresh();
  }

  refresh() {
    this.visible = this.ship.active;
    this.selectionSprite.visible = this.ship.isSelected;
    this.opacity = !this.ship.docked && !this.ship.player.initialRollDone ? 128 : 255;

    if (this.frameSprite) {
      this.removeChild(this.frameSprite);
    }
    const prefix = PLAYER_DIE_PREFIXES[this.ship.player.colorIndex];
    const frameIndex = this.ship.value >= 1 && this.ship.value <= 6 ? this.ship.value - 1 : 0;
    this.frameSprite = this.scene.director.frameCache.spriteFrameByName(`${prefix}-${frameIndex}.png`);
    this.frameSprite.setPosition(ccp(21.5, 21.5));
    this.addChild(this.frameSprite, 1);
    const destination = this.scene.shipPosition(this.ship);
    if (!this.targetPosition) {
      this.setPosition(destination);
    } else if (
      destination.x !== this.targetPosition.x
      || destination.y !== this.targetPosition.y
    ) {
      this.stopAllActions();
      this.runAction(new CCEaseSineInOut(new CCMoveTo(0.45, destination)));
    }
    this.targetPosition = destination;
  }
}

export class GameScene extends AFLayer {
  constructor(director, assets, state) {
    super(assets);
    this.director = director;
    this.state = state;
    this.shipSprites = new Map();
    this.unsubscribe = [];
    this.aiTimer = null;
    this.buildScene();
    this.refresh();
  }

  buildScene() {
    this.addChild(new CCLayerColor("#000033"), 0);

    const board = new CCSprite(this.assets.image("af_ipad_board.png"));
    board.setPosition(ccp(458, 512));
    this.addChild(board, 1);

    this.solarLayer = new SolarConverterLayer(this);
    this.addChild(this.solarLayer, 4);
    this.maintenanceLayer = new MaintenanceBayLayer(this);
    this.addChild(this.maintenanceLayer, 4);
    this.lunarLayer = new LunarMineLayer(this);
    this.addChild(this.lunarLayer, 4);
    this.shipyardLayer = new ShipyardLayer(this);
    this.addChild(this.shipyardLayer, 4);
    this.marketLayer = new OrbitalMarketLayer(this);
    this.addChild(this.marketLayer, 4);
    this.constructorLayer = new ColonyConstructorLayer(this);
    this.addChild(this.constructorLayer, 4);
    this.artifactLayer = new AlienArtifactLayer(this);
    this.addChild(this.artifactLayer, 4);
    this.raidersLayer = new RaidersOutpostLayer(this);
    this.addChild(this.raidersLayer, 4);

    this.regionLayers = REGION_LAYOUTS.map((layout) => {
      const layer = new RegionLayer(this, layout);
      this.addChild(layer, 3);
      return layer;
    });
    this.regionHitArea = new CCNode();
    this.regionHitArea.contentSize = { width: 420, height: 420 };
    this.regionHitArea.setAnchorPoint(ccp(0.5, 0.5));
    this.regionHitArea.setPosition(ccp(381, 580));
    this.regionHitArea.interactive = true;
    this.regionHitArea.enabled = false;
    this.regionHitArea.activate = (point) => this.selectRegionAt(point);
    this.addChild(this.regionHitArea, 3);

    this.buildHUD();
    this.playerMiniHUDs = this.state.players.map((player) => {
      const miniHUD = new PlayerMiniHUD(this, player);
      this.addChild(miniHUD, 9);
      return miniHUD;
    });
    this.ensureShipSprites();
    this.artifactDetail = new ArtifactCardDetail(this);
    this.addChild(this.artifactDetail, 12);
  }

  buildHUD() {
    this.uiFrame = new CCNode();
    this.uiFrame.setPosition(ccp(384, 98));
    this.addChild(this.uiFrame, 5);

    const frame = new CCSprite(this.assets.image("hud_port_player_tab_large.png"));
    this.uiFrame.addChild(frame, 0);

    this.rollButton = this.buttonFromImage(
      "button_roll_up.png",
      "button_roll_down.png",
      () => this.rollShips(),
      { label: "ROLL", fontSize: 16 },
    );
    this.rollButton.setPosition(ccp(260, -25));
    this.uiFrame.addChild(this.rollButton, 2);

    this.doneButton = this.buttonFromImage(
      "tray_btn_done.png",
      "tray_btn_done_active.png",
      () => this.doneTurn(),
      { inactiveImage: "tray_btn_done_inactive.png" },
    );
    this.doneButton.setPosition(ccp(305, -75));
    this.uiFrame.addChild(this.doneButton, 2);

    this.raidConfirmButton = this.buttonFromImage(
      "ondark_button.png",
      "ondark_button_active.png",
      () => this.state.currentPlayer.finishRaid(),
      { inactiveImage: "ondark_button_inactive.png", label: "OK", fontSize: 16 },
    );
    this.raidConfirmButton.setPosition(ccp(322, 112));
    this.uiFrame.addChild(this.raidConfirmButton, 3);

    this.playerLabel = this.hudLabel("0", 42, ccp(330, 76), "#fff");
    this.oreLabel = this.hudLabel("0", 22, ccp(183, 87), "#000");
    this.fuelLabel = this.hudLabel("0", 22, ccp(218, 87), "#000");
    this.colonyLabel = this.hudLabel("0", 22, ccp(253, 87), "#000");
    this.diceLabel = this.hudLabel("0", 22, ccp(288, 87), "#000");
    this.hintLabel = this.hudLabel("", 17, ccp(-168, 109), "#ffc200");

    this.currentTechTray = new TechCardTray(
      this,
      "tall",
      (card) => this.state.selectTechCard(card),
    );
    this.currentTechTray.setPosition(ccp(-166, 47));
    this.uiFrame.addChild(this.currentTechTray, 1);

    this.techUseButton = this.buttonFromImage(
      "menu_button_68.png",
      "menu_button_68_active.png",
      () => this.state.beginTechPower(this.state.currentPlayer.selectedCard),
      { label: "USE", fontSize: 11, fontColor: "#000" },
    );
    this.techUseButton.setPosition(ccp(-84, -76));
    this.uiFrame.addChild(this.techUseButton, 3);

    this.techDiscardButton = this.buttonFromImage(
      "menu_button_68.png",
      "menu_button_68_active.png",
      () => this.state.beginTechDiscard(this.state.currentPlayer.selectedCard),
      { label: "DISCARD", fontSize: 10, fontColor: "#000" },
    );
    this.techDiscardButton.setPosition(ccp(80, -76));
    this.uiFrame.addChild(this.techDiscardButton, 3);
  }

  hudLabel(text, fontSize, position, color) {
    const label = new CCLabelTTF(text, "DIN-Black", fontSize, color);
    label.setPosition(position);
    this.uiFrame.addChild(label, 2);
    return label;
  }

  onEnter() {
    this.director.soundManager?.bindState(this.state);
    this.unsubscribe.push(this.state.events.on(EventName.stateChanged, () => this.refresh()));
    this.scheduleAI();
  }

  onExit() {
    this.director.soundManager?.unbindState();
    clearTimeout(this.aiTimer);
    this.aiTimer = null;
    for (const unsubscribe of this.unsubscribe) {
      unsubscribe();
    }
    this.unsubscribe.length = 0;
  }

  shipPosition(ship) {
    if (!ship.docked) {
      return rollingTrayPosition(ship.shipIndex);
    }
    const orbital = ship.dock.orbital;
    const layer = new Map([
      [this.state.solarConverter, this.solarLayer],
      [this.state.maintenanceBay, this.maintenanceLayer],
      [this.state.lunarMine, this.lunarLayer],
      [this.state.shipyard, this.shipyardLayer],
      [this.state.orbitalMarket, this.marketLayer],
      [this.state.colonyConstructor, this.constructorLayer],
      [this.state.alienArtifact, this.artifactLayer],
      [this.state.raidersOutpost, this.raidersLayer],
    ]).get(orbital);
    if (!layer) {
      throw new Error(`No layer for docked orbital: ${orbital.title}`);
    }
    const localPosition = layer.dockPosition(ship.dock.index);
    return layer.convertToWorldSpace(ccp(localPosition.x + 13, localPosition.y + 13));
  }

  ensureShipSprites() {
    for (const player of this.state.players) {
      for (const ship of player.activeShips) {
        if (!this.shipSprites.has(ship)) {
          const shipSprite = new ShipSprite(this, ship);
          this.shipSprites.set(ship, shipSprite);
          this.addChild(shipSprite, 8);
        }
      }
    }
  }

  rollShips() {
    this.state.rollCurrentPlayerShips();
  }

  toggleShip(ship) {
    if (this.state.pendingTechCard) {
      this.state.usePendingTechOnShip(ship);
      return;
    }
    this.state.toggleShipSelection(ship);
  }

  commitShips(orbital) {
    this.state.commitSelectedShips(orbital);
  }

  doneTurn() {
    this.state.gotoNextPlayer();
  }

  selectRegionAt(point) {
    const region = regionAtBoardPoint(this.state, point);
    if (region) {
      this.state.selectRegion(region);
    }
  }

  openArtifactCard(card) {
    this.artifactDetail.open(card);
  }

  refresh() {
    const player = this.state.currentPlayer;
    this.ensureShipSprites();
    for (const shipSprite of this.shipSprites.values()) {
      shipSprite.refresh();
    }
    const isHumanTurn = player.aiType === AIType.human;
    const isSelectingRegion = isHumanTurn && player.coloniesToLaunch > 0;
    const isSelectingFieldRegion = isHumanTurn
      && this.state.pendingTechAction === "discard";
    if (isHumanTurn && this.aiTimer) {
      clearTimeout(this.aiTimer);
      this.aiTimer = null;
    }
    this.rollButton.visible = !player.initialRollDone;
    this.setButtonIsEnabled(this.rollButton, isHumanTurn);
    this.setButtonIsEnabled(this.doneButton, isHumanTurn && this.state.canEndTurn);
    this.raidConfirmButton.visible = player.isRaiding;
    this.setButtonIsEnabled(
      this.raidConfirmButton,
      isHumanTurn && player.raidSelectionComplete,
    );
    this.playerLabel.setString(player.vps);
    this.oreLabel.setString(player.ore);
    this.fuelLabel.setString(player.fuel);
    this.colonyLabel.setString(player.coloniesLeft);
    this.diceLabel.setString(player.activeShips.length);
    this.hintLabel.setString(isHumanTurn
      ? player.isRaiding ? "SELECT UP TO 4 RESOURCES OR ONE TECH"
        : isSelectingFieldRegion ? "SELECT A REGION FOR THE FIELD EFFECT"
        : this.state.pendingTechCard ? this.techPowerHint(this.state.pendingTechCard)
        : isSelectingRegion ? "SELECT A REGION FOR YOUR COLONY"
        : player.initialRollDone ? "SELECT DICE, THEN A FACILITY" : "ROLL YOUR SHIPS"
      : "AI TURN");
    this.currentTechTray.refresh(player);
    const selectedCard = player.selectedCard;
    const canUseSelected = selectedCard
      && selectedCard.canUsePower
      && player.undockedShips.some((ship) => selectedCard.canUsePowerOnShip(ship));
    this.techUseButton.visible = Boolean(canUseSelected) && !this.state.pendingTechCard;
    this.techDiscardButton.visible = Boolean(
      selectedCard?.canUseDiscard && selectedCard.hasImplementedRegionDiscard,
    ) && !this.state.pendingTechCard;
    this.regionHitArea.enabled = isSelectingRegion || isSelectingFieldRegion;
    for (const regionLayer of this.regionLayers) {
      regionLayer.refresh();
    }
    for (const miniHUD of this.playerMiniHUDs) {
      miniHUD.refresh();
    }
    this.marketLayer.refresh();
    this.artifactLayer.refresh();
    this.artifactDetail.refresh();

    this.updatePlayerIcon("colonyIcon", PLAYER_COLONY_IMAGES[player.colorIndex], ccp(254, 60));
    this.updatePlayerIcon("dieIcon", PLAYER_DIE_IMAGES[player.colorIndex], ccp(289, 60));
    this.scheduleAI();
  }

  techPowerHint(card) {
    if (card.type === "gravity-manipulator") {
      return this.state.pendingTechTargets.length === 0
        ? "SELECT AN UNDOCKED DIE TO INCREASE"
        : "SELECT A DIFFERENT DIE TO DECREASE";
    }
    if (card.type === "booster-pod") {
      return "SELECT AN UNDOCKED DIE TO INCREASE";
    }
    if (card.type === "stasis-beam") {
      return "SELECT AN UNDOCKED DIE TO DECREASE";
    }
    return "SELECT AN UNDOCKED DIE TO FLIP";
  }

  scheduleAI() {
    if (
      this.aiTimer
      || this.state.currentPlayer.aiType === AIType.human
      || this.director.scene !== this
    ) {
      return;
    }
    this.aiTimer = setTimeout(() => {
      this.aiTimer = null;
      if (
        this.director.scene !== this
        || this.state.currentPlayer.aiType === AIType.human
      ) {
        return;
      }
      SimpleAI.step(this.state);
      this.scheduleAI();
    }, 650);
  }

  updatePlayerIcon(propertyName, imageName, position) {
    if (this[propertyName]) {
      this.uiFrame.removeChild(this[propertyName]);
    }
    this[propertyName] = new CCSprite(this.assets.image(imageName));
    this[propertyName].setPosition(position);
    this.uiFrame.addChild(this[propertyName], 2);
  }
}