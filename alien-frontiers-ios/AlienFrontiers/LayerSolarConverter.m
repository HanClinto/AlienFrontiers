//
//  LayerSolarConverter.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/6/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerSolarConverter.h"


@implementation LayerSolarConverter

-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	if ((self = [super init]))
	{
//		self.isTouchEnabled = YES;
		
		label1 = [CCLabelTTF labelWithString:NSLocalizedString(@"SOLAR CONVERTER", @"Solar Converter display name") fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label1.color = ccWHITE;
        label1.opacity = ORBITAL_FONT_OPACITY;
		label1.position = ccp(0,94 - 12);
		label1.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label1 z:1 tag:LayerSCTagLabel1];
		
        /*
		label2 = [CCLabelTTF labelWithString:@"CONVERTER" fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label2.color = ccWHITE;
        label2.opacity = ORBITAL_FONT_OPACITY;
		label2.position = ccp(0,92);
		label2.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label2 z:1 tag:LayerSCTagLabel2];
		*/
        
		CCSprite* dock;
		int cnt=0;
		for (DockGroup* group in [[self facility] dockGroups])
		{
			dock = [CCSprite spriteWithFile:@"dock_normal.png"];

			dock.anchorPoint = CGPointMake(0,0);
			dock.position = ccp(  0 + (cnt % 4) * (dock.contentSize.width + 2),
								8 - ((int) (cnt / 4) - 1) * (dock.contentSize.height + 6));
			[self addChild:dock];
			
			dockPositions[cnt] = dock.position;
			
			[docks addObject:dock];
			cnt++;
		}
		
		CCSprite* legend = [CCSprite spriteWithFile:@"icons_sc.png"];
		legend.position = ccp( 0, 6 );
		legend.anchorPoint = CGPointMake(0,1);
		[self addChild:legend];
		
	}
	return self;
}

-(Orbital*) facility
{
	return [[GameState sharedGameState] solarConverter];
}

@end
