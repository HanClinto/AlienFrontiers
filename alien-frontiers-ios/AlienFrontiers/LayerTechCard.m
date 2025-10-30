//
//  LayerTechCard.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/11/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerTechCard.h"

#import "SceneGameiPad.h"


@implementation LayerTechCard

@synthesize registerForTouch;

-(LayerTechCard*) initWithCard:(TechCard*)targetCard withLayout:(TechCardLayout)cardLayout
{
	if ((self = [super init]))
	{
		cardID = [targetCard cardID];
        TechCard* card = [self card];
		layout = cardLayout;
		
		if (cardLayout != TechCardLayoutTrans)
		{
			CCSprite* bg;
			if (cardLayout == TechCardLayoutTall)
			{
                bg = [CCSprite spriteWithFile:@"tech_layer_bg.png"];
                    
				bg.position = ccp( 0, 0 );
			}
			else
			{
				bg = [CCSprite spriteWithFile:@"tech_layer_bg_mini_horiz.png"];
				bg.position = ccp( 67 - 9, 0 );
			}
			
			[self addChild:bg z:TechCardLayerTagBG tag:TechCardLayerTagBG];
		}
		
		CCSprite* cardImage = [CCSprite spriteWithFile:[card imageFilename]];
		cardImage.position = ccp( 0, 0 );
        
        if (cardLayout != TechCardLayoutTall)
        {
            [cardImage setScaleX:0.8];
            [cardImage setScaleY:0.8];
        }
		
//		cardImage.opacity = 0;
		[self addChild:cardImage z:TechCardLayerTagSprite tag:TechCardLayerTagSprite];
		
		
		
		CCLabelTTF* label = [CCLabelTTF labelWithString:[card title1] fontName:@"DIN-Medium" fontSize:12];
		if (cardLayout == TechCardLayoutTrans)
			label.color = ccWHITE;
		else 
			label.color = ccBLACK;

		if ((cardLayout == TechCardLayoutTrans) ||
			(cardLayout == TechCardLayoutWide))
		{
			cardImage.position = ccp( 8, 0 );
			label.position = ccp( 38, 10 -5 );
			label.anchorPoint = CGPointMake(0.0f, 0.5f);
		} else {
			cardImage.position = ccp( 0, 14 );
			label.position = ccp( 0, 30 - 36-7);
			label.anchorPoint = CGPointMake(0.5f, 1.0f);
			
		}
//		label.opacity = 0;
		[self addChild:label z:TechCardLayerTagLabel1 tag:TechCardLayerTagLabel1];
		
		if (![[card title2] isEqualToString:@""])
		{
			label = [CCLabelTTF labelWithString:[card title2] fontName:@"DIN-Medium" fontSize:12];

			if (cardLayout == TechCardLayoutTrans)
				label.color = ccWHITE;
			else 
				label.color = ccBLACK;
			
			if ((cardLayout == TechCardLayoutTrans) ||
				(cardLayout == TechCardLayoutWide))
			{
				label.position = ccp( 38, -6 -5 + 2 );
				label.anchorPoint = CGPointMake(0.0f, 0.5f);
			} else {
				label.position = ccp( 0, 14 - 36 -7 + 2 );
				label.anchorPoint = CGPointMake(0.5f, 1.0f);
			}
//			label.opacity = 0;
			[self addChild:label z:TechCardLayerTagLabel2 tag:TechCardLayerTagLabel2];
		}
        
        [self updateCardVisual];
	}
	
	return self;
}

