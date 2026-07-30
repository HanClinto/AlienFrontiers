# Cocos2D Web Shim Parity Audit

Updated: 2026-07-30  
Baseline: `d4454fc`  
Target: iPad portrait game in `alien-frontiers-ios/AlienFrontiers`  
Web port: `alien-frontiers-web`

## Status Legend

- `[EQ]` - behavior is implemented and equivalent for active callers.
- `[PARTIAL]` - represented, but one or more Cocos semantics differ.
- `[MISSING]` - currently relevant behavior is absent.
- `[DEFERRED]` - platform setup, legacy layout, or inactive functionality that the web target does not currently need.

## Method

Counts are static source-reference counts, not runtime invocation counts. They include type references, constructors, property access, and message sends after stripping block and line comments.

Included: active Objective-C `.m` files under `alien-frontiers-ios/AlienFrontiers`, including portrait scenes, facilities, HUDs, cards, regions, model code, and active menus.

Excluded from counts:

- `AppDelegateOld.m`
- `AlienFrontiersAppDelegate_.m`
- `GCTurnBasedMatchHelper.m`
- `HelloWorldLayer.m`
- `iPadGameSceneOld.m`
- `iPhoneGameScene.m`
- comments and `CCLOG`

The counts are useful for prioritization, but they are not percentages of rendered pixels or gameplay completeness. A frequently referenced primitive such as `position` is less risky than one missing blend mode that controls every ownership overlay.

## Summary

| Measure | Count | Percent |
|---|---:|---:|
| Distinct Cocos class/action symbols | 38 | 100% |
| Equivalent or equivalent substitute | 26 | 68.4% |
| Implemented with semantic differences | 6 | 15.8% |
| Missing and currently relevant | 1 | 2.6% |
| Deferred/platform-only | 5 | 13.2% |
| At least represented (`EQ` + `PARTIAL`) | 32 | 84.2% |

The gameplay model is substantially further along than the rendering-equivalence percentage suggests. Most remaining fidelity problems cluster around text metrics, blend modes, clipping/bounds, and generalized touch delivery.

## Cocos Class And Action Inventory

`References` counts uncommented occurrences in the audited Objective-C source set.

