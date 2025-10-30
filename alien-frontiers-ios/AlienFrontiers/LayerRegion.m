//
//  LayerRegion.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/13/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerRegion.h"
#import "GameState.h"
#import "SceneGameiPad.h"

@implementation LayerRegion

- (LayerRegion*) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
        const float FIELD_MARGIN_X = 15;
        //const float FIELD_MARGIN_Y = 5;
        
		CCSprite* colonySprite;
		CCLabelTTF* colonyCounter;
        CGPoint loc;
        
//        Scale9Sprite* fieldRepulsor = [[[Scale9Sprite alloc] initWithFile:@"field_filled_50.png" rect:CGRectMake(0,0,80,20) centreRegion:CGRectMake(7,7,66,6)] autorelease];
        
        CCSprite* fieldRepulsor = [CCSprite spriteWithFile:[self getFilenameFieldRepulsor]];
//        [fieldRepulsor setColor:((ccColor3B){255, 62, 255})];
        [fieldRepulsor setVisible:false];
        [self addChild:fieldRepulsor z:-RegionLayerTagFieldRepulsor tag:RegionLayerTagFieldRepulsor];
        
//        Scale9Sprite* fieldIsolation = [[[Scale9Sprite alloc] initWithFile:@"field_filled_50.png" rect:CGRectMake(0,0,80,20) centreRegion:CGRectMake(7,7,66,6)] autorelease];
        CCSprite* fieldIsolation = [CCSprite spriteWithFile:[self getFilenameFieldIsolation]];
//        [fieldIsolation setColor:((ccColor3B){255, 62, 62})];
        [fieldIsolation setVisible:false];
        [self addChild:fieldIsolation z:-RegionLayerTagFieldIsolation tag:RegionLayerTagFieldIsolation];
        
//        Scale9Sprite* fieldPositron = [[[Scale9Sprite alloc] initWithFile:@"field_filled_50.png" rect:CGRectMake(0,0,80,20) centreRegion:CGRectMake(7,7,66,6)] autorelease];
        CCSprite* fieldPositron = [CCSprite spriteWithFile:[self getFilenameFieldPositron]];
//        [fieldPositron setColor:((ccColor3B){62, 255, 62})];
        [fieldPositron setVisible:false];        
        [self addChild:fieldPositron z:-RegionLayerTagFieldPositron tag:RegionLayerTagFieldPositron];

		
        
		CCLabelTTF* regionName = [CCLabelTTF labelWithString:[self regionTitle]
												  //dimensions:CGSizeMake(130,20)
												   //hAlignment:UITextAlignmentCenter
													fontName:REGION_FONT_NAME 
													fontSize:REGION_FONT_SIZE];
        
        regionName.opacity = REGION_FONT_OPACITY;
        
		regionName.position = ccp(-35 + 43, 3 - 4 + 2);
//		regionName.anchorPoint = ccp(0,0);
		[self addChild:regionName 
					 z:-RegionLayerTagTitle 
				   tag:RegionLayerTagTitle];
		
//        float scaleX = ([regionName contentSize].width + FIELD_MARGIN_X) / [fieldPositron contentSize].width;
//        float scaleY = ([regionName contentSize].height + FIELD_MARGIN_Y) / [fieldPositron contentSize].height;
//        [fieldPositron setContentSize:[regionName contentSizeInPixels]];

//        [fieldPositron setScaleX:scaleX];
//        [fieldPositron setScaleY:scaleY];
        
        loc = [regionName position];
        loc.x -= 5;
        loc.y += 1;
        [fieldPositron setPosition:loc];

		if ([self regionTitleUpper] != nil)
		{
			regionName = [CCLabelTTF labelWithString:[self regionTitleUpper]
											fontName:REGION_FONT_NAME 
											fontSize:REGION_FONT_SIZE];
			regionName.position = ccp(-35 + 43, 17 - 4 + 2);
            regionName.opacity = REGION_FONT_OPACITY;
//			regionName.anchorPoint = ccp(0,0);
			[self addChild:regionName 
						 z:-RegionLayerTagTitleUpper 
					   tag:RegionLayerTagTitleUpper];
            
//            [fieldPositron setContentSize:[regionName contentSizeInPixels]];
            
            
//            float newScaleX = ([regionName contentSize].width + FIELD_MARGIN_X) / [fieldPositron contentSize].width;
//
//            if (newScaleX < [fieldPositron scaleX])
//                newScaleX = [fieldPositron scaleX];
//
//            [fieldPositron setScaleX:newScaleX];
//            [fieldPositron setScaleY:2*[fieldPositron scaleY]];
            
            loc = [fieldPositron position];
            loc.y += [regionName contentSize].height - 5;
            [fieldPositron setPosition:loc];
		}
		
		CCSprite* bonusSprite = [CCSprite spriteWithFile:[self bonusFileName]];
		CCLOG(@"Creating legend sprite with file name '%@'", [self bonusFileName]);
		bonusSprite.position = ccp(8,-19);
