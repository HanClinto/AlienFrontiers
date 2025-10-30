//
//  SelectRaid.h
//  AlienFrontiers
//
//  Created by Clint Herron on 6/4/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "QueuedSelection.h"
#import "Player.h"

@class TechCard;

@interface SelectRaid : QueuedSelection {
	TechCard* cardToRaid;
}

-(int) totalResourcesToRaid;
-(int) totalPossibleResourcesToRaid;

@property (weak, readonly) TechCard* cardToRaid;

@end
