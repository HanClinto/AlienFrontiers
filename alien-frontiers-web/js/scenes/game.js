import { AFLayer } from "../af-layer.js";
import { CCCallFunc, CCDelayTime, CCEaseElasticInOut, CCEaseElasticOut, CCEaseSineIn, CCEaseSineInOut, CCEaseSineOut, CCFadeTo, CCMoveTo, CCRepeatForever, CCRotateBy, CCScaleTo, CCSequence, CCTintTo } from "../cocos/actions.js?v=6";
import { CCLayerColor, CCLabelTTF, CCNode, CCSprite, ccp } from "../cocos/core.js";
import { AIType, EventName } from "../game/constants.js";
import { ExhaustiveAI, exhaustivePositionKey, exhaustivePositionKeysEqual } from "../game/exhaustive-ai.js";
import { GameHistory } from "../game/game-history.js";
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
const PLAYER_TINTS = [
  { r: 255, g: 52, b: 62 },
  { r: 64, g: 255, b: 96 },
  { r: 69, g: 202, b: 255 },
  { r: 255, g: 255, b: 96 },
];
export const MODAL_TOUCH_PRIORITIES = Object.freeze({
  pileBlocker: -1000,
  pileControl: -1100,
  pileTray: -1200,
  detailBlocker: -2000,
  detailPanel: -2050,
  detailControl: -2100,
});
export const DISCARD_PILE_LAYOUT = Object.freeze({
  width: 182,
  height: 286,
  cornerRadius: 7,
  trayWidth: 182,
  trayHeight: 202,
});
export const SHIP_SPRITE_SCALE = 0.8;
export const SHIP_SPRITE_SIZE = Object.freeze({ width: 32, height: 40 });
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
    587 + (shipIndex % 4) * 38,
    95 - Math.floor(shipIndex / 4) * 40,
  );
}