| Checklist | Cocos symbol | References | Web equivalent | Status | Notes |
|---|---|---:|---|---|---|
| [x] | `CCSprite` | 240 | `CCSprite` | `[PARTIAL]` | Image, anchor, frame, opacity and grayscale tint work. General RGB tint and Cocos blend state are missing. |
| [x] | `CCLabelTTF` | 124 | `CCLabelTTF` | `[EQ]` | Supports measured ascent/descent, fixed dimensions, horizontal/vertical alignment, centered baselines, and fitted captions. |
| [ ] | `CCNode` | 123 | `CCNode` | `[PARTIAL]` | Transform/tree/tag/action basics work. Negative-z visitation, lifecycle recursion and child-derived bounds differ. |
| [x] | `CCSequence` | 46 | `CCSequence` | `[EQ]` | Consumes oversized frame deltas across every stage and completes zero-duration callbacks at exact boundaries. |
| [ ] | `CCDirector` | 41 | `CCDirector` | `[PARTIAL]` | RAF, scene replacement, render and input conversion work. Scene stack/scheduling are direct substitutes. |
| [x] | `CCMoveTo` | 29 | `CCMoveTo` | `[EQ]` | Includes nested transforms and easing wrappers. |
| [x] | `CCLayerColor` | 18 | `CCLayerColor` | `[EQ]` | Solid color and opacity are supported. |
| [x] | `CCFadeTo` | 17 | `CCFadeTo` | `[EQ]` | Concurrent fade tracks work. |
| [x] | `CCScene` | 14 | `CCScene` | `[EQ]` | Active port uses replacement rather than a full scene stack. |
| [ ] | `CCLabelBMFont` | 12 | `WrappedTextBox` | `[MISSING]` | Readable prose substitute exists, but glyph metrics, symbol font, centered wrapping and line-height are not equivalent. |
| [x] | `CCFadeIn` | 11 | `CCFadeTo(..., 255)` | `[EQ]` | Equivalent behavior through the generic fade action. |
| [ ] | `CCUIViewWrapper` | 11 | Canvas text / browser PDF | `[PARTIAL]` | Native text scrolling/clipping semantics are not reproduced. |
| [x] | `CCDelayTime` | 10 | `CCDelayTime` | `[EQ]` | Used by menus, cards and warp effects. |
| [x] | `CCRepeatForever` | 10 | `CCRepeatForever` | `[EQ]` | Consumes every complete repeat cycle represented by a large frame delta. |
| [x] | `CCScaleTo` | 10 | `CCScaleTo` | `[EQ]` | Supports independent X/Y targets. |
| [x] | `CCTextureCache` | 10 | `AssetCache` | `[EQ]` | Asynchronous preload and named lookup substitute active usage. |
| [x] | `CCFadeOut` | 9 | `CCFadeTo(..., 0)` | `[EQ]` | Equivalent behavior through the generic fade action. |
| [ ] | `CCActionEase` | 7 | Concrete ease wrappers | `[DEFERRED]` | Base class is type plumbing; active concrete eases exist. |
| [x] | `CCMenuItemImage` | 7 | `CCMenuItemImage` | `[EQ]` | Normal, selected, disabled, priority and press-release activation work. |
| [x] | `CCEaseElasticInOut` | 6 | `CCEaseElasticInOut` | `[EQ]` | Menu motion uses original period values. |
| [x] | `CCEaseSineIn` | 6 | `CCEaseSineIn` | `[EQ]` | Used by staged ship warp movement. |
| [x] | `CCMenu` | 6 | `CCMenu` | `[EQ]` | Menu item ownership and offsets are preserved. |
| [x] | `CCEaseSineOut` | 5 | `CCEaseSineOut` | `[EQ]` | Used by staged ship warp movement. |
| [x] | `CCCallFuncN` | 4 | `CCCallFunc(target => ...)` | `[EQ]` | Target-node callbacks are represented by the callback argument. |
| [x] | `CCSpriteFrameCache` | 4 | `CCSpriteFrameCache` | `[EQ]` | Equivalent for the active unrotated dice atlas. |
| [x] | `CCCallFunc` | 3 | `CCCallFunc` | `[EQ]` | Immediate callback actions work. |
| [x] | `CCLayer` | 3 | `CCLayer` | `[EQ]` | Active layers use `CCNode` scene graph behavior. |
| [x] | `CCEaseElasticOut` | 2 | `CCEaseElasticOut` | `[EQ]` | Tech card tray slide-in behavior is supported. |
| [x] | `CCEaseSineInOut` | 2 | `CCEaseSineInOut` | `[EQ]` | Used by panel and track movement. |
| [ ] | `CCFileUtils` | 2 | Browser URL resolution | `[DEFERRED]` | iOS suffix/fallback setup is not applicable to the web target. |
| [ ] | `CCGLView` | 2 | `<canvas>` | `[DEFERRED]` | iOS OpenGL view setup is platform-only. |
| [x] | `CCRotateBy` | 2 | `CCRotateBy` | `[EQ]` | Roll and selection-ring animations work. |
| [ ] | `CCTexture2D` | 2 | Browser image/canvas | `[DEFERRED]` | Pixel format and PVR configuration are platform-only. |
| [ ] | `CCTintTo` | 2 | `CCTintTo` | `[PARTIAL]` | RGB interpolation exists; rendering currently reproduces grayscale dock tint only. |
| [ ] | `CCDirectorIOS` | 1 | Browser director | `[DEFERRED]` | iOS-specific director subclass is not applicable. |
| [x] | `CCMenuItem` | 1 | `CCMenuItemImage` | `[EQ]` | The active concrete item behavior is covered. |
| [ ] | `CCRotateTo` | 1 | `CCRotateBy` substitute | `[PARTIAL]` | Current roll animation reaches the intended spin but lacks exact absolute-angle semantics. |
| [x] | `CCSpriteFrame` | 1 | `CCSpriteFrame` | `[EQ]` | Active dice frames use source rectangles correctly. |

