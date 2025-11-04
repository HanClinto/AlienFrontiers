//
//  LayerOrbitalMarket.h
//  AlienFrontiers
//
//  Created by Clint Herron on 4/25/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LayerOrbital.h"
#import "OrbitalMarket.h"

typedef enum
{
	LayerOMTagLabel1,
	LayerOMTagLabel2,
	LayerOMTagTradeButton,
} LayerOMTags;

@interface LayerOrbitalMarket : LayerOrbital {
	CCLabelTTF* label1;
	CCLabelTTF* label2;
}

-(void) updateTradeButton:(NSNotification *) notification;
- (void)tradeTapped:(id)sender;


@end
