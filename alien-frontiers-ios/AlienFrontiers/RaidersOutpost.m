//
//  RaidersOutpost.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "RaidersOutpost.h"


@implementation RaidersOutpost

-(int) numDockGroups
{
	return 1;
}

-(int) numDocksPerGroup
{
	return 3;
}

-(NSString*) title
{
    return NSLocalizedString(@"Raiders' Outpost", @"Orbital Title");
}

-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips
{
	int sumToBeat = [self currentDockedSum];
	
    if (![selectedShips hasShipRestrictedFrom:self])
    {
        if ([self numEmptyGroups] > selectedShips.count)
        {
            if (selectedShips.count < 3)
            {
                return [[shipsInHand notRestrictedByOrbital:self] inStraightWith:selectedShips minSum:sumToBeat];
            }
        }
    }
	
	return [ShipGroup blank];
}

-(bool) isValidMoveFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
	int sumToBeat = [self currentDockedSum];
	
	if ((selectedShips.count == 3) &&
		([selectedShips inStraight].count == 3) &&
		([selectedShips sum] > sumToBeat) &&
        (![selectedShips hasShipRestrictedFrom:self]))
	{
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
		
		DockGroup* group = (DockGroup*) [dockGroups objectAtIndex:0];
		
		if (!group.empty)
		{
			for (DockingBay* dock in group.dockArray) {
				if (dock.dockedShip != nil)
					[dock.dockedShip moveToMaintBay];
			}
		}
		
		[group dockShips:selectedShips];
		
		[player startRaid];

        [super commitShipsFromPlayer:player selectedShips:selectedShips];
	}
}

-(int) currentDockedSum
{
	int sum = 0;
	
	for (DockGroup* group in dockGroups)
	{
		for (DockingBay* dock in group.dockArray)
		{
			if (dock.occupied)
			{
				sum += dock.dockedShip.value;
			}
		}
	}
	
	return sum;
}

@end
