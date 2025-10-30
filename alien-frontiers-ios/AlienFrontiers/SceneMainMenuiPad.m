//
//  SceneMainMenu.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/25/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SceneMainMenuiPad.h"
#import "GCTurnBasedMatchHelper.h"

@implementation SceneMainMenuiPad

// Semi-Singleton: you can access SceneMainMenu only as long as it is the active scene.
static SceneMainMenuiPad* sceneMainMenuInstance;

+(SceneMainMenuiPad*) sharedScene
{
	NSAssert(sceneMainMenuInstance != nil, @"MultiLayerScene not available!");
	return sceneMainMenuInstance;
}

+(id) scene
{
	CCScene* scene = [CCScene node];
	SceneMainMenuiPad* layer = [SceneMainMenuiPad node];
    
	[scene addChild:layer];
	return scene;
}

-(id) init
{
	if ((self = [super init]))
	{
        sceneMainMenuInstance = self;
        
        currentOrientation = UIDeviceOrientationPortrait;
        
        [self initCreditsText];
        
        [self initChildren];
    }
	
	return self;
}

-(void) onEnter
{
    [super onEnter];

    creditsTimer = [NSTimer scheduledTimerWithTimeInterval:1.0
                                                    target:self
                                                  selector:@selector(tickCredits:)
                                                  userInfo:nil
                                                   repeats:NO];
    
    creditsIndex = 0;
}

-(void) onExit
{
    [creditsTimer invalidate];
    creditsTimer = nil;
    
    [super onExit];
}

-(void) initChildren
{
    //		NSAssert(sceneMainMenuInstance == nil, @"another SceneMainMenu is already in use!");
    CGSize winSize = [[CCDirector sharedDirector] winSize];
    int halfWinWidth = winSize.width * 0.5;
    
    // This adds a solid color background.
    CCLayerColor* colorLayer = [CCLayerColor layerWithColor:ccc4(200,200,200,255)]; // (0, 0, 51, 255)];
    [self addChild:colorLayer z:MainMenuLayerTagColorBG tag:MainMenuLayerTagColorBG];
    
    CCSprite* bg = [CCSprite spriteWithFile:@"af_ipad_gui_bg.png"];
    [bg setAnchorPoint:ccp(0,0)];
    [self addChild:bg z:MainMenuLayerTagBG tag:MainMenuLayerTagBG];
    
    CCSprite* title = [CCSprite spriteWithFile:@"af_title.png"];
    [title setPosition:ccp(halfWinWidth, 900)];
    [self addChild:title z:MainMenuLayerTagTitle tag:MainMenuLayerTagTitle];
    
    CCNode* playButton = [self buttonFromImage:@"menu_play_big.png" downImage:@"menu_play_big_pushed.png" selector:@selector(playButtonTapped:)];
    [playButton setPosition:ccp(-halfWinWidth - playButton.contentSize.width * 0.5, 600)];
    [self addChild:playButton z:MainMenuLayerTagButtonPlay tag:MainMenuLayerTagButtonPlay];
    CCSequence *playButtonSlideIn = [CCEaseElasticInOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: CGPointMake(halfWinWidth,600)] period: 0.8f];
    [playButton runAction:playButtonSlideIn];
    
    CCNode* rulesButton = [self buttonFromImage:@"menu_rules.png" downImage:@"menu_rules_pushed.png" selector:@selector(rulesButtonTapped:)];
    [rulesButton setPosition:ccp(-halfWinWidth - rulesButton.contentSize.width * 0.5, 520)];
    [self addChild:rulesButton z:MainMenuLayerTagButtonRules tag:MainMenuLayerTagButtonRules];
    CCSequence *rulesButtonSlideIn = [CCSequence actions:
                                      [CCDelayTime actionWithDuration:0.1f],
                                      [CCEaseElasticInOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: CGPointMake(halfWinWidth,520)] period: 0.8f],
                                      nil];
    [rulesButton runAction:rulesButtonSlideIn];

#ifdef USE_GC
    CCNode* gcButton = [self buttonFromImage:@"menu_button_blank.png"
                                        downImage:@"menu_button_blank_pushed.png"
                                         selector:@selector(gcButtonTapped:)
                                            label:NSLocalizedString(@"GAME CENTER", @"GameCenter button label")
                                         fontSize:16
                                        fontColor:ccBLACK];
    [gcButton setPosition:ccp(-halfWinWidth - gcButton.contentSize.width * 0.5, 520 - 160)];
    [self addChild:gcButton z:MainMenuLayerTagButtonMultiplayer tag:MainMenuLayerTagButtonMultiplayer];
    CCSequence *gcButtonSlideIn = [CCSequence actions:
                                        [CCDelayTime actionWithDuration:0.2f],
                                        [CCEaseElasticInOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: CGPointMake(halfWinWidth,520-160)] period: 0.8f],
                                        nil];
    [gcButton runAction:gcButtonSlideIn];
    
    
    
