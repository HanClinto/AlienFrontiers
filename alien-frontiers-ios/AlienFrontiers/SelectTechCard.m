//
//  SelectTechCard.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/29/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SelectTechCard.h"
#import "GameState.h"

@implementation SelectTechCard

-(SelectTechCard*) initWithCaption:(NSString*)cap selectionType:(int) selectOnly
{
	if ((self = [super init]))
	{
		caption = cap;
		cardSelectionType = selectOnly;
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
	
	switch (cardSelectionType) {
		case SELECT_TECH_CARD_TYPE_ARTIFACT:
			if (![[[GameState sharedGameState] techDisplayDeck] hasTechCard:card])
				return;
			break;
		case SELECT_TECH_CARD_TYPE_CURRENT_PLAYER:
			if (![[[[GameState sharedGameState] currentPlayer] cards] hasTechCard:card])
				return;
			break;
		case SELECT_TECH_CARD_TYPE_OTHER_PLAYERS:
			// TODO: Implement this?  Needed?
			// YAGNI?
			break;
		case SELECT_TECH_CARD_TYPE_DISCARD:
            if (![[[GameState sharedGameState] techDiscardDeck] hasTechCard:card])
                return;
            
			break;
		default:
			break;
	}
	
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
	
	// Select the new card
	selectedCard = card;
	
	// Update the highlighting for the card (if any)
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
