//
//  GameSoundManager.h
//  AlienFrontiers
//
//  Created by Clint Herron on 7/31/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//

#import "SimpleAudioEngine.h"

#define MUSIC_BACKGROUND    @"Alien Frontiers_Final.mp3"
#define SFX_ROLL_DICE       @"44061__feegle__dicewood.caf" // @"Dice_Rolling.caf"

// Tech cards
#define SFX_PLASMA_CANNON   @"Laser_Shot.caf"
#define SFX_STASIS_BEAM     @"159399__noirenex__powerdown-1.caf"
#define SFX_POLARITY_DEVICE @"46493__phreaksaccount__shields2.caf"
#define SFX_BOOSTER_POD     @"46492__phreaksaccount__shields1.caf"
#define SFX_GRAVITY_MANIP   @"46494__phreaksaccount__shields3.caf"
#define SFX_TELEPORTER      @"116505__owdeo__trans_short_filt.caf" //@"116505__owdeo__trans_short.caf" // @"158082__erokia__shpeep-2.caf"
#define SFX_BUILD_SHIP      @"156509__primeval-polypod__pneumatic-door.caf"

#define SFX_DATA_CRYSTAL    @".caf";
#define SFX_COLONIST_HUB    @".caf";

#define SFX_LAND_COLONY     @"Landing_Colony.caf"
#define SFX_YOUR_TURN       @"Ping.caf"
#define SFX_FLIP_CARD       @"84322__splashdust__flipcard.caf"

#define SFX_DOCK            @"erokia_fadeout.caf"
#define SFX_DOCK1           @"46489__phreaksaccount__propulsion1.caf"
#define SFX_DOCK2           @"46490__phreaksaccount__propulsion2.caf"
#define SFX_DOCK3           @"46491__phreaksaccount__propulsion3.caf"

#define SFX_DIE_SELECTED    @"35918__altemark__conga.caf" // @"71393__shnur__hh2.caf"

#define SFX_GUI_BTN         @"158135__erokia__high-beep.caf" // http://www.freesound.org/people/Erokia/sounds/158135/

/*
#define SFX_ @"46499__phreaksaccount__waste2.wav"
#define SFX_ @"46500__phreaksaccount__waste3.wav"
*/

#define SOUND_CARD

typedef enum {
	kGSUninitialised,
	kGSAudioManagerInitialising,
	kGSAudioManagerInitialised,
	kGSLoadingSounds,
	kGSOkay,//only use when in this state
	kGSFailed
} tGameSoundState;

@interface GameSoundManager : NSObject {
	tGameSoundState state_;
	SimpleAudioEngine *soundEngine_;
    NSDictionary* sounds;
}

@property (readonly) tGameSoundState state;
@property (readonly) SimpleAudioEngine *soundEngine;

+ (GameSoundManager*) sharedManager;
-(void) setup;
-(void) fadeOutMusic;

-(void) usePreferences;

@end
