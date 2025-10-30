//
//  GameSoundManager.m
//  AlienFrontiers
//
//  Created by Clint Herron on 7/31/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//

#import "GameSoundManager.h"
#import "CDXPropertyModifierAction.h"
#import "GameState.h"
#import "GamePrefs.h"

@interface GameSoundManager (PrivateMethods)
-(void) asynchronousSetup;
-(void) preload;
@end

@implementation GameSoundManager

//TODO: modify this method to load the sounds for your game that you want preloaded at start up.
//If you don't preload your sounds there will be a delay before they are played the first time while the sound data
//is loaded to the playback buffer
-(void) preload {
    [soundEngine_ preloadEffect:SFX_YOUR_TURN];
    
	//Preload the background music too but there is no point in preloading multiple background music files so only
	//preload the first one you will play
	[soundEngine_ preloadBackgroundMusic:MUSIC_BACKGROUND];
}

//TODO: modify these parameters to your own taste, e.g you may want a longer fade out or a different type of curve
-(void) fadeOutMusic {
	[CDXPropertyModifierAction fadeBackgroundMusic:2.0f finalVolume:0.0f curveType:kIT_SCurve shouldStop:YES];
}

@synthesize state = state_;
static GameSoundManager *sharedManager = nil;
static BOOL setupHasRun;

+ (GameSoundManager *) sharedManager
{
	@synchronized(self)     {
		if (!sharedManager)
			sharedManager = [[GameSoundManager alloc] init];
		return sharedManager;
	}
	return nil;
}

-(id) init {
	if((self=[super init])) {
		soundEngine_ = nil;
		state_ = kGSUninitialised;
		setupHasRun = NO;
	}
	return self;
}

-(void) setUpAudioManager {
    
	state_ = kGSAudioManagerInitialising;
    
	//Set up the mixer rate for sound engine. This must be done before the audio manager is initialised.
	//For performance Apple recommends having all your samples at the same sample rate and setting the mixer rate to the same value.
	//22050 Hz (CD_SAMPLE_RATE_MID) gives a nice balance between quality, performance and memory usage but you may want to
	//use a higher value for certain applications such as music games.
	[CDSoundEngine setMixerSampleRate:CD_SAMPLE_RATE_MID];
    
	//Initialise audio manager asynchronously as it can take a few seconds
	//The FXPlusMusicIfNoOtherAudio mode will check if the user is playing music and disable background music playback if
	//that is the case.
	[CDAudioManager initAsynchronously:kAMM_FxPlusMusicIfNoOtherAudio];
}

-(void) asynchronousSetup {
    
	[self setUpAudioManager];
    
	//Wait for the audio manager to initialise
	while ([CDAudioManager sharedManagerState] != kAMStateInitialised) {
		[NSThread sleepForTimeInterval:0.1];
	}
    
	state_ = kGSAudioManagerInitialised;
	//Note: although we are using SimpleAudioEngine this is built on top of the shared instance of CDAudioManager.
	//Therefore it is safe to access the shared instance of CDAudioManager if necessary.
	CDAudioManager *audioManager = [CDAudioManager sharedManager];
	if (audioManager.soundEngine == nil || audioManager.soundEngine.functioning == NO) {
		//Something has gone wrong - we have no audio
		state_ = kGSFailed;
	} else {
        
		//If you are using background music you probably want to do this. Basically it makes sure your background music
		//is paused and resumed properly when the application is resigned and resumed. Without it you will find that
		//music you had paused will restart even if you don't want it to or your music will start playing sooner than
		//you want.
		[audioManager setResignBehavior:kAMRBStopPlay autoHandle:YES];
        
		state_ = kGSLoadingSounds;
        
		soundEngine_ = [SimpleAudioEngine sharedEngine];
        
		[self preload];
        
        // Register for events that we'll play sounds for
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(sfxNextPlayer:) name:EVENT_NEXT_PLAYER object:nil];
        
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(sfxLoadState:) name:EVENT_STATE_RELOAD object:nil];
        
        // Generic sounds can be handled with a dictionary
        sounds = [NSDictionary dictionaryWithObjectsAndKeys:
                  SFX_PLASMA_CANNON,    EVENT_USE_PLASMA_CANNON,
                  SFX_PLASMA_CANNON,    EVENT_DISCARD_PLASMA_CANNON,
                  SFX_STASIS_BEAM  ,    EVENT_USE_STASIS_BEAM,
                  SFX_POLARITY_DEVICE,  EVENT_USE_POLARITY_DEVICE,
                  SFX_BOOSTER_POD,      EVENT_USE_BOOSTER_POD,
                  SFX_GRAVITY_MANIP,    EVENT_USE_GRAVITY_MANIPULATOR,
                  SFX_LAND_COLONY,      EVENT_LAUNCH_COLONY,
                  SFX_FLIP_CARD,        EVENT_ARTIFACT_CARDS_CHANGED,
                  SFX_DOCK,             EVENT_SHIPS_DOCKED,
                  SFX_ROLL_DICE,        EVENT_SHIPS_ROLLED,
                  SFX_DIE_SELECTED,     EVENT_SHIP_SELECTED,
                  SFX_TELEPORTER,       EVENT_USE_ORBITAL_TELEPORTER,
                  SFX_BUILD_SHIP,       EVENT_SHIP_ACTIVATE,
                  SFX_GUI_BTN,          GUI_EVENT_BUTTON_CLICK,
                  nil];
        
        
        //  Register for generic sounds
        for (NSString* key in [sounds allKeys])
        {
            [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(sfxPlayGeneric:) name:key object:nil];
        }
        
        for (NSString* val in [sounds allValues])
        {
            [soundEngine_ preloadEffect:val];
        }
        
		state_ = kGSOkay;
        
        [self usePreferences];
	}
}

