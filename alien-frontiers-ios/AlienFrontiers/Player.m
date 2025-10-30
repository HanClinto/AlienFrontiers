//
//  Player.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "GameState.h"

#import "Player.h"
#import "Orbital.h"
#import "TerraformingStation.h"
#import "ColonistHub.h" // For MAX_COLONY_POSITION
#import "PlayerTechCardGroup.h"
#import "TechCard.h"
#import "Region.h"
#import "ResourceCache.h"
#import "AlienCity.h"
#import "AlienMonument.h"
#import "VanVogtMountains.h" // To reset the bonus used flag
#import "AsimovCrater.h" // To reset the bonus used flag
#import "BurroughsDesert.h" // For the Artifact Ship
#import "HerbertValley.h"
#import "MaintenanceBay.h"
#import "HeinleinPlains.h"
#import "HolographicDecoy.h" // To check for raiding capabilities
#import "TerraformingStation.h"

#import "AIPlayer.h"

#import "ExhaustiveAI.h"
#import "SimpleAI.h"
#import "AIPlayer.h"

#import "GCTurnBasedMatchHelper.h" // GC Multiplayer stuff // TODO: Do we have to have this here?  Needed for isLocalPlayer check
#import <GameKit/GameKit.h>

@implementation Player

@synthesize isChoosingDiscard = _isChoosingDiscard;
@synthesize isDraftingTech = _isDraftingTech;

-(Player*) initWithState:(GameState*)_state playerIndex:(int)_index colorIndex:(int)_color numPlayers:(int)_numPlayers
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    if ((self = [super init]))
    {
		index = _index;
		colorIndex = _color;
		state = _state;
        gcPlayerID = nil;

		activeShips = [[ShipGroup alloc] init];
		inactiveShips = [[ShipGroup alloc] init];
		allShips = [[ShipGroup alloc] init];

   		cards = [[PlayerTechCardGroup alloc] initWithPlayer:self];
		
		for (int cnt = 0; cnt < 6; cnt++)
		{
			Ship* ship = [[Ship alloc] initWithPlayer:self shipIndex:cnt];
			
			[inactiveShips push:ship];
			[allShips push:ship];
		}
		
		coloniesLeft = 6 + (4 - _numPlayers);
		
		switch (index) {
			case 1:
				fuel = 1;
				break;
			case 2:
				ore = 1;
				break;
			case 3:
				ore = 1;
				fuel = 1;
				break;
			default:
				break;
		}
		
		initialRollDone = false;
    }
    return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
		
	[encoder encodeInt:fuel forKey:@"fuel"];
	[encoder encodeInt:ore forKey:@"ore"];
	[encoder encodeObject:activeShips forKey:@"activeShips"];
	[encoder encodeObject:inactiveShips forKey:@"inactiveShips"];
	[encoder encodeObject:allShips forKey:@"allShips"];
	[encoder encodeInt:colorIndex forKey:@"colorIndex"];
	[encoder encodeObject:state forKey:@"state"];
	[encoder encodeObject:cards forKey:@"cards"];
	[encoder encodeInt:marketPrice forKey:@"marketPrice"];
	[encoder encodeInt:index forKey:@"index"];
	[encoder encodeInt:coloniesToLaunch forKey:@"coloniesToLaunch"];
	[encoder encodeInt:coloniesLeft forKey:@"coloniesLeft"];
	[encoder encodeInt:artifactCreditAvailable forKey:@"artifactCreditAvailable"];
	[encoder encodeInt:artifactShufflesAvailable forKey:@"artifactShufflesAvailable"];
	[encoder encodeBool:initialRollDone forKey:@"initialRollDone"];
	[encoder encodeObject:borrowingRegion forKey:@"borrowingRegion"];
	[encoder encodeInt:techsDiscarded forKey:@"techsDiscarded"];
	
    [encoder encodeBool:isRaiding forKey:@"isRaiding"];
	[encoder encodeInt:fuelToRaid forKey:@"fuelToRaid"];
	[encoder encodeInt:oreToRaid forKey:@"oreToRaid"];
    [encoder encodeObject:selectedCard forKey:@"selectedCard"];
    
    [encoder encodeBool:_isChoosingDiscard forKey:@"isChoosingDiscard"];
    [encoder encodeBool:_isDraftingTech forKey:@"isDraftingTech"];
    
    [encoder encodeInt:aiType forKey:@"aiType"];
    
    [encoder encodeObject:gcPlayerID forKey:@"gcPlayerID"];
}


