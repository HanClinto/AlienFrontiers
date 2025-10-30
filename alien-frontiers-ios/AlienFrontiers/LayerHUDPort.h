//
//  UserInterfaceLayer.h
//  ScenesAndLayers
//
//  Created by Steffen Itterheim on 28.07.10.
//  Copyright 2010 Steffen Itterheim. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "GameState.h"
#import "AFLayer.h"
#import "LayerTechCardTray.h"
#import "LayerTechCardInspector.h"

typedef enum
{
	UILayerTagCardTray = 0,
	UILayerTagFrame,
	UILayerTagFrameSprite,
	UILayerTagCorner,
	UILayerTagEdge,
	UILayerTagButtonRoll,
    UILayerTagButtonRollGlow,
	UILayerTagButtonUndo,
	UILayerTagButtonRedo,
	UILayerTagButtonDone,
	UILayerTagButtonDoneGlow,
	UILayerTagPlayerNumber,
	UILayerTagOreLabel,
	UILayerTagFuelLabel,
	UILayerTagColonyLabel,
	UILayerTagColonySprite,
	UILayerTagDiceLabel,
	UILayerTagDiceSprite,
	UILayerTagCardInspector,
	UILayerTagHintLabel,
	UILayerTagButtonOk,
    UILayerTagLogText,
    UILayerTagMenuButton,
    UILayerTagHelpButton,
    UILayerTagMenuFrame,
    UILayerTagFX,
} UserInterfaceLayerTags;


@interface LayerHUDPort : AFLayer 
{
	bool firstTimeShown;
    
    UITextView* text;
    
    int previousPlayer;
    int previousOre;
    int previousFuel;
    int previousShips;
    int previousColonies;
}

-(void) resourcesChanged:(NSNotification*)notification;
-(void) undoRedoChanged:(NSNotification*)notification;
- (void) updateTurnDoneButton:(NSNotification *)notification;
-(void)nextPlayer:(NSNotification *) notification;
-(void) updateCards:(NSNotification *) notification;
-(void) updateHint:(NSNotification*)notification;
-(void) updateButtons:(NSNotification *) notification;

@property (readonly) CGPoint rollingTrayPosition;
- (void)setElementVisible:(CCNode*) element visible:(bool)toVis;

-(void) buildGUI;

@end
