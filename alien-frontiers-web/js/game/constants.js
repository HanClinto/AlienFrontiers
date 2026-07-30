export const AIType = Object.freeze({
  human: 0,
  easy: 1,
  medium: 2,
  hard: 3,
  pirate: 4,
  length: 5,
});

export const EventName = Object.freeze({
  resourcesChanged: "resources-changed",
  shipActivated: "ship-activated",
  shipDocked: "ship-docked",
  shipRolled: "ship-rolled",
  shipSelected: "ship-selected",
  shipsDocked: "ships-docked",
  shipsRolled: "ships-rolled",
  marketPriceChanged: "market-price-changed",
  coloniesChanged: "colonies-changed",
  launchColony: "launch-colony",
  techCardsChanged: "tech-cards-changed",
  cardTapped: "card-tapped",
  raidChanged: "raid-changed",
  beginRaid: "begin-raid",
  finishRaid: "finish-raid",
  nextPlayer: "next-player",
  nextTurn: "next-turn",
  stateChanged: "state-changed",
});