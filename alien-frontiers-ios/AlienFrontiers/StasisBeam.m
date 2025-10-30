//
//  StasisBeam.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/12/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "StasisBeam.h"

#import "Ship.h"
#import "Player.h"
#import "GameState.h"
#import "Region.h"

@implementation StasisBeam

-(NSString*) title
{
	return NSLocalizedString(@"STASIS BEAM", @"Tech title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"STASIS", @"Tech title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"BEAM", @"Tech title line 2");
}
-(NSString*) powerText
{
    return NSLocalizedString(@"Pay | to subtract one point from one of your unplaced ships.", @"StasisBeam power desc");
}

-(NSString*) discardText
{
    return NSLocalizedString(@"Discard to place or move ^.", @"StasisBeam discard desc");
}

-(NSString*) imageFilename
{
	return @"tech_sb.png";
}

-(NSString*) fullImageFilename
{
	return @"TCStasisBeam.png";
}

-(bool) canUsePower:(Ship*)ship
{
	if (owner != nil) 
	{
		if ([self canUsePower]) 
		{
			if ([ship dock] == nil)
			{
				if ([ship value] > 1)
				{
                    if ([ship teleportRestriction] == nil)
                    {
                        return true;
                    }
				}
			}
		}
	}
    
    return false;
}

-(void) usePower:(Ship*)ship
{
	if (owner != nil)
	{
		if ([self canUsePower:ship])
		{
            [state createUndoPoint];
            
            owner.fuel = owner.fuel - [self adjustedFuelCost];
            ship.value = ship.value - 1;
            
            // Mark that we used the card this turn.
            [self setTapped:true];
            
            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Stasis'd %d to %@, using %d fuel", @"Statis Beam power"),
                            [[state currentPlayer] playerName],
                            [ship value] + 1,
                            [ship title],
                            [self adjustedFuelCost]
                            ]];
            
            [state postEvent:EVENT_USE_STASIS_BEAM object:self];
		}
	}
}


-(void) useDiscard:(Region*)region
{
	if ([self canUseDiscard])
	{
        [state createUndoPoint];

		// First, loop through all of the other regions and remove the Isolation Field (in case it's already placed)
		for (Region* r in [state regions])
		{
			if ([r hasIsolationField])
				[r setHasIsolationField:false];
		}
		
		// Next, set the Isolation Field on the targeted region
		[region setHasIsolationField:true];
		
        [super useDiscard];

        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Discarded %@ to add Isolation Field to %@", @"Stasis Beam discard"), 
                        [[state currentPlayer] playerName],
                        [[self title] capitalizedString],
                        [region title]
                        ]];
        
        [state postEvent:EVENT_DISCARD_STASIS_BEAM object:self];
	}
}

@end
