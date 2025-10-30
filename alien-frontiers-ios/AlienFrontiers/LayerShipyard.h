//
//  LayerShipyard.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/23/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "Shipyard.h"
#import "LayerOrbital.h"

typedef enum
{
	LayerSYTagLabel1,
} LayerSYTags;

@interface LayerShipyard : LayerOrbital {
	CCLabelTTF* label1;
}

@end
