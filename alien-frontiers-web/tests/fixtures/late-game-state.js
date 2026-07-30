import { AIType } from "../../js/game/constants.js";
import { GameState } from "../../js/game/game-state.js";
import { TechCardType } from "../../js/game/tech-card.js";

const CURRENT_TECH_TYPES = [
  TechCardType.boosterPod,
  TechCardType.stasisBeam,
  TechCardType.gravityManipulator,
  TechCardType.polarityDevice,
  TechCardType.dataCrystal,
  TechCardType.orbitalTeleporter,
  TechCardType.plasmaCannon,
];

export function createLateGameStressState(aiType = AIType.hard) {
  const state = new GameState(
    4,
    [aiType, AIType.human, AIType.medium, AIType.pirate],
    () => 0.5,
    () => 0.5,
  );
  for (const card of state.allTech) {
    card.owner = null;
    card.tapped = false;
  }
  for (const player of state.players) {
    player.cards = [];
    player.selectedCard = null;
    while (player.activeNativeShips.length < 6) {
      player.activateShip();
    }
    player.gatherShips();
    player.initialRollDone = true;
    player.fuel = 8;
    player.ore = 8;
    player.coloniesLeft = player.playerIndex < 2 ? 1 : 2;
  }

  const currentPlayer = state.currentPlayer;
  [6, 5, 5, 4, 3, 2].forEach((value, index) => {
    currentPlayer.activeShips[index].value = value;
  });
  currentPlayer.activeShips[1].teleportRestriction = state.solarConverter;

  for (const type of CURRENT_TECH_TYPES) {
    const card = state.allTech.find((candidate) => candidate.type === type && !candidate.owner);
    currentPlayer.addCard(card);
  }

  const raidTypes = [
    TechCardType.alienCity,
    TechCardType.alienMonument,
    TechCardType.resourceCache,
    TechCardType.holographicDecoy,
  ];
  raidTypes.forEach((type, index) => {
    const card = state.allTech.find((candidate) => candidate.type === type && !candidate.owner);
    state.players[(index % 3) + 1].addCard(card);
  });

  const [opponentOne, opponentTwo, opponentThree] = state.players.slice(1);
  state.solarConverter.dockShip(opponentOne.activeShips[0]);
  state.solarConverter.dockShip(opponentOne.activeShips[1]);
  state.lunarMine.dockShip(opponentTwo.activeShips[0]);
  state.shipyard.dockGroups[0].dockShips(opponentTwo.activeShips.slice(1, 3));
  state.orbitalMarket.dockGroups[0].dockShips(opponentThree.activeShips.slice(0, 2));
  state.raidersOutpost.dockGroups[0].dockShips(opponentThree.activeShips.slice(2, 5));

  state.regions.forEach((region, regionIndex) => {
    region.colonyCounts = [
      regionIndex % 3,
      1 + ((regionIndex + 1) % 3),
      (regionIndex + 2) % 3,
      regionIndex % 2,
    ];
  });
  state.heinleinPlains.hasPositronField = true;
  state.vanVogtMountains.hasRepulsorField = true;
  state.herbertValley.hasIsolationField = true;
  state.colonistHub.colonyPositions = [6, 5, 4, 3];
  state.numTurns = 18;
  state.gameLog = Array.from({ length: 80 }, (_, index) => `Late-game event ${index}`);
  return state;
}
