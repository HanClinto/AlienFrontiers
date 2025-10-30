//
//  PlanetRegion.m
//  AlienFrontiers
//
//  Created by Clint Herron on 3/31/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "Region.h"
#import "GameState.h"
#import "Player.h"

@implementation Region

-(Region*) initWithState:(GameState*)gameState
{
    if ((self = [super init]))
    {
		state = gameState;

		// TODO: free this memory in the destructor.
        // TODO: #def the max number of players?
		colonyCounts = malloc( sizeof(int) * 4 ); // [state numPlayers]);
		for (int cnt = 0; cnt < 4 /* [state numPlayers]*/; cnt++) {
			colonyCounts[cnt] = 0; // ((arc4random()%4) % 3); // 1 + cnt;
            
//            if (cnt == 0)
//                colonyCounts[cnt] = 1;
		}
		
		hasPositronField = false;
		hasIsolationField = false;
		hasRepulsorField = false;
	}
	return self;
}

-(NSString*) title
{
    return NSStringFromClass([self class]);
}

-(void) dealloc
{
	free(colonyCounts);
	
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
	//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	[encoder encodeObject:state forKey:@"state"];
	
    /*
    int32_t encodedColonyCounts = 0;
	
	for (int cnt = 0; cnt < [state numPlayers]; cnt++)
	{
		encodedColonyCounts += (colonyCounts[cnt] & 0xF) << (cnt * 8);
	}
	
	[encoder encodeInt:encodedColonyCounts forKey:@"encodedColonyCounts"];
*/
    
	[encoder encodeInt:colonyCounts[0] forKey:@"colonyCounts0"];
	[encoder encodeInt:colonyCounts[1] forKey:@"colonyCounts1"];
    [encoder encodeInt:colonyCounts[2] forKey:@"colonyCounts2"];
    [encoder encodeInt:colonyCounts[3] forKey:@"colonyCounts3"];
	
	[encoder encodeBool:hasPositronField forKey:@"hasPositronField"];
	[encoder encodeBool:hasRepulsorField forKey:@"hasRepulsorField"];
	[encoder encodeBool:hasIsolationField forKey:@"hasIsolationField"];
	
//	[encoder encodeArrayOfObjCType:@encode(int) count:[state numPlayers] at:colonyCounts];
}

-(id)initWithCoder:(NSCoder *)decoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
    {
		state = [decoder decodeObjectForKey:@"state"];
		
		colonyCounts = malloc( sizeof(int) * 4); // [state numPlayers]);
/*
		uint32_t encodedColonyCounts = [decoder decodeIntForKey:@"encodedColonyCounts"];
		
		for (int cnt = 0; cnt < [state numPlayers]; cnt++)
		{
			colonyCounts[cnt] = (encodedColonyCounts >> (cnt * 8)) & 0xF;
		}
		*/
        
        colonyCounts[0] = [decoder decodeIntForKey:@"colonyCounts0"];
        colonyCounts[1] = [decoder decodeIntForKey:@"colonyCounts1"];
        colonyCounts[2] = [decoder decodeIntForKey:@"colonyCounts2"];
        colonyCounts[3] = [decoder decodeIntForKey:@"colonyCounts3"];
        
		hasPositronField = [decoder decodeBoolForKey:@"hasPositronField"];
		hasRepulsorField = [decoder decodeBoolForKey:@"hasRepulsorField"];
		hasIsolationField = [decoder decodeBoolForKey:@"hasIsolationField"];
		
//		colonyCounts = [[decoder decodeObjectForKey:@"colonyCounts"] retain];
	}
	
	return self;
}

-(void) swapColonyFrom:(int)fromPlayerIndex to:(int)toPlayerIndex
{
    if (colonyCounts[fromPlayerIndex] > 0)
    {
        colonyCounts[fromPlayerIndex]--;
        colonyCounts[toPlayerIndex]++;
    }
    
	[state postEvent:EVENT_COLONIES_CHANGED object:self];
}

-(void) addColony:(int)playerIndex
{
    colonyCounts[playerIndex]++;
    [state postEvent:EVENT_COLONIES_CHANGED object:self];
}

-(void) launchColony:(int)playerIndex
{
	Player* player = [state playerByID:playerIndex];
    
	if (player.numColoniesToLaunch > 0)
	{
        [state createUndoPoint];

        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Landed colony at %@", @"Normal colony landing message"), 
                        [[state currentPlayer] playerName],
                        [self title]
                        ]];
        
        [self addColony:playerIndex];
        
		player.numColoniesToLaunch = player.numColoniesToLaunch - 1;
		[player decrementColoniesLeft];

        //      [state postEvent:EVENT_COLONIES_CHANGED object:self];
        [state checkGameOver];
	}
    else
    {
        CCLOG(@"ERROR: Tried to launch colony and player had none to launch!");
    }
}

