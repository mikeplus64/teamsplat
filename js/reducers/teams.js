/* @flow */
import type { TeamsState, Action } from '../types';

const s0 = { fresh: false, visible: false, teams: null };
export default function teams(
  state: TeamsState = s0,
  action: Action,
): TeamsState {
  switch (action.type) {
    case 'COMPUTED_TEAMS': return {
      fresh: true,
      visible: true,
      teams: action.teams,
    };

    case 'SET_PLAYER':
    case 'DELETED_PLAYERS':
    case 'VIEW_TABLE':
    case 'VIEW_PLAYERS':
      return s0;

    case 'ADD_PLAYER_TO_TEAMS':
    case 'REMOVE_PLAYER_FROM_TEAMS':
    case 'SELECT_MAP': return {
      fresh: false,
      visible: false,
      teams: state.teams,
    };

    default:
      return state;
  }
}
