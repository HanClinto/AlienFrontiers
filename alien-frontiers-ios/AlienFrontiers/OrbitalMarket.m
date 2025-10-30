//
//  OrbitalMarket.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "OrbitalMarket.h"


@implementation OrbitalMarket


-(int) numDockGroups
{
	if ([state numPlayers] <= 3)
		return 1;
	
	return 2;
}

-(int) numDocksPerGroup
{
	return 2;
}

-(NSString*) title
{
    return NSLocalizedString(@"Orbital Market", @"Orbital Title");
}

-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips
{
	// Ensure we have at least 1 open pair of docks
	if ([self numEmptyGroups] >= 1)
	{
		// Make sure we have no more than 2 ships selected
		if ([selectedShips count] < 2)
		{
            if (![selectedShips hasShipRestrictedFrom:self])
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
	// If we've got 2 dice and they match and there is an empty space for them...
	if ([self numEmptyGroups] > 0)
	{
		if (selectedShips.count == 2 &&
			[selectedShips minValue] == [selectedShips maxValue] &&
            (![selectedShips hasShipRestrictedFrom:self]))
		{
			return true;
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
		
		int marketPrice = [selectedShips minValue];
		
		// TODO: Account for territory bonuses
		[player setMarketPrice:marketPrice];
		
		[[self firstEmptyGroup] dockShips:selectedShips];
        
        [super commitShipsFromPlayer:player selectedShips:selectedShips];
	}
}



@end
