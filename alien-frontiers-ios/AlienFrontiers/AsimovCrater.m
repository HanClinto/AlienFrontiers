//
//  AsimovCrater.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "AsimovCrater.h"


@implementation AsimovCrater


- (void)encodeWithCoder:(NSCoder *)encoder
{
	[super encodeWithCoder:encoder];
	
	[encoder encodeBool:bonusUsedThisTurn forKey:@"bonusUsedThisTurn"];
}

-(id)initWithCoder:(NSCoder *)decoder
{
	if ((self = [super initWithCoder:decoder]))
    {
        bonusUsedThisTurn = [decoder decodeBoolForKey:@"bonusUsedThisTurn"];
	}
	
	return self;
}

-(NSString*) title
{
    return NSLocalizedString(@"Asimov Crater", @"Region Title");
}

-(bool) bonusUsedThisTurn
{
    return bonusUsedThisTurn;
}

-(void) setBonusUsedThisTurn:(bool)val
{
    bonusUsedThisTurn = val;
}

-(id) cloneWithState:(GameState*)s
{
	AsimovCrater *copy = [super cloneWithState:s];
	copy->bonusUsedThisTurn = bonusUsedThisTurn;
	return copy;
}


@end
