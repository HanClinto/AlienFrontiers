//
//  GCTurnBasedMatchHelper.m
//  AlienFrontiers
//
//  Created by Clint Herron on 10/17/12.
//  Copyright (c) 2012 HanClinto Games LLC. All rights reserved.
//

#import "GCTurnBasedMatchHelper.h"
#import "GameState.h"
#import "cocos2d.h"
#import "SceneGameiPad.h"

@implementation GCTurnBasedMatchHelper

@synthesize gameCenterAvailable;
@synthesize currentMatch;
@synthesize delegate;
@synthesize userAuthenticated;

#pragma mark Initialization

static GCTurnBasedMatchHelper *sharedHelper = nil;
+ (GCTurnBasedMatchHelper *) sharedInstance {
    if (!sharedHelper) {
        CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
        sharedHelper = [[GCTurnBasedMatchHelper alloc] init];
    }
    return sharedHelper;
}

- (BOOL)isGameCenterAvailable {
#ifndef USE_GC
    return false;
#else
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    // check for presence of GKLocalPlayer API
    Class gcClass = (NSClassFromString(@"GKLocalPlayer"));
    
    // check if the device is running iOS 5.0 or later
    NSString *reqSysVer = @"5.0";
    NSString *currSysVer = [[UIDevice currentDevice] systemVersion];
    BOOL osVersionSupported = ([currSysVer compare:reqSysVer
                                           options:NSNumericSearch] != NSOrderedAscending);
    
    return (gcClass && osVersionSupported);
#endif
}

- (id)init {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    if ((self = [super init])) {
        gameCenterAvailable = [self isGameCenterAvailable];
        if (gameCenterAvailable) {
            NSNotificationCenter *nc =
            [NSNotificationCenter defaultCenter];
            [nc addObserver:self
                   selector:@selector(authenticationChanged)
                       name:GKPlayerAuthenticationDidChangeNotificationName
                     object:nil];
            
            [nc addObserver:self selector:@selector(undoRedoChanged:) name:EVENT_UNDO_CHANGED object:nil];
            delegate = self;
        }
    }
    return self;
}

- (void)authenticationChanged {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    
    if ([GKLocalPlayer localPlayer].isAuthenticated &&
        !userAuthenticated) {
        NSLog(@"Authentication changed: player authenticated.");
        userAuthenticated = TRUE;
    } else if (![GKLocalPlayer localPlayer].isAuthenticated &&
               userAuthenticated) {
        NSLog(@"Authentication changed: player not authenticated");
        userAuthenticated = FALSE;
    }
    
}

#pragma mark User functions

- (void)authenticateLocalUser {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    
    if (!gameCenterAvailable) return;
    
    void (^setGKEventHandlerDelegate)(NSError *) = ^ (NSError *error)
    {
        GKTurnBasedEventHandler *ev =
        [GKTurnBasedEventHandler sharedTurnBasedEventHandler];
        ev.delegate = self;
    };
    
    NSLog(@"Authenticating local user...");
    if ([GKLocalPlayer localPlayer].authenticated == NO) {
        [[GKLocalPlayer localPlayer]
         authenticateWithCompletionHandler:
         setGKEventHandlerDelegate];
    } else {
        NSLog(@"Already authenticated!");
        setGKEventHandlerDelegate(nil);
    }
}

-(NSString*) localPlayerID
{
    if ((gameCenterAvailable)
        && ([GKLocalPlayer localPlayer].authenticated))
        return [[GKLocalPlayer localPlayer] playerID];
    
    return nil;
}

- (void)findMatchWithMinPlayers:(int)minPlayers
                     maxPlayers:(int)maxPlayers
                 viewController:(UIViewController *)viewController {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    if (!gameCenterAvailable) return;
    
    presentingViewController = viewController;
    
    GKMatchRequest *request = [[GKMatchRequest alloc] init];
    request.minPlayers = minPlayers;
    request.maxPlayers = maxPlayers;
        
    GKTurnBasedMatchmakerViewController *mmvc =
    [[GKTurnBasedMatchmakerViewController alloc]
     initWithMatchRequest:request];
    
    mmvc.turnBasedMatchmakerDelegate = self;
    mmvc.showExistingMatches = YES;
    
    [presentingViewController presentModalViewController:mmvc
                                                animated:YES];
}

#pragma mark GKTurnBasedEventHandlerDelegate

-(void)handleInviteFromGameCenter:(NSArray *)playersToInvite {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    [presentingViewController
     dismissModalViewControllerAnimated:YES];
    GKMatchRequest *request =
    [[GKMatchRequest alloc] init];
    request.playersToInvite = playersToInvite;
    request.maxPlayers = 2;
    request.minPlayers = 4;
    GKTurnBasedMatchmakerViewController *viewController =
    [[GKTurnBasedMatchmakerViewController alloc]
     initWithMatchRequest:request];
    viewController.showExistingMatches = NO;
    viewController.turnBasedMatchmakerDelegate = self;
    [presentingViewController
     presentModalViewController:viewController animated:YES];
}

