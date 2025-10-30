//
//  MaintenanceBay.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "MaintenanceBay.h"


@implementation MaintenanceBay

-(int) numDockGroups
{
	return [state numPlayers] * 6 + 1;
}

-(int) numDocksPerGroup
{
	return 1;
}

-(NSString*) title
{
    return NSLocalizedString(@"Maintenance Bay", @"Orbital Title");
}

-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips
{
	// The maintenance bay can always accept any ship.
	return shipsInHand;
}

-(bool) isValidMoveFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
	if (selectedShips.count > 0)
		return true;
	
	return false;
}

-(void) commitShipsFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);	
    
	if ([self isValidMoveFromPlayer:player selectedShips:selectedShips])
	{
        [state createUndoPoint];
        
        [self dockShips:selectedShips];
        
        [super commitShipsFromPlayer:player selectedShips:selectedShips];
    }
}

@end