//		bonusSprite.anchorPoint = ccp(0,0);
		
		[self addChild:bonusSprite
					 z:-RegionLayerTagLegend
				   tag:RegionLayerTagLegend];
        
//        [fieldIsolation setContentSize:[bonusSprite contentSize]];
//        [fieldIsolation setScaleX:([bonusSprite contentSize].width + FIELD_MARGIN_X) / [fieldIsolation contentSize].width];
//        [fieldIsolation setScaleY:(14 + FIELD_MARGIN_Y) / [fieldIsolation contentSize].height];
        
        loc = [bonusSprite position];
        loc.x -= 4;
        [fieldIsolation setPosition:loc];
		
		for (int cnt = 0; cnt < [[GameState sharedGameState] numPlayers]; cnt++)
		{
			switch ([[[GameState sharedGameState] playerByID:cnt] colorIndex]) {
				case 0:
					colonySprite = [CCSprite spriteWithFile:@"colony_red.png"];
					break;
				case 1:
					colonySprite = [CCSprite spriteWithFile:@"colony_green.png"];
					break;
				case 2:
					colonySprite = [CCSprite spriteWithFile:@"colony_blue.png"];
					break;
				case 3:
				default:
					colonySprite = [CCSprite spriteWithFile:@"colony_yellow.png"];
					break;
			}
			colonySprite.anchorPoint = CGPointMake(0, 0);
			colonySprite.position = ccp( ([[GameState sharedGameState] numPlayers] * 0.5 - cnt) * 25, -65 );
			colonySprite.visible = false;
			[self addChild:colonySprite z:-(RegionLayerTagPlayer1Colony + cnt) tag:(RegionLayerTagPlayer1Colony + cnt)];
			
			colonyCounter = [CCLabelTTF labelWithString:@""
										fontName:@"DIN-Black" 
										fontSize:20];
			colonyCounter.color = ccWHITE;
			colonyCounter.anchorPoint = CGPointMake(0, 0);
			colonyCounter.position = ccp( colonySprite.position.x + 15, colonySprite.position.y + 10);
			[self addChild:colonyCounter z:-(RegionLayerTagPlayer1Counter + cnt) tag:(RegionLayerTagPlayer1Counter + cnt)];
		}
        
//        [fieldRepulsor setContentSize:CGSizeMake([[GameState sharedGameState] numPlayers] * 24, 28)];
//        [fieldRepulsor setScaleX:([[GameState sharedGameState] numPlayers] * 25 + FIELD_MARGIN_X) / [fieldRepulsor contentSize].width];
//        [fieldRepulsor setScaleY:32 / [fieldRepulsor contentSize].height];
        [fieldRepulsor setPosition:ccp( FIELD_MARGIN_X * 0.5 + 1 - 4, -44 )];
//        [fieldRepulsor setPosition:ccp( ([[GameState sharedGameState] numPlayers] * 0.5) * 24 - 17, -44 )];
        
		
		CCSprite* overlaySprite = [CCSprite spriteWithFile:[self regionOverlayFileName]];
		overlaySprite.position = [self regionBorderOverlayOffset];
		overlaySprite.rotation = [self regionBorderOverlayRotation];
		overlaySprite.opacity = 63;
		[self addChild:overlaySprite z:-RegionLayerTagOverlay tag:RegionLayerTagOverlay];

		CCSprite* borderSprite = [CCSprite spriteWithFile:[self regionBorderFileName]];
		borderSprite.position = [self regionBorderOverlayOffset];
		borderSprite.rotation = [self regionBorderOverlayRotation];
		[self addChild:borderSprite z:-RegionLayerTagBorder tag:RegionLayerTagBorder];
		
		CCSprite* glowSprite = [CCSprite spriteWithFile:[self regionOverlayFileName]];
		glowSprite.position = [self regionBorderOverlayOffset];
		glowSprite.rotation = [self regionBorderOverlayRotation];
		[glowSprite setOpacity:0];
		[glowSprite setBlendFunc: (ccBlendFunc) { GL_SRC_ALPHA, GL_ONE }];
		[self addChild:glowSprite z:-RegionLayerTagGlow tag:RegionLayerTagGlow];
        
	}
	
	return self;
}

