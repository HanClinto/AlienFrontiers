//
//  Shipyard.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/12/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "Shipyard.h"


@implementation Shipyard

-(int) numDockGroups
{
	if ([state numPlayers] <= 2)
		return 1;
	
	if ([state numPlayers] <= 3)
		return 2;
	
	return 3;
}

-(int) numDocksPerGroup
{
	return 2;
}

-(NSString*) title
{
    return NSLocalizedString(@"Shipyard", @"Orbital Title");
}

-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips
{
	// Ensure we have at least 1 open pair of docks
	if ([self numEmptyGroups] >= 1)
	{
		// Make sure we have no more than 2 ships selected
		if (([selectedShips count] < 2) && 
            (![selectedShips hasShipRestrictedFrom:self]))
		{
			// Ensure that we could pay for a ship even if we had the dice for it.
			int needed = [player resourcesNeededForNextShip];
			
			if (player.fuel >= needed && player.ore >= needed && player.numActiveNativeShips < 6)
			{
				if (selectedShips.count == 0) // No ships selected -- take all pairs. 
				{
					return [[shipsInHand notRestrictedByOrbital:self] minQuant:2];
				}
				else // Otherwise, take the ships that match the value
				{
					return [[shipsInHand notRestrictedByOrbital:self] ofValue:[selectedShips minValue]];
				}
			}
		}
		// If we have 2 dice selected, then no more dice are usable for this particular commit.
	}
	
	// If there are no open docks, then we cannot play anything.
	return [ShipGroup blank];
}

-(bool) isValidMoveFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
	// If we've got 2 dice and they match and the owning player has enough fuel and ore...
	if ([self numEmptyGroups] > 0)
	{
		if (selectedShips.count == 2 &&
			[selectedShips minValue] == [selectedShips maxValue] &&
            (![selectedShips hasShipRestrictedFrom:self]))
		{
			int needed = [player resourcesNeededForNextShip];
			
			if (player.fuel >= needed && player.ore >= needed && player.numActiveNativeShips < 6)
			{
				return true;
			}
		}
	}	
	
	return false;
}

-(void) commitShipsFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);	
	
	if ([self isValidMoveFromPlayer:player selectedShips:selectedShips])
	{
		[state createUndoPoint];

		int needed = [player resourcesNeededForNextShip];
		
		player.fuel -= needed;
		player.ore  -= needed;
		
		[player activateShip];

		[[self firstEmptyGroup] dockShips:selectedShips];
        
        [super commitShipsFromPlayer:player selectedShips:selectedShips];	
	}
}


@end
