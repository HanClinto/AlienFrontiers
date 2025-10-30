//
//  SelectDiscardedTechCard.m
//  AlienFrontiers
//
//  Created by Clint Herron on 11/29/13.
//  Copyright (c) 2013 HanClinto Games LLC. All rights reserved.
//

#import "SelectDiscardedTechCard.h"
#import "GameState.h"

@implementation SelectDiscardedTechCard

-(SelectDiscardedTechCard*) initWithCaption:(NSString*)cap
{
	if ((self = [super init]))
	{
		caption = cap;
	}
	
	return self;
}

-(void) trySelect:(NSObject*)touchedObject
{
	// Only select regions
	if (![touchedObject isKindOfClass:[TechCard class]])
		return;
	
	TechCard* card = (TechCard*) touchedObject;
	
	// Only select valid regions
	if (card == nil)
		return;
	
    if (![[[GameState sharedGameState] techDiscardDeck] hasTechCard:card])
        return;

	// Otherwise, then assume we have a valid selection.
	
	// Un-select any old selection if necessary.
	/*
     if (selectedCard != nil)
     {
     if ([selectedCard isSelected])
     {
     selectedCard.isSelected = false;
     }
     }
	 */
	
	// Select the new region
	selectedCard = card;
	
	// Update the highlighting for the region (if any)
    //	card.isSelected = true;
}

-(bool) isSelectionComplete
{
	return (selectedCard != nil);
}

-(id) selectedObject
{
	return selectedCard;
}

@end
