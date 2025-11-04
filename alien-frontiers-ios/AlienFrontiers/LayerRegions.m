//
//  LayerRegions.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/12/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerRegions.h"


@implementation LayerRegions


-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
	{
        const int XOFFSET = 1;
        
		// TODO: Do I need touch enabled for sub-layers to receive touch events?
		self.touchEnabled = NO;
		
		hv = [LayerHerbertValley node];
		hv.position = ccp( 235 - 4 + XOFFSET, 635 );
		[self addChild:hv z:RegionsLayerTagHerbertValley
				   tag:RegionsLayerTagHerbertValley];
		
		lb = [LayerLemBadlands node];
		lb.position = ccp( 235 + 75 + XOFFSET, 635 + 103 );
		[self addChild:lb z:RegionsLayerTagLemBadlands
				   tag:RegionsLayerTagLemBadlands];
		
		hp = [LayerHeinleinPlains node];
		hp.position = ccp( 235 + 200 + XOFFSET, 635 + 103 );
		[self addChild:hp z:RegionsLayerTagHeinleinPlains
				   tag:RegionsLayerTagHeinleinPlains];
		
		pf = [LayerPohlFoothills node];
		pf.position = ccp( 235 + 282 + XOFFSET, 635 );
		[self addChild:pf z:RegionsLayerTagPohlFoothills
				   tag:RegionsLayerTagPohlFoothills];
		
		vvm	= [LayerVanVogtMountains node];
		vvm.position = ccp( 235 + 253 + XOFFSET, 635 - 115 );
		[self addChild:vvm z:RegionsLayerTagVanVogtMountains
				   tag:RegionsLayerTagVanVogtMountains];
		
		ac = [LayerAsimovCrater node];
		ac.position = ccp( 235 + 255 - 230 + XOFFSET, 635 - 115 );
		[self addChild:ac z:RegionsLayerTagAsimovCrater
				   tag:RegionsLayerTagAsimovCrater];
		
		bp = [LayerBradburyPlateau node];
		bp.position = ccp( 235 + 138 + XOFFSET, 635 - 166 );
		[self addChild:bp z:RegionsLayerTagBradburyPlateau
				   tag:RegionsLayerTagBradburyPlateau];
		
		bd = [LayerBurroughsDesert node];
		bd.position = ccp( 235 + 138 + XOFFSET, 635 - 166 + 135 );
		[self addChild:bd z:RegionsLayerTagBurroughsDesert
				   tag:RegionsLayerTagBurroughsDesert];
		
		
	}
	return self;
}

-(void) onEnter
{
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(orientationChanged:) name:EVENT_ORIENTATION_CHANGED object:nil];
	
	[super onEnter];
}

-(void) onExit
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[[NSNotificationCenter defaultCenter] removeObserver:self];
    
//	[self removeAllChildrenWithCleanup:true];  // Handled by AFLayer
	
	[super onExit];
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
    
    if (UIDeviceOrientationIsLandscape(deviceOrientation))
	{
		[self setPosition:ccp(54, -196)];
		
	} else if (UIDeviceOrientationIsPortrait(deviceOrientation)){
		[self setPosition:ccp(0,0)];
	}
}

-(LayerBurroughsDesert*) burroughsDesert
{
    return bd;
}



@end
