//
//  LayerRegion.h
//  AlienFrontiers
//
//  Created by Clint Herron on 4/13/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "Region.h"
#import "AFLayer.h"

#import "GameEvents.h"

typedef enum
{
    RegionLayerTagFieldRepulsor,
    RegionLayerTagFieldPositron,
    RegionLayerTagFieldIsolation,

	RegionLayerTagPlayer1Counter,
	RegionLayerTagPlayer2Counter,
	RegionLayerTagPlayer3Counter,
	RegionLayerTagPlayer4Counter,
	RegionLayerTagPlayer1Colony,
	RegionLayerTagPlayer2Colony,
	RegionLayerTagPlayer3Colony,
	RegionLayerTagPlayer4Colony,
    
	RegionLayerTagTitle,
	RegionLayerTagTitleUpper,
	RegionLayerTagLegend,
	RegionLayerTagOverlay,
	RegionLayerTagBorder,
	RegionLayerTagGlow,
} RegionLayerTags;

#define REGION_FONT_SIZE 12
#define REGION_FONT_NAME @"DIN-Medium"
#define REGION_FONT_OPACITY 0xEE


@interface LayerRegion : AFLayer {

}

- (void) colonyLanded:(NSNotification *) notification;
-(void) updateLabels;

@property (weak, readonly) Region* region;

@property (strong, readonly) NSString* regionTitle;
@property (strong, readonly) NSString* regionTitleUpper;

@property (strong, readonly) NSString* bonusFileName;

@property (strong, readonly) NSString* regionBorderFileName;
@property (strong, readonly) NSString* regionOverlayFileName;
@property (readonly) CGPoint regionBorderOverlayOffset;
@property (readonly) float regionBorderOverlayRotation;

@end
