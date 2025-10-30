//
//  LayerRaidDetail.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/11/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//

#import "LayerRaidDetail.h"
#import "TechCard.h"
#import "GameState.h"
#import "SceneGameiPad.h"
#import "GameTouchManager.h"
#import "SelectionQueue.h"
#import "QueuedSelection.h"
#import "LayerGameBoard.h"

@implementation LayerRaidDetail


-(id) init
{
	if ((self = [super init]))
	{
      self.touchEnabled = NO;
      self.visible = NO;
      
      //      CGSize winSize = [bg contentSize];
      //      int halfWinWidth    = winSize.width * 0.5;
      //      int halfWinHeight   = winSize.height * 0.5;
      
#if BG_LAYER_INTENSITY
      backgroundLayer = [CCLayerColor layerWithColor:ccc4(0, 0, 0, 0)];
      [self addChild: backgroundLayer z:LayerRaidDetailTagColorLayer tag:LayerRaidDetailTagColorLayer];
#endif
      
	}
	return self;
}

-(void) onEnter
{
   [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(itemTouched:) name:EVENT_ITEM_TOUCHED object:nil];		
   
   [super onEnter];
}

-(void) onExit
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[[NSNotificationCenter defaultCenter] removeObserver:self];
   
   backgroundLayer = nil;
   
	// don't forget to call "super dealloc"
	[super onExit];
}


-(void) itemTouched:(NSNotification*) notification
{
	id gameItem = [notification object];
	
	if ([gameItem isKindOfClass:[TechCard class]])
	{
		TechCard* newCard = (TechCard*) gameItem;
		
      if ([[[GameState sharedGameState] techDisplayDeck] hasTechCard:newCard])
		{
			[self activate];
		}
	}
}

-(void) activate
{
   [[SceneGameiPad sharedLayer] setCurrentModalWindow:ModalWindowRaidDetail];

   // Put the mini HUDs into raiding mode to show the fuel / ore buttons
   // Expand the mini HUDs to show cards
   // 

#if BG_LAYER_INTENSITY
   [backgroundLayer setOpacity:0];
   [backgroundLayer runAction:[CCFadeTo actionWithDuration:0.5f opacity:BG_LAYER_INTENSITY]];
   [SceneGameiPad gameLayer].touchEnabled = NO;
#endif
   
}

-(void) deactivate
{
   [SceneGameiPad gameLayer].touchEnabled = YES;
   self.touchEnabled = NO;
   self.visible = NO;
   
   [[SceneGameiPad sharedLayer] setCurrentModalWindow:ModalWindowNone];    
}

- (BOOL)ccTouchBegan:(UITouch *)touch withEvent:(UIEvent *)event 
{
   CGPoint location = [self convertTouchToNodeSpace: touch];
   
   if (CGRectContainsPoint(bg.boundingBox, location))
   {
      return false;
   }
   
   [self deactivate];
   
	return false;
}

@end
