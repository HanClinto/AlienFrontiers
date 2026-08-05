import { AFLayer } from "../af-layer.js";
import { CCDelayTime, CCEaseElasticInOut, CCFadeTo, CCMoveTo, CCSequence } from "../cocos/actions.js";
import { CCLayerColor, CCLabelTTF, CCNode, CCSprite, ccp } from "../cocos/core.js";
import { installGuidance, isMobileBrowser } from "../install.js";
import { StartGameScene } from "./start-game.js";

const Tags = Object.freeze({
  colorBackground: 0,
  background: 1,
  title: 2,
  play: 3,
  rules: 4,
  resume: 5,
  build: 6,
  options: 7,
  credits: 8,
  install: 9,
});

const CREDITS_COLOR = "#ffae41";
const CREDITS_INTERVAL = 0.75;
const CREDITS_DURATION = 8;

function textLines(text) {
  return text.replace(/\r/g, "").replace(/\n+$/, "").split("\n");
}

export function creditsRollLines(recentChangesText, creditsText) {
  return [...textLines(recentChangesText), "", "", ...textLines(creditsText)];
}

export function mainMenuBuildLabel(version) {
  return version ? `BUILD ${version.slice(0, 8)}` : "LOCAL BUILD";
}

export class MainMenuCreditsRoll extends CCNode {
  constructor(lines, initialDelay = 1) {
    super();
    this.lines = lines.length > 0 ? lines : [""];
    this.lineIndex = 0;
    this.timeUntilNextLine = initialDelay;
  }

  update(deltaTime) {
    let remaining = deltaTime;
    while (remaining + Number.EPSILON >= this.timeUntilNextLine) {
      this.advanceLabels(this.timeUntilNextLine);
      remaining = Math.max(0, remaining - this.timeUntilNextLine);
      this.nextLine();
      this.timeUntilNextLine = CREDITS_INTERVAL;
    }
    this.timeUntilNextLine -= remaining;
    this.advanceLabels(remaining);
  }

  advanceLabels(deltaTime) {
    super.update(deltaTime);
    for (const label of [...this.children]) {
      if (label.position.y >= 350) {
        this.removeChild(label);
      }
    }
  }

  nextLine() {
    const segments = this.lines[this.lineIndex].split(";");
    segments.forEach((text, columnIndex) => this.addSegment(text, columnIndex, segments.length));
    this.lineIndex = (this.lineIndex + 1) % this.lines.length;
  }

  addSegment(text, columnIndex, columnCount) {
    let columnX = (768 / (columnCount + 1)) * (columnIndex + 1);
    columnX += (columnIndex - (columnCount - 1) * 0.5) * 50;

    const columnWidth = columnCount === 1 ? 700 : Math.max(120, 700 / columnCount);
    const label = new CCLabelTTF(text, "DIN-Black", 18, CREDITS_COLOR, {
      maxWidth: columnWidth,
    });
    label.setPosition(ccp(columnX, 50));
    label.opacity = 0;
    this.addChild(label);

    label.runAction(new CCMoveTo(CREDITS_DURATION, ccp(columnX, 350)));
    label.runAction(new CCSequence(
      new CCFadeTo(CREDITS_DURATION * 0.2, 255),
      new CCDelayTime(CREDITS_DURATION * 0.6),
      new CCFadeTo(CREDITS_DURATION * 0.2, 0),
    ));
  }
}

export class MainMenuScene extends AFLayer {
  constructor(director, assets) {
    super(assets);
    this.director = director;
    this.initChildren();
    this.initCredits();
    this.optionsOverlay = new MainMenuOptionsOverlay(this);
    this.addChild(this.optionsOverlay, 20);
  }

  async initCredits() {
    try {
      const [recentChangesText, creditsText] = await Promise.all([
        this.assets.loadText("RECENT_CHANGES.txt"),
        this.assets.loadText("AFCredits.txt"),
      ]);
      const lines = creditsRollLines(recentChangesText, creditsText);
      this.addChild(new MainMenuCreditsRoll(lines), Tags.credits, Tags.credits);
    } catch (error) {
      console.error("Unable to load Alien Frontiers credits", error);
    }
  }

