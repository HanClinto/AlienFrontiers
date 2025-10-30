//
//  BoosterPod.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "BoosterPod.h"

#import "PlayerTechCardGroup.h"
#import "Ship.h"
#import "Player.h"
#import "GameState.h"
#import "Region.h"

@implementation BoosterPod

-(NSString*) title
{
	return NSLocalizedString(@"BOOSTER POD", @"Tech title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"BOOSTER", @"Tech title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"POD", @"Tech title line 2");
}
-(NSString*) powerText
{
    return NSLocalizedString(@"Pay | to add one point to one of your unplaced ships.", @"Tech power text");
}

-(NSString*) discardText
{
    return NSLocalizedString(@"Discard to remove ^ or \\ or ] from a territory.", @"Tech discard text");
}

-(NSString*) imageFilename
{
	return @"tech_bp.png";
}

-(NSString*) fullImageFilename
{
	return @"TCBoosterPod.png";
}

-(NSString*) whyCantUsePower:(Ship*)ship
{
    NSString* reason = nil;
    
    reason = [super whyCantUsePower];
    
    if (reason != nil)
        return reason;
    
    if (ship == nil)
        return @"You must target a valid ship";
    
    if ([ship docked])
        return @"You may not target a ship that is docked";
    
    if ([ship value] >= 6)
        return @"You may not boost a ship above 6";
    
    if ([ship teleportRestriction] != nil)
        return @"You may not boost a ship after it has been Teleported";
    
    return nil;
}

-(bool) canUsePower:(Ship*)ship
{
	if ([self canUsePower])
	{
		if (ship != nil)
		{
			if ([ship dock] == nil)
			{
				if ([ship value] < 6)
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
	if ([self canUsePower:ship])
	{
        [state createUndoPoint];
        
        owner.fuel = owner.fuel - [self adjustedFuelCost];
        
        ship.value = ship.value + 1;
        
        // Mark that we used the card this turn.
        
        [self setTapped:true];
        
        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Boosted %d to %@, using %d fuel", @"Booster pod power"),
                        [[state currentPlayer] playerName],
                        [ship value] - 1,
                        [ship title],
                        [self adjustedFuelCost]
                        ]];
        
        [state postEvent:EVENT_USE_BOOSTER_POD object:self];
	}
}

-(void) useDiscard:(Region*)region
{
	if ([self canUseDiscard])
	{
        [state createUndoPoint];

		// TODO: Make this more selective!
		// Remove all three fields from the region.
		[region setHasPositronField:false];
		[region setHasRepulsorField:false];
		[region setHasIsolationField:false];
        
        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Discarded %@ to remove field from %@", @"Booster discard"),
                        [[state currentPlayer] playerName],
                        [[self title] capitalizedString],
                        [region title]
                        ]];
		
        [super useDiscard];
        
        [state postEvent:EVENT_DISCARD_BOOSTER_POD object:self];
	}
}


@end
