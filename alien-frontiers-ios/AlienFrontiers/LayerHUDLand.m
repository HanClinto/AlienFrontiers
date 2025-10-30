//
//  LayerHUDLand.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/22/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerHUDLand.h"


@implementation LayerHUDLand


-(void) buildGUI
{
	// ************* Frame ************* 
	
	// Add the current player's HUD
	CCNode* uiFrame = [CCNode node];  
	uiFrame.position = ccp( 1024 + 750 * 0.5, 234 * 0.5 - 260 + 150);
	uiFrame.anchorPoint = CGPointMake(0, 0);
	[self addChild:uiFrame z:UILayerTagFrame tag:UILayerTagFrame];
	
	CCSprite* frameSprite = [CCSprite spriteWithFile:@"hud_land_player_tab_large.png"];
	frameSprite.position = ccp(118, 377); // ccp( 1024 + [uiFrame texture].contentSize.width * 0.5, [uiFrame texture].contentSize.height * 0.5);
	[uiFrame addChild:frameSprite z:UILayerTagFrameSprite tag:UILayerTagFrameSprite];
	
	// ************* Buttons ************* 
	
	CCNode* rollButton = [self buttonFromImage:@"button_roll_up.png" 
									 downImage:@"button_roll_down.png" 
									  selector:@selector(rollButtonTapped:)
										 label:NSLocalizedString(@"ROLL", @"Roll button label")
									  fontSize:16];
	rollButton.position = ccp( 147, 632 ); 
	[uiFrame addChild:rollButton z:UILayerTagButtonRoll tag:UILayerTagButtonRoll];
	
	CCNode* undoButton = [self buttonFromImage:@"button_short_up.png" 
									 downImage:@"button_short_down.png" 
									  selector:@selector(undoButtonTapped:)
										 label:NSLocalizedString(@"UNDO", @"Undo button label")
									  fontSize:11];
	undoButton.position = ccp( 90 + 32, 545 + 23 );
	[uiFrame addChild:undoButton z:UILayerTagButtonUndo tag:UILayerTagButtonUndo];
	
	
	CCNode* redoButton = [self buttonFromImage:@"button_short_up.png" 
									 downImage:@"button_short_down.png" 
									  selector:@selector(redoButtonTapped:)
										 label:NSLocalizedString(@"REDO", @"Redo button label")
									  fontSize:11];
	redoButton.position = ccp( 90 + 32, 680 + 23 );
	[uiFrame addChild:redoButton z:UILayerTagButtonRedo tag:UILayerTagButtonRedo];
	
	
	CCNode* doneButton = [self buttonFromImage:@"button_long_up.png" 
									 downImage:@"button_long_down.png" 
									  selector:@selector(doneButtonTapped:)
										 label:NSLocalizedString(@"TURN DONE", @"Turn done button label")
									  fontSize:11];
	doneButton.position = ccp( 165, 545 );
	[uiFrame addChild:doneButton z:UILayerTagButtonDone tag:UILayerTagButtonDone];
	
	
	// User interface labels
	CCLabelTTF* label = [CCLabelTTF labelWithString:@"2" fontName:@"DIN-Black" fontSize:42];
	label.color = ccWHITE;
	label.position = CGPointMake(50-2, 690 + 21);
	label.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:label z:UILayerTagPlayerNumber tag:UILayerTagPlayerNumber];
	
	CCLabelTTF* oreLabel = [CCLabelTTF labelWithString:@"0" fontName:@"DIN-Black" fontSize:22];
	oreLabel.color = ccBLACK;
	oreLabel.position = CGPointMake(33, 665 - 35 - 35 - 35);
	oreLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:oreLabel z:UILayerTagOreLabel tag:UILayerTagOreLabel];
	
	CCLabelTTF* fuelLabel = [CCLabelTTF labelWithString:@"2" fontName:@"DIN-Black" fontSize:22];
	fuelLabel.color = ccBLACK;
	fuelLabel.position = CGPointMake(33, 665 - 35 - 35);
	fuelLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:fuelLabel z:UILayerTagFuelLabel tag:UILayerTagFuelLabel];
	
	CCLabelTTF* colonyLabel = [CCLabelTTF labelWithString:@"3" fontName:@"DIN-Black" fontSize:22];
	colonyLabel.color = ccBLACK;
	colonyLabel.position = CGPointMake(33, 665 - 35);
	colonyLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:colonyLabel z:UILayerTagColonyLabel tag:UILayerTagColonyLabel];
	
	CCLabelTTF* diceLabel = [CCLabelTTF labelWithString:@"5" fontName:@"DIN-Black" fontSize:22];
	diceLabel.color = ccBLACK;
	diceLabel.position = CGPointMake(33, 665);
	diceLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:diceLabel z:UILayerTagDiceLabel tag:UILayerTagDiceLabel];
	
	CCSprite* colonySprite;
	CCSprite* dieSprite;
	
	switch ([[[GameState sharedGameState] currentPlayer] colorIndex]) {
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
	//colonySprite.anchorPoint = CGPointMake(0, 1);
	//dieSprite.anchorPoint = CGPointMake(0, 1);
	
	colonySprite.position = ccp(colonyLabel.position.x + 23, colonyLabel.position.y - 2);
	dieSprite.position    = ccp(diceLabel.position.x + 23, diceLabel.position.y - 2);
	
	[uiFrame addChild:colonySprite z:UILayerTagColonySprite tag:UILayerTagColonySprite];
	[uiFrame addChild:dieSprite z:UILayerTagDiceSprite tag:UILayerTagDiceSprite];
	
	
	
/*	
	// Queued touch management
	CCLabelTTF* hintLabel = [CCLabelTTF labelWithString:@"" fontName:@"DIN-Black" fontSize:22];
	hintLabel.color = ccYELLOW;
	hintLabel.position = CGPointMake(706-148-349+165, 182 + 22 + 22);
	hintLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
	[uiFrame addChild:hintLabel z:UILayerTagHintLabel tag:UILayerTagHintLabel];
	
	
	CCNode* okButton = [self buttonFromImage:@"button_short_up.png" 
								   downImage:@"button_short_down.png" 
									selector:@selector(okButtonTapped:)
									   label:@"OK"
									fontSize:11];
	okButton.position = ccp( 374+275, 226 + 45 );
	[uiFrame addChild:okButton z:UILayerTagButtonOk tag:UILayerTagButtonOk];
	
	
	CCNode* cancelButton = [self buttonFromImage:@"button_short_up.png" 
									   downImage:@"button_short_down.png" 
										selector:@selector(cancelButtonTapped:)
										   label:@"X"
										fontSize:11];
	cancelButton.position = ccp( 374+275, 226 + 20 );
	[uiFrame addChild:cancelButton z:UILayerTagButtonCancel tag:UILayerTagButtonCancel];
	
	*/
	
	// Card tray
    // TODO: Make this a vertical card tray
	LayerTechCardTray* cardTray = [[LayerTechCardTray alloc] initWithPlayerIndex:-1];
	cardTray.position = CGPointMake( 20, 482 );
	cardTray.anchorPoint = CGPointMake(0, 1);
	[uiFrame addChild:cardTray z:UILayerTagCardTray tag:UILayerTagCardTray];
	
	
	LayerTechCardInspector* cardInspector = [[LayerTechCardInspector alloc] init];
	cardInspector.position = CGPointMake( 0, 400 );
	cardInspector.anchorPoint = CGPointMake(0, 1);
	[uiFrame addChild:cardInspector z:UILayerTagCardInspector tag:UILayerTagCardInspector];
	
	
	// Corner overlays
	CCSprite* cornerOverlay = [CCSprite spriteWithFile:@"hud_land_tint_corner.png"];
	cornerOverlay.position = ccp(50 - 3, 751 - 42);
	cornerOverlay.color = [[GameState sharedGameState] currentPlayer].color;
	[cornerOverlay setBlendFunc: (ccBlendFunc) { GL_DST_COLOR, GL_ONE_MINUS_SRC_ALPHA }];
	[uiFrame addChild:cornerOverlay z:UILayerTagCorner tag:UILayerTagCorner];
	
	CCSprite* edgeOverlay = [CCSprite spriteWithFile:@"hud_land_tint_edge.png"];
	edgeOverlay.position = ccp(67 - 21 - 25 + 96, 186 - 68 - 96);
	edgeOverlay.color = [[GameState sharedGameState] currentPlayer].color;
	[edgeOverlay setBlendFunc: (ccBlendFunc) { GL_DST_COLOR, GL_ONE_MINUS_SRC_ALPHA }];
	[uiFrame addChild:edgeOverlay z:UILayerTagEdge tag:UILayerTagEdge];
}



