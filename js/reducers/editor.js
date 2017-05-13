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
    loading: false,
  },
  action: Action,
): EditorState {
  switch (action.type) {
    case 'START_LOADING': return {
      name: state.name,
      table: state.table,
      loading: true,
    };
    case 'STOP_LOADING': return {
      name: state.name,
      table: state.table,
      loading: false,
    };
    case 'VIEW_TABLE': return {
      loading: state.loading,
      name: action.table,
      table: new Map(),
    };
    case 'SET_PLAYER':
      if (state.name === action.rating.table) {
        const { who, map, elo } = action.rating;
        return {
          loading: state.loading,
          name: state.name,
          table: state.table.setIn([who, map], elo),
        };
      }
      return state;
    case 'DELETED_PLAYERS':
      if (state.name === action.table) {
        const { players } = action;
        return {
          loading: state.loading,
          name: state.name,
          table: state.table.withMutations(mut =>
            players.forEach(p => mut.remove(p))),
        };
      }
      return state;
    case 'GOT_TABLE':
      if (state.name === action.table) {
        return {
          loading: state.loading,
          name: state.name,
          table: buildTable(action.ratings),
        };
      }
      return state;
    default:
      return state;
  }
}
