//
//  LayerTechAADetail.m
//  AlienFrontiers
//
//  Created by Clint Herron on 1/31/12.
//  Copyright (c) 2012 HanClinto Games LLC. All rights reserved.
//

#import "LayerTechAADetail.h"

#import "SceneGameiPad.h"
#import "GameTouchManager.h"
#import "SelectionQueue.h"
#import "QueuedSelection.h"
#import "LayerGameBoard.h"

#import "SelectRegion.h"
#import "SelectRegionDataCrystal.h"
#import "SelectPlacedColony.h"
#import "SelectShips.h"
#import "SelectRaid.h"

#import "TechCard.h"
#import "PohlFoothills.h"

#import "BoosterPod.h"
#import "DataCrystal.h"
#import "GravityManipulator.h"
#import "PlasmaCannon.h"
#import "StasisBeam.h"
#import "TemporalWarper.h"
#import "PolarityDevice.h"
#import "OrbitalTeleporter.h"

@implementation LayerTechAADetail


-(id) init
{
	if ((self = [super init]))
	{
		self.touchEnabled = NO;
      self.visible = NO;
      
      bg = [CCSprite spriteWithFile:@"aa_card_detail_box.png"]; 
      [bg setPosition:ccp(678, 712)];
      [self addChild:bg z:LayerTechAADetailTagBG tag:LayerTechAADetailTagBG];
      
      CGSize winSize = [bg contentSize];
      int halfWinWidth    = winSize.width * 0.5;
      
      takeButton = [self buttonFromImage:@"ondark_button.png" 
                               downImage:@"ondark_button_active.png" 
                           inactiveImage:@"ondark_button_inactive.png"
                                selector:@selector(takeButtonTapped:)
                                   label:@"TAKE"
                                fontSize:11
                               fontColor:ccWHITE];
      [takeButton setPosition:ccp( halfWinWidth, 16 )];
		[bg addChild:takeButton z:LayerTechAADetailTagButtonTake tag:LayerTechAADetailTagButtonTake];
      
#if BG_LAYER_INTENSITY
      backgroundLayer = [CCLayerColor layerWithColor:ccc4(0, 0, 0, 0)];
      [self addChild: backgroundLayer z:LayerTechAADetailTagColorLayer tag:LayerTechAADetailTagColorLayer];
#endif
      
		cardImage = [CCSprite spriteWithFile:@"tech_placeholder.png"];
      
      //		cardImage.opacity = 0;
		
		nameLabel1 = [CCLabelTTF labelWithString:@"Line 1" fontName:@"DIN-Medium" fontSize:12];
      nameLabel1.color = ccWHITE;
      
      nameLabel1.anchorPoint = CGPointMake(0.5f, 1.0f);
      
		
		nameLabel2 = [CCLabelTTF labelWithString:@"Line 2" fontName:@"DIN-Medium" fontSize:12];
      
      nameLabel2.color = ccWHITE;
      
      nameLabel2.anchorPoint = CGPointMake(0.5f, 1.0f);
      
      cardImage.position = ccp( halfWinWidth, winSize.height - 50 + 14 );
      nameLabel1.position = ccp( halfWinWidth, winSize.height - 50 - 13);
      nameLabel2.position = ccp( halfWinWidth, winSize.height - 50 + 14 - 36 -7 +2 );
      
		[bg addChild:cardImage z:LayerTechAADetailTagCardImage tag:LayerTechAADetailTagCardImage];
		[bg addChild:nameLabel1 z:LayerTechAADetailTagNameLabel1 tag:LayerTechAADetailTagNameLabel1];
      [bg addChild:nameLabel2 z:LayerTechAADetailTagNameLabel2 tag:LayerTechAADetailTagNameLabel2];
      
      textTray = [CCSprite spriteWithFile:@"aa_card_background.png"];
      textTray.position = ccp( halfWinWidth, 96 );
      [bg addChild:textTray z:LayerTechAADetailTagTextTray tag:LayerTechAADetailTagTextTray];
      
      backButton = [self buttonFromImage:@"aa_back_button.png" 
                               downImage:@"aa_back_button_active.png" 
                                selector:@selector(backButtonTapped:)];
      backButton.position = ccp( 18, winSize.height - 18 );
      [bg addChild:backButton z:LayerTechAADetailTagButtonBack tag:LayerTechAADetailTagButtonBack];
      
      
      useText = [CCLabelBMFont labelWithString:@"Spend |}~ to move \\ or ] or ^ to `."
                                       fntFile:@"DIN_Tech_12.fnt"
                                         width:[textTray contentSize].width
                                     alignment:UITextAlignmentCenter];
      useText.position = ccp( halfWinWidth, textTray.position.y + [textTray contentSize].height * 0.25);
      useText.anchorPoint = ccp(0.5f, 0.5f);
      [bg addChild:useText z:LayerTechAADetailTagLabelUse tag:LayerTechAADetailTagLabelUse];
      
      discardText = [CCLabelBMFont labelWithString:@"Discard [[ to destroy any one _."
                                           fntFile:@"DIN_Tech_12.fnt" 
                                             width:[textTray contentSize].width
                                         alignment:UITextAlignmentCenter];
      discardText.position = ccp( halfWinWidth, textTray.position.y -5 - [textTray contentSize].height * 0.25);
      discardText.anchorPoint = ccp(0.5f, 0.5f);
      [bg addChild:discardText z:LayerTechAADetailTagLabelDiscard tag:LayerTechAADetailTagLabelDiscard];
      
      orDivider = [CCSprite spriteWithFile:@"aa_OR_bar.png"];
      orDivider.position = ccp( halfWinWidth, textTray.position.y);
      [bg addChild:orDivider z:LayerTechAADetailTagDivider tag:LayerTechAADetailTagDivider];
      
	}
	return self;
}

