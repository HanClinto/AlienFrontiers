//
//  TouchManager.m
//  AlienFrontiers
//
//  Created by Clint Herron on 3/9/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "GameTouchManager.h"
#import "SceneGameOver.h"

#import "SelectRegion.h"
#import "SelectRaid.h"
#import "GameState.h"
#import "LemBadlands.h"
#import "PlayerTechCardGroup.h"

@implementation GameTouchManager

-(GameTouchManager*) init
{
	if ((self = [super init]))
	{
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(nextPlayer:) name:EVENT_NEXT_PLAYER object:nil];		
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(shipsRolled:) name:EVENT_SHIPS_ROLLED object:nil];		
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(itemTouched:) name:EVENT_ITEM_TOUCHED object:nil];		
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(beginLaunchColony:) name:EVENT_LAUNCH_COLONY object:nil];		
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(gameOver:) name:EVENT_GAME_OVER object:nil];
		
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(beginRaid:) name:EVENT_BEGIN_RAID object:nil];
        
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(queueChanged:) name:EVENT_FINISH_RAID object:nil];

		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(queueChanged:) name:GUI_EVENT_QUEUE_CHANGED object:nil];
		
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(queuedSelectionChanged:) name:GUI_EVENT_QUEUED_SELECTION_CHANGED object:nil];
        
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(nextPlayer:) name:EVENT_STATE_RELOAD object:nil];
        
        [self nextPlayer:nil];
	}
	
	return self;
}

- (void) dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self];
	
}

-(void)nextPlayer:(NSNotification *) notification
{
    if ([[[GameState sharedGameState] currentPlayer] initialRollDone])
        touchState = TOUCH_STATE_PLACE_SHIPS;
    else
        touchState = TOUCH_STATE_WAIT_FOR_ROLL;
}

-(void)shipsRolled:(NSNotification *) notification
{
	touchState = TOUCH_STATE_PLACE_SHIPS;
}

-(void)beginLaunchColony:(NSNotification *) notification
{
    if (![[[GameState sharedGameState] currentPlayer] isLocalHuman])
        return;
    
	SelectionQueue* queue;
	
	queue = [[SelectionQueue alloc] initWithCallback:@selector(finishLaunchColony:) forObject:self, 
			 [[SelectRegion alloc] initWithCaption:NSLocalizedString(@"Please select a region to land your colony", @"Colony landing prompt") notWithField:FIELD_TYPE_REPULSOR],
			 nil];
	
	[self queueSelections:queue];
}


-(void) beginRaid:(NSNotification*)notification
{
    if (![[[GameState sharedGameState] currentPlayer] isLocalHuman])
        return;

	SelectionQueue* queue;
	
	queue = [[SelectionQueue alloc] initWithCallback:@selector(finishRaid:) forObject:self, 
			 [[SelectRaid alloc] initWithCaption:NSLocalizedString(@"Please select resources to raid from opponents", @"Raiding prompt")],
			 nil];
	
	[self queueSelections:queue];
}

-(void) finishRaid:(SelectRaid*)raid
{
    [[[GameState sharedGameState] currentPlayer] finishRaid];
    [self queueChanged:nil];
}

-(void) finishLaunchColony:(Region*)region
{
	int playerIndex = [[GameState sharedGameState] currentPlayer].playerIndex;
	
	[region launchColony:playerIndex];
}

-(void)gameOver:(NSNotification *) notification
{
	touchState = TOUCH_STATE_GAME_OVER;
    
    [TestFlight passCheckpoint:@"GAME_OVER"];
    // After the game is over, clear any saved game.
    [GameState clearGameStateFromPrefs];
}


-(void)itemTouched:(NSNotification *) notification
{
    if (![[[GameState sharedGameState] currentPlayer] isLocalHuman])
        return;
    
    if (touchState == TOUCH_STATE_GAME_OVER)
        return;
    
    
	int itemClass = UNKNOWN_CLASS;
	id gameItem = [notification object];
	Orbital* orbital;
	Ship* ship;
	
	if ([[notification object] isKindOfClass:[Ship class]])
	{
		itemClass = SHIP_CLASS;
	} else if ([[notification object] isKindOfClass:[Orbital class]])
	{
		itemClass = ORBITAL_CLASS;
	} else if ([[notification object] isKindOfClass:[Region class]])
	{
		itemClass = REGION_CLASS;
	}
	
	// TODO: Perhaps integrate this with one of the base game classes?
	
	if (currentQueue != nil)
	{
		if ([currentQueue trySelect:gameItem])
            [[GameState sharedGameState] postEvent:GUI_EVENT_QUEUED_SELECTION_CHANGED object:currentQueue];
	} 
	else {
		switch (touchState) {
			case TOUCH_STATE_WAIT_FOR_ROLL:
				// Nothing other than the roll button can be used here.
				break;
			case TOUCH_STATE_PLACE_SHIPS:
				switch (itemClass) {
					case SHIP_CLASS:
						ship = (Ship*)gameItem;
						
						if ((ship.player == [[GameState sharedGameState] currentPlayer])
							&& (!ship.docked))
						{
							[ship toggleSelect];
						} else if (ship.docked)
						{
							// If we can't select the ship (for various reasons), then try to touch on the orbital where the ship is placed.
							[self touchOrbital:ship.dock.orbital];
						}
						break;
					case ORBITAL_CLASS:
						orbital = (Orbital*)gameItem;
						CCLOG(@"Selected oribtal: %@", orbital);
						
						[self touchOrbital:orbital];
						
						break;
					default:
						break;
				}
				break;
			default:
				break;
		}
	}
}


