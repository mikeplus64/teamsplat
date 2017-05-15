/* @flow */
import { Map } from 'immutable';
import Fuse from '../node_modules/fuse.js/dist/fuse';
import api from './api';
import type {
  EditorTable, PlayerName, MapType,
  ThunkActionR, Rating, StartLoading,
  StopLoading, SearchFor,
} from './types';

export const getMaps: ThunkActionR<Promise<string[]>> = (dispatch, getState) => {
  const { maps } = getState();
  return new Promise((resolve, reject) => {
    if (maps.types.length === 0) {
      api.getMaps((types) => {
        dispatch({ type: 'GOT_MAPS', types });
        resolve(types);
      }, reject);
    }
    return resolve(maps.types);
  });
};

export const getTable: (table: string) => ThunkActionR<Promise<Rating[]>> =
  (table: string) => dispatch => new Promise((resolve, reject) => {
    api.getTableByTable(table, (ratings: Rating[]) => {
      dispatch({ type: 'GOT_TABLE', table, ratings });
      resolve(ratings);
    }, reject);
  });

export const setRating: (rating: Rating) => ThunkActionR<Promise<void>> =
  (rating: Rating) => dispatch => new Promise((resolve) => {
    const { table, who, map, elo } = rating;
    function send(tryNo: number) {
      if (tryNo > 0) {
        console.warn('retry setRating', tryNo, table, who, map, elo);
      }
      api.postRateByTableByPlayerByMapByEloByCaveat(
        table,
        who,
        map,
        elo,
        'nothing',
        () => {
          dispatch({ type: 'SET_PLAYER', rating });
          resolve();
        },
        () => send(tryNo + 1),
      );
    }
    send(0);
  });

export const getTables: (page: number) => ThunkActionR<Promise<string[]>> =
  page => () => new Promise((resolve, reject) => {
    api.getTablesByPage(page, resolve, reject);
  });


export const viewTable: (table: string) => ThunkActionR<Promise<Rating[]>> =
  table => (dispatch, getState) =>
    getTable(table)(dispatch, getState).then((ratings) => {
      dispatch({ type: 'VIEW_TABLE', table });
      dispatch({ type: 'GOT_TABLE', table, ratings });
      return ratings;
    });

export const deletePlayers: (table: string, players: string[]) => ThunkActionR<Promise<any>> =
  (table, players) => dispatch =>
    Promise.all(players.map(function hack(player, tryNo = 0) {
      if (tryNo > 10) {
        return Promise.reject();
      }
      return (
        new Promise((resolve, reject) =>
          api.postDeleteByTableByPlayer(table, player, resolve, reject))
        .then(() => {
          dispatch({ type: 'REMOVE_PLAYER_FROM_TEAMS', table, player });
          dispatch({ type: 'DELETED_PLAYERS', table, players });
        }, () => hack(player, tryNo + 1))
      );
    }));

export function startLoading(table: string): StartLoading {
  return { type: 'START_LOADING', table };
}

export function stopLoading(table: string): StopLoading {
  return { type: 'STOP_LOADING', table };
}

export function searchFor(query: string): SearchFor {
  return { type: 'SEARCH_FOR', query };
}

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

const splitter = /[ ,]+/;
export const selectNames: (table: string, names: string) => ThunkActionR<void> =
  (tableName, quicknames) => (dispatch, getState) => {
    dispatch({ type: 'DROP_SELECTION' });
    const names: string[] = quicknames.trim().split(splitter);
    if (names.length === 0) { return; }

    const { table } = getState().editor;

    fuse.set(Array.from(table.entries()));
    function bestMatch(query: string): ?PlayerName {
      const nice = query.trim();
      if (nice === '') { return null; }
      const r = fuse.search(nice);
      if (r.length > 0) {
        const name = r[0][0];
        return name;
      }
      return null;
    }

    names.forEach((name) => {
      const player: ?string = bestMatch(name);
      if (player != null) {
        dispatch({ type: 'ADD_PLAYER_TO_TEAMS', table: tableName, player });
      }
    });
  };
