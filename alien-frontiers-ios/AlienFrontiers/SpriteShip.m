//
//  SpriteShip.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/13/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SceneGameiPad.h"

#import "GamePrefs.h"

#import "SpriteShip.h"
#import "LayerShips.h"
#import "LayerRegions.h"
#import "LayerOrbitals.h"

@implementation SpriteShip

-(SpriteShip*) initSpriteWithShip:(Ship*)target
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
			
	if ((self = [super init]))
	{
		shipID = target.shipID;
		playerID = target.playerID;
		
//		CCLOG(@"Target player is %@ ( color: %d )", target.player, target.player.color);

//		[self setScaleY:-1];
		
//		[self setFlipY:true];
		
		//[self setScale:-1];
		
		sprite = [[CCSprite alloc] initWithSpriteFrameName:@"wh-0.png"];
		[sprite setPosition:CGPointMake(-96, -124)];
		[self addChild:sprite z:DieLayerTagDieSprite tag:DieLayerTagDieSprite];
		
		
		CCSprite* circleSprite = [[CCSprite alloc] initWithFile:@"die_select.png"];
		[circleSprite setVisible:false];
		[circleSprite setPosition:CGPointMake(-96, -124 + 4)];
		[circleSprite setBlendFunc: (ccBlendFunc) { GL_SRC_ALPHA, GL_ONE }];
		[self addChild:circleSprite z:DieLayerTagCircleSprite tag:DieLayerTagCircleSprite];

		
		CCSprite* glowSprite = [[CCSprite alloc] initWithFile:@"die_glow.png"];
//		[glowSprite setVisible:false];
		[glowSprite setPosition:CGPointMake(-96, -124)];
		[glowSprite setOpacity:0];
        showingPotential = false;

		
		rollingTrayPositionPort = ccp(               630 + (shipID % 4) * 38 - 30, 
                                      92 - 15 - 40 * ((int)(shipID / 4)));
		
		/*
		Roll button: 147, 632
		1024 + 18 - 117, 751 * 0.5
		975, 375
		
		975 + 147, 632 + 375
		
		1122, 1002
		*/
		
//		rollingTrayPositionLand = ccp(1122 + (shipID % 2) * 42 - 30, 1002 - 15 - 40 * ((int)(shipID / 2)));
		rollingTrayPositionLand = ccp(978 + (shipID % 2) * 42 - 30, 676 - 15 - 40 * ((int)(shipID / 2)));

		rollingTrayPosition = rollingTrayPositionPort;
		
		[glowSprite setBlendFunc: (ccBlendFunc) { GL_SRC_ALPHA, GL_ONE }];
		[self addChild:glowSprite z:DieLayerTagGlowSprite tag:DieLayerTagGlowSprite];
		
		[self updateFrame];
        lastRollIndex = [[self ship] rollIndex];
	}
	
	return self;
}

-(void) onEnter
{
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(refreshState:) name:EVENT_STATE_RELOAD object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(diePotential:) name:EVENT_STATE_RELOAD object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(dieRolled:) name:EVENT_SHIP_ROLLED object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(dieRolled:) name:EVENT_SHIP_CHANGED object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(dieSelected:) name:EVENT_SHIP_SELECTED object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(diePotential:) name:EVENT_SHIP_POTENTIAL object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(dieDocked:) name:EVENT_SHIP_DOCK object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(dieDestroyed:) name:EVENT_SHIP_DESTROY object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(dieRolled:) name:EVENT_NEXT_PLAYER object:nil];

	[super onEnter];
}

-(void) onExit
{
    // TODO: Remove all event handlers here?
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    
	[self stopAllActions];

//	[self removeAllChildrenWithCleanup:true]; // Handled by AFLayer
	
	[super onExit];
}


-(void) refreshState:(NSNotification *) notification
{
	[self dieRolled:notification];
	[self dieSelected:notification];
	[self dieDocked:notification];
	
//	CCLOG(@"State reloaded!  Die visual %d:%d in state %@ is value %d", playerID, shipID, [GameState sharedGameState], [self ship].value);
}

