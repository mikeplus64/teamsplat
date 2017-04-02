/* @flow */
import { combination } from 'js-combinatorics';
import { Set } from 'immutable';
import type { Stats, Rating } from './types';

type Team = Stats<Rating>;

const makeStats: (ratings: Rating[]) => Team = (ratings: Rating[]) => {
  let total: number = 0;
  let min: number = 3000;
  let max: number = 0;
  for (let i = 0; i < ratings.length; i += 1) {
    const rating: Rating = ratings[i];
    const elo: number = rating.elo;
    total += elo;
    if (elo < min) { min = elo; }
    if (elo > max) { max = elo; }
  }
  return {
    total,
    average: total / ratings.length,
    min,
    max,
    of: ratings,
  };
};

function runGen(combos: { next(): Rating[] }): Team[] {
  const r = [];
  let t: ?Rating[] = combos.next();
  while (t) {
    r.push(makeStats(t));
    t = combos.next();
  }
  return r;
}

function teamCombos(ratings: Rating[]): [Team[], Team[]] {
  const size: number = Math.floor(ratings.length / 2);
  const t1: Rating[][] = runGen(combination(ratings, size));
  if (ratings.length % 2 === 1) {
    const t2: Rating[][] = runGen(combination(ratings, size + 1));
    console.log('teamCombos', size, size + 1);
    return [t1, t2];
  }
  return [t1, t1];
}

function players(ratings: Rating[]): string[] {
  return ratings.map(({ who }) => who);
}

// returns false if same player appears
// in both teams, true otherwise
// also, in the case where we don't have
// an even number of players, checks to
// make sure that the size of t1 != size of t2
function validTeams(t1: string[], t2: string[]): boolean {
  // check that p1 doesn't include
  // any players from p2
  const s1 = new Set(t1);
  const s2 = new Set(t2);
  return s2.intersect(s1).size === 0;
}

export function chooseRatings(
  ratings: Rating[],
  who: Set<string>,
  map: string,
): Rating[] {
  return ratings.filter(r => r.map === map && who.has(r.who));
}

export default function findBestTeams(
  ratings: Rating[],
  method: 'average' | 'total',
): [?Team, ?Team] {
  if (ratings.length <= 1) {
    return [null, null];
  }
  const [teamsC1, teamsC2]: [Team[], Team[]] = teamCombos(ratings);
  let bestT1: ?Team = null;
  let bestT2: ?Team = null;
  let leastDiff = Number.MAX_SAFE_INTEGER;
  console.log('combos', teamsC1, teamsC2);
  for (let i = 0; i < teamsC1.length; i += 1) {
    const t1: Team = teamsC1[i];
    const t1players: string[] = players(t1.of);
    for (let j = 0; j < teamsC2.length; j += 1) {
      const t2: Team = teamsC2[j];
      const t2players: string[] = players(t2.of);
      if (validTeams(t1players, t2players)) {
        const diff = Math.abs(t2[method] - t1[method]);
        if (diff < leastDiff) {
          leastDiff = diff;
          bestT1 = t1;
          bestT2 = t2;
        }
      }
    }
  }
  console.log('best', bestT1, bestT2);
  return [bestT1, bestT2];
}

export function makeSeries({ of }: Team): {
  label: string,
  value: number,
  colorIndex: string,
}[] {
  const s = [];
  for (let i = 0; i < of.length; i += 1) {
    const { who, elo } = of[i];
    s.push({
      label: who,
      value: elo,
      colorIndex: `graph-${i + 1}`,
    });
  }
  return s;
}