-(id)initWithCoder:(NSCoder *)decoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
    {
		fuel = [decoder decodeIntForKey:@"fuel"];
		ore = [decoder decodeIntForKey:@"ore"];
		activeShips = [decoder decodeObjectForKey:@"activeShips"];
		inactiveShips = [decoder decodeObjectForKey:@"inactiveShips"];
		allShips = [decoder decodeObjectForKey:@"allShips"];
		colorIndex = [decoder decodeIntForKey:@"colorIndex"];
		state = [decoder decodeObjectForKey:@"state"];						// No retain needed here, because it's retained elsewhere.
		borrowingRegion = [decoder decodeObjectForKey:@"borrowingRegion"];	// No retain needed here, because it's retained elsewhere.
		cards = [decoder decodeObjectForKey:@"cards"];
		marketPrice = [decoder decodeIntForKey:@"marketPrice"];
		index = [decoder decodeIntForKey:@"index"];
		coloniesToLaunch = [decoder decodeIntForKey:@"coloniesToLaunch"];
		coloniesLeft = [decoder decodeIntForKey:@"coloniesLeft"];
		artifactCreditAvailable = [decoder decodeIntForKey:@"artifactCreditAvailable"];
		artifactShufflesAvailable = [decoder decodeIntForKey:@"artifactShufflesAvailable"];
		initialRollDone = [decoder decodeBoolForKey:@"initialRollDone"];
		techsDiscarded = [decoder decodeIntForKey:@"techsDiscarded"];
        isRaiding = [decoder decodeBoolForKey:@"isRaiding"];
		fuelToRaid = [decoder decodeIntForKey:@"fuelToRaid"];
		oreToRaid = [decoder decodeIntForKey:@"oreToRaid"];
        selectedCard = [decoder decodeObjectForKey:@"selectedCard"];
        _isChoosingDiscard = [decoder decodeObjectForKey:@"isChoosingDiscard"];
        _isDraftingTech = [decoder decodeObjectForKey:@"isDraftingTech"];
        aiType = [decoder decodeIntForKey:@"aiType"];
        
        gcPlayerID = [decoder decodeObjectForKey:@"gcPlayerID"];
	}
	
	return self;
}

-(int) playerIndex
{
	return index;
}

-(NSString*) playerName
{
    return [NSString stringWithFormat:NSLocalizedString(@"[P%d]", @"Player title"), index+1];
}

-(NSString*) gcPlayerID
{
    return gcPlayerID;
}

-(void) setGcPlayerID:(NSString *)value
{
    gcPlayerID = value;
}

-(bool) initialRollDone
{
	return initialRollDone;
}

-(int) fuel
{
	return fuel;
}

-(void) setFuel:(int)value
{
	fuel = value;

	[state postEvent:EVENT_RESOURCES_CHANGED object:self];
}

-(int) ore
{
	return ore;
}

-(void) setOre:(int)value
{
	ore = value;

	[state postEvent:EVENT_RESOURCES_CHANGED object:self];
}

-(ShipGroup*) activeShips
{
	return activeShips;
}

-(int) resourcesNeededForNextShip
{
	int cost = [self numActiveNativeShips] - 2;
	
	if ([[state herbertValley] playerHasBonus:self])
		cost -= 1;
	
	return cost;
}

-(void) gatherShips
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	// TODO: Do not undo here!
//	[state createUndoPoint];
	
	// In reality, we won't allow any undo across roll points.
	[state clearUndoRedo];
	
	// First, check to make sure that the terraforming station doesn't contain one of our ships.
	for (Ship* ship in [[[state terraformingStation] dockedShips] array])
	{
		if (ship.player == self)
		{
			[ship destroy];
		}
	}
	
	// Next, undock all of the other ships that aren't doomed for the recycling bin.
	for (Ship* ship in activeShips.array)
	{
		if ([ship docked])
		{
			[ship undock];
		}
	}
	
//	[state postEvent:EVENT_SHIP_CHANGED object:self];
}

