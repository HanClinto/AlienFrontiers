//
//  UserInterfaceLayer.m
//  ScenesAndLayers
//
//  Created by Steffen Itterheim on 28.07.10.
//  Copyright 2010 Steffen Itterheim. All rights reserved.
//

#import "LayerHUDPort.h"
#import "LayerHUDPortMenu.h"
#import "SceneGameiPad.h"
#import "CCSpriteFrame.h"
#import "CCSpriteFrameCache.h"
#import "LayerGameMenu.h"
#import "SceneInstructions.h"
#import "ExhaustiveAI.h"

@interface LayerHUDPort (PrivateMethods)
-(void) updateView;
@end


@implementation LayerHUDPort

-(id) init
{
	if ((self = [super init]))
	{
		[self buildGUI];
//		self.isTouchEnabled = YES;
	}
	return self;
}

-(void) onEnter
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(orientationChanged:)   name:EVENT_ORIENTATION_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(resourcesChanged:)     name:EVENT_RESOURCES_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(resourcesChanged:)     name:EVENT_SHIP_ACTIVATE object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(resourcesChanged:)           name:EVENT_ARTIFACT_CARDS_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(undoRedoChanged:)      name:EVENT_UNDO_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(undoRedoChanged:)      name:GUI_EVENT_QUEUE_CHANGED object:nil];
//    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(undoRedoChanged:)      name:GUI_EVENT_QUEUED_SELECTION_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(nextPlayer:)           name:EVENT_NEXT_PLAYER object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateTurnDoneButton:) name:EVENT_SHIPS_DOCKED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshState:)         name:EVENT_STATE_RELOAD object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshState:)         name:EVENT_COLONIES_CHANGED object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateLog:)           name:EVENT_LOG_ENTRY object:nil];

    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateHint:)         name:EVENT_FINISH_RAID object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateHint:)         name:GUI_EVENT_QUEUED_SELECTION_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateHint:)         name:GUI_EVENT_QUEUE_CHANGED object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateHintAITick:)         name:EVENT_AI_TICK object:nil];

    firstTimeShown = TRUE;
    previousPlayer = -1;
    
    [self updateView];
    [self updateHint:nil];
    [self nextPlayer:nil];
    
    [super onEnter];
}

- (void) onExit
{
	[[NSNotificationCenter defaultCenter] removeObserver:self];
	
	[super onExit];
}

