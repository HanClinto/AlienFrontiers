//
//  SceneStartGame.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/27/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SceneOptions.h"
#import "SceneMainMenuiPad.h"
#import "GameEvents.h"
#import "CCUIViewWrapper.h"
#import "GameSoundManager.h"
#import "GamePrefs.h"

@implementation SceneOptions

// Semi-Singleton: you can access SceneOptions only as long as it is the active scene.
static SceneOptions* sceneOptionsInstance;

+(SceneOptions*) sharedScene
{
	NSAssert(sceneOptionsInstance != nil, @"sceneOptionsInstance not available!");
	return sceneOptionsInstance;
}

+(id) scene
{
	CCScene* scene = [CCScene node];
	SceneOptions* layer = [SceneOptions node];
	[scene addChild:layer];
	return scene;
}

-(id) init
{
	if ((self = [super init]))
	{
        sceneOptionsInstance = self;
    }
	
	return self;
}

-(void) initChildren
{
    CGSize winSize = [[CCDirector sharedDirector] winSize];
    int halfWinWidth = winSize.width * 0.5;

    // This adds a solid color background.
    CCLayerColor* colorLayer = [CCLayerColor layerWithColor:ccc4(0, 0, 51, 255)];
    [self addChild:colorLayer z:OptionsLayerTagColorBG tag:OptionsLayerTagColorBG];
    
    CCSprite* bg = [CCSprite spriteWithFile:@"af_ipad_gui_bg.png"];
    [bg setAnchorPoint:ccp(0,0)];
    [self addChild:bg z:OptionsLayerTagBG tag:OptionsLayerTagBG];
    
    //		colorLayer = [CCLayerColor layerWithColor:ccc4(255, 255, 255, 51)];
    //		[self addChild:colorLayer z:OptionsLayerTagWhiteout tag:OptionsLayerTagWhiteout];
    
    CCSprite* title = [CCSprite spriteWithFile:@"af_title.png"];
    [title setPosition:ccp(halfWinWidth, 900)];
    [self addChild:title z:OptionsLayerTagTitle tag:OptionsLayerTagTitle];
    
    CCNode* backButton = [self buttonFromImage:@"menu_back.png" downImage:@"menu_back_pushed.png" selector:@selector(backButtonTapped:)];
    [backButton setPosition:ccp(100, 974)];
    [self addChild:backButton z:OptionsLayerTagButtonBack tag:OptionsLayerTagButtonBack];

    sfxButton = [self buttonFromImage:@"menu_button_blank.png"
                                           downImage:@"menu_button_blank_pushed.png"
                                            selector:@selector(sfxButtonTapped:)
                                               label:@"SOUND FX: ON"
                                            fontSize:16
                                           fontColor:ccBLACK];
    [sfxButton setPosition:ccp(384, 525)];
    [self addChild:sfxButton z:OptionsLayerTagButtonSfx tag:OptionsLayerTagButtonSfx];

    musicButton = [self buttonFromImage:@"menu_button_blank.png"
                                    downImage:@"menu_button_blank_pushed.png"
                                     selector:@selector(musicButtonTapped:)
                                        label:@"MUSIC: ON"
                                     fontSize:18
                                    fontColor:ccBLACK];
    [musicButton setPosition:ccp(384, 525 - 100)];
    [self addChild:musicButton z:OptionsLayerTagButtonMusic tag:OptionsLayerTagButtonMusic];
    
    colorblindButton = [self buttonFromImage:@"menu_button_blank.png"
                              downImage:@"menu_button_blank_pushed.png"
                               selector:@selector(colorblindButtonTapped:)
                                  label:@"NORM GREEN DICE"
                               fontSize:12
                              fontColor:ccBLACK];
    [colorblindButton setPosition:ccp(384, 525 - 200)];
    [self addChild:colorblindButton z:OptionsLayerTagButtonColorblind tag:OptionsLayerTagButtonColorblind];
    
    [self updateCaptionLabels];
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
    
    
    if ([[GamePrefs instance] colorBlindMode])
    {
        [self setButtonLabel:colorblindButton to:NSLocalizedString(@"ALT GREEN DICE", @"Game menu colorblind option on")];
    }
    else
    {
        [self setButtonLabel:colorblindButton to:NSLocalizedString(@"NORM GREEN DICE", @"Game menu colorblind option on")];
    }
    
}

static int stackCount = 0;

-(void) onEnter
{
    stackCount += 1;
    
    [super onEnter];
}


-(void) dealloc
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// The Layer will be gone now, to avoid crashes on further access it needs to be nil.
	if (sceneOptionsInstance == self)
        sceneOptionsInstance = nil;
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


-(void) colorblindButtonTapped:(id)sender
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    [[GamePrefs instance] setColorBlindMode:(![[GamePrefs instance] colorBlindMode])];
    
    [self updateCaptionLabels];
}

- (void)backButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    //    [[CCDirector sharedDirector] replaceScene:[SceneMainMenuiPad scene]];
    //    [self goToPage:3];
    
    if (stackCount >= 1)
    {
        stackCount--;
        [[CCDirector sharedDirector] popScene];
    }
    
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
}

@end
