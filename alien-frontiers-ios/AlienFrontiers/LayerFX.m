//
//  LayerFX.m
//  AlienFrontiers
//
//  Created by Clint Herron on 1/17/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//

#import "LayerFX.h"

@implementation LayerFX

- (id)init
{
    self = [super init];
    if (self) {
        // Initialization code here.
//		CCSpriteFrameCache* frameCache = [CCSpriteFrameCache sharedSpriteFrameCache];
//        [frameCache addSpriteFramesWithFile:@"flare.png"];
        
    }
    
    return self;
}


-(void) onEnter
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(doFlare:) name:GUI_EVENT_FX_FLARE object:nil];
	
	[super onEnter];
}

-(void) onExit
{
    // TOOD: Remove all event handlers here?
    
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    
	[[NSNotificationCenter defaultCenter] removeObserver:self];
    
//	self.isTouchEnabled = false;
    
    //	[self removeAllChildrenWithCleanup:true]; // Handled by AFLayer
	
	[super onExit];
}

-(void) doFlare:(NSNotification*)notification
{
    if ([[[notification object] class] isSubclassOfClass:[CCNode class]])
    {
        CCNode* sender = (CCNode*) [notification object];

        // Sanity check
        if (sender == nil)
            return;
        
        CCSprite* flare = [CCSprite spriteWithFile:@"flare.png"];
        [flare setPosition:[sender position]];
        [self addChild:flare];
        
        id scale = [CCScaleTo actionWithDuration:0.3 scaleX:2 scaleY:2];
        id del = [CCCallFuncN actionWithTarget:self selector:@selector(removeSprite:)];
        id scaleSeq = [CCSequence actions:scale, del, nil];
        
        id fadeIn  = [CCFadeTo actionWithDuration:0.1 opacity:96];
        id fadeOut = [CCFadeTo actionWithDuration:0.2 opacity:0];
        id fadeSeq = [CCSequence actions:fadeIn, fadeOut, nil];
        
        [flare runAction:scaleSeq];
        [flare runAction:fadeSeq];
    }
}
                  
@end
