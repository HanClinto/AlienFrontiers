//
//  ShipGroup.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/1/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "ShipGroup.h"
#import "Player.h"

@interface ShipGroup (PrivateMethods)
@end

@implementation ShipGroup

static ShipGroup* blankGroup;
+(ShipGroup*) blank
{
	if (blankGroup == nil)
	{
		blankGroup = [[ShipGroup alloc] init];
	}
	return blankGroup;
}

-(ShipGroup*) init
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	if ((self = [super init]))
	{
		array = [[NSMutableArray alloc] init];
        sorted = false;
	}
	
	return self;
}

-(NSString*) title
{
    NSMutableString* retVal = [NSMutableString stringWithString:NSLocalizedString(@"(", @"Generic List Prefix")];
    
    int cnt = 0;
    
    for (Ship* ship in array)
    {
        if (cnt != 0)
            [retVal appendString:NSLocalizedString(@", ", @"Generic List Separator")];
        
        [retVal appendString:[ship title]];
        
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

/*
-(int *) valueCounts 
{
//	NSArray* retVal = [NSArray arrayWithObjects:[NSNumber numberWithInt:0],[NSNumber numberWithInt:0],[NSNumber numberWithInt:0],[NSNumber numberWithInt:0],[NSNumber numberWithInt:0],[NSNumber numberWithInt:0],nil];
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	int *retVal = malloc(6 * sizeof(int));
	
	memset(&retVal[0], 0, sizeof(retVal));
	
	for (Ship* ship in array)
	{
		int val = ship.value;
		retVal[val-1]++;
	}
	
	return retVal;
}
 */

-(void) fillValueCounts:(int*)countArray
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	countArray[0] = 0;
	countArray[1] = 0;
	countArray[2] = 0;
	countArray[3] = 0;
	countArray[4] = 0;
	countArray[5] = 0;
	
	for (Ship* ship in array)
	{
		int val = ship.value;
		countArray[val - 1]++;
	}
}

-(int) count
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	return [array count];
}


-(void)push:(Ship*)ship
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	[array addObject:ship];
    
    sorted = false;
}

-(void)remove:(Ship*)ship
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[array removeObject:ship];
}

-(void)clear
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[array removeAllObjects];
}

-(ShipGroup*)ofValue:(int)value
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	for (Ship * ship in array)
	{
		if (ship.value == value)
		{
			[retVal push:ship];
		}
	}
	
	return retVal;
}

-(ShipGroup*)greaterThanOrEqual:(int)value
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	for (Ship * ship in array)
	{
		if (ship.value >= value)
		{
			[retVal push:ship];
		}
	}
	
	return retVal;
}

-(ShipGroup*)lessThanOrEqual:(int)value
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	for (Ship * ship in array)
	{
		if (ship.value <= value)
		{
			[retVal push:ship];
		}
	}
	
	return retVal;
}

-(int)countLessThan:(int)value
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
    int retVal = 0;
	
	for (Ship * ship in array)
	{
		if (ship.value < value)
		{
            retVal++;
		}
	}
	
	return retVal;
}

-(int)maxValue
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	int max = 0;
	
	for (Ship * ship in array)
	{
		if (ship.value > max)
		{
			max = ship.value;
		}
	}
	
	return max;
}

-(int)minValue
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	int min = 6;
	
	for (Ship * ship in array)
	{
		if (ship.value < min)
		{
			min = ship.value;
		}
	}
	
	return min;
}

-(int)sum
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	int sum = 0;
	
	for (Ship * ship in array)
	{
		sum += ship.value;
	}
	
	return sum;
}

-(int)numOdd
{
	int cnt = 0;
	
	for (Ship * ship in array)
	{
		if (ship.value % 2 == 1)
			cnt++;
	}
	
	return cnt;
}

-(int)numEven
{
	int cnt = 0;
	
	for (Ship * ship in array)
	{
		if (ship.value % 2 == 0)
			cnt++;
	}
	
	return cnt;
}

-(ShipGroup*)inHand
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	for (Ship * ship in array)
	{
		if (!ship.docked)
		{
			[retVal push:ship];
		}
	}
	
	return retVal;
}

-(ShipGroup*)minQuant:(int)num
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	ShipGroup* retVal = [[ShipGroup alloc] init];

	int counts[] = {0,0,0,0,0,0};
	[self fillValueCounts:counts];
	
	for (Ship * ship in array)
	{
		if (counts[ship.value-1] >= num)
		{
			[retVal push:ship];
		}
	}
	
	return retVal;
}

