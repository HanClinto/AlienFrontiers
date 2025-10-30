//
//  DockGroup.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "DockGroup.h"


@implementation DockGroup

-(DockGroup*) initWithOrbital:(Orbital*)owner ofCount:(int)numDocks groupIndex:(int)index
{
	if ((self = [super init]))
    {
		docks = [[NSMutableArray alloc] init];

		for (int cnt = 0; cnt < numDocks; cnt++)
		{
			DockingBay* dock = [[DockingBay alloc] initWithOrbital:owner index:((numDocks * index) + cnt)];
			[docks addObject:dock];
		}
	}
	return self;
}


- (void)encodeWithCoder:(NSCoder *)encoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[encoder encodeObject:docks forKey:@"docks"];
}

-(id)initWithCoder:(NSCoder *)decoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
    {
		docks = [decoder decodeObjectForKey:@"docks"];
	}
	
	return self;
}

-(int) numOpenDocks
{
	return (self.numDocks - self.numOccupiedDocks);
}

-(int) numOccupiedDocks
{
	int occupiedCnt = 0;
	
	for (DockingBay* dock in docks)
	{
		if (dock.occupied)
		{
			occupiedCnt++;
		}
	}
	
	return occupiedCnt;
}

-(int) numDocks
{
	return [docks count];
}

-(bool) full
{
	return (self.numOpenDocks == 0);
}

-(bool) empty
{
	return (self.numOpenDocks == self.numDocks);
}

-(NSArray*) dockArray;
{
	return docks;
}

-(ShipGroup*) ships
{
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	for (DockingBay* dock in docks)
	{
		if (dock.occupied)
		{			
			[retVal push:dock.dockedShip];
		}
	}
	
	return retVal;
}

-(void) dockShips:(ShipGroup*)ships
{
	NSAssert( ships.count <= self.numOpenDocks, @"There are not enough docks to dock the requested ships!" );
	
	DockingBay* dock;
	
	for (Ship* ship in [ships valueSortedArray])
	{
		dock = [self nextOpenDock];
		[dock dockShip:ship];
	}
}

-(DockingBay*) nextOpenDock
{
	for (DockingBay* dock in docks)
	{
		if (!dock.occupied)
		{
			return dock;
		}
	}
	
	return nil;
}

-(void) ejectShips
{
	for (DockingBay* dock in docks)
	{
		if (dock.occupied)
		{
			[dock ejectShip];
		}
	}	
}

-(void) dockShip:(Ship*)ship
{
	NSAssert( self.numOpenDocks >= 1, @"There are not enough docks to dock the requested ships!" );
	
	for (DockingBay* dock in docks)
	{
		if (!dock.occupied)
		{
			[dock dockShip:ship];
			break;
		}
	}	
}

-(id) cloneWithOrbital:(Orbital*)orbital
{
	DockGroup *copy = [[[self class] alloc] init];
	copy->docks = [[NSMutableArray alloc] initWithCapacity:[docks count]];
	for(DockingBay *dock in docks)
	{
        DockingBay* dockCopy = [dock cloneWithOrbital:orbital];
		[copy->docks addObject:dockCopy];
	}
	return copy;
}

-(void) clonePass2
{
    for(DockingBay *dock in docks)
    {
        if (dock != nil)
            [dock clonePass2];
    }
}

@end
