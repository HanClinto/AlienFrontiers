import { AFLayer } from "../af-layer.js";
import { CCLayerColor, CCLabelTTF, CCNode, CCSprite, ccp } from "../cocos/core.js";
import { EventName } from "../game/constants.js";

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

    this.buildHUD();
    for (const player of this.state.players) {
      for (const ship of player.activeShips) {
        const shipSprite = new ShipSprite(this, ship);
        this.shipSprites.set(ship, shipSprite);
        this.addChild(shipSprite, 8);
      }
    }
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
  }

  onExit() {
    for (const unsubscribe of this.unsubscribe) {
      unsubscribe();
    }
    this.unsubscribe.length = 0;
  }

  shipPosition(ship) {
    if (!ship.docked) {
      return ccp(600 + ship.shipIndex * 38, 77);
    }
    const orbital = ship.dock.orbital;
    const layer = orbital === this.state.solarConverter ? this.solarLayer : this.maintenanceLayer;
    const localPosition = layer.dockPosition(ship.dock.index);
    return layer.convertToWorldSpace(ccp(localPosition.x + 13, localPosition.y + 13));
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
    for (const shipSprite of this.shipSprites.values()) {
      shipSprite.refresh();
    }
    this.rollButton.visible = !player.initialRollDone;
    this.setButtonIsEnabled(this.doneButton, this.state.canEndTurn);
    this.playerLabel.setString("0");
    this.oreLabel.setString(player.ore);
    this.fuelLabel.setString(player.fuel);
    this.colonyLabel.setString(player.coloniesLeft);
    this.diceLabel.setString(player.activeShips.length);
    this.hintLabel.setString(player.initialRollDone ? "SELECT DICE, THEN A FACILITY" : "ROLL YOUR SHIPS");

    this.updatePlayerIcon("colonyIcon", PLAYER_COLONY_IMAGES[player.colorIndex], ccp(254, 60));
    this.updatePlayerIcon("dieIcon", PLAYER_DIE_IMAGES[player.colorIndex], ccp(289, 60));
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