//
//  LayerHeinleinPlains.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerHeinleinPlains.h"
#import "GameState.h"


@implementation LayerHeinleinPlains

-(Region*) region
{
	return [[GameState sharedGameState] heinleinPlains];
}

-(NSString*) regionTitle
{
	return NSLocalizedString(@"Heinlein Plains", @"Region Title");
}

-(NSString*) bonusFileName
{
	return @"bonus_heinlein.png";
}

-(CGPoint) regionBorderOverlayOffset
{
	return ccp(8,-28);
}

-(float) regionBorderOverlayRotation
{
	return -3 * 360 / 7; // (2 * 3.14159 / 7);
}


@end
