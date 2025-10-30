//
//  LayerGameOverMenu.h
//  AlienFrontiers
//
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "GameEvents.h"
#import "AFLayer.h"

typedef enum
{
	GameOverMenuLayerTagBackground,
    GameOverMenuLayerTagCongrats,
    GameOverMenuLayerTagButtonQuit,
    GameOverMenuLayerTagStats,
    
	GameOverMenuLayerTagTitle,
	GameOverMenuLayerTagScore1,
	GameOverMenuLayerTagScore2,
	GameOverMenuLayerTagScore3,
	GameOverMenuLayerTagScore4,
} GameOverMenuLayerTags;


@interface LayerGameOverMenu : AFLayer 
{
    CCLayerColor *backgroundLayer;
    CCNode *quitButton;
    
    UITextView *gameStats;
}

-(void) activate;
-(void) deactivate;

@end