-(void) onEnter
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(colonyLanded:) name:EVENT_STATE_RELOAD object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(regionPotential:) name:EVENT_STATE_RELOAD object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(colonyLanded:) name:EVENT_COLONIES_CHANGED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(colonyLanded:) name:EVENT_REGION_SELECTED object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(regionPotential:) name:EVENT_REGION_POTENTIAL object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(fieldChanged:) name:EVENT_FIELD_CHANGED object:nil];

    // Subscribe for touch events
    self.touchEnabled = true;
    
    [self updateLabels];
    
    [super onEnter];
}

- (void) onExit
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	[[NSNotificationCenter defaultCenter] removeObserver:self];

	self.touchEnabled = false;
	
	[super onExit];
}

-(NSString*) getFilenameFieldRepulsor
{
    switch ([[self region] numPlayersWithColonies]) {
        case 4:
            return @"field_repulsion_fourcolonies.png";
            break;
        case 3:
            return @"field_repulsion_threecolonies.png";
            break;
        case 2:
            return @"field_repulsion_twocolonies.png";
            break;
        case 1:
        default:
            return @"field_repulsion_onecolony.png";
            break;
    }
}

-(NSString*) getFilenameFieldIsolation
{
    return @"field_isolator_medium.png";
}

-(NSString*) getFilenameFieldPositron
{
    return @"field_positron_medium.png";
}

- (void) colonyLanded:(NSNotification *) notification
{
	[self updateLabels];
}


-(void) updateLabels
{
	CCLabelTTF* colonyCounter;
	CCSprite* colonySprite;
	
	int numColonies;
	int activePlayerCounter = 0;
	
	int numPlayersWithColonies = [[self region] numPlayersWithColonies];
	
	for (int cnt = 0; cnt < [[GameState sharedGameState] numPlayers]; cnt++)
	{
		numColonies = [[self region] coloniesForPlayer:cnt];
		colonyCounter = (CCLabelTTF*) [self getChildByTag:(RegionLayerTagPlayer1Counter + cnt)];
		colonySprite = (CCSprite*) [self getChildByTag:(RegionLayerTagPlayer1Colony + cnt)];

		if (numColonies == 0)
		{
			colonySprite.visible = false;
			[colonyCounter setString:@""];
			continue;
		}
		
		activePlayerCounter++;
		
		colonySprite.position = ccp( (numPlayersWithColonies * 0.5 - activePlayerCounter) * 25, -65 );
		colonySprite.visible = true;
		
		colonyCounter.position = ccp( colonySprite.position.x + 15, colonySprite.position.y + 10);
		[colonyCounter setString: [NSString stringWithFormat:@"%d", numColonies]];
	}
	
	// Tint the region
	int majorityPlayer = [[self region] playerWithMajority];
	
	CCSprite* overlay = (CCSprite*) [self getChildByTag:RegionLayerTagOverlay];
	CCSprite* border  = (CCSprite*) [self getChildByTag:RegionLayerTagBorder];
	
	// If noone has the majority...
	if (majorityPlayer < 0)
	{
		overlay.visible = false;
		
		// But we are selected...
		if ([[self region] isSelected])
		{
			border.color = ccc3(0xC8, 0xA3, 0x80);
			border.visible = true;
		}
		// Or people are vying for control...
		else if (numPlayersWithColonies > 0)
		{
			border.color = ccWHITE;
			border.visible = true;
		}
		else {
			border.visible = false;
		}
	}
	else {
        
		if ([[self region] isSelected])
		{
			border.color = ccBLACK;
			border.visible = true;
		} else
        {
			border.visible = false;
		}

		overlay.opacity = 255;
//		[overlay setBlendFunc: (ccBlendFunc) { GL_SRC_ALPHA, GL_ONE }];
//		[overlay setBlendFunc: (ccBlendFunc) { GL_ONE_MINUS_DST_COLOR, GL_DST_COLOR }];
		[overlay setBlendFunc: (ccBlendFunc) { GL_DST_COLOR, GL_ONE_MINUS_SRC_ALPHA }];
//		[overlay setBlendFunc: (ccBlendFunc) { GL_SRC_ALPHA, GL_ONE }];
		overlay.color = [[[GameState sharedGameState] playerByID:majorityPlayer] color];
		overlay.visible = true;
	}
    
    [self fieldChanged:nil];
    
    // field generator:
    /*
    //init the scale 9 sprite with the png resource and a rect that
    //leaves 20 px right, left, top and bottom (the image each corner's radius it's 20px, the //total size 480pxX320px)
    Scale9Sprite * labelBackground = [[[Scale9Sprite alloc] initWithFile:@"description_dialog.png" centreRegion:CGRectMake(20, 20, 440, 280)] autorelease];
    
    //resize the image after will
    [labelBackground setContentSize:CGSizeMake(100, 100)];
    
    //position the image
    [labelBackground setPosition:CGPointMake(50, 50)];
    
    //add it to parent
    [dialogs addChild:labelBackground];
     */

}


