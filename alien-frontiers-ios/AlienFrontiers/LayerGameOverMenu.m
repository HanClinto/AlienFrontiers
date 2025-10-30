//
//  LayerGameMenu.m
//  ScenesAndLayers
//
//  Created by Raymond Cook on 5.11.2011.
//  Copyright 2011 HANCLINTO GAMES. All rights reserved.
//

#import "LayerGameOverMenu.h"
#import "SceneGameiPad.h"
#import "LayerGameBoard.h"
#import "SceneMainMenuiPad.h"
#import "cocos2d.h"

@interface LayerGameOverMenu (PrivateMethods)
-(void) updateView;
@end


@implementation LayerGameOverMenu

-(id) init
{
	if ((self = [super init]))
	{
		self.touchEnabled = NO;
        self.visible = NO;
        
        quitButton = [self buttonFromImage:@"menu_button_blank.png" downImage:@"menu_button_blank_pushed.png" selector:@selector(quitButtonTapped:) label:NSLocalizedString(@"GAME OVER", @"Game over quit button label") fontSize:12];
		[self addChild:quitButton z:GameOverMenuLayerTagButtonQuit tag:GameOverMenuLayerTagButtonQuit];
        
        backgroundLayer = [CCLayerColor layerWithColor:ccc4(0, 0, 0, 48)];
        [self addChild: backgroundLayer];
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


-(void) dealloc
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
    backgroundLayer = nil;
    quitButton = nil;
}

-(void) activate 
{
    //NSLog(@"TOUCH ENABLED : @:", [SceneGameiPad gameLayer].isTouchEnabled?@"YES":@"NO");
    [SceneGameiPad gameLayer].touchEnabled = NO;
    
    CGSize winSize = [[CCDirector sharedDirector] winSize];
    int halfWinWidth = winSize.width * 0.5;
    
    [backgroundLayer setOpacity:0];
    self.visible = YES;
    //self.isTouchEnabled = YES;
    [backgroundLayer runAction:[CCFadeTo actionWithDuration:0.5f opacity:0xA0]];
    
    [quitButton setPosition:ccp(-halfWinWidth - quitButton.contentSize.width * 0.5, winSize.height * 0.5 - 450)];
    CCSequence *quitButtonSlideIn = [CCSequence actions:
                                     [CCDelayTime actionWithDuration:0.1f],
                                     [CCEaseElasticInOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: CGPointMake(halfWinWidth,quitButton.position.y)] period: 0.8f],
                                     nil];
    [quitButton runAction:quitButtonSlideIn];
    
    
    NSArray* sortedPlayers = [[GameState sharedGameState] winningPlayers];
    
    Player* player = (Player*) [sortedPlayers objectAtIndex:0];
    
    CCLabelTTF* label = [CCLabelTTF labelWithString:[NSString stringWithFormat:NSLocalizedString(@"Congratulations, Player %d!!!", @"Game over winner congratulations"), [player playerIndex] + 1] fontName:@"DIN-Black" fontSize:48];
    
    label.color = ccc3(0xFF, 0xC2, 0x00);
    [label setPosition:ccp(384, 925)];
    [self addChild:label z:GameOverMenuLayerTagCongrats tag:GameOverMenuLayerTagCongrats];
    
    for (int cnt = 0; cnt < [sortedPlayers count]; cnt++)
    {
        player = (Player*) [sortedPlayers objectAtIndex:cnt];
        
        CCLabelTTF* playerScore = [CCLabelTTF labelWithString:[NSString stringWithFormat:NSLocalizedString(@"Player %d: %d", @"Game over player number, score"), [player playerIndex] + 1, [player vps]]
                                                     fontName:@"DIN-Black"
                                                     fontSize:48];
        
        playerScore.color = [player color];
        [playerScore setPosition:ccp(384, 850 - cnt * 75)];
        [self addChild:playerScore z:GameOverMenuLayerTagScore1 + cnt tag:GameOverMenuLayerTagScore1 + cnt];
    }
    
    
    // Log window
    gameStats = [[UITextView alloc] init];
    [gameStats setEditable:false];
    [gameStats setFont:[UIFont fontWithName:@"DIN-Black" size:24]];
    gameStats.backgroundColor = [UIColor clearColor];
    gameStats.textColor = [UIColor whiteColor];
    
	// If you like it, then you should put a wrapper on it
	CCUIViewWrapper* wrapper = [CCUIViewWrapper wrapperForUIView:gameStats];
    wrapper.contentSize = CGSizeMake(768 - 200, 480);
    wrapper.position = ccp(100 + wrapper.contentSize.width * 0.5,
                           1024 * 0.5 + 60 - wrapper.contentSize.height * 0.5);
	[self addChild:wrapper z:GameOverMenuLayerTagStats tag:GameOverMenuLayerTagStats];
    
    NSString* endGameLog = [NSString stringWithFormat:@"Completed %d player game in %d turns.\n\nGame Log:\n%@",
                            [[GameState sharedGameState] numPlayers],
                            [[GameState sharedGameState] numTurns] + 1,
                            [[GameState sharedGameState] gameLog]];
    
    [gameStats setText:endGameLog];
}

-(void) deactivate
{
    [SceneGameiPad gameLayer].touchEnabled = YES;
    self.touchEnabled = NO;
    self.visible = NO;
}



- (void)orientationChanged:(NSNotification *)notification
{
    [self performSelector:@selector(updateView) withObject:nil afterDelay:0];
}

- (void)updateView
{
    UIDeviceOrientation deviceOrientation = [UIDevice currentDevice].orientation;

    CGSize s = [[CCDirector sharedDirector] winSize];
    [backgroundLayer setContentSize:s];
    
    if (UIDeviceOrientationIsLandscape(deviceOrientation))
	{
	} else if (UIDeviceOrientationIsPortrait(deviceOrientation)){
        
	}
    
}

-(void) quitButtonTapped:(id)sender
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

    [GameState clearGameStateFromPrefs];
    [[CCDirector sharedDirector] replaceScene:[SceneMainMenuiPad scene]];
}


-(void) registerWithTouchDispatcher
{
	[[[CCDirector sharedDirector] touchDispatcher] addTargetedDelegate:self priority:INT_MIN swallowsTouches:YES];
}

- (BOOL)ccTouchBegan:(UITouch *)touch withEvent:(UIEvent *)event 
{
	//CGPoint location = [self convertTouchToNodeSpace: touch];
    
	//CCLOG(@"Testing board regions for touch at (%f, %f), [%f, %f]", location.x, location.y, gameBG.position.x, gameBG.position.y);
    
	return false;
}


@end

