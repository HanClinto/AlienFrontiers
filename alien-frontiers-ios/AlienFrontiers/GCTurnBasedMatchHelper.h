//
//  GCTurnBasedMatchHelper.h
//  AlienFrontiers
//
//  Created by Clint Herron on 10/17/12.
//  Copyright (c) 2012 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GameKit/GameKit.h>

#undef USE_GC

@protocol GCTurnBasedMatchHelperDelegate
- (void)enterNewGame:(GKTurnBasedMatch *)match;
- (void)layoutMatch:(GKTurnBasedMatch *)match;
- (void)takeTurn:(GKTurnBasedMatch *)match;
- (void)recieveEndGame:(GKTurnBasedMatch *)match;
- (void)sendNotice:(NSString *)notice
          forMatch:(GKTurnBasedMatch *)match;
@end

@interface GCTurnBasedMatchHelper : NSObject
<GKTurnBasedMatchmakerViewControllerDelegate, GKTurnBasedEventHandlerDelegate, GCTurnBasedMatchHelperDelegate> {
    BOOL gameCenterAvailable;
    BOOL userAuthenticated;
    UIViewController *presentingViewController;
    
    GKTurnBasedMatch *currentMatch;
    
    id <GCTurnBasedMatchHelperDelegate> delegate;
}

@property (nonatomic, retain)
id <GCTurnBasedMatchHelperDelegate> delegate;
@property (assign, readonly) BOOL gameCenterAvailable;
@property (nonatomic, retain) GKTurnBasedMatch *currentMatch;
@property (readonly) NSString* localPlayerID;
@property (readonly) BOOL userAuthenticated;

+ (GCTurnBasedMatchHelper *)sharedInstance;
- (void)authenticateLocalUser;
- (void)authenticationChanged;
- (void)findMatchWithMinPlayers:(int)minPlayers maxPlayers:(int)maxPlayers viewController:(UIViewController *)viewController;

@end