-(void) rollShips
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if (!initialRollDone)
	{
		// TODO: Do not undo here!
		//	[state createUndoPoint];
		
		// In reality, we won't allow any undo across roll points.
		[state clearUndoRedo];
		
        ShipGroup* ships = [self activeShips];
		for (Ship* ship in ships.array)
		{
			if (!ship.docked && ship.active)
            {
				[ship roll];
			}
		}
        
        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Rolled: %@", @"Rolled ships"),
                        [self playerName], 
                        [ships title]]];
		
		initialRollDone = true;

		// Check for resource cache
		TechCard* card = [cards findCardOfType:[ResourceCache class]];
		if (card != nil)
		{
			int numOddShips = ships.numOdd;
			int numEvenShips = ships.numEven;
			
			if (numOddShips > numEvenShips)
			{
				self.ore += 1;
                
                [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: %@ added 1 ore", @"Resource Cache message"),
                                [[state currentPlayer] playerName],
                                [[card title] capitalizedString]
                                ]];
			} else if (numEvenShips > numOddShips)
			{
				self.fuel += 1;
                [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: %@ added 1 fuel", @"Resource Cache message"),
                                [[state currentPlayer] playerName],
                                [[card title] capitalizedString]
                                ]];
			} else 
			{
				self.ore += 1;
				self.fuel += 1;
				
                [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: %@ added 1 ore, 1 fuel and was discarded", @"Resource Cache message"),
                                [[state currentPlayer] playerName],
                                [[card title] capitalizedString]
                                ]];

				[cards removeCard:card];
                [[state techDiscardDeck] pushCard:card];
				[state postEvent:EVENT_ARTIFACT_CARDS_CHANGED object:self];
				// TODO: Post a specific event for losing this card, so that its life does not appear to have been in vain?  Then we can animate its disappearnace.
			}

		}
		
		[state postEvent:EVENT_SHIP_CHANGED object:self];
		[state postEvent:EVENT_SHIPS_ROLLED object:self];
	}
}

-(int) colorIndex
{
	return colorIndex;
}

-(ccColor3B) color
{
	switch (colorIndex) {
		case 0:
			return (ccColor3B){255, 52, 62};  // Red
		case 1:
			return (ccColor3B){64, 255, 96};  // Green
//			return (ccColor3B){78, 255, 122};
		case 2:
			return (ccColor3B){69, 202, 255};  // Blue
		case 3:
			return (ccColor3B){255, 255, 96};  // Yellow
//			return (ccColor3B){255, 223, 61};
		case 4:
		default:
			return ccMAGENTA;
	}
}

-(void) activateStartingShips
{
	// Begin with 3 ships
    
#ifndef DETERMINISTIC
	for (int cnt = 0; cnt < 3; cnt++)
#else
    for (int cnt = 0; cnt < 6; cnt++)    
#endif
	{
		[self activateShip];
	}
}

-(void) activateShip
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	if (inactiveShips.count > 0)
	{
		Ship* ship = [inactiveShips atIndex:0];

		[inactiveShips remove:ship];
		[activeShips push:ship];
		
		ship.active = true;
		[[state maintenanceBay] dockShip:ship];
		
		[state postEvent:EVENT_SHIP_ACTIVATE object:ship];
	}
}

-(bool) purchaseArtifactShip
{
    if (![[state burroughsDesert] playerCanPurchaseShip:self])
        return false;
    
    [state createUndoPoint];
    
    self.ore -= 1;
    self.fuel -= 1;
    
    [[state artifactShip] setPlayer:self];
    [[state artifactShip] setActive:true];
    
    [activeShips push:[state artifactShip]];
    [allShips push:[state artifactShip]];
    
    [[state artifactShip] moveToMaintBay];

    [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Purchased Artifact Ship", @"Purchased Artifact Ship"),
                    [self playerName]
                    ]];
    
    return true;    
    
}

-(bool) hasActiveArtifactShip
{
    if (([[state artifactShip] player] == self) &&
        ([[state artifactShip] active]))
    {
        return true;
    }
    
    return false;
}

