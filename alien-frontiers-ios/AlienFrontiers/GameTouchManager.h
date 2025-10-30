//
//  TouchManager.h
//  AlienFrontiers
//
//  Created by Clint Herron on 3/9/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "GameState.h"
#import "SpriteShip.h"
#import "LayerOrbital.h"
#import "Ship.h"
#import "GameState.h"
#import "Orbital.h"
#import "Region.h"
#import "SelectionQueue.h"

enum TOUCH_STATE {
	TOUCH_STATE_WAIT_FOR_ROLL,
	TOUCH_STATE_PLACE_SHIPS,
	TOUCH_STATE_GAME_OVER,
};

enum TOUCH_OBJECT {
	UNKNOWN_CLASS,
	SHIP_CLASS,
	ORBITAL_CLASS,
	REGION_CLASS,
};

@class SceneGameOver;

@interface GameTouchManager : NSObject {
	int touchState;
	SelectionQueue* currentQueue;
}

-(void) touchOrbital:(Orbital*)orbital;
-(void) queueSelections:(SelectionQueue*)queue;
-(bool) queueIsActive;
-(void) cancelQueue;
-(QueuedSelection*) currentSelection;
-(SelectionQueue*) currentQueue;

-(bool) canUndo;
-(void) undoQueue;

-(void)nextPlayer:(NSNotification *) notification;

-(NSString*) hintText;

@end
