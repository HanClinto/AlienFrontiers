//
//  LayerPlayerMiniHUD.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/19/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerPortPlayerMiniHUD.h"

#import "PlayerTechCardGroup.h"

@implementation LayerPortPlayerMiniHUD


-(id) initWithIndex:(int)index
{
	if ((self = [super init]))
	{
		[self setPosition:[self inactivePosition]];
		
		playerIndex = index;
		
		// ************* Frame ************* 
		
		// Add the HUD
        
        // Queue up both of the BG images for this frame
        [[CCTextureCache sharedTextureCache] addImage:@"hud_port_player_tab_full_RO.png"];
        [[CCTextureCache sharedTextureCache] addImage:@"hud_port_player_tab_full.png"];

		CCSprite* uiFrame = [CCSprite spriteWithFile:@"hud_port_player_tab_full_RO.png"]; // 54 pixels different
		uiFrame.position = ccp(0,0); // [self inactivePosition]; 
        uiFrame.anchorPoint = ccp(0.5, 1);
		
		[self addChild:uiFrame z:MiniHUDLayerTagFrame tag:MiniHUDLayerTagFrame];
		
		CCLabelTTF* playerScore = [CCLabelTTF labelWithString:[NSString stringWithFormat:@"%d", 0]
                                                     fontName:@"DIN-Black"
                                                     fontSize:42
                                                   dimensions:CGSizeMake(50,60)
                                                   hAlignment:UITextAlignmentCenter];
		playerScore.color = ccWHITE;
		playerScore.position = CGPointMake(74-148+35+35+35+35 - 2, 4 + 30 - 443);
//		playerNumber.anchorPoint = CGPointMake(0.5f, 0.5f);
		[self addChild:playerScore z:MiniHUDLayerTagScoreLabel tag:MiniHUDLayerTagScoreLabel];
		
		CCLabelTTF* oreLabel = [CCLabelTTF labelWithString:@""
												  fontName:@"DIN-Black"
												  fontSize:22
                                                dimensions:CGSizeMake(30,30)
                                                hAlignment:UITextAlignmentCenter];
		oreLabel.color = ccBLACK;
		oreLabel.position = CGPointMake(75-148 - 2, 0 - 17 + 30 - 443);
//		oreLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
		[self addChild:oreLabel z:MiniHUDLayerTagOreLabel tag:MiniHUDLayerTagOreLabel];
		
		CCLabelTTF* fuelLabel = [CCLabelTTF labelWithString:@""
                                                   fontName:@"DIN-Black"
                                                   fontSize:22
                                                 dimensions:CGSizeMake(30,30)
												 hAlignment:UITextAlignmentCenter];
		fuelLabel.color = ccBLACK;
		fuelLabel.position = CGPointMake(73-148+35 - 2, 0 - 17 + 30 - 443);
//		fuelLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
		[self addChild:fuelLabel z:MiniHUDLayerTagFuelLabel tag:MiniHUDLayerTagFuelLabel];
		
		CCLabelTTF* colonyLabel = [CCLabelTTF labelWithString:@""
                                                     fontName:@"DIN-Black"
                                                     fontSize:22
                                                   dimensions:CGSizeMake(30,30)
                                                   hAlignment:UITextAlignmentCenter];
		colonyLabel.color = ccBLACK;
		colonyLabel.position = CGPointMake(71-148+35+35 - 2, 0 - 17 + 30 - 443);
//		colonyLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
		[self addChild:colonyLabel z:MiniHUDLayerTagColonyLabel tag:MiniHUDLayerTagColonyLabel];
		
		CCLabelTTF* diceLabel = [CCLabelTTF labelWithString:@""
                                                   fontName:@"DIN-Black"
                                                   fontSize:22
                                                 dimensions:CGSizeMake(30,30)
												 hAlignment:UITextAlignmentCenter];
		diceLabel.color = ccBLACK;
		diceLabel.position = CGPointMake(70-148+35+35+35 - 2, 0 - 17 + 30 - 443);
//		diceLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
		[self addChild:diceLabel z:MiniHUDLayerTagDiceLabel tag:MiniHUDLayerTagDiceLabel];
		
        
        LayerTechCardTrayVertMini* cardTray = [[LayerTechCardTrayVertMini alloc] initWithPlayerIndex:playerIndex];
        
		cardTray.position = CGPointMake( -182 * 0.5 + 3, -223 + 114 );
		cardTray.anchorPoint = CGPointMake(0, 1);
		[self addChild:cardTray z:MiniHUDLayerTagCardTray tag:MiniHUDLayerTagCardTray];
		
        
        LayerTechCardInspectorVertMini* cardInspector = [[LayerTechCardInspectorVertMini alloc] initWithPlayerIndex:playerIndex];
        cardInspector.position = CGPointMake( -182 + 3 + 14, -223 + 114 - 160 - 50);
        cardInspector.anchorPoint = CGPointMake(0, 1);
        [self addChild:cardInspector z:MiniHUDLayerTagCardInspector tag:MiniHUDLayerTagCardInspector];
        
		
		CCSprite* colonySprite;
		CCSprite* dieSprite;
		
		switch ([[[GameState sharedGameState] playerByID:playerIndex] colorIndex]) {
			case 0:
				colonySprite = [CCSprite spriteWithFile:@"hud_colony_red.png"];
				dieSprite = [CCSprite spriteWithFile:@"hud_die_red.png"];
				break;
			case 1:
				colonySprite = [CCSprite spriteWithFile:@"hud_colony_green.png"];
				dieSprite = [CCSprite spriteWithFile:@"hud_die_green.png"];
				break;
			case 2:
				colonySprite = [CCSprite spriteWithFile:@"hud_colony_blue.png"];
				dieSprite = [CCSprite spriteWithFile:@"hud_die_blue.png"];
				break;
			case 3:
			default:
				colonySprite = [CCSprite spriteWithFile:@"hud_colony_yellow.png"];
				dieSprite = [CCSprite spriteWithFile:@"hud_die_yellow.png"];
				break;
		}
		
		colonySprite.position = ccp(colonyLabel.position.x, colonyLabel.position.y + 24);
		dieSprite.position    = ccp(diceLabel.position.x, diceLabel.position.y + 24);
		
		[self addChild:colonySprite z:MiniHUDLayerTagColonySprite tag:MiniHUDLayerTagColonySprite];
		[self addChild:dieSprite z:MiniHUDLayerTagDiceSprite tag:MiniHUDLayerTagDiceSprite];
		
		CCSprite* cornerOverlay = [CCSprite spriteWithFile:@"hud_port_corner_tint_mini.png"];
		cornerOverlay.position = ccp(67 - 1, 0 + 30 - 443);
		cornerOverlay.color = [[GameState sharedGameState] playerByID:playerIndex].color;
		[cornerOverlay setBlendFunc: (ccBlendFunc) { GL_DST_COLOR, GL_ONE_MINUS_SRC_ALPHA }];
		[self addChild:cornerOverlay z:MiniHUDLayerTagCorner tag:MiniHUDLayerTagCorner];
		
		//self.isTouchEnabled = YES;
        
        CCNode* fuelUpBtn = [self buttonFromImage:@"hud_button_ro_up.png" 
                                        downImage:@"hud_button_ro_up_active.png" 
                                    inactiveImage:@"hud_button_ro_up_inactive.png" 
                                         selector:@selector(raidFuelUpTapped:)];
        CCNode* fuelDownBtn = [self buttonFromImage:@"hud_button_ro_down.png" 
                                          downImage:@"hud_button_ro_down_active.png" 
                                      inactiveImage:@"hud_button_ro_down_inactive.png" 
                                           selector:@selector(raidFuelDownTapped:)];
        CCNode* oreUpBtn = [self buttonFromImage:@"hud_button_ro_up.png" 
                                       downImage:@"hud_button_ro_up_active.png" 
                                   inactiveImage:@"hud_button_ro_up_inactive.png" 
                                        selector:@selector(raidOreUpTapped:)];
        CCNode* oreDownBtn = [self buttonFromImage:@"hud_button_ro_down.png" 
                                          downImage:@"hud_button_ro_down_active.png" 
                                      inactiveImage:@"hud_button_ro_down_inactive.png" 
                                           selector:@selector(raidOreDownTapped:)];
        
        fuelUpBtn.position =    ccp(75-148+35 - 4, 0 - 17 + 30 - 443 - 28);
        fuelDownBtn.position =  ccp(75-148+35 - 4, 0 - 17 + 30 - 443 - 28 - 24);
        oreUpBtn.position =     ccp(73-148 - 1, 0 - 17 + 30 - 443 - 28);
        oreDownBtn.position =   ccp(73-148 - 1, 0 - 17 + 30 - 443 - 28 - 24);
        
        [self addChild:fuelUpBtn    z:MiniHUDLayerTagRaidFuelUpBtn     tag:MiniHUDLayerTagRaidFuelUpBtn];
        [self addChild:fuelDownBtn  z:MiniHUDLayerTagRaidFuelDownBtn   tag:MiniHUDLayerTagRaidFuelDownBtn];
        [self addChild:oreUpBtn     z:MiniHUDLayerTagRaidOreUpBtn      tag:MiniHUDLayerTagRaidOreUpBtn];
        [self addChild:oreDownBtn   z:MiniHUDLayerTagRaidOreDownBtn    tag:MiniHUDLayerTagRaidOreDownBtn];
        
        
		CCLabelTTF* oreToRaidLabel = [CCLabelTTF labelWithString:@"0"
                                                        fontName:@"DIN-Black"
                                                        fontSize:18
                                                      dimensions:CGSizeMake(30,30)
                                                      hAlignment:UITextAlignmentCenter];
		oreToRaidLabel.color = ccBLACK;
		oreToRaidLabel.position = CGPointMake(73-148 - 1 + 0.5, 0 - 17 + 30 - 443 - 28 - 12 - 2);
		[self addChild:oreToRaidLabel z:MiniHUDLayerTagOreToRaidLabel tag:MiniHUDLayerTagOreToRaidLabel];

		CCLabelTTF* fuelToRaidLabel = [CCLabelTTF labelWithString:@"0"
                                                         fontName:@"DIN-Black"
                                                         fontSize:18
                                                       dimensions:CGSizeMake(30,30)
                                                       hAlignment:UITextAlignmentCenter];
		fuelToRaidLabel.color = ccBLACK;
		fuelToRaidLabel.position = CGPointMake(73-148+35 - 2 + 0.5, 0 - 17 + 30 - 443 - 28 - 12 - 2);
		[self addChild:fuelToRaidLabel z:MiniHUDLayerTagFuelToRaidLabel tag:MiniHUDLayerTagFuelToRaidLabel];
		
		
        lastOrientation = UIDeviceOrientationUnknown;
		firstTimeShown = TRUE;
		expanded = FALSE;
		
		[self setPosition:[self inactivePosition]];
        
        raidShowing = true;
        [self checkRaid];
	}
	return self;
}



