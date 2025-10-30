//
//  GravityManipulator.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/22/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "GravityManipulator.h"
#import "Ship.h"
#import "Player.h"
#import "Region.h"
#import "GameState.h"

@implementation GravityManipulator

-(NSString*) title
{
	return NSLocalizedString(@"GRAVITY MANIPULATOR", @"Tech title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"GRAVITY", @"Tech title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"MANIPULATOR", @"Tech title line 2");
}
-(NSString*) powerText
{
    return NSLocalizedString(@"Pay || to move one point from one of your unplaced ships to another.", @"GravityManip power desc");
}

-(NSString*) discardText
{
    return NSLocalizedString(@"Discard to place or move ].", @"GravityManip discard desc");
}

-(NSString*) imageFilename
{
	return @"tech_gm.png";
}

-(NSString*) fullImageFilename
{
	return @"TCGravityManipulator.png";
}

-(int) baseFuelCost
{
	return 2;
}

-(void) usePower:(Ship*)shipToRaise toLower:(Ship*)shipToLower
{
    if ([self canUsePower])
	{
		if ([self canUsePower])
		{
			if ((shipToRaise != nil) && (shipToLower != nil))
			{
				if (shipToLower == shipToRaise)
				{
					// ERROR: Cannot raise and lower the same ship!
					return;
				}
				
				if (shipToLower.dock != nil || shipToRaise.dock != nil)
				{
					// ERROR: Both ships must be undocked!
					return;
				}
                
                if ([shipToLower teleportRestriction] != nil || [shipToRaise teleportRestriction] != nil)
                {
                    // ERROR: Neither ship can be in the middle of teleporting
                    return;
				}
                
				if (shipToLower.value < 2)
				{
					// ERROR: Ship to lower must be greater than 1!
					return;
				}
				
				if (shipToRaise.value > 5)
				{
					// ERROR: Ship to raise must be less than 6!
					return;
				}

                [state createUndoPoint];
				
				owner.fuel = owner.fuel - [self adjustedFuelCost];
				
				shipToRaise.value += 1;
				shipToLower.value -= 1;
				
				// Mark that we used the card this turn.
				[self setTapped:true];
                
                [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Manipulated %d to %@ and %d to %@, using %d fuel", @"Gravity Manip power"), 
                                [[state currentPlayer] playerName],
                                [shipToRaise value] - 1,
                                [shipToRaise title],
                                [shipToLower value] + 1,
                                [shipToLower title],
                                [self adjustedFuelCost]
                                ]];
                
                [state postEvent:EVENT_USE_GRAVITY_MANIPULATOR object:self];
                
			}
		}
	}
}

-(void) useDiscard:(Region*)region
{
	if ([self canUseDiscard])
	{
        [state createUndoPoint];

		// First, loop through all of the other regions and remove the Repulsor Field (in case it's already placed)
		for (Region* r in [state regions])
		{
			if ([r hasRepulsorField])
				[r setHasRepulsorField:false];
		}
		
		// Next, set the Repulsor Field on the targeted region
		[region setHasRepulsorField:true];
		
        [super useDiscard];
        
        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Discarded %@ to add Repulsor Field to %@", @"Gravity Manip Discard"),
                        [[state currentPlayer] playerName],
                        [[self title] capitalizedString],
                        [region title]
                        ]];
        
        [state postEvent:EVENT_DISCARD_GRAVITY_MANIPULATOR object:self];
	}
}


@end