-(void) buildGUI
{
	// ************* Frame ************* 
	
	// Add the current player's HUD
	CCNode* uiFrame = [CCNode node];
	uiFrame.position = ccp( 768 * 0.5, -117); // -[uiFrame texture].contentSize.height * 0.5);
	[self addChild:uiFrame z:UILayerTagFrame tag:UILayerTagFrame];
	
	CCSprite* frameSprite = [CCSprite spriteWithFile:@"hud_port_player_tab_large.png"];
	frameSprite.position = ccp( 0, 0 ); // 768 * 0.5, -[uiFrame texture].contentSize.height * 0.5);
	[uiFrame addChild:frameSprite z:UILayerTagFrameSprite tag:UILayerTagFrameSprite];
	
	
	
	// ************* Buttons ************* 
	
	CCNode* rollButton = [self buttonFromImage:@"button_roll_up.png" 
									 downImage:@"button_roll_down.png" 
									  selector:@selector(rollButtonTapped:)
										 label:NSLocalizedString(@"ROLL", @"Roll button label")
									  fontSize:16];
	rollButton.position = ccp( 635 - 375, 92 -117); 
    rollButton.visible = true;
	[uiFrame addChild:rollButton z:UILayerTagButtonRoll tag:UILayerTagButtonRoll];
    
    CCSprite* rollButtonGlow = [[CCSprite alloc] initWithFile:@"button_roll_glow.png"];
	rollButtonGlow.position = ccp( 635 - 375, 92 -117);
    [rollButtonGlow setOpacity:0];
    [rollButtonGlow setBlendFunc: (ccBlendFunc) { GL_SRC_ALPHA, GL_ONE }];
    [uiFrame addChild:rollButtonGlow z:UILayerTagButtonRollGlow tag:UILayerTagButtonRollGlow];

	
	CCNode* undoButton = [self buttonFromImage:@"tray_btn_undo.png" 
									 downImage:@"tray_btn_undo_active.png" 
                                    inactiveImage:@"tray_btn_undo_inactive.png"
									  selector:@selector(undoButtonTapped:)];
	undoButton.position = ccp( 693 - 375 -122 +3, 126 -117 -82 -2);
	[uiFrame addChild:undoButton z:UILayerTagButtonUndo tag:UILayerTagButtonUndo];
	
	
	CCNode* redoButton = [self buttonFromImage:@"tray_btn_redo.png" 
									 downImage:@"tray_btn_redo_active.png" 
                                 inactiveImage:@"tray_btn_redo_inactive.png"
									  selector:@selector(redoButtonTapped:)];
	redoButton.position = ccp( 577 - 375 +37 +3, 126 -117 -82 -2);
	[uiFrame addChild:redoButton z:UILayerTagButtonRedo tag:UILayerTagButtonRedo];
	
	
	CCNode* doneButton = [self buttonFromImage:@"tray_btn_done.png" 
									 downImage:@"tray_btn_done_active.png" 
                                 inactiveImage:@"tray_btn_done_inactive.png"
									  selector:@selector(doneButtonTapped:)];
	doneButton.position = ccp( 693 - 375 - 16 +3, 128 - 80-117 -4 -2);
	[uiFrame addChild:doneButton z:UILayerTagButtonDone tag:UILayerTagButtonDone];
	
    CCSprite* doneButtonGlow = [[CCSprite alloc] initWithFile:@"tray_btn_done_glow.png"];
	doneButtonGlow.position = ccp( 693 - 375 - 16 +3, 128 - 80-117 -4 -2);
    [doneButtonGlow setOpacity:0];
    [doneButtonGlow setBlendFunc: (ccBlendFunc) { GL_SRC_ALPHA, GL_ONE }];
    [uiFrame addChild:doneButtonGlow z:UILayerTagButtonDoneGlow tag:UILayerTagButtonDoneGlow];
    
    
	
	// User interface labels
	CCLabelTTF* label = [CCLabelTTF labelWithString:@"2" fontName:@"DIN-Black" fontSize:42];
	label.color = ccWHITE;
	label.position = CGPointMake(705 - 375, 193-117);
	label.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:label z:UILayerTagPlayerNumber tag:UILayerTagPlayerNumber];
	
	CCLabelTTF* oreLabel = [CCLabelTTF labelWithString:@"0" fontName:@"DIN-Black" fontSize:22];
	oreLabel.color = ccBLACK;
	oreLabel.position = CGPointMake(706-375-148, 182 + 22-117);
	oreLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:oreLabel z:UILayerTagOreLabel tag:UILayerTagOreLabel];
	
	CCLabelTTF* fuelLabel = [CCLabelTTF labelWithString:@"2" fontName:@"DIN-Black" fontSize:22];
	fuelLabel.color = ccBLACK;
	fuelLabel.position = CGPointMake(706-375-148+35, 182 + 22-117);
	fuelLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:fuelLabel z:UILayerTagFuelLabel tag:UILayerTagFuelLabel];
	
	CCLabelTTF* colonyLabel = [CCLabelTTF labelWithString:@"3" fontName:@"DIN-Black" fontSize:22];
	colonyLabel.color = ccBLACK;
	colonyLabel.position = CGPointMake(706-375-148+35+35, 182 + 22-117);
	colonyLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:colonyLabel z:UILayerTagColonyLabel tag:UILayerTagColonyLabel];
	
	CCLabelTTF* diceLabel = [CCLabelTTF labelWithString:@"5" fontName:@"DIN-Black" fontSize:22];
	diceLabel.color = ccBLACK;
	diceLabel.position = CGPointMake(706-375-148+35+35+35, 182 + 22-117);
	diceLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:diceLabel z:UILayerTagDiceLabel tag:UILayerTagDiceLabel];
	
	CCSprite* colonySprite;
	CCSprite* dieSprite;
	
    colonySprite = [CCSprite spriteWithFile:[self playerColonyImage]];
    dieSprite = [CCSprite spriteWithFile:[self playerDieImage]];
	//colonySprite.anchorPoint = CGPointMake(0, 1);
	//dieSprite.anchorPoint = CGPointMake(0, 1);
	
	colonySprite.position = ccp(colonyLabel.position.x +1, colonyLabel.position.y - 27);
	dieSprite.position    = ccp(diceLabel.position.x +1, diceLabel.position.y - 27);
	
	[uiFrame addChild:colonySprite z:UILayerTagColonySprite tag:UILayerTagColonySprite];
	[uiFrame addChild:dieSprite z:UILayerTagDiceSprite tag:UILayerTagDiceSprite];
	
	
	
	
	// Queued touch management
	CCLabelTTF* hintLabel = [CCLabelTTF labelWithString:@"" fontName:@"DIN-Black" fontSize:22];
	hintLabel.color = ccc3(0xFF, 0xC2, 0x00);
	hintLabel.position = CGPointMake(706-375-148-349+165, 182 + 22 + 22-117);
	hintLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:hintLabel z:UILayerTagHintLabel tag:UILayerTagHintLabel];
	
	
	CCNode* okButton = [self buttonFromImage:@"ondark_button.png"
								   downImage:@"ondark_button_active.png"
									selector:@selector(okButtonTapped:)
									   label:NSLocalizedString(@"OK", @"OK prompt button label")
									fontSize:16];
	okButton.position = ccp( 374-375+275 + 48, 226 + 45-117-10 - 32 );
	[uiFrame addChild:okButton z:UILayerTagButtonOk tag:UILayerTagButtonOk];
	
	
	// Card tray
	LayerTechCardTray* cardTray = [[LayerTechCardTray alloc] initWithPlayerIndex:-1];
	cardTray.position = CGPointMake( 706-375-148-349, 182 -21 -117 + 3 );
	cardTray.anchorPoint = CGPointMake(0, 1);
	[uiFrame addChild:cardTray z:UILayerTagCardTray tag:UILayerTagCardTray];
	
	LayerTechCardInspector* cardInspector = [[LayerTechCardInspector alloc] initWithPlayerIndex:-1];
	cardInspector.position = CGPointMake( 706-375-148-349, 182 -21 - 100 -117);
	cardInspector.anchorPoint = CGPointMake(0, 1);
	[uiFrame addChild:cardInspector z:UILayerTagCardInspector tag:UILayerTagCardInspector];
	
	// Corner overlays
	CCSprite* cornerOverlay = [CCSprite spriteWithFile:@"hud_port_corner_tint.png"];
	cornerOverlay.position = ccp(67 + 640-375, 186-117);
	cornerOverlay.color = [[GameState sharedGameState] currentPlayer].color;
	[cornerOverlay setBlendFunc: (ccBlendFunc) { GL_DST_COLOR, GL_ONE_MINUS_SRC_ALPHA }];
	[uiFrame addChild:cornerOverlay z:UILayerTagCorner tag:UILayerTagCorner];
	
	CCSprite* edgeOverlay = [CCSprite spriteWithFile:@"hud_port_edge_tint.png"];
	edgeOverlay.position = ccp(67 - 21 - 25-375, 186 - 68-117);
	edgeOverlay.color = [[GameState sharedGameState] currentPlayer].color;
	[edgeOverlay setBlendFunc: (ccBlendFunc) { GL_DST_COLOR, GL_ONE_MINUS_SRC_ALPHA }];
	[uiFrame addChild:edgeOverlay z:UILayerTagEdge tag:UILayerTagEdge];
    
    
    // Menu frame
    /*
    LayerHUDPortMenu* menuFrame = [[LayerHUDPortMenu alloc] init];
    menuFrame.position = ccp(67 - 21 - 25-375, 186 - 68-117);
    [uiFrame addChild:menuFrame z:UILayerTagMenuFrame tag:UILayerTagMenuFrame];
    */
    
    CCLayer* menuFrame = [[CCLayer alloc] init];
    menuFrame.position = ccp(67 - 21 - 25-375, 186 - 68-117);
    [uiFrame addChild:menuFrame z:UILayerTagMenuFrame tag:UILayerTagMenuFrame];
    
    CCNode* menuButton = [self buttonFromImage:@"menu_button_68.png" 
                                     downImage:@"menu_button_68_active.png" 
                                      selector:@selector(menuButtonTapped:)
                                         label:NSLocalizedString(@"MENU", @"Menu button label")
                                      fontSize:11
                                     fontColor:ccBLACK];
    menuButton.position = ccp(67 - 21 - 25-375 + 94 - 40, 126 -117 -82 -2);
    [uiFrame addChild:menuButton z:UILayerTagMenuButton tag:UILayerTagMenuButton];

    CCNode* helpButton = [self buttonFromImage:@"menu_button_68.png"
                                     downImage:@"menu_button_68_active.png" 
                                      selector:@selector(helpButtonTapped:)
                                         label:NSLocalizedString(@"HELP", @"Help button label")
                                      fontSize:11
                                     fontColor:ccBLACK];
    helpButton.position = ccp(67 - 21 - 25-375 + 94 + 40, 126 -117 -82 -2);
    [uiFrame addChild:helpButton z:UILayerTagHelpButton tag:UILayerTagHelpButton];
    
    
    // Log window
    text = [[UITextView alloc] init];
    [text setEditable:false];
    text.backgroundColor = [UIColor clearColor];
    text.textColor = [UIColor blackColor];
    
	// If you like it, then you should put a wrapper on it
	CCUIViewWrapper* wrapper = [CCUIViewWrapper wrapperForUIView:text];
    wrapper.contentSize = CGSizeMake(172, 142);
    wrapper.position = ccp(40 + wrapper.contentSize.width * 0.5, 
                           1024 - 846 - wrapper.contentSize.height * 0.5); // 42, 842);
