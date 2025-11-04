//
//  LayerOrbitals.m
//  AlienFrontiers
//
//  Created by Clint Herron on 2/6/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "LayerOrbitals.h"


@implementation LayerOrbitals

-(id) init
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

	if ((self = [super init]))
	{
		self.touchEnabled = NO;
		
		sc = [LayerSolarConverter node];
		sc.position = ccp( 180, 800 );
		[self addChild:sc z:OrbitalsLayerTagSolarConverter 
				        tag:OrbitalsLayerTagSolarConverter];

		sy = [LayerShipyard node];
		sy.position = ccp( 180 - 156, 800 - 365 );
		[self addChild:sy z:OrbitalsLayerTagShipyard 
				        tag:OrbitalsLayerTagShipyard];
		
		lm = [LayerLunarMine node];
//		lm.position = ccp( 180 - 156 + 525, 800 - 365 - 144 );
        lm.position = ccp( 550,325);
		[self addChild:lm z:OrbitalsLayerTagLunarMine 
				        tag:OrbitalsLayerTagLunarMine];
		
		cc = [LayerColonyConstructor node];
		cc.position = ccp( 180 - 156 + 322, 800 - 365 - 144 );
		[self addChild:cc z:OrbitalsLayerTagColonyConstructor 
				        tag:OrbitalsLayerTagColonyConstructor];

		ts = [LayerTerraformingStation node];
		ts.position = ccp( 180 - 156 + 4, 800 - 365 + 268 );
		[self addChild:ts z:OrbitalsLayerTagTerraformingStation 
				        tag:OrbitalsLayerTagTerraformingStation];
		
		ro = [LayerRaidersOutpost node];
//		ro.position = ccp( 180 - 156 + 574, 800 - 365 + 12 );
		ro.position = ccp( 613, 425 );        
		[self addChild:ro z:OrbitalsLayerTagRaidersOutpost 
				        tag:OrbitalsLayerTagRaidersOutpost];
		
		mb = [LayerMaintenanceBay node];
		mb.position = ccp( 180 - 156, 800 - 365 + 268 - 116 );
		[self addChild:mb z:OrbitalsLayerTagMaintenanceBay 
				        tag:OrbitalsLayerTagMaintenanceBay];
		
		ch = [LayerColonistHub node];
		ch.position = ccp( 180 - 156, 800 - 365 - 131 + 10 );
		[self addChild:ch z:OrbitalsLayerTagColonistHub 
				   tag:OrbitalsLayerTagColonistHub];
		
		om = [LayerOrbitalMarket node];
//		om.position = ccp( 180 + 269, 800 + 10 );
		om.position = ccp( 180 + 269, 800 + 25 );
		[self addChild:om z:OrbitalsLayerTagOrbitalMarket
				   tag:OrbitalsLayerTagOrbitalMarket];
		
		aa = [LayerAlienArtifact node];
		aa.position = ccp( 180 + 269 + 152, 800 + 10 - 16);
		[self addChild:aa z:OrbitalsLayerTagAlienArtifact
				   tag:OrbitalsLayerTagAlienArtifact];
		
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
	
	// don't forget to call "super onExit"
	[super onExit];
}

-(CGPoint) findPositionByDock:(DockingBay *)dock
{
	if ([dock.orbital isKindOfClass:[SolarConverter class]])
		return [sc findPositionByDock:dock];
	if ([dock.orbital isKindOfClass:[Shipyard class]])
		return [sy findPositionByDock:dock];
	if ([dock.orbital isKindOfClass:[MaintenanceBay class]])
		return [mb findPositionByDock:dock];
	if ([dock.orbital isKindOfClass:[ColonistHub class]])
		return [ch findPositionByDock:dock];
	if ([dock.orbital isKindOfClass:[ColonyConstructor class]])
		return [cc findPositionByDock:dock];
	if ([dock.orbital isKindOfClass:[LunarMine class]])
		return [lm findPositionByDock:dock];
	if ([dock.orbital isKindOfClass:[RaidersOutpost class]])
		return [ro findPositionByDock:dock];
	if ([dock.orbital isKindOfClass:[AlienArtifact class]])
		return [aa findPositionByDock:dock];
	if ([dock.orbital isKindOfClass:[OrbitalMarket class]])
		return [om findPositionByDock:dock];
	if ([dock.orbital isKindOfClass:[TerraformingStation class]])
		return [ts findPositionByDock:dock];
	
	return ccp(0,0);
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

@end
