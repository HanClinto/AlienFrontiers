//
//  Orbital.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "Orbital.h"


@implementation Orbital

//@synthesize state;
//@synthesize dockGroups;

-(GameState*) state
{
    return state;
}

-(NSArray*) dockGroups
{
    return dockGroups;
}

-(NSString*) title
{
    return NSStringFromClass([self class]);
}

-(Orbital*) initWithState:(GameState*)gameState;
{
    if ((self = [super init]))
    {
		state = gameState;

		dockGroups = [[NSMutableArray alloc] init];

		[self setupDocks:self.numDockGroups docksPerGroup:self.numDocksPerGroup];
	}
	return self;
}


- (void)encodeWithCoder:(NSCoder *)encoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[encoder encodeObject:dockGroups forKey:@"dockGroups"];
	[encoder encodeObject:state forKey:@"state"];
}

-(id)initWithCoder:(NSCoder *)decoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
    {
		dockGroups = [decoder decodeObjectForKey:@"dockGroups"];
		state = [decoder decodeObjectForKey:@"state"];
	}
	
	return self;
}

-(int) numDockGroups
{
	// To be overridden in descending classes.
	NSAssert(FALSE, @"numDockGroups needs to be overridden in child classes!");

	return 0;
}

-(int) numDocksPerGroup
{
	// To be overridden in descending classes.
	NSAssert(FALSE, @"numDocksPerGroup needs to be overridden in child classes!");
	
	return 0;
}


-(void) setupDocks:(int)numGroups docksPerGroup:(int)docksWide
{
//	CCLOG(@"Initializing orbital %@ with %dx%d docks", self, numGroups, docksWide);
	
	dockGroups = [[NSMutableArray alloc] init];
	
	for (int cnt = 0; cnt < numGroups; cnt++) {
		DockGroup* group = [[DockGroup alloc] initWithOrbital:self ofCount:docksWide groupIndex:cnt];
		[dockGroups addObject:group];
	}
}

-(bool) isValidMoveFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
	// To be overridden in descending classes.
	return false;
}

-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips
{
	// To be overridden in descending classes.
	return [ShipGroup blank];
}

-(void) commitShipsFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
	// To be overridden in descending classes, and then called.
    for (Ship* ship in [selectedShips array])
	{
		if (ship.isSelected)
			[ship toggleSelect];
	}
	
	[state setSelectedFacility:nil];
	[state postEvent:EVENT_SHIPS_DOCKED object:self];
    
    [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Docked %@ at %@", @"Docking ships at orbital"), 
                    [[state currentPlayer] playerName],
                    [selectedShips title],
                    [self title]]];
}

-(void) dockShip:(Ship*)ship
{
	DockGroup* group = [self firstEmptyGroup];
	
	NSAssert(group != nil, @"No empty dock group with which to dock a ship at.");
	
	[group dockShip:ship];
}

-(void) dockShips:(ShipGroup*)ships
{
	for (Ship* ship in [ships valueSortedArray])
	{
		[self dockShip:ship];
	}
}

-(ShipGroup*) dockedShips
{
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	for (DockGroup* group in dockGroups)
	{
		for (DockingBay* dock in group.dockArray)
		{
			if (dock.occupied)
			{
				[retVal push:dock.dockedShip];
			}
		}
	}
	
	return retVal;
}

-(Ship*) firstDockedShip
{
	for (DockGroup* group in dockGroups)
	{
		for (DockingBay* dock in group.dockArray)
		{
			if (dock.occupied)
			{
				return dock.dockedShip;
			}
		}
	}
	
	return nil;
}

-(int) maxDockedShipIDFromPlayer:(Player*)player
{
    int maxID = -1;
    
	for (DockGroup* group in dockGroups)
	{
		for (DockingBay* dock in group.dockArray)
		{
			if (dock.occupied)
			{
                Ship* ship = dock.dockedShip;
                
                if ([ship playerID] == [player playerIndex])
                    if ([ship shipID] > maxID)
                        maxID = [ship shipID];
			}
		}
	}
	
	return maxID;
}

/*
- (ShipGroup*) dockedShips
{
	ShipGroup* retVal = [[[ShipGroup alloc] init] autorelease];
	
	for (DockingBay* dock in dockingBays)
	{
		if ([dock occupied])
		{
			[retVal push:dock.ship];
		}
	}
	
	return retVal;
}

-(DockingBay*) firstOpenDock
{
	for (DockingBay* dock in dockingBays)
	{
		if (![dock occupied])
		{
			return dock;
		}
	}
	
	return nil;
}

-(int) numOpenDocks
{
	int retVal = 0;
	
	for (DockingBay* dock in dockingBays)
	{
		if (![dock occupied])
		{
			retVal++;
		}
		else {
			CCLOG(@"Dock is occupado!");
		}

	}
	
	return retVal;
}

-(NSArray*) openDockingBays
{
	NSMutableArray* retVal = [[[NSMutableArray alloc] init] autorelease];
	
	for (DockingBay* dock in dockingBays)
	{
		if ([dock occupied])
		{
			[retVal addObject:dock];
		}
	}
	
	return retVal;
}
 

-(NSArray*) docks
{
	return dockingBays;
}
// */

-(int) numEmptyGroups
{
	int retVal = 0;
	
	for (DockGroup* group in dockGroups)
	{
		if (group.empty)
			retVal++;
	}
	
	return retVal;
}

-(DockGroup*) firstEmptyGroup
{
	for (DockGroup* group in dockGroups)
	{
		if (group.empty)
			return group;
	}
	
	return nil;
}


-(DockingBay*) dockByIndex:(int)index
{
    int groupIndex = index / [self numDocksPerGroup];
    int dockIndex = index % [self numDocksPerGroup];
    
    DockGroup* group = [dockGroups objectAtIndex:groupIndex];
    return [[group dockArray] objectAtIndex:dockIndex];
}

-(id) cloneWithState:(GameState*)s
{
	Orbital *copy = [[[self class] alloc] init];
	copy->state = s;
	copy->dockGroups = [[NSMutableArray alloc] initWithCapacity:[dockGroups count]];
	for(DockGroup* group in dockGroups)
	{
		[copy->dockGroups addObject:[group cloneWithOrbital:copy]];
	}
	return copy;
}

@end
