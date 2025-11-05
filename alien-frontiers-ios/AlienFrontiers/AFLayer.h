//
//  AFLayer.h
//  AlienFrontiers
//
//  Created by Clint Herron on 4/26/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "cocos2d.h"
#import "CCUIViewWrapper.h"

#define IGNORE_LANDSCAPE

#ifdef IGNORE_LANDSCAPE
#define DEVICE_ORIENTATION [UIDevice currentDevice]
#else
#define DEVICE_ORIENTATION [UIDevice currentDevice].orientation
#endif

typedef enum
{
	ButtonSprite,
    ButtonLabelShadow,
	ButtonLabel,
} ButtonTags;

#define FONT_OPACITY_ENABLED 0xFF
#define FONT_OPACITY_DISABLED 0x66

// Just some utility functions that I find myself needing on many layers.
@interface AFLayer : CCLayer {

}

-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage selector:(SEL)selector;
-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize;
-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize fontColor:(ccColor3B)fontColor;
-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize fontColor:(ccColor3B)fontColor textShadow:(bool)useShadow;
-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage inactiveImage:(NSString*)inactiveImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize;
-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage inactiveImage:(NSString*)inactiveImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize fontColor:(ccColor3B)fontColor;
-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage inactiveImage:(NSString*)inactiveImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize fontColor:(ccColor3B)fontColor textShadow:(bool) useShadow;

-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage inactiveImage:(NSString*)inactiveImage selector:(SEL)selector;
-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage selector:(SEL)selector;

-(void) setButtonLabel:(CCNode*)wrapper to:(NSString*)caption;
-(void) setButtonIsEnabled:(CCNode*)wrapper enabled:(bool)val;
-(void) enableButton:(CCNode*)wrapper;
-(void) disableButton:(CCNode*)wrapper;

-(void) removeSprite:(id)sender;

@property (readonly) CGRect childBounds;

@end