## Core API And Property Inventory

These rows capture high-volume APIs that class counts alone hide.

| Checklist | API/property family | References | Status | Web notes |
|---|---|---:|---|---|
| [x] | Position (`position`, `setPosition:`) | 330 | `[EQ]` | Bottom-left coordinates and parent transforms are preserved. |
| [x] | `addChild:z:tag:` family | 249 | `[PARTIAL]` | Ordering/tagging work; node-vs-negative-z visitation order differs. |
| [x] | `getChildByTag:` | 120 | `[EQ]` | Direct child lookup is equivalent. |
| [ ] | Anchor point | 95 | `[PARTIAL]` | Transform semantics work; text metric differences make labels appear offset despite correct anchors. |
| [x] | Sprite file construction | 98 | `[EQ]` | Original assets are preloaded and rendered directly. |
| [x] | Visibility | 75 | `[EQ]` | Visibility gates rendering and hit testing. |
| [ ] | Color/tint | 69 | `[PARTIAL]` | Grayscale brightness works. Ownership tint and arbitrary RGB modulation do not. |
| [x] | `buttonFromImage` helpers | 63 | `[EQ]` | Normal/pressed/disabled and labels are reproduced. |
| [ ] | `contentSize` | 62 | `[PARTIAL]` | Images and labels own sizes, but constrained text dimensions and child-derived sizes differ. |
| [x] | `runAction:` | 46 | `[EQ]` | Concurrent tracks are supported. |
| [x] | Opacity | 45 | `[EQ]` | Cascades through descendants as expected for active UI. |
| [ ] | Touch enabled flags | 28 | `[PARTIAL]` | Interactive/enable state exists; generalized Cocos dispatcher semantics do not. |
| [x] | `removeChild:` | 23 | `[EQ]` | Parent clearing and cleanup are sufficient for current nodes. |
| [x] | `stopAllActions` | 18 | `[EQ]` | Stops all tracks on the target node. |
| [ ] | `boundingBox` | 15 | `[MISSING]` | Hand-authored hit boxes currently substitute transformed sprite bounds. |
| [x] | Scale | 15 | `[EQ]` | Node and sprite scaling work; some original call sites are not yet mirrored. |
| [ ] | `setBlendFunc:` | 11 | `[MISSING]` | Destination-color ownership overlays and additive glows are absent. |
| [ ] | Targeted touch delegate | 11 | `[PARTIAL]` | Numeric priority exists; multiple delegates/pass-through are not generalized. |
| [x] | Children enumeration | 9 | `[EQ]` | Direct child arrays preserve order. |
| [x] | `setTexture:` | 8 | `[EQ]` | Image replacement is used by cards and mini-HUD frames. |
| [ ] | `childBounds` | 7 | `[MISSING]` | Orbitals/cards use explicit hit rectangles instead of child unions. |
| [x] | Rotation | 7 | `[EQ]` | Clockwise Cocos angle convention is preserved. |
| [x] | `replaceScene:` | 6 | `[EQ]` | Main flow uses scene replacement. |
| [x] | `convertToNodeSpace:` | 5 | `[EQ]` | Inverse nested transforms are tested. |
| [x] | `convertToWorldSpace:` | 5 | `[EQ]` | Nested world transforms are tested. |
| [ ] | `pushScene:` | 5 | `[DEFERRED]` | Rules/help and modals use browser/direct scene alternatives. |
| [x] | `convertToGL:` | 4 | `[EQ]` | CSS-scaled pointer coordinates convert once at the boundary. |
| [ ] | `popScene` | 3 | `[DEFERRED]` | Scene-stack navigation is currently unnecessary. |
| [x] | Atlas add / frame lookup / display | 3 | `[EQ]` | Exact active dice atlas path is covered. |
| [ ] | Scheduling (`schedule`, once, unschedule) | 3 | `[PARTIAL]` | RAF updates and `setTimeout` substitute current gameplay timers. |
| [x] | Remove all children | 1 | `[EQ]` | Equivalent cleanup exists. |
| [x] | `winSize` | 24 | `[EQ]` | Fixed `768x1024` design size substitutes director queries. |

