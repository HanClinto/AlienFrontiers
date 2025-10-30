//
//  ShipGroup.h
//  AlienFrontiers
//
//  Created by Clint Herron on 2/1/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Ship.h"
#import "cocos2d.h"

@interface ShipGroup : NSObject <NSCoding> {
	NSMutableArray * array;
    bool sorted;
}

@property(readonly) int count;
@property (strong, readonly) NSArray* array;

+(ShipGroup*)blank;

-(void)push:(Ship*)ship;
-(void)remove:(Ship*)ship;
-(void)clear;
-(ShipGroup*)ofValue:(int)value;
-(ShipGroup*)greaterThanOrEqual:(int)value;
-(ShipGroup*)lessThanOrEqual:(int)value;
-(int)countLessThan:(int)value;
-(int)maxValue;
-(int)minValue;
-(int)sum;
-(int)numOdd;
-(int)numEven;
-(NSArray*) valueSortedArray;
-(void) sort;
@property (readonly) bool isSorted;
-(ShipGroup*)inHand;
-(ShipGroup*)minQuant:(int)num;
-(ShipGroup*) quant:(int)num;
-(ShipGroup*)inStraight;
-(ShipGroup*)inStraightWith:(ShipGroup*)withGroup;
-(ShipGroup*)inStraightWith:(ShipGroup*)withGroup minSum:(int)minSum;
-(bool)hasShip:(Ship*)ship;
-(Ship*) atIndex:(int)index;
-(ShipGroup*) lowestSetOf:(int)num;
-(ShipGroup*) highestSetOf:(int)num;
-(ShipGroup*) nonNativeShips;
-(NSArray*) allPairs;
-(NSArray*) allTriplets;
-(NSArray*) allStraights;

// NOTE: This would be better as "protected", but that doesn't exist in Objective C.
//-(int *) valueCounts;

@property(readonly) int numPermutations;
-(ShipGroup*) permutationByIndex:(int)index;
-(ShipGroup*) uniquePermutationByIndex:(int)index;

-(bool) hasShipRestrictedFrom:(Orbital*)orbital;
-(ShipGroup*) notRestrictedByOrbital:(Orbital*)orbital;

-(int) maxIDFromPlayer:(Player*)player;

@property(readonly) NSString* title;

@end
