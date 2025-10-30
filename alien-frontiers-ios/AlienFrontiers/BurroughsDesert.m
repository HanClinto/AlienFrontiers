//
//  BurroughsDesert.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "BurroughsDesert.h"
#import "GameState.h"

@implementation BurroughsDesert

-(NSString*) title
{
    return NSLocalizedString(@"Burroughs Desert", @"Region Title");
}

-(bool) playerCanPurchaseShip:(Player*)player;
{
    // If we've got the bonus...
    if (![self playerHasBonus:player])
        return false;
    
    // If the artifact ship isn't already built
    if ([[state artifactShip] active])
        return false;
    
    // And if we can afford it...
    if (([player ore] < 1) || ([player fuel] < 1))
        return false;

	// Then we can purchase it.
    return true;
}

-(void) checkForLostShip
{
    // If the player owning the artifact ship no longer has the bonus after placing a colony here...
    if (![self playerHasBonus:[[state artifactShip] player]])
    {
        if ([[state artifactShip] active])
        {
            // Then destroy the artifact ship immediately.
            [[state artifactShip] destroy];
        }
    }
}

-(void) addColony:(int)playerIndex
{
    [super addColony:playerIndex];
    
    [self checkForLostShip];
}

-(void) removeColony:(int)playerIndex
{
    [super removeColony:playerIndex];
    
    [self checkForLostShip];
}

-(void) setHasIsolationField:(bool)val
{
    [super setHasIsolationField:val];
    
    [self checkForLostShip];
}

-(void) swapColonyFrom:(int)fromPlayerIndex to:(int)toPlayerIndex
{
    [super swapColonyFrom:fromPlayerIndex to:toPlayerIndex];
    
    [self checkForLostShip];
}


@end
