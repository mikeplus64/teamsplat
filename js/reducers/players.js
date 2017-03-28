/* @flow */
import { Set } from 'immutable';
import type { Action } from '../types';

export default function players(
  state: Set<string> = new Set(),
  action: Action,
): Set<string> {
  switch (action.type) {
    case 'ADD_PLAYER_TO_TEAMS': return state.add(action.player);
    case 'REMOVE_PLAYER_FROM_TEAMS': return state.remove(action.player);
    default: return state;
  }
}

