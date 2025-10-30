//
//  GameLayer.m
//  ScenesAndLayers
//
//  Created by Steffen Itterheim on 28.07.10.
//  Copyright 2010 Steffen Itterheim. All rights reserved.
//

#import "LayerGameBoard.h"
#import "SceneGameiPad.h"
#import "LayerGameMenu.h"

@interface LayerGameBoard (PrivateMethods)
-(void) updateView;
@end


@implementation LayerGameBoard

-(id) init
{
	if ((self = [super init]))
	{
		self.touchEnabled = YES;

		gameLayerPosition = self.position;

		CCSprite* gameBG = [CCSprite spriteWithFile:@"af_ipad_board.png"];
		gameBG.position = ccp( [gameBG texture].contentSize.width * 0.5 - 54, [gameBG texture].contentSize.height * 0.5);
		[self addChild:gameBG z:1 tag:GameBoardLayerTagBoard];
		
		/*
		CCSprite* background = [CCSprite spriteWithFile:@"grass.png"];
		background.position = CGPointMake(screenSize.width / 2, screenSize.height / 2);
		[self addChild:background];
		
		CCLabelTTF* label = [CCLabelTTF labelWithString:@"GameLayer" fontName:@"Marker Felt" fontSize:44];
		label.color = ccBLACK;
		label.position = CGPointMake(screenSize.width / 2, screenSize.height / 2);
		label.anchorPoint = CGPointMake(0.5f, 1);
		[self addChild:label];
		
		[self addRandomThings];
		 */
        
        self.touchEnabled = YES;
	}
    
	return self;
}


-(void) onEnter
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(orientationChanged:) name:EVENT_ORIENTATION_CHANGED object:nil];
    
    [super onEnter];
}

-(void) onExit
{
	[[NSNotificationCenter defaultCenter] removeObserver:self];
    
    [super onExit];
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
    
	CCSprite* gameBG = (CCSprite*) [self getChildByTag:GameBoardLayerTagBoard];
	NSAssert([gameBG isKindOfClass:[CCSprite class]], @"gameBG is not a CCSprite");
	
    if (UIDeviceOrientationIsLandscape(deviceOrientation))
	{
		[gameBG stopAllActions];

		// Move the game board
		[gameBG setPosition:CGPointMake([gameBG texture].contentSize.width * 0.5, 1024 * 0.5 - 196)];

//		[orbitalsLayer setPosition:ccp(54, 196)];
		
		//		CCMoveTo* move = [CCMoveTo actionWithDuration:0.25 position:CGPointMake([gameBG texture].contentSize.width * 0.5, [CCDirector sharedDirector].winSize.height * 0.5 - 68)];
		//ease = [CCEaseSineInOut actionWithAction:move];
//		[gameBG runAction:move];

		
	} else //if (UIDeviceOrientationIsPortrait(deviceOrientation))
    {
		[gameBG stopAllActions];
		
		// Move the game board
		[gameBG setPosition:CGPointMake([gameBG texture].contentSize.width * 0.5 - 54, [gameBG texture].contentSize.height * 0.5)];
		
//		[orbitalsLayer setPosition:ccp(0,0)];
		
//		CCMoveTo* move = [CCMoveTo actionWithDuration:0.25 position:CGPointMake([gameBG texture].contentSize.width * 0.5 - 54, [gameBG texture].contentSize.height * 0.5)];
		//ease = [CCEaseSineInOut actionWithAction:move];
//		[gameBG runAction:move];
	}

}




-(void) registerWithTouchDispatcher
{
	[[[CCDirector sharedDirector] touchDispatcher] addTargetedDelegate:self priority:-1 swallowsTouches:YES];
}

- (BOOL)ccTouchBegan:(UITouch *)touch withEvent:(UIEvent *)event 
{
    CCSprite* gameBG = (CCSprite*) [self getChildByTag:GameBoardLayerTagBoard];
	
	CGPoint location = [self convertTouchToNodeSpace: touch];
    
	CCLOG(@"Testing board regions for touch at (%f, %f), [%f, %f]", location.x, location.y, gameBG.position.x, gameBG.position.y);
	
	location = ccp(gameBG.position.x - location.x, location.y - gameBG.position.y);
	
	CGPoint boardCenter = ccp(77, 68);
//	CGPoint boardCenter = ccp(460, 600);
//	CGPoint boardCenter = ccp(380, 580);
//	CGPoint boardCenter = ccp(380 - [gameBG position].x, 580 - [gameBG position].y);
	
	CGPoint delta = ccp(location.x - boardCenter.x, location.y - boardCenter.y);
	
	double r = sqrt(delta.x * delta.x + delta.y * delta.y);
	double theta = atan2(-delta.x, delta.y);
	if (theta < 0)
		theta += 6.2832;
	
	CCLOG(@"Delta is (%f,%f), r is (%f), theta is (%f)", delta.x, delta.y, r, theta);
	
	if (r < 210) // Outer radius diameter of planet circle
	{
		if (r < 81) // Inner radius of Burroughs Desert
		{
			[[GameState sharedGameState] postEvent:EVENT_ITEM_TOUCHED object:[GameState sharedGameState].burroughsDesert];
		}
		else {
//			double theta = atan2(delta.x, delta.y); 

			int slice = ((((int) (theta * 1.114085542671068)) + 7) % 7); // (r / (2 * 3.14159 / 7));
			
			switch (slice) {
				case 6: 
					[[GameState sharedGameState] postEvent:EVENT_ITEM_TOUCHED object:[GameState sharedGameState].lemBadlands];
					break;
				case 5: 
					[[GameState sharedGameState] postEvent:EVENT_ITEM_TOUCHED object:[GameState sharedGameState].herbertValley];
					break;
				case 4: 
					[[GameState sharedGameState] postEvent:EVENT_ITEM_TOUCHED object:[GameState sharedGameState].asimovCrater];
					break;
				case 3: 
					[[GameState sharedGameState] postEvent:EVENT_ITEM_TOUCHED object:[GameState sharedGameState].bradburyPlateau];
					break;
				case 2: 
					[[GameState sharedGameState] postEvent:EVENT_ITEM_TOUCHED object:[GameState sharedGameState].vanVogtMountains];
					break;
				case 1: 
					[[GameState sharedGameState] postEvent:EVENT_ITEM_TOUCHED object:[GameState sharedGameState].pohlFoothills];
					break;
				case 0:
					// TODO: Error case on default?
					[[GameState sharedGameState] postEvent:EVENT_ITEM_TOUCHED object:[GameState sharedGameState].heinleinPlains];
					break;
			}
		}
	}

	return false;
}


@end
