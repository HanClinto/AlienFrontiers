//
//  ExhaustiveAI.m
//  AlienFrontiers
//
//  Created by Clint Herron on 9/10/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "ExhaustiveAI.h"

#import "GameState.h"
#import "Player.h"
#import "ColonistHub.h"

#import "TechCard.h"
#import "TechCardGroup.h"
#import "PlayerTechCardGroup.h"
#import "AlienCity.h"
#import "AlienMonument.h"
#import "BoosterPod.h"
#import "DataCrystal.h"
#import "PlasmaCannon.h"
#import "ResourceCache.h"
#import "StasisBeam.h"
#import "GravityManipulator.h"
#import "TemporalWarper.h"
#import "PolarityDevice.h"
#import "OrbitalTeleporter.h"
#import "HolographicDecoy.h"


@implementation ExhaustiveAI


static ExhaustiveAI* sharedExhaustiveAI = nil;

+ (void)initialize
{
    static BOOL initialized = NO;
    
    if(!initialized)
    {
        initialized = YES;
        sharedExhaustiveAI = [[ExhaustiveAI alloc] init];
    }
}

+(AIPlayer*) shared
{
    return sharedExhaustiveAI;
}


-(void) step:(Player*)player
{
    if (![player initialRollDone])
    {
        [player rollShips];
    }
    
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
    
    GameState* next = [self getNextGameState:player];
    
	NSAssert(next != nil, @"Cannot activate a nil state!");

    if (next == [player state])
    {
        [AIPlayer gotoNextPlayer:player];
        return;
    }
    
    [GameState setActiveState:next];
}

-(GameState*) getNextGameState:(Player*)player
{
    GameState* child = [self getHighestChild:player];
    
    return child;
}

-(void) think:(Player*)player
{
    isThinkingDone = false;
    isThinkingStarted = true;
    
    thinkingThread = [[NSThread alloc] initWithTarget:self selector:@selector(doThinking:) object:player];
    
    [thinkingThread start];
    
    // Do thinking stuff here in sub-classes that need it
    
//    isThinkingDone = true;
}

-(void) doThinking:(Player*)player
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    
    // Fill the child states
    [self fillChildGameStates:player toDepth:-1]; // 10];
    
    isThinkingDone = true;    
    
    [pool drain];
}

-(float) getMaxChildValueForPlayer:(Player*)player
{
    GameState* state = [player state];
    int cnt = 0;
    float childValue = 0, maxValue = 0;
    
    if ([[state childStates] count] > 0)
    {
        for (GameState* child in [state childStates]) {
            childValue = [self totalValueForPlayer:[child playerByID:[player playerIndex]]];
            
            if ((cnt++ == 0) || (childValue > maxValue))
            {
                maxValue = childValue;
            }
        }
    }
    else
    {
        maxValue = [self totalValueForPlayer:player];
    }
    
    return maxValue;
}

// Evaluate a target game state to see how much this AI values that setup.  This number is relative in scale, and only useful for comparing this game against other game states according to this AI's value system, and it does not correspond to the evaluation given by any other AI.  Higher is generally better.  
-(float) totalValueForPlayer:(Player*)player
{
    GameState* state = [player state];
	float playerValue = 0;
    float value = 0;
    float maxOpponentValue = 0;
    int cnt = 0;
    
    for (Player* p in [state players])
    {
        value = [self baseValueForPlayer:p];
        
        if (p == player)
        {
            playerValue = value;
        }
        else
        {
            if ((cnt++ == 0) || (value > maxOpponentValue))
            {
                maxOpponentValue = value;
            }
        }
    }
    
    return (playerValue - maxOpponentValue * AI_VALUE_PLAYER_VALUE);
}

