//
//  TechCard.h
//  AlienFrontiers
//
//  Created by Clint Herron on 4/20/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>

@class Player;
@class GameState;

@interface TechCard : NSObject <NSCoding> {
	__weak Player* owner;
	__weak GameState* state;
	bool tapped;
	bool isSelected;
    int cardID;
}

-(TechCard*) initTechWithState:(GameState*)gameState withID:(int)ID;

@property (weak, readonly) GameState* state;

-(bool) hasPower;
-(bool) hasDiscard;

-(bool) canUsePower;
-(bool) canUseDiscard;

-(void) useDiscard;

-(NSString*) whyCantUsePower;
-(NSString*) whyCantUseDiscard;

+(int) infiniteCost;
@property (readonly) int infiniteCost;

@property (readonly) int victoryPoints;
@property (strong, readonly) NSString* title;
@property (strong, readonly) NSString* title1;
@property (strong, readonly) NSString* title2;
@property (strong, readonly) NSString* imageFilename;
@property (strong, readonly) NSString* fullImageFilename;

@property (readonly) int adjustedFuelCost;
@property (readonly) int baseFuelCost;

@property (readonly) int cardID;

@property (weak) Player* owner;

@property (assign) bool tapped;

+(int) numToPutInDeck;

@property (strong, readonly) NSString* powerText;
@property (strong, readonly) NSString* discardText;

-(id) cloneWithState:(GameState*)newState;

@end
