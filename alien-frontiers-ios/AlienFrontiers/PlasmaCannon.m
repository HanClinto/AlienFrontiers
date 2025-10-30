//
//  PlasmaCannon.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/12/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "PlasmaCannon.h"

#import "GameState.h"
#import "ShipGroup.h"
#import "Ship.h"
#import "Player.h"
#import "TechCardGroup.h"
#import "TerraformingStation.h"
#import "PohlFoothills.h"

@implementation PlasmaCannon

-(NSString*) title
{
	return NSLocalizedString(@"PLASMA CANNON", @"Tech title");
}
-(NSString*) title1
{
	return NSLocalizedString(@"PLASMA", @"Tech title line 1");
}
-(NSString*) title2
{
	return NSLocalizedString(@"CANNON", @"Tech title line 2");
}
-(NSString*) powerText
{
    return NSLocalizedString(@"Pay | per ship to remove other players' ships from an orbital facility to `.", @"PlasmaCannon power desc");
}

-(NSString*) discardText
{
    return NSLocalizedString(@"Discard to return any 1 ship to the SHIPYARD STOCK. Target player must have 4 or more ships.", @"Plasma Cannon discard desc");
}

-(NSString*) imageFilename
{
	return @"tech_pc.png";
}

-(NSString*) fullImageFilename
{
	return @"TCPlasmaCannon.png";
}

-(NSString*) whyCantUsePower:(ShipGroup*)ships
{
    NSString* reason = nil;
    
    reason = [super whyCantUsePower];
    
    if (reason != nil)
        return reason;
    
    if ([ships count] == 0)
        return @"You must target at least one ship";
    
    int cost = [ships count];
    
    if ([[state pohlFoothills] playerHasBonus:[state currentPlayer]])
        cost = cost - 1;
    
    Orbital* orbital = [[ships atIndex:0] dockedOrbital];
    
    for (Ship* ship in [ships array])
    {
        if ([ship dockedOrbital] != orbital)
            return @"The targeted ships must be at the same orbital";
    }
    
    if (owner.fuel < cost)
    {
        return NSLocalizedString(@"You do not have enough fuel to target that many ships.", @"Failed usage of Plasma Cannon due to too little fuel");
    }

    return nil;
}

-(bool) canUsePower:(ShipGroup*)ships
{
	if ([self canUsePower])
	{
        if ([ships count] == 0)
            return false;
        
		int cost = [ships count];
        
        if ([[state pohlFoothills] playerHasBonus:[state currentPlayer]])
            cost = cost - 1;
		
        Orbital* orbital = [[ships atIndex:0] dockedOrbital];
        
        for (Ship* ship in [ships array])
        {
            if ([ship dockedOrbital] != orbital)
                return false;
        }
        
		if (owner.fuel >= cost)
		{
            return true;
		}
		else {
			// ERROR: Not enough fuel to pay for that many ships!
		}
	}
    
    return false;
}


-(void) usePower:(ShipGroup*)ships
{
    if ([self state] == [GameState sharedGameState])
    {
        NSString* why = [self whyCantUsePower:ships];
        if (why != nil)
        {
            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: ERROR: %@", @"Error message for failed tech usage"),
                            [[state currentPlayer] playerName],
                            why
                            ]];
        }
    }
	
    if ([self canUsePower:ships])
	{
		int cost = [ships count];
        
        if ([[state pohlFoothills] playerHasBonus:[state currentPlayer]])
            cost = cost - 1;
		
		if (owner.fuel >= cost)
		{
            [state createUndoPoint];
            
			owner.fuel = owner.fuel - cost;
            
            Orbital* orbital = nil;

			for (Ship* ship in [ships array])
			{
                orbital = [ship dockedOrbital];
                
				// If ship is on the Terraforming station...
				if ([ship dockedOrbital] == [state terraformingStation])
				{
					// Then destroy it...
					[ship destroy];
				}
				else {
					// Otherwise, just move it to the maintenance bay
					[ship moveToMaintBay];
				}
			}
			
			// Mark that we used the card this turn.
			[self setTapped:true];
            
            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: %@%@ Cannoned %@ from %@, using %d fuel", @"Plasma Cannon power"),
                            [[state currentPlayer] playerName],
                            [[self randomBlastSound] capitalizedString],
                            [@"!!!!!!!!!!" substringToIndex:[ships count]],
                            [ships title],
                            [orbital title],
                            cost
                            ]];
            
            [state postEvent:EVENT_USE_PLASMA_CANNON object:self];
		}
		else {
			// ERROR: Not enough fuel to pay for that many ships!
		}
	}
}

-(NSString*) randomBlastSound
{
    NSArray* blastSounds = [NSArray arrayWithObjects:
                            NSLocalizedString(@"KAPOW",         @"Plasma cannon sound 1"),
                            NSLocalizedString(@"ZZAAAAP",       @"Plasma cannon sound 2"),
                            NSLocalizedString(@"PAZOW",         @"Plasma cannon sound 3"),
                            NSLocalizedString(@"BZZZZZT",       @"Plasma cannon sound 4"),
                            NSLocalizedString(@"WHAZZZOP",      @"Plasma cannon sound 5"),
                            NSLocalizedString(@"BZRRRRT",       @"Plasma cannon sound 6"),
                            NSLocalizedString(@"SHH-KOW",       @"Plasma cannon sound 7"),
                            NSLocalizedString(@"GRZZZZT",       @"Plasma cannon sound 8"),
                            NSLocalizedString(@"PI-CHOO",       @"Plasma cannon sound 9"),
                            NSLocalizedString(@"PEW PEW PEW",   @"Plasma cannon sound 10"),
                            nil];
    
    return ((NSString*) [blastSounds objectAtIndex:(arc4random() % [blastSounds count])]);
}

-(void) useDiscard:(Ship*)ship
{
	if ([self canUseDiscard])
	{
		// As long as we don't own the ship...
		if ([ship player] != [[[ship player] state] currentPlayer])
		{
            // And the other player can afford to lose it
            if (([[ship player] numActiveNativeShips] > 3) ||
                ([ship isArtifactShip]))
            {
                [state createUndoPoint];
                
                [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: %@!!! Discarded %@ to destroy %@'s ship (%@) at %@", @"Plasma Cannon discard"),
                                [[state currentPlayer] playerName],
                                [self randomBlastSound],
                                [[self title] capitalizedString],
                                [[ship player] playerName],
                                [ship title],
                                [[ship dockedOrbital] title]
                                ]];

                // Then we can destroy it.
                [ship destroy];
                
                // Discard this card.
                [super useDiscard];
                
                [state postEvent:EVENT_DISCARD_PLASMA_CANNON object:self];
            }
		}
	}
}

@end