//    wrapper.position = CGPointMake(706-375-148-349+165, 182 + 22 + 22-117); // ccp(67 - 21 - 25-175, 186 - 68);
	[uiFrame addChild:wrapper z:UILayerTagLogText tag:UILayerTagLogText];
    
    // scroll the text to the end.
    [text setText:[[GameState sharedGameState] gameLog]];
    [text scrollRangeToVisible:NSMakeRange([text.text length], 0)];
}

- (void)setElementVisible:(CCNode*) element visible:(bool)toVis
{
    if ([element visible] != toVis)
    {
        [element setPosition:ccp(((int)element.position.x % 2000) + 2000 * (toVis ? 0 : 1), element.position.y)];
        [element setVisible:toVis];
    }
}

- (void)rollButtonTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	CCNode* uiFramePort = [self getChildByTag:UILayerTagFrame];
	
	CCNode* rollButton = [uiFramePort getChildByTag:UILayerTagButtonRoll];
    CCNode* rollButtonGlow = [uiFramePort getChildByTag:UILayerTagButtonRollGlow];
	
	if (rollButton.visible)
	{
		[[GameState sharedGameState].currentPlayer rollShips];
		[self setElementVisible:rollButton visible:false];
        [self setElementVisible:rollButtonGlow visible:false];
        [rollButtonGlow stopAllActions];
	}
}

