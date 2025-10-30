//
//  LayerAsimovCrater.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerAsimovCrater.h"
#import "GameState.h"


@implementation LayerAsimovCrater

-(Region*) region
{
	return [[GameState sharedGameState] asimovCrater];
}

-(NSString*) regionTitle
{
	return NSLocalizedString(@"Asimov Crater", @"Region Title");
}

-(NSString*) bonusFileName
{
	return @"bonus_asimov.png";
}

-(NSString*) getFilenameFieldIsolation
{
    return @"field_isolator_long.png";
}


-(CGPoint) regionBorderOverlayOffset
{
	return ccp(10,-26);
}

-(float) regionBorderOverlayRotation
{
	return 1 * 360 / 7; // (2 * 3.14159 / 7);
}

@end
