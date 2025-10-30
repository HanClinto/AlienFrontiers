//
//  SelectionQueued.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/19/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "QueuedSelection.h"


@implementation QueuedSelection

-(id) initWithCaption:(NSString*)cap
{
	if ((self = [super init]))
	{
		caption = cap;
	}
	
	return self;
}

-(bool) canSelect:(NSObject*)touchedObject
{
	return false;
}

-(void) trySelect:(NSObject*)touchedObject
{
}

-(NSString*) caption
{
	return caption;
}

-(bool) isSelectionComplete
{
	return true;
}

// Do we need to click "next" or "ok" to continue past this selection? (needed especially for multi-select choices, such as Temporal Warper)
-(bool) autoAdvance
{
	return true;
}

-(NSObject*) selectedObject
{
	// TODO: We should NEVER run this code
	return nil;
}

@end
