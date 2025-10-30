//
//  HolographicDecoy.m
//  AlienFrontiers
//
//  Created by Clint Herron on 9/27/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "HolographicDecoy.h"

@implementation HolographicDecoy

-(NSString*) title
{
	return NSLocalizedString(@"HOLOGRAPHIC DECOY", @"Tech title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"HOLOGRAPHIC", @"Tech title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"DECOY", @"Tech title line 2");
}
-(NSString*) powerText
{
    return NSLocalizedString(@"Opponents may not RAID ~ from you.", @"HolographicDecoy power desc");
}

-(NSString*) discardText
{
    return NSLocalizedString(@"If they steal [ from you then it must be this card.", @"HolographicDecoy discard desc");
}

-(NSString*) imageFilename
{
	return @"tech_hd.png";
}

-(NSString*) fullImageFilename
{
	return @"TCHolographicDecoy.png";
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
