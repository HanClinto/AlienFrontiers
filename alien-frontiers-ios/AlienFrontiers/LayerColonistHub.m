//
//  LayerColonistHub.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/22/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerColonistHub.h"


@implementation LayerColonistHub

-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
        int vertOffset = (4 - [[[self facility] dockGroups] count]) * 14; // For 2 and 3 player games we "squish" the elements together, both from the top and the bottom.  The label and the track moves down, and the legend moves up by the same amount to split the difference.
        
		label1 = [CCLabelTTF labelWithString:NSLocalizedString(@"COLONIST HUB", @"Colonist hub display name") fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label1.color = ccWHITE;
        label1.opacity = ORBITAL_FONT_OPACITY;
		label1.position = ccp(0,81 - 16 - 12 - vertOffset);
		label1.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label1 z:1 tag:LayerCHTagLabel1];
		
		CCSprite* dock;
		int cnt=0;
		int groupCnt=0;
        
        
		for (DockGroup* group in [[self facility] dockGroups])
		{
			for (DockingBay* bay in [group dockArray])
			{
				dock = [CCSprite spriteWithFile:@"dock_normal.png"];
			
				dock.anchorPoint = CGPointMake(0,0);
				dock.position = ccp(  0 + cnt * (dock.contentSize.width + 2), 
								8 - groupCnt * (dock.contentSize.height + 2) - vertOffset );
				[self addChild:dock];
				
				dockPositions[groupCnt * 3 + cnt] = dock.position;
				
				[docks addObject:dock];
				cnt++;
			}
			
			CCSprite* step;
			
			for (cnt = 0; cnt < 6; cnt++)
			{
				step = [CCSprite spriteWithFile:@"colonist_track_node_wide.png"];
				
				step.anchorPoint = CGPointMake(0,0);
				step.position = ccp( 76 + cnt * ( 26 + 2 ),
									8 - groupCnt * ( 26 + 2 ) - vertOffset ); // dock.contentSize.height + 2) );
				[self addChild:step];
			}
			
			step = [CCSprite spriteWithFile:@"colonist_track_endpoint_wide.png"];
			step.anchorPoint = CGPointMake(0,0);
			step.position = ccp( 272 - 28 , 8 - groupCnt * ( 26 + 2 ) - vertOffset );
			[self addChild:step];
			
			CCSprite* colony;
			
			switch ([[[GameState sharedGameState] playerByID:groupCnt] colorIndex]) {
				case 0:
					colony = [CCSprite spriteWithFile:@"colony_red.png"];
					break;
				case 1:
					colony = [CCSprite spriteWithFile:@"colony_green.png"];
					break;
				case 2:
					colony = [CCSprite spriteWithFile:@"colony_blue.png"];
					break;
				case 3:
				default:
					colony = [CCSprite spriteWithFile:@"colony_yellow.png"];
					break;
			}

			colony.position = [self pointForStep:0 forPlayer:groupCnt];
			colony.anchorPoint = CGPointMake(0,0);
			colony.visible = false;
			[self addChild:colony 
						 z:LayerCHTagColony1+groupCnt 
					   tag:LayerCHTagColony1+groupCnt];
			
			cnt = 0;
			groupCnt++;
		}
		
		CCSprite* legend = [CCSprite spriteWithFile:@"icons_ch.png"];
		legend.position = ccp( 0, 7 - 84 + vertOffset );
		legend.anchorPoint = CGPointMake(0,1);
		[self addChild:legend];
		
		
		CCNode* launchButton = [self buttonFromImage:@"button_medium_up.png" 
										   downImage:@"button_medium_down.png" 
											selector:@selector(launchColonyTapped:)
											   label:NSLocalizedString(@"LAUNCH", "Colonist Hub launch button")
											fontSize:12];
		launchButton.position = ccp( 272, 20 );
//		launchButton.position = ccp(-500, -500);
		launchButton.visible = false;
		[self addChild:launchButton z:LayerCHTagLaunchButton tag:LayerCHTagLaunchButton];		
		
	}
	return self;
}

-(void) onEnter
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(colonyAdvance:) name:EVENT_COLONIST_HUB_ADVANCE object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(colonyAdvance:) name:EVENT_STATE_RELOAD object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateLaunchButton:) name:EVENT_NEXT_PLAYER object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateLaunchButton:) name:EVENT_RESOURCES_CHANGED object:nil];
    
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
	return [[GameState sharedGameState] colonistHub];
}

-(CGPoint) pointForStep:(int)step forPlayer:(int)playerIndex
{
    int vertOffset = (4 - [[[self facility] dockGroups] count]) * 14;
    
	if (step < MAX_COLONY_POSITION)
	{
		return ccp( 76 - 29 + step * ( 26 + 2 ) + 1,
				   0 - playerIndex * ( 26 + 2 ) - vertOffset );
	}
	
	return ccp( 280 - 28 - 1 , 0 - playerIndex * ( 26 + 2 ) - vertOffset );
}


-(void) colonyAdvance:(NSNotification *) notification
{
	CCSprite* colonySprite;
	int colonyStep;
	
	for (int cnt = 0; cnt < [[GameState sharedGameState] numPlayers]; cnt++) {
		colonySprite = (CCSprite*) [self getChildByTag:LayerCHTagColony1 + cnt];
		colonyStep = [[[GameState sharedGameState] colonistHub] colonyPosition:cnt];
		
		// Position the colony if needed
		CGPoint pt = [self pointForStep:colonyStep forPlayer:cnt];

		if ((colonySprite.position.x != pt.x) ||
			(colonySprite.position.y != pt.y))
		{
			[colonySprite stopAllActions];
		
			CCMoveTo* move = [CCMoveTo actionWithDuration:0.5 position:pt];
			CCActionEase* ease = [CCEaseSineInOut actionWithAction:move];
			[colonySprite runAction:ease];
		
			// Make the colony visible or not.
		
			colonySprite.visible = (colonyStep != 0);
		}
	}
	
	[self updateLaunchButton:notification];
}

-(void) updateLaunchButton:(NSNotification *) notification
{
	CCNode* launchButton = [self getChildByTag:LayerCHTagLaunchButton];

    int vertOffset = (4 - [[[self facility] dockGroups] count]) * 14;
	
	if ( [[[GameState sharedGameState] colonistHub] ableToLaunch] )
	{
		launchButton.position = ccp( 282, 
									20 - [[[GameState sharedGameState] currentPlayer] playerIndex] * ( 26 + 2 ) - vertOffset );
		launchButton.visible = true;
	}
	else {
		launchButton.visible = false;
//		launchButton.position = ccp(-500, -500);
	}

}


- (void)launchColonyTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ([[[GameState sharedGameState] colonistHub] ableToLaunch])
	{
		[[[GameState sharedGameState] colonistHub] launchColony];
	}
    
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
}


@end