-(void)handleTurnEventForMatch:(GKTurnBasedMatch *)match {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    NSLog(@"Turn has happened");
    if ([match.matchID isEqualToString:currentMatch.matchID]) {
        if ([match.currentParticipant.playerID
             isEqualToString:[GKLocalPlayer localPlayer].playerID]) {
            // it's the current match and it's our turn now
            self.currentMatch = match;
            [delegate takeTurn:match];
        } else {
            // it's the current match, but it's someone else's turn
            self.currentMatch = match;
            [delegate layoutMatch:match];
        }
    } else {
        if ([match.currentParticipant.playerID
             isEqualToString:[GKLocalPlayer localPlayer].playerID]) {
            // it's not the current match and it's our turn now
            [delegate sendNotice:@"It's your turn for another match"
                        forMatch:match];
        } else {
            // it's the not current match, and it's someone else's
            // turn
        }
    }
}

-(void)handleMatchEnded:(GKTurnBasedMatch *)match {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    NSLog(@"Game has ended");
    if ([match.matchID isEqualToString:currentMatch.matchID]) {
        [delegate recieveEndGame:match];
    } else {
        [delegate sendNotice:@"Another Game Ended!" forMatch:match];
    }
}

#pragma mark GKTurnBasedMatchmakerViewControllerDelegate

-(void)turnBasedMatchmakerViewController:
(GKTurnBasedMatchmakerViewController *)viewController
                            didFindMatch:(GKTurnBasedMatch *)match {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    [presentingViewController
     dismissModalViewControllerAnimated:YES];
    self.currentMatch = match;
    GKTurnBasedParticipant *firstParticipant =
    [match.participants objectAtIndex:0];
    if (firstParticipant.lastTurnDate == NULL) {
        // It's a new game!
        [delegate enterNewGame:match];
    } else {
        if ([match.currentParticipant.playerID
             isEqualToString:[GKLocalPlayer localPlayer].playerID]) {
            // It's your turn!
            [delegate takeTurn:match];
        } else {
            // It's not your turn, just display the game state.
            [delegate layoutMatch:match];
        }
    }
    
    // This should already be set in the enterNewGame, takeTurn, or layoutMatch delegates?
//    [[GameState sharedGameState] setGcMatchID:[match matchID]];
    
    CCLOG(@"Replacing the scene -- watch out!");
	[[CCDirector sharedDirector] replaceScene:[SceneGameiPad scene]];
}

-(void)turnBasedMatchmakerViewControllerWasCancelled:
(GKTurnBasedMatchmakerViewController *)viewController {
    [presentingViewController
     dismissModalViewControllerAnimated:YES];
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    NSLog(@"has cancelled");
}

-(void)turnBasedMatchmakerViewController:
(GKTurnBasedMatchmakerViewController *)viewController
                        didFailWithError:(NSError *)error {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    [presentingViewController
     dismissModalViewControllerAnimated:YES];
    NSLog(@"Error finding match: %@", error.localizedDescription);
}

-(void)turnBasedMatchmakerViewController:
(GKTurnBasedMatchmakerViewController *)viewController
                      playerQuitForMatch:(GKTurnBasedMatch *)match {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    NSUInteger currentIndex =
    [match.participants indexOfObject:match.currentParticipant];
    GKTurnBasedParticipant *part;
    
    for (int i = 0; i < [match.participants count]; i++) {
        part = [match.participants objectAtIndex:
                (currentIndex + 1 + i) % match.participants.count];
        if (part.matchOutcome != GKTurnBasedMatchOutcomeQuit) {
            break;
        }
    }
    NSLog(@"playerquitforMatch, %@, %@",
          match, match.currentParticipant);
    [match participantQuitInTurnWithOutcome:
     GKTurnBasedMatchOutcomeQuit nextParticipant:part
                                  matchData:match.matchData completionHandler:nil];
}

#pragma mark Game functionality

-(void) undoRedoChanged:(NSNotification*)notification
{
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    [self performSelector:@selector(saveCurrentTurn) withObject:nil afterDelay:0.1];
//    [self saveCurrentTurn];
}

