//
//  LayerTechCardTray.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/21/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "AFLayer.h"
#import "TechCard.h"
#import "LayerTechCard.h"

typedef enum
{
	TechCardTrayLayoutVert,
	TechCardTrayLayoutHoriz,
} TechCardTrayLayout;

typedef enum
{
	TechCardTrayTagShadow,
	TechCardTrayTagWhite,
   TechCardTrayTagCards,
} TechCardTrayTags;

@interface LayerTechCardTray : AFLayer {
	int playerIndex;
	NSMutableArray* cardSprites;
    int scrollOffset;
   CCNode* cards;
    TechCardTrayLayout layout;
}

-(id) initWithPlayerIndex:(int)index;
-(void) updateCards:(NSNotification *) notification;
-(void) updateCardPositions:(NSNotification*) notification;
-(bool) isUpToDate:(NSNotification*) notification;

@property (assign) int scrollOffset;

@end
