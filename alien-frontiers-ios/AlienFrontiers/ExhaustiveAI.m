//
//  ExhaustiveAI.m
//  AlienFrontiers
//
//  Created by Clint Herron on 9/10/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "ExhaustiveAI.h"

#import "GameState.h"
#import "Player.h"
#import "ColonistHub.h"
#import "ColonyConstructor.h"
#import "Shipyard.h"
#import "AlienArtifact.h"
#import "OrbitalMarket.h"
#import "MaintenanceBay.h"

#import "TechCard.h"
#import "TechCardGroup.h"
#import "PlayerTechCardGroup.h"
#import "AlienCity.h"
#import "AlienMonument.h"
#import "BoosterPod.h"
#import "DataCrystal.h"
#import "PlasmaCannon.h"
#import "ResourceCache.h"
#import "StasisBeam.h"
#import "GravityManipulator.h"
#import "TemporalWarper.h"
#import "PolarityDevice.h"
#import "OrbitalTeleporter.h"
#import "HolographicDecoy.h"

#import "HeinleinPlains.h"
#import "PohlFoothills.h"
#import "VanVogtMountains.h"
#import "BradburyPlateau.h"
#import "AsimovCrater.h"
#import "HerbertValley.h"
#import "LemBadlands.h"
#import "BurroughsDesert.h"

#import "TerraformingStation.h"
#import "SolarConverter.h"
#import "LunarMine.h"
#import "RaidersOutpost.h"

#import <mach/mach.h>
#import <mach/mach_time.h>

#import "CodeTimestamps.h"

@implementation ExhaustiveAI

static ExhaustiveAI* sharedExhaustiveAI = nil;

+ (void)initialize
{
    static BOOL initialized = NO;
    
    if(!initialized)
    {
        initialized = YES;
        sharedExhaustiveAI = [[ExhaustiveAI alloc] init];
    }
}

+(AIPlayer*) shared
{
    return sharedExhaustiveAI;
}

-(void) setPersonality:(int) personality
{
    AI_VALUE_TIME = 5.9; // The maximum amount of time (in seconds) to think about a move.
    
    AI_VALUE_HUMAN_PREJUDICE = 1.0; // The amount that the AI hates humans above its computer brethren.
    
    AI_VALUE_SHIP = 11;  // 2 dice + 3 ore + 3 fuel = 7.5
    AI_VALUE_SHIP_PER_TURN = 0.25;  // Value PER TURN ESTIMATED LEFT IN THE GAME
    AI_VALUE_FUEL = 0.30; // 0.35
    AI_VALUE_ORE = 0.9; // 1.5
    AI_VALUE_COLONY = 12;
    AI_VALUE_VP = 1;
    AI_VALUE_COLONIST_HUB_NOTCH = 1;
    AI_VALUE_LUNAR_MINE_MAX = 0.05; // The value of each pip on the max die on the lunar mine -- so if this value is 0.05, then the value of a 6 is 0.3, while the value of a 5 is 0.25.  This lets the AI with -- all other things being equal -- favor leaving higher dice on the Lunar Mine for other players.
    AI_VALUE_ARTIFACT_SHIP_LIABILITY = -4; // The value of the artifact ship is this much less than a normal ship due to its ease of loss
    
    AI_VALUE_UNUSED_PIP = 0.01; // The value of each pip on an unused die
    
    AI_VALUE_AGGRESSION = 0.5; // 0.9 // Negative points for other players is not quite the same as positive points for you.  Even so, this gives some added impetus to raid and hurt others.
    
    // ALIEN TECH
    AI_VALUE_TECH = -0.25; // 0.25 // The base value of each tech card
    AI_VALUE_TECH_PER_TURN = 0.1; // Value PER TURN ESTIMATED LEFT IN THE GAME
    AI_VALUE_TECH_VP = -1; // Liability in having this VP in a card, since it's easier to steal.
    AI_VALUE_TECH_ANY_DIE_MANIP = 1.0; // The base value of having at least one die manipulation card ( Booster, Stasis, Polarity )
    AI_VALUE_TECH_BOOSTER = 0.75; // Booster pod is fantastic
    AI_VALUE_TECH_STASIS  = 0.5; // Stasis beam is fantastic
    AI_VALUE_TECH_POLARITY = 1.0; // One of the best cards
    AI_VALUE_TECH_TELE    = 1.5; // Teleporter is good
    AI_VALUE_TECH_PLASMA  = 1.5; // Very good card
    AI_VALUE_TECH_DATA    = 1.5; // Data crystal is great
    AI_VALUE_TECH_DECOY   = 1.5; // Very important now that raiding is in place
    AI_VALUE_TECH_GRAVITY = 0.25; // Manipulator is weak
    AI_VALUE_TECH_CACHE   = ((AI_VALUE_ORE + AI_VALUE_FUEL) * 0.25); // Value PER TURN LEFT -- assume it's worth half of a resource per turn left in the game.  
    AI_VALUE_TECH_WARPER  = -0.5; // Very lame card
    
    // PLANETARY REGIONS
    AI_VALUE_REGION_HEINLEIN    = (0.1 * (AI_VALUE_ORE - AI_VALUE_FUEL)); // Value PER TURN LEFT
    AI_VALUE_REGION_POHL        = (0.3 * AI_VALUE_FUEL); // Value PER CARD, PER TURN LEFT (TODO: Make this only per card w/ fuel cost)
    AI_VALUE_REGION_VAN_VOGT    = (0.3 * AI_VALUE_ORE); // Value PER TURN LEFT
    AI_VALUE_REGION_BRADBURY    = (0.25 * AI_VALUE_ORE); // Value PER UNLAUNCHED COLONY
    AI_VALUE_REGION_ASIMOV      = (0.3 * AI_VALUE_COLONIST_HUB_NOTCH); // Value PER TURN LEFT
    AI_VALUE_REGION_HERBERT     = (0.9 * (AI_VALUE_FUEL + AI_VALUE_ORE)); // Value PER UNBUILT SHIP
    AI_VALUE_REGION_LEM         = (0.9 * AI_VALUE_FUEL); // Value PER TURN LEFT
    AI_VALUE_REGION_BURROUGHS   = (0.15 * ((AI_VALUE_SHIP + AI_VALUE_ARTIFACT_SHIP_LIABILITY) - AI_VALUE_ORE - AI_VALUE_FUEL));
    
    AI_VALUE_RANDOM = 0; // Higher values make the AI less rational
    
    switch (personality) {
        case AI_TYPE_EASY:
            AI_VALUE_TIME = 3 * 1.5 - 0.1;
            AI_VALUE_AGGRESSION = 0.1;
            AI_VALUE_TECH = -0.25;
            AI_VALUE_RANDOM = 2;
            break;
        case AI_TYPE_MEDIUM:
            AI_VALUE_TIME = 3 * 1.5 - 0.1;
            AI_VALUE_AGGRESSION = 0.3;
            AI_VALUE_TECH = 0.1;
            AI_VALUE_RANDOM = 1;
            break;
        case AI_TYPE_HARD:
            AI_VALUE_TIME = 5 * 1.5 - 0.1;
            AI_VALUE_AGGRESSION = 0.5;
            break;
        case AI_TYPE_PIRATE:
            AI_VALUE_TIME = 5 * 1.5 - 0.1;
            AI_VALUE_AGGRESSION = 0.9;
            AI_VALUE_HUMAN_PREJUDICE = 1.5; // When searching for the greatest "threat", consider the humans as doing this much better than they actually are.
            break;
        default:
            break;
    }
    
    currentPersonality = personality;
    // HACK: This should probably be set in the initializer
    statusText = @"";
}


