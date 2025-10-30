//
//  LayerGameMenu.h
//  AlienFrontiers
//
//  Created by Raymond Cook on 5/11/11.
//  Copyright 2011 Lunar Innovations. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "GameEvents.h"
#import "AFLayer.h"

typedef enum
{
	MenuLayerTagBackground,
    MenuLayerTagButtonResume,
    MenuLayerTagButtonQuit,
    MenuLayerTagButtonFeedback,
    MenuLayerTagButtonSFX,
    MenuLayerTagButtonMusic,
    
} MenuLayerTags;


@interface LayerGameMenu : AFLayer 
{
    CCLayerColor *backgroundLayer;
    CCNode *resumeButton;
    CCNode *quitButton;

    CCNode *sfxButton;
    CCNode *musicButton;
    
    CCNode *feedbackButton;
}

-(void) activate;
-(void) deactivate;

@end