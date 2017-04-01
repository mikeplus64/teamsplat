/* @flow */
import { Map, Set } from 'immutable';
import type { Action } from '../types';

export default function players(
  state: Map<string, Set<string>> = new Map(),
  action: Action,
): Map<string, Set<string>> {
  switch (action.type) {
    case 'ADD_PLAYER_TO_TEAMS': {
      const { table, player } = action;
      if (state.has(table)) {
        return state.update(table, s => s.add(player));
      }
      return state.set(table, new Set([player]));
    }
    case 'REMOVE_PLAYER_FROM_TEAMS': {
      const { table, player } = action;
      return state.update(table, new Set(), s => s.remove(player));
    }
    default: return state;
  }
}