-(void) step:(Player*)player
{
    if (currentPersonality != [player aiType])
        [self setPersonality:[player aiType]];
    
    if (![player initialRollDone])
    {
        statusText = @"Let's roll!";
        [[GameState sharedGameState] postEvent:EVENT_AI_TICK object:self];
        
        [player rollShips];
//        return;
    }

    // Or haven't even started thinking...
    if (![self isThinkingStarted])
    {
        statusText = @"Deciding...";
        [[GameState sharedGameState] postEvent:EVENT_AI_TICK object:self];
        
        [self think:player];
        return;
    }
    
    // If we're not yet done thinking
    if (![self isThinkingDone])
    {
        [[GameState sharedGameState] postEvent:EVENT_AI_TICK object:self];
        // Then wait a bit more...
        usleep(1);
        return;
    }
    
    CCLOG(@"Getting the next game state from %d children", [[player state] numChildren]);
    //[self dump:player trackDepth:0];
    
    GameState* next = [self getNextGameState:player];
    
    /*
    uint64_t then = mach_absolute_time();
    
    GameState* slower = [[player state] oldClone];
    
    uint64_t now1 = mach_absolute_time();
    
    GameState* faster = [[player state] clone];
    
    uint64_t now2 = mach_absolute_time();
    
    [slower numChildren];
    [faster numChildren];
    
    CCLOG(@"Old clone took: %ull     New clone took: %ull", now1 - then, now2 - now1);
*/
    
	NSAssert(next != nil, @"Cannot activate a nil state!");

    // If the next state is the same as the current state... 
    if (next == [player state])
    {
        // ...then the AI declined to make a move, and we should go on to the next player.
        
        // First, ensure that we've docked all of our ships.
        if ([[player undockedShips] count] > 0)
        {
            // HACK: Simply dock all undocked ships.  TODO: Figure out why we have to do this.
            NSLog(@"WARNING: Wasted ships.");
            [[[player state] maintenanceBay] dockShips:[player undockedShips]];
        }
        
        isThinkingDone = false;
        isThinkingStarted = false;
        isTurnDone = false;

        [[player state] setAiFlags:0];
        [[player state] setChildrenFilled:false]; 
        
        [AIPlayer gotoNextPlayer:player];

        statusText = @"";
        [[GameState sharedGameState] postEvent:EVENT_AI_TICK object:self];
        return;
    }
    
    [GameState setActiveState:next];
    
    // Clear our thinking caps so we can permutate the next depths next time.
    isThinkingStarted = false;
    isThinkingDone = false;
    
    
    if (![next checkGameOver])
    {
        // Get a head start on thinking for the next round...
        GameState* state = [GameState sharedGameState];
        Player* player = [state currentPlayer];
        
        [AIPlayer aiTick:player];
    }
}

-(GameState*) getNextGameState:(Player*)player
{
    GameState* child = [self getHighestChild:player];
    
    return child;
}

-(void) think:(Player*)player
{
    if (!isThinkingStarted)
    {
        isThinkingDone = false;
        isThinkingStarted = true;
        
        // Do thinking stuff here in sub-classes that need it

        //        [self fillChildGameStates:player toDepth:-1]; // 10];
//        CCLOG(@"Filled %d child states.", [[player state] numChildren]);
//        [self dump:player trackDepth:0];
//        isThinkingDone = true;    
        //        isThinkingDone = true;
        
        thinkingThread = [[NSThread alloc] initWithTarget:self selector:@selector(doThinking:) object:player];
        
        [thinkingThread start];
        
//        [thinkingThread setThreadPriority:0.1];
    }
}



-(void) doThinking:(Player*)player
{
    /*
    NSData* test1 = [NSData dataWithData:[[player state] serialize]];
    NSData* test2 = [NSData dataWithData:[[player state] serialize]];
    
    if ([test1 isEqual:test2])
        CCLOG(@"Huzzah!  (%d) == (%d)", [test1 hash], [test2 hash]);
    else
        CCLOG(@"Boo. :(  (%d) != (%d)", [test1 hash], [test2 hash]);
    
    NSMutableSet* mySet = [NSMutableSet setWithCapacity:50000];
    
    [mySet addObject:test1];
    
    if ([mySet containsObject:test2])
    {
        CCLOG(@"Huzzah again!");
    }
    else
    {
        CCLOG(@"Oh fudge.");
    }
     */
    
	@autoreleasepool {
    
    // Fill the child states
        
        outtaTime = false;
        uint64_t startTime = mach_absolute_time();
        uint64_t targetTime = startTime + TimeIntervalFromSeconds(AI_VALUE_TIME); // Think no more than X number of seconds

        int numKids = [self fillChildGameStatesBreadthFirst:player toDepth:-1 until:targetTime]; // -1]; // 10];

        uint64_t endTime = mach_absolute_time();
        
        CCLOG(@"Filled %d child states in %f seconds.  Target delta of %f seconds.  %s",
              [[player state] numChildren],
              SecondsFromTimeInterval(endTime - startTime),
              endTime > targetTime ?
                SecondsFromTimeInterval(endTime - targetTime) :
                -SecondsFromTimeInterval(targetTime - endTime),
              (outtaTime ? "Out of time!" : "We thought fast enough!"));
        //[self dump:player trackDepth:0];
        
        isThinkingDone = true;
        
        [[player state] childStates];
    
    }
}


-(GameState*) getHighestChild:(Player*)player
{
    GameState* state = [player state];
    float childValue = 0;
    float highestValue = [self totalValueForPlayer:player];
    
    GameState* highestChild = state; // TODO: Should be nil?
    
    if ([[state childStates] count] > 0)
    {
        for (GameState* child in [state childStates])
        {
            childValue = [self getMaxChildValueForPlayer:[child playerByID:[player playerIndex]] trackDepth:1];
            //            childValue = [self totalValueForPlayer:[child playerByID:[player playerIndex]]];
            //CCLOG(@"AI child %@ has value %f", child, childValue);
            if (childValue > highestValue)
            {
                //CCLOG(@" That's the highest so far!");
                highestValue = childValue;
                highestChild = child;
            }
        }
    }
    else
    {
        // What to do here?
    }
    
    return highestChild;
}

-(float) getMaxChildValueForPlayer:(Player*)player trackDepth:(int) depth
{
    GameState* state = [player state];
    int cnt = 0;
    float childValue = 0;
    float maxValue = [self totalValueForPlayer:player];
    
    if ([[state childStates] count] > 0)
    {
        for (GameState* child in [state childStates]) {
            childValue = [self getMaxChildValueForPlayer:[child playerByID:[player playerIndex]] trackDepth:depth + 1];
            
            if ((cnt++ == 0) || (childValue > maxValue))
            {
                maxValue = childValue;
            }
        }
    }
    else
    {
        maxValue = [self totalValueForPlayer:player];
    }
    
    return maxValue;
}

// Evaluate a target game state to see how much this AI values that setup.  This number is relative in scale, and only useful for comparing this game against other game states according to this AI's value system, and it does not correspond to the evaluation given by any other AI.  Higher is generally better.  
-(float) totalValueForPlayer:(Player*)player
{
    GameState* state = [player state];
	float playerValue = 0;
    float value = 0;
    float maxOpponentValue = 0;
    float randomInfluence = (AI_VALUE_RANDOM != 0) ?
                                0.01 * (2 * (arc4random() % AI_VALUE_RANDOM) - (AI_VALUE_RANDOM)) :
                                0;
    
    int cnt = 0;
    
    for (Player* p in [state players])
    {
        value = [self baseValueForPlayer:p];
        
        if (p == player)
        {
            playerValue = value;
            
            if ([[player undockedShips] count] > 0)
            {
                playerValue -= AI_VALUE_HAS_UNDOCKED_SHIPS;
                
                // Never randomly promote a game state that has undocked ships
                if (randomInfluence > 0)
                    randomInfluence = -randomInfluence;
            }
        }
        else
        {
            if ((cnt++ == 0) || (value > maxOpponentValue))
            {
                maxOpponentValue = value;
            }
        }
    }
    
    return (playerValue + randomInfluence - maxOpponentValue * AI_VALUE_AGGRESSION );
}

