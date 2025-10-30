//
//  TechCard.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/20/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "TechCard.h"

#import "GameState.h"
#import "Player.h"
#import "HolographicDecoy.h"
#import "TechCardGroup.h"
#import "PohlFoothills.h"

@implementation TechCard

-(TechCard*) initTechWithState:(GameState*)gameState withID:(int)ID
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
    if ((self = [super init]))
    {
		state = gameState;
        cardID = ID;
	}
	
	return self;
}


- (void)encodeWithCoder:(NSCoder *)encoder
{
	//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[encoder encodeObject:state forKey:@"state"];
	
	[encoder encodeObject:owner forKey:@"owner"];
	[encoder encodeBool:tapped forKey:@"tapped"];
	[encoder encodeBool:isSelected forKey:@"isSelected"];
    [encoder encodeInt:cardID forKey:@"cardID"];
}

-(id)initWithCoder:(NSCoder *)decoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
    {
		state = [decoder decodeObjectForKey:@"state"];
		
		owner = [decoder decodeObjectForKey:@"owner"];
		tapped = [decoder decodeBoolForKey:@"tapped"];
		isSelected = [decoder decodeBoolForKey:@"isSelected"];
        cardID = [decoder decodeIntForKey:@"cardID"];
	}
	
	return self;
}

-(NSString*) title
{
	return @"Calvin's Transmogrifier";
}

-(NSString*) title1
{
	return [self title];
}

-(NSString*) title2
{
	return @"";
}

-(NSString*) imageFilename
{
	return @"tech_placeholder.png";
}

-(NSString*) fullImageFilename
{
	return @"TCBoosterPod.png";
}

-(NSString*) powerText
{
    return @"Power ability goes here.";
}

-(NSString*) discardText
{
    return @"Discard ability goes here.";
}

-(bool) tapped
{
	return tapped;
}

-(void) setTapped:(bool)val
{
    bool valChanged = (tapped != val);
    
	tapped = val;
	
	if (valChanged)
	{
		[state postEvent:EVENT_CARD_TAPPED object:self];
	}
}

-(bool) hasPower
{
	return true;
}

-(bool) hasDiscard
{
	return true;
}

-(bool) canUsePower
{
    return ([self whyCantUsePower] == nil);
}

-(NSString*) whyCantUsePower
{
	if (owner != [state currentPlayer])
		return @"You cannot use this card unless you own it.";
    
    if (![self hasPower])
        return @"This card does not have a fuel power to use.";
    
    if ([self tapped])
        return @"This card has already been used, and may only be used once per turn.";
    
    if ([owner fuel] < [self adjustedFuelCost])
        return [NSString stringWithFormat:@"You need at least %d fuel to use this card, but you only have %d.", [self adjustedFuelCost], [owner fuel]];
    
    return nil;
}

-(bool) canUseDiscard
{
    return ([self whyCantUseDiscard] == nil);
}

-(NSString*) whyCantUseDiscard
{
	if (owner != [state currentPlayer])
		return @"You cannot use this card unless you own it.";
    
    if (![self hasDiscard])
        return @"This card does not have a discard power to use.";
    
    if ([owner techsDiscarded] > 0)
        return @"You have already discarded one tech this turn, and may only discard one tech per turn.";
    
    if ([self tapped])
        return @"This card has already been used, and may only be used once per turn.";
    
    return nil;
}

-(void) usePower
{
    [self setTapped:true];
//	tapped = true;
}

-(void) useDiscard
{
    owner.techsDiscarded += 1;
    [[owner cards] removeCard:self];
    [[state techDiscardDeck] pushCard:self];
    [self setOwner:nil];
    
    [state postEvent:EVENT_ARTIFACT_CARDS_CHANGED object:self];
}

+(int) infiniteCost
{
    return INT_MAX;
}

-(int) infiniteCost
{
    return [TechCard infiniteCost];
}

-(int) victoryPoints
{
	return 0;
}

+(int) numToPutInDeck
{
	return 2;
}

-(int) adjustedFuelCost
{
	int discount = 0;
	
	if ([[state pohlFoothills] playerHasBonus:owner] )
	{
		discount += 1;
	}
	
	return [self baseFuelCost] - discount;
}

-(int) baseFuelCost
{
	return 1;
}

-(Player*) owner
{
	return owner;
}

-(void) setOwner:(Player*) newOwner
{
	// TODO: Fire ownership event(s)
	owner = newOwner;
}

-(int) cardID
{
    return cardID;
}

-(GameState*) state
{
   return state;
}

-(id) cloneWithState:(GameState*)newState
{
    TechCard *copy = [[[self class] alloc] init];
    Player *newOwner;
    
    if (owner == nil)
        newOwner = nil;
    else
        newOwner = [newState corresponding:owner];
   
    copy->owner = newOwner;
	copy->state = newState;
	copy->tapped = tapped;
    copy->cardID = cardID;
   
    return copy;
}

@end
