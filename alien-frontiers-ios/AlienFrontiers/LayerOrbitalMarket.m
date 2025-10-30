//
//  LayerOrbitalMarket.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/25/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerOrbitalMarket.h"


@implementation LayerOrbitalMarket


-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
		
		label1 = [CCLabelTTF labelWithString:NSLocalizedString(@"ORBITAL MARKET", @"Market display name") fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label1.color = ccWHITE;
        label1.opacity = ORBITAL_FONT_OPACITY;
		label1.position = ccp(0,65 - 12);
		label1.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label1 z:1 tag:LayerOMTagLabel1];
		
        /*
		label2 = [CCLabelTTF labelWithString:@"MARKET" fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label2.color = ccWHITE;
        label2.opacity = ORBITAL_FONT_OPACITY;
		label2.position = ccp(0,67);
		label2.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label2 z:1 tag:LayerOMTagLabel2];
		*/
        
		CCSprite* dock;
		int cnt=0;
		for (DockGroup* group in [[self facility] dockGroups])
		{
			dock = [CCSprite spriteWithFile:@"dock_pair.png"];
			
			dock.anchorPoint = CGPointMake(0,0);
			dock.position = ccp(  0 + cnt * (dock.contentSize.width + 2), 
								8 );
			[self addChild:dock];
			
			dockPositions[cnt * 2] = ccp(dock.position.x - 1, dock.position.y);
			dockPositions[cnt * 2 + 1] = ccp(dock.position.x + 25, dock.position.y);
			
			[docks addObject:dock];
			cnt++;
		}
		
		CCSprite* legend = [CCSprite spriteWithFile:@"icons_om.png"];
		legend.position = ccp( 0, 6 );
		legend.anchorPoint = CGPointMake(0,1);
		[self addChild:legend];
		
		CCNode* tradeButton = [self buttonFromImage:@"button_medium_up.png" 
										  downImage:@"button_medium_down.png" 
										   selector:@selector(tradeTapped:)
											  label:NSLocalizedString(@"TRADE", @"Orbital market trade button label")
										   fontSize:12];
		tradeButton.position = ccp(55,-55+28);
		tradeButton.visible = false;
		[self addChild:tradeButton z:LayerOMTagTradeButton tag:LayerOMTagTradeButton];		
		
	}
	return self;
}

-(void) onEnter
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateTradeButton:) name:EVENT_STATE_RELOAD object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateTradeButton:) name:EVENT_NEXT_PLAYER object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateTradeButton:) name:EVENT_RESOURCES_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateTradeButton:) name:EVENT_MARKET_PRICE_CHANGED object:nil];
    
    [super onEnter];
}

- (void) onExit
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	[[NSNotificationCenter defaultCenter] removeObserver:self];
	
	[super onExit];
}

-(Orbital*) facility
{
	return [[GameState sharedGameState] orbitalMarket];
}

-(void) updateTradeButton:(NSNotification *) notification
{
	bool tradePossible = false;
	CCNode* tradeButton = [self getChildByTag:LayerOMTagTradeButton];
	
	// If we have ships docked...
	if ([[[GameState sharedGameState] currentPlayer] marketPrice] > 0)
	{
		// And we have fuel available...
		if ([[[GameState sharedGameState] currentPlayer] fuel] >= [[[GameState sharedGameState] currentPlayer] marketPrice])
		{
			tradePossible = true;
		}
	}
	
	if (tradePossible)
	{
		tradeButton.visible = true;
	}
	else {
		tradeButton.visible = false;
	}
}

- (void)tradeTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
    if (![[[GameState sharedGameState] currentPlayer] isLocalHuman])
        return;
    
	// Double check that trade is possible
	if ([[[GameState sharedGameState] currentPlayer] ableToMarketTrade])
	{
		[[[GameState sharedGameState] currentPlayer] doMarketTrade];
	}

    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
}



@end
