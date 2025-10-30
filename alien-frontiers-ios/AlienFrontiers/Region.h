//
//  PlanetRegion.h
//  AlienFrontiers
//
//  Created by Clint Herron on 3/31/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"

@class GameState;
@class Player;


#define FIELD_TYPE_POSITRON  0x01
#define FIELD_TYPE_ISOLATION 0x02
#define FIELD_TYPE_REPULSOR  0x04

@interface Region : NSObject <NSCoding> {
	__weak GameState* state;
	int* colonyCounts;
	bool hasPositronField;
	bool hasRepulsorField;
	bool hasIsolationField;
	
	bool isSelected;
	bool hasPotential;
}

-(Region*) initWithState:(GameState *)gameState;
-(void) addColony:(int)playerIndex;
-(void) removeColony:(int)playerIndex;
-(void) swapColonyFrom:(int)fromPlayerIndex to:(int)toPlayerIndex;
-(void) launchColony:(int)playerIndex;
-(int) coloniesForPlayer:(int)playerIndex;
-(int) playerWithMajority;
-(int) numColoniesForMajorityBy:(Player*)player;
@property (readonly) int numPlayersWithColonies;
@property (readonly) int numColonies;
-(bool) playerHasBonus:(Player*)player;

@property (assign) bool hasPositronField;
@property (assign) bool hasRepulsorField;
@property (assign) bool hasIsolationField;

@property (assign) bool isSelected;
@property (assign) bool hasPotential;
@property (readonly) NSString* title;

-(id) cloneWithState:(GameState*)state;

@end
