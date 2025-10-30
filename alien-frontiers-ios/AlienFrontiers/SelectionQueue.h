//
//  SelectionQueue.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/22/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "QueuedSelection.h"

@interface SelectionQueue : NSObject {
	NSMutableArray* selections;
	SEL callback;
	// TODO: Be careful holding on to this specific callback object here -- are we sure that it will never point to an object in a defunct GameState?
	NSObject* callbackTarget;
	int queueIndex;
	bool isCompleted;
}

-(SelectionQueue*) initWithCallback:(SEL)_callback forObject:_callbackTarget, ...;

-(bool) trySelect:(NSObject*)touchedObject;

-(bool) canAdvance; // If the current selection is ready for advancement
-(bool) isCompleted; // If we are all done entirely with the whole selection, and ready to be removed.

-(void) advance;
-(void) complete;

-(bool) canUndo; // If the current selection can be reversed
-(void) undo;

-(QueuedSelection*) currentQueuedSelection;

-(NSString*) currentHintText;

@end
