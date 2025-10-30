//
//  DockGroup.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "DockingBay.h"
#import "ShipGroup.h"
#import "Ship.h"

@interface DockGroup : NSObject {
	NSMutableArray* docks;
}

-(DockGroup*) initWithOrbital:(Orbital*)owner ofCount:(int)numDocks groupIndex:(int)index;
@property (readonly) int numOpenDocks;
@property (readonly) int numOccupiedDocks;
@property (readonly) int numDocks;
@property (readonly) bool full;
@property (readonly) bool empty;
@property (strong, readonly) NSArray* dockArray;

-(DockingBay*) nextOpenDock;

-(void)dockShip:(Ship *)ship;
-(void)dockShips:(ShipGroup*)ships;

-(void) ejectShips;

-(id) cloneWithOrbital:(Orbital*)orbital;
-(void) clonePass2;

@end
