//
//  SelectionQueued.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/19/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>


@interface QueuedSelection : NSObject {
	NSString* caption;
}

-(id) initWithCaption:(NSString*)cap;

-(bool) canSelect:(NSObject*)touchedObject;

-(void) trySelect:(NSObject*)touchedObject;

-(bool) isSelectionComplete;

-(id) selectedObject;

-(bool) autoAdvance;

@property (strong, readonly) NSString* caption;

@end
