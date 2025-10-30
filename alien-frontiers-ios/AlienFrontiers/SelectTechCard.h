//
//  SelectTechCard.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/29/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "QueuedSelection.h"
#import "TechCard.h"

enum SELECT_TECH_CARD_TYPE {
	SELECT_TECH_CARD_TYPE_ARTIFACT,       // Techs that are available to be drawn from the Alien Artifact
	SELECT_TECH_CARD_TYPE_CURRENT_PLAYER, // Techs that are owned by the current player
	SELECT_TECH_CARD_TYPE_OTHER_PLAYERS,  // Tehcs that are owned by players other than the current player
    SELECT_TECH_CARD_TYPE_DISCARD,
};

@interface SelectTechCard : QueuedSelection {
	int cardSelectionType;
	TechCard* selectedCard;
}
-(SelectTechCard*) initWithCaption:(NSString*)cap selectionType:(int) selectOnly;

@end
