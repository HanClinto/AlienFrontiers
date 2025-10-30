//
//  SelectRaid.m
//  AlienFrontiers
//
//  Created by Clint Herron on 6/4/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SelectRaid.h"
#import "TechCard.h"
#import "GameState.h"
#import "HolographicDecoy.h"


@implementation SelectRaid

-(SelectRaid*) initWithCaption:(NSString*)cap
{
	if ((self = [super init]))
	{
		caption = cap;
		
		cardToRaid = nil;
	}
	
	return self;
}

-(void) trySelect:(NSObject*)touchedObject
{
	// Only select cards or resources
    /*
	if ([touchedObject isKindOfClass:[TechCard class]]) 
	{
		TechCard* card = (TechCard*) touchedObject;
		
		if ((card != nil) && ([card owner] != nil) && ([card owner] != [[GameState sharedGameState] currentPlayer]))
		{
			cardToRaid = card;
			
			for (Player* player in [[GameState sharedGameState] players])
			{
				[player setFuelToRaid:0];
				[player setOreToRaid:0];
				[player setSelectionZ:-1];
			}

            [[GameState sharedGameState] postEvent:EVENT_RESOURCES_CHANGED object:self];
		} // TODO: Else if we have the space crane, then we can have a nil owner to steal from the deck
	}
	else if ([touchedObject isKindOfClass:[Player class]])
	{
		Player* player = (Player*) touchedObject;
		
		if (player.selectionType == PLAYER_SELECTION_TYPE_ORE)
		{
			player.oreToRaid += 1;
			cardToRaid = nil;
		}
		else if (player.selectionType == PLAYER_SELECTION_TYPE_FUEL)
		{
			player.fuelToRaid += 1;
			cardToRaid = nil;
		}
		else {
			return;
		}

		
		if (player.selectionZ != 0)
		{
			player.selectionZ = 0;
		
			for (Player* p in [[GameState sharedGameState] players])
			{
				if (p != player)
				{
					if (p.selectionZ != -1)
						p.selectionZ = p.selectionZ + 1;
				}
			}
		}
		
		// Limit the number of resources grabbed
		if ([self totalResourcesToRaid] > 4)
		{
			Player* maxZ = player;
			
			for (Player* p in [[GameState sharedGameState] players])
			{
				if (p.selectionZ > maxZ.selectionZ)
					maxZ = p;
			}
			
			if ((maxZ.oreToRaid > 0) && ((PLAYER_SELECTION_TYPE_FUEL) || (maxZ.fuelToRaid == 0)))
			{
				maxZ.oreToRaid -= 1;
			}
			else // if ((maxZ.fuelToRaid > 0))
			{
				maxZ.fuelToRaid -= 1;
			}
			
			if ((maxZ.oreToRaid == 0) && (maxZ.fuelToRaid == 0))
			{
				maxZ.selectionZ = -1;
			}
		}
        
        [[GameState sharedGameState] postEvent:EVENT_RESOURCES_CHANGED object:self];
        
	} 
	else
	{
		return;
	}
     */
	
	// TODO: Update the highlighting for the player / region?
	//	card.isSelected = true;
}

-(bool) isSelectionComplete
{
	int totalResources = [self totalResourcesToRaid];
	
    if (![[[GameState sharedGameState] currentPlayer] isRaiding])
        return true;
    
	if (cardToRaid != nil)
		return true;
	
    if (totalResources == 4)
    {
        return true;
    }
    
    if ((totalResources != 0) && (totalResources == [self totalPossibleResourcesToRaid]))
    {
        return true;
    }
    
	return false;
}

-(id) selectedObject
{
	return self;
}

-(TechCard*) cardToRaid
{
	return cardToRaid;
}

-(int) totalOreToRaid
{
	int total = 0;
	
	for (Player* player in [[GameState sharedGameState] players]) {
		total += [player oreToRaid];
	}
	
	return total;
}

-(int) totalFuelToRaid
{
	int total = 0;
	
	for (Player* player in [[GameState sharedGameState] players]) {
		total += [player fuelToRaid];
	}
	
	return total;
}

-(int) totalResourcesToRaid
{
	return ([self totalOreToRaid] + [self totalFuelToRaid]);
}

-(int) totalPossibleResourcesToRaid
{
    int total = 0;
    
	for (Player* player in [[GameState sharedGameState] players]) {
        if (player != [[GameState sharedGameState] currentPlayer])
        {
            if (![[player cards] hasCardOfType:[HolographicDecoy class]])
            {
                total += [player fuel];
                total += [player ore];
            }
        }
	}
    
    return total;
}

@end
