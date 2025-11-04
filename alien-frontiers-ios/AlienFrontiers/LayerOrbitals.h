//
//  LayerOrbitals.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/6/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LayerSolarconverter.h"
#import "LayerShips.h"
#import "LayerShipyard.h"
#import "LayerLunarMine.h"
#import "LayerColonyConstructor.h"
#import "LayerTerraformingStation.h"
#import "LayerRaidersOutpost.h"
#import "LayerMaintenanceBay.h"
#import "LayerColonistHub.h"
#import "LayerOrbitalMarket.h"
#import "LayerAlienArtifact.h"

// Using an enum to define tag values has the upside that you can select
// tags by name instead of having to remember each individual number.
typedef enum
{
	OrbitalsLayerTagSolarConverter,
	OrbitalsLayerTagOrbitalMarket,
	OrbitalsLayerTagAlienArtifact,
	OrbitalsLayerTagRaidersOutpost,
	OrbitalsLayerTagLunarMine,
	OrbitalsLayerTagColonyConstructor,
	OrbitalsLayerTagColonistHub,
	OrbitalsLayerTagShipyard,
	OrbitalsLayerTagTerraformingStation,
	OrbitalsLayerTagMaintenanceBay,
	OrbitalsLayerTagShips,
} OrbitalsLayerSceneTags;

@interface LayerOrbitals : CCLayer {
	LayerSolarConverter* sc;
	LayerShipyard* sy;
	LayerLunarMine* lm;
	LayerColonyConstructor* cc;
	LayerTerraformingStation* ts;
	LayerRaidersOutpost* ro;
	LayerMaintenanceBay* mb;
	LayerColonistHub* ch;
	LayerOrbitalMarket* om;
	LayerAlienArtifact* aa;
}

-(CGPoint) findPositionByDock:(DockingBay *)dock;

@end
