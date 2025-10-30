//
//  SelectDiscardedTechCard.h
//  AlienFrontiers
//
//  Created by Clint Herron on 11/29/13.
//  Copyright (c) 2013 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "QueuedSelection.h"
#import "TechCard.h"

@interface SelectDiscardedTechCard : QueuedSelection {
	TechCard* selectedCard;
}


@end
