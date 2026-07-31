import assert from "node:assert/strict";
import test from "node:test";

import { generationStrategies } from "../js/game/ai-generations.js";
import { runBalancedTournament, simpleStrategy, summarizeTournamentResults } from "../js/game/ai-simulation.js";
import { estimatedGamesForMargin, pairedBootstrapDifference, strategyBlockWinRates, wilsonInterval } from "../js/game/ai-statistics.js";

test("Wilson intervals and sample estimates match standard approximations", () => {
  const interval = wilsonInterval(50, 100);
  assert.ok(Math.abs(interval.low - 0.4038) < 0.001);
  assert.ok(Math.abs(interval.high - 0.5962) < 0.001);
  assert.equal(estimatedGamesForMargin(0.1), 97);
  assert.equal(estimatedGamesForMargin(0.05), 385);
  assert.equal(estimatedGamesForMargin(0.03), 1068);
  assert.equal(estimatedGamesForMargin(0.02), 2401);
});

test("paired bootstrap reports deterministic positive differences", () => {
  const comparison = pairedBootstrapDifference(
    [1, 1, 1, 0, 1, 1, 0, 1],
    [0, 0, 1, 0, 0, 1, 0, 0],
    { seed: 42, iterations: 1_000 },
  );
  assert.equal(comparison.estimate, 0.5);
  assert.ok(comparison.low > 0);
  assert.ok(comparison.probabilityGreaterThanZero > 0.99);
});

test("named generations and tournament prefix summaries remain reproducible", () => {
  const entrants = generationStrategies([
    "pioneer",
    "surveyor-25",
    "surveyor-100",
    "surveyor-400",
  ]);
  assert.deepEqual(entrants.map((entrant) => entrant.name), [
    "Pioneer",
    "Surveyor-25",
    "Surveyor-100",
    "Surveyor-400",
  ]);
  const results = Array.from({ length: 4 }, (_, gameIndex) => ({
    seed: 700 + gameIndex,
    completed: true,
    winnerIndex: gameIndex % 4,
    players: entrants.map((entrant, playerIndex) => ({
      playerIndex,
      strategy: entrant.name,
      won: playerIndex === gameIndex % 4,
      score: playerIndex,
      victoryPoints: playerIndex,
      cards: 0,
      ore: 0,
      fuel: 0,
      decisions: 1,
      searchedDecisions: playerIndex === 0 ? 0 : 1,
      fallbackDecisions: 0,
      nodes: playerIndex * 10,
      elapsedMs: playerIndex,
    })),
  }));
  const left = summarizeTournamentResults(
    results,
    entrants,
    { playersPerGame: 4, seed: 700 },
  );
  const right = summarizeTournamentResults(results, entrants, { playersPerGame: 4, seed: 700 });

  assert.deepEqual(
    left.standings.map(({ strategy, wins, didNotFinish }) => ({ strategy, wins, didNotFinish })),
    right.standings.map(({ strategy, wins, didNotFinish }) => ({ strategy, wins, didNotFinish })),
  );
});

test("balanced tournaments rotate every seed through every seat", () => {
  const entrants = ["A", "B", "C", "D"].map((name) => simpleStrategy(name));
  const tournament = runBalancedTournament({ entrants, blocks: 2, seed: 800 });

  assert.equal(tournament.results.length, 8);
  for (let block = 0; block < 2; block += 1) {
    const games = tournament.results.filter((game) => game.block === block);
    assert.equal(new Set(games.map((game) => game.seed)).size, 1);
    for (const entrant of entrants) {
      const seats = games.map((game) =>
        game.players.find((player) => player.strategy === entrant.name).playerIndex);
      assert.deepEqual([...seats].sort(), [0, 1, 2, 3]);
    }
  }
  const outcomes = strategyBlockWinRates(tournament.results, entrants.map((entrant) => entrant.name));
  assert.equal(Object.values(outcomes).every((values) => values.length === 2), true);
});
