//
//  LayerTerraformingStation.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/23/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerTerraformingStation.h"


@implementation LayerTerraformingStation

-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
		//		self.isTouchEnabled = YES;
		
		label1 = [CCLabelTTF labelWithString:NSLocalizedString(@"TERRAFORMING", @"Terraforming Station display line 1") fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label1.color = ccWHITE;
        label1.opacity = 0xCC;
		label1.position = ccp(0,79 - 12);
		label1.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label1 z:1 tag:LayerTSTagLabel1];
		
		label2 = [CCLabelTTF labelWithString:NSLocalizedString(@"STATION", @"Terraforming Station display line 2") fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label2.color = ccWHITE;
        label2.opacity = ORBITAL_FONT_OPACITY;
		label2.position = ccp(0,66 - 12);
		label2.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label2 z:1 tag:LayerTSTagLabel2];	
		
		CCSprite* dock;
		int cnt=0;
		for (DockGroup* group in [[self facility] dockGroups])
		{
			dock = [CCSprite spriteWithFile:@"dock_ts.png"];
			
			dock.anchorPoint = CGPointMake(0,0);
			dock.position = ccp(  -5 + cnt * (dock.contentSize.width + 2), 
								8 );
			[self addChild:dock];
			
			dockPositions[cnt] = ccp(dock.position.x + 11, dock.position.y);
			
			[docks addObject:dock];
			cnt++;
		}
		
		CCSprite* legend = [CCSprite spriteWithFile:@"icons_ts.png"];
		legend.position = ccp( 0, 7 );
		legend.anchorPoint = CGPointMake(0,1);
		[self addChild:legend];
		
	}
	return self;
}


-(Orbital*) facility
{
	return [[GameState sharedGameState] terraformingStation];
}


@end
