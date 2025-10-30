//
//  LayerLunarMine.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/23/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LunarMine.h"
#import "LayerOrbital.h"

typedef enum
{
	LayerLMTagLabel1,
	LayerLMTagLabel2,
	LayerLMTagGTIcon,
} LayerLMTags;

@interface LayerLunarMine : LayerOrbital {
	CCLabelTTF* label1;
	CCLabelTTF* label2;
}

@end