-(void) deactivateShip:(Ship*)ship
{
    if (([self numActiveNativeShips] > 3) || [ship isArtifactShip])  // We cannot go below 3 native ships
	{
		[ship undock]; // Ensure that it is undocked.
		
		[activeShips remove:ship];
        
        if ([ship isArtifactShip])
        {
//            [ship setPlayer:nil];
            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Returned Artifact Ship to %@", @"Lost control of Artifact Ship"),
                            [self playerName],
                            [[state burroughsDesert] title]
                            ]];
            
            [allShips remove:ship];
        }
        else    
        {
            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Destroyed ship %@", @"Destroyed a ship."),
                            [self playerName],
                            [ship title]
                            ]];
            
            [inactiveShips push:ship];
        }
		
		ship.active = false;
		[state postEvent:EVENT_SHIP_DESTROY object:ship];
	}
}

-(void) addColony
{
	coloniesToLaunch++;
//	coloniesLeft--;
	
	[state postEvent:EVENT_LAUNCH_COLONY object:self];
}

-(void) setMarketPrice:(int) price
{
	bool fireEvent = (marketPrice != price);
	marketPrice = price;

	if (fireEvent)
		[state postEvent:EVENT_MARKET_PRICE_CHANGED object:self];
}

-(int) marketPrice
{
	// Check for territory bonus
	// If we control the Heinlein Plains, and we have docked ships at the market this turn...
	if ([[state heinleinPlains] playerHasBonus:self] && (marketPrice >= 1))
	{
		// ... then trade at 1-to-1, no matter what our dice were.
		return 1;
	}
	
	return marketPrice;
}

-(bool) ableToMarketTrade
{
	if ([self marketPrice] > 0)
	{
		if (fuel >= [self marketPrice])
		{
			return true;
		}
	}
	
	return false;
}

-(void) doMarketTrade
{
	if ([self ableToMarketTrade])
	{
		[state createUndoPoint];
		
		fuel = fuel - [self marketPrice];
		ore += 1;
		
		[state postEvent:EVENT_RESOURCES_CHANGED object:self];
        
        {
            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Traded %d fuel for 1 ore.", @"Orbital Market usage"),
                            [self playerName], 
                            [self marketPrice]]];
        }
        
	}
}

-(ShipGroup*) selectedShips
{
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	for (Ship* ship in activeShips.array)
	{
		if (ship.isSelected)
			[retVal push:ship];
	}
	
	return retVal;
}

-(ShipGroup*) unselectedShips
{
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	for (Ship* ship in activeShips.array)
	{
		if (!ship.isSelected)
			[retVal push:ship];
	}
	
	return retVal;
}

-(ShipGroup*) undockedShips
{
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	for (Ship* ship in activeShips.array)
	{
		if (!ship.docked)
			[retVal push:ship];
	}
	
	return retVal;	
}

-(int) numUndockedShips
{
    int retVal = 0;
	
	for (Ship* ship in activeShips.array)
	{
		if (!ship.docked)
            retVal++;
	}
	
	return retVal;	
}

-(int) numActiveNativeShips
{
    int retVal = 0;
	
    // TODO: Can target a player's native ship with the Plasma Cannon discard if a player's 4th native ship is on the Terraforming Station.  Need to account for this without decreasing cost of shipyard when 4th native ship is on TS.

	for (Ship* ship in activeShips.array)
	{
        if ((!ship.isArtifactShip) 
            //&& ([[ship dockedOrbital] class] != [TerraformingStation class])
            )
            retVal++;
	}
	
	return retVal;    
}

-(void) autoDiscard
{
    if (ore + fuel > 8)
    {
        [self setOre:[self maximizedOre]];
        [self setFuel:[self maximizedFuel]];
        
        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Too many resources at end of turn. Discarded down to %d fuel and %d ore.", @"Auto-resource-discard"),
                        [self playerName],
                        [self fuel],
                        [self ore]]];
    }
}

-(int) maximizedOre
{
    return (MIN(ore, 8));
}

-(int) maximizedFuel
{
    return (MIN(fuel, 8 - [self maximizedOre]));
}


-(ShipGroup*) undockedUnselectedShips
{
	ShipGroup* retVal = [[ShipGroup alloc] init];
	
	for (Ship* ship in activeShips.array)
	{
		if ((!ship.docked) && (!ship.isSelected))
			[retVal push:ship];
	}
	
	return retVal;	
}