-(float) baseValueForPlayer:(Player*)player
{
	float value = 0;
    int estNumTurnsLeft = [self estNumTurnsLeft:[player state]];
    
    //    Player* player = [self playerByID:playerIndex];
    
    if ([[player state] gameIsOver])
    {
        // If the player won
        if ([[player state] winningPlayer] == player)
            value = AI_VALUE_WIN;
        else
            value = -AI_VALUE_WIN;
    }
    else
    {
        int startingColonies = 10 - [[player state] numPlayers];
        
        value += AI_VALUE_FUEL * (6 - (18) / ([player fuel] + 3)); // Progression curve 1.5, 2.4, 3, 3.43, 3.75, 4, 4.2, 4.36, etc.  Diminishing returns as you go higher.
        value += AI_VALUE_ORE * (6 - (18) / ([player ore] + 3)); // Progression curve 1.5, 2.4, 3, 3.43, 3.75, 4, 4.2, 4.36, etc.  Diminishing returns as you go higher.
        
//        value += (AI_VALUE_FUEL * [player fuel]) * ((14 - [player fuel]) * 0.1); // At 4 fuel, fuel is at full worth.  As you get more than that, fuel goes down in value.
//        value += (AI_VALUE_ORE  * [player ore])  * ((14 - [player ore])  * 0.1); // At 4 ore, ore is at full worth.  As you get more than that, increases in ore go down in relative value.
        
        // The more ships, the better.
        
        int numCountedShips = [[player activeShips] count];
        
        // Count a ship on the Terraforming Station as lost
        Ship* terraformedShip = [[[player state] terraformingStation] firstDockedShip];
        if (terraformedShip != nil)
        {
            if ([terraformedShip player] == player)
            {
                numCountedShips--;
                
                if ([terraformedShip isArtifactShip])
                {
                    value -= AI_VALUE_ARTIFACT_SHIP_LIABILITY;
                }
            }
        }
        
        value += numCountedShips * (AI_VALUE_SHIP + AI_VALUE_SHIP_PER_TURN * estNumTurnsLeft);
        
        
        // The more tech cards, the better.
        value += (AI_VALUE_TECH   * [[player cards] count]);						// More cards have a constant relative value
        
        // Except when they're worth less at the end of the game
        value += (AI_VALUE_TECH_PER_TURN * estNumTurnsLeft * [[player cards] count]);
        
        // The more colonies, the better.
        value += (AI_VALUE_COLONY * (startingColonies - [player coloniesLeft] + [player numColoniesToLaunch]));	// More colonies have a constant relative value

        
        // The more VPs, the better.
        value += (AI_VALUE_VP * [player vps]);
        
        // The higher the value on the lunar mine blocking other players, the better.
        value += (AI_VALUE_LUNAR_MINE_MAX * [[[[player state] lunarMine] dockedShips] maxValue]);
        
        // The further along the colonist hub is, the better.
        value += AI_VALUE_COLONIST_HUB_NOTCH * [[[player state] colonistHub] colonyPosition:[player playerIndex]];
                
        if (([[[player state] heinleinPlains] playerWithMajority] == [player playerIndex]) &&
            (![[[player state] heinleinPlains] hasIsolationField]))
        {
            value += AI_VALUE_REGION_HEINLEIN * [self estNumTurnsLeft:[player state]];
        }
        if (([[[player state] pohlFoothills] playerWithMajority] == [player playerIndex]) &&
            (![[[player state] pohlFoothills] hasIsolationField]))
        {
            value += AI_VALUE_REGION_POHL * [self estNumTurnsLeft:[player state]] * [[player cards] count]; // TODO: Make this only count cards with fuel cost
        }
        if (([[[player state] vanVogtMountains] playerWithMajority] == [player playerIndex]) &&
            (![[[player state] vanVogtMountains] hasIsolationField]))
        {
            value += AI_VALUE_REGION_VAN_VOGT * [self estNumTurnsLeft:[player state]];
        }
        if (([[[player state] bradburyPlateau] playerWithMajority] == [player playerIndex]) &&
            (![[[player state] bradburyPlateau] hasIsolationField]))
        {
            value += AI_VALUE_REGION_BRADBURY * [player coloniesLeft];
        }
        if (([[[player state] asimovCrater] playerWithMajority] == [player playerIndex]) &&
            (![[[player state] asimovCrater] hasIsolationField]))
        {
            value += AI_VALUE_REGION_ASIMOV * [self estNumTurnsLeft:[player state]];
        }
        if (([[[player state] herbertValley] playerWithMajority] == [player playerIndex]) &&
            (![[[player state] herbertValley] hasIsolationField]))
        {
            value += AI_VALUE_REGION_HERBERT * (6 - [player numActiveNativeShips]);
        }
        if (([[[player state] lemBadlands] playerWithMajority] == [player playerIndex]) &&
            (![[[player state] lemBadlands] hasIsolationField]))
        {
            value += AI_VALUE_REGION_LEM * [self estNumTurnsLeft:[player state]];
        }
        if (([[[player state] burroughsDesert] playerWithMajority] == [player playerIndex]) &&
            (![[[player state] burroughsDesert] hasIsolationField]))
        {
            value += AI_VALUE_REGION_BURROUGHS;
        }
        
        
        bool hasDieManip = false;
        
        for (TechCard* card in [[player cards] array])
        {
            if (([card class] == [AlienCity class]) ||
                ([card class] == [AlienMonument class]))
            {
                value += AI_VALUE_TECH_VP;
            }
            else if ([card class] == [BoosterPod class])
            {
                value += AI_VALUE_TECH_BOOSTER;
                hasDieManip = true;
            }
            else if ([card class] == [DataCrystal class])
            {
                value += AI_VALUE_TECH_DATA;
            }
            else if ([card class] == [GravityManipulator class])
            {
                value += AI_VALUE_TECH_GRAVITY;
                // hasDieManip = true; // Don't count the grav manip as a basic die manipulator -- it's too expensive.
            }
            else if ([card class] == [HolographicDecoy class])
            {
                value += AI_VALUE_TECH_DECOY;
            }
            else if ([card class] == [OrbitalTeleporter class])
            {
                value += AI_VALUE_TECH_TELE;
            }
            else if ([card class] == [PlasmaCannon class])
            {
                value += AI_VALUE_TECH_PLASMA;
            }
            else if ([card class] == [PolarityDevice class])
            {
                value += AI_VALUE_TECH_POLARITY;
                hasDieManip = true;
            }
            else if ([card class] == [ResourceCache class])
            {
                value += AI_VALUE_TECH_CACHE * [self estNumTurnsLeft:[player state]];
            }
            else if ([card class] == [StasisBeam class])
            {
                value += AI_VALUE_TECH_STASIS;
                hasDieManip = true;
            }
            else if ([card class] == [TemporalWarper class])
            {
                value += AI_VALUE_TECH_WARPER;
            }
        }
        
        if (hasDieManip)
        {
            value += AI_VALUE_TECH_ANY_DIE_MANIP;
        }

        if ([player hasActiveArtifactShip])
        {
            value += AI_VALUE_ARTIFACT_SHIP_LIABILITY;
        }
    }
    
    if ([player aiType] == AI_TYPE_HUMAN)
        value *= AI_VALUE_HUMAN_PREJUDICE;
	
	return value;
}

-(int) estNumTurnsLeft:(GameState*)state
{
    // Estimate the number of turns remaining roughly by the fewest number of colonies
    
    int minColonies = 8;
    
    for (Player* player in [state players])
    {
        if ([player coloniesLeft] < minColonies)
            minColonies = [player coloniesLeft];
    }
    
    return minColonies;
}

-(NSString*) aiStatusText
{
    return statusText;
}

