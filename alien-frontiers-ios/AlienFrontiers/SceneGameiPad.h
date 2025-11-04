//
//  MultiLayerScene.h
//  ScenesAndLayers
//
//  Created by Steffen Itterheim on 28.07.10.
//  Copyright 2010 Steffen Itterheim. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "GameTouchManager.h"
#import "LayerPortPlayerMiniHUD.h"
#import "AFLayer.h"
#import "GCTurnBasedMatchHelper.h"

// Using an enum to define tag values has the upside that you can select
// tags by name instead of having to remember each individual number.
typedef enum
{
	LayerTagColorLayer,
	LayerTagGameLayer,
	LayerTagUILayerPort,
	LayerTagUILayerLand,
	LayerTagOrbitals,
	LayerTagRegions,
    LayerTagFX,
	LayerTagShips,
    LayerTagTechAADetail,
	LayerTagMiniHUD1,
	LayerTagMiniHUD2,
	LayerTagMiniHUD3,
	LayerTagMiniHUD4,
    LayerTagTechPopout,
    LayerTagMenu,
    LayerTagGameOverMenu,
} MultiLayerSceneTags;

typedef enum
{
	ActionTagGameLayerMovesBack,
	ActionTagGameLayerRotates,
} MultiLayerSceneActionTags;

typedef enum
{
    ModalWindowNone,
    ModalWindowAADetail,
    ModalWindowAADetailArtZoom,
    ModalWindowRaidDetail,
} ModalWindowTags;


// Class forwards: if a class is used in a header file only to define a member variable or return value,
// then it's more effective to use the @class keyword rather than #import the class header file.
// When projects grow large this helps to reduce the time it takes to compile the project.
@class LayerGameBoard;
@class LayerHUDPort;
@class LayerOrbitals;
@class LayerGameMenu;
@class LayerShips;
@class LayerRegions;

@interface SceneGameiPad : AFLayer
{
	bool isTouchForUserInterface;
	GameTouchManager* gameTouchManager;
	UIDeviceOrientation currentOrientation;
    
    ModalWindowTags currentModalWindow;
}

// Accessor methods to access the various layers of this scene
+(SceneGameiPad*) sharedLayer;

+(LayerOrbitals*) orbitalsLayer;
+(LayerGameBoard*) gameLayer;
+(LayerHUDPort*) uiLayer;
+(LayerGameMenu*) menuLayer;
+(LayerShips*) shipsLayer;
+(LayerRegions*) regionsLayer;
+(GameTouchManager*) gameTouchManager;

+(CGPoint) locationFromTouch:(UITouch*)touch;
+(CGPoint) locationFromTouches:(NSSet *)touches;

+(id) scene;

-(void) aiTick: (ccTime) dt;
-(void) fireStateReload: (ccTime) dt;

@property (weak, readonly) GameTouchManager* gameTouchManager;

@property (assign) UIDeviceOrientation currentOrientation;
@property (readonly) CGPoint rollingTrayPosition;
@property (weak, readonly) GameTouchManager* touchManager;

@property (assign) ModalWindowTags currentModalWindow;

@end
