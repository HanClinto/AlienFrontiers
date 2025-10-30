//
//  LayerTechCard.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/11/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "GameState.h"
#import "TechCard.h"
#import "GameEvents.h"
#import "AFLayer.h"


typedef enum
{
	TechCardLayerTagBG,
	TechCardLayerTagSprite,
	TechCardLayerTagLabel1,
	TechCardLayerTagLabel2,
} TechCardLayerTags;

typedef enum
{
	TechCardLayoutTrans,
	TechCardLayoutWide,
	TechCardLayoutTall,
} TechCardLayout;

@interface LayerTechCard : AFLayer {
    int cardID;
	TechCardLayout layout;
    CGPoint touchStart;
    CGPoint touchPrev;
}

-(LayerTechCard*) initWithCard:(TechCard*)targetCard withLayout:(TechCardLayout)cardLayout;
@property (weak) TechCard* card;
@property BOOL registerForTouch;
-(void) updateCardVisual;

@end
