//
//  LayerTechCardPowers.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/24/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "AFLayer.h"
#import "TechCard.h"
#import "GameState.h"
#import "Player.h"

typedef enum
{
	TechCardInspectorTagPowerImage,
	TechCardInspectorTagDiscardImage,
	TechCardInspectorTagOrSeparator,
    TechCardInspectorTagPowerLabel,
    TechCardInspectorTagDiscardLabel,
	TechCardInspectorTagUsePowerButton,
	TechCardInspectorTagUseDiscardButton,
} TechCardInspectorTags;

@interface LayerTechCardInspector : AFLayer {
	TechCard* displayingCard;
    int playerIndex;
}

-(LayerTechCardInspector*) initWithPlayerIndex:(int)index;
-(void) displayCard:(TechCard*) card;

@end
