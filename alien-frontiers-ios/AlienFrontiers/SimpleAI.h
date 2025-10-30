//
//  SimpleAI.h
//  AlienFrontiers
//
//  Created by Clint Herron on 9/10/11.
//  Copyright 2011 HanClinto Games LLC. All rights reserved.
//

#import "AIPlayer.h"

@interface SimpleAI : AIPlayer

-(void) launchColony:(Player*)player;
-(void) doNextAction:(Player*)player;

@end