// Fills child game states to a specified depth (breadth first)
-(int) fillChildGameStatesBreadthFirst:(Player*)player toDepth:(int)targetDepth until:(uint64_t)targetTime
{
    int numDescendants = 0;
    int lastNumDescendants = 0;
    
    for (int depth = 1; depth < (targetDepth == -1 ? 100 : targetDepth); depth++)
    {
        CCLOG(@"AI: Filling descendents to depth: %d", depth);
        
        statusText = [@"Thinking............................." substringToIndex:(10 + depth)];
        [[GameState sharedGameState] postEvent:EVENT_AI_TICK object:self];
        
        numDescendants = [self fillChildGameStates:player toDepth:depth until:targetTime];

        CCLOG(@"AI: Done filling descendents to %d!  Now have %d descendents.", depth, numDescendants);
        
        if (targetTime != 0)
        {
            if (mach_absolute_time() > targetTime)
            {
                CCLOG(@"AI: Out of time!  Break!");
                
                outtaTime = true;
                break;
            }
        }
        
        // If we're descending to infinity-depth, then only keep descending as long as there are moves available.
        if (targetDepth == -1)
        {
            //CCLOG(@"Time is: %llu (to %llu), numDesc = %d (from %d)", mach_absolute_time(), targetTime, numDescendants, lastNumDescendants);
            if (numDescendants == lastNumDescendants)
            {
                // No new descendents -- break!
                CCLOG(@"AI: No new descendents.  Had %d descendants before, %d descendants now.  Break!", lastNumDescendants, numDescendants);
                break;
            }
        }
        
        lastNumDescendants = numDescendants;
    }
            
    return numDescendants;
}

// Fills child game states to a specified depth (depth-first)
-(int) fillChildGameStates:(Player*)player toDepth:(int)targetDepth until:(uint64_t)targetTime
{
    bool logged = false;
    static Player* rootPlayer = nil;
    
    GameState* state = [player state];
    
    if (targetDepth != 0)
    {
        if (![state childrenFilled])
        {
            [self fillChildGameStates:player];
        }
    }
    
    if (targetDepth == -1)
    {
        rootPlayer = player;
    }
     
    //CCLOG(@"Filling child game states to %d", targetDepth);

    int numChildren = [[state childStates] count];
    int numDescendants = numChildren;
    int cnt = 0;

    progress = 0;
    
    numOptionNodes += numChildren;
    
    if (targetDepth != 0)
    {
        for (GameState* child in [state childStates])
        {
            if (targetTime != 0)
            {
                //CCLOG(@"Time is: %llu (to %llu)", mach_absolute_time(), targetTime);

                if (mach_absolute_time() > targetTime)
                {
                    outtaTime = true;
                    break;
                }
            }
            
            numDescendants += [self fillChildGameStates:[child playerByID:[player playerIndex]] toDepth:targetDepth-1 until:targetTime];
//            CCLOG(@"Num option nodes: %d", numOptionNodes);
            
            /*
            if (targetDepth == 1)
            {
                progress = ++cnt / numChildren;
                CCLOG(@"AI progress: %d pct", (int) (progress * 100.0));
            }
             //*/
            
            if ((!logged) && (rootPlayer != nil))
            {
                /*
                if (numOptionNodes > 10000)
                {
//                    freopen([@"/Documents/ai_dump.txt" fileSystemRepresentation], "w", stderr);
                    [self dump:rootPlayer trackDepth:0];
                    logged = true;
                }
                 //*/
            }
                
        }
    }
    progress = 1;
    
    return numDescendants;
}