-(void) dieChanged:(NSNotification *) notification
{
     
	if (([notification object] != [[self ship] player]) &&
		([notification object] != [self ship]) &&
		([notification object] != [GameState sharedGameState]))
		return;
	
    //	[self updateFrame];
    
    if (lastRollIndex == [[self ship] rollIndex])
        return;
    lastRollIndex = [[self ship] rollIndex];
    
    {
        float outDelay = 0.5;
        float inDelay = 0.5;
        
        CCSequence* seq1 = [CCSequence actions:
                            [CCScaleTo actionWithDuration:outDelay scaleX:1.5 scaleY:1.5],
                            [CCScaleTo actionWithDuration:inDelay scaleX:1 scaleY:1],
                            nil];
        CCSequence* seq2 = [CCSequence actions:
                            [CCFadeOut actionWithDuration:outDelay],
                            [CCCallFunc actionWithTarget:self selector:@selector(updateFrame)],
                            [CCFadeIn actionWithDuration:inDelay],
                            nil];
        
        [sprite runAction:seq1];
        [sprite runAction:seq2];
    }    
}

				  
-(void) dieRolled:(NSNotification *) notification
{
	if (([notification object] != [[self ship] player]) &&
		([notification object] != [self ship]) &&
		([notification object] != [GameState sharedGameState]))
		return;
	
//	CCLOG(@"Die rolled to value %d", [self ship].value);

//	[self updateFrame];

    [sprite setOpacity:[self targetOpacity]];
    
    if (lastRollIndex == [[self ship] rollIndex])
        return;
    lastRollIndex = [[self ship] rollIndex];
    
    {
        float outDelay = 0.5;
        float inDelay = 0.5;
        
        CCSequence* seq1 = [CCSequence actions:
                            [CCScaleTo actionWithDuration:outDelay scaleX:1.5 scaleY:1.5],
                            [CCScaleTo actionWithDuration:inDelay scaleX:1 scaleY:1],
                            nil];
        CCSequence* seq2 = [CCSequence actions:
                            [CCFadeOut actionWithDuration:outDelay],
                            [CCCallFunc actionWithTarget:self selector:@selector(updateFrame)],
                            [CCFadeIn actionWithDuration:inDelay],
                            nil];

        [sprite runAction:seq1];
        [sprite runAction:seq2];
        
        if ([[notification name] isEqualToString:EVENT_SHIP_ROLLED])
        {
            CCSequence* seq3 = [CCSequence actions:
                                [CCDelayTime actionWithDuration:outDelay],
                                [CCRotateTo actionWithDuration:inDelay angle:360*(((arc4random() % 5) + 2) * 2)],
                                nil];

            [sprite runAction:seq3];
        }
    }    
}

-(void) updateFrame
{
	int frame = [self getFrameForValue:[self ship].value];
	//	NSString* frameStr = [NSString stringWithFormat:@"DIE_ROLL_%d.png", frame];
	NSString* frameStr;
	
	if ([self isArtifactShip])
		frameStr = [NSString stringWithFormat:@"wh-%d.png", frame];
	else {
		if ([[[self ship] player] colorIndex] == 0)
		{
			frameStr = [NSString stringWithFormat:@"rd-%d.png", frame];
		}
		else if ([[[self ship] player] colorIndex] == 1)
		{
            if ([[GamePrefs instance] colorBlindMode])
                frameStr = [NSString stringWithFormat:@"gnw-%d.png", frame];
            else
                frameStr = [NSString stringWithFormat:@"gn-%d.png", frame];
		}
		else if ([[[self ship] player] colorIndex] == 2)
		{
			frameStr = [NSString stringWithFormat:@"bl-%d.png", frame];
		}
		else // Assumed 3
		{
			frameStr = [NSString stringWithFormat:@"yl-%d.png", frame];
		}
	}
    

	//self.color = target.player.color;

//	CCLOG(@"Setting frame to %@", frameStr);
	
	[sprite setDisplayFrame:[[CCSpriteFrameCache sharedSpriteFrameCache] spriteFrameByName:frameStr]];
}

-(void) dieDocked:(NSNotification *) notification
{
	if (([notification object] != [[self ship] player]) &&
		([notification object] != [self ship]) &&
		([notification object] != [GameState sharedGameState]))
		return;

//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
//	CCLOG(@"Die docked to dock: %@", [self ship].dock);
	[self glideToTargetPosition];
}

-(void) dieDestroyed:(NSNotification *) notification
{
	if (([notification object] != [[self ship] player]) &&
		([notification object] != [self ship]) &&
		([notification object] != [GameState sharedGameState]))
		return;

//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// TODO: Animate this destruction?  Fade out, or blast it with an explosion?
    if (![self ship].isArtifactShip)
        [self setVisible:[self ship].active];
    
	[self glideToTargetPosition];
}