-(void) onEnter
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(orientationChanged:)   name:EVENT_ORIENTATION_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshState:)         name:EVENT_RESOURCES_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshState:)         name:EVENT_SHIP_ACTIVATE object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshState:)         name:EVENT_SHIP_DESTROY object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshState:)         name:EVENT_UNDO_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshState:)         name:EVENT_ARTIFACT_CARDS_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshState:)         name:EVENT_COLONIES_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshState:)         name:EVENT_STATE_RELOAD object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(beginRaid:)            name:EVENT_BEGIN_RAID object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(endRaid:)              name:EVENT_FINISH_RAID object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(orientationChanged:)   name:EVENT_ARTIFACT_CARDS_CHANGED object:nil];
    
    [[[CCDirector sharedDirector] touchDispatcher] addTargetedDelegate:self priority:0 swallowsTouches:YES];
    [self doRefreshState];
    [self doOrientationChanged];
    
    [super onEnter];
}

- (void) onExit
{
	[[NSNotificationCenter defaultCenter] removeObserver:self];
    [[[CCDirector sharedDirector] touchDispatcher] removeDelegate:self];
	
	[super onExit];
}

- (void)refreshState:(NSNotification *)notification
{
    [self performSelector:@selector(doRefreshState) withObject:nil afterDelay:0];
}

