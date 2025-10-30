//
//  SceneGameOver.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/2/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SceneGameOver.h"


@implementation SceneGameOver


// Semi-Singleton: you can access SceneMainMenu only as long as it is the active scene.
static SceneGameOver* sceneGameOverInstance;

+(SceneGameOver*) sharedScene
{
	NSAssert(sceneGameOverInstance != nil, @"SceneGameOver not available!");
	return sceneGameOverInstance;
}

+(id) scene
{
	CCScene* scene = [CCScene node];
	SceneGameOver* layer = [SceneGameOver node];
	[scene addChild:layer];
	return scene;
}

-(id) init
{
	if ((self = [super init]))
	{
//		NSAssert(sceneGameOverInstance == nil, @"another SceneGameOver is already in use!");
		sceneGameOverInstance = self;
		
		currentOrientation = UIDeviceOrientationPortrait;
		
		// This adds a solid color background.
		CCLayerColor* colorLayer = [CCLayerColor layerWithColor:ccc4(0, 0, 51, 255)];
		[self addChild:colorLayer z:GameOverLayerTagColorBG tag:GameOverLayerTagColorBG];
		
		CCSprite* bg = [CCSprite spriteWithFile:@"af_ipad_gui_bg.png"];
		[bg setAnchorPoint:ccp(0,0)];
		[self addChild:bg z:GameOverLayerTagBG tag:GameOverLayerTagBG];
		
		CCLabelTTF* title = [CCLabelTTF labelWithString:@"GAME OVER" 
											   fontName:@"DIN-Black" 
											   fontSize:48];
		title.color = ccWHITE;
		[title setPosition:ccp(384, 900)];
		[self addChild:title z:GameOverLayerTagTitle tag:GameOverLayerTagTitle];
		
		// TODO: Add statistics and whatnot here
		// Player scores
		// TODO: Sort these players by ending score
        
		for (int cnt = 0; cnt < [[GameState sharedGameState] numPlayers]; cnt++)
		{
			Player* player = [[GameState sharedGameState] playerByID:cnt];
			
			CCLabelTTF* playerScore = [CCLabelTTF labelWithString:[NSString stringWithFormat:@"Player %d: %d", cnt + 1, [player vps]]
														 fontName:@"DIN-Black" 
														 fontSize:48];
			
			playerScore.color = [player color];
			[playerScore setPosition:ccp(384, 725 - cnt * 75)];
			[self addChild:playerScore z:GameOverLayerTagScore1 + cnt tag:GameOverLayerTagScore1 + cnt];
		}
		
		CCNode* backButton = [self buttonFromImage:@"menu_back.png" 
										 downImage:@"menu_back_pushed.png" 
										  selector:@selector(backButtonTapped:)];
		[backButton setPosition:ccp(384, 325)];
		[self addChild:backButton z:GameOverLayerTagButtonBack tag:GameOverLayerTagButtonBack]; 
	}
	
	return self;
}

-(void) dealloc
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// The Layer will be gone now, to avoid crashes on further access it needs to be nil.
	if (sceneGameOverInstance == self)
        sceneGameOverInstance = nil;
}

- (void)backButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// TODO: Add a funky smooth transition here
	[[CCDirector sharedDirector] replaceScene:[SceneMainMenuiPad scene]];
}

@end