- (void)setElementVisible:(CCNode*) element visible:(bool)toVis
{
	[element setPosition:ccp(((int)element.position.x % 2000) + 2000 * (toVis ? 0 : 1), element.position.y)];
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
	
    if (UIDeviceOrientationIsLandscape(deviceOrientation)){
		[uiFrame stopAllActions];
		
		// Move the HUD
//		CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:CGPointMake(1024 + 18 - [uiFrame texture].contentSize.width * 0.5, uiFrame.position.y)];
		CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:CGPointMake(1024 + 18 - 750 * 0.5 + 140, uiFrame.position.y)];
		CCActionEase* ease = [CCEaseSineOut actionWithAction:move];
		[uiFrame runAction:ease];		
		
//		[[SceneGameiPad sharedLayer] setCurrentOrientation:deviceOrientation];
	} else if (UIDeviceOrientationIsPortrait(deviceOrientation) || firstTimeShown)
	{
		[uiFrame stopAllActions];
		
		// Move the HUD
        //		CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:CGPointMake(1024 + [uiFrame texture].contentSize.width * 0.5, uiFrame.position.y)];
		CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:CGPointMake(1024 + 750 * 0.5, uiFrame.position.y)];
		CCActionEase* ease = [CCEaseSineIn actionWithAction:move];
		[uiFrame runAction:ease];
		
        //		[[SceneGameiPad sharedLayer] setCurrentOrientation:deviceOrientation];
	}
	
	firstTimeShown = FALSE;
}


-(CGPoint) rollingTrayPosition
{ 
	// TODO: Account for getting the correct location in case the rolling tray is in motion.
	//	CCNode* button = [self getChildByTag:UILayerTagButtonRoll];
	
	return [self convertToWorldSpace:ccp( 635, 92 )]; //button.position];
}


		
@end