-(void) onEnter
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(orientationChanged:) name:EVENT_ORIENTATION_CHANGED object:nil];
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
			[self activate:newCard];
		}
	}
}

-(void) activate:(TechCard*) tech
{
//    const float timeScale = 0.5f;
    //NSLog(@"TOUCH ENABLED : @:", [SceneGameiPad gameLayer].isTouchEnabled?@"YES":@"NO");

    /*
    CGSize winSize = [bg contentSize];
    int halfWinWidth    = winSize.width * 0.5;
    int halfWinHeight   = winSize.height * 0.5;
    */
    [[SceneGameiPad sharedLayer] setCurrentModalWindow:ModalWindowAADetail];
    
    targetTech = tech;
    
    CGPoint oldImagePosition = cardImage.position;
    
    [self removeChild:cardImage cleanup:true];
    cardImage = [CCSprite spriteWithFile:[tech imageFilename]];
    [cardImage setPosition:oldImagePosition];
    [bg addChild:cardImage z:LayerTechAADetailTagCardImage tag:LayerTechAADetailTagCardImage];
    
    bool isLocalHuman = ([[[GameState sharedGameState] currentPlayer] isLocalHuman]);
    
    if ([[[GameState sharedGameState] currentPlayer] canPurchaseCard:tech] && isLocalHuman)
    {
        [self enableButton:takeButton];
//        if ([[[GameState sharedGameState] techDisplayDeck] hasTechCard:tech])
    }
    else
    {
        [self disableButton:takeButton];
    }
    
    [nameLabel1 setString:[tech title1]];
    [nameLabel2 setString:[tech title2]];
    
    [useText setString:[tech powerText]];
    
    [discardText setString:[tech discardText]];
    
    if ([[tech discardText] isEqualToString:@""])
    {
        orDivider.visible = false;
        useText.position = ccp( useText.position.x, textTray.position.y);
    }
    else
    {
        orDivider.visible = true;
        useText.position = ccp( useText.position.x, textTray.position.y + [textTray contentSize].height * 0.25);
    }
    
    self.visible = YES;
    self.touchEnabled = YES;

#if BG_LAYER_INTENSITY
    [backgroundLayer setOpacity:0];
    [backgroundLayer runAction:[CCFadeTo actionWithDuration:0.5f opacity:BG_LAYER_INTENSITY]];
    [SceneGameiPad gameLayer].touchEnabled = NO;
#endif
    /*
     [resumeButton setPosition:ccp(-halfWinWidth - resumeButton.contentSize.width * 0.5, winSize.height * 0.5 + 100)];
     CCSequence *resumeButtonSlideIn = [CCEaseElasticInOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: CGPointMake(halfWinWidth, resumeButton.position.y)] period: 0.8f];
     [resumeButton runAction:resumeButtonSlideIn];
     
     [quitButton setPosition:ccp(-halfWinWidth - quitButton.contentSize.width * 0.5, winSize.height * 0.5)];
     CCSequence *quitButtonSlideIn = [CCSequence actions:
     [CCDelayTime actionWithDuration:0.1f],
     [CCEaseElasticInOut actionWithAction: [CCMoveTo actionWithDuration: 0.8f position: CGPointMake(halfWinWidth,quitButton.position.y)] period: 0.8f],
     nil];
     [quitButton runAction:quitButtonSlideIn];
     */
}

-(void) deactivate
{
    [SceneGameiPad gameLayer].touchEnabled = YES;
    self.touchEnabled = NO;
    self.visible = NO;

    [[SceneGameiPad sharedLayer] setCurrentModalWindow:ModalWindowNone];    
}



- (void)orientationChanged:(NSNotification *)notification
{
    [self performSelector:@selector(updateView) withObject:nil afterDelay:0];
}

- (void)updateView
{
    UIDeviceOrientation deviceOrientation = [UIDevice currentDevice].orientation;
    
#ifdef IGNORE_LANDSCAPE
    if (UIDeviceOrientationIsLandscape(deviceOrientation))
        deviceOrientation = UIDeviceOrientationUnknown;
#endif
    
    CGSize s = [[CCDirector sharedDirector] winSize];
    [backgroundLayer setContentSize:s];
    
    if (UIDeviceOrientationIsLandscape(deviceOrientation))
	{
	} else if (UIDeviceOrientationIsPortrait(deviceOrientation)){
        
	}
    
}

-(void) takeButtonTapped:(id)sender
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

	[[[GameState sharedGameState] currentPlayer] purchaseCard:targetTech];
    
    [self deactivate];
}

-(void) backButtonTapped:(id)sender
{
    [self deactivate];
}




-(void) registerWithTouchDispatcher
{
	[[[CCDirector sharedDirector] touchDispatcher] addTargetedDelegate:self priority:INT_MIN swallowsTouches:YES];
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
