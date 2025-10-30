//
//  ColonistHub.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Orbital.h"
#import "GameState.h"

#define MAX_COLONY_POSITION 7 // when a colony has progressed this far, we are able to launch it.

@interface ColonistHub : Orbital {
	int colonyPosition0;
	int colonyPosition1;
	int colonyPosition2;
	int colonyPosition3;
    
    int advancementThisTurn;
}

-(int) colonyPosition:(int)playerIndex;
-(void) setColonyPosition:(int)playerIndex value:(int)val;
-(bool) ableToLaunch;
-(bool) ableToLaunch:(int)playerIndex;
-(void) launchColony;
-(void) launchColony:(int)playerIndex;

@property (assign) int advancementThisTurn;

@end
