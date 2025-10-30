//
//  SceneOptions.h
//  AlienFrontiers
//
//  Created by Clint Herron on 8/3/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "AFLayer.h"

typedef enum
{
	OptionsLayerTagColorBG,
	OptionsLayerTagBG,
	OptionsLayerTagWhiteout,
	OptionsLayerTagTitle,
	OptionsLayerTagButtonBack,
	OptionsLayerTagButtonSfx,
	OptionsLayerTagButtonMusic,
    OptionsLayerTagButtonColorblind,
} OptionsLayerSceneTags;

@interface SceneOptions : AFLayer {
//    CCNode* backButton;
    
    CCNode* musicButton;
    CCNode* sfxButton;
    CCNode* colorblindButton;
}

+(id) scene;

@end
