//
//  LayerAlienArtifact.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "LayerOrbital.h"
#import "AlienArtifact.h"
#import "LayerTechCard.h"

typedef enum
{
	LayerAATagLabel1,
	LayerAATagLabel2,
	LayerAATagShuffleButton,
    LayerAATagDiscardsButton,
	LayerAATagTakeButton,
	LayerAATagCard1,
	LayerAATagCard2,
	LayerAATagCard3,	
} LayerAATags;

@interface LayerAlienArtifact : LayerOrbital {
	CCLabelTTF* label1;
	CCLabelTTF* label2;
    
    bool showingDiscards;
    int showingDiscardsPage;
}

-(void) updateCards:(NSNotification *) notification;
-(void) updateButtons:(NSNotification *) notification;

@end
