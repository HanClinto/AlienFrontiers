//
//  SceneMainMenu.h
//  AlienFrontiers
//
//  Created by Clint Herron on 4/25/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "AFLayer.h"
#import "SceneStartGame.h"
#import "SceneInstructions.h"
#import "SceneOptions.h"

// Using an enum to define tag values has the upside that you can select
// tags by name instead of having to remember each individual number.
typedef enum
{
	MainMenuLayerTagColorBG,
	MainMenuLayerTagBG,
	MainMenuLayerTagTitle,
	MainMenuLayerTagButtonPlay,
	MainMenuLayerTagButtonRules,
	MainMenuLayerTagButtonAchievements,
    MainMenuLayerTagButtonMultiplayer,
    MainMenuLayerTagButtonOptions,
	MainMenuLayerTagBottomText,
} MainMenuLayerSceneTags;


@interface SceneMainMenuiPad : AFLayer {
	UIDeviceOrientation currentOrientation;
    
    NSTimer* creditsTimer;
    int creditsIndex;
    NSArray* creditsText;
}

+(id) scene;

- (void)playButtonTapped:(id)sender;
- (void)rulesButtonTapped:(id)sender;
- (void)achievementsButtonTapped:(id)sender;	
	
@end
