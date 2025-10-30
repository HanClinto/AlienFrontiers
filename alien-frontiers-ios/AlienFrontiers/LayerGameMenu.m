//
//  LayerGameMenu.m
//  ScenesAndLayers
//
//  Created by Raymond Cook on 5.11.2011.
//  Copyright 2011 HANCLINTO GAMES. All rights reserved.
//

#import "LayerGameMenu.h"
#import "SceneGameiPad.h"
#import "LayerGameBoard.h"
#import "SceneMainMenuiPad.h"
#import "cocos2d.h"
#import "GamePrefs.h"
#import "GameSoundManager.h"

@interface LayerGameMenu (PrivateMethods)
-(void) updateView;
@end

#undef SHOW_FEEDBACK_BTN

@implementation LayerGameMenu

-(id) init
{
	if ((self = [super init]))
	{
        
	}
	return self;
}

-(void) initChildren
{
    self.touchEnabled = NO;
    self.visible = NO;
    
    resumeButton = [self buttonFromImage:@"menu_button_blank.png" downImage:@"menu_button_blank_pushed.png" selector:@selector(resumeButtonTapped:) label:NSLocalizedString(@"RESUME", @"Game menu resume button label") fontSize:12];
    [self addChild:resumeButton z:MenuLayerTagButtonResume tag:MenuLayerTagButtonResume];
    
    quitButton = [self buttonFromImage:@"menu_button_blank.png" downImage:@"menu_button_blank_pushed.png" selector:@selector(quitButtonTapped:) label:NSLocalizedString(@"QUIT", @"Game menu quit button label") fontSize:12];
    [self addChild:quitButton z:MenuLayerTagButtonQuit tag:MenuLayerTagButtonQuit];
    
    sfxButton = [self buttonFromImage:@"menu_button_blank.png" downImage:@"menu_button_blank_pushed.png" selector:@selector(sfxButtonTapped:) label:NSLocalizedString(@"SOUND FX: ON", @"Game menu sound effects on") fontSize:12];
    [self addChild:sfxButton z:MenuLayerTagButtonSFX tag:MenuLayerTagButtonSFX];
    
    musicButton = [self buttonFromImage:@"menu_button_blank.png" downImage:@"menu_button_blank_pushed.png" selector:@selector(musicButtonTapped:) label:NSLocalizedString(@"MUSIC: ON", @"Game menu music on") fontSize:12];
    [self addChild:musicButton z:MenuLayerTagButtonMusic tag:MenuLayerTagButtonMusic];
    
#ifdef SHOW_FEEDBACK_BTN
    feedbackButton = [self buttonFromImage:@"menu_button_blank.png" downImage:@"menu_button_blank_pushed.png" selector:@selector(feedbackButtonTapped:) label:NSLocalizedString(@"FEEDBACK", @"Game menu feedback button label") fontSize:12];
    [self addChild:feedbackButton z:MenuLayerTagButtonFeedback tag:MenuLayerTagButtonFeedback];
#endif
    
    backgroundLayer = [CCLayerColor layerWithColor:ccc4(0, 0, 0, 128)];
    [self addChild: backgroundLayer];

    [self updateCaptionLabels];
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
    resumeButton = nil;
    quitButton = nil;
}

-(void) activate 
{
    //NSLog(@"TOUCH ENABLED : @:", [SceneGameiPad gameLayer].isTouchEnabled?@"YES":@"NO");
    [SceneGameiPad gameLayer].touchEnabled = NO;
    
    [backgroundLayer setOpacity:0];
    self.visible = YES;
    //self.isTouchEnabled = YES;
    [backgroundLayer runAction:[CCFadeTo actionWithDuration:0.5f opacity:192]];
    
    [self updateCaptionLabels];

    [self slideInButton:resumeButton atIndex:0];
    [self slideInButton:sfxButton atIndex:1];
    [self slideInButton:musicButton atIndex:2];
#ifdef SHOW_FEEDBACK_BTN
    [self slideInButton:feedbackButton atIndex:3];
#endif
    [self slideInButton:quitButton atIndex:4];
    
    /*
    [resumeButton setPosition:ccp(-halfWinWidth - resumeButton.contentSize.width * 0.5, winSize.height * 0.5 + 100)];
    CCSequence *resumeButtonSlideIn = [CCEaseElasticInOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: CGPointMake(halfWinWidth, resumeButton.position.y)] period: 0.8f];
    [resumeButton runAction:resumeButtonSlideIn];

    [quitButton setPosition:ccp(-halfWinWidth - quitButton.contentSize.width * 0.5, winSize.height * 0.5)];
    CCSequence *quitButtonSlideIn = [CCSequence actions:
                                      [CCDelayTime actionWithDuration:0.1f],
                                      [CCEaseElasticInOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: CGPointMake(halfWinWidth,quitButton.position.y)] period: 0.8f],
                                      nil];
    [quitButton runAction:quitButtonSlideIn];
     */
}

