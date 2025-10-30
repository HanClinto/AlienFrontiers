//
//  LayerTechAADetail.h
//  AlienFrontiers
//
//  Created by Clint Herron on 1/31/12.
//  Copyright (c) 2012 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "AFLayer.h"
#import "cocos2d.h"
#import "GameEvents.h"
#import "AFLayer.h"
#import "TechCard.h"
#import "GameState.h"
#import "Player.h"
#import "AlienArtifact.h"


typedef enum
{
    LayerTechAADetailTagColorLayer,
	 LayerTechAADetailTagBG,
    LayerTechAADetailTagButtonBack,
    LayerTechAADetailTagButtonTake,
    LayerTechAADetailTagTextTray,
    LayerTechAADetailTagLabelUse,
    LayerTechAADetailTagLabelDiscard,
    LayerTechAADetailTagDivider,
    LayerTechAADetailTagNameLabel1,
    LayerTechAADetailTagNameLabel2,
    LayerTechAADetailTagCardImage,
} LayerTechAADetailTags;

#define BG_LAYER_INTENSITY 0x66

@interface LayerTechAADetail : AFLayer
{
    CCLayerColor *backgroundLayer;

    CCSprite *bg;
    CCNode *backButton;
    CCNode *takeButton;
    
    CCSprite *textTray;
    CCLabelBMFont *useText;
    CCLabelBMFont *discardText;
    CCSprite *orDivider;
    
    CCLabelTTF *nameLabel1;
    CCLabelTTF *nameLabel2;
    CCSprite *cardImage;
    
    TechCard* targetTech;
}

-(void) activate:(TechCard*) tech;

@end
