//
//  LayerTechCardTrayVertMini.m
//  AlienFrontiers
//
//  Created by Clint Herron on 3/6/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//

#import "LayerTechCardTrayVertMini.h"
#import "GameState.h"
#import "SceneGameiPad.h"


@implementation LayerTechCardTrayVertMini

-(id) initWithPlayerIndex:(int)index
{
	if ((self = [super initWithPlayerIndex:index]))
	{
        CCSprite* white = (CCSprite*)[self getChildByTag:TechCardTrayTagWhite];
        [self removeChild:white cleanup:true];
        
        white = [CCSprite spriteWithFile:@"hud_card_tray_mini_white_vert.png"];
        white.anchorPoint = ccp(0,0.5);
        white.position = ccp(-3, -12);
        [self addChild:white z:TechCardTrayTagWhite tag:TechCardTrayTagWhite];
        
        layout = TechCardTrayLayoutVert;
	}
	
	return self;
}

-(void) updateCards:(NSNotification *) notification
{
//    NSLog(@"Updating LayerTechCardTray updateCards");
	CCNode* cardSprite;
    //cards = [self getChildByTag:TechCardTrayTagCards];
	
	// TODO: Make this more optimized
    
    if ([self isUpToDate:notification])
        return;
    
	// Remove all cards
	
	for (cardSprite in cardSprites)
	{
		[cards removeChild:cardSprite cleanup:true];
	}
	[cardSprites removeAllObjects];
    
	// And add all cards
	int cnt = 0;
	CGPoint destPosition;
	CCSequence* cardSlide;
	
    Player* player = [[GameState sharedGameState] playerByID:playerIndex];
	NSArray* array = [[player cards] array];
	
    /*    if (layout == TechCardTrayLayoutVert)
     {
     int count = [[player cards] count];
     self.position = CGPointMake( -198 * 0.5 + 9, count * 55 (146 - 3?)
     }*/
    
	for (TechCard* card in array) {
        // Note: We're getting a warning here about casting this enumeration and I'm not sure how to tell it, "Yes, I really want to do this."
		cardSprite = [[LayerTechCard alloc] initWithCard:card withLayout:TechCardLayoutWide];
        cardSprite.position = ccp(30, 5 - 33 - 56);

        destPosition = ccp(30, 5 + 55 * cnt - 33 - 56);

		cardSprite.anchorPoint = ccp(0, 1);
		
		[cards addChild:cardSprite z:cnt tag:cnt];
		[cardSprites addObject:cardSprite];
		
		cardSlide = [CCSequence actions:
                     //					 [CCDelayTime actionWithDuration:(0.1f*cnt)],
					 [CCEaseElasticOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: destPosition] period: 0.8f],
					 nil];
		[cardSprite runAction:cardSlide];
		
		cnt++;
	}
}


static CGPoint touchStart;
static CGPoint touchCurrent;
static CGPoint touchPrev;
static int offsetAtStart;
static bool    touchDown;


-(void) setScrollOffset:(int)val
{
    scrollOffset = val;
    [self updateCardPositions:nil];
}

-(int) scrollOffset
{
    return scrollOffset;
}

-(void) updateCardPositions:(NSNotification*) notification
{
    
}

-(void) update:(ccTime)deltaTime
{
    int cardSpan = 0;
    bool vis = false;
    CCSprite* white = (CCSprite*) [self getChildByTag:TechCardTrayTagWhite];
    
    // update your node here
    // DON'T draw it, JUST update it.
    if (layout == TechCardTrayLayoutVert)
    {
        cardSpan = 56;
        
        int cardsSize = [cardSprites count] * cardSpan;
        int boxSize = [white boundingBox].size.height;
        
        int play = cardsSize - boxSize;
        
        int minScrollOffset = 0;
        int maxScrollOffset = 0;
        
        if (play > 0) // We've got more cards than box
        {
            minScrollOffset = -play;
            maxScrollOffset = 0;
        }
        else // We've got more box than cards
        {
            minScrollOffset = 0;
            maxScrollOffset = -play;
        }
        
        /*
        minScrollOffset -= 33;
        maxScrollOffset -= 33;
        */
        if (!touchDown)
        {
            if (scrollOffset > maxScrollOffset)
            {
                [self setScrollOffset:(scrollOffset + maxScrollOffset) * 0.5 - 1];
            }
            if (scrollOffset < minScrollOffset)
            {
                [self setScrollOffset:(scrollOffset + minScrollOffset) * 0.5 + 1];
            }
        }
        [cards setPosition:ccp(cards.position.x, [self scrollOffset])];
        
        int minVisibleIndex = -(scrollOffset) / cardSpan;
        int maxVisibleIndex = (boxSize - scrollOffset) / cardSpan;
        
        int cnt = 0;
        for (CCSprite* card in cardSprites)
        {
            vis = true;
            
            if ((cnt < minVisibleIndex) || (cnt > maxVisibleIndex))
                vis = false;
            
            [card setVisible:vis];
            
            cnt++;
        }
    }
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
    CCSprite* white = (CCSprite*) [self getChildByTag:TechCardTrayTagWhite];
    
    if (CGRectContainsPoint(white.boundingBox, location))
	{
        touchCurrent =
        touchPrev = 
        touchStart = location;
        offsetAtStart = [self scrollOffset];
        
        touchDown = true;
        
        for (LayerTechCard* cardSprite in cardSprites)
        {
            CGPoint cardLocation = [cardSprite convertTouchToNodeSpace:touch];
            
            if (CGRectContainsPoint([cardSprite childBounds], cardLocation))
            {
                TechCard* card = [cardSprite card];
                
                // Able to select cards from people other than the current player
                if ([card owner] != nil)
                    [[card owner] selectCard:card];
                
                // Fire event...
                [[NSNotificationCenter defaultCenter]
                 postNotificationName:EVENT_ITEM_TOUCHED
                 object:[cardSprite card]];            
                
                return true;
            }
        }
        
        return true;
    }
    
	return false;
}

-(void)ccTouchMoved:(UITouch *)touch withEvent:(UIEvent *)event
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    
	CGPoint location = [self convertTouchToNodeSpace: touch];
    touchPrev = touchCurrent;
    touchCurrent = location;
    
    int offset;
    
    if (layout == TechCardTrayLayoutHoriz)
    {
        offset = offsetAtStart + touchCurrent.x - touchStart.x;
    }
    else
    {
        offset = offsetAtStart + touchCurrent.y - touchStart.y;
    }
    
    [self setScrollOffset:offset];
}

-(void) ccTouchEnded:(UITouch*)touch withEvent:(UIEvent *)event
{
    touchDown = false;
    
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    
	CGPoint location = [self convertTouchToNodeSpace: touch];
    touchPrev = touchCurrent;
    touchCurrent = location;
    
    int offset;
    
     offset = offsetAtStart + touchCurrent.y - touchStart.y;
    
    [self setScrollOffset:offset];
}



@end