- (void)undoButtonTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    
    GameTouchManager* touchManager = [[SceneGameiPad sharedLayer] touchManager];

    // If we've got a selection queue active, then take a step backwards.
    if (([touchManager queueIsActive]) &&
        ([[touchManager currentSelection] caption] != NSLocalizedString(@"Please select a region to land your colony", @"Colony landing prompt")))
    {
        // TODO: Go a step backwards in the touch manager queue, not just cancel the whole thing
        if ([touchManager canUndo])
        {
            [touchManager undoQueue];
        }
        else
        {
            
            [touchManager cancelQueue];
        }
    }
    else // Otherwise, undo the current game state.
    {
        if ([touchManager queueIsActive])
            [touchManager cancelQueue];

        [[GameState sharedGameState] undo];
    }
    
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
}

- (void)redoButtonTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[[GameState sharedGameState] redo];

    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
}

- (void)doneButtonTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	if ([[[GameState sharedGameState] currentPlayer] numColoniesToLaunch] > 0) {
		return; // We've still got colonies to launch -- wait a bit
	}
	
	[[GameState sharedGameState] gotoNextPlayer];

    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
}

- (void)menuButtonTapped:(id)sender 
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

    [[SceneGameiPad menuLayer] activate];
}

- (void)helpButtonTapped:(id)sender
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

    [[CCDirector sharedDirector] pushScene:[SceneInstructions scene]];
