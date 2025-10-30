//
//  ExhaustiveAIGameState.m
//  AlienFrontiers
//
//  Created by Clint Herron on 11/1/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "ExhaustiveAIGameState.h"
#import "ColonistHub.h"

@implementation ExhaustiveAIGameState

- (id)init
{
    self = [super init];
    if (self) {
        // Initialization code here.
    }
    
    return self;
}


-(float) valueForPlayer:(int)playerIndex
{
	float value = 0;
    Player* player = [self playerByID:playerIndex];
	
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
	value += [[[player state] colonistHub] colonyPosition:[player playerIndex]];
	
	return value;
}


// Evaluate a target game state to see how much this AI values that setup.  This number is relative in scale, and only useful for comparing this game against other game states according to this AI's value system, and it does not correspond to the evaluation given by any other AI.  Higher is generally better.  
-(float) evaluate:(int)playerIndex
{
	float targetValue = 0;
    
    Player* player = [self playerByID:playerIndex];
	
	float myValue = [self valueForPlayer:playerIndex];
	float playerValue = 0;
	float maxPlayerValue = 0;
	
	for (int cnt = 0; cnt < [self numPlayers]; cnt++)
	{
		// Don't evaluate again for ourselves
		if (cnt == playerIndex)
			continue;
		
		playerValue = [self valueForPlayer:cnt];
		
		if (playerValue > maxPlayerValue)
			maxPlayerValue = playerValue;
	}
	
	targetValue = myValue - maxPlayerValue * AI_VALUE_PLAYER_VALUE;
	
	return targetValue;
}


@end
