//
//  VanVogtMountains.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "VanVogtMountains.h"


@implementation VanVogtMountains

-(NSString*) title
{
    return NSLocalizedString(@"Van Vogt Mountains", @"Region Title");
}

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
	VanVogtMountains *copy = [super cloneWithState:s];
	copy->bonusUsedThisTurn = bonusUsedThisTurn;
	return copy;
}

@end
