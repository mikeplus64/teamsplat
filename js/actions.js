// @flow
import Fuse from '../node_modules/fuse.js/dist/fuse';
import api from './api';
import type {
  PlayerName,
  ThunkActionR, Rating, StartLoading,
  StopLoading, SearchFor, SelectMap,
  Team, SetPassword,
} from './types';
import findBestTeams from './teams';

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

type Either<A, B> = {| Left: A |} | {| Right: B |};

function either<A, B, C>(
  left: (l: A) => C,
  right: (r: B) => C,
): Either<A, B> => ?C {
  return (data) => {
    if (data.Left) {
      return left(data.Left);
    }
    if (data.Right) {
      return right(data.Right);
    }
    return null;
  };
}

export const setRating: (rating: Rating) => ThunkActionR<Promise<void>> =
  (rating: Rating) => (dispatch, getState) => new Promise((resolve, reject) => {
    const { table, who, map, elo } = rating;
    const password = getState().passwords.get(table);
    if (password != null && password.text && password.isSet) {
      api.postRateByPasswordByTableByPlayerByMapByEloByCaveat(
        password.text,
        table,
        who,
        map,
        elo,
        'nothing',
        either(reject, () => {
          dispatch({ type: 'SET_PLAYER', rating });
          resolve();
        }),
        reject,
      );
    } else {
      reject('no password given');
    }
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
  (table, players) => (dispatch, getState) => new Promise((resolve0, reject0) => {
    const password = getState().passwords.get(table);
    if (password != null && password.text && password.isSet) {
      Promise.all(players.map(player => new Promise((resolve, reject) =>
        api.postDeleteByPasswordByTableByPlayer(
          password.text,
          table,
          player,
          either(reject, () => {
            dispatch({ type: 'REMOVE_PLAYER_FROM_TEAMS', table, player });
            dispatch({ type: 'DELETED_PLAYERS', table, players });
            resolve();
          }),
          reject,
        )))).then(resolve0, reject0);
    }
    reject0('no password given');
  });

export function startLoading(table: string): StartLoading {
  return { type: 'START_LOADING', table };
}

export function stopLoading(table: string): StopLoading {
  return { type: 'STOP_LOADING', table };
}

export function searchFor(query: string): SearchFor {
  return { type: 'SEARCH_FOR', query };
}

export const setTablePassword: (table: string) => ThunkActionR<Promise<any>> =
  (table: string) => (dispatch, getState) => new Promise((resolve, reject) => {
    const password = getState().passwords.get(table);
    if (password != null) {
      const { text, isSet } = password;
      if (isSet === true) {
        reject('already set table password');
        return;
      }
      api.getSet_passwordByTableByPassword(
        table,
        text,
        (r) => {
          if (r === true) {
            dispatch({ type: 'SET_TABLE_PASSWORD', table });
            resolve();
          } else {
            reject('was unable to set a password');
          }
        },
        reject,
      );
    } else {
      reject('no password given');
    }
  });

export function setPassword(table: string, password: string): SetPassword {
  return { type: 'SET_PASSWORD', table, password };
}

export function selectMap(map: string): SelectMap {
  return { type: 'SELECT_MAP', map };
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
    fuse.list = Array.from(table.entries());
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


export const computeTeams: ThunkActionR<Promise<[?Team, ?Team]>> =
  (dispatch, getState) => new Promise((resolve, reject) => {
    const {
      players,
      editor: {
        name: tableName,
        table,
      },
      maps: {
        selected,
      },
    } = getState();
    if (selected != null) {
      const map: string = selected;
      const ratings: Rating[] = [];
      players.get(tableName).forEach((who) => {
        ratings.push({
          elo: table.getIn([who, map]) || 1600,
          who,
          map,
          table: tableName,
        });
      });
      const teams = findBestTeams(ratings, 'total');
      dispatch({ type: 'COMPUTED_TEAMS', teams });
      resolve(teams);
    }
    reject('No selection');
  });

