//
//  OrbitalTeleporter.m
//  AlienFrontiers
//
//  Created by Clint Herron on 6/3/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "OrbitalTeleporter.h"
#import "Ship.h"
#import "GameState.h"
#import "TerraformingStation.h"
#import "MaintenanceBay.h"
#import "SelectPlacedColony.h"

@implementation OrbitalTeleporter

-(NSString*) title
{
	return NSLocalizedString(@"ORBITAL TELEPORTER", @"Tech title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"ORBITAL", @"Tech title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"TELEPORTER", @"Tech title line 2");
}
-(NSString*) powerText
{
    return NSLocalizedString(@"Pay || to reuse one of your ships at a different orbital facility.", @"OrbitalTeleporter power desc");
}

-(NSString*) discardText
{
    return NSLocalizedString(@"Discard to move any _ to a different territory.", @"OrbitalTeleporter discard desc");
}

-(NSString*) imageFilename
{
	return @"tech_ot.png";
}

-(NSString*) fullImageFilename
{
	return @"TCOrbitalTeleporter.png";
}

-(int) baseFuelCost
{
	return 2;
}

-(void) usePower:(Ship*)ship
{
	if ([self canUsePower:ship])
	{
        [state createUndoPoint];
        
        [ship setTeleportRestriction:[ship dockedOrbital]];
        
        [ship undock];
        
        owner.fuel = owner.fuel - [self adjustedFuelCost];
        [self setTapped:true];
        
        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Teleported %@ from %@, using %d fuel", @"Orbital Teleporter power"),
                        [[state currentPlayer] playerName],
                        [ship title],
                        [[ship teleportRestriction] title],
                        [self adjustedFuelCost]
                        ]];
        
        [state postEvent:EVENT_USE_ORBITAL_TELEPORTER object:self];
	}
}

-(bool) canUsePower:(Ship*)ship
{
	if ([self canUsePower])
	{
		if (ship != nil)
		{
            if ([ship docked])
            {
                if (([ship dockedOrbital] != [state terraformingStation]) &&
                    ([ship dockedOrbital] != [state maintenanceBay]))
                {
                    return true;
                }
            }
        }
    }
    
    return false;
}



-(void) useDiscard:(SelectPlacedColony*)moveColony toRegion:(Region*)region
{
	if ([self canUseDiscard])
	{
		if ((moveColony != nil) && (region != nil))
		{
			if ([[moveColony region] coloniesForPlayer:[[moveColony player] playerIndex]] > 0)
			{
				if ([moveColony region] == region)
				{
					// TODO: Pointless to move a colony to the same region!
					return;
				}
				
                [state createUndoPoint];

				// Move the colony from the source region to the destination region.
				[[moveColony region] removeColony:[[moveColony player] playerIndex]];
				[region                 addColony:[[moveColony player] playerIndex]];
				
                [super useDiscard];
                
                [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Discarded %@ to move %@'s colony from %@ to %@", @"Orbital Teleporter discard"),
                                [[state currentPlayer] playerName],
                                [[self title] capitalizedString],
                                [[moveColony player] playerName],
                                [[moveColony region] title],
                                [region title]
                                ]];
                
                [state postEvent:EVENT_DISCARD_ORBITAL_TELEPORTER object:self];
			}
		}
	}
}



@end