export function lunarMineHitBounds(dockCount) {
  const iconWidth = 18;
  const dockWidth = 26;
  const dockSpan = 28;
  const rightEdge = iconWidth + 4 + (dockCount - 1) * dockSpan + dockWidth;
  return { x: -8, y: -5, width: rightEdge + 8, height: 70 };
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

export function techTrayScrollBounds(layout, cardCount) {
  const cardSpan = layout === "tall" ? 89 : 56;
  const viewportSize = layout === "tall" ? 331 : 202;
  const play = cardCount * cardSpan - viewportSize;
  return play > 0
    ? { min: -play, max: 0 }
    : { min: 0, max: -play };
}

export function techTrayVisibleRange(layout, scrollOffset) {
  const cardSpan = layout === "tall" ? 89 : 56;
  const viewportSize = layout === "tall" ? 331 : 202;
  return {
    min: Math.max(0, Math.trunc(-scrollOffset / cardSpan)),
    max: Math.trunc((viewportSize - scrollOffset) / cardSpan),
  };
}

export function discardPileCards(cards) {
  return [...cards];
}

export function discardPileInitialOffset(cardCount) {
  return techTrayScrollBounds("wide", cardCount).min;
}

export function gameLogPosition(height = 142) {
  return ccp(40, 1024 - 846 - height);
}

export function techDescriptionLayout(column) {
  const center = column === "power" ? ccp(-84, -44) : ccp(80, -44);
  const size = { width: 160, height: 52 };
  return {
    position: ccp(center.x - size.width / 2, center.y - size.height / 2),
    size,
  };
}

export function colonistHubTrackPosition(numPlayers, playerIndex, step) {
  const verticalOffset = (4 - numPlayers) * 14;
  const y = -playerIndex * 28 - verticalOffset;
  return ccp(
    step < 7 ? 48 + step * 28 : 251,
    y === 0 ? 0 : y,
  );
}

class WrappedTextBox extends CCNode {
  constructor(width, height, options = {}) {
    super();
    this.contentSize = { width, height };
    this.clipRect = { x: 0, y: 0, width, height };
    this.text = "";
    this.fontName = options.fontName ?? "DIN-Medium";
    this.fontSize = options.fontSize ?? 11;
    this.lineHeight = options.lineHeight ?? 13;
    this.color = options.color ?? "#000";
    this.padding = options.padding ?? 2;
    this.followEnd = options.followEnd ?? false;
    this.textAlign = options.textAlign ?? "left";
    this.verticalAlign = options.verticalAlign ?? "top";
  }

  setText(text) {
    this.text = String(text ?? "");
  }

  wrappedLines(context) {
    const maxWidth = this.contentSize.width - this.padding * 2;
    const lines = [];
    for (const paragraph of this.text.split("\n")) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lines.push("");
        continue;
      }
      let line = words.shift();
      for (const word of words) {
        const candidate = `${line} ${word}`;
        if (context.measureText(candidate).width <= maxWidth) {
          line = candidate;
        } else {
          lines.push(line);
          line = word;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  draw(context) {
    context.save();
    context.translate(0, this.contentSize.height);
    context.scale(1, -1);
    context.font = `${this.fontSize}px "${this.fontName}"`;
    context.fillStyle = this.color;
    context.textAlign = this.textAlign;
    context.textBaseline = "top";
    const maxLines = Math.floor(
      (this.contentSize.height - this.padding * 2) / this.lineHeight,
    );
    let lines = this.wrappedLines(context);
    if (lines.length > maxLines) {
      lines = this.followEnd ? lines.slice(-maxLines) : lines.slice(0, maxLines);
    }
    const textHeight = lines.length * this.lineHeight;
    const startY = this.followEnd || this.verticalAlign === "bottom"
      ? this.contentSize.height - this.padding - textHeight
      : this.verticalAlign === "center"
        ? (this.contentSize.height - textHeight) / 2
        : this.padding;
    lines.forEach((line, index) => {
      const x = this.textAlign === "center"
        ? this.contentSize.width / 2
        : this.textAlign === "right" ? this.contentSize.width - this.padding : this.padding;
      context.fillText(line, x, startY + index * this.lineHeight);
    });
    context.restore();
  }
}

class RoundedPanel extends CCNode {
  constructor(width, height, radius) {
    super();
    this.contentSize = { width, height };
    this.radius = radius;
  }

  roundedRect(context, inset, radius) {
    const width = this.contentSize.width - inset * 2;
    const height = this.contentSize.height - inset * 2;
    context.beginPath();
    context.moveTo(inset + radius, inset);
    context.lineTo(inset + width - radius, inset);
    context.quadraticCurveTo(inset + width, inset, inset + width, inset + radius);
    context.lineTo(inset + width, inset + height - radius);
    context.quadraticCurveTo(
      inset + width,
      inset + height,
      inset + width - radius,
      inset + height,
    );
    context.lineTo(inset + radius, inset + height);
    context.quadraticCurveTo(inset, inset + height, inset, inset + height - radius);
    context.lineTo(inset, inset + radius);
    context.quadraticCurveTo(inset, inset, inset + radius, inset);
    context.closePath();
  }

  draw(context) {
    context.fillStyle = "#fff";
    this.roundedRect(context, 0, this.radius);
    context.fill();
    context.fillStyle = "#080d12";
    this.roundedRect(context, 2, this.radius - 2);
    context.fill();
  }
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
    this.showingPotential = null;
    this.dockSprites = [];
    this.setPosition(position);

    const hitArea = new CCNode();
    hitArea.contentSize = { width: hitBounds.width, height: hitBounds.height };
    hitArea.setPosition(hitBounds.x, hitBounds.y);
    hitArea.interactive = true;
    hitArea.enabled = true;
    hitArea.activate = () => this.scene.commitShips(this.orbital);
    this.addChild(hitArea, -1);
  }

  setPotential(showingPotential) {
    if (this.showingPotential === showingPotential) {
      return;
    }
    this.showingPotential = showingPotential;
    const brightness = showingPotential ? 255 : 100;
    for (const dockSprite of this.dockSprites) {
      dockSprite.stopAllActions();
      dockSprite.runAction(new CCTintTo(
        0.25,
        brightness,
        brightness,
        brightness,
      ));
    }
  }

  dockSprite(image, position, anchor = ccp(0, 0)) {
    const sprite = this.sprite(image, position, anchor);
    this.dockSprites.push(sprite);
    return sprite;
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
      this.dockSprite(dockImage, this.dockPosition(dock.index));
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
      this.dockSprite(dockImage, this.dockPosition(dock.index));
    }
  }

  dockPosition(index) {
    return ccp((index % 5) * 27, 12 - Math.floor(index / 5) * 26);
  }
}

class LunarMineLayer extends FacilityLayer {
  constructor(scene) {
    super(
      scene,
      scene.state.lunarMine,
      ccp(550, 325),
      lunarMineHitBounds(scene.state.lunarMine.docks.length),
    );
    this.label("LUNAR MINE", ccp(0, 53));
    this.iconWidth = scene.assets.image("icon_gte.png").naturalWidth;
    this.sprite(scene.assets.image("icon_gte.png"), ccp(0, 12));
    const dockImage = scene.assets.image("dock_normal.png");
    for (const dock of this.orbital.docks) {
      this.dockSprite(dockImage, this.dockPosition(dock.index));
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
      this.dockSprite(dockImage, ccp(groupIndex * (this.dockPairWidth + 2), 8));
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
      this.dockSprite(dockImage, ccp(groupIndex * (this.dockPairWidth + 2), 8));
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
      this.dockSprite(dockImage, ccp(groupIndex * (this.dockTripleWidth + 2), 8));
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
    this.dockSprite(scene.assets.image("dock_straight.png"), ccp(22, 8));
    this.sprite(scene.assets.image("icon_to_mb.png"), ccp(102, 10));
    this.sprite(scene.assets.image("icons_raiders.png"), ccp(0, 7), ccp(0, 1));
  }

  dockPosition(index) {
    return ccp([21, 47, 73][index], 8);
  }
}

class ColonistHubLayer extends FacilityLayer {
  constructor(scene) {
    super(scene, scene.state.colonistHub, ccp(24, 314), { x: -8, y: -100, width: 330, height: 180 });
    this.verticalOffset = (4 - scene.state.numPlayers) * 14;
    this.label("COLONIST HUB", ccp(0, 53 - this.verticalOffset));
    const dockImage = scene.assets.image("dock_normal.png");
    const nodeImage = scene.assets.image("colonist_track_node_wide.png");
    const endpointImage = scene.assets.image("colonist_track_endpoint_wide.png");
    this.markers = [];
    for (let playerIndex = 0; playerIndex < scene.state.numPlayers; playerIndex += 1) {
      for (let dockIndex = 0; dockIndex < 3; dockIndex += 1) {
        this.dockSprite(dockImage, this.dockPosition(playerIndex * 3 + dockIndex));
      }
      for (let step = 0; step < 6; step += 1) {
        this.sprite(nodeImage, ccp(76 + step * 28, 8 - playerIndex * 28 - this.verticalOffset));
      }
      this.sprite(endpointImage, ccp(244, 8 - playerIndex * 28 - this.verticalOffset));
      const marker = new CCSprite(scene.assets.image(PLAYER_COLONY_IMAGES_FULL[playerIndex]));
      marker.setAnchorPoint(ccp(0, 0));
      marker.visible = false;
      this.addChild(marker, 3);
      this.markers.push(marker);
    }
    this.sprite(scene.assets.image("icons_ch.png"), ccp(0, -77 + this.verticalOffset), ccp(0, 1));
    this.launchButton = scene.buttonFromImage(
      "button_medium_up.png",
      "button_medium_down.png",
      () => this.launch(),
      { label: "LAUNCH", fontSize: 12 },
    );
    this.addChild(this.launchButton, 4);
    this.refresh();
  }

  dockPosition(index) {
    const playerIndex = Math.floor(index / 3);
    const dockIndex = index % 3;
    return ccp(dockIndex * 28, 8 - playerIndex * 28 - this.verticalOffset);
  }

  launch() {
    if (this.scene.state.currentPlayer.aiType === AIType.human) {
      this.scene.state.colonistHub.launchColony(this.scene.state.currentPlayer);
    }
  }

  refresh() {
    this.markers.forEach((marker, playerIndex) => {
      const step = this.scene.state.colonistHub.colonyPosition(playerIndex);
      const destination = colonistHubTrackPosition(
        this.scene.state.numPlayers,
        playerIndex,
        step,
      );
      marker.visible = step !== 0;
      if (!marker.visible || (marker.position.x === 0 && marker.position.y === 0)) {
        marker.setPosition(destination);
      } else if (marker.position.x !== destination.x || marker.position.y !== destination.y) {
        marker.stopAllActions();
        marker.runAction(new CCEaseSineInOut(new CCMoveTo(0.5, destination)));
      }
    });
    const player = this.scene.state.currentPlayer;
    this.launchButton.visible = this.scene.state.colonistHub.ableToLaunch(player);
    this.launchButton.setPosition(ccp(
      282,
      20 - player.playerIndex * 28 - this.verticalOffset,
    ));
  }
}

class TerraformingStationLayer extends FacilityLayer {
  constructor(scene) {
    super(scene, scene.state.terraformingStation, ccp(28, 703), { x: -8, y: -5, width: 85, height: 85 });
    this.label("TERRAFORMING", ccp(0, 67));
    this.label("STATION", ccp(0, 54));
    this.dockSprite(scene.assets.image("dock_ts.png"), ccp(-5, 8));
    this.sprite(scene.assets.image("icons_ts.png"), ccp(0, 7), ccp(0, 1));
  }

  dockPosition() {
    return ccp(0, 8);
  }
}

class RegionLayer extends CCNode {
  constructor(scene, layout) {
    super();
    this.scene = scene;
    this.region = scene.state[layout.property];
    this.property = layout.property;
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
    if (this.property === "burroughsDesert") {
      const dock = new CCSprite(scene.assets.image("dock_normal.png"));
      dock.setAnchorPoint(ccp(0, 0));
      dock.setPosition(ccp(-5, 12));
      this.addChild(dock, 2);
      this.purchaseButton = scene.buttonFromImage(
        "button_long_up.png",
        "button_long_down.png",
        () => scene.state.purchaseArtifactShip(scene.state.currentPlayer),
        { label: "PURCHASE", fontSize: 12 },
      );
      this.purchaseButton.setPosition(ccp(7, 58));
      this.addChild(this.purchaseButton, 5);
    }
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
    if (this.purchaseButton) {
      this.purchaseButton.visible = this.scene.state.currentPlayer.aiType === AIType.human
        && this.scene.state.canPurchaseArtifactShip(this.scene.state.currentPlayer);
    }
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

      const hitArea = new CCNode();
      hitArea.contentSize = { width: 32, height: 32 };
      hitArea.setPosition(ccp(colonyX, -65));
      hitArea.interactive = true;
      hitArea.enabled = this.scene.state.pendingTechAction === "discard-colony";
      hitArea.touchPriority = -15;
      hitArea.activate = () => this.scene.state.selectPlacedColony(this.region, player);
      this.addChild(hitArea, 5);
      this.colonyNodes.push(hitArea);
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
    this.cardSignature = "";
    this.scrollOffset = 0;
    this.dragged = false;
    this.dragStart = null;
    this.offsetAtStart = 0;
    const background = new CCSprite(scene.assets.image(
      layout === "tall" ? "hud_card_tray_white_horiz.png" : "hud_card_tray_mini_white_vert.png",
    ));
    background.setAnchorPoint(ccp(0, 0.5));
    background.setPosition(ccp(-3, -12));
    this.addChild(background, 0);

    this.viewport = new CCNode();
    this.addChild(this.viewport, 1);
    this.cardContent = new CCNode();
    this.viewport.addChild(this.cardContent);

    this.viewportRect = layout === "tall"
      ? { x: -3, y: -57.5, width: 331, height: 91 }
      : { x: -3, y: -113, width: 182, height: 202 };
    this.viewport.clipRect = { ...this.viewportRect };
    this.hitArea = new CCNode();
    this.hitArea.contentSize = {
      width: this.viewportRect.width,
      height: this.viewportRect.height,
    };
    this.hitArea.setPosition(ccp(this.viewportRect.x, this.viewportRect.y));
    this.hitArea.interactive = true;
    this.hitArea.enabled = true;
    this.hitArea.touchPriority = -20;
    this.hitArea.onPointerDown = (point) => this.beginDrag(point);
    this.hitArea.onPointerMove = (point) => this.moveDrag(point);
    this.hitArea.onPointerUp = () => this.endDrag();
    this.hitArea.activate = (point) => this.activateCard(point);
    this.addChild(this.hitArea, 2);
  }

  beginDrag(point) {
    this.dragStart = this.convertToNodeSpace(point);
    this.offsetAtStart = this.scrollOffset;
    this.dragged = false;
  }

  moveDrag(point) {
    const localPoint = this.convertToNodeSpace(point);
    const delta = this.layout === "tall"
      ? localPoint.x - this.dragStart.x
      : localPoint.y - this.dragStart.y;
    this.dragged ||= Math.abs(delta) > 5;
    this.setScrollOffset(this.offsetAtStart + delta);
  }

  endDrag() {
    this.dragStart = null;
  }

  setScrollOffset(offset) {
    const bounds = techTrayScrollBounds(this.layout, this.cardNodes.length);
    this.scrollOffset = Math.max(bounds.min, Math.min(bounds.max, offset));
    this.cardContent.setPosition(
      this.layout === "tall" ? ccp(this.scrollOffset, 0) : ccp(0, this.scrollOffset),
    );
    const visibleRange = techTrayVisibleRange(this.layout, this.scrollOffset);
    this.cardNodes.forEach((cardNode, cardIndex) => {
      cardNode.visible = cardIndex >= visibleRange.min && cardIndex <= visibleRange.max;
    });
  }

  activateCard(point) {
    if (this.dragged || !this.onCardActivate) {
      return;
    }
    const localPoint = this.convertToNodeSpace(point);
    const cardIndex = this.cardNodes.findIndex((cardNode) => {
      const position = cardNode.position;
      return this.layout === "tall"
        ? Math.abs(localPoint.x - this.scrollOffset - position.x) <= 44.5
          && Math.abs(localPoint.y - position.y) <= 46
        : localPoint.x >= -3 && localPoint.x <= 179
          && Math.abs(localPoint.y - this.scrollOffset - position.y) <= 28;
    });
    if (cardIndex >= 0) {
      this.onCardActivate(this.cardNodes[cardIndex].card);
    }
  }

  refresh(player) {
    const cardSignature = player.cards.map((card) => card.cardID).join(",");
    if (cardSignature === this.cardSignature) {
      this.cardNodes.forEach((cardNode) => cardNode.refresh());
      return;
    }
    this.cardSignature = cardSignature;
    for (const cardNode of this.cardNodes) {
      this.cardContent.removeChild(cardNode);
    }
    this.cardNodes.length = 0;
    player.cards.forEach((card, cardIndex) => {
      const cardNode = new TechCardView(this.scene, card, this.layout);
      const destination = techCardPosition(this.layout, cardIndex);
      cardNode.setPosition(techCardPosition(this.layout, 0));
      this.cardContent.addChild(cardNode, cardIndex + 1);
      this.cardNodes.push(cardNode);
      cardNode.runAction(new CCEaseElasticOut(
        new CCMoveTo(0.8, destination),
        0.8,
      ));
    });
    this.setScrollOffset(this.scrollOffset);
  }
}

class AlienArtifactLayer extends FacilityLayer {
  constructor(scene) {
    super(scene, scene.state.alienArtifact, ccp(601, 794), { x: 0, y: -170, width: 140, height: 260 });
    this.label("ALIEN", ccp(12, 80));
    this.label("ARTIFACT", ccp(12, 67));
    const dockImage = scene.assets.image("dock_normal.png");
    for (const dock of this.orbital.docks) {
      this.dockSprite(dockImage, this.dockPosition(dock.index));
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
    this.cycleButton.setPosition(ccp(42, 31));
    this.addChild(this.cycleButton, 3);
    this.discardsButton = scene.buttonFromImage(
      "ondark_button.png",
      "ondark_button_active.png",
      () => scene.openDiscardPile(),
      {
        inactiveImage: "ondark_button_inactive.png",
        label: "0 DISCARDS",
        fontSize: 9,
      },
    );
    this.discardsButton.setPosition(ccp(114, 31));
    this.addChild(this.discardsButton, 3);
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
    const discardCount = this.scene.state.techDiscardDeck.length;
    this.scene.setButtonLabel(this.discardsButton, `${discardCount} DISCARDS`);
    this.scene.setButtonIsEnabled(this.discardsButton, discardCount > 0);
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
    this.viewOnly = false;
    this.visible = false;

    const blocker = new CCLayerColor("rgba(0,0,0,0.35)");
    blocker.interactive = true;
    blocker.enabled = true;
    blocker.touchPriority = MODAL_TOUCH_PRIORITIES.detailBlocker;
    blocker.activate = () => this.close();
    this.addChild(blocker, 0);

    this.background = new CCSprite(scene.assets.image("aa_card_detail_box.png"));
    this.background.setPosition(ccp(678, 712));
    this.background.interactive = true;
    this.background.enabled = true;
    this.background.touchPriority = MODAL_TOUCH_PRIORITIES.detailPanel;
    this.background.activate = () => {};
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
    this.setButtonTouchPriority(this.takeButton, MODAL_TOUCH_PRIORITIES.detailControl);
    this.background.addChild(this.takeButton, 3);

    this.backButton = scene.buttonFromImage(
      "aa_back_button.png",
      "aa_back_button_active.png",
      () => this.close(),
    );
    this.backButton.setPosition(ccp(18, height - 18));
    this.setButtonTouchPriority(this.backButton, MODAL_TOUCH_PRIORITIES.detailControl);
    this.background.addChild(this.backButton, 3);

    this.title1 = this.detailLabel("", ccp(halfWidth, height - 63));
    this.title2 = this.detailLabel("", ccp(halfWidth, height - 77));
    this.creditLabel = this.detailLabel("", ccp(halfWidth, 84));
    this.title1.setAnchorPoint(ccp(0.5, 1));
    this.title2.setAnchorPoint(ccp(0.5, 1));

    this.textTray = new CCSprite(scene.assets.image("aa_card_background.png"));
    this.textTray.setPosition(ccp(halfWidth, 96));
    this.background.addChild(this.textTray, 1);
    this.powerText = new WrappedTextBox(130, 56, {
      fontSize: 10,
      lineHeight: 12,
      textAlign: "center",
      verticalAlign: "center",
    });
    this.powerText.setPosition(ccp(halfWidth - 65, 101));
    this.background.addChild(this.powerText, 2);
    this.discardText = new WrappedTextBox(130, 56, {
      fontSize: 10,
      lineHeight: 12,
      textAlign: "center",
      verticalAlign: "center",
    });
    this.discardText.setPosition(ccp(halfWidth - 65, 31));
    this.background.addChild(this.discardText, 2);
    this.orDivider = new CCSprite(scene.assets.image("aa_OR_bar.png"));
    this.orDivider.setPosition(ccp(halfWidth, 96));
    this.background.addChild(this.orDivider, 2);
    this.cardImage = null;
  }

  detailLabel(text, position) {
    const label = new CCLabelTTF(text, "DIN-Medium", 12, "#fff");
    label.setPosition(position);
    this.background.addChild(label, 2);
    return label;
  }

  setButtonTouchPriority(button, priority) {
    button.children[0].children[0].touchPriority = priority;
  }

  open(card, { viewOnly = false } = {}) {
    this.card = card;
    this.viewOnly = viewOnly;
    this.creditLabel.setPosition(ccp(
      this.background.contentSize.width * 0.5,
      viewOnly ? 16 : 84,
    ));
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
    this.powerText.setText(card.powerText);
    this.discardText.setText(card.discardText);
    this.orDivider.visible = Boolean(card.discardText);
    this.powerText.setPosition(ccp(
      this.background.contentSize.width * 0.5 - 65,
      card.discardText ? 101 : 68,
    ));
    this.refresh();
    this.visible = true;
  }

  refresh() {
    if (!this.card) {
      return;
    }
    const player = this.scene.state.currentPlayer;
    this.creditLabel.setString(
      this.viewOnly ? "DISCARD PILE" : `CREDIT ${player.artifactCreditAvailable} / 8`,
    );
    this.takeButton.visible = !this.viewOnly;
    this.scene.setButtonIsEnabled(
      this.takeButton,
      !this.viewOnly
        && player.aiType === AIType.human
        && player.canPurchaseCard(this.card),
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
    this.viewOnly = false;
  }
}

class DiscardPileOverlay extends CCNode {
  constructor(scene) {
    super();
    this.scene = scene;
    this.visible = false;
    this.pileModel = { cards: [] };

    this.shade = new CCLayerColor("rgba(0,0,0,0.42)");
    this.shade.interactive = true;
    this.shade.enabled = true;
    this.shade.touchPriority = MODAL_TOUCH_PRIORITIES.pileBlocker;
    this.shade.activate = () => this.close();
    this.addChild(this.shade, 0);

    this.panel = new CCNode();
    this.panel.setPosition(ccp(578, 542));
    this.addChild(this.panel, 1);
    this.panel.addChild(new RoundedPanel(
      DISCARD_PILE_LAYOUT.width,
      DISCARD_PILE_LAYOUT.height,
      DISCARD_PILE_LAYOUT.cornerRadius,
    ), 1);

    const title = new CCLabelTTF("DISCARD PILE", "DIN-Black", 14, "#fff");
    title.setPosition(ccp(DISCARD_PILE_LAYOUT.width / 2, 258));
    this.panel.addChild(title, 2);
    this.countLabel = new CCLabelTTF("0 CARDS", "DIN-Medium", 11, "#9fdcf5");
    this.countLabel.setPosition(ccp(DISCARD_PILE_LAYOUT.width / 2, 234));
    this.panel.addChild(this.countLabel, 2);

    this.closeButton = scene.buttonFromImage(
      "aa_back_button.png",
      "aa_back_button_active.png",
      () => this.close(),
    );
    this.closeButton.setPosition(ccp(18, 262));
    this.setButtonTouchPriority(this.closeButton, MODAL_TOUCH_PRIORITIES.pileControl);
    this.panel.addChild(this.closeButton, 3);

    this.tray = new TechCardTray(scene, "wide", (card) => this.openCard(card));
    this.tray.setPosition(ccp(3, 122));
    this.tray.hitArea.touchPriority = MODAL_TOUCH_PRIORITIES.pileTray;
    this.panel.addChild(this.tray, 2);
    const trayShadow = new CCSprite(scene.assets.image("hud_card_tray_shadow_vert.png"));
    trayShadow.contentSize = {
      width: DISCARD_PILE_LAYOUT.trayWidth,
      height: DISCARD_PILE_LAYOUT.trayHeight,
    };
    trayShadow.setPosition(ccp(DISCARD_PILE_LAYOUT.width / 2, 110));
    this.panel.addChild(trayShadow, 3);

    this.emptyLabel = new CCLabelTTF("NO DISCARDED TECH", "DIN-Medium", 12, "#666");
    this.emptyLabel.setPosition(ccp(DISCARD_PILE_LAYOUT.width / 2, 110));
    this.panel.addChild(this.emptyLabel, 3);
  }

  setButtonTouchPriority(button, priority) {
    button.children[0].children[0].touchPriority = priority;
  }

  open() {
    this.visible = true;
    this.refresh();
    this.tray.setScrollOffset(discardPileInitialOffset(this.pileModel.cards.length));
  }

  close() {
    this.visible = false;
  }

  openCard(card) {
    this.scene.artifactDetail.open(card, { viewOnly: true });
  }

  refresh() {
    const cards = discardPileCards(this.scene.state.techDiscardDeck);
    this.pileModel.cards = cards;
    this.countLabel.setString(`${cards.length} ${cards.length === 1 ? "CARD" : "CARDS"}`);
    this.emptyLabel.visible = cards.length === 0;
    this.tray.visible = cards.length > 0;
    this.tray.refresh(this.pileModel);
  }
}

class MiniTechCardInspector extends CCNode {
  constructor(scene, player) {
    super();
    this.scene = scene;
    this.player = player;

    this.powerText = new WrappedTextBox(170, 62, {
      fontSize: 10,
      lineHeight: 12,
      textAlign: "center",
      verticalAlign: "center",
    });
    this.powerText.setPosition(ccp(80, 28));
    this.addChild(this.powerText, 1);
    this.discardText = new WrappedTextBox(170, 62, {
      fontSize: 10,
      lineHeight: 12,
      textAlign: "center",
      verticalAlign: "center",
    });
    this.discardText.setPosition(ccp(80, -42));
    this.addChild(this.discardText, 1);
    this.divider = new CCSprite(scene.assets.image("hud_port_or_bar.png"));
    this.divider.setPosition(ccp(165, 26));
    this.addChild(this.divider, 1);
    this.raidButton = scene.buttonFromImage(
      "menu_button_104.png",
      "menu_button_104_active.png",
      () => this.raidSelectedCard(),
      { label: "RAID CARD", fontSize: 11, fontColor: "#000" },
    );
    this.raidButton.setPosition(ccp(165, -45));
    this.addChild(this.raidButton, 2);
  }

  raidSelectedCard() {
    const card = this.player.selectedCard;
    const currentPlayer = this.scene.state.currentPlayer;
    if (card && currentPlayer.selectRaidCard(card)) {
      currentPlayer.finishRaid();
    }
  }

  refresh() {
    const card = this.player.selectedCard;
    this.powerText.setText(card?.powerText ?? "");
    this.discardText.setText(card?.discardText ?? "");
    this.divider.visible = Boolean(card?.powerText && card?.discardText);
    const canRaid = Boolean(card && this.scene.state.currentPlayer.canRaidCard(card));
    this.raidButton.visible = canRaid;
    this.scene.setButtonIsEnabled(this.raidButton, canRaid);
  }
}

class GameMenuOverlay extends CCNode {
  constructor(scene) {
    super();
    this.scene = scene;
    this.visible = false;
    this.shade = new CCLayerColor("#000");
    this.shade.opacity = 0;
    this.shade.interactive = true;
    this.shade.enabled = true;
    this.shade.touchPriority = -200;
    this.shade.activate = () => {};
    this.addChild(this.shade, 0);

    this.resumeButton = this.addMenuButton("RESUME", 0, () => this.close());
    this.sfxButton = this.addMenuButton("", 1, () => this.toggleSfx());
    this.musicButton = this.addMenuButton("", 2, () => this.toggleMusic());
    this.aiSearchButton = this.addMenuButton("", 3, () => this.cycleAISearch());
    this.quitButton = this.addMenuButton("QUIT", 4, () => this.scene.returnToMainMenu());
  }

  addMenuButton(label, index, callback) {
    const button = this.scene.buttonFromImage(
      "menu_button_blank.png",
      "menu_button_blank_pushed.png",
      callback,
      { label, fontSize: 12 },
    );
    button.menuIndex = index;
    const menuItem = button.getChildByTag(0)?.children[0];
    if (menuItem) {
      menuItem.touchPriority = -256;
    }
    this.addChild(button, 1);
    return button;
  }

  open() {
    if (this.visible) {
      return;
    }
    this.visible = true;
    this.shade.opacity = 0;
    this.shade.runAction(new CCFadeTo(0.5, 192));
    this.updateLabels();
    for (const button of [
      this.resumeButton,
      this.sfxButton,
      this.musicButton,
      this.aiSearchButton,
      this.quitButton,
    ]) {
      const destination = ccp(384, 712 - 100 * button.menuIndex);
      button.setPosition(ccp(-500, destination.y));
      button.runAction(new CCSequence(
        new CCDelayTime(0.1 * button.menuIndex),
        new CCEaseElasticInOut(new CCMoveTo(0.8, destination), 0.8),
      ));
    }
  }

  close() {
    this.visible = false;
  }

  toggleSfx() {
    const audio = this.scene.director.soundManager;
    audio?.setSfxEnabled(!audio.sfxEnabled);
    this.updateLabels();
  }

  toggleMusic() {
    const audio = this.scene.director.soundManager;
    audio?.setMusicEnabled(!audio.musicEnabled);
    this.updateLabels();
  }

  cycleAISearch() {
    this.scene.director.aiPreferences?.cyclePreset();
    this.updateLabels();
  }

  updateLabels() {
    const audio = this.scene.director.soundManager;
    this.scene.setButtonLabel(
      this.sfxButton,
      `SOUND FX: ${audio?.sfxEnabled === false ? "OFF" : "ON"}`,
    );
    this.scene.setButtonLabel(
      this.musicButton,
      `MUSIC: ${audio?.musicEnabled === false ? "OFF" : "ON"}`,
    );
    this.scene.setButtonLabel(
      this.aiSearchButton,
      `AI SEARCH: ${this.scene.director.aiPreferences?.preset.label ?? "STANDARD"}`,
    );
  }
}

class GameOverOverlay extends CCNode {
  constructor(scene) {
    super();
    this.scene = scene;
    this.visible = false;
    this.resultNodes = [];

    this.shade = new CCLayerColor("#000");
    this.shade.opacity = 0;
    this.shade.interactive = true;
    this.shade.enabled = true;
    this.shade.touchPriority = -200;
    this.shade.activate = () => {};
    this.addChild(this.shade, 0);

    this.gameOverButton = scene.buttonFromImage(
      "menu_button_blank.png",
      "menu_button_blank_pushed.png",
      () => scene.returnToMainMenu(),
      { label: "GAME OVER", fontSize: 12 },
    );
    const menuItem = this.gameOverButton.getChildByTag(0)?.children[0];
    if (menuItem) {
      menuItem.touchPriority = -256;
    }
    this.addChild(this.gameOverButton, 2);
  }

  activate() {
    if (this.visible) {
      return;
    }
    this.visible = true;
    this.shade.runAction(new CCFadeTo(0.5, 160));
    this.gameOverButton.setPosition(ccp(-500, 62));
    this.gameOverButton.runAction(new CCSequence(
      new CCDelayTime(0.1),
      new CCEaseElasticInOut(new CCMoveTo(0.8, ccp(384, 62)), 0.8),
    ));

    const ranking = this.scene.state.winningPlayers;
    const winner = ranking[0];
    this.addResultLabel(
      `Congratulations, Player ${winner.playerIndex + 1}!!!`,
      48,
      ccp(384, 925),
      "#ffc200",
    );
    ranking.forEach((player, rank) => {
      this.addResultLabel(
        `Player ${player.playerIndex + 1}: ${player.vps}`,
        48,
        ccp(384, 850 - rank * 75),
        PLAYER_COLORS[player.colorIndex],
      );
    });
    this.addResultLabel(
      `Completed in ${this.scene.state.numTurns + 1} turns`,
      22,
      ccp(384, 520),
      "#fff",
    );
  }

  addResultLabel(text, fontSize, position, color) {
    const label = new CCLabelTTF(text, "DIN-Black", fontSize, color);
    label.setPosition(position);
    this.addChild(label, 1);
    this.resultNodes.push(label);
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
    this.addChild(this.frame, 1);

    this.corner = new CCSprite(scene.assets.image("hud_port_corner_tint_mini.png"));
    this.corner.color = { ...PLAYER_TINTS[player.colorIndex] };
    this.corner.blendMode = "multiply";
    this.corner.setPosition(ccp(66, -413));
    this.addChild(this.corner, 1);

    this.scoreLabel = this.label("0", 42, ccp(64, -409), "#fff", { width: 50, height: 60 });
    this.oreLabel = this.label("0", 22, ccp(-75, -430), "#000", { width: 30, height: 30 });
    this.fuelLabel = this.label("0", 22, ccp(-40, -430), "#000", { width: 30, height: 30 });
    this.colonyLabel = this.label("0", 22, ccp(-5, -430), "#000", { width: 30, height: 30 });
    this.diceLabel = this.label("0", 22, ccp(30, -430), "#000", { width: 30, height: 30 });

    this.colonyIcon = new CCSprite(scene.assets.image(PLAYER_COLONY_IMAGES[player.colorIndex]));
    this.colonyIcon.setPosition(ccp(-5, -406));
    this.addChild(this.colonyIcon, 2);
    this.dieIcon = new CCSprite(scene.assets.image(PLAYER_DIE_IMAGES[player.colorIndex]));
    this.dieIcon.setPosition(ccp(30, -406));
    this.addChild(this.dieIcon, 2);

    this.techTray = new TechCardTray(scene, "wide", (card) => this.selectCard(card));
    this.techTray.setPosition(ccp(-88, -109));
    this.addChild(this.techTray, 0);

    this.techInspector = new MiniTechCardInspector(scene, player);
    this.techInspector.setPosition(ccp(-165, -319));
    this.addChild(this.techInspector, 15);

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

  label(text, fontSize, position, color, dimensions = null) {
    const label = new CCLabelTTF(text, "DIN-Black", fontSize, color, { dimensions });
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

  selectCard(card) {
    this.scene.state.selectTechCard(card);
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
    this.techInspector.refresh();
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
    this.lastRollIndex = ship.rollIndex;
    this.selectionAnimating = false;
    this.contentSize = { ...SHIP_SPRITE_SIZE };
    this.setAnchorPoint(ccp(0.5, 0.5));
    this.setScale(SHIP_SPRITE_SCALE);
    this.interactive = true;
    this.enabled = true;
    this.activate = () => this.scene.toggleShip(this.ship);

    this.selectionSprite = new CCSprite(scene.assets.image("die_select.png"));
    this.selectionSprite.setPosition(ccp(
      this.contentSize.width / 2,
      this.contentSize.height / 2,
    ));
    this.addChild(this.selectionSprite, 0);
    this.frameSprite = null;
    this.refresh();
  }

  refresh() {
    this.visible = this.ship.active || this.ship.isArtifactShip;
    this.enabled = this.ship.active;
    this.selectionSprite.visible = this.ship.isSelected;
    if (this.ship.isSelected && !this.selectionAnimating) {
      this.selectionAnimating = true;
      this.selectionSprite.runAction(new CCRepeatForever(new CCRotateBy(4, 360)));
    } else if (!this.ship.isSelected && this.selectionAnimating) {
      this.selectionAnimating = false;
      this.selectionSprite.stopAllActions();
      this.selectionSprite.rotation = 0;
    }
    this.opacity = !this.ship.docked && this.ship.player && !this.ship.player.initialRollDone ? 128 : 255;

    const prefix = this.ship.isArtifactShip
      ? "wh"
      : PLAYER_DIE_PREFIXES[this.ship.player.colorIndex];
    const frameIndex = this.ship.value >= 1 && this.ship.value <= 6 ? this.ship.value - 1 : 0;
    const nextFrame = this.scene.director.frameCache.spriteFrameByName(`${prefix}-${frameIndex}.png`);
    if (!this.frameSprite) {
      this.frameSprite = nextFrame;
      this.frameSprite.setPosition(ccp(
        this.contentSize.width / 2,
        this.contentSize.height / 2,
      ));
      this.addChild(this.frameSprite, 1);
    } else {
      this.frameSprite.image = nextFrame.image;
      this.frameSprite.sourceRect = nextFrame.sourceRect;
    }
    if (this.ship.rollIndex !== this.lastRollIndex) {
      this.lastRollIndex = this.ship.rollIndex;
      this.frameSprite.stopAllActions();
      this.frameSprite.opacity = 255;
      this.frameSprite.setScale(1.5);
      this.frameSprite.rotation = 0;
      this.frameSprite.runAction(new CCScaleTo(0.5, 1));
      this.frameSprite.runAction(new CCRotateBy(0.5, 720));
    }
    const destination = this.scene.shipPosition(this.ship);
    if (!this.targetPosition) {
      this.setPosition(destination);
    } else if (
      destination.x !== this.targetPosition.x
      || destination.y !== this.targetPosition.y
    ) {
      this.stopAllActions();
      this.frameSprite.stopAllActions();
      this.frameSprite.opacity = 255;
      this.frameSprite.rotation = 0;
      this.frameSprite.setScale(1);
      const deltaX = destination.x - this.position.x;
      const deltaY = destination.y - this.position.y;
      const firstMove = ccp(
        this.position.x + deltaX * 0.2,
        this.position.y + deltaY * 0.2,
      );
      const postWarp = ccp(
        destination.x - deltaX * 0.2,
        destination.y - deltaY * 0.2,
      );
      this.runAction(new CCSequence(
        new CCDelayTime(0.12),
        new CCEaseSineIn(new CCMoveTo(0.48, firstMove)),
        new CCCallFunc((target) => target.setPosition(postWarp)),
        new CCEaseSineOut(new CCMoveTo(0.48, destination)),
      ));
      this.frameSprite.runAction(new CCSequence(
        new CCScaleTo(0.24, 1.5),
        new CCDelayTime(0.06),
        new CCCallFunc(() => this.spawnFlare()),
        new CCFadeTo(0.3, 0),
        new CCFadeTo(0.3, 255),
        new CCCallFunc(() => this.spawnFlare()),
        new CCDelayTime(0.06),
        new CCScaleTo(0.24, 1),
      ));
    }
    this.targetPosition = destination;
  }

  spawnFlare() {
    const flare = new CCSprite(this.scene.assets.image("flare.png"));
    flare.setPosition(this.position);
    flare.opacity = 0;
    this.scene.addChild(flare, 7);
    flare.runAction(new CCSequence(
      new CCScaleTo(0.3, 2),
      new CCCallFunc((target) => target.parent?.removeChild(target)),
    ));
    flare.runAction(new CCSequence(
      new CCFadeTo(0.1, 96),
      new CCFadeTo(0.2, 0),
    ));
  }
}

export class GameScene extends AFLayer {
  constructor(director, assets, state) {
    super(assets);
    this.director = director;
    this.state = state;
    this.state.history ??= new GameHistory(this.state.savedHistory);
    delete this.state.savedHistory;
    this.shipSprites = new Map();
    this.unsubscribe = [];
    this.aiTimer = null;
    this.aiAbortController = null;
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
    this.colonistHubLayer = new ColonistHubLayer(this);
    this.addChild(this.colonistHubLayer, 4);
    this.terraformingLayer = new TerraformingStationLayer(this);
    this.addChild(this.terraformingLayer, 4);
    this.facilityLayers = [
      this.solarLayer,
      this.maintenanceLayer,
      this.lunarLayer,
      this.shipyardLayer,
      this.marketLayer,
      this.constructorLayer,
      this.artifactLayer,
      this.raidersLayer,
      this.colonistHubLayer,
      this.terraformingLayer,
    ];

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
    this.gameMenuOverlay = new GameMenuOverlay(this);
    this.addChild(this.gameMenuOverlay, 11);
    this.discardPileOverlay = new DiscardPileOverlay(this);
    this.addChild(this.discardPileOverlay, 11);
    this.artifactDetail = new ArtifactCardDetail(this);
    this.addChild(this.artifactDetail, 12);
    this.gameOverOverlay = new GameOverOverlay(this);
    this.addChild(this.gameOverOverlay, 13);
  }

  buildHUD() {
    this.uiFrame = new CCNode();
    this.uiFrame.setPosition(ccp(384, 98));
    this.addChild(this.uiFrame, 5);

    const frame = new CCSprite(this.assets.image("hud_port_player_tab_large.png"));
    this.uiFrame.addChild(frame, 2);

    this.currentCornerOverlay = new CCSprite(this.assets.image("hud_port_corner_tint.png"));
    this.currentCornerOverlay.setPosition(ccp(332, 69));
    this.currentCornerOverlay.blendMode = "multiply";
    this.uiFrame.addChild(this.currentCornerOverlay, 2);
    this.currentEdgeOverlay = new CCSprite(this.assets.image("hud_port_edge_tint.png"));
    this.currentEdgeOverlay.setPosition(ccp(-354, 1));
    this.currentEdgeOverlay.blendMode = "multiply";
    this.uiFrame.addChild(this.currentEdgeOverlay, 2);

    this.rollButton = this.buttonFromImage(
      "button_roll_up.png",
      "button_roll_down.png",
      () => this.rollShips(),
      { label: "ROLL", fontSize: 16 },
    );
    this.rollButton.setPosition(ccp(260, -20));
    this.uiFrame.addChild(this.rollButton, 2);
    this.rollButtonGlow = new CCSprite(this.assets.image("button_roll_glow.png"));
    this.rollButtonGlow.setPosition(ccp(260, -20));
    this.rollButtonGlow.blendMode = "lighter";
    this.rollButtonGlow.visible = false;
    this.uiFrame.addChild(this.rollButtonGlow, 2);

    this.doneButton = this.buttonFromImage(
      "tray_btn_done.png",
      "tray_btn_done_active.png",
      () => this.doneTurn(),
      { inactiveImage: "tray_btn_done_inactive.png" },
    );
    this.doneButton.setPosition(ccp(305, -75));
    this.uiFrame.addChild(this.doneButton, 2);
    this.doneButtonGlow = new CCSprite(this.assets.image("tray_btn_done_glow.png"));
    this.doneButtonGlow.setPosition(ccp(305, -75));
    this.doneButtonGlow.blendMode = "lighter";
    this.doneButtonGlow.visible = false;
    this.uiFrame.addChild(this.doneButtonGlow, 2);

    this.undoButton = this.buttonFromImage(
      "tray_btn_undo.png",
      "tray_btn_undo_active.png",
      () => this.undo(),
      { inactiveImage: "tray_btn_undo_inactive.png" },
    );
    this.undoButton.setPosition(ccp(199, -75));
    this.uiFrame.addChild(this.undoButton, 2);

    this.redoButton = this.buttonFromImage(
      "tray_btn_redo.png",
      "tray_btn_redo_active.png",
      () => this.redo(),
      { inactiveImage: "tray_btn_redo_inactive.png" },
    );
    this.redoButton.setPosition(ccp(242, -75));
    this.uiFrame.addChild(this.redoButton, 2);

    this.raidConfirmButton = this.buttonFromImage(
      "ondark_button.png",
      "ondark_button_active.png",
      () => this.confirmSelection(),
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

    this.gameLogView = new WrappedTextBox(172, 142, {
      fontSize: 11,
      lineHeight: 13,
      followEnd: true,
    });
    const logPosition = gameLogPosition();
    this.gameLogView.setPosition(ccp(logPosition.x - 384, logPosition.y - 98));
    this.uiFrame.addChild(this.gameLogView, 2);

    this.currentTechTray = new TechCardTray(
      this,
      "tall",
      (card) => this.state.selectTechCard(card),
    );
    this.currentTechTray.setPosition(ccp(-166, 47));
    this.uiFrame.addChild(this.currentTechTray, 0);

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

    const powerDescriptionLayout = techDescriptionLayout("power");
    this.techPowerDescription = new WrappedTextBox(
      powerDescriptionLayout.size.width,
      powerDescriptionLayout.size.height,
      {
        fontSize: 10,
        lineHeight: 12,
        textAlign: "center",
        verticalAlign: "center",
      },
    );
    this.techPowerDescription.setPosition(powerDescriptionLayout.position);
    this.uiFrame.addChild(this.techPowerDescription, 2);

    const discardDescriptionLayout = techDescriptionLayout("discard");
    this.techDiscardDescription = new WrappedTextBox(
      discardDescriptionLayout.size.width,
      discardDescriptionLayout.size.height,
      {
        fontSize: 10,
        lineHeight: 12,
        textAlign: "center",
        verticalAlign: "center",
      },
    );
    this.techDiscardDescription.setPosition(discardDescriptionLayout.position);
    this.uiFrame.addChild(this.techDiscardDescription, 2);

    this.menuButton = this.buttonFromImage(
      "menu_button_68.png",
      "menu_button_68_active.png",
      () => this.gameMenuOverlay.open(),
      { label: "MENU", fontSize: 11, fontColor: "#000" },
    );
    this.menuButton.setPosition(ccp(-300, -75));
    this.uiFrame.addChild(this.menuButton, 3);

    this.helpButton = this.buttonFromImage(
      "menu_button_68.png",
      "menu_button_68_active.png",
      () => globalThis.open?.("./AlienFrontiersRules-Final-Trimmed.pdf", "_blank", "noopener"),
      { label: "HELP", fontSize: 11, fontColor: "#000" },
    );
    this.helpButton.setPosition(ccp(-220, -75));
    this.uiFrame.addChild(this.helpButton, 3);
  }

  hudLabel(text, fontSize, position, color) {
    const label = new CCLabelTTF(text, "DIN-Black", fontSize, color);
    label.setPosition(position);
    this.uiFrame.addChild(label, 2);
    return label;
  }

  onEnter() {
    this.director.soundManager?.bindState(this.state);
    this.director.persistence?.bindState(this.state);
    this.unsubscribe.push(this.state.events.on(EventName.stateChanged, () => this.refresh()));
    this.scheduleAI();
  }

  onExit() {
    this.director.soundManager?.unbindState();
    this.director.persistence?.unbindState();
    clearTimeout(this.aiTimer);
    this.aiTimer = null;
    this.aiAbortController?.abort();
    this.aiAbortController = null;
    for (const unsubscribe of this.unsubscribe) {
      unsubscribe();
    }
    this.unsubscribe.length = 0;
  }

  shipPosition(ship) {
    if (ship.isArtifactShip && (!ship.active || !ship.player)) {
      return ccp(382, 629);
    }
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
      [this.state.colonistHub, this.colonistHubLayer],
      [this.state.terraformingStation, this.terraformingLayer],
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
    if (!this.shipSprites.has(this.state.artifactShip)) {
      const artifactSprite = new ShipSprite(this, this.state.artifactShip);
      this.shipSprites.set(this.state.artifactShip, artifactSprite);
      this.addChild(artifactSprite, 8);
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
    this.state.touchShip(ship);
  }

  commitShips(orbital) {
    this.state.commitSelectedShips(orbital);
  }

  doneTurn() {
    this.state.gotoNextPlayer();
  }

  undo() {
    if (this.state.stepBackPendingSelection()) {
      return;
    }
    if (this.state.cancelPendingSelection()) {
      return;
    }
    const restored = this.state.history.undo(this.state);
    if (restored) {
      this.director.replaceScene(new GameScene(this.director, this.assets, restored));
    }
  }

  redo() {
    const restored = this.state.history.redo(this.state);
    if (restored) {
      this.director.replaceScene(new GameScene(this.director, this.assets, restored));
    }
  }

  confirmSelection() {
    if (this.state.currentPlayer.isRaiding) {
      this.state.currentPlayer.finishRaid();
    } else {
      this.state.confirmPendingTechPower();
    }
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

  openDiscardPile() {
    this.discardPileOverlay.open();
  }

  async returnToMainMenu() {
    const { MainMenuScene } = await import("./main-menu.js");
    this.director.replaceScene(new MainMenuScene(this.director, this.assets));
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
    const isSelectingPowerRegion = isHumanTurn
      && this.state.pendingTechAction === "power-region";
    const isSelectingPlasma = isHumanTurn
      && this.state.pendingTechAction === "power-multi-ship";
    const isSelectingDiscardShip = isHumanTurn
      && this.state.pendingTechAction === "discard-ship";
    const isSelectingColony = isHumanTurn
      && ["discard-colony", "discard-colony-first"].includes(this.state.pendingTechAction);
    const isSelectingColonyDestination = isHumanTurn
      && this.state.pendingTechAction === "discard-colony-destination";
    if (isHumanTurn && this.aiTimer) {
      clearTimeout(this.aiTimer);
      this.aiTimer = null;
    }
    this.rollButton.visible = !player.initialRollDone;
    this.setButtonIsEnabled(this.rollButton, isHumanTurn);
    this.setButtonIsEnabled(this.doneButton, isHumanTurn && this.state.canEndTurn);
    this.setButtonGlow(this.rollButtonGlow, isHumanTurn && !player.initialRollDone);
    this.setButtonGlow(this.doneButtonGlow, isHumanTurn && this.state.canEndTurn);
    const hasPendingSelection = player.isRaiding || Boolean(this.state.pendingTechCard);
    this.setButtonIsEnabled(
      this.undoButton,
      isHumanTurn && (hasPendingSelection || this.state.history.canUndo),
    );
    this.setButtonIsEnabled(
      this.redoButton,
      isHumanTurn && !hasPendingSelection && this.state.history.canRedo,
    );
    this.raidConfirmButton.visible = player.isRaiding || isSelectingPlasma;
    this.setButtonIsEnabled(
      this.raidConfirmButton,
      isHumanTurn && (
        player.isRaiding ? player.raidSelectionComplete : this.state.pendingTechTargets.length > 0
      ),
    );
    this.playerLabel.setString(player.vps);
    this.currentCornerOverlay.color = { ...PLAYER_TINTS[player.colorIndex] };
    this.currentEdgeOverlay.color = { ...PLAYER_TINTS[player.colorIndex] };
    this.oreLabel.setString(player.ore);
    this.fuelLabel.setString(player.fuel);
    this.colonyLabel.setString(player.coloniesLeft);
    this.diceLabel.setString(player.activeShips.length);
    this.gameLogView.setText(this.state.gameLog.join("\n"));
    this.hintLabel.setString(isHumanTurn
      ? player.isRaiding ? "SELECT UP TO 4 RESOURCES OR ONE TECH"
        : isSelectingFieldRegion ? "SELECT A REGION FOR THE FIELD EFFECT"
        : isSelectingPowerRegion ? "SELECT AN OCCUPIED REGION BONUS TO BORROW"
        : isSelectingDiscardShip ? "SELECT ONE DOCKED ENEMY SHIP TO DESTROY"
        : isSelectingColony ? this.colonyDiscardHint()
        : isSelectingColonyDestination ? "SELECT THE DESTINATION REGION"
        : this.state.pendingTechCard ? this.techPowerHint(this.state.pendingTechCard)
        : isSelectingRegion ? "SELECT A REGION FOR YOUR COLONY"
        : player.initialRollDone ? "SELECT DICE, THEN A FACILITY" : "ROLL YOUR SHIPS"
      : "AI TURN");
    this.currentTechTray.refresh(player);
    const selectedCard = player.selectedCard;
    this.techPowerDescription.setText(selectedCard?.powerText ?? "");
    this.techDiscardDescription.setText(selectedCard?.discardText ?? "");
    const candidateShips = selectedCard?.type === "plasma-cannon"
      ? this.state.players.flatMap((candidate) => candidate.activeShips)
      : selectedCard?.type === "orbital-teleporter"
        ? player.activeShips
        : player.undockedShips;
    const canUseSelected = selectedCard && (
      selectedCard.type === "data-crystal"
        ? this.state.regions.some((region) => selectedCard.canUsePowerOnRegion(region))
        : selectedCard.type === "plasma-cannon"
          ? candidateShips.some((ship) => selectedCard.canTargetPlasmaShip(ship))
        : selectedCard.canUsePower
          && candidateShips.some((ship) => selectedCard.canUsePowerOnShip(ship))
    );
    this.techUseButton.visible = Boolean(canUseSelected) && !this.state.pendingTechCard;
    this.techDiscardButton.visible = Boolean(
      selectedCard?.canUseDiscard
      && (
        selectedCard.hasImplementedRegionDiscard
        || selectedCard.hasImplementedShipDiscard
        || selectedCard.hasImplementedColonyDiscard
      ),
    ) && !this.state.pendingTechCard;
    this.regionHitArea.enabled = isSelectingRegion
      || isSelectingFieldRegion
      || isSelectingPowerRegion
      || isSelectingColonyDestination;
    for (const regionLayer of this.regionLayers) {
      regionLayer.refresh();
    }
    for (const miniHUD of this.playerMiniHUDs) {
      miniHUD.refresh();
    }
    this.marketLayer.refresh();
    this.artifactLayer.refresh();
    this.discardPileOverlay.refresh();
    this.colonistHubLayer.refresh();
    for (const facilityLayer of this.facilityLayers) {
      facilityLayer.setPotential(this.state.canUseOrbital(facilityLayer.orbital));
    }
    this.artifactDetail.refresh();
    if (this.state.gameOver) {
      this.gameOverOverlay.activate();
    }

    this.updatePlayerIcon("colonyIcon", PLAYER_COLONY_IMAGES[player.colorIndex], ccp(254, 60));
    this.updatePlayerIcon("dieIcon", PLAYER_DIE_IMAGES[player.colorIndex], ccp(289, 60));
    this.scheduleAI();
  }

  techPowerHint(card) {
    if (card.type === "plasma-cannon") {
      return "SELECT DOCKED ENEMY SHIPS FROM ONE FACILITY";
    }
    if (card.type === "gravity-manipulator") {
      return this.state.pendingTechAction === "power-raise"
        || this.state.pendingTechTargets.length === 0
        ? "SELECT AN UNDOCKED DIE TO INCREASE"
        : "SELECT A DIFFERENT DIE TO DECREASE";
    }
    if (card.type === "booster-pod") {
      return "SELECT AN UNDOCKED DIE TO INCREASE";
    }
    if (card.type === "stasis-beam") {
      return "SELECT AN UNDOCKED DIE TO DECREASE";
    }
    if (card.type === "orbital-teleporter") {
      return "SELECT A DOCKED DIE TO TELEPORT";
    }
    return "SELECT AN UNDOCKED DIE TO FLIP";
  }

  setButtonGlow(glow, visible) {
    if (glow.visible === visible) {
      return;
    }
    glow.visible = visible;
    glow.stopAllActions();
    if (visible) {
      glow.opacity = 96;
      glow.runAction(new CCRepeatForever(new CCSequence(
        new CCFadeTo(1, 164),
        new CCFadeTo(1, 96),
      )));
    }
  }

  colonyDiscardHint() {
    return this.state.pendingTechCard.type === "polarity-device"
      ? this.state.pendingTechAction === "discard-colony-first"
        ? "SELECT THE FIRST COLONY TO SWAP"
        : this.state.pendingColonyTargets.length === 0
        ? "SELECT THE FIRST COLONY TO SWAP"
        : "SELECT THE SECOND COLONY TO SWAP"
      : this.state.pendingTechAction === "discard-colony-first"
        ? "SELECT THE COLONY TO MOVE"
        : "SELECT THE DESTINATION REGION";
  }

  scheduleAI() {
    if (
      this.aiTimer
      || this.state.currentPlayer.aiType === AIType.human
      || this.director.scene !== this
    ) {
      return;
    }
    this.aiTimer = setTimeout(async () => {
      this.aiTimer = null;
      await this.runScheduledAI();
      this.scheduleAI();
    }, 650);
  }

  async runScheduledAI() {
    if (
      this.director.scene !== this
      || this.state.currentPlayer.aiType === AIType.human
    ) {
      return false;
    }
    if (this.state.currentPlayer.aiType === AIType.easy) {
      return SimpleAI.step(this.state);
    }

    const playerIndex = this.state.currentPlayerIndex;
    const positionKey = exhaustivePositionKey(this.state);
    const controller = new AbortController();
    this.aiAbortController?.abort();
    this.aiAbortController = controller;
    const result = await ExhaustiveAI.think(this.state, {
      ...(this.director.aiPreferences?.optionsFor(this.state)
        ?? ExhaustiveAI.legacyCompactOptionsFor(this.state, "desktop")),
      signal: controller.signal,
    });
    if (this.aiAbortController === controller) {
      this.aiAbortController = null;
    }
    if (
      controller.signal.aborted
      || this.director.scene !== this
      || this.state.currentPlayerIndex !== playerIndex
      || !exhaustivePositionKeysEqual(exhaustivePositionKey(this.state), positionKey)
    ) {
      return false;
    }
    if (result.move && ExhaustiveAI.executeMove(this.state, result.move)) {
      return true;
    }
    return SimpleAI.step(this.state);
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