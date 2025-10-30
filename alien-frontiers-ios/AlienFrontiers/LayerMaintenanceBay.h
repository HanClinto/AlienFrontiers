//
//  LayerMaintenanceBay.h
//  AlienFrontiers
//
//  Created by Clint Herron on 3/24/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LayerOrbital.h"
#import "MaintenanceBay.h"

typedef enum
{
	LayerMBTagLabel1,
	LayerMBTagLabel2,
} LayerMBTags;

@interface LayerMaintenanceBay : LayerOrbital {
	CCLabelTTF* label1;
	CCLabelTTF* label2;
}

@end
