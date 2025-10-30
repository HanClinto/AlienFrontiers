//
//  DataCrystal.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/12/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "DataCrystal.h"

#import "Region.h"
#import "Player.h"
#import "GameState.h"
#import "Region.h"
#import "BurroughsDesert.h"
#import "PohlFoothills.h"
#import "PlayerTechCardGroup.h"

@implementation DataCrystal

-(NSString*) title
{
	return NSLocalizedString(@"DATA CRYSTAL", @"Tech title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"DATA", @"Tech title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"CRYSTAL", @"Tech title line 2");
}
-(NSString*) powerText
{
    return NSLocalizedString(@"Pay | per _ on a territory to use its bonus.", @"Data Crystal power text");
}

-(NSString*) discardText
{
    return NSLocalizedString(@"Discard to place or move \\.", @"Data Crystal discard text");
}

-(NSString*) imageFilename
{
	return @"tech_dc.png";
}

-(NSString*) fullImageFilename
{
	return @"TCDataCrystal.png";
}

-(bool) canUsePower:(Region*)region
{
    if (![super canUsePower])
        return false;
    
    // Cannot borrow a nil power
    if (region == nil)
        return false;
    
    // If there isn't an isolation field on the region...
    if ([region hasIsolationField])
        return false;
    
    // And if the region isn't the Burroughs Desert...
    if ([region isKindOfClass:[BurroughsDesert class]])
        return false;
    
    int cost = [region numColonies];
    
    // If someone is on the region
    if (cost == 0)
        return false;
    
    // And if we don't already have the bonus power...
    if ([region playerHasBonus:owner])
        return false;
    
    if ([[state pohlFoothills] playerHasBonus:owner])
    {
        cost -= 1;
    }
    
    return ([owner fuel] >= cost);
}

-(NSString*) whyCantUsePower:(Region*)region
{
    NSString* reason = nil;
    
    reason = [super whyCantUsePower];
    
    if (reason != nil)
        return reason;
    
    // If there isn't an isolation field on the region...
    if ([region hasIsolationField])
        return @"The Isolation Field prevents anyone from using that region's bonus.";
    
    // And if the region isn't the Burroughs Desert...
    if ([region isKindOfClass:[BurroughsDesert class]])
        return @"The power of the Burroughs Desert may not be borrowed with the Data Crystal.";
    
    int cost = [region numColonies];
    
    // If someone is on the region
    if (cost == 0)
        return @"Only regions that have colonies can be targeted by the Data Crystal";
    
    // And if we don't already have the bonus power...
    if ([region playerHasBonus:owner])
        return @"You may not target your own region.";
    
    if ([[state pohlFoothills] playerHasBonus:owner])
    {
        cost -= 1;
    }    
    
    if ([owner fuel] < cost)
        return [NSString stringWithFormat:@"You need %d fuel to use this card, you only have %d.", cost, [owner fuel]];
    
    return nil;
}

-(void) usePower:(Region*)region
{
    if ([self state] == [GameState sharedGameState])
    {
        NSString* why = [self whyCantUsePower:region];
        if (why != nil)
        {
            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: ERROR: %@", @"Error message for failed tech usage"),
                            [[state currentPlayer] playerName],
                            why
                            ]];
        }
    }
	if ([self canUsePower:region])
	{
        int cost = [region numColonies];
        
        if ([[state pohlFoothills] playerHasBonus:owner])
            cost -= 1;
        
        if (owner.fuel >= cost)
        {
            [state createUndoPoint];
            
            owner.fuel = owner.fuel - cost;
            
            [owner setBorrowingRegion:region];
            
            // Mark that we used the card this turn.
            [self setTapped:true];
            
            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Borrowed power from %@, using %d fuel", @"Data Crystal power"),
                            [[state currentPlayer] playerName],
                            [region title],
                            cost
                            ]];
            
            [state postEvent:EVENT_USE_DATA_CRYSTAL object:self];
        }
        else {
            // ERROR: Not enough fuel to use the selected region
        }
	}
}

-(void) useDiscard:(Region*)region
{
	if ([self canUseDiscard])
	{
        [state createUndoPoint];

		// First, loop through all of the other regions and remove the Positron Field (in case it's already placed)
		for (Region* r in [state regions])
		{
			if ([r hasPositronField])
				[r setHasPositronField:false];
		}
		
		// Next, set the Positron Field on the targeted region
		[region setHasPositronField:true];
		
        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Discarded %@ to add Positron Field to %@", @"Data Crystal discard"),
                        [[self owner] playerName],
                        [[self title] capitalizedString],
                        [region title]
                        ]];

        [super useDiscard];
        
        [state postEvent:EVENT_DISCARD_DATA_CRYSTAL object:self];
	}
}

@end