-(Ship*) shipByID:(int)shipID
{
    Ship* firstTry = [allShips atIndex:shipID];
    
    if ([firstTry shipID] == shipID)
        return firstTry;
    
    for (Ship* ship in [allShips array])
    {
        if ([ship shipID] == shipID)
            return ship;
    }
    
    CCLOG(@"ERROR: Could not find ship ID %d for player %@!", shipID, self);
    return nil;
//	return [allShips atIndex:shipID];
}

-(GameState*) state
{
	return state;
}

-(ShipGroup*) allShips
{
	return allShips;
}

-(int) numColoniesToLaunch
{
	return coloniesToLaunch;
}

-(void) setNumColoniesToLaunch:(int)val
{
	coloniesToLaunch = val;
}

-(int) coloniesLeft
{
	return coloniesLeft; // TODO:  + coloniesToLaunch; (?)
}

-(void) decrementColoniesLeft
{
	coloniesLeft--;
    
    if (coloniesLeft == 0)
    {
        // Clear any excess progress on the colonist hub if this is our last colony
        [[state colonistHub] setColonyPosition:[self playerIndex] value:0];
    }
}

-(int) vps
{
	// If has alien monument
		// Add 1
	// If has alien city
		// Add 1
	
	// For each planet region
	    // Add number of colonies for this player
		// If player is majority
			// Then add 1
			// If region has positron
				// Then add 1
	
	int vp = 0;
	
	// Check for victory point alien tech
	if ([cards findCardOfType:[AlienCity class]] != nil)
		vp += 1;
	if ([cards findCardOfType:[AlienMonument class]] != nil)
		vp += 1;
	
	// Check regions
	for (Region* region in [state regions])
	{
		vp += [region coloniesForPlayer:[self playerIndex]];
		
		// Check regions for majority
		if ([region playerWithMajority] == [self playerIndex])
		{
			vp += 1;
			
			// If we have the majority, check for the positron field
			if ([region hasPositronField])
				vp += 1;
		}
	}
	
	return vp;
}

// A score that includes offsets useful for breaking ties.
-(float) score
{
    return [self vps] + 
    0.01 * [cards count] +  // "Ties are broken by number of tech cards."
    0.0001 * ore +          // "Persistent ties are broken by number of ore tokens..."
    0.000001 * fuel;        // "...then by number of fuel tokens."
}

-(void) endTurnCleanup
{
	// Clear Orbital Market value
	[self setMarketPrice:0];

	// Clear any excess Colonist Hub progress
	// TODO: Do this after every action -- so as to only make roll-over progress count when launched "immediately"?
	if ([[state colonistHub] colonyPosition:[self playerIndex]] > MAX_COLONY_POSITION)
	{
		[[state colonistHub] setColonyPosition:[self playerIndex] value:MAX_COLONY_POSITION];
	}
    
	// Clear any credit in the alien artifact
	self.artifactCreditAvailable	= 0;
	self.artifactShufflesAvailable	= 0;
	
	// Un-"tap" any alien tech cards
	for (TechCard* card in [cards array])
	{
		if ([card tapped])
			[card setTapped:false];
	}
	
	// Reset discard counters
	techsDiscarded = 0;
    
    isRaiding = false;
    _isDraftingTech = false;
    _isChoosingDiscard = false;
	
	borrowingRegion = nil;
	
    // Clean up after the Orbital Teleporter and remove any dock restrictions.
	for (Ship* ship in [allShips array])
	{
		[ship setTeleportRestriction:nil];
	}
	
	for (Region* region in [state regions]) {
		if ([region isSelected])
			[region setIsSelected:false];
	}
	
	for (Player* player in [state players]) {
		player.oreToRaid = 0;
		player.fuelToRaid = 0;
	}
	
	initialRollDone = false;
    
    [[state vanVogtMountains]   setBonusUsedThisTurn:false];
    [[state asimovCrater]       setBonusUsedThisTurn:false];
    [[state colonistHub]        setAdvancementThisTurn:0];

    // Automatically discard down to 8 resources
    [self autoDiscard];
    
    [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Ended turn #%d", @"Player ended turn."),
                    [self playerName],
                    [state numTurns] + 1
                    ]];
    
    selectedCard = nil;
}

-(TechCard*) selectedCard
{
//    if (self != [state currentPlayer])
//        return nil;
    
    if ([selectedCard owner] != self)
        selectedCard = nil;
    
    if (selectedCard == nil)
    {
        if ([cards count] > 0)
        {
            selectedCard = [[cards array] objectAtIndex:0];
        }
    }
    
    return selectedCard;
}