## Rendering And Interaction Semantics

| Checklist | Semantic area | Status | Verified gap / next action |
|---|---|---|---|
| [x] | Label baseline and dimensions | `[EQ]` | `CCLabelTTF` now supports fixed dimensions/alignment, actual ascent/descent, centered alphabetic baselines, and fitted button captions. |
| [ ] | BMFont descriptions | `[MISSING]` | Original symbol glyphs and centered line metrics are not represented. Current readable prose is functionally complete but not pixel-equivalent. |
| [ ] | Destination-color blending | `[MISSING]` | Needed for player-color HUD corners and region ownership overlays (`GL_DST_COLOR`, `GL_ONE_MINUS_SRC_ALPHA`). |
| [ ] | Additive blending | `[MISSING]` | Needed for die/roll/done/region glows and several flare/resource effects (`GL_SRC_ALPHA`, `GL_ONE`). |
| [ ] | Region border/ownership overlay | `[MISSING]` | Assets exist in the iOS project but are not rendered by the web `RegionLayer`. Tint support is not sufficient without blend modes. |
| [ ] | Negative-z node visitation | `[PARTIAL]` | Director draws a node before all children; Cocos draws negative-z children first. |
| [ ] | Child bounds and transformed rectangles | `[MISSING]` | Add `boundingBox`, `childBounds`, inset and union helpers; replace manual facility/card hit boxes incrementally. |
| [ ] | General touch pass-through | `[PARTIAL]` | Docked-die forwarding fixes Lunar/Raiders. General `swallowsTouches:NO` behavior remains absent. |
| [x] | Tray culling and shadows | `[EQ]` | Current and mini trays use original whole-card culling and place their HUD frame sprites above the tray, preserving the authored foreground lip/shadow. |
| [ ] | Scrollable game log | `[PARTIAL]` | The original `172x142` Communications aperture and bottom-following lines render correctly; direct touch scrolling remains unimplemented. |
| [ ] | Resource and HUD particles | `[MISSING]` | Original `LayerHUDPort.particleWithSprite` motion/fade/scale effects are not ported. |
| [ ] | Roll/done/region glows | `[MISSING]` | Artwork exists; requires additive blend state and repeat actions at the original call sites. |

## Reported Fidelity Issues

| Checklist | Reported issue | Verified cause | Root fix |
|---|---|---|---|
| [x] | Numeric labels look too high | Fixed by measured ascent/descent, centered alphabetic baselines, and original mini-HUD `30x30` / score `50x60` text boxes. | Browser validation confirms current and mini-HUD counters are centered in their authored cells. |
| [ ] | Log clips oddly near menu | The original `172x142` aperture at `(40,36)` is restored and no longer overlaps the hint/header. | Add drag/wheel scrolling while keeping bottom-follow mode. |
| [x] | Tech descriptions are misaligned | Current HUD, Artifact detail, and mini-HUD inspectors use original columns/centers and vertically centered anchors. | BMFont symbol glyphs and exact line metrics remain a visual-fidelity follow-up. |
| [x] | Tech tray border/shadow cues clip | Fixed by whole-card culling plus original frame-over-tray z-order in current and mini HUDs. | Browser crops confirm the foreground lip and shadow overlay the card bottoms. |
| [x] | Dice overlap Undo/Redo | Restored `SpriteShip.scale = 0.8`, original portrait rolling centers after legacy node compensation, and atlas-sized hit bounds. | A six-die browser crop confirms both rows remain inside the recessed tray above Undo/Redo. |
| [ ] | Territory ownership tint absent | Region border/overlay assets and blend modes are not used. | Add sprite blend modes, then port `LayerRegion.updateLabels` border and ownership overlay behavior. |

## Major Functional Gaps

The intended 20-card deck and core facilities are present. Remaining major gaps are primarily behavior depth and fidelity:

