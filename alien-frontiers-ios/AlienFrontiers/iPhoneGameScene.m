//
//  iPhoneGameScene.m
//  AlienFrontiers
//
//  Created by Clint Herron on 1/13/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "iPhoneGameScene.h"


@implementation iPhoneGameScene

+(id) scene
{
	CCScene *scene = [CCScene node];
	CCLayer* layer = [iPhoneGameScene node];
	[scene addChild:layer];
	return scene;
}

-(id) init
{
	if (self = [super init])
	{
		CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	}
	
	return self;
}

@end
