//
//  GameState.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "GameState.h"

#import "SolarConverter.h"
#import "Shipyard.h"
#import "MaintenanceBay.h"
#import "ColonistHub.h"
#import "ColonyConstructor.h"
#import "LunarMine.h"
#import "RaidersOutpost.h"
#import "AlienArtifact.h"
#import "OrbitalMarket.h"
#import "TerraformingStation.h"

#import "TechCard.h"
#import "TechCardGroup.h"
#import "PlayerTechCardGroup.h"
#import "AlienCity.h"
#import "AlienMonument.h"
#import "BoosterPod.h"
#import "DataCrystal.h"
#import "PlasmaCannon.h"
#import "ResourceCache.h"
#import "StasisBeam.h"
#import "GravityManipulator.h"
#import "TemporalWarper.h"
#import "PolarityDevice.h"
#import "OrbitalTeleporter.h"
#import "HolographicDecoy.h"

#import "HeinleinPlains.h"
#import "PohlFoothills.h"
#import "BradburyPlateau.h"
#import "AsimovCrater.h"
#import "HerbertValley.h"
#import "LemBadlands.h"
#import "BurroughsDesert.h"
#import "VanVogtMountains.h"

#import "ShipGroup.h"

#import "NSData+CocoaDevUsersAdditions.h"


#undef CLONE_DEBUG

@implementation GameState


// Semi-Singleton
static GameState* gameStateInstance;

@synthesize soundEventQueue;
@synthesize gcMatchID;

+(GameState*) sharedGameState
{
	NSAssert(gameStateInstance != nil, @"GameState not available!");
	return gameStateInstance;
}

+(void) setActiveState:(GameState*)nextState
{
	NSAssert(nextState != nil, @"Cannot activate a nil state!");
	
    GameState* oldState = gameStateInstance;
    
    
    gameStateInstance = nil; // Try to trigger some sort of dealloc?
    
	gameStateInstance = nextState;

    if (oldState != nil) 
	{
        oldState = nil;
		//[oldState release];
	}
    
	[nextState postEvent:EVENT_STATE_RELOAD object:nextState];
    
    for (Player* player in [nextState players])
    {
        // If the player is in the middle of launching or raiding, then notify those events.
        if ([player isLocalHuman])
        {
            if ([player numColoniesToLaunch] > 0)
            {
                [nextState postEvent:EVENT_LAUNCH_COLONY object:player];
                break;
            }
            else if ([player isRaiding])
            {
                [nextState postEvent:EVENT_BEGIN_RAID object:player];
            }
        }
        
    }
}

+(GameState*) restoreFromState:(NSData*) data
{
	NSKeyedUnarchiver *unarchiver;
	// interpret string of XML contents as ISO-8859-1 (NSISOLatin1StringEncoding)
	//NSData *data = [xmlString dataUsingEncoding:NSISOLatin1StringEncoding];

	NSData* inflatedData = [data zlibInflate];
	
	CCLOG(@"Restoring a state of %d compressed bytes (inflated to %d bytes)", [data length], [inflatedData length]);
	
	unarchiver = [[NSKeyedUnarchiver alloc] initForReadingWithData:inflatedData];
	
	// Check version
	int version = [unarchiver decodeIntForKey:@"version"];
	// TODO: Handle failed version properly
	if(version != SAVE_STATE_VERSION) return nil;
	
	// Decode
	GameState* nextState = [unarchiver decodeObjectForKey:@"game"];
	
	// Cleanup
	[unarchiver finishDecoding];
	
	return nextState;
}

+(void) saveGameStateToPrefs:(NSData*) data
{
    CCLOG(@"Game saved to prefs.");
    NSUserDefaults *standardUserDefaults = [NSUserDefaults standardUserDefaults];
	
    if (data && standardUserDefaults) {
        [standardUserDefaults setObject:data forKey:@"CompressedGameState"];
        [standardUserDefaults synchronize];
    }
}

+(NSData*) loadGameStateFromPrefs
{
    CCLOG(@"Game loaded from prefs.");
    NSMutableData *data = nil;
    NSUserDefaults *standardUserDefaults = [NSUserDefaults standardUserDefaults];
    
    if (standardUserDefaults) {
        data = [standardUserDefaults objectForKey:@"CompressedGameState"];
    }
	    
    return data;
}

+(void) clearGameStateFromPrefs
{
    NSUserDefaults *standardUserDefaults = [NSUserDefaults standardUserDefaults];
    
    if (standardUserDefaults) {
        CCLOG(@"Game removed from prefs.");
//        [standardUserDefaults removeObjectForKey:@"GameState"];
        [standardUserDefaults removeObjectForKey:@"CompressedGameState"];
        [standardUserDefaults synchronize];
    }

}


