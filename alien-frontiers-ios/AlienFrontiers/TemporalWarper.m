//
//  TemporalWarper.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/26/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "TemporalWarper.h"
#import "GameState.h"

@implementation TemporalWarper

-(NSString*) title
{
	return NSLocalizedString(@"TEMPORAL WARPER", @"Temporal Warper title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"TEMPORAL", @"Temporal Warper title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"WARPER", @"Temporal Warper title line 2");
}

-(NSString*) powerText
{
    return NSLocalizedString(@"Pay | to reroll any amount of your unplaced ships.", @"Temporal Warper power text");
}

-(NSString*) discardText
{
    return NSLocalizedString(@"Review the discard pile then discard to claim one [.", @"Temporal Warper discard text");
}

-(NSString*) imageFilename
{
	return @"tech_tw.png";
}

-(NSString*) fullImageFilename
{
	return @"TCTemporalWarper.png";
}

-(void) usePower:(ShipGroup*)ships
{
	if (owner != nil) 
	{
		if ([self canUsePower]) 
		{
            // Do NOT create an undo point here
            //[state createUndoPoint];
            
            // Rather, clear the undo point so that we can't go backwards past this re-roll.
            [state clearUndoRedo];
            
            NSString* oldTitles = [ships title];
            
            for (Ship* ship in [ships array])
            {
                if ([ship dock] == nil)
                {
                    if ([ship teleportRestriction] == nil)
                    {
                        [ship roll];
                    }
                }
            }
			
			owner.fuel = owner.fuel - [self adjustedFuelCost];

			// Mark that we used the card this turn.
			[self setTapped:true];

            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Re-rolled %@ to %@, using %d fuel", @"Temporal Warper discard"),  
                            [[state currentPlayer] playerName],
                            oldTitles,
                            [ships title],
                            [self adjustedFuelCost]
                            ]];
            
            [state postEvent:EVENT_DISCARD_STASIS_BEAM object:self];
		}
	}
}

-(bool) canUseDiscard
{
    return (([[state techDiscardDeck] count] > 0) &&
            ([super canUseDiscard]));
}

-(void) useDiscard
{
	if ([self canUseDiscard])
	{
        [state createUndoPoint];
        
        [[state currentPlayer] setIsChoosingDiscard:true];
        [super useDiscard];

        [state postEvent:EVENT_ARTIFACT_CARDS_CHANGED object:self];
        [state postEvent:EVENT_BEGIN_CHOOSE_DISCARD object:self];
	}
}

/* // Old synchronous version of the tech discard ability
-(void) useDiscard:(TechCard*)card
{
	if ([self canUseDiscard])
	{
        [state createUndoPoint];
        
        // Card must be in the discard pile
        if ([[state techDiscardDeck] hasTechCard:card])
        {
            [[state techDiscardDeck] removeCard:card];
            [[[state currentPlayer] cards] pushCard:card];
            [card setOwner:[state currentPlayer]];
            
            [super useDiscard];
            
            [state postEvent:EVENT_ARTIFACT_CARDS_CHANGED object:self];
        }
	}
}
 */

@end
