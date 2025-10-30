//
//  BurroughsDesert.h
//  AlienFrontiers
//
//  Created by Clint Herron on 4/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Region.h"

@class Player;


@interface BurroughsDesert : Region {

}

-(bool) playerCanPurchaseShip:(Player*)player;


@end