-(void) removeColony:(int)playerIndex
{
    if (colonyCounts[playerIndex] > 0)
    {
        colonyCounts[playerIndex]--;
              
    }

	[state postEvent:EVENT_COLONIES_CHANGED object:self];
}

-(int) coloniesForPlayer:(int)playerIndex
{
	return colonyCounts[playerIndex];
}

-(int) numPlayersWithColonies
{
	int retVal = 0;
	
	for (int cnt = 0; cnt < [state numPlayers]; cnt++)
	{
		if (colonyCounts[cnt] > 0)
		{
			retVal++;
		}
	}
	
	return retVal;
}

-(int) numColonies
{
	int retVal = 0;
	
	for (int cnt = 0; cnt < [state numPlayers]; cnt++)
	{
		retVal += colonyCounts[cnt];
	}
	
	return retVal;	
}

-(int) playerWithMajority
{
	int max = 0;
	int numAtMax = 0;
	int playerWithMax = -1;
	
	for (int cnt = 0; cnt < [state numPlayers]; cnt++)
	{
		if (colonyCounts[cnt] == max)
		{
			numAtMax++;
		}
		else if (colonyCounts[cnt] > max)
		{
			max = colonyCounts[cnt];
			numAtMax = 1;
			playerWithMax = cnt;
		}
	}
	
	if (numAtMax > 1) { // If there's a tie, then nobody has it.
		return -1;
	} else {
		return playerWithMax;
	}
}

-(int) numMaxColonies
{
    return colonyCounts[[self playerWithMajority]];
}

-(int) numColoniesForMajorityBy:(Player*)player
{
    int majorityPlayer = [self playerWithMajority];
    
    if (majorityPlayer == [player playerIndex])
        return 0; // TODO: Have this return the number of colonies between the leader and the 2nd place
    
    if (majorityPlayer == -1)
        return 1 + [self numMaxColonies];
    
    // At this point, the majority player is NOT us.
    return (1 + colonyCounts[majorityPlayer] - colonyCounts[[player playerIndex]]);
}

-(bool) playerHasBonus:(Player*)player
{
	// First things first, if the Isolation Field is in play, then NOBODY may use this bonus.
	if ([self hasIsolationField])
		return false;
	
	// Secondarily, check for DataCrystal power borrowing ability
	
	// The Data Crystal can only work if _someone_ is on the region
	if ([self numColonies] >= 0) {
		// Then check to see if it's being borrowed
		if ([player borrowingRegion] == self) {
			return true;
		}
	}
	
	// If it's not being borrowed and not blocked, then the only way left to get this power is through the normal simple majority.
	int majority = [self playerWithMajority];

	return (majority == [player playerIndex]);
}

-(bool) hasPositronField
{
	return hasPositronField;
}

-(bool) hasRepulsorField
{
	return hasRepulsorField;
}

-(bool) hasIsolationField
{
	return hasIsolationField;
}

-(void) setHasPositronField:(bool)val
{
	hasPositronField = val;
	[state postEvent:EVENT_FIELD_CHANGED object:self];
}

-(void) setHasRepulsorField:(bool)val
{
	hasRepulsorField = val;
	[state postEvent:EVENT_FIELD_CHANGED object:self];
}

-(void) setHasIsolationField:(bool)val
{
	hasIsolationField = val;
	[state postEvent:EVENT_FIELD_CHANGED object:self];
}

-(bool) isSelected
{
	return isSelected;
}

-(void) setIsSelected:(bool)val
{
	isSelected = val;
	[state postEvent:EVENT_REGION_SELECTED object:self];
}


-(bool) hasPotential
{
	return hasPotential;
}

-(void) setHasPotential:(bool)val
{
	// Detect if the value changes.
	bool fire = (hasPotential != val);
	
	hasPotential = val;
	
	// Only fire if we need to.
	if (fire)
		[state postEvent:EVENT_REGION_POTENTIAL object:self];
}

-(id) cloneWithState:(GameState*)newState
{
	Region *copy = [[[self class] alloc] init];
	size_t size = sizeof(int) * 4;
	copy->colonyCounts = malloc(size);
	memcpy(copy->colonyCounts, colonyCounts, size);

	copy->hasPositronField = hasPositronField;
	copy->hasRepulsorField = hasRepulsorField;
	copy->hasIsolationField = hasIsolationField;

	// TODO: are these necessary to clone?
//	copy->isSelected = isSelected;
//	copy->hasPotential = hasPotential;
    
    copy->state = newState;

	return copy;
}


@end
