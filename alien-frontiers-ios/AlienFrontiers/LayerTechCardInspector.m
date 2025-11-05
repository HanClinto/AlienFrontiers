//
//  LayerTechCardPowers.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/24/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerTechCardInspector.h"
#import "SceneGameiPad.h"
#import "GameTouchManager.h"
#import "SelectionQueue.h"
#import "QueuedSelection.h"

#import "SelectRegion.h"
#import "SelectRegionDataCrystal.h"
#import "SelectPlacedColony.h"
#import "SelectShips.h"

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


@implementation LayerTechCardInspector

-(LayerTechCardInspector*) initWithPlayerIndex:(int)index
{
	if ((self = [super init]))
	{        
        playerIndex = index;
        
        CCLabelBMFont *myLabel = [CCLabelBMFont 
                                  labelWithString:@"Fuel = |||\nOre = }}}\nFuel / Ore = ~~~~.\nCard = [.\nFields = \\ OR ] OR ^\nCol = _.\nMB = `.\nBuffer Line" fntFile:@"DIN_Tech_12.fnt" width:200 alignment:UITextAlignmentLeft];
        
        [myLabel setPosition:CGPointMake(-100, 50)];
        
        [self addChild:myLabel z:TechCardInspectorTagPowerLabel tag:TechCardInspectorTagPowerLabel];
        
        CCLOG(@"CC_SPRITESHEET_RENDER_SUBPIXEL == %d", CC_SPRITEBATCHNODE_RENDER_SUBPIXEL);
        //CCLOG(@"CC_COCOSNODE_RENDER_SUBPIXEL == %d", CC_COCOSNODE_RENDER_SUBPIXEL);
        //CCLOG(@"Test == %f, %f", 0.5, RENDER_IN_SUBPIXEL(0.5));
	}
	
	return self;
}

-(void) onEnter
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(itemTouched:) name:EVENT_CARD_SELECTED object:nil];		
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(itemTouched:) name:EVENT_CARD_TAPPED object:nil];		
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(itemTouched:) name:EVENT_ARTIFACT_CARDS_CHANGED object:nil];		
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(itemTouched:) name:EVENT_NEXT_PLAYER object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(itemTouched:) name:EVENT_STATE_RELOAD object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(itemTouched:) name:EVENT_RESOURCES_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(hardRefresh:) name:EVENT_BEGIN_RAID object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(hardRefresh:) name:EVENT_FINISH_RAID object:nil];
    
    [self displayCard:[[[GameState sharedGameState] currentPlayer] selectedCard]];
    
    [super onEnter];
}

-(void) onExit
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];		
    
    [super onExit];
}


-(void) itemTouched:(NSNotification*) notification
{
	id gameItem = [notification object];
	
    if ((gameItem == [GameState sharedGameState]) || 
        ([gameItem isKindOfClass:[TechCard class]]) ||
        ([gameItem isKindOfClass:[Player class]]))
	{
        Player* player;
        
        if (playerIndex == -1) {
            player = [[GameState sharedGameState] currentPlayer];
        }
        else {
            player = [[GameState sharedGameState] playerByID:playerIndex];
        }
        
        [self displayCard:[player selectedCard]];
	}
}

-(void) clearInspection:(NSNotification*) notification
{
	[self displayCard:nil];
}

-(void) hardRefresh:(NSNotification*) notification
{
    [self displayCard:displayingCard];
}


