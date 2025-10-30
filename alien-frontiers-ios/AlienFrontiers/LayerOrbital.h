//
//  OrbitalLayer.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/4/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "AFLayer.h"
#import "GameState.h"
#import "DockGroup.h"
#import "Orbital.h"
#import "GameEvents.h"

@interface LayerOrbital : AFLayer {
	NSMutableArray* docks;
	CGPoint* dockPositions;
}

#define ORBITAL_FONT_SIZE 12
#define ORBITAL_FONT_NAME @"DIN-Medium"
#define ORBITAL_FONT_OPACITY 0xCC

@property (readonly) bool canUseWithCurrentDice;
- (void) diceUpdated:(NSNotification *) notification;
@property (weak, readonly) Orbital* facility;
-(CGPoint) findPositionByDock:(DockingBay *)dock;

@end
