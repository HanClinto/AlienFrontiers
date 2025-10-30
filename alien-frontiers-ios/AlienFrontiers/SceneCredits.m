//
//  SceneCredits.m
//  AlienFrontiers
//
//  Created by Clint Herron on 9/17/12.
//  Copyright 2012 HanClinto Games LLC. All rights reserved.
//


#import "SceneCredits.h"
#import "SceneMainMenuiPad.h"
#import "GameEvents.h"
#import "CCUIViewWrapper.h"

@implementation SceneCredits

// Semi-Singleton: you can access SceneCredits only as long as it is the active scene.
static SceneCredits* SceneCreditsInstance;

+(SceneCredits*) sharedScene
{
	NSAssert(SceneCreditsInstance != nil, @"SceneCreditsInstance not available!");
	return SceneCreditsInstance;
}

+(id) scene
{
	CCScene* scene = [CCScene node];
	SceneCredits* layer = [SceneCredits node];
	[scene addChild:layer];
	return scene;
}

-(id) init
{
	if ((self = [super init]))
	{
        //		NSAssert(sceneStartGameInstance == nil, @"another SceneMainMenu is already in use!");
        SceneCreditsInstance = self;
    }
	
	return self;
}

-(void) initChildren
{
    // This adds a solid color background.
    CCLayerColor* colorLayer = [CCLayerColor layerWithColor:ccc4(0, 0, 51, 255)];
    [self addChild:colorLayer z:InstructionsLayerTagColorBG tag:InstructionsLayerTagColorBG];
    
    CCSprite* bg = [CCSprite spriteWithFile:@"af_ipad_gui_bg.png"];
    [bg setAnchorPoint:ccp(0,0)];
    [self addChild:bg z:InstructionsLayerTagBG tag:InstructionsLayerTagBG];
    
    //		colorLayer = [CCLayerColor layerWithColor:ccc4(255, 255, 255, 51)];
    //		[self addChild:colorLayer z:InstructionsLayerTagWhiteout tag:InstructionsLayerTagWhiteout];
    
    CCSprite* title = [CCSprite spriteWithFile:@"af_game_setup.png"];
    [title setPosition:ccp(384, 900)];
    [self addChild:title z:InstructionsLayerTagTitle tag:InstructionsLayerTagTitle];
    
    CCNode* backButton = [self buttonFromImage:@"menu_back.png" downImage:@"menu_back_pushed.png" selector:@selector(backButtonTapped:)];
    [backButton setPosition:ccp(100, 974)];
    [self addChild:backButton z:InstructionsLayerTagButtonBack tag:InstructionsLayerTagButtonBack];
}


static int stackCount = 0;

-(void) onEnter
{
    stackCount += 1;
    
    [super onEnter];
    
    // HACK: Loading a TTF font first is needed to properly load PDF / HTML
	CCLabelTTF* label = [CCLabelTTF labelWithString:@"Testing" fontName:@"DIN-Black" fontSize:12];
    [label setVisible:false];
    
    NSString *path = [[NSBundle mainBundle]
                      pathForResource:@"AlienFrontiersRules-Final-Trimmed"
                      ofType:@"pdf"];
    CCLOG(@"Retrieving PDF from '%@'", path);
    NSURL *pdfUrl = [NSURL fileURLWithPath:path]; // creating a fileurl from path
    NSURLRequest *request = [NSURLRequest requestWithURL:pdfUrl];
    [webView loadRequest:request]; // Loading the url request using the url to a webview.
    [webView setScalesPageToFit:YES];
}


-(void) dealloc
{
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
	
	// The Layer will be gone now, to avoid crashes on further access it needs to be nil.
	if (SceneCreditsInstance == self)
        SceneCreditsInstance = nil;
}

- (void)backButtonTapped:(id)sender {
    [[NSNotificationCenter defaultCenter]
     postNotificationName:GUI_EVENT_BUTTON_CLICK
     object:self ];
    
    //    [[CCDirector sharedDirector] replaceScene:[SceneMainMenuiPad scene]];
    //    [self goToPage:3];
    
    if (stackCount >= 1)
    {
        stackCount--;
        [[CCDirector sharedDirector] popScene];
    }
    
	CCLOG(@"%@: %@", NSStringFromSelector(_cmd), self);
}

- (void)goToPage:(NSInteger)page {
    // NOTE: Hardcoded
    // TODO: Detect the number of pages from the PDF?
    int totalPages = 11;
    
    CGFloat totalHeight = [[webView scrollView] contentSize].height;
    
    CGFloat pageHeight = totalHeight / totalPages;
    
    // Scroll to bottom first
    [[webView scrollView] scrollRectToVisible:CGRectMake(0, totalHeight-1, 1, 1) animated:false];
    // Then scroll up
    [[webView scrollView] scrollRectToVisible:CGRectMake(0, pageHeight * (page - 1), 1, pageHeight) animated:false];
    
    /*
     
     NSInteger documentHeight = [[webView stringByEvaluatingJavaScriptFromString:@"window.outerHeight"] integerValue];
     
     NSInteger innerHeight = [[webView stringByEvaluatingJavaScriptFromString:@"window.innerHeight"] integerValue];
     
     float ratio = innerHeight/webView.bounds.size.height;
     
     NSInteger pageHeight = (NSInteger) (ratio*documentHeight/totalPages);
     
     [webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"window.scrollTo(0, %d)", (page-1)*pageHeight]];
     */
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error
{
    CCLOG(@"An error happened during load: %@", error);
}
- (void)webViewDidStartLoad:(UIWebView *)webView{
    CCLOG(@"loading started");
}
- (void)webViewDidFinishLoad:(UIWebView *)webView{
    CCLOG(@"finished loading");
}


@end
