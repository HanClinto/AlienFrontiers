//
//  ResourceCache.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/29/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "ResourceCache.h"

#import "Region.h"

@implementation ResourceCache

// All logic for this tech card is found in the [Player roll] method

-(NSString*) title
{
	return NSLocalizedString(@"RESOURCE CACHE", @"Tech title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"RESOURCE", @"Tech title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"CACHE", @"Tech title line 2");
}
-(NSString*) powerText
{
    return NSLocalizedString(@"After each roll, if you have more:\n*even ships, take |.\n*odd ships, take }.\n* equal number of odd and even ships, take | } and discard this card.", @"ResourceCache power desc");
}
-(NSString*) discardText
{
    return @"";
}

-(NSString*) imageFilename
{
	return @"tech_rc.png";
}

-(NSString*) fullImageFilename
{
	return @"TCResourceCache.png";
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