- (void)beginRaid:(NSNotification *)notification
{
    // Expand everyone but the current player
    expanded = [[[GameState sharedGameState] currentPlayer] playerIndex] != playerIndex;
    
    [self performSelector:@selector(doRefreshState) withObject:nil afterDelay:0];
    [self performSelector:@selector(doOrientationChanged) withObject:nil afterDelay:0];
}

- (void)endRaid:(NSNotification *)notification
{
    // Close everyone after a raid
    expanded = false;
    
    [self performSelector:@selector(doRefreshState) withObject:nil afterDelay:0];
    [self performSelector:@selector(doOrientationChanged) withObject:nil afterDelay:0];
}

- (void)doRefreshState
{
    int val = 0;
    
    CCLabelTTF* scoreLabel = (CCLabelTTF*) [self getChildByTag:MiniHUDLayerTagScoreLabel];
	CCLabelTTF* oreLabel = (CCLabelTTF*) [self getChildByTag:MiniHUDLayerTagOreLabel];
	CCLabelTTF* fuelLabel = (CCLabelTTF*) [self getChildByTag:MiniHUDLayerTagFuelLabel];
	CCLabelTTF* colonyLabel = (CCLabelTTF*) [self getChildByTag:MiniHUDLayerTagColonyLabel];
	CCLabelTTF* diceLabel = (CCLabelTTF*) [self getChildByTag:MiniHUDLayerTagDiceLabel];
	
	Player* player = [[GameState sharedGameState] playerByID:playerIndex];

    val = -[player oreToRaid];
    if (val != 0)
    {
        [oreLabel setColor:ccRED];
    }
    else
    {
        [oreLabel setColor:ccBLACK];
    }
    val += player.ore;
    [oreLabel setString:[NSString stringWithFormat:@"%d", val]];
    
	
    val = -[player fuelToRaid];
    if (val != 0)
    {
        [fuelLabel setColor:ccRED];
    }
    else
    { 
        [fuelLabel setColor:ccBLACK];
    }
    val += player.fuel;
    [fuelLabel setString:[NSString stringWithFormat:@"%d", val]];
    
    val = [player vps];
    [scoreLabel setString:[NSString stringWithFormat:@"%d", val]];
	
    [colonyLabel setString:[NSString stringWithFormat:@"%d", [player coloniesLeft]]];
	[diceLabel setString:[NSString stringWithFormat:@"%d", [[player activeShips] count]]];
	
	LayerTechCardTray* techs = (LayerTechCardTray*) [self getChildByTag:MiniHUDLayerTagCardTray];
	[techs updateCards:nil];
    
    // Raiding updates:
    [self checkRaid];
}

