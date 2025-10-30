//
//  LayerSolarConverter.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/6/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LayerOrbital.h"
#import "SolarConverter.h"

typedef enum
{
	LayerSCTagLabel1,
	LayerSCTagLabel2,
} LayerSCTags;

@interface LayerSolarConverter : LayerOrbital {

	CCLabelTTF* label1;
	CCLabelTTF* label2;
}

@end
