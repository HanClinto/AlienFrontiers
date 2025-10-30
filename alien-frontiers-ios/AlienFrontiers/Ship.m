//
//  Ship.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/1/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "DockingBay.h"
#import "GameState.h"
#import "Player.h"

#import "Ship.h"
#import "MaintenanceBay.h"

@implementation Ship

- (Ship *) initWithPlayer:(Player*)owner shipIndex:(int)myIndex;
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
    {
		player = owner;
		state = [player state];
		shipIndex = myIndex;
        if (shipIndex == ARTIFACT_SHIP_INDEX)
        {
            isArtifactShip = true;
        }
        else
        {
            isArtifactShip = false;
        }
	}
	return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[encoder encodeInt:value forKey:@"value"];
	[encoder encodeObject:dock forKey:@"dock"];
	[encoder encodeObject:player forKey:@"player"];
	[encoder encodeBool:isArtifactShip forKey:@"isArtifactShip"];
//	[encoder encodeBool:isSelected forKey:@"isSelected"];
	[encoder encodeBool:isActive forKey:@"isActive"];
	[encoder encodeObject:state forKey:@"state"];
	[encoder encodeInt:shipIndex forKey:@"shipIndex"];
	[encoder encodeInt:rollIndex forKey:@"rollIndex"];
	[encoder encodeObject:teleportRestriction forKey:@"teleportRestriction"];
	
//	CCLOG(@"Encoding die %d:%d with value %d", [self playerID], [self shipID], value);
}

-(id)initWithCoder:(NSCoder *)decoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
    {
		value = [decoder decodeIntForKey:@"value"];
		dock = [decoder decodeObjectForKey:@"dock"];
		player = [decoder decodeObjectForKey:@"player"];
		isArtifactShip = [decoder decodeBoolForKey:@"isArtifactShip"];
//		isSelected = [decoder decodeBoolForKey:@"isSelected"];
		isSelected = false;
		isActive = [decoder decodeBoolForKey:@"isActive"];
		state = [decoder decodeObjectForKey:@"state"];
		shipIndex = [decoder decodeIntForKey:@"shipIndex"];
		rollIndex = [decoder decodeIntForKey:@"rollIndex"];
		teleportRestriction = [decoder decodeObjectForKey:@"teleportRestriction"];
		
//		CCLOG(@"Decoding die %d:%d with value %d in state %@", [self playerID], [self shipID], value, state);
	}
	
	return self;
}

- (void) destroy;
{
	[player deactivateShip:self];
}


-(int) value
{
	return value;
}

-(NSString*) title
{
    if (isArtifactShip)
        return [NSString stringWithFormat:@"%d*", value];
    else
        return [NSString stringWithFormat:@"%d", value];
}

-(void) setValue:(int) val
{
	if (value != val)
	{
		value = val;
        rollIndex++;
				
		[state postEvent:EVENT_SHIP_CHANGED object:self];
	}
}

-(DockingBay*) dock
{
	return dock;
}

-(void) setDock:(DockingBay*)val
{
	dock = val;
}

-(Player*) player
{
	return player;
}

-(void) setPlayer:(Player*)val
{
	player = val;
}

-(void) undock
{
	if (dock != nil)
	{
		[dock ejectShip];
//		[state postEvent:EVENT_SHIP_DOCK object:self];
	}
}

-(void) moveToMaintBay
{
	if (dock != nil)
	{
		[dock ejectShip];
	}
	[[state maintenanceBay] dockShip:self];
}

-(void) roll
{
	// TODO: Make this random number generation deterministic from a known seed (?)
    
#ifndef DETERMINISTIC
    value = arc4random() % 6 + 1;
#else
    value = ((12 - shipIndex) % 6) + 1;
#endif
    
    rollIndex++;
    
    [state postEvent:EVENT_SHIP_ROLLED object:self];
//	[self setValue:arc4random() % 6 + 1];
}

-(int) rollIndex
{
    return rollIndex;
}

-(bool) isArtifactShip
{
	return isArtifactShip;
}

-(bool) docked
{
	return (dock != nil);
}

-(void) toggleSelect
{
	isSelected = !isSelected;

	[state postEvent:EVENT_SHIP_SELECTED object:self];
}

-(bool) isSelected
{
	return isSelected;
}

-(void) setIsSelected:(bool)val
{
	// Detect if the value changes.
	bool fire = (isSelected != val);
	
	isSelected = val;
	
	// Only fire if we need to.
	if (fire)
		[state postEvent:EVENT_SHIP_SELECTED object:self];
}

-(bool) hasPotential
{
	return hasPotential;
}

-(void) setHasPotential:(bool)val
{
	// Detect if the value changes.
	bool fire = (hasPotential != val);

	hasPotential = val;
	
	// Only fire if we need to.
	if (fire)
		[state postEvent:EVENT_SHIP_POTENTIAL object:self];
}

-(int) playerID
{
	return [player playerIndex];
}

-(int) shipID
{
	return shipIndex;
}

-(bool) active
{
	return isActive;
}

-(void) setActive:(bool)val
{
	isActive = val;
}

-(Orbital*) dockedOrbital
{
	if (dock == nil)
	{
		return nil;
	}
	
	return [dock orbital];
}

-(void) setTeleportRestriction:(Orbital*) orbital
{
	teleportRestriction = orbital;
}

-(Orbital*) teleportRestriction
{
	return teleportRestriction;
}

-(id) cloneWithState:(GameState*)newState player:(Player*)newPlayer
{
	Ship *copy = [[[self class] alloc] init];
	copy->shipIndex = shipIndex;
	copy->isArtifactShip = isArtifactShip;
	copy->value = value;
    if (dock != nil)
    {
        DockingBay* newDock = (DockingBay*)[newState corresponding:dock];
        //copy->dock = newDock; // Now set through the dockShip method
        [newDock dockShip:copy];
    }
	copy->player = newPlayer;
	copy->state = newState;
    
    if(teleportRestriction == nil)
    {
        copy->teleportRestriction = nil;
    }
    else
    {
        copy->teleportRestriction = (Orbital*)[newState corresponding:teleportRestriction];
        /*
        int i = 0;
        for (Orbital *orbital in [state orbitals])
        {
            if (orbital == teleportRestriction) {
                copy->teleportRestriction = [[newState orbitals] objectAtIndex:i];
                break;
            }
            i++;
        }
         */
    }
    copy->rollIndex = rollIndex; // A number that increments when the ship is rolled, to keep track of when a die's value has changed.
	copy->isActive = isActive;

	// Are these necessary to clone?
//	copy->isSelected = isSelected;
//	copy->hasPotential = hasPotential;
    return copy;
}

@end
