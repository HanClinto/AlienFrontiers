//
//  OrbitalLayer.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/4/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerOrbital.h"
#import "SceneGameiPad.h"

@implementation LayerOrbital

- (LayerOrbital*) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
		docks = [[NSMutableArray alloc] init];
		dockPositions = malloc( sizeof(CGPoint) * [[self facility] numDockGroups] * [[self facility] numDocksPerGroup] );
	}
	
	return self;
}

-(void) dealloc
{
    free(dockPositions);
}

-(void) onEnter
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(diceUpdated:) name:EVENT_STATE_RELOAD object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(diceUpdated:) name:EVENT_SHIP_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(diceUpdated:) name:EVENT_SHIP_SELECTED object:nil];

    // Subscribe for touch events
    self.touchEnabled = true;

    [super onEnter];
}

- (void) onExit
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	[[NSNotificationCenter defaultCenter] removeObserver:self];
	
	[super onExit];
}

- (bool) canUseWithCurrentDice
{
	bool canUse = false;
	
	Player* player = [GameState sharedGameState].currentPlayer;
	
	if ([[self facility] isValidMoveFromPlayer:player selectedShips:player.selectedShips])
	{
		canUse = true;
	}
	else
	{
		ShipGroup* usableShips = [[self facility] usableShipsFromPlayer:player shipsInHand:player.undockedUnselectedShips selectedShips:player.selectedShips];
		
		canUse = (usableShips.count > 0);
	}
	
	return canUse;
}

- (void) diceUpdated:(NSNotification *) notification
{
	bool hilight = self.canUseWithCurrentDice;
	
	for (CCSprite* dock in docks)
	{
		[dock stopAllActions];
		
		CCTintTo* tint;
        
        ccColor3B color = hilight ? 
                            ccc3(255, 255, 255) : 
                            ccc3(100, 100, 100);
		
        if (dock.color.r == color.r ) // && // Optimization assumption: if the R's match, the others will too
//            dock.color.g == color.g &&
//            dock.color.b == color.b)
            continue;
            // break;  // Optimization assumption: If the first dock is the right color, the others will be too.
        
        tint = [CCTintTo actionWithDuration:0.25 red:color.r green:color.g blue:color.b];

		[dock runAction:tint];
	}
}

-(void) registerWithTouchDispatcher
{
	[[[CCDirector sharedDirector] touchDispatcher] addTargetedDelegate:self priority:-1 swallowsTouches:YES];
}

- (BOOL)ccTouchBegan:(UITouch *)touch withEvent:(UIEvent *)event 
{
    if ([[SceneGameiPad sharedLayer] currentModalWindow] != ModalWindowNone)
        return false;
    
	CGPoint location = [self convertTouchToNodeSpace: touch];
	
	if (CGRectContainsPoint(self.childBounds, location))
	{
		// Fire event...
		[[NSNotificationCenter defaultCenter]
		 postNotificationName:EVENT_ITEM_TOUCHED
		 object:[self facility]];

		//return true;
		return false;
	}
	
	return false;
}

-(void) ccTouchEnded:(UITouch*)touch withEvent:(UIEvent *)event
{
	
}


-(Orbital*) facility
{
	return nil;
}

-(CGPoint) findPositionByDock:(DockingBay *)dock
{
	int dockIndex = [dock index];
	CGPoint pt = dockPositions[dockIndex];
	
	return [self convertToWorldSpace:pt];
//	return ((CGPoint) [dockPositions objectAtIndex:dockIndex]);
	/*
	int numDocks = [docks count];
	int ratio = ([[self facility] numDocksPerGroup] * [[self facility] numDockGroups]) / numDocks;
	
	int targetSpriteIndex = dockIndex / ratio;
	int spriteIndexOffset = dockIndex % ratio;
	
	CCSprite* targetSprite = [docks objectAtIndex:targetSpriteIndex];
	
	float midIndex = 1 + (ratio - 1) * 0.5;
	
	CCLOG(@"FindPositionByDock: %d, %d, %f", [targetSprite position].x, spriteIndexOffset, midIndex);
	
	CGPoint retVal = ccp([targetSprite position].x - ((float)spriteIndexOffset - midIndex) * 26 , [targetSprite position].y);
	
	CCLOG(@"Dock position #1: %f", [targetSprite position].x + (((float)spriteIndexOffset - midIndex) * 26));
	CCLOG(@"Dock position #2: %f", [targetSprite position].x - (((float)spriteIndexOffset - midIndex) * 26));
	
	
	return [self convertToWorldSpace:retVal];
	 //*/
}

@end
