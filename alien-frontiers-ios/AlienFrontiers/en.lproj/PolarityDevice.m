//
//  PolarityDevice.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/31/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "PolarityDevice.h"

#import "Ship.h"
#import "Player.h"
#import "GameState.h"
#import "SelectPlacedColony.h"

@implementation PolarityDevice

-(NSString*) title
{
	return NSLocalizedString(@"POLARITY DEVICE", @"Tech title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"POLARITY", @"Tech title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"DEVICE", @"Tech title line 2");
}
-(NSString*) powerText
{
    return NSLocalizedString(@"Pay | to flip one of your unplaced ships to its opposite face.", @"PolarityDevice power desc");
}

-(NSString*) discardText
{
    return NSLocalizedString(@"Discard to swap the locations of two _ on different territories.", @"PolarityDevice discard desc");
}

-(NSString*) imageFilename
{
	return @"tech_pd.png";
}

-(NSString*) fullImageFilename
{
	return @"TCPolarityDevice.png";
}

-(bool) canUsePower:(Ship*)ship
{
	if ([self canUsePower])
	{
		if (ship != nil)
		{
			if ([ship dock] == nil)
			{
                if ([ship teleportRestriction] == nil)
                {
                    return true;
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
        
        ship.value = 7 - ship.value;
        
        // Mark that we used the card this turn.
        [self setTapped:true];
        
        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Flipped %d to %@, using %d fuel", @"Polarity Device power"),
                        [[state currentPlayer] playerName],
                        7 - [ship value],
                        [ship title],
                        [self adjustedFuelCost]
                        ]];
        
        [state postEvent:EVENT_USE_POLARITY_DEVICE object:self];
	}
}

-(void) useDiscard:(SelectPlacedColony*)moveColonyA withColony:(SelectPlacedColony*)moveColonyB
{
	if ([self canUseDiscard])
	{
		if ((moveColonyA != nil) && (moveColonyB != nil))
		{
			if (([[moveColonyA region] coloniesForPlayer:[[moveColonyA player] playerIndex]] > 0) &&
				([[moveColonyB region] coloniesForPlayer:[[moveColonyB player] playerIndex]] > 0))
			{
                [state createUndoPoint];

				// Move from A to B
//                [[moveColonyA region] moveColonyFrom[moveColonyA player] toRegion:[moveColonyB region]];
                [[moveColonyA region] swapColonyFrom:[[moveColonyA player] playerIndex] to:[[moveColonyB player] playerIndex]];
                
				// Move from B to A
                [[moveColonyB region] swapColonyFrom:[[moveColonyB player] playerIndex] to:[[moveColonyA player] playerIndex]];
			
                [super useDiscard];

                [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Discarded %@ to swap %@'s colony at %@ with %@'s colony at %@", @"Polarity Device discard"), 
                                [[state currentPlayer] playerName],
                                [[self title] capitalizedString],
                                [[moveColonyA player] playerName],
                                [[moveColonyA region] title],
                                [[moveColonyB player] playerName],
                                [[moveColonyB region] title]
                                ]];
                
                [state postEvent:EVENT_DISCARD_POLARITY_DEVICE object:self];
			}
		}
	}
}

@end