-(void) usePreferences
{
    [self soundEngine].backgroundMusicVolume = 0.25f * [[GamePrefs instance] volumeMusic];
    [self soundEngine].effectsVolume = [[GamePrefs instance] volumeSfx];
}

-(void) setup {
    
	//Make sure this only runs once
	if (setupHasRun) {
		return;
	} else {
		setupHasRun = YES;
	}
    
	//This code below is just using the NSOperation framework to run the asynchrounousSetup method in another thread.
	//Note: we do not use asynchronous loading to speed up loading, it is done so other things can occur while the loading
	//is happening. For example display a loading screen to the user.
	NSOperationQueue *queue = [NSOperationQueue new];
	NSInvocationOperation *asynchSetupOperation = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(asynchronousSetup) object:nil];
	[queue addOperation:asynchSetupOperation];
}

-(SimpleAudioEngine *) soundEngine {
    
	if (self.state != kGSOkay && self.state != kGSFailed) {
		//The sound engine is still initialising, wait for it to finish up to a max of 10 seconds
		int waitCount = 0;
		while (self.state != kGSOkay && self.state != kGSFailed && waitCount < 100) {
			[NSThread sleepForTimeInterval:0.1];
			waitCount++;
		}
	}
    
	if (self.state == kGSOkay) {
		//We should only use sounds when the state is okay
		return soundEngine_;
	} else {
		//State wasn't okay, so we return nil
		return nil;
	}
}

-(void)sfxLoadState:(NSNotification *) notification
{
    if ([[GameState sharedGameState] soundEventQueue] != nil)
    {
        for (NSString* event in [[GameState sharedGameState] soundEventQueue])
        {
            // NOTE: We delay this call so that sound effects play AFTER the ships are docked.
            [self performSelector:@selector(playEffectFor:) withObject:event afterDelay:0.5f];
//            [self playEffectFor:event];
        }
    }
}


-(void)sfxNextPlayer:(NSNotification *) notification
{
    if (![[[GameState sharedGameState] currentPlayer] isLocalHuman])
        return;

    if ([[GamePrefs instance] volumeSfx] > 0)
        [[self soundEngine] playEffect:SFX_YOUR_TURN];
}

-(void)sfxPlayGeneric:(NSNotification *) notification
{
    [self playEffectFor:[notification name]];
}

-(void)playEffectFor:(NSString*) eventName
{
    NSString* sndName = [sounds objectForKey:eventName];
    if (sndName != nil)
    {
        // Add a half-second delay for ALL sound effects
//        [[self soundEngine] performSelector:@selector(playEffect:) withObject:sndName afterDelay:0.5f];
        if ([[GamePrefs instance] volumeSfx] > 0)
            [[self soundEngine] playEffect:sndName];
    }
}

@end
