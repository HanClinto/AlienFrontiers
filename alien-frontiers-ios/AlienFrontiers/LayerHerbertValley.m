//
//  LayerHerbertValley.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/13/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerHerbertValley.h"
#import "GameState.h"

@implementation LayerHerbertValley


-(Region*) region
{
	return [[GameState sharedGameState] herbertValley];
}

-(NSString*) regionTitle
{
	return NSLocalizedString(@"Herbert Valley", @"Region Title");
}

-(NSString*) bonusFileName
{
	return @"bonus_herbert.png";
}

-(CGPoint) regionBorderOverlayOffset
{
	return ccp(12,-21);
}

-(float) regionBorderOverlayRotation
{
	return 2.005 * 360 / 7; // (2 * 3.14159 / 7);
}

@end