-(void) displayCard:(TechCard*) card
{
    if (displayingCard == card)
    {
        // Check to see if we just gained the ability to use this card.
        CCNode* pwrBtn = [self getChildByTag:TechCardInspectorTagUsePowerButton];
        CCNode* dscBtn = [self getChildByTag:TechCardInspectorTagUseDiscardButton];
        if ((((pwrBtn != nil) != ([card canUsePower])) ||
            ((dscBtn != nil) != ([card canUseDiscard]))) &&
            ([[card owner] isLocalHuman]))
        {
            // Don't return our "use power" button doesn't match with whether or not we can use the power.
        }
        else {
            return;
        }
    }
    
    displayingCard = card;
    
	// First, clean up after any old card that may have been displayed
	CCNode* obj;
	
	obj = [self getChildByTag:TechCardInspectorTagUsePowerButton];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];
	
	obj = [self getChildByTag:TechCardInspectorTagUseDiscardButton];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];

	obj = [self getChildByTag:TechCardInspectorTagOrSeparator];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];

	obj = [self getChildByTag:TechCardInspectorTagPowerImage];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];

	obj = [self getChildByTag:TechCardInspectorTagDiscardImage];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];
		
	obj = [self getChildByTag:TechCardInspectorTagPowerLabel];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];

	obj = [self getChildByTag:TechCardInspectorTagDiscardLabel];
	if (obj != nil) [self removeChild:obj cleanup:TRUE];
	
	// Then, add new stuff for the next card (if applicable)
	if (card != nil)
	{
		CCNode* powerButton = nil;
		CCNode* discardButton = nil;
		
//		CCNode* powerImage = nil;
//		CCNode* discardImage = nil;
		
		int abilityCount = 0;
		
		if (([card hasPower]) || (!([card hasPower]) && !([card hasDiscard])))
		{
			// Add the power image if we have a power ability, or if we have neither (it's just a static card)
			// TODO: Add power images for these cards
//			if ([card powerImage] != nil)
//				powerImage = [CCSprite spriteWithFile:@""];
			
			// Only add the power button if the card has a power, and if we're the current player, and we're not tapped out, and we're human
			if ([card canUsePower] && ([[card owner] isLocalHuman]))
			{
				powerButton = [self buttonFromImage:@"menu_button_68.png" 
                                          downImage:@"menu_button_68_active.png" 
                                           selector:@selector(powerButtonTapped:)
                                              label:NSLocalizedString(@"USE", @"Tech use normal power button label")
                                           fontSize:11
                                          fontColor:ccBLACK];
			}
			abilityCount++;
		}
		if ([card hasDiscard])
		{
			// Add the power image if we have a power ability, or if we have neither (it's just a static card)
			// TODO: Add power images for these cards
			//			CCNode* powerImage = [CCSprite spriteWithFile:@""];
			
			// Only add the discard button if the card has a discard, and if we're the current player, and we're not tapped out, and we're human
			if ([card canUseDiscard] && ([[card owner] isLocalHuman]))
			{
				discardButton = [self buttonFromImage:@"menu_button_68.png" 
											downImage:@"menu_button_68_active.png" 
											 selector:@selector(discardButtonTapped:)
												label:NSLocalizedString(@"DISCARD", @"Tech use discard power button label")
											 fontSize:11
                                            fontColor:ccBLACK];
			}
			abilityCount++;
		}
        
        if (![[card powerText] isEqualToString:@""])
        {
            int width = ([[card discardText] isEqualToString:@""]) ? 324 : 160;
            
            CCLabelBMFont *myLabel = [CCLabelBMFont 
                                      labelWithString:[card powerText]
                                      fntFile:@"DIN_Tech_12.fnt" width:width alignment:UITextAlignmentCenter];
            
			if ([[card discardText] isEqualToString:@""])
				myLabel.position = ccp( 328 * 2 * 0.25, 54 - 28 - 24);
			else
                myLabel.position = ccp( 328 * 1 * 0.25, 54 - 28 - 14 );
            
            [self addChild:myLabel z:TechCardInspectorTagPowerLabel tag:TechCardInspectorTagPowerLabel];
        }

        if (![[card discardText] isEqualToString:@""])
        {
            int width = ([[card powerText] isEqualToString:@""]) ? 324 : 160;
            
            CCLabelBMFont *myLabel = [CCLabelBMFont 
                                      labelWithString:[card discardText]
                                      fntFile:@"DIN_Tech_12.fnt" width:width alignment:UITextAlignmentCenter];
            
			if (![[card powerText] isEqualToString:@""])
				myLabel.position = ccp( 328 * 3 * 0.25, 54 - 28 - 14);
			else
				myLabel.position = ccp( 328 * 2 * 0.25, 54 - 28 - 24);
            
            [self addChild:myLabel z:TechCardInspectorTagDiscardLabel tag:TechCardInspectorTagDiscardLabel];
        }
        
        if ((![[card powerText] isEqualToString:@""]) && (![[card discardText] isEqualToString:@""]))
        {
            CCSprite* orSeparator = [CCSprite spriteWithFile:@"hud_or_bar.png"];
            
            orSeparator.position = ccp( 328 * 0.5, 54 - 28 - 24);
            
            [self addChild:orSeparator z:TechCardInspectorTagOrSeparator tag:TechCardInspectorTagOrSeparator];
        }
		
        
		if (powerButton != nil)
		{
			if (abilityCount == 2)
				powerButton.position = ccp( 328 * 1 * 0.25, 14 - 34);
			else
				powerButton.position = ccp( 328 * 2 * 0.25, 14 - 34);

			[self addChild:powerButton z:TechCardInspectorTagUsePowerButton tag:TechCardInspectorTagUsePowerButton];
			
		}
		
		if (discardButton != nil)
		{
			if (abilityCount == 2)
				discardButton.position = ccp( 328 * 3 * 0.25, 14 - 34);
			else
				discardButton.position = ccp( 328 * 2 * 0.25, 14 - 34);

			[self addChild:discardButton z:TechCardInspectorTagUseDiscardButton tag:TechCardInspectorTagUseDiscardButton];
		}
	}
}

