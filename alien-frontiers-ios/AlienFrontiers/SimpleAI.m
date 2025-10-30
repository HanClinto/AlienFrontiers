//
//  SimpleAI.m
//  AlienFrontiers
//
//  Created by Clint Herron on 9/10/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SimpleAI.h"

#import "GameState.h"
#import "Player.h"
#import "ColonistHub.h"
#import "ColonyConstructor.h"
#import "TerraformingStation.h"
#import "Shipyard.h"
#import "LunarMine.h"
#import "SolarConverter.h"
#import "MaintenanceBay.h"

#import "GameTouchManager.h"
#import "Region.h"

#import "AsimovCrater.h"
#import "BradburyPlateau.h"
#import "BurroughsDesert.h"
#import "HeinleinPlains.h"
#import "HerbertValley.h"
#import "LemBadlands.h"
#import "PohlFoothills.h"
#import "VanVogtMountains.h"


@implementation SimpleAI

static SimpleAI* sharedSimpleAI = nil;

+ (void)initialize
{
    static BOOL initialized = NO;
    
    if(!initialized)
    {
        initialized = YES;
        sharedSimpleAI = [[SimpleAI alloc] init];
    }
}

+(AIPlayer*) shared
{
    return sharedSimpleAI;
}

-(GameState*) getNextGameState:(Player*)player
{
    GameState* child = [[player state] clone];
    
    [self doNextAction:[child playerByID:[player playerIndex]]];
    
    return child;
}

-(bool) isTurnDone:(Player*)player
{
    // Make sure we haven't yet rolled
    if (![player initialRollDone])
        return false;
    
    // Make sure we can't launch from the Hub
    if ([[[player state] colonistHub] ableToLaunch])
        return false;
    
    // If we got this far, then we're done.
    // TODO: We should check for usable tech cards
    if ([[player undockedShips] count] == 0)
        return true;
    
    return false;
}

