import assert from "node:assert/strict";
import test from "node:test";

import { exhaustiveStrategy, runTournament, seededRandom, simpleStrategy, simulateGame } from "../js/game/ai-simulation.js";

test("seeded random streams are reproducible", () => {
  const left = seededRandom(42);
  const right = seededRandom(42);
  assert.deepEqual(
    Array.from({ length: 20 }, () => left()),
    Array.from({ length: 20 }, () => right()),
  );
});

test("headless SimpleAI games terminate and replay deterministically", () => {
  const strategies = [
    simpleStrategy("simple-a"),
    simpleStrategy("simple-b"),
    simpleStrategy("simple-c"),
    simpleStrategy("simple-d"),
  ];
  const left = simulateGame({ strategies, seed: 100 });
  const right = simulateGame({ strategies, seed: 100 });

  assert.equal(left.steps, right.steps);
  assert.equal(left.turns, right.turns);
  assert.equal(left.winnerIndex, right.winnerIndex);
  assert.equal(left.completed, true);
  assert.deepEqual(
    left.players.map((player) => player.victoryPoints),
    right.players.map((player) => player.victoryPoints),
  );
  assert.ok(left.steps < 10_000);
});

test("tournaments rotate entrants through seats and aggregate search metrics", () => {
  const entrants = [
    simpleStrategy("simple"),
    exhaustiveStrategy("search-small", { maxNodes: 8, maxDepth: 2, beamWidth: 4 }),
    exhaustiveStrategy("search-wide", { maxNodes: 16, maxDepth: 3, beamWidth: 8 }),
    simpleStrategy("simple-copy"),
  ];
  const tournament = runTournament({ entrants, games: 4, seed: 500 });

  assert.equal(tournament.results.length, 4);
  assert.equal(tournament.standings.every((standing) => standing.games === 4), true);
  assert.equal(tournament.results.every((result) =>
    result.completed || result.termination === "max-steps"), true);
  assert.equal(
    tournament.standings.reduce((wins, standing) => wins + standing.wins, 0),
    tournament.results.filter((result) => result.completed).length,
  );
  assert.ok(tournament.standings.find((standing) => standing.strategy === "search-small")
    .searchedDecisions > 0);
  assert.ok(tournament.standings.find((standing) => standing.strategy === "search-wide")
    .averageNodesPerSearch > 0);
  assert.ok(tournament.standings.some((standing) => standing.didNotFinishRate >= 0));
});
