/* @flow */
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { createLogger } from 'redux-logger';
import type { Store } from 'redux';
import thunk from 'redux-thunk';
import { autoRehydrate, persistStore } from 'redux-persist';
import immutableTransform from 'redux-persist-transform-immutable'
import type { Reducer } from './types';
import editor from './reducers/editor';
import maps from './reducers/maps';
import tables from './reducers/tables';
import players from './reducers/players';

export default function connect<T>(resolve: (store: Store) => T): T {
  const logger = createLogger();
  const reducer: { [name: string]: Reducer } = combineReducers({
    editor,
    maps,
    tables,
    players,
  });
  const store = createStore(reducer, compose(
    applyMiddleware(thunk),
    autoRehydrate(),
    applyMiddleware(logger),
  ));
  persistStore(store, {
    whitelist: ['players'],
    transforms: [immutableTransform({
      whitelist: ['players'],
    })],
  });
  return resolve(store);
}

