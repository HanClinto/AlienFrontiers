//
//  SceneCredits.h
//  AlienFrontiers
//
//  Created by Clint Herron on 9/17/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "AFLayer.h"

typedef enum
{
	CreditsLayerTagColorBG,
	CreditsLayerTagBG,
	CreditsLayerTagWhiteout,
	CreditsLayerTagTitle,
	CreditsLayerTagButtonBack,
	CreditsLayerTagInstructions,
    CreditsLayerTagWebview,
} CreditsLayerSceneTags;

@interface SceneCredits : AFLayer {
    CCScene* previousScene;
    
    IBOutlet UIWebView *webView;
}

+(id) scene;

@end
