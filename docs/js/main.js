import { AssetCache } from "./cocos/assets.js";
import { CCDirector } from "./cocos/director.js";
import { MainMenuScene } from "./scenes/main-menu.js";

const MENU_IMAGES = [
  "af_game_setup.png",
  "af_ipad_gui_bg.png",
  "af_title.png",
  "menu_back.png",
  "menu_back_pushed.png",
  "menu_button_blank.png",
  "menu_button_blank_pushed.png",
  "menu_play_big.png",
  "menu_play_big_pushed.png",
  "menu_rules.png",
  "menu_rules_pushed.png",
];

async function start() {
  const canvas = document.querySelector("#game-canvas");
  const loading = document.querySelector("#loading");
  const assets = new AssetCache(new URL("../assets/", import.meta.url));

  await Promise.all([
    assets.preloadImages(MENU_IMAGES),
    document.fonts.load('24px "DIN-Black"'),
  ]);

  loading.hidden = true;
  canvas.hidden = false;
  const director = new CCDirector(canvas);
  globalThis.AlienFrontiers = Object.freeze({ director });
  director.runWithScene(new MainMenuScene(director, assets));
}

start().catch((error) => {
  console.error(error);
  const loading = document.querySelector("#loading");
  loading.textContent = "Unable to load Alien Frontiers.";
});