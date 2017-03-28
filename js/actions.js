/* @flow */
import api from './api';
import type { ThunkActionR, Rating } from './types';

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
  (rating: Rating) => dispatch => new Promise((resolve, reject) => {
    const { table, who, map, elo } = rating;
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
      reject,
    );
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