-(void) selectCard:(TechCard*) card
{
    if ([card owner] == self)
    {
        selectedCard = card;
        
		[state postEvent:EVENT_CARD_SELECTED object:card];
    }
}

-(void) setBorrowingRegion:(Region*)region
{
	borrowingRegion = region;
}

-(Region*) borrowingRegion
{
	return borrowingRegion;
}

-(int) artifactCreditAvailable
{
	return artifactCreditAvailable;
}

-(void) setArtifactCreditAvailable:(int)val
{
	artifactCreditAvailable = val;
	[state postEvent:EVENT_ARTIFACT_CREDIT_CHANGED object:self];
}

-(int) artifactShufflesAvailable
{
	return artifactShufflesAvailable;
}

-(void) setArtifactShufflesAvailable:(int)val
{
	artifactShufflesAvailable = val;
	[state postEvent:EVENT_ARTIFACT_SHUFFLES_CHANGED object:self];
}

-(PlayerTechCardGroup*) cards
{
	return cards;
}

-(bool) canPurchaseCard:(TechCard*)card
{
	// If the player has credit available
	if ([self artifactCreditAvailable] >= 8)
	{
        // And if the card is in the tech pile...
        if ([[state techDisplayDeck] hasTechCard:card])
        {
            // And the player doesn't already own the card
            for (TechCard* c in [[self cards] array])
            {
                if (c.title == card.title)
                    return false;
            }
            
            // Then we can purchase the card
			return true;
		}
	}
    
    // If the player is choosing a discard w/ the Temporal Warper discard ability
    if ([self isChoosingDiscard])
    {
        // Then the player can choose the card if it's in the discard pile.
        if ([[state techDiscardDeck] hasTechCard:card])
        {
            return true;
        }
    }
	
	return false;
}

-(bool) canRaidCard:(TechCard*)card
{
    if (![[state currentPlayer] isRaiding])
        return false;
    
    if ([card owner] == nil)
        // TODO: Account for Space Crane
        return false;
    
    if ([card owner] == self)
        return false;
    
    if ([[[card owner] cards] hasCardOfType:[HolographicDecoy class]])
    {
        if ([card isKindOfClass:[HolographicDecoy class]])
            return true;
        else
            return false;
    }
    
    return true;
}

-(bool) canRaidMoreFuel
{
    if (![[state currentPlayer] isRaiding])
        return false;

    if (fuelToRaid >= fuel)
        return false;
    
    if ([[self cards] hasCardOfType:[HolographicDecoy class]])
        return false;
    
    if ([[state currentPlayer] fuelRaidTotal] + [[state currentPlayer] oreRaidTotal] >= 4) // TODO: Change raid limit here
    {
        return false;
    }
    
    return true;
}

-(bool) canRaidMoreOre
{
    if (![[state currentPlayer] isRaiding])
        return false;

    if (oreToRaid >= ore)
        return false;
    
    if ([[self cards] hasCardOfType:[HolographicDecoy class]])
        return false;
    
    if ([[state currentPlayer] fuelRaidTotal] + [[state currentPlayer] oreRaidTotal] >= 4) // TODO: Change raid limit here
    {
        return false;
    }

    return true;
}


-(void) purchaseCard:(TechCard*) card
{
	// Confirm that we can afford a card at all
	if ([self canPurchaseCard:card])
	{
		// Confirm that the draw pile has this particular card
		if ([[state techDisplayDeck] hasTechCard:card])
		{
            [state clearUndoRedo]; // Once we've seen what the next card is going to be, we can't undo past that point.
            
            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Purchased tech %@", @"Purchased tech card"),
                            [self playerName], 
                            [[card title] capitalizedString] ]];
            
			[[state techDisplayDeck] removeCard:card];
			card.owner = self;
			[[self cards] pushCard:card];
		

			[state fillTechDisplayPile];
			
			self.artifactShufflesAvailable = 0;
			self.artifactCreditAvailable = 0;

			[state postEvent:EVENT_ARTIFACT_CARDS_CHANGED object:self];
		}
        
        // Or that the discard deck has this particular card
		if ([[state techDiscardDeck] hasTechCard:card])
		{
            // [state clearUndoRedo]; // Because there is no discard ability here,
            
            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Recovered %@ from discard pile", @"Recovered discard tech"),
                            [self playerName],
                            [[card title] capitalizedString] ]];
            
			[[state techDiscardDeck] removeCard:card];
			card.owner = self;
			[[self cards] pushCard:card];
            