-(void) touchOrbital:(Orbital*)orbital
{
    if (![[[GameState sharedGameState] currentPlayer] isLocalHuman])
        return;

	
    // If we are already the selected facility
//	if ([[GameState sharedGameState] selectedFacility] == orbital)
	{
		[[GameState sharedGameState] setSelectedFacility:orbital];
        
		CCLOG(@"Attempting to activate orbital...");
		// Then try to place the dice
		[orbital commitShipsFromPlayer: [[GameState sharedGameState] currentPlayer] 
						 selectedShips:[[[GameState sharedGameState] currentPlayer] selectedShips]];
	}
    /*
     else {
		// Otherwise, just select the facility
		[[GameState sharedGameState] setSelectedFacility:orbital];

		// TODO: Highlight the ships that can be used at this point
	}
     */
}

-(void) unselectAll
{
	for (Player* player in [[GameState sharedGameState] players] ) 
	{
		for (Ship* ship in [[player allShips] array])
		{
			if (ship.isSelected)
				ship.isSelected = false;
			
			if (ship.hasPotential)
				ship.hasPotential = false;
		}
	}
	/*
	for (TechCard* card in [[GameState sharedGameState] allTechs])
	{
		if (card.isSelected)
		{
			card.isSelected = false;
		}
	}
	 */
}

-(void) updatePotentialSelections
{
	bool potential;
	
	// Loop through all dice
	for (Player* player in [[GameState sharedGameState] players])
	{
		for (Ship* ship in [[player activeShips] array])
		{
			potential = false;
			if ([self currentSelection] != nil)
			{
				potential = [[self currentSelection] canSelect:ship]; 
			}
			
			[ship setHasPotential:potential];
		}
	}
	
	// Loop through all regions
	for (Region* region in [[GameState sharedGameState] regions])
	{
		potential = false;
		if ([self currentSelection] != nil)
		{
			potential = [[self currentSelection] canSelect:region];
		}
		
		[region setHasPotential:potential];
	}
}

-(void) queueSelections:(SelectionQueue*)queue
{
//	NSAssert(currentQueue == nil);

	currentQueue = queue;
	
	// TODO: Broadcast event to disable buttons?
	[[GameState sharedGameState] postEvent:GUI_EVENT_QUEUE_CHANGED object:queue];
	[[GameState sharedGameState] postEvent:GUI_EVENT_QUEUED_SELECTION_CHANGED object:queue];
}

-(void) cancelQueue
{
	currentQueue = nil;
    [self updatePotentialSelections];
	
	[[GameState sharedGameState] postEvent:GUI_EVENT_QUEUE_CHANGED object:self];
}

-(bool) canUndo
{
    if ([self queueIsActive])
        return ([currentQueue canUndo]);
    
    return false;
}

// Go back one step in the queue (if we can)
-(void) undoQueue
{
    if ([currentQueue canUndo])
    {
        [currentQueue undo];
        
        [self updatePotentialSelections];
    }
}

-(void) queueChanged:(NSNotification*)notification
{
    [self unselectAll];
    
    if (currentQueue == nil)
	{
		return;
	}
    
    if ([[notification name] isEqualToString:EVENT_FINISH_RAID])
        [currentQueue trySelect:nil];
	
    if (currentQueue == nil)
	{
		return;
	}

	if ([currentQueue isCompleted])
	{
		currentQueue = nil;
		[[GameState sharedGameState] postEvent:GUI_EVENT_QUEUED_SELECTION_CHANGED object:self];
	}
}

-(void) queuedSelectionChanged:(NSNotification*)notification
{
//    [self unselectAll];
	[self updatePotentialSelections];
}

-(SelectionQueue*) currentQueue
{
	return currentQueue;
}

-(QueuedSelection*) currentSelection
{
	if (currentQueue == nil)
		return nil;
	
	if ([currentQueue isCompleted])
		return nil;
	
	return [currentQueue currentQueuedSelection];
}

-(bool) queueIsActive
{
	return (currentQueue != nil);
}

-(NSString*) hintText
{
	if (currentQueue == nil)
    {
        /*
        if ([[[GameState sharedGameState] currentPlayer] isAI])
        {
            return [[[GameState sharedGameState] currentPlayer] aiStatus];
        }
         */
		return @"";
    }
	
	return [currentQueue currentHintText];
}


@end
