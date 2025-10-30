//
//  SelectShips.h
//  AlienFrontiers
//
//  Created by Clint Herron on 6/13/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "QueuedSelection.h"
#import "Ship.h"
#import "ShipGroup.h"
#import "GameState.h"

@interface SelectShips : QueuedSelection {
	ShipGroup* selectedShips;
	bool mustBeDocked;
	bool ignoreMaintBay;
	bool ignoreTerrStation;
    bool ignoreTeleported;
	Player* fromPlayer;
	Player* notFromPlayer;
	
	int maxQuant;
	int minValue;
	int maxValue;
}

-(id) initWithCaption:(NSString *)cap mustBeDocked:(bool)docked ignoreMaintBay:(bool)maintBay ignoreTerrStation:(bool)terrStation fromPlayer:(Player*)_fromPlayer notFromPlayer:(Player*)_notFromPlayer selectQuant:(int)quant minValue:(int)min maxValue:(int)max ignoreTeleported:(bool)teleported;


-(SelectShips*) initWithCaptionBoosterPod:(NSString *)cap;
-(SelectShips*) initWithCaptionStasisBeam:(NSString *)cap;
-(SelectShips*) initWithCaptionOneUndocked:(NSString *)cap; 
-(SelectShips*) initWithCaptionTeleporter:(NSString *)cap;
-(SelectShips*) initWithCaptionPlasmaCannon:(NSString*)cap maxQuant:(int)quant;
-(SelectShips*) initWithCaptionWarper:(NSString *)cap;

@end
