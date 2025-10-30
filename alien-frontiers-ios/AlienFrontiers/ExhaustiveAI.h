//
//  ExhaustiveAI.h
//  AlienFrontiers
//
//  Created by Clint Herron on 9/10/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "AIPlayer.h"

#define AI_VALUE_WIN 1000 // Winning is worth everything

#define AI_FLAG_USED_SOLAR          (0x01 << 0)
#define AI_FLAG_USED_LUNAR_MINE     (0x01 << 1)
#define AI_FLAG_USED_COLONIST_HUB   (0x01 << 2)
#define AI_FLAG_USED_ARTIFACT       (0x01 << 3)
#define AI_FLAG_USED_MARKET         (0x01 << 4)
#define AI_FLAG_USED_TELEPORTER     (0x01 << 5)
#define AI_FLAG_USED_CANNON         (0x01 << 6)
#define AI_FLAG_USED_CRYSTAL        (0x01 << 7)
#define AI_FLAG_USED_RAIDERS_OUTPOST (0x01 << 8)

#define AI_VALUE_HAS_UNDOCKED_SHIPS  3

@interface ExhaustiveAI : AIPlayer
{
    NSThread* thinkingThread;
    dispatch_queue_t thinkingQueue;
    NSSet* seenStates;
    double progress;
    int numOptionNodes;
    bool outtaTime;
    
    // PERSONALITY VALUES
    float AI_VALUE_TIME; // The maximum amount of time to spend looking for a move
    
    float AI_VALUE_HUMAN_PREJUDICE;
    
    float AI_VALUE_SHIP;
    float AI_VALUE_SHIP_PER_TURN;
    float AI_VALUE_FUEL;
    float AI_VALUE_ORE;
    float AI_VALUE_COLONY;
    float AI_VALUE_VP;
    float AI_VALUE_COLONIST_HUB_NOTCH;
    float AI_VALUE_LUNAR_MINE_MAX;
    float AI_VALUE_ARTIFACT_SHIP_LIABILITY;
    
    float AI_VALUE_UNUSED_PIP;
    
    float AI_VALUE_AGGRESSION;
    
    // ALIEN TECH
    float AI_VALUE_TECH;
    float AI_VALUE_TECH_PER_TURN;
    float AI_VALUE_TECH_VP;
    float AI_VALUE_TECH_ANY_DIE_MANIP;
    float AI_VALUE_TECH_BOOSTER;
    float AI_VALUE_TECH_STASIS;
    float AI_VALUE_TECH_POLARITY;
    float AI_VALUE_TECH_TELE;
    float AI_VALUE_TECH_PLASMA;
    float AI_VALUE_TECH_DATA;
    float AI_VALUE_TECH_DECOY;
    float AI_VALUE_TECH_GRAVITY;
    float AI_VALUE_TECH_CACHE;
    float AI_VALUE_TECH_WARPER;
    
    // PLANETARY REGIONS
    float AI_VALUE_REGION_HEINLEIN;
    float AI_VALUE_REGION_POHL;
    float AI_VALUE_REGION_VAN_VOGT;
    float AI_VALUE_REGION_BRADBURY;
    float AI_VALUE_REGION_ASIMOV;
    float AI_VALUE_REGION_HERBERT;
    float AI_VALUE_REGION_LEM;
    float AI_VALUE_REGION_BURROUGHS;
    
    int AI_VALUE_RANDOM;  // Used for hindering the AI and making it make less-than-optimal choices
    
    NSString* statusText;
}

-(float) baseValueForPlayer:(Player*)player;
-(float) totalValueForPlayer:(Player*)player;

-(int) fillChildGameStates:(Player*)player toDepth:(int)targetDepth until:(uint64_t)targetTime;
-(void) fillChildGameStates:(Player*)player;

-(int) fillChildGameStatesBreadthFirst:(Player*)player toDepth:(int)targetDepth until:(uint64_t)targetTime;
-(int) estNumTurnsLeft:(GameState*)state;

-(GameState*) getHighestChild:(Player*)player;
-(void) dump:(Player*) player trackDepth:(int)depth;
-(float) getMaxChildValueForPlayer:(Player*)player trackDepth:(int) depth;


@end
