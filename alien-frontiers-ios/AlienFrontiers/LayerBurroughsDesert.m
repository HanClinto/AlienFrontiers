//
//  LayerBurroughsDesert.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/17/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerBurroughsDesert.h"
#import "GameState.h"

@implementation LayerBurroughsDesert

-(Region*) region
{
	return [[GameState sharedGameState] burroughsDesert];
}

- (LayerRegion*) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
        dock = [CCSprite spriteWithFile:@"dock_normal.png"];
        
        dock.anchorPoint = CGPointMake(0,0);
        dock.position = ccp( -5, 12);
        [self addChild:dock z:LayerBDTagDock tag:LayerBDTagDock];
        
		purchaseButton = [self buttonFromImage:@"button_long_up.png" 
                                     downImage:@"button_long_down.png" 
                                      selector:@selector(purchaseTapped:)
                                         label:NSLocalizedString(@"PURCHASE", @"Artifact ship purchase button label")
                                      fontSize:12];
		purchaseButton.position = ccp(7,58);
		purchaseButton.visible = false;
		[self addChild:purchaseButton z:LayerBDTagPurchaseButton tag:LayerBDTagPurchaseButton];		
    }
    
    return self;
}

-(void) onEnter
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updatePurchaseButton:) name:EVENT_STATE_RELOAD object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updatePurchaseButton:) name:EVENT_NEXT_PLAYER object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updatePurchaseButton:) name:EVENT_RESOURCES_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updatePurchaseButton:) name:EVENT_COLONIES_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updatePurchaseButton:) name:EVENT_LAUNCH_COLONY object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updatePurchaseButton:) name:EVENT_FIELD_CHANGED object:nil];
    
    [super onEnter];
}

-(void) onExit
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    
    [super onExit];
}

-(void) updatePurchaseButton:(NSNotification *) notification
{
	bool purchasePossible = false;
//	CCNode* purchaseButton = [self getChildByTag:LayerBDTagPurchaseButton];
	
    if ([[[GameState sharedGameState] burroughsDesert] playerCanPurchaseShip:[[GameState sharedGameState] currentPlayer]])
    {
        purchasePossible = true;
    }
	
    purchaseButton.visible = purchasePossible;
}

- (void)purchaseTapped:(id)sender {
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
    GameState* state = [GameState sharedGameState];
    Player* player = [state currentPlayer];
    
    // If this player owns the burroughs desert
    if ([[state burroughsDesert] playerCanPurchaseShip:player])
    {
        [player purchaseArtifactShip];
    }
    
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    [self updatePurchaseButton:nil];
}

-(NSString*) regionTitle
{
	return NSLocalizedString(@"Burroughs Desert", @"Region Title");
}

-(NSString*) bonusFileName
{
	return @"bonus_burroughs.png";
}

-(NSString*) regionBorderFileName
{
	return @"region_center_border.png";
}

-(NSString*) regionOverlayFileName
{
	return @"region_center_overlay.png";
}

-(CGPoint) regionBorderOverlayOffset
{
	return ccp(8,-22);
}

-(CGPoint) findArtifactDockPosition
{
	return [self convertToWorldSpace:[dock position]];
}

-(NSString*) getFilenameFieldIsolation
{
    return @"field_isolator_long.png";
}

-(NSString*) getFilenameFieldPositron
{
    return @"field_positron_long.png";
}

@end
