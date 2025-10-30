//
//  LayerShips.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/12/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "GameState.h"
#import "SpriteShip.h"
#import "GameEvents.h"
#import "AFLayer.h"

@interface LayerShips : AFLayer {
	CCSprite* selectedShip;
}

-(void) createAllShips;
-(void) refreshState:(NSNotification *) notification;
-(SpriteShip*) findSpriteByShip:(Ship*)ship;

@end
