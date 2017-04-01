/* @flow */
import api from './api';
import type { ThunkActionR, Rating, StartLoading, StopLoading } from './types';

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


export function startLoading(table: string): StartLoading {
  return { type: 'START_LOADING', table };
}

export function stopLoading(table: string): StopLoading {
  return { type: 'STOP_LOADING', table };
}