- (BOOL)touchingLowerTab:(UITouch *)touch
{
    /*
	CCSprite* cornerSprite = (CCSprite*) [self getChildByTag:MiniHUDLayerTagCorner];
	CGRect cornerRect = CGRectMake(cornerSprite.position.x, cornerSprite.position.y, [cornerSprite.texture contentSize].width , [cornerSprite.texture contentSize].height);
	CGPoint touchNodeSpace = [self convertTouchToNodeSpaceAR:touch];
	
    return CGRectContainsPoint(cornerRect, touchNodeSpace);
*/    
    CCNode* item = [self getChildByTag:MiniHUDLayerTagFrame];
    
	CGPoint touchLocation = [touch locationInView: [touch view]];
	touchLocation = [[CCDirector sharedDirector] convertToGL: touchLocation];
	
	CGPoint local = [item convertToNodeSpace:touchLocation];
	CGRect r = CGRectMake( item.position.x - item.contentSize.width*item.anchorPoint.x, item.position.y-
                          item.contentSize.height*item.anchorPoint.y,
                          item.contentSize.width, item.contentSize.height);
    
    
    r.size.height = 65;
//    r.size.height -= 380;
    
	r.origin = CGPointZero;
    r.origin.y += 55;
    
	if( CGRectContainsPoint( r, local ) )
		return true;
	
	return false;
}

