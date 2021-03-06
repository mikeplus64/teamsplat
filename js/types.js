/* @flow */
import type { Set, Map, Record } from 'immutable';

export type Rating = {|
  table: string,
  date?: string,
  map: string,
  who: string,
  elo: number,
  caveat?: string,
|};

export type Stats<T> = {|
  total: number,
  average: number,
  min: number,
  max: number,
  of: T[],
|};

export type Team = Stats<Rating>;

export type OldStyleTable = {|
  [name: string]: {|
    id: number,
    open: string,
    boomc: string,
    boomo: string,
    water: string,
    nomad: string,
  |},
|};

export type SetPlayer = {| type: 'SET_PLAYER', rating: Rating |};
export type ViewPlayers = {| type: 'VIEW_PLAYERS', page: number |};
export type ViewTable = {| type: 'VIEW_TABLE', table: string |};
export type GotTable = {| type: 'GOT_TABLE', table: string, ratings: Rating[] |};
export type GotMaps = {| type: 'GOT_MAPS', types: string[] |};
export type AddPlayerToTeams = {| type: 'ADD_PLAYER_TO_TEAMS', player: string, table: string |};
export type RemovePlayerFromTeams = {| type: 'REMOVE_PLAYER_FROM_TEAMS', player: string, table: string |};
export type DeletedPlayers = {| type: 'DELETED_PLAYERS', table: string, players: string[] |};
export type StartLoading = {| type: 'START_LOADING', table: string |};
export type StopLoading = {| type: 'STOP_LOADING', table: string |};
export type SearchFor = {| type: 'SEARCH_FOR', query: string |};
export type SetPassword = {| type: 'SET_PASSWORD', table: string, password: string, isSet: boolean |};
export type SetTablePassword = {| type: 'SET_TABLE_PASSWORD', table: string |};
export type DropSelection = {| type: 'DROP_SELECTION' |};
export type SelectMap = {| type: 'SELECT_MAP', map: string |};
export type ComputedTeams = {| type: 'COMPUTED_TEAMS', teams: [?Team, ?Team] |};

export type Action
  = SetPlayer
  | ViewTable
  | GotTable
  | GotMaps
  | AddPlayerToTeams
  | RemovePlayerFromTeams
  | DeletedPlayers
  | StartLoading
  | StopLoading
  | SearchFor
  | SetPassword
  | SetTablePassword
  | DropSelection
  | SearchFor
  | SelectMap
  | ComputedTeams
  ;

export type PlayerName = string;
export type MapType = string;
export type EditorTable = Map<PlayerName, Map<MapType, number>>;

export type PlayersState = Map<string, Set<string>>;

export type TablesState = Map<string, Set<Rating>>;

export type EditorState = {
  name: string,
  table: EditorTable,
  loading: boolean,
  query: string,
  searchedTable: EditorTable,
};

export type PasswordState = Map<string, {
  text: string,
  isSet: boolean,
}>;

export type MapsState = {|
  types: string[],
  record: Record<{ [map: string]: number }>,
  selected: ?string,
|};

export type TeamsState = {
  visible: boolean,
  fresh: boolean,
  teams: ?[?Team, ?Team],
}

export type State = {|
  players: PlayersState,
  tables: TablesState,
  editor: EditorState,
  maps: { types: string[], record: Record<{ [map: string]: number }> },
  passwords: PasswordState,
  maps: MapsState,
  teams: TeamsState,
|};

export type Reducer = (state: State, action: Action) => State;

type IDispatch<Thunk> = (action: Action | Thunk) => any;
export type ThunkAction = (
  dispatch: IDispatch<ThunkAction>,
  getState: () => State,
) => any;

type IDispatchR<Thunk, R> = (action: Action) => any | (action: Thunk) => R;
export type ThunkActionR<R> = <I> (
  dispatch: IDispatchR<ThunkActionR<I>, I>,
  getState: () => State,
) => R;

export type DispatchR<R> = IDispatchR<ThunkActionR<R>, R>;
export type DispatchD = <R> (action: ThunkActionR<R>) => R | (action: Action) => any;
export type Dispatch = IDispatch<ThunkAction>;