-(void) powerButtonTapped:(NSNotification*) notification
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

	if (displayingCard != nil)
	{
		if ([displayingCard owner] != nil)
		{
			if (![displayingCard tapped] && 
				 [displayingCard hasPower] && 
				 [displayingCard canUsePower])
			{
				GameTouchManager* touchManager = [[SceneGameiPad sharedLayer] touchManager];
				SelectionQueue* queue = nil;
				
				if ([displayingCard isKindOfClass:[BoosterPod class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(usePower:) forObject:displayingCard, 
							 [[SelectShips alloc] initWithCaptionBoosterPod:NSLocalizedString(@"Please select one undocked ship to INCREASE by 1.", @"Booster pod prompt text") ],
							 nil];
				} else if ([displayingCard isKindOfClass:[StasisBeam class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(usePower:) forObject:displayingCard, 
							 [[SelectShips alloc] initWithCaptionStasisBeam:NSLocalizedString(@"Please select one undocked ship to DECREASE by 1.", @"Stasis beam prompt text") ],
							 nil];
				} else if ([displayingCard isKindOfClass:[PolarityDevice class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(usePower:) forObject:displayingCard, 
							 [[SelectShips alloc] initWithCaptionOneUndocked:NSLocalizedString(@"Please select one undocked ship to FLIP to its opposite face.", @"Polarity device prompt text") ],
							 nil];
				} else if ([displayingCard isKindOfClass:[GravityManipulator class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(usePower:toLower:) forObject:displayingCard, 
							 [[SelectShips alloc] initWithCaptionBoosterPod:NSLocalizedString(@"Please select one undocked ship to INCREASE by 1.", @"Booster pod prompt text") ],
							 [[SelectShips alloc] initWithCaptionStasisBeam:NSLocalizedString(@"Please select one undocked ship to DECREASE by 1.", @"Stasis beam prompt text") ],
							 nil];
				} else if ([displayingCard isKindOfClass:[OrbitalTeleporter class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(usePower:) forObject:displayingCard, 
							 [[SelectShips alloc] initWithCaptionTeleporter:NSLocalizedString(@"Please select one docked ship to TELEPORT to another facility.", @"Teleporter prompt text") ],
							 nil];
				} else if ([displayingCard isKindOfClass:[PlasmaCannon class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(usePower:) forObject:displayingCard,
							 [[SelectShips alloc] initWithCaptionPlasmaCannon:NSLocalizedString(@"Please select one or more docked ships to REMOVE.", @"Plasma cannon prompt text") maxQuant:0],
							 nil];
				} else if ([displayingCard isKindOfClass:[TemporalWarper class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(usePower:) forObject:displayingCard, 
							 [[SelectShips alloc] initWithCaptionWarper:NSLocalizedString(@"Please select one or more undocked ships to RE-ROLL.", @"Temporal warper prompt text")],
							 nil];
				} else if ([displayingCard isKindOfClass:[DataCrystal class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(usePower:) forObject:displayingCard, 
							 [[SelectRegionDataCrystal alloc] initWithCaption:NSLocalizedString(@"Please select one occupied region with a power to borrow.", @"Data crystal prompt text")],
							 nil];
				}
                
				if (queue != nil)
					[touchManager queueSelections:queue];
			}
		}
	}
}

-(void) discardButtonTapped:(NSNotification*) notification
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];

	if (displayingCard != nil)
	{
		if ([displayingCard owner] != nil)
		{
			if (![displayingCard tapped] && 
				[displayingCard hasDiscard] && 
				[displayingCard canUseDiscard])
			{
				GameTouchManager* touchManager = [[SceneGameiPad sharedLayer] touchManager];
				SelectionQueue* queue = nil;
				
				if ([displayingCard isKindOfClass:[BoosterPod class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(useDiscard:) forObject:displayingCard, 
							 [[SelectRegion alloc] initWithCaption:NSLocalizedString(@"Please select one region field generator to REMOVE.", @"Booster pod discard prompt text")],
							 nil];
				} else if ([displayingCard isKindOfClass:[DataCrystal class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(useDiscard:) forObject:displayingCard, 
							 [[SelectRegion alloc] initWithCaption:NSLocalizedString(@"Please select one region to place the POSITRON field.", @"Data crystal discard prompt text") notWithField:FIELD_TYPE_POSITRON],
							 nil];
				} else if ([displayingCard isKindOfClass:[GravityManipulator class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(useDiscard:) forObject:displayingCard, 
							 [[SelectRegion alloc] initWithCaption:NSLocalizedString(@"Please select one region to place the REPULSOR field.", @"Gravity manipulator prompt text") notWithField:FIELD_TYPE_REPULSOR],
							 nil];
				} else if ([displayingCard isKindOfClass:[StasisBeam class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(useDiscard:) forObject:displayingCard, 
							 [[SelectRegion alloc] initWithCaption:NSLocalizedString(@"Please select one region to place the ISOLATION field.", @"Stasis beam discard prompt text") notWithField:FIELD_TYPE_REPULSOR],
							 nil];
				} else if ([displayingCard isKindOfClass:[PolarityDevice class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(useDiscard:withColony:) forObject:displayingCard, 
							 [[SelectPlacedColony alloc] initWithCaption:NSLocalizedString(@"Please select the FIRST colony to swap.", @"Polarity device prompt text 1")],
							 [[SelectPlacedColony alloc] initWithCaption:NSLocalizedString(@"Please select the SECOND colony to swap.", @"Polarity device prompt text 2")],
							 nil];
				} else if ([displayingCard isKindOfClass:[OrbitalTeleporter class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(useDiscard:toRegion:) forObject:displayingCard, 
							 [[SelectPlacedColony alloc] initWithCaption:NSLocalizedString(@"Please select the colony to MOVE.", @"Orbital teleporter discard prompt text 1")],
							 [[SelectRegion alloc] initWithCaption:NSLocalizedString(@"Please select the DESTINATION region.", @"Orbital teleporter discard prompt text 2")],
							 nil];
				} else if ([displayingCard isKindOfClass:[PlasmaCannon class]])
				{
					queue = [[SelectionQueue alloc] initWithCallback:@selector(useDiscard:) forObject:displayingCard, 
							 [[SelectShips alloc] initWithCaptionPlasmaCannon:NSLocalizedString(@"Please select one enemy ship to DESTROY.", @"Plasma cannon discard prompt text") maxQuant:1],
//							 [[SelectShips alloc] initWithCaption:@"Please select one docked ships to DESTROY." notFromPlayer:[[GameState sharedGameState] currentPlayer]],
							 nil];
				} else if ([displayingCard isKindOfClass:[TemporalWarper class]])
				{
					// TODO: Be able to pick a card from the discard pile
//					queue = [[SelectionQueue alloc] initWithCallback:@selector(useDiscard:) forObject:displayingCard, 
//							 [[SelectUndockedShips alloc] initWithCaption:@"Please select one or more ships to RE-ROLL."],
//							 nil];
				}
				if (queue != nil)
					[touchManager queueSelections:queue];
			}
		}
	}	
}

@end
