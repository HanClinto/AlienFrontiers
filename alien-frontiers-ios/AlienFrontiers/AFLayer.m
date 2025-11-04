//
//  AFLayer.m
//  AlienFrontiers
//
//  Created by Clint Herron on 4/26/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "AFLayer.h"


@implementation AFLayer

-(void) onEnter
{
    [self initChildren];
    
    [super onEnter];
}

-(void) initChildren
{
    
}

-(void) onExit
{
	[self removeAllChildrenWithCleanup:true];

    [super onExit];
}

-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize
{
	return [self buttonFromImage:upImage downImage:downImage inactiveImage:nil selector:selector label:caption fontSize:fontSize fontColor:ccWHITE];
}

-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage inactiveImage:(NSString*)inactiveImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize
{
	return [self buttonFromImage:upImage downImage:downImage inactiveImage:inactiveImage selector:selector label:caption fontSize:fontSize fontColor:ccWHITE];
}

-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize fontColor:(ccColor3B)fontColor
{
    return [self buttonFromImage:upImage downImage:downImage inactiveImage:nil selector:selector label:caption fontSize:fontSize fontColor:fontColor];
}

-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize fontColor:(ccColor3B)fontColor textShadow:(bool)useShadow
{
	return [self buttonFromImage:upImage downImage:downImage inactiveImage:nil selector:selector label:caption fontSize:fontSize fontColor:fontColor textShadow:useShadow];
}


-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage inactiveImage:(NSString*)inactiveImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize fontColor:(ccColor3B)fontColor
{
    return [self buttonFromImage:upImage downImage:downImage inactiveImage:nil selector:selector label:caption fontSize:fontSize fontColor:fontColor textShadow:false];
}


-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage inactiveImage:(NSString*)inactiveImage selector:(SEL)selector label:(NSString*)caption fontSize:(int)fontSize fontColor:(ccColor3B)fontColor textShadow:(bool) useShadow
{
	CCMenuItem* button;
    
    if (inactiveImage != nil)
    {
        button = [CCMenuItemImage itemWithNormalImage:upImage selectedImage:downImage disabledImage:inactiveImage
                                                           target:self
                                                         selector:selector ];
    }
    else
    {
        button = [CCMenuItemImage itemWithNormalImage:upImage selectedImage:downImage
                                               target:self
                                             selector:selector ];
    }
    
    
	CCMenu* buttonMenu = [CCMenu menuWithItems:button, nil];
    
	buttonMenu.position = CGPointMake(0,0);
	buttonMenu.anchorPoint = CGPointMake(0.5f, 0.5f);
	
	CCLabelTTF* label = [CCLabelTTF labelWithString:caption fontName:@"DIN-Black" fontSize:fontSize];
	label.color = fontColor;
	label.position = CGPointMake(1,1);
	label.anchorPoint = CGPointMake(0.5f, 0.5f);
    
	CCNode* wrapper = [CCNode node];
	[wrapper addChild: buttonMenu z:ButtonSprite tag:ButtonSprite];
	[wrapper addChild: label z:ButtonLabel tag:ButtonLabel];
    
    if (useShadow)
    {
        CCLabelTTF* shadowLabel = [CCLabelTTF labelWithString:caption fontName:@"DIN-Black" fontSize:fontSize];
        shadowLabel.color = ccBLACK;
        shadowLabel.opacity = 127;
        shadowLabel.position = CGPointMake(3,-1);
        shadowLabel.anchorPoint = CGPointMake(0.5f, 0.5f);
        
        [wrapper addChild: shadowLabel z:ButtonLabelShadow tag:ButtonLabelShadow];
    }
    
	
	return wrapper;
}

-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage selector:(SEL)selector
{
    return [self buttonFromImage:upImage downImage:downImage inactiveImage:nil selector:selector];
}

-(CCNode*) buttonFromImage:(NSString*)upImage downImage:(NSString*)downImage inactiveImage:(NSString*)inactiveImage selector:(SEL)selector
{
	CCMenuItemImage* button;
    
    if (inactiveImage != nil)
    {
        button = [CCMenuItemImage itemWithNormalImage:upImage selectedImage:downImage disabledImage:inactiveImage
                                               target:self
                                             selector:selector ];
    }
    else
    {
        button = [CCMenuItemImage itemWithNormalImage:upImage selectedImage:downImage
                                               target:self
                                             selector:selector ];
        
    }
	
	CCMenu* buttonMenu = [CCMenu menuWithItems:button, nil];
	buttonMenu.position = CGPointMake(0,0);
	buttonMenu.anchorPoint = CGPointMake(0.5f, 0.5f);
	
	// TODO: Needed?
	CCNode* wrapper = [CCNode node];
	[wrapper addChild: buttonMenu z:ButtonSprite tag:ButtonSprite];
	
	return wrapper;
}

-(void) setButtonLabel:(CCNode*)wrapper to:(NSString*)caption
{
	CCLabelTTF* label = (CCLabelTTF*) [wrapper getChildByTag:ButtonLabel];
	CCLabelTTF* labelShadow = (CCLabelTTF*) [wrapper getChildByTag:ButtonLabelShadow];
    
	if (label != nil)
	{
		[label setString:caption];
	}
    
    if (labelShadow != nil)
        [labelShadow setString:caption];
}

-(void) disableButton:(CCNode*)wrapper
{
    [self setButtonIsEnabled:wrapper enabled:false];
}

-(void) enableButton:(CCNode*)wrapper
{
    [self setButtonIsEnabled:wrapper enabled:true];
}

-(void) setButtonIsEnabled:(CCNode*)wrapper enabled:(bool)val
{
	CCMenu* menu = (CCMenu*) [wrapper getChildByTag:ButtonSprite];
	
	if (menu != nil)
	{
        for (CCMenuItemImage* item in [menu children]) {
            if ([item isMemberOfClass:[CCMenuItemImage class]])
            {
                [item setIsEnabled:val];
            }
        }

        CCLabelTTF* label = (CCLabelTTF*) [wrapper getChildByTag:ButtonLabel];
        
        if (label)
        {
            if (val)
            {
                [label setOpacity:FONT_OPACITY_ENABLED];
            }
            else
            {
                [label setOpacity:FONT_OPACITY_DISABLED];
            }
        }

        /*
        for (CCLabelTTF* item in [menu children]) {
            if ([item isMemberOfClass:[CCLabelTTF class]])
            {
                if (val)
                    [item setVisible:true];
                //                    [l setColor:ccWHITE];
//                    [l setOpacity:FONT_OPACITY_ENABLED];
                else
                    [item setVisible:false];
//                    [l setColor:ccGRAY];
//                    [l setOpacity:FONT_OPACITY_DISABLED];
            }
        }
         */
	}
}


-(CGRect) childBounds
{
	CGRect retVal;
	
	bool first = true;
	
	for (CCSprite *sprite in [self children])
	{
		if (first)
			retVal = sprite.boundingBox;
		else
			retVal = CGRectUnion(retVal, sprite.boundingBox);
		
		first = false;
	}
	
	return retVal;
	
}

-(void) removeSprite:(id)sender {
    
	[self removeChild:sender cleanup:YES];
}

@end
