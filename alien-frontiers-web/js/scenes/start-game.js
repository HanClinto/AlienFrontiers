import { AFLayer } from "../af-layer.js";
import { CCLayerColor, CCSprite, ccp } from "../cocos/core.js";
import { AIType } from "../game/constants.js";
import { GameState } from "../game/game-state.js";

const Tags = Object.freeze({
  colorBackground: 0,
  background: 1,
  title: 2,
  play: 3,
  numPlayers: 4,
  back: 5,
  player1: 6,
  player2: 7,
  player3: 8,
  player4: 9,
});

const PLAYER_COLORS = ["#952034", "#007226", "#005a96", "#ffc200"];

export class StartGameScene extends AFLayer {
  constructor(director, assets) {
    super(assets);
    this.director = director;
    this.numPlayers = 2;
    this.playerPersonalities = [AIType.human, AIType.easy, AIType.medium, AIType.hard];
    this.initChildren();
    this.updateView();
  }

  initChildren() {
    this.addChild(new CCLayerColor("#000033"), Tags.colorBackground, Tags.colorBackground);

    const background = new CCSprite(this.assets.image("af_ipad_gui_bg.png"));
    background.setAnchorPoint(ccp(0, 0));
    this.addChild(background, Tags.background, Tags.background);

    const title = new CCSprite(this.assets.image("af_game_setup.png"));
    title.setPosition(ccp(384, 900));
    this.addChild(title, Tags.title, Tags.title);

    const backButton = this.buttonFromImage(
      "menu_back.png",
      "menu_back_pushed.png",
      () => this.backButtonTapped(),
    );
    backButton.setPosition(ccp(100, 974));
    this.addChild(backButton, Tags.back, Tags.back);

    const playButton = this.buttonFromImage(
      "menu_play_big.png",
      "menu_play_big_pushed.png",
      () => this.playButtonTapped(),
    );
    playButton.setPosition(ccp(384, 600));
    this.addChild(playButton, Tags.play, Tags.play);

    const numPlayersButton = this.buttonFromImage(
      "menu_button_blank.png",
      "menu_button_blank_pushed.png",
      () => this.numPlayersButtonTapped(),
      { label: "2", fontSize: 36, fontColor: "#000" },
    );
    numPlayersButton.setPosition(ccp(384, 525));
    this.addChild(numPlayersButton, Tags.numPlayers, Tags.numPlayers);

    for (let playerIndex = 0; playerIndex < 4; playerIndex += 1) {
      const playerButton = this.buttonFromImage(
        "menu_button_blank.png",
        "menu_button_blank_pushed.png",
        () => this.playerButtonTapped(playerIndex),
        {
          label: this.getAIName(this.playerPersonalities[playerIndex]),
          fontSize: 20,
          fontColor: PLAYER_COLORS[playerIndex],
        },
      );
      playerButton.setPosition(ccp(
        playerIndex % 2 === 0 ? 284 : 484,
        playerIndex < 2 ? 400 : 325,
      ));
      this.addChild(playerButton, Tags.player1 + playerIndex, Tags.player1 + playerIndex);
    }
  }

  async backButtonTapped() {
    const { MainMenuScene } = await import("./main-menu.js");
    this.director.replaceScene(new MainMenuScene(this.director, this.assets));
  }

  async playButtonTapped() {
    const detail = {
      numPlayers: this.numPlayers,
      playerPersonalities: this.playerPersonalities.slice(0, this.numPlayers),
    };
    window.dispatchEvent(new CustomEvent("alienfrontiers:startgame", {
      detail,
    }));
    const { GameScene } = await import("./game.js");
    const state = new GameState(detail.numPlayers, detail.playerPersonalities, Math.random, Math.random);
    this.director.replaceScene(new GameScene(this.director, this.assets, state));
  }

  numPlayersButtonTapped() {
    this.numPlayers = this.numPlayers >= 4 ? 2 : this.numPlayers + 1;
    this.updateView();
  }

  playerButtonTapped(playerIndex) {
    this.playerPersonalities[playerIndex] =
      (this.playerPersonalities[playerIndex] + 1) % AIType.length;
    this.updateView();
  }

  updateView() {
    this.setButtonLabel(this.getChildByTag(Tags.numPlayers), this.numPlayers);
    for (let playerIndex = 0; playerIndex < 4; playerIndex += 1) {
      const button = this.getChildByTag(Tags.player1 + playerIndex);
      button.visible = playerIndex < this.numPlayers;
      this.setButtonLabel(button, this.getAIName(this.playerPersonalities[playerIndex]));
    }
  }

  getAIName(index) {
    return ["Human", "AI: Cadet", "AI: Spacer", "AI: Admiral", "AI: Pirate"][index] ?? "None";
  }
}