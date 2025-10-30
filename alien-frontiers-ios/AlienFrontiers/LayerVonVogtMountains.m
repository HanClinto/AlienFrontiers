//
//  LayerVanVogtMountains.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerVonVogtMountains.h"
#import "GameState.h"


@implementation LayerVanVogtMountains

-(Region*) region
{
	return [[GameState sharedGameState] vanVogtMountains];
}

-(NSString*) regionTitleUpper
{
	return NSLocalizedString(@"Van Vogt", @"Region Title Line 1");
}

-(NSString*) regionTitle
{
	return NSLocalizedString(@"Mountains", @"Region Title Line 2");
}

-(NSString*) bonusFileName
{
	return @"bonus_van_vogt.png";
}

-(CGPoint) regionBorderOverlayOffset
{
	return ccp(3,-26);
}

-(float) regionBorderOverlayRotation
{
	return -1 * 360 / 7; // (2 * 3.14159 / 7);
}

-(NSString*) getFilenameFieldPositron
{
    return @"field_positron_twolines.png";
}

@end