-(ShipGroup*) quant:(int)num
{
    if ([self count] < num)
        return [ShipGroup blank];
    
	ShipGroup* retVal = [[ShipGroup alloc] init];
    int numShips = 0;
    
	for (Ship * ship in array)
	{
        numShips++;
        if (numShips > num)
            break;
        
        [retVal push:ship];
        
        if (numShips == num)
            break;
	}
	
	return retVal;
}

-(ShipGroup*) lowestSetOf:(int)num
{
    ShipGroup* retVal = [ShipGroup blank];
    
	int counts[] = {0,0,0,0,0,0};
	[self fillValueCounts:counts];
    
    for (int cnt = 1; cnt <= 6; cnt++)
    {
        if (counts[cnt-1] >= num)
        {
            // TODO: Maybe combine these two methods into a single method to save spending another autorelease object.
            retVal = [[self ofValue:cnt] quant:num];
            
            break;
        }
    }
    
    return retVal;
}

-(ShipGroup*) highestSetOf:(int)num
{
    ShipGroup* retVal = [ShipGroup blank];
    
	int counts[] = {0,0,0,0,0,0};
	[self fillValueCounts:counts];
    
    for (int cnt = 6; cnt > 0; cnt--)
    {
        if (counts[cnt-1] >= num)
        {
            // TODO: Maybe combine these two methods into a single method to save spending another autorelease object.
            retVal = [[self ofValue:cnt] quant:num];
            
            break;
        }
    }
    
    return retVal;
}

-(ShipGroup*)inStraight
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	return [self inStraightWith:[ShipGroup blank]];
}

-(ShipGroup*)inStraightWith:(ShipGroup*)other
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	return [self inStraightWith:other minSum:0];
}

-(ShipGroup*)inStraightWith:(ShipGroup*)other minSum:(int)minSum
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// Return value buffer.
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	// Get all grouped dice from this group
	int counts[] = {0,0,0,0,0,0};
//	int* counts = [self valueCounts];

	// Get all grouped dice from the target (other) group
	int otherCounts[] = {0,0,0,0,0,0};
//	int* otherCounts = [other valueCounts];
	
	[self fillValueCounts:counts];
	[other fillValueCounts:otherCounts];

	
	// An array of values that are marked as being part of a valid straight.
	int marks[] = {false, false, false, false, false, false};
	
	// Look for all of the straights
	for (int cnt = 0; cnt < 6-2; cnt++)
	{
		// Check to make sure that a straight made here would be above the minimum sum
		if ((cnt * 3 + 6) > minSum)
		{
			// Check to make sure that we're within the bounds of the min and max of the existing dice (if any)
			if ((other.count == 0) ||
				(cnt     <= ([other minValue]-1) &&
				 cnt + 2 >= ([other maxValue]-1)))
			{
				// If a straight can be made by piecing together either dice group...
				if (((counts[cnt + 0] > 0) || (otherCounts[cnt + 0] > 0)) &&
					((counts[cnt + 1] > 0) || (otherCounts[cnt + 1] > 0)) && 
					((counts[cnt + 2] > 0) || (otherCounts[cnt + 2] > 0)))
				{
					// Then mark that number as included.
					marks[cnt + 0] =
					marks[cnt + 1] = 
					marks[cnt + 2] = true;
				}
			}
		}
	}

	
	// Loop through each ship
	for (Ship * ship in array)
	{
		// And if it's of a marked value
		if (marks[ship.value - 1])
		{
			// Then return it.
			[retVal push:ship];
		}
	}
	
//	free(counts);
//	free(otherCounts);
	
	return retVal;
}

-(bool)hasShip:(Ship*)ship
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	return [array containsObject:ship];
}

-(NSArray *) array
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	return array;
}

-(NSArray *) valueSortedArray
{
    [self sort];
    
    return array;
    
//    NSSortDescriptor *descriptor = [[NSSortDescriptor alloc] initWithKey:@"value" ascending:YES];
//    return [array sortedArrayUsingDescriptors:[NSArray arrayWithObject:descriptor]];
}

-(void) sort
{
    // Don't sort if we're already sorted.
    if ([self isSorted])
        return;
    
    NSSortDescriptor *descriptor = [[NSSortDescriptor alloc] initWithKey:@"value" ascending:YES];
    [array sortUsingDescriptors:[NSArray arrayWithObject:descriptor]];
}

