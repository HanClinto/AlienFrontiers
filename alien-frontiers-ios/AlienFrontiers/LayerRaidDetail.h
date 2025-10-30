//
//  LayerRaidDetail.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/11/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "AFLayer.h"
#import "GameEvents.h"

typedef enum
{
   LayerRaidDetailTagColorLayer,
	LayerRaidDetailTagBG,
   LayerRaidDetailTagButtonOk,
   LayerRaidDetailTagButtonCancel,
} LayerTechAADetailTags;

#define BG_LAYER_INTENSITY 0x66

@interface LayerRaidDetail : AFLayer {
   CCLayerColor *backgroundLayer;
   
   CCSprite *bg;
   CCNode *okButton;
   CCNode *cancelButton;
}

-(void) activate;
-(void) itemTouched:(NSNotification*) notification;


@end