  initChildren() {
    const halfWinWidth = 768 * 0.5;
    this.addChild(new CCLayerColor("rgb(200,200,200)"), Tags.colorBackground, Tags.colorBackground);

    const background = new CCSprite(this.assets.image("af_ipad_gui_bg.png"));
    background.setAnchorPoint(ccp(0, 0));
    this.addChild(background, Tags.background, Tags.background);

    const title = new CCSprite(this.assets.image("af_title.png"));
    title.setPosition(ccp(halfWinWidth, 900));
    this.addChild(title, Tags.title, Tags.title);

    const buildLabel = new CCLabelTTF(
      mainMenuBuildLabel(this.director.buildVersion),
      "DIN-Medium",
      11,
      "#9aa5bd",
    );
    buildLabel.setAnchorPoint(ccp(1, 0));
    buildLabel.setPosition(ccp(756, 10));
    buildLabel.opacity = 180;
    this.addChild(buildLabel, Tags.build, Tags.build);

    if (!this.director.installPreferences?.isInstalled && isMobileBrowser()) {
      const installCallout = new CCNode();
      const calloutBackground = new CCSprite(this.assets.image("aa_card_detail_box.png"));
      calloutBackground.setPosition(ccp(688, 520));
      calloutBackground.opacity = 210;
      installCallout.addChild(calloutBackground);

      const installButton = this.buttonFromImage(
        "app-icon-192.png",
        "app-icon-192.png",
        () => this.installApp(),
      );
      installButton.setScale(0.5);
      installButton.setPosition(ccp(688, 555));
      installCallout.addChild(installButton);

      const installLabel = new CCLabelTTF("INSTALL APP", "DIN-Black", 15, "#ffae41");
      installLabel.setPosition(ccp(688, 478));
      installCallout.addChild(installLabel);

      const benefitLabel = new CCLabelTTF(
        "FULLSCREEN + OFFLINE",
        "DIN-Medium",
        10,
        "#9fdcf5",
        { maxWidth: 128 },
      );
      benefitLabel.setPosition(ccp(688, 455));
      installCallout.addChild(benefitLabel);
      this.addChild(installCallout, Tags.install, Tags.install);
    }

    const hasSavedGame = this.director.persistence?.hasSavedGame;
    if (hasSavedGame) {
      const resumeButton = this.buttonFromImage(
        "menu_button_blank.png",
        "menu_button_blank_pushed.png",
        () => this.resumeButtonTapped(),
        { label: "RESUME GAME", fontSize: 24, fontColor: "#000" },
      );
      resumeButton.setPosition(ccp(-halfWinWidth - resumeButton.contentSize.width * 0.5, 640));
      this.addChild(resumeButton, Tags.resume, Tags.resume);
      resumeButton.runAction(new CCEaseElasticInOut(
        new CCMoveTo(0.8, ccp(halfWinWidth, 640)),
        0.8,
      ));
    }

    const playButton = this.buttonFromImage(
      "menu_play_big.png",
      "menu_play_big_pushed.png",
      () => this.playButtonTapped(),
    );
    const playY = hasSavedGame ? 550 : 600;
    playButton.setPosition(ccp(-halfWinWidth - playButton.contentSize.width * 0.5, playY));
    this.addChild(playButton, Tags.play, Tags.play);
    playButton.runAction(new CCEaseElasticInOut(new CCMoveTo(0.8, ccp(halfWinWidth, playY)), 0.8));

    const rulesButton = this.buttonFromImage(
      "menu_rules.png",
      "menu_rules_pushed.png",
      () => this.rulesButtonTapped(),
    );
    const rulesY = hasSavedGame ? 470 : 520;
    rulesButton.setPosition(ccp(-halfWinWidth - rulesButton.contentSize.width * 0.5, rulesY));
    this.addChild(rulesButton, Tags.rules, Tags.rules);
    rulesButton.runAction(new CCSequence(
      new CCDelayTime(0.1),
      new CCEaseElasticInOut(new CCMoveTo(0.8, ccp(halfWinWidth, rulesY)), 0.8),
    ));

    const optionsButton = this.buttonFromImage(
      "menu_button_blank.png",
      "menu_button_blank_pushed.png",
      () => this.optionsButtonTapped(),
      { label: "OPTIONS", fontSize: 24, fontColor: "#000" },
    );
    const optionsY = hasSavedGame ? 390 : 440;
    optionsButton.setPosition(ccp(-halfWinWidth - optionsButton.contentSize.width * 0.5, optionsY));
    this.addChild(optionsButton, Tags.options, Tags.options);
    optionsButton.runAction(new CCSequence(
      new CCDelayTime(0.2),
      new CCEaseElasticInOut(new CCMoveTo(0.8, ccp(halfWinWidth, optionsY)), 0.8),
    ));
  }

