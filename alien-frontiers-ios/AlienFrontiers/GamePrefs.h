//
//  GamePrefs.h
//  AlienFrontiers
//
//  Created by Clint Herron on 8/10/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"

#define GAME_PREFS_VERSION 1

@interface GamePrefs : NSObject <NSCoding> {
    float volumeSfx;
    float volumeMusic;
    bool colorBlindMode;
}

@property (assign) float volumeSfx;
@property (assign) float volumeMusic;
@property (assign) bool colorBlindMode;

+(void)restorePrefs;
+(void)savePrefs;
+(GamePrefs*) instance;

@end