// Fills one level of child game states
-(void) fillChildGameStates:(Player*)player
{
    GameState* state = [player state];
    
    [state setChildStates:[[NSMutableArray alloc] init]];
    
//    Player* player = [self currentPlayer];
    
    [state setChildrenFilling:true];
    
    // If the game is over in this state, then do nothing else.
    if ([state gameIsOver])
    {
        [state setChildrenFilled:true];
        return;
    }
    
    // If we're raiding in this state, then do nothing else.
    if ([player isRaiding])
    {
        // First, attempt to raid cards from every player.
        for (Player* o in [state players])
        {
            if (o != player)
            {
                NSArray* cards = [[o cards] array];
                for (TechCard* card in cards)
                {
                    if ([player canRaidCard:card])
                    {
                        GameState* child = [state clone];
                        Player* childPlayer = [child corresponding:player];
                        TechCard* childCard = [child corresponding:card];
                        
                        [childPlayer setCardToRaid:childCard];
                        if ([childPlayer finishRaid])
                        {
                            [[state childStates] addObject:child];
                        }
                    }
                }
            }
        }
        
        // After raiding cards, it's time to raid resources.
        // If we did this permutatively, it could get reeeeally slow.
        // So let's just do the standard of raiding as much ore as we can, then fall back onto fuel.
        
        NSArray* players = [state winningPlayers];
        
        for (int targetOre = 4; targetOre >= 0; targetOre--)
        {
            int targetFuel = 4 - targetOre;
            
            for (Player* o in players)
            {
                [o setFuelToRaid:0];
                [o setOreToRaid:0];
            }
            
            for (Player* o in players)
            {
                if (o != player)
                {
                    if ([player oreRaidTotal] < targetOre)
                    {
                        if ([o canRaidMoreOre])
                        {
                            int myOre = MIN(targetOre - [player oreRaidTotal], [o ore]);
                            
                            [o setOreToRaid:myOre];
                        }
                    }
                    
                    if ([player fuelRaidTotal] < targetFuel)
                    {
                        if ([o canRaidMoreFuel])
                        {
                            int myFuel = MIN(targetFuel - [player fuelRaidTotal], [o fuel]);
                            
                            [o setFuelToRaid:myFuel];
                        }
                    }
                }
            }
            
            if (([player oreRaidTotal] > 0) ||
                ([player fuelRaidTotal] > 0))
            {
                GameState* child = [state clone];
                Player* childPlayer = [child corresponding:player];
                
                if ([childPlayer finishRaid])
                {
                    [[state childStates] addObject:child];
                }
            }
        }
        
        [state setChildrenFilled:true];
        return;
    }
    
    // Attempt to launch colonies
    if ([player numColoniesToLaunch] > 0)
    {
        int cnt=0;
        
        // Now loop through every region where we could place that colony
        for (Region* region in [state regions])
        {
            cnt++;
            
            if ([region hasRepulsorField])
                continue;
            
            GameState* child = [state clone];
            Region* childRegion = [child corresponding:region]; // [[child regions] objectAtIndex:cnt-1];
            [childRegion launchColony:[player playerIndex]];
            
            [[state childStates] addObject:child];
//            [self fillChildGameStates:[child playerByID:[player playerIndex]]];
        }
        [state setChildrenFilled:true];
        return;
    }
    
    { // Colony Constructor
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state colonyConstructor] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        if ([usableShips count] > 0)
        {
            // And attempt to dock them pair by triplet
            NSArray* shipSets = [usableShips allTriplets];
            
            for (ShipGroup* shipSet in shipSets)
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [child corresponding:shipSet];
                
                [[child colonyConstructor] commitShipsFromPlayer:[child corresponding:player] selectedShips:childShips];
                
                [[state childStates] addObject:child];
                //                [self fillChildGameStates:[child playerByID:[player playerIndex]]];
                
            }        
        }
    }
    
    // Check abilities (take card / trade at market / pay for launching at colonist hub)
    { // Pay for Colonist Hub
        if ([[state colonistHub] ableToLaunch])
        {
            GameState* child = [state clone];
            
            [[child colonistHub] launchColony];
            
            [[state childStates] addObject:child];
            //            [self fillChildGameStates:[child playerByID:[player playerIndex]]];
        }
    }
    
    {
        if ([[state burroughsDesert] playerCanPurchaseShip:player])
        {
            GameState* child = [state clone];
            Player* childPlayer = [child corresponding:player];
            
            [childPlayer purchaseArtifactShip];
            
            [[state childStates] addObject:child];
        }
    }    
    
    { // Terraforming Station
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state terraformingStation] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        // And attempt to dock them 1 by 1.
        for (Ship* ship in [usableShips array])
        {
            GameState* child = [state clone];
            ShipGroup* childShips = [[ShipGroup alloc] init];
            
            Ship* childShip = [child corresponding:ship];
            [childShips push:childShip];
            
            [[child terraformingStation] commitShipsFromPlayer:[child corresponding:player] selectedShips:childShips];
            
            [[state childStates] addObject:child];
            //            [self fillChildGameStates:[child playerByID:[player playerIndex]]];
            
            
            // No need to keep continuing here
            // TODO: Unless one of these is the artifact ship?
            break; 
        }    
    }
    
    
    // Pairs
    
    { // Shipyard
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state shipyard] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        if ([usableShips count] > 0)
        {
            int usedValues[7] = {0,0,0,0,0,0,0};
            
            // And attempt to dock them pair by pair
            NSArray* shipPairs = [usableShips allPairs];
            
            for (ShipGroup* shipPair in shipPairs)
            {
                // Ensure that we're not duplicating efforts with redundant values
                if (usedValues[[shipPair minValue]] != 0)
                    continue;
                usedValues[[shipPair minValue]] = 1;
                
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                
                for (Ship* ship in [shipPair array])
                {
                    Ship* childShip = [child corresponding:ship];
                    [childShips push:childShip];
                }
                
                [[child shipyard] commitShipsFromPlayer:[child corresponding:player] selectedShips:childShips];
                
                [[state childStates] addObject:child];
                //                [self fillChildGameStates:[child playerByID:[player playerIndex]]];
                
            }
        }
    }
    
    // Go through each orbital
    
    // Singles
    
    { // Alien Artifact
        // Acquire tech cards
        if ([[state currentPlayer] artifactCreditAvailable] >= 8)
        {
            for (int cnt = 0; cnt < [[state techDisplayDeck] count]; cnt++)
            {
                TechCard* card = [[[state techDisplayDeck] array] objectAtIndex:cnt];
                
                if ([[state currentPlayer] canPurchaseCard:card])
                {
                    GameState* child = [state clone];
                    
                    TechCard* childCard = [child corresponding:card];
                    
                    [[child currentPlayer] purchaseCard:childCard];
                    
                    [[state childStates] addObject:child];
                    //                    [self fillChildGameStates:[child playerByID:[player playerIndex]]];
                }
            }
            // Do nothing else for this iteration.  This means that if we docked value of 8 or more, then IMMEDIATELY the next branch of the tree will be to fill out with which card we take.
            [state setChildrenFilled:true];
            return;
        }
        else if (([[state alienArtifact] numEmptyGroups] >= 2) && !([state aiFlags] & AI_FLAG_USED_ARTIFACT))
        {
            int usedValues1[7] = {0,0,0,0,0,0,0};
            // Get all ships that can be docked on the orbital
            ShipGroup* usableShips = [[state alienArtifact] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
            
            for (int ship1cnt = 0; ship1cnt < [usableShips count]; ship1cnt++)
            {
                Ship* ship1 = (Ship*) [[usableShips array] objectAtIndex:ship1cnt];
                
                // Ensure that we're not duplicating efforts with redundant values
                if (usedValues1[[ship1 value]] != 0)
                    continue;
                usedValues1[[ship1 value]] = 1;
                
                if ([ship1 value] < 2)
                    continue;
                
                int usedValues2[7] = {0,0,0,0,0,0,0};
                for (int ship2cnt = ship1cnt + 1; ship2cnt < [usableShips count]; ship2cnt++)
                {
                    Ship* ship2 = (Ship*) [[usableShips array] objectAtIndex:ship2cnt];
                    
                    // Ensure that we're not duplicating efforts with redundant values
                    if (usedValues2[[ship2 value]] != 0)
                        continue;
                    usedValues2[[ship2 value]] = 1;
                    
                    int currentTotal = [ship1 value] + [ship2 value];
                    
                    if (currentTotal >= 8)
                    {
                        GameState* child = [state clone];
                        
                        ShipGroup* childShips = [[ShipGroup alloc] init];
                        Ship* childShip1 = [child corresponding:ship1]; 
                        Ship* childShip2 = [child corresponding:ship2]; 
                        
                        [childShips push:childShip1];
                        [childShips push:childShip2];
                        
                        [[child alienArtifact] commitShipsFromPlayer:[child corresponding:player] selectedShips:childShips];
                        [child setAiFlags:[child aiFlags] | AI_FLAG_USED_ARTIFACT];
                        
                        [[state childStates] addObject:child];
                    }
                }
            }
        }
//        [state setAiFlags:[state aiFlags] | AI_FLAG_USED_ARTIFACT];
    }
    
    if (!([state aiFlags] & AI_FLAG_USED_SOLAR)) { // Solar Converter
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state solarConverter] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        int maxID = [[state solarConverter] maxDockedShipIDFromPlayer:player];
        
        // And attempt to dock them one by one.
        for (int cnt = 0; cnt < [usableShips count]; cnt++)
        {
            Ship* ship = [usableShips atIndex:cnt];
            
            if (([ship shipID] > maxID) || ([ship teleportRestriction] != nil))
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                
                [childShips push:[child corresponding:ship]];
                
                [[child solarConverter] commitShipsFromPlayer:[child corresponding:player] selectedShips:childShips];
                
                [[state childStates] addObject:child];
                
            }
        }
        //        [state setAiFlags:[state aiFlags] | AI_FLAG_USED_SOLAR];
    }    
    
    
    if (!([state aiFlags] & AI_FLAG_USED_LUNAR_MINE)) { // Lunar Mine
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state lunarMine] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        int maxID = [[state lunarMine] maxDockedShipIDFromPlayer:player];
        
        // And attempt to dock them one by one
        for (int cnt = 0; cnt < [usableShips count]; cnt++)
        {
            Ship* ship = [usableShips atIndex:cnt];
            
            if (([ship shipID] > maxID) || ([ship teleportRestriction] != nil))
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                
                [childShips push:[child corresponding:ship]];
                
                [[child lunarMine] commitShipsFromPlayer:[child corresponding:player] selectedShips:childShips];
                
                [[state childStates] addObject:child];
            }
        }
        
        //        [state setAiFlags:[state aiFlags] | AI_FLAG_USED_LUNAR_MINE];
    }    