- (BOOL)ccTouchBegan:(UITouch *)touch withEvent:(UIEvent *)event
{
    // 380 < y < 445
    
    
//    NSLog(@"ccTouchBegan Called");
	if ([self touchingLowerTab:touch])
	{
        expanded = !expanded;
        [self performSelector:@selector(doOrientationChanged) withObject:nil afterDelay:0];
        return YES;
	}
	
	return NO;
	/*
    if ( ![self containsTouchLocation:touch] ) 
	{
		return NO;
	}
//    NSLog(@"ccTouchBegan returns YES");
	
    return YES;
	 */
}

- (void)orientationChanged:(NSNotification *)notification
{
    [self performSelector:@selector(doOrientationChanged) withObject:nil afterDelay:0];
}

- (void)doOrientationChanged
{
    UIDeviceOrientation deviceOrientation = [UIDevice currentDevice].orientation;

#ifdef IGNORE_LANDSCAPE
    if (UIDeviceOrientationIsLandscape(deviceOrientation))
        deviceOrientation = UIDeviceOrientationUnknown;
#endif
    
    if (!(UIDeviceOrientationIsLandscape(deviceOrientation) || UIDeviceOrientationIsPortrait(deviceOrientation)))
    {
        deviceOrientation = lastOrientation;
    }
        
    
    if (UIDeviceOrientationIsLandscape(deviceOrientation))
    {
        [self stopAllActions];
        
        // Move the HUD to landscape
        CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:[self inactivePosition]];
        CCActionEase* ease = [CCEaseSineIn actionWithAction:move];
        [self runAction:ease];
        
        lastOrientation = deviceOrientation;
        
    } else if (UIDeviceOrientationIsPortrait(deviceOrientation) || firstTimeShown || (deviceOrientation == UIDeviceOrientationUnknown)){
        [self stopAllActions];
        
        // Move the portrait HUD
        CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:[self activePosition]];
        CCActionEase* ease = [CCEaseSineOut actionWithAction:move];
        [self runAction:ease];
        
        lastOrientation = deviceOrientation;
    }
	
	firstTimeShown = FALSE;
    
    [self checkRaid];
	
    
	/*
	// Determine if our current device orientation matches the active orientation mode of this HUD -- I.E., do we show only in portrait, or only in landscape?
    UIDeviceOrientation deviceOrientation = [UIDevice currentDevice].orientation;
	bool orientationMatch = ! ( (UIDeviceOrientationIsLandscape(deviceOrientation) ? 0 : 1) ^ ([self isPortraitHUD] ? 1 : 0));
	
	CCLOG(@"Orientation is landscape (%d), is portrait (%d)", UIDeviceOrientationIsLandscape(deviceOrientation), UIDeviceOrientationIsPortrait(deviceOrientation));
	
	 */
	// HACK
	/*
	// If this is the first time we're running, then make sure we activate the Portrait HUD
	static bool firstTime = true;
	if (firstTime && [self isPortraitHUD])
		orientationMatch = true;
	firstTime = false;
	*/
	/*
	// Glide our HUD into place:
	[self stopAllActions];
	
	// If we're in our matched orientation, then move to the active position.  Otherwise, move to the inactive state.
	CGPoint pos = orientationMatch ? [self activePosition] : [self inactivePosition];
	
	// Create our move action.
	CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:pos];
	
	// Ease out when coming on screen, and ease in when going off screen.
	CCActionEase* ease = orientationMatch ? [CCEaseSineOut actionWithAction:move] : [CCEaseSineIn actionWithAction:move];
		
	// Run the action
	[self runAction:ease];
		
	// TODO: Needed?
	//[[SceneGameiPad sharedLayer] setCurrentOrientation:deviceOrientation];
	 
	 */
}


