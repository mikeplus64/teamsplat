/* @flow */
import { Map } from 'immutable';
import type { Action, PasswordState } from '../types';

export default function maps(
  state: PasswordState = new Map(),
  action: Action,
): PasswordState {
  switch (action.type) {
    case 'SET_PASSWORD': return state.set(action.table, action.password);
    default: return state;
  }
}

