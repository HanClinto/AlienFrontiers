//
//  ExhaustiveAIGameState.h
//  AlienFrontiers
//
//  Created by Clint Herron on 11/1/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "GameState.h"

#define AI_VALUE_SHIP 7
#define AI_VALUE_FUEL 0.5
#define AI_VALUE_ORE 1
#define AI_VALUE_COLONY 10
#define AI_VALUE_TECH 3
#define AI_VALUE_VP 2

#define AI_VALUE_PLAYER_VALUE 0.9 // Negative points for other players is not quite the same as positive points for you.  Even so, this gives some added impetus to raid and hurt others.


@interface ExhaustiveAIGameState : GameState {
    //NSMutableArray * childStates;
}

@end
