//
//  SelectRegion.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/26/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SelectRegion.h"


@implementation SelectRegion

-(id) initWithCaption:(NSString *)cap
{
    if ((self = [super initWithCaption:cap]))
	{
        notWithField = 0;
	}
    return self;
}

-(id) initWithCaption:(NSString *)cap notWithField:(int)blockingFieldType
{
    if ((self = [super initWithCaption:cap]))
	{
        notWithField = blockingFieldType;
	}
    return self;
}

-(bool) canSelect:(NSObject *)touchedObject
{
	// Only select regions
	if (![touchedObject isKindOfClass:[Region class]])
		return false;
	
	Region* region = (Region*) touchedObject;
	
	// Only select valid regions
	if (region == nil)
		return false;
	
	// TODO: Make this optional
	// Ignore regions that have the repulsor field (for placing colonies)
    if (((notWithField & FIELD_TYPE_REPULSOR)   && [region hasRepulsorField] )  ||
        ((notWithField & FIELD_TYPE_ISOLATION)  && [region hasIsolationField])  ||
        ((notWithField & FIELD_TYPE_POSITRON)   && [region hasPositronField] ))
		return false;
	
	// Otherwise, then assume we have a valid selection.
	return true;
}

-(void) trySelect:(NSObject*)touchedObject
{
	if ([self canSelect:touchedObject])
	{
		Region* region = (Region*)touchedObject;
		
		// Un-select any old selection if necessary.
		if (selectedRegion != nil)
		{
			if ([selectedRegion isSelected])
			{
				selectedRegion.isSelected = false;
			}
		}
		
		// Select the new region
		selectedRegion = region;
		
		// Update the highlighting for the region (if any)
		region.isSelected = true;
		
	}
}

-(bool) isSelectionComplete
{
	return (selectedRegion != nil);
}

-(id) selectedObject
{
	return selectedRegion;
}

@end
