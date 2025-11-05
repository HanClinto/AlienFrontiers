//
//  LayerAlienArtifact.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerAlienArtifact.h"
#import "SelectTechCard.h"
#import "SelectionQueue.h"
#import "SceneGameiPad.h"

@implementation LayerAlienArtifact

-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
		//		self.isTouchEnabled = YES;
		
		label1 = [CCLabelTTF labelWithString:NSLocalizedString(@"ALIEN", @"Orbital display name line 1") fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label1.color = ccWHITE;
        label1.opacity = ORBITAL_FONT_OPACITY;
		label1.position = ccp(12,80);
		label1.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label1 z:LayerAATagLabel1 tag:LayerAATagLabel1];
		
		label2 = [CCLabelTTF labelWithString:NSLocalizedString(@"ARTIFACT", @"Orbital display name line 2") fontName:ORBITAL_FONT_NAME fontSize:ORBITAL_FONT_SIZE];
		label2.color = ccWHITE;
		label2.position = ccp(12,67);
        label2.opacity = ORBITAL_FONT_OPACITY;
		label2.anchorPoint = CGPointMake(0, 1.0f);
		[self addChild:label2 z:LayerAATagLabel2 tag:LayerAATagLabel2];
		
		CCSprite* dock;
		int cnt=0;
		for (DockGroup* group in [[self facility] dockGroups])
		{
			dock = [CCSprite spriteWithFile:@"dock_normal.png"];
			
			dock.anchorPoint = CGPointMake(0,0);
			dock.position = ccp(  12 + (cnt % 4) * (dock.contentSize.width + 2), 
								8 - 162);
			[self addChild:dock];
			
			dockPositions[cnt] = dock.position;
			
			[docks addObject:dock];
			cnt++;			
		}
		
		CCSprite* legend = [CCSprite spriteWithFile:@"icons_aa.png"];
		legend.position = ccp( 12, 6 - 162 );
		legend.anchorPoint = CGPointMake(0,1);
		[self addChild:legend];
		
        CCNode* shuffleButton = [self buttonFromImage:@"ondark_button.png" 
                                            downImage:@"ondark_button_active.png"
                                        inactiveImage:@"ondark_button_inactive.png"
                                             selector:@selector(shuffleTapped:)
                                                label:NSLocalizedString(@"CYCLE", @"Tech deck cycling command button label")
                                             fontSize:11
                                            fontColor:ccWHITE];
        
		shuffleButton.position = ccp(55 + 80 - 57, 53 - 22);
//		shuffleButton.position = ccp(55 + 80 - 57 - 40, 53 - 22);
		[self addChild:shuffleButton z:LayerAATagShuffleButton tag:LayerAATagShuffleButton];
        
        /*
        CCNode* discardsButton = [self buttonFromImage:@"ondark_button.png"
                                             downImage:@"ondark_button_active.png"
                                         inactiveImage:@"ondark_button_inactive.png"
                                              selector:@selector(showDiscardsTapped:)
                                                 label:NSLocalizedString(@"0 DISCARDS", @"Tech deck discard numerical label")
                                              fontSize:9
                                             fontColor:ccWHITE];
        
		discardsButton.position = ccp(55 + 80 - 57 + 40, 53 - 22);
		[self addChild:discardsButton z:LayerAATagDiscardsButton tag:LayerAATagDiscardsButton];
        //*/
	}
	return self;
}

-(void) onEnter
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateAll:) name:EVENT_STATE_RELOAD object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateButtons:) name:EVENT_NEXT_PLAYER object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateButtons:) name:EVENT_ARTIFACT_SHUFFLES_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateButtons:) name:EVENT_ARTIFACT_CREDIT_CHANGED object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(showDiscards:) name:EVENT_DISCARD_TEMPORAL_WARPER object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updateCards:) name:EVENT_ARTIFACT_CARDS_CHANGED object:nil];
    
    [self updateCards:nil];
    [self updateButtons:nil];
    
    [super onEnter];
}

