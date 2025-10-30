//
//  LayerRegions.h
//  AlienFrontiers
//
//  Created by Clint Herron on 4/12/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LayerRegion.h"
#import "LayerHerbertValley.h"
#import "LayerLemBadlands.h"
#import	"LayerHeinleinPlains.h"
#import "LayerPohlFoothills.h"
#import "LayerVonVogtMountains.h"
#import "LayerBradburyPlateau.h"
#import "LayerAsimovCrater.h"
#import "LayerBurroughsDesert.h"
#import "AFLayer.h"
#import "GameEvents.h"

typedef enum
{
	RegionsLayerTagHeinleinPlains,
	RegionsLayerTagPohlFoothills,
	RegionsLayerTagVanVogtMountains,
	RegionsLayerTagBradburyPlateau,
	RegionsLayerTagAsimovCrater,
	RegionsLayerTagHerbertValley,
	RegionsLayerTagLemBadlands,
	RegionsLayerTagBurroughsDesert,
} RegionsLayerSceneTags;

@interface LayerRegions : AFLayer {
	LayerRegion* hp;
	LayerRegion* pf;
	LayerRegion* vvm;
	LayerRegion* bp;
	LayerRegion* ac;
	LayerHerbertValley* hv;
	LayerRegion* lb;
	LayerBurroughsDesert* bd;
}

-(LayerBurroughsDesert*) burroughsDesert;

@end