-(void) updateCardVisual
{
    TechCard* card = [self card];

    CCSprite* cardImage = (CCSprite*) [self getChildByTag:TechCardLayerTagSprite];
    CCLabelTTF* cardLabel1 = (CCLabelTTF*) [self getChildByTag:TechCardLayerTagLabel1];
    CCLabelTTF* cardLabel2 = (CCLabelTTF*) [self getChildByTag:TechCardLayerTagLabel2];
    
    if ([card tapped]) 
    {
        [cardImage setOpacity:127];
        [cardLabel1 setOpacity:127];
        [cardLabel2 setOpacity:127];
    }
    else
    {
        [cardImage setOpacity:255];
        [cardLabel1 setOpacity:255];
        [cardLabel2 setOpacity:255];
    }
    
    
    CCSprite* bg = (CCSprite*) [self getChildByTag:TechCardLayerTagBG];
    
    if (bg != nil) 
    {
        bool selected = false;
        
//        if ([card owner] == [[GameState sharedGameState] currentPlayer])
        if ([card owner] != nil)
        {
            //            if ([[[GameState sharedGameState] currentPlayer] selectedCard] == card)
            if ([[card owner] selectedCard] == card)
            {
                selected = true;
            }
        }
        
        if (layout == TechCardLayoutTall)
        {
            if (selected)
                [bg setTexture:[[CCTextureCache sharedTextureCache] addImage:@"tech_layer_bg_selected.png"]];
            else
                [bg setTexture:[[CCTextureCache sharedTextureCache] addImage:@"tech_layer_bg.png"]];
        }
        else
        {
            if (selected)
                [bg setTexture:[[CCTextureCache sharedTextureCache] addImage:@"tech_layer_bg_mini_horiz_selected.png"]];
            else
                [bg setTexture:[[CCTextureCache sharedTextureCache] addImage:@"tech_layer_bg_mini_horiz.png"]];
        }
    }
}

-(void) cardUpdated:(NSNotification*) notification
{
//    TechCard* card = [self card];
    
//    if (([notification object] == card) ||
//        ([notification object] == [GameState sharedGameState]))
    {
        [self updateCardVisual];
    }
}

-(TechCard*) card
{
    return [[[GameState sharedGameState] allTech] cardByID:cardID];
}

-(void) setCard:(TechCard *)card
{
    cardID = [card cardID];
}

-(void) onEnter
{
    // Subscribe for touch events
    //    self.isTouchEnabled = false;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(cardUpdated:) name:EVENT_CARD_TAPPED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(cardUpdated:) name:EVENT_CARD_SELECTED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(cardUpdated:) name:EVENT_STATE_RELOAD object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(cardUpdated:) name:EVENT_ARTIFACT_CARDS_CHANGED object:nil];

    // TODO: Should we fade in here?
    //		[self fadeIn];
    
    [super onEnter];
}

-(void) onExit
{
   //    self.isTouchEnabled = false;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    
    [super onExit];
}


-(void) registerWithTouchDispatcher
{
   [[[CCDirector sharedDirector] touchDispatcher] addTargetedDelegate:self priority:-1 swallowsTouches:NO];
}

- (BOOL)ccTouchBegan:(UITouch *)touch withEvent:(UIEvent *)event 
{
    if ([[SceneGameiPad sharedLayer] currentModalWindow] != ModalWindowNone)
        return false;
    
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	CGPoint location = [self convertTouchToNodeSpace: touch];
    
    if (CGRectContainsPoint(self.childBounds, location))
	{
        touchStart = location;
        touchPrev = location;

        if ([[self card] owner] == [[GameState sharedGameState] currentPlayer])
            [[[GameState sharedGameState] currentPlayer] selectCard:[self card]];

        //        [[SceneGameiPad techPopout] activate:[self card] fromPoint:[self convertToWorldSpace:[self position]]];
        
        //* // No longer fire an event at this point, instead, we will load up the tech popout window, from where the card can still be selected.
        // Fire event...
        [[NSNotificationCenter defaultCenter]
		 postNotificationName:EVENT_ITEM_TOUCHED
		 object:[self card]];
        
        //*/
        
        
        return true;
    }
    
	return false;
}

-(void) fadeIn
{
	CCSprite* cardImage = (CCSprite*) [self getChildByTag:TechCardLayerTagSprite];
	if (cardImage != nil)
		[cardImage runAction:[CCFadeIn actionWithDuration: 0.4f]];
	
	CCLabelTTF* label = (CCLabelTTF*) [self getChildByTag:TechCardLayerTagLabel1];
	if (label != nil)
		[label runAction:[CCFadeIn actionWithDuration: 0.4f]];

	label = (CCLabelTTF*) [self getChildByTag:TechCardLayerTagLabel2];
	if (label != nil)
		[label runAction:[CCFadeIn actionWithDuration: 0.4f]];
}

@end
