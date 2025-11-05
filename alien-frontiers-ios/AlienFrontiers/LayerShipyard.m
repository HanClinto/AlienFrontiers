//
//  LayerShipyard.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/23/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerShipyard.h"


@implementation LayerShipyard

-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
		//		self.isTouchEnabled = YES;
		
		label1 = [CCLabelTTF labelWithString:NSLocalizedString(@"SHIPYARD", @"Shipyard display name") fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label1.color = ccWHITE;
        label1.opacity = ORBITAL_FONT_OPACITY;
		label1.position = ccp(0,65 - 12);
		label1.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label1 z:1 tag:LayerSYTagLabel1];
		
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
		
		CCSprite* legend = [CCSprite spriteWithFile:@"icons_sy.png"];
		legend.position = ccp( 0, 7 );
		legend.anchorPoint = CGPointMake(0,1);
		[self addChild:legend];
		
	}
	return self;
}


-(Orbital*) facility
{
	return [[GameState sharedGameState] shipyard];
}


@end
