import { AFLayer } from "../af-layer.js";
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

export function rollingTrayPosition(shipIndex) {
  return ccp(
    600 + (shipIndex % 4) * 38,
    77 - Math.floor(shipIndex / 4) * 40,
  );
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

class ShipSprite extends CCNode {
  constructor(scene, ship) {
    super();
    this.scene = scene;
    this.ship = ship;
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
    this.setPosition(this.scene.shipPosition(this.ship));
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

    this.buildHUD();
    this.ensureShipSprites();
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

    this.playerLabel = this.hudLabel("0", 42, ccp(330, 76), "#fff");
    this.oreLabel = this.hudLabel("0", 22, ccp(183, 87), "#000");
    this.fuelLabel = this.hudLabel("0", 22, ccp(218, 87), "#000");
    this.colonyLabel = this.hudLabel("0", 22, ccp(253, 87), "#000");
    this.diceLabel = this.hudLabel("0", 22, ccp(288, 87), "#000");
    this.hintLabel = this.hudLabel("", 17, ccp(-168, 109), "#ffc200");
  }

  hudLabel(text, fontSize, position, color) {
    const label = new CCLabelTTF(text, "DIN-Black", fontSize, color);
    label.setPosition(position);
    this.uiFrame.addChild(label, 2);
    return label;
  }

  onEnter() {
    this.unsubscribe.push(this.state.events.on(EventName.stateChanged, () => this.refresh()));
    this.scheduleAI();
  }

  onExit() {
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
    this.state.toggleShipSelection(ship);
  }

  commitShips(orbital) {
    this.state.commitSelectedShips(orbital);
  }

  doneTurn() {
    this.state.gotoNextPlayer();
  }

  refresh() {
    const player = this.state.currentPlayer;
    this.ensureShipSprites();
    for (const shipSprite of this.shipSprites.values()) {
      shipSprite.refresh();
    }
    const isHumanTurn = player.aiType === AIType.human;
    if (isHumanTurn && this.aiTimer) {
      clearTimeout(this.aiTimer);
      this.aiTimer = null;
    }
    this.rollButton.visible = !player.initialRollDone;
    this.setButtonIsEnabled(this.rollButton, isHumanTurn);
    this.setButtonIsEnabled(this.doneButton, isHumanTurn && this.state.canEndTurn);
    this.playerLabel.setString("0");
    this.oreLabel.setString(player.ore);
    this.fuelLabel.setString(player.fuel);
    this.colonyLabel.setString(player.coloniesLeft);
    this.diceLabel.setString(player.activeShips.length);
    this.hintLabel.setString(isHumanTurn
      ? player.initialRollDone ? "SELECT DICE, THEN A FACILITY" : "ROLL YOUR SHIPS"
      : "AI TURN");
    this.marketLayer.refresh();

    this.updatePlayerIcon("colonyIcon", PLAYER_COLONY_IMAGES[player.colorIndex], ccp(254, 60));
    this.updatePlayerIcon("dieIcon", PLAYER_DIE_IMAGES[player.colorIndex], ccp(289, 60));
    this.scheduleAI();
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