//
//  PlasmaCannon.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/12/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TechCard.h"

@class ShipGroup;

@interface PlasmaCannon : TechCard {

}

-(bool) canUsePower:(ShipGroup*)ships;
-(void) usePower:(ShipGroup*)ships;
-(NSString*) randomBlastSound;

@end
