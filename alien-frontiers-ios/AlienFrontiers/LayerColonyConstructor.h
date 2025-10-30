//
//  LayerColonyConstructor.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/23/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LayerOrbital.h"
#import "ColonyConstructor.h"

typedef enum
{
	LayerCCTagLabel1,
	LayerCCTagLabel2,
	LayerCCTagGTIcon,
} LayerCCTags;

@interface LayerColonyConstructor : LayerOrbital {
	CCLabelTTF* label1;
	CCLabelTTF* label2;
}

@end
