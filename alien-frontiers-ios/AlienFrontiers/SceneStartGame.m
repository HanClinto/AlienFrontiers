//
//  SceneStartGame.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/27/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SceneStartGame.h"


@implementation SceneStartGame

// Semi-Singleton: you can access SceneMainMenu only as long as it is the active scene.
static SceneStartGame* sceneStartGameInstance;

+(SceneStartGame*) sharedScene
{
	NSAssert(sceneStartGameInstance != nil, @"MultiLayerScene not available!");
	return sceneStartGameInstance;
}

+(id) scene
{
	CCScene* scene = [CCScene node];
	SceneStartGame* layer = [SceneStartGame node];
	[scene addChild:layer];
	return scene;
}

-(id) init
{
	if ((self = [super init]))
	{
//		NSAssert(sceneStartGameInstance == nil, @"another SceneMainMenu is already in use!");
		sceneStartGameInstance = self;
		
		currentOrientation = UIDeviceOrientationPortrait;
		
		// This adds a solid color background.
		CCLayerColor* colorLayer = [CCLayerColor layerWithColor:ccc4(0, 0, 51, 255)];
		[self addChild:colorLayer z:StartGameLayerTagColorBG tag:StartGameLayerTagColorBG];
		
		CCSprite* bg = [CCSprite spriteWithFile:@"af_ipad_gui_bg.png"];
		[bg setAnchorPoint:ccp(0,0)];
		[self addChild:bg z:StartGameLayerTagBG tag:StartGameLayerTagBG];
		
		CCSprite* title = [CCSprite spriteWithFile:@"af_game_setup.png"];
		[title setPosition:ccp(384, 900)];
		[self addChild:title z:StartGameLayerTagTitle tag:StartGameLayerTagTitle];
        
		CCNode* backButton = [self buttonFromImage:@"menu_back.png" downImage:@"menu_back_pushed.png" selector:@selector(backButtonTapped:)];
		[backButton setPosition:ccp(100, 974)];
		[self addChild:backButton z:StartGameLayerTagButtonBack tag:StartGameLayerTagButtonBack];
		
		CCNode* playButton = [self buttonFromImage:@"menu_play_big.png" downImage:@"menu_play_big_pushed.png" selector:@selector(playButtonTapped:)];
		[playButton setPosition:ccp(384, 600)];
		[self addChild:playButton z:StartGameLayerTagButtonPlay tag:StartGameLayerTagButtonPlay];

        player1Personality = AI_TYPE_HUMAN;
        player2Personality = AI_TYPE_EASY;
        player3Personality = AI_TYPE_MEDIUM;
        player4Personality = AI_TYPE_HARD;
        
		numPlayers = 2;
		CCNode* numPlayersButton = [self buttonFromImage:@"menu_button_blank.png" 
											   downImage:@"menu_button_blank_pushed.png" 
												selector:@selector(numPlayersButtonTapped:)
												   label:@"2"
												fontSize:36
											   fontColor:ccBLACK];
        
		[numPlayersButton setPosition:ccp(384, 525)];
		[self addChild:numPlayersButton z:StartGameLayerTagButtonNumPlayers tag:StartGameLayerTagButtonNumPlayers]; 

		CCNode* playerButton = [self buttonFromImage:@"menu_button_blank.png" 
                                           downImage:@"menu_button_blank_pushed.png" 
                                            selector:@selector(player1ButtonTapped:)
                                               label:[self getAIName:AI_TYPE_HUMAN]
                                            fontSize:20
                                           fontColor:ccc3(0x95, 0x20, 0x34)
                                          textShadow:false];
        
		[playerButton setPosition:ccp(384 - 100, 400)];
		[self addChild:playerButton z:StartGameLayerTagButtonPlayer1 tag:StartGameLayerTagButtonPlayer1]; 

		playerButton =         [self buttonFromImage:@"menu_button_blank.png" 
                                           downImage:@"menu_button_blank_pushed.png" 
                                            selector:@selector(player2ButtonTapped:)
                                               label:[self getAIName:AI_TYPE_EASY]
                                            fontSize:20
                                           fontColor:ccc3(0x00, 0x72, 0x26)
                                          textShadow:false];
		[playerButton setPosition:ccp(384 + 100, 400)];
		[self addChild:playerButton z:StartGameLayerTagButtonPlayer2 tag:StartGameLayerTagButtonPlayer2]; 

		playerButton =         [self buttonFromImage:@"menu_button_blank.png" 
                                           downImage:@"menu_button_blank_pushed.png" 
                                            selector:@selector(player3ButtonTapped:)
                                               label:[self getAIName:AI_TYPE_MEDIUM]
                                            fontSize:20
                                           fontColor:ccc3(0x00, 0x5A, 0x96)
                                          textShadow:false];
        
		[playerButton setPosition:ccp(384 - 100, 400 - 75)];
		[self addChild:playerButton z:StartGameLayerTagButtonPlayer3 tag:StartGameLayerTagButtonPlayer3]; 

		playerButton =         [self buttonFromImage:@"menu_button_blank.png" 
                                           downImage:@"menu_button_blank_pushed.png" 
                                            selector:@selector(player4ButtonTapped:)
                                               label:[self getAIName:AI_TYPE_HARD]
                                            fontSize:20
                                           fontColor:ccc3(0xFF, 0xC2, 0x00)
                                          textShadow:false];
        
		[playerButton setPosition:ccp(384 + 100, 400 - 75)];
		[self addChild:playerButton z:StartGameLayerTagButtonPlayer4 tag:StartGameLayerTagButtonPlayer4]; 
        
        [self updateView:nil];
    }
	
	return self;
}

