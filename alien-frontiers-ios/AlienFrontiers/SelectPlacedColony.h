//
//  SelectPlacedColony.h
//  AlienFrontiers
//
//  Created by Clint Herron on 6/2/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "QueuedSelection.h"
#import "Region.h"
#import "Player.h"

@interface SelectPlacedColony : QueuedSelection {
	Region* selectedRegion;
	Player* selectedPlayer;
}

-(SelectPlacedColony*) initWithCaption:(NSString*)cap;

@property (weak, readonly) Region* region;
@property (weak, readonly) Player* player;

@end
