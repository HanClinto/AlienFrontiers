//
//  LayerTerraformingStation.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/23/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LayerOrbital.h"
#import "TerraformingStation.h"

typedef enum
{
	LayerTSTagLabel1,
	LayerTSTagLabel2,
} LayerTSTags;

@interface LayerTerraformingStation : LayerOrbital {
	CCLabelTTF* label1;
	CCLabelTTF* label2;
}


@end
