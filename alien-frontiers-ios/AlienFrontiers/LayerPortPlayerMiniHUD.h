//
//  LayerPlayerMiniHUD.h
//  AlienFrontiers
//
//  Created by Clint Herron on 4/19/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Player.h"
#import "GameState.h"
#import "cocos2d.h"
#import "LayerTechCardTrayVertMini.h"
#import "LayerTechCardInspector.h"
#import "LayerTechCardInspectorVertMini.h"
#import "AFLayer.h"

typedef enum
{
	MiniHUDLayerTagCardTray,
	MiniHUDLayerTagFrame,
	MiniHUDLayerTagCorner,
	MiniHUDLayerTagScoreLabel,
	MiniHUDLayerTagOreLabel,
	MiniHUDLayerTagFuelLabel,
	MiniHUDLayerTagColonyLabel,
	MiniHUDLayerTagDiceLabel,

    MiniHUDLayerTagRaidFuelUpBtn,
    MiniHUDLayerTagRaidFuelDownBtn,
    MiniHUDLayerTagRaidOreUpBtn,
    MiniHUDLayerTagRaidOreDownBtn,
    
    MiniHUDLayerTagOreToRaidLabel,
    MiniHUDLayerTagFuelToRaidLabel,
    
	MiniHUDLayerTagColonySprite,
	MiniHUDLayerTagDiceSprite,
    MiniHUDLayerTagCardInspector,
} MiniHUDLayerTags;

@interface LayerPortPlayerMiniHUD : AFLayer {
	int playerIndex;
	
	bool firstTimeShown;
	bool expanded;
    bool raidShowing;
    
    UIDeviceOrientation lastOrientation;
}

-(id) initWithIndex:(int)index;

- (void)refreshState:(NSNotification *)notification;
- (void)doRefreshState;
- (void)orientationChanged:(NSNotification *)notification;
- (void)doOrientationChanged;

- (BOOL)touchingLowerTab:(UITouch *)touch;
-(bool) isTouching:(CCNode*)item with:(UITouch*) touch;

@property (readonly) bool isPortraitHUD;
@property (readonly) CGPoint activePosition;
@property (readonly) CGPoint inactivePosition;

@end
