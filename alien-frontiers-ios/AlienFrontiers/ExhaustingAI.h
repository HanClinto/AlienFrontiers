//
//  ExhaustiveAI.h
//  AlienFrontiers
//
//  Created by Clint Herron on 9/10/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "AIPlayer.h"

#define AI_VALUE_SHIP 8  // 2 dice + 3 ore + 3 fuel = 7.5
#define AI_VALUE_FUEL 0.5
#define AI_VALUE_ORE 1
#define AI_VALUE_COLONY 10
#define AI_VALUE_TECH 2 // The value of each tech card
#define AI_VALUE_VP 2
#define AI_VALUE_COLONIST_HUB_NOTCH 1

#define AI_VALUE_WIN 1000 // Winning is worth everything

#define AI_VALUE_UNUSED_PIP 0.1 // The value of each pip on an unused die

#define AI_VALUE_PLAYER_VALUE 0.9 // Negative points for other players is not quite the same as positive points for you.  Even so, this gives some added impetus to raid and hurt others.

@interface ExhaustiveAI : AIPlayer
{
    NSThread* thinkingThread;
}

-(float) baseValueForPlayer:(Player*)player;
-(float) totalValueForPlayer:(Player*)player;

-(void) fillChildGameStates:(Player*)player toDepth:(int)targetDepth;
-(void) fillChildGameStates:(Player*)player;

-(GameState*) getHighestChild:(Player*)player;

@end