-(void) slideInButton:(CCNode*)node atIndex:(int)index
{
    CGSize winSize = [[CCDirector sharedDirector] winSize];
    int halfWinWidth = winSize.width * 0.5;

    const int buttonOffset = 100;
    const float delay = 0.1f;
    
    [node setPosition:ccp(-halfWinWidth - node.contentSize.width * 0.5, winSize.height * 0.5 + 200 - buttonOffset * index)];
    CCSequence *buttonSlideIn = [CCSequence actions:
                                    [CCDelayTime actionWithDuration:delay * index],
                                    [CCEaseElasticInOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: CGPointMake(halfWinWidth,node.position.y)] period: 0.8f],
                                    nil];
    [node runAction:buttonSlideIn];
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

-(void) resumeButtonTapped:(id)sender
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    [self deactivate];
}

-(void) updateCaptionLabels
{
    if ([[GamePrefs instance] volumeMusic] > 0)
    {
        [self setButtonLabel:musicButton to:NSLocalizedString(@"MUSIC: ON", @"Game menu music on")];
    }
    else
    {
        [self setButtonLabel:musicButton to:NSLocalizedString(@"MUSIC: OFF", @"Game menu music off")];
    }
    
    if ([[GamePrefs instance] volumeSfx] > 0)
    {
        [self setButtonLabel:sfxButton to:NSLocalizedString(@"SOUND FX: ON", @"Game menu sound effects on")];
    }
    else
    {
        [self setButtonLabel:sfxButton to:NSLocalizedString(@"SOUND FX: OFF", @"Game menu sound effects off")];
    }
    
}

-(void) sfxButtonTapped:(id)sender
{
    [[GamePrefs instance] setVolumeSfx:
     ([[GamePrefs instance] volumeSfx] > 0) ? 0 : 1];
    
    [[GameSoundManager sharedManager] usePreferences];
    [self updateCaptionLabels];

    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
}

-(void) musicButtonTapped:(id)sender
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    [[GamePrefs instance] setVolumeMusic:
     ([[GamePrefs instance] volumeMusic] > 0) ? 0 : 1];

    [[GameSoundManager sharedManager] usePreferences];
    [self updateCaptionLabels];
}

#ifdef SHOW_FEEDBACK_BTN
-(void) feedbackButtonTapped:(id)sender
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    [TestFlight openFeedbackView];
}
#endif

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

#pragma mark - GCTurnBasedMatchHelperDelegate

-(void)enterNewGame:(GKTurnBasedMatch *)match {
    NSLog(@"Entering new game...");
    
    GameState* newState = [[GameState alloc] initWith:[[match participants] count] p1:AI_TYPE_HUMAN p2:AI_TYPE_HUMAN p3:AI_TYPE_HUMAN p4:AI_TYPE_HUMAN];
    
    for (int cnt = 0; cnt < [[match participants] count]; cnt++)
    {
        GKTurnBasedParticipant* party = (GKTurnBasedParticipant*) [[match participants] objectAtIndex:cnt];
        
        [[newState playerByID:cnt] setGcPlayerID:[party playerID]];
    }
    
    [GameState setActiveState:newState];
}

-(void)takeTurn:(GKTurnBasedMatch *)match {
    NSLog(@"Taking turn for existing game from within game...");
    
    GameState* loadedState = [GameState restoreFromState:[match matchData]];
    
    [GameState setActiveState:loadedState];
}



@end