-(void) regionPotential:(NSNotification *) notification
{
	if (([notification object] != [self region]) &&
		([notification object] != [GameState sharedGameState]))
		return;
	
	CCSprite* glowSprite = (CCSprite*) [self getChildByTag:RegionLayerTagGlow];
	
	bool potential = [self region].hasPotential;
	
	if (potential)
	{
		CCFadeIn* fadeIn = [CCFadeTo actionWithDuration:1 opacity:144];
		CCFadeOut* fadeOut = [CCFadeTo actionWithDuration:1 opacity:96];
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
}

-(void) fieldChanged:(NSNotification *) notification
{
    CCSprite* fieldSprite;
    bool visible;
    
    fieldSprite = (CCSprite*)[self getChildByTag:RegionLayerTagFieldRepulsor];
    visible = [[self region] hasRepulsorField];
    if ([fieldSprite visible] == false && visible == true)
    {
        // If we weren't visible before, but we are now
        CGPoint loc = [fieldSprite position];
        [self removeChild:fieldSprite cleanup:true];
        
        //[fieldSprite setTexture:[[CCTextureCache sharedTextureCache] addImage:[self getFilenameFieldRepulsor]]];

        // HACK: Remove the sprite and re-add it.  Setting the texture doesn't seem to work for some reason.
        fieldSprite = [CCSprite spriteWithFile:[self getFilenameFieldRepulsor]];
        [fieldSprite setPosition:loc];
        [fieldSprite setVisible:false];
        [self addChild:fieldSprite z:-RegionLayerTagFieldRepulsor tag:RegionLayerTagFieldRepulsor];
    }
    [fieldSprite setVisible:visible];
    
    fieldSprite = (CCSprite*)[self getChildByTag:RegionLayerTagFieldPositron];
    [fieldSprite setVisible:[[self region] hasPositronField]];
    
    fieldSprite = (CCSprite*)[self getChildByTag:RegionLayerTagFieldIsolation];
    [fieldSprite setVisible:[[self region] hasIsolationField]];
}

-(void) registerWithTouchDispatcher
{
	[[[CCDirector sharedDirector] touchDispatcher] addTargetedDelegate:self priority:-1 swallowsTouches:YES];
}

- (BOOL)ccTouchBegan:(UITouch *)touch withEvent:(UIEvent *)event 
{
    if ([[SceneGameiPad sharedLayer] currentModalWindow] != ModalWindowNone)
        return false;
    
	CGPoint location = [self convertTouchToNodeSpace: touch];
	
	CCSprite* colonySprite;
	
	for (int cnt = 0; cnt < [[GameState sharedGameState] numPlayers]; cnt++)
	{
		colonySprite = (CCSprite*) [self getChildByTag:RegionLayerTagPlayer1Colony + cnt];
		
		if ([colonySprite visible])
		{
			if (CGRectContainsPoint([colonySprite boundingBox], location))
			{
				// Then register as a touch on the player.
				[[NSNotificationCenter defaultCenter]
				 postNotificationName:EVENT_ITEM_TOUCHED
				 object:[[GameState sharedGameState] playerByID:cnt]];
				
				//return true;
				return false;
			}
		}
	}
	
	return false;
}

-(void) ccTouchEnded:(UITouch*)touch withEvent:(UIEvent *)event
{
	
}

-(Region*) region
{
	return nil;
}

-(NSString*) regionTitleUpper
{
	return nil;
}

-(NSString*) regionTitle
{
	return @"";
}

-(NSString*) bonusFileName
{
	return nil;
}

-(NSString*) regionBorderFileName
{
	return @"region_edge_border.png";
}

-(NSString*) regionOverlayFileName
{
	return @"region_edge_overlay.png";
}

-(CGPoint) regionBorderOverlayOffset
{
	return ccp(0,0);
}

-(float) regionBorderOverlayRotation
{
	return 0; // -2 * (2 * 3.14159 / 7);
}

@end