-(void) onExit
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    
	// don't forget to call "super dealloc"
	[super onExit];
}

// Override normal orbital touch behavior here to not process clicks on the tech cards as touch events for the orbital
- (BOOL)ccTouchBegan:(UITouch *)touch withEvent:(UIEvent *)event 
{
    if ([[SceneGameiPad sharedLayer] currentModalWindow] != ModalWindowNone)
        return false;
    
	CGPoint location = [self convertTouchToNodeSpace: touch];
	
	if (CGRectContainsPoint(self.childBounds, location))
	{
        // If we're touching any of the cards, then don't fire the orbital touch event.
        CCNode* cardSprite = [self getChildByTag:LayerAATagCard1];
        if (cardSprite != nil) {
            if (CGRectContainsPoint(cardSprite.boundingBox, location))
                return false;
        }
        cardSprite = [self getChildByTag:LayerAATagCard2];
        if (cardSprite != nil) {
            if (CGRectContainsPoint(cardSprite.boundingBox, location))
                return false;
        }
        cardSprite = [self getChildByTag:LayerAATagCard3];
        if (cardSprite != nil) {
            if (CGRectContainsPoint(cardSprite.boundingBox, location))
                return false;
        }

		// Fire event...
		[[NSNotificationCenter defaultCenter]
		 postNotificationName:EVENT_ITEM_TOUCHED
		 object:[self facility]];
        
		//return true;
		return false;
	}
	
	return false;
}

-(Orbital*) facility
{
	return [[GameState sharedGameState] alienArtifact];
}

-(void) updateAll:(NSNotification*) notification
{
	[self updateButtons:notification];
	[self updateCards:notification];
}

-(void) updateButtons:(NSNotification *) notification
{
	CCNode* shuffleButton = [self getChildByTag:LayerAATagShuffleButton];
	
	if ([[[GameState sharedGameState] currentPlayer] canShuffleCards])
	{
        [self enableButton:shuffleButton];
//		shuffleButton.visible = true;
	}
	else {
        [self disableButton:shuffleButton];
//		shuffleButton.visible = false;
	}
    
    /*
    CCNode* discardsButton = [self getChildByTag:LayerAATagDiscardsButton];
    [self setButtonLabel:discardsButton to:<#(NSString *)#>]

     //*/
    /*
	CCNode* takeButton = [self getChildByTag:LayerAATagTakeButton];
     */
	
//	if ([[[GameState sharedGameState] currentPlayer] canPurchaseCard])
//	{
//		takeButton.visible = true;
//	}
//	else {
//		takeButton.visible = false;
//	}
    
}

-(bool) isUpToDate:(NSNotification*) notification
{
    int startIndex = 0;
    TechCardGroup* cards = [[GameState sharedGameState] techDisplayDeck];
    
    if (showingDiscards)
    {
        cards = [[GameState sharedGameState] techDiscardDeck];
        startIndex = showingDiscardsPage * 3; // Show 3 cards per page
    }
    
    for (int cnt = 0; cnt < 3; cnt++)
    {
        LayerTechCard* cardSprite = (LayerTechCard*)[self getChildByTag:LayerAATagCard1 + cnt];
        if (cardSprite != nil) {
            if (!([cards atIndex:(cnt + startIndex)] == [cardSprite card]))
                return false;
        }
        else
        {
            if ([[[GameState sharedGameState] techDisplayDeck] count] >= startIndex + cnt + 1)
                return false;
        }
    }
    
    return true;
}

