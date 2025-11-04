//
//  LayerLunarMine.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/23/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerLunarMine.h"

@implementation LayerLunarMine

-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
		//		self.isTouchEnabled = YES;
		
		label1 = [CCLabelTTF labelWithString:NSLocalizedString(@"LUNAR MINE", @"Orbital display name") fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label1.color = ccWHITE;
        label1.opacity = ORBITAL_FONT_OPACITY;
		label1.position = ccp(0,65 - 12);
		label1.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label1 z:LayerLMTagLabel1 tag:LayerLMTagLabel1];
		
        /*
		label2 = [CCLabelTTF labelWithString:@"MINE" fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label2.color = ccWHITE;
        label2.opacity = ORBITAL_FONT_OPACITY;
		label2.position = ccp(0,67);
		label2.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label2 z:1 tag:LayerLMTagLabel2];		
		*/
		
		CCSprite* icon = [CCSprite spriteWithFile:@"icon_gte.png"];
		icon.anchorPoint = CGPointMake(0,0);
		icon.position = ccp( 0, 12 );
		[self addChild:icon z:LayerLMTagGTIcon tag:LayerLMTagGTIcon];
		
		CCSprite* dock;
		int cnt=0;
		for (DockGroup* group in [[self facility] dockGroups])
		{
			dock = [CCSprite spriteWithFile:@"dock_normal.png"];
			
			dock.anchorPoint = CGPointMake(0,0);
			dock.position = ccp(  0 + icon.contentSize.width + 4 + cnt * (dock.contentSize.width + 2), 
								8 );
			[self addChild:dock];
			
			dockPositions[cnt] = dock.position;
			
			[docks addObject:dock];
			cnt++;
		}
		
		CCSprite* legend = [CCSprite spriteWithFile:@"icons_lm.png"];
		legend.position = ccp( 0, 7 );
		legend.anchorPoint = CGPointMake(0,1);
		[self addChild:legend];
		
	}
	return self;
}

-(Orbital*) facility
{
	return [[GameState sharedGameState] lunarMine];
}

@end
