//
//  AIPlayer.m
//  AlienFrontiers
//
//  Created by Clint Herron on 6/11/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "AIPlayer.h"

#import "GameState.h"
#import "Player.h"
#import "ColonistHub.h"

#import "SimpleAI.h"
#import "ExhaustiveAI.h"

@implementation AIPlayer
@synthesize isThinkingDone;
@synthesize isThinkingStarted;

//static AIPlayer *sharedSingleton;

-(id) init
{
    if (self = [super init])
    {
        currentPersonality = -1;
    }
    
    return self;
}

+(void) aiTick:(Player*)player
{
    // Check for start of turn
    static int lastPlayerIndex = -1;
    int currentPlayerIndex = [player playerIndex];
    
    if (![player isAI])
        return;
    
    if ([[player state] gameIsOver])
        return;
    
    if (currentPlayerIndex != lastPlayerIndex)
    {
        switch ([player aiType]) {
            case AI_TYPE_HUMAN:
                // do nothing
                break;
/*            case AI_TYPE_SIMPLE:
                [[SimpleAI shared] startTurn:player];
                break;
 */
            case AI_TYPE_EASY:
            case AI_TYPE_MEDIUM:
            case AI_TYPE_HARD:
            case AI_TYPE_PIRATE:
                [[ExhaustiveAI shared] startTurn:player];
                break;
            default:
                break;
        }
    }
    
    lastPlayerIndex = currentPlayerIndex;
    
    
    if ([player aiType] != AI_TYPE_HUMAN)
    {
        switch ([player aiType]) {
            case AI_TYPE_HUMAN:
                // do nothing
                break;
/*            case AI_TYPE_SIMPLE:
                [[SimpleAI shared] step:player];
                break;*/
            case AI_TYPE_EASY:
            case AI_TYPE_MEDIUM:
            case AI_TYPE_HARD:
            case AI_TYPE_PIRATE:
                [[ExhaustiveAI shared] step:player];
                break;
            default:
                break;
        }
    }
    
//    [[player state] checkGameOver];
}

+(void) gotoNextPlayer:(Player*)player
{
    GameState* state = [player state];
    
    [state gotoNextPlayer];
}

-(void) startTurn:(Player*)player
{
    isThinkingDone = false;
    isThinkingStarted = false;
    isTurnDone = false;
//    [self think:player];
}

-(void) setPersonality:() personality
{
    // Intended to be overridden in child classes
    
}

-(void) step:(Player*)player
{
    // Or haven't even started thinking...
    if (![self isThinkingStarted])
    {
        [self think:player];
        
        return;
    }

    // If we're not yet done thinking
    if (![self isThinkingDone])
    {
        // Then wait a bit more...
        usleep(1);
        return;
    }
    
    if ([self isTurnDone:player])
    {
        [AIPlayer gotoNextPlayer:player];
        return;
    }
    
    GameState* next = [self getNextGameState:player];
    
	NSAssert(next != nil, @"Cannot activate a nil state!");
    
    [GameState setActiveState:next];
    
    [next checkGameOver];
}

-(void) think:(Player*)player
{
    isThinkingDone = false;
    isThinkingStarted = true;
    
//    [[NSThread alloc] initWithTarget:self selector:@selector(doThinking:) object:player];
    
    // Do thinking stuff here in sub-classes that need it
    
    isThinkingDone = true;
}

-(GameState*) getNextGameState:(Player*)player
{
    GameState* child = [[player state] clone];
    
    return child;
}

-(bool) isTurnDone:(Player*)player
{
    return isTurnDone;
}

+(AIPlayer*)shared
{
    return nil;
}

@end
