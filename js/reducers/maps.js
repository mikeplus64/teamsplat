/* @flow */
import { Record } from 'immutable';
import type { Action, MapsState } from '../types';

const defaultElo = 1600;

export default function maps(
  state: MapsState = { types: [], record: Record({}) },
  action: Action,
): MapsState {
  switch (action.type) {
    case 'GOT_MAPS': {
      const types: string[] = action.types;
      return {
        types,
        record: Record((() => {
          const r = {};
          for (let i = 0; i < types.length; i += 1) {
            r[types[i]] = defaultElo;
          }
          return r;
        })()),
      };
    }
    default: return state;
  }
}

