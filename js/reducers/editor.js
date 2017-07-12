/* @flow */
import { Map } from 'immutable';
import Fuse from '../../node_modules/fuse.js/dist/fuse';
import type { EditorState, EditorTable, Action, Rating } from '../types';

const fuse = new Fuse([], {
  shouldSort: true,
  includeScore: false,
  threshold: 0.6,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [0],
});

function buildTable(ratings: Rating[]): EditorTable {
  return new Map().withMutations((mut) => {
    for (let i = 0; i < ratings.length; i += 1) {
      const { who, map, elo } = ratings[i];
      mut.setIn([who, map], elo);
    }
  });
}

export function runQuery(table: EditorTable, query: string): EditorTable {
  const nice = query.trim();
  if (nice === '') { return table; }
  const uglyTable = Array.from(table.entries());
  fuse.set(uglyTable);
  const r = new Map(fuse.search(nice));
  fuse.set([]);
  return r;
}

export default function editor(
  state: EditorState = {
    name: 'new',
    table: new Map(),
    loading: false,
    query: '',
    searchedTable: new Map(),
  },
  action: Action,
): EditorState {
  switch (action.type) {

    case 'START_LOADING': return {
      ...state,
      loading: true,
    };

    case 'STOP_LOADING': return {
      ...state,
      loading: false,
    };

    case 'VIEW_TABLE': {
      const m = new Map();
      return {
        ...state,
        name: action.table,
        table: m,
        searchedTable: m,
        query: '',
      };
    }

    case 'SET_PLAYER':
      if (state.name === action.rating.table) {
        const { who, map, elo } = action.rating;
        return {
          ...state,
          table: state.table.setIn([who, map], elo),
          searchedTable: state.searchedTable.updateIn([who, map], () => elo),
        };
      }
      return state;

    case 'DELETED_PLAYERS':
      if (state.name === action.table) {
        const { players } = action;
        return {
          ...state,
          table: state.table.withMutations(mut =>
            players.forEach(p => mut.remove(p))),
          searchedTable: state.searchedTable.withMutations(mut =>
            players.forEach(p => mut.remove(p))),
        };
      }
      return state;

    case 'GOT_TABLE':
      if (state.name === action.table) {
        const t = buildTable(action.ratings);
        return {
          ...state,
          table: t,
          searchedTable: t,
          query: '',
        };
      }
      return state;

    case 'SEARCH_FOR': return {
      ...state,
      query: action.query,
      searchedTable: runQuery(state.table, action.query),
    };

    default:
      return state;
  }
}
