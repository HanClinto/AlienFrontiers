//
//  Dock.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Ship.h"

@class Orbital;
@class GameState;

@interface DockingBay : NSObject {
	__weak Ship* dockedShip;
    int dockedShipPlayerID;
    int dockedShipID;
	__weak Orbital* orbital;
	__weak GameState* state;
	int dockIndex;
}

-(DockingBay*) initWithOrbital:(Orbital*)owner index:(int)index;

@property (readonly) bool occupied;
-(void) dockShip:(Ship*)ship;
-(void) ejectShip;
@property (weak, readonly) Ship* dockedShip;
@property (readonly) int index;
@property (weak, readonly) Orbital* orbital;

-(id) cloneWithOrbital:(Orbital*)orbital;
-(void) clonePass2;

@end
