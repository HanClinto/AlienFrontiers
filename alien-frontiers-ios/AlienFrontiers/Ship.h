//
//  Ship.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/1/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "GameEvents.h"

#define ARTIFACT_SHIP_INDEX 6

@class DockingBay;
@class Player;
@class GameState;
@class Orbital;

@interface Ship : NSObject <NSCoding> {
	__weak GameState* state;
	__weak Player* player;
	__weak DockingBay* dock;
	__weak Orbital* teleportRestriction;
	int value;
	bool isArtifactShip;
	bool isSelected;
	bool hasPotential;
	int shipIndex;
	bool isActive;
    int rollIndex; // A number that increments when the ship is rolled, to keep track of when a die's value has changed.
}

@property(assign) int value;
@property(weak) DockingBay* dock;
@property(weak) Player* player;
@property(readonly) bool docked;
@property(readonly) int playerID;
@property(readonly) int shipID;

- (void) undock;
- (void) moveToMaintBay;

- (Ship *) initWithPlayer:(Player*)player shipIndex:(int)myIndex;
- (void) destroy;

-(void) roll;

@property(readonly) bool isArtifactShip;
@property(assign) bool isSelected;
@property(assign) bool hasPotential;
-(void) toggleSelect;
@property(assign) bool active;
@property(weak, readonly) Orbital* dockedOrbital;
@property(readonly) int rollIndex;

@property(weak) Orbital* teleportRestriction;

@property(readonly) NSString* title;

-(id) cloneWithState:(GameState*)newState player:(Player *)newPlayer;

@end
