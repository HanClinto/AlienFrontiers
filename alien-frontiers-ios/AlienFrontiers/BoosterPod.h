//
//  BoosterPod.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TechCard.h"
#import "Ship.h"

@interface BoosterPod : TechCard {

}
-(void) usePower:(Ship*)ship;
-(bool) canUsePower:(Ship*)ship;

@end
