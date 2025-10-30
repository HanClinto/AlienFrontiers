//
//  DataCrystal.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/12/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TechCard.h"
#import "Region.h"

@interface DataCrystal : TechCard {

}
-(void) usePower:(Region*)region;
-(bool) canUsePower:(Region*)region;

-(void) useDiscard:(Region*)region;

@end
