import { AssetCache } from "./cocos/assets.js";
import { CCDirector } from "./cocos/director.js";
import { CCSpriteFrameCache } from "./cocos/sprite-frame-cache.js";
import { MainMenuScene } from "./scenes/main-menu.js";
import { GameAudioManager } from "./audio.js";
import { GamePersistence } from "./game/game-persistence.js";
import { AISearchPreferences } from "./game/ai-prefs.js";

const MENU_IMAGES = [
  "af_game_setup.png",
  "af_ipad_gui_bg.png",
  "af_title.png",
  "bonus_asimov.png",
  "bonus_bradbury.png",
  "bonus_burroughs.png",
  "bonus_heinlein.png",
  "bonus_herbert.png",
  "bonus_lem.png",
  "bonus_pohl.png",
  "bonus_van_vogt.png",
  "field_positron_medium.png",
  "field_isolator_medium.png",
  "field_repulsion_onecolony.png",
  "colonist_track_node_wide.png",
  "colonist_track_endpoint_wide.png",
  "icons_ch.png",
  "dock_ts.png",
  "icons_ts.png",
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
  "button_roll_glow.png",
  "button_medium_down.png",
  "button_medium_up.png",
  "button_long_up.png",
  "button_long_down.png",
  "die_select.png",
  "flare.png",
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
  "hud_port_player_tab_full.png",
  "hud_port_player_tab_full_RO.png",
  "hud_port_corner_tint.png",
  "hud_port_edge_tint.png",
  "hud_port_corner_tint_mini.png",
  "hud_card_tray_white_horiz.png",
  "hud_card_tray_mini_white_vert.png",
  "icon_gte.png",
  "icons_lm.png",
  "icons_om.png",
  "icons_sc.png",
  "icons_sy.png",
  "karim_dice_sm.png",
  "dock_pair.png",
  "dock_triple.png",
  "icons_cc.png",
  "icons_aa.png",
  "icon_gt.png",
  "dock_straight.png",
  "icon_to_mb.png",
  "icons_raiders.png",
  "colony_blue.png",
  "colony_green.png",
  "colony_red.png",
  "colony_yellow.png",
  "tech_layer_bg.png",
  "tech_layer_bg_selected.png",
  "tech_layer_bg_mini_horiz.png",
  "tech_layer_bg_mini_horiz_selected.png",
  "tech_ac.png",
  "tech_am.png",
  "tech_bp.png",
  "tech_pc.png",
  "tech_rc.png",
  "tech_sb.png",
  "tech_gm.png",
  "tech_pd.png",
  "tech_dc.png",
  "tech_ot.png",
  "tech_hd.png",
  "menu_button_68.png",
  "menu_button_68_active.png",
  "ondark_button.png",
  "ondark_button_active.png",
  "ondark_button_inactive.png",
  "aa_card_detail_box.png",
  "aa_card_background.png",
  "aa_OR_bar.png",
  "aa_back_button.png",
  "aa_back_button_active.png",
  "hud_port_or_bar.png",
  "menu_button_104.png",
  "menu_button_104_active.png",
  "hud_button_RO_up.png",
  "hud_button_ro_down.png",
  "hud_button_ro_up_active.png",
  "hud_button_ro_down_active.png",
  "hud_button_ro_up_inactive.png",
  "hud_button_ro_down_inactive.png",
  "tray_btn_done.png",
  "tray_btn_done_active.png",
  "tray_btn_done_inactive.png",
  "tray_btn_done_glow.png",
  "tray_btn_undo.png",
  "tray_btn_undo_active.png",
  "tray_btn_undo_inactive.png",
  "tray_btn_redo.png",
  "tray_btn_redo_active.png",
  "tray_btn_redo_inactive.png",
];

async function ensureCurrentDeployment(version) {
  if (!version) {
    return true;
  }
  try {
    const manifestUrl = new URL("../version.json", import.meta.url);
    manifestUrl.searchParams.set("check", Date.now());
    const response = await fetch(manifestUrl, { cache: "no-store" });
    if (!response.ok) {
      return true;
    }
    const { version: latestVersion } = await response.json();
    if (!latestVersion || latestVersion === version) {
      return true;
    }
    const pageUrl = new URL(globalThis.location.href);
    pageUrl.searchParams.set("build", latestVersion);
    globalThis.location.replace(pageUrl);
    return false;
  } catch {
    return true;
  }
}

async function start() {
  const canvas = document.querySelector("#game-canvas");
  const loading = document.querySelector("#loading");
  const version = new URL(import.meta.url).searchParams.get("v") ?? "";
  if (!await ensureCurrentDeployment(version)) {
    return;
  }
  const assets = new AssetCache(new URL("../assets/", import.meta.url), version);

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
  director.soundManager = new GameAudioManager(
    new URL("../assets/audio/", import.meta.url),
    undefined,
    undefined,
    version,
  );
  director.persistence = new GamePersistence();
  director.aiPreferences = new AISearchPreferences();
  director.frameCache = frameCache;
  globalThis.AlienFrontiers = Object.freeze({ director });
  director.runWithScene(new MainMenuScene(director, assets));
}

start().catch((error) => {
  console.error(error);
  const loading = document.querySelector("#loading");
  loading.textContent = "Unable to load Alien Frontiers.";
});