- (GameState*) initWith:(int)numberOfPlayers p1:(int)player1Type p2:(int)player2Type p3:(int)player3Type p4:(int)player4Type
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	if ((self = [super init]))
    {
        suppressEvents = true;
        gcMatchID = nil;
        
//		NSAssert(gameStateInstance == nil, @"another GameState is already in use!");
//		gameStateInstance = self;
		
		players = [[NSMutableArray alloc] initWithCapacity:numberOfPlayers];
		
		for (int cnt = 0; cnt < numberOfPlayers; cnt++)
		{
			//CCLOG(@"Initializing player %d", cnt);
			Player* player = [[Player alloc] initWithState:self playerIndex:cnt colorIndex:cnt numPlayers:numberOfPlayers];
			
			//CCLOG(@"Adding %@ to Players list", player);
			[players addObject:player];
			
			//player.ore = player.ore;
			//player.fuel = player.fuel;
		}
        
        [((Player*) [players objectAtIndex:0]) setAiType:player1Type];
        [((Player*) [players objectAtIndex:1]) setAiType:player2Type];
        if (numberOfPlayers > 2)
            [((Player*) [players objectAtIndex:2]) setAiType:player3Type];
        if (numberOfPlayers > 3)
            [((Player*) [players objectAtIndex:3]) setAiType:player4Type];
		
		// Orbitals
		solarConverter		= (SolarConverter*)		 [[SolarConverter alloc] initWithState:self];
		shipyard			= (Shipyard*)			 [[Shipyard alloc] initWithState:self];
		maintenanceBay		= (MaintenanceBay*)		 [[MaintenanceBay alloc] initWithState:self];
		colonistHub			= (ColonistHub*)		 [[ColonistHub alloc] initWithState:self];
		colonyConstructor	= (ColonyConstructor*)	 [[ColonyConstructor alloc] initWithState:self];
		lunarMine			= (LunarMine*)			 [[LunarMine alloc] initWithState:self];
		raidersOutpost		= (RaidersOutpost*)		 [[RaidersOutpost alloc] initWithState:self];
		alienArtifact		= (AlienArtifact*)		 [[AlienArtifact alloc] initWithState:self];
		orbitalMarket		= (OrbitalMarket*)		 [[OrbitalMarket alloc] initWithState:self];
		terraformingStation = (TerraformingStation*) [[TerraformingStation alloc] initWithState:self];
		
        orbitals = [[NSArray alloc] initWithObjects:
			solarConverter,
			shipyard,
			maintenanceBay,
			colonistHub,
			colonyConstructor,
			lunarMine,
			raidersOutpost,
			alienArtifact,
			orbitalMarket,
			terraformingStation,
			nil
		];
        
		// Regions
		heinleinPlains 	= (HeinleinPlains*)		[[HeinleinPlains alloc] initWithState:self];
		pohlFoothills 	= (PohlFoothills*)		[[PohlFoothills alloc] initWithState:self];
		vanVogtMountains= (VanVogtMountains*)	[[VanVogtMountains alloc] initWithState:self];
		bradburyPlateau = (BradburyPlateau*)	[[BradburyPlateau alloc] initWithState:self];
		asimovCrater	= (AsimovCrater*)		[[AsimovCrater alloc] initWithState:self];
		herbertValley 	= (HerbertValley*)		[[HerbertValley alloc] initWithState:self];
		lemBadlands		= (LemBadlands*)		[[LemBadlands alloc] initWithState:self];
		burroughsDesert = (BurroughsDesert*)	[[BurroughsDesert alloc] initWithState:self];
		
		regions = [[NSArray alloc] initWithObjects:
			heinleinPlains,
			pohlFoothills,
			vanVogtMountains,
			bradburyPlateau,
			asimovCrater,
			herbertValley,
			lemBadlands,
			burroughsDesert,
			nil
		];
        
		[GameState setActiveState:self];
		
		// Tech cards
		techDrawDeck = [[TechCardGroup alloc] init];
		allTech		 = [[TechCardGroup alloc] init];
		TechCard* card;
		int cardID = 0;

		card = [[AlienCity alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];

		card = [[AlienMonument alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		
		card = [[BoosterPod alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		card = [[BoosterPod alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		
		card = [[PlasmaCannon alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		card = [[PlasmaCannon alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];

		card = [[ResourceCache alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		card = [[ResourceCache alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		
		card = [[StasisBeam alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		card = [[StasisBeam alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];

		card = [[GravityManipulator alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		card = [[GravityManipulator alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		/*
		card = [[TemporalWarper alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		card = [[TemporalWarper alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		*/
		card = [[PolarityDevice alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		card = [[PolarityDevice alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		
		card = [[DataCrystal alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		card = [[DataCrystal alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];

		card = [[OrbitalTeleporter alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		card = [[OrbitalTeleporter alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];

		card = [[HolographicDecoy alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		card = [[HolographicDecoy alloc] initTechWithState:self withID:cardID++];
		[techDrawDeck pushCard:card];
		
		for (card in [techDrawDeck array])
		{
			[allTech pushCard:card];
		}
		
#ifndef DETERMINISTIC
		[techDrawDeck shuffle];
#endif
        
		techDisplayDeck = [[TechCardGroup alloc] init];
		techDiscardDeck = [[TechCardGroup alloc] init];
		
		for (int cnt = 0; cnt < numberOfPlayers; cnt++)
		{
			Player* player = (Player*) [players objectAtIndex:cnt];
			
			[player activateStartingShips];
			
			// Deal every player a starting card
#ifndef DETERMINISTIC
            card = [techDrawDeck pop];
			[card setOwner:player];
			[[player cards] pushCard:card];
#else
            card = [techDrawDeck findCardOfType:[OrbitalTeleporter class]];
            [techDrawDeck removeCard:card];
			[card setOwner:player];
			[[player cards] pushCard:card];

            card = [techDrawDeck findCardOfType:[BoosterPod class]];
            [techDrawDeck removeCard:card];
			[card setOwner:player];
			[[player cards] pushCard:card];
		
            card = [techDrawDeck findCardOfType:[StasisBeam class]];
            [techDrawDeck removeCard:card];
			[card setOwner:player];
			[[player cards] pushCard:card];

            card = [techDrawDeck findCardOfType:[PolarityDevice class]];
            [techDrawDeck removeCard:card];
			[card setOwner:player];
			[[player cards] pushCard:card];
#endif
        }

		[self fillTechDisplayPile];
        
        artifactShip = [[Ship alloc] initWithPlayer:[players objectAtIndex:1] shipIndex:ARTIFACT_SHIP_INDEX];
        [artifactShip setPlayer:nil];
        
        // DEBUG CODE
        /*
        [burroughsDesert addColony:0];
        [[self playerByID:0] setFuel:5];
        [[self playerByID:0] setOre:5];
        [[self playerByID:0] purchaseArtifactShip];
         */
        // END DEBUG CODE
		
		[[self currentPlayer] gatherShips];
        
        gameLog = [NSMutableString stringWithFormat:NSLocalizedString(@"Began new %d player game", @"Start game message"), 
                   numberOfPlayers];
        
        suppressEvents = false;
	}
	return self;
}

// Return a copy of this current game state
- (GameState*) oldClone
{
	// The simplest way to clone the ENTIRE state is to serialize and deserialize in quick succession.
	// TODO: Optimize this for speed / memory usage?
//	return [[GameState restoreFromState:[self serialize]] retain];
    
//    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    
    // Initialize
    NSMutableData *data;
    NSKeyedArchiver *archiver;
    NSKeyedUnarchiver *unarchiver;
    
    data = [NSMutableData data];
    archiver = [[NSKeyedArchiver alloc] initForWritingWithMutableData:data];
    [archiver setOutputFormat:NSPropertyListBinaryFormat_v1_0];
    
    // Encode
    [archiver encodeInt:SAVE_STATE_VERSION forKey:@"version"];
//    CCLOG(@"Encoding game instance.");
    [archiver encodeObject:self forKey:@"game"];
    [archiver finishEncoding];
    
	unarchiver = [[NSKeyedUnarchiver alloc] initForReadingWithData:data];
	
	// Check version
	int version = [unarchiver decodeIntForKey:@"version"];
	// TODO: Handle failed version properly
	if(version != SAVE_STATE_VERSION) return nil;
	
	// Decode
	GameState* nextState = [unarchiver decodeObjectForKey:@"game"];
	
	// Cleanup
	[unarchiver finishDecoding];

	
	return nextState;    
}

-(void) dealloc
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// The game will be gone now, to avoid crashes on further access it needs to be nil.
	if (gameStateInstance == self)
        gameStateInstance = nil;
}

- (void)encodeWithCoder:(NSCoder *)encoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[encoder encodeObject:players				forKey:@"players"];		
	[encoder encodeInt:currentPlayerIndex		forKey:@"currentPlayerIndex"];
	[encoder encodeInt:numTurns                 forKey:@"numTurns"];
	[encoder encodeObject:solarConverter		forKey:@"solarConverter"];
	[encoder encodeObject:shipyard				forKey:@"shipyard"];		
	[encoder encodeObject:maintenanceBay		forKey:@"maintenanceBay"];		
	[encoder encodeObject:colonistHub			forKey:@"colonistHub"];		
	[encoder encodeObject:colonyConstructor		forKey:@"colonyConstructor"];		
	[encoder encodeObject:lunarMine				forKey:@"lunarMine"];		
	[encoder encodeObject:raidersOutpost		forKey:@"raidersOutpost"];		
	[encoder encodeObject:alienArtifact			forKey:@"alienArtifact"];		
	[encoder encodeObject:orbitalMarket			forKey:@"orbitalMarket"];		
	[encoder encodeObject:terraformingStation	forKey:@"terraformingStation"];		
	[encoder encodeObject:activeFacility		forKey:@"activeFacility"];	
	
	[encoder encodeObject:heinleinPlains 		forKey:@"heinleinPlains"];
	[encoder encodeObject:pohlFoothills 		forKey:@"pohlFoothills"];
	[encoder encodeObject:vanVogtMountains 		forKey:@"vanVogtMountains"];
	[encoder encodeObject:bradburyPlateau 		forKey:@"bradburyPlateau"];
	[encoder encodeObject:asimovCrater			forKey:@"asimovCrater"];
	[encoder encodeObject:herbertValley 		forKey:@"herbertValley"];
	[encoder encodeObject:lemBadlands			forKey:@"lemBadlands"];
	[encoder encodeObject:burroughsDesert 		forKey:@"burroughsDesert"];	
	
	[encoder encodeObject:techDrawDeck			forKey:@"techDrawDeck"];
	[encoder encodeObject:techDiscardDeck		forKey:@"techDiscardDeck"]; // CRASH x2
	[encoder encodeObject:techDisplayDeck		forKey:@"techDisplayDeck"]; // CRASH x2
	[encoder encodeObject:allTech				forKey:@"allTech"];
    
    [encoder encodeObject:artifactShip          forKey:@"artifactShip"];
	
    [encoder encodeInt:aiFlags                  forKey:@"aiFlags"];
    
    [encoder encodeObject:gameLog               forKey:@"gameLog"];
    [encoder encodeObject:lastMove              forKey:@"lastMove"];
    
	[encoder encodeObject:undoState forKey:@"undoState"];
	[encoder encodeObject:redoState forKey:@"redoState"];
    
    [encoder encodeObject:gcMatchID forKey:@"gcMatchID"];
}

-(id)initWithCoder:(NSCoder *)decoder
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
    {
		players				= [decoder decodeObjectForKey:@"players"];
		currentPlayerIndex	= [decoder decodeIntForKey:   @"currentPlayerIndex"];
        numTurns            = [decoder decodeIntForKey:   @"numTurns"];
		solarConverter		= [decoder decodeObjectForKey:@"solarConverter"];		
		shipyard			= [decoder decodeObjectForKey:@"shipyard"];
		maintenanceBay		= [decoder decodeObjectForKey:@"maintenanceBay"];		
		colonistHub			= [decoder decodeObjectForKey:@"colonistHub"];		
		colonyConstructor	= [decoder decodeObjectForKey:@"colonyConstructor"];		
		lunarMine			= [decoder decodeObjectForKey:@"lunarMine"];		
		raidersOutpost		= [decoder decodeObjectForKey:@"raidersOutpost"];		
		alienArtifact		= [decoder decodeObjectForKey:@"alienArtifact"];		
		orbitalMarket		= [decoder decodeObjectForKey:@"orbitalMarket"];		
		terraformingStation = [decoder decodeObjectForKey:@"terraformingStation"];		
		activeFacility		= [decoder decodeObjectForKey:@"activeFacility"];

        orbitals = [[NSArray alloc] initWithObjects:
			solarConverter,
			shipyard,
			maintenanceBay,
			colonistHub,
			colonyConstructor,
			lunarMine,
			raidersOutpost,
			alienArtifact,
			orbitalMarket,
			terraformingStation,
			nil
		];

		undoState			= [decoder decodeObjectForKey:@"undoState"];
		redoState			= [decoder decodeObjectForKey:@"redoState"];	
		
		heinleinPlains		= [decoder	decodeObjectForKey:@"heinleinPlains"];
		pohlFoothills		= [decoder	decodeObjectForKey:@"pohlFoothills"];
		vanVogtMountains	= [decoder	decodeObjectForKey:@"vanVogtMountains"];
		bradburyPlateau		= [decoder	decodeObjectForKey:@"bradburyPlateau"];
		asimovCrater		= [decoder	decodeObjectForKey:@"asimovCrater"];
		herbertValley		= [decoder	decodeObjectForKey:@"herbertValley"];
		lemBadlands			= [decoder	decodeObjectForKey:@"lemBadlands"];
		burroughsDesert		= [decoder	decodeObjectForKey:@"burroughsDesert"];	
		
		regions = [[NSArray alloc] initWithObjects:
			heinleinPlains,
			pohlFoothills,
			vanVogtMountains,
			bradburyPlateau,
			asimovCrater,
			herbertValley,
			lemBadlands,
			burroughsDesert,
			nil
		];
		 
		techDrawDeck		= [decoder decodeObjectForKey:@"techDrawDeck"];
		techDiscardDeck		= [decoder decodeObjectForKey:@"techDiscardDeck"];
		techDisplayDeck		= [decoder decodeObjectForKey:@"techDisplayDeck"];
		allTech				= [decoder decodeObjectForKey:@"allTech"];
		
        artifactShip        = [decoder decodeObjectForKey:@"artifactShip"];
        
        aiFlags             = [decoder decodeIntForKey:   @"aiFlags"];
        
        gameLog             = [decoder decodeObjectForKey:@"gameLog"];
        lastMove            = [decoder decodeObjectForKey:@"lastMove"];
        
        gcMatchID           = [decoder decodeObjectForKey:@"gcMatchID"];
        
//		CCLOG(@"State has dice: %d, %d, %d", [self shipByPlayer:0 shipID:0].value, [self shipByPlayer:0 shipID:1].value, [self shipByPlayer:0 shipID:2].value);
	}
	
	return self;
}

-(NSData *) serialize
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	// Initialize
	NSMutableData *data;
	NSKeyedArchiver *archiver;
	data = [NSMutableData data];
	archiver = [[NSKeyedArchiver alloc] initForWritingWithMutableData:data];
	[archiver setOutputFormat:NSPropertyListBinaryFormat_v1_0];
	
	// Encode
	[archiver encodeInt:SAVE_STATE_VERSION forKey:@"version"];
	CCLOG(@"Encoding game instance.");
	[archiver encodeObject:self forKey:@"game"];
	[archiver finishEncoding];
	
	//NSString* xmlString = [[NSString alloc] initWithData: data  encoding: NSUTF8StringEncoding];
	
		
	//CCLOG(@"Saving XML: %@", xmlString);
	
	NSData* compressed = [data zlibDeflate];
	
	CCLOG(@"Saving a state of %d bytes (deflated from %d bytes)", [compressed length], [data length]);
	
	
	return compressed;
}

-(void) createUndoPoint
{
	// Only create undo points if we're the main instance
	if (gameStateInstance == self)
	{
		undoState = [self serialize];
		
        //Save state to NSUserDefaults so we can return to this state if the app exits
        if (![self isGCMatch])
        {
            // Only save if this isn't a multiplayer game
            [GameState saveGameStateToPrefs:undoState];
        }
        
		// Once we can create an "undo", then our redo goes away.
		redoState = nil;
		
		[self postEvent:EVENT_UNDO_CHANGED object:self];
	}
}

-(void) clearUndoRedo
{
	undoState = nil;
	
	redoState = nil;
	
	[self postEvent:EVENT_UNDO_CHANGED object:self];
}


-(void) undo
{
	if (undoState != nil)
	{
		// Save our current state so that we can restore here when/if we redo
		NSData* currentState = [self serialize];
		
		// Build our previous state
		GameState* nextState = [GameState restoreFromState:undoState];
		
		// Store our current state in the previous state for potential redoing
		[nextState setRedoState:currentState];
		
		// Activate the old state
		[GameState setActiveState:nextState];

		[nextState postEvent:EVENT_UNDO_CHANGED object:nextState];
	}
	
}

-(void) redo
{
	if (redoState != nil)
	{
		// Build our new state
		GameState* nextState = [GameState restoreFromState:redoState];
		
		// Activate the new old state
		[GameState setActiveState:nextState];
		
		[nextState postEvent:EVENT_UNDO_CHANGED object:nextState];
	}
}

-(bool) canUndo
{
	return (undoState != nil);
}

-(bool) canRedo
{
	return (redoState != nil);
}

-(void) setRedoState:(NSData*)data
{
	redoState = data;
}


-(bool) isDefault
{
	return (self == gameStateInstance);
}

-(void) postEvent:(NSString*)event object:(id)obj
{
	// Only post events if we're the default state
    if (suppressEvents)
        return;
    
	if ([self isDefault])
	{
        if (![NSThread isMainThread])
        {
            // Make sure that we're on the main thread
            dispatch_async(dispatch_get_main_queue(), ^{
                [self postEvent:event object:obj];
            });
        }
        else
        {
            CCLOG(@"EVENT: %@ by (%@)", event, obj);
            [[NSNotificationCenter defaultCenter]
             postNotificationName:event
             object:obj ];
        }
	}
    else
    {
        // If the state is not the currently active state, then we need to save these event notifications so that they can be used to fire off sounds after the state is loaded.
        if (soundEventQueue == nil)
        {
            soundEventQueue = [[NSMutableArray alloc] initWithCapacity:16];
        }
        
        [soundEventQueue addObject:event];
    }
    
#ifdef CLONE_DEBUG
    if (![self checkReferences])
        CCLOG(@"I hate Illinois Nazis.");
#endif
}

-(void) fillTechDisplayPile
{
    TechCardGroup* addedGroup = [[TechCardGroup alloc] init];
    
	while ([techDisplayDeck count] < 3)
	{
		// If we are out of cards, then refill cards from the discard deck
		if ([techDrawDeck count] == 0)
		{
			TechCardGroup* emptyDrawDeck = techDrawDeck;
			techDrawDeck = techDiscardDeck;
			techDiscardDeck = emptyDrawDeck;
            
#ifndef DETERMINISTIC            
			[techDrawDeck shuffle];
#endif
            
			CCLOG(@"Empty draw deck -- shuffling back in the discard deck.");
            
            [self logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Draw deck emptied, shuffling in the discard deck.", @"Reshuffle discards"),
                           [[self currentPlayer] playerName]
                           ]];
		}
		
		// However, if the discard deck was also empty, then give up.
		if ([techDrawDeck count] == 0)
			break;
		
		// Otherwise, draw a card and place it in the display deck.
		TechCard* card = [techDrawDeck pop];

		//CCLOG(@"Drawing %@ and placing it in the display deck", card);
		
		[techDisplayDeck pushCard:card];
        [addedGroup pushCard:card];
	}
    
    if ([addedGroup count] > 0)
    {
        [self logMove:[NSString stringWithFormat:NSLocalizedString(@"%@: Filled tech display with %@", @"Added cards to display deck."),
                       [[self currentPlayer] playerName],
                       [addedGroup title]
                       ]];
    }

	[self postEvent:EVENT_ARTIFACT_CARDS_CHANGED object:self];
}

-(TechCardGroup*) techDisplayDeck
{
	return techDisplayDeck;
}

-(TechCardGroup*) techDrawDeck
{
	return techDrawDeck;
}

-(TechCardGroup*) techDiscardDeck
{
	return techDiscardDeck;
}

-(TechCardGroup*) allTech
{
    return allTech;
}

-(int) numPlayers
{
	return [players count];
}

-(Player*) currentPlayer
{
	return [players objectAtIndex:currentPlayerIndex];
}

-(NSArray*) players
{
	return players;
}

-(int) numTurns
{
    return numTurns;
}

-(void) gotoNextPlayer
{
	// Clean up from the previous turn
	[[self currentPlayer] endTurnCleanup];
	
    int nextPlayerIndex = (currentPlayerIndex + 1) % [self numPlayers];
	
    if (nextPlayerIndex < currentPlayerIndex)
    {
        numTurns++;
        [self postEvent:EVENT_NEXT_TURN  object:self];
    }
    
    currentPlayerIndex = nextPlayerIndex;
	
	// If there are any ships left in the current player's hand, move them to the maintenance bay.
//	for (Ship* ship in [[self currentPlayer] undockedShips].array)
//	{
//		[ship moveToMaintBay];
//	}
	
	[[self currentPlayer] gatherShips];

	[self postEvent:EVENT_NEXT_PLAYER  object:self];
    
    // HACK
}

-(Player*) playerByID:(int)playerID
{
	if (playerID == -1)
		return [self currentPlayer];
   
    Player* retVal = [players objectAtIndex:playerID];
    
    if ([retVal playerIndex] == playerID)
        return retVal;
    
    for (Player* player in players) {
        if ([player playerIndex] == playerID)
        {
            retVal = player;
            break;  
        }
    }
	return retVal;;
}

-(Ship*) shipByPlayer:(int)playerID shipID:(int)shipID
{
	Player* player = [self playerByID:playerID];
	
	return [player shipByID:shipID];
}

-(Shipyard*) shipyard
{
	return shipyard;
}

-(SolarConverter*) solarConverter
{
	return solarConverter;
}

-(MaintenanceBay*)		maintenanceBay;
{
	return maintenanceBay;
}

-(ColonistHub*)			colonistHub;
{
	return colonistHub;
}

-(ColonyConstructor*)	colonyConstructor;
{
	return colonyConstructor;
}

-(LunarMine*)			lunarMine;
{
	return lunarMine;
}

-(RaidersOutpost*)		raidersOutpost;
{
	return raidersOutpost;
}

-(AlienArtifact*)		alienArtifact;
{
	return alienArtifact;
}

-(OrbitalMarket*)		orbitalMarket;
{
	return orbitalMarket;
}

-(TerraformingStation*) terraformingStation
{
	return terraformingStation;	
}

-(Orbital*) selectedFacility
{
	return activeFacility;
}

-(void) setSelectedFacility:(Orbital *)facility
{
	activeFacility = facility;
}


-(HeinleinPlains*) heinleinPlains
{
	return heinleinPlains;
}
-(PohlFoothills*) pohlFoothills
{
	return pohlFoothills;
}
-(VanVogtMountains*) vanVogtMountains
{
	return vanVogtMountains;
}
-(BradburyPlateau*) bradburyPlateau
{
	return bradburyPlateau;
}
-(AsimovCrater*) asimovCrater
{
	return asimovCrater;
}
-(HerbertValley*) herbertValley
{
	return herbertValley;
}
-(LemBadlands*) lemBadlands
{
	return lemBadlands;
}
-(BurroughsDesert*) burroughsDesert
{
	return burroughsDesert;
}

-(NSArray*) orbitals
{
    return orbitals;
}

-(NSArray*) regions
{
	return regions;
}

-(bool) checkGameOver
{
	if ([self gameIsOver])
	{
        if ([GameState sharedGameState] == self)
        {
            [self postEvent:EVENT_GAME_OVER object:self];
            return true;
        }
	}
    return false;
}

-(bool) gameIsOver
{
	for (Player* player in players)
	{
		if (([player coloniesLeft] == 0) && ([player numColoniesToLaunch] == 0))
		{
			return true;
		}
	}
	
	return false;
}


// Returns the player who is currently winning the game.
// If there are multiple players tied, 
-(Player*) winningPlayer
{
    Player* winningPlayer = nil;
    
    int winningScore = 0;
    int score = 0;
    
    for (Player* player in players)
    {
        score = [player score];
        // The score property (as opposed to vp's) takes care of breaking ties
        if (score > winningScore)
        {
            winningScore = score;
            winningPlayer = player;
        }
        else if (score == winningScore)
        {
            // In the event of an extremely persistent tie, then nobody is winning (?)
            winningScore = score;
            winningPlayer = nil;
        }
    }
    
    return winningPlayer;
}

// Returns an array of all players, sorted from highest score to least.
-(NSArray*) winningPlayers
{
    int numPlayers = [self numPlayers];
    
    float scores[numPlayers];
    
    for (int cnt = 0; cnt < numPlayers; cnt++)
    {
        scores[cnt] = [[self playerByID:cnt] score];
    }
    
    NSMutableArray* retVal = [[NSMutableArray alloc] initWithCapacity:numPlayers];
    [retVal addObject:[self playerByID:0]];
    
    for (int cnt = 1; cnt < numPlayers; cnt++)
    {
        int subCnt = 0;
        
        for (subCnt = 0; subCnt < [retVal count]; subCnt++)
        {
            if (scores[cnt] > scores[[((Player*)[retVal objectAtIndex:subCnt]) playerIndex]])
            {
                break;
            }
        }
        [retVal insertObject:[self playerByID:cnt] atIndex:subCnt];
    }
    
    return retVal;
}

-(Ship*) artifactShip
{
    return artifactShip;
}

-(NSMutableArray*) childStates
{
    return childStates;
}

-(void) setChildStates:(NSMutableArray*)value
{
    childStates = value;
}

-(bool) childrenFilled
{
    return childrenFilled;
}

-(bool) childrenFilling
{
    return childrenFilling;
}

-(void) setChildrenFilled:(bool) val
{
    childrenFilled = val;
}

-(void) setChildrenFilling:(bool) val
{
    childrenFilling = val;
}

-(int) numChildren
{
    int total = 1;
    
    for (GameState* child in childStates) {
        total += [child numChildren];
    }
    
    return total;
}

-(void) clearChildren
{
    for (GameState* child in childStates) {
        [child clearChildren];
        
        
//        if ([child retainCount] == 0)
            [childStates removeObject:child];
    }
    
    childrenFilled = false;
}

-(int) aiFlags
{
    return aiFlags;
}

-(void) setAiFlags:(int)val
{
    aiFlags = val;
}

-(NSString*) lastMove
{
    return lastMove;
}

-(void) setLastMove:(NSString *)val
{
    [lastMove setString:val];
}

-(void) logMove:(NSString*) move
{
    [gameLog appendString:@"\n"];
    [gameLog appendString:move];
    [self setLastMove:move];
    
    [self postEvent:EVENT_LOG_ENTRY object:self];
}

-(NSString*) gameLog
{
    return gameLog;
}

-(id) clone
{
    return [self newClone];
}

- (id) newClone
{
//    return [self oldClone];
    
    GameState *copy = [[[self class] alloc] init];

    copy->gcMatchID = gcMatchID;
    
    copy->childStates = [[NSMutableArray alloc] init];
    
    copy->childrenFilling = false;
    copy->childrenFilled = false;
    
    copy->lastMove = [NSMutableString stringWithString:(lastMove != nil) ? lastMove : @""];
    copy->gameLog = [NSMutableString stringWithString:(gameLog != nil) ? gameLog : @""];
    
	copy->currentPlayerIndex = currentPlayerIndex;
	copy->numTurns = numTurns;
	
    // Unused
//	NSData* undoState = nil;
//	NSData* redoState = nil;
     
    copy->aiFlags = aiFlags;
    
	// Orbitals
	copy->solarConverter = [solarConverter cloneWithState:copy];
	copy->shipyard = [shipyard cloneWithState:copy];
	copy->maintenanceBay = [maintenanceBay cloneWithState:copy];
	copy->colonistHub = [colonistHub cloneWithState:copy];
	copy->colonyConstructor = [colonyConstructor cloneWithState:copy];
	copy->lunarMine = [lunarMine cloneWithState:copy];
	copy->raidersOutpost = [raidersOutpost cloneWithState:copy];
	copy->alienArtifact = [alienArtifact cloneWithState:copy];
	copy->orbitalMarket = [orbitalMarket cloneWithState:copy];
	copy->terraformingStation = [terraformingStation cloneWithState:copy];
	copy->activeFacility = nil;

	copy->orbitals = [[NSArray alloc] initWithObjects:
		copy->solarConverter,
		copy->shipyard,
		copy->maintenanceBay,
		copy->colonistHub,
		copy->colonyConstructor,
		copy->lunarMine,
		copy->raidersOutpost,
		copy->alienArtifact,
		copy->orbitalMarket,
		copy->terraformingStation,
		nil
	];
	
	// Regions
	copy->heinleinPlains = [heinleinPlains cloneWithState:copy];
	copy->pohlFoothills = [pohlFoothills cloneWithState:copy];
	copy->vanVogtMountains = [vanVogtMountains cloneWithState:copy];
	copy->bradburyPlateau = [bradburyPlateau cloneWithState:copy];
	copy->asimovCrater = [asimovCrater cloneWithState:copy];
	copy->herbertValley = [herbertValley cloneWithState:copy];
	copy->lemBadlands = [lemBadlands cloneWithState:copy];
	copy->burroughsDesert = [burroughsDesert cloneWithState:copy];
	
	copy->regions = [[NSArray alloc] initWithObjects:
		copy->heinleinPlains,
		copy->pohlFoothills,
		copy->vanVogtMountains,
		copy->bradburyPlateau,
		copy->asimovCrater,
		copy->herbertValley,
		copy->lemBadlands,
		copy->burroughsDesert,
		nil
	];
    
    copy->allTech = [[TechCardGroup alloc] init];
	copy->techDrawDeck = [[TechCardGroup alloc] init];
	copy->techDiscardDeck = [[TechCardGroup alloc] init];
	copy->techDisplayDeck = [[TechCardGroup alloc] init];
	
    TechCard *card, *cardCopy;
    Player *player, *playerCopy;
    
    copy->artifactShip = [artifactShip cloneWithState:copy player:nil];

    copy->players = [[NSMutableArray alloc] initWithCapacity:[players count]];

    if (copy->artifactShip == nil)  // If the artifact ship hasn't already been created by one of the players... 
        copy->artifactShip = [artifactShip cloneWithState:copy player:nil];

    for (player in players) {
        playerCopy = [player cloneWithState:copy];

        [copy->players addObject:playerCopy];
       
        for (card in [[player cards] array]) {
            cardCopy = [card cloneWithState:copy];
            [[playerCopy cards] pushCard:cardCopy];
            if ([[copy->allTech array] containsObject:cardCopy])
                CCLOG(@"ERROR: All tech already contains card %@", cardCopy);
            [copy->allTech pushCard:cardCopy];
        }
#ifdef CLONE_DEBUG
        NSAssert([[playerCopy cards] count] == [[player cards] count], @"Player cards deck does not have the same number of cards!");
#endif
        
        [playerCopy selectCard:[copy corresponding:[player selectedCard]]];
    }
    
//    if ([artifactShip player] != nil)
//        copy->artifactShip = [artifactShip cloneWithState:copy player:nil];
//    else
//        copy->artifactShip = [artifactShip cloneWithState:copy player:[copy playerByID:[artifactShip playerID]]];
//        copy->artifactShip = [copy shipByPlayer:[artifactShip playerID] shipID:[artifactShip shipID]];
    
    /*
    for (Orbital *orbital in [copy orbitals]) {
        [orbital clonePass2WithCopy:copy];
    }
     */
    
    for (card in [techDrawDeck array]) {
        cardCopy = [card cloneWithState:copy];
#ifdef CLONE_DEBUG
        if ([[copy->allTech array] containsObject:cardCopy])
            CCLOG(@"ERROR: All tech already contains card %@", cardCopy);
#endif
        [copy->allTech pushCard:cardCopy];
        [copy->techDrawDeck pushCard:cardCopy];
    }
#ifdef CLONE_DEBUG
    NSAssert([copy->techDrawDeck count] == [self->techDrawDeck count], @"techDrawDeck deck does not have the same number of cards!");    
#endif
        
    for (card in [techDiscardDeck array]) { // CRASH
        cardCopy = [card cloneWithState:copy];
#ifdef CLONE_DEBUG
        if ([[copy->allTech array] containsObject:cardCopy])
            CCLOG(@"ERROR: All tech already contains card %@", cardCopy);
#endif
        [copy->allTech pushCard:cardCopy];
        [copy->techDiscardDeck pushCard:cardCopy];
    }
#ifdef CLONE_DEBUG
    NSAssert([copy->techDiscardDeck count] == [self->techDiscardDeck count], @"techDiscardDeck deck does not have the same number of cards!");
#endif
    
    for (card in [techDisplayDeck array]) {
        cardCopy = [card cloneWithState:copy];
#ifdef CLONE_DEBUG
        if ([[copy->allTech array] containsObject:cardCopy])
            CCLOG(@"ERROR: All tech already contains card %@", cardCopy);
#endif
        [copy->allTech pushCard:cardCopy];
        [copy->techDisplayDeck pushCard:cardCopy];
    }
#ifdef CLONE_DEBUG
    NSAssert([copy->techDisplayDeck count] == [self->techDisplayDeck count], @"techDisplayDeck deck does not have the same number of cards!");
#endif
    
#ifdef CLONE_DEBUG
    if ([copy->allTech count] != [[self allTech] count])
    {
        CCLOG(@"Wrong number of tech cards copied!  Expected %d, got %d!", [[self allTech] count], [copy->allTech count]);
        
        for (card in [self->allTech array])
        {
            CCLOG(@"allTech: %@", card);
            
            cardCopy = [copy corresponding:card];
            if (cardCopy == nil)
            {
                CCLOG(@"Unable to find card %@", cardCopy);
            }
            
            if (![[copy->allTech array] containsObject:cardCopy])
            {
                CCLOG(@"Card %@ is not found in copy", cardCopy);
            }
        }
        
        CCLOG(@"Our cards:");
        [self dumpCards];

        CCLOG(@"Copy cards:");
        [copy dumpCards];

        NSAssert([copy->allTech count] == [[self allTech] count], @"Wrong number of tech cards copied!"); 
    }
    
    // TEST CODE
    if (![copy checkReferences])
        CCLOG(@"I hate Illinois Nazis.");
#endif
    
   	return copy;
}

-(void) dumpCards
{
    TechCard* card;
    Player* player;
    
    CCLOG(@"DRAW DECK:");
    for (card in [techDrawDeck array]) {
        CCLOG(@" %@", card);
    }
    CCLOG(@"DISPLAY DECK:");
    for (card in [techDisplayDeck array]) {
        CCLOG(@" %@", card);
    }
    CCLOG(@"DISCARD DECK:");
    for (card in [techDiscardDeck array]) {
        CCLOG(@" %@", card);
    }
    
    for (player in [self players])
    {
        CCLOG(@"PLAYER %@:", player);
        for (card in [[player cards] array])
        {
            CCLOG(@" %@", card);
        }
    }
}

// Given an object that relates to a different GameState object, this method returns the corresponding object for this GameState.
-(id) corresponding:(id)other
{
    if (other == nil)
    {
        return nil;
    }
    if ([other isKindOfClass:[Ship class]])
    {
        Ship* otherShip = (Ship*) other;
        
        if (otherShip != nil)
        {
            if ([otherShip isArtifactShip])
                return [self artifactShip];
            else
                return [self shipByPlayer:[otherShip playerID] shipID:[otherShip shipID]];
        }
    }
    if ([other isKindOfClass:[Player class]])
    {
        Player* otherPlayer = (Player*) other;
        
        if (otherPlayer != nil)
        {
            return [self playerByID:[otherPlayer playerIndex]];
        }
    }
    if ([other isKindOfClass:[DockingBay class]])
    {
        DockingBay* otherDock = (DockingBay*) other;
        
        if (otherDock != nil)
        {
            Orbital* correspondingOrbital = (Orbital*) [self corresponding:[otherDock orbital]];
            
            return [correspondingOrbital dockByIndex:[otherDock index]];
        }
    }
    if ([other isKindOfClass:[TechCard class]])
    {
        TechCard* otherTech = (TechCard*)other;
        
        if (otherTech != nil)
        {
            return [allTech cardByID:[other cardID]];
        }
    }
    if ([other isKindOfClass:[Orbital class]])
    {
        // TODO: Speed up by removing the foreach and checking for class direction in an if/else chain?
        for (Orbital* myOrbital in orbitals) 
        {
            if ([other isKindOfClass:[myOrbital class]])
            {
                return myOrbital;
            }
        }
    }
    if ([other isKindOfClass:[Region class]])
    {
        // TODO: Speed up by removing the foreach and checking for class direction in an if/else chain?
        for (Region* myRegion in regions) 
        {
            if ([other isKindOfClass:[myRegion class]])
            {
                return myRegion;
            }
        }
    }
    if ([other isKindOfClass:[ShipGroup class]])
    {
        ShipGroup* otherGroup = (ShipGroup*) other;
        ShipGroup* retVal = [[ShipGroup alloc] init];
        
        for (Ship* ship in [otherGroup array])
        {
            [retVal push:[self corresponding:ship]];
        }
        
        return retVal;
    }
    
    CCLOG(@"ERROR: Could not find a corresponding object for %@ in %@", other, self);
    return nil;
}

-(bool) checkReferences
{
#ifdef CLONE_DEBUG
    for (Orbital* orbital in orbitals)
    {
        if ([orbital state] != self)
        {
            CCLOG(@"Orbital %@ is pointing to state %@, should be %@", orbital, [orbital state], self);
            return false;
        }
    }
    
    for (Player* player in players) {
        if ([player state] != self)
        {
            CCLOG(@"Player %@ is pointing to state %@, should be %@", player, [player state], self);
            return false;
        }
        
        for (TechCard* card in [[player cards] array]) {
            if ([card state] != self)
            {
                CCLOG(@"Card %@ is pointing to state %@, should be %@", card, [card state], self);
                return false;
            }
            if ([card owner] != player)
            {
                CCLOG(@"Card %@ is pointing to player %@, should be %@", card, [card owner], player);
                return false;
            }
        }
    }    
    
    for (TechCard* card in [[self techDrawDeck] array]) {
        if ([card state] != self)
        {
            CCLOG(@"Card %@ is pointing to state %@, should be %@", card, [card state], self);
            return false;
        }
        if ([card owner] != nil)
        {
            CCLOG(@"Card %@ is pointing to player %@, should be nil", card, [card owner]);
            return false;
        }
    }
    
    for (TechCard* card in [[self techDisplayDeck] array]) {
        if ([card state] != self)
        {
            CCLOG(@"Card %@ is pointing to state %@, should be %@", card, [card state], self);
            return false;
        }
        if ([card owner] != nil)
        {
            CCLOG(@"Card %@ is pointing to player %@, should be nil", card, [card owner]);
            return false;
        }
    }

    for (TechCard* card in [[self techDiscardDeck] array]) {
        if ([card state] != self)
        {
            CCLOG(@"Card %@ is pointing to state %@, should be %@", card, [card state], self);
            return false;
        }
        if ([card owner] != nil)
        {
            CCLOG(@"Card %@ is pointing to player %@, should be nil", card, [card owner]);
            return false;
        }
    }
#endif
    
    return true;
}

-(bool) isGCMatch
{
    if (gcMatchID == nil || [gcMatchID isEqualToString:@""])
    {
        return false;
    }
    
    return true;
}

@end

