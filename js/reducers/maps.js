/* @flow */
import { Record } from 'immutable';
import type { Action, MapsState } from '../types';

const defaultElo = 1600;

export default function maps(
  state: MapsState = {
    types: [],
    record: Record({}),
    selected: null,
  },
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
        selected: (state.selected && types.indexOf(state.selected) !== -1) ?
          state.selected :
          null,
      };
    }

    case 'SELECT_MAP': return {
      types: state.types,
      record: state.record,
      selected: action.map,
    };

    default: return state;
  }
}

