//
//  LayerBradburyPlateau.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerBradburyPlateau.h"
#import "GameState.h"


@implementation LayerBradburyPlateau

-(Region*) region
{
	return [[GameState sharedGameState] bradburyPlateau];
}

-(NSString*) regionTitleUpper
{
	return NSLocalizedString(@"Bradbury", @"Region Title Line 1");
}

-(NSString*) regionTitle
{
	return NSLocalizedString(@"Plateau", @"Region Title Line 2");
}

-(NSString*) bonusFileName
{
	return @"bonus_bradbury.png";
}

-(CGPoint) regionBorderOverlayOffset
{
	return ccp(8,-28);
}

-(float) regionBorderOverlayRotation
{
	return 0; //  * (2 * 3.14159 / 7);
}

-(NSString*) getFilenameFieldIsolation
{
    return @"field_isolator_short.png";
}

-(NSString*) getFilenameFieldPositron
{
    return @"field_positron_twolines.png";
}

@end