//    [TestFlight openFeedbackView];
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
	
    CCNode* uiFrame = (CCNode*) [self getChildByTag:UILayerTagFrame];
	NSAssert([uiFrame isKindOfClass:[CCNode class]], @"uiFrame is not a CCNode");

    if (UIDeviceOrientationIsLandscape(deviceOrientation))
	{
		[uiFrame stopAllActions];
		
		// Move the portrait HUD
		CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:CGPointMake(uiFrame.position.x, -234 * 0.5)];
		CCActionEase* ease = [CCEaseSineIn actionWithAction:move];
		[uiFrame runAction:ease];
		
		[[SceneGameiPad sharedLayer] setCurrentOrientation:deviceOrientation];
	} else if (UIDeviceOrientationIsPortrait(deviceOrientation) || firstTimeShown){
		[uiFrame stopAllActions];

		// Move the portrait HUD
		CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:CGPointMake(uiFrame.position.x, 234 * 0.5 - 19)];
		CCActionEase* ease = [CCEaseSineOut actionWithAction:move];
		[uiFrame runAction:ease];		
		
		[[SceneGameiPad sharedLayer] setCurrentOrientation:deviceOrientation];
	}
    
    [self updateButtons:nil];
    [self updateLog:nil];
	
	firstTimeShown = FALSE;
}

-(void) updateLog:(NSNotification*)notification
{
    [text setText:[[GameState sharedGameState] gameLog]];
    [text scrollRangeToVisible:NSMakeRange([text.text length], 0)];
}

-(void) resourcesChanged:(NSNotification*)notification
{
    float delay = 0.5f;
    
    if ([[[GameState sharedGameState] currentPlayer] playerIndex] != previousPlayer)
        delay = 0;
    
    [self performSelector:@selector(resourcesChangedDelayed:) withObject:notification afterDelay:delay];
}

-(void) resourcesChangedDelayed:(NSNotification*)notification
{
	int val = 0;
    
    CCNode* uiFrame = (CCNode*) [self getChildByTag:UILayerTagFrame];
	NSAssert([uiFrame isKindOfClass:[CCNode class]], @"uiFrame is not a CCNode");
	Player* currentPlayer = [[GameState sharedGameState] currentPlayer];
	
	CCLabelTTF* oreLabel = (CCLabelTTF*) [uiFrame getChildByTag:UILayerTagOreLabel];
//	NSAssert([oreLabel isKindOfClass:[CCLabelTTF class]], @"uiFramePort is not a CCLabelTTF");
    val = currentPlayer.oreRaidTotal;
    if (val > 0)
    {
        [oreLabel setColor:ccRED];
    }
    else
    {
        [oreLabel setColor:ccBLACK];
    }
    val += currentPlayer.ore;
	[oreLabel setString: [NSString stringWithFormat:@"%d",val]];
    
	CCLabelTTF* fuelLabel = (CCLabelTTF*) [uiFrame getChildByTag:UILayerTagFuelLabel];
//	NSAssert([fuelLabel isKindOfClass:[CCLabelTTF class]], @"uiFramePort is not a CCLabelTTF");
    val = currentPlayer.fuelRaidTotal;
    if (val > 0)
    {
        [fuelLabel setColor:ccRED];
    }
    else
    {
        [fuelLabel setColor:ccBLACK];
    }
    val += currentPlayer.fuel;
    
	[fuelLabel setString: [NSString stringWithFormat:@"%d",val]];	
	
	
	CCLabelTTF* diceLabel = (CCLabelTTF*) [uiFrame getChildByTag:UILayerTagDiceLabel];
	[diceLabel setString: [NSString stringWithFormat:@"%d",currentPlayer.activeShips.count]];
	
	CCLabelTTF* colonyLabel = (CCLabelTTF*) [uiFrame getChildByTag:UILayerTagColonyLabel];
	[colonyLabel setString: [NSString stringWithFormat:@"%d",currentPlayer.coloniesLeft]];
	
	CCLabelTTF* playerLabel = (CCLabelTTF*) [uiFrame getChildByTag:UILayerTagPlayerNumber];
	[playerLabel setString: [NSString stringWithFormat:@"%d",[[[GameState sharedGameState] currentPlayer] vps]]];
    
    if ([currentPlayer playerIndex] == previousPlayer)
    {
        if (currentPlayer.ore != previousOre)
        {
            // If we're adding ore, then move from top to bottom
            [self particleWithSprite:@"icon_ore.png"
                               atPos:oreLabel.position
                             embiggen:(currentPlayer.ore > previousOre)];
        }
        
        if (currentPlayer.fuel != previousFuel)
        {
            [self particleWithSprite:@"icon_fuel.png"
                               atPos:fuelLabel.position
                            embiggen:(currentPlayer.fuel > previousFuel)];
        }
        
        if (currentPlayer.activeShips.count != previousShips)
        {
            [self particleWithSprite:[self playerDieImage]
                               atPos:diceLabel.position
                            embiggen:(currentPlayer.activeShips.count > previousShips)];
        }
        
        if (currentPlayer.coloniesLeft != previousColonies)
        {
            [self particleWithSprite:[self playerColonyImage]
                               atPos:colonyLabel.position
                            embiggen:(currentPlayer.coloniesLeft > previousColonies)];
        }
    }
    previousPlayer = currentPlayer.playerIndex;
    previousOre = currentPlayer.ore;
    previousFuel = currentPlayer.fuel;
    previousColonies = currentPlayer.coloniesLeft;
    previousShips = currentPlayer.activeShips.count;
}