/*    
    if (!([state aiFlags] & AI_FLAG_USED_SOLAR)) { // Solar Converter
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state solarConverter] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        // And attempt to dock them group by group.
        for (int cnt = 0; cnt < [usableShips numPermutations]; cnt++)
        {
            ShipGroup* perm = [usableShips uniquePermutationByIndex:cnt];

            // Skip empty groups
            if ([perm count] == 0)
                continue;

            // Only if we have a quantity lower than the number of open docks
            if ([perm count] <= [[state solarConverter] numEmptyGroups])
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                
                for (Ship* parentShip in [perm array]) {
                    Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[parentShip shipID]];
                    [childShips push:childShip];
                }
                
                [[child solarConverter] commitShipsFromPlayer:[child playerByID:[player playerIndex]] selectedShips:childShips];
                [child setAiFlags:[child aiFlags] | AI_FLAG_USED_SOLAR];
                
                [[state childStates] addObject:child];
                //                [self fillChildGameStates:[child playerByID:[player playerIndex]]];
                
                [childShips release];
            }
        }
        
//        [state setAiFlags:[state aiFlags] | AI_FLAG_USED_SOLAR];
    }    
 */
    
    /*
    if (!([state aiFlags] & AI_FLAG_USED_LUNAR_MINE)) { // Lunar Mine
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state lunarMine] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        // And attempt to dock them group by group.
        for (int cnt = 0; cnt < [usableShips numPermutations]; cnt++)
        {
            ShipGroup* perm = [usableShips uniquePermutationByIndex:cnt];
            
            // Skip empty groups
            if ([perm count] == 0)
                continue;

            // Only if we have a quantity lower than the number of open docks
            if ([perm count] <= [[state lunarMine] numEmptyGroups])
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                
                for (Ship* parentShip in [perm array]) {
                    Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[parentShip shipID]];
                    [childShips push:childShip];
                }
                
                [[child lunarMine] commitShipsFromPlayer:[child playerByID:[player playerIndex]] selectedShips:childShips];
                [child setAiFlags:[child aiFlags] | AI_FLAG_USED_LUNAR_MINE];
                
                [[state childStates] addObject:child];
                //                [self fillChildGameStates:[child playerByID:[player playerIndex]]];
                
                [childShips release];
            }
        }
                
//        [state setAiFlags:[state aiFlags] | AI_FLAG_USED_LUNAR_MINE];
    }
    //*/
    
    
    
    /*
    {
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state alienArtifact] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        for (int cnt = 0; cnt < [usableShips numPermutations]; cnt++)
        {
            ShipGroup* perm = [usableShips uniquePermutationByIndex:cnt];
            
            // Only if we have 8 or more value on our ships should we dock them
            if ([perm sum] >= 8)
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                
                for (Ship* parentShip in [perm array]) {
                    Ship* childShip = [child shipByPlayer:[player playerIndex] shipID:[parentShip shipID]];
                    [childShips push:childShip];
                }
                
                [[child alienArtifact] commitShipsFromPlayer:[child playerByID:[player playerIndex]] selectedShips:childShips];
                
                [[state childStates] addObject:child];
                
                [childShips dealloc];
            }
        }
    }
     */
    
    

    
    //*
    // Only try to dock on the Orbital Market if there is no market price yet.
    if ([player marketPrice] == 0) { // Orbital Market
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state orbitalMarket] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        // And attempt to dock them pair by pair
        
        if ([usableShips count] > 0)
        {
            int usedValues[7] = {0,0,0,0,0,0,0};
            NSArray* shipPairs = [usableShips allPairs];
            
            for (ShipGroup* shipPair in shipPairs)
            {
                int shipsValue = [shipPair minValue];
                
                // Ensure that we're not duplicating efforts with redundant values
                if (usedValues[shipsValue] != 0)
                    continue;
                
                usedValues[shipsValue] = 1;
                
                // Ensure that we have enough fuel to complete at least one trade with this.
                if ([[state heinleinPlains] playerHasBonus:player])
                    shipsValue = 1;
                
                // If we don't have enough fuel to even do 1 trade...
                if ([player fuel] < shipsValue)
                    continue; // Try again with the next pair

                // Otherwise, this is a potentially worthwhile endeavor -- let's continue!
                
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                Player* childPlayer = [child corresponding:player];
                
                for (Ship* ship in [shipPair array])
                {
                    Ship* childShip = [child corresponding:ship];
                    [childShips push:childShip];
                }
                
                [[child orbitalMarket] commitShipsFromPlayer:childPlayer selectedShips:childShips];
                
                // Do trades right here in sub-child states
                {
                    int maxTrades = [childPlayer fuel] / [childPlayer marketPrice];
                    
                    for (int tradeCnt = 1; tradeCnt < maxTrades; tradeCnt++)
                    {
                        GameState* subchild = [child clone];
                        
                        for (int cnt = 0; cnt < tradeCnt; cnt++)
                        {
                            [[subchild currentPlayer] doMarketTrade];
                        }
                        
                        [subchild setAiFlags:[subchild aiFlags] | AI_FLAG_USED_MARKET];
                        
                        [[state childStates] addObject:subchild];
                        
                    }
                    
                    [state setAiFlags:[state aiFlags] | AI_FLAG_USED_MARKET];
                }
                // Don't need to add the child state now, because we already did all of our trading and adding with the subchildren
//                [[state childStates] addObject:child];
            }
        }
    }
    /*
    else if (!([state aiFlags] & AI_FLAG_USED_MARKET)) { // Orbital Market
        int maxTrades = [player fuel] / [player marketPrice];
        
        for (int tradeCnt = 0; tradeCnt < maxTrades; tradeCnt++)
        {
            GameState* child = [state clone];
            
            for (int cnt = 0; cnt < tradeCnt; cnt++)
            {
                [[child currentPlayer] doMarketTrade];
            }
            
            [child setAiFlags:[child aiFlags] | AI_FLAG_USED_MARKET];
            
            [[state childStates] addObject:child];
            
        }
        
        [state setAiFlags:[state aiFlags] | AI_FLAG_USED_MARKET];
    }
    //*/
    
    { // Maintenance Bay
        
    }
    
    if (!([state aiFlags] & AI_FLAG_USED_RAIDERS_OUTPOST)) { // Raiders Outpost
        ShipGroup* usableShips = [[state raidersOutpost] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        if ([usableShips count] > 0)
        {
            // And attempt to dock them pair by triplet
            // TODO: change allStraights to firstStraights to reduce redundant repetitions
            NSArray* shipSets = [usableShips allStraights];
            
            for (ShipGroup* shipSet in shipSets)
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [child corresponding:shipSet];
                
                [[child raidersOutpost] commitShipsFromPlayer:[child corresponding:player] selectedShips:childShips];
                
                [[state childStates] addObject:child];
            }
        }        
//        [state setAiFlags:[state aiFlags] | AI_FLAG_USED_RAIDERS_OUTPOST];
    }
    
    /* // This method here attempts to dock ships at the Colonist Hub 1 at a time.  This is okay... but it can be really slow, and sometimes the AI misses opportunities to launch colonies this way.
    if (!([state aiFlags] & AI_FLAG_USED_COLONIST_HUB)) { // Colonist Hub
        
        if ([[state colonistHub] colonyPosition:[player playerIndex]] < MAX_COLONY_POSITION)
        {
            // Get all ships that can be docked on the orbital
            ShipGroup* usableShips = [[state colonistHub] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
            
            int maxID = [[state colonistHub] maxDockedShipIDFromPlayer:player];
            
            // And attempt to dock them group by group.
            for (int cnt = 0; cnt < [usableShips count]; cnt++)
            {
                Ship* ship = [usableShips atIndex:cnt];
                
                if (([ship shipID] > maxID) || ([ship teleportRestriction] != nil))
                {
                    GameState* child = [state clone];
                    ShipGroup* childShips = [[ShipGroup alloc] init];
                    
                    [childShips push:[child corresponding:ship]];
                    
                    [[child colonistHub] commitShipsFromPlayer:[child corresponding:player] selectedShips:childShips];
                    
                    [[state childStates] addObject:child];
                }
            }
        }
    }
     //*/
    
    if (!([state aiFlags] & AI_FLAG_USED_COLONIST_HUB)) { // Colonist Hub
        // Get all ships that can be docked on the orbital
        ShipGroup* usableShips = [[state colonistHub] usableShipsFromPlayer:player shipsInHand:[player undockedShips] selectedShips:[ShipGroup blank]];
        
        // And attempt to dock them group by group.
        for (int cnt = 0; cnt < [usableShips numPermutations]; cnt++)
        {
            ShipGroup* perm = [usableShips uniquePermutationByIndex:cnt];
            
            // Skip empty groups
            if ([perm count] == 0)
                continue;
            
            // Only if we have a quantity lower than the number of open docks
            if ([perm count] <= [[state colonistHub] numEmptyGroups])
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [child corresponding:perm];
                Player* childPlayer = [child corresponding:player];
                
                [[child colonistHub] commitShipsFromPlayer:childPlayer selectedShips:childShips];
//                [child setAiFlags:[child aiFlags] | AI_FLAG_USED_COLONIST_HUB];
                
                [[state childStates] addObject:child];
                //                [self fillChildGameStates:[child playerByID:[player playerIndex]]];
                //                [childShips dealloc];
            }
        }
        //[state setAiFlags:[state aiFlags] | AI_FLAG_USED_COLONIST_HUB];        
    }
 
 //*/
    
    /*  
     // This section attempts to "dink" teleported ships on the mine / converter, to get past the AI flag blocks.
     // But since those flags are currently turned off, I'm disabling this section.  CMH - 2012-10-24
    if ([state aiFlags] & AI_FLAG_USED_TELEPORTER) { // We used the Orbital Teleporter last turn...
        // If we used the Orbital Teleporter last turn, then try to "dink" it onto the Lunar Mine and the Solar Converter, if we haven't already.
        
        // First, clear the flag so that we won't come into this section again for child states...
        [state setAiFlags: [state aiFlags] & 
         (~AI_FLAG_USED_TELEPORTER)];
        

        // Then find the ship that was teleported.
        ShipGroup* group = [[ShipGroup alloc] init];
        for (Ship* ship in [[player activeShips] array])
        {
            // If the ship has been teleported this turn...
            if ([ship teleportRestriction] != nil)
            {
                // And it's currently undocked...
                if (![ship docked])
                {
                    // Then we've found what we're looking for!
                    [group push:ship];
                    break;
                }
            }
        }
        
        // Then try to "dink" it onto the Lunar Mine...
        if ([group count] != 0)
        {
            ShipGroup* usableShips = [[state lunarMine] usableShipsFromPlayer:player shipsInHand:group selectedShips:[ShipGroup blank]];
            
            if ([usableShips count] != 0)
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                
                [childShips push:[child corresponding:[group atIndex:0]]];
                
                [[child lunarMine] commitShipsFromPlayer:[child corresponding:player] selectedShips:childShips];
                
                [[state childStates] addObject:child];
            }
        }
        
        // And then onto the Solar Converter...
        if ([group count] != 0)
        {
            ShipGroup* usableShips = [[state solarConverter] usableShipsFromPlayer:player shipsInHand:group selectedShips:[ShipGroup blank]];
            
            if ([usableShips count] != 0)
            {
                GameState* child = [state clone];
                ShipGroup* childShips = [[ShipGroup alloc] init];
                
                [childShips push:[child corresponding:[group atIndex:0]]];
                
                [[child solarConverter] commitShipsFromPlayer:[child corresponding:player] selectedShips:childShips];
                
                [[state childStates] addObject:child];
            }
        }
    }
    //*/
    
    

    //*
    // Attempt to use tech cards
    {
        TechCard* card = nil;
        int usedValues[7] = {0,0,0,0,0,0,0};
        
        for (int cnt = 0; cnt < [[[state currentPlayer] cards] count]; cnt++)
        {
            card = [[[state currentPlayer] cards] atIndex:cnt];
            
            if ([card canUsePower])
            {
                // Then use each fuel power accordingly
                
                // Dice manipulation cards
                if ([card class] == [BoosterPod class])
                {
                    // Reset the used values counter
                    for (int cnt = 0; cnt <= 6; usedValues[cnt++] = 0);
                    
                    BoosterPod* boosterCard = (BoosterPod*) card;
                    
                    for (Ship* ship in [[player undockedShips] array]) {
                        if (usedValues[ship.value] == 0)
                        {
                            usedValues[ship.value] = 1;
                            if ([boosterCard canUsePower:ship])
                            {
                                GameState* child = [state clone];
                                Ship* childShip = [child corresponding:ship];
                                                   
                                BoosterPod* childCard = (BoosterPod*) [child corresponding:card];
                                
                                [childCard usePower:childShip];
                                
                                [[state childStates] addObject:child];
                            }
                        }
                    }
                } else if ([card class] == [PolarityDevice class])
                {
                    // Reset the used values counter
                    for (int cnt = 0; cnt <= 6; usedValues[cnt++] = 0);

                    PolarityDevice* polarityCard = (PolarityDevice*) card;
                    
                    for (Ship* ship in [[player undockedShips] array]) {
                        if (usedValues[ship.value] == 0)
                        {
                            usedValues[ship.value] = 1;
                            if ([polarityCard canUsePower:ship])
                            {
                                GameState* child = [state clone];
                                Ship* childShip = [child corresponding:ship]; 
                                
                                PolarityDevice* childCard = (PolarityDevice*) [child corresponding:polarityCard];
                                
                                [childCard usePower:childShip];
                                
                                [[state childStates] addObject:child];
                            }
                        }
                    }                       
                } else if ([card class] == [StasisBeam class]) 
                {
                    // Reset the used values counter
                    for (int cnt = 0; cnt <= 6; usedValues[cnt++] = 0);

                    StasisBeam* stasisCard = (StasisBeam*) card;
                    
                    for (Ship* ship in [[player undockedShips] array]) {
                        if (usedValues[ship.value] == 0)
                        {
                            usedValues[ship.value] = 1;
                            if ([stasisCard canUsePower:ship])
                            {
                                GameState* child = [state clone];
                                Ship* childShip = [child corresponding:ship];
                                
                                StasisBeam* childCard = (StasisBeam*) [child corresponding:card];
                                
                                [childCard usePower:childShip];
                                
                                [[state childStates] addObject:child];
                            }
                        }
                    }                    
                } else if ([card class] == [GravityManipulator class])
                {
                    int usedValues2[7] = {0,0,0,0,0,0,0};
                    ShipGroup* usableShips = [player undockedShips];
                    
                    for (int ship1cnt = 0; ship1cnt < [usableShips count]; ship1cnt++)
                    {
                        Ship* ship1 = (Ship*) [[usableShips array] objectAtIndex:ship1cnt];
                        
                        if (usedValues[ship1.value] == 0)
                        {
                            for (int cnt = 0; cnt <= 6; usedValues2[cnt++] = 0);
                            usedValues[ship1.value] = 1;

                            if ([ship1 value] > 5)
                                continue;
                            
                            for (int ship2cnt = 0; ship2cnt < [usableShips count]; ship2cnt++)
                            {
                                if (ship2cnt == ship1cnt)
                                    continue;
                                
                                Ship* ship2 = (Ship*) [[usableShips array] objectAtIndex:ship2cnt];
                                
                                if (usedValues2[ship2.value] == 0)
                                {
                                    usedValues2[ship2.value] = 1;
                                    
                                    if ([ship2 value] < 2)
                                        continue;
                                    
                                    // If we made it this far...
                                    {
                                        GameState* child = [state clone];
                                        
                                        Ship* childShip1 = [child corresponding:ship1];
                                        Ship* childShip2 = [child corresponding:ship2];
                                        
                                        GravityManipulator* childCard = (GravityManipulator*) [child corresponding:card];
                                        
                                        [childCard usePower:childShip1 toLower:childShip2];
                                        
                                        [[state childStates] addObject:child];
                                    }
                                }
                            }
                        }
                    }
                }
                // Other cards
                else if ([card class] == [DataCrystal class])
                {
                    // Don't bother with the Data Crystal if we don't have any ships left to dock
                    if ([[player undockedShips] count] == 0)
                        continue;
                    
                    for (Region* region in [state regions])
                    {
                        DataCrystal* dataCard = (DataCrystal*)card;
                        
                        if ([dataCard canUsePower:region])
                        {
                            GameState* child = [state clone];
                            Region* childRegion = [child corresponding:region];
                            DataCrystal* childCard = [child corresponding:dataCard];
                            
                            [childCard usePower:childRegion];

                            [child setAiFlags:[child aiFlags] | AI_FLAG_USED_CRYSTAL];
                            [[state childStates] addObject:child];
                            
                        }
                    }
                    
                } else if ([card class] == [OrbitalTeleporter class])
                {
                    // For each ship that we have docked, undock it.
                    for (Ship* ship in [[player activeShips] array])
                    {
                        OrbitalTeleporter* teleCard = (OrbitalTeleporter*)card;
                        
                        if ([teleCard canUsePower:ship])
                        {
                            GameState* child = [state clone];
                            Ship* childShip = [child corresponding:ship];
                            OrbitalTeleporter* childCard = (OrbitalTeleporter*) [child corresponding:card];
                            
                            [childCard usePower:childShip];
                            
//                            if ([ship dockedOrbital] == [state solarConverter])
//                            {
//                                [child setAiFlags: [child aiFlags] & 
//                                 (~AI_FLAG_USED_LUNAR_MINE)];
//                            }
                            /*
                            if ([ship dockedOrbital] != [state solarConverter])
                            {
                                [child setAiFlags: [child aiFlags] & 
                                 (~AI_FLAG_USED_SOLAR)];
                            }
                            if ([ship dockedOrbital] != [state lunarMine])
                            {
                                [child setAiFlags: [child aiFlags] & 
                                 (~AI_FLAG_USED_LUNAR_MINE)];
                            }
                            */
                            
                            // If we removed the ship from a full colonist hub...
                            if ([ship dockedOrbital] == [state colonistHub])
                            {
                                // Then clear the flag so that we can know to add another ship on there in its absence.
                                if ([[state colonistHub] numEmptyGroups] == 0)
                                    [child setAiFlags: [child aiFlags] & 
                                     (~AI_FLAG_USED_COLONIST_HUB)];
                            }
                        
                            // If we removed the ship from a full lunar mine...
                            if ([ship dockedOrbital] == [state lunarMine])
                            {
                                // Then clear the flag so that we can know to add another ship on there in its absence.
                                if ([[state lunarMine] numEmptyGroups] == 0)
                                    [child setAiFlags: [child aiFlags] & 
                                     (~AI_FLAG_USED_LUNAR_MINE)];
                            }
                            
                            [child setAiFlags:[child aiFlags] | AI_FLAG_USED_TELEPORTER];

                            [[state childStates] addObject:child];
                        }
                    }
                } else if ([card class] == [PlasmaCannon class])
                {
                    PlasmaCannon* plasmaCard = (PlasmaCannon*) card;
                    
                    // Don't bother with the plasma cannon if we don't have any ships left to dock
                    if ([[player undockedShips] count] == 0)
                        continue;
                    
                    // For each orbital
                    for (Orbital* orbital in [state orbitals])
                    {
                        // If it's on an orbital that we care about...
                        bool doWeCare = false;
                        
                        if ([orbital isKindOfClass:[LunarMine class]])
                        {
                            doWeCare = true;
                        }else if ([orbital isKindOfClass:[AlienArtifact class]])
                        {
                            if ([orbital numEmptyGroups] < 2)
                                doWeCare = true;
                        }else if ([orbital isKindOfClass:[Shipyard class]])
                        {
                            if ([orbital numEmptyGroups] == 0)
                                doWeCare = true;
                        }else if ([orbital isKindOfClass:[ColonyConstructor class]])
                        {
                            if ([orbital numEmptyGroups] == 0)
                                doWeCare = true;
                        }else if ([orbital isKindOfClass:[TerraformingStation class]])
                        {
                            if ([orbital numEmptyGroups] == 0)
                                doWeCare = true;
                        }
                        
                        
                            
                        if (doWeCare)
                        {
                            // Then remove each unique set of ships on that orbital...
                            ShipGroup* ships = [orbital dockedShips];
                            
                            ShipGroup* zappable = [[ShipGroup alloc] init];
                            
                            for (Ship* ship in [ships array])
                            {
                                if ([ship player] != player)
                                {
                                    [zappable push:ship];
                                }
                            }
                            
                            int numPermutations = [zappable numPermutations];
                            
                            for (int cnt = 0; cnt < numPermutations; cnt++)
                            {
                                ShipGroup* perm = [zappable uniquePermutationByIndex:cnt];
                                
                                if ([plasmaCard canUsePower:perm])
                                {
                                    GameState* child = [state clone];
                                    ShipGroup* childShips = [child corresponding:perm];
                                    PlasmaCannon* childCard = (PlasmaCannon*) [child corresponding:card];
                                    
                                    [childCard usePower:childShips];

                                    [child setAiFlags:[child aiFlags] | AI_FLAG_USED_CANNON];
                                    
                                    [[state childStates] addObject:child];
                                }
                            }
                            
                        }
                    }
                } else if ([card class] == [TemporalWarper class])
                {
                    // How do we use this without cheating and knowing the future?  Is that okay?
                }
            }
            
            if ([card canUseDiscard])
            {
                // Then use each discard power accordingly
                
                // Field generators
                if ([card class] == [BoosterPod class]) {  // Discard to remove 1 field generator
                } else if ([card class] == [StasisBeam class]) { // Discard to place I
                    for (Region* region in [state regions])
                    {
                        int playerWithMajority = [region playerWithMajority];
                        
                        // If we don't control the region, but somebody else does
                        bool doWeCare = (playerWithMajority > 0) && (playerWithMajority != [player playerIndex]);
                        
                        // TODO: SPECIAL CASE: If this is the Burroughs Desert, AND the Terraforming Station is occupied by our Artifact Ship, THEN consider this.
                        
                        if (doWeCare)
                        {
                            // Then place the Isolation Field
                            GameState* child = [state clone];
                            Region* childRegion = [child corresponding:region];
                            StasisBeam* childCard = (StasisBeam*) [child corresponding:card];
                            
                            [childCard useDiscard:childRegion];
                            
                            [[state childStates] addObject:child];
                        }
                    }
                } else if ([card class] == [GravityManipulator class]){  // Discard to place R
                } else if ([card class] == [DataCrystal class]) {  // Discard to place P
                    // Only do this if we only have 1 colony left
                    if ([player coloniesLeft] == 1)
                    {
                        for (Region* region in [state regions])
                        {
                            // If we control the region
                            if ([region playerWithMajority] == [player playerIndex])
                            {
                                // Then place the Positron Field
                                GameState* child = [state clone];
                                Region* childRegion = [child corresponding:region];
                                DataCrystal* childCard = (DataCrystal*) [child corresponding:card];
                                
                                [childCard useDiscard:childRegion];
                                
                                [[state childStates] addObject:child];
                                
                                // It doesn't matter which one we place this one -- just place it on any, then break
                                break;
                            }
                        }
                    }
                } // Colony movement
                else if ([card class] == [PolarityDevice class]) { // Discard to swap colonies
                } else if ([card class] == [OrbitalTeleporter class]) {  // Discard to move colony
                } // Other cards
                else if ([card class] == [PlasmaCannon class]) {  // Discard to destroy ship
                } else if ([card class] == [TemporalWarper class]) {  // Discard to gain discarded tech
                }
            }
        }
    }
     //*/
    
    [state setChildrenFilled:true];
}


