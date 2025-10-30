//
//  ColonistHub.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "ColonistHub.h"

#import "AsimovCrater.h"

@implementation ColonistHub

- (void)encodeWithCoder:(NSCoder *)encoder
{
	[super encodeWithCoder:encoder];
	
	[encoder encodeInt:colonyPosition0 forKey:@"colonyPosition0"];
	[encoder encodeInt:colonyPosition1 forKey:@"colonyPosition1"];
	[encoder encodeInt:colonyPosition2 forKey:@"colonyPosition2"];
	[encoder encodeInt:colonyPosition3 forKey:@"colonyPosition3"];
    [encoder encodeBool:advancementThisTurn forKey:@"advancementThisTurn"];
}

-(id)initWithCoder:(NSCoder *)decoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super initWithCoder:decoder]))
    {
		colonyPosition0 = [decoder decodeIntForKey:@"colonyPosition0"];
		colonyPosition1 = [decoder decodeIntForKey:@"colonyPosition1"];
		colonyPosition2 = [decoder decodeIntForKey:@"colonyPosition2"];
		colonyPosition3 = [decoder decodeIntForKey:@"colonyPosition3"];
        
        advancementThisTurn = [decoder decodeBoolForKey:@"advancementThisTurn"];
	}
	
	return self;
}

-(int) numDockGroups
{
	return [state numPlayers];
}

-(int) numDocksPerGroup
{
	return 3;
}

-(NSString*) title
{
    return NSLocalizedString(@"Colonist Hub", @"Orbital Title");
}

-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips
{
	int currentPlayerIndex = player.playerIndex;
	
	DockGroup* playerDocks = [dockGroups objectAtIndex:currentPlayerIndex];
	
	if ((playerDocks.numOpenDocks > selectedShips.count) &&
        (![selectedShips hasShipRestrictedFrom:self]))
	{
		return [shipsInHand notRestrictedByOrbital:self];
	}
	
	// If there are no open docks, then we cannot play anything.
	return [ShipGroup blank];
}

-(bool) isValidMoveFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
	int currentPlayerIndex = player.playerIndex;
	
	DockGroup* playerDocks = [dockGroups objectAtIndex:currentPlayerIndex];
	
	if ((playerDocks.numOpenDocks >= selectedShips.count) &&			// If we have enough open docks for these ships...
		(selectedShips.count > 0) &&									// And we have at least some ships selected...
		([self colonyPosition:currentPlayerIndex] < MAX_COLONY_POSITION) && 	// And we don't already have a launchable colony...
        (![selectedShips hasShipRestrictedFrom:self])) // And we don't 
	{
		// Then we can dock these ships!
		return true;
	}
	
	return false;
}

-(void) commitShipsFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);	
	
	if ([self isValidMoveFromPlayer:player selectedShips:selectedShips])
	{
		[state createUndoPoint];
		
		int colonyPosition = [self colonyPosition:player.playerIndex];
		
		int advancement = selectedShips.count;
		
		// Check for Asimov bonus
		if (((advancementThisTurn + advancement) >= 2) &&
			([[state asimovCrater] playerHasBonus:player]) &&
            (![[state asimovCrater] bonusUsedThisTurn]))
		{
			// TODO: Don't give this bonus more than once per turn.
            [[state asimovCrater] setBonusUsedThisTurn:true];
			advancement += 1;
		}
        
        advancementThisTurn += advancement;
		
		[self setColonyPosition:player.playerIndex value:(colonyPosition+advancement)];
				
		DockGroup* playerDocks = [dockGroups objectAtIndex:player.playerIndex];
		
		[playerDocks dockShips:selectedShips];

        [super commitShipsFromPlayer:player selectedShips:selectedShips];
	}
}

-(int) colonyPosition:(int)playerIndex
{
	switch (playerIndex) {
		case 0:
			return colonyPosition0;
		case 1:
			return colonyPosition1;
		case 2:
			return colonyPosition2;
		case 3:
			return colonyPosition3;
	}
	return 0;
}

-(void) setColonyPosition:(int)playerIndex value:(int)val
{
	switch (playerIndex) {
		case 0:
			colonyPosition0 = val;
			break;
		case 1:
			colonyPosition1 = val;
			break;
		case 2:
			colonyPosition2 = val;
			break;
		case 3:
			colonyPosition3 = val;
			break;
	}
	
	[state postEvent:EVENT_COLONIST_HUB_ADVANCE object:self];
}

-(bool) ableToLaunch
{
	return [self ableToLaunch:[[state currentPlayer] playerIndex]];
}

-(bool) ableToLaunch:(int)playerIndex
{
	Player* player = [state playerByID:playerIndex];
	
	if (([self colonyPosition:playerIndex] >= MAX_COLONY_POSITION) &&
		([player ore] >= 1) &&
		([player fuel] >= 1)) 
	{
		return true;
	}
								  
	return false;
}

-(void) launchColony
{
	[self launchColony:[[state currentPlayer] playerIndex]];
}


-(void) launchColony:(int)playerIndex
{
	// TODO: Assert?
	if ([self ableToLaunch:playerIndex])
	{
		Player* player = [state playerByID:playerIndex];
		
		player.ore = player.ore - 1;
		player.fuel = player.fuel - 1;
		[self setColonyPosition:playerIndex value:[self colonyPosition:playerIndex] - MAX_COLONY_POSITION];
		[player addColony];
	}
}

-(int) advancementThisTurn
{
    return advancementThisTurn;
}

-(void) setAdvancementThisTurn:(int)val
{
    advancementThisTurn = val;
}

-(id) cloneWithState:(GameState*)s
{
	ColonistHub *copy = [super cloneWithState:s];
	copy->colonyPosition0 = colonyPosition0;
	copy->colonyPosition1 = colonyPosition1;
	copy->colonyPosition2 = colonyPosition2;
	copy->colonyPosition3 = colonyPosition3;
    copy->advancementThisTurn = advancementThisTurn;
	return copy;
}

@end
