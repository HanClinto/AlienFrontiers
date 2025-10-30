//
//  PlayerTechCardGroup.m
//  AlienFrontiers
//
//  Created by Kevin Gillette on 10/7/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "GameState.h"
#import "PlayerTechCardGroup.h"
#import "TechCard.h"

@implementation PlayerTechCardGroup

-(PlayerTechCardGroup*) initWithPlayer:(Player*)owner
{
    if ((self = [super init]))
    {
        player = owner;
    }
    return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
	[super encodeWithCoder:encoder];
	
	[encoder encodeObject:player forKey:@"player"];
}

-(id)initWithCoder:(NSCoder *)decoder
{
	if ((self = [super initWithCoder:decoder]))
    {
        player = [decoder decodeObjectForKey:@"player"];
	}
	
	return self;
}

-(void)pushCard:(TechCard*)techCard
{
	//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	if([self hasCardOfType:[techCard class]])
    {
        [techCard setOwner:nil];
        [[[player state] techDiscardDeck] pushCard:techCard];
        [[player state] logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Already own %@, discarding new duplicate.", @"Duplicate card discard message"), 
                        [player playerName],
                        [[techCard title] capitalizedString]
                        ]];
        
    }
    else
    {
        [techCard setOwner:player];
        [super pushCard:techCard];
    }
}

-(void)removeCard:(TechCard*)techCard
{
    [super removeCard:techCard];
    [techCard setOwner:nil];
    
    [[player state] postEvent:EVENT_ARTIFACT_CARDS_CHANGED object:techCard];
    [[player state] postEvent:EVENT_CARD_SELECTED object:techCard];
}

-(Player *)player
{
    return player;
}

@end