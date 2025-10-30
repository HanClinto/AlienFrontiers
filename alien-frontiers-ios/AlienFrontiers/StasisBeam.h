//
//  StasisBeam.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/12/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TechCard.h"
#import "Ship.h"
#import "Region.h"

@interface StasisBeam : TechCard {

}

-(void) usePower:(Ship*)ship;
-(bool) canUsePower:(Ship*)ship;

-(void) useDiscard:(Region*)region;

@end
