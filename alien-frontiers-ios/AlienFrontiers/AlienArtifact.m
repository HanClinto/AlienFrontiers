//
//  AlienArtifact.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "AlienArtifact.h"


@implementation AlienArtifact

-(int) numDockGroups
{
	return 4;
}

-(int) numDocksPerGroup
{
	return 1;
}

-(NSString*) title
{
    return NSLocalizedString(@"Alien Artifact", @"Orbital title");
}

-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips
{
	// As long as there are open docks, we can play any die from our hand.
	if (([self numEmptyGroups] > selectedShips.count) &&
        (![selectedShips hasShipRestrictedFrom:self]))
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
	if ([self isValidMoveFromPlayer:player selectedShips:selectedShips])
	{
        [state createUndoPoint];
		
		for (Ship* ship in [selectedShips array]) {
			// TODO: Track rolling sum and reshuffle abilities.
			player.artifactCreditAvailable += ship.value;
			player.artifactShufflesAvailable += 1;
//			player.ore = player.ore + 1;
			
			[self.firstEmptyGroup dockShip:ship];
		}

        [super commitShipsFromPlayer:player selectedShips:selectedShips];
	}
}


@end
