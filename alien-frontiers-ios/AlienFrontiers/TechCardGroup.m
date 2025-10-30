//
//  TechCardGroup.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/3/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "TechCardGroup.h"

#import "TechCard.h"

#import "GameState.h"

@implementation TechCardGroup

static TechCardGroup* blankGroup;
+(TechCardGroup*) blank
{
	if (blankGroup == nil)
	{
		blankGroup = [[TechCardGroup alloc] init];
	}
	return blankGroup;
}

-(TechCardGroup*) init
{
	//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
		array = [[NSMutableArray alloc] init];
	}
	return self;
}

-(NSString*) title
{
    NSMutableString* retVal = [NSMutableString stringWithString:NSLocalizedString(@"(", @"Generic List Prefix")];
    
    int cnt = 0;
    
    for (TechCard* card in array)
    {
        if (cnt != 0)
            [retVal appendString:NSLocalizedString(@", ", @"Generic List Separator")];
        
        [retVal appendString:[[card title] capitalizedString]];
        
        cnt++;
    }
    
    [retVal appendString:NSLocalizedString(@")", @"Generic List Suffix")];
    
    return retVal;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
	//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[encoder encodeObject:array forKey:@"array"];		
}

-(id)initWithCoder:(NSCoder *)decoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
    {
		array = [decoder decodeObjectForKey:@"array"];
	}
	
	return self;
}

-(int) count
{
	//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	return [array count];
}

-(void)pushCard:(TechCard*)techCard
{
	//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[array addObject:techCard];
}

-(void)removeCard:(TechCard*)techCard
{
	//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[array removeObject:techCard];
}

-(void)clear
{
	//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[array removeAllObjects];
    // TODO: should we actually add these to the discard deck?
}

-(bool)hasTechCard:(TechCard*)techCard
{
	//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	return [array containsObject:techCard];
}

-(TechCard*)cardByID:(int)cardID
{
    for (TechCard* card in array) {
        if ([card cardID] == cardID)
            return card;
    }
    
    return nil;
}

-(bool)hasCardOfType:(Class)techCardType
{
    return ([self findCardOfType:techCardType] != nil);
}

-(TechCard*)findCardOfType:(Class)techCardType
{
	for (TechCard* card in array) {
		if ([card isKindOfClass:techCardType]) {			
			return card;
		}
	}
	
	return nil;
}

-(NSArray *) array
{
	//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	return array;
}

-(TechCard*) atIndex:(int)index
{
    if ([array count] > index)
    {
        return [array objectAtIndex:index];
    }
    return nil;
}

-(void) shuffle
{
	TechCard* card;
	int index;
	int numCards = [array count];
	
	for (int cnt = 0; cnt < numCards; cnt++)
	{
		// Take a card from the top of the stack
		card = (TechCard*) [array objectAtIndex:numCards-1];
		[array removeLastObject];

		//NSAssert(card);
		
		// Insert it at a random location underneath the deck between the bottom and the top-most card that we've inserted in the shuffle.
		if (cnt == 0)
			index = 0;
		else
			index = arc4random() % (cnt + 1);
		
		[array insertObject:card atIndex:index];
		
		// When this goes through the loop, every card will have been popped off of the top and inserted at a random location in the deck.
	}
}

-(TechCard*) pop
{
	TechCard* card = ((TechCard*) [array objectAtIndex:[array count]-1]);
	[self removeCard:card];
	return card;
}


@end
