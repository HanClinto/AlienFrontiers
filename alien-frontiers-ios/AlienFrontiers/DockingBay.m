//
//  Dock.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "GameState.h"

#import "DockingBay.h"

@implementation DockingBay

-(DockingBay*) initWithOrbital:(Orbital*)owner index:(int)index
{
    if ((self = [super init]))
    {
		orbital = owner;
		state = [owner state];
		dockIndex = index;
        dockedShip = nil;
	}	
	return self;	
}


- (void)encodeWithCoder:(NSCoder *)encoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[encoder encodeObject:dockedShip forKey:@"dockedShip"];
	[encoder encodeObject:orbital forKey:@"orbital"];
	[encoder encodeObject:state forKey:@"state"];
	[encoder encodeInt:dockIndex forKey:@"dockIndex"];
}

-(id)initWithCoder:(NSCoder *)decoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
    {
		dockedShip = [decoder decodeObjectForKey:@"dockedShip"];
		orbital = [decoder decodeObjectForKey:@"orbital"];
		state = [decoder decodeObjectForKey:@"state"];
		dockIndex = [decoder decodeIntForKey:@"dockIndex"];
	}
	
	return self;
}

-(bool) occupied
{
	return (dockedShip != nil);
}

-(Orbital*) orbital
{
	return (orbital);
}
	

-(void) dockShip:(Ship*)ship
{
	NSAssert(dockedShip == nil, @"Cannot dock when a ship is already in place!");

	dockedShip = ship;
	ship.dock = self;
	
	[state postEvent:EVENT_SHIP_DOCK object:ship];
}

-(void) ejectShip
{
	NSAssert(dockedShip != nil, @"Cannot eject an empty dock!");
	
	Ship* ship = dockedShip;
	
	dockedShip.dock = nil;
	dockedShip = nil;
	
	[state postEvent:EVENT_SHIP_DOCK object:ship];
}

-(Ship*) dockedShip
{
	return dockedShip;
}

-(int) index
{
	return dockIndex;
}

-(id) cloneWithOrbital:(Orbital*)o
{
	GameState *s = [o state];
	DockingBay *copy = [[[self class] alloc] init];
	copy->orbital = o;
	copy->state = s;
	copy->dockIndex = dockIndex;
    copy->dockedShip = nil; // Any cloned ship will take care of setting this.
    
	return copy;
}

-(void) clonePass2
{
    /*
    Ship *ship;
	if([dockedShip isArtifactShip])
		ship = [state artifactShip];
	else
		ship = [state shipByPlayer:[[ship player] playerIndex] shipID:[ship shipID]];
	[ship setDock:self];
	dockedShip = ship;
     */
}

@end
