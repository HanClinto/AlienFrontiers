//
//  LunarMine.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LunarMine.h"

#import "VanVogtMountains.h"

@implementation LunarMine

-(int) numDockGroups
{
	if ([state numPlayers] <= 2)
		return 3;
	
	if ([state numPlayers] <= 3)
		return 4;
	
	return 5;
}

-(int) numDocksPerGroup
{
	return 1;
}

-(NSString*) title
{
    return NSLocalizedString(@"Lunar Mine", @"Orbital Title");
}

-(int) maxValueNotFromPlayer:(Player*)player
{
	int maxValue = 1;
	
	for (DockGroup* group in dockGroups)
	{
		for (DockingBay* dock in group.dockArray)
		{
			if (dock.occupied)
			{
				if (dock.dockedShip.player != player)
				{
					if (dock.dockedShip.value > maxValue)
					{
						maxValue = dock.dockedShip.value;
					}
				}
			}
		}
	}
	
	return maxValue;
}


-(ShipGroup*) usableShipsFromPlayer:(Player*)player shipsInHand:(ShipGroup*)shipsInHand selectedShips:(ShipGroup*)selectedShips
{
    // As long as there are open spaces...
    if (([self numEmptyGroups] <= selectedShips.count) ||
        ([selectedShips hasShipRestrictedFrom:self]))
        return [ShipGroup blank];
        
    // Then if we have VanVogt, and haven't already used its bonus this turn, then we can place any die...
    if ([[state vanVogtMountains] playerHasBonus:player])
    {
        // If we haven't already used its bonus
        if (![[state vanVogtMountains] bonusUsedThisTurn])
        {
            int numSelectedShipsBelowLimit;
            
            if ([player aiType] == AI_TYPE_HUMAN)
                numSelectedShipsBelowLimit = [selectedShips countLessThan:[self maxValueNotFromPlayer:player]];
            else
                numSelectedShipsBelowLimit = [selectedShips countLessThan:[self maxValueNotFromPlayer:nil]];
            
            // If we haven't yet queued our bonus usage
            if (numSelectedShipsBelowLimit == 0)
            {
                // Then we can use any ship in hand.
                return [shipsInHand notRestrictedByOrbital:self];
            }
            else if (numSelectedShipsBelowLimit > 1)
            {
                // Otherwise, if we've selected more than one ship that's below the limit, then that's no longer valid.
                return [ShipGroup blank];
            }
            
            // If we've got just 1 ship already selected that's below the limit, then fall through to the normal case.
        }
    }

    
	// As long as there are open docks, we can play any die that's greater than or equal to the other dice already on the lunar mine.
    if ([player aiType] == AI_TYPE_HUMAN)
    {
        if ([selectedShips minValue] >= [self maxValueNotFromPlayer:player])
            return [[shipsInHand greaterThanOrEqual:[self maxValueNotFromPlayer:player]] notRestrictedByOrbital:self];
	}
    else // The AI is more strict about docking lower ships.
    {
        if ([selectedShips minValue] >= [self maxValueNotFromPlayer:nil])
            return [[shipsInHand greaterThanOrEqual:[self maxValueNotFromPlayer:nil]] notRestrictedByOrbital:self];
    }
    
	// If there are no open docks, then we cannot play anything.
	return [ShipGroup blank];
}

-(bool) isValidMoveFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
	// As long as there are open docks, we can play any die that's greater than or equal to the other dice already on the lunar mine.
	if (selectedShips.count > 0)
    {
		if ([selectedShips count] <= [self numEmptyGroups])	
        {
            if (![selectedShips hasShipRestrictedFrom:self])
            {
                int numSelectedShipsBelowLimit;
                
                // TODO: Add a pedantic "tournament" mode option for keeping human players accountable also.
                if ([player aiType] == AI_TYPE_HUMAN)
                    numSelectedShipsBelowLimit = [selectedShips countLessThan:[self maxValueNotFromPlayer:player]];
                else
                    numSelectedShipsBelowLimit = [selectedShips countLessThan:[self maxValueNotFromPlayer:nil]];
                
                // If we don't have any ships below the limit...
                if (numSelectedShipsBelowLimit == 0)
                {
                    // Then it's a valid move.
                    return true;
                }
                // Otherwise, it's only valid if we have the Von Vogt power...
                else if ([[state vanVogtMountains] playerHasBonus:player])
                {
                    // ...and haven't already used its bonus...
                    if (![[state vanVogtMountains] bonusUsedThisTurn])
                    {
                        // ...and haven't tried to dock more than 1 below-limit ship
                        if (numSelectedShipsBelowLimit <= 1)
                        {
                            // If all of this is true, then it's a valid move.
                            return true;
                        }
                    }
                }
            }
        }
    }
	
	// Otherwise, it's not a valid move!
	return false;
}

-(void) commitShipsFromPlayer:(Player*)player selectedShips:(ShipGroup*)selectedShips
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);	
	
	if ([self isValidMoveFromPlayer:player selectedShips:selectedShips])
	{
		[state createUndoPoint];
        
        int numSelectedShipsBelowLimit;
        
        // TODO: Add a pedantic "tournament" mode option for keeping human players accountable also.
        if ([player aiType] == AI_TYPE_HUMAN)
            numSelectedShipsBelowLimit = [selectedShips countLessThan:[self maxValueNotFromPlayer:player]];
        else
            numSelectedShipsBelowLimit = [selectedShips countLessThan:[self maxValueNotFromPlayer:nil]];
		
        if ((numSelectedShipsBelowLimit >= 1) && (![[state vanVogtMountains] playerHasBonus:player]))
        {
            CCLOG(@"ERROR: Trying to dock below-limit %d ship(s) on the Lunar Mine", numSelectedShipsBelowLimit);
        }
        
        // Any time you dock on the Lunar Mine, you invalidate using the Von Vogt bonus for future dockings -- whether or not you *actually* took advantage of the bonus.
        [[state vanVogtMountains] setBonusUsedThisTurn:true];
        
		for (Ship* ship in [selectedShips valueSortedArray]) {
			player.ore = player.ore + 1;
			
			[self.firstEmptyGroup dockShip:ship];
		}

        [super commitShipsFromPlayer:player selectedShips:selectedShips];
        
        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Harvested %d ore", @"Ore from mine"),
                        [[state currentPlayer] playerName],
                        [selectedShips count]
                        ]];
	}
}

@end