| Checklist | Gap | Impact |
|---|---|---|
| [ ] | Personality-specific `ExhaustiveAI` | The heuristic AI applies original aggression/noise/human prejudice, creates and spends Artifact credit, and opens/uses favorable Market trades. Exhaustive state search and active tech/facility sequencing remain unported. |
| [x] | Cancellable/step-back selection queues | Undo steps Gravity, Polarity, and Teleporter back one queue stage while retaining the first selection; at stage zero it safely cancels the active raid or tech queue. |
| [x] | Card inspection and card raids | Artifact detail shows both abilities; current and opponent trays select/highlight cards; mini inspectors show abilities and an explicit `RAID CARD` action that completes theft. |
| [ ] | Options scene and colorblind dice | Main-menu OPTIONS is not a complete scene; original alternate green dice and preference UI are absent. |
| [ ] | Generalized Cocos touch dispatcher | Manual forwarding handles known overlap cases, but future overlapping targets can still diverge from targeted delegate ordering. |
| [ ] | Full render/blend fidelity | Region ownership overlays, HUD tint blending, glows and several resource effects remain absent. |
| [ ] | Full animation coverage | Core card, die, panel, menu and ship warp animations exist; resource particles and several glows do not. |

Out of scope by project decision: Game Center, achievements, landscape layouts, expansions, and legacy iPhone scenes.

## Prioritized Milestones

### 1. Text And HUD Geometry

- [ ] Add `CCLabelTTF` fixed dimensions and alignment.
- [x] Correct numeric score/resource baselines in current and mini HUDs.
- [x] Restore original `0.8` ship scale and verify tray/control separation.
- [x] Center tech-description wrapping.
- [ ] Add game-log drag/wheel scrolling to the restored original aperture.
- [x] Replace exact tray pixel clipping with original whole-card culling/shadow behavior.

### 2. Blend Modes And Territory Overlays

- [ ] Add sprite blend state for destination-color and additive rendering.
- [ ] Port region border, majority overlay and selected border behavior.
- [ ] Port current/mini HUD corner and edge tint blending through the shim.
- [ ] Add roll/done/die/region glow behavior.

### 3. Scene Graph And Input Parity

- [ ] Implement negative-z child visitation.
- [ ] Implement transformed `boundingBox` and `childBounds` union/inset.
- [ ] Generalize targeted touch delivery and pass-through.
- [x] Make pending selection flows cancellable and step-back aware.

### 4. Remaining Product Behavior

- [ ] Port exhaustive AI state search and full tech/facility evaluation.
- [ ] Implement the Options scene and colorblind dice preference.
- [ ] Add remaining resource/ship particles and minor transitions.

### 5. Visual Regression Harness

- [ ] Capture fixed `768x1024` reference states for 2/3/4 players.
- [ ] Compare menu, setup, turn start, midgame, expanded panels, raids and game-over.
- [ ] Add mobile/desktop containment and critical pixel-presence checks.

## Recount Commands

Class/action symbol references:

```sh
active_files=(${(f)"$(rg --files alien-frontiers-ios/AlienFrontiers -g '*.m' \
  | rg -v '/(AppDelegateOld|AlienFrontiersAppDelegate_|GCTurnBasedMatchHelper|HelloWorldLayer|iPadGameSceneOld|iPhoneGameScene)\\.m$')"})

ruby -e 'text=ARGV.map{|f| File.file?(f) ? File.read(f) : nil}.compact.join("\n"); \
  text.gsub!(%r{/\\*.*?\\*/}m," "); text.gsub!(%r{//.*$},""); \
  counts=Hash.new(0); text.scan(/\\b(CC[A-Z][A-Za-z0-9_]*)\\b/){|m| counts[m[0]]+=1}; \
  counts.sort_by{|k,v|[-v,k]}.each{|k,v| puts "%4d %s"%[v,k]}' $active_files
```

Web validation:

```sh
node --test alien-frontiers-web/tests/*.test.js
for source_file in alien-frontiers-web/js/**/*.js alien-frontiers-web/js/*.js; do
  node --check "$source_file"
done
```
