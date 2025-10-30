//
//  AIPlayer.h
//  AlienFrontiers
//
//  Created by Clint Herron on 6/11/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>

@class GameState;
@class Player;


@interface AIPlayer : NSObject {
//    Player* player;
//    GameState* state;
    bool isThinkingStarted;
    bool isThinkingDone;
    bool isTurnDone;
    
    int currentPersonality;
}

+(AIPlayer*)shared;
+(void) aiTick:(Player*)player;
+(void) gotoNextPlayer:(Player*)player;

//- (AIPlayer*)initWithPlayer:(Player*)player;

-(void) step:(Player*)player;

-(void) think:(Player*)player;
-(void) startTurn:(Player*)player;
-(GameState*) getNextGameState:(Player*)player;

@property (readonly) bool isThinkingStarted;
@property (readonly) bool isThinkingDone;
-(bool) isTurnDone:(Player*)player;

-(NSString*) aiStatusText;

@end
