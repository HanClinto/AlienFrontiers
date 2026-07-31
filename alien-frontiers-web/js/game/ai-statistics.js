import { seededRandom } from "./ai-simulation.js";

export function wilsonInterval(successes, trials, z = 1.959963984540054) {
  if (trials <= 0) {
    return { low: 0, high: 1, margin: 0.5 };
  }
  const probability = successes / trials;
  const zSquared = z * z;
  const denominator = 1 + zSquared / trials;
  const center = (probability + zSquared / (2 * trials)) / denominator;
  const margin = z * Math.sqrt(
    probability * (1 - probability) / trials + zSquared / (4 * trials * trials),
  ) / denominator;
  return { low: center - margin, high: center + margin, margin };
}

export function estimatedGamesForMargin(margin, probability = 0.5, z = 1.959963984540054) {
  if (margin <= 0 || margin >= 1) {
    throw new RangeError("margin must be between zero and one");
  }
  return Math.ceil(z * z * probability * (1 - probability) / (margin * margin));
}

export function pairedBootstrapDifference(left, right, options = {}) {
  if (left.length !== right.length || left.length === 0) {
    throw new RangeError("paired samples must have the same nonzero length");
  }
  const iterations = options.iterations ?? 5_000;
  const random = seededRandom(options.seed ?? 1);
  const differences = [];
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let total = 0;
    for (let sample = 0; sample < left.length; sample += 1) {
      const index = Math.floor(random() * left.length);
      total += left[index] - right[index];
    }
    differences.push(total / left.length);
  }
  differences.sort((a, b) => a - b);
  const quantile = (probability) => differences[Math.min(
    differences.length - 1,
    Math.floor(probability * differences.length),
  )];
  const estimate = left.reduce((total, value, index) => total + value - right[index], 0)
    / left.length;
  return {
    estimate,
    low: quantile(0.025),
    high: quantile(0.975),
    probabilityGreaterThanZero: differences.filter((value) => value > 0).length / differences.length,
    iterations,
  };
}

export function addConfidenceIntervals(tournament) {
  return {
    ...tournament,
    standings: tournament.standings.map((standing) => ({
      ...standing,
      winRate95: wilsonInterval(standing.wins, standing.games),
      didNotFinishRate95: wilsonInterval(standing.didNotFinish, standing.games),
    })),
  };
}

export function strategyBlockWinRates(results, strategyNames) {
  const blocks = new Map();
  for (const game of results) {
    if (game.block === undefined) {
      throw new Error("Balanced tournament result is missing its block index");
    }
    if (!blocks.has(game.block)) {
      blocks.set(game.block, Object.fromEntries(strategyNames.map((name) => [name, {
        wins: 0,
        games: 0,
      }])));
    }
    const block = blocks.get(game.block);
    for (const player of game.players) {
      block[player.strategy].games += 1;
      block[player.strategy].wins += player.won ? 1 : 0;
    }
  }
  return Object.fromEntries(strategyNames.map((name) => [
    name,
    [...blocks.values()].map((block) => block[name].wins / block[name].games),
  ]));
}