-(void) particleWithSprite:(NSString*)spriteFile atPos:(CGPoint)pt embiggen:(bool)embiggen
{
    float timeDuration = 0.75f;
    CGPoint fromPt = pt;
    CGPoint toPt = pt;
    int fromScale = 1;
    int toScale = 1;
    
    if (embiggen)
    {
        fromPt.y += 50;
        toPt.y -= 30;
        fromScale = 2;
    }
    else
    {
        fromPt.y -= 30;
        toPt.y += 50;
        toScale = 2;
    }
    
    CCNode* uiFrame = (CCNode*) [self getChildByTag:UILayerTagFrame];
    
    CCSprite* particle = [CCSprite spriteWithFile:spriteFile];
    [particle setPosition:fromPt];
    [particle setOpacity:0];
    [uiFrame addChild:particle z:UILayerTagFX];
    [particle setScale:fromScale];
    
    id scale = [CCScaleTo actionWithDuration:timeDuration scaleX:toScale scaleY:toScale];
    id del = [CCCallFuncN actionWithTarget:self selector:@selector(removeSprite:)];
    id scaleSeq = [CCSequence actions:scale, del, nil];
    
    id fadeIn  = [CCFadeTo actionWithDuration:0.3 * timeDuration opacity:255];
    id fadeOut = [CCFadeTo actionWithDuration:0.7 * timeDuration opacity:0];
    id fadeSeq = [CCSequence actions:fadeIn, fadeOut, nil];
    
    id moveTo  = [CCMoveTo actionWithDuration:timeDuration position:toPt];

    [particle runAction:moveTo];
    [particle runAction:fadeSeq];
    [particle runAction:scaleSeq];
}

-(void) removeSprite:(id)sender {
    
	[self removeChild:sender cleanup:YES];
}

-(void) undoRedoChanged:(NSNotification*)notification
{
	GameState* state = [GameState sharedGameState];
	bool canUndo = [state canUndo] || [[[SceneGameiPad sharedLayer] touchManager] queueIsActive];
	bool canRedo = [state canRedo];
	
//	CCLOG(@"Can undo: %d  Can redo: %d", canUndo, canRedo);
	
	CCNode* uiFrame = [self getChildByTag:UILayerTagFrame];
	
	CCNode* undoButton = [uiFrame getChildByTag:UILayerTagButtonUndo];
    [self setButtonIsEnabled:undoButton enabled:canUndo];
//	[self setElementVisible:undoButton visible:canUndo];
	
	CCNode* redoButton = [uiFrame getChildByTag:UILayerTagButtonRedo];
    [self setButtonIsEnabled:redoButton enabled:canRedo];
//	[self setElementVisible:redoButton visible:canRedo];
	
//	CCLOG(@"undoButton: %@   redoButton: %@", undoButton, redoButton);

}