-(bool) isPortraitHUD
{
	return true;
}


-(CGPoint) activePosition
{
	static CGPoint cachedPosition;
	static bool firstTime = true;
	int numPlayers = [[GameState sharedGameState] numPlayers];

//	if (firstTime)
	{
		CCSprite* uiFrame = (CCSprite*) [self getChildByTag:MiniHUDLayerTagFrame];
//		cachedPosition = ccp( screenSize.width * 0.5 + ([[GameState sharedGameState] numPlayers] * 0.5 - playerIndex) * [uiFrame texture].contentSize.width, 
// 							 (screenSize.height - [uiFrame texture].contentSize.height * 0.5));
//        int count = [[[[GameState sharedGameState] playerByID:playerIndex] cards] count];
		cachedPosition = ccp( 768 * 0.5 - (numPlayers * 0.5 - playerIndex - 0.5) * ([uiFrame texture].contentSize.width + 5), 
 							 (1024) + (expanded ? 0 : 380));
		
		firstTime = false;
	}
	
	return cachedPosition;
}

-(CGPoint) inactivePosition
{
	static CGPoint cachedPosition;
	static bool firstTime = true;
	int numPlayers = [[GameState sharedGameState] numPlayers];
	
//	if (firstTime)
	{
		CCSprite* uiFrame = (CCSprite*) [self getChildByTag:MiniHUDLayerTagFrame];
//		cachedPosition = ccp( screenSize.width * 0.5 + ([[GameState sharedGameState] numPlayers] * 0.5 - playerIndex) * [uiFrame texture].contentSize.width, 
//							 (screenSize.height + [uiFrame texture].contentSize.height * 0.5));
		cachedPosition = ccp( 768 * 0.5 - (numPlayers * 0.5 - playerIndex - 0.5) * ([uiFrame texture].contentSize.width + 5), 
							 (1024 + [uiFrame texture].contentSize.height)); // + [uiFrame texture].contentSize.height));
		
		firstTime = false;
	}
	
	return cachedPosition;
}

-(bool) isTouching:(CCNode*)item with:(UITouch*) touch
{
	CGPoint touchLocation = [touch locationInView: [touch view]];
	touchLocation = [[CCDirector sharedDirector] convertToGL: touchLocation];
	
	CGPoint local = [item convertToNodeSpace:touchLocation];
	CGRect r = CGRectMake( item.position.x - item.contentSize.width*item.anchorPoint.x, item.position.y-
							item.contentSize.height*item.anchorPoint.y,
							item.contentSize.width, item.contentSize.height);
	r.origin = CGPointZero;
	if( CGRectContainsPoint( r, local ) )
		return true;
	
	return false;
}

