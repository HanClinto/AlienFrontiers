//
//  LayerColonistHub.h
//  AlienFrontiers
//
//  Created by Clint Herron on 4/22/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LayerOrbital.h"
#import "ColonistHub.h"

typedef enum
{
	LayerCHTagLabel1,
	LayerCHTagColony1,
	LayerCHTagColony2,
	LayerCHTagColony3,
	LayerCHTagColony4,
	LayerCHTagLaunchButton,
} LayerCHTags;

@interface LayerColonistHub : LayerOrbital {
	CCLabelTTF* label1;
}

-(void) colonyAdvance:(NSNotification *) notification;
-(void) updateLaunchButton:(NSNotification *) notification;
-(CGPoint) pointForStep:(int)step forPlayer:(int)playerIndex;

@end