-(float) baseValueForPlayer:(Player*)player
{
	float value = 0;
    //    Player* player = [self playerByID:playerIndex];
    
    if ([[player state] gameIsOver])
    {
        // If the player won
        if ([[player state] winningPlayer] == player)
            value = AI_VALUE_WIN;
        else
            value = -AI_VALUE_WIN;
    }
    else
    {
        int startingColonies = 10 - [[player state] numPlayers];
        
        value += (AI_VALUE_FUEL * [player fuel]) * ((14 - [player fuel]) * 0.1); // At 4 fuel, fuel is at full worth.  As you get more than that, fuel goes down in value.
        value += (AI_VALUE_ORE  * [player ore])  * ((14 - [player ore])  * 0.1); // At 4 ore, ore is at full worth.  As you get more than that, increases in ore go down in relative value.
        
        // The more ships, the better.
        value += (AI_VALUE_SHIP   * [[player activeShips] count]);				// More ships have a constant relative value
        
        // The more tech cards, the better.
        value += (AI_VALUE_TECH   * [[player cards] count]);						// More cards have a constant relative value
        
        // The more colonies, the better.
        value += (AI_VALUE_COLONY * (startingColonies - [player coloniesLeft]));	// More colonies have a constant relative value
        
        // The more VPs, the better.
        value += (AI_VALUE_VP * [player vps]);
        
        // The further along the colonist hub is, the better.
        value += AI_VALUE_COLONIST_HUB_NOTCH * [[[player state] colonistHub] colonyPosition:[player playerIndex]];
    }
    
	
	return value;
}


-(GameState*) getHighestChild:(Player*)player
{
    GameState* state = [player state];
    float childValue = 0;
    float highestValue = 0;
    GameState* highestChild = state; // TODO: Should be nil?
    
    if ([[state childStates] count] > 0)
    {
        for (GameState* child in [state childStates])
        {
            childValue = [self getMaxChildValueForPlayer:[child playerByID:[player playerIndex]]];
//            childValue = [self totalValueForPlayer:[child playerByID:[player playerIndex]]];
            CCLOG(@"AI child %@ has value %f", child, childValue);
            if (childValue > highestValue)
            {
                CCLOG(@" That's the highest so far!");
                highestValue = childValue;
                highestChild = child;
            }
        }
    }
    else
    {
        // What to do here?
    }
    
    return highestChild;
}
     

-(void) fillChildGameStates:(Player*)player toDepth:(int)targetDepth
{
    GameState* state = [player state];
    
    if ((targetDepth >= 1) || (targetDepth < 0))
    {
        [self fillChildGameStates:player];
    }
     
    CCLOG(@"Filling child game states to %d", targetDepth);
    
    if ((targetDepth > 1) || (targetDepth < 0))
    {
        for (GameState* child in [state childStates])
        {
            [self fillChildGameStates:[child playerByID:[player playerIndex]] toDepth:targetDepth-1];
        }
    }
}