#endif
    
    CCNode* optionsButton = [self buttonFromImage:@"menu_button_blank.png"
                            downImage:@"menu_button_blank_pushed.png"
                             selector:@selector(optionsButtonTapped:)
                                label:NSLocalizedString(@"OPTIONS", @"Options button label")
                             fontSize:24
                            fontColor:ccBLACK];
    [optionsButton setPosition:ccp(-halfWinWidth - optionsButton.contentSize.width * 0.5, 520 - 80)];
    [self addChild:optionsButton z:MainMenuLayerTagButtonOptions tag:MainMenuLayerTagButtonOptions];
    CCSequence *optionsButtonSlideIn = [CCSequence actions:
                                      [CCDelayTime actionWithDuration:0.2f],
                                      [CCEaseElasticInOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: CGPointMake(halfWinWidth,520-80)] period: 0.8f],
                                      nil];
    [optionsButton runAction:optionsButtonSlideIn];
    
/*
    CCLabelBMFont *myLabel = [CCLabelBMFont
                              labelWithString:@"Fuel = |   |||\nOre = }   }}}\nFuel / Ore = ~   ~~~~.\nCard = [   [[[.\nFields = \\   \\\\\\ OR ]   ]]] OR ^   ^^^\nCol = _   ___.\nMB = `   ```.\nBuffer Line" fntFile:@"DIN_Tech_12-hd.fnt" width:600 alignment:UITextAlignmentLeft];
    
    [myLabel setPosition:CGPointMake(200, 700)];
    
    [self addChild:myLabel z:MainMenuLayerTagBottomText];
 */
    
    /*
     CCNode* achievementsButton = [self buttonFromImage:@"menu_achievements.png" downImage:@"menu_achievements_pushed.png" selector:@selector(achievementsButtonTapped:)];
     [achievementsButton setPosition:ccp(-halfWinWidth - achievementsButton.contentSize.width * 0.5, 450)];
     [self addChild:achievementsButton z:MainMenuLayerTagButtonAchievements tag:MainMenuLayerTagButtonAchievements];
     CCSequence *achievementsButtonSlideIn = [CCSequence actions:
     [CCDelayTime actionWithDuration:0.2f],
     [CCEaseElasticInOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: CGPointMake(halfWinWidth,450)] period: 0.8f],
     nil];
     [achievementsButton runAction:achievementsButtonSlideIn];
     */
}


-(void) dealloc
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
    [creditsTimer invalidate];
    creditsTimer = nil;
    
	// The Layer will be gone now, to avoid crashes on further access it needs to be nil.
	if (sceneMainMenuInstance == self)
        sceneMainMenuInstance = nil;
}

- (void)playButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

    //	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// TODO: Add a funky smooth transition here
	[[CCDirector sharedDirector] replaceScene:[SceneStartGame scene]];
}

- (void)rulesButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    //    [[CCDirector sharedDirector] replaceScene:[SceneInstructions scene]];
    [[CCDirector sharedDirector] pushScene:[SceneInstructions scene]];
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
}

- (void)gcButtonTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    // TODO: Test for iOS 6 and lock to 4 players in that case.
//    NSString *reqSysVer = @"6.0";
//    NSString *currSysVer = [[UIDevice currentDevice] systemVersion];
//    BOOL osVersionSupported = ([currSysVer compare:reqSysVer
//                                           options:NSNumericSearch] != NSOrderedAscending);
  
    [[GCTurnBasedMatchHelper sharedInstance]
     findMatchWithMinPlayers:2 maxPlayers:4 viewController:[CCDirector sharedDirector]];
}

- (void)optionsButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

//    [[CCDirector sharedDirector] replaceScene:[SceneInstructions scene]];
    [[CCDirector sharedDirector] pushScene:[SceneOptions scene]];
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
}

- (void)achievementsButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
}

static const ccColor3B creditsFontColor = (ccColor3B) {255, 174, 65};

-(void) initCreditsText
{
    NSString* filePath = @"AFCredits";
    NSString* fileRoot = [[NSBundle mainBundle]
                          pathForResource:filePath ofType:@"txt"];
    
    // read everything from text
    NSString* fileContents =
    [NSString stringWithContentsOfFile:fileRoot
                              encoding:NSUTF8StringEncoding error:nil];
    
    // first, separate by new line
    creditsText =
    [fileContents componentsSeparatedByCharactersInSet:
     [NSCharacterSet newlineCharacterSet]];
}

