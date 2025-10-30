# Artificial Intelligence in Alien Frontiers

The main thing I've been working on is overhauling the artificial intelligence system. The posts I made back in November were for a pretty simplistic AI -- it didn't know how to raid, use alien tech, or even look more than one step ahead. Pretty simplistic AI that played a very "basic" game of Alien Frontiers, and is just enough to be interesting.

However, it gets pretty boring beating up on that punching bag time after time, and we need opportunity for more challenging play. There are three game modes planned for Alien Frontiers:

1) Pass & Play
2) One (or more) human player against AI
3) Async online human-only multiplayer

We decided that for the initial release we could have EITHER asynchronous multiplayer, OR artificial intelligence. Maybe it was a selfish decision on my part, but I decided to prioritize the artificial intelligence (since I tend to enjoy gaming on my iPad for times when I'm bored and just want to beat up on something) -- I've never played an async multiplayer game of Carc on my iPad, but I've played dozens (if not closer to hundreds) of games against the AI. I started work on Alien Frontiers because it's a game that I enjoy, and I'm writing this app as a game that I want to play. All that to say -- sorry to my friends who were hoping for async to be released before AI... but it will have to wait for a post-release update.

So given that we decided that, after getting the "first cut" of the AI done, I decided that I needed to make a stronger AI in order for fans of the game (me included!) to play.


## Simple Heuristics

The first kind of AI that I made (that I posted about last month) is called a heuristic AI. It's very simple -- it is basically a long chain of if/else statements. The logic roughly goes as follows:

d10-0If I've placed all my dice, end my turn.
d10-1Otherwise, if I have a colony waiting to launch on the Colonist Hub, then launch it.
d10-2Otherwise, if I can use the Colony Constructor, do so.
d10-3Otherwise, if I can use the Terraforming Station, do so.
d10-4Otherwise, if I can build a ship, do so.
d10-5Otherwise, if I can get ore and need it, do so.
d10-6Otherwise, if I can get fuel and need it, do so.
d10-7Otherwise, place any remaining dice on the Colonist Hub.
d10-8If there's no room on the Colonist Hub, place all remaining dice on the Maintenance Bay.

Simple, neh?

So you can see how this AI could win sometimes (it goes like gangbusters on the Terraforming Station), but if you're on your toes, it's hard to be blindsided.

But this type of AI is very hard to expand, and very hard to make it perform complex maneuvers. For instance, let's just cover the example of teaching it to use die manipulators to build ships.

The simple method expects a pair to already exist:
If I have a pair of dice and enough resources to build a ship, then dock the pair and build the ships.

But what if we want to use a booster pod?
If I have a pair of dice
OR I have two dice next to each other AND a Booster Pod / Stasis Beam AND fuel to use it
AND I have enough resources to build my ship (AND enough to use my booster / stasis if I need it)
THEN dock the pair and build the ships.

But wait, what if we want to use the polarity device too? What about accounting for the Pohl Foothills tech discount, or the ship building discount? What if I only knew how to use my Data Crystal to borrow Herbert Valley's power so that I could build the ship? What if I could buy a Data Crystal and THEN use it? What if I could discard the Temporal Warper and get it that way instead of purchasing it?

etc etc etc -- the list of special cases quickly grows to be huge, and in this example we have ONLY been looking at building ships -- not to mention using the three different ways that you can land colonies, or how you can juggle colonies around once they ARE landed.

Alright, and let's imagine that you DO make a kickin' heuristic, and it's interesting to play against and compelling in its challenge... how do you scale the difficulty without going through the WHOLE thing by hand again?


## "I Suggest a New Strategy, R2"

It quickly became apparent that -- while the heuristic approach was great for getting off the ground -- it was really more of a newbie / placeholder AI. It would be less frustrating teaching a Labrador Retriever to play Alien Frontiers than it would be to manage an AI with all those special cases like that.

So I decided to make an Exhaustive AI that does the ol' favorite method of brute-forcing a problem.

The AI now crawls like an army of insects -- looking through every possible permutation of choices, seeing where they end up, and then choosing the one that it likes the most.

In essence, the computer is doing what AP'ers do, but it's doing it without too much backtracking, and with a perfect memory, so it eventually arrives at a decision that maximizes what it thinks is best. Whereas a human player might sit there and stare at the board and his stock of 5 dice and 3 techs for 5-10 minutes (you know who you are!), the computer can chug through the permutations of options in FAR less time.

All of the information about the game (dice placements, values, colonies, orbitals, cards, etc) at any point in time is storedd in a "GameState" object. So if you ever need to undo a move, you can restore the previous GameState, and the game is back exactly how it was previously.

But more than just going back in time, the game now uses GameStates to look into the future, and examine what could be. It builds a game state for every single place that it could use each die (or combination of dice), and then -- branching off of each of those game states, it goes through each of the possible game states that could come from that -- and so-on, as deep as the rabbit hole needs to go. This chain of options can get pretty large pretty fast, and one of the things that I've been working on is paring down that tree of options to a reasonable size.

Once I have built all of the road map of ALL possible legal moves (numbering in the hundreds or thousands), I have a small routine that calculates a number representing the "worth" of each of those game states. This number basically is meant to measure how well a player is doing at any particular moment -- you get a higher value score if you have more ships, more resources, more colonies, more tech, more points, etc. For every game state, we calculate the value of for every player. For instance, the computer might score 23.7 for a particular game state, and the other two players score 19 and 17 respectively. The AI looks at which one is ahead, and calculates its own score relative to the other player who is leading. Because if you can take a victory point off of your main rival, it's almost as good as gaining a victory point yourself, right? We say that points taken away from opponents are 80% as valuable as points you gain yourself.

So the final score from our example is:
23.7 - 19 * (0.8) = 8.5

This gives some impetus to raid opponents, and helps bring a bit of "bash the leader" into the mix. If we want to make an AI be "less bashy", then we turn down that 0.8 down to 0.4 or so, but if we want to make a vicious AI (like the witch / warlock AIs in the Carc app), all we have to do is dial up the 0.8 to be 1.2 or so, and suddenly the AI cares more about destroying the leader than it does in advancing its own cause (just like the Carc AI).

## The Example

The thing that made me go "SWEET!" at 3:00 in the morning was when I finally worked out my memory and multithreaded issues, and the AI made a pretty cool combo move against me -- here's what happened:

The AI rolled a 4, 4, 5. It had a booster pod, alien monument, resource cache, 2 ore and 5 fuel. It owned Heinlein, I owned Burroughs with the ship.

It decided to build a ship with its pair of 4's, then use the booster to make the 5 into a 6, then terraform it, then place the new colony on the Burroughs Desert, destroying my artifact ship in the process.

Here's the internal tree structure from its choices where it shows the whole plethora of options it sees, as well as the value of each choice. The leftmost number is the value of that node's most valuable child (so basically, the max score from going down that path), while the rightmost number is the value of that individual node.

It might be a bit confusing to follow -- not all of the moves are annotated, but hopefully you can get the general picture of how the new "Exhaustive AI" structures itself and thinks. Fairly standard depth-first search, but it's just really cool to see it in action and coming up with these cool combos that you didn't program in explicitly.

When it comes to the decision tree of where to land the colonies, you'll see that the locations look pretty equivalent to the AI at this point, with two exceptions. It already controls Heinlein, so it doesn't gain as many victory points from landing there, so it will naturally choose one of the other locations. Burroughs (the final option) is worth MANY more points, because not only does it give a victory point to the AI player, but it also takes a victory point away from the opponent AND reduces their ship fleet by one. This shows up in the valuation function where suddenly the lead opponent is knocked back several points, and so the AI (correctly) chooses this option.

```
 Getting the next game state from 183 children
 22.229994:  State: 'Docking 0 ships at ColonistHub': (-9.120001)
 -0.020003:      State: 'Docking ships (5) at SolarConverter': (-8.969999)
 -8.020002:          State: 'Docking ships (4) at LunarMine': (-8.070005)
 -8.020002:              State: '(null)': (-8.020002)
 -8.020002:          State: 'Docking ships (4) at LunarMine': (-8.070005)
 -8.020002:              State: '(null)': (-8.020002)
 -6.970000:          State: 'Docking ships (4, 4) at AlienArtifact': (-8.969999)
 -6.970000:              State: 'Purchasing tech StasisBeam': (-6.970000)
 -6.970000:              State: 'Purchasing tech GravityManipulator': (-6.970000)
 -6.970000:              State: 'Purchasing tech PolarityDevice': (-6.970000)
 -0.020003:          State: 'Docking ships (4, 4) at Shipyard': (-0.020003)
 -6.970000:          State: 'Docking ships (4, 4) at OrbitalMarket': (-8.969999)
 -8.969999:              State: 'Did 0 market trade at 1:1 price': (-8.969999)
 -8.020002:              State: 'Did 1 market trade at 1:1 price': (-8.020002)
 -7.370001:              State: 'Did 2 market trade at 1:1 price': (-7.370001)
 -7.020003:              State: 'Did 3 market trade at 1:1 price': (-7.020003)
 -6.970000:              State: 'Did 4 market trade at 1:1 price': (-6.970000)
 -7.220000:              State: 'Did 5 market trade at 1:1 price': (-7.220000)
 -7.770003:              State: 'Did 6 market trade at 1:1 price': (-7.770003)
 -8.620001:              State: 'Did 7 market trade at 1:1 price': (-8.620001)
 -8.920004:          State: '(null)': (-8.920004)
 -0.220000:      State: 'Docking ships (4) at SolarConverter': (-8.920004)
 -8.070005:          State: 'Docking ships (5) at LunarMine': (-8.020002)
 -8.070005:              State: '(null)': (-8.070005)
 -8.070005:          State: 'Docking ships (4) at LunarMine': (-8.020002)
 -8.070005:              State: '(null)': (-8.070005)
 -6.920004:          State: 'Docking ships (5, 4) at AlienArtifact': (-8.920004)
 -6.920004:              State: 'Purchasing tech StasisBeam': (-6.920004)
 -6.920004:              State: 'Purchasing tech GravityManipulator': (-6.920004)
 -6.920004:              State: 'Purchasing tech PolarityDevice': (-6.920004)
 -8.969999:          State: '(null)': (-8.969999)
 -0.220000:          State: '(null)': (-8.969999)
 -0.220000:              State: 'Docking ships (5, 5) at Shipyard': (-0.220000)
 -7.620001:              State: 'Docking ships (5, 5) at OrbitalMarket': (-8.969999)
 -8.969999:                  State: 'Did 0 market trade at 1:1 price': (-8.969999)
 -8.219999:                  State: 'Did 1 market trade at 1:1 price': (-8.219999)
 -7.770003:                  State: 'Did 2 market trade at 1:1 price': (-7.770003)
 -7.620001:                  State: 'Did 3 market trade at 1:1 price': (-7.620001)
 -7.770003:                  State: 'Did 4 market trade at 1:1 price': (-7.770003)
 -8.219999:                  State: 'Did 5 market trade at 1:1 price': (-8.219999)
 -0.220000:      State: 'Docking ships (4) at SolarConverter': (-8.920004)
 -8.070005:          State: 'Docking ships (5) at LunarMine': (-8.020002)
 -8.070005:              State: '(null)': (-8.070005)
 -8.070005:          State: 'Docking ships (4) at LunarMine': (-8.020002)
 -8.070005:              State: '(null)': (-8.070005)
 -6.920004:          State: 'Docking ships (5, 4) at AlienArtifact': (-8.920004)
 -6.920004:              State: 'Purchasing tech StasisBeam': (-6.920004)
 -6.920004:              State: 'Purchasing tech GravityManipulator': (-6.920004)
 -6.920004:              State: 'Purchasing tech PolarityDevice': (-6.920004)
 -8.969999:          State: '(null)': (-8.969999)
 -0.220000:          State: '(null)': (-8.969999)
 -0.220000:              State: 'Docking ships (5, 5) at Shipyard': (-0.220000)
 -7.620001:              State: 'Docking ships (5, 5) at OrbitalMarket': (-8.969999)
 -8.969999:                  State: 'Did 0 market trade at 1:1 price': (-8.969999)
 -8.219999:                  State: 'Did 1 market trade at 1:1 price': (-8.219999)
 -7.770003:                  State: 'Did 2 market trade at 1:1 price': (-7.770003)
 -7.620001:                  State: 'Did 3 market trade at 1:1 price': (-7.620001)
 -7.770003:                  State: 'Did 4 market trade at 1:1 price': (-7.770003)
 -8.219999:                  State: 'Did 5 market trade at 1:1 price': (-8.219999)
 0.629999:      State: 'Docking ships (5) at LunarMine': (-8.219999)
 -6.220000:          State: 'Docking ships (4, 4) at AlienArtifact': (-8.219999)
 -6.220000:              State: 'Purchasing tech StasisBeam': (-6.220000)
 -6.220000:              State: 'Purchasing tech GravityManipulator': (-6.220000)
 -6.220000:              State: 'Purchasing tech PolarityDevice': (-6.220000)
 0.629999:          State: 'Docking ships (4, 4) at Shipyard': (0.629999)
 -7.620001:          State: 'Docking ships (4, 4) at OrbitalMarket': (-8.219999)
 -8.219999:              State: 'Did 0 market trade at 1:1 price': (-8.219999)
 -7.770003:              State: 'Did 1 market trade at 1:1 price': (-7.770003)
 -7.620001:              State: 'Did 2 market trade at 1:1 price': (-7.620001)
 -7.770003:              State: 'Did 3 market trade at 1:1 price': (-7.770003)
 -8.219999:              State: 'Did 4 market trade at 1:1 price': (-8.219999)
 -8.469999:          State: '(null)': (-8.469999)
 0.280000:      State: 'Docking ships (4) at LunarMine': (-8.219999)
 -6.220000:          State: 'Docking ships (5, 4) at AlienArtifact': (-8.219999)
 -6.220000:              State: 'Purchasing tech StasisBeam': (-6.220000)
 -6.220000:              State: 'Purchasing tech GravityManipulator': (-6.220000)
 -6.220000:              State: 'Purchasing tech PolarityDevice': (-6.220000)
 -8.469999:          State: '(null)': (-8.469999)
 0.280000:          State: '(null)': (-8.469999)
 0.280000:              State: 'Docking ships (5, 5) at Shipyard': (0.280000)
 -8.070005:              State: 'Docking ships (5, 5) at OrbitalMarket': (-8.469999)
 -8.469999:                  State: 'Did 0 market trade at 1:1 price': (-8.469999)
 -8.120001:                  State: 'Did 1 market trade at 1:1 price': (-8.120001)
 -8.070005:                  State: 'Did 2 market trade at 1:1 price': (-8.070005)
 -8.320005:                  State: 'Did 3 market trade at 1:1 price': (-8.320005)
 0.280000:      State: 'Docking ships (4) at LunarMine': (-8.219999)
 -6.220000:          State: 'Docking ships (5, 4) at AlienArtifact': (-8.219999)
 -6.220000:              State: 'Purchasing tech StasisBeam': (-6.220000)
 -6.220000:              State: 'Purchasing tech GravityManipulator': (-6.220000)
 -6.220000:              State: 'Purchasing tech PolarityDevice': (-6.220000)
 -8.469999:          State: '(null)': (-8.469999)
 0.280000:          State: '(null)': (-8.469999)
 0.280000:              State: 'Docking ships (5, 5) at Shipyard': (0.280000)
 -8.070005:              State: 'Docking ships (5, 5) at OrbitalMarket': (-8.469999)
 -8.469999:                  State: 'Did 0 market trade at 1:1 price': (-8.469999)
 -8.120001:                  State: 'Did 1 market trade at 1:1 price': (-8.120001)
 -8.070005:                  State: 'Did 2 market trade at 1:1 price': (-8.070005)
 -8.320005:                  State: 'Did 3 market trade at 1:1 price': (-8.320005)
 -7.370001:      State: 'Docking ships (5, 4) at AlienArtifact': (-9.120001)
 -7.720000:          State: 'Purchasing tech StasisBeam': (-7.120001)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 -7.370001:          State: 'Purchasing tech GravityManipulator': (-7.120001)
 -7.370001:              State: '(null)': (-7.370001)
 -7.720000:          State: 'Purchasing tech PolarityDevice': (-7.120001)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 -7.370001:      State: 'Docking ships (5, 4) at AlienArtifact': (-9.120001)
 -7.720000:          State: 'Purchasing tech StasisBeam': (-7.120001)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 -7.370001:          State: 'Purchasing tech GravityManipulator': (-7.120001)
 -7.370001:              State: '(null)': (-7.370001)
 -7.720000:          State: 'Purchasing tech PolarityDevice': (-7.120001)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 -7.370001:      State: 'Docking ships (4, 4) at AlienArtifact': (-9.120001)
 -7.720000:          State: 'Purchasing tech StasisBeam': (-7.120001)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 -7.370001:          State: 'Purchasing tech GravityManipulator': (-7.120001)
 -7.370001:              State: '(null)': (-7.370001)
 -7.720000:          State: 'Purchasing tech PolarityDevice': (-7.120001)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 -7.720000:              State: '(null)': (-7.370001)
 -7.720000:                  State: '(null)': (-7.720000)
 22.229994:      State: 'Docking ships (4, 4) at Shipyard': (-0.470000)
 22.229994:          State: '(null)': (-0.820006)
 22.229994:              State: 'Docking ships (6) at TerraformingStation': (-2.570006)
 11.429995:                  State: 'Land colony at Heinlein': (11.429995)
 13.429995:                  State: 'Land colony at Pohl': (13.429995)
 13.429995:                  State: 'Land colony at Von Vogt': (13.429995)
 13.429995:                  State: 'Land colony at Bradbury': (13.429995)
 13.429995:                  State: 'Land colony at Asimov': (13.429995)
 13.429995:                  State: 'Land colony at Herbert': (13.429995)
 13.429995:                  State: 'Land colony at Lem': (13.429995)
 22.229994:                  State: 'Land colony at Burroughs': (22.229994)
 -8.570005:      State: 'Docking ships (4, 4) at OrbitalMarket': (-9.120001)
 -9.370001:          State: '(null)': (-9.120001)
 -9.370001:              State: '(null)': (-9.370001)
 -8.820005:          State: 'Did market trade at 1 price': (-8.469999)
 -8.820005:              State: '(null)': (-8.820005)
 -8.570005:          State: 'Did market trade at 1 price': (-8.120001)
 -8.570005:              State: '(null)': (-8.570005)
 -8.620001:          State: 'Did market trade at 1 price': (-8.070005)
 -8.620001:              State: '(null)': (-8.620001)
 -8.969999:          State: 'Did market trade at 1 price': (-8.320005)
 -8.969999:              State: '(null)': (-8.969999)
 -9.370001:          State: '(null)': (-9.370001)
 22.229994:      State: '(null)': (-9.370001)
 22.229994:          State: 'Docking ships (4, 4) at Shipyard': (-0.820006)
 22.229994:              State: 'Docking ships (6) at TerraformingStation': (-2.570006)
 11.429995:                  State: 'Land colony at Heinlein': (11.429995)
 13.429995:                  State: 'Land colony at Pohl': (13.429995)
 13.429995:                  State: 'Land colony at Von Vogt': (13.429995)
 13.429995:                  State: 'Land colony at Bradbury': (13.429995)
 13.429995:                  State: 'Land colony at Asimov': (13.429995)
 13.429995:                  State: 'Land colony at Herbert': (13.429995)
 13.429995:                  State: 'Land colony at Lem': (13.429995)
 22.229994:                  State: 'Land colony at Burroughs': (22.229994)
 -8.570005:          State: 'Docking ships (4, 4) at OrbitalMarket': (-9.370001)
 -9.370001:              State: 'Did 0 market trade at 1:1 price': (-9.370001)
 -8.820005:              State: 'Did 1 market trade at 1:1 price': (-8.820005)
 -8.570005:              State: 'Did 2 market trade at 1:1 price': (-8.570005)
 -8.620001:              State: 'Did 3 market trade at 1:1 price': (-8.620001)
 -0.820006:      State: '(null)': (-9.370001)
 -0.820006:          State: 'Docking ships (5, 5) at Shipyard': (-0.820006)
 -8.570005:          State: 'Docking ships (5, 5) at OrbitalMarket': (-9.370001)
 -9.370001:              State: 'Did 0 market trade at 1:1 price': (-9.370001)
 -8.820005:              State: 'Did 1 market trade at 1:1 price': (-8.820005)
 -8.570005:              State: 'Did 2 market trade at 1:1 price': (-8.570005)
 -8.620001:              State: 'Did 3 market trade at 1:1 price': (-8.620001)
```

Shortly after the AI pulled this combo, it pulled another combo where it grabbed ore, fuel, bought a polarity device, used the new polarity device to flip its 1 to a 6, terraformed the 6, and used the new colony to remove my control of Burroughs and make me lose my Artifact Ship again. So it can not only chain together techs that it currently owns, but also tech that it can buy in the future and plan out how it might use that to its advantage.


I know it's all nerdy and stuff, but it's what keeps me up 'till 5:00 in the morning working on the same project I've been tinkering at for a year -- it's just nice to see when it bears some more fruit.

Hopefully you found this post interesting, educational, and fun!


# Stupidity vs. Irrationality
In which the author is outsmarted by his computer... yet again.

So I thought that by limiting the amount of time that the AI had to "think", that I could adjust its difficulty pretty easily. I gave the Easy player 2.9 seconds to think about each move, the Medium player 4.4 seconds, and the Hard player 8.9 seconds.

Turns out, this had very little effect on how well the AI played. In tests, the "Easy" AI beat the "Hard" AI about 50% of the time -- there was no statistically significant difference between the end score of the two AIs.

I guess all of my earlier efforts to make the AI smart and efficient worked a bit too well.

When the AI "peeks into the future" to see all of its possible future game states, it evaluates each game state and gives it a number. For instance, if fuel is "worth" $0.40 and ore is worth $1, then the AI sees that it can gain 1 ore (worth $1) or 3 fuel (worth $1.20), so it picks the path that gives it the better value.

But further down the line, it sees that if it gets the ore, it will have enough to build a ship with its pair of dice. New ships might be worth $10 each, so it totally makes sense for the AI to drop through a temporary valley in order to reach a higher peak in the future.

In "algorithm speak", this is a hill climbing algorithm with limited lookahead.


So what I attempted to do at first was to adjust the amount of lookahead, so that the easy player would see the obvious moves, but not necessarily have enough lookahead to cross through the really deep valleys to get to the very cool extended combos (especially in the late game).


But in practice, the local maxima weren't isolated enough for this to have very much affect -- the hill-climbing algorithm still worked with enough efficiency to generally find its way to the global maxima.


## "Everybody in the house let's make some noise!"
So instead of making the computer dumb, what if instead we just made it irrational?

And the way we do that, is by introducing random noise. This was an idea (thanks, Urza!) that I had meant to implement earlier, but had simply forgotten about.

Now, when the computer evaluates the value of a particular choice, it adds a factor of plus or minus a random number. The "easy" AI might add plus or minus random($10), and the "medium" AI might add plus or minus random($5). This will still cause the AI to generally tend in the right direction (and not just flail randomly), but can cause it to still miss some of the more subtly good moves.

And in my testing, this has seemed to work out really well. The Pirate and Admiral AI levels are consistently winning against the Easy and Medium AI's, but they still all build ships and land colonies and use tech cards in a believable way.

The good news from this is that I'm pretty confident I can give the Hard player much less time to think about its moves and have a snappier game that's still just as challenging.
