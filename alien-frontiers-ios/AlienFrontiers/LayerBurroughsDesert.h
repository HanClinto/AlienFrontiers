//
//  LayerBurroughsDesert.h
//  AlienFrontiers
//
//  Created by Clint Herron on 4/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LayerRegion.h"
#import "BurroughsDesert.h"

typedef enum
{
    LayerBDTagDock,
	LayerBDTagPurchaseButton,
} LayerBDTags;



@interface LayerBurroughsDesert : LayerRegion {
    CCSprite* dock;
    CCNode* purchaseButton;
}

-(CGPoint) findArtifactDockPosition;
-(void) updatePurchaseButton:(NSNotification *) notification;

@end
