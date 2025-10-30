//
//  SolarConverter.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SolarConverter.h"
#import "LemBadlands.h"

@implementation SolarConverter

-(int) numDockGroups
{
	if ([state numPlayers] <= 3)
		return 7;
	
	return 8;
}

-(int) numDocksPerGroup
{
	return 1;
}

-(NSString*) title
{
    return NSLocalizedString(@"Solar Converter", @"Orbital Title");
}

-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips
{
	// As long as there are open docks, we can play any die from our hand.
	if ([self numEmptyGroups] > selectedShips.count)
		return [shipsInHand notRestrictedByOrbital:self];
	
	// If there are no open docks, then we cannot play anything.
	return [ShipGroup blank];
}

-(bool) isValidMoveFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
	if ([selectedShips count] <= [self numEmptyGroups])
		if (selectedShips.count > 0)
            if (![selectedShips hasShipRestrictedFrom:self])
                return true;
	
	return false;
}

-(void) commitShipsFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// To be overridden in descending classes.
	if ([self isValidMoveFromPlayer:player selectedShips:selectedShips])
	{
		[state createUndoPoint];
        int newFuelTotal = 0;

		for (Ship* ship in [selectedShips array]) {
			int newFuel = (ship.value + 1) * 0.5; // Round up
			
			// Check for territory bonus
			if ([[state lemBadlands] playerHasBonus:player])
				newFuel += 1;
			
			player.fuel = player.fuel + newFuel;
			
			[self.firstEmptyGroup dockShip:ship];
            
            newFuelTotal += newFuel;
		}
        [super commitShipsFromPlayer:player selectedShips:selectedShips];
        
        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Harvested %d fuel", @"Used Solar Converter"), 
                        [[state currentPlayer] playerName],
                        newFuelTotal
                        ]];
	}
}

@end