-(void) glideToTargetPosition
{
	CGPoint pt = [self targetLocation];
	
    // If we're not already on the way to where we're supposed to go...
    if ((currentDest.x != pt.x) || 
        (currentDest.y != pt.y))
    {
        const double totalTimeSpan = 1.2; // The total length of time for the entire animation
        const double scaleTimeSpan = 0.2; // The proportion of the total time used for scaling
        const double fadeTimeSpan = 0.25; // The proportion of the total time used for fading
        const double postScalePreFadeTimeSpan = 0.5 - scaleTimeSpan - fadeTimeSpan;
        const double scaleSize = 1.5;
        const double moveDelaySpan = 0.1; // The proportion of time to delay before / after moving (scaling will occur during this time)
        const double moveTimeSpan = 0.5 - moveDelaySpan;
        const double moveDistance = 0.2; // The distance that the dice move before warping
        
        // Then stop our current animation (if anything)
        [self stopAllActions];
        
        // And move to where we're supposed to go
//        id move = [CCMoveTo actionWithDuration:2 position:pt];
//        id ease = [CCEaseSineInOut actionWithAction:move];
        
        // Track 1 -- scaling
        id biggify = [CCScaleTo actionWithDuration:scaleTimeSpan*totalTimeSpan scaleX:scaleSize scaleY:scaleSize];
        id fadeOut = [CCFadeOut actionWithDuration:fadeTimeSpan*totalTimeSpan];
        id fadeIn  = [CCFadeTo  actionWithDuration:fadeTimeSpan*totalTimeSpan opacity:[self targetOpacity]];
        id scaleDelay = [CCDelayTime actionWithDuration:postScalePreFadeTimeSpan*totalTimeSpan];
        id smallify = [CCScaleTo actionWithDuration:scaleTimeSpan*totalTimeSpan scaleX:1.0 scaleY:1.0];
        
        // Track 2 -- moving
        id moveDelay = [CCDelayTime actionWithDuration:totalTimeSpan*moveDelaySpan];
        

        double deltaX = pt.x - [self position].x;
        double deltaY = pt.y - [self position].y;
        CGPoint pt1 = CGPointMake([self position].x + deltaX * moveDistance, [self position].y + deltaY * moveDistance);
        CGPoint pt2 = CGPointMake(pt.x - deltaX * moveDistance, pt.y - deltaY * moveDistance);
        
        id initialMove = [CCMoveTo actionWithDuration:moveTimeSpan * totalTimeSpan position:pt1];
        id initialMoveEase = [CCEaseSineIn actionWithAction:initialMove];
        id warp = [CCMoveTo actionWithDuration:0 position:pt2];
        id finalMove = [CCMoveTo actionWithDuration:moveTimeSpan * totalTimeSpan position:pt];
        id finalMoveEase = [CCEaseSineOut actionWithAction:finalMove];
        
        id flare = [CCCallFunc actionWithTarget:self selector:@selector(doFlare)];
        
        id scaleTrack = [CCSequence actions:biggify, scaleDelay, flare, fadeOut, fadeIn, flare, scaleDelay, smallify, nil];
        id moveTrack = [CCSequence actions:moveDelay, initialMoveEase, warp, finalMoveEase, nil];
//        id moveTrack = [CCSequence actions:biggify, initialMoveEase, flare, warp, flare, finalMoveEase, smallify, nil];
        
        [sprite runAction:scaleTrack];
        [self runAction:moveTrack];
        
        currentDest = pt;
    }
//	[self setPosition:pt];
}

// Spawn a flare effect underneath this die
-(void) doFlare
{
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_FX_FLARE
     object:self ];
}

-(void) snapToTargetPosition
{
	CGPoint pt = [self targetLocation];
	
    currentDest = pt;
	[self setPosition:pt];
    [sprite setOpacity:[self targetOpacity]];
}

-(GLubyte) targetOpacity
{
    bool trans = false;
    Player* player = [[self ship] player];
    
    if ((player != nil) &&
        ([[GameState sharedGameState] currentPlayer] == player) &&
        (![player initialRollDone]) &&
        ([[self ship] active]) &&
        (![[self ship] docked]))
    {
        trans = true;
    }
    
    if (trans)
    {
        return 0x80;
    }
    else
    {
        return 0xFF;
    }
}

-(CGPoint) targetLocation
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	CGPoint pt;
	
	Ship* ship = [self ship];
	
	if ((!ship.active) || (ship.player == nil))
	{
        if ([self isArtifactShip])
        {
            pt = [[[SceneGameiPad regionsLayer] burroughsDesert] findArtifactDockPosition];
            pt = ccp(pt.x + 26, pt.y);
        }
        else
            pt = ccp(-50, 500);
	} else if (ship.docked) {
		pt = [[SceneGameiPad orbitalsLayer] findPositionByDock:ship.dock];
		pt = ccp(pt.x + 26, pt.y);
	} else {
		// We are undocked -- move to the rolling tray
		
		//		pt = [[SceneGameiPad sharedLayer] rollingTrayPosition];
		//		CCLOG(@"Rolling tray position is %f, %f", pt.x, pt.y);
		//		pt = ccp(300 + shipID * 50, 500 + [[self ship] playerID] * 50);
        UIDeviceOrientation deviceOrientation = [UIDevice currentDevice].orientation;
        
#ifdef IGNORE_LANDSCAPE
        if (UIDeviceOrientationIsLandscape(deviceOrientation))
            deviceOrientation = UIDeviceOrientationUnknown;
#endif
        
		if (UIDeviceOrientationIsLandscape(deviceOrientation))
		{
			rollingTrayPosition = rollingTrayPositionLand;
		}
		else if (UIDeviceOrientationIsPortrait(deviceOrientation))
		{
			rollingTrayPosition = rollingTrayPositionPort;
//			pt = ccp(635 + (shipID % 3) * 42 - 30, 92 - 15 - 40 * ((int)(shipID / 3)));
		}
		
//		pt = ccp(pt.x + (shipID % 3) * 42 - 30, pt.y - 15 - 40 * ((int)(shipID / 3)));
//		pt = ccp(300 + shipID * 50, 500 + [[self ship] playerID] * 50);
		
		pt = rollingTrayPosition;
	}
	
	//	pt = ccp(pt.x - [self contentSize].width, pt.y - [self contentSize].height);
	pt = ccp(pt.x - 13, pt.y + 13);
	
	CGPoint pt2 = [[SceneGameiPad shipsLayer] convertToNodeSpace:pt];