-(void) checkRaid
{
    Player* currentPlayer = [[GameState sharedGameState] currentPlayer];
    Player* player = [[GameState sharedGameState] playerByID:playerIndex];
    
    CCNode* raidOreUpButton = [self getChildByTag:MiniHUDLayerTagRaidOreUpBtn];
    CCNode* raidOreDownButton = [self getChildByTag:MiniHUDLayerTagRaidOreDownBtn];
    CCNode* raidFuelUpButton = [self getChildByTag:MiniHUDLayerTagRaidFuelUpBtn];
    CCNode* raidFuelDownButton = [self getChildByTag:MiniHUDLayerTagRaidFuelDownBtn];
    CCLabelTTF* raidOreLabel = (CCLabelTTF*) [self getChildByTag:MiniHUDLayerTagOreToRaidLabel];
    CCLabelTTF* raidFuelLabel = (CCLabelTTF*) [self getChildByTag:MiniHUDLayerTagFuelToRaidLabel];
    
    bool showRaid = false;
    
    if (([currentPlayer isRaiding]) && 
        ([currentPlayer playerIndex] != playerIndex))
    {
        showRaid = true;
    }
    
    if (showRaid)
    {
        [raidOreLabel setString:[NSString stringWithFormat:@"%d", [player oreToRaid]]];
        [raidFuelLabel setString:[NSString stringWithFormat:@"%d", [player fuelToRaid]]];
        
        [self setButtonIsEnabled:raidOreDownButton enabled:([player oreToRaid] != 0)];
        [self setButtonIsEnabled:raidFuelDownButton enabled:([player fuelToRaid] != 0)];

        [self setButtonIsEnabled:raidOreUpButton enabled:[player canRaidMoreOre]];
        [self setButtonIsEnabled:raidFuelUpButton enabled:[player canRaidMoreFuel]];
    }

    if (showRaid == raidShowing)
        return;
    
    CCSprite* uiFrame = (CCSprite*) [self getChildByTag:MiniHUDLayerTagFrame];
    
    NSAssert(uiFrame != nil, @"Cannot find the UI frame...");

    if (showRaid)
    {
        [uiFrame setTexture:[[CCTextureCache sharedTextureCache] addImage:@"hud_port_player_tab_full_RO.png"]];
        [raidOreUpButton    setVisible:true];
        [raidOreDownButton  setVisible:true];
        [raidFuelUpButton   setVisible:true];
        [raidFuelDownButton setVisible:true];
        [raidOreLabel       setVisible:true];
        [raidFuelLabel      setVisible:true];
    }
    else {
        [uiFrame setTexture:[[CCTextureCache sharedTextureCache] addImage:@"hud_port_player_tab_full.png"]];
        [raidOreUpButton    setVisible:false];
        [raidOreDownButton  setVisible:false];
        [raidFuelUpButton   setVisible:false];
        [raidFuelDownButton setVisible:false];
        [raidOreLabel       setVisible:false];
        [raidFuelLabel      setVisible:false];
    }
    
    raidShowing = showRaid;
}

-(CCSprite *) itemForTouch: (UITouch *) touch
{
	CGPoint touchLocation = [touch locationInView: [touch view]];
	touchLocation = [[CCDirector sharedDirector] convertToGL: touchLocation];
	for( CCSprite* item in [self children] ) {
		CGPoint local = [item convertToNodeSpace:touchLocation];
		CGRect r = CGRectMake( item.position.x - item.contentSize.width*item.anchorPoint.x, item.position.y-
							  item.contentSize.height*item.anchorPoint.y,
							  item.contentSize.width, item.contentSize.height);
		r.origin = CGPointZero;
		if( CGRectContainsPoint( r, local ) )
			return item;
	}
	return nil;
}

-(void) raidFuelUpTapped:(id)sender
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

    Player* player = [[GameState sharedGameState] playerByID:playerIndex];
    
    [player setFuelToRaid:[player fuelToRaid] + 1];
    
    [[GameState sharedGameState] postEvent:GUI_EVENT_QUEUED_SELECTION_CHANGED object:self];
}
-(void) raidFuelDownTapped:(id)sender
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    Player* player = [[GameState sharedGameState] playerByID:playerIndex];
    
    [player setFuelToRaid:[player fuelToRaid] - 1];

    [[GameState sharedGameState] postEvent:GUI_EVENT_QUEUED_SELECTION_CHANGED object:self];
}
-(void) raidOreUpTapped:(id)sender
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

    Player* player = [[GameState sharedGameState] playerByID:playerIndex];
    
    [player setOreToRaid:[player oreToRaid] + 1];    

    [[GameState sharedGameState] postEvent:GUI_EVENT_QUEUED_SELECTION_CHANGED object:self];
}
-(void) raidOreDownTapped:(id)sender
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    Player* player = [[GameState sharedGameState] playerByID:playerIndex];
    
    [player setOreToRaid:[player oreToRaid] - 1];

    [[GameState sharedGameState] postEvent:GUI_EVENT_QUEUED_SELECTION_CHANGED object:self];
}


@end