-(bool) isSorted
{
    // Early exit if we've run this function before.
    if (sorted)
        return true;
    
    int lastValue = 0;
    
    for (int cnt = 0; cnt < [array count]; cnt++)
    {
        Ship* ship = (Ship*) [array objectAtIndex:cnt];
        
        if ([ship value] < lastValue)
            return false;
        
        lastValue = [ship value];
    }
    
    sorted = true; // Ensure that we don't run through this again.
    
    return true;
}

-(Ship*) atIndex:(int)index
{
	return [array objectAtIndex:index];
}

-(int) numPermutations
{
    return (0x01 << [array count]);
}

// Useful to get all combinations of ships.  
// Group has 3, 3, 5
// Permutation will return:
// 0: [_,_,_] (blank)
// 1: [3,_,_]
// 2: [_,3,_]
// 3: [3,3,_]
// 4: [_,_,5]
// 5: [3,_,5]
// 6: [_,3,5]
// 7: [3,3,5]
//
// Call this function once for each permutation that you want to get, with the index of the desired combination.
//
// You can use numPermutations to find out how many times you can successfully call without getting nil in return.
-(ShipGroup*) permutationByIndex:(int)index
{
    // Ensure that we're sorted
    
	// After a certain point there are no longer any valid permutations, so just return null.
	if (index >= [self numPermutations])
		return nil;
	
	// Allocate return value buffer
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	int cnt = 0;
	int bit;
	
	for (Ship* ship in array)
	{
		bit = 0x01 << cnt;
		
		if ((bit & index) != 0)
		{
			[retVal push:ship];
		}
            
		cnt++;
	}
	
	return retVal;
}

// Only returns permutations of dice that have unique values.  
// Any permutations that would repeat earlier permutations with the same values (even if they're on different dice) will be ignored and returned as a blank ShipGroup.
//
// Example:
// Group has 3, 3, 5
// Permutation will return:
// 0: [_,_,_] (blank)
// 1: [3,_,_]
// 2: [_,_,_] (blank) (would be [_,3,_] normally)
// 3: [3,3,_]
// 4: [_,_,5]
// 5: [3,_,5]
// 6: [_,_,_] (blank) (would be [_,3,5] normally)
// 7: [3,3,5]
//
// So as you can see, this function will help to significantly cull the AI option tree and reduce duplicate equivalent states.
//
//
// For a second example, when we roll [5,5,5,5,5], then we only want to have the sets:
// [_,_,_,_,_]
// [5,_,_,_,_]
// [5,5,_,_,_]
// [5,5,5,_,_]
// [5,5,5,5,_]
// [5,5,5,5,5]
//
// And we want to reject ALL other sets.  We can do that by sorting the array and ensuring that only left-most dice of value sets are included.
//
-(ShipGroup*) uniquePermutationByIndex:(int)index
{
    int cnt = 0, bit;
    
    // First things first, sort the array
    [self sort];
    
    int lastValue = 0;
    bool lastSkipped = false;
    bool skip;
    
    // Look through the ships, and make sure that we only include the first ships of any particular value.  
    for (Ship* ship in array)
	{
		bit = 0x01 << cnt;
		
        skip = ((bit & index) == 0);
        
        if ([ship value] == lastValue) // We're dealing with a sorted array, so ensure that we're looking at a contiguous block of dice that share the same value.
        {
            if (lastSkipped) // If a previous die of this value was "skipped" (not included in the group)...
            {
                if (!skip) // Then ensure that no later dice are also included.  
                {
                    // This has the net result that only the leftmost matching sets of dice for a group are included in the final set.
                    
                    // All other groups that fail this test are rejected, and returned as blank sets.
                    return [ShipGroup blank];
                }
            }
        }
        
		cnt++;
        lastValue = [ship value];
        lastSkipped = skip;
	}
    
    // If we made it through, then return the permutation.
    return [self permutationByIndex:index];
}

-(bool) hasShipRestrictedFrom:(Orbital*)orbital
{
    for (Ship* ship in array)
    {
        if ([ship teleportRestriction] == orbital)
            return true;
    }
    return false;
}

-(ShipGroup*) notRestrictedByOrbital:(Orbital*)orbital
{
    if (![self hasShipRestrictedFrom:orbital])
        return self;
    
    ShipGroup* retVal = [[ShipGroup alloc] init];
    
    for (Ship* ship in array)
    {
        if ([ship teleportRestriction] != orbital)
            [retVal push:ship];
    }
    
    return retVal;
}

