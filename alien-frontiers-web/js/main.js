import { AssetCache } from "./cocos/assets.js";
import { CCDirector } from "./cocos/director.js";
import { CCSpriteFrameCache } from "./cocos/sprite-frame-cache.js";
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
  "af_ipad_board.png",
  "button_roll_down.png",
  "button_roll_up.png",
  "button_medium_down.png",
  "button_medium_up.png",
  "die_select.png",
  "dock_blank.png",
  "dock_mb.png",
  "dock_normal.png",
  "hud_colony_blue.png",
  "hud_colony_green.png",
  "hud_colony_red.png",
  "hud_colony_yellow.png",
  "hud_die_blue.png",
  "hud_die_green.png",
  "hud_die_red.png",
  "hud_die_yellow.png",
  "hud_port_player_tab_large.png",
  "icon_gte.png",
  "icons_lm.png",
  "icons_om.png",
  "icons_sc.png",
  "icons_sy.png",
  "karim_dice_sm.png",
  "dock_pair.png",
  "tray_btn_done.png",
  "tray_btn_done_active.png",
  "tray_btn_done_inactive.png",
];

async function start() {
  const canvas = document.querySelector("#game-canvas");
  const loading = document.querySelector("#loading");
  const assets = new AssetCache(new URL("../assets/", import.meta.url));

  await Promise.all([
    assets.preloadImages(MENU_IMAGES),
    document.fonts.load('24px "DIN-Black"'),
    document.fonts.load('12px "DIN-Medium"'),
  ]);

  const frameCache = new CCSpriteFrameCache(assets);
  await frameCache.addSpriteFramesWithFile("karim_dice_sm.plist", "karim_dice_sm.png");

  loading.hidden = true;
  canvas.hidden = false;
  const director = new CCDirector(canvas);
  director.frameCache = frameCache;
  globalThis.AlienFrontiers = Object.freeze({ director });
  director.runWithScene(new MainMenuScene(director, assets));
}

start().catch((error) => {
  console.error(error);
  const loading = document.querySelector("#loading");
  loading.textContent = "Unable to load Alien Frontiers.";
});