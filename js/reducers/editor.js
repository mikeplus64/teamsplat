/* @flow */
import { Map } from 'immutable';
import type { EditorState, EditorTable, Action, Rating } from '../types';

function buildTable(ratings: Rating[]): EditorTable {
  return new Map().withMutations((mut) => {
    for (let i = 0; i < ratings.length; i += 1) {
      const { who, map, elo } = ratings[i];
      mut.setIn([who, map], elo);
    }
  });
}

export default function editor(
  state: EditorState = {
    name: 'new',
    table: new Map(),
  },
  action: Action,
): EditorState {
  switch (action.type) {
    case 'VIEW_TABLE':
      return { name: action.table, table: new Map() };
    case 'SET_PLAYER':
      if (state.name === action.rating.table) {
        const { who, map, elo } = action.rating;
        return {
          name: state.name,
          table: state.table.setIn([who, map], elo),
        };
      }
      return state;
    case 'GOT_TABLE':
      if (state.name === action.table) {
        return {
          name: state.name,
          table: buildTable(action.ratings),
        };
      }
      return state;
    default:
      return state;
  }
}
