/* @flow */
import { Map, Set } from 'immutable';
import type { TablesState, Action } from '../types';

export default function tables(
  state: TablesState = new Map(),
  action: Action,
): TablesState {
  switch (action.type) {
    case 'GOT_TABLE': {
      const { table, ratings } = action;
      return state.set(table, new Set(ratings)); }
    case 'SET_PLAYER': {
      const { rating } = action;
      return state.update(rating.table, ratings => (
        ratings ? ratings.add(rating) : new Set([rating]))); }
    default:
      return state;
  }
}
