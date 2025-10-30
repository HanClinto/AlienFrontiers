//
//  MultiLayerScene.m
//  ScenesAndLayers
//
//  Created by Steffen Itterheim on 28.07.10.
//  Copyright 2010 Steffen Itterheim. All rights reserved.
//

#import "SceneGameiPad.h"
#import "LayerHUDPort.h"
#import "LayerHUDLand.h"
#import "LayerGameBoard.h"
#import "LayerOrbitals.h"
#import "LayerRegions.h"
#import "LayerGameMenu.h"
#import "LayerGameOverMenu.h"
#import "LayerTechAADetail.h"
#import "LayerFX.h"
#import "SimpleAI.h"
#import "ExhaustiveAI.h"
#import "Player.h"
#import "GameState.h"

@implementation SceneGameiPad

// Semi-Singleton: you can access MultiLayerScene only as long as it is the active scene.
static SceneGameiPad* sceneGameiPadInstance;

+(SceneGameiPad*) sharedLayer
{
	NSAssert(sceneGameiPadInstance != nil, @"SceneGameiPad not available!");
	return sceneGameiPadInstance;
}

// Access to the various layers by wrapping the getChildByTag method
// and checking if the received node is of the correct class.
+(LayerGameBoard*) gameLayer
{
	CCNode* layer = [[SceneGameiPad sharedLayer] getChildByTag:LayerTagGameLayer];

	NSAssert1([layer isKindOfClass:[LayerGameBoard class]], @"%@: not a LayerGameBoard!", NSStringFromSelector(_cmd));
	return (LayerGameBoard*)layer;
}

+(LayerShips*) shipsLayer
{
	CCNode* layer = [[SceneGameiPad sharedLayer] getChildByTag:LayerTagShips];
	NSAssert1([layer isKindOfClass:[LayerShips class]], @"%@: not a LayerShips!", NSStringFromSelector(_cmd));
	return (LayerShips*)layer;
}

+(LayerHUDPort*) uiLayer
{
	CCNode* layer = [[SceneGameiPad sharedLayer] getChildByTag:LayerTagUILayerPort];
	NSAssert1([layer isKindOfClass:[LayerHUDPort class]], @"%@: not a LayerHUDPort!", NSStringFromSelector(_cmd));
	return (LayerHUDPort*)layer;
}

+(LayerOrbitals*) orbitalsLayer
{
	CCNode* shared = [SceneGameiPad sharedLayer];
	CCNode* layer = [shared getChildByTag:LayerTagOrbitals];
	NSAssert1([layer isKindOfClass:[LayerOrbitals class]], @"%@: not a LayerOrbitals!", NSStringFromSelector(_cmd));
	return (LayerOrbitals*)layer;
}

+(LayerRegions*) regionsLayer
{
	CCNode* shared = [SceneGameiPad sharedLayer];
	CCNode* layer = [shared getChildByTag:LayerTagRegions];
	NSAssert1([layer isKindOfClass:[LayerRegions class]], @"%@: not a LayerRegions!", NSStringFromSelector(_cmd));
	return (LayerRegions*)layer;
}


+(LayerGameMenu*) menuLayer
{
	CCNode* layer = [[SceneGameiPad sharedLayer] getChildByTag:LayerTagMenu];
	NSAssert1([layer isKindOfClass:[LayerGameMenu class]], @"%@: not a LayerGameMenu!", NSStringFromSelector(_cmd));
	return (LayerGameMenu*)layer;    
}

+(LayerGameOverMenu*) gameOverMenuLayer
{
	CCNode* layer = [[SceneGameiPad sharedLayer] getChildByTag:LayerTagGameOverMenu];
	NSAssert1([layer isKindOfClass:[LayerGameOverMenu class]], @"%@: not a LayerGameOverMenu!", NSStringFromSelector(_cmd));
	return (LayerGameOverMenu*)layer;    
}

+(GameTouchManager*) gameTouchManager
{
    return [[SceneGameiPad sharedLayer] gameTouchManager];
}

-(GameTouchManager*) gameTouchManager
{
    return gameTouchManager;
}

+(CGPoint) locationFromTouch:(UITouch*)touch
{
	CGPoint touchLocation = [touch locationInView: [touch view]];
	return [[CCDirector sharedDirector] convertToGL:touchLocation];
}

+(CGPoint) locationFromTouches:(NSSet*)touches
{
	return [self locationFromTouch:[touches anyObject]];
}

+(id) scene
{
	CCScene* scene = [CCScene node];
	SceneGameiPad* layer = [SceneGameiPad node];
	[scene addChild:layer];
	return scene;
}

-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
		// TODO: Sometimes this assertion fails... why?
		//NSAssert(sceneGameiPadInstance == nil, @"another SceneGameiPad is already in use!");
		sceneGameiPadInstance = self;
		
		currentOrientation = UIDeviceOrientationPortrait;
	}
	
	return self;
}