-(void)nextPlayer:(NSNotification *) notification
{
	CCNode* uiFrame = [self getChildByTag:UILayerTagFrame];
	
	CCLabelTTF* playerLabel = (CCLabelTTF*) [uiFrame getChildByTag:UILayerTagPlayerNumber];
	[playerLabel setString: [NSString stringWithFormat:@"%d",[[[GameState sharedGameState] currentPlayer] vps]]];
	
	CCSprite* cornerOverlay = (CCSprite*) [uiFrame getChildByTag:UILayerTagCorner];
	cornerOverlay.color = [[GameState sharedGameState] currentPlayer].color;	

	CCSprite* edgeOverlay = (CCSprite*) [uiFrame getChildByTag:UILayerTagEdge];
	edgeOverlay.color = [[GameState sharedGameState] currentPlayer].color;	
	
	CCSprite* colonySprite = (CCSprite*) [uiFrame getChildByTag:UILayerTagColonySprite];
	CCSprite* dieSprite = (CCSprite*) [uiFrame getChildByTag:UILayerTagDiceSprite];
	
    [colonySprite setTexture:[[CCTextureCache sharedTextureCache] addImage:[self playerColonyImage]]];
    [dieSprite setTexture:[[CCTextureCache sharedTextureCache] addImage:[self playerDieImage]]];
	
//	[self addChild:colonySprite z:UILayerTagColonySprite tag:UILayerTagColonySprite];
//	[self addChild:dieSprite z:UILayerTagDiceSprite tag:UILayerTagDiceSprite];
	
	[self updateButtons:notification];
	
	[self resourcesChanged:notification];
	[self undoRedoChanged:notification];
	[self updateTurnDoneButton:notification];
	[self updateCards:notification];
}

-(NSString*) playerDieImage
{
	switch ([[[GameState sharedGameState] currentPlayer] colorIndex]) {
		case 0:
			return @"hud_die_red.png";
			break;
		case 1:
			return @"hud_die_green.png";
			break;
		case 2:
			return @"hud_die_blue.png";
			break;
		case 3:
		default:
			return @"hud_die_yellow.png";
			break;
	}
}

-(NSString*) playerColonyImage
{
	switch ([[[GameState sharedGameState] currentPlayer] colorIndex]) {
		case 0:
			return @"hud_colony_red.png";
			break;
		case 1:
			return @"hud_colony_green.png";
			break;
		case 2:
			return @"hud_colony_blue.png";
			break;
		case 3:
		default:
			return @"hud_colony_yellow.png";
			break;
	}
}

-(void) updateButtons:(NSNotification *) notification
{
	CCNode* uiFrame = [self getChildByTag:UILayerTagFrame];
    Player* currentPlayer = [[GameState sharedGameState] currentPlayer];
    
	CCNode* rollButton = [uiFrame getChildByTag:UILayerTagButtonRoll];
    CCSprite* rollButtonGlow = (CCSprite*)[uiFrame getChildByTag:UILayerTagButtonRollGlow];
    
    bool showRoll = false;
    
    if ((!currentPlayer.initialRollDone) && ([currentPlayer isLocalHuman]))
        showRoll = true;
    
	[self setElementVisible:rollButton visible:showRoll];
    [self setElementVisible:rollButtonGlow visible:showRoll];
    
    if (showRoll)
    {
        [rollButtonGlow setOpacity:96];
		CCFadeIn* fadeIn = [CCFadeTo actionWithDuration:1 opacity:164];
		CCFadeOut* fadeOut = [CCFadeTo actionWithDuration:1 opacity:96];
		CCSequence* seq = [CCSequence actions:fadeIn, fadeOut, nil];
		CCRepeatForever* rep = [CCRepeatForever actionWithAction:seq];
		[rollButtonGlow runAction:rep];
    }
    else
    {
        [rollButtonGlow stopAllActions];
    }
}

-(void) updateCards:(NSNotification *) notification
{
	CCNode* uiFrame = [self getChildByTag:UILayerTagFrame];
	
	CCNode* trayNode = [uiFrame getChildByTag:UILayerTagCardTray];
	LayerTechCardTray* tray = (LayerTechCardTray*)trayNode;
	
	if (tray != nil)
		[tray updateCards:notification];
}

