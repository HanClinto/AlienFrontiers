//
//  TechCardGroup.h
//  AlienFrontiers
//
//  Created by Clint Herron on 5/3/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"

@class TechCard;

@interface TechCardGroup : NSObject <NSCoding> {
	NSMutableArray * array;
}

-(void) shuffle;
@property (readonly) int count;
@property (strong, readonly) NSArray* array;

+(TechCardGroup*)blank;

-(void)pushCard:(TechCard*)card;
-(void)removeCard:(TechCard*)card;
-(TechCard*)pop;
-(void)clear;
-(TechCard*) atIndex:(int)index;
-(TechCard*)cardByID:(int)cardID;

-(bool)hasTechCard:(TechCard*)techCard;
-(bool)hasCardOfType:(Class)techCardType;
-(TechCard*)findCardOfType:(Class)techCardType;

-(void)shuffle;

@property(readonly) NSString* title;

@end
