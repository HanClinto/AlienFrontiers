//
//  AlienCity.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/29/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "AlienCity.h"


@implementation AlienCity

-(NSString*) title
{
	return NSLocalizedString(@"ALIEN CITY", @"AlienCity title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"ALIEN", @"AlienCity title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"CITY", @"AlienCity title line 2");
}
-(NSString*) powerText
{
    return NSLocalizedString(@"Gain 1 Victory Point when you possess this card.", @"Alien City power text");
}

-(NSString*) discardText
{
    return @"";
}

-(NSString*) imageFilename
{
	return @"tech_ac.png";
}

-(NSString*) fullImageFilename
{
	return @"TCAlienCity.png";
}

-(int) victoryPoints
{
	return 1;
}

+(int) numToPutInDeck
{
	return 1;
}

-(bool) hasPower
{	
	return false;
}

-(bool) hasDiscard
{
	return false;
}

@end
