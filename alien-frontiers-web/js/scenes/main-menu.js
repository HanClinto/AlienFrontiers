import { AFLayer } from "../af-layer.js";
import { CCDelayTime, CCEaseElasticInOut, CCMoveTo, CCSequence } from "../cocos/actions.js";
import { CCLayerColor, CCSprite, ccp } from "../cocos/core.js";
import { StartGameScene } from "./start-game.js";

const Tags = Object.freeze({
  colorBackground: 0,
  background: 1,
  title: 2,
  play: 3,
  rules: 4,
  options: 7,
});

export class MainMenuScene extends AFLayer {
  constructor(director, assets) {
    super(assets);
    this.director = director;
    this.initChildren();
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

    const playButton = this.buttonFromImage(
      "menu_play_big.png",
      "menu_play_big_pushed.png",
      () => this.playButtonTapped(),
    );
    playButton.setPosition(ccp(-halfWinWidth - playButton.contentSize.width * 0.5, 600));
    this.addChild(playButton, Tags.play, Tags.play);
    playButton.runAction(new CCEaseElasticInOut(new CCMoveTo(0.8, ccp(halfWinWidth, 600)), 0.8));

    const rulesButton = this.buttonFromImage(
      "menu_rules.png",
      "menu_rules_pushed.png",
      () => this.rulesButtonTapped(),
    );
    rulesButton.setPosition(ccp(-halfWinWidth - rulesButton.contentSize.width * 0.5, 520));
    this.addChild(rulesButton, Tags.rules, Tags.rules);
    rulesButton.runAction(new CCSequence(
      new CCDelayTime(0.1),
      new CCEaseElasticInOut(new CCMoveTo(0.8, ccp(halfWinWidth, 520)), 0.8),
    ));

    const optionsButton = this.buttonFromImage(
      "menu_button_blank.png",
      "menu_button_blank_pushed.png",
      () => this.optionsButtonTapped(),
      { label: "OPTIONS", fontSize: 24, fontColor: "#000" },
    );
    optionsButton.setPosition(ccp(-halfWinWidth - optionsButton.contentSize.width * 0.5, 440));
    this.addChild(optionsButton, Tags.options, Tags.options);
    optionsButton.runAction(new CCSequence(
      new CCDelayTime(0.2),
      new CCEaseElasticInOut(new CCMoveTo(0.8, ccp(halfWinWidth, 440)), 0.8),
    ));
  }

  playButtonTapped() {
    this.director.replaceScene(new StartGameScene(this.director, this.assets));
  }

  rulesButtonTapped() {
    window.open("./AlienFrontiersRules-Final-Trimmed.pdf", "_blank", "noopener");
  }

  optionsButtonTapped() {
    window.dispatchEvent(new CustomEvent("alienfrontiers:options"));
  }
}