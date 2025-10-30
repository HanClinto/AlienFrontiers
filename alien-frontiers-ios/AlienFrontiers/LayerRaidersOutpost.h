//
//  LayerRaidersOutpost.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/24/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LayerOrbital.h"
#import "RaidersOutpost.h"

typedef enum
{
	LayerROTagLabel1,
	LayerROTagLabel2,
	LayerROTagGTIcon,
	LayerROTagMBIcon,
} LayerROTags;

@interface LayerRaidersOutpost : LayerOrbital {
	CCLabelTTF* label1;
	CCLabelTTF* label2;
}


@end