-(void) updateCards:(NSNotification *) notification
{
    if ([self isUpToDate:notification])
        return;
    
	// Remove all cards
	LayerTechCard* cardSprite = (LayerTechCard*)[self getChildByTag:LayerAATagCard1];
	if (cardSprite != nil) {
		[self removeChild:cardSprite cleanup:true];
	}
	
	cardSprite = (LayerTechCard*)[self getChildByTag:LayerAATagCard2];
	if (cardSprite != nil){
		[self removeChild:cardSprite cleanup:true];
	}
	
	cardSprite = (LayerTechCard*)[self getChildByTag:LayerAATagCard3];
	if (cardSprite != nil) {
		[self removeChild:cardSprite cleanup:true];
	}
	
	// Add all cards
	int cnt = 0;
	CGPoint destPosition;
	CCSequence* cardSlide;
    
    int startIndex = 0;
    TechCardGroup* cards = [[GameState sharedGameState] techDisplayDeck];
    
    if (showingDiscards)
    {
        cards = [[GameState sharedGameState] techDiscardDeck];
        startIndex = showingDiscardsPage * 3; // Show 3 cards per page
    }
	
	NSArray* array = [cards array];
	
    for (cnt = 0; cnt < 3; cnt++)
    {
        if ([array count] <= (cnt + startIndex))
            break;
        
        TechCard* card = array[cnt + startIndex];
        
		cardSprite = [[LayerTechCard alloc] initWithCard:card withLayout:TechCardLayoutTrans];
		cardSprite.position = ccp(30, 10);
        
        [cardSprite setTouchEnabled:true];
		destPosition = ccp(30, -5 - 42 * cnt);
		
		[self addChild:cardSprite z:LayerAATagCard1+cnt tag:LayerAATagCard1+cnt];
		
		cardSlide = [CCSequence actions:
//					 [CCDelayTime actionWithDuration:(0.1f*cnt)],
					 [CCEaseSineIn actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: destPosition]],
					 nil];
		
		[cardSprite runAction:cardSlide];
	}
}

- (void)shuffleTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	// Double check that it's possible
	if ([[[GameState sharedGameState] currentPlayer] canShuffleCards])
	{
		[[[GameState sharedGameState] currentPlayer] shuffleCards];
	}
    
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
}

-(void) showDiscards:(NSNotification*) notification
{
    showingDiscards = true;
    showingDiscardsPage = 0;

    [self updateAll:nil];
}

-(void)showDiscardsTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    
	// Double check that it's possible
    if (!showingDiscards)
    {
        showingDiscards = true;
        showingDiscardsPage = 0;
    }
    else
    {
        showingDiscardsPage++;
        if ([[[GameState sharedGameState] techDiscardDeck] count] < (showingDiscardsPage) * 3)
        {
            showingDiscardsPage = 0;
            showingDiscards = false;
        }
    }
    
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    [self updateAll:nil];
}

/*
- (void)takeTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// Double check that it's possible
	if ([[[GameState sharedGameState] currentPlayer] canPurchaseCard])
	{
		// Initiate a card purchase
		SelectionQueue* queue;
		
		queue = [[SelectionQueue alloc] initWithCallback:@selector(finishTakeCard:) forObject:self, 
				 [[SelectTechCard alloc] initWithCaption:@"Please select a tech card to purchase" selectionType:SELECT_TECH_CARD_TYPE_ARTIFACT],
				 nil];
		
		[[[SceneGameiPad sharedLayer] touchManager] queueSelections:queue];
	}
}

- (void) finishTakeCard:(TechCard*)card
{
	// Finish the card purchase
	[[[GameState sharedGameState] currentPlayer] purchaseCard:card];
}
*/

// Override this so as to not trigger off of the tech card sprites -- they're too large for some reason.
-(CGRect) childBounds
{
	CGRect retVal;
	
	bool first = true;
	
	for (CCSprite *sprite in [self children])
	{
		// HACK: Skip tech cards, because they screw up the orbital selection bounding box.
		if ([sprite isKindOfClass:[LayerTechCard class]])
			continue;
		
		if (first)
			retVal = sprite.boundingBox;
		else
			retVal = CGRectUnion(retVal, sprite.boundingBox);
		
		first = false;
	}
	
	return retVal;
	
}

@end