-(void)tickCredits:(NSTimer *)timer {
    NSString* nextLine = @"";
    
    if (creditsIndex < [creditsText count])
    {
        nextLine = (NSString*)[creditsText objectAtIndex:creditsIndex];
        
        // Append the current version to the first line
        if (creditsIndex == 2) // HACK: Add this only to the third line
            nextLine = [nextLine stringByAppendingString:[NSString stringWithFormat:@" v%@",[[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"]]];
        
        NSArray* segmentedLine = [nextLine componentsSeparatedByString:@";"];
        int cnt = 0;
        
        for (NSString* segment in segmentedLine)
        {
            [self nextCreditsLinear:segment col:cnt of:[segmentedLine count]];
            cnt++;
        }
        
    }
    
    creditsIndex = (creditsIndex + 1) % [creditsText count];
    
    creditsTimer = [NSTimer scheduledTimerWithTimeInterval:0.75
                                                    target:self
                                                  selector:@selector(tickCredits:)
                                                  userInfo:nil
                                                   repeats:NO];
}

-(void)nextCreditsLinear:(NSString*)txt col:(int)colIndex of:(int)numColumns
{
    static const int creditsFontSize = 18;
    int colX = (768.0 / (numColumns + 1)) * (colIndex + 1);
    
    // Spread things out just a bit more
    colX += ((colIndex) - ((numColumns - 1) * 0.5)) * 50;
    
    
    CGPoint creditsRollStart = ccp(colX, 50);
    CGPoint creditsRollEnd   = ccp(colX, 350);
    
    float creditsRollDuration = 8.0f;
    
	CCLabelTTF* nextLine = [CCLabelTTF labelWithString:txt fontName:@"DIN-Black" fontSize:creditsFontSize];
    
    nextLine.color = creditsFontColor;
    nextLine.position = creditsRollStart;
	nextLine.anchorPoint = CGPointMake(0.5f, 0.5f);
    nextLine.opacity = 255;
    nextLine.scale = 1.0f;
    
    [self addChild:nextLine z:MainMenuLayerTagBottomText];
    
    id move = [CCMoveTo actionWithDuration:creditsRollDuration position:creditsRollEnd];
    id del = [CCCallFuncN actionWithTarget:self selector:@selector(removeSprite:)];
    id moveSeq = [CCSequence actions:move, del, nil];
    
    [nextLine runAction:moveSeq];
    
    id fadeIn  = [CCFadeIn actionWithDuration:(creditsRollDuration * 0.2)];
    id delay   = [CCDelayTime actionWithDuration:(creditsRollDuration * 0.6)];
    id fadeOut = [CCFadeOut actionWithDuration:(creditsRollDuration * 0.2)];
    id fadeSeq = [CCSequence actions:fadeIn, delay, fadeOut, nil];
    
    [nextLine runAction:fadeSeq];
}


-(void)nextCreditsSphere:(NSString*)txt
{
    static const int creditsFontSize = 18;
    
    CGPoint creditsRollStart = ccp(768 * 0.5, 50);
    CGPoint creditsRollEnd   = ccp(768 * 0.5, 350);
    
    float creditsRollDuration = 8.0f;
    
	CCLabelTTF* nextLine = [CCLabelTTF labelWithString:txt fontName:@"DIN-Black" fontSize:creditsFontSize];
    
    nextLine.color = creditsFontColor;
    nextLine.position = creditsRollStart;
	nextLine.anchorPoint = CGPointMake(0.5f, 0.5f);
    nextLine.opacity = 255;
    nextLine.scale = 0.2f;
    
    [self addChild:nextLine z:MainMenuLayerTagBottomText];
    
    id move = [CCMoveTo actionWithDuration:creditsRollDuration position:creditsRollEnd];
    id del = [CCCallFuncN actionWithTarget:self selector:@selector(removeSprite:)];
    id moveSeq = [CCEaseSineInOut actionWithAction:[CCSequence actions:move, del, nil]];
    
    [nextLine runAction:moveSeq];
    
    id scaleIn  = [CCEaseSineOut actionWithAction:[CCScaleTo actionWithDuration:(creditsRollDuration * 0.5) scale:2.0f]];
    id scaleOut = [CCEaseSineIn actionWithAction:[CCScaleTo actionWithDuration:(creditsRollDuration * 0.5) scale:0.2f]];
    id scaleSeq = [CCSequence actions:scaleIn, scaleOut, nil];
    
    [nextLine runAction:scaleSeq];
    
    id fadeIn  = [CCFadeIn actionWithDuration:(creditsRollDuration * 0.3)];
    id delay   = [CCDelayTime actionWithDuration:(creditsRollDuration * 0.4)];
    id fadeOut = [CCFadeOut actionWithDuration:(creditsRollDuration * 0.3)];
    id fadeSeq = [CCSequence actions:fadeIn, delay, fadeOut, nil];
    
    [nextLine runAction:fadeSeq];
}


@end
