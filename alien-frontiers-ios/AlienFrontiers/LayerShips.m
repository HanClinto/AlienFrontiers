//
//  LayerShips.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/12/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerShips.h"
#import "SceneGameiPad.h"
#import "LayerGameBoard.h"


@implementation LayerShips

-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	if ((self = [super init]))
	{
		CCSpriteFrameCache* frameCache = [CCSpriteFrameCache sharedSpriteFrameCache];
		[frameCache addSpriteFramesWithFile:@"karim_dice_sm.plist"];
		
		// Subscribe for new ship events (adding / subtracting)
		
		// Subscribe for touch events
		self.touchEnabled = true;
	}
	return self;
}

-(void) onEnter
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	self.touchEnabled = true;
	
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(shipActivate:) name:EVENT_SHIP_ACTIVATE object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshState:) name:EVENT_STATE_RELOAD object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(orientationChanged:) name:EVENT_ORIENTATION_CHANGED object:nil];
	
	[self createAllShips];

	[super onEnter];
}

-(void) onExit
{
    // TOOD: Remove all event handlers here?
    
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	[[NSNotificationCenter defaultCenter] removeObserver:self];

	self.touchEnabled = false;

//	[self removeAllChildrenWithCleanup:true]; // Handled by AFLayer
	
	[super onExit];
}


-(void) createAllShips
{
//	for (CCSprite *sprite in [self children])
//	{
//		[self removeChild:sprite cleanup:true];
//		//[sprite release];
//	}
	
	int playerCnt = 0;
	int shipCnt = 0;
	SpriteShip* sprite;
    
	// Add all of the currently existing ships
	for (Player* player in [[GameState sharedGameState] players])
	{
		playerCnt++;
		shipCnt = 0;
		for (Ship* ship in player.allShips.array)
		{
			shipCnt++;
			CCLOG(@"Adding a SpriteShip for a ship (%@)", ship);
			sprite = [[SpriteShip alloc] initSpriteWithShip:ship];
			sprite.anchorPoint = CGPointMake(0.5f, 0.5f);
			sprite.scale = 0.8;
			
			// TODO: Locate the correct position of where this ship should be.
			[sprite snapToTargetPosition];
			
			if (ship.active || ship.isArtifactShip)
			{
				sprite.visible = true;
			} else {
				sprite.visible = false;
			}

//			sprite.position = ccp(200 + shipCnt * 50, 768 - playerCnt * 50);
			
			[self addChild:sprite];
		}
	}
    
    Ship* ship = [[GameState sharedGameState] artifactShip];
    
    sprite = [[SpriteShip alloc] initSpriteWithShip:ship];
    sprite.anchorPoint = CGPointMake(0.5f, 0.5f);
    sprite.scale = 0.8;
    
    // TODO: Locate the correct position of where this ship should be.
    [sprite snapToTargetPosition];
    
    sprite.visible = true;
    
    [self addChild:sprite];
}


-(void) registerWithTouchDispatcher
{
	[[[CCDirector sharedDirector] touchDispatcher] addTargetedDelegate:self priority:-1 swallowsTouches:YES];
}

- (BOOL)ccTouchBegan:(UITouch *)touch withEvent:(UIEvent *)event 
{
    if ([[SceneGameiPad sharedLayer] currentModalWindow] != ModalWindowNone)
        return false;
    
	CGPoint location = [self convertToWorldSpace:[self convertTouchToNodeSpace: touch]];
	CCLOG(@"Testing ships for touch: %@", self);
	
	for (SpriteShip *ship in [self children])
	{
		if (ship.ship.active)
		{
			if (CGRectContainsPoint(ship.hitRect, [ship convertToNodeSpace:location]))
			{
				[[NSNotificationCenter defaultCenter]
				postNotificationName:EVENT_ITEM_TOUCHED
				object:ship.ship ];
				
				//return true;
				return false; // Always return false, so that we can still select objects underneath the ship (such as a region, or dock) if we need to.
			}
		}
	}
	
	return false;
}

-(void) ccTouchEnded:(UITouch*)touch withEvent:(UIEvent *)event
{
	
}

-(void) shipActivate:(NSNotification *) notification
{
	Ship* ship = (Ship*) [notification object];
	
	SpriteShip* sprite = [self findSpriteByShip:ship];
	//	SpriteShip* sprite = [[SpriteShip alloc] spriteWithShip:ship];
	
	sprite.position = ccp(-50, 500);
	sprite.visible = (ship.active || ship.isArtifactShip);
	[sprite glideToTargetPosition];
}

-(void) refreshState:(NSNotification *) notification
{
	for (SpriteShip *sprite in [self children])
	{
		sprite.visible = (sprite.ship.active || sprite.ship.isArtifactShip);
		[sprite glideToTargetPosition];
	}
}

-(SpriteShip*) findSpriteByShip:(Ship*)ship
{
	for (SpriteShip *sprite in [self children])
	{
		if (sprite.ship == ship)
		{
			return sprite;
		}
	}
	
	// TODO: Throw exception
//	assert(false, "Cannot find sprite for ship %@!", ship);
	
	return nil;
}

- (void)orientationChanged:(NSNotification *)notification
{
    [self performSelector:@selector(updateView) withObject:nil afterDelay:0];
}

- (void)updateView
{
    UIDeviceOrientation deviceOrientation = [UIDevice currentDevice].orientation;
    
#ifdef IGNORE_LANDSCAPE
    if (UIDeviceOrientationIsLandscape(deviceOrientation))
        deviceOrientation = UIDeviceOrientationUnknown;
#endif
    
	CCLayer* gameLayer = [SceneGameiPad gameLayer];
	CCSprite* gameBG = (CCSprite*) [gameLayer getChildByTag:GameBoardLayerTagBoard];
	NSAssert([gameBG isKindOfClass:[CCSprite class]], @"gameBG is not a CCSprite");
	
    if (UIDeviceOrientationIsLandscape(deviceOrientation))
	{
		// Move the dice to match the game board
		[self setPosition:ccp(54, -196)];
//		[self setPosition:CGPointMake([gameBG texture].contentSize.width * 0.5, 768 * 0.5 - 68)];
	} else if (UIDeviceOrientationIsPortrait(deviceOrientation)){
		// Move the dice to match the game board
		[self setPosition:ccp(0,0)];
//		[self setPosition:CGPointMake([gameBG texture].contentSize.width * 0.5 - 54, [gameBG texture].contentSize.height * 0.5)];
	}
	
	for (SpriteShip* sprite in [self children])
	{
		[sprite glideToTargetPosition];
	}
	
}


@end
