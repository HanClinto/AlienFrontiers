//
//  GravityManipulator.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/22/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TechCard.h"
#import "Ship.h"

@interface GravityManipulator : TechCard {

}
-(void) usePower:(Ship*)shipToRaise toLower:(Ship*)shipToLower;

@end