//			[state fillTechDisplayPile];
			
			self.isChoosingDiscard = false;
            
			[state postEvent:EVENT_ARTIFACT_CARDS_CHANGED object:self];
		}
	}
}

-(bool) canShuffleCards
{
	// If the player has credit available
	if ([self artifactShufflesAvailable] > 0)
	{
		// And if we have cards left in the view pile
		if ([[state techDisplayDeck] count] > 0)
		{
			return true;
		}
	}
	
	return false;
}

-(void) shuffleCards
{
	if ([self canShuffleCards])
	{
        // No going back from this point!
        [state clearUndoRedo];
        
        [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Cycled tech cards.  Discarded %@", @"Cycled the tech cards, listing the cards formerly displayed."), 
                        [self playerName],
                        [[state techDisplayDeck] title]
                        ]];
        
		for (TechCard* card in [[state techDisplayDeck] array])
		{
			[[state techDiscardDeck] pushCard:card];
			CCLOG(@"Discarding %@ from display deck", card);
		}
		
		[[state techDisplayDeck] clear];
		
		[state fillTechDisplayPile];
		
		self.artifactShufflesAvailable -= 1;
	}
}

-(int) techsDiscarded
{
	return techsDiscarded;
}

-(void) setTechsDiscarded:(int)val
{
	techsDiscarded = val;
}

-(void) startRaid
{
    isRaiding = true;
	[state postEvent:EVENT_BEGIN_RAID object:self];
}

-(bool) isRaiding
{
    return isRaiding;
}

-(bool) finishRaid
{
    if (isRaiding)
    {
        TechCard* card = cardToRaid;
        
        if (card != nil)
        {
            Player* oldOwner = [card owner];
            
            // TODO: Encapsulate this stuff in the Player or TechCard class
            [[[card owner] cards] removeCard:card];
            [card setOwner:self];
            [[self cards] pushCard:card];
            [state postEvent:EVENT_ARTIFACT_CARDS_CHANGED object:self];
            
            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Raided %@ from %@", @"Raided card from player"),
                            [self playerName],
                            [[card title] capitalizedString],
                            [oldOwner playerName]
                            ]];
        }
        else
        {
            for (Player* player in [state players]) {
                if (self != player)
                {
                    if (player.oreToRaid > 0 || player.fuelToRaid > 0)
                    {
                        ore += player.oreToRaid;
                        fuel += player.fuelToRaid;
                        player.ore -= player.oreToRaid;
                        player.fuel -= player.fuelToRaid;
                        
                        if (player.oreToRaid == 0)
                        {
                            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Raided %d fuel from %@", @"Raided only fuel from player"),
                                            [self playerName],
                                            [player fuelToRaid],
                                            [player playerName]
                                            ]];
                        } else if (player.fuelToRaid == 0)
                        {
                            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Raided %d ore from %@", @"Raided only ore from player"),
                                            [self playerName],
                                            [player oreToRaid],
                                            [player playerName]
                                            ]];
                        }
                        else {
                            [state logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Raided %d fuel and %d ore from %@", @"Raided ore + fuel from player"),
                                            [self playerName],
                                            [player fuelToRaid],
                                            [player oreToRaid],
                                            [player playerName]
                                            ]];
                        }
                        
                        player.oreToRaid = 0;
                        player.fuelToRaid = 0;
                    }
                }
            }
            
            [state postEvent:EVENT_RESOURCES_CHANGED object:self];
        }
        isRaiding = false;
        [state postEvent:EVENT_FINISH_RAID object:self];
        return true;
    }
    else
    {
        NSLog(@"ERROR: We're not raiding, so we cannot complete a raid!");
    }
    
    return false;
}

// The following are variables used by the GUI to help know what has been selected, and in what order.

-(int) fuelToRaid
{
	return fuelToRaid;
}

-(void) setFuelToRaid:(int)val
{
    bool changed = (fuelToRaid != val);
    
	fuelToRaid = val;
    
    if (changed)
        [state postEvent:EVENT_RESOURCES_CHANGED object:self];
}