//	CGPoint pt2 = [[self parent] convertToNodeSpace:pt];

//	NSLog(@"Ship location is (%f,%f), transformed point is (%f,%f)", pt.x, pt.y, pt2.x, pt2.y );
	
	
	return pt2;
}


-(void) diePotential:(NSNotification *) notification
{
	if (([notification object] != [[self ship] player]) &&
		([notification object] != [self ship]) &&
		([notification object] != [GameState sharedGameState]))
		return;
	
	CCSprite* glowSprite = (CCSprite*) [self getChildByTag:DieLayerTagGlowSprite];

	bool potential = [self ship].hasPotential;
	
    if (potential == showingPotential)
        return;
    
	if (potential)
	{
		CCFadeIn* fadeIn = [CCFadeTo actionWithDuration:1 opacity:180];
		CCFadeOut* fadeOut = [CCFadeTo actionWithDuration:1 opacity:128];
		CCSequence* seq = [CCSequence actions:fadeIn, fadeOut, nil];
		CCRepeatForever* rep = [CCRepeatForever actionWithAction:seq];
		[glowSprite runAction:rep];
		
//		[sprite setBlendFunc: (ccBlendFunc) { GL_SRC_ALPHA, GL_ONE }];
	}
	else {
		[glowSprite stopAllActions];
		[glowSprite setOpacity:0];

//		[sprite setBlendFunc: (ccBlendFunc) { GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA }];
	}
    showingPotential = potential;

}

-(void) dieSelected:(NSNotification *) notification
{
//	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	if (([notification object] != [[self ship] player]) &&
		([notification object] != [self ship]) &&
		([notification object] != [GameState sharedGameState]))
		return;
	
	CCSprite* circleSprite = (CCSprite*) [self getChildByTag:DieLayerTagCircleSprite];
	
	if (circleSprite == nil) // Flag error?
		return;
	
//	[self stopAllActions];
	
//	CCTintTo* tint;
	
	bool hilight = [self ship].isSelected;
	
	if (hilight)
	{
		[circleSprite setVisible:true];
		
		CCRotateBy* rotateBy = [CCRotateBy actionWithDuration:4 angle:360];
		CCRepeatForever* repeatRotate = [CCRepeatForever actionWithAction:rotateBy];
		[circleSprite runAction:repeatRotate];
		
		
//		tint = [CCTintTo actionWithDuration:0.25 red:255 green:255 blue:255];
//		[sprite setBlendFunc: (ccBlendFunc) { GL_SRC_ALPHA, GL_ONE }];
	}
	else {
		[circleSprite stopAllActions];
//		tint = [CCTintTo actionWithDuration:0.25 red:100 green:100 blue:100];
		//			tint = [CCTintTo actionWithDuration:0.25 red:127 green:127 blue:
//		[sprite setBlendFunc: (ccBlendFunc) { GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA }];
		[circleSprite setVisible:false];
	}
//	[dock runAction:tint];
}

-(int) getFrameForValue:(int)face
{
	if (face >= 1 && face <= 6)
		return face - 1;
	else
		return 0;

	/*
	if (face == 1)
		return 1;
	else if (face == 2)
		return 46;
	else if (face == 3)
		return 8;
	else if (face == 4)
		return 24;
	else if (face == 5)
		return 16;
	else // if (face == 6)
		return 31;      
	 */
}

-(Ship*) ship
{
    if ([self isArtifactShip])
        return [[GameState sharedGameState] artifactShip];
    else
        return [[GameState sharedGameState] shipByPlayer:playerID shipID:shipID];
}

-(CGRect) hitRect
{
	return CGRectInset([sprite boundingBox], -2, -3);
}

-(bool) isArtifactShip
{
    return (shipID == ARTIFACT_SHIP_INDEX);
}

@end
