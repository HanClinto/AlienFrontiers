//
//  LayerPohlFoothills.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerPohlFoothills.h"
#import "GameState.h"


@implementation LayerPohlFoothills

-(Region*) region
{
	return [[GameState sharedGameState] pohlFoothills];
}

-(NSString*) regionTitle
{
	return NSLocalizedString(@"Pohl Foothills", @"Region Title");
}

-(NSString*) bonusFileName
{
	return @"bonus_pohl.png";
}

-(CGPoint) regionBorderOverlayOffset
{
	return ccp(2,-21);
}

-(float) regionBorderOverlayRotation
{
	return -2.005 * 360 / 7; // (2 * 3.14159 / 7);
}

@end
