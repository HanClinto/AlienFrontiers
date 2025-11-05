//
//  GameLayer.h
//  ScenesAndLayers
//
//  Created by Steffen Itterheim on 28.07.10.
//  Copyright 2010 Steffen Itterheim. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "AFLayer.h"
#import "GameEvents.h"

typedef enum
{
	GameBoardLayerTagBoard = 200,
} GameBoardLayerTags;


@interface LayerGameBoard : AFLayer 
{
	CGPoint gameLayerPosition;
	CGPoint lastTouchLocation;
}

@end
