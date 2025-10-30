# Given we are rolling two dice (1-6), and each die can (optionally) be added or subtracted, what is the total arrangement of possible outcomes?

import sys

# Roll two dice (1-6)
d6 = [1, 2, 3, 4, 5, 6]

possibilites = []

for d1 in d6:
    possibilites.append(d1)
    for d2 in d6:
        possibilites.append(d1 + d2)
        possibilites.append(abs(d1 - d2))

# print out how many of each possible outcomes there are

print("There are {} possible outcomes".format(len(possibilites)))

for i in sorted(list(set(possibilites))):
    print("{0} = {1}".format(i, possibilites.count(i)))

# Produces:
"""
There are 78 possible outcomes
0 = 6
1 = 11
2 = 10
3 = 9
4 = 8
5 = 7
6 = 6
7 = 6
8 = 5
9 = 4
10 = 3
11 = 2
12 = 1
"""
