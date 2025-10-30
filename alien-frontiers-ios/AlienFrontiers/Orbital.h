//
//  Orbital.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "DockGroup.h"
#import "DockingBay.h"
#import "ShipGroup.h"
#import "Player.h"
#import "GameState.h"

#define CURRENT_GAME [GameState sharedGameState]

@class GameState;
@class Ship;
@class Player;


@interface Orbital : NSObject <NSCoding> {
	__weak GameState* state;
	NSMutableArray* dockGroups;
}

-(Orbital*) initWithState:(GameState *)gameState;

-(void) setupDocks:(int)numGroups docksPerGroup:(int)docksWide;

/*
@property (readonly) int numDocks;
@property (readonly) int numOpenDocks;
@property (readonly) ShipGroup* dockedShips;
@property (readonly) DockingBay* firstOpenDock;
*/

//@property (readonly) NSArray* docks;

-(bool) isValidMoveFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips;
-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips;
-(void) commitShipsFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips;

// AI Shortcut routines to speed up processing:
// TODO
-(bool) isValidMoveFromPlayer:(Player*)player selectedShip:(Ship*)selectedShip;
-(void) commitShipsFromPlayer:(Player*)player selectedShip:(Ship*)selectedShip;

-(void) dockShip:(Ship*)ship;
-(void) dockShips:(ShipGroup*)ships;
-(int) maxDockedShipIDFromPlayer:(Player*)player;
       
@property (strong, readonly) NSArray* dockGroups;
@property (readonly) int numEmptyGroups;
@property (weak, readonly) DockGroup* firstEmptyGroup;
@property (weak, readonly) GameState*	state;
@property (readonly) NSString* title;
@property (readonly) int numDocksPerGroup;
@property (readonly) int numDockGroups;
-(ShipGroup*) dockedShips;
-(Ship*) firstDockedShip;
-(DockingBay*) dockByIndex:(int)index;

-(id) cloneWithState:(GameState*)s;
//-(void) clonePass2;

@end
