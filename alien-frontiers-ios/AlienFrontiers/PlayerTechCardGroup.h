//
//  PlayerTechCardGroup.h
//  AlienFrontiers
//
//  Created by Kevin Gillette on 10/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Player.h"
#import "TechCardGroup.h"

@interface PlayerTechCardGroup : TechCardGroup {
    __weak Player *player;
}

@property (weak, readonly) Player* player;

-(PlayerTechCardGroup*) initWithPlayer:(Player*)owner;

@end