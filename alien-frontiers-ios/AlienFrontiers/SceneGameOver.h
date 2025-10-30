//
//  SceneGameOver.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/2/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "AFLayer.h"
#import "SceneMainMenuiPad.h"
#import "SceneGameiPad.h"
#import "GameState.h"

// Using an enum to define tag values has the upside that you can select
// tags by name instead of having to remember each individual number.
typedef enum
{
	GameOverLayerTagColorBG,
	GameOverLayerTagBG,
	GameOverLayerTagTitle,
	GameOverLayerTagScore1,
	GameOverLayerTagScore2,
	GameOverLayerTagScore3,
	GameOverLayerTagScore4,
	GameOverLayerTagButtonBack,
} GameOverLayerSceneTags;


@interface SceneGameOver : AFLayer {
	UIDeviceOrientation currentOrientation;
}

+(id) scene;

- (void)backButtonTapped:(id)sender;

@end