-(int) oreToRaid
{
	return oreToRaid;
}

-(void) setOreToRaid:(int)val
{
    bool changed = (oreToRaid != val);
    
	oreToRaid = val;

    if (changed)
        [state postEvent:EVENT_RESOURCES_CHANGED object:self];
}

-(TechCard*) cardToRaid
{
    return cardToRaid;
}

-(void) setCardToRaid:(TechCard *)card
{
    cardToRaid = card;
    
    if (card != nil)
    {
        for (Player* p in [state players])
        {
            [p setFuelToRaid:0];
            [p setOreToRaid:0];
        }
    }
    
    [state postEvent:EVENT_RESOURCES_CHANGED object:self];    
}

-(int) oreRaidTotal
{
    int retVal = 0;
    for (Player* player in [state players])
    {
        retVal += player.oreToRaid;
    }
    
    return retVal;
}

-(int) fuelRaidTotal
{
    int retVal = 0;
    for (Player* player in [state players])
    {
        retVal += player.fuelToRaid;
    }
    
    return retVal;
}

-(PlayerAIType) aiType
{
    return aiType;
}

-(void) setAiType:(PlayerAIType) val
{
    aiType = val;
}

-(BOOL) isLocalHuman
{
//    CCLOG(@"State match ID is '%@'", [state gcMatchID]);
    if ([state isGCMatch])
    {
        if (aiType == AI_TYPE_HUMAN)
        {
            return ((aiType == AI_TYPE_HUMAN)
                    && (gcPlayerID != nil)
                    && (![gcPlayerID isEqualToString:@""])
                    && ([gcPlayerID isEqualToString:[[GCTurnBasedMatchHelper sharedInstance] localPlayerID]])
                    );
            
        }
        return false;
    }
    
    return (aiType == AI_TYPE_HUMAN);
}

-(BOOL) isAI
{
    return (aiType != AI_TYPE_HUMAN);
}

-(id) cloneWithState:(GameState*)newState
{
    Player *copy = [[Player alloc] init]; 
	copy->state = newState;
	
    copy->fuel = fuel;
	copy->ore = ore;
	
	copy->activeShips = [[ShipGroup alloc] init];
	copy->inactiveShips = [[ShipGroup alloc] init];
	copy->allShips = [[ShipGroup alloc] init];
    
    Ship *ship, *shipCopy;
    for (ship in [activeShips array]) {
        if ([ship isArtifactShip])
        {
            shipCopy = [newState artifactShip];
            [shipCopy setPlayer:copy];
        }
        else
        {
            shipCopy = [ship cloneWithState:newState player:copy];
        }
        [copy->activeShips push:shipCopy];
        [copy->allShips push:shipCopy];
    }
    for (ship in [inactiveShips array]) {
        shipCopy = [ship cloneWithState:newState player:copy];
        [copy->inactiveShips push:shipCopy];
        [copy->allShips push:shipCopy];
    }

	// We don't fill our own card group
	copy->cards = [[PlayerTechCardGroup alloc] initWithPlayer:copy];

	// regions were already initialized.
	int i = 0;
	for (Region* region in [state regions]) {
		if (region == borrowingRegion) {
			copy->borrowingRegion = [[newState regions] objectAtIndex:i];
			break;
		}
		i++;
	}

	copy->colorIndex = colorIndex;
	
	copy->marketPrice = marketPrice;
	copy->index = index;
	
	copy->coloniesLeft = coloniesLeft;
	
	copy->coloniesToLaunch = coloniesToLaunch;
	
	copy->techsDiscarded = techsDiscarded;
	
	copy->artifactCreditAvailable = artifactCreditAvailable;
	copy->artifactShufflesAvailable = artifactShufflesAvailable;
	
	copy->initialRollDone = initialRollDone;
	
	copy->oreToRaid = oreToRaid;
	copy->fuelToRaid = fuelToRaid;
	
    copy->aiType = aiType;
    copy->isRaiding = isRaiding;
    
    copy->_isChoosingDiscard = _isChoosingDiscard;
    copy->_isDraftingTech = _isDraftingTech;
    
    copy->gcPlayerID = gcPlayerID;

	return copy;
}

@end
