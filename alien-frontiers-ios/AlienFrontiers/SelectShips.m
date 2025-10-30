//
//  SelectShips.m
//  AlienFrontiers
//
//  Created by Clint Herron on 6/13/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SelectShips.h"

#import "MaintenanceBay.h"
#import "TerraformingStation.h"

@implementation SelectShips

-(id) initWithCaption:(NSString *)cap mustBeDocked:(bool)docked ignoreMaintBay:(bool)maintBay ignoreTerrStation:(bool)terrStation fromPlayer:(Player*)_fromPlayer notFromPlayer:(Player*)_notFromPlayer selectQuant:(int)quant minValue:(int)min maxValue:(int)max ignoreTeleported:(bool)teleported
{
	if ((self = [super initWithCaption:cap]))
	{
		selectedShips = [[ShipGroup alloc] init];
		
		mustBeDocked = docked;
		ignoreMaintBay = maintBay;
		ignoreTerrStation = terrStation;
        ignoreTeleported = teleported;
		
		fromPlayer = _fromPlayer;
		notFromPlayer = _notFromPlayer;
		
		maxQuant = quant;
		
		minValue = min;
		maxValue = max;
	}
	
	return self;
}

-(SelectShips*) initWithCaptionBoosterPod:(NSString *)cap 
{
	return [self initWithCaption:cap 
					mustBeDocked:false 
				  ignoreMaintBay:true 
			   ignoreTerrStation:true 
					  fromPlayer:[[GameState sharedGameState] currentPlayer] 
				   notFromPlayer:nil 
					 selectQuant:1 
						minValue:1 
						maxValue:5
                ignoreTeleported:true];
}

-(SelectShips*) initWithCaptionStasisBeam:(NSString *)cap 
{
	return [self initWithCaption:cap 
					mustBeDocked:false 
				  ignoreMaintBay:true 
			   ignoreTerrStation:true 
					  fromPlayer:[[GameState sharedGameState] currentPlayer] 
				   notFromPlayer:nil 
					 selectQuant:1 
						minValue:2 
						maxValue:6
                ignoreTeleported:true];
}

-(SelectShips*) initWithCaptionOneUndocked:(NSString *)cap 
{
	return [self initWithCaption:cap 
					mustBeDocked:false 
				  ignoreMaintBay:true 
			   ignoreTerrStation:true 
					  fromPlayer:[[GameState sharedGameState] currentPlayer] 
				   notFromPlayer:nil 
					 selectQuant:1 
						minValue:1 
						maxValue:6
                ignoreTeleported:false];
}

-(SelectShips*) initWithCaptionTeleporter:(NSString *)cap
{
	return [self initWithCaption:cap 
					mustBeDocked:true 
				  ignoreMaintBay:true 
			   ignoreTerrStation:true 
					  fromPlayer:[[GameState sharedGameState] currentPlayer] 
				   notFromPlayer:nil 
					 selectQuant:1 
						minValue:1 
						maxValue:6
                ignoreTeleported:false];
}

-(SelectShips*) initWithCaptionPlasmaCannon:(NSString*)cap maxQuant:(int)quant
{
	return [self initWithCaption:cap 
					mustBeDocked:true 
				  ignoreMaintBay:(quant != 1)
			   ignoreTerrStation:false 
					  fromPlayer:nil
				   notFromPlayer:[[GameState sharedGameState] currentPlayer]  
					 selectQuant:quant
						minValue:1 
                        maxValue:6
                ignoreTeleported:false];
}

-(SelectShips*) initWithCaptionWarper:(NSString *)cap 
{
	return [self initWithCaption:cap 
					mustBeDocked:false 
				  ignoreMaintBay:true 
			   ignoreTerrStation:true 
					  fromPlayer:[[GameState sharedGameState] currentPlayer] 
				   notFromPlayer:nil 
					 selectQuant:0 
						minValue:1 
						maxValue:6
                ignoreTeleported:true];
}

-(void) trySelect:(NSObject*)touchedObject
{
	if ([self canSelect:touchedObject])
	{
		Ship* ship = (Ship*) touchedObject;
		
		// Un-select any old ship if necessary.
		if ([selectedShips hasShip:ship])
		{
			[selectedShips remove:ship];
			[ship setIsSelected:false];
		} else {
			[selectedShips push:ship];
			[ship setIsSelected:true];
		}
	}
}

-(bool) canSelect:(NSObject*)touchedObject
{
	// Only select ships
	if (![touchedObject isKindOfClass:[Ship class]])
		return false;
	
	Ship* ship = (Ship*) touchedObject;
	
	// Only select valid objects
	if (ship == nil)
		return false;
	
	// Only select permitted ships
	if (fromPlayer != nil)
		if ([ship player] != fromPlayer)
			return false;
	
	// Don't select forbidden ships
	if (notFromPlayer != nil)
		if ([ship player] == notFromPlayer)
			return false;
	
	// Only select ships that are docked
	if ([ship docked] != mustBeDocked)
		return false;
    
    if (([ship teleportRestriction] != nil) && ignoreTeleported)
        return false;
    
	if ([ship value] < minValue)
		return false;
	
	if ([ship value] > maxValue)
		return false;
	
	if (ignoreMaintBay)
	{
		// Don't target ships in the maintenance bay
		if ([[ship dock] orbital] == [[GameState sharedGameState] maintenanceBay])
			return false;
	}
	
	if (ignoreTerrStation)
	{
		// Don't target ships in the Terraforming Station
		if ([ship dockedOrbital] == [[GameState sharedGameState] terraformingStation])
			return false;
	}
    
    // If we're selecting a ship (rather than deselecting)
    if ((maxQuant > 0) && (![selectedShips hasShip:ship]))
    {
        // Too many ships selected
        if ([selectedShips count] >= maxQuant)
        {
            return false;
        }
    }
    
    if ([selectedShips count] > 0)
    {
        // Ensure that all of the ships match the same dock
        Orbital* dockedOrbital = [ship dockedOrbital];
        
        for (Ship* s in [selectedShips array])
        {
            if ([s dockedOrbital] != dockedOrbital)
                return false;
        }
        
    }
	
	// Otherwise, then assume we have a valid selection.
	return true;
}

-(bool) autoAdvance
{
	return maxQuant == 1;
}

-(bool) isSelectionComplete
{
	return ([selectedShips count] > 0);
}

-(id) selectedObject
{
	if (maxQuant == 1)
	{
		if ([selectedShips count] > 0)
		{
			return [selectedShips atIndex:0];
		}
		else {
			return nil;
		}

	} else {
		return selectedShips;
	}
}


@end