-(void) initChildren
{
    // This adds a solid color background.
    CCLayerColor* colorLayer = [CCLayerColor layerWithColor:ccc4(0, 0, 51, 255)];
    [self addChild:colorLayer z:LayerTagColorLayer tag:LayerTagColorLayer];
    
    // The GameLayer will be moved, rotated and scaled independently from other layers.
    // It also contains a number of moving pseudo game objects to show the effect on child nodes of GameLayer.
    LayerGameBoard* gameLayer = [LayerGameBoard node];
    [self addChild:gameLayer z:LayerTagGameLayer tag:LayerTagGameLayer];
    
    // The UserInterfaceLayer remains static and relative to the screen area.
    LayerHUDPort* uiPort = [LayerHUDPort node];
    [self addChild:uiPort z:LayerTagUILayerPort tag:LayerTagUILayerPort];
    
    LayerHUDLand* uiLand = [LayerHUDLand node];
    [self addChild:uiLand z:LayerTagUILayerLand tag:LayerTagUILayerLand];
    
    LayerPortPlayerMiniHUD* mini;
    
    for (int cnt = 0; cnt < [[GameState sharedGameState] numPlayers]; cnt++)
    {
        mini = [[LayerPortPlayerMiniHUD alloc] initWithIndex:cnt];
        [self addChild:mini z:LayerTagMiniHUD1 + cnt tag:LayerTagMiniHUD1 + cnt];
    }
    
    // The Orbitals layer shows above the HUD, but needs to mirror the game layer.
    LayerOrbitals* orbitals = [LayerOrbitals node];
    [self addChild:orbitals z:LayerTagOrbitals tag:LayerTagOrbitals];
    
    LayerRegions* regions = [LayerRegions node];
    [self addChild:regions z:LayerTagRegions tag:LayerTagRegions];
    
    LayerFX* fx = [LayerFX node];
    [self addChild:fx z:LayerTagFX tag:LayerTagFX];
    
    LayerShips* ships = [LayerShips node];
    [self addChild:ships z:LayerTagShips
               tag:LayerTagShips];
    
    LayerGameMenu* menuLayer = [LayerGameMenu node];
    [self addChild:menuLayer z:LayerTagMenu tag:LayerTagMenu];
    
    LayerGameOverMenu* gameOverMenuLayer = [LayerGameOverMenu node];
    [self addChild:gameOverMenuLayer z:LayerTagGameOverMenu tag:LayerTagGameOverMenu];
    
    LayerTechAADetail* techAADetail = [LayerTechAADetail node];
    [self addChild:techAADetail z:LayerTagTechAADetail tag:LayerTagTechAADetail];
    
    gameTouchManager = [[GameTouchManager alloc] init];    
}

-(void) onEnter
{
    [super onEnter];

    [self schedule: @selector(aiTick:) interval:1.5];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(gameOver:) name:EVENT_GAME_OVER object:nil];
    
    [self scheduleOnce:@selector(fireStateReload:) delay:0.1];
}

-(void) onExit
{
    [self unschedule:@selector(aiTick:)];
	[[NSNotificationCenter defaultCenter] removeObserver:self];
    
    [super onExit];
}

-(void) dealloc
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// The Layer will be gone now, to avoid crashes on further access it needs to be nil.
    // TODO: Move this deallocation code to the onExit?
	if (sceneGameiPadInstance == self)
        sceneGameiPadInstance = nil;	
}

-(void) fireStateReload: (ccTime) dt 
{
    [GameState setActiveState:[GameState sharedGameState]];
//    [[GameState sharedGameState] postEvent:EVENT_STATE_RELOAD object:[GameState sharedGameState]];
}

-(void) aiTick: (ccTime) dt
{
    // Some hacks in here -- be warned.
    
    GameState* state = [GameState sharedGameState];
    Player* player = [state currentPlayer];
    
    [AIPlayer aiTick:player];
}

-(void)gameOver:(NSNotification *) notification
{
    // TODO: Have an end game animation, and let the player click an "end game" button?
    [[SceneGameiPad gameOverMenuLayer] activate];
}

-(CGPoint) rollingTrayPosition
{
	// TODO: This should just be LayerHUD
	LayerHUDPort* currentHUD;
	
	if (UIDeviceOrientationIsLandscape(self.currentOrientation))
	{
		// TODO: Get the landscape hUD
		currentHUD = (LayerHUDPort*) [self getChildByTag:LayerTagUILayerPort];
	} else {
		currentHUD = (LayerHUDPort*) [self getChildByTag:LayerTagUILayerPort];
	}

	return currentHUD.rollingTrayPosition;
}

-(UIDeviceOrientation) currentOrientation
{
	return currentOrientation;
}

-(void) setCurrentOrientation:(UIDeviceOrientation)orientation
{
	currentOrientation = orientation;
}

-(GameTouchManager*) touchManager
{
	return gameTouchManager;
}

-(ModalWindowTags) currentModalWindow
{
    return currentModalWindow;
}

-(void) setCurrentModalWindow:(ModalWindowTags)value
{
    currentModalWindow = value;
}

@end
