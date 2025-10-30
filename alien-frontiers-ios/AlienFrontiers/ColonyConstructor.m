//
//  ColonyConstructor.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "ColonyConstructor.h"

#import "BradburyPlateau.h"

@implementation ColonyConstructor

-(int) numDockGroups
{
	if ([state numPlayers] <= 2)
		return 1;
	
	return 2;
}

-(int) numDocksPerGroup
{
	return 3;
}

-(NSString*) title
{
    return NSLocalizedString(@"Colony Constructor", @"Orbital Title");
}

-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips
{
	// Ensure we have at least 1 open pair of docks
	if ([self numEmptyGroups] >= 1)
	{
		// Make sure we have no more than 3 ships selected
		if ([selectedShips count] < 3)
		{
            if (![selectedShips hasShipRestrictedFrom:self])
            {
                // Ensure that the two currently selected ships match.
                if (([selectedShips count] == 0) || ([selectedShips minValue] == [selectedShips maxValue]))
                {
                    // Ensure that we have enough ore
                    
                    int needed = 3;
                    // Account for territory bonuses here
                    if ([[state bradburyPlateau] playerHasBonus:player])
                        needed = 2;
                    
                    if (player.ore >= needed)
                    {
                        // Okay -- we've got enough -- let's see what other ships can be combined here.
                        if (selectedShips.count == 0) 
                        {
                            // Return all triplets
                            return [shipsInHand minQuant:3];
                        }
                        else
                        {
                            // Otherwise, match against any selected ships that we've got.
                            return [[shipsInHand ofValue:[selectedShips minValue]] minQuant:(3-selectedShips.count)];
                        }
                    }
                }

            }
		}
		// If we have 3 (or more) dice selected, then no more dice are usable for this particular commit.
	}
	
	// If there are no open docks, then we cannot play anything.
	return [ShipGroup blank];
}

-(bool) isValidMoveFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
	// If we've got 3 dice and they match and the owning player has enough fuel and ore...
	if ([self numEmptyGroups] > 0)
	{
        if (![selectedShips hasShipRestrictedFrom:self])
        {
            if (selectedShips.count == 3 &&
                [selectedShips minValue] == [selectedShips maxValue])
            {
                int needed = 3;
                // Account for territory bonuses here
                if ([[state bradburyPlateau] playerHasBonus:player])
                    needed = 2;
                
                if (player.ore >= needed)
                {
                    return true;
                }
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
		
		int needed = 3;
		// Account for territory bonuses here
		if ([[state bradburyPlateau] playerHasBonus:player])
			needed = 2;
		
		player.ore -= needed;
		
		[player addColony];
		
		[[self firstEmptyGroup] dockShips:selectedShips];

        [super commitShipsFromPlayer:player selectedShips:selectedShips];
	}
}


@end
