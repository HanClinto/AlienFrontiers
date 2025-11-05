//
//  LayerMaintenanceBay.m
//  AlienFrontiers
//
//  Created by Clint Herron on 3/24/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerMaintenanceBay.h"


@implementation LayerMaintenanceBay


-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
		//		self.isTouchEnabled = YES;
		
		label1 = [CCLabelTTF labelWithString:NSLocalizedString(@"MAINTENANCE", @"Maint Bay display name line 1") fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label1.color = ccWHITE;
        label1.opacity = ORBITAL_FONT_OPACITY;
		label1.position = ccp(0,73);
		label1.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label1 z:1 tag:LayerMBTagLabel1];
		
		label2 = [CCLabelTTF labelWithString:NSLocalizedString(@"BAY", @"Maint Bay display name line 2") fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label2.color = ccWHITE;
        label2.opacity = ORBITAL_FONT_OPACITY;
		label2.position = ccp(0,60);
		label2.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label2 z:1 tag:LayerMBTagLabel2];
				
		CCSprite* legend = [CCSprite spriteWithFile:@"dock_mb.png"];
		legend.position = ccp( 27, 27 + 8 );
		legend.anchorPoint = CGPointMake(0,1);
		[self addChild:legend];
		
		CCSprite* dock;
		int cnt=0;
		
		for (DockGroup* group in [[self facility] dockGroups])
		{
//				dock = [CCSprite spriteWithFile:@"dock_normal.png"];
				dock = [CCSprite spriteWithFile:@"dock_blank.png"];
				
				dock.anchorPoint = CGPointMake(0,0);
				dock.position = ccp(  0 + (cnt % 5) * (dock.contentSize.width + 1), 
								12 - (((int) (cnt / 5)) * (dock.contentSize.height)));
				[self addChild:dock];
			
				dockPositions[cnt] = dock.position;
			
				[docks addObject:dock];
				
				cnt++;
		}
		
		
	}
	return self;
}

-(void) dealloc
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// don't forget to call "super dealloc"
}


-(Orbital*) facility
{
	return [[GameState sharedGameState] maintenanceBay];
}

@end
