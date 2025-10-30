# Alien Frontiers: Kickstarter Edition for Web

Way back in the day (circa 2011), there was a [kickstarter for an iOS version](https://www.kickstarter.com/projects/clevermojogames/alien-frontiers-for-ipad) of the Alien Frontiers board game. So many people pulled weight and helped -- with programming, with artwork, with design, and with financial backing -- it was a wonderful passion project for me, and I was very thankful to be able to do it.

However, bitrot has set in over the years, and even I find myself unable to play the game that I worked so hard on to enjoy.

I'm sad that so many people contributed to this project, and very few of us still have operating devices that are able to run this old game.

Several years ago, the original publishers gave me permission to re-publish the original Kickstarter version of the game on my own account (provided it was given away for free).

[This worked out well](https://www.reddit.com/r/boardgames/comments/74ci4z/my_psa_there_is_a_free_alien_frontiers_ios_app/) for a while, until my own iOS subscription ran out, and the app was once again pulled from the store.

I can't play my own game that I wrote on my own iPad, but I do have the original source code.

So I've taken it upon myself to see if I can make a reasonable port of the Kickstarter version of the game for the web. This (likely) won't have multiplayer, or expansions, or many of the hopes and dreams that we had for where this game might go.

But hopefully this is a way of letting this stay alive for those of us who loved this game, and hate to see this part of the gaming community die out due to bitrot and overly restrictive iOS store rules.

To everyone who backed the game and believed in this project, please consider this my combination apology and thank-you letter to you all. ❤️ 

# Project Goals

* Within reason, to be a faithful reproduction of the Kickstarter version of the iOS board game for Alien Frontiers
* To run seamlessly via a web interface, playable on a static github.io website with no active server required
* To work on mobile, tablet, or desktop devices
* To support the iPad portrait game layout / resolution (retina display, so 1536x2048), and nothing more. There were fits and starts towards landscape layout, but I'm not going to invest in that at this time.
* Maybe, hopefully, see if agentic AI (Copilot?) can take some of the drudgery out of this port. I'd love to give it an iPad simulator with the old game on it and tell it to get 1-to-1 pixel matching with the original, but I can't quite do that yet. Even so, I'm collecting whatever screenshots I can find from the original, and am using them as a reference-point for the AI to match as much as it can.

# Project Technology

* I want this project to use a minimum of dependencies. I don't even like NPM, but if I need to use it so that I have decent access to things like Phaser, then that's fine. But if I can do it in pure HTML + Javascript, then that's very tempting for me also.
* The original project used Cocos2D, and there is (apparently?) a Cocos2D-X which can compile for HTML. I don't know if it's worth trying to leverage this or not, but it's something to consider before porting it to another framework or library.

# Reference implementations

* Reference screenshots are in the folder `reference-screenshots`. 
* A sample video of the old gameplay is available to view on Vimeo: https://vimeo.com/34362117?fl=pl&fe=vl