-(void) saveCurrentTurn
{
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
    // Ensure that Game Center is available
    if (!gameCenterAvailable) return;
    
    // Ensure that there is an active match
    if (currentMatch == nil) return;
    
    // Ensure that there is an active game
    GameState* state = [GameState sharedGameState];
    if (state == nil) return;
    
    // Ensure that the local player is the current player
    GKLocalPlayer* localPlayer = [GKLocalPlayer localPlayer];
    Player* currentPlayer = [state currentPlayer];
//    if (![[localPlayer playerID] isEqualToString:[currentPlayer gcPlayerID]])
//        return;

    
    NSData* compressedState = [state serialize];
    
    if ([[[currentMatch currentParticipant] playerID] isEqualToString:[currentPlayer gcPlayerID]] )
    {
        //NSLog(@"Saving match data of %d bytes into max match size of %d", [compressedState length], [currentMatch matchDataMaximumSize]);
        
        GKTurnBasedParticipant* party = [currentMatch currentParticipant];
        [currentMatch endTurnWithNextParticipant:party matchData:compressedState completionHandler:nil];
        
/*        [currentMatch saveCurrentTurnWithMatchData:compressedState completionHandler: ^(NSError *error) {
            if (error)
            {
                NSLog(@"Error saving game state: %@", error);
            }
            else
            {
                NSLog(@"Game state saved successfully");
            }
        }];
 */
    }
    else
    {
        GKTurnBasedParticipant* party = nil;
        
        for (GKTurnBasedParticipant* testParty in [currentMatch participants])
        {
            if ([[testParty playerID] isEqualToString:[[state currentPlayer] gcPlayerID]])
            {
                party = testParty;
                
                break;
            }
        }
        
        if (party == nil)
        {
            NSUInteger currentIndex = [currentMatch.participants
                                    indexOfObject:currentMatch.currentParticipant];
            party = [currentMatch.participants objectAtIndex:
                               ((currentIndex + 1) % [currentMatch.participants count ])];
        }
        
        NSAssert(party != nil, @"Turn-based participant of current player could not be found in this match!");
        
        [currentMatch endTurnWithNextParticipant:party matchData:compressedState completionHandler:nil];
    }
}


#pragma mark - GCTurnBasedMatchHelperDelegate

-(void)takeTurn:(GKTurnBasedMatch *)match {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    GameState* loadedState = [GameState restoreFromState:[match matchData]];

    NSLog(@"Taking turn for existing game from within game.  Match ID is '%@'", [match matchID]);

    [GameState setActiveState:loadedState];
    
//    [[CCDirector sharedDirector] replaceScene:[SceneGameiPad scene]];
    
    NSArray* parts = [match participants];
    
    NSLog(@"Entering new match (%@) with %d participants", [match matchID], [parts count]);
    
    for (int cnt = 0; cnt < [[match participants] count]; cnt++)
    {
        NSString* playerID = [(GKTurnBasedParticipant*)[[match participants] objectAtIndex:cnt] playerID];
        NSLog(@"Participant %d ID: '%@'", cnt, playerID);
        
        [[loadedState playerByID:cnt] setGcPlayerID:playerID];
    }

    GKLocalPlayer* localPlayer = [GKLocalPlayer localPlayer];
    NSLog(@"Local player ID: '%@'",[localPlayer playerID]);
    
}

- (void)enterNewGame:(GKTurnBasedMatch *)match
{
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    NSLog(@"Creating new match with existing match data of length %d", [[match matchData] length]);
    
    GameState* newState;
    NSArray* parts = [match participants];
    
    NSLog(@"Entering new match with %d participants", [parts count]);
    
    if (([match matchData] == nil) ||
        ([[match matchData] length] == 0))
    {
        newState = [[GameState alloc] initWith:[[match participants] count] p1:AI_TYPE_HUMAN p2:AI_TYPE_HUMAN p3:AI_TYPE_HUMAN p4:AI_TYPE_HUMAN];
        
        [newState setGcMatchID:[match matchID]];
        
        for (int cnt = 0; cnt < [[match participants] count]; cnt++)
        {
            NSString* playerID = [(GKTurnBasedParticipant*)[[match participants] objectAtIndex:cnt] playerID];
            NSLog(@"Participant %d ID: '%@'", cnt, playerID);
            
            [[newState playerByID:cnt] setGcPlayerID:playerID];
        }
    }
    else
    {
        newState = [GameState restoreFromState:[match matchData]];
    }
    
    NSLog(@"The match ID when creating the game is '%@'", [match matchID]);
    
    [newState setGcMatchID:[match matchID]];
    
    [GameState setActiveState:newState];
    
    GKLocalPlayer* localPlayer = [GKLocalPlayer localPlayer];
    NSLog(@"Local player ID: '%@'",[localPlayer playerID]);
}

- (void)layoutMatch:(GKTurnBasedMatch *)match
{
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    [self takeTurn:match];
}

-(void)recieveEndGame:(GKTurnBasedMatch *)match {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    [self layoutMatch:match];
}

-(void)sendNotice:(NSString *)notice forMatch:
(GKTurnBasedMatch *)match {
    CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);

    UIAlertView *av = [[UIAlertView alloc] initWithTitle:
                       @"Message for you, captain!" message:notice
                                                delegate:self cancelButtonTitle:@"Acknowledged"
                                       otherButtonTitles:nil];
    [av show];
}





@end
