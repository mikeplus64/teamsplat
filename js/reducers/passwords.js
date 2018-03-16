/* @flow */
import { Map } from 'immutable';
import type { Action, PasswordState } from '../types';

export default function maps(
  state: PasswordState = new Map(),
  action: Action,
): PasswordState {
  switch (action.type) {
    case 'SET_PASSWORD': return state.set(action.table, {
      text: action.password,
      isSet: action.isSet,
    });

    case 'SET_TABLE_PASSWORD': return state.update(
      action.table,
      { text: '', isSet: true },
      ({ text }) => ({
        isSet: true,
        text,
      }));

    default:
      return state;
  }
}

