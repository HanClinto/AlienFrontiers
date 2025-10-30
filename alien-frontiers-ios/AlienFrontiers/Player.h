//
//  Player.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/8/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ShipGroup.h"
#import "cocos2d.h"
#import "GameEvents.h"


@class GameState;
@class PlayerTechCardGroup;
@class TechCard;
@class Region;
@class AIPlayer;

typedef enum {
    AI_TYPE_HUMAN,
    AI_TYPE_EASY,
    AI_TYPE_MEDIUM,
    AI_TYPE_HARD,
    AI_TYPE_PIRATE,
    AI_TYPE_LENGTH, // always last
} PlayerAIType;

@interface Player : NSObject <NSCoding> {
	int fuel;
	int ore;
	
	ShipGroup* activeShips;
	ShipGroup* inactiveShips;
	ShipGroup* allShips;
	int colorIndex;
	
	__weak GameState* state;
	PlayerTechCardGroup* cards;
	
	int marketPrice;
	int index;
	
	int coloniesLeft;
	
	int coloniesToLaunch;
	
	int techsDiscarded;
	
	__weak Region* borrowingRegion;
	
	int artifactCreditAvailable;
	int artifactShufflesAvailable;
	
	bool initialRollDone;
	
	int oreToRaid; // How much an OTHER player is raiding from THIS player
	int fuelToRaid; // How much an OTHER player is raiding from THIS player
    TechCard* cardToRaid; // The card that THIS player is raiding from an OTHER player
    
    bool isRaiding;
    bool _isChoosingDiscard;
    bool _isDraftingTech;
    
    PlayerAIType aiType;
    
    TechCard* selectedCard;
    
    NSString* gcPlayerID;
}

//-(Player*) initWithState:(GameState*)_state playerIndex:(int)_index colorIndex:(int)_color;
-(Player*) initWithState:(GameState*)_state playerIndex:(int)_index colorIndex:(int)_color numPlayers:(int)_numPlayers;

@property (readonly) NSString* localPlayerID;

@property (readonly) bool initialRollDone;

@property (assign) int fuel;
@property (assign) int ore;
@property (readonly) int resourcesNeededForNextShip;
@property (assign) NSString* gcPlayerID;

@property (weak, readonly) ShipGroup* activeShips;
@property (weak, readonly) ShipGroup* selectedShips;
@property (weak, readonly) ShipGroup* unselectedShips;
@property (weak, readonly) ShipGroup* undockedUnselectedShips;
@property (weak, readonly) ShipGroup* undockedShips;
@property (strong, readonly) ShipGroup* allShips;
@property (readonly) ccColor3B color;
@property (readonly) int colorIndex;
@property (readonly) int playerIndex;
@property (assign) int numColoniesToLaunch;
@property (readonly) int coloniesLeft;
@property (weak) Region* borrowingRegion; // with Data Crystal
@property (readonly) int numUndockedShips;
@property (readonly) int numActiveNativeShips;
-(void) decrementColoniesLeft;

@property (readonly) int vps;
@property (readonly) float score;

@property (weak, readonly) GameState* state;

@property (assign) int artifactCreditAvailable;
@property (assign) int artifactShufflesAvailable;
@property (readonly) bool canShuffleCards;
-(bool) canRaidCard:(TechCard*)card;
-(bool) canPurchaseCard:(TechCard*)card;
-(void) purchaseCard:(TechCard *)card;
-(void) shuffleCards;
@property (weak, readonly) PlayerTechCardGroup* cards;
@property (assign) int techsDiscarded;

@property (weak, readonly) TechCard* selectedCard;
-(void) selectCard:(TechCard*) card;

-(bool) purchaseArtifactShip;
-(bool) hasActiveArtifactShip;

-(void) gatherShips;
-(void) rollShips;

-(void) activateShip;
-(void) activateStartingShips;
-(void) deactivateShip:(Ship*)ship;
-(void) addColony;
-(void) endTurnCleanup;

-(void) startRaid;
@property (readonly) bool isRaiding;
-(bool) finishRaid;

@property (assign) bool isDraftingTech;
@property (assign) bool isChoosingDiscard;

-(bool) canRaidMoreOre;
-(bool) canRaidMoreFuel;

-(void) setMarketPrice:(int) price;
-(int)  marketPrice;
-(bool) ableToMarketTrade;
-(void) doMarketTrade;

-(Ship*) shipByID:(int)shipID;

@property (assign) int fuelToRaid;
@property (assign) int oreToRaid;
@property (readonly) int fuelRaidTotal;
@property (readonly) int oreRaidTotal;
@property (assign) TechCard* cardToRaid;

@property (assign) PlayerAIType aiType;
@property (readonly) NSString* playerName;

@property (readonly) BOOL isAI;
@property (readonly) BOOL isLocalHuman;

-(id) cloneWithState:(GameState*)newState;

@end
