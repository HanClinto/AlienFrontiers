//
//  PolarityDevice.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/31/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TechCard.h"
#import "Ship.h"
#import "SelectPlacedColony.h"

@interface PolarityDevice : TechCard {
}

-(void) usePower:(Ship*)ship;
-(bool) canUsePower:(Ship*)ship;

-(void) useDiscard:(SelectPlacedColony*)moveColonyA withColony:(SelectPlacedColony*)moveColonyB;

@end