-(ShipGroup*) nonNativeShips
{
    ShipGroup* retVal = [[ShipGroup alloc] init];
    
    for (Ship* ship in array)
    {
        if ([ship isArtifactShip])
            [retVal push:ship];
    }
    
    return retVal;
}

-(NSArray*) allPairs
{
    NSMutableArray* pairs = [[NSMutableArray alloc] init];
    
    Ship* ship1 = nil;
    Ship* ship2 = nil;
    
    for (int cnt1 = 0; cnt1 < [array count]; cnt1++)
    {
        ship1 = [array objectAtIndex:cnt1];
        
        for (int cnt2 = cnt1+1; cnt2 < [array count]; cnt2++)
        {
            ship2 = [array objectAtIndex:cnt2];
            
            if ([ship1 value] == [ship2 value])
            {
                ShipGroup* foundSet = [[ShipGroup alloc] init];
                
                [foundSet push:ship1];
                [foundSet push:ship2];
                
                [pairs addObject:foundSet];
            }
        }
    }
    
    return pairs;
}

-(NSArray*) allTriplets
{
    NSMutableArray* sets = [[NSMutableArray alloc] init];
    
    Ship* ship1 = nil;
    Ship* ship2 = nil;
    Ship* ship3 = nil;
    
    for (int cnt1 = 0; cnt1 < [array count]; cnt1++)
    {
        ship1 = [array objectAtIndex:cnt1];
        
        for (int cnt2 = cnt1+1; cnt2 < [array count]; cnt2++)
        {
            ship2 = [array objectAtIndex:cnt2];
            
            if ([ship1 value] == [ship2 value])
            {
                for (int cnt3 = cnt2+1; cnt3 < [array count]; cnt3++)
                {
                    ship3 = [array objectAtIndex:cnt3];
                    
                    if ([ship3 value] == [ship2 value])
                    {
                        ShipGroup* foundSet = [[ShipGroup alloc] init];
                        
                        [foundSet push:ship1];
                        [foundSet push:ship2];
                        [foundSet push:ship3];
                        
                        [sets addObject:foundSet];
                    }
                }
            }
        }
    }
    
    return sets;
}

-(NSArray*) allStraights
{
    // Ensure that we're sorted for this operation
    [self sort];
    
    NSMutableArray* sets = [[NSMutableArray alloc] init];
    
    Ship* ship1 = nil;
    Ship* ship2 = nil;
    Ship* ship3 = nil;
    
    for (int cnt1 = 0; cnt1 < [array count]; cnt1++)
    {
        ship1 = [array objectAtIndex:cnt1];
        
        for (int cnt2 = cnt1+1; cnt2 < [array count]; cnt2++)
        {
            ship2 = [array objectAtIndex:cnt2];
            
            // Because we're a sorted array, if we run into a duplicate value, then just skip this one.
            if ([ship2 value] == [ship1 value])
                break;
                
            // However, if we ever run into a skipped value...
            if ([ship2 value] > ([ship1 value] + 1))
            {
                cnt1++; // ...then skip the whole previous value.
                break;
            }
            
            if ([ship2 value] == ([ship1 value] + 1))
            {
                for (int cnt3 = cnt2+1; cnt3 < [array count]; cnt3++)
                {
                    ship3 = [array objectAtIndex:cnt3];

                    // Repeat the previous checks...
                    if ([ship3 value] == [ship2 value])
                        break;
                    
                    if ([ship3 value] > [ship2 value] + 1)
                    {
                        cnt1++; 
                        cnt2 = [array count]; // ...then skip BOTH previous values.
                        break;
                    }                    
                    
                    if ([ship3 value] == ([ship2 value] + 1))
                    {
                        ShipGroup* foundSet = [[ShipGroup alloc] init];
                        
                        [foundSet push:ship1];
                        [foundSet push:ship2];
                        [foundSet push:ship3];
                        
                        [sets addObject:foundSet];
                    }
                }
            }
        }
    }
    
    return sets;
}


-(int) maxIDFromPlayer:(Player*)player
{
    int maxID = -1;
    
    for (Ship* ship in array)
    {
        if ([ship playerID] == [player playerIndex])
            if ([ship shipID] > maxID)
                maxID = [ship shipID];
    }
    
    return maxID;
}

@end
