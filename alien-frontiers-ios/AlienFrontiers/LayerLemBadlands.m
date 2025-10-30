//
//  LayerLemBadlands.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerLemBadlands.h"
#import "GameState.h"


@implementation LayerLemBadlands

-(Region*) region
{
	return [[GameState sharedGameState] lemBadlands];
}

-(NSString*) regionTitle
{
	return NSLocalizedString(@"Lem Badlands", @"Region Title");
}

-(NSString*) bonusFileName
{
	return @"bonus_lem.png";
}

-(CGPoint) regionBorderOverlayOffset
{
	return ccp(9,-28);
}

-(float) regionBorderOverlayRotation
{
	return 3 * 360 / 7; // (2 * 3.14159 / 7);
}


@end
