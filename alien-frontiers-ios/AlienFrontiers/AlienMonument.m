//
//  AlienMonument.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/20/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "AlienMonument.h"


@implementation AlienMonument

-(NSString*) title
{
	return NSLocalizedString(@"ALIEN MONUMENT", @"AlienMonument title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"ALIEN", @"AlienMonument title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"MONUMENT", @"AlienMonument title line 2");
}
-(NSString*) powerText
{
    return NSLocalizedString(@"Gain 1 Victory Point when you possess this card.", @"AlienMonument power text");
}

-(NSString*) discardText
{
    return @"";
}

-(NSString*) imageFilename
{
	return @"tech_am.png";
}

-(NSString*) fullImageFilename
{
	return @"TCAlienMonument.png";
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