-(CGPoint) rollingTrayPosition
{ 
	// TODO: Account for getting the correct location in case the rolling tray is in motion.
//	CCNode* button = [self getChildByTag:UILayerTagButtonRoll];
	
	return [self convertToWorldSpace:ccp( 635, 92 )]; //button.position];
}

- (void) refreshState:(NSNotification *)notification
{
    [self performSelector:@selector(doRefreshState) withObject:nil afterDelay:0];
}

- (void) doRefreshState
{
	[self nextPlayer:nil];
    [self resourcesChanged:nil];
    [self updateLog:nil];
}

- (void) updateTurnDoneButton:(NSNotification *)notification
{
	CCNode* uiFrame = [self getChildByTag:UILayerTagFrame];
	CCNode* turnDoneButton = [uiFrame getChildByTag:UILayerTagButtonDone];
	CCSprite* turnDoneButtonGlow = (CCSprite*)[uiFrame getChildByTag:UILayerTagButtonDoneGlow];
	
	bool allShipsUsed = ([[[GameState sharedGameState] currentPlayer] numUndockedShips] == 0);
	
    // Never enable this button for AI players
    if (![[[GameState sharedGameState] currentPlayer] isLocalHuman])
        allShipsUsed = false;
    
    [self setButtonIsEnabled:turnDoneButton enabled:allShipsUsed];
    
    [self setElementVisible:turnDoneButtonGlow visible:allShipsUsed];
    
    if (allShipsUsed)
    {
        [turnDoneButtonGlow setOpacity:96];
		CCFadeIn* fadeIn = [CCFadeTo actionWithDuration:1 opacity:164];
		CCFadeOut* fadeOut = [CCFadeTo actionWithDuration:1 opacity:96];
		CCSequence* seq = [CCSequence actions:fadeIn, fadeOut, nil];
		CCRepeatForever* rep = [CCRepeatForever actionWithAction:seq];
		[turnDoneButtonGlow runAction:rep];
    }
    else
    {
        [turnDoneButtonGlow stopAllActions];
    }
}


-(void) updateHintAITick:(NSNotification*)notification
{
	CCNode* uiFrame = [self getChildByTag:UILayerTagFrame];
	CCLabelTTF* hintLabel = (CCLabelTTF*) [uiFrame getChildByTag:UILayerTagHintLabel];
	
	NSString* hintString = @"";
    
    if ([[[GameState sharedGameState] currentPlayer] isAI])
    {
        hintString = [[ExhaustiveAI shared] aiStatusText];
    }
	
	[hintLabel setString:hintString];
}

-(void) updateHint:(NSNotification*)notification
{
	GameTouchManager* touchManager = [[SceneGameiPad sharedLayer] touchManager];

	CCNode* uiFrame = [self getChildByTag:UILayerTagFrame];
	CCLabelTTF* hintLabel = (CCLabelTTF*) [uiFrame getChildByTag:UILayerTagHintLabel];
	
	NSString* hintString = [[[SceneGameiPad sharedLayer] touchManager] hintText];
	
	[hintLabel setString:hintString];
	
	// Update the buttons...
	CCNode* okButton = [uiFrame getChildByTag:UILayerTagButtonOk];
    bool viz = false;
    
	if ([touchManager queueIsActive])
        if ([touchManager currentSelection] != nil)
             if ([[touchManager currentSelection] isSelectionComplete])
                 viz = true;

    okButton.visible = viz;

/*	// TODO: Selectively enable this.
 	QueuedSelection* selection = [touchManager currentSelection];
 
	if (selection != nil)
	{
		if ([selection isSelectionComplete])
		{
			okButton.visible = true;
		}
		else {
			okButton.visible = false;
		}
	} else {
		okButton.visible = false;
	}
*/
	
}

-(void) okButtonTapped:(NSNotification*) notification
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

	GameTouchManager* touchManager = [[SceneGameiPad sharedLayer] touchManager];
	QueuedSelection* selection = [touchManager currentSelection];
	
	if (selection != nil)
	{
		if ([selection isSelectionComplete])
		{
			[[touchManager currentQueue] advance];
		}
	}
}

@end
