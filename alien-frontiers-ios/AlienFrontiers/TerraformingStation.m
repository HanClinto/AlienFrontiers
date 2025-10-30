//
//  TerraformingStation.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/23/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "TerraformingStation.h"


@implementation TerraformingStation


-(int) numDockGroups
{
	return 1;
}

-(int) numDocksPerGroup
{
	return 1;
}

-(NSString*) title
{
    return NSLocalizedString(@"Terraforming Station", @"Orbital Title");
}

-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips
{
	// Ensure we have at least 1 open dock
	if ([self numEmptyGroups] > selectedShips.count)
	{
		if (player.ore >= 1 && player.fuel >= 1)
		{
            if ([selectedShips count] < 1)
            {
                // If we only have 3 native ships, then we can only terraform non-native ships (I.E., artifact ship)
                if ([player numActiveNativeShips] < 4)
                {
                    return [[shipsInHand nonNativeShips] ofValue:6];
                }
                else
                {
                    // Return all 6's
                    return [shipsInHand ofValue:6];
                }
			}
		}
	}
	
	// If there are no open docks, then we cannot play anything.
	return [ShipGroup blank];
}

-(bool) isValidMoveFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
	// If we've got 1 die and it's a 6 and the station is empty and we can afford it...
	if ([self numEmptyGroups] > 0)
	{
        if (selectedShips.count == 1 &&
            [selectedShips minValue] == 6)
        {
            if (([player numActiveNativeShips] > 3) ||
                ([[selectedShips atIndex:0] isArtifactShip]))
            {
                if (player.ore >= 1 && player.fuel >= 1)
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
		
		player.ore = player.ore - 1;
		player.fuel = player.fuel - 1;

		// Launch a colony
		[player addColony];
		
		[[self firstEmptyGroup] dockShips:selectedShips];

        [super commitShipsFromPlayer:player selectedShips:selectedShips];
	}
}


@end
