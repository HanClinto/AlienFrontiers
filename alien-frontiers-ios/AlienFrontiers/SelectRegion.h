//
//  SelectRegion.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/26/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "QueuedSelection.h"
#import "Region.h"
#import "GameState.h"


@interface SelectRegion : QueuedSelection {
	Region* selectedRegion;
    int notWithField;
}

-(id) initWithCaption:(NSString *)cap notWithField:(int)blockingFieldType;

@end