-(void) dump:(Player*) player trackDepth:(int)depth
{
    float totalValue = [self totalValueForPlayer:player];
    NSString* lastMove = [[player state] lastMove];
    static int lineCnt = 0;
    
    NSMutableString* str = [NSMutableString stringWithFormat:@" State: '%@': (%f)\n",
                            lastMove,
                            totalValue];
    
    for (int cnt = 0; cnt < depth; cnt++)
    {
        [str insertString:@"\t" atIndex:0];
    }
    
    [str insertString:[NSString stringWithFormat:@"%d) %f: ", lineCnt++, [self getMaxChildValueForPlayer:player trackDepth:0]] atIndex:0];
    
    //CCLOG(str);
    
    {
        //*
        NSData *dataToWrite = [str dataUsingEncoding:NSUTF8StringEncoding];
        
        NSString *docsDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
        NSString *path = [docsDirectory stringByAppendingPathComponent:@"ai_dump.txt"];
        
        
         //
         // Check if file exists
         /*
         NSFileManager *fileManager = [NSFileManager defaultManager];
         [fileManager fileExistsAtPath:path]; // Returns a BOOL    
         
         // Remove the file
         [fileManager removeItemAtPath:path error:NULL];
         
         // Cleanup
         [fileManager release];
         */
        
        //*
        if (depth == 0)
        {
            // Write the file
            [dataToWrite writeToFile:path atomically:YES];
        }
        else
        {
            NSFileHandle *myHandle = [NSFileHandle fileHandleForUpdatingAtPath:path];
            [myHandle seekToEndOfFile];
            [myHandle writeData:dataToWrite]; 
            [myHandle closeFile];       
        }        
        //*/
        
        /*
         // Read the file
         NSString *stringFromFile = [[NSString alloc] initWithContentsOfFile:path];  
         
         // Check if file exists
         NSFileManager *fileManager = [NSFileManager defaultManager];
         [fileManager fileExistsAtPath:path]; // Returns a BOOL    
         
         // Remove the file
         [fileManager removeItemAtPath:path error:NULL];
         
         // Cleanup
         [stringFromFile release];
         [fileManager release];
         */
    }
    
    
    
    //    [str writeToFile:@"ai_dump.txt" atomically:true encoding:NSUTF8StringEncoding error:nil];
    //    CCLOG(str);
    
    for (GameState* child in [[player state] childStates]) {
        [self dump:[child playerByID:[player playerIndex]] trackDepth:depth+1];
    }
}


-(void) addChild:(GameState*) childState toState:(GameState*) parentState
{    
    [[parentState childStates] addObject:childState];
}
     

@end
