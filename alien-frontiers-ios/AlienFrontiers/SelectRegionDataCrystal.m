//
//  SelectRegionDataCrystal.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/31/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SelectRegionDataCrystal.h"

#import "BurroughsDesert.h"

@implementation SelectRegionDataCrystal

-(bool) canSelect:(NSObject *)touchedObject
{
	// Only select regions
	if (![touchedObject isKindOfClass:[Region class]])
		return false;
	
	Region* region = (Region*) touchedObject;
	
	// Only select valid regions
	if (region == nil)
		return false;
	
	// Ignore regions that have the isolation field (for borrowing powers)
	if ([region hasIsolationField])
		return false;
	
    // Cannot borrow the power of the Burroughs Desert
    if ([region isKindOfClass:[BurroughsDesert class]])
        return false;
    
	// Ignore regions that are empty
	if ([region numColonies] == 0)
		return false;
	
	// Ignore the region if the current player already has the power
	if ([region playerHasBonus:[[GameState sharedGameState] currentPlayer]])
		return false;
	
	// Otherwise, then assume we have a valid selection.
	
	return true;
}

@end
