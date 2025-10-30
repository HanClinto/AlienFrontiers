//
//  GameState.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "Player.h"
#import "GameEvents.h"
#import "Orbital.h"
#import "Region.h"
#import "TechCardGroup.h"
#import "PlayerTechCardGroup.h"

#import "TestFlight.h"

@class Shipyard;
@class SolarConverter;
@class ShipGroup;
@class MaintenanceBay;
@class ColonistHub;
@class ColonyConstructor;
@class LunarMine;
@class RaidersOutpost;
@class AlienArtifact;
@class OrbitalMarket;
@class TerraformingStation;
@class Ship;

@class HeinleinPlains;
@class PohlFoothills;
@class VanVogtMountains;
@class BradburyPlateau;
@class AsimovCrater;
@class HerbertValley;
@class LemBadlands;
@class BurroughsDesert;

#define SAVE_STATE_VERSION 1
#undef DETERMINISTIC

@interface GameState : NSObject <NSCoding> {
	NSMutableArray* players;
	
	int currentPlayerIndex;
    int numTurns;
	
	NSData* undoState;
	NSData* redoState;
	
	// Orbitals
	SolarConverter*		 solarConverter;
	Shipyard*			 shipyard;
	MaintenanceBay*		 maintenanceBay;
	ColonistHub*		 colonistHub;
	ColonyConstructor*	 colonyConstructor;
	LunarMine*			 lunarMine;
	RaidersOutpost*		 raidersOutpost;
	AlienArtifact*		 alienArtifact;
	OrbitalMarket*		 orbitalMarket;
	TerraformingStation* terraformingStation;
	
    NSArray* orbitals;
    
	Orbital* activeFacility;
	
	// Regions
	HeinleinPlains* heinleinPlains;
	PohlFoothills* pohlFoothills;
	VanVogtMountains* vanVogtMountains;
	BradburyPlateau* bradburyPlateau;
	AsimovCrater* asimovCrater;
	HerbertValley* herbertValley;
	LemBadlands* lemBadlands;
	BurroughsDesert* burroughsDesert;
	
	NSArray* regions;
	
	TechCardGroup* techDrawDeck;
	TechCardGroup* techDiscardDeck;
	TechCardGroup* techDisplayDeck;
	TechCardGroup* allTech;
    
    Ship* artifactShip;
    
    NSMutableArray* childStates;
    
    bool childrenFilling;
    bool childrenFilled;
    
    int aiFlags;
    
    NSMutableString* lastMove;
    NSMutableString* gameLog;
    
    NSMutableArray* soundEventQueue; // Hack to hold sound events due to be played when an AI player loads this state.
    
    bool suppressEvents;
}

+(GameState*) sharedGameState;
+(GameState*) restoreFromState:(NSData*) data;
+(void) setActiveState:(GameState*)nextState;
+(void) saveGameStateToPrefs:(NSData*) data;
+(NSData*) loadGameStateFromPrefs;
+(void) clearGameStateFromPrefs;

- (GameState*) initWith:(int)numberOfPlayers p1:(int)player1Type p2:(int)player2Type p3:(int)player3Type p4:(int)player4Type;
- (id) clone;
- (GameState*) oldClone;
- (id) newClone;

-(NSData*) serialize;

-(void) undo;
-(void) redo;
-(bool) canUndo;
-(bool) canRedo;
-(void) setRedoState:(NSData*)data;
-(void) gotoNextPlayer;
-(void) createUndoPoint;
-(void) clearUndoRedo;

// Orbitals
@property (strong, readonly) SolarConverter*		solarConverter;
@property (strong, readonly) Shipyard*				shipyard;
@property (strong, readonly) MaintenanceBay*		maintenanceBay;
@property (strong, readonly) ColonistHub*			colonistHub;
@property (strong, readonly) ColonyConstructor*		colonyConstructor;
@property (strong, readonly) LunarMine*				lunarMine;
@property (strong, readonly) RaidersOutpost*		raidersOutpost;
@property (strong, readonly) AlienArtifact*			alienArtifact;
@property (strong, readonly) OrbitalMarket*			orbitalMarket;
@property (strong, readonly) TerraformingStation*	terraformingStation;
@property (weak, readonly) NSArray*               orbitals;

// Regions
@property (strong, readonly) HeinleinPlains*	heinleinPlains;
@property (strong, readonly) PohlFoothills*		pohlFoothills;
@property (strong, readonly) VanVogtMountains*	vanVogtMountains;
@property (strong, readonly) BradburyPlateau*	bradburyPlateau;
@property (strong, readonly) AsimovCrater*		asimovCrater;
@property (strong, readonly) HerbertValley*		herbertValley;
@property (strong, readonly) LemBadlands*		lemBadlands;
@property (strong, readonly) BurroughsDesert*	burroughsDesert;
@property (weak, readonly) NSArray* regions;
@property (readonly) NSArray* soundEventQueue;


@property (readonly) int numPlayers;
@property (weak, readonly) Player* currentPlayer;

@property (readonly) int numTurns;

@property (strong, readonly) NSArray* players;

@property (readonly) bool isDefault;

-(void) postEvent:(NSString*)event object:(id)obj;

@property (weak) Orbital* selectedFacility;

-(Ship*) shipByPlayer:(int)playerID shipID:(int)shipID;
-(Player*) playerByID:(int)playerID;

@property (strong, readonly) Ship* artifactShip;

-(void) fillTechDisplayPile;

@property (readonly) bool gameIsOver;
-(bool) checkGameOver;

-(Player*) winningPlayer;
-(NSArray*) winningPlayers;

@property (assign) bool childrenFilling;
@property (assign) bool childrenFilled;
@property (strong) NSMutableArray* childStates;
-(int) numChildren;

@property (weak, readonly) TechCardGroup* techDrawDeck;
@property (weak, readonly) TechCardGroup* techDiscardDeck;
@property (weak, readonly) TechCardGroup* techDisplayDeck;
@property (strong, readonly) TechCardGroup* allTech;

@property (assign) int aiFlags;

@property (strong) NSString* lastMove;
@property (readonly) NSString* gameLog;
-(void) logMove:(NSString*) move;

// GameCenter
@property (nonatomic, copy) NSString* gcMatchID;
-(bool) isGCMatch;

-(id) corresponding:(id)other;

-(bool) checkReferences;
-(void) dumpCards;

@end