-(void) dealloc
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// The Layer will be gone now, to avoid crashes on further access it needs to be nil.
	if (sceneStartGameInstance == self)
        sceneStartGameInstance = nil;
}

- (void)playButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	// Create the game instance
	GameState* state = [[GameState alloc] initWith:numPlayers p1:player1Personality p2:player2Personality p3:player3Personality p4:player4Personality];
	
    // Dummy call to remove warning
    [state numPlayers];
    
	// TODO: Add a funky smooth transition here
	[[CCDirector sharedDirector] replaceScene:[SceneGameiPad scene]];
}

- (void)backButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    [[CCDirector sharedDirector] replaceScene:[SceneMainMenuiPad scene]];
    //    [[CCDirector sharedDirector] popScene];
    
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
}

- (void)numPlayersButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// TODO: Add a funky smooth transition here
	numPlayers = numPlayers + 1;
	if (numPlayers > 4)
		numPlayers = 2;
	
	// Update the label
	CCNode* btn = [self getChildByTag:StartGameLayerTagButtonNumPlayers];
	[self setButtonLabel:btn to:[NSString stringWithFormat:@"%d", numPlayers]];
    
    [self updateView:sender];
}


- (void)player1ButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

    player1Personality = (player1Personality + 1) % AI_TYPE_LENGTH;
    // Update player labels
    [self updateView:sender];
}
- (void)player2ButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

    player2Personality = (player2Personality + 1) % AI_TYPE_LENGTH;
    // Update player labels
    [self updateView:sender];
}
- (void)player3ButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    player3Personality = (player3Personality + 1) % AI_TYPE_LENGTH;
    // Update player labels
    [self updateView:sender];
}
- (void)player4ButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

    player4Personality = (player4Personality + 1) % AI_TYPE_LENGTH;
    // Update player labels
    [self updateView:sender];
}

-(void) updateView:(id)sender {
    CCNode* btn1 = [self getChildByTag:StartGameLayerTagButtonPlayer1];
    CCNode* btn2 = [self getChildByTag:StartGameLayerTagButtonPlayer2];
    CCNode* btn3 = [self getChildByTag:StartGameLayerTagButtonPlayer3];
    CCNode* btn4 = [self getChildByTag:StartGameLayerTagButtonPlayer4];

    [btn4 setVisible:(numPlayers >= 4)];
    [btn3 setVisible:(numPlayers >= 3)];
    
    [self setButtonLabel:btn1 to:[self getAIName:player1Personality]];
    [self setButtonLabel:btn2 to:[self getAIName:player2Personality]];
    [self setButtonLabel:btn3 to:[self getAIName:player3Personality]];
    [self setButtonLabel:btn4 to:[self getAIName:player4Personality]];
}

-(NSString*) getAIName:(int)index {
    switch (index) {
        case AI_TYPE_HUMAN:
            return NSLocalizedString(@"Human", @"AI name human");
            break;
        case AI_TYPE_EASY:
            return NSLocalizedString(@"AI: Cadet", @"AI name easy");
            break;
        case AI_TYPE_MEDIUM:
            return NSLocalizedString(@"AI: Spacer", @"AI name medium");
            break;
        case AI_TYPE_PIRATE:
            return NSLocalizedString(@"AI: Pirate", @"AI name aggressive");
            break;
        case AI_TYPE_HARD:
            return NSLocalizedString(@"AI: Admiral", @"AI name hard");
            break;
        default:
            return @"None";
            break;
    }
}


@end
