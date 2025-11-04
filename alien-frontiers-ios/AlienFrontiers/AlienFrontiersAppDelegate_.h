//
//  AlienFrontiersAppDelegate.h
//  AlienFrontiers
//
//  Created by Clint Herron on 1/12/11.
//  Copyright HanClinto Games LLC 2011. All rights reserved.
//

#import <UIKit/UIKit.h>

@class RootViewController;

@interface AlienFrontiersAppDelegate : NSObject <UIApplicationDelegate> {
	UIWindow			*window;
	RootViewController	*viewController;
}

@property (nonatomic, strong) UIWindow *window;

@end