-(void) fillChildGameStates:(Player*)player
{
    GameState* state = [player state];
    
    [state setChildStates:[[NSMutableArray alloc] init]];
    
//    Player* player = [self currentPlayer];
    
    [state setChildrenFilling:true];
    
    // Go through each orbital
    
    // Singles
    
    { // Alien Artifact
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state alienArtifact] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        // And attempt to dock them 1 by 1.
        for (Ship* ship in [usableShips array])
        {
            GameState* child = [state clone];
            ShipGroup* childShips = [[ShipGroup alloc] init];
            
            Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[ship shipID]];
            [childShips push:childShip];
            
            [[child alienArtifact] commitShipsFromPlayer:[child playerByID:[player playerIndex]] selectedShips:childShips];
            
            [[state childStates] addObject:child];
            
            [childShips dealloc];
        }    
    }
    
    { // Colonist Hub
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state colonistHub] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        // And attempt to dock them 1 by 1.
        for (Ship* ship in [usableShips array])
        {
            GameState* child = [state clone];
            ShipGroup* childShips = [[ShipGroup alloc] init];
            
            Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[ship shipID]];
            [childShips push:childShip];
            
            [[child colonistHub] commitShipsFromPlayer:[child playerByID:[player playerIndex]] selectedShips:childShips];
            
            [[state childStates] addObject:child];
            
            [childShips dealloc];
        }    
        
    }
    
    { // Lunar Mine
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state lunarMine] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        // And attempt to dock them 1 by 1.
        for (Ship* ship in [usableShips array])
        {
            GameState* child = [state clone];
            ShipGroup* childShips = [[ShipGroup alloc] init];
            
            Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[ship shipID]];
            [childShips push:childShip];
            
            [[child lunarMine] commitShipsFromPlayer:[child playerByID:[player playerIndex]] selectedShips:childShips];
            
            [[state childStates] addObject:child];
            
            [childShips dealloc];
        }    
        
    }
    
    { // Terraforming Station
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state terraformingStation] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        // And attempt to dock them 1 by 1.
        for (Ship* ship in [usableShips array])
        {
            GameState* child = [state clone];
            ShipGroup* childShips = [[ShipGroup alloc] init];
            
            Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[ship shipID]];
            [childShips push:childShip];
            
            [[child terraformingStation] commitShipsFromPlayer:[child playerByID:[player playerIndex]] selectedShips:childShips];
            
            [[state childStates] addObject:child];
            
            [childShips dealloc];
        }    
    }
    
    
    { // Solar Converter
        
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state solarConverter] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        // And attempt to dock them 1 by 1.
        for (Ship* ship in [usableShips array])
        {
            GameState* child = [state clone];
            ShipGroup* childShips = [[ShipGroup alloc] init];
            
            Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[ship shipID]];
            [childShips push:childShip];
            
            [[child solarConverter] commitShipsFromPlayer:[child playerByID:[player playerIndex]] selectedShips:childShips];
            
            [[state childStates] addObject:child];
            
            [childShips dealloc];
        }
    }    
    
    
    // Pairs
    
    { // Shipyard
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state shipyard] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        if ([usableShips count] > 0)
        {
            // And attempt to dock them pair by pair
            NSArray* shipPairs = [usableShips allPairs];
            
            for (ShipGroup* shipPair in shipPairs)
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                
                for (Ship* ship in [shipPair array])
                {
                    Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[ship shipID]];
                    [childShips push:childShip];
                }
                
                [[child shipyard] commitShipsFromPlayer:[child playerByID:[player playerIndex]] selectedShips:childShips];
                
                [[state childStates] addObject:child];
                
                [childShips dealloc];
            }
        }
    }
    
    { // Orbital Market
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state orbitalMarket] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        // And attempt to dock them pair by pair
        
        if ([usableShips count] > 0)
        {
            NSArray* shipPairs = [usableShips allPairs];
            
            for (ShipGroup* shipPair in shipPairs)
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                
                for (Ship* ship in [shipPair array])
                {
                    Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[ship shipID]];
                    [childShips push:childShip];
                }
                
                [[child orbitalMarket] commitShipsFromPlayer:[child playerByID:[player playerIndex]] selectedShips:childShips];
                
                [[state childStates] addObject:child];
                
                [childShips dealloc];
            }
        }
    }
    
    
    { // Maintenance Bay
        
    }
    
    { // Raiders Outpost
        
    }
    
    { // Colony Constructor
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state colonyConstructor] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        if ([usableShips count] > 0)
        {
            // And attempt to dock them pair by triplet
            NSArray* shipPairs = [usableShips allTriplets];
            
            for (ShipGroup* shipPair in shipPairs)
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                
                for (Ship* ship in [shipPair array])
                {
                    Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[ship shipID]];
                    [childShips push:childShip];
                }
                
                [[child colonyConstructor] commitShipsFromPlayer:[child playerByID:[player playerIndex]] selectedShips:childShips];
                
                [[state childStates] addObject:child];
                
                [childShips dealloc];
            }        
        }
    }
    
    
    // Check abilities (take card / trade at market / pay for launching at colonist hub)
    
    { // Acquire tech cards
        if ([[state currentPlayer] artifactCreditAvailable] >= 8)
        {
            for (int cnt = 0; cnt < [[state techDisplayDeck] count]; cnt++)
            {
                TechCard* card = [[[state techDisplayDeck] array] objectAtIndex:cnt];
                
                if ([[state currentPlayer] canPurchaseCard:card])
                {
                    GameState* child = [state clone];
                    
                    TechCard* childCard = [[[child techDisplayDeck] array] objectAtIndex:cnt];
                    
                    [[child currentPlayer] purchaseCard:childCard];
                    
                    [[state childStates] addObject:child];
                }
            }
        }
        
    }
    
    { // Trade at market
        if ([[state currentPlayer] ableToMarketTrade])
        {
            GameState* child = [state clone];
            
            [[child currentPlayer] doMarketTrade];
            
            [[state childStates] addObject:child];
        }
    }
    
    { // Pay for Colonist Hub
        if ([[state colonistHub] ableToLaunch])
        {
            GameState* child = [state clone];
            
            [[child colonistHub] launchColony];
            
            [[state childStates] addObject:child];
        }
    }
    
    // Attempt to use tech cards
    {
        TechCard* card = nil;
        int usedValues[6] = {0,0,0,0,0,0};
        
        for (int cnt = 0; cnt < [[[state currentPlayer] cards] count]; cnt++)
        {
            card = [[[state currentPlayer] cards] atIndex:cnt];
            
            if ([card canUsePower])
            {
                // Then use each fuel power accordingly
                
                // Dice manipulation cards
                if ([card class] == [BoosterPod class])
                {
                    // Reset the used values counter
                    for (int cnt = 0; cnt < 6; usedValues[cnt++] = 0);
                    
                    BoosterPod* boosterCard = (BoosterPod*) card;
                    
                    for (Ship* ship in [[player undockedShips] array]) {
                        if (usedValues[ship.value] == 0)
                        {
                            usedValues[ship.value] = 1;
                            if ([boosterCard canUsePower:ship])
                            {
                                GameState* child = [state clone];
                                Player* childPlayer = [child playerByID:[player playerIndex]];
                                Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[ship shipID]];
                                
                                BoosterPod* childCard = (BoosterPod*) [[childPlayer cards] atIndex:cnt];
                                
                                [childCard usePower:childShip];
                                
                                [[state childStates] addObject:child];
                            }
                        }
                    }
                } else if ([card class] == [PolarityDevice class])
                {
                    // Reset the used values counter
                    for (int cnt = 0; cnt < 6; usedValues[cnt++] = 0);

                    PolarityDevice* polarityCard = (PolarityDevice*) card;
                    
                    for (Ship* ship in [[player undockedShips] array]) {
                        if (usedValues[ship.value] == 0)
                        {
                            usedValues[ship.value] = 1;
                            if ([polarityCard canUsePower:ship])
                            {
                                GameState* child = [state clone];
                                Player* childPlayer = [child playerByID:[player playerIndex]];
                                Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[ship shipID]];
                                
                                PolarityDevice* childCard = (PolarityDevice*) [[childPlayer cards] atIndex:cnt];
                                
                                [childCard usePower:childShip];
                                
                                [[state childStates] addObject:child];
                            }
                        }
                    }                       
                } else if ([card class] == [StasisBeam class]) 
                {
                    // Reset the used values counter
                    for (int cnt = 0; cnt < 6; usedValues[cnt++] = 0);

                    StasisBeam* stasisCard = (StasisBeam*) card;
                    
                    for (Ship* ship in [[player undockedShips] array]) {
                        if (usedValues[ship.value] == 0)
                        {
                            usedValues[ship.value] = 1;
                            if ([stasisCard canUsePower:ship])
                            {
                                GameState* child = [state clone];
                                Player* childPlayer = [child playerByID:[player playerIndex]];
                                Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[ship shipID]];
                                
                                StasisBeam* childCard = (StasisBeam*) [[childPlayer cards] atIndex:cnt];
                                
                                [childCard usePower:childShip];
                                
                                [[state childStates] addObject:child];
                            }
                        }
                    }                    
                } else if ([card class] == [GravityManipulator class])
                {
                }
                // Other cards
                else if ([card class] == [DataCrystal class])
                {
                } else if ([card class] == [OrbitalTeleporter class])
                {
                } else if ([card class] == [PlasmaCannon class])
                {
                } else if ([card class] == [TemporalWarper class])
                {
                }
            }
            
            if ([card canUseDiscard])
            {
                // Then use each discard power accordingly
                
                // Dice manipulation cards
                if ([card class] == [BoosterPod class])
                {
                } else if ([card class] == [PolarityDevice class])
                {
                } else if ([card class] == [StasisBeam class])
                {
                } else if ([card class] == [GravityManipulator class])
                {
                }
                // Other cards
                else if ([card class] == [DataCrystal class])
                {
                } else if ([card class] == [OrbitalTeleporter class])
                {
                } else if ([card class] == [PlasmaCannon class])
                {
                } else if ([card class] == [TemporalWarper class])
                {
                }
            }
        }
    }
    
    // Attempt to launch colonies
    if ([player numColoniesToLaunch] > 0)
    {
        int cnt=0;
        
        // Now loop through every region where we could place that colony
        for (Region* region in [state regions])
        {
            cnt++;
            
            if ([region hasRepulsorField])
                continue;
            
            GameState* child = [state clone];
            Region* childRegion = [[child regions] objectAtIndex:cnt];
            [childRegion addColony:[player playerIndex]];
            
            [[state childStates] addObject:child];
        }
        
    }
    
    [state setChildrenFilled:true];
}

     

@end