-(void) doNextAction:(Player*)player
{
    GameState* state = [player state];
    ShipGroup* usableShips;
    
    if (![player initialRollDone])
    {
        [player rollShips];
        return;
    }
    
    // Colonist Hub LAUNCH
    if ([[state colonistHub] ableToLaunch])
    {
        // Pay the money
        [[state colonistHub] launchColony];
        
        // Launch the colony
        [self launchColony:player];
        
        return;
    }
    
    /*
    if ([[player undockedShips] count] == 0)
    {
        
        [[GameState sharedGameState] gotoNextPlayer];
        
        return;
    }
     */
    
    // Colony constructor
    usableShips = [[state colonyConstructor] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
    if ([usableShips count] > 0)
    {
        // Dock ships
        [[state colonyConstructor] commitShipsFromPlayer:player selectedShips:[usableShips lowestSetOf:3]];
        
        // Launch colony
        [self launchColony:player];
        
        return;
    }
    
    // Terraforming Station?
    usableShips = [[state terraformingStation] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
    if ([usableShips count] > 0)
    {
        // Dock ships
        // TODO: Give preference to the artifact ship?
        [[state terraformingStation] commitShipsFromPlayer:player selectedShips:[usableShips quant:1]];
        
        // Launch colony
        [self launchColony:player];
        
        return;
    }
    
    // Shipyard
    usableShips = [[state shipyard] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
    if ([usableShips count] > 0)
    {
        // Dock ships
        [[state shipyard] commitShipsFromPlayer:player selectedShips:[usableShips lowestSetOf:2]];
        
        return;
    }
    
    // Raiders Outpost
    
    // TODO
    
    // Lunar Mine (if less than 3)
    usableShips = [[state lunarMine] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
    if (([player ore] < 3) && ([player ore] <= [player fuel]))
    {
        if ([usableShips count] > 0)
        {
            // Dock ships
            // TODO: Perhaps dock the highest ship instead?
            [[state lunarMine] commitShipsFromPlayer:player selectedShips:[usableShips lowestSetOf:1]];

            return;
        }
    }
    
    
    // Solar Converter (if less than 3)
    usableShips = [[state solarConverter] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
    if ([player fuel] < 3)
    {
        if ([usableShips count] > 0)
        {
            // Dock ships
            [[state solarConverter] commitShipsFromPlayer:player selectedShips:[usableShips highestSetOf:1]];
            return;
        }
    }
    
    // Colonist Hub
    usableShips = [[state colonistHub] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
    if ([[state colonistHub] colonyPosition:[player playerIndex]] < MAX_COLONY_POSITION)
    {
        if ([usableShips count] > 0)
        {
            int shipCount = [usableShips count];
            
            if (shipCount > 3)
                shipCount = 3;
            
            // Dock ships
            [[state colonistHub] commitShipsFromPlayer:player selectedShips:[usableShips quant:shipCount]];
            
            return;
        }
    }
    
    /*
    // Lunar Mine (anything we can)
    usableShips = [[state lunarMine] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
    if ([usableShips count] > 0)
    {
        // Dock ships
        // TODO: Perhaps dock the highest ship instead?
        [[state lunarMine] commitShipsFromPlayer:player selectedShips:[usableShips lowestSetOf:1]];

        return;
    }
    
    
    // Solar Converter (anything we can)
    usableShips = [[state solarConverter] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
    if ([usableShips count] > 0)
    {
        // Dock ships
        [[state lunarMine] commitShipsFromPlayer:player selectedShips:[usableShips highestSetOf:1]];

        return;
    }
     */
    
    
    // Maint bay
    [[state maintenanceBay] commitShipsFromPlayer:player selectedShips:[player undockedShips]];
}


-(Region*) regionByIndex:(int)index forPlayer:(Player*)player
{
    switch (index) {
        case 0:
            return [[player state] asimovCrater];
            break;
        case 1:
            return [[player state] vanVogtMountains];
            break;
        case 2:
            return [[player state] lemBadlands];
            break;
        case 3:
            return [[player state] bradburyPlateau];
            break;
        case 4:
            return [[player state] herbertValley];
            break;
        case 5:
            return [[player state] pohlFoothills];
            break;
        case 6:
            return [[player state] burroughsDesert];
            break;
        default:
        case 7:
            return [[player state] heinleinPlains];
            break;
    }
}


-(void) launchColony:(Player*)player
{
    int numColoniesNeeded[8] = {0,0,0,0,0,0,0,0};
    
    Region* region;
    int cnt;
    
    
    // Populate our array of the number of colonies needed, and check for easy majorities.
    for (cnt = 0; cnt < 8; cnt++)
    {
        region = [self regionByIndex:cnt forPlayer:player];
        
        numColoniesNeeded[cnt] = [region numColoniesForMajorityBy:player];

        if (numColoniesNeeded[cnt] == 1)
        {
            [region launchColony:[player playerIndex]];
            return;
        }
    }
    
    // After looking for easy majorities, then look for regions to disrupt.
    for (cnt = 0; cnt < 8; cnt++)
    {
        if (numColoniesNeeded[cnt] == 2)
        {
            region = [self regionByIndex:cnt forPlayer:player];
            
            [region launchColony:[player playerIndex]];
            return;
        }
    }
    
    // Then just solidify our leads.
    for (cnt = 0; cnt < 8; cnt++)
    {
        if (numColoniesNeeded[cnt] == 0)
        {
            region = [self regionByIndex:cnt forPlayer:player];
            
            [region launchColony:[player playerIndex]];
            return;
        }
    }
    
    // Otherwise, start looping through until we find a threshold we can beat.
    for (int thresh = 3; thresh < 10; thresh++)
    {
        for (cnt = 0; cnt < 8; cnt++)
        {
            if (numColoniesNeeded[cnt] <= thresh)
            {
                region = [self regionByIndex:cnt forPlayer:player];
                
                [region launchColony:[player playerIndex]];
                return;
            }
        }        
    }
}




+(bool) doneThinking
{
	return true;
}

+(bool) finishTurn
{
	if ([self doneThinking])
	{
		
		return true;
	}
	
	return false;
}

@end
