//
//  SelectPlacedColony.m
//  AlienFrontiers
//
//  Created by Clint Herron on 6/2/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SelectPlacedColony.h"


@implementation SelectPlacedColony

-(SelectPlacedColony*) initWithCaption:(NSString*)cap
{
	if ((self = [super init]))
	{
		caption = cap;
		
		selectedRegion = nil;
		selectedPlayer = nil;
	}
	
	return self;
}

-(void) trySelect:(NSObject*)touchedObject
{
	// Only select regions or players
	if ([touchedObject isKindOfClass:[Region class]]) 
	{
		Region* region = (Region*) touchedObject;

        selectedRegion = region;
        
        if ([selectedRegion hasRepulsorField])
        {
            selectedRegion = nil;
        }

		if ((selectedRegion != nil) && (selectedPlayer != nil))
		{
			if ([selectedRegion coloniesForPlayer:[selectedPlayer playerIndex]] == 0)
			{
				selectedRegion = nil;
				return;
			}
		}
		
	}
	else if ([touchedObject isKindOfClass:[Player class]])
	{
		Player* player = (Player*) touchedObject;
		
		selectedPlayer = player;
		
		if ((selectedRegion != nil) && (selectedPlayer != nil))
		{
			if ([selectedRegion coloniesForPlayer:[selectedPlayer playerIndex]] == 0)
			{
				selectedRegion = nil;
				return;
			}
		}
		
	} 
	else
	{
		return;
	}

	// TODO: Update the highlighting for the player / region?
	//	card.isSelected = true;
}

-(bool) isSelectionComplete
{
	if (selectedPlayer == nil)
		return false;
	
	if (selectedRegion == nil)
		return false;
	
	// TODO: Check to make sure that the region contains one of the players' colonies?
	
	return (true);
}

-(id) selectedObject
{
	return self;
}

-(Region*) region
{
	return selectedRegion;
}

-(Player*) player
{
	return selectedPlayer;
}

@end
