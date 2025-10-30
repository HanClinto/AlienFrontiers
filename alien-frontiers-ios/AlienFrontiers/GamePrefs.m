//
//  GamePrefs.m
//  AlienFrontiers
//
//  Created by Clint Herron on 8/10/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//

#import "GamePrefs.h"
#import "NSData+CocoaDevUsersAdditions.h"

GamePrefs* _instance;

@implementation GamePrefs

-(float) volumeMusic
{
    return volumeMusic;
}

-(void) setVolumeMusic:(float)value
{
    volumeMusic = value;
    [GamePrefs savePrefs];
}

-(float) volumeSfx
{
    return volumeSfx;
}

-(void) setVolumeSfx:(float)value
{
    volumeSfx = value;
    [GamePrefs savePrefs];
}

-(bool) colorBlindMode
{
    return colorBlindMode;
}

-(void) setColorBlindMode:(bool)value
{
    colorBlindMode = value;
    [GamePrefs savePrefs];
}

+(GamePrefs*) instance
{
    if (_instance == nil)
    {
        _instance = [[GamePrefs alloc] init];
        
        _instance->volumeMusic = 1.0f;
        _instance->volumeSfx = 1.0f;
    }
    
    return _instance;
}


+(void) restorePrefs
{
    CCLOG(@"Game loaded from prefs.");
    NSMutableData *compressedData = nil;
    NSUserDefaults *standardUserDefaults = [NSUserDefaults standardUserDefaults];
    
    if (standardUserDefaults) {
        compressedData = [standardUserDefaults objectForKey:@"CompressedGamePrefs"];
    }
    else
    {
        return;
    }
    
    
	NSKeyedUnarchiver *unarchiver;
	// interpret string of XML contents as ISO-8859-1 (NSISOLatin1StringEncoding)
	//NSData *data = [xmlString dataUsingEncoding:NSISOLatin1StringEncoding];
    
	NSData* inflatedData = [compressedData zlibInflate];
	
	CCLOG(@"Restoring preferences of %d bytes (inflated from %d bytes)", [compressedData length], [inflatedData length]);
	
	unarchiver = [[NSKeyedUnarchiver alloc] initForReadingWithData:inflatedData];
	
	// Check version
	int version = [unarchiver decodeIntForKey:@"version"];
	// TODO: Handle failed version properly
	if(version != GAME_PREFS_VERSION) return;
	
	// Decode
	GamePrefs* nextPrefs = [unarchiver decodeObjectForKey:@"prefs"];
	
	// Cleanup
	[unarchiver finishDecoding];
    
    // Set the new preferences to use the restored preferences
    _instance = nextPrefs;
    
    // TODO: Fire a "preferences loaded" event?
}

+(void) savePrefs
{
    CCLOG(@"Preferences saved");
    NSUserDefaults *standardUserDefaults = [NSUserDefaults standardUserDefaults];
	
    if (_instance && standardUserDefaults) {
        // Serialize the game state
        NSData* data = [[GamePrefs instance] serialize];
        
        [standardUserDefaults setObject:data forKey:@"CompressedGamePrefs"];
        [standardUserDefaults synchronize];
    }
}

-(NSData *) serialize
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    
	// Initialize
	NSMutableData *data;
	NSKeyedArchiver *archiver;
	data = [NSMutableData data];
	archiver = [[NSKeyedArchiver alloc] initForWritingWithMutableData:data];
	[archiver setOutputFormat:NSPropertyListBinaryFormat_v1_0];
	
	// Encode
	[archiver encodeInt:GAME_PREFS_VERSION forKey:@"version"];
	CCLOG(@"Encoding game instance.");
	[archiver encodeObject:self forKey:@"prefs"];
	[archiver finishEncoding];
	
	NSData* compressed = [data zlibDeflate];
	
	return compressed;
}


- (void)encodeWithCoder:(NSCoder *)encoder
{
    //	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	[encoder encodeFloat:volumeMusic    forKey:@"volumeMusic"];
	[encoder encodeFloat:volumeSfx      forKey:@"volumeSfx"];
    [encoder encodeBool:colorBlindMode  forKey:@"colorBlindMode"];
}

-(id)initWithCoder:(NSCoder *)decoder
{
    //	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	if ((self = [super init]))
    {
        volumeMusic         = [decoder decodeFloatForKey:@"volumeMusic"];
        volumeSfx           = [decoder decodeFloatForKey:@"volumeSfx"];
        colorBlindMode      = [decoder decodeBoolForKey:@"colorBlindMode"];
	}
	
	return self;
}


@end
