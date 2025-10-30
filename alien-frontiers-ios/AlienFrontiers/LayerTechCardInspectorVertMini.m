//
//  LayerTechCardInspectorVertMini.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/8/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//

#import "LayerTechCardInspectorVertMini.h"


@implementation LayerTechCardInspectorVertMini


-(void) displayCard:(TechCard*) card
{
    CCNode* raidButton = nil;

	CCNode* obj;
    
    obj = [self getChildByTag:TechCardInspectorTagUsePowerButton];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];

    if (card != nil)
    {
        CCNode* raidButton = nil;

        if ([[[GameState sharedGameState] currentPlayer] canRaidCard:card])
        {
            raidButton = [self buttonFromImage:@"menu_button_104.png"
                                     downImage:@"menu_button_104_active.png" 
                                      selector:@selector(raidButtonTapped:)
                                         label:NSLocalizedString(@"RAID CARD", @"Button to raid card from player")
                                      fontSize:11
                                     fontColor:ccBLACK];
            
            raidButton.position = ccp( 330 * 0.5, -45);
            
            [self addChild:raidButton z:TechCardInspectorTagUsePowerButton tag:TechCardInspectorTagUsePowerButton];
        }
    }
    
    if (displayingCard == card)
        return;
    
    displayingCard = card;
    
	// First, clean up after any old card that may have been displayed
	obj = [self getChildByTag:TechCardInspectorTagOrSeparator];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];
    
	obj = [self getChildByTag:TechCardInspectorTagPowerImage];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];
    
	obj = [self getChildByTag:TechCardInspectorTagDiscardImage];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];
    
	obj = [self getChildByTag:TechCardInspectorTagPowerLabel];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];
    
	obj = [self getChildByTag:TechCardInspectorTagDiscardLabel];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];
	
	// Then, add new stuff for the next card (if applicable)
	if (card != nil)
	{
        if ([[[GameState sharedGameState] currentPlayer] canRaidCard:card])
        {
            raidButton = [self buttonFromImage:@"menu_button_104.png"
                                     downImage:@"menu_button_104_active.png" 
                                      selector:@selector(raidButtonTapped:)
                                         label:NSLocalizedString(@"RAID CARD", @"Button to raid card from player")
                                      fontSize:11
                                     fontColor:ccBLACK];
        }
		
		int abilityCount = 0;
		
		if (([card hasPower]) || (!([card hasPower]) && !([card hasDiscard])))
		{
			abilityCount++;
		}
		if ([card hasDiscard])
		{
			abilityCount++;
		}
        
        if (![[card powerText] isEqual: @""])
        {
            int width = 170;
            
            CCLabelBMFont *myLabel = [CCLabelBMFont 
                                      labelWithString:[card powerText]
                                      fntFile:@"DIN_Tech_12.fnt" width:width alignment:UITextAlignmentCenter];
            
			if (![[card discardText] isEqual: @""])
				myLabel.position = ccp( 330 * 0.5, 140 * 3 * 0.25 + 82 - 150 + 14 + 8 );
			else
				myLabel.position = ccp( 330 * 0.5, 140 * 2 * 0.25 + 82 - 150 + 14 );
            
            [self addChild:myLabel z:TechCardInspectorTagPowerLabel tag:TechCardInspectorTagPowerLabel];
        }
        
        if (![[card discardText] isEqual: @""])
        {
            int width = 170;
            
            CCLabelBMFont *myLabel = [CCLabelBMFont 
                                      labelWithString:[card discardText]
                                      fntFile:@"DIN_Tech_12.fnt" width:width alignment:UITextAlignmentCenter];
            
			if (![[card powerText] isEqual: @""])
				myLabel.position = ccp( 330 * 0.5, 140 * 1 * 0.25 + 82 - 150 + 14 + 8 );
			else
				myLabel.position = ccp( 330 * 0.5, 140 * 2 * 0.25 + 82 - 150 + 14 );
            
            [self addChild:myLabel z:TechCardInspectorTagDiscardLabel tag:TechCardInspectorTagDiscardLabel];
        }
        
        if ((![[card powerText] isEqualToString:@""]) && (![[card discardText] isEqualToString:@""]))
        {
            CCSprite* orSeparator = [CCSprite spriteWithFile:@"hud_port_or_bar.png"];
            
            orSeparator.position = ccp( 330 * 0.5, 54 - 38 + 2 + 8 );
            
            [self addChild:orSeparator z:TechCardInspectorTagOrSeparator tag:TechCardInspectorTagOrSeparator];
        }
    }
}

-(void) raidButtonTapped:(NSNotification*) notification
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

	if (displayingCard != nil)
	{
		if ([displayingCard owner] != nil)
		{
            if ([[[GameState sharedGameState] currentPlayer] canRaidCard:displayingCard])
            {
                [[[GameState sharedGameState] currentPlayer] setCardToRaid:displayingCard];
                [[[GameState sharedGameState] currentPlayer] finishRaid];
            }
        }
    }
}


@end
