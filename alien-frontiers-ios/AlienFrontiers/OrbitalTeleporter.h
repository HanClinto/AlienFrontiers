//
//  OrbitalTeleporter.h
//  AlienFrontiers
//
//  Created by Clint Herron on 6/3/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TechCard.h"
#import "ShipGroup.h"
#import "Player.h"

@class SelectPlacedColony;

@interface OrbitalTeleporter : TechCard {

}
-(bool) canUsePower:(Ship*)ship;
-(void) usePower:(Ship*)ship;
-(void) useDiscard:(SelectPlacedColony*)moveColony toRegion:(Region*)region;

@end
