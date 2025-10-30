//
//  SceneStartGame.h
//  AlienFrontiers
//
//  Created by Clint Herron on 4/27/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "AFLayer.h"
#import "SceneMainMenuiPad.h"
#import "SceneGameiPad.h"
#import "SceneGameOver.h"
#import "GameState.h"

// Using an enum to define tag values has the upside that you can select
// tags by name instead of having to remember each individual number.
typedef enum
{
	StartGameLayerTagColorBG,
	StartGameLayerTagBG,
	StartGameLayerTagTitle,
	StartGameLayerTagButtonPlay,
	StartGameLayerTagButtonNumPlayers,
	StartGameLayerTagButtonBack,
    StartGameLayerTagButtonPlayer1,
    StartGameLayerTagButtonPlayer2,
    StartGameLayerTagButtonPlayer3,
    StartGameLayerTagButtonPlayer4
} StartGameLayerSceneTags;


@interface SceneStartGame : AFLayer {
	UIDeviceOrientation currentOrientation;
	int numPlayers;
    
    int player1Personality;
    int player2Personality;
    int player3Personality;
    int player4Personality;
}

+(id) scene;

- (void)playButtonTapped:(id)sender;
- (void)backButtonTapped:(id)sender;

@end