  playButtonTapped() {
    this.director.replaceScene(new StartGameScene(this.director, this.assets));
  }

  async resumeButtonTapped() {
    try {
      const state = this.director.persistence.load();
      if (!state) {
        return;
      }
      const { GameScene } = await import("./game.js");
      this.director.replaceScene(new GameScene(this.director, this.assets, state));
    } catch (error) {
      console.error("Unable to restore saved Alien Frontiers game", error);
      this.director.persistence.clear();
      this.director.replaceScene(new MainMenuScene(this.director, this.assets));
    }
  }

  rulesButtonTapped() {
    window.open("./AlienFrontiersRules-Final-Trimmed.pdf", "_blank", "noopener");
  }

  optionsButtonTapped() {
    this.optionsOverlay.open();
  }

  async installApp() {
    const outcome = await this.director.installPreferences?.request();
    if (outcome === "instructions") {
      window.alert(installGuidance());
    } else if (outcome === "accepted" || outcome === "installed") {
      this.getChildByTag(Tags.install)?.removeFromParent();
    }
    return outcome;
  }
}

class MainMenuOptionsOverlay extends CCNode {
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
    this.sfxButton = this.addButton("", 0, () => this.toggleSfx());
    this.musicButton = this.addButton("", 1, () => this.toggleMusic());
    this.aiSearchButton = this.addButton("", 2, () => this.cycleAISearch());
    this.fullscreenButton = this.addButton("", 3, () => this.toggleFullscreen());
    this.installButton = this.addButton("INSTALL APP", 4, () => this.installApp());
    this.doneButton = this.addButton("DONE", 5, () => this.close());
  }

  addButton(label, index, callback) {
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
    this.visible = true;
    for (const tag of [Tags.play, Tags.rules, Tags.resume, Tags.options, Tags.install]) {
      const node = this.scene.getChildByTag(tag);
      if (node) {
        node.visible = false;
      }
    }
    this.shade.opacity = 0;
    this.shade.runAction(new CCFadeTo(0.35, 192));
    this.updateLabels();
    this.installButton.visible = !this.scene.director.installPreferences?.isInstalled;
    const buttons = [
      this.sfxButton,
      this.musicButton,
      this.aiSearchButton,
      this.fullscreenButton,
      this.doneButton,
    ];
    if (this.installButton.visible) {
      buttons.splice(4, 0, this.installButton);
    }
    buttons.forEach((button, index) => {
      const destination = ccp(384, 690 - 100 * index);
      button.setPosition(ccp(-500, destination.y));
      button.runAction(new CCEaseElasticInOut(new CCMoveTo(0.65, destination), 0.8));
    });
  }

  close() {
    this.visible = false;
    for (const tag of [Tags.play, Tags.rules, Tags.resume, Tags.options, Tags.install]) {
      const node = this.scene.getChildByTag(tag);
      if (node) {
        node.visible = true;
      }
    }
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

  async toggleFullscreen() {
    const fullscreen = this.scene.director.fullscreenPreferences;
    if (!fullscreen?.isSupported && !fullscreen?.isStandalone) {
      window.alert(
        "To play full screen, use your browser's Add to Home Screen option, then launch Alien Frontiers from its icon.",
      );
      return;
    }
    await fullscreen.toggle();
    this.updateLabels();
  }

  async installApp() {
    const outcome = await this.scene.installApp();
    if (outcome === "accepted" || outcome === "installed") {
      this.close();
    }
  }

  updateLabels() {
    const audio = this.scene.director.soundManager;
    const fullscreen = this.scene.director.fullscreenPreferences;
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
    let fullscreenLabel = fullscreen?.isActive ? "ON" : fullscreen?.enabled ? "AUTO" : "OFF";
    if (!fullscreen?.isSupported && !fullscreen?.isStandalone) {
      fullscreenLabel = "ADD TO HOME";
    }
    this.scene.setButtonLabel(this.fullscreenButton, `FULL SCREEN: ${fullscreenLabel}`);
  }
}