//
//  SpriteShip.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/13/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "Ship.h"
#import "Player.h"
#import "GameEvents.h"
#import "AFLayer.h"
#import "GameState.h"

//#import "LayerOrbitals.h"
//#import "SceneGameiPad.h"

typedef enum
{
	DieLayerTagDieSprite,
	DieLayerTagGlowSprite,
	DieLayerTagCircleSprite,
} DieLayerTags;

@class LayerOrbitals;
@class SceneGameiPad;

@interface SpriteShip : AFLayer {
	CCSprite* sprite;
	int playerID;
	int shipID;
	CGPoint rollingTrayPositionPort;
	CGPoint rollingTrayPositionLand;
	CGPoint rollingTrayPosition;
    int lastRollIndex;
    CGPoint currentDest;
    bool showingPotential;
}
-(SpriteShip*) initSpriteWithShip:(Ship*)target;
-(int) getFrameForValue:(int)face;
-(void) dieRolled:(NSNotification *) notification;
-(void) dieSelected:(NSNotification *) notification;
-(void) dieDocked:(NSNotification *) notification;
-(void) refreshState:(NSNotification *) notification;
-(void) glideToTargetPosition;
-(void) snapToTargetPosition;
-(void) updateFrame;
-(bool) isArtifactShip;

@property(weak, readonly)Ship* ship;
@property(readonly)CGPoint targetLocation;

@property(readonly)CGRect hitRect;
@end
