//
//  SelectionQueue.m
//  AlienFrontiers
//
//  Created by Clint Herron on 5/22/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "SelectionQueue.h"
#import "GameState.h"

@implementation SelectionQueue

-(SelectionQueue*) initWithCallback:(SEL)_callback forObject:_callbackTarget, ...
{
	if ((self = [super init]))
	{
		callback = _callback;
		callbackTarget = _callbackTarget;
		
		// Process varargs
		va_list argumentList;
		QueuedSelection* selection;
		
		selections = [[NSMutableArray alloc] init];
		
		va_start(argumentList, _callbackTarget); // Start scanning for arguments after _callbackTarget.
		while ((selection = va_arg(argumentList, QueuedSelection*))) // As many times as we can get an argument of type "QueuedSelection*"
		{
			[selections addObject:selection]; // that isn't nil, add it to self's contents.
		}
		va_end(argumentList);
	}
	
	return self;
}

-(bool) trySelect:(NSObject*)touchedObject
{
	QueuedSelection* sel = [self currentQueuedSelection];
	
	// NSAssert(sel != nil);
	
//    bool can = [sel canSelect:touchedObject];
    
	[sel trySelect:touchedObject];
	
	if ([sel isSelectionComplete])
	{
		// Try to auto-complete our selection
		if ([sel autoAdvance])
		{
			// If we don't need to prompt to continue, then we can just advance right now.
			[self advance];
		}
	}
    
    return true;
}

-(bool) canAdvance
{
	QueuedSelection* sel = [self currentQueuedSelection];
	
	return ([sel isSelectionComplete]);
}

-(void) advance
{
	QueuedSelection* sel = [self currentQueuedSelection];

	if ([sel isSelectionComplete])
	{
		queueIndex += 1;
		
		if (queueIndex == [selections count])
		{
			[self complete];
		} else {
			[[GameState sharedGameState] postEvent:GUI_EVENT_QUEUED_SELECTION_CHANGED object:self];
		}
	}
}

-(bool) canUndo
{
    if (queueIndex > 0)
        return true;
    
    return false;
}

-(void) undo
{
    if ([self canUndo])
    {
        queueIndex--;
        [[GameState sharedGameState] postEvent:GUI_EVENT_QUEUED_SELECTION_CHANGED object:self];
        [[GameState sharedGameState] postEvent:GUI_EVENT_QUEUE_CHANGED object:self];
    }
}

-(bool) isCompleted
{
	return isCompleted;
}

-(void) complete
{
	// Note that we are assuming that callbackTarget belongs to the callback selector
	NSMethodSignature *sig = [[callbackTarget class] instanceMethodSignatureForSelector:callback];
	NSInvocation *inv = [NSInvocation invocationWithMethodSignature:sig];

	[inv setSelector:callback];
	[inv setTarget:callbackTarget];

	
	for (int cnt = 0; cnt < [selections count]; cnt++)
	{
		QueuedSelection* selection = (QueuedSelection*) [selections objectAtIndex:cnt];
        // TODO: Can we figure out a better way to do this other than using __unsafe_unretained?
		__unsafe_unretained id selectedObject = [selection selectedObject];
		// NSAssert (selection != nil);
		
		// Note that self & _cmd are at indices 0 & 1, respectively, so add 2 to the index of each argument
		[inv setArgument:&selectedObject atIndex:cnt + 2];
	}

	// Now that all of our arguments are set, we make our callback.
	[inv invoke];

	// We're now finished
	isCompleted = true;
	
	// And alert that we have changed our final state.
	[[GameState sharedGameState] postEvent:GUI_EVENT_QUEUE_CHANGED object:self];
}

-(QueuedSelection*) currentQueuedSelection
{
	QueuedSelection* sel = nil;
	
	// TODO: Assert that our queue index is in range
	if (queueIndex < [selections count])
		sel = (QueuedSelection*) [selections objectAtIndex:queueIndex];
	
	return sel;
}

-(NSString*) currentHintText
{
	QueuedSelection* sel = [self currentQueuedSelection];
	
    if (sel)
        return [sel caption];
    else
        return @"";
}

@end
