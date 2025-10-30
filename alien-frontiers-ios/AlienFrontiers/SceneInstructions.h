//
//  SceneInstructions.h
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
	InstructionsLayerTagColorBG,
	InstructionsLayerTagBG,
	InstructionsLayerTagWhiteout,
	InstructionsLayerTagTitle,
	InstructionsLayerTagButtonBack,
	InstructionsLayerTagInstructions,
    InstructionsLayerTagWebview,
} InstructionsLayerSceneTags;

@interface SceneInstructions : AFLayer {
    CCScene* previousScene;
    
    IBOutlet UIWebView *webView;
}

+(id) scene;

@end
