//
//  iPadGameScene.m
//  AlienFrontiers
//
//  Created by Clint Herron on 1/18/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "iPadGameSceneOld.h"


@implementation iPadGameSceneOld

CCSprite *gameBG;
CCSprite *activePlayerHUD_Port;
CCSprite *activePlayerHUD_Land;
CCMenu *rollButtonMenu;

+(id) scene
{
	CCScene *scene = [CCScene node];
	CCLayer* layer = [iPadGameSceneOld node];
	[scene addChild:layer];
	return scene;
}

-(id) init
{
	if (self = [super init])
	{
		CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
		
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(orientationChanged:) name:@"UIDeviceOrientationDidChangeNotification" object:nil];
		
		// Create the game board
		gameBG = [CCSprite spriteWithFile:@"af_ipad_board.png"];
//		gameBG.position = ccp( [gameBG texture].contentSize.width * 0.5 + 256, [gameBG texture].contentSize.height * 0.5);
		gameBG.position = ccp( [gameBG texture].contentSize.width * 0.5 - 54, [gameBG texture].contentSize.height * 0.5);
		[self addChild:gameBG];
		
		// Add the current player's HUD
		activePlayerHUD_Port = [CCSprite spriteWithFile:@"af_ipad_menu_lg_red.png"];
		activePlayerHUD_Port.position = ccp( [CCDirector sharedDirector].winSize.width * 0.5, -[activePlayerHUD_Port texture].contentSize.height * 0.5);
		[self addChild:activePlayerHUD_Port];
		
		activePlayerHUD_Land = [CCSprite spriteWithFile:@"af_ipad_menu_land_lg_red.png"];
//		activePlayerHUD_Land.position = ccp( [CCDirector sharedDirector].winSize.width - [activePlayerHUD_Land texture].contentSize.width * 0.5 + 19, [activePlayerHUD_Land texture].contentSize.height * 0.5);
		activePlayerHUD_Land.position = ccp( [CCDirector sharedDirector].winSize.width + [activePlayerHUD_Land texture].contentSize.height * 0.5, [activePlayerHUD_Land texture].contentSize.height * 0.5);
		[self addChild:activePlayerHUD_Land];
		
		
		// Slide in the menu
//		CCLayer* activePlayerHUD = [CCLayer];
		
		CCMoveTo* move = [CCMoveTo actionWithDuration:2 position:CGPointMake([CCDirector sharedDirector].winSize.width * 0.5, [activePlayerHUD_Port texture].contentSize.height * 0.5 - 19)];
//		CCEaseBounceOut* ease = [CCEaseBounceOut actionWithAction:move];
		CCActionEase* ease = [CCEaseBounceOut actionWithAction:move];
		[activePlayerHUD_Port runAction:ease];
		
		CCMenuItem* rollButton = [CCMenuItemImage itemWithNormalImage:@"af_ipad_button_roll.png" selectedImage:@"af_ipad_button_roll_selected.png"
															  target:self
															selector:@selector(rollButtonTapped:)
								 ];
		
		
		rollButtonMenu = [CCMenu menuWithItems:rollButton, nil];
		rollButtonMenu.position = ccp( 0, 0 ); // activePlayerHUD.position.x + 261,
									   //activePlayerHUD.position.y - 30 );
		
		[activePlayerHUD_Port addChild:rollButtonMenu];
		
	}
	
	return self;
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
    
    if (UIDeviceOrientationIsLandscape(deviceOrientation))
	{
		[activePlayerHUD_Port stopAllActions];
		[activePlayerHUD_Land stopAllActions];
		[gameBG stopAllActions];
		
		// Move the portrait HUD
		CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:CGPointMake(activePlayerHUD_Port.position.x, -[activePlayerHUD_Port texture].contentSize.height * 0.5)];
		CCActionEase* ease = [CCEaseSineIn actionWithAction:move];
		[activePlayerHUD_Port runAction:ease];
		
		// Move the landscape HUD
//		move = [CCMoveTo actionWithDuration:1.25 position:CGPointMake([CCDirector sharedDirector].winSize.width - [activePlayerHUD_Land texture].contentSize.width * 0.5 + 19, [activePlayerHUD_Land texture].contentSize.height * 0.5)];
//		ease = [CCEaseBounceOut actionWithAction:move];
		move = [CCMoveTo actionWithDuration:0.5 position:CGPointMake([CCDirector sharedDirector].winSize.width - [activePlayerHUD_Land texture].contentSize.width * 0.5 + 19, [activePlayerHUD_Land texture].contentSize.height * 0.5)];
		ease = [CCEaseSineOut actionWithAction:move];
		[activePlayerHUD_Land runAction:ease];		
		
		
		// Move the game board
		move = [CCMoveTo actionWithDuration:0.25 position:CGPointMake([gameBG texture].contentSize.width * 0.5, [CCDirector sharedDirector].winSize.height * 0.5 - 68)];
		//ease = [CCEaseSineInOut actionWithAction:move];
		[gameBG runAction:move];

	} else if (UIDeviceOrientationIsPortrait(deviceOrientation)){
		[activePlayerHUD_Port stopAllActions];
		[activePlayerHUD_Land stopAllActions];
		[gameBG stopAllActions];

		// Move the portrait HUD
//		CCMoveTo* move = [CCMoveTo actionWithDuration:1.25 position:CGPointMake(activePlayerHUD_Port.position.x, [activePlayerHUD_Port texture].contentSize.height * 0.5 - 19)];
//		CCActionEase* ease = [CCEaseBounceOut actionWithAction:move];
		CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:CGPointMake(activePlayerHUD_Port.position.x, [activePlayerHUD_Port texture].contentSize.height * 0.5 - 19)];
		CCActionEase* ease = [CCEaseSineOut actionWithAction:move];
		[activePlayerHUD_Port runAction:ease];		
		
		// Move the landscape HUD
		move = [CCMoveTo actionWithDuration:0.5 position:CGPointMake([CCDirector sharedDirector].winSize.height + [activePlayerHUD_Land texture].contentSize.width * 0.5, [activePlayerHUD_Land texture].contentSize.height * 0.5)];
		ease = [CCEaseSineIn actionWithAction:move];
		[activePlayerHUD_Land runAction:ease];
		

		// Move the game board
		move = [CCMoveTo actionWithDuration:0.25 position:CGPointMake([gameBG texture].contentSize.width * 0.5 - 54, [gameBG texture].contentSize.height * 0.5)];
		//ease = [CCEaseSineInOut actionWithAction:move];
		[gameBG runAction:move];
	}
	
	/*
    UIDeviceOrientation deviceOrientation = [UIDevice currentDevice].orientation;
    if (UIDeviceOrientationIsLandscape(deviceOrientation) && !isShowingLandscapeView)
	{
        [self presentModalViewController:self.landscapeViewController animated:YES];
        isShowingLandscapeView = YES;
    }
	else if (deviceOrientation == UIDeviceOrientationPortrait && isShowingLandscapeView)
	{
        [self dismissModalViewControllerAnimated:YES];
        isShowingLandscapeView = NO;
    }    
	 */
}

- (void)rollButtonTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
//    [_label setString:@"Last button: *"];
}

@end
